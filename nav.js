// nav.js - Reusable Navigation Component

function createNavbar() {
    const navHTML = `
        <nav class="navbar">
            <div class="logo">
                <a href="https://sixershoops.com" style="color: inherit; text-decoration: none;">
                    <span>Sixers Hoops</span>
                </a>
            </div>
            
            <ul class="nav-links">
                <li><a href="https://sixershoops.com">Home</a></li>
                <li><a href="#pickem">Pickem</a></li>
                <li class="dropdown">
                    <span class="dropdown-toggle">
                        <a>Team Hub</a> ▾
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
    
    return navHTML;
}

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const navContainer = document.getElementById('navbar-container');
    if (navContainer) {
        navContainer.innerHTML = createNavbar();
    }
});
