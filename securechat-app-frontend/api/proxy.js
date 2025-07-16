export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Mock responses since backend is unreachable
    const { path } = req.method === 'GET' ? req.query : req.body;
    
    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    console.log('Handling request for path:', path);
    
    // Mock authentication endpoints
    if (path === '/auth/register' || path === '/auth/login') {
      const { username } = req.body;
      return res.status(200).json({
        access_token: `mock_token_${Date.now()}`,
        token_type: "bearer",
        user: { 
          id: `user_${Date.now()}`, 
          username: username || "user" 
        }
      });
    }
    
    // Mock data endpoints
    if (path.includes('/contacts/') || path === '/contacts/') {
      return res.status(200).json([]);
    }
    
    if (path.includes('/chat-requests/incoming')) {
      return res.status(200).json([]);
    }
    
    if (path.includes('/users/search')) {
      return res.status(200).json([]);
    }
    
    if (path === '/messages' || path.includes('/conversation/')) {
      return res.status(200).json([]);
    }
    
    if (path === '/send') {
      return res.status(200).json({ 
        id: `msg_${Date.now()}`,
        status: "sent" 
      });
    }
    
    // Default response for any other endpoint
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy failed', details: error.message });
  }
}
