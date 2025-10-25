const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Utilities
const RSSParser = require('rss-parser');
const rssParser = new RSSParser();

// Daily Pick'em API
const {
  handleDailyPickemAuth,
  handleDailyPickemQuestions,
  handleDailyPickemPicks,
  handleDailyPickemLeaderboard
} = require('../api/daily-pickem');

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from parent directory (HTML, CSS, JS, images)
const path = require('path');
app.use(express.static(path.join(__dirname, '..')));

// ========================
// DATABASE INITIALIZATION
// ========================
const { db, rawDb } = require('./db-init');
const { handlePickemAuth, handlePickemPicks, handlePickemLeaderboard } = require('../api/pickem');
const { checkAndGradeGames, initializeTestGames } = require('./grading-service');
const { 
  handleQuestionSetAdmin, 
  handleQuestionAdmin, 
  handleCustomPickemUser, 
  handleCustomPickemLeaderboard, 
  handleGrading 
} = require('../api/custom-pickem');

// Initialize database and pick'em routes
let dbReady = false;
(async () => {
  try {
    // Initialize test games if needed
    await initializeTestGames(db);
    
    console.log('✅ Database and pick\'em system initialized');
    dbReady = true;
    
    // Register traditional pick'em routes (NBA games)
    await handlePickemAuth(app, db);
    await handlePickemPicks(app, db);
    await handlePickemLeaderboard(app, db);
    
    // Register custom question pick'em routes
    await handleQuestionSetAdmin(app, db);
    await handleQuestionAdmin(app, db);
    await handleCustomPickemUser(app, db);
    await handleCustomPickemLeaderboard(app, db);
    await handleGrading(app, db);

    // Register daily pick'em routes
    await handleDailyPickemAuth(app, db);
    await handleDailyPickemQuestions(app, db);
    await handleDailyPickemPicks(app, db);
    await handleDailyPickemLeaderboard(app, db);
    
    // Auto-grading job - runs every 2 minutes
    setInterval(async () => {
      try {
        await checkAndGradeGames(db);
      } catch (error) {
        console.error('Auto-grading error:', error);
      }
    }, 2 * 60 * 1000);
    
    console.log('✅ Auto-grading job scheduled');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
})();

// Twitter API configuration
const TWITTER_API_URL = 'https://api.twitter.com/2';
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

if (!BEARER_TOKEN) {
  console.warn('⚠️ TWITTER_BEARER_TOKEN not set — Twitter endpoints will be disabled, other APIs will still run.');
}

// Twitter API helper function
async function makeTwitterRequest(endpoint, params = {}) {
  const url = new URL(`${TWITTER_API_URL}${endpoint}`);
  
  // Add query parameters
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Twitter API Error: ${response.status} - ${errorData.title || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Twitter API Request Error:', error);
    throw error;
  }
}

// API Routes

// NBA Stats proxy headers
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

// 76ers player stats proxy (per-game)
app.get('/api/player-stats', async (req, res) => {
  try {
    const season = typeof req.query.season === 'string' ? req.query.season : '2023-24';
    const teamId = '1610612755';

    const params = new URLSearchParams({
      TeamID: teamId,
      Season: season,
      SeasonType: 'Regular Season',
      MeasureType: 'Base',
      PerMode: 'PerGame',
      PlusMinus: 'N',
      PaceAdjust: 'N',
      Rank: 'N',
      Outcome: '',
      Location: '',
      Month: '0',
      SeasonSegment: '',
      DateFrom: '',
      DateTo: '',
      OpponentTeamID: '0',
      VsConference: '',
      VsDivision: '',
      GameSegment: '',
      Period: '0',
      LastNGames: '0'
    });

    const url = `${NBA_API_BASE}/teamplayerdashboard?${params.toString()}`;

    const response = await fetch(url, { headers: NBA_HEADERS });
    if (!response.ok) {
      return res.status(502).json({ success: false, error: `NBA stats HTTP ${response.status}` });
    }
    const data = await response.json();

    const resultSet = data?.resultSets?.[1];
    if (!resultSet) {
      return res.status(200).json({ success: false, error: 'Invalid player stats response' });
    }

    const headers = resultSet.headers || [];
    const players = (resultSet.rowSet || []).map(row => {
      const get = (name) => {
        const idx = headers.indexOf(name);
        return idx !== -1 ? row[idx] : 0;
      };
      const pts = get('PTS');
      const reb = get('REB');
      const ast = get('AST');
      const stl = get('STL');
      const blk = get('BLK');
      const tov = get('TOV');
      const fga = get('FGA');
      const fta = get('FTA');
      const eff = Number(pts) + Number(reb) + Number(ast) + Number(stl) + Number(blk) - Number(tov) - (Number(fga) - Number(get('FGM'))) - (Number(fta) - Number(get('FTM')));
      return {
        playerId: get('PLAYER_ID'),
        name: get('PLAYER_NAME'),
        gp: get('GP'),
        min: get('MIN'),
        pts, reb, ast, stl, blk, tov,
        plusMinus: get('PLUS_MINUS'),
        fgPct: get('FG_PCT'),
        threePct: get('FG3_PCT'),
        ftPct: get('FT_PCT'),
        eff
      };
    });

    res.json({ success: true, season, players, source: 'nba-stats-proxy' });
  } catch (error) {
    console.error('player-stats proxy error:', error);
    res.status(200).json({ success: false, error: 'Failed to fetch player stats' });
  }
});

// NBA Live Game Data endpoint
app.get('/api/nba-live-game', async (req, res) => {
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
});

// Helper function to parse NBA.com game data
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

// Unified news aggregator
app.post('/api/news', async (req, res) => {
  try {
    const { providers = ['twitter','rss','reddit'], maxResults = 50, category = 'all', startTime, endTime, handles } = req.body || {};

    const tasks = [];
    if (providers.includes('twitter')) {
      if (BEARER_TOKEN) {
        // Use Twitter only if configured
        tasks.push(fetchTwitterNews({ maxResults, category, startTime, endTime, handles }));
      } else {
        console.warn('Twitter disabled: no BEARER_TOKEN');
      }
    }
    if (providers.includes('rss')) {
      tasks.push(fetchRssNews({ startTime, endTime, maxResults }));
    }
    if (providers.includes('reddit')) {
      tasks.push(fetchRedditNews({ startTime, endTime, maxResults }));
    }

    const results = await Promise.allSettled(tasks);
    const items = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

    // Sort newest first and cap size
    const merged = items.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, maxResults);

    res.json({ success: true, data: merged, meta: { count: merged.length } });
  } catch (error) {
    console.error('Unified news error:', error);
    res.status(500).json({ success: false, error: 'Failed to load aggregated news', message: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'SixersHoops Twitter Proxy'
  });
});

// Internal function to fetch Twitter news (reusable)
async function fetchTwitterNews({ maxResults = 50, category = 'all', startTime, endTime, handles } = {}) {
  try {
    // Define Twitter accounts to monitor
    const defaultAccounts = [
        // Official accounts
        'sixers', 'NBA',
        
        // Top NBA Reporters
        'wojespn', 'ShamsCharania', 'ZachLowe_NBA', 'ramonashelburne',
        
        // Local Philadelphia Media
        'PompeyOnSixers', 'DerekBodnerNBA', 'KyleNeubeck', 'rich_hofmann', 'JClarkNBCS',
        
        // Additional NBA Insiders
        'WindhorstESPN', 'ChrisBHaynes', 'TheSteinLine'
      ];

      const accounts = Array.isArray(handles) && handles.length ? handles : defaultAccounts;

      // Build search query based on category
      let query = '';
      
      if (category === 'all' || category === 'breaking') {
        // General 76ers content
        query = `(${accounts.map(handle => `from:${handle}`).join(' OR ')}) (Sixers OR "Philadelphia 76ers" OR "Joel Embiid" OR "Tyrese Maxey" OR "Paul George" OR #Sixers OR #PhilaUnite)`;
      } else if (category === 'trades') {
        query = `(${accounts.map(handle => `from:${handle}`).join(' OR ')}) (Sixers OR "Philadelphia 76ers") (trade OR traded OR "trade rumors" OR deal OR acquired)`;
      } else if (category === 'signings') {
        query = `(${accounts.map(handle => `from:${handle}`).join(' OR ')}) (Sixers OR "Philadelphia 76ers") (signing OR signed OR agrees OR agreed OR "agreed to" OR "has signed" OR re-signed OR resigns OR extension OR extensions OR contract OR two-way OR 10-day)`;
      } else if (category === 'injuries') {
        query = `(${accounts.map(handle => `from:${handle}`).join(' OR ')}) ("Joel Embiid" OR "Tyrese Maxey" OR "Paul George" OR Sixers) (injury OR injured OR "injury report" OR questionable OR doubtful OR out)`;
      } else if (category === 'games') {
        query = `(${accounts.map(handle => `from:${handle}`).join(' OR ')}) (Sixers OR "Philadelphia 76ers") (game OR tonight OR "game day" OR vs OR final OR score)`;
      } else if (category === 'live') {
        // Live game feed
        query = `(${accounts.map(handle => `from:${handle}`).join(' OR ')}) (Sixers OR PHI) (Q1 OR Q2 OR Q3 OR Q4 OR halftime OR "end of" OR "start of" OR tipoff OR tip-off OR timeout OR "time out" OR run OR lead OR "leads" OR "trails" OR vs OR "Final")`;
      } else if (category === 'rumors') {
        query = `(${accounts.map(handle => `from:${handle}`).join(' OR ')}) (Sixers OR "Philadelphia 76ers") (rumor OR rumors OR "sources tell" OR "league sources" OR reportedly)`;
      }

      // Twitter API parameters
      const params = {
        query: query,
        max_results: Math.min(maxResults, 100), // Twitter API limit
        'tweet.fields': 'created_at,author_id,public_metrics,context_annotations,entities,attachments',
        'user.fields': 'name,username,verified,profile_image_url',
        // Expand to include authors and media
        'expansions': 'author_id,attachments.media_keys',
        'media.fields': 'preview_image_url,url,width,height,alt_text,variants,type',
        'sort_order': 'recency'
      };

      if (startTime) params.start_time = new Date(startTime).toISOString();
      if (endTime) params.end_time = new Date(endTime).toISOString();

      console.log('🔍 Searching Twitter with query:', query);

      // Make request to Twitter API
      const twitterData = await makeTwitterRequest('/tweets/search/recent', params);

      // Process and format the response
      const processedNews = processTwitterData(twitterData);

      return processedNews;

  } catch (error) {
    console.error('❌ Error fetching Twitter news:', error);
    return [];
  }
}

// Get specific user timeline
app.post('/api/twitter/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { maxResults = 20 } = req.body;

    // Get user ID first
    const userResponse = await makeTwitterRequest('/users/by/username/' + username, {
      'user.fields': 'name,username,verified,profile_image_url'
    });

    if (!userResponse.data) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userId = userResponse.data.id;

    // Get user's tweets
    const tweetsResponse = await makeTwitterRequest(`/users/${userId}/tweets`, {
      max_results: Math.min(maxResults, 100),
      'tweet.fields': 'created_at,public_metrics,context_annotations',
      exclude: 'retweets,replies'
    });

    const processedTweets = {
      user: userResponse.data,
      tweets: tweetsResponse.data || []
    };

    res.json({
      success: true,
      data: processedTweets,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching user timeline:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user timeline',
      message: error.message
    });
  }
});

