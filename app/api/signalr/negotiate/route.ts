import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST() {
  const signalRConnectionString = process.env.SIGNALR_CONNECTION_STRING;
  
  if (!signalRConnectionString) {
    return NextResponse.json({ error: 'SignalR not configured' }, { status: 500 });
  }
  
  const endpoint = signalRConnectionString.match(/Endpoint=(.*?);/)?.[1];
  const accessKey = signalRConnectionString.match(/AccessKey=(.*?);/)?.[1];
  
  const hubName = 'trafficHub';
  const url = `${endpoint}/api/v1/hubs/${hubName}`;
  
  const userId = `user-${Date.now()}`;
  const token = generateClientToken(endpoint, accessKey, hubName);
  
  return NextResponse.json({ url, accessToken: token, userId });
}

function generateClientToken(endpoint: string, accessKey: string, hubName: string): string {
  const url = new URL(endpoint);
  const resourceUri = `${url.host}/api/v1/hubs/${hubName}`;
  const expires = Math.ceil((Date.now() / 1000) + 86400);
  
  const toSign = resourceUri + '\n' + expires;
  const hmac = crypto.createHmac('sha256', Buffer.from(accessKey, 'base64'));
  hmac.update(toSign);
  const signature = encodeURIComponent(hmac.digest('base64'));
  
  return `SharedAccessSignature sr=${resourceUri}&sig=${signature}&se=${expires}`;
}