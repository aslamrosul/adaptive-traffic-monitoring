import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  try {
    const connectionString = process.env.SIGNALR_CONNECTION_STRING;
    
    if (!connectionString) {
      return NextResponse.json(
        { error: 'SignalR connection string not configured' },
        { status: 500 }
      );
    }

    // Parse connection string
    const match = connectionString.match(/Endpoint=(.*?);AccessKey=(.*?);/);
    
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid SignalR connection string format' },
        { status: 500 }
      );
    }

    const endpoint = match[1];
    const accessKey = match[2];
    const hubName = 'trafficHub';

    // Generate client access token
    const userId = `user-${Date.now()}`;
    const token = generateClientToken(endpoint, accessKey, hubName, userId);

    return NextResponse.json({
      url: `${endpoint}/client/?hub=${hubName}`,
      accessToken: token,
      userId
    });

  } catch (error) {
    console.error('SignalR negotiate error:', error);
    return NextResponse.json(
      { error: 'Failed to negotiate SignalR connection' },
      { status: 500 }
    );
  }
}

function generateClientToken(
  endpoint: string,
  accessKey: string,
  hubName: string,
  userId: string
): string {
  const url = `${endpoint}/client/?hub=${hubName}`;
  const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const stringToSign = `${url}\n${expiry}`;

  const hmac = crypto.createHmac('sha256', accessKey);
  const signature = hmac.update(stringToSign).digest('base64');

  return `${url}\n${expiry}\n${signature}`;
}
