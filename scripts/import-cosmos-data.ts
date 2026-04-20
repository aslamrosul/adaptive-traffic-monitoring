// Script untuk import data dari JSON files ke Azure Cosmos DB
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

async function importData(importPath: string) {
  console.log('📥 Importing data to Azure Cosmos DB...\n');

  if (!fs.existsSync(importPath)) {
    console.error(`❌ Import path not found: ${importPath}`);
    process.exit(1);
  }

  try {
    const files = fs.readdirSync(importPath).filter(f => f.endsWith('.json') && !f.startsWith('_'));

    for (const file of files) {
      const containerName = file.replace('.json', '');
      console.log(`📁 Importing to ${containerName}...`);

      try {
        const container = database.container(containerName);
        const filePath = path.join(importPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        if (!Array.isArray(data)) {
          console.log(`   ⚠️  ${file} is not an array, skipping...`);
          continue;
        }

        let imported = 0;
        let skipped = 0;

        for (const item of data) {
          try {
            await container.items.upsert(item);
            imported++;
          } catch (error: any) {
            console.error(`   ⚠️  Failed to import item ${item.id}:`, error.message);
            skipped++;
          }
        }

        console.log(`   ✅ Imported ${imported} items (${skipped} skipped)`);
      } catch (error: any) {
        if (error.code === 404) {
          console.log(`   ⚠️  Container ${containerName} not found, skipping...`);
        } else {
          console.error(`   ❌ Error importing ${containerName}:`, error.message);
        }
      }
    }

    console.log(`\n✨ Import completed!\n`);
  } catch (error) {
    console.error('❌ Error importing data:', error);
    throw error;
  }
}

// Get import path from command line argument
const importPath = process.argv[2];

if (!importPath) {
  console.error('❌ Usage: npx tsx scripts/import-cosmos-data.ts <path-to-export-folder>');
  console.log('\nExample:');
  console.log('  npx tsx scripts/import-cosmos-data.ts exports/cosmos-backup-2024-01-25');
  process.exit(1);
}

importData(importPath)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
