import { NextRequest, NextResponse } from 'next/server'

// Temporary fallback authentication for testing
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }
    
    // Simple fallback auth for testing
    const mockUser = {
      id: `user_${Date.now()}`,
      username: username
    }
    
    const mockToken = `fallback_token_${Date.now()}`
    
    return NextResponse.json({
      access_token: mockToken,
      token_type: 'bearer',
      user: mockUser,
      note: 'Using fallback authentication - backend services unavailable'
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Fallback auth failed', 
      detail: error.message 
    }, { status: 500 })
  }
}