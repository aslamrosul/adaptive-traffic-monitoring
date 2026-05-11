/**
 * Cosmos DB Backup Script
 * Backup all traffic data before migration to NEW CONCEPT
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

interface BackupSummary {
  timestamp: string;
  totalDocuments: number;
  backupPath: string;
  databaseId: string;
  containerId: string;
  success: boolean;
  errors: string[];
}

async function backupCosmosData() {
  console.log("🔄 Starting Cosmos DB Backup...");
  console.log(`📦 Database: ${databaseId}`);
  console.log(`📦 Container: ${containerId}`);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'exports', `cosmos-backup-${timestamp}`);
  
  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const summary: BackupSummary = {
    timestamp: new Date().toISOString(),
    totalDocuments: 0,
    backupPath: backupDir,
    databaseId,
    containerId,
    success: false,
    errors: [],
  };

  try {
    // Query all documents
    console.log("\n📥 Fetching all documents...");
    const { resources: documents } = await container.items
      .query("SELECT * FROM c")
      .fetchAll();

    summary.totalDocuments = documents.length;
    console.log(`✅ Found ${documents.length} documents`);

    // Save documents to JSON file
    const dataFilePath = path.join(backupDir, 'traffic-data.json');
    fs.writeFileSync(dataFilePath, JSON.stringify(documents, null, 2));
    console.log(`💾 Saved to: ${dataFilePath}`);

    // Save summary
    summary.success = true;
    const summaryFilePath = path.join(backupDir, 'backup-summary.json');
    fs.writeFileSync(summaryFilePath, JSON.stringify(summary, null, 2));
    console.log(`📋 Summary saved to: ${summaryFilePath}`);

    // Create README
    const readmePath = path.join(backupDir, 'README.md');
    const readmeContent = `# Cosmos DB Backup

**Timestamp**: ${summary.timestamp}
**Database**: ${databaseId}
**Container**: ${containerId}
**Total Documents**: ${summary.totalDocuments}

## Files

- \`traffic-data.json\` - All traffic data documents
- \`backup-summary.json\` - Backup metadata
- \`README.md\` - This file

## Restore Instructions

To restore this backup:

\`\`\`bash
npm run restore-cosmos -- --backup-dir="${backupDir}"
\`\`\`

## Migration Context

This backup was created before migrating to NEW CONCEPT:
- Adding queueLevel (0, 1, 2)
- Adding queueLength (cm)
- Adding greenDuration (7, 10, 15)

See: 00-KONSEP-BARU.md for details.
`;
    fs.writeFileSync(readmePath, readmeContent);

    console.log("\n✅ Backup completed successfully!");
    console.log(`📁 Backup location: ${backupDir}`);
    
    return summary;
  } catch (error: any) {
    console.error("\n❌ Backup failed:", error.message);
    summary.success = false;
    summary.errors.push(error.message);
    
    // Save error summary
    const summaryFilePath = path.join(backupDir, 'backup-summary.json');
    fs.writeFileSync(summaryFilePath, JSON.stringify(summary, null, 2));
    
    throw error;
  }
}

// Run backup
backupCosmosData()
  .then((summary) => {
    console.log("\n📊 Backup Summary:");
    console.log(`   Total Documents: ${summary.totalDocuments}`);
    console.log(`   Backup Path: ${summary.backupPath}`);
    console.log(`   Success: ${summary.success}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
