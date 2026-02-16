async function getSixersSchedule() {
  const url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/phi/schedule";
  const container = document.getElementById("schedule");

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    
    const events = data.events || [];
    if (events.length === 0) {
      container.innerHTML = "<p style='text-align:center; padding: 2rem;'>No schedule data available right now.</p>";
      return;
    }

    // Group events by month
    const months = {};
    events.forEach(event => {
      const date = new Date(event.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!months[monthYear]) months[monthYear] = [];
      months[monthYear].push(event);
    });

    let html = "";
    for (const month in months) {
      html += `
        <div class="month-section">
          <h2 class="month-title">${month}</h2>
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Opponent</th>
                  <th>Result/Time</th>
                  <th>Venue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>`;

      months[month].forEach(event => {
        const date = new Date(event.date);
        const dateStr = date.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const competition = event.competitions[0];
        const sixers = competition.competitors.find(c => c.team.abbreviation === "PHI");
        const opponent = competition.competitors.find(c => c.team.abbreviation !== "PHI");
        
        const isHome = sixers.homeAway === "home";
        const opponentName = opponent.team.displayName;
        const opponentLogo = opponent.team.logos ? opponent.team.logos[0].href : '';
        const venue = competition.venue ? `${competition.venue.fullName}, ${competition.venue.address.city}` : 'TBD';
        
        const statusType = competition.status.type.name;
        let statusClass = "status-upcoming";
        let statusText = competition.status.type.shortDetail || competition.status.type.description;
        
        let resultHtml = timeStr;
        if (statusType === "STATUS_FINAL") {
          statusClass = "status-final";
          const won = sixers.winner;
          const score = `${sixers.score.displayValue} - ${opponent.score.displayValue}`;
          const resultClass = won ? "win-result" : "loss-result";
          resultHtml = `<span class="${resultClass}">${won ? 'W' : 'L'} ${score}</span>`;
        } else if (statusType === "STATUS_IN_PROGRESS" || statusType === "STATUS_LIVE") {
          statusClass = "status-live";
          const score = `${sixers.score.displayValue} - ${opponent.score.displayValue}`;
          resultHtml = `<strong>${score}</strong>`;
        }

        html += `
          <tr>
            <td>${dateStr}</td>
            <td>
              <div class="game-info">
                <span>${isHome ? 'vs' : '@'}</span>
                <img src="${opponentLogo}" alt="${opponentName}" class="opponent-logo">
                <span>${opponentName}</span>
              </div>
            </td>
            <td>${resultHtml}</td>
            <td>${venue}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          </tr>`;
      });

      html += `
              </tbody>
            </table>
          </div>
        </div>`;
    }

    container.innerHTML = html;

  } catch (err) {
    console.error("Schedule Load Error:", err);
    container.innerHTML = `
      <div style="text-align:center; padding: 3rem;">
        <p style="color:red; font-weight:700; margin-bottom: 1rem;">Error loading schedule.</p>
        <p style="color:var(--color-slate-500); font-size: 0.9rem;">${err.message}</p>
        <button onclick="getSixersSchedule()" style="margin-top: 1.5rem; padding: 0.6rem 1.2rem; border-radius: 8px; border: 1px solid var(--color-sky); background: white; color: var(--color-sky); cursor: pointer; font-weight: 600;">Try Again</button>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  getSixersSchedule();
  // Refresh every 5 minutes
  setInterval(getSixersSchedule, 300000);
});
