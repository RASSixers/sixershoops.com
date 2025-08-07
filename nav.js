// Elite Navigation JavaScript - Universal Auto-Injection with Clean URLs
document.addEventListener('DOMContentLoaded', function() {
  // Check if navbar already exists to prevent duplicate injection
  if (document.getElementById('navbar')) {
    initializeNavbar();
    return;
  }

  // AUTO-INJECT NAVBAR HTML INTO ANY PAGE
  const navbarHTML = `
    <!-- PREMIUM SPORTS NAVIGATION -->
    <nav class="navbar" id="navbar">
      <!-- Dynamic Brand Section -->
      <a href="/" class="nav-brand" data-route="/">
        <div class="nav-logo">76</div>
        <div class="brand-text">
          <div class="brand-name">SixersHoops</div>
          <div class="brand-tagline">Elite Basketball Intel</div>
        </div>
      </a>

      <!-- Elegant Navigation Menu -->
      <ul class="nav-menu">
        <li class="nav-item">
          <a href="/" class="nav-link" data-route="/">Home</a>
        </li>
        <li class="nav-item">
          <a href="/news" class="nav-link" data-route="/news">Latest News</a>
        </li>
        <li class="nav-item dropdown">
          <button class="dropdown-toggle">Team Hub</button>
          <div class="dropdown-menu">
            <a href="/roster" class="dropdown-item" data-route="/roster">Roster</a>
            <a href="/stats" class="dropdown-item" data-route="/stats">Stats</a>
            <a href="/salary" class="dropdown-item" data-route="/salary">Salary Breakdown</a>
            <a href="/depth" class="dropdown-item" data-route="/depth">Depth Chart</a>
            <a href="/draft" class="dropdown-item" data-route="/draft">Future Draft Picks</a>
          </div>
        </li>
        <li class="nav-item dropdown">
          <button class="dropdown-toggle">Trade Machine</button>
          <div class="dropdown-menu">
            <a href="/trade-machine" class="dropdown-item" data-route="/trade-machine">Trade Machine</a>
            <a href="/mockdrafts" class="dropdown-item" data-route="/mockdrafts">Mock Drafts</a>
          </div>
        </li>
        <li class="nav-item">
          <a href="/schedule" class="nav-link" data-route="/schedule">Schedule</a>
        </li>
        <li class="nav-item">
          <a href="/contact" class="nav-link" data-route="/contact">Contact Us</a>
        </li>
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
        <a href="/" class="mobile-nav-link" data-route="/">Home</a>
      </div>
      <div class="mobile-nav-item">
        <a href="/news" class="mobile-nav-link" data-route="/news">Latest News</a>
      </div>
      <div class="mobile-nav-item">
        <a href="/roster" class="mobile-nav-link" data-route="/roster">Team Hub</a>
      </div>
      <div class="mobile-nav-item">
        <a href="/trade-machine" class="mobile-nav-link" data-route="/trade-machine">Trade Machine</a>
      </div>
      <div class="mobile-nav-item">
        <a href="/schedule" class="mobile-nav-link" data-route="/schedule">Schedule</a>
      </div>
      <div class="mobile-nav-item">
        <a href="/contact" class="mobile-nav-link" data-route="/contact">Contact Us</a>
      </div>
    </div>
  `;

  // Inject navbar safely
  try {
    const navbarComment = document.body.innerHTML.includes('<!-- Navbar will be automatically inserted here by nav.js -->');
    
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
    
    // Initialize navbar functionality after injection
    setTimeout(initializeNavbar, 100); // Small delay to ensure DOM is ready
  } catch (error) {
    console.error('Error injecting navbar:', error);
  }

  // Handle clean URL routing
  handleCleanURLs();
});

