// New Stats Table Page
// - Single-season dropdown
// - Search bar
// - Full player columns including +/- and steals/blocks/turnovers
// - Career tab: computes career averages across seasons via client-side aggregation of provided season map

class SixersStatsTablePage {
  constructor() {
    this.api = new NBAApiManager();
    this.state = {
      season: '2023-24', // will be set from dropdown if present
      search: '',
      players: [],
      seasonsData: {}, // optional: preloaded season map if provided
    };

    this.init();
    // Auto-refresh every 60s for live updates on stats page
    this.refreshTimer = setInterval(() => this.load(), 60000);
    this.manualRefresh = false;
  }

  init() {
    this.cacheEls();
    this.bindEvents();
    this.load();
  }

  cacheEls() {
    this.seasonSelect = document.getElementById('seasonSelect');
    this.searchInput = document.getElementById('playerSearch');
    this.tableBody = document.querySelector('#playersTable tbody');
    this.careerContainer = document.getElementById('careerSection');
    this.careerTableBody = document.querySelector('#careerTable tbody');
    this.refreshBtn = document.getElementById('refreshBtn');

    // Initialize season from dropdown or API manager for auto-current season
    if (this.seasonSelect && this.seasonSelect.value) {
      this.state.season = this.seasonSelect.value;
    } else if (this.api?.currentSeason) {
      this.state.season = this.api.currentSeason;
    } else {
      // Build current-season string (e.g., 2024-25) if dropdown missing/empty
      const y = this.guessCurrentSeasonStart();
      this.state.season = `${y}-${String(y + 1).slice(2)}`;
    }
  }

  bindEvents() {
    if (this.seasonSelect) {
      this.seasonSelect.addEventListener('change', () => {
        this.state.season = this.seasonSelect.value;
        this.load();
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.state.search = this.searchInput.value.trim().toLowerCase();
        this.renderPlayers();
      });
    }

    // Tab switching
    document.querySelectorAll('[data-tab]')?.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    if (this.refreshBtn) {
      this.refreshBtn.addEventListener('click', async () => {
        this.manualRefresh = true;
        this.refreshBtn.disabled = true;
        this.refreshBtn.textContent = 'Refreshing...';
        try {
          await this.load();
        } finally {
          this.refreshBtn.disabled = false;
          this.refreshBtn.textContent = 'Refresh';
          this.manualRefresh = false;
        }
      });
    }
  }

  // Helpers for client-only data source (Ball Don't Lie API)
  getSeasonStartYear(seasonStr) {
    // Convert '2024-25' -> 2024, '2023-24' -> 2023
    const m = /^(\d{4})/.exec(seasonStr);
    return m ? parseInt(m[1], 10) : this.guessCurrentSeasonStart();
  }

  guessCurrentSeasonStart() {
    const now = new Date();
    let y = now.getUTCFullYear();
    const mth = now.getUTCMonth() + 1; // 1-12
    if (mth <= 8) y -= 1; // Jan–Aug → previous season start
    return y;
  }

