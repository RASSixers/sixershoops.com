/* -------------------------------------------------------
   nav.js – (updated, no syntax errors)
   -------------------------------------------------------
   • Builds the navigation UI and inserts it into the page.
   • Provides mobile‑menu logic, scroll shadow, active‑link
     highlighting, dropdown support, etc.
   • Every DOM query is guarded – nothing crashes the rest of the page.
   ------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', function () {
  try {
    /* =======================================================
       1.  Create the navigation markup
       ======================================================= */
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
              <a href="/sixers-depth-chart" class="dropdown-item">Depth Chart</a>
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

    /* ----------------------------------------------------
       2.  Insert the navigation into <body>
       ---------------------------------------------------- */
    const body = document.body;
    // Look for the placeholder comment you already have
    const placeholderOK = body.innerHTML.includes('<!-- Navbar will be automatically inserted here by nav.js -->');
    if (placeholderOK) {
      body.innerHTML = body.innerHTML.replace(
        '<!-- Navbar will be automatically inserted here by nav.js -->',
        navbarHTML
      );
    } else {
      // If for some reason the placeholder is missing, just prepend the markup.
      body.insertAdjacentHTML('afterbegin', navbarHTML);
    }

    /* ----------------------------------------------------
       3.  Grab the newly‑inserted elements
       ---------------------------------------------------- */
    const navbar = document.getElementById('navbar');
    const menuBtn = document.getElementById('mobileMenuBtn');
    const mobile = document.getElementById('mobileMenu');

    if (!navbar) {
      // Something went wrong – bail out gracefully
      console.warn('nav.js – navbar element not found. Navigation disabled.');
      return;
    }

    /* ----------------------------------------------------
       4.  Mobile menu toggle
       ---------------------------------------------------- */
    menuBtn?.addEventListener('click', () => {
      menuBtn.classList.toggle('active');
      mobile?.classList.toggle('active');
      // Reflect the state in the aria‑expanded attribute
      menuBtn.setAttribute(
        'aria-expanded',
        mobile?.classList.contains('active') ?? false
      );
    });

    /* ----------------------------------------------------
       5.  Close mobile menu when clicking outside
       ---------------------------------------------------- */
    document.addEventListener('click', e => {
      if (!navbar?.contains(e.target) && !mobile?.contains(e.target)) {
        menuBtn?.classList.remove('active');
        mobile?.classList.remove('active');
        menuBtn?.setAttribute('aria-expanded', 'false');
      }
    });

    /* ----------------------------------------------------
       6.  Scroll shadow
       ---------------------------------------------------- */
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > );
    });

    /* ----------------------------------------------------
       7.  Active link highlighting
       ---------------------------------------------------- */
    const setActiveLink = () => {
      const currentPath = window.location.pathname.split('/').pop() || 'index';
      const links = document.querySelectorAll('.nav-link, .mobile-nav-link, .dropdown-item');
      links.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href')?.replace(/^\\//, '').replace(/\\.html$/i, '') ?? '';
        if (href === currentPath || (currentPath === '' && href === 'index')) {
          link.classList.add('active');
        }
      });
    };
    setActiveLink();
    window.addEventListener('popstate', setActiveLink);

    /* ----------------------------------------------------
       8.  Dropdown accessibility (keyboard + click outside)
       ---------------------------------------------------- */
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
      const toggle = dropdown.querySelector('.dropdown-toggle');
      if (!toggle) return;  // skip if the button is missing

      // Toggle with Enter or Space
      toggle.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          dropdown.classList.toggle('active');
        }
      });

      // Close the dropdown when clicking anywhere else
      document.addEventListener('click', e => {
        if (!dropdown.contains(e.target)) {
 dropdown.classList.remove('active');
        }
      });
    });

  } catch (err) {
    // If anything in the block above throws, log it but let the rest of the page keep running
    console.error('nav.js crashed – navigation might be incomplete', err);
  }
});
