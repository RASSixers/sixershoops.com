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
            <a href="https://sixershoops.com/stats" class="dropdown-item">Stats</a>
            <a href="https://sixershoops.com/salary" class="dropdown-item">Salary Breakdown</a>
            <a href="https://sixershoops.com/sixers-depth-chart" class="dropdown-item">Depth Chart</a>
            <a href="https://sixershoops.com/future-draft-picks" class="dropdown-item">Future Draft Picks</a>
          </div>
        </li>
        <li class="nav-item dropdown">
          <button class="dropdown-toggle">Trade Machine</button>
          <div class="dropdown-menu">
            <a href="https://sixershoops.com/nba-trade-machine" class="dropdown-item">Trade Machine</a>
            <!-- Removed mockdrafts dead link -->
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
          <a href="https://sixershoops.com/stats" class="mobile-nav-link">Stats</a>
          <a href="https://sixershoops.com/salary" class="mobile-nav-link">Salary Breakdown</a>
          <a href="https://sixershoops.com/sixers-depth-chart" class="mobile-nav-link">Depth Chart</a>
          <a href="https://sixershoops.com/future-draft-picks" class="mobile-nav-link">Future Draft Picks</a>
        </div>
      </div>

      <div class="mobile-nav-item">
        <button class="mobile-collapsible" id="mobileTradeToggle" aria-expanded="false" aria-controls="mobileTradeMenu">Trade Machine</button>
        <div class="mobile-submenu" id="mobileTradeMenu">
          <a href="https://sixershoops.com/nba-trade-machine" class="mobile-nav-link">Trade Machine</a>
          <!-- Removed mockdrafts dead link -->
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