// Fetch RSS-based news (keyless)
async function fetchRssNews({ startTime, endTime, maxResults = 50 } = {}) {
  const feeds = [
    // Official team site
    'https://www.nba.com/sixers/rss',
    // NBC Sports Philly Sixers
    'https://www.nbcsportsphiladelphia.com/tag/philadelphia-76ers/feed/',
    // Liberty Ballers
    'https://www.libertyballers.com/rss/index.xml'
  ];
  const items = [];
  for (const url of feeds) {
    try {
      const feed = await rssParser.parseURL(url);
      for (const it of (feed.items || [])) {
        const ts = new Date(it.isoDate || it.pubDate || it.published || Date.now());
        if (startTime && ts < new Date(startTime)) continue;
        if (endTime && ts > new Date(endTime)) continue;
        items.push({
          id: it.guid || it.link || `${url}-${ts.getTime()}`,
          text: it.title + (it.contentSnippet ? ` — ${it.contentSnippet}` : ''),
          source: feed.title || 'RSS',
          handle: feed.link ? new URL(feed.link).hostname : 'rss',
          verified: false,
          profileImage: null,
          timestamp: ts,
          category: 'all',
          isBreaking: /breaking/i.test(it.title || ''),
          isFeatured: false,
          likes: 0,
          retweets: 0,
          replies: 0,
          media: [],
          provider: 'rss',
          url: it.link
        });
      }
    } catch (e) {
      console.warn('RSS fetch failed:', url, e.message);
    }
  }
  // Cap and return
  return items
    .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, maxResults);
}

