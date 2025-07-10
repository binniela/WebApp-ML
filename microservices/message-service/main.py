from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import requests
import uuid

# Import shared utilities
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from shared_utils import db, verify_token

app = FastAPI(title="LockBox Message Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUTH_SERVICE_URL = "http://localhost:8001"
WEBSOCKET_SERVICE_URL = "http://localhost:8003"

async def get_current_user(authorization: str = Header(None)):
    """Get current user by calling auth service"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = authorization.split(" ")[1]
    
    try:
        # Call auth service to verify token
        response = requests.get(f"{AUTH_SERVICE_URL}/verify/{token}", timeout=5)
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return response.json()
    except requests.RequestException:
        # Fallback to local verification if auth service is down
        username = verify_token(token)
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.fetchone("users", {"username": username})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {"id": user["id"], "username": user["username"]}

@app.post("/send")
async def send_message(message_data: dict, current_user = Depends(get_current_user)):
    """Store encrypted message"""
    try:
        # Verify recipient exists
        recipient = db.fetchone("users", {"id": message_data["recipient_id"]})
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # Generate conversation ID if not provided
        conversation_id = message_data.get("conversation_id") or str(uuid.uuid4())
        
        # Store encrypted message
        message_id = str(uuid.uuid4())
        result = db.insert("messages", {
            "id": message_id,
            "conversation_id": conversation_id,
            "sender_id": current_user['id'],
            "recipient_id": message_data["recipient_id"],
            "encrypted_blob": message_data["encrypted_blob"],
            "signature": message_data["signature"],
            "sender_public_key": message_data["sender_public_key"]
        })
        
        # Notify WebSocket service to broadcast message
        try:
            clean_content = message_data["encrypted_blob"].replace('encrypted_', '')
            broadcast_data = {
                "recipient_username": recipient['username'],
                "message_data": {
                    "id": message_id,
                    "sender_id": current_user['id'],
                    "content": clean_content,
                    "sender": current_user['username'],
                    "timestamp": "now",
                    "isOwn": False,
                    "isEncrypted": True,
                    "status": "delivered"
                }
            }
            
            requests.post(f"{WEBSOCKET_SERVICE_URL}/broadcast", 
                         json=broadcast_data, timeout=2)
        except requests.RequestException:
            print("WebSocket service unavailable - message stored but not broadcast")
        
        return {
            "message": "Encrypted message stored successfully",
            "message_id": message_id,
            "conversation_id": conversation_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def get_messages(current_user = Depends(get_current_user)):
    """Get user's messages"""
    try:
        messages = db.fetchall("messages", {"recipient_id": current_user['id']})
        
        result = []
        for msg in messages:
            # Get sender info
            sender = db.fetchone("users", {"id": msg['sender_id']})
            sender_username = sender['username'] if sender else 'Unknown'
            
            result.append({
                "id": msg['id'],
                "conversation_id": msg['conversation_id'],
                "sender_id": msg['sender_id'],
                "sender_username": sender_username,
                "recipient_id": msg['recipient_id'],
                "encrypted_blob": msg['encrypted_blob'],
                "signature": msg['signature'],
                "sender_public_key": msg['sender_public_key'],
                "created_at": str(msg.get('created_at', ''))
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversation/{contact_id}")
async def get_conversation(contact_id: str, current_user = Depends(get_current_user)):
    """Get conversation with specific contact"""
    try:
        all_messages = db.fetchall("messages", {})
        conversation_messages = [
            msg for msg in all_messages 
            if ((msg.get('sender_id') == current_user['id'] and msg.get('recipient_id') == contact_id) or
                (msg.get('sender_id') == contact_id and msg.get('recipient_id') == current_user['id']))
        ]
        
        conversation_messages.sort(key=lambda x: x.get('created_at', ''), reverse=False)
        
        result = []
        for msg in conversation_messages:
            sender = db.fetchone("users", {"id": msg['sender_id']})
            sender_username = sender['username'] if sender else 'Unknown'
            
            result.append({
                "id": msg['id'],
                "sender_id": msg['sender_id'],
                "sender_username": sender_username,
                "recipient_id": msg['recipient_id'],
                "encrypted_blob": msg['encrypted_blob'],
                "signature": msg['signature'],
                "sender_public_key": msg['sender_public_key'],
                "created_at": str(msg.get('created_at', ''))
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat-requests/incoming")
async def get_incoming_chat_requests(current_user = Depends(get_current_user)):
    """Get incoming chat requests"""
    # Return empty for now - implement as needed
    return []

@app.post("/chat-requests/send")
async def send_chat_request(request_data: dict, current_user = Depends(get_current_user)):
    """Send chat request"""
    return {"message": "Chat request sent"}

@app.post("/chat-requests/respond")
async def respond_to_chat_request(response_data: dict, current_user = Depends(get_current_user)):
    """Respond to chat request"""
    return {"message": "Response sent"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)