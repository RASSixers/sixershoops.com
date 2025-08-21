// NBA Live Data API for Vercel Serverless Functions
// This fetches real-time NBA data and serves it to the frontend

import fetch from 'node-fetch';

// NBA API endpoints (using NBA.com's official endpoints)
const NBA_ENDPOINTS = {
  scoreboard: 'https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json',
  playByPlay: (gameId) => `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${gameId}.json`,
  boxScore: (gameId) => `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json`,
  gameDetail: (gameId) => `https://stats.nba.com/stats/boxscoretraditionalv2?EndPeriod=10&EndRange=28800&GameID=${gameId}&RangeType=0&Season=2024-25&SeasonType=Regular+Season&StartPeriod=1&StartRange=0`
};

// Team mapping for Philadelphia 76ers
const SIXERS_TEAM_ID = '1610612755';
const TEAM_ABBREVIATIONS = {
  '1610612737': 'ATL', '1610612738': 'BOS', '1610612751': 'BKN', '1610612766': 'CHA',
  '1610612741': 'CHI', '1610612739': 'CLE', '1610612742': 'DAL', '1610612743': 'DEN',
  '1610612765': 'DET', '1610612744': 'GSW', '1610612745': 'HOU', '1610612754': 'IND',
  '1610612746': 'LAC', '1610612747': 'LAL', '1610612763': 'MEM', '1610612748': 'MIA',
  '1610612749': 'MIL', '1610612750': 'MIN', '1610612740': 'NOP', '1610612752': 'NYK',
  '1610612760': 'OKC', '1610612753': 'ORL', '1610612755': '76', '1610612756': 'PHX',
  '1610612757': 'POR', '1610612758': 'SAC', '1610612759': 'SAS', '1610612761': 'TOR',
  '1610612762': 'UTA', '1610612764': 'WAS'
};

// Helper function to get team abbreviation
function getTeamAbbreviation(teamId) {
  return TEAM_ABBREVIATIONS[teamId] || 'UNK';
}

// Helper function to format time
function formatGameTime(period, clock) {
  if (period === 0) return 'Pregame';
  if (period > 4) return `OT${period - 4} ${clock}`;
  return `Q${period} ${clock}`;
}

