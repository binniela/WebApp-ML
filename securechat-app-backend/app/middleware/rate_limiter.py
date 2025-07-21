from fastapi import HTTPException, Request
from collections import defaultdict
import time
from typing import Dict

class RateLimiter:
    def __init__(self):
        self.requests: Dict[str, list] = defaultdict(list)
    
    def check_rate_limit(self, request: Request, max_requests: int = 10, window_seconds: int = 60):
        client_ip = request.client.host
        key = f"{client_ip}"
        now = time.time()
        window_start = now - window_seconds
        
        # Clean old requests
        self.requests[key] = [req_time for req_time in self.requests[key] if req_time > window_start]
        
        # Check if under limit
        if len(self.requests[key]) >= max_requests:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # Add current request
        self.requests[key].append(now)

rate_limiter = RateLimiter()