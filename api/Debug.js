// Debug API endpoint for testing
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
  
  // Return debug information
  res.json({
    success: true,
    message: 'Debug API is working!',
    timestamp: new Date().toISOString(),
    query: req.query,
    headers: req.headers,
    method: req.method
  });
}