// Separate function to initialize navbar functionality
function initializeNavbar() {
  // Get the elements after injection
  const navbar = document.getElementById('navbar');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!navbar) {
    console.error('Navbar not found after injection');
    return;
  }

  // Mobile menu toggle
  if (mobileMenuBtn && mobileMenu) {
    // Remove any existing event listeners to prevent duplicates
    const newMobileMenuBtn = mobileMenuBtn.cloneNode(true);
    mobileMenuBtn.parentNode.replaceChild(newMobileMenuBtn, mobileMenuBtn);
    
    newMobileMenuBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      newMobileMenuBtn.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      
      // Update aria attributes
      const isExpanded = mobileMenu.classList.contains('active');
      newMobileMenuBtn.setAttribute('aria-expanded', isExpanded);
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!navbar.contains(event.target) && !mobileMenu.contains(event.target)) {
        newMobileMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        newMobileMenuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Navbar scroll effect
  if (navbar) {
    // Remove existing scroll listeners to prevent duplicates
    window.removeEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll);
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
      // Remove existing listeners to prevent duplicates
      const newToggle = toggle.cloneNode(true);
      toggle.parentNode.replaceChild(newToggle, toggle);
      
      newToggle.addEventListener('keydown', function(e) {
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

  // Set active link on page load
  setActiveLink();

  // Update active link on navigation (for SPAs)
  window.removeEventListener('popstate', setActiveLink);
  window.addEventListener('popstate', setActiveLink);
}

// Scroll handler function
function handleScroll() {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
}

// Handle clean URL routing
function handleCleanURLs() {
  // Route mapping for clean URLs
  const routeMap = {
    '/': 'index.html',
    '/news': 'news.html',
    '/roster': 'roster.html',
    '/stats': 'stats.html',
    '/salary': 'salary.html',
    '/depth': 'depth.html',
    '/draft': 'draft.html',
    '/trade-machine': 'trade-machine.html',
    '/mockdrafts': 'mockdrafts.html',
    '/schedule': 'schedule.html',
    '/contact': 'contact.html'
  };

  // Handle navigation clicks
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[data-route]');
    if (!link) return;

    const route = link.getAttribute('data-route');
    const actualFile = routeMap[route];
    
    if (actualFile) {
      e.preventDefault();
      
      // Update URL without page reload
      if (route === '/') {
        history.pushState(null, '', '/');
      } else {
        history.pushState(null, '', route);
      }
      
      // Navigate to actual file
      window.location.href = actualFile;
    }
  });

  // Handle browser back/forward buttons
  window.addEventListener('popstate', function() {
    const currentPath = window.location.pathname;
    const actualFile = routeMap[currentPath] || 'index.html';
    
    // Only navigate if we're not already on the correct page
    const currentFile = window.location.href.split('/').pop();
    if (currentFile !== actualFile) {
      window.location.href = actualFile;
    }
  });
}

// Active link highlighting based on current page
function setActiveLink() {
  const currentPath = window.location.pathname;
  let currentRoute = currentPath;
  
  // Map file names back to clean routes for highlighting
  const fileToRouteMap = {
    'index.html': '/',
    'news.html': '/news',
    'roster.html': '/roster',
    'stats.html': '/stats',
    'salary.html': '/salary',
    'depth.html': '/depth',
    'draft.html': '/draft',
    'trade-machine.html': '/trade-machine',
    'mockdrafts.html': '/mockdrafts',
    'schedule.html': '/schedule',
    'contact.html': '/contact'
  };
  
  // Get current file name
  const currentFile = window.location.href.split('/').pop() || 'index.html';
  currentRoute = fileToRouteMap[currentFile] || currentPath;
  
  // Remove active class from all links
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link, .dropdown-item');
  navLinks.forEach(link => {
    link.classList.remove('active');
  });
  
  // Add active class to current page link
  const activeLinks = document.querySelectorAll(`[data-route="${currentRoute}"]`);
  activeLinks.forEach(link => {
    link.classList.add('active');
  });
  
  // Special case for home page
  if (currentRoute === '/' || currentFile === 'index.html' || currentFile === '') {
    const homeLinks = document.querySelectorAll('[data-route="/"]');
    homeLinks.forEach(link => {
      link.classList.add('active');
    });
  }
}

// Initialize on page load if DOM is already ready
if (document.readyState === 'loading') {
  // DOM is still loading, wait for DOMContentLoaded
} else {
  // DOM is already loaded
  if (!document.getElementById('navbar')) {
    // Navbar not injected yet, do it now
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
  } else {
    initializeNavbar();
  }
}