// Fetch Reddit news (keyless JSON)
async function fetchRedditNews({ startTime, endTime, maxResults = 50 } = {}) {
  const subs = ['sixers', 'nba'];
  const base = 'https://www.reddit.com/r';
  const items = [];
  for (const sub of subs) {
    try {
      const res = await fetch(`${base}/${sub}/search.json?q=Sixers&restrict_sr=on&sort=new`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const posts = data?.data?.children || [];
      for (const p of posts) {
        const post = p.data;
        const ts = new Date(post.created_utc * 1000);
        if (startTime && ts < new Date(startTime)) continue;
        if (endTime && ts > new Date(endTime)) continue;
        // Basic media support for thumbnails
        const media = [];
        if (post.thumbnail && post.thumbnail.startsWith('http')) {
          media.push({ type: 'image', url: post.thumbnail });
        }
        items.push({
          id: `reddit-${post.id}`,
          text: post.title,
          source: `r/${sub}`,
          handle: `u/${post.author}`,
          verified: false,
          profileImage: null,
          timestamp: ts,
          category: 'all',
          isBreaking: /breaking/i.test(post.title || ''),
          isFeatured: false,
          likes: post.ups || 0,
          retweets: 0,
          replies: post.num_comments || 0,
          media,
          provider: 'reddit',
          url: `https://www.reddit.com${post.permalink}`
        });
      }
    } catch (e) {
      console.warn('Reddit fetch failed:', sub, e.message);
    }
  }
  return items
    .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, maxResults);
}

