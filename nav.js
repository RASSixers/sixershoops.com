// Elite Navigation JavaScript - Universal Auto-Injection
document.addEventListener('DOMContentLoaded', function () {
  // Prevent double initialization
  if (window.__NAVBAR_INITIALIZED__) return;
  window.__NAVBAR_INITIALIZED__ = true;

  // -------------  NAVBAR HTML  -------------
  const navbarHTML = `
    <!-- PREMIUM SPORTS NAVIGATION -->
    <nav class="navbar" id="navbar">
      <!-- Dynamic Brand Section -->
      <a href="https://sixershoops.com/" class="nav-brand">
        <div class="nav-logo">76</div>
        <div class="brand-text">
          <div class="brand-name">SixersHoops</div>
          <div class="brand-tagline">Elite Basketball Intel</div>
        </div>
      </a>

      <!-- Elegant Navigation Menu -->
      <ul class="nav-menu">
        <li class="nav-item"><a href="https://sixershoops.com/" class="nav-link">Home</a></li>
        <li class="nav-item"><a href="https://sixershoops.com/news" class="nav-link">Latest News</a></li>
        <li class="nav-item dropdown">
          <button class="dropdown-toggle">Team Hub</button>
          <div class="dropdown-menu">
            <a href="https://sixershoops.com/roster" class="dropdown-item">Roster</a>
            <a href="https://sixershoops.com/salary" class="dropdown-item">Salary Breakdown</a>
            <a href="https://sixershoops.com/sixers-depth-chart" class="dropdown-item">Depth Chart</a>
            <a href="https://sixershoops.com/future-draft-picks" class="dropdown-item">Future Draft Picks</a>
            <a href="https://sixershoops.com/nba-trade-machine" class="dropdown-item">Trade Machine</a>
          </div>
        </li>
        <li class="nav-item"><a href="https://sixershoops.com/schedule" class="nav-link">Schedule</a></li>

        <li class="nav-item"><a href="https://sixershoops.com/contact" class="nav-link">Contact Us</a></li>
      </ul>

      <!-- Mobile Menu Button -->
      <button class="mobile-menu-btn" id="mobileMenuBtn" aria-expanded="false" aria-label="Toggle mobile menu">
        <span></span><span></span><span></span>
      </button>
    </nav>

    <!-- Mobile Menu -->
    <div class="mobile-menu" id="mobileMenu">
      <div class="mobile-nav-item"><a href="https://sixershoops.com/" class="mobile-nav-link">Home</a></div>
      <div class="mobile-nav-item"><a href="https://sixershoops.com/news" class="mobile-nav-link">Latest News</a></div>

      <div class="mobile-nav-item">
        <button class="mobile-collapsible" id="mobileTeamHubToggle" aria-expanded="false" aria-controls="mobileTeamHubMenu">Team Hub</button>
        <div class="mobile-submenu" id="mobileTeamHubMenu">
          <a href="https://sixershoops.com/roster" class="mobile-nav-link">Roster</a>
          <a href="https://sixershoops.com/salary" class="mobile-nav-link">Salary Breakdown</a>
          <a href="https://sixershoops.com/sixers-depth-chart" class="mobile-nav-link">Depth Chart</a>
          <a href="https://sixershoops.com/future-draft-picks" class="mobile-nav-link">Future Draft Picks</a>
          <a href="https://sixershoops.com/nba-trade-machine" class="mobile-nav-link">Trade Machine</a>
        </div>
      </div>

      <div class="mobile-nav-item"><a href="https://sixershoops.com/schedule" class="mobile-nav-link">Schedule</a></div>

      <div class="mobile-nav-item"><a href="https://sixershoops.com/contact" class="mobile-nav-link">Contact Us</a></div>
    </div>
  `;

  // -------------  INJECT NAVBAR  -------------
  // Safely insert without rewriting the whole body (prevents losing event listeners on mobile)
  document.body.insertAdjacentHTML('afterbegin', navbarHTML);
  // Remove legacy placeholder comment if present, without touching other markup
  try {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.includes('Navbar will be automatically inserted here by nav.js')) {
        node.parentNode && node.parentNode.removeChild(node);
        break;
      }
    }
  } catch (_) {}

  // -------------  NAVBAR LOGIC  -------------
  const navbar   = document.getElementById('navbar');
  const menuBtn  = document.getElementById('mobileMenuBtn');
  const mobile   = document.getElementById('mobileMenu');
  const navMenu  = document.querySelector('.nav-menu');

  // Enforce mobile-only hamburger via JS (overrides page-specific CSS if needed)
  function applyResponsiveNav() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      if (navMenu) navMenu.style.display = 'none';
      if (menuBtn) menuBtn.style.display = 'flex';
    } else {
      if (navMenu) navMenu.style.display = 'flex';
      if (menuBtn) menuBtn.style.display = 'none';
      // Ensure menu is closed when leaving mobile
      if (mobile?.classList.contains('active')) {
        mobile.classList.remove('active');
        menuBtn?.classList.remove('active');
        menuBtn?.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
      }
    }
  }
  applyResponsiveNav();
  window.addEventListener('resize', applyResponsiveNav);

  // Mobile menu toggle (single binding)
  if (menuBtn && mobile && !menuBtn.__bound) {
    menuBtn.__bound = true;
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menuBtn.classList.toggle('active');
      mobile.classList.toggle('active');
      const isOpen = mobile.classList.contains('active');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('no-scroll', isOpen);
      document.documentElement.classList.toggle('no-scroll', isOpen);
    });

    // Prevent clicks inside menu from closing accidentally
    mobile.addEventListener('click', (e) => {
      const link = e.target.closest('a.mobile-nav-link');
      if (link) {
        menuBtn.classList.remove('active');
        mobile.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
        return;
      }
      e.stopPropagation();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobile.classList.contains('active')) return;
      const clickedInsideNavbar = e.target.closest('#navbar') || e.target.closest('#mobileMenu');
      if (!clickedInsideNavbar) {
        menuBtn.classList.remove('active');
        mobile.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
        document.documentElement.classList.remove('no-scroll');
      }
    });
  }

  // Collapsible submenus
  document.querySelectorAll('.mobile-collapsible').forEach(btn => {
    const targetId = btn.getAttribute('aria-controls');
    const panel = document.getElementById(targetId);
    if (!panel) return;
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      panel.classList.toggle('open', !expanded);
    });
  });

  // Remove duplicate global outside-click closer (handled above)
  // (kept intentionally empty to avoid double-closing bugs)
  // document.addEventListener('click', ...) removed

  // Scroll effect
  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Active link highlighting (domain-safe, handles .html and index)
  function setActiveLink() {
    const normalize = (p) => {
      if (!p) return '/';
      p = p.replace(/\/index\.html?$/i, '/').replace(/\/$/, '');
      return p === '' ? '/' : p.toLowerCase();
    };
    const currentPath = normalize(window.location.pathname);
    document.querySelectorAll('.nav-link, .mobile-nav-link, .dropdown-item').forEach(link => {
      link.classList.remove('active');
      const linkPath = normalize(new URL(link.getAttribute('href'), window.location.origin).pathname);
      if (linkPath === currentPath || (currentPath === '/' && (linkPath === '/' || linkPath === '/index'))) {
        link.classList.add('active');
      }
    });
  }
  setActiveLink();
  window.addEventListener('popstate', setActiveLink);
  // Close mobile menu when switching to desktop width
  window.addEventListener('resize', () => {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileBtn = document.getElementById('mobileMenuBtn');
    if (window.innerWidth > 768 && mobileMenu?.classList.contains('active')) {
      mobileMenu.classList.remove('active');
      mobileBtn?.classList.remove('active');
      mobileBtn?.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('no-scroll');
      document.documentElement.classList.remove('no-scroll');
    }
  });
});

