// Elite Navigation JavaScript - Universal Auto-Injection
document.addEventListener('DOMContentLoaded', function() {
  // AUTO-INJECT NAVBAR HTML INTO ANY PAGE
  const navbarHTML = `
    <!-- PREMIUM SPORTS NAVIGATION -->
    <nav class="navbar" id="navbar">
      <!-- Dynamic Brand Section -->
      <a href="index.html" class="nav-brand">
        <div class="nav-logo">76</div>
        <div class="brand-text">
          <div class="brand-name">SixersHoops</div>
          <div class="brand-tagline">Elite Basketball Intel</div>
        </div>
      </a>

      <!-- Elegant Navigation Menu -->
      <ul class="nav-menu">
        <li class="nav-item">
          <a href="index.html" class="nav-link">Home</a>
        </li>
        <li class="nav-item">
          <a href="news.html" class="nav-link">Latest News</a>
        </li>
        <li class="nav-item dropdown">
          <button class="dropdown-toggle">Team Hub</button>
          <div class="dropdown-menu">
            <a href="roster.html" class="dropdown-item">Roster</a>
            <a href="stats.html" class="dropdown-item">Stats</a>
            <a href="salary.html" class="dropdown-item">Salary Breakdown</a>
            <a href="depth.html" class="dropdown-item">Depth Chart</a>
            <a href="future-draft-picks.html" class="dropdown-item">Future Draft Picks</a>

          </div>
        </li>
        <li class="nav-item dropdown">
          <button class="dropdown-toggle">Trade Machine</button>
          <div class="dropdown-menu">
            <a href="trade-machine.html" class="dropdown-item">Trade Machine</a>
            <a href="mockdrafts.html" class="dropdown-item">Mock Drafts</a>
          </div>
        </li>
        <li class="nav-item">
          <a href="schedule.html" class="nav-link">Schedule</a>
        </li>
        <li class="nav-item">
          <a href="contact.html" class="nav-link">Contact Us</a>
        </li>
        // ...

// Elegant Navigation Menu
<ul class="nav-menu">
  <li class="nav-item">
    <a href="index.html" class="nav-link">Home</a>
  </li>
  <li class="nav-item">
    <a href="news.html" class="nav-link">Latest News</a>
  </li>
  <li class="nav-item dropdown">
    <button class="dropdown-toggle">Team Hub</button>
    <div class="dropdown-menu">
      <a href="roster.html" class="dropdown-item">Roster</a>
      <a href="stats.html" class="dropdown-item">Stats</a>
      <a href="salary.html" class="dropdown-item">Salary Breakdown</a>
      <a href="depth.html" class="dropdown-item">Depth Chart</a>
      <a href="future-draft-picks.html" class="dropdown-item">Future Draft Picks</a>
    </div>
  </li>
  <li class="nav-item dropdown">
    <button class="dropdown-toggle">Trade Machine</button>
    <div class="dropdown-menu">
      <a href="trade-machine.html" class="dropdown-item">Trade Machine</a>
      <a href="mockdrafts.html" class="dropdown-item">Mock Drafts</a>
    </div>
  </li>
  <li class="nav-item">
    <a href="schedule.html" class="nav-link">Schedule</a>
  </li>
  <li class="nav-item">
    <a href="contact.html" class="nav-link">Contact Us</a>
  </li>
  <li class="nav-item">
    <a href="/draft" class="nav-link">Draft</a>
  </li>
</ul>

// ...
      </ul>

      <!-- Mobile Menu Button -->
      <button class="mobile-menu-btn" id="mobileMenuBtn" aria-expanded="false" aria-label="Toggle mobile menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>

    <!-- Mobile Menu -->
    <div class="mobile-menu" id="mobileMenu">
      <div class="mobile-nav-item">
        <a href="index.html" class="mobile-nav-link">Home</a>
      </div>
      <div class="mobile-nav-item">
        <a href="news.html" class="mobile-nav-link">Latest News</a>
      </div>
      <div class="mobile-nav-item">
        <a href="roster.html" class="mobile-nav-link">Team Hub</a>
      </div>
      <div class="mobile-nav-item">
        <a href="trade-machine.html" class="mobile-nav-link">Trade Machine</a>
      </div>
      <div class="mobile-nav-item">
        <a href="schedule.html" class="mobile-nav-link">Schedule</a>
      </div>
      <div class="mobile-nav-item">
        <a href="contact.html" class="mobile-nav-link">Contact Us</a>
      </div>
    </div>
  `;

  // Inject navbar at the beginning of body (or replace the comment)
  const navbarComment = document.querySelector('body').innerHTML.includes('<!-- Navbar will be automatically inserted here by nav.js -->');
  
  if (navbarComment) {
    // Replace the comment with actual navbar
    document.body.innerHTML = document.body.innerHTML.replace(
      '<!-- Navbar will be automatically inserted here by nav.js -->',
      navbarHTML
    );
  } else {
    // If no comment found, insert at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
  }

  // Now get the elements after injection
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
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Dropdown accessibility
  const dropdowns = document.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    
    if (toggle) {
      toggle.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          dropdown.classList.toggle('active');
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('active');
        }
      });
    }
  });

  // Active link highlighting based on current page
  function setActiveLink() {
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      const linkHref = link.getAttribute('href');
      const linkFile = linkHref.split('/').pop();
      
      if (linkFile === currentFile || 
          (currentFile === '' && linkFile === 'index.html') ||
          (currentPath === '/' && linkFile === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  // Set active link on page load
  setActiveLink();

  // Update active link on navigation (for SPAs)
  window.addEventListener('popstate', setActiveLink);
});
