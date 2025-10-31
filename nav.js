// nav.js - Reusable Navigation Component

function createNavbar() {
    return `
        <nav class="navbar">
            <div class="logo">
                <a href="https://sixershoops.com">
                    <span>Sixers Hoops</span>
                </a>
            </div>
            
            <ul class="nav-links">
                <li><a href="https://sixershoops.com">Home</a></li>
                <li><a href="#pickem">Pickem</a></li>
                <li class="dropdown">
                    <span class="dropdown-toggle">
                        <span>Team Hub ▾</span>
                    </span>
                    <div class="dropdown-content">
                        <a href="https://sixershoops.com/news">News</a>
                        <a href="https://sixershoops.com/roster">Roster</a>
                        <a href="https://sixershoops.com/salary">Salary Cap</a>
                        <a href="https://sixershoops.com/sixers-depth-chart">Depth Chart</a>
                        <a href="https://sixershoops.com/future-draft-picks">Draft Picks</a>
                    </div>
                </li>
                <li><a href="https://sixershoops.com/schedule">Schedule</a></li>
                <li>
                    <a href="https://sixershoops.com/contact" class="contact-btn">
                        <span>→</span> Contact
                    </a>
                </li>
            </ul>
        </nav>
    `;
}

// Initialize navbar immediately
(function() {
    const navContainer = document.getElementById('navbar-container');
    if (navContainer) {
        navContainer.innerHTML = createNavbar();
    }
})();

// Also try on DOM load in case script runs before element exists
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        const navContainer = document.getElementById('navbar-container');
        if (navContainer && !navContainer.innerHTML) {
            navContainer.innerHTML = createNavbar();
        }
    });
}
