<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Test - SixersHoops</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #0f172a;
            color: #e2e8f0;
        }
        .test-section {
            background: #1e293b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 10px;
            border: 1px solid #3b82f6;
        }
        button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #2563eb;
        }
        .result {
            background: #0f172a;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #10b981;
            white-space: pre-wrap;
            font-family: monospace;
            max-height: 400px;
            overflow-y: auto;
        }
        .error {
            border-left-color: #ef4444;
            background: #1f1f1f;
        }
        .status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            font-weight: bold;
        }
        .status.success { background: #10b981; color: white; }
        .status.error { background: #ef4444; color: white; }
        .status.loading { background: #f59e0b; color: white; }
    </style>
</head>
<body>
    <h1>🏀 SixersHoops API Test</h1>
    <p>Test your Vercel API endpoints to ensure they're working correctly.</p>

    <div class="test-section">
        <h2>NBA Game Data API Test</h2>
        <button onclick="testGameDataAPI()">Test Game Data API</button>
        <button onclick="testGameDataAPIWithDate()">Test with Today's Date</button>
        <div id="gameDataStatus" class="status" style="display: none;"></div>
        <div id="gameDataResult" class="result" style="display: none;"></div>
    </div>

    <div class="test-section">
        <h2>NBA Live API Test</h2>
        <button onclick="testLiveAPI()">Test Live API</button>
        <button onclick="testLiveAPILatest()">Test Latest Game</button>
        <div id="liveAPIStatus" class="status" style="display: none;"></div>
        <div id="liveAPIResult" class="result" style="display: none;"></div>
    </div>

    <div class="test-section">
        <h2>External API Test</h2>
        <button onclick="testBallDontLieAPI()">Test Ball Don't Lie API</button>
        <div id="externalAPIStatus" class="status" style="display: none;"></div>
        <div id="externalAPIResult" class="result" style="display: none;"></div>
    </div>

    <script>
        function showStatus(elementId, message, type) {
            const statusEl = document.getElementById(elementId);
            statusEl.textContent = message;
            statusEl.className = `status ${type}`;
            statusEl.style.display = 'block';
        }

        function showResult(elementId, data, isError = false) {
            const resultEl = document.getElementById(elementId);
            resultEl.textContent = JSON.stringify(data, null, 2);
            resultEl.className = isError ? 'result error' : 'result';
            resultEl.style.display = 'block';
        }

        async function testGameDataAPI() {
            showStatus('gameDataStatus', 'Testing Game Data API...', 'loading');
            
            try {
                const response = await fetch('/api/nba-game-data?date=2024-12-20&team=76ers&opponent=Boston Celtics');
                const data = await response.json();
                
                if (response.ok) {
                    showStatus('gameDataStatus', '✅ Game Data API is working!', 'success');
                    showResult('gameDataResult', data);
                } else {
                    showStatus('gameDataStatus', `❌ API Error: ${response.status}`, 'error');
                    showResult('gameDataResult', data, true);
                }
            } catch (error) {
                showStatus('gameDataStatus', `❌ Network Error: ${error.message}`, 'error');
                showResult('gameDataResult', { error: error.message }, true);
            }
        }

        async function testGameDataAPIWithDate() {
            const today = new Date().toISOString().split('T')[0];
            showStatus('gameDataStatus', `Testing Game Data API with today's date (${today})...`, 'loading');
            
            try {
                const response = await fetch(`/api/nba-game-data?date=${today}&team=76ers`);
                const data = await response.json();
                
                if (response.ok) {
                    showStatus('gameDataStatus', '✅ Game Data API is working with today\'s date!', 'success');
                    showResult('gameDataResult', data);
                } else {
                    showStatus('gameDataStatus', `❌ API Error: ${response.status}`, 'error');
                    showResult('gameDataResult', data, true);
                }
            } catch (error) {
                showStatus('gameDataStatus', `❌ Network Error: ${error.message}`, 'error');
                showResult('gameDataResult', { error: error.message }, true);
            }
        }

        async function testLiveAPI() {
            showStatus('liveAPIStatus', 'Testing Live API...', 'loading');
            
            try {
                const response = await fetch('/api/nba-live?gameId=test');
                const data = await response.json();
                
                if (response.ok) {
                    showStatus('liveAPIStatus', '✅ Live API is working!', 'success');
                    showResult('liveAPIResult', data);
                } else {
                    showStatus('liveAPIStatus', `❌ API Error: ${response.status}`, 'error');
                    showResult('liveAPIResult', data, true);
                }
            } catch (error) {
                showStatus('liveAPIStatus', `❌ Network Error: ${error.message}`, 'error');
                showResult('liveAPIResult', { error: error.message }, true);
            }
        }

        async function testLiveAPILatest() {
            showStatus('liveAPIStatus', 'Testing Live API for latest game...', 'loading');
            
            try {
                const response = await fetch('/api/nba-live?gameId=latest');
                const data = await response.json();
                
                if (response.ok) {
                    showStatus('liveAPIStatus', '✅ Live API latest game is working!', 'success');
                    showResult('liveAPIResult', data);
                } else {
                    showStatus('liveAPIStatus', `❌ API Error: ${response.status}`, 'error');
                    showResult('liveAPIResult', data, true);
                }
            } catch (error) {
                showStatus('liveAPIStatus', `❌ Network Error: ${error.message}`, 'error');
                showResult('liveAPIResult', { error: error.message }, true);
            }
        }

        async function testBallDontLieAPI() {
            showStatus('externalAPIStatus', 'Testing Ball Don\'t Lie API...', 'loading');
            
            try {
                const today = new Date().toISOString().split('T')[0];
                const response = await fetch(`https://api.balldontlie.io/v1/games?dates[]=${today}&team_ids[]=20&per_page=10`);
                const data = await response.json();
                
                if (response.ok) {
                    showStatus('externalAPIStatus', '✅ Ball Don\'t Lie API is working!', 'success');
                    showResult('externalAPIResult', data);
                } else {
                    showStatus('externalAPIStatus', `❌ External API Error: ${response.status}`, 'error');
                    showResult('externalAPIResult', data, true);
                }
            } catch (error) {
                showStatus('externalAPIStatus', `❌ Network Error: ${error.message}`, 'error');
                showResult('externalAPIResult', { error: error.message }, true);
            }
        }

        // Auto-test on page load
        window.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 API Test page loaded');
            // Uncomment to auto-test on load
            // testGameDataAPI();
        });
    </script>
</body>
</html>
