// Elite Navigation JavaScript - Universal Auto-Injection
document.addEventListener('DOMContentLoaded', function () {
  // -------------  NAVBAR HTML  -------------
  const navbarHTML = `
    <!-- PREMIUM SPORTS NAVIGATION -->
    <nav class="navbar" id="navbar">
      <!-- Dynamic Brand Section -->
      <a href="/" class="nav-brand">
        <div class="nav-logo">76</div>
        <div class="brand-text">
          <div class="brand-name">SixersHoops</div>
          <div class="brand-tagline">Elite Basketball Intel</div>
        </div>
      </a>

      <!-- Elegant Navigation Menu -->
      <ul class="nav-menu">
        <li class="nav-item"><a href="/" class="nav-link">Home</a></li>
        <li class="nav-item"><a href="/news" class="nav-link">Latest News</a></li>
        <li class="nav-item dropdown">
          <button class="dropdown-toggle">Team Hub</button>
          <div class="dropdown-menu">
            <a href="/roster" class="dropdown-item">Roster</a>
            <a href="/stats" class="dropdown-item">Stats</a>
            <a href="/salary" class="dropdown-item">Salary Breakdown</a>
            <a href="/depth" class="dropdown-item">Depth Chart</a>
            <a href="/future-draft-picks" class="dropdown-item">Future Draft Picks</a>
          </div>
        </li>
        <li class="nav-item dropdown">
          <button class="dropdown-toggle">Trade Machine</button>
          <div class="dropdown-menu">
            <a href="/nba-trade-machine" class="dropdown-item">Trade Machine</a>
            <a href="/mockdrafts" class="dropdown-item">Mock Drafts</a>
          </div>
        </li>
        <li class="nav-item"><a href="/schedule" class="nav-link">Schedule</a></li>
        <li class="nav-item"><a href="/contact" class="nav-link">Contact Us</a></li>
      </ul>

      <!-- Mobile Menu Button -->
      <button class="mobile-menu-btn" id="mobileMenuBtn" aria-expanded="false" aria-label="Toggle mobile menu">
        <span></span><span></span><span></span>
      </button>
    </nav>

    <!-- Mobile Menu -->
    <div class="mobile-menu" id="mobileMenu">
      <div class="mobile-nav-item"><a href="/" class="mobile-nav-link">Home</a></div>
      <div class="mobile-nav-item"><a href="/news" class="mobile-nav-link">Latest News</a></div>
      <div class="mobile-nav-item"><a href="/roster" class="mobile-nav-link">Team Hub</a></div>
      <div class="mobile-nav-item"><a href="/nba-trade-machine" class="mobile-nav-link">Trade Machine</a></div>
      <div class="mobile-nav-item"><a href="/schedule" class="mobile-nav-link">Schedule</a></div>
      <div class="mobile-nav-item"><a href="/contact" class="mobile-nav-link">Contact Us</a></div>
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
    menuBtn.setAttribute('aria-expanded', mobile.classList.contains('active'));
  });

  // Close mobile menu on outside click
  document.addEventListener('click', e => {
    if (!navbar?.contains(e.target) && !mobile?.contains(e.target)) {
      menuBtn?.classList.remove('active');
      mobile?.classList.remove('active');
      menuBtn?.setAttribute('aria-expanded', 'false');
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
