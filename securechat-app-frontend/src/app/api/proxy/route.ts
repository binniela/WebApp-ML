import { NextRequest, NextResponse } from 'next/server'

// Complete endpoint mapping for all services
const ENDPOINT_MAPPING: Record<string, { service: number, endpoint: string, method: string }> = {
  // Auth Service (port 8001)
  '/auth/login': { service: 8001, endpoint: '/login', method: 'POST' },
  '/auth/register': { service: 8001, endpoint: '/register', method: 'POST' },
  '/users/search': { service: 8001, endpoint: '/users/search', method: 'GET' },
  '/contacts': { service: 8001, endpoint: '/contacts/', method: 'GET' },
  '/contacts/pending': { service: 8001, endpoint: '/contacts/pending', method: 'GET' },
  
  // Message Service (port 8002)
  '/messages/send': { service: 8002, endpoint: '/send', method: 'POST' },
  '/messages': { service: 8002, endpoint: '/', method: 'GET' },
  '/chat-requests/send': { service: 8002, endpoint: '/chat-requests/send', method: 'POST' },
  '/chat-requests/incoming': { service: 8002, endpoint: '/chat-requests/incoming', method: 'GET' },
  '/chat-requests/respond': { service: 8002, endpoint: '/chat-requests/respond', method: 'POST' },
  
  // Key Exchange (port 8002)
  '/keys/update': { service: 8002, endpoint: '/keys/update', method: 'POST' },
}

function getTargetUrl(path: string): { url: string } {
  // Ensure proper trailing slash for endpoints that need it
  let cleanPath = path
  if (path === '/messages') {
    cleanPath = '/messages/'
  }
  return {
    url: `http://52.53.221.141:8000${cleanPath}`
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, ...requestBody } = body
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    const { url: targetUrl } = getTargetUrl(path)
    
    // Determine if this should be a GET or POST based on the actual backend API
    const isGetRequest = path.includes('/incoming') || path.includes('/search') || 
                        path.startsWith('/messages') ||
                        path.includes('/public/')
    
    // Special handling for endpoints that need POST method despite being "get" operations
    const forcePostPaths = ['/contacts', '/contacts/pending']
    const shouldForcePost = forcePostPaths.some(forcePath => path === forcePath)
    
    const method = (isGetRequest && !shouldForcePost) ? 'GET' : 'POST'
    
    // Handle query parameters for GET requests
    let finalUrl = targetUrl
    if (method === 'GET' && requestBody.q) {
      finalUrl = `${targetUrl}?q=${encodeURIComponent(requestBody.q)}`
    }
    // Handle contact_id parameter for messages endpoint
    if (path.startsWith('/messages') && method === 'GET' && requestBody.contact_id) {
      finalUrl = `${targetUrl}?contact_id=${encodeURIComponent(requestBody.contact_id)}`
    }
    
    console.log(`${method}: Routing ${path} to ${finalUrl}`)
    if (!isGetRequest) {
      console.log('Request body:', JSON.stringify(requestBody, null, 2))
    }
    
    // Handle missing endpoints gracefully
    if (path === '/keys/update') {
      console.log('Keys update endpoint - returning success (no-op for now)')
      return NextResponse.json({ message: 'Public keys updated successfully' }, { status: 200 })
    }
    
    const response = await fetch(finalUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && { 
          'Authorization': request.headers.get('authorization')! 
        })
      },
      body: method === 'POST' ? JSON.stringify(requestBody) : undefined,
      signal: AbortSignal.timeout(10000)
    })

    // Check if response is JSON or HTML
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('text/html')) {
      const htmlText = await response.text()
      console.error('Backend returned HTML:', htmlText.substring(0, 200))
      return NextResponse.json({ 
        error: 'Backend service error', 
        detail: 'Service returned HTML instead of JSON - check backend logs' 
      }, { status: 502 })
    }
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Proxy error:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 200)
    })
    
    // Handle specific timeout errors
    if (error.name === 'TimeoutError' || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
      return NextResponse.json({ 
        error: 'Backend service unavailable', 
        detail: 'Connection timeout - please try again' 
      }, { status: 503 })
    }
    
    return NextResponse.json({ 
      error: 'Proxy failed', 
      detail: error.message || 'Unknown error',
      errorType: error.name || 'UnknownError'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    const q = searchParams.get('q')
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    const { url: targetUrl } = getTargetUrl(path)
    let finalUrl = targetUrl
    
    if (q) finalUrl += `?q=${encodeURIComponent(q)}`
    
    console.log(`GET: Routing ${path} to ${finalUrl}`)
    
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        ...(request.headers.get('authorization') && { 
          'Authorization': request.headers.get('authorization')! 
        })
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Proxy GET error:', error)
    
    // Handle specific timeout errors
    if (error.name === 'TimeoutError' || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
      return NextResponse.json({ 
        error: 'Backend service unavailable', 
        detail: 'Connection timeout - please try again' 
      }, { status: 503 })
    }
    
    return NextResponse.json({ 
      error: 'Proxy failed', 
      detail: error.message || 'Unknown error' 
    }, { status: 500 })
  }
}