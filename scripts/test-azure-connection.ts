// Script untuk test koneksi ke Azure Cosmos DB
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT;
const key = process.env.AZURE_COSMOS_KEY;
const databaseId = process.env.AZURE_COSMOS_DATABASE || 'TrafficDB';

async function testConnection() {
  console.log('🔍 Testing Azure Cosmos DB Connection...\n');

  // 1. Check environment variables
  console.log('1️⃣ Checking environment variables:');
  console.log(`   AZURE_COSMOS_ENDPOINT: ${endpoint ? '✅ Set' : '❌ Missing'}`);
  console.log(`   AZURE_COSMOS_KEY: ${key ? '✅ Set' : '❌ Missing'}`);
  console.log(`   AZURE_COSMOS_DATABASE: ${databaseId}\n`);

  if (!endpoint || !key) {
    console.error('❌ Missing required environment variables!');
    console.error('   Please check your .env.local file\n');
    process.exit(1);
  }

  // 2. Test connection
  console.log('2️⃣ Testing connection to Cosmos DB...');
  try {
    const client = new CosmosClient({ endpoint, key });
    const { resource: databaseInfo } = await client.database(databaseId).read();
    console.log(`   ✅ Connected to database: ${databaseInfo?.id}\n`);
  } catch (error: any) {
    console.error('   ❌ Connection failed!');
    if (error.code === 401) {
      console.error('   ⚠️  Error 401: AZURE_COSMOS_KEY is invalid or expired');
      console.error('   📝 Please get the correct key from Azure Portal:');
      console.error('      1. Go to https://portal.azure.com');
      console.error('      2. Find your Cosmos DB account: traffic-cosmos-slam');
      console.error('      3. Go to "Keys" section');
      console.error('      4. Copy the Primary Key or Secondary Key');
      console.error('      5. Update .env.local with the new key');
      console.error('      6. Restart the server\n');
    } else if (error.code === 404) {
      console.error(`   ⚠️  Error 404: Database "${databaseId}" not found`);
      console.error('   📝 Please create the database in Azure Portal\n');
    } else {
      console.error(`   ⚠️  Error: ${error.message}\n`);
    }
    process.exit(1);
  }

  // 3. Check containers
  console.log('3️⃣ Checking containers:');
  const requiredContainers = [
    'intersections',
    'traffic_data',
    'analytics_daily',
    'events',
    'reports',
    'notifications',
    'users',
    'device_status',
  ];

  try {
    const client = new CosmosClient({ endpoint, key });
    const database = client.database(databaseId);
    const { resources: containers } = await database.containers.readAll().fetchAll();
    const containerIds = containers.map(c => c.id);

    for (const containerName of requiredContainers) {
      if (containerIds.includes(containerName)) {
        // Check item count
        try {
          const container = database.container(containerName);
          const { resources } = await container.items
            .query('SELECT VALUE COUNT(1) FROM c')
            .fetchAll();
          const count = resources[0] || 0;
          console.log(`   ✅ ${containerName.padEnd(20)} (${count} items)`);
        } catch (error) {
          console.log(`   ✅ ${containerName.padEnd(20)} (exists)`);
        }
      } else {
        console.log(`   ❌ ${containerName.padEnd(20)} (missing)`);
      }
    }
    console.log('');
  } catch (error: any) {
    console.error(`   ❌ Error checking containers: ${error.message}\n`);
    process.exit(1);
  }

  // 4. Test query
  console.log('4️⃣ Testing query capability...');
  try {
    const client = new CosmosClient({ endpoint, key });
    const database = client.database(databaseId);
    const container = database.container('intersections');
    const { resources } = await container.items
      .query('SELECT * FROM c OFFSET 0 LIMIT 1')
      .fetchAll();
    console.log(`   ✅ Query successful (found ${resources.length} items)\n`);
  } catch (error: any) {
    console.error(`   ❌ Query failed: ${error.message}\n`);
  }

  // 5. Summary
  console.log('═'.repeat(60));
  console.log('✅ Connection test completed!');
  console.log('═'.repeat(60));
  console.log('\n📝 Next steps:');
  console.log('   1. If containers are missing, run: npm run db:seed:azure');
  console.log('   2. Start development server: npm run dev');
  console.log('   3. Start real-time simulation: npm run db:simulate');
  console.log('   4. Open browser: http://localhost:3000/Analist\n');
}

testConnection().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
