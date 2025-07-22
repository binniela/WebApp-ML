import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test connectivity to EC2 services
    const tests = [
      { name: 'Auth Service', url: 'http://52.53.221.141:8001/contacts/' },
      { name: 'Message Service', url: 'http://52.53.221.141:8002/' },
      { name: 'WebSocket Service', url: 'http://52.53.221.141:8003/connections' }
    ]
    
    const results = await Promise.allSettled(
      tests.map(async (test) => {
        const response = await fetch(test.url, { 
          signal: AbortSignal.timeout(3000),
          headers: { 'Authorization': 'Bearer test' }
        })
        return { 
          name: test.name, 
          status: response.status, 
          ok: response.ok,
          url: test.url
        }
      })
    )
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      results: results.map((result, i) => ({
        ...tests[i],
        ...(result.status === 'fulfilled' ? result.value : { error: result.reason.message })
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Test failed', 
      detail: error.message 
    }, { status: 500 })
  }
}