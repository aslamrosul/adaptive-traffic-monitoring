import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST() {
  try {
    const connectionString = process.env.SIGNALR_CONNECTION_STRING;
    
    if (!connectionString) {
      console.error('❌ SIGNALR_CONNECTION_STRING not set');
      return NextResponse.json(
        { error: 'SignalR connection string not configured' },
        { status: 500 }
      );
    }

    // Parse connection string
    const match = connectionString.match(/Endpoint=(https?:\/\/[^;]+);AccessKey=([^;]+);/);
    
    if (!match) {
      console.error('❌ Invalid SignalR connection string format');
      return NextResponse.json(
        { error: 'Invalid SignalR connection string format' },
        { status: 500 }
      );
    }

    const endpoint = match[1];
    const accessKey = match[2];
    const hubName = 'trafficHub';

    // Validate endpoint URL
    if (!endpoint.startsWith('http')) {
      console.error('❌ Invalid endpoint URL:', endpoint);
      return NextResponse.json(
        { error: 'Invalid SignalR endpoint URL' },
        { status: 500 }
      );
    }

    // Generate access token using Azure SignalR format
    const userId = `user-${Date.now()}`;
    const audience = `${endpoint}/client/?hub=${hubName}`;
    const token = generateAccessToken(audience, accessKey);

    console.log('✅ SignalR negotiate success');

    // Return in the format expected by SignalR client
    return NextResponse.json({
      url: audience,
      accessToken: token
    });

  } catch (error) {
    console.error('❌ SignalR negotiate error:', error);
    return NextResponse.json(
      { error: 'Failed to negotiate SignalR connection' },
      { status: 500 }
    );
  }
}

function generateAccessToken(audience: string, accessKey: string): string {
  const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  
  // Create JWT-like token for Azure SignalR
  const payload = {
    aud: audience,
    exp: expiry
  };
  
  // Create signature
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', accessKey)
    .update(`${header}.${body}`)
    .digest('base64url');
  
  return `${header}.${body}.${signature}`;
}
