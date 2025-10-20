// Sleek Modern Navigation JavaScript
document.addEventListener('DOMContentLoaded', function () {
  // Prevent double initialization
  if (window.__NAVBAR_INITIALIZED__) return;
  window.__NAVBAR_INITIALIZED__ = true;

  // -------------  NAVBAR HTML  -------------
  const navbarHTML = `
    <!-- SLEEK MODERN NAVIGATION -->
    <nav class="navbar" id="navbar">
      <!-- Brand Section -->
      <a href="https://sixershoops.com/" class="nav-brand">
        <svg class="brand-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="currentColor" opacity="0.9"/>
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" stroke="currentColor" stroke-width="1.5" fill="none"/>
        </svg>
        <div class="brand-text">
          <div class="brand-name">SixersHoops</div>
          <div class="brand-tagline">Elite Basketball Intel</div>
        </div>
      </a>

      <!-- Center Navigation Menu -->
      <ul class="nav-menu">
        <li class="nav-item"><a href="https://sixershoops.com/" class="nav-link">Home</a></li>
        <li class="nav-item"><a href="https://sixershoops.com/news" class="nav-link">News</a></li>
        <li class="nav-item dropdown">
          <button class="dropdown-toggle">
            Team
            <svg class="dropdown-arrow" width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="dropdown-menu">
            <a href="https://sixershoops.com/roster" class="dropdown-item">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 8c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span>Roster</span>
            </a>
            <a href="https://sixershoops.com/salary" class="dropdown-item">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zM8 4a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5A.75.75 0 008 4zm0 7a1 1 0 110 2 1 1 0 010-2z"/>
              </svg>
              <span>Salary Cap</span>
            </a>
            <a href="https://sixershoops.com/sixers-depth-chart" class="dropdown-item">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 3h14v2H1V3zm0 4h14v2H1V7zm0 4h14v2H1v-2z"/>
              </svg>
              <span>Depth Chart</span>
            </a>
            <a href="https://sixershoops.com/future-draft-picks" class="dropdown-item">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M14 2H2a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V3a1 1 0 00-1-1zM8 11.5l-3.5-3.5h2.25V4h2.5v4h2.25L8 11.5z"/>
              </svg>
              <span>Draft Picks</span>
            </a>
            <a href="https://sixershoops.com/nba-trade-machine" class="dropdown-item">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11 2v4l1.5-1.5L14 6V2h-3zm-6 8v4H2v-4l1.5 1.5L5 10zM8 4a4 4 0 110 8 4 4 0 010-8z"/>
              </svg>
              <span>Trade Machine</span>
            </a>
          </div>
        </li>
        <li class="nav-item"><a href="https://sixershoops.com/schedule" class="nav-link">Schedule</a></li>
        <li class="nav-item"><a href="https://sixershoops.com/contact" class="nav-link">Contact</a></li>
      </ul>

      <!-- Right Side CTA -->
      <div class="nav-actions">
        <a href="https://sixershoops.com/news" class="nav-cta">
          Latest Updates
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>

      <!-- Mobile Menu Button -->
      <button class="mobile-menu-btn" id="mobileMenuBtn" aria-expanded="false" aria-label="Toggle mobile menu">
        <span></span><span></span><span></span>
      </button>
    </nav>

    <!-- Mobile Menu -->
    <div class="mobile-menu" id="mobileMenu">
      <div class="mobile-nav-item">
        <a href="https://sixershoops.com/" class="mobile-nav-link">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1l7 7h-2v7h-4V9H7v6H3V8H1l7-7z"/>
          </svg>
          Home
        </a>
      </div>
      
      <div class="mobile-nav-item">
        <a href="https://sixershoops.com/news" class="mobile-nav-link">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2h10v2H2V2zm0 4h12v2H2V6zm0 4h8v2H2v-2zm12-6v10H1V4h13z"/>
          </svg>
          News
        </a>
      </div>

      <div class="mobile-nav-item">
        <button class="mobile-collapsible" id="mobileTeamToggle" aria-expanded="false" aria-controls="mobileTeamMenu">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 8c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          Team Hub
        </button>
        <div class="mobile-submenu" id="mobileTeamMenu">
          <a href="https://sixershoops.com/roster" class="mobile-nav-link">Roster</a>
          <a href="https://sixershoops.com/salary" class="mobile-nav-link">Salary Cap</a>
          <a href="https://sixershoops.com/sixers-depth-chart" class="mobile-nav-link">Depth Chart</a>
          <a href="https://sixershoops.com/future-draft-picks" class="mobile-nav-link">Draft Picks</a>
          <a href="https://sixershoops.com/nba-trade-machine" class="mobile-nav-link">Trade Machine</a>
        </div>
      </div>

      <div class="mobile-nav-item">
        <a href="https://sixershoops.com/schedule" class="mobile-nav-link">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 2h-2V1H4v1H2a1 1 0 00-1 1v11a1 1 0 001 1h12a1 1 0 001-1V3a1 1 0 00-1-1zM3 5h10v8H3V5z"/>
          </svg>
          Schedule
        </a>
      </div>

      <div class="mobile-nav-item">
        <a href="https://sixershoops.com/contact" class="mobile-nav-link">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm1 11H7v-2h2v2zm0-3H7V4h2v5z"/>
          </svg>
          Contact
        </a>
      </div>

      <div class="mobile-nav-cta">
        <a href="https://sixershoops.com/news" class="mobile-cta-btn">
          Latest Updates
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
    </div>
  `;

  // -------------  INJECT NAVBAR  -------------
  document.body.insertAdjacentHTML('afterbegin', navbarHTML);
  
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

  function applyResponsiveNav() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      if (navMenu) navMenu.style.display = 'none';
      if (menuBtn) menuBtn.style.display = 'flex';
    } else {
      if (navMenu) navMenu.style.display = 'flex';
      if (menuBtn) menuBtn.style.display = 'none';
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

    mobile.addEventListener('click', (e) => {
      const link = e.target.closest('a.mobile-nav-link');
      if (link && !link.closest('.mobile-collapsible')) {
        menuBtn.classList.remove('active');
        mobile.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
        return;
      }
      e.stopPropagation();
    });

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

  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 20);
  });

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
// COMPACT FOOTER - REDESIGNED
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  if (window.__FOOTER_INITIALIZED__) return;
  window.__FOOTER_INITIALIZED__ = true;

  const footerHTML = `
    <footer class="site-footer">
      <div class="footer-container">
        <!-- Newsletter Section -->
        <div class="footer-newsletter">
          <div class="newsletter-content">
            <h3 class="newsletter-title">Stay In The Game</h3>
            <p class="newsletter-description">Get the latest 76ers news delivered to your inbox.</p>
          </div>
          <form class="newsletter-form" onsubmit="event.preventDefault(); alert('Newsletter signup coming soon!');">
            <input type="email" placeholder="Enter your email" class="newsletter-input" required>
            <button type="submit" class="newsletter-btn">
              Subscribe
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </form>
        </div>

        <div class="footer-content">
          <!-- Brand Section -->
          <div class="footer-section footer-brand">
            <div class="footer-logo-wrapper">
              <svg class="footer-brand-icon" width="28" height="28" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2"/>
                <path d="M16 8L20 16L16 24L12 16L16 8Z" fill="currentColor"/>
                <circle cx="16" cy="16" r="3" fill="currentColor"/>
              </svg>
              <div class="footer-brand-text">
                <h3 class="footer-logo">SixersHoops</h3>
                <p class="footer-subtitle">Elite Basketball Intel</p>
              </div>
            </div>
            <p class="footer-tagline">Your comprehensive hub for Philadelphia 76ers coverage, delivering breaking news and real-time updates.</p>
            <div class="footer-social">
              <a href="#" class="social-link" aria-label="Twitter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" class="social-link" aria-label="Facebook">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" class="social-link" aria-label="Instagram">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                </svg>
              </a>
              <a href="#" class="social-link" aria-label="YouTube">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Navigation Links -->
          <div class="footer-section">
            <h4 class="footer-heading">Navigation</h4>
            <ul class="footer-links">
              <li><a href="https://sixershoops.com/">Home</a></li>
              <li><a href="https://sixershoops.com/news">News</a></li>
              <li><a href="https://sixershoops.com/roster">Roster</a></li>
              <li><a href="https://sixershoops.com/schedule">Schedule</a></li>
              <li><a href="https://sixershoops.com/stats">Stats</a></li>
            </ul>
          </div>

          <!-- Team Resources -->
          <div class="footer-section">
            <h4 class="footer-heading">Team Resources</h4>
            <ul class="footer-links">
              <li><a href="https://sixershoops.com/salary">Salary Cap</a></li>
              <li><a href="https://sixershoops.com/nba-trade-machine">Trade Machine</a></li>
              <li><a href="https://sixershoops.com/sixers-depth-chart">Depth Chart</a></li>
              <li><a href="https://sixershoops.com/future-draft-picks">Draft Picks</a></li>
              <li><a href="https://sixershoops.com/injury-report">Injuries</a></li>
            </ul>
          </div>

          <!-- About & Legal -->
          <div class="footer-section">
            <h4 class="footer-heading">About & Legal</h4>
            <ul class="footer-links">
              <li><a href="https://sixershoops.com/contact">Contact</a></li>
              <li><a href="https://sixershoops.com/about">About</a></li>
              <li><a href="https://sixershoops.com/privacy-policy">Privacy</a></li>
              <li><a href="https://sixershoops.com/terms-of-service">Terms</a></li>
              <li><a href="https://sixershoops.com/cookie-policy">Cookies</a></li>
            </ul>
          </div>
        </div>

        <!-- Footer Bottom -->
        <div class="footer-bottom">
          <div class="footer-bottom-left">
            <p>&copy; ${new Date().getFullYear()} SixersHoops.com. All rights reserved.</p>
            <p class="footer-disclaimer">Not affiliated with the NBA or Philadelphia 76ers. All trademarks are property of their respective owners.</p>
          </div>
          <div class="footer-bottom-right">
            <a href="https://sixershoops.com/sitemap">Sitemap</a>
            <a href="https://sixershoops.com/accessibility">Accessibility</a>
            <a href="https://sixershoops.com/advertise">Advertise</a>
          </div>
        </div>
      </div>
    </footer>
  `;

  document.body.insertAdjacentHTML('beforeend', footerHTML);
});
