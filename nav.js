<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sixers Hoops Navbar</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    /* Navbar Styles */
    nav {
      width: 100%;
      background: white;
      border-bottom: 1px solid #f3f4f6;
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .nav-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .nav-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 5rem;
    }

    .logo {
      flex-shrink: 0;
    }

    .logo h1 {
      font-size: 1.5rem;
      font-weight: bold;
      letter-spacing: -0.025em;
    }

    .logo-highlight {
      color: #2563eb;
    }

    /* Desktop Navigation */
    .desktop-nav {
      display: none;
      align-items: center;
      gap: 0.25rem;
    }

    .nav-link {
      padding: 0.5rem 1rem;
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s;
      border-radius: 0.5rem;
    }

    .nav-link:hover {
      color: #2563eb;
      background: #eff6ff;
    }

    .nav-button {
      margin-left: 0.5rem;
      padding: 0.625rem 1.25rem;
      background: #2563eb;
      color: white;
      font-weight: 500;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      text-decoration: none;
      display: inline-block;
    }

    .nav-button:hover {
      background: #1d4ed8;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    /* Dropdown */
    .dropdown {
      position: relative;
    }

    .dropdown-button {
      display: flex;
      align-items: center;
      padding: 0.5rem 1rem;
      color: #374151;
      font-weight: 500;
      background: none;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      border-radius: 0.5rem;
      font-size: 1rem;
    }

    .dropdown-button:hover {
      color: #2563eb;
      background: #eff6ff;
    }

    .chevron {
      margin-left: 0.25rem;
      width: 1rem;
      height: 1rem;
      transition: transform 0.2s;
    }

    .chevron.rotate {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 0.5rem;
      width: 13rem;
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border: 1px solid #f3f4f6;
      padding: 0.5rem 0;
      display: none;
      animation: fadeIn 0.2s ease-out;
    }

    .dropdown-menu.show {
      display: block;
    }

    .dropdown-link {
      display: block;
      padding: 0.625rem 1rem;
      font-size: 0.875rem;
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.15s;
    }

    .dropdown-link:hover {
      background: #eff6ff;
      color: #2563eb;
    }

    /* Mobile Menu Button */
    .mobile-menu-button {
      display: block;
      padding: 0.5rem;
      color: #374151;
      background: none;
      border: none;
      cursor: pointer;
      border-radius: 0.5rem;
      transition: all 0.2s;
    }

    .mobile-menu-button:hover {
      color: #2563eb;
      background: #eff6ff;
    }

    .icon {
      width: 1.5rem;
      height: 1.5rem;
    }

    /* Mobile Navigation */
    .mobile-nav {
      display: none;
      padding: 1rem 0;
      border-top: 1px solid #f3f4f6;
      animation: slideDown 0.2s ease-out;
    }

    .mobile-nav.show {
      display: block;
    }

    .mobile-nav-links {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .mobile-nav-link {
      padding: 0.75rem 1rem;
      color: #374151;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.15s;
      border-radius: 0.5rem;
    }

    .mobile-nav-link:hover {
      color: #2563eb;
      background: #eff6ff;
    }

    .mobile-dropdown-button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 0.75rem 1rem;
      color: #374151;
      font-weight: 500;
      background: none;
      border: none;
      cursor: pointer;
      transition: all 0.15s;
      border-radius: 0.5rem;
      font-size: 1rem;
      text-align: left;
    }

    .mobile-dropdown-button:hover {
      color: #2563eb;
      background: #eff6ff;
    }

    .mobile-dropdown-menu {
      display: none;
      margin-top: 0.25rem;
      margin-left: 1rem;
      flex-direction: column;
      gap: 0.25rem;
      animation: slideDown 0.2s ease-out;
    }

    .mobile-dropdown-menu.show {
      display: flex;
    }

    .mobile-dropdown-link {
      padding: 0.625rem 1rem;
      font-size: 0.875rem;
      color: #4b5563;
      text-decoration: none;
      transition: all 0.15s;
      border-radius: 0.5rem;
    }

    .mobile-dropdown-link:hover {
      color: #2563eb;
      background: #eff6ff;
    }

    .mobile-nav-button {
      margin: 0.5rem 1rem 0;
      padding: 0.75rem 1.25rem;
      background: #2563eb;
      color: white;
      font-weight: 500;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      text-align: center;
      text-decoration: none;
      display: block;
    }

    .mobile-nav-button:hover {
      background: #1d4ed8;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-0.5rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-0.5rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (min-width: 768px) {
      .desktop-nav {
        display: flex;
      }

      .mobile-menu-button {
        display: none;
      }

      .nav-container {
        padding: 0 1.5rem;
      }
    }

    @media (min-width: 1024px) {
      .nav-container {
        padding: 0 2rem;
      }
    }
  </style>
</head>
<body>
  <nav>
    <div class="nav-container">
      <div class="nav-header">
        <!-- Logo -->
        <div class="logo">
          <h1>Sixers <span class="logo-highlight">Hoops</span></h1>
        </div>

        <!-- Desktop Navigation -->
        <div class="desktop-nav">
          <a href="/" class="nav-link">Home</a>
          <a href="/pickem" class="nav-link">Pickem</a>
          <a href="/news" class="nav-link">News</a>
          
          <!-- Team Hub Dropdown -->
          <div class="dropdown" id="teamHubDropdown">
            <button class="dropdown-button" id="teamHubButton">
              Team Hub
              <svg class="chevron" id="teamHubChevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div class="dropdown-menu" id="teamHubMenu">
              <a href="/roster" class="dropdown-link">Roster</a>
              <a href="/salary-cap" class="dropdown-link">Salary Cap</a>
              <a href="/depth-chart" class="dropdown-link">Depth Chart</a>
              <a href="/draft-picks" class="dropdown-link">Draft Picks</a>
            </div>
          </div>

          <a href="/schedule" class="nav-link">Schedule</a>
          <a href="/contact" class="nav-button">Contact</a>
        </div>

        <!-- Mobile Menu Button -->
        <button class="mobile-menu-button" id="mobileMenuButton">
          <svg class="icon" id="menuIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <svg class="icon" id="closeIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display: none;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Mobile Navigation -->
      <div class="mobile-nav" id="mobileNav">
        <div class="mobile-nav-links">
          <a href="/" class="mobile-nav-link">Home</a>
          <a href="/pickem" class="mobile-nav-link">Pickem</a>
          <a href="/news" class="mobile-nav-link">News</a>
          
          <div>
            <button class="mobile-dropdown-button" id="mobileTeamHubButton">
              Team Hub
              <svg class="chevron" id="mobileTeamHubChevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div class="mobile-dropdown-menu" id="mobileTeamHubMenu">
              <a href="/roster" class="mobile-dropdown-link">Roster</a>
              <a href="/salary-cap" class="mobile-dropdown-link">Salary Cap</a>
              <a href="/depth-chart" class="mobile-dropdown-link">Depth Chart</a>
              <a href="/draft-picks" class="mobile-dropdown-link">Draft Picks</a>
            </div>
          </div>

          <a href="/schedule" class="mobile-nav-link">Schedule</a>
          <a href="/contact" class="mobile-nav-button">Contact</a>
        </div>
      </div>
    </div>
  </nav>

  <script>
    // Desktop Dropdown
    const teamHubDropdown = document.getElementById('teamHubDropdown');
    const teamHubMenu = document.getElementById('teamHubMenu');
    const teamHubChevron = document.getElementById('teamHubChevron');

    teamHubDropdown.addEventListener('mouseenter', () => {
      teamHubMenu.classList.add('show');
      teamHubChevron.classList.add('rotate');
    });

    teamHubDropdown.addEventListener('mouseleave', () => {
      teamHubMenu.classList.remove('show');
      teamHubChevron.classList.remove('rotate');
    });

    // Mobile Menu Toggle
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileNav = document.getElementById('mobileNav');
    const menuIcon = document.getElementById('menuIcon');
    const closeIcon = document.getElementById('closeIcon');

    mobileMenuButton.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('show');
      
      if (isOpen) {
        menuIcon.style.display = 'none';
        closeIcon.style.display = 'block';
      } else {
        menuIcon.style.display = 'block';
        closeIcon.style.display = 'none';
      }
    });

    // Mobile Dropdown Toggle
    const mobileTeamHubButton = document.getElementById('mobileTeamHubButton');
    const mobileTeamHubMenu = document.getElementById('mobileTeamHubMenu');
    const mobileTeamHubChevron = document.getElementById('mobileTeamHubChevron');

    mobileTeamHubButton.addEventListener('click', () => {
      mobileTeamHubMenu.classList.toggle('show');
      mobileTeamHubChevron.classList.toggle('rotate');
    });
  </script>
</body>
</html>
