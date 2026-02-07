const CACHE_KEY = "sixers-roster-stats-v3";
const CACHE_MINUTES = 10;
const SIXERS_TEAM_ID = "20";

// Custom Roster - we'll try to match these with ESPN's roster
const CUSTOM_ROSTER = [
  { id: "4431678", name: "Tyrese Maxey", no: "0" },
  { id: "3059318", name: "Joel Embiid", no: "21" },
  { id: "4251", name: "Paul George", no: "8" },
  { id: "4870562", name: "Dominick Barlow", no: "25" },
  { id: "5124612", name: "VJ Edgecombe", no: "77" },
  { id: "3033", name: "Kyle Lowry", no: "7" },
  { id: "4397116", name: "Quentin Grimes", no: "5" },
  { id: "3133603", name: "Kelly Oubre Jr.", no: "9" },
  { id: "4433246", name: "Patrick Baldwin Jr.", no: "PBJ" },
  { id: "6589", name: "Andre Drummond", no: "1" },
  { id: "4431675", name: "Trendon Watford", no: "12" },
  { id: "4397886", name: "Charles Bassey", no: "28" },
  { id: "4432179", name: "MarJon Beauchamp", no: "16" },
  { id: "5105637", name: "Adem Bona", no: "30" },
  { id: "4432832", name: "Johni Broome", no: "22" },
  { id: "4683011", name: "Justin Edwards", no: "11" },
  { id: "4432168", name: "Jabari Walker", no: "33" }
];

function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const data = JSON.parse(cached);
    if (Date.now() - data.timestamp > CACHE_MINUTES * 60 * 1000) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data.content;
  } catch (err) {
    console.error("Cache error:", err);
    return null;
  }
}

function setCache(content) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      content
    }));
  } catch (err) {
    console.error("Set cache error:", err);
  }
}

