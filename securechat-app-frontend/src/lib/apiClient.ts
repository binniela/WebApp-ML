interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

export class ApiClient {
  private static async makeRequest<T>(
    path: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem('lockbox-token')
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        body: JSON.stringify({
          path,
          ...((options.body && JSON.parse(options.body as string)) || {})
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        return {
          error: data.detail || 'Request failed',
          status: response.status
        }
      }

      return {
        data,
        status: response.status
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0
      }
    }
  }

  static async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(path, { method: 'GET' })
  }

  static async post<T>(path: string, data: any = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(path, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}