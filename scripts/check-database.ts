// Script untuk cek collections dan mapping strukturnya
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE || 'TrafficDB';

const client = new CosmosClient({ endpoint, key });

// Definisi struktur collections
const collectionStructures = {
  users: {
    partitionKey: '/email',
    description: 'Data pengguna (admin, operator)',
    sampleStructure: {
      id: 'user_001',
      email: 'user@example.com',
      name: 'User Name',
      role: 'admin | operator',
      phone: '+62812345678',
      photoURL: 'https://...',
      location: 'Jakarta',
      status: 'active | inactive',
      reportsCreated: 0,
      reportsCompleted: 0,
      activeHours: 0,
      settings: {
        general: {
          autoMode: true,
          language: 'id',
          timezone: 'WIB',
        },
        notifications: {
          email: true,
          push: true,
          priorities: {
            extreme: true,
            iotAnomaly: true,
            maintenance: false,
          },
        },
        iot: {
          sensorInterval: 5,
          algorithm: 'adaptive-flow-v2.4',
        },
        security: {
          twoFactorEnabled: true,
          activeSessions: [],
        },
        advanced: {
          debugMode: 'disabled',
          apiRateLimit: 100,
        },
      },
      createdAt: '2024-01-25T10:00:00Z',
      updatedAt: '2024-01-25T10:00:00Z',
    },
  },
  intersections: {
    partitionKey: '/deviceId',
    description: 'Data persimpangan lalu lintas',
    sampleStructure: {
      id: 'int_001',
      name: 'Simpang Tugu Tani',
      address: 'Jl. Medan Merdeka Barat, Jakarta Pusat',
      location: {
        lat: -6.1754,
        lng: 106.8272,
      },
      deviceId: 'lane-north',
      status: 'active | maintenance | offline',
      lanes: {
        count: 4,
        directions: ['north', 'east', 'south', 'west'],
      },
      config: {
        mode: 'auto | manual',
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
      createdAt: '2024-01-25T10:00:00Z',
      updatedAt: '2024-01-25T10:00:00Z',
    },
  },
  traffic_data: {
    partitionKey: '/intersectionId',
    description: 'Data lalu lintas real-time dari sensor',
    sampleStructure: {
      id: 'traffic_001',
      intersectionId: 'int_001',
      deviceId: 'lane-north',
      timestamp: '2024-01-25T10:00:00Z',
      vehicleCount: 45,
      density: 75,
      avgSpeed: 25,
      waitTime: 60,
      queueLength: 12,
      laneData: [
        {
          direction: 'north',
          count: 12,
          density: 80,
        },
        {
          direction: 'south',
          count: 15,
          density: 70,
        },
      ],
    },
  },
  events: {
    partitionKey: '/intersectionId',
    description: 'Event log sistem (manual override, alerts, dll)',
    sampleStructure: {
      id: 'event_001',
      intersectionId: 'int_001',
      type: 'manual_override | alert | system | maintenance',
      severity: 'info | warning | error | critical',
      title: 'Manual Override Activated',
      description: 'Operator mengaktifkan manual override',
      userId: 'user_001',
      userName: 'Operator Name',
      timestamp: '2024-01-25T10:00:00Z',
      metadata: {
        previousMode: 'auto',
        newMode: 'manual',
      },
    },
  },
  reports: {
    partitionKey: '/intersectionId',
    description: 'Laporan dari operator',
    sampleStructure: {
      id: 'rpt_001',
      intersectionId: 'int_001',
      type: 'congestion | accident | maintenance | other',
      priority: 'low | medium | high | critical',
      status: 'submitted | in_progress | resolved | closed',
      title: 'Kemacetan Parah',
      description: 'Terjadi kemacetan parah pada jam sibuk',
      reportedBy: {
        userId: 'user_001',
        userName: 'Operator Name',
        userEmail: 'operator@example.com',
        userRole: 'operator',
      },
      attachments: [],
      comments: [],
      createdAt: '2024-01-25T10:00:00Z',
      updatedAt: '2024-01-25T10:00:00Z',
      resolvedAt: null,
    },
  },
  notifications: {
    partitionKey: '/userId',
    description: 'Notifikasi untuk user',
    sampleStructure: {
      id: 'notif_001',
      userId: 'user_001',
      type: 'alert | report | system | info',
      title: 'Kemacetan Tinggi Terdeteksi',
      message: 'Simpang Tugu Tani mengalami kemacetan tinggi',
      read: false,
      priority: 'low | medium | high | critical',
      relatedId: 'int_001',
      relatedType: 'intersection | report | event',
      actionUrl: '/persimpangan/int_001',
      createdAt: '2024-01-25T10:00:00Z',
    },
  },
  device_status: {
    partitionKey: '/deviceId',
    description: 'Status perangkat IoT',
    sampleStructure: {
      id: 'device_001',
      deviceId: 'lane-north',
      intersectionId: 'int_001',
      status: 'online | offline | error',
      lastHeartbeat: '2024-01-25T10:00:00Z',
      firmware: '1.2.3',
      battery: 95,
      signalStrength: -45,
      sensors: {
        ultrasonic: 'ok',
        camera: 'ok',
        temperature: 28.5,
      },
      errors: [],
      uptime: 86400,
    },
  },
  analytics_daily: {
    partitionKey: '/intersectionId',
    description: 'Analitik harian agregat',
    sampleStructure: {
      id: 'analytics_001',
      intersectionId: 'int_001',
      date: '2024-01-25',
      totalVehicles: 12500,
      avgDensity: 65,
      avgWaitTime: 45,
      peakHours: [
        {
          hour: 7,
          vehicles: 850,
          density: 85,
        },
        {
          hour: 17,
          vehicles: 920,
          density: 90,
        },
      ],
      incidents: 3,
      manualOverrides: 2,
      alerts: 5,
      uptime: 99.5,
    },
  },
};

async function checkDatabase() {
  console.log('🔍 Checking Azure Cosmos DB Structure\n');
  console.log('='.repeat(80));
  console.log(`Database: ${databaseId}`);
  console.log(`Endpoint: ${endpoint}`);
  console.log('='.repeat(80));
  console.log();

  try {
    const database = client.database(databaseId);

    // Check if database exists
    try {
      await database.read();
      console.log('✅ Database exists\n');
    } catch (error: any) {
      if (error.code === 404) {
        console.log('❌ Database not found!');
        console.log('💡 Run: npm run db:setup to create database\n');
        return;
      }
      throw error;
    }

    // Get all containers
    const { resources: containers } = await database.containers.readAll().fetchAll();
    
    console.log(`📦 Found ${containers.length} collections:\n`);

    const report: any = {
      database: databaseId,
      totalCollections: containers.length,
      collections: [],
      missingCollections: [],
      timestamp: new Date().toISOString(),
    };

    // Check each expected collection
    for (const [collectionName, structure] of Object.entries(collectionStructures)) {
      const exists = containers.some((c) => c.id === collectionName);
      
      if (exists) {
        const container = database.container(collectionName);
        
        // Get item count
        let itemCount = 0;
        try {
          const { resources } = await container.items
            .query('SELECT VALUE COUNT(1) FROM c')
            .fetchAll();
          itemCount = resources[0] || 0;
        } catch (error) {
          itemCount = 0;
        }

        console.log(`✅ ${collectionName}`);
        console.log(`   Partition Key: ${structure.partitionKey}`);
        console.log(`   Description: ${structure.description}`);
        console.log(`   Items: ${itemCount}`);
        console.log();

        report.collections.push({
          name: collectionName,
          exists: true,
          partitionKey: structure.partitionKey,
          description: structure.description,
          itemCount: itemCount,
          structure: structure.sampleStructure,
        });
      } else {
        console.log(`❌ ${collectionName} - NOT FOUND`);
        console.log(`   Partition Key: ${structure.partitionKey}`);
        console.log(`   Description: ${structure.description}`);
        console.log();

        report.missingCollections.push(collectionName);
        report.collections.push({
          name: collectionName,
          exists: false,
          partitionKey: structure.partitionKey,
          description: structure.description,
          itemCount: 0,
          structure: structure.sampleStructure,
        });
      }
    }

    // Save report to file
    const reportDir = path.join(process.cwd(), 'database-structure');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, 'database-structure.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Save markdown version
    const mdPath = path.join(reportDir, 'DATABASE_STRUCTURE.md');
    let markdown = `# Database Structure Report\n\n`;
    markdown += `**Database:** ${databaseId}\n`;
    markdown += `**Generated:** ${new Date().toLocaleString('id-ID')}\n`;
    markdown += `**Total Collections:** ${report.totalCollections}\n\n`;
    markdown += `---\n\n`;

    for (const col of report.collections) {
      markdown += `## ${col.name}\n\n`;
      markdown += `- **Status:** ${col.exists ? '✅ Exists' : '❌ Not Found'}\n`;
      markdown += `- **Partition Key:** \`${col.partitionKey}\`\n`;
      markdown += `- **Description:** ${col.description}\n`;
      markdown += `- **Items:** ${col.itemCount}\n\n`;
      markdown += `### Sample Structure\n\n`;
      markdown += '```json\n';
      markdown += JSON.stringify(col.structure, null, 2);
      markdown += '\n```\n\n';
      markdown += `---\n\n`;
    }

    fs.writeFileSync(mdPath, markdown);

    console.log('='.repeat(80));
    console.log('📊 Summary:');
    console.log(`   Total Collections: ${report.totalCollections}`);
    console.log(`   Existing: ${report.collections.filter((c: any) => c.exists).length}`);
    console.log(`   Missing: ${report.missingCollections.length}`);
    
    if (report.missingCollections.length > 0) {
      console.log(`\n❌ Missing Collections: ${report.missingCollections.join(', ')}`);
      console.log('💡 Run: npm run db:setup to create missing collections');
    }

    console.log(`\n📁 Report saved to:`);
    console.log(`   - ${reportPath}`);
    console.log(`   - ${mdPath}`);
    console.log('\n✨ Done!\n');

  } catch (error: any) {
    console.error('❌ Error checking database:', error.message);
    throw error;
  }
}

checkDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
