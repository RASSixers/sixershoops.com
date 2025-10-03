// SixersHoops Navigation & Footer - Auto-Injection System
document.addEventListener('DOMContentLoaded', function () {
  // Prevent double initialization
  if (window.__NAVBAR_INITIALIZED__) return;
  window.__NAVBAR_INITIALIZED__ = true;

  // ============================================================================
  // NAVBAR HTML
  // ============================================================================
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

  // ============================================================================
  // FOOTER HTML
  // ============================================================================
  const footerHTML = `
    <footer class="site-footer">
      <div class="footer-container">
        <!-- Brand -->
        <div class="footer-brand-section">
          <div class="footer-brand">
            <div class="footer-logo">76</div>
            <div class="footer-brand-text">SixersHoops</div>
          </div>
          <p class="footer-description">Your premier source for Philadelphia 76ers news, analysis, stats, and insights. Stay updated with the latest on your favorite team.</p>
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
        </div>

        <!-- Navigation -->
        <div class="footer-section">
          <h3 class="footer-title">Navigation</h3>
          <ul class="footer-links">
            <li><a href="https://sixershoops.com/" class="footer-link">Home</a></li>
            <li><a href="https://sixershoops.com/news" class="footer-link">News</a></li>
            <li><a href="https://sixershoops.com/roster" class="footer-link">Roster</a></li>
            <li><a href="https://sixershoops.com/stats" class="footer-link">Stats</a></li>
            <li><a href="https://sixershoops.com/schedule" class="footer-link">Schedule</a></li>
          </ul>
        </div>

        <!-- Resources -->
        <div class="footer-section">
          <h3 class="footer-title">Resources</h3>
          <ul class="footer-links">
            <li><a href="https://sixershoops.com/salary" class="footer-link">Salary Cap</a></li>
            <li><a href="https://sixershoops.com/sixers-depth-chart" class="footer-link">Depth Chart</a></li>
            <li><a href="https://sixershoops.com/future-draft-picks" class="footer-link">Draft Picks</a></li>
            <li><a href="https://sixershoops.com/nba-trade-machine" class="footer-link">Trade Machine</a></li>
          </ul>
        </div>

        <!-- Company -->
        <div class="footer-section">
          <h3 class="footer-title">Company</h3>
          <ul class="footer-links">
            <li><a href="https://sixershoops.com/about" class="footer-link">About</a></li>
            <li><a href="https://sixershoops.com/contact" class="footer-link">Contact</a></li>
            <li><a href="https://sixershoops.com/advertise" class="footer-link">Advertise</a></li>
          </ul>
        </div>
      </div>

      <!-- Footer Bottom -->
      <div class="footer-bottom">
        <p class="footer-copyright">
          &copy; ${new Date().getFullYear()} SixersHoops.com. All rights reserved. Not affiliated with the Philadelphia 76ers or NBA.
        </p>
        <ul class="footer-legal-links">
          <li><a href="https://sixershoops.com/privacy-policy" class="footer-legal-link">Privacy</a></li>
          <li><a href="https://sixershoops.com/terms-of-service" class="footer-legal-link">Terms</a></li>
          <li><a href="https://sixershoops.com/disclaimer" class="footer-legal-link">Disclaimer</a></li>
        </ul>
      </div>
    </footer>
  `;

  // ============================================================================
  // INJECT NAVBAR & FOOTER
  // ============================================================================
  document.body.insertAdjacentHTML('afterbegin', navbarHTML);
  document.body.insertAdjacentHTML('beforeend', footerHTML);

  // ============================================================================
  // NAVBAR FUNCTIONALITY
  // ============================================================================
  const navbar = document.getElementById('navbar');
  const menuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const navMenu = document.querySelector('.nav-menu');

  // Responsive navigation
  function applyResponsiveNav() {
    const isMobile = window.innerWidth <= 968;
    if (isMobile) {
      if (navMenu) navMenu.style.display = 'none';
      if (menuBtn) menuBtn.style.display = 'flex';
    } else {
      if (navMenu) navMenu.style.display = 'flex';
      if (menuBtn) menuBtn.style.display = 'none';
      closeMobileMenu();
    }
  }

  // Close mobile menu
  function closeMobileMenu() {
    if (mobileMenu?.classList.contains('active')) {
      mobileMenu.classList.remove('active');
      menuBtn?.classList.remove('active');
      menuBtn?.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('no-scroll');
      document.documentElement.classList.remove('no-scroll');
    }
  }

  // Mobile menu toggle
  if (menuBtn && mobileMenu && !menuBtn.__bound) {
    menuBtn.__bound = true;
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menuBtn.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      const isOpen = mobileMenu.classList.contains('active');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('no-scroll', isOpen);
      document.documentElement.classList.toggle('no-scroll', isOpen);
    });

    // Close menu when clicking a link
    mobileMenu.addEventListener('click', (e) => {
      if (e.target.closest('a.mobile-link')) {
        closeMobileMenu();
        return;
      }
      e.stopPropagation();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobileMenu.classList.contains('active')) return;
      const clickedInside = e.target.closest('#navbar') || e.target.closest('#mobileMenu');
      if (!clickedInside) closeMobileMenu();
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

  // Initialize
  applyResponsiveNav();
  setActiveLink();

  // Event listeners
  window.addEventListener('resize', () => {
    applyResponsiveNav();
    if (window.innerWidth > 968) closeMobileMenu();
  });
  window.addEventListener('popstate', setActiveLink);
});
