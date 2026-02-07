const CACHE_KEY = "sixers-roster-stats-v2";
const CACHE_MINUTES = 10;

// Custom Roster based on user request
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

const endpoints = {
  scoreboard: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
  teamSeasonStats: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/20/statistics",
  // Fetch by team ID to get the bulk of the roster
  teamRosterStats: "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete?region=us&lang=en&contentorigin=espn&isLeague=false&limit=100&team=20",
  // Fetch league stats as backup for players on other teams
  leagueStats: "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete?region=us&lang=en&contentorigin=espn&isLeague=true&limit=500"
};

function getCache() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  const data = JSON.parse(cached);
  if (Date.now() - data.timestamp > CACHE_MINUTES * 60 * 1000) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
  return data.content;
}

function setCache(content) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    timestamp: Date.now(),
    content
  }));
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

function renderLeaders(athletes) {
  if (!athletes || athletes.length === 0) return "";

  // Get top 3 scorers
  const topScorers = [...athletes].sort((a, b) => 
    parseFloat(b.categories.find(c => c.name === "offensive").totals[0]) - 
    parseFloat(a.categories.find(c => c.name === "offensive").totals[0])
  ).slice(0, 3);

  let html = `<section class="stats-section">
    <h2 class="stats-title">Season Leaders</h2>
    <div class="leaders-grid">`;

  topScorers.forEach((a, idx) => {
    const off = a.categories.find(c => c.name === "offensive");
    const gen = a.categories.find(c => c.name === "general");
    html += `
      <div class="leader-card ${idx === 0 ? 'primary' : ''}">
        <div class="leader-rank">#${idx + 1}</div>
        <img src="${a.athlete.headshot?.href}" class="leader-img" alt="${a.athlete.displayName}">
        <div class="leader-info">
          <div class="leader-name">${a.athlete.displayName}</div>
          <div class="leader-pos">${a.athlete.position.displayName}</div>
          <div class="leader-stats">
            <span class="leader-val">${off.totals[0]}</span> <span class="leader-unit">PPG</span>
            <span class="leader-divider">|</span>
            <span class="leader-val">${gen.totals[11]}</span> <span class="leader-unit">RPG</span>
          </div>
        </div>
      </div>`;
  });

  html += `</div></section>`;
  return html;
}

