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
  { id: "3012", name: "Kyle Lowry", no: "7" },
  { id: "4397014", name: "Quentin Grimes", no: "5" },
  { id: "3133603", name: "Kelly Oubre Jr.", no: "9" },
  { id: "4433246", name: "Patrick Baldwin Jr.", no: "PBJ" },
  { id: "6585", name: "Andre Drummond", no: "1" },
  { id: "4431675", name: "Trendon Watford", no: "12" },
  { id: "4397886", name: "Charles Bassey", no: "28" },
  { id: "4432179", name: "MarJon Beauchamp", no: "16" },
  { id: "5105637", name: "Adem Bona", no: "30" },
  { id: "4433569", name: "Johni Broome", no: "22" },
  { id: "4711297", name: "Justin Edwards", no: "11" },
  { id: "4432446", name: "Jabari Walker", no: "33" }
];

function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const data = JSON.parse(cached);
    // Cache for 10 minutes unless empty players
    const isStale = Date.now() - data.timestamp > CACHE_MINUTES * 60 * 1000;
    const hasData = data.content && data.content.players && data.content.players.some(p => p.gp > 0);
    
    if (isStale && hasData) {
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

// Helper to find a stat in the nested categories structure
function findStat(categories, name) {
  if (!categories) return null;
  for (const cat of categories) {
    if (cat.stats) {
      const stat = cat.stats.find(s => s.name === name);
      if (stat) return stat;
    }
  }
  return null;
}



function renderTeamStats(data) {
  // Handle both site API (results.stats) and Core API (splits) structures
  const categories = data?.splits?.categories || data?.results?.stats?.categories;
  
  if (!categories) {
    return `<section class="stats-section">
      <h2 class="stats-title">Team Season Averages</h2>
      <p style="text-align:center; padding: 1rem; color: var(--color-slate-500);">Team stats currently unavailable</p>
    </section>`;
  }

  let html = `<section class="stats-section">
    <h2 class="stats-title">Team Season Averages</h2>
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align: right;">Value</th>
            <th style="text-align: right;">NBA Rank</th>
          </tr>
        </thead>
        <tbody>`;

  let allStats = [];
  categories.forEach(cat => {
    if (cat.stats) {
      allStats = allStats.concat(cat.stats);
    }
  });

  const keys = [
    { key: "points", label: "Points Per Game" },
    { key: "rebounds", label: "Rebounds Per Game" },
    { key: "assists", label: "Assists Per Game" },
    { key: "fieldGoalPct", label: "Field Goal %" },
    { key: "threePointPct", label: "3-Point %" },
    { key: "freeThrowPct", label: "Free Throw %" },
    { key: "blocks", label: "Blocks Per Game" },
    { key: "steals", label: "Steals Per Game" },
    { key: "paceFactor", label: "Pace" },
    { key: "offensiveReboundRate", label: "Off. Rebound Rate" }
  ];

  let hasRows = false;
  keys.forEach(item => {
    const stat = allStats.find(s => s.name === item.key || s.abbreviation?.toLowerCase() === item.key.toLowerCase());
    if (stat) {
      hasRows = true;
      const rank = stat.rankDisplayValue || (stat.rank ? `#${stat.rank}` : "-");
      // Use perGameDisplayValue if available, otherwise displayValue
      const val = stat.perGameDisplayValue || stat.displayValue || stat.value || "0.0";
      
      html += `
        <tr>
          <td class="stat-label">${item.label}</td>
          <td class="stat-value" style="text-align: right; font-weight: 800;">${val}</td>
          <td class="stat-rank" style="text-align: right; color: var(--color-sky); font-weight: 900;">${rank}</td>
        </tr>`;
    }
  });

  if (!hasRows) {
    html += `<tr><td colspan="3" style="text-align:center; padding: 2rem; color: var(--color-slate-500);">Awaiting 2025-26 Season Data</td></tr>`;
  }

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
  if (!container) return;

  container.innerHTML = '<p style="text-align:center; padding: 2rem;">Loading stats...</p>';
  
  try {
    let data = getCache();
    
    if (!data || force) {
      console.log("Fetching fresh data from ESPN API...");
      
      const [sb, ts, rosterData] = await Promise.all([
        fetchWithUA("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"),
        fetchWithUA("https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/2026/types/2/teams/20/statistics"),
        fetchWithUA("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/20?enable=roster")
      ]);
      
      const athletes = rosterData.team?.athletes || [];
      
      // We'll fetch stats for everyone in the roster + our CUSTOM_ROSTER IDs
      const allIds = [...new Set([
        ...athletes.map(a => a.id),
        ...CUSTOM_ROSTER.map(c => c.id)
      ])];

      console.log(`Fetching stats for ${allIds.length} players...`);

      // Parallel fetch from Core API
      const statsResults = await Promise.all(
        allIds.map(id => 
          fetchWithUA(`https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/2026/types/2/athletes/${id}/statistics`)
            .catch(() => null)
        )
      );

      const players = [];
      allIds.forEach((id, index) => {
        const statData = statsResults[index];
        const athleteInfo = athletes.find(a => a.id === id);
        const customInfo = CUSTOM_ROSTER.find(c => c.id === id);
        
        if (!athleteInfo && !customInfo) return;

        const categories = statData?.splits?.categories || [];
        
        // Find specific stats
        const gp = findStat(categories, "gamesPlayed")?.value || 0;
        const ppg = findStat(categories, "avgPoints")?.displayValue || "0.0";
        const rpg = findStat(categories, "avgRebounds")?.displayValue || "0.0";
        const apg = findStat(categories, "avgAssists")?.displayValue || "0.0";
        const mpg = findStat(categories, "avgMinutes")?.displayValue || "0.0";
        const fgPct = findStat(categories, "fieldGoalPct")?.displayValue || "0.0";
        const fg3Pct = findStat(categories, "threePointPct")?.displayValue || "0.0";

        players.push({
          id,
          name: athleteInfo?.displayName || customInfo?.name || "Unknown",
          jersey: athleteInfo?.jersey || customInfo?.no || "-",
          position: athleteInfo?.position?.abbreviation || "N/A",
          headshot: athleteInfo?.headshot?.href || `https://a.espncdn.com/i/headshots/nba/players/full/${id}.png`,
          gp,
          mpg,
          ppg,
          rpg,
          apg,
          fgPct,
          fg3Pct
        });
      });

      // Filter to only show our target 17 players
      const customIds = CUSTOM_ROSTER.map(c => c.id);
      const filteredPlayers = players.filter(p => customIds.includes(p.id));

      data = {
        scoreboard: sb,
        teamStats: ts,
        players: filteredPlayers
      };
      
      setCache(data);
    }

    let finalHtml = "";
    
    finalHtml += renderTeamStats(data.teamStats);
    finalHtml += renderPlayerStats(data.players);
    finalHtml += await renderBoxScore();

    container.innerHTML = finalHtml;
  } catch (err) {
    console.error("Load error:", err);
    container.innerHTML = `
      <div style="color:red; text-align:center; padding: 2rem;">
        <h3>Error loading stats</h3>
        <p>${err.message}</p>
        <button onclick="localStorage.clear(); location.reload();" style="margin-top:1rem; padding:0.5rem 1rem; cursor:pointer;">
          Retry
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
