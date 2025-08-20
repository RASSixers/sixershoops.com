// Simple test endpoint to verify Vercel deployment is working

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const testData = {
    status: 'success',
    message: '🏀 SixersHoops NBA API is working!',
    timestamp: new Date().toISOString(),
    deployment: 'Vercel',
    endpoints: {
      test: '/api/test',
      nbaSimple: '/api/nba-simple?date=2024-12-21',
      nbaGameData: '/api/nba-game-data?date=2024-12-21&team=1610612755&opponent=BOS'
    },
    features: [
      '✅ CORS enabled',
      '✅ Real NBA data integration',
      '✅ Ball Don\'t Lie API backup',
      '✅ Mock data fallback',
      '✅ Live game simulation ready'
    ]
  };
  
  res.status(200).json(testData);
}
