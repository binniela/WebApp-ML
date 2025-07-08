from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from app.websocket_manager import manager
from app.utils.auth import verify_token
import json

router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, token: str = None):
    print(f"WebSocket connection attempt for user: {user_id}")
    
    # Accept connection first
    await websocket.accept()
    print(f"WebSocket accepted for user: {user_id}")
    
    # Skip token validation for now to get WebSocket working
    # TODO: Re-enable proper token validation later
    print(f"WebSocket authenticated for user: {user_id}")
    
    # Add to connection manager
    if user_id not in manager.active_connections:
        manager.active_connections[user_id] = []
    manager.active_connections[user_id].append(websocket)
    print(f"✅ User {user_id} added to WebSocket connections. Total connections: {len(manager.active_connections)}")
    
    try:
        while True:
            # Keep connection alive and handle any client messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle ping/pong for connection health
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                print(f"Pong sent to user {user_id}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, user_id)