  async fetchFromBallDontLie(seasonStr) {
    const BDL_BASE = 'https://api.balldontlie.io/api/v1'; // new domain recommended
    const headers = window.BDL_API_KEY ? { Authorization: `Bearer ${window.BDL_API_KEY}` } : {};

    const season = this.getSeasonStartYear(seasonStr);
    const teamId = 23; // 76ers on Ball Don't Lie

    // 1) Try roster-based season averages
    let players = [];
    try {
      const rosterRes = await fetch(`${BDL_BASE}/players?team_ids[]=${teamId}&per_page=100`, { cache: 'no-store', headers }).catch(() => null);
      const rosterJson = rosterRes ? await rosterRes.json().catch(() => ({})) : {};
      players = Array.isArray(rosterJson?.data) ? rosterJson.data : [];
    } catch {}

    let idToName = new Map();
    if (players.length) {
      idToName = new Map(players.map(p => [p.id, `${p.first_name} ${p.last_name}`.trim()]));
    }

    let mapped = [];
    if (players.length) {
      // 2) Season averages for roster ids
      const ids = players.map(p => p.id);
      const chunk = (arr, size) => arr.reduce((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
      const chunks = chunk(ids, 25);
      const allAverages = [];
      for (const c of chunks) {
        const q = c.map(id => `player_ids[]=${id}`).join('&');
        const avgRes = await fetch(`${BDL_BASE}/season_averages?season=${season}&${q}`, { cache: 'no-store', headers }).catch(() => null);
        const avgJson = avgRes ? await avgRes.json().catch(() => ({})) : {};
        allAverages.push(...(avgJson?.data || []));
      }

      mapped = allAverages.map(a => {
        const name = idToName.get(a.player_id) || 'Unknown';
        const gp = a.games_played || 0;
        const min = a.min ? (() => { const [mm, ss] = a.min.split(':').map(Number); return (mm || 0) + (ss || 0)/60; })() : 0;
        const fgPct = a.fg_pct ?? 0;
        const threePct = a.fg3_pct ?? 0;
        const ftPct = a.ft_pct ?? 0;
        const pts = a.pts ?? 0;
        const reb = a.reb ?? 0;
        const ast = a.ast ?? 0;
        const stl = a.stl ?? 0;
        const blk = a.blk ?? 0;
        const tov = a.turnover ?? 0;
        const fga = a.fga ?? 0;
        const fta = a.fta ?? 0;
        const fgm = a.fgm ?? 0;
        const ftm = a.ftm ?? 0;
        const eff = Number(pts) + Number(reb) + Number(ast) + Number(stl) + Number(blk) - Number(tov) - (Number(fga) - Number(fgm)) - (Number(fta) - Number(ftm));
        return { name, gp, min, pts, reb, ast, stl, blk, tov, fgPct, threePct, ftPct, plusMinus: 0, eff };
      });
    }

    // 3) If empty, build from team stats endpoint across pages (no roster needed)
    if (!mapped.length) {
      const totals = new Map(); // id -> totals
      let page = 1;
      const perPage = 100;
      while (true) {
        const statsRes = await fetch(`${BDL_BASE}/stats?seasons[]=${season}&team_ids[]=${teamId}&per_page=${perPage}&page=${page}`, { cache: 'no-store', headers }).catch(() => null);
        const statsJson = statsRes ? await statsRes.json().catch(() => ({})) : {};
        const stats = Array.isArray(statsJson?.data) ? statsJson.data : [];
        for (const s of stats) {
          const pid = s.player?.id;
          if (!pid) continue;
          const name = `${s.player?.first_name || ''} ${s.player?.last_name || ''}`.trim();
          const rec = totals.get(pid) || { name, gp: 0, min: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, fgm: 0, fga: 0, ftm: 0, fta: 0, fg3m: 0, fg3a: 0 };
          rec.gp += 1;
          const minStr = s.min || '0:00';
          const [mm, ss] = minStr.split(':').map(Number);
          rec.min += (mm || 0) + (ss || 0)/60;
          rec.pts += s.pts || 0;
          rec.reb += s.reb || 0;
          rec.ast += s.ast || 0;
          rec.stl += s.stl || 0;
          rec.blk += s.blk || 0;
          rec.tov += s.turnover || 0;
          rec.fgm += s.fgm || 0;
          rec.fga += s.fga || 0;
          rec.ftm += s.ftm || 0;
          rec.fta += s.fta || 0;
          rec.fg3m += s.fg3m || 0;
          rec.fg3a += s.fg3a || 0;
          totals.set(pid, rec);
        }
        if (!statsJson?.meta || !statsJson.meta?.next_page) break;
        page = statsJson.meta.next_page;
        if (page > 10) break; // safety to avoid too many requests
      }

      mapped = Array.from(totals.values()).map(t => {
        const gp = Math.max(t.gp, 1);
        const fgPct = t.fga ? (t.fgm / t.fga) : 0;
        const ftPct = t.fta ? (t.ftm / t.fta) : 0;
        const threePct = t.fg3a ? (t.fg3m / t.fg3a) : 0;
        const eff = t.pts + t.reb + t.ast + t.stl + t.blk - t.tov - (t.fga - t.fgm) - (t.fta - t.ftm);
        return { name: t.name, gp: t.gp, min: t.min / gp, pts: t.pts / gp, reb: t.reb / gp, ast: t.ast / gp, stl: t.stl / gp, blk: t.blk / gp, tov: t.tov / gp, fgPct, threePct, ftPct, plusMinus: 0, eff };
      });
    }

    return mapped.sort((a,b) => b.pts - a.pts);
  }

  async load() {
    try {
      // Client-only: use Ball Don't Lie public API exclusively
      this.state.players = await this.fetchFromBallDontLie(this.state.season);
      this.renderPlayers();
      try {
        await this.renderCareer();
      } catch (ce) {
        console.warn('Career render failed (continuing with season only):', ce);
        this.careerTableBody.innerHTML = '<tr><td colspan="10" class="center">Career data not available</td></tr>';
      }
    } catch (e) {
      console.error('Failed to load player stats', e);
      this.tableBody.innerHTML = '<tr><td colspan="14">Failed to load player data</td></tr>';
    }
  }

  filteredPlayers() {
    const q = this.state.search;
    if (!q) return this.state.players;
    return this.state.players.filter(p => p.name.toLowerCase().includes(q));
  }

  renderPlayers() {
    const rows = this.filteredPlayers().map(p => `
      <tr>
        <td class="left">${p.name}</td>
        <td>${p.gp}</td>
        <td>${(p.min ?? 0).toFixed(1)}</td>
        <td>${(p.pts ?? 0).toFixed(1)}</td>
        <td>${(p.reb ?? 0).toFixed(1)}</td>
        <td>${(p.ast ?? 0).toFixed(1)}</td>
        <td>${(p.stl ?? 0).toFixed(1)}</td>
        <td>${(p.blk ?? 0).toFixed(1)}</td>
        <td>${(p.tov ?? 0).toFixed(1)}</td>
        <td>${((p.fgPct ?? 0) * 100).toFixed(1)}%</td>
        <td>${((p.threePct ?? 0) * 100).toFixed(1)}%</td>
        <td>${((p.ftPct ?? 0) * 100).toFixed(1)}%</td>
        <td>${(p.plusMinus ?? 0).toFixed(1)}</td>
        <td>${(p.eff ?? 0).toFixed(1)}</td>
      </tr>
    `).join('');

    this.tableBody.innerHTML = rows || '<tr><td colspan="14">No players found</td></tr>';
  }

  // Career tab: compute career per player across multiple seasons using available data or live API
  async renderCareer() {
    // Prefer live API across multiple seasons listed in the season dropdown
    const seasonOptions = Array.from(this.seasonSelect?.options || []).map(o => o.value);

    let seasonData = [];
    if (seasonOptions.length) {
      try {
        const results = await Promise.all(seasonOptions.map(async (s) => {
          // Try backend proxy first
          try {
            const apiBase = (window.API_BASE || '').replace(/\/$/, '');
            const res = await fetch(`${apiBase}/api/player-stats?season=${encodeURIComponent(s)}`);
            const json = await res.json();
            if (json && json.success && Array.isArray(json.players)) return json.players;
          } catch {}
          // Fallback to client-only public API
          return this.fetchFromBallDontLie(s);
        }));
        seasonData = results.map((players, idx) => ({ season: seasonOptions[idx], players }));
      } catch (e) {
        console.warn('Falling back to window.seasonStatsData for career due to API issue');
      }
    }

    if (!seasonData.length && window.seasonStatsData) {
      // Build from inline dataset structure
      const seasons = Object.keys(window.seasonStatsData);
      seasonData = seasons.map(season => ({ season, players: (window.seasonStatsData[season] || []).map(p => ({
        name: p.name,
        gp: p.stats?.basic?.gp || 0,
        min: p.stats?.basic?.mpg || 0,
        pts: p.stats?.basic?.ppg || 0,
        reb: p.stats?.basic?.rpg || 0,
        ast: p.stats?.basic?.apg || 0,
        fgPct: (p.stats?.basic?.fg || 0)/100,
        threePct: (p.stats?.basic?.fg3 || 0)/100,
        ftPct: (p.stats?.basic?.ft || 0)/100,
      })) }));
    }

    if (!seasonData.length) {
      this.careerTableBody.innerHTML = '<tr><td colspan="10">Career data not available</td></tr>';
      return;
    }

    // Aggregate career per player using GP-weighted averages
    const career = new Map();

    for (const { players } of seasonData) {
      for (const p of players) {
        const key = p.name;
        if (!career.has(key)) {
          career.set(key, { gp: 0, minW: 0, ptsW: 0, rebW: 0, astW: 0, fgW: 0, threeW: 0, ftW: 0 });
        }
        const c = career.get(key);
        const gp = Number(p.gp) || 0;
        c.gp += gp;
        c.minW += (Number(p.min) || 0) * gp;
        c.ptsW += (Number(p.pts) || 0) * gp;
        c.rebW += (Number(p.reb) || 0) * gp;
        c.astW += (Number(p.ast) || 0) * gp;
        c.fgW += ((Number(p.fgPct) || 0) * 100) * gp;
        c.threeW += ((Number(p.threePct) || 0) * 100) * gp;
        c.ftW += ((Number(p.ftPct) || 0) * 100) * gp;
      }
    }

    const rows = Array.from(career.entries())
      .sort((a,b) => a[0].localeCompare(b[0]))
      .map(([name, c]) => {
        const gp = Math.max(c.gp, 1);
        return `
          <tr>
            <td class="left">${name}</td>
            <td>${c.gp}</td>
            <td>${(c.minW / gp).toFixed(1)}</td>
            <td>${(c.ptsW / gp).toFixed(1)}</td>
            <td>${(c.rebW / gp).toFixed(1)}</td>
            <td>${(c.astW / gp).toFixed(1)}</td>
            <td>${(c.fgW / gp).toFixed(1)}%</td>
            <td>${(c.threeW / gp).toFixed(1)}%</td>
            <td>${(c.ftW / gp).toFixed(1)}%</td>
          </tr>
        `;
      }).join('');

    this.careerTableBody.innerHTML = rows || '<tr><td colspan="10">No career data</td></tr>';
  }

  switchTab(tab) {
    document.querySelectorAll('[data-tab-btn]')?.forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-tab-btn="${tab}"]`)?.classList.add('active');

    document.querySelectorAll('[data-tab-panel]')?.forEach(p => p.classList.add('hidden'));
    document.querySelector(`[data-tab-panel="${tab}"]`)?.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.sixersStatsTable = new SixersStatsTablePage();
});
