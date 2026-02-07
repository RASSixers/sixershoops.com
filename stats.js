const SIXERS_TEAM_ID = "20";
const CACHE_KEY = "sixers-espn-cache";
const CACHE_MINUTES = 10;

const endpoints = {
  scoreboard: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
  standings:  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/standings",
  teamStats:  `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${SIXERS_TEAM_ID}/statistics`,
  playerStats: `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete?region=us&lang=en&contentorigin=espn&isLeague=false&limit=50&team=${SIXERS_TEAM_ID}`
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

function renderPlayerStats(data) {
  if (!data || !data.athletes) return "";

  const athletes = data.athletes
    .filter(a => {
      const general = a.categories.find(c => c.name === "general");
      return general && parseFloat(general.totals[0]) > 0;
    })
    .sort((a, b) => {
      const aOff = a.categories.find(c => c.name === "offensive");
      const bOff = b.categories.find(c => c.name === "offensive");
      return parseFloat(bOff.totals[0]) - parseFloat(aOff.totals[0]);
    });

  let html = renderLeaders(athletes);

  html += `<section class="stats-section">
    <h2 class="stats-title">Player Season Averages</h2>
    <div class="table-responsive">
      <table class="player-stats-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>POS</th>
            <th>GP</th>
            <th>MIN</th>
            <th>PTS</th>
            <th>REB</th>
            <th>AST</th>
            <th>TO</th>
            <th>STL</th>
            <th>BLK</th>
            <th>FG%</th>
            <th>3P%</th>
          </tr>
        </thead>
        <tbody>`;

  athletes.forEach(a => {
    const general = a.categories.find(c => c.name === "general");
    const offensive = a.categories.find(c => c.name === "offensive");
    const defensive = a.categories.find(c => c.name === "defensive");

    html += `
      <tr>
        <td class="player-name-cell">
          <img src="${a.athlete.headshot?.href || 'https://a.espncdn.com/i/headshots/nba/players/full/0.png'}" class="player-thumb" alt="${a.athlete.displayName}">
          <span class="player-name">${a.athlete.displayName}</span>
        </td>
        <td class="pos-tag">${a.athlete.position.abbreviation}</td>
        <td>${general.totals[0]}</td>
        <td>${general.totals[1]}</td>
        <td class="stat-highlight">${offensive.totals[0]}</td>
        <td>${general.totals[11]}</td>
        <td>${offensive.totals[10]}</td>
        <td>${offensive.totals[11]}</td>
        <td>${defensive.totals[0]}</td>
        <td>${defensive.totals[1]}</td>
        <td>${offensive.totals[3]}</td>
        <td>${offensive.totals[6]}</td>
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
    const sixersGame = sb.events
      .filter(e => e.status.type.completed)
      .find(e => e.competitions[0].competitors.some(c => c.team.id === SIXERS_TEAM_ID));

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
      data = {
        scoreboard: await fetchWithUA(endpoints.scoreboard),
        teamStats:  await fetchWithUA(endpoints.teamStats),
        playerStats: await fetchWithUA(endpoints.playerStats)
      };
      setCache(data);
    }

    let finalHtml = "";
    finalHtml += renderScoreboard(data.scoreboard.events.filter(e => e.competitions[0].competitors.some(c => c.team.id === SIXERS_TEAM_ID)));
    finalHtml += renderTeamStats(data.teamStats);
    finalHtml += renderPlayerStats(data.playerStats);
    finalHtml += await renderBoxScore();

    container.innerHTML = finalHtml;
  } catch (err) {
    container.innerHTML = `<p style="color:red; text-align:center; padding: 2rem;">Error loading stats: ${err.message}</p>`;
  }
}

async function generateSocialImage(mode) {
  const container = document.getElementById("social-export-container");
  const data = getCache();
  if (!data || !data.playerStats) return;

  const athletes = data.playerStats.athletes
    .filter(a => {
      const general = a.categories.find(c => c.name === "general");
      return general && parseFloat(general.totals[0]) > 0;
    })
    .sort((a, b) => {
      const aOff = a.categories.find(c => c.name === "offensive");
      const bOff = b.categories.find(c => c.name === "offensive");
      return parseFloat(bOff.totals[0]) - parseFloat(aOff.totals[0]);
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
