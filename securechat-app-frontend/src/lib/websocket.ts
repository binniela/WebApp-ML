// WebSocket manager for real-time messaging
export class WebSocketManager {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private token: string | null = null;
  private messageHandlers: ((message: any) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  connect(userId: string, token: string) {
    this.userId = userId;
    this.token = token;
    this.connectWebSocket();
  }

  private connectWebSocket() {
    if (!this.userId || !this.token) return;

    try {
      const wsUrl = `ws://localhost:8000/ws/${this.userId}?token=${this.token}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Send ping every 30 seconds to keep connection alive
        setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'pong') {
            return; // Ignore pong responses
          }
          
          // Notify all message handlers
          this.messageHandlers.forEach(handler => handler(message));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, 2000 * this.reconnectAttempts); // Exponential backoff
    }
  }

  onMessage(handler: (message: any) => void) {
    this.messageHandlers.push(handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers = [];
    this.userId = null;
    this.token = null;
  }
}

export const wsManager = WebSocketManager.getInstance();