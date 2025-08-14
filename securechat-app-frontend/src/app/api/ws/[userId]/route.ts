import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  
  // This is a WebSocket upgrade request, we need to proxy it to the backend
  const backendWsUrl = `ws://52.53.221.141:8000/ws/${userId}?token=${token}`
  
  // For WebSocket proxying in Next.js, we need to handle this differently
  // Since Next.js doesn't directly support WebSocket proxying in API routes,
  // we'll return instructions for the client to connect directly
  return new Response(
    JSON.stringify({
      error: 'WebSocket proxy not supported in this configuration',
      directUrl: backendWsUrl,
      message: 'Connect directly to the backend WebSocket'
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}