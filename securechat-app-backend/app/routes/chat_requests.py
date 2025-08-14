from fastapi import APIRouter, HTTPException, status, Depends, Header
from app.utils.auth import verify_token
from app.database import db
from app.websocket_manager import manager
import uuid
from datetime import datetime

router = APIRouter(prefix="/chat-requests", tags=["chat_requests"])

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

@router.post("/send")
async def send_chat_request(request_data: dict, current_user = Depends(get_current_user)):
    """Send a chat request to another user"""
    try:
        recipient_id = request_data.get("recipient_id")
        message = request_data.get("message", "Hi! I'd like to start a secure conversation with you.")
        
        # Verify recipient exists
        recipient = db.fetchone("users", {"id": recipient_id})
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # Check if request already exists
        existing_requests = db.fetchall("chat_requests", {})
        for req in existing_requests:
            if (req.get('from_user_id') == current_user['id'] and 
                req.get('to_user_id') == recipient_id and 
                req.get('status') == 'pending'):
                raise HTTPException(status_code=400, detail="Chat request already sent")
        
        # Create chat request
        request_id = str(uuid.uuid4())
        db.insert("chat_requests", {
            "id": request_id,
            "from_user_id": current_user['id'],
            "to_user_id": recipient_id,
            "message": message,
            "status": "pending"
        })
        
        # Send WebSocket notification to recipient
        try:
            await manager.send_to_user(recipient_id, {
                "type": "notification",
                "data": {
                    "type": "chat_request",
                    "from_user_id": current_user['id'],
                    "from_username": current_user['username'],
                    "message": message,
                    "request_id": request_id
                }
            })
            print(f"WebSocket notification sent to user {recipient_id}")
        except Exception as ws_error:
            print(f"WebSocket notification failed: {ws_error}")
            # Don't fail the request if WebSocket fails
        
        return {
            "message": "Chat request sent successfully",
            "request_id": request_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send chat request: {str(e)}"
        )

@router.get("/incoming")
async def get_incoming_requests(current_user = Depends(get_current_user)):
    """Get incoming chat requests for current user"""
    try:
        # Get all pending requests for this user
        all_requests = db.fetchall("chat_requests", {})
        incoming_requests = [
            req for req in all_requests 
            if (req.get('to_user_id') == current_user['id'] and 
                req.get('status') == 'pending')
        ]
        
        # Get sender information for each request
        result = []
        for request in incoming_requests:
            sender = db.fetchone("users", {"id": request['from_user_id']})
            sender_keys = db.fetchone("user_keys", {"user_id": request['from_user_id']})
            
            if sender:
                result.append({
                    "id": request['id'],
                    "from_user_id": request['from_user_id'],
                    "from_username": sender['username'],
                    "from_public_key": sender_keys['kyber_public_key'] if sender_keys else None,
                    "message": request.get('message', ''),
                    "created_at": str(request.get('created_at', ''))
                })
        
        return {"requests": result}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat requests: {str(e)}"
        )

@router.post("/respond")
async def respond_to_chat_request(response_data: dict, current_user = Depends(get_current_user)):
    """Accept or decline a chat request"""
    try:
        request_id = response_data.get("request_id")
        action = response_data.get("action")  # "accept" or "decline"
        
        if action not in ["accept", "decline"]:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        # Get the chat request
        chat_request = db.fetchone("chat_requests", {"id": request_id})
        if not chat_request:
            raise HTTPException(status_code=404, detail="Chat request not found")
        
        # Verify this request is for the current user
        if chat_request['to_user_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Update request status in Supabase
        new_status = "accepted" if action == "accept" else "declined"
        db.update("chat_requests", 
                 {"status": new_status, "updated_at": datetime.now().isoformat()}, 
                 {"id": request_id})
        
        if action == "accept":
            # Create conversation between users
            conversation_id = str(uuid.uuid4())
            
            # Notify the original sender via WebSocket
            try:
                sender = db.fetchone("users", {"id": chat_request['from_user_id']})
                await manager.send_to_user(sender['username'], {
                    "type": "chat_accepted",
                    "data": {
                        "conversation_id": conversation_id,
                        "contact_id": current_user['id'],
                        "contact_username": current_user['username'],
                        "message": "Chat request accepted"
                    }
                })
                print(f"Chat acceptance notification sent to {sender['username']}")
            except Exception as ws_error:
                print(f"WebSocket notification failed: {ws_error}")
            
            return {
                "message": "Chat request accepted",
                "conversation_id": conversation_id,
                "from_user_id": chat_request['from_user_id'],
                "status": "accepted"
            }
        else:
            return {
                "message": "Chat request declined",
                "status": "declined"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to respond to chat request: {str(e)}"
        )

@router.get("/sent")
async def get_sent_requests(current_user = Depends(get_current_user)):
    """Get chat requests sent by current user"""
    try:
        all_requests = db.fetchall("chat_requests", {})
        sent_requests = [
            req for req in all_requests 
            if req.get('from_user_id') == current_user['id']
        ]
        
        # Get recipient information
        result = []
        for request in sent_requests:
            recipient = db.fetchone("users", {"id": request['to_user_id']})
            if recipient:
                result.append({
                    "id": request['id'],
                    "to_user_id": request['to_user_id'],
                    "to_username": recipient['username'],
                    "message": request.get('message', ''),
                    "status": request.get('status', 'pending'),
                    "created_at": str(request.get('created_at', ''))
                })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sent requests: {str(e)}"
        )