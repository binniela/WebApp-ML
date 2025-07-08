from pydantic import BaseModel
from typing import Optional
import uuid

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    created_at: str

class UserWithKeys(BaseModel):
    id: str
    username: str
    kyber_public_key: str
    mldsa_public_key: str