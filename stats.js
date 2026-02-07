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

function renderPlayerStats(data) {
  if (!data || !data.athletes) return "";

  let html = `<section class="stats-section">
    <h2 class="stats-title">Player Season Averages</h2>
    <div class="table-responsive">
      <table class="player-stats-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>GP</th>
            <th>PTS</th>
            <th>REB</th>
            <th>AST</th>
            <th>STL</th>
            <th>BLK</th>
            <th>FG%</th>
            <th>3P%</th>
          </tr>
        </thead>
        <tbody>`;

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
        <td>${general.totals[0]}</td>
        <td class="stat-highlight">${offensive.totals[0]}</td>
        <td>${general.totals[11]}</td>
        <td>${offensive.totals[10]}</td>
        <td>${defensive.totals[0]}</td>
        <td>${defensive.totals[1]}</td>
        <td>${offensive.totals[3]}</td>
        <td>${offensive.totals[6]}</td>
      </tr>`;
  });

  html += `</tbody></table></div></section>`;
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

document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  setInterval(() => loadAllData(true), 10 * 60 * 1000);
});
