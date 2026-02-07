const CACHE_KEY = "sixers-roster-stats-v2";
const CACHE_MINUTES = 10;
const SIXERS_TEAM_ID = "20";

// Custom Roster based on user request - Verified IDs for 2025-26
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
  teamRoster: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/20/roster",
  leagueStats: "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete?region=us&lang=en&contentorigin=espn&limit=500"
};

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
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
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

  const topScorers = [...athletes]
    .filter(a => a.stats && a.stats.ppg && parseFloat(a.stats.ppg) > 0)
    .sort((a, b) => parseFloat(b.stats.ppg) - parseFloat(a.stats.ppg))
    .slice(0, 3);

  if (topScorers.length === 0) return "";

  let html = `<section class="stats-section">
    <h2 class="stats-title">Season Leaders</h2>
    <div class="leaders-grid">`;

  topScorers.forEach((a, idx) => {
    html += `
      <div class="leader-card ${idx === 0 ? 'primary' : ''}">
        <div class="leader-rank">#${idx + 1}</div>
        <img src="${a.headshot || 'https://a.espncdn.com/i/headshots/nba/players/full/0.png'}" class="leader-img" alt="${a.name}">
        <div class="leader-info">
          <div class="leader-name">${a.name}</div>
          <div class="leader-pos">${a.position || 'N/A'}</div>
          <div class="leader-stats">
            <span class="leader-val">${a.stats.ppg}</span> <span class="leader-unit">PPG</span>
            <span class="leader-divider">|</span>
            <span class="leader-val">${a.stats.rpg}</span> <span class="leader-unit">RPG</span>
          </div>
        </div>
      </div>`;
  });

  html += `</div></section>`;
  return html;
}

