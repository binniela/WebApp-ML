from fastapi import APIRouter, HTTPException, status
from app.crypto.pq_crypto import pq_crypto

router = APIRouter(prefix="/crypto", tags=["cryptography"])

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
                "symmetric": "AES-256-GCM"
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Key generation failed: {str(e)}"
        )

@router.post("/test-kyber")
async def test_kyber_kem(public_key: str):
    """Test Kyber KEM functionality"""
    try:
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
async def test_mldsa_signature(message: str, private_key: str, public_key: str):
    """Test ML-DSA signature functionality"""
    try:
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