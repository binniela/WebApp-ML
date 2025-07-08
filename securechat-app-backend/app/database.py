from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Database:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY environment variables")
            
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
    
    def fetchone(self, table: str, filters: dict = None):
        """Fetch one row from table"""
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
        """Fetch all rows from table"""
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
        """Insert data into table"""
        try:
            result = self.client.table(table).insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Database insert error: {e}")
            raise
    
    def update(self, table: str, data: dict, filters: dict):
        """Update data in table"""
        try:
            query = self.client.table(table).update(data)
            for key, value in filters.items():
                query = query.eq(key, value)
            result = query.execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Database update error: {e}")
            raise

# Global database instance
db = Database()