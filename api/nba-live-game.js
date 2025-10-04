<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NBA API Test | SixersHoops</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #fff;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            color: #3b82f6;
        }
        .test-section {
            background: #1e293b;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            border: 2px solid #334155;
        }
        .test-section h2 {
            color: #60a5fa;
            margin-bottom: 15px;
        }
        .btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin-right: 10px;
            margin-bottom: 10px;
            transition: all 0.3s;
        }
        .btn:hover {
            background: #2563eb;
            transform: translateY(-2px);
        }
        .btn:disabled {
            background: #475569;
            cursor: not-allowed;
            transform: none;
        }
        .result {
            background: #0f172a;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            max-height: 400px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .success {
            color: #10b981;
        }
        .error {
            color: #ef4444;
        }
        .info {
            color: #60a5fa;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-indicator.online {
            background: #10b981;
            box-shadow: 0 0 10px #10b981;
        }
        .status-indicator.offline {
            background: #ef4444;
            box-shadow: 0 0 10px #ef4444;
        }
        .box-score-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .box-score-table th,
        .box-score-table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #334155;
        }
        .box-score-table th {
            background: #0f172a;
            color: #60a5fa;
            font-weight: 600;
        }
        .box-score-table tr:hover {
            background: #0f172a;
        }
        .team-header {
            background: #3b82f6;
            color: white;
            padding: 10px;
            border-radius: 6px;
            margin-top: 20px;
            margin-bottom: 10px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏀 NBA API Test Dashboard</h1>

        <!-- Server Status -->
        <div class="test-section">
            <h2><span class="status-indicator offline" id="statusIndicator"></span>Server Status</h2>
            <p id="serverStatus">Checking...</p>
            <button class="btn" onclick="checkServer()">Check Server</button>
        </div>

        <!-- API Test -->
        <div class="test-section">
            <h2>Test NBA Live Game API</h2>
            <p>Test the October 4th, 2024 preseason game (76ers vs Knicks)</p>
            <button class="btn" onclick="testGameAPI()" id="testBtn">Fetch Game Data</button>
            <button class="btn" onclick="showBoxScore()" id="boxScoreBtn" disabled>Show Box Score</button>
            <button class="btn" onclick="showPlayByPlay()" id="playByPlayBtn" disabled>Show Play-by-Play</button>
            <div class="result" id="apiResult"></div>
        </div>

        <!-- Box Score Display -->
        <div class="test-section" id="boxScoreSection" style="display: none;">
            <h2>📊 Box Score</h2>
            <div id="boxScoreDisplay"></div>
        </div>

        <!-- Play-by-Play Display -->
        <div class="test-section" id="playByPlaySection" style="display: none;">
            <h2>📝 Play-by-Play</h2>
            <div id="playByPlayDisplay"></div>
        </div>
    </div>

    <script>
        let gameData = null;
        const API_URL = 'http://localhost:3001/api/nba-live-game?gameId=0012500010';

        async function checkServer() {
            const statusText = document.getElementById('serverStatus');
            const indicator = document.getElementById('statusIndicator');
            
            statusText.textContent = 'Checking...';
            
            try {
                const response = await fetch('http://localhost:3001/api/health');
                const data = await response.json();
                
                if (data.status === 'healthy') {
                    statusText.innerHTML = '<span class="success">✅ Server is running on http://localhost:3001</span>';
                    indicator.classList.remove('offline');
                    indicator.classList.add('online');
                } else {
                    throw new Error('Server not healthy');
                }
            } catch (error) {
                statusText.innerHTML = '<span class="error">❌ Server is not running. Please start start-local-server.bat</span>';
                indicator.classList.remove('online');
                indicator.classList.add('offline');
            }
        }

        async function testGameAPI() {
            const resultDiv = document.getElementById('apiResult');
            const testBtn = document.getElementById('testBtn');
            const boxScoreBtn = document.getElementById('boxScoreBtn');
            const playByPlayBtn = document.getElementById('playByPlayBtn');
            
            testBtn.disabled = true;
            resultDiv.innerHTML = '<span class="info">Fetching data from NBA.com...</span>';
            
            try {
                const response = await fetch(API_URL);
                const data = await response.json();
                
                if (data.success) {
                    gameData = data.data;
                    
                    resultDiv.innerHTML = `
<span class="success">✅ API Request Successful!</span>

<span class="info">Game Information:</span>
Game ID: ${gameData.gameId}
Status: ${gameData.statusText}
${gameData.awayTeam.name} (${gameData.awayTeam.tricode}): ${gameData.awayTeam.score}
${gameData.homeTeam.name} (${gameData.homeTeam.tricode}): ${gameData.homeTeam.score}

<span class="info">Box Score Data:</span>
${gameData.awayTeam.name}: ${gameData.awayTeam.boxScore.length} players
${gameData.homeTeam.name}: ${gameData.homeTeam.boxScore.length} players

<span class="info">Play-by-Play:</span>
${gameData.plays.length} plays available

<span class="success">✅ All data loaded successfully!</span>
                    `;
                    
                    boxScoreBtn.disabled = false;
                    playByPlayBtn.disabled = false;
                } else {
                    resultDiv.innerHTML = `<span class="error">❌ API Error: ${data.error}</span>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<span class="error">❌ Failed to fetch: ${error.message}</span>`;
            } finally {
                testBtn.disabled = false;
            }
        }

        function showBoxScore() {
            if (!gameData) return;
            
            const section = document.getElementById('boxScoreSection');
            const display = document.getElementById('boxScoreDisplay');
            
            let html = '';
            
            // Away Team
            html += `<div class="team-header">${gameData.awayTeam.name} - ${gameData.awayTeam.score}</div>`;
            html += '<table class="box-score-table"><thead><tr>';
            html += '<th>Player</th><th>MIN</th><th>PTS</th><th>REB</th><th>AST</th><th>FG</th><th>3PT</th><th>FT</th>';
            html += '</tr></thead><tbody>';
            
            gameData.awayTeam.boxScore.forEach(player => {
                html += `<tr>
                    <td>${player.name}</td>
                    <td>${player.minutes.replace('PT', '').replace('M', ':').replace('.00S', '')}</td>
                    <td>${player.points}</td>
                    <td>${player.rebounds}</td>
                    <td>${player.assists}</td>
                    <td>${player.fieldGoalsMade}-${player.fieldGoalsAttempted}</td>
                    <td>${player.threePointersMade}-${player.threePointersAttempted}</td>
                    <td>${player.freeThrowsMade}-${player.freeThrowsAttempted}</td>
                </tr>`;
            });
            
            html += '</tbody></table>';
            
            // Home Team
            html += `<div class="team-header">${gameData.homeTeam.name} - ${gameData.homeTeam.score}</div>`;
            html += '<table class="box-score-table"><thead><tr>';
            html += '<th>Player</th><th>MIN</th><th>PTS</th><th>REB</th><th>AST</th><th>FG</th><th>3PT</th><th>FT</th>';
            html += '</tr></thead><tbody>';
            
            gameData.homeTeam.boxScore.forEach(player => {
                html += `<tr>
                    <td>${player.name}</td>
                    <td>${player.minutes.replace('PT', '').replace('M', ':').replace('.00S', '')}</td>
                    <td>${player.points}</td>
                    <td>${player.rebounds}</td>
                    <td>${player.assists}</td>
                    <td>${player.fieldGoalsMade}-${player.fieldGoalsAttempted}</td>
                    <td>${player.threePointersMade}-${player.threePointersAttempted}</td>
                    <td>${player.freeThrowsMade}-${player.freeThrowsAttempted}</td>
                </tr>`;
            });
            
            html += '</tbody></table>';
            
            display.innerHTML = html;
            section.style.display = 'block';
            section.scrollIntoView({ behavior: 'smooth' });
        }

        function showPlayByPlay() {
            if (!gameData) return;
            
            const section = document.getElementById('playByPlaySection');
            const display = document.getElementById('playByPlayDisplay');
            
            let html = '<div class="result">';
            
            gameData.plays.slice(0, 50).forEach(play => {
                html += `${play.emoji} Q${play.period} ${play.clock} - ${play.description} (${play.scoreAway}-${play.scoreHome})\n`;
            });
            
            html += '</div>';
            
            display.innerHTML = html;
            section.style.display = 'block';
            section.scrollIntoView({ behavior: 'smooth' });
        }

        // Check server on load
        checkServer();
    </script>
</body>
</html>
