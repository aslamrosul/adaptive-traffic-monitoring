import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  // Create new client
  const useTls = process.env.REDIS_TLS === 'true';
  
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      ...(useTls && { tls: true })
    },
    password: process.env.REDIS_PASSWORD
  }) as RedisClientType;

  // Error handling
  redisClient.on('error', (err: Error) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected');
  });

  // Connect
  await redisClient.connect();

  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.disconnect();
    redisClient = null;
  }
}

// Helper functions
export async function cacheSet(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
  const client = await getRedisClient();
  await client.setEx(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheGet(key: string): Promise<any | null> {
  const client = await getRedisClient();
  const cached = await client.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function cacheDelete(key: string): Promise<void> {
  const client = await getRedisClient();
  await client.del(key);
}

export async function cacheExists(key: string): Promise<boolean> {
  const client = await getRedisClient();
  const exists = await client.exists(key);
  return exists === 1;
}
