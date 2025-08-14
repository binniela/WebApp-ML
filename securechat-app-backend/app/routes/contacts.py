from fastapi import APIRouter, HTTPException, status, Depends, Header
from app.utils.auth import verify_token
from app.database import db
from typing import List

router = APIRouter(prefix="/contacts", tags=["contacts"])

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

@router.post("/")
async def get_contacts(current_user = Depends(get_current_user)):
    """Get user's contacts from accepted chat requests"""
    try:
        # Get all chat requests involving this user
        all_requests = db.fetchall("chat_requests", {})
        
        # Find accepted requests where user is involved
        accepted_requests = [
            req for req in all_requests 
            if (req.get('status') == 'accepted' and 
                (req.get('from_user_id') == current_user['id'] or req.get('to_user_id') == current_user['id']))
        ]
        
        contacts = []
        for request in accepted_requests:
            # Determine the other user (contact)
            contact_id = request['to_user_id'] if request['from_user_id'] == current_user['id'] else request['from_user_id']
            
            # Get contact info
            contact_user = db.fetchone("users", {"id": contact_id})
            if contact_user:
                # Get last message between users
                all_messages = db.fetchall("messages", {})
                user_messages = [
                    msg for msg in all_messages
                    if ((msg.get('sender_id') == current_user['id'] and msg.get('recipient_id') == contact_id) or
                        (msg.get('sender_id') == contact_id and msg.get('recipient_id') == current_user['id']))
                ]
                
                # Sort by timestamp and get last message
                user_messages.sort(key=lambda x: x.get('created_at', ''), reverse=True)
                last_message = user_messages[0] if user_messages else None
                
                contacts.append({
                    "id": contact_id,
                    "username": contact_user['username'],
                    "last_message": "Start chatting..." if not last_message else "New message",
                    "timestamp": str(request.get('created_at', '')),
                    "unread_count": 0,  # TODO: Implement unread count
                    "is_online": True,  # TODO: Implement online status
                    "status": "active"
                })
        
        return contacts
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get contacts: {str(e)}"
        )

@router.post("/pending")
async def get_pending_contacts(current_user = Depends(get_current_user)):
    """Get pending chat requests sent by user"""
    try:
        all_requests = db.fetchall("chat_requests", {})
        pending_requests = [
            req for req in all_requests 
            if (req.get('from_user_id') == current_user['id'] and req.get('status') == 'pending')
        ]
        
        contacts = []
        for request in pending_requests:
            contact_user = db.fetchone("users", {"id": request['to_user_id']})
            if contact_user:
                contacts.append({
                    "id": request['to_user_id'],
                    "username": contact_user['username'],
                    "last_message": "Chat request sent...",
                    "timestamp": str(request.get('created_at', '')),
                    "unread_count": 0,
                    "is_online": False,
                    "status": "pending"
                })
        
        return contacts
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get pending contacts: {str(e)}"
        )