// Script untuk seed data awal ke Azure Cosmos DB
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE || 'TrafficDB';

const client = new CosmosClient({ endpoint, key });

// Data seed untuk intersections
const intersectionsData = [
  {
    id: 'int-001',
    name: 'Persimpangan Sudirman-Thamrin',
    location: { lat: -6.2088, lng: 106.8456 },
    lanes: ['north', 'south', 'east', 'west'],
    devices: ['lane-north', 'lane-south', 'lane-east', 'lane-west'],
    status: 'active',
    mode: 'auto',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'int-002',
    name: 'Persimpangan Gatot Subroto',
    location: { lat: -6.2297, lng: 106.8253 },
    lanes: ['north', 'south', 'east', 'west'],
    devices: ['device-005', 'device-006', 'device-007', 'device-008'],
    status: 'active',
    mode: 'auto',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'int-003',
    name: 'Persimpangan Kuningan',
    location: { lat: -6.2382, lng: 106.8305 },
    lanes: ['north', 'south', 'east'],
    devices: ['device-009', 'device-010', 'device-011'],
    status: 'active',
    mode: 'manual',
    createdAt: new Date().toISOString(),
  },
];

// Generate traffic data untuk hari ini (reduced untuk avoid timeout)
function generateTrafficData() {
  const data = [];
  const now = new Date();
  const devices = ['lane-north', 'lane-south', 'lane-east', 'lane-west'];
  const lanes = ['north', 'south', 'east', 'west'];

  // Generate data untuk 6 jam terakhir saja (untuk avoid timeout)
  const startHour = now.getHours() - 6;
  for (let hourOffset = 0; hourOffset < 6; hourOffset++) {
    const hour = (startHour + hourOffset + 24) % 24;
    for (let minute = 0; minute < 60; minute += 15) { // Every 15 minutes instead of 5
      devices.forEach((deviceId, idx) => {
        const timestamp = new Date(now);
        timestamp.setHours(hour, minute, 0, 0);

        // Simulasi pola traffic (puncak pagi dan sore)
        let baseCount = 50;
        if (hour >= 6 && hour <= 9) baseCount = 200; // Pagi
        if (hour >= 16 && hour <= 19) baseCount = 250; // Sore
        if (hour >= 0 && hour <= 5) baseCount = 20; // Malam

        const vehicleCount = Math.floor(baseCount + Math.random() * 50);
        const speed = Math.max(10, 60 - (vehicleCount / 5));
        const density = vehicleCount / 100;
        const congestionIndex = Math.min(100, (vehicleCount / 3));

        data.push({
          id: `traffic-${deviceId}-${timestamp.getTime()}`,
          deviceId,
          intersectionId: 'int-001',
          lane: lanes[idx],
          vehicleCount,
          speed: Math.round(speed * 10) / 10,
          density: Math.round(density * 100) / 100,
          congestionIndex: Math.round(congestionIndex),
          status: vehicleCount > 200 ? 'congested' : vehicleCount > 100 ? 'moderate' : 'smooth',
          timestamp: timestamp.toISOString(),
          metadata: {
            temperature: 28 + Math.random() * 5,
            humidity: 60 + Math.random() * 20,
          },
        });
      });
    }
  }

  return data;
}

