// ESPN Live Game Data API for Vercel Serverless Functions
// Fetches real-time game data from ESPN's official API

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
        error: 'gameId parameter is required' 
      });
    }
    
    console.log(`Fetching ESPN game data for gameId: ${gameId}`);
    
    // Fetch from ESPN's official API
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${gameId}`;
    
    const response = await fetch(espnUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`ESPN API returned status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse and format the data
    const gameData = parseESPNGameData(data);
    
    res.json({
      success: true,
      ...gameData,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('ESPN API Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch game data',
      message: error.message 
    });
  }
}

function parseESPNGameData(data) {
  try {
    const header = data.header || {};
    const competitions = data.header?.competitions?.[0] || {};
    const competitors = competitions.competitors || [];
    
    // Find home and away teams
    const homeTeam = competitors.find(c => c.homeAway === 'home') || {};
    const awayTeam = competitors.find(c => c.homeAway === 'away') || {};
    
    // Game status
    const status = competitions.status || {};
    const gameStatus = status.type?.state || 'pre'; // pre, in, post
    const period = status.period || 0;
    const clock = status.displayClock || '12:00';
    
    // Scores
    const homeScore = parseInt(homeTeam.score) || 0;
    const awayScore = parseInt(awayTeam.score) || 0;
    
    // Box score data
    const boxscore = data.boxscore || {};
    const players = boxscore.players || [];
    
    // Play-by-play data
    const plays = data.plays || [];
    const recentPlays = parsePlayByPlay(plays);
    
    // Team stats
    const teamStats = parseTeamStats(data.boxscore?.teams || []);
    
    return {
      game: {
        id: data.header?.id || '',
        status: gameStatus,
        statusText: status.type?.detail || 'Scheduled',
        period: period,
        clock: clock,
        venue: competitions.venue?.fullName || 'TBD',
        attendance: competitions.attendance || 0,
        homeTeam: {
          id: homeTeam.id || '',
          name: homeTeam.team?.displayName || 'Home',
          abbreviation: homeTeam.team?.abbreviation || 'HOME',
          logo: homeTeam.team?.logo || '',
          score: homeScore,
          record: homeTeam.record?.[0]?.displayValue || '0-0',
          winner: homeTeam.winner || false
        },
        awayTeam: {
          id: awayTeam.id || '',
          name: awayTeam.team?.displayName || 'Away',
          abbreviation: awayTeam.team?.abbreviation || 'AWAY',
          logo: awayTeam.team?.logo || '',
          score: awayScore,
          record: awayTeam.record?.[0]?.displayValue || '0-0',
          winner: awayTeam.winner || false
        }
      },
      plays: recentPlays,
      boxScore: parseBoxScore(players, homeTeam.id, awayTeam.id),
      quarterScores: parseQuarterScores(data.boxscore?.teams || [], homeTeam.id, awayTeam.id),
      teamStats: teamStats
    };
  } catch (error) {
    console.error('Error parsing ESPN data:', error);
    throw error;
  }
}

function parsePlayByPlay(plays) {
  if (!plays || plays.length === 0) return [];
  
  try {
    // Get the most recent plays (last 20)
    const recentPlays = plays.slice(-20).reverse();
    
    return recentPlays.map(play => {
      const text = play.text || '';
      const period = play.period?.number || 0;
      const clock = play.clock?.displayValue || '';
      const scoreValue = play.scoreValue || 0;
      const awayScore = play.awayScore || 0;
      const homeScore = play.homeScore || 0;
      
      // Add emoji based on play type
      let emoji = '';
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes('makes') && lowerText.includes('three point')) {
        emoji = '🎯';
      } else if (lowerText.includes('makes')) {
        emoji = '🏀';
      } else if (lowerText.includes('misses')) {
        emoji = '🚫';
      } else if (lowerText.includes('rebound')) {
        emoji = '🔄';
      } else if (lowerText.includes('assist')) {
        emoji = '🤝';
      } else if (lowerText.includes('foul')) {
        emoji = '⚠️';
      } else if (lowerText.includes('turnover')) {
        emoji = '❌';
      } else if (lowerText.includes('dunk')) {
        emoji = '💥';
      } else if (lowerText.includes('block')) {
        emoji = '🛡️';
      } else if (lowerText.includes('steal')) {
        emoji = '🏃';
      }
      
      return {
        time: period > 0 ? `Q${period} ${clock}` : 'Pregame',
        description: emoji ? `${emoji} ${text}` : text,
        score: `${awayScore}-${homeScore}`,
        scoreValue: scoreValue,
        type: play.type?.text || ''
      };
    });
  } catch (error) {
    console.error('Error parsing play-by-play:', error);
    return [];
  }
}

