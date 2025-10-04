// NBA.com Live Game Data API for Vercel Serverless Functions
// Fetches real-time game data from NBA.com's official Stats API

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
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
    
    if (!gameId) {
      return res.status(400).json({ 
        success: false, 
        error: 'gameId parameter is required (NBA.com format: 00XXXXXXXXX)' 
      });
    }
    
    console.log(`Fetching NBA.com game data for gameId: ${gameId}`);
    
    // Fetch from NBA.com's official Stats API endpoints
    const [boxScoreResponse, playByPlayResponse] = await Promise.all([
      fetch(`https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.nba.com/',
          'Origin': 'https://www.nba.com'
        }
      }),
      fetch(`https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${gameId}.json`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.nba.com/',
          'Origin': 'https://www.nba.com'
        }
      }).catch(() => null) // Play-by-play might not be available for all games
    ]);
    
    if (!boxScoreResponse.ok) {
      throw new Error(`NBA.com API returned status: ${boxScoreResponse.status}`);
    }
    
    const boxScoreData = await boxScoreResponse.json();
    let playByPlayData = null;
    
    if (playByPlayResponse && playByPlayResponse.ok) {
      playByPlayData = await playByPlayResponse.json();
    }
    
    // Parse and format the data
    const gameData = parseNBAGameData(boxScoreData, playByPlayData);
    
    return res.status(200).json({
      success: true,
      data: gameData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching NBA game data:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch game data',
      timestamp: new Date().toISOString()
    });
  }
}

function parseNBAGameData(boxScoreData, playByPlayData) {
  const game = boxScoreData.game;
  
  // Determine game status
  let status = 'scheduled';
  let statusText = 'Scheduled';
  let period = 0;
  let clock = '12:00';
  
  if (game.gameStatusText) {
    const statusLower = game.gameStatusText.toLowerCase();
    if (statusLower.includes('final')) {
      status = 'final';
      statusText = 'Final';
    } else if (statusLower.includes('halftime')) {
      status = 'halftime';
      statusText = 'Halftime';
      period = 2;
    } else if (statusLower.match(/q[1-4]|period [1-4]/i)) {
      status = 'live';
      statusText = game.gameStatusText;
      period = game.period || 0;
      clock = game.gameClock || '0:00';
    } else if (game.gameStatus === 2) {
      status = 'live';
      statusText = game.gameStatusText;
      period = game.period || 0;
      clock = game.gameClock || '0:00';
    } else if (game.gameStatus === 3) {
      status = 'final';
      statusText = 'Final';
    }
  }
  
  // Get team data
  const homeTeam = game.homeTeam;
  const awayTeam = game.awayTeam;
  
  // Determine winner
  const homeScore = parseInt(homeTeam.score) || 0;
  const awayScore = parseInt(awayTeam.score) || 0;
  const homeWinner = status === 'final' && homeScore > awayScore;
  const awayWinner = status === 'final' && awayScore > homeScore;
  
  // Parse box score
  const homeBoxScore = parseTeamBoxScore(homeTeam, boxScoreData.game.homeTeam);
  const awayBoxScore = parseTeamBoxScore(awayTeam, boxScoreData.game.awayTeam);
  
  // Parse play-by-play
  const plays = playByPlayData ? parsePlayByPlay(playByPlayData) : [];
  
  // Parse team stats
  const homeStats = parseTeamStats(homeTeam.statistics || {});
  const awayStats = parseTeamStats(awayTeam.statistics || {});
  
  return {
    gameId: game.gameId,
    status: status,
    statusText: statusText,
    period: period,
    clock: clock,
    homeTeam: {
      id: homeTeam.teamId,
      name: homeTeam.teamName,
      tricode: homeTeam.teamTricode,
      score: homeScore,
      logo: `https://cdn.nba.com/logos/nba/${homeTeam.teamId}/primary/L/logo.svg`,
      record: `${homeTeam.wins || 0}-${homeTeam.losses || 0}`,
      winner: homeWinner,
      boxScore: homeBoxScore,
      stats: homeStats,
      periods: homeTeam.periods || []
    },
    awayTeam: {
      id: awayTeam.teamId,
      name: awayTeam.teamName,
      tricode: awayTeam.teamTricode,
      score: awayScore,
      logo: `https://cdn.nba.com/logos/nba/${awayTeam.teamId}/primary/L/logo.svg`,
      record: `${awayTeam.wins || 0}-${awayTeam.losses || 0}`,
      winner: awayWinner,
      boxScore: awayBoxScore,
      stats: awayStats,
      periods: awayTeam.periods || []
    },
    plays: plays
  };
}

