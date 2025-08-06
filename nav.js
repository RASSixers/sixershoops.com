const navbarHTML = `
<nav class="navbar" id="navbar">
  <a href="/" class="nav-brand">
    <div class="nav-logo">🏀</div>
    <div class="brand-text">
      <div class="brand-name">SixersHoops</div>
      <div class="brand-tagline">Ultimate Sixers Resource</div>
    </div>
  </a>

  <ul class="nav-menu" id="navMenu">
    <li class="nav-item">
      <a href="https://sixershoops.com/salary" class="nav-link">💰 Salary</a>
    </li>
    <li class="nav-item dropdown">
      <a href="#" class="dropdown-toggle">📊 Analysis</a>
      <div class="dropdown-menu">
        <a href="https://sixershoops.com/draft" class="dropdown-item">🏀 Draft Capital</a>
        <a href="https://sixershoops.com/depth" class="dropdown-item">📈 Depth Chart</a>
        <a href="https://sixershoops.com/roster" class="dropdown-item">👥 Current Roster</a>
      </div>
    </li>
    <li class="nav-item">
      <a href="https://sixershoops.com/nba-trade-machine" class="nav-link">🔄 Trade Machine</a>
    </li>
    <li class="nav-item">
      <a href="#" class="nav-link">📰 News</a>
    </li>
  </ul>

  <a href="https://sixershoops.com/salary" class="nav-cta">Explore Now</a>

  <div class="mobile-menu-btn" id="mobileMenuBtn" aria-expanded="false" aria-label="Toggle mobile menu">
    <span></span>
    <span></span>
    <span></span>
  </div>
</nav>

<div class="mobile-menu" id="mobileMenu">
  <div class="mobile-nav-item">
    <a href="https://sixershoops.com/salary" class="mobile-nav-link">💰 Salary Breakdown</a>
  </div>
  <div class="mobile-nav-item">
    <a href="https://sixershoops.com/draft" class="mobile-nav-link">🏀 Draft Capital</a>
  </div>
  <div class="mobile-nav-item">
    <a href="https://sixershoops.com/depth" class="mobile-nav-link">📈 Depth Chart</a>
  </div>
  <div class="mobile-nav-item">
    <a href="https://sixershoops.com/roster" class="mobile-nav-link">👥 Current Roster</a>
  </div>
  <div class="mobile-nav-item">
    <a href="https://sixershoops.com/nba-trade-machine" class="mobile-nav-link">🔄 Trade Machine</a>
  </div>
  <div class="mobile-nav-item">
    <a href="#" class="mobile-nav-link">📰 Latest News</a>
  </div>
</div>`;

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Insert navbar at the beginning of body
  document.body.insertAdjacentHTML('afterbegin', navbarHTML);
  
  // Initialize navbar functionality
  initializeNavbar();
});

function initializeNavbar() {
  const navbar = document.getElementById('navbar');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  // Mobile menu toggle
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', function() {
      mobileMenuBtn.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      
      // Update aria attributes
      const isExpanded = mobileMenu.classList.contains('active');
      mobileMenuBtn.setAttribute('aria-expanded', isExpanded);
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!navbar.contains(event.target) && !mobileMenu.contains(event.target)) {
        mobileMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Navbar scroll effect
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // Dropdown functionality
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      const dropdown = this.parentElement;
      dropdown.classList.toggle('active');
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown').forEach(dropdown => {
        dropdown.classList.remove('active');
      });
    }
  });
}
