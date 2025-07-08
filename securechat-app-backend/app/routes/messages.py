from fastapi import APIRouter, HTTPException, status, Depends, Header
from app.models.message import MessageCreate, MessageResponse
from app.utils.auth import verify_token
from app.database import db
from app.websocket_manager import manager
import uuid

router = APIRouter(prefix="/messages", tags=["messages"])

def get_current_user(authorization: str = Header(None)):
    """Get current user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    username = verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.fetchone("users", {"username": username})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

@router.post("/send", response_model=dict)
async def send_encrypted_message(message_data: dict, current_user = Depends(get_current_user)):
    """Store encrypted message blob (server can't read content)"""
    try:
        # Verify recipient exists
        recipient = db.fetchone("users", {"id": message_data["recipient_id"]})
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # Generate conversation ID if not provided
        conversation_id = message_data.get("conversation_id") or str(uuid.uuid4())
        
        # Store encrypted blob (server cannot decrypt this)
        message_id = str(uuid.uuid4())
        result = db.insert("messages", {
            "id": message_id,
            "conversation_id": conversation_id,
            "sender_id": current_user['id'],
            "recipient_id": message_data["recipient_id"],
            "encrypted_blob": message_data["encrypted_blob"],  # Client-encrypted
            "signature": message_data["signature"],  # Client-signed
            "sender_public_key": message_data["sender_public_key"]
        })
        
        print(f"Message stored: {message_id} from {current_user['username']} to {message_data['recipient_id']}")
        
        # Get recipient username for WebSocket (WebSocket uses usernames as connection IDs)
        recipient_username = recipient['username']
        print(f"🔍 Broadcasting to: {recipient_username} (ID: {message_data['recipient_id']})")
        print(f"🔗 Active connections: {list(manager.active_connections.keys())}")
        
        # Clean content for WebSocket broadcast (remove encrypted_ prefix)
        clean_content = message_data["encrypted_blob"].replace('encrypted_', '')
        
        # Broadcast message to recipient via WebSocket using username
        await manager.broadcast_new_message(
            sender_id=current_user['username'],
            recipient_id=recipient_username,  # Use username, not ID
            message_data={
                "id": message_id,
                "sender_id": current_user['id'],
                "content": clean_content,  # Clean content without prefix
                "sender": current_user['username'],
                "timestamp": "now",
                "isOwn": False,
                "isEncrypted": True,
                "status": "delivered"
            }
        )
        
        print(f"WebSocket broadcast sent to user {message_data['recipient_id']}")
        
        return {
            "message": "Encrypted message stored successfully",
            "message_id": message_id,
            "conversation_id": conversation_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(e)}"
        )

@router.get("/", response_model=list)
async def get_encrypted_messages(current_user = Depends(get_current_user)):
    """Get encrypted message blobs for current user"""
    try:
        messages = db.fetchall("messages", {"recipient_id": current_user['id']})
        
        result = []
        for msg in messages:
            # Get sender username
            sender = db.fetchone("users", {"id": msg['sender_id']})
            sender_username = sender['username'] if sender else 'Unknown'
            
            result.append({
                "id": msg['id'],
                "conversation_id": msg['conversation_id'],
                "sender_id": msg['sender_id'],
                "sender_username": sender_username,
                "recipient_id": msg['recipient_id'],
                "encrypted_blob": msg['encrypted_blob'],  # Client must decrypt
                "signature": msg['signature'],
                "sender_public_key": msg['sender_public_key'],
                "created_at": str(msg.get('created_at', ''))
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get messages: {str(e)}"
        )

@router.get("/conversation/{contact_id}")
async def get_conversation_with_contact(contact_id: str, current_user = Depends(get_current_user)):
    """Get all messages between current user and a specific contact"""
    try:
        # Get all messages where current user and contact are involved
        all_messages = db.fetchall("messages", {})
        conversation_messages = [
            msg for msg in all_messages 
            if ((msg.get('sender_id') == current_user['id'] and msg.get('recipient_id') == contact_id) or
                (msg.get('sender_id') == contact_id and msg.get('recipient_id') == current_user['id']))
        ]
        
        # Sort by timestamp
        conversation_messages.sort(key=lambda x: x.get('created_at', ''), reverse=False)
        
        result = []
        for msg in conversation_messages:
            # Get sender username
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get conversation: {str(e)}"
        )

@router.get("/conversation/{conversation_id}")
async def get_conversation(conversation_id: str, current_user = Depends(get_current_user)):
    """Get all messages in a conversation"""
    try:
        # Get messages where user is sender or recipient
        all_messages = db.fetchall("messages", {})
        conversation_messages = [
            msg for msg in all_messages 
            if (msg.get('conversation_id') == conversation_id and 
                (msg.get('sender_id') == current_user['id'] or 
                 msg.get('recipient_id') == current_user['id']))
        ]
        
        return [
            {
                "id": msg['id'],
                "sender_id": msg['sender_id'],
                "recipient_id": msg['recipient_id'],
                "encrypted_blob": msg['encrypted_blob'],
                "signature": msg['signature'],
                "sender_public_key": msg['sender_public_key'],
                "created_at": str(msg.get('created_at', ''))
            }
            for msg in conversation_messages
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get conversation: {str(e)}"
        )