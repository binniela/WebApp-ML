import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, ...data } = body;
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    const targetUrl = `http://52.53.221.141${path}`;
    console.log('Proxying to:', targetUrl, 'with data:', data);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && { 
          'Authorization': request.headers.get('authorization')! 
        })
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    console.log('Response:', response.status, responseData);

    return NextResponse.json(responseData, { status: response.status });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: error.message }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  
  if (!path) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });
  }

  try {
    const targetUrl = `http://52.53.221.141${path}`;
    console.log('Proxying GET to:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        ...(request.headers.get('authorization') && { 
          'Authorization': request.headers.get('authorization')! 
        })
      },
    });

    const responseData = await response.json();
    return NextResponse.json(responseData, { status: response.status });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: error.message }, 
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}