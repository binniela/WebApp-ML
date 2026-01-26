from fastapi import APIRouter, HTTPException, status, Depends, Header
from app.crypto.pq_crypto import pq_crypto
from app.utils.auth import verify_token
from app.database import db

router = APIRouter(prefix="/crypto", tags=["cryptography"])

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

@router.post("/generate-keys")
async def generate_post_quantum_keys():
    """Generate post-quantum key pairs using liboqs"""
    try:
        # Generate Kyber-1024 key pair
        kyber_public, kyber_private = pq_crypto.generate_kyber_keypair()
        
        # Generate ML-DSA-87 key pair
        mldsa_public, mldsa_private = pq_crypto.generate_mldsa_keypair()
        
        return {
            "kyber": {
                "public_key": kyber_public,
                "private_key": kyber_private
            },
            "mldsa": {
                "public_key": mldsa_public,
                "private_key": mldsa_private
            },
            "algorithms": {
                "kem": "Kyber-1024",
                "signature": "ML-DSA-87",
                "symmetric": "AES-256-CBC"
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Key generation failed: {str(e)}"
        )

@router.post("/kyber-encapsulate")
async def kyber_encapsulate(request: dict, current_user = Depends(get_current_user)):
    """Kyber encapsulation - generate shared secret for recipient"""
    try:
        public_key = request.get("public_key")
        if not public_key:
            raise HTTPException(status_code=400, detail="Missing public_key")
        
        # Kyber encapsulation
        ciphertext, shared_secret = pq_crypto.kyber_encapsulate(public_key)
        
        return {
            "ciphertext": ciphertext,
            "shared_secret": shared_secret,
            "algorithm": "Kyber-1024"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Kyber encapsulation failed: {str(e)}"
        )

@router.post("/kyber-decapsulate")
async def kyber_decapsulate(request: dict, current_user = Depends(get_current_user)):
    """Kyber decapsulation - extract shared secret using private key"""
    try:
        ciphertext = request.get("ciphertext")
        private_key = request.get("private_key")
        
        if not ciphertext or not private_key:
            raise HTTPException(status_code=400, detail="Missing ciphertext or private_key")
        
        # Kyber decapsulation
        shared_secret = pq_crypto.kyber_decapsulate(ciphertext, private_key)
        
        return {
            "shared_secret": shared_secret,
            "algorithm": "Kyber-1024"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Kyber decapsulation failed: {str(e)}"
        )

@router.post("/test-kyber")
async def test_kyber_kem(request: dict):
    """Test Kyber KEM functionality"""
    try:
        public_key = request.get("public_key")
        if not public_key:
            raise HTTPException(status_code=400, detail="Missing public_key")
            
        # Test encapsulation
        ciphertext, shared_secret = pq_crypto.kyber_encapsulate(public_key)
        
        return {
            "success": True,
            "ciphertext": ciphertext,
            "shared_secret_length": len(shared_secret),
            "algorithm": "Kyber-1024"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Kyber test failed: {str(e)}"
        )

@router.post("/test-mldsa")
async def test_mldsa_signature(request: dict):
    """Test ML-DSA signature functionality"""
    try:
        message = request.get("message", "")
        private_key = request.get("private_key", "")
        public_key = request.get("public_key", "")
        
        if not all([message, private_key, public_key]):
            raise HTTPException(status_code=400, detail="Missing required fields")
            
        message_bytes = message.encode('utf-8')
        
        # Sign message
        signature = pq_crypto.mldsa_sign(message_bytes, private_key)
        
        # Verify signature
        is_valid = pq_crypto.mldsa_verify(message_bytes, signature, public_key)
        
        return {
            "success": True,
            "signature": signature,
            "verification": is_valid,
            "algorithm": "ML-DSA-87"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ML-DSA test failed: {str(e)}"
        )