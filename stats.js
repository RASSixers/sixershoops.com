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



function renderTeamStats(data, standings, leagueStats) {
  const categories = data?.splits?.categories;
  
  if (!categories || !leagueStats || leagueStats.length === 0) {
    return `<section class="stats-section">
      <h2 class="stats-title">Team Season Averages</h2>
      <p style="text-align:center; padding: 1rem; color: var(--color-slate-500);">Team stats currently unavailable</p>
    </section>`;
  }

  const getStatValue = (teamData, statName) => {
    const cats = teamData?.splits?.categories || [];
    for (const cat of cats) {
      const s = cat.stats?.find(st => st.name === statName);
      if (s) return s.value;
    }
    return 0;
  };

  // Combine Standings (PPG, Opp PPG, Win%) and League Stats (Advanced)
  const nbaTeamsCombined = [];
  if (standings && standings.children) {
    standings.children.forEach(conf => {
      conf.standings?.entries?.forEach(entry => {
        const teamId = entry.team.id;
        const sStats = entry.stats || [];
        const getSStat = (name) => sStats.find(s => s.name === name)?.value || 0;
        
        const lStat = leagueStats.find(ls => {
           const ref = ls.team?.$ref || "";
           return ref.split('/').pop()?.split('?')[0] === teamId;
        });

        const fga = getStatValue(lStat, 'fieldGoalsAttempted') || 0;
        const fta = getStatValue(lStat, 'freeThrowsAttempted') || 0;
        const to = getStatValue(lStat, 'turnovers') || 0;
        const oreb = getStatValue(lStat, 'offensiveRebounds') || 0;
        const gp = getStatValue(lStat, 'gamesPlayed') || 1;

        // NBA Offensive Rating Possessions Formula: 
        // 0.96 * (FGA + TO + 0.44 * FTA - OREB)
        const teamPoss = 0.96 * (fga + to + (0.44 * fta) - oreb);
        
        // Total points scored and allowed from standings
        const totalPtsFor = getSStat('pointsFor');
        const totalPtsAgainst = getSStat('pointsAgainst');

        const offRtg = teamPoss > 0 ? (totalPtsFor / teamPoss) * 100 : 0;
        const defRtg = teamPoss > 0 ? (totalPtsAgainst / teamPoss) * 100 : 0;

        nbaTeamsCombined.push({
          id: teamId,
          winPct: getSStat('winPercent'),
          ppg: getSStat('avgPointsFor'),
          oppPpg: getSStat('avgPointsAgainst'),
          offRtg: offRtg,
          defRtg: defRtg,
          rpg: getStatValue(lStat, 'avgRebounds'),
          apg: getStatValue(lStat, 'avgAssists'),
          bpg: getStatValue(lStat, 'avgBlocks'),
          spg: getStatValue(lStat, 'avgSteals'),
          to: getStatValue(lStat, 'avgTurnovers'),
          toRatio: getStatValue(lStat, 'turnoverRatio'),
          fgPct: getStatValue(lStat, 'fieldGoalPct'),
          fg3Pct: getStatValue(lStat, 'threePointPct'),
          fg3m: getStatValue(lStat, 'avgThreePointFieldGoalsMade'),
          fg3a: getStatValue(lStat, 'avgThreePointFieldGoalsAttempted'),
          ftm: getStatValue(lStat, 'avgFreeThrowsMade'),
          fta: getStatValue(lStat, 'avgFreeThrowsAttempted'),
          ftPct: getStatValue(lStat, 'freeThrowPct'),
          oreb: getStatValue(lStat, 'avgOffensiveRebounds'),
          dreb: getStatValue(lStat, 'avgDefensiveRebounds'),
          pf: getStatValue(lStat, 'avgFouls'),
          pace: getStatValue(lStat, 'paceFactor') || 100
        });
      });
    });
  }

  const getNBARankCombined = (teamId, field, higherIsBetter = true) => {
    if (nbaTeamsCombined.length === 0) return "-";
    const sorted = [...nbaTeamsCombined].sort((a, b) => higherIsBetter ? b[field] - a[field] : a[field] - b[field]);
    const rank = sorted.findIndex(t => t.id === teamId) + 1;
    return rank > 0 ? `#${rank}` : "-";
  };

  const sixers = nbaTeamsCombined.find(t => t.id === SIXERS_TEAM_ID) || {};

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

  const rows = [
    { label: "Points Per Game", val: sixers.ppg?.toFixed(1), rank: getNBARankCombined(SIXERS_TEAM_ID, 'ppg') },
    { label: "Field Goal %", val: sixers.fgPct?.toFixed(1), rank: getNBARankCombined(SIXERS_TEAM_ID, 'fgPct') },
    { label: "3-Point Made", val: sixers.fg3m?.toFixed(1), rank: getNBARankCombined(SIXERS_TEAM_ID, 'fg3m') },
    { label: "3-Point Attempted", val: sixers.fg3a?.toFixed(1), rank: getNBARankCombined(SIXERS_TEAM_ID, 'fg3a') },
    { label: "3-Point %", val: sixers.fg3Pct?.toFixed(1), rank: getNBARankCombined(SIXERS_TEAM_ID, 'fg3Pct') },
    { label: "Free Throws Made", val: sixers.ftm?.toFixed(1), rank: getNBARankCombined(SIXERS_TEAM_ID, 'ftm') },
    { label: "Free Throws Attempted", val: sixers.fta?.toFixed(1), rank: getNBARankCombined(SIXERS_TEAM_ID, 'fta') },
    { label: "Free Throw %", val: sixers.ftPct?.toFixed(1), rank: getNBARankCombined(SIXERS_TEAM_ID, 'ftPct') },
    { label: "Offensive Rebounds", val: sixers.oreb?.toFixed(1), rank: getNBARankCombined(SIXERS_TEAM_ID, 'oreb') },
    { label: "Defensive Rebounds", val: sixers.dreb?.toFixed(1), rank: getNBARankCombined(SIXERS_TEAM_ID, 'dreb') },
    { label: "Total Rebounds", val: sixers.rpg?.toFixed(1), rank: getNBARankCombined(SIXERS_TEAM_ID, 'rpg') },
    { label: "Assists Per Game", val: sixers.apg?.toFixed(1), rank: getNBARankCombined(SIXERS_TEAM_ID, 'apg') },
    { label: "Turnovers Per Game", val: sixers.to?.toFixed(1), rank: getNBARankCombined(SIXERS_TEAM_ID, 'to', false) },
    { label: "Steals Per Game", val: sixers.spg?.toFixed(1), rank: getNBARankCombined(SIXERS_TEAM_ID, 'spg') },
    { label: "Blocks Per Game", val: sixers.bpg?.toFixed(1), rank: getNBARankCombined(SIXERS_TEAM_ID, 'bpg') },
    { label: "Personal Fouls", val: sixers.pf?.toFixed(1), rank: getNBARankCombined(SIXERS_TEAM_ID, 'pf', false) }
  ];

  rows.forEach((row, index) => {
    const isHidden = index >= 7;
    html += `
      <tr class="${isHidden ? 'team-stat-extra' : ''}" style="${isHidden ? 'display: none;' : ''}">
        <td class="stat-label">${row.label}</td>
        <td class="stat-value" style="text-align: right; font-weight: 800;">${row.val || '-'}</td>
        <td class="stat-rank" style="text-align: right; color: var(--color-sky); font-weight: 900;">${row.rank}</td>
      </tr>`;
  });

  if (rows.length > 7) {
    html += `
      <tr>
        <td colspan="3" style="text-align: center; padding: 1.5rem;">
          <button onclick="toggleTeamStats(this)" class="export-btn" style="padding: 0.6rem 1.5rem; font-size: 0.9rem; background: var(--color-sky);">
            Show All Stats
          </button>
        </td>
      </tr>`;
  }

  html += `</tbody></table></div></section>`;
  return html;
}

