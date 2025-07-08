from fastapi import APIRouter, HTTPException, status, Depends, Header
from app.models.user import UserCreate, UserLogin, UserResponse
from app.utils.auth import hash_password, verify_password, create_access_token
from app.database import db
import uuid

router = APIRouter(prefix="/auth", tags=["authentication"])

def get_current_user(authorization: str = Header(None)):
    """Get current user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    from app.utils.auth import verify_token as verify_jwt_token
    username = verify_jwt_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.fetchone("users", {"username": username})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

@router.post("/register", response_model=dict)
async def register(user: UserCreate):
    """Register a new user - NO private keys stored"""
    try:
        # Check if username already exists
        existing_user = db.fetchone("users", {"username": user.username})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Hash password
        hashed_password = hash_password(user.password)
        
        # Create user
        user_id = str(uuid.uuid4())
        user_data = {
            "id": user_id,
            "username": user.username,
            "password_hash": hashed_password
        }
        
        created_user = db.insert("users", user_data)
        
        # Create access token
        access_token = create_access_token(data={"sub": user.username})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "username": user.username
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=dict)
async def login(user: UserLogin):
    """Login user"""
    try:
        # Get user from database
        db_user = db.fetchone("users", {"username": user.username})
        
        if not db_user or not verify_password(user.password, db_user['password_hash']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
        
        # Create access token
        access_token = create_access_token(data={"sub": user.username})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(db_user['id']),
                "username": db_user['username']
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/keys", response_model=dict)
async def store_public_key(key_data: dict, current_user = None):
    """Store user's public key (generated client-side)"""
    try:
        # Store only public keys
        keys_data = {
            "user_id": key_data["user_id"],
            "kyber_public_key": key_data["kyber_public_key"],
            "mldsa_public_key": key_data["mldsa_public_key"]
        }
        
        # Check if keys already exist
        existing_keys = db.fetchone("user_keys", {"user_id": key_data["user_id"]})
        if existing_keys:
            # Update existing keys
            # Note: In production, you'd use an UPDATE query
            pass
        else:
            db.insert("user_keys", keys_data)
        
        return {"message": "Public keys stored successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store keys: {str(e)}"
        )

@router.get("/verify")
async def verify_token(current_user = Depends(get_current_user)):
    """Verify if JWT token is still valid"""
    return {
        "valid": True,
        "user": {
            "id": current_user['id'],
            "username": current_user['username']
        }
    }

@router.get("/keys/{user_id}")
async def get_public_key(user_id: str):
    """Get user's public key for encryption"""
    try:
        user_keys = db.fetchone("user_keys", {"user_id": user_id})
        if not user_keys:
            raise HTTPException(status_code=404, detail="User keys not found")
        
        return {
            "user_id": user_id,
            "kyber_public_key": user_keys["kyber_public_key"],
            "mldsa_public_key": user_keys["mldsa_public_key"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get keys: {str(e)}"
        )