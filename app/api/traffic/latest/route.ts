import { NextRequest, NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/redis';
import { CosmosClient } from '@azure/cosmos';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const intersectionId = searchParams.get('intersectionId') || 'default';

  try {
    // 1. Try cache first
    const cacheKey = `traffic:latest:${intersectionId}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return NextResponse.json({
        source: 'cache',
        data: cached
      });
    }

    // 2. Cache MISS - fetch from Cosmos DB
    console.log('❌ Cache MISS - fetching from Cosmos DB');
    
    const cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_ENDPOINT!,
      key: process.env.COSMOS_KEY!
    });

    const database = cosmosClient.database(process.env.COSMOS_DATABASE!);
    const container = database.container('traffic-data');

    const { resources } = await container.items
      .query({
        query: 'SELECT TOP 1 * FROM c WHERE c.deviceId = @deviceId ORDER BY c.timestamp DESC',
        parameters: [{ name: '@deviceId', value: intersectionId }]
      })
      .fetchAll();

    const data = resources[0];

    // 3. Update cache (5 minutes TTL)
    await cacheSet(cacheKey, data, 300);

    return NextResponse.json({
      source: 'database',
      data
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch traffic data' },
      { status: 500 }
    );
  }
}