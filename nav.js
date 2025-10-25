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
        <div class="brand-text">
          <div class="brand-name">SixersHoops</div>
          <div class="brand-tagline">Elite Basketball Intel</div>
        </div>
      </a>

      <!-- Navigation Menu -->
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
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 8c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span>Roster</span>
            </a>
            <a href="https://sixershoops.com/salary" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zM8 4a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5A.75.75 0 008 4zm0 7a1 1 0 110 2 1 1 0 010-2z"/>
              </svg>
              <span>Salary Cap</span>
            </a>
            <a href="https://sixershoops.com/sixers-depth-chart" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 3h14v2H1V3zm0 4h14v2H1V7zm0 4h14v2H1v-2z"/>
              </svg>
              <span>Depth Chart</span>
            </a>
            <a href="https://sixershoops.com/future-draft-picks" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M14 2H2a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V3a1 1 0 00-1-1zM8 11.5l-3.5-3.5h2.25V4h2.5v4h2.25L8 11.5z"/>
              </svg>
              <span>Draft Picks</span>
            </a>
            <a href="https://sixershoops.com/nba-trade-machine" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11 2v4l1.5-1.5L14 6V2h-3zm-6 8v4H2v-4l1.5 1.5L5 10zM8 4a4 4 0 110 8 4 4 0 010-8z"/>
              </svg>
              <span>Trade Machine</span>
            </a>
          </div>
        </li>
        <li class="nav-item"><a href="https://sixershoops.com/schedule" class="nav-link">Schedule</a></li>
        <li class="nav-item"><a href="https://sixershoops.com/contact" class="nav-link">Contact</a></li>
      </ul>

      <!-- Auth Actions -->
      <div class="nav-auth" id="navAuth">
        <button id="loginBtn" class="btn-login" title="Login with Google">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span id="authText">Login</span>
        </button>
        <div id="profileMenu" class="profile-menu" style="display: none;">
          <button id="profileHeader" class="profile-header" style="cursor: pointer; background: none; border: none; width: 100%;">
            <div id="profileAvatar" class="profile-avatar"></div>
            <div class="profile-info">
              <div id="profileName" class="profile-name"></div>
              <div id="profileEmail" class="profile-email"></div>
            </div>
          </button>
          <button id="logoutBtn" class="profile-logout">Logout</button>
        </div>
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

  // ============================================
  // GOOGLE OAUTH LOGIN
  // ============================================
  if (window.appwriteClient) {
    const account = new Appwrite.Account(window.appwriteClient);
    const loginBtn = document.getElementById('loginBtn');
    const profileMenu = document.getElementById('profileMenu');
    const authText = document.getElementById('authText');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');

    async function checkAuthStatus() {
      try {
        const session = await account.getSession('current');
        const user = await account.get();
        if (user && session) {
          showProfileMenu(user);
        }
      } catch (e) {
        showLoginButton();
      }
    }

    function showLoginButton() {
      loginBtn.style.display = 'inline-flex';
      profileMenu.style.display = 'none';
      authText.textContent = 'Login';
    }

    function showProfileMenu(user) {
      loginBtn.style.display = 'none';
      profileMenu.style.display = 'block';
      profileName.textContent = user.name || 'User';
      profileEmail.textContent = user.email;
      
      // Generate avatar from initials
      const initials = (user.name || user.email || 'U')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      profileAvatar.textContent = initials;
    }

    loginBtn.addEventListener('click', async () => {
      try {
        const redirectUrl = window.location.origin + window.location.pathname + '?oauth_success=true';
        await account.createOAuth2Session('google', redirectUrl, redirectUrl);
      } catch (e) {
        console.error('Login failed:', e);
        alert('Login failed. Please try again.');
      }
    });

    logoutBtn.addEventListener('click', async () => {
      try {
        await account.deleteSession('current');
        showLoginButton();
        window.location.reload();
      } catch (e) {
        console.error('Logout failed:', e);
      }
    });

    // Check auth status on page load
    checkAuthStatus();

    // Clean up OAuth success query parameter
    if (window.location.search.includes('oauth_success=true')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Toggle profile menu on avatar click
    const profileHeader = document.getElementById('profileHeader');
    if (profileHeader) {
      profileHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = profileMenu.style.display === 'block';
        profileMenu.style.display = isVisible ? 'none' : 'block';
      });
    }

    // Close profile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-auth')) {
        profileMenu.style.display = 'none';
      }
    });

    // Re-check auth every 30 seconds
    setInterval(checkAuthStatus, 30000);
  }
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
        <div class="footer-content">
          <!-- Brand Section -->
          <div class="footer-section footer-brand">
            <div class="footer-logo-wrapper">
              <div class="footer-brand-text">
                <h3 class="footer-logo">SixersHoops</h3>
                <p class="footer-subtitle">Elite Basketball Intel</p>
              </div>
            </div>
            <p class="footer-tagline">Your comprehensive hub for Philadelphia 76ers coverage, delivering breaking news and real-time updates.</p>
            <div class="footer-social">
              <a href="https://x.com/Sixers_Hoops" class="social-link" aria-label="Twitter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
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
