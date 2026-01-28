
// Community Feed Logic
const CommunityFeed = (() => {
    let posts = [];
    let unsubscribe = null;
    let currentFilter = 'hot';
    const STORAGE_KEY = 'sixers_hoops_posts';
    const COLLECTION_NAME = 'community_posts';

    // No default posts - we want real data
    const defaultPosts = [];

    let isInitialized = false;

    function init() {
        if (isInitialized) return;
        
        if (window.db) {
            isInitialized = true;
            setupAuthListener();
            setupEventListeners();
            setFilter('hot'); 
        } else {
            // Try again soon
            setTimeout(init, 200);
        }
    }

    function setFilter(filter) {
        currentFilter = filter;
        updateFilterUI();
        listenToPosts();
    }

    function updateFilterUI() {
        const filters = ['hot', 'new', 'top'];
        filters.forEach(f => {
            const btn = document.getElementById(`filter-${f}`);
            if (btn) {
                if (f === currentFilter) {
                    btn.classList.add('bg-blue-50', 'text-blue-600', 'font-bold');
                    btn.classList.remove('hover:bg-slate-50', 'text-slate-600', 'font-medium');
                } else {
                    btn.classList.remove('bg-blue-50', 'text-blue-600', 'font-bold');
                    btn.classList.add('hover:bg-slate-50', 'text-slate-600', 'font-medium');
                }
            }
        });
    }

    function listenToPosts() {
        if (unsubscribe) unsubscribe();

        let query = window.db.collection(COLLECTION_NAME);

        // 'new' sorts strictly by date
        if (currentFilter === 'new') {
            query = query.orderBy('createdAt', 'desc');
        } 
        // 'top' sorts strictly by highest votes
        else if (currentFilter === 'top') {
            query = query.orderBy('votes', 'desc');
        }
        // 'hot' attempts to show high-vote recent posts first
        // Note: This requires a composite index in Firestore: votes (desc), createdAt (desc)
        else {
            query = query.orderBy('votes', 'desc').orderBy('createdAt', 'desc');
        }

        unsubscribe = query.limit(50).onSnapshot((snapshot) => {
            posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                time: formatTimeAgo(doc.data().createdAt)
            }));
            
            renderFeed();

            const modal = document.getElementById('post-modal-overlay');
            if (modal && modal.classList.contains('active')) {
                const currentPostId = modal.dataset.currentPostId;
                if (currentPostId) {
                    openDetailedView(currentPostId, true);
                }
            }
        }, (error) => {
            console.error("Firestore Error:", error);
            
            // Handle index error automatically for the user
            if (error.message.includes('index')) {
                console.warn("Composite index missing for 'Hot' filter. Falling back to simple vote sort.");
                // Fallback to avoid breaking the feed if the index isn't created yet
                currentFilter = 'top'; 
                listenToPosts();
            }
        });
    }

    function setupAuthListener() {
        if (window.auth) {
            window.auth.onAuthStateChanged(user => {
                updateCreatePostUI(user);
            });
        }
    }

    function updateCreatePostUI(user) {
        const avatarContainer = document.getElementById('create-post-avatar-container');
        const triggerInput = document.getElementById('create-post-trigger');
        
        if (!avatarContainer || !triggerInput) return;

        if (user) {
            const displayName = user.displayName || user.email.split('@')[0];
            const photoURL = user.photoURL;
            
            if (photoURL) {
                avatarContainer.innerHTML = `<img src="${photoURL}" class="h-full w-full object-cover" alt="${displayName}">`;
            } else {
                const initial = displayName.charAt(0).toUpperCase();
                avatarContainer.innerHTML = `<div class="h-full w-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">${initial}</div>`;
            }
            triggerInput.placeholder = `What's on your mind, ${displayName}?`;
        } else {
            avatarContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400" id="create-post-default-avatar"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
            triggerInput.placeholder = "What's on your mind?";
        }
    }

    function formatTimeAgo(timestamp) {
        if (!timestamp) return 'Just now';
        
        // If it's already a relative time string (from defaultPosts)
        if (typeof timestamp === 'string' && timestamp.includes('ago')) {
            return timestamp;
        }

        let date;
        try {
            date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            if (isNaN(date.getTime())) return 'Just now';
        } catch (e) {
            return 'Just now';
        }

        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return "just now";
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    }

    function extractTwitterId(text) {
        if (!text) return null;
        const twitterRegex = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:\w+)\/status\/(\d+)/;
        const match = text.match(twitterRegex);
        return match ? match[1] : null;
    }

    function loadPosts() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                posts = JSON.parse(stored);
            } catch (e) {
                posts = [...defaultPosts];
            }
        } else {
            posts = [...defaultPosts];
        }
    }

    function savePosts() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    }

    function renderFeed() {
        const container = document.getElementById('feed-container');
        if (!container) return;

        if (posts.length === 0) {
            container.innerHTML = `
                <div class="bg-white rounded-xl p-12 text-center border border-slate-200">
                    <div class="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 mb-2">No posts yet</h3>
                    <p class="text-slate-500">Be the first to start a conversation in the community!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        posts.forEach(post => {
            const postEl = createPostElement(post);
            container.appendChild(postEl);
        });

        // Load Twitter widgets if any were added
        if (window.twttr && window.twttr.widgets) {
            window.twttr.widgets.load();
        }
    }

    function createPostElement(post) {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex cursor-pointer hover:border-blue-300 transition-all duration-200 hover:shadow-md';
        div.dataset.id = post.id;
        
        const user = window.auth ? window.auth.currentUser : null;
        const userVote = (user && post.voters) ? post.voters[user.uid] : post.voted;
        const isUpvoted = userVote === 'up';
        const isDownvoted = userVote === 'down';
        const isAuthor = user && post.authorId === user.uid;

        const twitterId = extractTwitterId(post.content);

        div.innerHTML = `
            <!-- Vote Sidebar -->
            <div class="w-12 bg-slate-50/50 p-2 flex flex-col items-center gap-1 border-r border-slate-100">
                <button class="p-1 hover:bg-slate-200 rounded transition-colors vote-up ${isUpvoted ? 'text-orange-600' : 'text-slate-400'}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${isUpvoted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                </button>
                <span class="text-xs font-bold ${isUpvoted ? 'text-orange-600' : isDownvoted ? 'text-blue-600' : 'text-slate-900'}">${formatVotes(post.votes)}</span>
                <button class="p-1 hover:bg-slate-200 rounded transition-colors vote-down ${isDownvoted ? 'text-blue-600' : 'text-slate-400'}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${isDownvoted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>
            </div>
            <!-- Content -->
            <div class="flex-1 p-4">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                        <span class="font-bold text-slate-900">${post.author}</span>
                        <span>•</span>
                        <span>${post.time}</span>
                        <span class="${post.tagClass} px-2 py-0.5 rounded-full font-bold">${post.tag}</span>
                    </div>
                    ${isAuthor ? `
                        <button class="delete-post-btn p-1 text-red-500 hover:text-red-700 transition-colors" title="Delete Post">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    ` : ''}
                </div>
                <h3 class="text-lg font-bold text-slate-900 mb-3 leading-tight">${post.title}</h3>
                ${post.content ? `<div class="bg-slate-50 rounded-lg p-4 mb-3 border border-slate-100"><p class="text-sm text-slate-600 line-clamp-3">${post.content}</p></div>` : ''}
                ${twitterId ? `<div class="mb-4 twitter-embed-container" data-twitter-id="${twitterId}"><blockquote class="twitter-tweet"><a href="https://twitter.com/i/status/${twitterId}"></a></blockquote></div>` : ''}
                ${post.imageUrl ? `<div class="mb-4 rounded-xl overflow-hidden border border-slate-100 bg-slate-50"><img src="${post.imageUrl}" class="w-full h-auto max-h-96 object-cover block"></div>` : ''}
                <div class="flex gap-4">
                    <button class="flex items-center gap-2 text-slate-500 hover:bg-slate-50 px-2 py-1 rounded transition-colors text-sm comment-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        ${(post.comments || []).length} Comments
                    </button>
                    <button class="flex items-center gap-2 text-slate-500 hover:bg-slate-50 px-2 py-1 rounded transition-colors text-sm share-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                        Share
                    </button>
                </div>
            </div>
        `;

        // Click on the post (but not on vote buttons) opens detailed view
        div.addEventListener('click', (e) => {
            if (e.target.closest('.vote-up')) {
                handleVote(post.id, 'up');
            } else if (e.target.closest('.vote-down')) {
                handleVote(post.id, 'down');
            } else if (e.target.closest('.delete-post-btn')) {
                e.stopPropagation();
                handleDeletePost(post.id);
            } else {
                openDetailedView(post.id);
            }
        });

        return div;
    }

    async function handleDeletePost(postId) {
        const confirmModal = document.getElementById('confirm-modal-overlay');
        const submitBtn = document.getElementById('confirm-modal-submit');
        const cancelBtn = document.getElementById('confirm-modal-cancel');

        if (!confirmModal || !submitBtn || !cancelBtn) return;

        confirmModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Clean up previous listeners
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
        
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        newCancelBtn.onclick = () => {
            confirmModal.classList.remove('active');
            document.body.style.overflow = '';
        };

        newSubmitBtn.onclick = async () => {
            confirmModal.classList.remove('active');
            document.body.style.overflow = '';

            if (window.db) {
                try {
                    await window.db.collection(COLLECTION_NAME).doc(postId).delete();
                    closeModal();
                } catch (error) {
                    console.error("Error deleting post:", error);
                    showAlert("Error deleting post: " + error.message, "Error");
                }
            } else {
                const index = posts.findIndex(p => p.id === postId);
                if (index !== -1) {
                    posts.splice(index, 1);
                    savePosts();
                    renderFeed();
                    closeModal();
                }
            }
        };
    }

    function formatVotes(votes) {
        if (Math.abs(votes) >= 1000) return (votes / 1000).toFixed(1) + 'k';
        return votes;
    }

    function setupEventListeners() {
        const createTrigger = document.getElementById('create-post-trigger');
        const createBtn = document.getElementById('create-post-btn');
        
        // Filter button listeners
        const filterHot = document.getElementById('filter-hot');
        const filterNew = document.getElementById('filter-new');
        const filterTop = document.getElementById('filter-top');

        if (filterHot) filterHot.addEventListener('click', () => setFilter('hot'));
        if (filterNew) filterNew.addEventListener('click', () => setFilter('new'));
        if (filterTop) filterTop.addEventListener('click', () => setFilter('top'));

        const openModal = () => {
            const user = window.auth ? window.auth.currentUser : null;
            if (!user) {
                triggerLogin();
            } else {
                openCreatePostModal();
            }
        };

        if (createTrigger) createTrigger.addEventListener('click', openModal);
        if (createBtn) createBtn.addEventListener('click', openModal);

        const closeBtn = document.getElementById('post-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        const createCloseBtn = document.getElementById('create-post-modal-close');
        if (createCloseBtn) {
            createCloseBtn.addEventListener('click', closeCreateModal);
        }

        const cancelPostBtn = document.getElementById('cancel-post-btn');
        if (cancelPostBtn) {
            cancelPostBtn.addEventListener('click', closeCreateModal);
        }

        const submitPostBtn = document.getElementById('submit-post-btn');
        if (submitPostBtn) {
            submitPostBtn.addEventListener('click', handleCreatePost);
        }

        const imageInput = document.getElementById('post-image-input');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const filenameSpan = document.getElementById('image-filename');
                const removeBtn = document.getElementById('remove-image-btn');
                const previewContainer = document.getElementById('image-preview-container');
                const previewImg = document.getElementById('image-preview');

                if (file) {
                    filenameSpan.innerText = file.name;
                    removeBtn.classList.remove('hidden');
                    
                    const reader = new FileReader();
                    reader.onload = (re) => {
                        previewImg.src = re.target.result;
                        previewContainer.classList.remove('hidden');
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        const removeImageBtn = document.getElementById('remove-image-btn');
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', () => {
                const imageInput = document.getElementById('post-image-input');
                const filenameSpan = document.getElementById('image-filename');
                const removeBtn = document.getElementById('remove-image-btn');
                const previewContainer = document.getElementById('image-preview-container');
                
                imageInput.value = '';
                filenameSpan.innerText = 'No file chosen';
                removeBtn.classList.add('hidden');
                previewContainer.classList.add('hidden');
            });
        }

        const modalOverlay = document.getElementById('post-modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) closeModal();
            });
        }

        const createOverlay = document.getElementById('create-post-modal-overlay');
        if (createOverlay) {
            createOverlay.addEventListener('click', (e) => {
                if (e.target === createOverlay) closeCreateModal();
            });
        }

        const confirmOverlay = document.getElementById('confirm-modal-overlay');
        if (confirmOverlay) {
            confirmOverlay.addEventListener('click', (e) => {
                if (e.target === confirmOverlay) {
                    confirmOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }

        const alertOverlay = document.getElementById('alert-modal-overlay');
        if (alertOverlay) {
            alertOverlay.addEventListener('click', (e) => {
                if (e.target === alertOverlay) {
                    alertOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
    }

    function openCreatePostModal() {
        const modal = document.getElementById('create-post-modal-overlay');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeCreateModal() {
        const modal = document.getElementById('create-post-modal-overlay');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            // Clear inputs
            document.getElementById('post-title-input').value = '';
            document.getElementById('post-content-input').value = '';
            
            const imageInput = document.getElementById('post-image-input');
            const filenameSpan = document.getElementById('image-filename');
            const removeBtn = document.getElementById('remove-image-btn');
            const previewContainer = document.getElementById('image-preview-container');
            
            if (imageInput) imageInput.value = '';
            if (filenameSpan) filenameSpan.innerText = 'No file chosen';
            if (removeBtn) removeBtn.classList.add('hidden');
            if (previewContainer) previewContainer.classList.add('hidden');
        }
    }

    function showAlert(message, title = 'Notice') {
        const modal = document.getElementById('alert-modal-overlay');
        const titleEl = document.getElementById('alert-modal-title');
        const msgEl = document.getElementById('alert-modal-message');
        const closeBtn = document.getElementById('alert-modal-close-btn');

        if (!modal || !titleEl || !msgEl || !closeBtn) {
            alert(message);
            return;
        }

        titleEl.innerText = title;
        msgEl.innerText = message;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        closeBtn.onclick = () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        };
    }

    async function handleVote(postId, direction) {
        const user = window.auth ? window.auth.currentUser : null;
        if (!user) {
            triggerLogin();
            return;
        }

        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;

        const post = posts[postIndex];
        const voters = post.voters || {};
        const currentVote = voters[user.uid];
        
        let newVotes = post.votes || 0;
        let newVoters = { ...voters };

        if (currentVote === direction) {
            // Remove vote
            newVotes += (direction === 'up' ? -1 : 1);
            delete newVoters[user.uid];
        } else {
            // Change or add vote
            if (currentVote === 'up') newVotes -= 1;
            if (currentVote === 'down') newVotes += 1;
            
            newVotes += (direction === 'up' ? 1 : -1);
            newVoters[user.uid] = direction;
        }

        if (window.db && !['1', '2', '3'].includes(postId)) {
            try {
                await window.db.collection(COLLECTION_NAME).doc(postId).update({
                    votes: newVotes,
                    voters: newVoters
                });
            } catch (error) {
                console.error("Error updating vote:", error);
                showAlert("Error voting: " + error.message, "Error");
            }
        } else {
            post.votes = newVotes;
            post.voters = newVoters;
            post.voted = newVoters[user.uid] || null;
            savePosts();
            renderFeed();
        }
    }

    function triggerLogin() {
        const signInBtn = document.getElementById('navSignInBtn');
        if (signInBtn) {
            signInBtn.click();
        } else {
            showAlert('Please log in to participate');
        }
    }

    async function handleCreatePost() {
        const user = window.auth ? window.auth.currentUser : null;
        if (!user) {
            triggerLogin();
            return;
        }

        const titleInput = document.getElementById('post-title-input');
        const tagInput = document.getElementById('post-tag-input');
        const contentInput = document.getElementById('post-content-input');
        const imageInput = document.getElementById('post-image-input');
        const submitBtn = document.getElementById('submit-post-btn');

        const title = titleInput.value.trim();
        const tag = tagInput.value;
        const content = contentInput.value.trim();
        const imageFile = imageInput.files[0];

        if (!title) {
            showAlert('Please enter a title');
            return;
        }

        // Disable button to prevent double submission
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Posting...';
        }

        const tagClasses = {
            'Discussion': 'bg-blue-100 text-blue-700',
            'Highlight': 'bg-orange-100 text-orange-700',
            'News': 'bg-green-100 text-green-700',
            'Question': 'bg-purple-100 text-purple-700'
        };

        const authorName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
        
        try {
            let imageUrl = null;
            if (imageFile && window.storage) {
                console.log("Uploading image:", imageFile.name);
                const storageRef = window.storage.ref();
                const fileRef = storageRef.child(`${COLLECTION_NAME}/${Date.now()}_${imageFile.name}`);
                const snapshot = await fileRef.put(imageFile);
                imageUrl = await snapshot.ref.getDownloadURL();
                console.log("Image uploaded, URL:", imageUrl);
            }

            const newPost = {
                author: 'u/' + authorName,
                authorId: user.uid,
                createdAt: (window.firebase && window.firebase.firestore) ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date(),
                tag: tag,
                tagClass: tagClasses[tag] || 'bg-slate-100 text-slate-700',
                title: title,
                content: content,
                imageUrl: imageUrl,
                votes: 1,
                voters: { [user.uid]: 'up' },
                comments: []
            };

            if (window.db) {
                await window.db.collection(COLLECTION_NAME).add(newPost);
                closeCreateModal();
                // Switch to 'New' filter so user sees their post immediately
                setFilter('new');
            } else {
                // Local fallback
                const localPost = {
                    ...newPost,
                    id: Date.now().toString(),
                    time: 'Just now',
                    voted: 'up',
                    imageUrl: imageUrl || document.getElementById('image-preview').src
                };
                if (localPost.imageUrl === '#' || localPost.imageUrl.startsWith('window.')) {
                    localPost.imageUrl = null;
                }
                posts.unshift(localPost);
                savePosts();
                renderFeed();
                closeCreateModal();
            }
        } catch (error) {
            console.error("Post Creation Error:", error);
            showAlert("Error: " + error.message, "Error");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Post';
            }
        }
    }

    function openDetailedView(postId, keepState = false) {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        const modal = document.getElementById('post-modal-overlay');
        const contentContainer = document.getElementById('post-modal-content');
        if (!modal || !contentContainer) return;

        const user = window.auth ? window.auth.currentUser : null;
        const isAuthor = user && post.authorId === user.uid;

        modal.dataset.currentPostId = postId;
        const twitterId = extractTwitterId(post.content);

        // Store scroll position of comments if keepState is true
        let scrollPos = 0;
        const existingCommentsList = contentContainer.querySelector('.comments-list');
        if (keepState && existingCommentsList) {
            scrollPos = existingCommentsList.scrollTop;
        }

        contentContainer.innerHTML = `
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                        <span class="font-bold text-slate-900">${post.author}</span>
                        <span>•</span>
                        <span>${post.time}</span>
                        <span class="${post.tagClass} px-2 py-0.5 rounded-full font-bold">${post.tag}</span>
                    </div>
                    ${isAuthor ? `
                        <button class="modal-delete-post-btn text-red-500 hover:text-red-700 transition-colors" title="Delete Post">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    ` : ''}
                </div>
                <h2 class="text-2xl font-bold text-slate-900">${post.title}</h2>
                ${twitterId ? `<div class="mb-6 twitter-embed-container" data-twitter-id="${twitterId}"><blockquote class="twitter-tweet"><a href="https://twitter.com/i/status/${twitterId}"></a></blockquote></div>` : ''}
                ${post.imageUrl ? `<div class="mb-6 rounded-2xl overflow-hidden border border-slate-200 shadow-sm"><img src="${post.imageUrl}" class="w-full h-auto object-contain bg-slate-100"></div>` : ''}
                <div class="text-slate-700 leading-relaxed whitespace-pre-wrap">${post.content}</div>
                
                <div class="border-t pt-6">
                    <h3 class="font-bold mb-4 text-lg">Comments (${(post.comments || []).length})</h3>
                    
                    <!-- Add Comment -->
                    <div class="mb-8">
                        <textarea id="comment-input" class="w-full p-4 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none resize-none" placeholder="What are your thoughts?" rows="3"></textarea>
                        <div class="flex justify-end mt-2">
                            <button id="submit-comment" class="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md">Post Comment</button>
                        </div>
                    </div>

                    <!-- Comments List -->
                    <div class="comments-list space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        ${(post.comments && post.comments.length > 0) ? post.comments.map((c, idx) => `
                            <div class="bg-slate-50 rounded-xl p-4 border border-slate-100" data-comment-idx="${idx}">
                                <div class="flex items-center gap-2 mb-2 text-xs text-slate-500">
                                    <span class="font-bold text-slate-900">${c.author}</span>
                                    <span>•</span>
                                    <span>${c.time || formatTimeAgo(c.createdAt)}</span>
                                </div>
                                <p class="text-sm text-slate-700 leading-normal mb-3">${c.text}</p>
                                
                                <div class="flex flex-col gap-3">
                                    <div class="flex items-center gap-4">
                                        <button class="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors reply-btn" data-comment-idx="${idx}">Reply</button>
                                    </div>
                                    
                                    <!-- Reply Input (hidden by default) -->
                                    <div class="reply-input-container hidden" id="reply-input-${idx}">
                                        <textarea class="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none resize-none" placeholder="Write a reply..." rows="2"></textarea>
                                        <div class="flex justify-end gap-2 mt-2">
                                            <button class="px-3 py-1 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-200 cancel-reply-btn" data-comment-idx="${idx}">Cancel</button>
                                            <button class="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold hover:bg-blue-700 submit-reply-btn" data-comment-idx="${idx}">Reply</button>
                                        </div>
                                    </div>

                                    <!-- Replies List -->
                                    ${(c.replies && c.replies.length > 0) ? `
                                        <div class="pl-4 border-l-2 border-slate-200 space-y-3 mt-2">
                                            ${c.replies.map(r => `
                                                <div class="text-xs">
                                                    <div class="flex items-center gap-2 mb-1">
                                                        <span class="font-bold text-slate-900">${r.author}</span>
                                                        <span class="text-slate-400">•</span>
                                                        <span class="text-slate-400">${r.time || 'Just now'}</span>
                                                    </div>
                                                    <p class="text-slate-600">${r.text}</p>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).reverse().join('') : `
                            <div class="text-center py-8">
                                <svg class="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p class="text-slate-500 text-sm italic">No comments yet. Be the first to share your thoughts!</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        if (!keepState) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else if (existingCommentsList) {
            contentContainer.querySelector('.comments-list').scrollTop = scrollPos;
        }

        // Load Twitter widgets if any were added to the modal
        if (twitterId && window.twttr && window.twttr.widgets) {
            window.twttr.widgets.load(contentContainer);
        }

        // Setup listeners for modal content
        const deleteBtn = contentContainer.querySelector('.modal-delete-post-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => handleDeletePost(postId));
        }

        const submitBtn = document.getElementById('submit-comment');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => addComment(postId));
        }

        // Reply logic
        contentContainer.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.dataset.comment_idx || e.target.getAttribute('data-comment-idx');
                document.getElementById(`reply-input-${idx}`).classList.remove('hidden');
                e.target.classList.add('hidden');
            });
        });

        contentContainer.querySelectorAll('.cancel-reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.dataset.comment_idx || e.target.getAttribute('data-comment-idx');
                document.getElementById(`reply-input-${idx}`).classList.add('hidden');
                contentContainer.querySelector(`.reply-btn[data-comment-idx="${idx}"]`).classList.remove('hidden');
            });
        });

        contentContainer.querySelectorAll('.submit-reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.dataset.comment_idx || e.target.getAttribute('data-comment-idx');
                const textarea = document.querySelector(`#reply-input-${idx} textarea`);
                if (textarea.value.trim()) {
                    addReply(postId, parseInt(idx), textarea.value.trim());
                }
            });
        });
    }

    async function addReply(postId, commentIdx, text) {
        const user = window.auth ? window.auth.currentUser : null;
        if (!user) {
            triggerLogin();
            return;
        }

        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;

        const post = posts[postIndex];
        const updatedComments = [...(post.comments || [])];
        const comment = updatedComments[commentIdx];
        
        if (!comment.replies) comment.replies = [];
        
        const authorName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
        const newReply = {
            author: 'u/' + authorName,
            authorId: user.uid,
            text: text,
            time: 'Just now',
            createdAt: new Date().toISOString()
        };

        comment.replies.push(newReply);

        if (window.db && !['1', '2', '3'].includes(postId)) {
            try {
                await window.db.collection(COLLECTION_NAME).doc(postId).update({
                    comments: updatedComments
                });
            } catch (error) {
                console.error("Error adding reply:", error);
                showAlert("Error adding reply: " + error.message, "Error");
            }
        } else {
            post.comments = updatedComments;
            savePosts();
            openDetailedView(postId, true);
        }
    }

    async function addComment(postId) {
        const user = window.auth ? window.auth.currentUser : null;
        if (!user) {
            triggerLogin();
            return;
        }

        const input = document.getElementById('comment-input');
        const text = input.value.trim();
        if (!text) return;

        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;

        const authorName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');

        const newComment = {
            author: 'u/' + authorName,
            authorId: user.uid,
            text: text,
            time: 'Just now',
            createdAt: new Date().toISOString()
        };

        if (window.db && !['1', '2', '3'].includes(postId)) {
            try {
                const postRef = window.db.collection(COLLECTION_NAME).doc(postId);
                await postRef.update({
                    comments: window.firebase.firestore.FieldValue.arrayUnion(newComment)
                });
                input.value = '';
            } catch (error) {
                console.error("Error adding comment:", error);
                showAlert("Error adding comment: " + error.message, "Error");
            }
        } else {
            // Local fallback for default posts or if DB is missing
            if (!posts[postIndex].comments) posts[postIndex].comments = [];
            posts[postIndex].comments.push(newComment);
            savePosts();
            openDetailedView(postId, true);
            renderFeed();
            if (input) input.value = '';
        }
    }

    function closeModal() {
        const modal = document.getElementById('post-modal-overlay');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    return {
        init,
        loadPosts,
        renderFeed,
        handleCreatePost,
        handleVote,
        addComment,
        posts: () => posts
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    CommunityFeed.init();
});

// Export for testing if in test environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommunityFeed;
}
