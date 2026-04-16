// Script untuk cleanup duplicate collections dan standardisasi naming
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE || 'TrafficDB';

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);

// Standard collection names (lowercase with underscore)
const standardCollections = [
  'users',
  'intersections',
  'traffic_data',
  'events',
  'reports',
  'notifications',
  'device_status',
  'analytics_daily',
];

async function cleanupCollections() {
  console.log('🧹 Cleaning up duplicate collections...\n');

  try {
    // Get all existing containers
    const { resources: containers } = await database.containers.readAll().fetchAll();
    
    console.log(`📦 Found ${containers.length} collections:\n`);
    containers.forEach(c => console.log(`   - ${c.id}`));
    console.log();

    // Find duplicates and non-standard names
    const toDelete: string[] = [];
    const duplicates = new Map<string, string[]>();

    for (const container of containers) {
      const lowerName = container.id.toLowerCase();
      
      if (!duplicates.has(lowerName)) {
        duplicates.set(lowerName, []);
      }
      duplicates.get(lowerName)!.push(container.id);
    }

    // Identify collections to delete
    for (const [lowerName, names] of duplicates.entries()) {
      if (names.length > 1) {
        console.log(`⚠️  Found duplicates for "${lowerName}":`);
        names.forEach(n => console.log(`   - ${n}`));
        
        // Keep the standard name, delete others
        const standardName = standardCollections.find(s => s.toLowerCase() === lowerName);
        if (standardName) {
          const toKeep = names.find(n => n === standardName) || names[0];
          const toRemove = names.filter(n => n !== toKeep);
          
          console.log(`   ✅ Keeping: ${toKeep}`);
          console.log(`   ❌ Will delete: ${toRemove.join(', ')}`);
          toDelete.push(...toRemove);
        }
        console.log();
      }
    }

    // Also check for non-standard names
    for (const container of containers) {
      if (!standardCollections.includes(container.id) && !toDelete.includes(container.id)) {
        const lowerName = container.id.toLowerCase();
        const hasStandardVersion = standardCollections.some(s => s.toLowerCase() === lowerName);
        
        if (hasStandardVersion) {
          console.log(`⚠️  Non-standard name: ${container.id}`);
          console.log(`   Should be: ${standardCollections.find(s => s.toLowerCase() === lowerName)}`);
          toDelete.push(container.id);
          console.log();
        }
      }
    }

    if (toDelete.length === 0) {
      console.log('✅ No duplicates or non-standard collections found!\n');
      return;
    }

    console.log('='.repeat(80));
    console.log(`📋 Summary: ${toDelete.length} collections will be deleted:`);
    toDelete.forEach(name => console.log(`   - ${name}`));
    console.log('='.repeat(80));
    console.log();

    // Ask for confirmation
    console.log('⚠️  WARNING: This will permanently delete the collections listed above!');
    console.log('💡 Make sure you have backed up important data first.');
    console.log();
    console.log('To proceed, run this script with --confirm flag:');
    console.log('   npx tsx scripts/cleanup-collections.ts --confirm');
    console.log();

    // Check for --confirm flag
    const confirmed = process.argv.includes('--confirm');
    
    if (!confirmed) {
      console.log('❌ Cleanup cancelled (no --confirm flag)');
      return;
    }

    // Delete collections
    console.log('🗑️  Deleting collections...\n');
    
    for (const name of toDelete) {
      try {
        console.log(`   Deleting: ${name}...`);
        await database.container(name).delete();
        console.log(`   ✅ Deleted: ${name}`);
      } catch (error: any) {
        console.error(`   ❌ Failed to delete ${name}:`, error.message);
      }
    }

    console.log('\n✨ Cleanup completed!\n');
    
    // Show remaining collections
    const { resources: remaining } = await database.containers.readAll().fetchAll();
    console.log(`📦 Remaining collections (${remaining.length}):`);
    remaining.forEach(c => console.log(`   - ${c.id}`));
    console.log();

    // Check if all standard collections exist
    const missingCollections = standardCollections.filter(
      s => !remaining.some(c => c.id === s)
    );

    if (missingCollections.length > 0) {
      console.log('⚠️  Missing standard collections:');
      missingCollections.forEach(name => console.log(`   - ${name}`));
      console.log('\n💡 Run: npm run db:setup to create missing collections\n');
    } else {
      console.log('✅ All standard collections exist!\n');
    }

  } catch (error: any) {
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  }
}

cleanupCollections()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
