
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
            checkDeepLink();
        } else {
            // Try again soon
            setTimeout(init, 200);
        }
    }

    function checkDeepLink() {
        const params = new URLSearchParams(window.location.search);
        const postId = params.get('post');
        if (postId) {
            console.log("Deep link detected for post:", postId);
            // Wait for posts to load then open
            const interval = setInterval(() => {
                if (posts.length > 0) {
                    if (posts.some(p => p.id === postId)) {
                        openDetailedView(postId);
                        clearInterval(interval);
                    }
                }
            }, 500);
            // Timeout after 10 seconds
            setTimeout(() => clearInterval(interval), 10000);
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

    function formatTwitterContent(text) {
        if (!text) return '';
        const twitterRegex = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:\w+)\/status\/(\d+)/g;
        return text.replace(twitterRegex, '').trim();
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
        
        // Helper to check if imageUrl is valid and not just a placeholder
        const hasValidImage = post.imageUrl && 
                             post.imageUrl !== '#' && 
                             !post.imageUrl.startsWith('window.') &&
                             !(post.imageUrl.includes(window.location.host) && post.imageUrl.endsWith('/#'));

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
                ${post.content ? `<div class="bg-slate-50 rounded-lg p-4 mb-3 border border-slate-100"><p class="text-sm text-slate-600 line-clamp-3">${formatTwitterContent(post.content)}</p></div>` : ''}
                ${twitterId ? `<div class="mb-4 twitter-embed-container" data-twitter-id="${twitterId}"><blockquote class="twitter-tweet"><a href="https://twitter.com/i/status/${twitterId}"></a></blockquote></div>` : ''}
                ${hasValidImage ? `<div class="mb-4 rounded-xl overflow-hidden border border-slate-100 bg-slate-50"><img src="${post.imageUrl}" class="w-full h-auto max-h-96 object-cover block" onerror="this.parentElement.style.display='none'"></div>` : ''}
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
            } else if (e.target.closest('.share-btn')) {
                e.stopPropagation();
                handleSharePost(post.id, post.title);
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

    function handleSharePost(postId, postTitle) {
        const shareUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;
        
        if (navigator.share) {
            navigator.share({
                title: postTitle,
                url: shareUrl
            }).then(() => {
                console.log('Post shared successfully');
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    copyToClipboard(shareUrl);
                }
            });
        } else {
            copyToClipboard(shareUrl);
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showAlert('Link copied to clipboard!', 'Shared');
        }).catch(err => {
            console.error('Could not copy text: ', err);
            showAlert('Could not copy link to clipboard.', 'Error');
        });
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
                    if (file.size > 20 * 1024 * 1024) {
                        showAlert('This file is over 20MB. Please use a smaller image for best results.', 'File Too Large');
                        imageInput.value = '';
                        return;
                    }
                    filenameSpan.innerText = file.name;
                    removeBtn.classList.remove('hidden');
                    
                    const objectUrl = URL.createObjectURL(file);
                    
                    // Cleanup previous object URL to prevent memory leaks
                    if (previewImg.dataset.objectUrl) {
                        URL.revokeObjectURL(previewImg.dataset.objectUrl);
                    }
                    
                    previewImg.src = objectUrl;
                    previewImg.dataset.objectUrl = objectUrl;
                    previewContainer.classList.remove('hidden');
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
            const previewImg = document.getElementById('image-preview');
            
            if (imageInput) imageInput.value = '';
            if (filenameSpan) filenameSpan.innerText = 'No file chosen';
            if (removeBtn) removeBtn.classList.add('hidden');
            if (previewContainer) previewContainer.classList.add('hidden');
            
            if (previewImg && previewImg.dataset.objectUrl) {
                URL.revokeObjectURL(previewImg.dataset.objectUrl);
                delete previewImg.dataset.objectUrl;
                previewImg.src = '';
            }
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

        console.log("Starting post creation process...");

        const tagClasses = {
            'Discussion': 'bg-blue-100 text-blue-700',
            'Highlight': 'bg-orange-100 text-orange-700',
            'News': 'bg-green-100 text-green-700',
            'Question': 'bg-purple-100 text-purple-700'
        };

        const authorName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
        
        try {
            let imageUrl = null;
            const previewImg = document.getElementById('image-preview');
            const previewSrc = previewImg ? previewImg.src : null;

            // Get storage reference
            let storage = window.storage || (window.firebase && typeof window.firebase.storage === 'function' ? window.firebase.storage() : null);

            // If storage is still not there, wait a bit and try again
            if (imageFile && !storage) {
                console.log("Storage not ready, waiting 2 seconds...");
                await new Promise(resolve => setTimeout(resolve, 2000));
                storage = window.storage || (window.firebase && typeof window.firebase.storage === 'function' ? window.firebase.storage() : null);
            }

            if (imageFile && storage) {
                try {
                    console.log("OVERHAUL: Uploading image:", imageFile.name, "Size:", (imageFile.size / 1024 / 1024).toFixed(2), "MB");
                    
                    const fileExt = imageFile.name.split('.').pop().toLowerCase() || 'jpg';
                    const fileName = `img_${Date.now()}_${Math.floor(Math.random() * 100000)}.${fileExt}`;
                    
                    let fileRef;
                    try {
                        // More robust reference creation
                        const bucketUrl = (storage.app && storage.app.options) ? storage.app.options.storageBucket : 'default';
                        console.log("Using storage bucket:", bucketUrl);
                        fileRef = storage.ref().child(COLLECTION_NAME).child(fileName);
                    } catch (e) {
                        console.error("Ref creation error:", e);
                        fileRef = storage.ref(`${COLLECTION_NAME}/${fileName}`);
                    }
                    
                    // 3. Optimized Metadata
                    const metadata = { 
                        contentType: imageFile.type,
                        cacheControl: 'public,max-age=31536000'
                    };
                    
                    // 4. Use put() but with a more robust monitor
                    console.log("Starting put() task...");
                    const uploadTask = fileRef.put(imageFile, metadata);
                    
                    let lastProgress = 0;
                    let stalledTime = 0;
                    const STALL_LIMIT = 20; // 20 seconds without progress = stall

                    await new Promise((resolve, reject) => {
                        const timer = setInterval(() => {
                            stalledTime++;
                            if (stalledTime >= STALL_LIMIT) {
                                clearInterval(timer);
                                uploadTask.cancel();
                                reject(new Error("Upload stalled for too long. Please check your internet connection."));
                            }
                        }, 1000);

                        uploadTask.on('state_changed', 
                            (snapshot) => {
                                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                if (submitBtn) submitBtn.innerText = `Posting (${Math.floor(progress)}%)...`;
                                console.log(`Upload: ${Math.floor(progress)}% (${snapshot.bytesTransferred}/${snapshot.totalBytes} bytes)`);
                                
                                if (snapshot.bytesTransferred > lastProgress) {
                                    lastProgress = snapshot.bytesTransferred;
                                    stalledTime = 0; // Reset stall timer
                                }
                            }, 
                            (error) => {
                                clearInterval(timer);
                                console.error("Firebase Storage Error:", error.code, error.message);
                                reject(error);
                            }, 
                            () => {
                                clearInterval(timer);
                                console.log("Upload SUCCESSFUL");
                                resolve();
                            }
                        );
                    });
                    
                    console.log("Getting download URL...");
                    imageUrl = await fileRef.getDownloadURL();
                    console.log("Final Image URL:", imageUrl);
                } catch (uploadError) {
                    console.error("Detailed Image Upload Error:", uploadError);
                    let errorMsg = "Failed to upload image.";
                    if (uploadError.code === 'storage/unauthorized') {
                        errorMsg += " You don't have permission to upload.";
                    } else if (uploadError.code === 'storage/canceled') {
                        errorMsg += " Upload was canceled.";
                    } else {
                        errorMsg += " " + (uploadError.message || "Please check your internet connection.");
                    }
                    showAlert(errorMsg, "Upload Error");
                    throw uploadError;
                }
            } else if (imageFile) {
                console.error("Storage initialization failed. auth:", !!window.auth, "db:", !!window.db, "storage:", !!storage);
                showAlert("The upload service is still connecting. Please wait 10 seconds and try again.", "Service Busy");
                throw new Error("Storage not initialized");
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

            console.log("Saving post to database...");
            if (window.db) {
                const docRef = await window.db.collection(COLLECTION_NAME).add(newPost);
                console.log("Post saved with ID:", docRef.id);
                closeCreateModal();
                setFilter('new');
            } else {
                console.warn("Database not found, using local fallback");
                // Local fallback
                const localPost = {
                    ...newPost,
                    id: Date.now().toString(),
                    time: 'Just now',
                    voted: 'up'
                };
                
                if (localPost.imageUrl === '#' || (localPost.imageUrl && localPost.imageUrl.includes(window.location.host) && localPost.imageUrl.endsWith('/#'))) {
                    localPost.imageUrl = null;
                }
                
                posts.unshift(localPost);
                savePosts();
                renderFeed();
                closeCreateModal();
            }
        } catch (error) {
            console.error("Final Post Creation Error:", error);
            showAlert("Error creating post: " + error.message, "Error");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Post';
            }
        }
    }

    function renderReplies(replies, commentIdx, parentPath = '') {
        if (!replies || replies.length === 0) return '';
        
        const user = window.auth ? window.auth.currentUser : null;
        
        return `
            <div class="pl-4 border-l-2 border-slate-200 space-y-4 mt-2">
                ${replies.map((r, rIdx) => {
                    const rVoters = r.voters || {};
                    const rUserVote = user ? rVoters[user.uid] : null;
                    const rUpvoted = rUserVote === 'up';
                    const rVotes = r.votes || 0;
                    const currentPath = parentPath ? `${parentPath}-${rIdx}` : `${rIdx}`;

                    return `
                            <div class="bg-slate-50 rounded-xl p-4 border border-slate-100" data-comment-idx="${commentIdx}" data-reply-path="${currentPath}">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center gap-2 text-xs text-slate-500">
                                        <span class="font-bold text-slate-900">${r.author}</span>
                                        <span>•</span>
                                        <span>${r.time || 'Just now'}</span>
                                    </div>
                                    ${user && r.authorId === user.uid ? `
                                        <button class="delete-comment-btn text-red-400 hover:text-red-600 transition-colors p-1" data-comment-idx="${commentIdx}" data-reply-path="${currentPath}">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                        </button>
                                    ` : ''}
                                </div>
                                <p class="text-slate-600 mb-2">${r.text}</p>
                                <div class="flex items-center gap-4">
                                    <div class="flex items-center gap-1">
                                <button class="reply-vote-up p-0.5 hover:text-orange-600 transition-colors ${rUpvoted ? 'text-orange-600' : 'text-slate-400'}" 
                                        data-comment-idx="${commentIdx}" data-reply-path="${currentPath}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="${rUpvoted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                </button>
                                <span class="text-[10px] font-bold text-slate-500">${rVotes}</span>
                            </div>
                            <button class="text-[10px] font-bold text-slate-400 hover:text-blue-600 reply-to-reply-btn" 
                                    data-comment-idx="${commentIdx}" data-reply-path="${currentPath}">Reply</button>
                        </div>

                        <!-- Nested Reply Input -->
                        <div class="reply-input-container hidden mt-3" id="reply-input-${commentIdx}-${currentPath}">
                            <textarea class="w-full p-2 border border-slate-200 rounded-lg text-[11px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none resize-none" placeholder="Write a reply..." rows="2"></textarea>
                            <div class="flex justify-end gap-2 mt-2">
                                <button class="px-2 py-1 rounded-full text-[10px] font-bold text-slate-500 hover:bg-slate-200 cancel-nested-reply-btn" 
                                        data-comment-idx="${commentIdx}" data-reply-path="${currentPath}">Cancel</button>
                                <button class="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold hover:bg-blue-700 submit-nested-reply-btn" 
                                        data-comment-idx="${commentIdx}" data-reply-path="${currentPath}">Reply</button>
                            </div>
                        </div>

                        <!-- Recursive Replies -->
                        ${renderReplies(r.replies, commentIdx, currentPath)}
                    </div>
                    `;
                }).join('')}
            </div>
        `;
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

        // Helper to check if imageUrl is valid and not just a placeholder
        const hasValidImage = post.imageUrl && 
                             post.imageUrl !== '#' && 
                             !post.imageUrl.startsWith('window.') &&
                             !(post.imageUrl.includes(window.location.host) && post.imageUrl.endsWith('/#'));

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
                    <div class="flex items-center gap-2 mr-10">
                        <button class="modal-share-post-btn text-slate-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-slate-100" title="Share Post">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                        </button>
                        ${isAuthor ? `
                            <button class="modal-delete-post-btn text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50" title="Delete Post">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <h2 class="text-2xl font-bold text-slate-900">${post.title}</h2>
                ${twitterId ? `<div class="mb-6 twitter-embed-container" data-twitter-id="${twitterId}"><blockquote class="twitter-tweet"><a href="https://twitter.com/i/status/${twitterId}"></a></blockquote></div>` : ''}
                ${hasValidImage ? `<div class="mb-6 rounded-2xl overflow-hidden border border-slate-200 shadow-sm"><img src="${post.imageUrl}" class="w-full h-auto object-contain bg-slate-100" onerror="this.parentElement.style.display='none'"></div>` : ''}
                <div class="text-slate-700 leading-relaxed whitespace-pre-wrap">${formatTwitterContent(post.content)}</div>
                
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
                        ${(post.comments && post.comments.length > 0) ? post.comments.map((c, idx) => {
                            const user = window.auth ? window.auth.currentUser : null;
                            const cVoters = c.voters || {};
                            const userVote = user ? cVoters[user.uid] : null;
                            const isUpvoted = userVote === 'up';
                            const cVotes = c.votes || 0;

                            return `
                            <div class="bg-slate-50 rounded-xl p-4 border border-slate-100" data-comment-idx="${idx}">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center gap-2 text-xs text-slate-500">
                                        <span class="font-bold text-slate-900">${c.author}</span>
                                        <span>•</span>
                                        <span>${c.time || formatTimeAgo(c.createdAt)}</span>
                                    </div>
                                    ${user && c.authorId === user.uid ? `
                                        <button class="delete-comment-btn text-red-400 hover:text-red-600 transition-colors p-1" data-comment-idx="${idx}">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                        </button>
                                    ` : ''}
                                </div>
                                <p class="text-sm text-slate-700 leading-normal mb-3">${c.text}</p>
                                
                                <div class="flex flex-col gap-3">
                                    <div class="flex items-center gap-4">
                                        <div class="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2 py-0.5">
                                            <button class="comment-vote-up p-0.5 hover:text-orange-600 transition-colors ${isUpvoted ? 'text-orange-600' : 'text-slate-400'}" data-comment-idx="${idx}">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="${isUpvoted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                            </button>
                                            <span class="text-[10px] font-bold min-w-[12px] text-center ${isUpvoted ? 'text-orange-600' : 'text-slate-600'}">${cVotes}</span>
                                        </div>
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

                                    <!-- Recursive Replies List -->
                                    ${renderReplies(c.replies, idx)}
                                </div>
                            </div>
                            `;
                        }).reverse().join('') : `
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
        const shareBtn = contentContainer.querySelector('.modal-share-post-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => handleSharePost(postId, post.title));
        }

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

        // Reply to Reply logic
        contentContainer.querySelectorAll('.reply-to-reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cIdx = e.target.dataset.commentIdx;
                const rPath = e.target.dataset.replyPath;
                document.getElementById(`reply-input-${cIdx}-${rPath}`).classList.remove('hidden');
                e.target.classList.add('hidden');
            });
        });

        contentContainer.querySelectorAll('.cancel-nested-reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cIdx = e.target.dataset.commentIdx;
                const rPath = e.target.dataset.replyPath;
                document.getElementById(`reply-input-${cIdx}-${rPath}`).classList.add('hidden');
                contentContainer.querySelector(`.reply-to-reply-btn[data-comment-idx="${cIdx}"][data-reply-path="${rPath}"]`).classList.remove('hidden');
            });
        });

        contentContainer.querySelectorAll('.submit-nested-reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cIdx = e.target.dataset.commentIdx;
                const rPath = e.target.dataset.replyPath;
                const textarea = document.querySelector(`#reply-input-${cIdx}-${rPath} textarea`);
                if (textarea.value.trim()) {
                    addNestedReply(postId, parseInt(cIdx), rPath, textarea.value.trim());
                }
            });
        });

        // Comment Vote logic
        contentContainer.querySelectorAll('.comment-vote-up').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.dataset.commentIdx;
                handleCommentVote(postId, parseInt(idx));
            });
        });

        // Reply Vote logic
        contentContainer.querySelectorAll('.reply-vote-up').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cIdx = e.currentTarget.dataset.commentIdx;
                const rPath = e.currentTarget.dataset.replyPath || e.currentTarget.dataset.replyIdx;
                handleReplyVote(postId, parseInt(cIdx), rPath);
            });
        });

        // Comment/Reply Delete logic
        contentContainer.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cIdx = e.currentTarget.dataset.commentIdx;
                const rPath = e.currentTarget.dataset.replyPath; // undefined for top-level comments
                handleDeleteComment(postId, parseInt(cIdx), rPath);
            });
        });
    }

    async function handleDeleteComment(postId, commentIdx, replyPath) {
        const confirmModal = document.getElementById('confirm-modal-overlay');
        const submitBtn = document.getElementById('confirm-modal-submit');
        const cancelBtn = document.getElementById('confirm-modal-cancel');
        const modalTitle = confirmModal.querySelector('h3');
        const modalText = confirmModal.querySelector('p');

        if (!confirmModal || !submitBtn || !cancelBtn) return;

        const originalTitle = modalTitle.innerText;
        const originalText = modalText.innerText;

        modalTitle.innerText = "Delete Comment?";
        modalText.innerText = "Are you sure you want to delete this comment? This will also delete any replies it has.";
        
        confirmModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const cleanup = () => {
            confirmModal.classList.remove('active');
            document.body.style.overflow = '';
            modalTitle.innerText = originalTitle;
            modalText.innerText = originalText;
        };

        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
        
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        newCancelBtn.onclick = cleanup;

        newSubmitBtn.onclick = async () => {
            cleanup();

            const postIndex = posts.findIndex(p => p.id === postId);
            if (postIndex === -1) return;

            const post = posts[postIndex];
            const updatedComments = [...(post.comments || [])];

            if (replyPath === undefined || replyPath === null) {
                // Delete top-level comment
                updatedComments.splice(commentIdx, 1);
            } else {
                // Delete nested reply
                const path = String(replyPath).split('-').map(Number);
                const comment = updatedComments[commentIdx];
                let target = comment.replies;
                
                for (let i = 0; i < path.length - 1; i++) {
                    target = target[path[i]].replies;
                }
                target.splice(path[path.length - 1], 1);
            }

            if (window.db && !['1', '2', '3'].includes(postId)) {
                try {
                    await window.db.collection(COLLECTION_NAME).doc(postId).update({
                        comments: updatedComments
                    });
                } catch (error) {
                    console.error("Error deleting comment:", error);
                    showAlert("Error deleting comment: " + error.message, "Error");
                }
            } else {
                post.comments = updatedComments;
                savePosts();
                openDetailedView(postId, true);
                renderFeed();
            }
        };
    }

    async function handleCommentVote(postId, commentIdx) {
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
        
        if (!comment.voters) comment.voters = {};
        if (comment.votes === undefined) comment.votes = 0;

        if (comment.voters[user.uid] === 'up') {
            comment.votes -= 1;
            delete comment.voters[user.uid];
        } else {
            comment.votes += 1;
            comment.voters[user.uid] = 'up';
        }

        if (window.db && !['1', '2', '3'].includes(postId)) {
            try {
                await window.db.collection(COLLECTION_NAME).doc(postId).update({
                    comments: updatedComments
                });
            } catch (error) {
                console.error("Error voting on comment:", error);
            }
        } else {
            post.comments = updatedComments;
            savePosts();
            openDetailedView(postId, true);
        }
    }

    async function handleReplyVote(postId, commentIdx, replyPath) {
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
        if (!comment.replies) return;
        
        // Find reply by path (e.g., "0-1-2")
        const path = String(replyPath).split('-').map(Number);
        let target = comment.replies;
        let reply = null;
        
        for (let i = 0; i < path.length; i++) {
            const idx = path[i];
            if (i === path.length - 1) {
                reply = target[idx];
            } else {
                target = target[idx].replies;
            }
        }
        
        if (!reply) return;
        if (!reply.voters) reply.voters = {};
        if (reply.votes === undefined) reply.votes = 0;

        if (reply.voters[user.uid] === 'up') {
            reply.votes -= 1;
            delete reply.voters[user.uid];
        } else {
            reply.votes += 1;
            reply.voters[user.uid] = 'up';
        }

        if (window.db && !['1', '2', '3'].includes(postId)) {
            try {
                await window.db.collection(COLLECTION_NAME).doc(postId).update({
                    comments: updatedComments
                });
            } catch (error) {
                console.error("Error voting on reply:", error);
            }
        } else {
            post.comments = updatedComments;
            savePosts();
            openDetailedView(postId, true);
        }
    }

    async function addNestedReply(postId, commentIdx, replyPath, text) {
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
        
        // Find parent reply
        const path = String(replyPath).split('-').map(Number);
        let target = comment.replies;
        let parentReply = null;
        
        for (let i = 0; i < path.length; i++) {
            const idx = path[i];
            if (i === path.length - 1) {
                parentReply = target[idx];
            } else {
                target = target[idx].replies;
            }
        }
        
        if (!parentReply) return;
        if (!parentReply.replies) parentReply.replies = [];
        
        const authorName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
        const newReply = {
            author: 'u/' + authorName,
            authorId: user.uid,
            text: text,
            time: 'Just now',
            createdAt: new Date().toISOString(),
            votes: 0,
            voters: {},
            replies: []
        };

        parentReply.replies.push(newReply);

        if (window.db && !['1', '2', '3'].includes(postId)) {
            try {
                await window.db.collection(COLLECTION_NAME).doc(postId).update({
                    comments: updatedComments
                });
            } catch (error) {
                console.error("Error adding nested reply:", error);
            }
        } else {
            post.comments = updatedComments;
            savePosts();
            openDetailedView(postId, true);
        }
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
            createdAt: new Date().toISOString(),
            votes: 0,
            voters: {}
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
            createdAt: new Date().toISOString(),
            votes: 0,
            voters: {},
            replies: []
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
        handleSharePost,
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
