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
        <svg class="brand-icon" width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2"/>
          <path d="M16 8L20 16L16 24L12 16L16 8Z" fill="currentColor"/>
          <circle cx="16" cy="16" r="3" fill="currentColor"/>
        </svg>
        <div class="brand-text">
          <div class="brand-name">SixersHoops</div>
          <div class="brand-tagline">Elite Basketball Intel</div>
        </div>
      </a>

      <!-- Center Navigation Menu -->
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
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 8c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span>Roster</span>
            </a>
            <a href="https://sixershoops.com/salary" class="dropdown-item">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zM8 4a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5A.75.75 0 008 4zm0 7a1 1 0 110 2 1 1 0 010-2z"/>
              </svg>
              <span>Salary Cap</span>
            </a>
            <a href="https://sixershoops.com/sixers-depth-chart" class="dropdown-item">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 3h14v2H1V3zm0 4h14v2H1V7zm0 4h14v2H1v-2z"/>
              </svg>
              <span>Depth Chart</span>
            </a>
            <a href="https://sixershoops.com/future-draft-picks" class="dropdown-item">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M14 2H2a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V3a1 1 0 00-1-1zM8 11.5l-3.5-3.5h2.25V4h2.5v4h2.25L8 11.5z"/>
              </svg>
              <span>Draft Picks</span>
            </a>
            <a href="https://sixershoops.com/nba-trade-machine" class="dropdown-item">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11 2v4l1.5-1.5L14 6V2h-3zm-6 8v4H2v-4l1.5 1.5L5 10zM8 4a4
