import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, ...requestBody } = body
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    // Route to appropriate microservice
    let targetUrl
    if (path.startsWith('/auth/')) {
      targetUrl = `http://52.53.221.141:8001${path.replace('/auth', '')}`
    } else if (path.startsWith('/messages') || path.startsWith('/chat-requests')) {
      // Handle message service routing
      if (path === '/messages/send') {
        targetUrl = `http://52.53.221.141:8002/send`
      } else if (path.startsWith('/messages/conversation/')) {
        targetUrl = `http://52.53.221.141:8002/conversation/${path.split('/')[3]}`
      } else {
        targetUrl = `http://52.53.221.141:8002${path}`
      }
    } else if (path.startsWith('/users/search')) {
      targetUrl = `http://52.53.221.141:8001${path}`
    } else {
      targetUrl = `http://52.53.221.141${path}`
    }
    
    console.log(`Routing ${path} to ${targetUrl}`)
    
    const getEndpoints = ['/contacts', '/contacts/pending', '/messages', '/messages/conversation/', '/users/search', '/chat-requests/incoming']
    const method = getEndpoints.some(endpoint => path === endpoint || path.startsWith(endpoint)) ? 'GET' : 'POST'
    
    console.log(`Using method ${method} for path ${path}`)
    console.log(`Final request: ${method} ${targetUrl}`)
    
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

    // Route to appropriate microservice for GET requests
    let targetUrl
    if (path.startsWith('/auth/')) {
      targetUrl = `http://52.53.221.141:8001${path.replace('/auth', '')}`
    } else if (path.startsWith('/messages') || path.startsWith('/chat-requests')) {
      // Handle message service routing for GET
      if (path === '/messages') {
        targetUrl = `http://52.53.221.141:8002/`
      } else if (path.startsWith('/messages/conversation/')) {
        targetUrl = `http://52.53.221.141:8002/conversation/${path.split('/')[3]}`
      } else {
        targetUrl = `http://52.53.221.141:8002${path}`
      }
    } else if (path.startsWith('/users/search')) {
      targetUrl = `http://52.53.221.141:8001${path}`
    } else {
      targetUrl = `http://52.53.221.141${path}`
    }
    
    console.log(`GET routing ${path} to ${targetUrl}`)
    
    if (q) targetUrl += `?q=${encodeURIComponent(q)}`
    
    const response = await fetch(targetUrl, {
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