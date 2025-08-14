from fastapi import APIRouter, HTTPException, status, Depends, Header, Request
from app.utils.auth import verify_token
from app.database import db
from app.middleware.rate_limiter import rate_limiter
from typing import List

router = APIRouter(prefix="/users", tags=["users"])

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

@router.get("/search")
async def search_users_get(request: Request, q: str = "", current_user = Depends(get_current_user)):
    rate_limiter.check_rate_limit(request, max_requests=20, window_seconds=60)
    """Search for users by username (GET)"""
    try:
        if len(q) < 2:
            return {"users": []}
        
        # Get all users and filter by username (case-insensitive)
        all_users = db.fetchall("users", {})
        matching_users = [
            user for user in all_users 
            if q.lower() in user['username'].lower() and user['id'] != current_user['id']
        ]
        
        # Get public keys for matching users
        result = []
        for user in matching_users[:10]:  # Limit to 10 results
            user_keys = db.fetchone("user_keys", {"user_id": user['id']})
            result.append({
                "id": user['id'],
                "username": user['username'],
                "kyber_public_key": user_keys['kyber_public_key'] if user_keys else None,
                "mldsa_public_key": user_keys['mldsa_public_key'] if user_keys else None,
                "created_at": str(user.get('created_at', ''))
            })
        
        return {"users": result}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

@router.post("/search")
async def search_users(request: Request, request_data: dict, current_user = Depends(get_current_user)):
    rate_limiter.check_rate_limit(request, max_requests=20, window_seconds=60)
    """Search for users by username"""
    try:
        q = request_data.get("q", "")
        if len(q) < 2:
            return {"users": []}
        
        # Get all users and filter by username (case-insensitive)
        all_users = db.fetchall("users", {})
        matching_users = [
            user for user in all_users 
            if q.lower() in user['username'].lower() and user['id'] != current_user['id']
        ]
        
        # Get public keys for matching users
        result = []
        for user in matching_users[:10]:  # Limit to 10 results
            user_keys = db.fetchone("user_keys", {"user_id": user['id']})
            result.append({
                "id": user['id'],
                "username": user['username'],
                "kyber_public_key": user_keys['kyber_public_key'] if user_keys else None,
                "mldsa_public_key": user_keys['mldsa_public_key'] if user_keys else None,
                "created_at": str(user.get('created_at', ''))
            })
        
        return {"users": result}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

@router.get("/profile/{user_id}")
async def get_user_profile(user_id: str, current_user = Depends(get_current_user)):
    """Get user profile and public keys"""
    try:
        user = db.fetchone("users", {"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_keys = db.fetchone("user_keys", {"user_id": user_id})
        
        return {
            "id": user['id'],
            "username": user['username'],
            "kyber_public_key": user_keys['kyber_public_key'] if user_keys else None,
            "mldsa_public_key": user_keys['mldsa_public_key'] if user_keys else None,
            "created_at": str(user.get('created_at', ''))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user profile: {str(e)}"
        )