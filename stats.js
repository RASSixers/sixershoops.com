// Philadelphia 76ers Stats Dashboard
// Advanced statistics with real-time updates and interactive features

class SixersStatsManager {
  constructor() {
    this.charts = {};
    this.currentData = {};
    this.updateInterval = null;
    this.nbaApi = new NBAApiManager();
    this.filters = {
      season: '2023-24',
      gameType: 'regular',
      dateRange: 'last10',
      statType: 'all'
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadInitialData();
    this.startAutoUpdate();
    this.initializeCharts();
  }

  setupEventListeners() {
    // Filter controls
    document.getElementById('seasonSelect')?.addEventListener('change', (e) => {
      this.filters.season = e.target.value;
      this.updateAllData();
    });

    document.getElementById('gameTypeSelect')?.addEventListener('change', (e) => {
      this.filters.gameType = e.target.value;
      this.updateAllData();
    });

    document.getElementById('dateRangeSelect')?.addEventListener('change', (e) => {
      this.filters.dateRange = e.target.value;
      this.updateAllData();
    });

    document.getElementById('sortSelect')?.addEventListener('change', (e) => {
      this.sortPlayerStats(e.target.value);
    });

    document.getElementById('minGamesInput')?.addEventListener('input', (e) => {
      this.filterPlayerStats(parseInt(e.target.value));
    });

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        this.filters.statType = e.target.dataset.filter;
        this.updateDisplayedStats();
      });
    });
  }

  async loadInitialData() {
    try {
      // Simulate API calls - replace with actual NBA API endpoints
      this.currentData = {
        teamStats: await this.fetchTeamStats(),
        playerStats: await this.fetchPlayerStats(),
        gameLog: await this.fetchGameLog(),
        advancedStats: await this.fetchAdvancedStats()
      };
      
      this.updateAllDisplays();
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showErrorMessage('Failed to load statistics. Please try again.');
    }
  }

  // Real NBA API calls
  async fetchTeamStats() {
    try {
      return await this.nbaApi.getTeamStats(this.filters.season);
    } catch (error) {
      console.error('Error fetching team stats:', error);
      return this.nbaApi.getFallbackTeamStats();
    }
  }

  async fetchPlayerStats() {
    try {
      return await this.nbaApi.getPlayerStats(this.filters.season);
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return this.nbaApi.getFallbackPlayerStats();
    }
  }

  async fetchGameLog() {
    try {
      const lastNGames = this.filters.dateRange === 'last10' ? 10 : 
                        this.filters.dateRange === 'last30' ? 30 : 82;
      return await this.nbaApi.getGameLog(lastNGames);
    } catch (error) {
      console.error('Error fetching game log:', error);
      return this.nbaApi.getFallbackGameLog();
    }
  }

  async fetchAdvancedStats() {
    try {
      return await this.nbaApi.getAdvancedStats();
    } catch (error) {
      console.error('Error fetching advanced stats:', error);
      return this.nbaApi.getFallbackAdvancedStats();
    }
  }

  initializeCharts() {
    this.createRecordChart();
    this.createScoringChart();
    this.createDefenseChart();
    this.createEfficiencyChart();
    this.createShotChart();
    this.createQuarterChart();
    this.createHomeAwayChart();
    this.createClutchChart();
  }

  createRecordChart() {
    const ctx = document.getElementById('recordChart');
    if (!ctx) return;

    const data = this.currentData.teamStats?.record || { wins: 0, losses: 0 };
    
    this.charts.record = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Wins', 'Losses'],
        datasets: [{
          data: [data.wins, data.losses],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 0,
          cutout: '70%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: { weight: 'bold' }
            }
          }
        }
      }
    });

    // Update stats display
    document.getElementById('recordStats').innerHTML = `
      <div style="text-align: center; margin-top: 1rem;">
        <div style="font-size: 2rem; font-weight: bold; color: #1e293b;">${data.wins}-${data.losses}</div>
        <div style="color: #64748b;">Win Percentage: ${(data.winPct * 100).toFixed(1)}%</div>
      </div>
    `;
  }

  createScoringChart() {
    const ctx = document.getElementById('scoringChart');
    if (!ctx || !this.currentData.gameLog) return;

    const gameLog = this.currentData.gameLog;
    
    this.charts.scoring = new Chart(ctx, {
      type: 'line',
      data: {
        labels: gameLog.map(game => game.date.split('-').slice(1).join('/')),
        datasets: [{
          label: 'Points Scored',
          data: gameLog.map(game => game.score),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }, {
          label: 'Points Allowed',
          data: gameLog.map(game => game.oppScore),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 90
          }
        }
      }
    });

    const avgScore = gameLog.reduce((sum, game) => sum + game.score, 0) / gameLog.length;
    document.getElementById('scoringStats').innerHTML = `
      <div style="text-align: center; margin-top: 1rem;">
        <div style="font-size: 2rem; font-weight: bold; color: #1e293b;">${avgScore.toFixed(1)}</div>
        <div style="color: #64748b;">Points Per Game (Last 10)</div>
      </div>
    `;
  }

  createDefenseChart() {
    const ctx = document.getElementById('defenseChart');
    if (!ctx || !this.currentData.gameLog) return;

    const gameLog = this.currentData.gameLog;
    
    this.charts.defense = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: gameLog.map(game => `vs ${game.opponent}`),
        datasets: [{
          label: 'Points Allowed',
          data: gameLog.map(game => game.oppScore),
          backgroundColor: gameLog.map(game => 
            game.oppScore < 110 ? '#10b981' : game.oppScore < 120 ? '#f59e0b' : '#ef4444'
          ),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 90
          }
        }
      }
    });

    const avgDefense = gameLog.reduce((sum, game) => sum + game.oppScore, 0) / gameLog.length;
    document.getElementById('defenseStats').innerHTML = `
      <div style="text-align: center; margin-top: 1rem;">
        <div style="font-size: 2rem; font-weight: bold; color: #1e293b;">${avgDefense.toFixed(1)}</div>
        <div style="color: #64748b;">Opp Points Per Game</div>
      </div>
    `;
  }

  createEfficiencyChart() {
    const ctx = document.getElementById('efficiencyChart');
    if (!ctx || !this.currentData.gameLog) return;

    const gameLog = this.currentData.gameLog;
    
    this.charts.efficiency = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['FG%', '3P%', 'FT%', 'Rebounds', 'Assists', 'Defense'],
        datasets: [{
          label: 'Team Performance',
          data: [
            gameLog.reduce((sum, game) => sum + game.fg, 0) / gameLog.length * 100,
            gameLog.reduce((sum, game) => sum + game.threeP, 0) / gameLog.length * 100,
            gameLog.reduce((sum, game) => sum + game.ft, 0) / gameLog.length * 100,
            75, // Simulated rebounding percentage
            82, // Simulated assist percentage
            68  // Simulated defensive rating
          ],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          pointBackgroundColor: '#3b82f6'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });

    document.getElementById('efficiencyStats').innerHTML = `
      <div style="text-align: center; margin-top: 1rem;">
        <div style="font-size: 2rem; font-weight: bold; color: #1e293b;">115.2</div>
        <div style="color: #64748b;">Offensive Rating</div>
      </div>
    `;
  }

  createShotChart() {
    const ctx = document.getElementById('shotChart');
    if (!ctx || !this.currentData.advancedStats) return;

    const shotData = this.currentData.advancedStats.shotChart;
    
    this.charts.shotChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Paint', 'Mid-Range', '3-Point', 'Free Throw'],
        datasets: [{
          label: 'Field Goal %',
          data: [
            shotData.paint.pct * 100,
            shotData.midRange.pct * 100,
            shotData.threePoint.pct * 100,
            shotData.freeThrow.pct * 100
          ],
          backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  }

  createQuarterChart() {
    const ctx = document.getElementById('quarterChart');
    if (!ctx || !this.currentData.advancedStats) return;

    const quarterData = this.currentData.advancedStats.quarterPerformance;
    
    this.charts.quarterChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: quarterData.map(q => q.quarter),
        datasets: [{
          label: 'Points Per Quarter',
          data: quarterData.map(q => q.pts),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }, {
          label: 'FG% Per Quarter',
          data: quarterData.map(q => q.fg * 100),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  }

  createHomeAwayChart() {
    const ctx = document.getElementById('homeAwayChart');
    if (!ctx || !this.currentData.advancedStats) return;

    const homeAwayData = this.currentData.advancedStats.homeAway;
    
    this.charts.homeAwayChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Wins', 'Losses', 'PPG', 'Opp PPG'],
        datasets: [{
          label: 'Home',
          data: [homeAwayData.home.wins, homeAwayData.home.losses, homeAwayData.home.ppg, homeAwayData.home.oppPpg],
          backgroundColor: '#3b82f6'
        }, {
          label: 'Away',
          data: [homeAwayData.away.wins, homeAwayData.away.losses, homeAwayData.away.ppg, homeAwayData.away.oppPpg],
          backgroundColor: '#06b6d4'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        }
      }
    });
  }

  createClutchChart() {
    const ctx = document.getElementById('clutchChart');
    if (!ctx || !this.currentData.advancedStats) return;

    const clutchData = this.currentData.advancedStats.clutchStats;
    
    this.charts.clutchChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Clutch Wins', 'Clutch Losses'],
        datasets: [{
          data: [clutchData.record.wins, clutchData.record.losses],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 0,
          cutout: '60%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  updatePlayerStatsTable() {
    const tbody = document.getElementById('playerStatsBody');
    if (!tbody || !this.currentData.playerStats) return;

    tbody.innerHTML = this.currentData.playerStats.map(player => `
      <tr>
        <td class="player-name">${player.name}</td>
        <td>${player.gp}</td>
        <td>${player.min.toFixed(1)}</td>
        <td class="stat-value">${player.pts.toFixed(1)}</td>
        <td class="stat-value">${player.reb.toFixed(1)}</td>
        <td class="stat-value">${player.ast.toFixed(1)}</td>
        <td>${(player.fgPct * 100).toFixed(1)}%</td>
        <td>${(player.threePct * 100).toFixed(1)}%</td>
        <td>${(player.ftPct * 100).toFixed(1)}%</td>
        <td class="stat-value">${player.eff.toFixed(1)}</td>
        <td>
          <span class="performance-indicator ${player.performance}">${player.performance}</span>
          <span class="trend-arrow trend-${player.trend}">
            ${player.trend === 'up' ? '↗️' : player.trend === 'down' ? '↘️' : '➡️'}
          </span>
        </td>
      </tr>
    `).join('');
  }

  sortPlayerStats(sortBy) {
    if (!this.currentData.playerStats) return;

    this.currentData.playerStats.sort((a, b) => {
      switch (sortBy) {
        case 'points': return b.pts - a.pts;
        case 'rebounds': return b.reb - a.reb;
        case 'assists': return b.ast - a.ast;
        case 'efficiency': return b.eff - a.eff;
        case 'minutes': return b.min - a.min;
        default: return b.pts - a.pts;
      }
    });

    this.updatePlayerStatsTable();
  }

  filterPlayerStats(minGames) {
    // This would filter players based on minimum games played
    // For now, we'll just update the display
    this.updatePlayerStatsTable();
  }

  updateDisplayedStats() {
    // Update display based on selected filter
    const statType = this.filters.statType;
    
    // Show/hide relevant stat cards based on filter
    document.querySelectorAll('.stat-card').forEach(card => {
      const title = card.querySelector('.stat-card-title').textContent.toLowerCase();
      
      switch (statType) {
        case 'offense':
          card.style.display = title.includes('scoring') || title.includes('efficiency') ? 'block' : 'none';
          break;
        case 'defense':
          card.style.display = title.includes('defensive') ? 'block' : 'none';
          break;
        case 'advanced':
          card.style.display = title.includes('shot') || title.includes('quarter') || title.includes('clutch') ? 'block' : 'none';
          break;
        case 'clutch':
          card.style.display = title.includes('clutch') ? 'block' : 'none';
          break;
        default:
          card.style.display = 'block';
      }
    });
  }

  updateAllData() {
    this.showUpdateIndicator();
    this.loadInitialData();
  }

  updateAllDisplays() {
    this.updatePlayerStatsTable();
    
    // Update all charts
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.update === 'function') {
        chart.update();
      }
    });
  }

  startAutoUpdate() {
    // Update every 5 minutes
    this.updateInterval = setInterval(() => {
      this.updateAllData();
    }, 5 * 60 * 1000);
  }

  showUpdateIndicator() {
    const indicator = document.getElementById('updateIndicator');
    if (indicator) {
      indicator.classList.add('show');
      setTimeout(() => {
        indicator.classList.remove('show');
      }, 3000);
    }
  }

  showErrorMessage(message) {
    // Create and show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      position: fixed;
      top: 100px;
      right: 2rem;
      background: #ef4444;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
      z-index: 1000;
      font-weight: 600;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  destroy() {
    // Clean up
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
  }
}

// Initialize the stats manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.sixersStats = new SixersStatsManager();
});

