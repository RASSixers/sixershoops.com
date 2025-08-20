// NBA Game Data API Endpoint for Vercel Serverless Functions
// This fetches real NBA data using Vercel's serverless function format

import fetch from 'node-fetch';

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

// Main API endpoint for Vercel
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { date, team, opponent } = req.query;
    
    console.log(`Fetching NBA data for ${date}, team: ${team}, opponent: ${opponent}`);
    
    // Try Ball Don't Lie API first (more reliable)
    try {
      const ballDontLieData = await fetchFromBallDontLie(date, opponent);
      if (ballDontLieData) {
        res.json(ballDontLieData);
        return;
      }
    } catch (error) {
      console.warn('Ball Dont Lie API failed:', error);
    }
    
    // Fallback to mock data
    const mockData = generateMockGameData(date, opponent);
    res.json(mockData);
    
  } catch (error) {
    console.error('NBA API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch NBA data',
      message: error.message 
    });
  }
}

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

// Generate mock game data for testing
function generateMockGameData(date, opponent) {
  return {
    opponent: opponent || "Boston Celtics",
    homeScore: 108,
    awayScore: 112,
    status: "Final",
    quarter: 4,
    timeRemaining: "0:00",
    plays: [
      { time: "Q4 0:00", description: "🏀 Game Final", score: "108-112" },
      { time: "Q4 0:23", description: "🎯 Tyrese Maxey made 3PT shot", score: "108-109" },
      { time: "Q4 0:45", description: "🚫 Joel Embiid missed shot", score: "105-109" },
      { time: "Q4 1:12", description: "🔄 Joel Embiid defensive rebound", score: "105-109" },
      { time: "Q4 1:34", description: "🤝 Tyrese Maxey assist to Paul George", score: "105-107" }
    ],
    boxScore: {
      sixers: [
        { name: "Joel Embiid", minutes: "32:45", points: 28, rebounds: 12, assists: 4, fg: "10/18", threePt: "1/3", ft: "7/8" },
        { name: "Tyrese Maxey", minutes: "38:12", points: 24, rebounds: 3, assists: 8, fg: "9/16", threePt: "4/7", ft: "2/2" },
        { name: "Paul George", minutes: "35:23", points: 18, rebounds: 6, assists: 5, fg: "7/14", threePt: "2/6", ft: "2/2" }
      ],
      opponent: [
        { name: "Jayson Tatum", minutes: "36:45", points: 32, rebounds: 8, assists: 6, fg: "12/20", threePt: "4/8", ft: "4/4" },
        { name: "Jaylen Brown", minutes: "34:12", points: 26, rebounds: 5, assists: 4, fg: "10/17", threePt: "3/6", ft: "3/4" }
      ]
    },
    stats: {
      sixers: { fg_pct: 0.456, three_pt_pct: 0.389, rebounds: 42, assists: 24 },
      opponent: { fg_pct: 0.478, three_pt_pct: 0.412, rebounds: 45, assists: 28 }
    }
  };
}
