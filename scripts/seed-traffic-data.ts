import { CosmosClient } from '@azure/cosmos';
import { loadEnv } from './load-env';

// Load environment variables
loadEnv();

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE || 'TrafficDB';

if (!endpoint || !key) {
  console.error('❌ Error: Azure Cosmos DB credentials not found in environment variables');
  process.exit(1);
}

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);

const intersectionIds = ['int_001', 'int_002', 'int_003'];
const directions = ['north', 'east', 'south', 'west'];
const deviceIds = ['ESP32_001', 'ESP32_002', 'ESP32_003'];

function generateTrafficData(intersectionId: string, deviceId: string) {
  const data = [];
  const now = new Date();
  
  // Generate data for last 24 hours
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    
    for (const direction of directions) {
      const vehicleCount = Math.floor(Math.random() * 500) + 100;
      const speed = Math.floor(Math.random() * 40) + 20;
      const density = vehicleCount / 10;
      const congestionIndex = Math.min(100, (vehicleCount / 5) + (60 - speed));
      
      data.push({
        id: `${intersectionId}_${direction}_${timestamp.getTime()}`,
        intersectionId,
        deviceId: `${deviceId}_${direction}`,
        timestamp: timestamp.toISOString(),
        vehicleCount,
        speed,
        density,
        congestionIndex,
        direction,
        laneId: `lane_${direction}`,
      });
    }
  }
  
  return data;
}

async function seedTrafficData() {
  try {
    console.log('🚀 Starting to seed traffic data...');
    
    const container = database.container('traffic_data');
    
    for (let i = 0; i < intersectionIds.length; i++) {
      const intersectionId = intersectionIds[i];
      const deviceId = deviceIds[i];
      const trafficData = generateTrafficData(intersectionId, deviceId);
      
      console.log(`📊 Seeding ${trafficData.length} records for ${intersectionId}...`);
      
      for (const data of trafficData) {
        try {
          await container.items.create(data);
        } catch (error: any) {
          if (error.code !== 409) {
            console.error(`❌ Error creating traffic data:`, error.message);
          }
        }
      }
      
      console.log(`✅ Completed seeding for ${intersectionId}`);
    }
    
    console.log('✨ Traffic data seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding traffic data:', error);
    process.exit(1);
  }
}

seedTrafficData();
