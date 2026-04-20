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

const eventsData = [
  {
    id: 'evt_001',
    intersectionId: 'int_001',
    title: 'Anomali IoT Terdeteksi',
    description: 'Sensor Jalur Selatan kehilangan paket data sementara (200ms)',
    type: 'alert',
    priority: 'low',
    status: 'resolved',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    createdBy: 'system',
  },
  {
    id: 'evt_002',
    intersectionId: 'int_001',
    title: 'Penyesuaian Fase Otomatis',
    description: 'Penambahan durasi hijau Jalur Utara (+5s) karena lonjakan volume',
    type: 'maintenance',
    priority: 'medium',
    status: 'resolved',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    createdBy: 'system',
  },
  {
    id: 'evt_003',
    intersectionId: 'int_001',
    title: 'Kendaraan Prioritas Terdeteksi',
    description: 'Deteksi Ambulans (B 1234 ABC) arah Utara, Prioritas Hijau Aktif',
    type: 'alert',
    priority: 'high',
    status: 'resolved',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
    createdBy: 'system',
  },
  {
    id: 'evt_004',
    intersectionId: 'int_002',
    title: 'Koneksi Sensor Terputus',
    description: 'Koneksi sensor Jalur Barat terputus selama 500ms',
    type: 'alert',
    priority: 'low',
    status: 'resolved',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
    createdBy: 'system',
  },
  {
    id: 'evt_005',
    intersectionId: 'int_002',
    title: 'Durasi Merah Diperpanjang',
    description: 'Durasi merah Jalur Utara diperpanjang (+8s) akibat antrian panjang',
    type: 'maintenance',
    priority: 'medium',
    status: 'resolved',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(),
    createdBy: 'system',
  },
  {
    id: 'evt_006',
    intersectionId: 'int_003',
    title: 'Manual Override Diaktifkan',
    description: 'Operator mengaktifkan mode manual karena kepadatan ekstrem',
    type: 'alert',
    priority: 'high',
    status: 'in_progress',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    createdBy: 'admin',
  },
  {
    id: 'evt_007',
    intersectionId: 'int_003',
    title: 'Pemadam Kebakaran Terdeteksi',
    description: 'Deteksi Pemadam Kebakaran (B 9876 XY) arah Selatan',
    type: 'alert',
    priority: 'high',
    status: 'resolved',
    timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 6.5 * 60 * 60 * 1000).toISOString(),
    createdBy: 'system',
  },
  {
    id: 'evt_008',
    intersectionId: 'int_004',
    title: 'Perangkat Offline',
    description: 'Semua sensor dan kontroler tidak merespons. Pemeriksaan lapangan diperlukan.',
    type: 'alert',
    priority: 'high',
    status: 'open',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    createdBy: 'system',
  },
  {
    id: 'evt_009',
    intersectionId: 'int_005',
    title: 'Maintenance Terjadwal',
    description: 'Pemeliharaan rutin sistem kontrol lampu lalu lintas',
    type: 'maintenance',
    priority: 'medium',
    status: 'in_progress',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    createdBy: 'admin',
  },
  {
    id: 'evt_010',
    intersectionId: 'int_001',
    title: 'Kemacetan Terdeteksi',
    description: 'Indeks kemacetan mencapai 85% pada Jalur Timur',
    type: 'congestion',
    priority: 'medium',
    status: 'open',
    timestamp: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString(),
    createdBy: 'system',
  },
];

async function seedEvents() {
  try {
    console.log('🚀 Starting to seed events...');
    
    const container = database.container('events');
    
    for (const event of eventsData) {
      try {
        await container.items.create(event);
        console.log(`✅ Created event: ${event.title}`);
      } catch (error: any) {
        if (error.code === 409) {
          console.log(`⚠️  Event already exists: ${event.title}`);
        } else {
          console.error(`❌ Error creating event ${event.title}:`, error.message);
        }
      }
    }
    
    console.log('✨ Events seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding events:', error);
    process.exit(1);
  }
}

seedEvents();