function parseTeamBoxScore(team, teamData) {
  const players = teamData.players || [];
  
  return players.map(player => {
    const stats = player.statistics || {};
    
    return {
      personId: player.personId,
      name: player.name || `${player.firstName} ${player.familyName}`,
      firstName: player.firstName,
      familyName: player.familyName,
      jersey: player.jerseyNum,
      position: player.position || '',
      starter: player.starter === '1' || player.starter === true,
      oncourt: player.oncourt === '1' || player.oncourt === true,
      played: player.played === '1' || player.played === true,
      minutes: stats.minutes || '0:00',
      points: parseInt(stats.points) || 0,
      rebounds: parseInt(stats.reboundsTotal) || 0,
      assists: parseInt(stats.assists) || 0,
      steals: parseInt(stats.steals) || 0,
      blocks: parseInt(stats.blocks) || 0,
      turnovers: parseInt(stats.turnovers) || 0,
      fouls: parseInt(stats.foulsPersonal) || 0,
      fieldGoalsMade: parseInt(stats.fieldGoalsMade) || 0,
      fieldGoalsAttempted: parseInt(stats.fieldGoalsAttempted) || 0,
      fieldGoalPct: stats.fieldGoalsPercentage || '0.0',
      threePointersMade: parseInt(stats.threePointersMade) || 0,
      threePointersAttempted: parseInt(stats.threePointersAttempted) || 0,
      threePointerPct: stats.threePointersPercentage || '0.0',
      freeThrowsMade: parseInt(stats.freeThrowsMade) || 0,
      freeThrowsAttempted: parseInt(stats.freeThrowsAttempted) || 0,
      freeThrowPct: stats.freeThrowsPercentage || '0.0',
      plusMinus: stats.plusMinusPoints || '0',
      offensiveRebounds: parseInt(stats.reboundsOffensive) || 0,
      defensiveRebounds: parseInt(stats.reboundsDefensive) || 0
    };
  }).filter(player => player.played); // Only return players who played
}

function parseTeamStats(stats) {
  return {
    fieldGoalPct: stats.fieldGoalsPercentage || '0.0',
    threePointerPct: stats.threePointersPercentage || '0.0',
    freeThrowPct: stats.freeThrowsPercentage || '0.0',
    rebounds: parseInt(stats.reboundsTotal) || 0,
    assists: parseInt(stats.assists) || 0,
    turnovers: parseInt(stats.turnovers) || 0,
    steals: parseInt(stats.steals) || 0,
    blocks: parseInt(stats.blocks) || 0,
    points: parseInt(stats.points) || 0,
    fieldGoalsMade: parseInt(stats.fieldGoalsMade) || 0,
    fieldGoalsAttempted: parseInt(stats.fieldGoalsAttempted) || 0,
    threePointersMade: parseInt(stats.threePointersMade) || 0,
    threePointersAttempted: parseInt(stats.threePointersAttempted) || 0,
    freeThrowsMade: parseInt(stats.freeThrowsMade) || 0,
    freeThrowsAttempted: parseInt(stats.freeThrowsAttempted) || 0
  };
}

function parsePlayByPlay(playByPlayData) {
  const actions = playByPlayData.game?.actions || [];
  
  return actions
    .filter(action => action.actionType !== 'period' && action.description)
    .map(action => {
      let emoji = '🏀';
      const desc = action.description.toLowerCase();
      
      // Add emojis based on play type
      if (desc.includes('3pt')) emoji = '🎯';
      else if (desc.includes('dunk')) emoji = '💥';
      else if (desc.includes('layup')) emoji = '🏀';
      else if (desc.includes('miss')) emoji = '🚫';
      else if (desc.includes('rebound')) emoji = '🔄';
      else if (desc.includes('assist')) emoji = '🤝';
      else if (desc.includes('steal')) emoji = '🔥';
      else if (desc.includes('block')) emoji = '🛡️';
      else if (desc.includes('turnover')) emoji = '❌';
      else if (desc.includes('foul')) emoji = '⚠️';
      else if (desc.includes('free throw')) emoji = '🎯';
      
      return {
        clock: action.clock || '0:00',
        period: action.period || 1,
        teamId: action.teamId || null,
        teamTricode: action.teamTricode || '',
        personId: action.personId || null,
        playerName: action.playerName || action.playerNameI || '',
        actionType: action.actionType || '',
        subType: action.subType || '',
        description: action.description || '',
        emoji: emoji,
        scoreHome: action.scoreHome || '0',
        scoreAway: action.scoreAway || '0'
      };
    })
    .reverse(); // Most recent plays first
}
