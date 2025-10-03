// ============================================
// NAVBAR COMPONENT
// ============================================

function createNavbar() {
    const nav = document.createElement('nav');
    nav.className = 'navbar';
    
    nav.innerHTML = `
        <!-- Brand -->
        <a href="/index.html" class="nav-brand">
            <div class="nav-logo">76</div>
            <div class="brand-text">
                <span class="brand-name">SixersHoops</span>
            </div>
        </a>

        <!-- Desktop Navigation -->
        <ul class="nav-menu">
            <li class="nav-item">
                <a href="/index.html" class="nav-link">Home</a>
            </li>
            <li class="nav-item">
                <a href="/news.html" class="nav-link">News</a>
            </li>
            <li class="nav-item dropdown">
                <span class="dropdown-toggle">Team</span>
                <div class="dropdown-menu">
                    <a href="/roster.html" class="dropdown-item">Roster</a>
                    <a href="/stats.html" class="dropdown-item">Stats</a>
                    <a href="/salary.html" class="dropdown-item">Salary Cap</a>
                    <a href="/depth.html" class="dropdown-item">Depth Chart</a>
                    <a href="/future-draft-picks.html" class="dropdown-item">Draft Picks</a>
                </div>
            </li>
            <li class="nav-item">
                <a href="/nba-trade-machine.html" class="nav-link">Trade Machine</a>
            </li>
            <li class="nav-item">
                <a href="/schedule.html" class="nav-link">Schedule</a>
            </li>
            <li class="nav-item">
                <a href="/contact.html" class="nav-link">Contact</a>
            </li>
        </ul>

        <!-- Mobile Menu Button -->
        <button class="mobile-menu-btn" aria-label="Toggle mobile menu">
            <span></span>
            <span></span>
            <span></span>
        </button>
    `;
    
    return nav;
}

function createMobileMenu() {
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu';
    
    mobileMenu.innerHTML = `
        <div class="mobile-nav-item">
            <a href="/index.html" class="mobile-nav-link">Home</a>
        </div>
        <div class="mobile-nav-item">
            <a href="/news.html" class="mobile-nav-link">News</a>
        </div>
        <div class="mobile-nav-item mobile-dropdown">
            <span class="mobile-dropdown-toggle">Team</span>
            <div class="mobile-dropdown-menu">
                <a href="/roster.html" class="mobile-dropdown-item">Roster</a>
                <a href="/stats.html" class="mobile-dropdown-item">Stats</a>
                <a href="/salary.html" class="mobile-dropdown-item">Salary Cap</a>
                <a href="/depth.html" class="mobile-dropdown-item">Depth Chart</a>
                <a href="/future-draft-picks.html" class="mobile-dropdown-item">Draft Picks</a>
            </div>
        </div>
        <div class="mobile-nav-item">
            <a href="/nba-trade-machine.html" class="mobile-nav-link">Trade Machine</a>
        </div>
        <div class="mobile-nav-item">
            <a href="/schedule.html" class="mobile-nav-link">Schedule</a>
        </div>
        <div class="mobile-nav-item">
            <a href="/contact.html" class="mobile-nav-link">Contact</a>
        </div>
    `;
    
    return mobileMenu;
}

function initializeNavigation() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Close mobile menu when clicking links
        const mobileLinks = mobileMenu.querySelectorAll('.mobile-nav-link, .mobile-dropdown-item');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Mobile dropdown toggle
        const mobileDropdownToggle = mobileMenu.querySelector('.mobile-dropdown-toggle');
        if (mobileDropdownToggle) {
            mobileDropdownToggle.addEventListener('click', () => {
                const dropdownMenu = mobileDropdownToggle.nextElementSibling;
                dropdownMenu.classList.toggle('active');
                mobileDropdownToggle.classList.toggle('active');
            });
        }
    }

    // Scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });

    // Highlight active page
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link, .dropdown-item');
    
    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (linkPath === currentPage) {
            link.classList.add('active');
        }
    });
}

// ============================================
// FOOTER COMPONENT
// ============================================

function createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    
    footer.innerHTML = `
        <div class="footer-container">
            <div class="footer-content">
                <!-- Brand Section -->
                <div class="footer-section footer-brand">
                    <h3 class="footer-logo">SixersHoops.com</h3>
                    <p class="footer-tagline">Your ultimate source for Philadelphia 76ers news, stats, and analysis.</p>
                    <div class="footer-social">
                        <a href="#" class="social-link" aria-label="Twitter">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                        </a>
                        <a href="#" class="social-link" aria-label="Facebook">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </a>
                        <a href="#" class="social-link" aria-label="Instagram">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                            </svg>
                        </a>
                    </div>
                </div>

                <!-- Quick Links Section -->
                <div class="footer-section">
                    <h4 class="footer-heading">Quick Links</h4>
                    <ul class="footer-links">
                        <li><a href="/index.html">Home</a></li>
                        <li><a href="/roster.html">Roster</a></li>
                        <li><a href="/schedule.html">Schedule</a></li>
                        <li><a href="/stats.html">Stats</a></li>
                        <li><a href="/news.html">News</a></li>
                    </ul>
                </div>

                <!-- Tools Section -->
                <div class="footer-section">
                    <h4 class="footer-heading">Tools</h4>
                    <ul class="footer-links">
                        <li><a href="/salary.html">Salary Cap</a></li>
                        <li><a href="/nba-trade-machine.html">Trade Machine</a></li>
                        <li><a href="/depth.html">Depth Chart</a></li>
                        <li><a href="/draft.html">Draft</a></li>
                        <li><a href="/future-draft-picks.html">Future Picks</a></li>
                    </ul>
                </div>

                <!-- Legal Section -->
                <div class="footer-section">
                    <h4 class="footer-heading">Legal</h4>
                    <ul class="footer-links">
                        <li><a href="/terms-of-service.html">Terms of Service</a></li>
                        <li><a href="/privacy-policy.html">Privacy Policy</a></li>
                        <li><a href="/cookie-policy.html">Cookie Policy</a></li>
                        <li><a href="/disclaimer.html">Disclaimer</a></li>
                        <li><a href="/contact.html">Contact Us</a></li>
                    </ul>
                </div>
            </div>

            <!-- Footer Bottom -->
            <div class="footer-bottom">
                <div class="footer-bottom-content">
                    <p class="copyright">
                        &copy; ${new Date().getFullYear()} SixersHoops.com. All rights reserved.
                    </p>
                    <p class="disclaimer-text">
                        Not affiliated with the NBA or Philadelphia 76ers. All team logos and trademarks are property of their respective owners.
                    </p>
                </div>
            </div>
        </div>
    `;
    
    return footer;
}

// ============================================
// AUTO-INITIALIZATION
// ============================================

function initializePage() {
    // Insert navbar at the beginning of body
    const navbar = createNavbar();
    const mobileMenu = createMobileMenu();
    document.body.insertBefore(mobileMenu, document.body.firstChild);
    document.body.insertBefore(navbar, document.body.firstChild);
    
    // Initialize navigation functionality
    initializeNavigation();
    
    // Append footer at the end of body
    const footer = createFooter();
    document.body.appendChild(footer);
}

// Auto-load when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}

// Export for manual usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createNavbar, createMobileMenu, createFooter, initializeNavigation };
}
