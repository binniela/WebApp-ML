from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        # Store active connections by user_id
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
        """Send message to specific user"""
        print(f"Attempting to send WebSocket message to user {user_id}")
        print(f"Active connections: {list(self.active_connections.keys())}")
        
        if user_id in self.active_connections:
            print(f"Found {len(self.active_connections[user_id])} connections for user {user_id}")
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                    print(f"Message sent successfully to user {user_id}")
                except Exception as e:
                    print(f"Failed to send message to user {user_id}: {e}")
                    # Remove dead connections
                    self.active_connections[user_id].remove(connection)
        else:
            print(f"No active connections found for user {user_id}")

    async def broadcast_new_message(self, sender_id: str, recipient_id: str, message_data: dict):
        """Broadcast new message to recipient"""
        print(f"📢 Broadcasting message from {sender_id} to {recipient_id}")
        await self.send_to_user(recipient_id, {
            "type": "new_message",
            "data": message_data
        })

# Global connection manager
manager = ConnectionManager()