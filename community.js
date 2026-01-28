
// Community Feed Logic
const CommunityFeed = (() => {
    let posts = [];
    const STORAGE_KEY = 'sixers_hoops_posts';
    const COLLECTION_NAME = 'community_posts';

    // Default posts if nothing in storage/database
    const defaultPosts = [
        {
            id: '1',
            author: 'u/TrustTheProcess',
            time: '2h ago',
            tag: 'Discussion',
            tagClass: 'bg-blue-100 text-blue-700',
            title: "Tyrese Maxey's development this season is actually insane. Is he already a top 3 SG in the league?",
            content: "Looking at the stats over the last 10 games, Maxey is averaging 28/6/5 on 50/40/90 splits. His decision making in the clutch has taken a massive leap forward...",
            votes: 1200,
            voted: null, 
            comments: [
                { author: 'u/SixersFan1', text: 'Absolutely! His speed and finishing are elite now.', time: '1h ago' },
                { author: 'u/ProcessTruster', text: 'Top 3 might be a stretch with Mitchell, Booker, and SGA (if he counts as SG), but he is close!', time: '45m ago' }
            ]
        }
    ];

    function init() {
        if (window.db) {
            listenToPosts();
        } else {
            // Fallback to local storage if Firebase isn't ready
            loadPosts();
            renderFeed();
            // Try to initialize Firebase listener later
            setTimeout(init, 500);
        }
        setupEventListeners();
    }

    function listenToPosts() {
        window.db.collection(COLLECTION_NAME)
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                posts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Convert Firestore timestamp to "time ago" string
                    time: formatTimeAgo(doc.data().createdAt)
                }));
                
                if (posts.length === 0) {
                    posts = [...defaultPosts];
                }
                
                renderFeed();

                // If a detailed view is open, update its content
                const modal = document.getElementById('post-modal-overlay');
                if (modal && modal.classList.contains('active')) {
                    const currentPostId = modal.dataset.currentPostId;
                    if (currentPostId) {
                        openDetailedView(currentPostId, true); // true means don't reset scroll or focus
                    }
                }
            }, (error) => {
                console.error("Error listening to posts:", error);
                loadPosts(); // Fallback
                renderFeed();
            });
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

        container.innerHTML = '';
        posts.forEach(post => {
            const postEl = createPostElement(post);
            container.appendChild(postEl);
        });
    }

    function createPostElement(post) {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex cursor-pointer hover:border-blue-300 transition-all duration-200 hover:shadow-md';
        div.dataset.id = post.id;
        
        const user = window.auth ? window.auth.currentUser : null;
        const userVote = (user && post.voters) ? post.voters[user.uid] : post.voted;
        const isUpvoted = userVote === 'up';
        const isDownvoted = userVote === 'down';

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
                <div class="flex items-center gap-2 mb-2 text-xs text-slate-500">
                    <span class="font-bold text-slate-900">${post.author}</span>
                    <span>•</span>
                    <span>${post.time}</span>
                    <span class="${post.tagClass} px-2 py-0.5 rounded-full font-bold">${post.tag}</span>
                </div>
                <h3 class="text-lg font-bold text-slate-900 mb-3 leading-tight">${post.title}</h3>
                ${post.content ? `<div class="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-100"><p class="text-sm text-slate-600 line-clamp-3">${post.content}</p></div>` : ''}
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
            } else {
                openDetailedView(post.id);
            }
        });

        return div;
    }

    function formatVotes(votes) {
        if (Math.abs(votes) >= 1000) return (votes / 1000).toFixed(1) + 'k';
        return votes;
    }

    function setupEventListeners() {
        const createTrigger = document.getElementById('create-post-trigger');
        const createBtn = document.getElementById('create-post-btn');
        
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
        }
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

        if (window.db) {
            try {
                await window.db.collection(COLLECTION_NAME).doc(postId).update({
                    votes: newVotes,
                    voters: newVoters
                });
            } catch (error) {
                console.error("Error updating vote:", error);
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
            alert('Please log in to participate');
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

        const title = titleInput.value.trim();
        const tag = tagInput.value;
        const content = contentInput.value.trim();

        if (!title) {
            alert('Please enter a title');
            return;
        }

        const tagClasses = {
            'Discussion': 'bg-blue-100 text-blue-700',
            'Highlight': 'bg-orange-100 text-orange-700',
            'News': 'bg-green-100 text-green-700',
            'Question': 'bg-purple-100 text-purple-700'
        };

        const newPost = {
            author: 'u/' + (user.displayName || user.email.split('@')[0]),
            authorId: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            tag: tag,
            tagClass: tagClasses[tag] || 'bg-slate-100 text-slate-700',
            title: title,
            content: content,
            votes: 1,
            voters: { [user.uid]: 'up' },
            comments: []
        };

        if (window.db) {
            try {
                await window.db.collection(COLLECTION_NAME).add(newPost);
                closeCreateModal();
            } catch (error) {
                console.error("Error creating post:", error);
                alert("Error creating post. Please try again.");
            }
        } else {
            // Fallback for tests or local dev
            const localPost = {
                ...newPost,
                id: Date.now().toString(),
                time: 'Just now',
                voted: 'up'
            };
            posts.unshift(localPost);
            savePosts();
            renderFeed();
            closeCreateModal();
        }
    }

    function openDetailedView(postId, keepState = false) {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        const modal = document.getElementById('post-modal-overlay');
        const contentContainer = document.getElementById('post-modal-content');
        if (!modal || !contentContainer) return;

        modal.dataset.currentPostId = postId;

        // Store scroll position of comments if keepState is true
        let scrollPos = 0;
        const existingCommentsList = contentContainer.querySelector('.comments-list');
        if (keepState && existingCommentsList) {
            scrollPos = existingCommentsList.scrollTop;
        }

        contentContainer.innerHTML = `
            <div class="space-y-6">
                <div class="flex items-center gap-2 text-xs text-slate-500">
                    <span class="font-bold text-slate-900">${post.author}</span>
                    <span>•</span>
                    <span>${post.time}</span>
                    <span class="${post.tagClass} px-2 py-0.5 rounded-full font-bold">${post.tag}</span>
                </div>
                <h2 class="text-2xl font-bold text-slate-900">${post.title}</h2>
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
                        ${(post.comments && post.comments.length > 0) ? post.comments.map(c => `
                            <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div class="flex items-center gap-2 mb-2 text-xs text-slate-500">
                                    <span class="font-bold text-slate-900">${c.author}</span>
                                    <span>•</span>
                                    <span>${c.time || formatTimeAgo(c.createdAt)}</span>
                                </div>
                                <p class="text-sm text-slate-700 leading-normal">${c.text}</p>
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

        // Setup comment submit
        const submitBtn = document.getElementById('submit-comment');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                addComment(postId);
            });
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

        const newComment = {
            author: 'u/' + (user.displayName || user.email.split('@')[0]),
            authorId: user.uid,
            text: text,
            time: 'Just now',
            createdAt: new Date().toISOString()
        };

        if (window.db) {
            try {
                const postRef = window.db.collection(COLLECTION_NAME).doc(postId);
                await postRef.update({
                    comments: firebase.firestore.FieldValue.arrayUnion(newComment)
                });
                // Snapshot listener will update the UI
                input.value = '';
                // Since onSnapshot will trigger a full render, we might need to reopen the modal or just wait
                // For better UX, we can manually update the local modal content if needed, but onSnapshot is pretty fast.
                // However, openDetailedView(postId) re-renders the whole modal, so we should call it again after the update if we want immediate feedback.
                // But onSnapshot will trigger renderFeed, not openDetailedView.
                // Let's modify onSnapshot to also update the modal if it's open.
            } catch (error) {
                console.error("Error adding comment:", error);
            }
        } else {
            posts[postIndex].comments.unshift(newComment);
            savePosts();
            openDetailedView(postId); // Refresh view
            renderFeed(); // Update comment count in feed
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
