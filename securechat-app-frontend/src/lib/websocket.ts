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
      // Connect directly to the backend WebSocket
      const wsUrl = `ws://52.53.221.141:8000/ws/${userId}?token=${token}`
      
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
        this.ws = null
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`)
            this.connect(this.userId!, this.token!)
          }, this.reconnectDelay * this.reconnectAttempts)
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
    } catch (error) {
      console.error('WebSocket connection failed:', error)
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect')
      this.ws = null
    }
    this.userId = null
    this.token = null
    this.messageHandlers = []
  }
  
  sendPing() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }))
    }
  }
  
  onMessage(handler: (message: any) => void) {
    this.messageHandlers.push(handler)
  }
  
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

export const wsManager = new WebSocketManager()