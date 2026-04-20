/**
 * Script untuk seed analytics data ke Azure Cosmos DB
 * 
 * Usage:
 *   npx tsx scripts/seed-analytics-data.ts
 */

import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE || 'TrafficDB';

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);

// Helper function untuk generate random number dalam range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function untuk generate random float
function randomFloat(min: number, max: number, decimals: number = 1): number {
  const value = Math.random() * (max - min) + min;
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Generate hourly data untuk satu hari
function generateHourlyData() {
  const hourly = [];
  
  // Pattern: rendah di malam, tinggi di pagi & sore
  const patterns = [
    { hour: 0, base: 50, variance: 20 },
    { hour: 1, base: 30, variance: 15 },
    { hour: 2, base: 25, variance: 10 },
    { hour: 3, base: 20, variance: 10 },
    { hour: 4, base: 30, variance: 15 },
    { hour: 5, base: 80, variance: 30 },
    { hour: 6, base: 200, variance: 50 },
    { hour: 7, base: 350, variance: 80 },
    { hour: 8, base: 450, variance: 100 },
    { hour: 9, base: 380, variance: 80 },
    { hour: 10, base: 320, variance: 60 },
    { hour: 11, base: 300, variance: 50 },
    { hour: 12, base: 280, variance: 50 },
    { hour: 13, base: 260, variance: 40 },
    { hour: 14, base: 250, variance: 40 },
    { hour: 15, base: 280, variance: 50 },
    { hour: 16, base: 380, variance: 80 },
    { hour: 17, base: 480, variance: 100 },
    { hour: 18, base: 420, variance: 90 },
    { hour: 19, base: 320, variance: 60 },
    { hour: 20, base: 200, variance: 50 },
    { hour: 21, base: 150, variance: 40 },
    { hour: 22, base: 100, variance: 30 },
    { hour: 23, base: 60, variance: 20 },
  ];

  for (const pattern of patterns) {
    const vehicleCount = randomInt(
      pattern.base - pattern.variance,
      pattern.base + pattern.variance
    );
    
    const speed = vehicleCount > 300 ? randomInt(15, 35) : randomInt(35, 60);
    const density = Math.round((vehicleCount / 500) * 100);
    const congestionIndex = Math.min(100, Math.round((vehicleCount / 5) + (100 - speed)));
    
    let congestionLevel: 'low' | 'medium' | 'high' | 'critical';
    if (congestionIndex < 30) congestionLevel = 'low';
    else if (congestionIndex < 60) congestionLevel = 'medium';
    else if (congestionIndex < 85) congestionLevel = 'high';
    else congestionLevel = 'critical';

    hourly.push({
      hour: pattern.hour,
      vehicleCount,
      averageSpeed: speed,
      congestionLevel,
      congestionIndex,
    });
  }

  return hourly;
}

// Generate analytics data untuk satu hari
function generateDailyAnalytics(intersectionId: string, date: string) {
  const hourly = generateHourlyData();
  
  // Calculate summary
  const totalVehicles = hourly.reduce((sum, h) => sum + h.vehicleCount, 0);
  const averageSpeed = Math.round(
    hourly.reduce((sum, h) => sum + h.averageSpeed, 0) / hourly.length
  );
  const averageCongestionIndex = Math.round(
    hourly.reduce((sum, h) => sum + h.congestionIndex, 0) / hourly.length
  );
  
  // Find peak hour
  const peakHourData = hourly.reduce((max, h) => 
    h.vehicleCount > max.vehicleCount ? h : max
  );
  
  const averageWaitTime = averageCongestionIndex > 70 ? randomInt(40, 80) :
                          averageCongestionIndex > 50 ? randomInt(25, 45) :
                          averageCongestionIndex > 30 ? randomInt(15, 30) :
                          randomInt(5, 20);

  return {
    id: `${intersectionId}_${date}`,
    intersectionId,
    date,
    summary: {
      totalVehicles,
      averageSpeed,
      averageCongestionIndex,
      averageWaitTime,
      peakHour: `${peakHourData.hour.toString().padStart(2, '0')}:00`,
      peakVehicleCount: peakHourData.vehicleCount,
    },
    hourly,
    efficiency: {
      autoModeTime: randomInt(1200, 1380), // 20-23 jam dalam menit
      manualModeTime: randomInt(60, 240),  // 1-4 jam dalam menit
      autoModeEfficiency: randomFloat(85, 98, 1),
      manualModeEfficiency: randomFloat(60, 80, 1),
    },
    events: {
      total: randomInt(2, 8),
      bySeverity: {
        low: randomInt(1, 3),
        medium: randomInt(0, 3),
        high: randomInt(0, 2),
        critical: randomInt(0, 1),
      },
      byType: {
        congestion: randomInt(1, 4),
        accident: randomInt(0, 1),
        sensor_error: randomInt(0, 1),
        other: randomInt(0, 2),
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Generate traffic data real-time
function generateTrafficData(deviceId: string, lane: string) {
  const vehicleCount = randomInt(10, 150);
  const speed = vehicleCount > 100 ? randomInt(15, 30) : randomInt(30, 60);
  const density = Math.round((vehicleCount / 150) * 100);
  
  let status: 'normal' | 'congested' | 'critical';
  if (vehicleCount < 50) status = 'normal';
  else if (vehicleCount < 100) status = 'congested';
  else status = 'critical';

  return {
    id: `${deviceId}-${lane}-${Date.now()}`,
    deviceId,
    lane,
    vehicleCount,
    speed,
    density,
    status,
    timestamp: new Date().toISOString(),
    _ts: Math.floor(Date.now() / 1000),
  };
}

// Generate events
function generateEvent(intersectionId: string, intersectionName: string) {
  const types = ['congestion', 'sensor_error', 'manual_override', 'system_alert'];
  const priorities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['open', 'in_progress', 'resolved'];
  
  const type = types[randomInt(0, types.length - 1)];
  const priority = priorities[randomInt(0, priorities.length - 1)];
  const status = statuses[randomInt(0, statuses.length - 1)];
  
  const titles: { [key: string]: string[] } = {
    congestion: [
      'Kemacetan Parah Terdeteksi',
      'Kepadatan Tinggi di Jalur Utara',
      'Antrian Panjang Terdeteksi',
    ],
    sensor_error: [
      'Sensor Ultrasonik Error',
      'Koneksi IoT Terputus',
      'Kalibrasi Sensor Diperlukan',
    ],
    manual_override: [
      'Mode Manual Diaktifkan',
      'Override Durasi Lampu',
      'Intervensi Operator',
    ],
    system_alert: [
      'Anomali Sistem Terdeteksi',
      'Performa Menurun',
      'Update Firmware Tersedia',
    ],
  };
  
  const title = titles[type][randomInt(0, titles[type].length - 1)];
  
  return {
    id: `evt_${Date.now()}_${randomInt(1000, 9999)}`,
    intersectionId,
    type,
    priority,
    status,
    title,
    description: `Event terdeteksi di ${intersectionName}. Memerlukan perhatian ${priority}.`,
    timestamp: new Date().toISOString(),
    metadata: {
      intersectionName,
      autoGenerated: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function seedAnalyticsData() {
  console.log('🚀 Starting analytics data seeding...\n');

  try {
    // Get intersections
    const intersectionsContainer = database.container('intersections');
    const { resources: intersections } = await intersectionsContainer.items
      .query('SELECT * FROM c')
      .fetchAll();

    if (intersections.length === 0) {
      console.log('❌ No intersections found. Please run seed-data.ts first.');
      return;
    }

    console.log(`✅ Found ${intersections.length} intersections\n`);

    // Generate analytics data untuk 7 hari terakhir
    const analyticsContainer = database.container('analytics_daily');
    const trafficContainer = database.container('traffic_data');
    const eventsContainer = database.container('events');

    const today = new Date();
    const analyticsData = [];
    const trafficData = [];
    const eventsData = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      console.log(`📅 Generating data for ${dateStr}...`);

      for (const intersection of intersections) {
        // Generate daily analytics
        const analytics = generateDailyAnalytics(intersection.id, dateStr);
        analyticsData.push(analytics);

        // Generate traffic data (10 records per intersection per day)
        const lanes = ['north', 'east', 'south', 'west'];
        for (let j = 0; j < 10; j++) {
          const lane = lanes[randomInt(0, lanes.length - 1)];
          const traffic = generateTrafficData(intersection.deviceId, lane);
          trafficData.push(traffic);
        }

        // Generate events (2-3 per intersection per day)
        const eventCount = randomInt(2, 3);
        for (let j = 0; j < eventCount; j++) {
          const event = generateEvent(intersection.id, intersection.name);
          eventsData.push(event);
        }
      }
    }

    // Insert analytics data
    console.log(`\n📊 Inserting ${analyticsData.length} analytics records...`);
    for (const item of analyticsData) {
      try {
        await analyticsContainer.items.upsert(item);
      } catch (error: any) {
        console.error(`Error inserting analytics ${item.id}:`, error.message);
      }
    }
    console.log('✅ Analytics data inserted');

    // Insert traffic data
    console.log(`\n🚗 Inserting ${trafficData.length} traffic records...`);
    for (const item of trafficData) {
      try {
        await trafficContainer.items.create(item);
      } catch (error: any) {
        // Ignore duplicate errors
        if (!error.message.includes('Conflict')) {
          console.error(`Error inserting traffic ${item.id}:`, error.message);
        }
      }
    }
    console.log('✅ Traffic data inserted');

    // Insert events
    console.log(`\n⚠️  Inserting ${eventsData.length} event records...`);
    for (const item of eventsData) {
      try {
        await eventsContainer.items.create(item);
      } catch (error: any) {
        // Ignore duplicate errors
        if (!error.message.includes('Conflict')) {
          console.error(`Error inserting event ${item.id}:`, error.message);
        }
      }
    }
    console.log('✅ Events inserted');

    console.log('\n🎉 Analytics data seeding completed successfully!');
    console.log('\n📈 Summary:');
    console.log(`   - Analytics records: ${analyticsData.length}`);
    console.log(`   - Traffic records: ${trafficData.length}`);
    console.log(`   - Event records: ${eventsData.length}`);
    console.log(`   - Date range: Last 7 days`);
    console.log(`   - Intersections: ${intersections.length}`);

  } catch (error: any) {
    console.error('❌ Error seeding analytics data:', error.message);
    throw error;
  }
}

// Run the seeding
seedAnalyticsData()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
