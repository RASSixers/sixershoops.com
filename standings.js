async function getNBAStandings() {
  const url = "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings";
  const container = document.getElementById("standings");
  const socialContainer = document.getElementById("social-export-content");
  const exportDate = document.getElementById("export-date");
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    let html = "";
    let socialHtml = "";

    // Set export date
    const now = new Date();
    if (exportDate) exportDate.textContent = `Updated: ${now.toLocaleDateString()} ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

    // ESPN API structure uses 'children' for conferences
    const conferences = data.children || [];

    if (conferences.length === 0) {
      container.innerHTML = "<p style='text-align:center; padding: 2rem;'>No standings data available right now.</p>";
      return;
    }

    conferences.forEach(conf => {
      // Main table HTML
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

      // Social Media HTML
      const confKey = conf.name.toLowerCase().includes('east') ? 'east' : 'west';
      socialHtml += `
        <div class="social-conference" data-conf="${confKey}">
          <h2 class="social-conf-title">${conf.name}</h2>
          <table class="social-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>W-L</th>
                <th>PCT</th>
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

        // Add to main table
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

        // Add to social table (simplified)
        socialHtml += `
          <tr>
            <td>
              <div class="social-team">
                <span style="width: 20px; font-size: 12px; color: #64748b;">${idx + 1}</span>
                <img src="${logoUrl}" class="social-logo">
                <span>${t.team.displayName}</span>
              </div>
            </td>
            <td>${wins}-${losses}</td>
            <td>${pct}</td>
            <td><span class="status-badge ${streakClass}" style="font-size: 10px; padding: 1px 4px;">${streakValue}</span></td>
          </tr>`;
      });

      html += `
              </tbody>
            </table>
          </div>
        </div>`;

      socialHtml += `
            </tbody>
          </table>
        </div>`;
    });

    container.innerHTML = html;
    if (socialContainer) socialContainer.innerHTML = socialHtml;

    // Initialize export logic
    initExport();

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

function initExport() {
  const exportBtns = document.querySelectorAll('[data-export-mode]');
  const modal = document.getElementById('exportModal');
  const preview = document.getElementById('exportPreview');
  const closeModal = document.getElementById('closeModal');
  const downloadBtn = document.getElementById('downloadBtn');
  const copyBtn = document.getElementById('copyBtn');

  if (exportBtns.length === 0 || !modal) return;

  exportBtns.forEach(btn => {
    btn.onclick = async () => {
      const mode = btn.dataset.exportMode;
      const originalText = btn.textContent;
      btn.textContent = 'Generating...';
      btn.disabled = true;
      
      try {
        const grid = document.getElementById('social-export-container');
        const content = document.getElementById('social-export-content');
        const titleH1 = grid.querySelector('.social-title-box h1');
        
        // Reset classes and visibility
        content.classList.remove('mode-east', 'mode-west');
        const eastDiv = content.querySelector('[data-conf="east"]');
        const westDiv = content.querySelector('[data-conf="west"]');
        
        if (mode === 'east') {
          grid.style.width = '800px';
          content.classList.add('mode-east');
          if (eastDiv) eastDiv.style.display = 'block';
          if (westDiv) westDiv.style.display = 'none';
          titleH1.textContent = 'Eastern Conference Standings';
        } else if (mode === 'west') {
          grid.style.width = '800px';
          content.classList.add('mode-west');
          if (eastDiv) eastDiv.style.display = 'none';
          if (westDiv) westDiv.style.display = 'block';
          titleH1.textContent = 'Western Conference Standings';
        } else {
          grid.style.width = '1200px';
          if (eastDiv) eastDiv.style.display = 'block';
          if (westDiv) westDiv.style.display = 'block';
          titleH1.textContent = 'NBA Standings';
        }

        const canvas = await html2canvas(grid, {
          backgroundColor: '#f8fafc',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false
        });
        
        preview.src = canvas.toDataURL('image/png');
        modal.style.display = 'flex';

        downloadBtn.onclick = () => {
          const link = document.createElement('a');
          link.download = `nba-${mode}-standings-${new Date().toISOString().split('T')[0]}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        };

        copyBtn.onclick = () => {
          canvas.toBlob(blob => {
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]).then(() => {
              copyBtn.textContent = 'Copied!';
              copyBtn.style.background = '#059669';
              setTimeout(() => {
                copyBtn.textContent = 'Copy to Clipboard';
                copyBtn.style.background = '#3b82f6';
              }, 2000);
            });
          });
        };
      } catch (err) {
        console.error("Export Error:", err);
        alert("Failed to generate image. Please try again.");
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    };
  });

  closeModal.onclick = () => {
    modal.style.display = 'none';
  };

  window.onclick = (event) => {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  };
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  getNBAStandings();
  // Refresh every 5 minutes
  setInterval(getNBAStandings, 300000);
});
