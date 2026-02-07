async function getNBAStandings() {
  const url = "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings";
  const container = document.getElementById("standings");
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    let html = "";

    // ESPN API structure uses 'children' for conferences
    const conferences = data.children || [];

    if (conferences.length === 0) {
      container.innerHTML = "<p style='text-align:center; padding: 2rem;'>No standings data available right now.</p>";
      return;
    }

    conferences.forEach(conf => {
      html += `
        <div class="conference-section">
          <h2 class="conference-title">${conf.name}</h2>
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>W</th>
                  <th>L</th>
                  <th>PCT</th>
                  <th>GB</th>
                  <th>HOME</th>
                  <th>AWAY</th>
                  <th>L10</th>
                  <th>STRK</th>
                </tr>
              </thead>
              <tbody>`;

      const entries = conf.standings?.entries || [];
      
      // Sort entries by win percentage (descending)
      entries.sort((a, b) => {
        const getStat = (entry, name) => entry.stats.find(s => s.name === name)?.value || 0;
        return getStat(b, 'winPercent') - getStat(a, 'winPercent');
      });

      entries.forEach((t, idx) => {
        // Flatten stats for easier access
        const stats = {};
        t.stats.forEach(s => {
          if (s.name) stats[s.name] = s;
          if (s.type) stats[s.type] = s;
        });

        const isSixers = t.team.abbreviation === "PHI";
        const rowClass = isSixers ? 'sixers-highlight' : '';
        
        const wins = stats.wins?.displayValue || "-";
        const losses = stats.losses?.displayValue || "-";
        const pct = stats.winPercent?.displayValue || "-";
        const gb = stats.gamesBehind?.displayValue || "-";
        const home = stats.home?.summary || "-";
        const away = stats.road?.summary || "-";
        const l10 = stats.lasttengames?.summary || stats.lastTenGames?.summary || "-";
        const streakValue = stats.streak?.displayValue || "-";

        let streakClass = "";
        if (streakValue.startsWith('W')) streakClass = "streak-w";
        if (streakValue.startsWith('L')) streakClass = "streak-l";

        const logoUrl = t.team.logos?.[0]?.href || '';

        html += `
          <tr class="${rowClass}">
            <td>
              <div class="team-info">
                <span class="rank">${idx + 1}</span>
                <img src="${logoUrl}" alt="${t.team.abbreviation}" class="team-logo" onerror="this.style.display='none'">
                <span>${t.team.displayName}</span>
              </div>
            </td>
            <td>${wins}</td>
            <td>${losses}</td>
            <td class="pct">${pct}</td>
            <td class="gb">${gb}</td>
            <td>${home}</td>
            <td>${away}</td>
            <td>${l10}</td>
            <td><span class="status-badge ${streakClass}">${streakValue}</span></td>
          </tr>`;
      });

      html += `
              </tbody>
            </table>
          </div>
        </div>`;
    });

    container.innerHTML = html;
  } catch (err) {
    console.error("Standings Load Error:", err);
    container.innerHTML = `
      <div style="text-align:center; padding: 3rem;">
        <p style="color:red; font-weight:700; margin-bottom: 1rem;">Error loading standings.</p>
        <p style="color:var(--color-slate-500); font-size: 0.9rem;">${err.message}</p>
        <button onclick="getNBAStandings()" style="margin-top: 1.5rem; padding: 0.6rem 1.2rem; border-radius: 8px; border: 1px solid var(--color-sky); background: white; color: var(--color-sky); cursor: pointer; font-weight: 600;">Try Again</button>
      </div>
    `;
  }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  getNBAStandings();
  // Refresh every 5 minutes
  setInterval(getNBAStandings, 300000);
});
