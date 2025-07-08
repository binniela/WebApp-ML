from pydantic import BaseModel
from typing import Optional

class MessageCreate(BaseModel):
    recipient_id: str
    content: str
    conversation_id: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    recipient_id: str
    encrypted_content: str
    mldsa_signature: str
    created_at: str