// New Stats Table Page
// - Single-season dropdown
// - Search bar
// - Full player columns including +/- and steals/blocks/turnovers
// - Career tab: computes career averages across seasons via client-side aggregation of provided season map

class SixersStatsTablePage {
  constructor() {
    this.api = new NBAApiManager();
    this.state = {
      season: this.api.currentSeason || '2023-24',
      search: '',
      players: [],
      seasonsData: {}, // optional: preloaded season map if provided
    };

    this.init();
    // Auto-refresh every 60s for live updates on stats page
    this.refreshTimer = setInterval(() => this.load(), 60000);
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
  }

  async load() {
    try {
      // API base can be configured on the page via window.API_BASE (defaults to same-origin)
      const apiBase = (window.API_BASE || '').replace(/\/$/, '');
      const apiUrl = (p) => `${apiBase}${p.startsWith('/') ? p : '/' + p}`;

      // Prefer backend proxy to avoid CORS/rate issues
      const proxied = await fetch(apiUrl(`/api/player-stats?season=${encodeURIComponent(this.state.season)}`)).then(r => r.json()).catch(() => null);
      if (proxied && proxied.success && Array.isArray(proxied.players)) {
        this.state.players = proxied.players;
      } else {
        // Fallback to client-side fetcher as backup
        const players = await this.api.getPlayerStats(this.state.season);
        this.state.players = players;
      }
      this.renderPlayers();
      await this.renderCareer();
    } catch (e) {
      console.error('Failed to load player stats', e);
      this.tableBody.innerHTML = '<tr><td colspan="14">Failed to load</td></tr>';
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
          // Fallback to client fetcher
          return this.api.getPlayerStats(s);
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
