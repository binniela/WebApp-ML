from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import json
from typing import Dict, List

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../securechat-app-backend'))

app = FastAPI(title="LockBox WebSocket Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://web-app-ml.vercel.app",
        "http://localhost:3000",
        "http://52.53.221.141",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        print(f"User {user_id} connected via WebSocket")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        print(f"User {user_id} disconnected from WebSocket")

    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                    print(f"Message sent to user {user_id}")
                except:
                    self.active_connections[user_id].remove(connection)

    async def broadcast_new_message(self, recipient_id: str, message_data: dict):
        await self.send_to_user(recipient_id, {
            "type": "new_message",
            "data": message_data
        })

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, token: str = None):
    """WebSocket endpoint for real-time messaging"""
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle ping/pong
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, user_id)

@app.post("/broadcast")
async def broadcast_message(broadcast_data: dict):
    """Broadcast message to specific user (called by message service)"""
    try:
        recipient_username = broadcast_data["recipient_username"]
        message_data = broadcast_data["message_data"]
        
        await manager.broadcast_new_message(recipient_username, message_data)
        
        return {"message": "Broadcast sent successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/connections")
async def get_active_connections():
    """Get active WebSocket connections (for debugging)"""
    return {
        "active_users": list(manager.active_connections.keys()),
        "total_connections": sum(len(conns) for conns in manager.active_connections.values())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)