const navbarHTML = `
<nav class="navbar">
  <div class="nav-left">
    <img src="sixershoopslogo.png" alt="SixersHoops Logo" class="nav-logo" />
    <span class="site-title">SixersHoops</span>
  </div>
  <button class="hamburger" aria-label="Menu" aria-expanded="false" onclick="toggleMobileMenu()">
    <span></span>
    <span></span>
    <span></span>
  </button>
  <div class="nav-right" id="navRight">
    <a href="home" class="nav-link">Home</a>
    <div class="nav-dropdown">
      <button class="dropdown-btn" aria-haspopup="true" aria-expanded="false">Draft & Cap Management</button>
      <div class="dropdown-content">
        <a href="https://sixershoops.com/salary" class="dropdown-link">Salary Breakdown</a>
        <a href="https://sixershoops.com/draft" class="dropdown-link">Future Draft Capital</a>
        <a href="https://sixershoops.com/depth" class="dropdown-link">Depth Chart</a>
      </div>
    </div>
    <a href="https://sixershoops.com/nba-trade-machine" class="nav-link">Trade Machine</a>
    <a href="contact.html" class="nav-link">Contact Us</a>
  </div>
</nav>`;

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Insert navbar at the beginning of body
  document.body.insertAdjacentHTML('afterbegin', navbarHTML);
  
  // Initialize navbar functionality
  initializeNavbar();
});

// Mobile menu toggle function
function toggleMobileMenu() {
  const navRight = document.getElementById('navRight');
  const hamburger = document.querySelector('.hamburger');
  
  if (navRight && hamburger) {
    navRight.classList.toggle('open');
    const isOpen = navRight.classList.contains('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  }
}

function initializeNavbar() {
  // Dropdown functionality for desktop
  const dropdownBtns = document.querySelectorAll('.dropdown-btn');
  dropdownBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const dropdown = this.parentElement;
      const content = dropdown.querySelector('.dropdown-content');
      
      // Toggle dropdown
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !isExpanded);
      
      // Close other dropdowns
      dropdownBtns.forEach(otherBtn => {
        if (otherBtn !== this) {
          otherBtn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.nav-dropdown')) {
      dropdownBtns.forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', function(event) {
    const navRight = document.getElementById('navRight');
    const hamburger = document.querySelector('.hamburger');
    
    if (navRight && hamburger && !event.target.closest('.navbar')) {
      navRight.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}
