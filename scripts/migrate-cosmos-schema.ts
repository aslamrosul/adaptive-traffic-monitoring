/**
 * Cosmos DB Schema Migration Script
 * Migrate existing traffic data to NEW CONCEPT with queue level system
 */

import { CosmosClient } from "@azure/cosmos";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE_ID || "TrafficDB";
const containerId = "traffic-data";

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);
const container = database.container(containerId);

interface MigrationStats {
  totalDocuments: number;
  migratedDocuments: number;
  skippedDocuments: number;
  failedDocuments: number;
  errors: Array<{ id: string; error: string }>;
}

interface OldLaneData {
  light?: string;
  vehicleCount?: number;
  irState?: string;
  // Missing: queueLevel, queueLength, greenDuration
}

interface NewLaneData {
  light: 'red' | 'yellow' | 'green';
  vehicleCount: number;
  irState: 'detected' | 'clear';
  queueLength: number;        // NEW
  queueLevel: 0 | 1 | 2;     // NEW
  greenDuration: 7 | 10 | 15; // NEW
}

/**
 * Migrate lane data to new schema
 */
function migrateLaneData(oldData: OldLaneData | undefined): NewLaneData {
  return {
    light: (oldData?.light as any) || 'red',
    vehicleCount: oldData?.vehicleCount || 0,
    irState: (oldData?.irState as any) || 'clear',
    queueLength: 25,           // Default: > 20cm (Level 0)
    queueLevel: 0,             // Default: Level 0 (short queue)
    greenDuration: 7,          // Default: 7 seconds (Level 0)
  };
}

/**
 * Check if document needs migration
 */
function needsMigration(doc: any): boolean {
  // Check if any lane is missing new fields
  const lanes = ['north', 'south', 'east', 'west'];
  
  for (const lane of lanes) {
    if (doc[lane]) {
      if (
        doc[lane].queueLevel === undefined ||
        doc[lane].queueLength === undefined ||
        doc[lane].greenDuration === undefined
      ) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Migrate single document
 */
async function migrateDocument(doc: any): Promise<boolean> {
  try {
    // Migrate each lane
    const migratedDoc = {
      ...doc,
      north: doc.north ? migrateLaneData(doc.north) : migrateLaneData(undefined),
      south: doc.south ? migrateLaneData(doc.south) : migrateLaneData(undefined),
      east: doc.east ? migrateLaneData(doc.east) : migrateLaneData(undefined),
      west: doc.west ? migrateLaneData(doc.west) : migrateLaneData(undefined),
      // Add migration metadata
      _migrated: true,
      _migratedAt: new Date().toISOString(),
      _migrationVersion: '1.0.0',
    };

    // Update document in Cosmos DB
    await container.item(doc.id, doc.id).replace(migratedDoc);
    
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to migrate document ${doc.id}:`, error.message);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrateCosmosSchema() {
  console.log("🔄 Starting Cosmos DB Schema Migration...");
  console.log(`📦 Database: ${databaseId}`);
  console.log(`📦 Container: ${containerId}`);
  console.log("\n📋 NEW CONCEPT Migration:");
  console.log("   - Adding queueLevel (0, 1, 2)");
  console.log("   - Adding queueLength (cm)");
  console.log("   - Adding greenDuration (7, 10, 15)");
  
  const stats: MigrationStats = {
    totalDocuments: 0,
    migratedDocuments: 0,
    skippedDocuments: 0,
    failedDocuments: 0,
    errors: [],
  };

  try {
    // Fetch all documents
    console.log("\n📥 Fetching all documents...");
    const { resources: documents } = await container.items
      .query("SELECT * FROM c")
      .fetchAll();

    stats.totalDocuments = documents.length;
    console.log(`✅ Found ${documents.length} documents`);

    // Migrate each document
    console.log("\n🔄 Migrating documents...");
    let progress = 0;
    
    for (const doc of documents) {
      progress++;
      
      try {
        if (needsMigration(doc)) {
          await migrateDocument(doc);
          stats.migratedDocuments++;
          console.log(`✅ [${progress}/${documents.length}] Migrated: ${doc.id}`);
        } else {
          stats.skippedDocuments++;
          console.log(`⏭️  [${progress}/${documents.length}] Skipped (already migrated): ${doc.id}`);
        }
      } catch (error: any) {
        stats.failedDocuments++;
        stats.errors.push({
          id: doc.id,
          error: error.message,
        });
        console.error(`❌ [${progress}/${documents.length}] Failed: ${doc.id}`);
      }
    }

    // Save migration report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = path.join(process.cwd(), 'exports', `migration-report-${timestamp}`);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      databaseId,
      containerId,
      stats,
    }, null, 2));

    console.log("\n✅ Migration completed!");
    console.log(`📊 Migration Report saved to: ${reportPath}`);
    
    return stats;
  } catch (error: any) {
    console.error("\n❌ Migration failed:", error.message);
    throw error;
  }
}

// Run migration
migrateCosmosSchema()
  .then((stats) => {
    console.log("\n📊 Migration Summary:");
    console.log(`   Total Documents: ${stats.totalDocuments}`);
    console.log(`   Migrated: ${stats.migratedDocuments}`);
    console.log(`   Skipped: ${stats.skippedDocuments}`);
    console.log(`   Failed: ${stats.failedDocuments}`);
    
    if (stats.errors.length > 0) {
      console.log("\n❌ Errors:");
      stats.errors.forEach((err) => {
        console.log(`   - ${err.id}: ${err.error}`);
      });
    }
    
    if (stats.failedDocuments > 0) {
      console.log("\n⚠️  Some documents failed to migrate. Check the report for details.");
      process.exit(1);
    } else {
      console.log("\n✅ All documents migrated successfully!");
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