// Global toggle function
window.toggleTeamStats = function(btn) {
  const extras = document.querySelectorAll('.team-stat-extra');
  const isHidden = extras[0].style.display === 'none';
  
  extras.forEach(tr => {
    tr.style.display = isHidden ? 'table-row' : 'none';
  });
  
  btn.innerText = isHidden ? 'Show Less' : 'Show All Stats';
};

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
            <th>GP</th>
            <th>PTS</th>
            <th>FG%</th>
            <th>3PM</th>
            <th>3PA</th>
            <th>3P%</th>
            <th>FTM</th>
            <th>FTA</th>
            <th>FT%</th>
            <th>OREB</th>
            <th>DREB</th>
            <th>REB</th>
            <th>AST</th>
            <th>TOV</th>
            <th>STL</th>
            <th>BLK</th>
            <th>PF</th>
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
        <td>${p.gp}</td>
        <td class="stat-highlight">${p.ppg}</td>
        <td>${p.fgPct}</td>
        <td>${p.fg3m}</td>
        <td>${p.fg3a}</td>
        <td>${p.fg3Pct}</td>
        <td>${p.ftm}</td>
        <td>${p.fta}</td>
        <td>${p.ftPct}</td>
        <td>${p.oreb}</td>
        <td>${p.dreb}</td>
        <td>${p.rpg}</td>
        <td>${p.apg}</td>
        <td>${p.tov}</td>
        <td>${p.stl}</td>
        <td>${p.blk}</td>
        <td>${p.pf}</td>
      </tr>`;
  });

  html += `</tbody></table></div></section>`;

  return html;
}

async function loadAllData(force = false) {
  const container = document.getElementById("stats-app");
  if (!container) return;

  container.innerHTML = '<p style="text-align:center; padding: 2rem;">Loading stats...</p>';
  
  try {
    let data = getCache();
    
    if (!data || force) {
      console.log("Fetching fresh data from ESPN API...");
      
      const [ts, rosterData, leagueStandings] = await Promise.all([
        fetchWithUA("https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/2026/types/2/teams/20/statistics"),
        fetchWithUA("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/20?enable=roster"),
        fetchWithUA("https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?type=0")
      ]);

      // Fetch all team stats for accurate ranking
      console.log("Fetching league-wide team stats for accurate ranking...");
      const allTeamStats = await Promise.all(
        Array.from({ length: 30 }, (_, i) => 
          fetchWithUA(`https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/2026/types/2/teams/${i + 1}/statistics`)
            .catch(() => null)
        )
      );
      
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
        const fg3m = findStat(categories, "avgThreePointFieldGoalsMade")?.displayValue || "0.0";
        const fg3a = findStat(categories, "avgThreePointFieldGoalsAttempted")?.displayValue || "0.0";
        const ftm = findStat(categories, "avgFreeThrowsMade")?.displayValue || "0.0";
        const fta = findStat(categories, "avgFreeThrowsAttempted")?.displayValue || "0.0";
        const ftPct = findStat(categories, "freeThrowPct")?.displayValue || "0.0";
        const oreb = findStat(categories, "avgOffensiveRebounds")?.displayValue || "0.0";
        const dreb = findStat(categories, "avgDefensiveRebounds")?.displayValue || "0.0";
        const tov = findStat(categories, "avgTurnovers")?.displayValue || "0.0";
        const stl = findStat(categories, "avgSteals")?.displayValue || "0.0";
        const blk = findStat(categories, "avgBlocks")?.displayValue || "0.0";
        const pf = findStat(categories, "avgFouls")?.displayValue || "0.0";

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
          fg3Pct,
          fg3m,
          fg3a,
          ftm,
          fta,
          ftPct,
          oreb,
          dreb,
          tov,
          stl,
          blk,
          pf
        });
      });

      // Filter to only show our target 17 players
      const customIds = CUSTOM_ROSTER.map(c => c.id);
      const filteredPlayers = players.filter(p => customIds.includes(p.id));

      data = {
        teamStats: ts,
        standings: leagueStandings,
        leagueStats: allTeamStats.filter(s => s !== null),
        players: filteredPlayers
      };
      
      setCache(data);
    }

    let finalHtml = `
      <div class="export-container" style="margin-top: 0; margin-bottom: 3rem; background: rgba(10, 23, 78, 0.03); padding: 2rem; border-radius: 24px; border: 1px dashed rgba(10, 23, 78, 0.1);">
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: var(--color-navy); font-weight: 800; margin-bottom: 0.5rem;">Share Season Performance</h3>
          <p style="color: var(--color-slate-500); font-size: 0.95rem;">Generate an editorial-style graphic of the current team leaders for social media.</p>
        </div>
        <button onclick="generateSocialImage('full')" class="export-btn" style="width: 100%; justify-content: center; background: var(--color-navy); box-shadow: 0 10px 25px rgba(10, 23, 78, 0.2);">
          <i class="fas fa-camera"></i> Generate Season Leaders Graphic
        </button>
      </div>`;
    
    finalHtml += renderTeamStats(data.teamStats, data.standings, data.leagueStats);
    finalHtml += renderPlayerStats(data.players);

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
  if (!container) return;

  const data = getCache();
  if (!data || !data.players) return;

  // 1. Get Top 4 Players
  const topPlayers = data.players
    .filter(p => p.gp > 0)
    .sort((a, b) => parseFloat(b.ppg) - parseFloat(a.ppg))
    .slice(0, 4);

  // 2. Calculate Team Stats & Ranks (consistent with renderTeamStats)
  const getStatValue = (teamData, statName) => {
    const cats = teamData?.splits?.categories || [];
    for (const cat of cats) {
      const s = cat.stats?.find(st => st.name === statName);
      if (s) return s.value;
    }
    return 0;
  };

  const nbaTeamsCombined = [];
  if (data.standings && data.standings.children) {
    data.standings.children.forEach(conf => {
      conf.standings?.entries?.forEach(entry => {
        const teamId = entry.team.id;
        const sStats = entry.stats || [];
        const getSStat = (name) => sStats.find(s => s.name === name)?.value || 0;
        
        const lStat = data.leagueStats.find(ls => {
           const ref = ls.team?.$ref || "";
           return ref.split('/').pop()?.split('?')[0] === teamId;
        });

        const fga = getStatValue(lStat, 'fieldGoalsAttempted') || 0;
        const fta = getStatValue(lStat, 'freeThrowsAttempted') || 0;
        const to = getStatValue(lStat, 'turnovers') || 0;
        const oreb = getStatValue(lStat, 'offensiveRebounds') || 0;

        const teamPoss = 0.96 * (fga + to + (0.44 * fta) - oreb);
        const offRtg = teamPoss > 0 ? (getSStat('pointsFor') / teamPoss) * 100 : 0;
        const defRtg = teamPoss > 0 ? (getSStat('pointsAgainst') / teamPoss) * 100 : 0;

        nbaTeamsCombined.push({
          id: teamId,
          ppg: getSStat('avgPointsFor'),
          offRtg: offRtg,
          defRtg: defRtg,
          rpg: getStatValue(lStat, 'avgRebounds'),
          apg: getStatValue(lStat, 'avgAssists'),
          fg3Pct: getStatValue(lStat, 'threePointPct')
        });
      });
    });
  }

  const getNBARank = (field, higherIsBetter = true) => {
    if (nbaTeamsCombined.length === 0) return "-";
    const sorted = [...nbaTeamsCombined].sort((a, b) => higherIsBetter ? b[field] - a[field] : a[field] - b[field]);
    const rank = sorted.findIndex(t => t.id === SIXERS_TEAM_ID) + 1;
    return rank > 0 ? `#${rank}` : "-";
  };

  const sixers = nbaTeamsCombined.find(t => t.id === SIXERS_TEAM_ID) || {};

  // 3. Build HTML
  let html = `
    <div id="social-graphic" style="background: #f8fafc; padding: 50px; width: 1200px; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div class="social-header">
        <div class="social-title-box">
          <h1>SIXERS PERFORMANCE</h1>
          <p>2025-26 Regular Season • Official Team Analytics</p>
        </div>
        <div class="social-branding">
          <div class="domain">SIXERSHOOPS.COM</div>
        </div>
      </div>

      <!-- Player Stats at Top -->
      <div class="social-summary-grid">`;

  topPlayers.forEach((p, idx) => {
    html += `
        <div class="social-stat-card">
          <img src="${p.headshot}" class="social-stat-img" alt="${p.name}">
          <div class="social-stat-info">
            <div class="social-stat-label">Season Leader #${idx + 1}</div>
            <div class="social-stat-name">${p.name}</div>
            <div class="social-stat-value">${p.ppg} <span style="font-size: 16px; color: #64748b;">PPG</span></div>
          </div>
        </div>`;
  });

  html += `
      </div>

      <!-- Team Stats at Bottom -->
      <table class="social-table">
        <thead>
          <tr>
            <th>Team Category</th>
            <th>Value</th>
            <th>NBA Rank</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Points Per Game</td>
            <td>${sixers.ppg?.toFixed(1) || "-"}</td>
            <td><span class="social-badge rank">${getNBARank('ppg')}</span></td>
          </tr>
          <tr>
            <td>Offensive Rating</td>
            <td>${sixers.offRtg?.toFixed(1) || "-"}</td>
            <td><span class="social-badge rank">${getNBARank('offRtg')}</span></td>
          </tr>
          <tr>
            <td>Defensive Rating</td>
            <td>${sixers.defRtg?.toFixed(1) || "-"}</td>
            <td><span class="social-badge rank">${getNBARank('defRtg', false)}</span></td>
          </tr>
          <tr>
            <td>3-Point Percentage</td>
            <td>${sixers.fg3Pct?.toFixed(1) || "-"}%</td>
            <td><span class="social-badge rank">${getNBARank('fg3Pct')}</span></td>
          </tr>
        </tbody>
      </table>

      <div class="social-footer-note">
        Generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • Data provided by Official Team Feed
      </div>
    </div>`;

  container.innerHTML = html;

  try {
    // Wait a tiny bit for images to be ready
    await new Promise(r => setTimeout(r, 100));
    
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
        link.download = `Sixers-Performance-Graphic-${new Date().toISOString().split('T')[0]}.png`;
        link.href = imgData;
        link.click();
      };
    }

    if (modal) modal.style.display = "flex";
  } catch (err) {
    console.error("Export error:", err);
    alert("Error generating graphic");
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