function renderPlayerStats(allAthletes) {
  if (!allAthletes || allAthletes.length === 0) return "";

  // Map athletes by ID for quick access
  const athleteMap = new Map();
  allAthletes.forEach(a => {
    if (a.athlete && a.athlete.id) {
      athleteMap.set(a.athlete.id, a);
    }
  });

  // Prepare full roster display based on CUSTOM_ROSTER
  const rosterData = CUSTOM_ROSTER.map(player => {
    const stats = athleteMap.get(player.id);
    return { player, stats };
  });

  // Sort: Players with stats first, then by PPG
  rosterData.sort((a, b) => {
    if (!a.stats && !b.stats) return 0;
    if (!a.stats) return 1;
    if (!b.stats) return -1;
    const aPPG = parseFloat(a.stats.categories.find(c => c.name === "offensive")?.totals?.[0] || 0);
    const bPPG = parseFloat(b.stats.categories.find(c => c.name === "offensive")?.totals?.[0] || 0);
    return bPPG - aPPG;
  });

  // Render Leaders (only if they have stats)
  const leaders = rosterData.filter(d => d.stats).map(d => d.stats);
  let html = renderLeaders(leaders);

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
            <th>PTS</th>
            <th>REB</th>
            <th>AST</th>
            <th>STL</th>
            <th>BLK</th>
            <th>FG%</th>
          </tr>
        </thead>
        <tbody>`;

  rosterData.forEach(({ player, stats }) => {
    const general = stats?.categories.find(c => c.name === "general");
    const offensive = stats?.categories.find(c => c.name === "offensive");
    const defensive = stats?.categories.find(c => c.name === "defensive");

    html += `
      <tr ${!stats ? 'style="opacity: 0.6;"' : ''}>
        <td class="player-name-cell">
          <img src="${stats?.athlete.headshot?.href || 'https://a.espncdn.com/i/headshots/nba/players/full/0.png'}" class="player-thumb" alt="${player.name}">
          <span class="player-name">${player.name}</span>
        </td>
        <td style="font-weight:900; color:var(--color-navy)">${player.no}</td>
        <td class="pos-tag">${stats?.athlete.position.abbreviation || 'N/A'}</td>
        <td>${general?.totals?.[0] || '0'}</td>
        <td class="stat-highlight">${offensive?.totals?.[0] || '0.0'}</td>
        <td>${general?.totals?.[11] || '0.0'}</td>
        <td>${offensive?.totals?.[10] || '0.0'}</td>
        <td>${defensive?.totals?.[0] || '0.0'}</td>
        <td>${defensive?.totals?.[1] || '0.0'}</td>
        <td>${offensive?.totals?.[3] || '0.0'}</td>
      </tr>`;
  });

  html += `</tbody></table></div></section>`;
  
  // Add Social Export section
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
    const sb = await fetchWithUA(endpoints.scoreboard);
    // Still look for "Sixers" games for the box score
    const sixersGame = sb.events
      .filter(e => e.status.type.completed)
      .find(e => e.competitions[0].competitors.some(c => c.team.id === "20"));

    if (!sixersGame) return "";

    const box = await fetchWithUA(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${sixersGame.id}`);
    const sixersBox = box.boxscore.players.find(p => p.team.id === SIXERS_TEAM_ID);
    
    if (!sixersBox) return "";

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
      const stats = p.stats;
      html += `
        <tr>
          <td class="player-name">${p.athlete.displayName}</td>
          <td>${stats[0] || '-'}</td>
          <td>${stats[stats.length-1] || '-'}</td>
          <td>${stats[stats.length-2] || '-'}</td>
          <td>${stats[stats.length-3] || '-'}</td>
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
  
  try {
    let data = getCache();
    if (!data || force) {
      // Fetch both team and league to be safe
      const [sb, ts, trs, ls] = await Promise.all([
        fetchWithUA(endpoints.scoreboard),
        fetchWithUA(endpoints.teamSeasonStats),
        fetchWithUA(endpoints.teamRosterStats),
        fetchWithUA(endpoints.leagueStats)
      ]);

      // Combine athletes from both sources
      const allAthletes = [...(trs.athletes || []), ...(ls.athletes || [])];
      
      data = {
        scoreboard: sb,
        teamStats: ts,
        allPlayerStats: allAthletes
      };
      setCache(data);
    }

    let finalHtml = "";
    finalHtml += renderScoreboard(data.scoreboard.events.filter(e => e.competitions[0].competitors.some(c => c.team.id === "20")));
    finalHtml += renderTeamStats(data.teamStats);
    finalHtml += renderPlayerStats(data.allPlayerStats);
    finalHtml += await renderBoxScore();

    container.innerHTML = finalHtml;
  } catch (err) {
    container.innerHTML = `<p style="color:red; text-align:center; padding: 2rem;">Error loading stats: ${err.message}</p>`;
  }
}

async function generateSocialImage(mode) {
  const container = document.getElementById("social-export-container");
  const data = getCache();
  if (!data || !data.allPlayerStats) return;

  const athleteMap = new Map();
  data.allPlayerStats.forEach(a => {
    if (a.athlete && a.athlete.id) athleteMap.set(a.athlete.id, a);
  });

  const athletes = CUSTOM_ROSTER
    .map(p => athleteMap.get(p.id))
    .filter(Boolean)
    .sort((a, b) => {
      const aOff = a.categories.find(c => c.name === "offensive");
      const bOff = b.categories.find(c => c.name === "offensive");
      return (parseFloat(bOff?.totals?.[0]) || 0) - (parseFloat(aOff?.totals?.[0]) || 0);
    })
    .slice(0, 10); // Top 10 for image

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

  athletes.forEach(a => {
    const off = a.categories.find(c => c.name === "offensive");
    const gen = a.categories.find(c => c.name === "general");
    html += `
      <tr>
        <td>
          <div class="social-player">
            <img src="${a.athlete.headshot?.href}" class="social-logo">
            <span>${a.athlete.displayName}</span>
          </div>
        </td>
        <td style="text-align:center">${gen.totals[0]}</td>
        <td style="text-align:center; color:#003da6">${off.totals[0]}</td>
        <td style="text-align:center">${gen.totals[11]}</td>
        <td style="text-align:center">${off.totals[10]}</td>
        <td style="text-align:center">${off.totals[3]}</td>
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
      scale: 2,
      backgroundColor: "#f8fafc"
    });

    const imgData = canvas.toDataURL("image/png");
    const preview = document.getElementById("exportPreview");
    preview.src = imgData;

    const downloadBtn = document.getElementById("downloadBtn");
    downloadBtn.onclick = () => {
      const link = document.createElement("a");
      link.download = `Sixers-Roster-Stats-${new Date().toISOString().split('T')[0]}.png`;
      link.href = imgData;
      link.click();
    };

    document.getElementById("exportModal").style.display = "flex";
  } catch (err) {
    console.error("Export error:", err);
    alert("Error generating image. Please try again.");
  }
}

function closeExportModal() {
  document.getElementById("exportModal").style.display = "none";
}

document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  setInterval(() => loadAllData(true), 10 * 60 * 1000);
});
