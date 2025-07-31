// Token management utilities
export class TokenManager {
  private static instance: TokenManager;
  
  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }
  
  getToken(): string | null {
    return localStorage.getItem('lockbox-token');
  }
  
  setToken(token: string): void {
    localStorage.setItem('lockbox-token', token);
  }
  
  removeToken(): void {
    localStorage.removeItem('lockbox-token');
  }
  
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    try {
      // Simple JWT expiration check (decode payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true;
    }
  }
  
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    
    if (!token || this.isTokenExpired()) {
      throw new Error('Token expired or missing');
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 401) {
      this.removeToken();
      window.location.reload();
      throw new Error('Authentication failed');
    }
    
    return response;
  }
}

export const tokenManager = TokenManager.getInstance();