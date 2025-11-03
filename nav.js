// Navbar Injection Script
document.addEventListener('DOMContentLoaded', function() {
    const navbarHTML = `
    <nav class="navbar">
        <a href="/" class="nav-brand">
            <div class="nav-logo">SH</div>
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
            <button class="icon-btn" aria-label="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
            </button>
            <button class="icon-btn" aria-label="Menu">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="4" x2="20" y1="12" y2="12"></line>
                    <line x1="4" x2="20" y1="6" y2="6"></line>
                    <line x1="4" x2="20" y1="18" y2="18"></line>
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
    `;

    // Insert navbar at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);

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
});