// Generate analytics daily data
function generateDailyAnalytics() {
  const data = [];
  const today = new Date();

  // Generate untuk 7 hari terakhir
  for (let day = 0; day < 7; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().split('T')[0];

    // Generate hourly data
    const hourly = [];
    for (let hour = 0; hour < 24; hour++) {
      let baseCount = 50;
      if (hour >= 6 && hour <= 9) baseCount = 200;
      if (hour >= 16 && hour <= 19) baseCount = 250;
      if (hour >= 0 && hour <= 5) baseCount = 20;

      const vehicleCount = Math.floor(baseCount + Math.random() * 50);
      const speed = Math.max(10, 60 - (vehicleCount / 5));
      const congestionIndex = Math.min(100, (vehicleCount / 3));

      hourly.push({
        hour,
        vehicleCount,
        averageSpeed: Math.round(speed * 10) / 10,
        congestionLevel: congestionIndex > 70 ? 'high' : congestionIndex > 40 ? 'medium' : 'low',
        congestionIndex: Math.round(congestionIndex),
      });
    }

    const totalVehicles = hourly.reduce((sum, h) => sum + h.vehicleCount, 0);
    const avgSpeed = hourly.reduce((sum, h) => sum + h.averageSpeed, 0) / hourly.length;
    const avgCongestion = hourly.reduce((sum, h) => sum + h.congestionIndex, 0) / hourly.length;
    const peakHourData = hourly.reduce((max, h) => h.vehicleCount > max.vehicleCount ? h : max);

    data.push({
      id: `analytics-int-001-${dateStr}`,
      intersectionId: 'int-001',
      date: dateStr,
      summary: {
        totalVehicles,
        averageSpeed: Math.round(avgSpeed * 10) / 10,
        averageCongestionIndex: Math.round(avgCongestion * 10) / 10,
        averageWaitTime: Math.round((100 - avgSpeed) / 2),
        peakHour: `${peakHourData.hour}:00`,
        peakVehicleCount: peakHourData.vehicleCount,
      },
      hourly,
      efficiency: {
        autoModeTime: 18 + Math.random() * 4,
        manualModeTime: 2 + Math.random() * 2,
        autoModeEfficiency: 85 + Math.random() * 10,
        manualModeEfficiency: 60 + Math.random() * 15,
      },
      events: {
        total: Math.floor(Math.random() * 10),
        bySeverity: {
          low: Math.floor(Math.random() * 5),
          medium: Math.floor(Math.random() * 3),
          high: Math.floor(Math.random() * 2),
          critical: Math.floor(Math.random() * 1),
        },
        byType: {
          congestion: Math.floor(Math.random() * 5),
          accident: Math.floor(Math.random() * 2),
          sensor_error: Math.floor(Math.random() * 2),
          other: Math.floor(Math.random() * 1),
        },
      },
    });
  }

  return data;
}

// Generate events data
function generateEvents() {
  const events = [];
  const now = new Date();
  const types = ['congestion', 'accident', 'sensor_error', 'maintenance'];
  const priorities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['open', 'in_progress', 'resolved'];

  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const type = types[Math.floor(Math.random() * types.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    events.push({
      id: `event-${timestamp.getTime()}-${i}`,
      intersectionId: 'int-001',
      type,
      priority,
      status,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} terdeteksi`,
      description: `Event ${type} dengan prioritas ${priority}`,
      timestamp: timestamp.toISOString(),
      resolvedAt: status === 'resolved' ? new Date(timestamp.getTime() + 3600000).toISOString() : null,
      metadata: {
        lane: ['north', 'south', 'east', 'west'][Math.floor(Math.random() * 4)],
        severity: priority,
      },
    });
  }

  return events;
}

async function seedDatabase() {
  try {
    console.log('🚀 Memulai seeding data ke Azure Cosmos DB...\n');

    const database = client.database(databaseId);

    // 1. Seed Intersections
    console.log('📍 Seeding intersections...');
    const intersectionsContainer = database.container('intersections');
    for (const intersection of intersectionsData) {
      await intersectionsContainer.items.upsert(intersection);
      console.log(`  ✓ ${intersection.name}`);
    }

    // 2. Seed Traffic Data
    console.log('\n🚗 Seeding traffic data (ini mungkin memakan waktu)...');
    const trafficContainer = database.container('traffic_data');
    const trafficData = generateTrafficData();
    console.log(`  Generating ${trafficData.length} traffic records...`);
    
    // Batch insert untuk performa lebih baik
    const batchSize = 50; // Reduced batch size
    for (let i = 0; i < trafficData.length; i += batchSize) {
      const batch = trafficData.slice(i, i + batchSize);
      await Promise.all(batch.map(item => trafficContainer.items.upsert(item)));
      const progress = Math.min(i + batchSize, trafficData.length);
      console.log(`  ✓ Inserted ${progress}/${trafficData.length} (${Math.round(progress/trafficData.length*100)}%)`);
    }

    // 3. Seed Analytics Daily
    console.log('\n📊 Seeding daily analytics...');
    const analyticsContainer = database.container('analytics_daily');
    const analyticsData = generateDailyAnalytics();
    for (const analytics of analyticsData) {
      await analyticsContainer.items.upsert(analytics);
      console.log(`  ✓ ${analytics.date}`);
    }

    // 4. Seed Events
    console.log('\n⚠️  Seeding events...');
    const eventsContainer = database.container('events');
    const eventsData = generateEvents();
    for (const event of eventsData) {
      await eventsContainer.items.upsert(event);
      console.log(`  ✓ ${event.title} (${event.priority})`);
    }

    console.log('\n✅ Seeding selesai! Database siap digunakan.\n');
  } catch (error: any) {
    console.error('❌ Error seeding database:', error.message);
    if (error.code === 401) {
      console.error('\n⚠️  AZURE_COSMOS_KEY tidak valid atau expired!');
      console.error('   Silakan periksa key di Azure Portal dan update .env.local\n');
    }
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
