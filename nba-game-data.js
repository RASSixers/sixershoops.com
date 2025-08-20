// NBA Game Data API Endpoint
// This is a Node.js/Express backend that fetches real NBA data
// Place this in your backend server (e.g., Vercel, Netlify Functions, or Express server)

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // or use built-in fetch in Node 18+

const app = express();
app.use(cors());
app.use(express.json());

// NBA API Configuration
const NBA_API_BASE = 'https://stats.nba.com/stats';
const NBA_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Host': 'stats.nba.com',
  'Origin': 'https://www.nba.com',
  'Pragma': 'no-cache',
  'Referer': 'https://www.nba.com/',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true'
};

// Philadelphia 76ers Team ID
const SIXERS_TEAM_ID = '1610612755';

// Main API endpoint
app.get('/api/nba-game-data', async (req, res) => {
  try {
    const { date, team, opponent } = req.query;
    
    console.log(`Fetching NBA data for ${date}, team: ${team}, opponent: ${opponent}`);
    
    // Step 1: Get games for the date
    const scoreboard = await fetchScoreboard(date);
    
    // Step 2: Find the 76ers game
    const game = findSixersGame(scoreboard, opponent);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Step 3: Get detailed game data
    const [playByPlay, boxScore] = await Promise.all([
      fetchPlayByPlay(game.gameId),
      fetchBoxScore(game.gameId)
    ]);
    
    // Step 4: Process and return data
    const gameData = processGameData(game, playByPlay, boxScore);
    
    res.json(gameData);
    
  } catch (error) {
    console.error('NBA API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch NBA data',
      message: error.message 
    });
  }
});

// Fetch scoreboard for a specific date
async function fetchScoreboard(gameDate) {
  const url = `${NBA_API_BASE}/scoreboardV2?DayOffset=0&LeagueID=00&gameDate=${gameDate}`;
  
  const response = await fetch(url, { headers: NBA_HEADERS });
  
  if (!response.ok) {
    throw new Error(`Scoreboard API failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.resultSets[0].rowSet; // Game data
}

// Find 76ers game in scoreboard
function findSixersGame(games, opponentAbbr) {
  for (const game of games) {
    const [gameDate, gameId, homeTeamId, awayTeamId, gameStatus, ...rest] = game;
    
    // Check if 76ers are playing (either home or away)
    if (homeTeamId === SIXERS_TEAM_ID || awayTeamId === SIXERS_TEAM_ID) {
      return {
        gameId,
        homeTeamId,
        awayTeamId,
        gameStatus,
        isHome: homeTeamId === SIXERS_TEAM_ID
      };
    }
  }
  return null;
}

// Fetch play-by-play data
async function fetchPlayByPlay(gameId) {
  const url = `${NBA_API_BASE}/playbyplayv2?GameID=${gameId}&StartPeriod=0&EndPeriod=10`;
  
  try {
    const response = await fetch(url, { headers: NBA_HEADERS });
    
    if (!response.ok) {
      console.warn(`Play-by-play API failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data.resultSets[0].rowSet; // Play data
  } catch (error) {
    console.warn('Play-by-play fetch failed:', error);
    return null;
  }
}

// Fetch box score data
async function fetchBoxScore(gameId) {
  const url = `${NBA_API_BASE}/boxscoretraditionalv2?GameID=${gameId}&StartPeriod=0&EndPeriod=10&StartRange=0&EndRange=28800&RangeType=2`;
  
  try {
    const response = await fetch(url, { headers: NBA_HEADERS });
    
    if (!response.ok) {
      console.warn(`Box score API failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return {
      playerStats: data.resultSets[0].rowSet, // Player stats
      teamStats: data.resultSets[1].rowSet    // Team stats
    };
  } catch (error) {
    console.warn('Box score fetch failed:', error);
    return null;
  }
}

// Process raw NBA API data into our format
function processGameData(game, playByPlay, boxScore) {
  const gameData = {
    gameId: game.gameId,
    opponent: 'Opponent', // You'd get this from team lookup
    homeScore: 0,
    awayScore: 0,
    status: game.gameStatus,
    plays: [],
    boxScore: {
      sixers: [],
      opponent: []
    },
    stats: {
      sixers: {},
      opponent: {}
    }
  };
  
  // Process play-by-play
  if (playByPlay) {
    gameData.plays = playByPlay
      .filter(play => play[7]) // Filter out empty descriptions
      .slice(0, 20) // Get last 20 plays
      .map(play => ({
        time: `Q${play[4]} ${play[6]}`, // Period and time
        description: formatPlayDescription(play[7]), // Description with emojis
        score: `${play[8]}-${play[9]}` // Score
      }))
      .reverse(); // Show most recent first
  }
  
  // Process box score
  if (boxScore && boxScore.playerStats) {
    const sixersPlayers = [];
    const opponentPlayers = [];
    
    boxScore.playerStats.forEach(player => {
      const playerData = {
        name: player[5], // Player name
        minutes: player[8], // Minutes
        points: player[26], // Points
        rebounds: player[20], // Total rebounds
        assists: player[21], // Assists
        fg: `${player[9]}/${player[10]}`, // FG made/attempted
        threePt: `${player[12]}/${player[13]}`, // 3PT made/attempted
        ft: `${player[15]}/${player[16]}` // FT made/attempted
      };
      
      if (player[1] === SIXERS_TEAM_ID) {
        sixersPlayers.push(playerData);
      } else {
        opponentPlayers.push(playerData);
      }
    });
    
    gameData.boxScore.sixers = sixersPlayers;
    gameData.boxScore.opponent = opponentPlayers;
  }
  
  return gameData;
}

// Format play description with emojis (same as frontend)
function formatPlayDescription(description) {
  if (!description) return '';
  
  if (description.includes('makes') && description.includes('3PT')) {
    return `🎯 ${description}`;
  } else if (description.includes('makes')) {
    return `🏀 ${description}`;
  } else if (description.includes('misses')) {
    return `🚫 ${description}`;
  } else if (description.includes('rebound')) {
    return `🔄 ${description}`;
  } else if (description.includes('assist')) {
    return `🤝 ${description}`;
  } else if (description.includes('foul')) {
    return `⚠️ ${description}`;
  } else if (description.includes('turnover')) {
    return `❌ ${description}`;
  } else if (description.includes('dunk')) {
    return `💥 ${description}`;
  }
  
  return description;
}

// Alternative endpoint using Ball Don't Lie API (free, no auth)
app.get('/api/nba-simple', async (req, res) => {
  try {
    const { date } = req.query;
    
    // Ball Don't Lie API - free and reliable
    const url = `https://www.balldontlie.io/api/v1/games?dates[]=${date}&team_ids[]=23`; // 23 = 76ers
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const game = data.data[0];
      const isHome = game.home_team.abbreviation === 'PHI';
      
      res.json({
        opponent: isHome ? game.visitor_team.full_name : game.home_team.full_name,
        homeScore: isHome ? game.home_team_score : game.visitor_team_score,
        awayScore: isHome ? game.visitor_team_score : game.home_team_score,
        status: game.status,
        plays: [], // Not available in free API
        boxScore: { sixers: [], opponent: [] },
        stats: { sixers: {}, opponent: {} }
      });
    } else {
      res.status(404).json({ error: 'No game found' });
    }
    
  } catch (error) {
    console.error('Simple API Error:', error);
    res.status(500).json({ error: 'Failed to fetch game data' });
  }
});

// Start server (for local development)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`NBA API server running on port ${PORT}`);
});

module.exports = app; // For Vercel/Netlify deployment