// Clean up when leaving the page
window.addEventListener('beforeunload', () => {
  if (window.sixersStats) {
    window.sixersStats.destroy();
  }
});

// Additional utility functions for enhanced features

// Export data functionality
function exportStatsData(format = 'json') {
  if (!window.sixersStats || !window.sixersStats.currentData) return;
  
  const data = window.sixersStats.currentData;
  const filename = `sixers-stats-${new Date().toISOString().split('T')[0]}`;
  
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadFile(blob, `${filename}.json`);
  } else if (format === 'csv') {
    const csv = convertToCSV(data.playerStats);
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, `${filename}.csv`);
  }
}

function convertToCSV(data) {
  if (!data || !data.length) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  
  return [headers, ...rows].join('\n');
}

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Comparison mode functionality
function enableComparisonMode() {
  const comparisonDiv = document.createElement('div');
  comparisonDiv.className = 'comparison-mode';
  comparisonDiv.innerHTML = `
    <h3>🔄 Comparison Mode Enabled</h3>
    <p>Select two players to compare their statistics side by side</p>
  `;
  
  document.querySelector('.stats-container').insertBefore(
    comparisonDiv, 
    document.querySelector('.stats-grid')
  );
}

// Real-time notifications for significant stat changes
function checkForSignificantChanges(newData, oldData) {
  if (!oldData || !newData) return;
  
  // Check for notable improvements or declines
  newData.playerStats.forEach((player, index) => {
    const oldPlayer = oldData.playerStats[index];
    if (!oldPlayer) return;
    
    const ptsDiff = player.pts - oldPlayer.pts;
    if (Math.abs(ptsDiff) > 5) {
      showNotification(
        `${player.name} ${ptsDiff > 0 ? 'increased' : 'decreased'} scoring by ${Math.abs(ptsDiff).toFixed(1)} PPG`,
        ptsDiff > 0 ? 'success' : 'warning'
      );
    }
  });
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 120px;
    right: 2rem;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    color: white;
    font-weight: 600;
    z-index: 1001;
    transform: translateX(300px);
    transition: transform 0.3s ease;
    background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(300px)';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// Keyboard shortcuts for power users
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'r':
        e.preventDefault();
        if (window.sixersStats) {
          window.sixersStats.updateAllData();
        }
        break;
      case 'e':
        e.preventDefault();
        exportStatsData('json');
        break;
      case 'c':
        e.preventDefault();
        enableComparisonMode();
        break;
    }
  }
});
