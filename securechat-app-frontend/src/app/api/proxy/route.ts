import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, ...requestBody } = body
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    const targetUrl = `http://52.53.221.141${path}`
    
    const getEndpoints = ['/contacts', '/contacts/pending', '/messages', '/messages/conversation/']
    const method = getEndpoints.some(endpoint => path === endpoint || path.startsWith(endpoint)) ? 'GET' : 'POST'
    
    const response = await fetch(targetUrl, {
      method,
      headers: {
        ...(method === 'POST' && { 'Content-Type': 'application/json' }),
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