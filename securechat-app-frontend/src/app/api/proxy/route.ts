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

function getTargetUrl(path: string): { url: string, method: string } {
  // Check exact matches first
  if (ENDPOINT_MAPPING[path]) {
    const mapping = ENDPOINT_MAPPING[path]
    return {
      url: `http://52.53.221.141:${mapping.service}${mapping.endpoint}`,
      method: mapping.method
    }
  }
  
  // Handle dynamic paths
  if (path.startsWith('/messages/conversation/')) {
    const contactId = path.split('/')[3]
    return {
      url: `http://52.53.221.141:8002/conversation/${contactId}`,
      method: 'GET'
    }
  }
  
  if (path.startsWith('/keys/public/')) {
    const userId = path.split('/')[3]
    return {
      url: `http://52.53.221.141:8002/keys/public/${userId}`,
      method: 'GET'
    }
  }
  
  // Default fallback
  return {
    url: `http://52.53.221.141${path}`,
    method: 'POST'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, ...requestBody } = body
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    const { url: targetUrl, method: expectedMethod } = getTargetUrl(path)
    
    // For GET endpoints called via POST, use GET method
    const actualMethod = expectedMethod === 'GET' ? 'GET' : 'POST'
    

    
    const response = await fetch(targetUrl, {
      method: actualMethod,
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && { 
          'Authorization': request.headers.get('authorization')! 
        })
      },
      body: actualMethod === 'POST' ? JSON.stringify(requestBody) : undefined,
      signal: AbortSignal.timeout(5000) // 5 second timeout
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