from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
from datetime import timedelta
import uuid

# Import shared utilities
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from shared_utils import db, hash_password, verify_password, create_access_token, verify_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta
import uuid

app = FastAPI(title="LockBox Auth Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register")
async def register_user(user_data: dict):
    """Register new user"""
    try:
        username = user_data.get("username")
        password = user_data.get("password")
        
        if not username or not password:
            raise HTTPException(status_code=400, detail="Username and password required")
        
        # Check if user exists
        existing_user = db.fetchone("users", {"username": username})
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        # Hash password and create user
        hashed_password = hash_password(password)
        user_id = str(uuid.uuid4())
        
        user = db.insert("users", {
            "id": user_id,
            "username": username,
            "password_hash": hashed_password
        })
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": username}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {"id": user_id, "username": username}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
async def login_user(user_data: dict):
    """Login user"""
    try:
        username = user_data.get("username")
        password = user_data.get("password")
        
        if not username or not password:
            raise HTTPException(status_code=400, detail="Username and password required")
        
        # Get user from database
        user = db.fetchone("users", {"username": username})
        if not user or not verify_password(password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": username}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {"id": user["id"], "username": username}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/verify/{token}")
async def verify_user_token(token: str):
    """Verify JWT token and return user info"""
    try:
        username = verify_token(token)
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.fetchone("users", {"username": username})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {"id": user["id"], "username": user["username"]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token verification failed")

@app.get("/user/{user_id}")
async def get_user_by_id(user_id: str):
    """Get user by ID (for other services)"""
    try:
        user = db.fetchone("users", {"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"id": user["id"], "username": user["username"]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/keys")
async def store_user_keys(key_data: dict, authorization: str = Header(None)):
    """Store user's public keys"""
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing token")
        
        token = authorization.split(" ")[1]
        username = verify_token(token)
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Store keys in database
        db.insert("user_keys", {
            "user_id": key_data["user_id"],
            "kyber_public_key": key_data["kyber_public_key"],
            "mldsa_public_key": key_data["mldsa_public_key"]
        })
        
        return {"message": "Keys stored successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/keys/{user_id}")
async def get_user_keys(user_id: str):
    """Get user's public keys"""
    try:
        keys = db.fetchone("user_keys", {"user_id": user_id})
        if not keys:
            raise HTTPException(status_code=404, detail="Keys not found")
        
        return {
            "kyber_public_key": keys["kyber_public_key"],
            "mldsa_public_key": keys["mldsa_public_key"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Additional routes that were in the original backend
@app.get("/contacts/")
async def get_contacts(authorization: str = Header(None)):
    """Get user contacts"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = authorization.split(" ")[1]
    username = verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Return empty contacts for now - implement as needed
    return []

@app.get("/contacts/pending")
async def get_pending_contacts(authorization: str = Header(None)):
    """Get pending contacts"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    
    return []

@app.get("/users/search")
async def search_users(q: str, authorization: str = Header(None)):
    """Search users"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    
    if not q:
        return []
    
    # Search users by username
    all_users = db.fetchall("users", {})
    matching_users = []
    
    for user in all_users:
        if q.lower() in user['username'].lower():
            matching_users.append({
                "id": user['id'],
                "username": user['username']
            })
    
    return matching_users[:10]  # Limit to 10 results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)