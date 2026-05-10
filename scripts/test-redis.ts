import { getRedisClient, disconnectRedis } from '../lib/redis';

async function testRedis() {
  try {
    console.log('🔄 Testing Redis connection...');

    const client = await getRedisClient();

    // Test SET
    await client.set('test:key', 'Hello Redis!');
    console.log('✅ SET test:key');

    // Test GET
    const value = await client.get('test:key');
    console.log('✅ GET test:key:', value);

    // Test SETEX (with TTL)
    await client.setEx('test:ttl', 10, 'Expires in 10 seconds');
    console.log('✅ SETEX test:ttl (10s TTL)');

    // Test TTL
    const ttl = await client.ttl('test:ttl');
    console.log('✅ TTL test:ttl:', ttl, 'seconds');

    // Test DELETE
    await client.del('test:key');
    console.log('✅ DEL test:key');

    // Cleanup
    await disconnectRedis();
    console.log('✅ Redis test completed successfully!');

  } catch (error) {
    console.error('❌ Redis test failed:', error);
  }
}

testRedis();
