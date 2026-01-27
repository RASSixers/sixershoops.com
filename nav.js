// Navbar Injection Script
document.addEventListener('DOMContentLoaded', function() {
    // Add Firebase SDKs if not present
    if (!document.getElementById('firebase-app-sdk')) {
        const scripts = [
            { id: 'firebase-app-sdk', src: 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js' },
            { id: 'firebase-auth-sdk', src: 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js' },
            { id: 'firebase-firestore-sdk', src: 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js' }
        ];
        
        scripts.forEach(s => {
            const script = document.createElement('script');
            script.id = s.id;
            script.src = s.src;
            script.async = false; // Ensure they load in order
            document.head.appendChild(script);
        });
    }

    const navbarHTML = `
    <nav class="navbar">
        <a href="/" class="nav-brand">
            <img src="https://sixershoops.com/sixershoopslogonew.png" alt="Sixers Hoops Logo" class="nav-logo">
            <span class="brand-name">SIXERS HOOPS</span>
        </a>

        <ul class="nav-menu">
            <li class="nav-item">
                <a href="/" class="nav-link">Home</a>
            </li>
            <li class="nav-item">
                <a href="/pickem" class="nav-link">Pick'em</a>
            </li>
            <li class="nav-item dropdown">
                <button class="dropdown-toggle">Team Hub</button>
                <div class="dropdown-menu">
                    <a href="https://sixershoops.com/roster" class="dropdown-item">Roster</a>
                    <a href="https://sixershoops.com/salary" class="dropdown-item">Salary Breakdown</a>
                    <a href="https://sixershoops.com/sixers-depth-chart" class="dropdown-item">Depth Chart</a>
                    <a href="https://sixershoops.com/future-draft-picks" class="dropdown-item">Draft Picks</a>
                </div>
            </li>
            <li class="nav-item">
                <a href="https://sixershoops.com/schedule" class="nav-link">Schedule</a>
            </li>
            <li class="nav-item">
                <a href="https://sixershoops.com/contact" class="nav-link">Contact</a>
            </li>
        </ul>

        <div class="nav-icons">
            <div id="authNavContainer">
                <button class="auth-nav-btn" id="navSignInBtn">Sign In</button>
            </div>
            <button class="icon-btn theme-toggle" id="themeToggle" aria-label="Toggle dark mode">
                <svg class="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <svg class="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            </button>
        </div>

        <button class="mobile-menu-btn" id="mobileMenuBtn">
            <span></span>
            <span></span>
            <span></span>
        </button>
    </nav>

    <div class="mobile-menu" id="mobileMenu">
        <div class="mobile-nav-item" id="mobileAuthContainer" style="padding: 1rem; border-bottom: 1px solid rgba(0,0,0,0.1);">
            <button class="auth-nav-btn" id="mobileSignInBtn" style="width: 100%;">Sign In</button>
        </div>
        <div class="mobile-nav-item">
            <a href="/" class="mobile-nav-link">Home</a>
        </div>
        <div class="mobile-nav-item">
            <a href="/pickem" class="mobile-nav-link">Pick'em</a>
        </div>
        <div class="mobile-nav-item">
            <a href="https://sixershoops.com/roster" class="mobile-nav-link">Roster</a>
        </div>
        <div class="mobile-nav-item">
            <a href="https://sixershoops.com/salary" class="mobile-nav-link">Salary Breakdown</a>
        </div>
        <div class="mobile-nav-item">
            <a href="https://sixershoops.com/sixers-depth-chart" class="mobile-nav-link">Depth Chart</a>
        </div>
        <div class="mobile-nav-item">
            <a href="https://sixershoops.com/future-draft-picks" class="mobile-nav-link">Draft Picks</a>
        </div>
        <div class="mobile-nav-item">
            <a href="https://sixershoops.com/schedule" class="mobile-nav-link">Schedule</a>
        </div>
        <div class="mobile-nav-item">
            <a href="https://sixershoops.com/contact" class="mobile-nav-link">Contact</a>
        </div>
    </div>

    <!-- Auth Modal -->
    <div class="auth-modal-overlay" id="authModalOverlay">
        <div class="auth-modal">
            <button class="auth-modal-close" id="authModalClose">&times;</button>
            <div class="auth-modal-header">
                <h2 class="auth-modal-title">Sixers Hoops</h2>
            </div>
            <div class="auth-modal-tabs">
                <button class="auth-modal-tab active" data-tab="login">Login</button>
                <button class="auth-modal-tab" data-tab="register">Sign Up</button>
            </div>
            <div class="auth-modal-content">
                <div id="navAuthMessage" class="auth-message"></div>
                
                <!-- Login Form -->
                <form id="navLoginForm">
                    <div class="auth-form-group">
                        <label class="auth-label">Email</label>
                        <input type="email" class="auth-input" id="navLoginEmail" required>
                    </div>
                    <div class="auth-form-group">
                        <label class="auth-label">Password</label>
                        <input type="password" class="auth-input" id="navLoginPassword" required>
                    </div>
                    <div style="text-align: right; margin-bottom: 1rem;">
                        <a href="#" id="forgotPasswordLink" class="auth-helper-link">Forgot Password?</a>
                    </div>
                    <button type="submit" class="auth-submit-btn">Sign In</button>
                </form>

                <!-- Forgot Password Form -->
                <form id="navForgotForm" style="display: none;">
                    <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1.5rem; text-align: center;">Enter your email address and we'll send you a link to reset your password.</p>
                    <div class="auth-form-group">
                        <label class="auth-label">Email Address</label>
                        <input type="email" class="auth-input" id="navForgotEmail" required placeholder="name@example.com">
                    </div>
                    <button type="submit" class="auth-submit-btn">Send Reset Link</button>
                    <div style="text-align: center; margin-top: 1.5rem;">
                        <a href="#" id="backToLoginLink" class="auth-back-link">Back to Login</a>
                    </div>
                </form>

                <!-- Register Form -->
                <form id="navRegisterForm" style="display: none;">
                    <div class="auth-form-group">
                        <label class="auth-label">Username</label>
                        <input type="text" class="auth-input" id="navRegisterUsername" required>
                    </div>
                    <div class="auth-form-group">
                        <label class="auth-label">Email</label>
                        <input type="email" class="auth-input" id="navRegisterEmail" required>
                    </div>
                    <div class="auth-form-group">
                        <label class="auth-label">Password</label>
                        <input type="password" class="auth-input" id="navRegisterPassword" required>
                    </div>
                    <div class="auth-form-group">
                        <label class="auth-label">Confirm Password</label>
                        <input type="password" class="auth-input" id="navRegisterConfirm" required>
                    </div>
                    <button type="submit" class="auth-submit-btn">Create Account</button>
                </form>
            </div>
        </div>
    </div>
    `;

    // Footer HTML
    const footerHTML = `
    <footer class="footer">
        <div class="footer-content">
            <div class="footer-section">
                <a href="/" class="footer-brand">
                    <img src="https://sixershoops.com/sixershoopslogonew.png" alt="Sixers Hoops Logo" class="footer-logo">
                    <span class="footer-brand-name">SIXERS HOOPS</span>
                </a>
                <p class="footer-tagline">Your source for Philadelphia 76ers analysis and insights.</p>
            </div>
            
            <div class="footer-section">
                <h3 class="footer-title">Quick Links</h3>
                <ul class="footer-links">
                    <li><a href="/">Home</a></li>
                    <li><a href="/pickem">Pick'em</a></li>
                    <li><a href="https://sixershoops.com/schedule">Schedule</a></li>
                    <li><a href="https://sixershoops.com/contact">Contact</a></li>
                </ul>
            </div>
            
            <div class="footer-section">
                <h3 class="footer-title">Policies</h3>
                <ul class="footer-links">
                    <li><a href="/privacy-policy">Privacy Policy</a></li>
                    <li><a href="/cookie-policy">Cookie Policy</a></li>
                    <li><a href="/terms-of-service">Terms of Service</a></li>
                    <li><a href="/disclaimer">Disclaimer</a></li>
                </ul>
            </div>
        </div>
        
        <div class="footer-bottom">
            <p>&copy; 2025 Sixers Hoops. All rights reserved.</p>
        </div>
    </footer>
    `;

    // Insert navbar at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    
    // Insert footer at the end of body
    document.body.insertAdjacentHTML('beforeend', footerHTML);

    // === Firebase Logic ===
    const firebaseConfig = {
        apiKey: "AIzaSyBzMlBV5gbZZlg_eTwNWrRDrhx-_ATIPS0",
        authDomain: "pickem-1e12b.firebaseapp.com",
        projectId: "pickem-1e12b",
        storageBucket: "pickem-1e12b.firebasestorage.app",
        messagingSenderId: "715626120695",
        appId: "1:715626120695:web:4942646cf3d6ca7e181af2",
        measurementId: "G-B22K71F01E"
    };

    // Make these globally accessible
    window.auth = null;
    window.db = null;
    
    function initFirebase() {
        if (typeof firebase === 'undefined' || !firebase.apps.length) {
            if (typeof firebase !== 'undefined') {
                firebase.initializeApp(firebaseConfig);
                window.auth = firebase.auth();
                window.db = firebase.firestore();
                setupAuthListeners();
            } else {
                setTimeout(initFirebase, 200);
            }
        } else {
            window.auth = firebase.auth();
            window.db = firebase.firestore();
            setupAuthListeners();
        }
    }

    function setupAuthListeners() {
        window.auth.onAuthStateChanged(user => {
            const authNav = document.getElementById('authNavContainer');
            const mobileAuth = document.getElementById('mobileAuthContainer');
            
            if (user) {
                const displayName = user.displayName || user.email.split('@')[0];
                const initial = displayName.charAt(0).toUpperCase();
                
                const userHTML = `
                    <div class="user-profile-wrapper">
                        <div class="user-profile-btn" id="userProfileBtn">
                            <div class="user-avatar">${initial}</div>
                            <span class="user-name">${displayName}</span>
                        </div>
                        <div class="user-dropdown" id="userDropdown">
                            <div class="user-dropdown-header">
                                <strong>${displayName}</strong>
                                <span>${user.email}</span>
                            </div>
                            <div class="user-dropdown-divider"></div>
                            <button class="user-dropdown-item" id="navLogoutBtnMain">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                Logout
                            </button>
                        </div>
                    </div>
                `;
                
                if (authNav) authNav.innerHTML = userHTML;
                if (mobileAuth) {
                    mobileAuth.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <div class="user-profile-btn">
                                <div class="user-avatar">${initial}</div>
                                <span class="user-name">${displayName}</span>
                            </div>
                            <button class="logout-btn" id="navLogoutBtn">Logout</button>
                        </div>
                    `;
                }
                
                const profileBtn = document.getElementById('userProfileBtn');
                const userDropdown = document.getElementById('userDropdown');
                const logoutBtnMain = document.getElementById('navLogoutBtnMain');

                if (profileBtn && userDropdown) {
                    profileBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        userDropdown.classList.toggle('active');
                    });

                    document.addEventListener('click', () => {
                        userDropdown.classList.remove('active');
                    });
                }

                if (logoutBtnMain) {
                    logoutBtnMain.addEventListener('click', () => window.auth.signOut());
                }
            } else {
                if (authNav) authNav.innerHTML = '<button class="auth-nav-btn" id="navSignInBtn">Sign In</button>';
                if (mobileAuth) mobileAuth.innerHTML = '<button class="auth-nav-btn" id="mobileSignInBtn" style="width: 100%;">Sign In</button>';
                
                const signInBtn = document.getElementById('navSignInBtn');
                const mobileSignInBtn = document.getElementById('mobileSignInBtn');
                if(signInBtn) signInBtn.addEventListener('click', openAuthModal);
                if(mobileSignInBtn) mobileSignInBtn.addEventListener('click', openAuthModal);
            }
            
            const mobileLogout = document.getElementById('navLogoutBtn');
            if(mobileLogout) mobileLogout.addEventListener('click', () => window.auth.signOut());
        });
    }

    initFirebase();

    // === Modal Logic ===
    const modal = document.getElementById('authModalOverlay');
    const closeBtn = document.getElementById('authModalClose');
    const tabs = document.querySelectorAll('.auth-modal-tab');
    const loginForm = document.getElementById('navLoginForm');
    const registerForm = document.getElementById('navRegisterForm');
    const forgotForm = document.getElementById('navForgotForm');
    const authMessage = document.getElementById('navAuthMessage');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const backToLoginLink = document.getElementById('backToLoginLink');

    function openAuthModal() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Reset to login view when opening
        if (tabs[0]) tabs[0].click();
    }

    function closeAuthModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        authMessage.className = 'auth-message';
        authMessage.textContent = '';
        // Reset forms
        if (loginForm) loginForm.reset();
        if (registerForm) registerForm.reset();
        if (forgotForm) forgotForm.reset();
    }

    if(closeBtn) closeBtn.addEventListener('click', closeAuthModal);
    if(modal) modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAuthModal();
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if (tab.dataset.tab === 'login') {
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
                forgotForm.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
                forgotForm.style.display = 'none';
            }
        });
    });

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'none';
            forgotForm.style.display = 'block';
            tabs.forEach(t => t.classList.remove('active'));
        });
    }

    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (tabs[0]) tabs[0].click();
        });
    }

    function showNavMessage(msg, type) {
        authMessage.textContent = msg;
        authMessage.className = `auth-message show ${type}`;
    }

    if(loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('navLoginEmail').value;
        const password = document.getElementById('navLoginPassword').value;
        
        try {
            await auth.signInWithEmailAndPassword(email, password);
            closeAuthModal();
        } catch (err) {
            showNavMessage(err.message, 'error');
        }
    });

    if(forgotForm) forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('navForgotEmail').value;
        
        try {
            await auth.sendPasswordResetEmail(email);
            showNavMessage('Password reset email sent! Check your inbox.', 'success');
            setTimeout(() => {
                if (tabs[0]) tabs[0].click();
            }, 3000);
        } catch (err) {
            showNavMessage(err.message, 'error');
        }
    });

    if(registerForm) registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('navRegisterUsername').value;
        const email = document.getElementById('navRegisterEmail').value;
        const password = document.getElementById('navRegisterPassword').value;
        const confirm = document.getElementById('navRegisterConfirm').value;
        
        if (password !== confirm) {
            showNavMessage('Passwords do not match', 'error');
            return;
        }
        
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName: username });
            await db.collection('users').doc(userCredential.user.uid).set({
                username: username,
                email: email,
                createdAt: new Date().toISOString()
            });
            showNavMessage('Account created! Please sign in.', 'success');
            setTimeout(() => tabs[0].click(), 1500);
        } catch (err) {
            showNavMessage(err.message, 'error');
        }
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenuBtn.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking a link
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (mobileMenuBtn && mobileMenu) {
                mobileMenuBtn.classList.remove('active');
                mobileMenu.classList.remove('active');
            }
        });
    });

    // Active link highlighting based on current page
    const currentLocation = location.pathname;
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentLocation || 
            (currentLocation === '/' && link.getAttribute('href') === '/')) {
            link.classList.add('active');
        }
    });

    // Scroll effect on navbar
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    const htmlElement = document.documentElement;
    
    // Load saved theme preference - default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Apply theme immediately to prevent flash
    if (savedTheme === 'dark') {
        htmlElement.classList.add('dark-mode');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    }
    
    if(themeToggle) themeToggle.addEventListener('click', function() {
        const isDark = htmlElement.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        if (sunIcon && moonIcon) {
            if (isDark) {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
            } else {
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
            }
        }
    });
});
