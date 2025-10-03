// Elite Navigation & Footer JavaScript - Universal Auto-Injection
document.addEventListener('DOMContentLoaded', function () {
  // Prevent double initialization
  if (window.__NAVBAR_INITIALIZED__) return;
  window.__NAVBAR_INITIALIZED__ = true;

  // -------------  NAVBAR HTML  -------------
  const navbarHTML = `
    <nav class="navbar" id="navbar">
      <a href="https://sixershoops.com/" class="nav-brand">
        <div class="nav-logo">76</div>
        <span class="brand-name">SixersHoops</span>
      </a>

      <ul class="nav-menu">
        <li><a href="https://sixershoops.com/" class="nav-link">Home</a></li>
        <li><a href="https://sixershoops.com/news" class="nav-link">News</a></li>
        <li class="dropdown">
          <button class="dropdown-toggle">Team</button>
          <div class="dropdown-menu">
            <a href="https://sixershoops.com/roster" class="dropdown-item">Roster</a>
            <a href="https://sixershoops.com/stats" class="dropdown-item">Stats</a>
            <a href="https://sixershoops.com/salary" class="dropdown-item">Salary Cap</a>
            <a href="https://sixershoops.com/sixers-depth-chart" class="dropdown-item">Depth Chart</a>
            <a href="https://sixershoops.com/future-draft-picks" class="dropdown-item">Draft Picks</a>
          </div>
        </li>
        <li><a href="https://sixershoops.com/nba-trade-machine" class="nav-link">Trade Machine</a></li>
        <li><a href="https://sixershoops.com/schedule" class="nav-link">Schedule</a></li>
        <li><a href="https://sixershoops.com/contact" class="nav-link">Contact</a></li>
      </ul>

      <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </nav>

    <div class="mobile-menu" id="mobileMenu">
      <a href="https://sixershoops.com/" class="mobile-link">Home</a>
      <a href="https://sixershoops.com/news" class="mobile-link">News</a>
      <button class="mobile-dropdown-toggle" id="mobileTeamToggle">Team</button>
      <div class="mobile-dropdown" id="mobileTeamMenu">
        <a href="https://sixershoops.com/roster" class="mobile-link">Roster</a>
        <a href="https://sixershoops.com/stats" class="mobile-link">Stats</a>
        <a href="https://sixershoops.com/salary" class="mobile-link">Salary Cap</a>
        <a href="https://sixershoops.com/sixers-depth-chart" class="mobile-link">Depth Chart</a>
        <a href="https://sixershoops.com/future-draft-picks" class="mobile-link">Draft Picks</a>
      </div>
      <a href="https://sixershoops.com/nba-trade-machine" class="mobile-link">Trade Machine</a>
      <a href="https://sixershoops.com/schedule" class="mobile-link">Schedule</a>
      <a href="https://sixershoops.com/contact" class="mobile-link">Contact</a>
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

    // Close menu when clicking a link
    mobile.addEventListener('click', (e) => {
      const link = e.target.closest('a.mobile-link');
      if (link) {
        menuBtn.classList.remove('active');
        mobile.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
        document.documentElement.classList.remove('no-scroll');
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

  // Mobile dropdown toggle
  const mobileTeamToggle = document.getElementById('mobileTeamToggle');
  const mobileTeamMenu = document.getElementById('mobileTeamMenu');
  if (mobileTeamToggle && mobileTeamMenu) {
    mobileTeamToggle.addEventListener('click', () => {
      mobileTeamMenu.classList.toggle('open');
      mobileTeamToggle.classList.toggle('open');
    });
  }

  // Remove duplicate global outside-click closer (handled above)
  // (kept intentionally empty to avoid double-closing bugs)
  // document.addEventListener('click', ...) removed

  // Scroll effect
  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Active link highlighting
  function setActiveLink() {
    const normalize = (p) => {
      if (!p) return '/';
      p = p.replace(/\/index\.html?$/i, '/').replace(/\/$/, '');
      return p === '' ? '/' : p.toLowerCase();
    };
    const currentPath = normalize(window.location.pathname);
    document.querySelectorAll('.nav-link, .mobile-link, .dropdown-item').forEach(link => {
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

  // =============================================================================
  // FOOTER INJECTION & LOGIC
  // =============================================================================
  
  // Prevent double footer initialization
  if (window.__FOOTER_INITIALIZED__) return;
  window.__FOOTER_INITIALIZED__ = true;

  // -------------  FOOTER HTML  -------------
  const footerHTML = `
    <footer class="site-footer">
      <div class="footer-content">
        <!-- Social Links -->
        <div class="social-links">
          <a href="https://twitter.com/sixershoops" class="social-link" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
            <i class="fab fa-twitter"></i>
          </a>
          <a href="https://facebook.com/sixershoops" class="social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
            <i class="fab fa-facebook-f"></i>
          </a>
          <a href="https://instagram.com/sixershoops" class="social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
            <i class="fab fa-instagram"></i>
          </a>
        </div>

        <!-- Legal Links -->
        <div class="footer-legal-links">
          <a href="https://sixershoops.com/terms-of-service" class="footer-legal-link">Terms of Service</a>
          <span class="footer-separator">•</span>
          <a href="https://sixershoops.com/privacy-policy" class="footer-legal-link">Privacy Policy</a>
          <span class="footer-separator">•</span>
          <a href="https://sixershoops.com/cookie-policy" class="footer-legal-link">Cookie Policy</a>
        </div>

        <!-- Copyright -->
        <p class="footer-copyright">
          &copy; ${new Date().getFullYear()} SixersHoops.com. All rights reserved.
        </p>
      </div>
    </footer>
  `;

  // -------------  INJECT FOOTER  -------------
  // Insert footer at the end of body
  document.body.insertAdjacentHTML('beforeend', footerHTML);

  // Optional: Smooth scroll to top functionality
  const footerLinks = document.querySelectorAll('.footer-link, .footer-legal-link');
  footerLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Only smooth scroll for internal links on the same page
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
});
