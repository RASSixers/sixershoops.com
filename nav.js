// Elite Navigation JavaScript - Universal Auto-Injection
document.addEventListener('DOMContentLoaded', function () {
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
        <li class="nav-item"><a href="https://sixershoops.com/live-game" class="nav-link">Live Game</a></li>
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
  const navbarComment = document.querySelector('body').innerHTML.includes('<!-- Navbar will be automatically inserted here by nav.js -->');
  if (navbarComment) {
    document.body.innerHTML = document.body.innerHTML.replace('<!-- Navbar will be automatically inserted here by nav.js -->', navbarHTML);
  } else {
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
  }

  // -------------  NAVBAR LOGIC  -------------
  const navbar   = document.getElementById('navbar');
  const menuBtn  = document.getElementById('mobileMenuBtn');
  const mobile   = document.getElementById('mobileMenu');

  // Mobile menu toggle
  menuBtn?.addEventListener('click', () => {
    menuBtn.classList.toggle('active');
    mobile.classList.toggle('active');
    const isOpen = mobile.classList.contains('active');
    menuBtn.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('no-scroll', isOpen);
  });

  // Close menu when a mobile link is clicked
  mobile?.addEventListener('click', (e) => {
    const link = e.target.closest('a.mobile-nav-link');
    if (!link) return;
    menuBtn?.classList.remove('active');
    mobile.classList.remove('active');
    menuBtn?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
  });

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

  // Close mobile menu on outside click
  document.addEventListener('click', e => {
    if (!navbar?.contains(e.target) && !mobile?.contains(e.target)) {
      menuBtn?.classList.remove('active');
      mobile?.classList.remove('active');
      menuBtn?.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('no-scroll');
    }
  });

  // Scroll effect
  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Active link highlighting (works with or without .html)
  function setActiveLink() {
    const current = window.location.pathname.split('/').pop() || 'index';
    document.querySelectorAll('.nav-link, .mobile-nav-link, .dropdown-item').forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href').replace(/^\/|\.html$/g, '');
      if (href === current || (current === '' && href === 'index')) {
        link.classList.add('active');
      }
    });
  }
  setActiveLink();
  window.addEventListener('popstate', setActiveLink);
});