async function fetchWithUA(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderScoreboard(events = []) {
  let html = `<section class="stats-section">
    <h2 class="stats-title">Recent Games</h2>`;
  
  if (events.length === 0) {
    html += "<p>No recent games found</p>";
  } else {
    events.slice(0, 5).forEach(game => {
      const comp = game.competitions[0];
      const home = comp.competitors.find(c => c.homeAway === "home");
      const away = comp.competitors.find(c => c.homeAway === "away");
      const status = game.status.type.completed ? "Final" : game.status.displayClock || game.status.type.shortDetail;
      const score = game.status.type.completed ? `${away.score} - ${home.score}` : "TBD";
      const matchup = `${away.team.abbreviation} @ ${home.team.abbreviation}`;

      html += `
        <div class="game-card">
          <div class="game-info">
            <div class="game-matchup">${matchup}</div>
            <div class="game-status">${status}</div>
          </div>
          <div class="game-score">${score}</div>
        </div>`;
    });
  }
  html += `</section>`;
  return html;
}

function renderTeamStats(data) {
  let html = `<section class="stats-section">
    <h2 class="stats-title">Team Season Averages</h2>
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align: right;">Value</th>
          </tr>
        </thead>
        <tbody>`;

  const mainStats = data.splits?.categories?.[0]?.stats || [];
  const keys = [
    { key: "points", label: "Points Per Game" },
    { key: "rebounds", label: "Rebounds Per Game" },
    { key: "assists", label: "Assists Per Game" },
    { key: "fieldGoalsPct", label: "Field Goal %" },
    { key: "threePointPct", label: "3-Point %" },
    { key: "freeThrowsPct", label: "Free Throw %" },
    { key: "blocks", label: "Blocks Per Game" },
    { key: "steals", label: "Steals Per Game" }
  ];

  keys.forEach(item => {
    const stat = mainStats.find(s => s.name === item.key);
    if (stat) {
      html += `
        <tr>
          <td class="stat-label">${item.label}</td>
          <td class="stat-value">${stat.displayValue}</td>
        </tr>`;
    }
  });

  html += `</tbody></table></div></section>`;
  return html;
}

function renderLeaders(players) {
  if (!players || players.length === 0) return "";

  const topScorers = [...players]
    .filter(p => p.gp > 0)
    .sort((a, b) => parseFloat(b.ppg) - parseFloat(a.ppg))
    .slice(0, 3);

  if (topScorers.length === 0) return "";

  let html = `<section class="stats-section">
    <h2 class="stats-title">Season Leaders</h2>
    <div class="leaders-grid">`;

  topScorers.forEach((p, idx) => {
    html += `
      <div class="leader-card ${idx === 0 ? 'primary' : ''}">
        <div class="leader-rank">#${idx + 1}</div>
        <img src="${p.headshot}" class="leader-img" alt="${p.name}">
        <div class="leader-info">
          <div class="leader-name">${p.name}</div>
          <div class="leader-pos">${p.position}</div>
          <div class="leader-stats">
            <span class="leader-val">${p.ppg}</span> <span class="leader-unit">PPG</span>
            <span class="leader-divider">|</span>
            <span class="leader-val">${p.rpg}</span> <span class="leader-unit">RPG</span>
          </div>
        </div>
      </div>`;
  });

  html += `</div></section>`;
  return html;
}

function renderPlayerStats(players) {
  if (!players || players.length === 0) {
    return `<section class="stats-section">
      <h2 class="stats-title">Roster Season Averages</h2>
      <p>No player stats available. Season may not have started yet.</p>
    </section>`;
  }

  // Sort by PPG
  const sortedPlayers = [...players].sort((a, b) => parseFloat(b.ppg) - parseFloat(a.ppg));
  
  let html = renderLeaders(sortedPlayers);

  html += `<section class="stats-section">
    <h2 class="stats-title">Roster Season Averages</h2>
    <div class="table-responsive">
      <table class="player-stats-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>#</th>
            <th>POS</th>
            <th>GP</th>
            <th>MIN</th>
            <th>PTS</th>
            <th>REB</th>
            <th>AST</th>
            <th>FG%</th>
            <th>3P%</th>
          </tr>
        </thead>
        <tbody>`;

  sortedPlayers.forEach(p => {
    html += `
      <tr>
        <td class="player-name-cell">
          <img src="${p.headshot}" 
               class="player-thumb" 
               alt="${p.name}"
               onerror="this.src='https://a.espncdn.com/i/headshots/nba/players/full/0.png'">
          <span class="player-name">${p.name}</span>
        </td>
        <td style="font-weight:900; color:var(--color-navy)">${p.jersey || '-'}</td>
        <td class="pos-tag">${p.position}</td>
        <td>${p.gp}</td>
        <td>${p.mpg}</td>
        <td class="stat-highlight">${p.ppg}</td>
        <td>${p.rpg}</td>
        <td>${p.apg}</td>
        <td>${p.fgPct}</td>
        <td>${p.fg3Pct}</td>
      </tr>`;
  });

  html += `</tbody></table></div></section>`;
  
  html += `
    <div class="export-container">
      <div class="export-btns-group">
        <button onclick="generateSocialImage('full')" class="export-btn primary">
          <i class="fas fa-camera"></i> Save Roster Stats Image
        </button>
      </div>
    </div>`;

  return html;
}

async function renderBoxScore() {
  try {
    const sb = await fetchWithUA("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard");
    const sixersGames = sb.events
      .filter(e => e.status.type.completed)
      .filter(e => e.competitions[0].competitors.some(c => c.team.id === SIXERS_TEAM_ID));

    if (sixersGames.length === 0) return "";

    const sixersGame = sixersGames[0];
    const box = await fetchWithUA(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${sixersGame.id}`);
    
    if (!box.boxscore || !box.boxscore.players) return "";
    
    const sixersBox = box.boxscore.players.find(p => p.team.id === SIXERS_TEAM_ID);
    
    if (!sixersBox || !sixersBox.statistics || !sixersBox.statistics[0]) return "";

    let html = `<section class="stats-section">
      <h2 class="stats-title">Latest Game Box Score</h2>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>MIN</th>
              <th>PTS</th>
              <th>REB</th>
              <th>AST</th>
              <th>FG</th>
            </tr>
          </thead>
          <tbody>`;

    sixersBox.statistics[0].athletes.forEach(p => {
      if (p.didNotPlay || !p.active) return;
      const stats = p.stats || [];
      
      html += `
        <tr>
          <td class="player-name">${p.athlete.displayName}</td>
          <td>${stats[0] || '-'}</td>
          <td>${stats[stats.length - 1] || '-'}</td>
          <td>${stats[6] || '-'}</td>
          <td>${stats[7] || '-'}</td>
          <td>${stats[1] || '-'}</td>
        </tr>`;
    });

    html += `</tbody></table></div></section>`;
    return html;
  } catch (err) {
    console.error("Box score error:", err);
    return "";
  }
}

async function loadAllData(force = false) {
  const container = document.getElementById("stats-app");
  
  if (!container) {
    console.error("Stats container #stats-app not found!");
    return;
  }

  container.innerHTML = '<p style="text-align:center; padding: 2rem;">Loading stats...</p>';
  
  try {
    let data = getCache();
    
    if (!data || force) {
      console.log("Fetching fresh data from ESPN...");
      
      // Fetch scoreboard, team stats, and individual player stats for the current season
      const [sb, ts, playerStatsData] = await Promise.all([
        fetchWithUA("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"),
        fetchWithUA("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/20/statistics"),
        fetchWithUA("https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete?region=us&lang=en&contentorigin=espn&isQualified=false&limit=50&team=20")
      ]);
      
      console.log("Player stats response:", playerStatsData);
      
      // Extract players with their season averages
      const players = [];
      
      if (playerStatsData.athletes) {
        playerStatsData.athletes.forEach(item => {
          const athlete = item.athlete;
          const general = item.categories.find(c => c.name === "general") || { totals: [] };
          const offensive = item.categories.find(c => c.name === "offensive") || { totals: [] };
          
          players.push({
            id: athlete.id,
            name: athlete.displayName,
            jersey: athlete.jersey,
            position: athlete.position?.abbreviation || 'N/A',
            headshot: athlete.headshot?.href || `https://a.espncdn.com/i/headshots/nba/players/full/${athlete.id}.png`,
            gp: parseInt(general.totals[0]) || 0,
            mpg: general.totals[1] || '0.0',
            ppg: offensive.totals[0] || '0.0',
            rpg: general.totals[11] || '0.0',
            apg: offensive.totals[10] || '0.0',
            fgPct: offensive.totals[3] || '0.0',
            fg3Pct: offensive.totals[6] || '0.0'
          });
        });
      }
      
      console.log("Extracted players:", players);
      console.log("Players with games played > 0:", players.filter(p => p.gp > 0).length);
      
      data = {
        scoreboard: sb,
        teamStats: ts,
        players: players
      };
      
      setCache(data);
      console.log("Data cached successfully");
    } else {
      console.log("Using cached data");
    }

    let finalHtml = "";
    
    // Filter for Sixers games
    const sixersGames = data.scoreboard.events.filter(e => 
      e.competitions[0].competitors.some(c => c.team.id === SIXERS_TEAM_ID)
    );
    
    finalHtml += renderScoreboard(sixersGames);
    finalHtml += renderTeamStats(data.teamStats);
    finalHtml += renderPlayerStats(data.players);
    finalHtml += await renderBoxScore();

    container.innerHTML = finalHtml;
    console.log("Stats rendered successfully!");
    
  } catch (err) {
    console.error("Load error:", err);
    container.innerHTML = `
      <div style="color:red; text-align:center; padding: 2rem;">
        <h3>Error loading stats</h3>
        <p>${err.message}</p>
        <p><small>Check browser console (F12) for details</small></p>
        <button onclick="localStorage.clear(); location.reload();" style="margin-top:1rem; padding:0.5rem 1rem; cursor:pointer;">
          Clear Cache & Retry
        </button>
      </div>`;
  }
}

