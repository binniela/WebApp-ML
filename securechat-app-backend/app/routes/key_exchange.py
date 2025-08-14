from fastapi import APIRouter, HTTPException, Depends, Header, Request
from app.utils.auth import verify_token
from app.database import db

router = APIRouter(prefix="/keys", tags=["key-exchange"])

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = authorization.split(" ")[1]
    username = verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.fetchone("users", {"username": username})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

@router.get("/public/{user_id}")
async def get_public_keys(user_id: str, current_user = Depends(get_current_user)):
    """Get public keys for a specific user"""
    try:
        user = db.fetchone("users", {"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "user_id": user_id,
            "username": user["username"],
            "kyber_public_key": user.get("kyber_public_key"),
            "mldsa_public_key": user.get("mldsa_public_key")
        }
    except Exception as e:
        print(f"Get keys error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get keys: {str(e)}")

@router.post("/update")
async def update_public_keys(request: dict, current_user = Depends(get_current_user)):
    """Update user's public keys"""
    try:
        print(f"Updating keys for user {current_user['id']}")
        print(f"Request data: {list(request.keys())}")
        
        # Update user keys in database
        update_data = {}
        if "kyber_public_key" in request:
            update_data["kyber_public_key"] = request["kyber_public_key"]
        if "mldsa_public_key" in request:
            update_data["mldsa_public_key"] = request["mldsa_public_key"]
            
        if update_data:
            db.update("users", update_data, {"id": current_user["id"]})
            print(f"Keys updated successfully for user {current_user['id']}")
        
        return {"message": "Public keys updated successfully"}
    except Exception as e:
        print(f"Key update error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update keys: {str(e)}")