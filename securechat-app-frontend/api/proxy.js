export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let targetUrl, requestBody;
    
    if (req.method === 'GET') {
      // For GET requests, path comes from query params
      const { path } = req.query;
      if (!path) {
        return res.status(400).json({ error: 'Path is required' });
      }
      targetUrl = `http://52.53.221.141${path}`;
      requestBody = undefined;
    } else {
      // For POST requests, path comes from body
      const { path, ...body } = req.body;
      if (!path) {
        return res.status(400).json({ error: 'Path is required' });
      }
      targetUrl = `http://52.53.221.141${path}`;
      requestBody = JSON.stringify(body);
    }
    
    console.log('Proxying to:', targetUrl);
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      },
      body: requestBody,
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