// Helper function to determine if game is live
function isGameLive(gameStatus) {
  return gameStatus === 2; // 1 = not started, 2 = live, 3 = finished
}

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
    const { gameId } = req.query;
    
    console.log(`NBA Live API called with gameId: ${gameId}`);
    
    // If no gameId provided, find the current/next Sixers game
    if (!gameId || gameId === 'latest') {
      const currentGame = await findCurrentSixersGame();
      if (!currentGame) {
        return res.json({
          success: false,
          error: 'No current Sixers game found',
          message: 'No live or upcoming 76ers game available today'
        });
      }
      const gameData = await getGameData(currentGame.gameId);
      return res.json(gameData);
    }
    
    // Get specific game data
    const gameData = await getGameData(gameId);
    res.json(gameData);
    
  } catch (error) {
    console.error('NBA Live API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Find current or next Sixers game
async function findCurrentSixersGame() {
  try {
    console.log('🔍 Looking for current Sixers game...');
    const response = await fetch(NBA_ENDPOINTS.scoreboard);
    
    if (!response.ok) {
      throw new Error(`Scoreboard API failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.scoreboard || !data.scoreboard.games) {
      console.log('No games found in scoreboard');
      return null;
    }
    
    // Look for Sixers game in today's games
    const sixersGame = data.scoreboard.games.find(game => 
      game.homeTeam.teamId === SIXERS_TEAM_ID || 
      game.awayTeam.teamId === SIXERS_TEAM_ID
    );
    
    if (sixersGame) {
      console.log(`✅ Found Sixers game: ${sixersGame.gameId}`);
      return {
        gameId: sixersGame.gameId,
        status: sixersGame.gameStatus
      };
    }
    
    console.log('No Sixers game found today');
    return null;
  } catch (error) {
    console.error('Error finding current Sixers game:', error);
    return null;
  }
}

// Get comprehensive game data
async function getGameData(gameId) {
  try {
    console.log(`📊 Fetching game data for: ${gameId}`);
    
    // Try to fetch real NBA data first
    try {
      const [playByPlayData, boxScoreData] = await Promise.all([
        fetchPlayByPlay(gameId),
        fetchBoxScore(gameId)
      ]);
      
      if (boxScoreData) {
        const gameInfo = parseGameInfo(boxScoreData);
        const plays = parsePlayByPlay(playByPlayData);
        const boxScore = parseBoxScore(boxScoreData);
        const quarterScores = parseQuarterScores(boxScoreData);
        const stats = parseGameStats(boxScoreData);
        
        return {
          success: true,
          game: gameInfo,
          plays: plays,
          boxScore: boxScore,
          quarterScores: quarterScores,
          stats: stats,
          source: 'NBA Official API'
        };
      }
    } catch (apiError) {
      console.warn('NBA API failed, using mock data:', apiError);
    }
    
    // Fallback to mock data
    console.log('📝 Using mock data for game:', gameId);
    return generateMockGameData(gameId);
    
  } catch (error) {
    console.error('Error getting game data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Fetch play-by-play data
async function fetchPlayByPlay(gameId) {
  try {
    const response = await fetch(NBA_ENDPOINTS.playByPlay(gameId));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching play-by-play:', error);
    return null;
  }
}

// Fetch box score data
async function fetchBoxScore(gameId) {
  try {
    const response = await fetch(NBA_ENDPOINTS.boxScore(gameId));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching box score:', error);
    return null;
  }
}

// Parse game information
function parseGameInfo(boxScoreData) {
  if (!boxScoreData || !boxScoreData.game) {
    return null;
  }
  
  const game = boxScoreData.game;
  
  return {
    gameId: game.gameId,
    date: game.gameTimeUTC,
    venue: game.arena?.arenaName || 'TBD',
    status: isGameLive(game.gameStatus) ? 'live' : (game.gameStatus === 1 ? 'upcoming' : 'final'),
    clock: game.gameClock || '12:00',
    period: formatGameTime(game.period, game.gameClock),
    awayTeam: {
      teamId: game.awayTeam.teamId,
      name: game.awayTeam.teamName,
      abbreviation: getTeamAbbreviation(game.awayTeam.teamId),
      score: game.awayTeam.score || 0,
      wins: game.awayTeam.wins || 0,
      losses: game.awayTeam.losses || 0
    },
    homeTeam: {
      teamId: game.homeTeam.teamId,
      name: game.homeTeam.teamName,
      abbreviation: getTeamAbbreviation(game.homeTeam.teamId),
      score: game.homeTeam.score || 0,
      wins: game.homeTeam.wins || 0,
      losses: game.homeTeam.losses || 0
    }
  };
}

// Parse play-by-play data
function parsePlayByPlay(playByPlayData) {
  if (!playByPlayData || !playByPlayData.game || !playByPlayData.game.actions) {
    return [];
  }
  
  const actions = playByPlayData.game.actions;
  
  // Get the most recent 50 plays and reverse for chronological order
  return actions
    .slice(-50)
    .reverse()
    .map(action => ({
      actionId: action.actionNumber,
      time: `${action.period}Q ${action.clock}`,
      description: formatPlayDescription(action),
      score: `${action.scoreAway || 0}-${action.scoreHome || 0}`,
      type: action.actionType,
      period: action.period
    }));
}

// Format play description for better readability
function formatPlayDescription(action) {
  let description = action.description || '';
  
  // Enhance descriptions with player names and context
  if (action.personId && action.playerName) {
    description = description.replace(action.playerName, `**${action.playerName}**`);
  }
  
  // Add context for different play types
  switch (action.actionType) {
    case 'Made Shot':
      if (action.shotDistance) {
        description += ` (${action.shotDistance}ft)`;
      }
      break;
    case 'Missed Shot':
      description = `🚫 ${description}`;
      break;
    case 'Rebound':
      description = `🏀 ${description}`;
      break;
    case 'Assist':
      description = `🤝 ${description}`;
      break;
    case 'Turnover':
      description = `❌ ${description}`;
      break;
    case 'Foul':
      description = `⚠️ ${description}`;
      break;
    case 'Free Throw':
      description = `🎯 ${description}`;
      break;
    case 'Substitution':
      description = `🔄 ${description}`;
      break;
    case 'Timeout':
      description = `⏱️ ${description}`;
      break;
  }
  
  return description;
}

// Parse box score data
function parseBoxScore(boxScoreData) {
  if (!boxScoreData || !boxScoreData.game) {
    return null;
  }
  
  const game = boxScoreData.game;
  
  return {
    awayTeam: {
      name: game.awayTeam.teamName,
      players: parsePlayerStats(game.awayTeam.players || [])
    },
    homeTeam: {
      name: game.homeTeam.teamName,
      players: parsePlayerStats(game.homeTeam.players || [])
    }
  };
}

// Parse player statistics
function parsePlayerStats(players) {
  return players
    .filter(player => player.played) // Only include players who have played
    .sort((a, b) => (b.statistics?.points || 0) - (a.statistics?.points || 0)) // Sort by points
    .slice(0, 10) // Top 10 players
    .map(player => ({
      playerId: player.personId,
      name: `${player.firstName} ${player.familyName}`,
      position: player.position,
      minutes: player.statistics?.minutesCalculated || '0:00',
      points: player.statistics?.points || 0,
      rebounds: player.statistics?.reboundsTotal || 0,
      assists: player.statistics?.assists || 0,
      steals: player.statistics?.steals || 0,
      blocks: player.statistics?.blocks || 0,
      turnovers: player.statistics?.turnovers || 0,
      fieldGoalsMade: player.statistics?.fieldGoalsMade || 0,
      fieldGoalsAttempted: player.statistics?.fieldGoalsAttempted || 0,
      threePointersMade: player.statistics?.threePointersMade || 0,
      threePointersAttempted: player.statistics?.threePointersAttempted || 0,
      freeThrowsMade: player.statistics?.freeThrowsMade || 0,
      freeThrowsAttempted: player.statistics?.freeThrowsAttempted || 0
    }));
}

// Parse quarter scores
function parseQuarterScores(boxScoreData) {
  if (!boxScoreData || !boxScoreData.game) {
    return null;
  }
  
  const game = boxScoreData.game;
  
  return {
    awayTeam: {
      name: getTeamAbbreviation(game.awayTeam.teamId),
      q1: game.awayTeam.periods?.[0]?.score || null,
      q2: game.awayTeam.periods?.[1]?.score || null,
      q3: game.awayTeam.periods?.[2]?.score || null,
      q4: game.awayTeam.periods?.[3]?.score || null,
      total: game.awayTeam.score || 0
    },
    homeTeam: {
      name: getTeamAbbreviation(game.homeTeam.teamId),
      q1: game.homeTeam.periods?.[0]?.score || null,
      q2: game.homeTeam.periods?.[1]?.score || null,
      q3: game.homeTeam.periods?.[2]?.score || null,
      q4: game.homeTeam.periods?.[3]?.score || null,
      total: game.homeTeam.score || 0
    }
  };
}

// Parse game statistics
function parseGameStats(boxScoreData) {
  if (!boxScoreData || !boxScoreData.game) {
    return null;
  }
  
  const game = boxScoreData.game;
  const homeStats = game.homeTeam.statistics || {};
  const awayStats = game.awayTeam.statistics || {};
  
  // Calculate team averages (focusing on Sixers if they're playing)
  const sixersStats = game.homeTeam.teamId === SIXERS_TEAM_ID ? homeStats : awayStats;
  
  return {
    fieldGoalPct: Math.round((sixersStats.fieldGoalsPercentage || 0) * 100),
    threePtPct: Math.round((sixersStats.threePointersPercentage || 0) * 100),
    freeThrowPct: Math.round((sixersStats.freeThrowsPercentage || 0) * 100),
    rebounds: sixersStats.reboundsTotal || 0,
    assists: sixersStats.assists || 0,
    turnovers: sixersStats.turnovers || 0
  };
}

// Generate mock game data for testing
function generateMockGameData(gameId) {
  const homeScore = Math.floor(Math.random() * 30) + 95;
  const awayScore = Math.floor(Math.random() * 30) + 95;
  
  return {
    success: true,
    game: {
      gameId: gameId,
      date: new Date().toISOString(),
      venue: 'Wells Fargo Center',
      status: 'live',
      clock: '7:23',
      period: 'Q3 7:23',
      awayTeam: {
        teamId: '1610612738',
        name: 'Boston Celtics',
        abbreviation: 'BOS',
        score: awayScore,
        wins: 25,
        losses: 10
      },
      homeTeam: {
        teamId: SIXERS_TEAM_ID,
        name: 'Philadelphia 76ers',
        abbreviation: '76',
        score: homeScore,
        wins: 20,
        losses: 15
      }
    },
    plays: [
      { time: "Q3 7:23", description: "🏀 Joel Embiid made 15ft jumper", score: `${homeScore}-${awayScore}` },
      { time: "Q3 7:45", description: "🤝 Tyrese Maxey assist", score: `${homeScore-2}-${awayScore}` },
      { time: "Q3 8:12", description: "🚫 Opponent missed 3-pointer", score: `${homeScore-2}-${awayScore}` },
      { time: "Q3 8:34", description: "🔄 Tobias Harris defensive rebound", score: `${homeScore-2}-${awayScore}` },
      { time: "Q3 8:56", description: "🎯 Tyrese Maxey made free throw", score: `${homeScore-3}-${awayScore}` }
    ],
    boxScore: {
      awayTeam: {
        name: 'Boston Celtics',
        players: [
          { name: "Jayson Tatum", minutes: "28:45", points: 24, rebounds: 8, assists: 5, fg: "9/15", threePt: "3/7", ft: "3/4" },
          { name: "Jaylen Brown", minutes: "26:12", points: 18, rebounds: 5, assists: 3, fg: "7/13", threePt: "2/5", ft: "2/2" }
        ]
      },
      homeTeam: {
        name: 'Philadelphia 76ers',
        players: [
          { name: "Joel Embiid", minutes: "30:15", points: 28, rebounds: 12, assists: 4, fg: "10/18", threePt: "1/3", ft: "7/8" },
          { name: "Tyrese Maxey", minutes: "32:45", points: 22, rebounds: 3, assists: 7, fg: "8/16", threePt: "4/8", ft: "2/2" }
        ]
      }
    },
    quarterScores: {
      awayTeam: { name: 'BOS', q1: 28, q2: 25, q3: 22, q4: null, total: awayScore },
      homeTeam: { name: '76', q1: 30, q2: 27, q3: 24, q4: null, total: homeScore }
    },
    stats: {
      fieldGoalPct: 48,
      threePtPct: 36,
      freeThrowPct: 82,
      rebounds: 42,
      assists: 25,
      turnovers: 12
    },
    source: 'Mock Data'
  };
}
