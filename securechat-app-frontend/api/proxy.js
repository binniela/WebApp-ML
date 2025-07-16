export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // For all requests, we'll use the same endpoint and pass the path in the body
    const { path, ...body } = req.method === 'GET' ? req.query : req.body;
    
    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    // All requests go to the root endpoint with path in the body
    const targetUrl = 'http://52.53.221.141/';
    
    console.log('Proxying to:', targetUrl, 'Path:', path);
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      },
      body: JSON.stringify({ path, ...body }),
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      res.status(response.status).json(data);
    } catch {
      res.status(response.status).json({ message: text });
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy failed', details: error.message });
  }
}