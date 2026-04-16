// Script untuk mengisi data awal (seed data) ke Cosmos DB
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE || 'TrafficDB';

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);

async function seedData() {
  console.log('🌱 Seeding data to Azure Cosmos DB...\n');

  try {
    // 1. Seed Users
    console.log('👥 Seeding users...');
    const usersContainer = database.container('users');
    
    const users = [
      {
        id: 'user_admin_001',
        email: 'admin@traffic.com',
        name: 'Admin Utama',
        role: 'admin',
        phone: '+62812345678',
        photoURL: '',
        location: 'Jakarta',
        status: 'active',
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user_operator_001',
        email: 'operator1@traffic.com',
        name: 'Operator Lalu Lintas 1',
        role: 'operator',
        phone: '+62812345679',
        photoURL: '',
        location: 'Jakarta Pusat',
        status: 'active',
        reportsCreated: 5,
        reportsCompleted: 3,
        activeHours: 120,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user_operator_002',
        email: 'operator2@traffic.com',
        name: 'Operator Lalu Lintas 2',
        role: 'operator',
        phone: '+62812345680',
        photoURL: '',
        location: 'Jakarta Selatan',
        status: 'active',
        reportsCreated: 8,
        reportsCompleted: 6,
        activeHours: 150,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const user of users) {
      await usersContainer.items.upsert(user);
      console.log(`  ✅ Created user: ${user.name}`);
    }

    // 2. Seed Intersections
    console.log('\n🚦 Seeding intersections...');
    const intersectionsContainer = database.container('intersections');
    
    const intersections = [
      {
        id: 'int_001',
        name: 'Simpang Tugu Tani',
        address: 'Jl. Medan Merdeka Barat, Jakarta Pusat',
        location: { lat: -6.1754, lng: 106.8272 },
        deviceId: 'lane-north',
        status: 'active',
        lanes: {
          count: 4,
          directions: ['north', 'east', 'south', 'west'],
        },
        config: {
          mode: 'auto',
          threshold: { low: 50, medium: 100, high: 200, critical: 300 },
          alertEnabled: true,
          cycleTime: { min: 30, max: 120 },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'int_002',
        name: 'Simpang Bundaran HI',
        address: 'Jl. MH Thamrin, Jakarta Pusat',
        location: { lat: -6.1944, lng: 106.8229 },
        deviceId: 'lane-south',
        status: 'active',
        lanes: {
          count: 6,
          directions: ['north', 'northeast', 'east', 'south', 'west', 'northwest'],
        },
        config: {
          mode: 'auto',
          threshold: { low: 80, medium: 150, high: 250, critical: 400 },
          alertEnabled: true,
          cycleTime: { min: 40, max: 150 },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'int_003',
        name: 'Simpang Semanggi',
        address: 'Jl. Gatot Subroto, Jakarta Selatan',
        location: { lat: -6.2253, lng: 106.8066 },
        deviceId: 'lane-east',
        status: 'active',
        lanes: {
          count: 4,
          directions: ['north', 'east', 'south', 'west'],
        },
        config: {
          mode: 'auto',
          threshold: { low: 60, medium: 120, high: 220, critical: 350 },
          alertEnabled: true,
          cycleTime: { min: 35, max: 130 },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'int_004',
        name: 'Simpang Kuningan',
        address: 'Jl. HR Rasuna Said, Jakarta Selatan',
        location: { lat: -6.2297, lng: 106.8308 },
        deviceId: 'lane-west',
        status: 'maintenance',
        lanes: {
          count: 4,
          directions: ['north', 'east', 'south', 'west'],
        },
        config: {
          mode: 'manual',
          threshold: { low: 50, medium: 100, high: 200, critical: 300 },
          alertEnabled: false,
          cycleTime: { min: 30, max: 120 },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const intersection of intersections) {
      await intersectionsContainer.items.upsert(intersection);
      console.log(`  ✅ Created intersection: ${intersection.name}`);
    }

    // 3. Seed Reports
    console.log('\n📋 Seeding reports...');
    const reportsContainer = database.container('reports');
    
    const reports = [
      {
        id: 'rpt_001',
        intersectionId: 'int_001',
        type: 'congestion',
        priority: 'high',
        status: 'in_progress',
        title: 'Kemacetan Parah di Jam Pulang Kerja',
        description: 'Terjadi kemacetan parah setiap hari pada jam 17:00-19:00',
        reportedBy: {
          userId: 'user_operator_001',
          userName: 'Operator Lalu Lintas 1',
          userEmail: 'operator1@traffic.com',
          userRole: 'operator',
        },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'rpt_002',
        intersectionId: 'int_002',
        type: 'accident',
        priority: 'critical',
        status: 'resolved',
        title: 'Kecelakaan Kendaraan',
        description: 'Kecelakaan ringan antara 2 mobil, sudah ditangani',
        reportedBy: {
          userId: 'user_operator_002',
          userName: 'Operator Lalu Lintas 2',
          userEmail: 'operator2@traffic.com',
          userRole: 'operator',
        },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'rpt_003',
        intersectionId: 'int_004',
        type: 'maintenance',
        priority: 'medium',
        status: 'submitted',
        title: 'Lampu Lalu Lintas Rusak',
        description: 'Lampu arah barat tidak menyala dengan baik',
        reportedBy: {
          userId: 'user_operator_001',
          userName: 'Operator Lalu Lintas 1',
          userEmail: 'operator1@traffic.com',
          userRole: 'operator',
        },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const report of reports) {
      await reportsContainer.items.upsert(report);
      console.log(`  ✅ Created report: ${report.title}`);
    }

    // 4. Seed Notifications
    console.log('\n🔔 Seeding notifications...');
    const notificationsContainer = database.container('notifications');
    
    const notifications = [
      {
        id: 'notif_001',
        userId: 'user_admin_001',
        type: 'alert',
        title: 'Kemacetan Tinggi Terdeteksi',
        message: 'Simpang Tugu Tani mengalami kemacetan tinggi',
        read: false,
        priority: 'high',
        relatedId: 'int_001',
        relatedType: 'intersection',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif_002',
        userId: 'user_operator_001',
        type: 'report',
        title: 'Laporan Baru Diterima',
        message: 'Laporan kecelakaan di Bundaran HI',
        read: true,
        priority: 'medium',
        relatedId: 'rpt_002',
        relatedType: 'report',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const notification of notifications) {
      await notificationsContainer.items.upsert(notification);
      console.log(`  ✅ Created notification: ${notification.title}`);
    }

    console.log('\n✨ Data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Intersections: ${intersections.length}`);
    console.log(`  - Reports: ${reports.length}`);
    console.log(`  - Notifications: ${notifications.length}`);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

seedData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