function renderPlayerStats(allAthletes) {
  if (!allAthletes || allAthletes.length === 0) {
    return `<section class="stats-section">
      <h2 class="stats-title">Roster Season Averages</h2>
      <p>No player stats available. The season may not have started yet or data is loading.</p>
    </section>`;
  }

  const athleteMap = new Map();
  allAthletes.forEach(a => {
    if (a.id) {
      athleteMap.set(String(a.id), a);
    }
  });

  const rosterData = CUSTOM_ROSTER.map(player => {
    const stats = athleteMap.get(String(player.id));
    return { player, stats };
  });

  rosterData.sort((a, b) => {
    if (!a.stats && !b.stats) return 0;
    if (!a.stats) return 1;
    if (!b.stats) return -1;
    const aPPG = parseFloat(a.stats.stats?.ppg || 0);
    const bPPG = parseFloat(b.stats.stats?.ppg || 0);
    return bPPG - aPPG;
  });

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
    const s = stats?.stats || {};
    
    html += `
      <tr ${!stats ? 'style="opacity: 0.6;"' : ''}>
        <td class="player-name-cell">
          <img src="${stats?.headshot || 'https://a.espncdn.com/i/headshots/nba/players/full/' + player.id + '.png'}" 
               class="player-thumb" 
               alt="${player.name}"
               onerror="this.src='https://a.espncdn.com/i/headshots/nba/players/full/0.png'">
          <span class="player-name">${player.name}</span>
        </td>
        <td style="font-weight:900; color:var(--color-navy)">${player.no}</td>
        <td class="pos-tag">${stats?.position || 'N/A'}</td>
        <td>${s.gp || '0'}</td>
        <td class="stat-highlight">${s.ppg || '0.0'}</td>
        <td>${s.rpg || '0.0'}</td>
        <td>${s.apg || '0.0'}</td>
        <td>${s.spg || '0.0'}</td>
        <td>${s.bpg || '0.0'}</td>
        <td>${s.fgPct || '0.0'}</td>
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
    const sb = await fetchWithUA(endpoints.scoreboard);
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
      
      const minutes = stats[0] || '-';
      const fg = stats[1] || '-';
      const reb = stats[6] || '-';
      const ast = stats[7] || '-';
      const pts = stats[stats.length - 1] || '-';
      
      html += `
        <tr>
          <td class="player-name">${p.athlete.displayName}</td>
          <td>${minutes}</td>
          <td>${pts}</td>
          <td>${reb}</td>
          <td>${ast}</td>
          <td>${fg}</td>
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
    console.error("Stats container not found");
    return;
  }

  container.innerHTML = '<p style="text-align:center; padding: 2rem;">Loading stats...</p>';
  
  try {
    let data = getCache();
    if (!data || force) {
      console.log("🔍 Fetching fresh data...");
      
      const [sb, ts] = await Promise.all([
        fetchWithUA(endpoints.scoreboard),
        fetchWithUA(endpoints.teamSeasonStats)
      ]);

      console.log("📊 Testing with Tyrese Maxey (ID: 4431678)...");
      
      // Test fetching Maxey's stats with the individual endpoint
      const testUrl = `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/4431678/statistics`;
      console.log("🔗 Test URL:", testUrl);
      
      const testResponse = await fetch(testUrl);
      const testData = await testResponse.json();
      
      console.log("📦 FULL API RESPONSE FOR MAXEY:");
      console.log(JSON.stringify(testData, null, 2));
      
      // Let's see the structure
      if (testData.statistics) {
        console.log("✅ Statistics array found, length:", testData.statistics.length);
        testData.statistics.forEach((stat, i) => {
          console.log(`  Season ${i}:`, stat.season, stat.type);
          if (stat.categories) {
            stat.categories.forEach(cat => {
              console.log(`    - ${cat.name}:`, cat.totals);
            });
          }
        });
      }

      // Now fetch ALL players
      console.log("\n🏀 Fetching all custom roster players...");
      const allAthletes = [];
      
      for (const player of CUSTOM_ROSTER) {
        try {
          const url = `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${player.id}/statistics`;
          const response = await fetch(url);
          
          if (!response.ok) {
            console.log(`❌ ${player.name}: HTTP ${response.status}`);
            allAthletes.push({
              id: player.id,
              name: player.name,
              headshot: `https://a.espncdn.com/i/headshots/nba/players/full/${player.id}.png`,
              position: 'N/A',
              stats: null
            });
            continue;
          }
          
          const playerData = await response.json();
          
          // Find current season stats
          let currentStats = null;
          if (playerData.statistics && playerData.statistics.length > 0) {
            // Look for 2025-26 season or most recent
            currentStats = playerData.statistics.find(s => s.season?.year === 2026) ||
                          playerData.statistics.find(s => s.season?.year === 2025) ||
                          playerData.statistics[0];
          }
          
          if (currentStats && currentStats.categories) {
            const general = currentStats.categories.find(c => c.name === 'general');
            const offensive = currentStats.categories.find(c => c.name === 'offensive');
            const defensive = currentStats.categories.find(c => c.name === 'defensive');
            
            const stats = {
              gp: general?.totals?.[0] || '0',
              ppg: offensive?.totals?.[0] || '0.0',
              rpg: general?.totals?.[11] || '0.0',
              apg: offensive?.totals?.[10] || '0.0',
              spg: defensive?.totals?.[0] || '0.0',
              bpg: defensive?.totals?.[1] || '0.0',
              fgPct: offensive?.totals?.[3] || '0.0'
            };
            
            console.log(`✅ ${player.name}: ${stats.ppg} PPG, ${stats.rpg} RPG, ${stats.apg} APG`);
            
            allAthletes.push({
              id: player.id,
              name: playerData.athlete?.displayName || player.name,
              headshot: playerData.athlete?.headshot?.href || `https://a.espncdn.com/i/headshots/nba/players/full/${player.id}.png`,
              position: playerData.athlete?.position?.abbreviation || 'N/A',
              stats: stats
            });
          } else {
            console.log(`⚠️ ${player.name}: No stats found in response`);
            allAthletes.push({
              id: player.id,
              name: playerData.athlete?.displayName || player.name,
              headshot: playerData.athlete?.headshot?.href || `https://a.espncdn.com/i/headshots/nba/players/full/${player.id}.png`,
              position: playerData.athlete?.position?.abbreviation || 'N/A',
              stats: null
            });
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (err) {
          console.error(`❌ ${player.name} error:`, err);
          allAthletes.push({
            id: player.id,
            name: player.name,
            headshot: `https://a.espncdn.com/i/headshots/nba/players/full/${player.id}.png`,
            position: 'N/A',
            stats: null
          });
        }
      }
      
      console.log("\n📋 Final athlete data summary:");
      console.log(`Total players: ${allAthletes.length}`);
      console.log(`Players with stats: ${allAthletes.filter(a => a.stats).length}`);
      
      data = {
        scoreboard: sb,
        teamStats: ts,
        allPlayerStats: allAthletes
      };
      setCache(data);
      console.log("✅ Data cached successfully");
    } else {
      console.log("💾 Using cached data");
    }

    let finalHtml = "";
    
    const sixersGames = data.scoreboard.events.filter(e => 
      e.competitions[0].competitors.some(c => c.team.id === SIXERS_TEAM_ID)
    );
    
    finalHtml += renderScoreboard(sixersGames);
    finalHtml += renderTeamStats(data.teamStats);
    finalHtml += renderPlayerStats(data.allPlayerStats);
    finalHtml += await renderBoxScore();

    container.innerHTML = finalHtml;
    console.log("✅ Stats rendered successfully");
  } catch (err) {
    console.error("❌ Load data error:", err);
    container.innerHTML = `<p style="color:red; text-align:center; padding: 2rem;">Error loading stats: ${err.message}<br><small>Check console for details</small></p>`;
  }
}

async function generateSocialImage(mode) {
  if (typeof html2canvas === 'undefined') {
    alert("Image export library not loaded. Please add html2canvas to your HTML.");
    return;
  }

  const container = document.getElementById("social-export-container");
  if (!container) {
    alert("Export container not found");
    return;
  }

  const data = getCache();
  if (!data || !data.allPlayerStats) {
    alert("No stats data available");
    return;
  }

  const athletes = data.allPlayerStats
    .filter(a => a.stats && a.stats.ppg && parseFloat(a.stats.ppg) > 0)
    .sort((a, b) => parseFloat(b.stats.ppg) - parseFloat(a.stats.ppg))
    .slice(0, 10);

  if (athletes.length === 0) {
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

  athletes.forEach(a => {
    html += `
      <tr>
        <td>
          <div class="social-player">
            <img src="${a.headshot || 'https://a.espncdn.com/i/headshots/nba/players/full/0.png'}" class="social-logo">
            <span>${a.name}</span>
          </div>
        </td>
        <td style="text-align:center">${a.stats.gp}</td>
        <td style="text-align:center; color:#003da6">${a.stats.ppg}</td>
        <td style="text-align:center">${a.stats.rpg}</td>
        <td style="text-align:center">${a.stats.apg}</td>
        <td style="text-align:center">${a.stats.fgPct}</td>
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
    alert("Error generating image. Please try again.");
  }
}

function closeExportModal() {
  const modal = document.getElementById("exportModal");
  if (modal) modal.style.display = "none";
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("🏀 Initializing Sixers Stats App with DEBUG MODE");
  loadAllData();
  setInterval(() => {
    console.log("🔄 Auto-refreshing stats...");
    loadAllData(true);
  }, 10 * 60 * 1000);
});
