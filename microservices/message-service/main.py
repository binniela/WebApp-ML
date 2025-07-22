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
                "recipient_id": message_data["recipient_id"],
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
            "id": message_id,
            "message_id": message_id,
            "conversation_id": conversation_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def get_messages(current_user = Depends(get_current_user)):
    """Get user's messages (both sent and received)"""
    try:
        # Get all messages where user is sender OR recipient
        all_messages = db.fetchall("messages", {})
        user_messages = [
            msg for msg in all_messages 
            if msg.get('sender_id') == current_user['id'] or msg.get('recipient_id') == current_user['id']
        ]
        
        result = []
        for msg in user_messages:
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
    """Get incoming chat requests from Supabase"""
    try:
        requests = db.fetchall("chat_requests", {"to_user_id": current_user['id'], "status": "pending"})
        
        result = []
        for req in requests:
            # Get sender info
            sender = db.fetchone("users", {"id": req['from_user_id']})
            if sender:
                result.append({
                    "id": req['id'],
                    "from_user_id": req['from_user_id'],
                    "from_username": sender['username'],
                    "message": req['message'],
                    "created_at": str(req['created_at'])
                })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat-requests/send")
async def send_chat_request(request_data: dict, current_user = Depends(get_current_user)):
    """Send chat request to Supabase"""
    try:
        # Verify recipient exists
        recipient = db.fetchone("users", {"id": request_data["recipient_id"]})
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # Check if request already exists
        existing = db.fetchone("chat_requests", {
            "from_user_id": current_user['id'],
            "to_user_id": request_data["recipient_id"],
            "status": "pending"
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Chat request already sent")
        
        # Create chat request in Supabase
        chat_request = db.insert("chat_requests", {
            "from_user_id": current_user['id'],
            "to_user_id": request_data["recipient_id"],
            "message": request_data.get("message", "Hi! I'd like to start a secure conversation with you."),
            "status": "pending"
        })
        
        # Notify recipient via WebSocket
        try:
            notification_data = {
                "recipient_id": request_data["recipient_id"],
                "notification_data": {
                    "type": "chat_request",
                    "from_user_id": current_user['id'],
                    "from_username": current_user['username'],
                    "message": request_data.get("message", "Hi! I'd like to start a secure conversation with you.")
                }
            }
            requests.post(f"{WEBSOCKET_SERVICE_URL}/notify", 
                         json=notification_data, timeout=2)
        except requests.RequestException:
            print("WebSocket notification failed - request stored but not notified")
        
        return {"message": "Chat request sent successfully", "request_id": chat_request['id']}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat-requests/respond")
async def respond_to_chat_request(response_data: dict, current_user = Depends(get_current_user)):
    """Respond to chat request in Supabase"""
    try:
        request_id = response_data["request_id"]
        action = response_data["action"]  # "accept" or "decline"
        
        # Get the chat request
        chat_request = db.fetchone("chat_requests", {"id": request_id})
        if not chat_request:
            raise HTTPException(status_code=404, detail="Chat request not found")
        
        # Verify user is the recipient
        if chat_request['to_user_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Update request status in Supabase
        status = "accepted" if action == "accept" else "declined"
        db.update("chat_requests", {"status": status}, {"id": request_id})
        
        # If accepted, create conversation
        if action == "accept":
            conversation = db.insert("conversations", {
                "participant1_id": chat_request['from_user_id'],
                "participant2_id": current_user['id']
            })
            return {"message": "Chat request accepted", "conversation_id": conversation['id']}
        
        return {"message": f"Chat request {status}"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)