// Script untuk export data dari Azure Cosmos DB ke JSON files
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE || 'TrafficDB';

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);

async function exportData() {
  console.log('📦 Exporting data from Azure Cosmos DB...\n');

  const exportDir = path.join(process.cwd(), 'exports');
  
  // Create exports directory if not exists
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const exportPath = path.join(exportDir, `cosmos-backup-${timestamp}`);
  
  if (!fs.existsSync(exportPath)) {
    fs.mkdirSync(exportPath, { recursive: true });
  }

  try {
    const containers = [
      'users',
      'intersections',
      'traffic_data',
      'events',
      'reports',
      'notifications',
      'device_status',
      'analytics_daily',
    ];

    for (const containerName of containers) {
      console.log(`📁 Exporting ${containerName}...`);
      
      try {
        const container = database.container(containerName);
        const { resources } = await container.items
          .query('SELECT * FROM c')
          .fetchAll();

        const filePath = path.join(exportPath, `${containerName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(resources, null, 2));
        
        console.log(`   ✅ Exported ${resources.length} items to ${containerName}.json`);
      } catch (error: any) {
        if (error.code === 404) {
          console.log(`   ⚠️  Container ${containerName} not found, skipping...`);
        } else {
          console.error(`   ❌ Error exporting ${containerName}:`, error.message);
        }
      }
    }

    console.log(`\n✨ Export completed!`);
    console.log(`📂 Files saved to: ${exportPath}\n`);
    
    // Create summary
    const summary = {
      exportDate: new Date().toISOString(),
      database: databaseId,
      containers: containers,
      exportPath: exportPath,
    };
    
    fs.writeFileSync(
      path.join(exportPath, '_summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('💡 Tip: You can use these files to restore data or migrate to another database');
  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  }
}

exportData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
