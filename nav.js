/* -------------------------------------------------------
   nav.js – “Elite Navigation JavaScript” – upgraded
   -------------------------------------------------------
   1.  Builds the navigation UI and injects it into the page.
   2.  Provides the same mobile‑menu, scroll‑shadow, active‑link,
       and dropdown behaviour that you had before.
   3.  Every `document.querySelector / getElementById` is wrapped
       in a check so that a missing element does not throw.
   4.  No function will run on a `null` reference – the entire
       block is executed inside a “try…catch”.
   ------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  try {
    /* ------------------------------------------------------------------
     *  1. INJECT THE NAVBAR (and the mobile menu) into the document.
     * ------------------------------------------------------------------ */
    const navbarHTML = \`
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
    \`;

    /* Insert or replace the placeholder that user left in the html */
    const body = document.body;
    const placeholder = body.innerHTML.includes('<!-- Navbar will be automatically inserted here by nav.js -->');
    if (placeholder) {
      body.innerHTML = body.innerHTML.replace(
        '<!-- Navbar will be automatically inserted here by nav.js -->',
        navbarHTML
      );
    } else {
      // If the placeholder is not present, just add at the top of the body.
      body.insertAdjacentHTML('afterbegin', navbarHTML);
    }

    /* ------------------------------------------------------------------
     *  2. SELECT DOM ELEMENTS FOR INTERACTIONS
     * ------------------------------------------------------------------ */
    const navbar   = document.getElementById('navbar');
    const menuBtn  = document.getElementById('mobileMenuBtn');
    const mobile   = document.getElementById('mobileMenu');

    if (!navbar) {          // If for some reason the nav wasn't inserted
      console.warn('nav.js – navbar element not found. Navigation disabled.');
      return;              // stop further logic
    }

    /* ------------------------------------------------------------------
     *  3. MOBILE MENU TOGGLE
     * ------------------------------------------------------------------ */
    menuBtn?.addEventListener('click', () => {
      menuBtn.classList.toggle('active');
      mobile?.classList.toggle('active');
      menuBtn.setAttribute(
        'aria-expanded',
        mobile?.classList.contains('active') ?? false
      );
    });

    /* ------------------------------------------------------------------
     *  4. CLOSE MOBILE MENU ON OUTSIDE CLICK
     * ------------------------------------------------------------------ */
    document.addEventListener('click', e => {
      // Use optional chaining – if any of these is null, the condition is true
      if (
        !navbar?.contains(e.target) &&
        !mobile?.contains(e.target)
      ) {
        menuBtn?.classList.remove('active');
        mobile?.classList.remove('active');
        menuBtn?.setAttribute('aria-expanded', 'false');
      }
    });

    /* ------------------------------------------------------------------
     *  5. SCROLL‑EFFECT ON NAV BAR
     * ------------------------------------------------------------------ */
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });

    /* ------------------------------------------------------------------
     *  6. ACTIVE LINK HIGHLIGHTING
     * ------------------------------------------------------------------ */
    const setActiveLink = () => {
      const currentPath = window.location.pathname.split('/').pop() || 'index';
      // Query all link types that may exist – the selector will simply return nothing if an element is absent
      const links = document.querySelectorAll('.nav-link, .mobile-nav-link, .dropdown-item');
      links.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href')?.replace(/^\\//, '').replace(/\\.html$/i, '') ?? '';
        if (
          href === currentPath ||
          (currentPath === '' && href === 'index')
        ) {
          link.classList.add('active');
        }
      });
    };

    setActiveLink();
    window.addEventListener('popstate', setActiveLink);

    /* ------------------------------------------------------------------
     *  7. DROPDOWN ACCESSIBILITY
     * ------------------------------------------------------------------ */
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
      const toggle = dropdown.querySelector('.dropdown-toggle');
      if (!toggle) return;  // skip if the toggle button is missing

      // Keyboard support (Enter or Space toggles)
      toggle.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          dropdown.classList.toggle('active');
        }
      });

      // Close when clicking outside
      document.addEventListener('click', e => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('active');
        }
      });
    });
  } catch ( {
    // If *any* line throws, log the error and continue.
    console.error('nav.js crashed – navigation might be incomplete', err);
  }
});