async function generateSocialImage(mode) {
  if (typeof html2canvas === 'undefined') {
    alert("html2canvas library not loaded");
    return;
  }

  const container = document.getElementById("social-export-container");
  if (!container) {
    alert("Export container not found");
    return;
  }

  const data = getCache();
  if (!data || !data.players) {
    alert("No stats data available");
    return;
  }

  const topPlayers = data.players
    .filter(p => p.gp > 0)
    .sort((a, b) => parseFloat(b.ppg) - parseFloat(a.ppg))
    .slice(0, 10);

  if (topPlayers.length === 0) {
    alert("No player stats available for export");
    return;
  }

  let html = `
    <div class="social-header">
      <div class="social-title-box">
        <h1>SIXERS ROSTER STATS</h1>
        <p>2025-26 Regular Season • Season Leaders</p>
      </div>
      <div class="social-branding">
        <span class="domain">SIXERSHOOPS.COM</span>
      </div>
    </div>
    <table class="social-table">
      <thead>
        <tr>
          <th>PLAYER</th>
          <th style="text-align:center">GP</th>
          <th style="text-align:center">PPG</th>
          <th style="text-align:center">RPG</th>
          <th style="text-align:center">APG</th>
          <th style="text-align:center">FG%</th>
        </tr>
      </thead>
      <tbody>`;

  topPlayers.forEach(p => {
    html += `
      <tr>
        <td>
          <div class="social-player">
            <img src="${p.headshot}" class="social-logo">
            <span>${p.name}</span>
          </div>
        </td>
        <td style="text-align:center">${p.gp}</td>
        <td style="text-align:center; color:#003da6">${p.ppg}</td>
        <td style="text-align:center">${p.rpg}</td>
        <td style="text-align:center">${p.apg}</td>
        <td style="text-align:center">${p.fgPct}%</td>
      </tr>`;
  });

  html += `</tbody></table>
    <div style="margin-top: 30px; text-align: center; font-size: 18px; color: #64748b; font-weight: 700; font-style: italic;">
      Real-time data powered by ESPN • Generated on ${new Date().toLocaleDateString()}
    </div>`;

  container.innerHTML = html;

  try {
    const canvas = await html2canvas(container, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      backgroundColor: "#f8fafc",
      logging: false
    });

    const imgData = canvas.toDataURL("image/png");
    const preview = document.getElementById("exportPreview");
    const downloadBtn = document.getElementById("downloadBtn");
    const modal = document.getElementById("exportModal");

    if (preview) preview.src = imgData;
    
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        const link = document.createElement("a");
        link.download = `Sixers-Roster-Stats-${new Date().toISOString().split('T')[0]}.png`;
        link.href = imgData;
        link.click();
      };
    }

    if (modal) modal.style.display = "flex";
  } catch (err) {
    console.error("Export error:", err);
    alert("Error generating image");
  }
}

function closeExportModal() {
  const modal = document.getElementById("exportModal");
  if (modal) modal.style.display = "none";
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log("🏀 Sixers Stats App Starting...");
  loadAllData();
  
  // Auto-refresh every 10 minutes
  setInterval(() => {
    console.log("🔄 Auto-refreshing...");
    loadAllData(true);
  }, 10 * 60 * 1000);
});
