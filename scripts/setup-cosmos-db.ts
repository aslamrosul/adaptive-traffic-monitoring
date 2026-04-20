// Script untuk membuat collections di Azure Cosmos DB
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE || 'TrafficDB';

const client = new CosmosClient({ endpoint, key });

async function setupDatabase() {
  console.log('🚀 Setting up Azure Cosmos DB...\n');

  try {
    // Create database if not exists
    console.log(`📦 Creating database: ${databaseId}`);
    const { database } = await client.databases.createIfNotExists({
      id: databaseId,
    });
    console.log('✅ Database ready\n');

    // Define containers with partition keys
    const containers = [
      { id: 'users', partitionKey: '/email' },
      { id: 'intersections', partitionKey: '/deviceId' },
      { id: 'traffic_data', partitionKey: '/intersectionId' },
      { id: 'events', partitionKey: '/intersectionId' },
      { id: 'reports', partitionKey: '/intersectionId' },
      { id: 'notifications', partitionKey: '/userId' },
      { id: 'device_status', partitionKey: '/deviceId' },
      { id: 'analytics_daily', partitionKey: '/intersectionId' },
    ];

    // Create containers
    for (const containerDef of containers) {
      console.log(`📁 Creating container: ${containerDef.id}`);
      await database.containers.createIfNotExists({
        id: containerDef.id,
        partitionKey: {
          paths: [containerDef.partitionKey],
          version: 2,
        },
      });
      console.log(`✅ Container ${containerDef.id} ready`);
    }

    console.log('\n✨ Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  }
}

setupDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