function parseBoxScore(players, homeTeamId, awayTeamId) {
  if (!players || players.length === 0) {
    return {
      homeTeam: { players: [] },
      awayTeam: { players: [] }
    };
  }
  
  try {
    const homePlayers = [];
    const awayPlayers = [];
    
    players.forEach(teamData => {
      const teamId = teamData.team?.id || '';
      const isHome = teamId === homeTeamId;
      const statistics = teamData.statistics || [];
      
      // Get player stats
      const playerStats = statistics.find(s => s.name === 'passing') || statistics[0] || {};
      const athletes = playerStats.athletes || [];
      
      athletes.forEach(athlete => {
        const stats = athlete.stats || [];
        const playerData = {
          name: athlete.athlete?.displayName || 'Unknown',
          position: athlete.athlete?.position?.abbreviation || '',
          jersey: athlete.athlete?.jersey || '',
          minutes: stats[0] || '0',
          points: parseInt(stats[15]) || 0,
          rebounds: parseInt(stats[11]) || 0,
          assists: parseInt(stats[12]) || 0,
          steals: parseInt(stats[13]) || 0,
          blocks: parseInt(stats[14]) || 0,
          turnovers: parseInt(stats[16]) || 0,
          fg: `${stats[1] || 0}/${stats[2] || 0}`,
          threePt: `${stats[4] || 0}/${stats[5] || 0}`,
          ft: `${stats[7] || 0}/${stats[8] || 0}`,
          plusMinus: stats[17] || '0'
        };
        
        if (isHome) {
          homePlayers.push(playerData);
        } else {
          awayPlayers.push(playerData);
        }
      });
    });
    
    return {
      homeTeam: { players: homePlayers },
      awayTeam: { players: awayPlayers }
    };
  } catch (error) {
    console.error('Error parsing box score:', error);
    return {
      homeTeam: { players: [] },
      awayTeam: { players: [] }
    };
  }
}

function parseQuarterScores(teams, homeTeamId, awayTeamId) {
  if (!teams || teams.length === 0) {
    return null;
  }
  
  try {
    const homeTeam = teams.find(t => t.team?.id === homeTeamId) || {};
    const awayTeam = teams.find(t => t.team?.id === awayTeamId) || {};
    
    const getLinescores = (team) => {
      const linescores = team.statistics?.find(s => s.name === 'linescores')?.displayValue || '';
      const scores = linescores.split(',').map(s => parseInt(s.trim()) || 0);
      return {
        q1: scores[0] || 0,
        q2: scores[1] || 0,
        q3: scores[2] || 0,
        q4: scores[3] || 0,
        total: scores.reduce((a, b) => a + b, 0)
      };
    };
    
    return {
      homeTeam: {
        name: homeTeam.team?.displayName || 'Home',
        ...getLinescores(homeTeam)
      },
      awayTeam: {
        name: awayTeam.team?.displayName || 'Away',
        ...getLinescores(awayTeam)
      }
    };
  } catch (error) {
    console.error('Error parsing quarter scores:', error);
    return null;
  }
}

function parseTeamStats(teams) {
  if (!teams || teams.length === 0) {
    return {
      fieldGoalPct: 0,
      threePtPct: 0,
      freeThrowPct: 0,
      rebounds: 0,
      assists: 0,
      turnovers: 0,
      steals: 0,
      blocks: 0
    };
  }
  
  try {
    // Get 76ers team stats (usually the home team)
    const sixersTeam = teams[0] || {};
    const stats = sixersTeam.statistics || [];
    
    const getStat = (name) => {
      const stat = stats.find(s => s.name === name);
      return stat?.displayValue || '0';
    };
    
    return {
      fieldGoalPct: parseFloat(getStat('fieldGoalPct')) || 0,
      threePtPct: parseFloat(getStat('threePointFieldGoalPct')) || 0,
      freeThrowPct: parseFloat(getStat('freeThrowPct')) || 0,
      rebounds: parseInt(getStat('totalRebounds')) || 0,
      assists: parseInt(getStat('assists')) || 0,
      turnovers: parseInt(getStat('turnovers')) || 0,
      steals: parseInt(getStat('steals')) || 0,
      blocks: parseInt(getStat('blocks')) || 0
    };
  } catch (error) {
    console.error('Error parsing team stats:', error);
    return {
      fieldGoalPct: 0,
      threePtPct: 0,
      freeThrowPct: 0,
      rebounds: 0,
      assists: 0,
      turnovers: 0,
      steals: 0,
      blocks: 0
    };
  }
}
