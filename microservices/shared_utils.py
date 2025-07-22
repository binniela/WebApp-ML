"""
Shared utilities for microservices
"""
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Auth utilities
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("Missing JWT_SECRET_KEY environment variable")
    
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        return username
    except JWTError:
        return None

# Database connection
class Database:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY environment variables")
            
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
    
    def fetchone(self, table: str, filters: dict = None):
        try:
            query = self.client.table(table).select("*")
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            result = query.limit(1).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Database fetchone error: {e}")
            return None
    
    def fetchall(self, table: str, filters: dict = None):
        try:
            query = self.client.table(table).select("*")
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            result = query.execute()
            return result.data
        except Exception as e:
            print(f"Database fetchall error: {e}")
            return []
    
    def insert(self, table: str, data: dict):
        try:
            result = self.client.table(table).insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Database insert error: {e}")
            raise
    
    def update(self, table: str, data: dict, filters: dict):
        try:
            query = self.client.table(table).update(data)
            for key, value in filters.items():
                query = query.eq(key, value)
            result = query.execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Database update error: {e}")
            raise
    
    def delete(self, table: str, filters: dict):
        try:
            query = self.client.table(table).delete()
            for key, value in filters.items():
                query = query.eq(key, value)
            result = query.execute()
            return result.data
        except Exception as e:
            print(f"Database delete error: {e}")
            raise

db = Database()