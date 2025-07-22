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

    const { url: targetUrl, method } = getTargetUrl(path)
    
    console.log(`POST: Routing ${path} to ${targetUrl} (${method})`)
    
    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && { 
          'Authorization': request.headers.get('authorization')! 
        })
      },
      body: method === 'POST' ? JSON.stringify(requestBody) : undefined,
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 })
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
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy GET error:', error)
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 })
  }
}