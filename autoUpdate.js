// NBA Standings Auto-Update Script

let updateInterval = null;

// DOM Elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const lastUpdateText = document.getElementById('lastUpdateText');
const refreshButton = document.getElementById('refreshButton');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const loadingContainer = document.getElementById('loadingContainer');
const conferencesGrid = document.getElementById('conferencesGrid');
const easternTable = document.getElementById('easternTable');
const westernTable = document.getElementById('westernTable');
const easternCount = document.getElementById('easternCount');
const westernCount = document.getElementById('westernCount');

// Fetch NBA Standings
async function fetchStandings() {
    try {
        setLoadingState(true);
        hideError();
        
        const response = await fetch('https://cdn.nba.com/static/json/liveData/standings/standings_all.json');
        
        if (!response.ok) {
            throw new Error('Failed to fetch standings');
        }
        
        const data = await response.json();
        const teams = data?.standings?.teams || [];
        
        // Filter and sort teams by conference
        const easternTeams = teams
            .filter(team => team.conferenceName === 'Eastern')
            .sort((a, b) => {
                if (a.wins === b.wins) return a.losses - b.losses;
                return b.wins - a.wins;
            });
        
        const westernTeams = teams
            .filter(team => team.conferenceName === 'Western')
            .sort((a, b) => {
                if (a.wins === b.wins) return a.losses - b.losses;
                return b.wins - a.wins;
            });
        
        // Render the standings
        renderConference(easternTeams, easternTable, easternCount);
        renderConference(westernTeams, westernTable, westernCount);
        
        setLoadingState(false);
        updateLastUpdateTime();
        
    } catch (error) {
        console.error('Error fetching standings:', error);
        showError(error.message);
        setLoadingState(false);
    }
}

// Render conference table
function renderConference(teams, tableElement, countElement) {
    tableElement.innerHTML = '';
    countElement.textContent = `${teams.length} TEAMS`;
    
    teams.forEach((team, index) => {
        const winPct = (team.wins / (team.wins + team.losses)).toFixed(3);
        const gamesBehind = index === 0 ? '-' : (team.gamesBehind?.toFixed(1) || '0.0');
        
        const row = document.createElement('div');
        row.className = 'table-row';
        row.style.animationDelay = `${index * 30}ms`;
        
        row.innerHTML = `
            <div class="rank-col">${index + 1}</div>
            <div class="team-col">
                <span class="team-name">${team.teamCity} ${team.teamName}</span>
            </div>
            <div class="stat-col wins">${team.wins}</div>
            <div class="stat-col losses">${team.losses}</div>
            <div class="stat-col">${winPct}</div>
            <div class="stat-col">${gamesBehind}</div>
            <div class="stat-col streak">${team.streak || '-'}</div>
        `;
        
        tableElement.appendChild(row);
    });
}

// Set loading state
function setLoadingState(isLoading) {
    if (isLoading) {
        statusIndicator.className = 'status-indicator loading';
        statusText.textContent = 'Updating...';
        refreshButton.disabled = true;
    } else {
        statusIndicator.className = 'status-indicator';
        statusText.textContent = 'Live';
        refreshButton.disabled = false;
        loadingContainer.classList.add('hidden');
        conferencesGrid.classList.remove('hidden');
    }
}

// Show error message
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.add('show');
    statusIndicator.className = 'status-indicator error';
    statusText.textContent = 'Connection Error';
    conferencesGrid.classList.add('hidden');
    loadingContainer.classList.add('hidden');
}

// Hide error message
function hideError() {
    errorMessage.classList.remove('show');
}

// Update last update time
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    lastUpdateText.textContent = `Last Updated: ${timeString}`;
}

// Start auto-update interval
function startAutoUpdate() {
    // Clear existing interval if any
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    // Update every 5 minutes (300000 milliseconds)
    updateInterval = setInterval(fetchStandings, 5 * 60 * 1000);
}

// Initialize
function init() {
    // Fetch standings on page load
    fetchStandings();
    
    // Start auto-update
    startAutoUpdate();
    
    // Add refresh button event listener
    refreshButton.addEventListener('click', fetchStandings);
}

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Clean up interval on page unload
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
