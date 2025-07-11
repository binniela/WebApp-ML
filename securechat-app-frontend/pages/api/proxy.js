// Vercel API route to proxy requests to EC2 backend
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { path, ...body } = req.body;
    const targetUrl = `http://52.53.221.141${path}`;
    
    console.log('Proxying to:', targetUrl, 'with body:', body);
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      },
      body: req.method !== 'GET' ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    console.log('Response:', response.status, data);
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
}