// Process Twitter API response
function processTwitterData(twitterData) {
  if (!twitterData.data || !Array.isArray(twitterData.data)) {
    return [];
  }

  // Create user lookup map
  const users = {};
  if (twitterData.includes && twitterData.includes.users) {
    twitterData.includes.users.forEach(user => {
      users[user.id] = user;
    });
  }

  // Create media lookup map
  const mediaByKey = {};
  if (twitterData.includes && twitterData.includes.media) {
    twitterData.includes.media.forEach(m => {
      mediaByKey[m.media_key] = m;
    });
  }

  return twitterData.data.map(tweet => {
    const author = users[tweet.author_id] || {};

    // Collect media
    let media = [];
    if (tweet.attachments && Array.isArray(tweet.attachments.media_keys)) {
      media = tweet.attachments.media_keys
        .map(k => mediaByKey[k])
        .filter(Boolean)
        .map(m => ({
          type: m.type,
          url: m.url || m.preview_image_url || null,
          width: m.width,
          height: m.height,
          alt: m.alt_text || ''
        }));
    }
    
    // Determine if it's breaking news
    const isBreaking = /breaking|urgent|just in|developing/i.test(tweet.text);
    
    // Determine category based on content
    let category = 'all';
    if (/trade|traded|deal|acquired/i.test(tweet.text)) category = 'trades';
    else if (/(signing|signed|agrees|agreed|has signed|re-signed|resigns|extension|two-way|10-day)/i.test(tweet.text)) category = 'signings';
    else if (/injury|injured|out|questionable|doubtful|probable|returning/i.test(tweet.text)) category = 'injuries';
    else if (/(Q1|Q2|Q3|Q4|halftime|tipoff|tip-off|timeout|time out|Final\b|vs\b)/i.test(tweet.text)) category = 'live';
    else if (/game|tonight|final|score|preview|recap/i.test(tweet.text)) category = 'games';
    else if (/rumor|rumors|sources|reportedly/i.test(tweet.text)) category = 'rumors';

    // Confirmation heuristic
    const isConfirmed = /(sources:|official|officially|announced|press release|agreement reached|has signed|the sixers have signed|the 76ers have signed)/i.test(tweet.text);
    
    // Determine if featured (high engagement or from top reporters)
    const topReporters = ['wojespn', 'ShamsCharania', 'ZachLowe_NBA'];
    const isFeatured = topReporters.includes(author.username) || 
                     (tweet.public_metrics && tweet.public_metrics.like_count > 1000);

    return {
      id: tweet.id,
      text: tweet.text,
      source: author.name || 'Unknown',
      handle: `@${author.username || 'unknown'}`,
      verified: author.verified || false,
      profileImage: author.profile_image_url,
      timestamp: new Date(tweet.created_at),
      category: category,
      isBreaking: isBreaking,
      isConfirmed,
      isFeatured: isFeatured,
      likes: tweet.public_metrics?.like_count || 0,
      retweets: tweet.public_metrics?.retweet_count || 0,
      replies: tweet.public_metrics?.reply_count || 0,
      media,
      provider: 'twitter',
      url: `https://twitter.com/${author.username}/status/${tweet.id}`
    };
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /api/health',
      'POST /api/twitter/news',
      'POST /api/twitter/user/:username'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SixersHoops Twitter Proxy Server running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔑 Twitter Bearer Token: ${BEARER_TOKEN ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎮 Pick'em System: ${dbReady ? '✅ Ready' : '⏳ Initializing'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  if (rawDb) {
    rawDb.close();
    console.log('✅ Database connection closed');
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  if (rawDb) {
    rawDb.close();
    console.log('✅ Database connection closed');
  }
  process.exit(0);
});
