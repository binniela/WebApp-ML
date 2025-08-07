#!/bin/bash

# 🔧 LockBox Frontend Monolithic Fix Script
# This script fixes the frontend to work with monolithic backend

echo "🔧 Starting LockBox frontend monolithic fix..."

# Navigate to frontend directory
cd securechat-app-frontend

# Create fixed API proxy route for monolithic backend
cat > src/app/api/proxy/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'

function getTargetUrl(path: string): { url: string, method: string } {
  // Connect to monolithic backend on port 8000
  const method = path.includes('/search') || path.includes('/incoming') ? 'GET' : 'POST'
  return {
    url: `http://52.53.221.141:8000${path}`,
    method: method
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
    
    console.log(`POST: Routing ${path} to ${targetUrl}`)
    
    const response = await fetch(targetUrl, {
      method: expectedMethod,
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && { 
          'Authorization': request.headers.get('authorization')! 
        })
      },
      body: expectedMethod === 'POST' ? JSON.stringify(requestBody) : undefined,
      signal: AbortSignal.timeout(10000) // 10 second timeout
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
      signal: AbortSignal.timeout(10000) // 10 second timeout
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
EOF

# Create fixed WebSocket manager for monolithic backend
cat > src/lib/websocket.ts << 'EOF'
class WebSocketManager {
  private ws: WebSocket | null = null
  private userId: string | null = null
  private token: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageHandlers: ((message: any) => void)[] = []

  connect(userId: string, token: string) {
    this.userId = userId
    this.token = token
    
    try {
      // Connect to monolithic backend on port 8000
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//52.53.221.141:8000/ws/${userId}?token=${token}`
      
      console.log('Connecting to WebSocket:', wsUrl)
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        
        // Send ping to keep connection alive
        this.sendPing()
        setInterval(() => this.sendPing(), 30000) // Ping every 30 seconds
      }
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('WebSocket message received:', message)
          
          // Handle pong responses
          if (message.type === 'pong') {
            return
          }
          
          // Notify all message handlers
          this.messageHandlers.forEach(handler => {
            try {
              handler(message)
            } catch (error) {
              console.error('Message handler error:', error)
            }
          })
        } catch (error) {
          console.error('WebSocket message parsing error:', error)
        }
      }
      
      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
          
          setTimeout(() => {
            this.connect(this.userId!, this.token!)
          }, this.reconnectDelay * this.reconnectAttempts)
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
    } catch (error) {
      console.error('WebSocket connection error:', error)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User disconnected')
      this.ws = null
    }
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }

  private sendPing() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }))
    }
  }

  onMessage(handler: (message: any) => void) {
    this.messageHandlers.push(handler)
  }

  removeMessageHandler(handler: (message: any) => void) {
    const index = this.messageHandlers.indexOf(handler)
    if (index > -1) {
      this.messageHandlers.splice(index, 1)
    }
  }
}

export const wsManager = new WebSocketManager()
EOF

echo "✅ Frontend monolithic fix completed!"
echo "🔄 You may need to restart your frontend development server"
echo "💡 Run: npm run dev in the frontend directory" 