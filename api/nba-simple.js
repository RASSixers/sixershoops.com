// Simple NBA API endpoint for Vercel
// This endpoint uses Ball Don't Lie API and provides fallback data

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
    const { date } = req.query;
    
    // Try Ball Don't Lie API first
    try {
      const response = await fetch(`https://www.balldontlie.io/api/v1/games?dates[]=${date}&team_ids[]=23`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          const game = data.data[0];
          const isHome = game.home_team.abbreviation === 'PHI';
          
          return res.json({
            success: true,
            source: 'Ball Dont Lie API',
            opponent: isHome ? game.visitor_team.full_name : game.home_team.full_name,
            homeScore: isHome ? game.home_team_score : game.visitor_team_score,
            awayScore: isHome ? game.visitor_team_score : game.home_team_score,
            status: game.status,
            plays: [],
            boxScore: { sixers: [], opponent: [] },
            stats: { sixers: {}, opponent: {} }
          });
        }
      }
    } catch (apiError) {
      console.warn('Ball Dont Lie API failed:', apiError);
    }
    
    // Fallback to mock data
    return res.json({
      success: true,
      source: 'Mock Data',
      opponent: "Boston Celtics",
      homeScore: 108,
      awayScore: 112,
      status: "Final",
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
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch NBA data',
      message: error.message 
    });
  }
}
