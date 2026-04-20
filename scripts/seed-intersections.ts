import { CosmosClient } from '@azure/cosmos';
import { loadEnv } from './load-env';

// Load environment variables
loadEnv();

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE || 'TrafficDB';

if (!endpoint || !key) {
  console.error('❌ Error: Azure Cosmos DB credentials not found in environment variables');
  console.error('Please make sure .env.local file exists with:');
  console.error('  AZURE_COSMOS_ENDPOINT=...');
  console.error('  AZURE_COSMOS_KEY=...');
  process.exit(1);
}

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);

const intersectionsData = [
  {
    id: 'int_001',
    name: 'Persimpangan Thamrin-Sudirman',
    address: 'Jl. Thamrin - Jl. Sudirman, Jakarta Pusat',
    location: {
      lat: -6.1944,
      lng: 106.8229,
    },
    deviceId: 'ESP32_001',
    status: 'active',
    lanes: {
      count: 4,
      directions: ['north', 'east', 'south', 'west'],
    },
    config: {
      mode: 'auto',
      threshold: {
        low: 50,
        medium: 100,
        high: 200,
        critical: 300,
      },
      alertEnabled: true,
      cycleTime: {
        min: 30,
        max: 120,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'int_002',
    name: 'Persimpangan Kuningan-Rasuna Said',
    address: 'Jl. Kuningan - Jl. Rasuna Said, Jakarta Selatan',
    location: {
      lat: -6.2297,
      lng: 106.8308,
    },
    deviceId: 'ESP32_002',
    status: 'active',
    lanes: {
      count: 4,
      directions: ['north', 'east', 'south', 'west'],
    },
    config: {
      mode: 'auto',
      threshold: {
        low: 50,
        medium: 100,
        high: 200,
        critical: 300,
      },
      alertEnabled: true,
      cycleTime: {
        min: 30,
        max: 120,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'int_003',
    name: 'Persimpangan Gatot Subroto',
    address: 'Jl. Gatot Subroto - Jl. Semanggi, Jakarta Selatan',
    location: {
      lat: -6.2253,
      lng: 106.8066,
    },
    deviceId: 'ESP32_003',
    status: 'active',
    lanes: {
      count: 4,
      directions: ['north', 'east', 'south', 'west'],
    },
    config: {
      mode: 'manual',
      threshold: {
        low: 50,
        medium: 100,
        high: 200,
        critical: 300,
      },
      alertEnabled: true,
      cycleTime: {
        min: 30,
        max: 150,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'int_004',
    name: 'Persimpangan Imam Bonjol',
    address: 'Jl. Imam Bonjol - Jl. Diponegoro, Jakarta Pusat',
    location: {
      lat: -6.1875,
      lng: 106.8227,
    },
    deviceId: 'ESP32_004',
    status: 'inactive',
    lanes: {
      count: 3,
      directions: ['north', 'east', 'south'],
    },
    config: {
      mode: 'auto',
      threshold: {
        low: 50,
        medium: 100,
        high: 200,
        critical: 300,
      },
      alertEnabled: true,
      cycleTime: {
        min: 30,
        max: 120,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'int_005',
    name: 'Persimpangan Senayan',
    address: 'Jl. Asia Afrika - Jl. Sudirman, Jakarta Pusat',
    location: {
      lat: -6.2253,
      lng: 106.8019,
    },
    deviceId: 'ESP32_005',
    status: 'maintenance',
    lanes: {
      count: 4,
      directions: ['north', 'east', 'south', 'west'],
    },
    config: {
      mode: 'auto',
      threshold: {
        low: 50,
        medium: 100,
        high: 200,
        critical: 300,
      },
      alertEnabled: true,
      cycleTime: {
        min: 30,
        max: 120,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function seedIntersections() {
  try {
    console.log('🚀 Starting to seed intersections...');
    
    const container = database.container('intersections');
    
    for (const intersection of intersectionsData) {
      try {
        await container.items.create(intersection);
        console.log(`✅ Created intersection: ${intersection.name}`);
      } catch (error: any) {
        if (error.code === 409) {
          console.log(`⚠️  Intersection already exists: ${intersection.name}`);
        } else {
          console.error(`❌ Error creating intersection ${intersection.name}:`, error.message);
        }
      }
    }
    
    console.log('✨ Seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding intersections:', error);
    process.exit(1);
  }
}

seedIntersections();