// ============================================
// PREMIUM FOOTER - AUTO-INJECTION
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  // Prevent double initialization
  if (window.__FOOTER_INITIALIZED__) return;
  window.__FOOTER_INITIALIZED__ = true;

  // -------------  FOOTER HTML  -------------
  const footerHTML = `
    <!-- PREMIUM SPORTS FOOTER -->
    <footer class="site-footer">
      <div class="footer-container">
        <div class="footer-content">
          <!-- Brand Section -->
          <div class="footer-section footer-brand">
            <div class="footer-logo-wrapper">
              <div class="footer-logo-icon">76</div>
              <div class="footer-brand-text">
                <h3 class="footer-logo">SixersHoops</h3>
                <p class="footer-subtitle">Elite Basketball Intel</p>
              </div>
            </div>
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
              <li><a href="https://sixershoops.com/">Home</a></li>
              <li><a href="https://sixershoops.com/roster">Roster</a></li>
              <li><a href="https://sixershoops.com/schedule">Schedule</a></li>
              <li><a href="https://sixershoops.com/stats">Stats</a></li>
              <li><a href="https://sixershoops.com/news">News</a></li>
            </ul>
          </div>

          <!-- Tools Section -->
          <div class="footer-section">
            <h4 class="footer-heading">Tools</h4>
            <ul class="footer-links">
              <li><a href="https://sixershoops.com/salary">Salary Cap</a></li>
              <li><a href="https://sixershoops.com/nba-trade-machine">Trade Machine</a></li>
              <li><a href="https://sixershoops.com/sixers-depth-chart">Depth Chart</a></li>
              <li><a href="https://sixershoops.com/future-draft-picks">Future Picks</a></li>
            </ul>
          </div>

          <!-- Legal Section -->
          <div class="footer-section">
            <h4 class="footer-heading">Legal & Info</h4>
            <ul class="footer-links">
              <li><a href="https://sixershoops.com/terms-of-service">Terms of Service</a></li>
              <li><a href="https://sixershoops.com/privacy-policy">Privacy Policy</a></li>
              <li><a href="https://sixershoops.com/cookie-policy">Cookie Policy</a></li>
              <li><a href="https://sixershoops.com/contact">About Us</a></li>
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
    </footer>
  `;

  // -------------  INJECT FOOTER  -------------
  document.body.insertAdjacentHTML('beforeend', footerHTML);
});
