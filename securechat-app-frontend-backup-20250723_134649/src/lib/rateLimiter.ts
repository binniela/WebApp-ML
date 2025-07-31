// Simple rate limiter to prevent API spam
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  canMakeRequest(key: string, maxRequests: number = 10, windowMs: number = 10000): boolean {
    const now = Date.now()
    const requests = this.requests.get(key) || []
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs)
    
    if (validRequests.length >= maxRequests) {
      return false
    }
    
    // Add current request
    validRequests.push(now)
    this.requests.set(key, validRequests)
    
    return true
  }
  
  reset(key?: string) {
    if (key) {
      this.requests.delete(key)
    } else {
      this.requests.clear()
    }
  }
}

export const rateLimiter = new RateLimiter()