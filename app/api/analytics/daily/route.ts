import { containers } from '@/lib/azure-cosmos';
import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/redis';

export const dynamic = 'force-dynamic';

// GET: Fetch daily analytics with Redis caching
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const intersectionId = searchParams.get('intersectionId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const limit = parseInt(searchParams.get('limit') || '30');

    // Create cache key based on query parameters
    const cacheKey = `cache:analytics:daily:${date}:${intersectionId || 'all'}:${limit}`;

    // Try cache first (24 hour TTL for historical data, 5 min for today)
    const isToday = date === new Date().toISOString().split('T')[0];
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return NextResponse.json({
        success: true,
        source: 'cache',
        count: cached.length,
        data: cached,
      });
    }

    console.log('❌ Cache MISS - fetching from Cosmos DB:', cacheKey);

    let query = 'SELECT * FROM c WHERE 1=1';
    const parameters: any[] = [];

    if (intersectionId) {
      query += ' AND c.intersectionId = @intersectionId';
      parameters.push({ name: '@intersectionId', value: intersectionId });
    }

    if (date) {
      query += ' AND c.date = @date';
      parameters.push({ name: '@date', value: date });
    }

    query += ` ORDER BY c.date DESC OFFSET 0 LIMIT ${limit}`;

    const { resources } = await containers.analyticsDaily.items
      .query({ query, parameters })
      .fetchAll();

    // Cache the results
    // Historical data: 24 hours (86400s), Today's data: 5 minutes (300s)
    const ttl = isToday ? 300 : 86400;
    await cacheSet(cacheKey, resources, ttl);
    console.log(`✅ Cached for ${ttl}s:`, cacheKey);

    return NextResponse.json({
      success: true,
      source: 'database',
      count: resources.length,
      data: resources,
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Failed to fetch analytics';
    let statusCode = 500;
    
    if (error.code === 401) {
      errorMessage = 'Azure Cosmos DB authentication failed. Please check AZURE_COSMOS_KEY in .env.local';
      statusCode = 401;
    } else if (error.code === 404) {
      errorMessage = 'Container "analytics_daily" not found. Please run: npm run db:seed:azure';
      statusCode = 404;
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: error.code,
        hint: error.code === 401 
          ? 'Get the correct key from Azure Portal > Cosmos DB > Keys' 
          : error.code === 404
          ? 'Run "npm run db:seed:azure" to create containers and seed data'
          : 'Check server logs for more details',
      },
      { status: statusCode }
    );
  }
}
