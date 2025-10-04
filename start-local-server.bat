@echo off
echo ========================================
echo   SixersHoops Local Server Startup
echo ========================================
echo.

cd /d "%~dp0server"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if .env exists, if not create from example
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo NOTE: Twitter features will be disabled without TWITTER_BEARER_TOKEN
    echo You can add it to server\.env if needed
    echo.
)

echo Starting server on http://localhost:3001
echo.
echo API Endpoints:
echo   - http://localhost:3001/api/health
echo   - http://localhost:3001/api/nba-live-game?gameId=0012500010
echo   - http://localhost:3001/api/player-stats
echo   - http://localhost:3001/api/news
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

node server.js

pause
