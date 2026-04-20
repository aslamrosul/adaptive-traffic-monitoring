// Script untuk simulasi data real-time ke Azure Cosmos DB
// Jalankan script ini untuk mensimulasikan data traffic yang terus bertambah
import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseId = process.env.AZURE_COSMOS_DATABASE || 'TrafficDB';

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);

const devices = [
  { id: 'lane-north', lane: 'north', intersectionId: 'int-001' },
  { id: 'lane-south', lane: 'south', intersectionId: 'int-001' },
  { id: 'lane-east', lane: 'east', intersectionId: 'int-001' },
  { id: 'lane-west', lane: 'west', intersectionId: 'int-001' },
];

function generateTrafficReading(device: typeof devices[0]) {
  const now = new Date();
  const hour = now.getHours();

  // Simulasi pola traffic realistis
  let baseCount = 50;
  if (hour >= 6 && hour <= 9) baseCount = 200; // Rush hour pagi
  if (hour >= 16 && hour <= 19) baseCount = 250; // Rush hour sore
  if (hour >= 22 || hour <= 5) baseCount = 20; // Malam hari

  // Tambahkan variasi random
  const vehicleCount = Math.floor(baseCount + Math.random() * 50 - 25);
  const speed = Math.max(10, Math.min(80, 60 - (vehicleCount / 5) + Math.random() * 10));
  const density = vehicleCount / 100;
  const congestionIndex = Math.min(100, (vehicleCount / 3) + Math.random() * 10);

  let status = 'smooth';
  if (congestionIndex > 70) status = 'congested';
  else if (congestionIndex > 40) status = 'moderate';

  return {
    id: `traffic-${device.id}-${now.getTime()}`,
    deviceId: device.id,
    intersectionId: device.intersectionId,
    lane: device.lane,
    vehicleCount: Math.max(0, vehicleCount),
    speed: Math.round(speed * 10) / 10,
    density: Math.round(density * 100) / 100,
    congestionIndex: Math.round(congestionIndex),
    status,
    timestamp: now.toISOString(),
    metadata: {
      temperature: 28 + Math.random() * 5,
      humidity: 60 + Math.random() * 20,
      visibility: 'good',
      weather: 'clear',
    },
  };
}

async function insertTrafficData() {
  try {
    const container = database.container('traffic_data');
    const readings = devices.map(device => generateTrafficReading(device));

    // Insert semua readings
    await Promise.all(readings.map(reading => container.items.create(reading)));

    // Log summary
    const timestamp = new Date().toLocaleTimeString('id-ID');
    console.log(`[${timestamp}] ✓ Inserted ${readings.length} traffic readings:`);
    readings.forEach(r => {
      const statusIcon = r.status === 'congested' ? '🔴' : r.status === 'moderate' ? '🟡' : '🟢';
      console.log(`  ${statusIcon} ${r.lane.padEnd(6)} | ${r.vehicleCount.toString().padStart(3)} vehicles | ${r.speed.toFixed(1)} km/h | ${r.status}`);
    });
    console.log('');
  } catch (error: any) {
    console.error('❌ Error inserting traffic data:', error.message);
    if (error.code === 401) {
      console.error('⚠️  AZURE_COSMOS_KEY tidak valid! Periksa .env.local');
      process.exit(1);
    }
  }
}

async function generateRandomEvent() {
  try {
    const container = database.container('events');
    const now = new Date();

    // 10% chance untuk generate event baru
    if (Math.random() > 0.1) return;

    const types = ['congestion', 'accident', 'sensor_error', 'maintenance'];
    const priorities = ['low', 'medium', 'high', 'critical'];
    const type = types[Math.floor(Math.random() * types.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];

    const event = {
      id: `event-${now.getTime()}`,
      intersectionId: 'int-001',
      type,
      priority,
      status: 'open',
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} terdeteksi`,
      description: `Event ${type} dengan prioritas ${priority} pada ${now.toLocaleTimeString('id-ID')}`,
      timestamp: now.toISOString(),
      resolvedAt: null,
      metadata: {
        lane: devices[Math.floor(Math.random() * devices.length)].lane,
        severity: priority,
        autoDetected: true,
      },
    };

    await container.items.create(event);
    const priorityIcon = priority === 'critical' ? '🚨' : priority === 'high' ? '⚠️' : 'ℹ️';
    console.log(`${priorityIcon} NEW EVENT: ${event.title} (${priority})\n`);
  } catch (error: any) {
    console.error('Error generating event:', error.message);
  }
}

async function updateDailyAnalytics() {
  try {
    const container = database.container('analytics_daily');
    const today = new Date().toISOString().split('T')[0];
    const analyticsId = `analytics-int-001-${today}`;

    // Fetch traffic data hari ini
    const trafficContainer = database.container('traffic_data');
    const { resources: trafficData } = await trafficContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.intersectionId = @intersectionId AND c.timestamp >= @startDate',
        parameters: [
          { name: '@intersectionId', value: 'int-001' },
          { name: '@startDate', value: new Date().toISOString().split('T')[0] + 'T00:00:00Z' },
        ],
      })
      .fetchAll();

    if (trafficData.length === 0) return;

    // Hitung hourly stats
    const hourlyMap = new Map();
    trafficData.forEach((data: any) => {
      const hour = new Date(data.timestamp).getHours();
      if (!hourlyMap.has(hour)) {
        hourlyMap.set(hour, { count: 0, totalVehicles: 0, totalSpeed: 0, totalCongestion: 0 });
      }
      const stats = hourlyMap.get(hour);
      stats.count++;
      stats.totalVehicles += data.vehicleCount;
      stats.totalSpeed += data.speed;
      stats.totalCongestion += data.congestionIndex || 0;
    });

    const hourly = Array.from(hourlyMap.entries()).map(([hour, stats]: [number, any]) => ({
      hour,
      vehicleCount: Math.round(stats.totalVehicles / stats.count),
      averageSpeed: Math.round((stats.totalSpeed / stats.count) * 10) / 10,
      congestionIndex: Math.round(stats.totalCongestion / stats.count),
      congestionLevel: stats.totalCongestion / stats.count > 70 ? 'high' : stats.totalCongestion / stats.count > 40 ? 'medium' : 'low',
    }));

    const totalVehicles = hourly.reduce((sum, h) => sum + h.vehicleCount, 0);
    const avgSpeed = hourly.reduce((sum, h) => sum + h.averageSpeed, 0) / hourly.length;
    const avgCongestion = hourly.reduce((sum, h) => sum + h.congestionIndex, 0) / hourly.length;
    const peakHourData = hourly.reduce((max, h) => h.vehicleCount > max.vehicleCount ? h : max, hourly[0]);

    const analytics = {
      id: analyticsId,
      intersectionId: 'int-001',
      date: today,
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
        total: 0,
        bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        byType: { congestion: 0, accident: 0, sensor_error: 0, other: 0 },
      },
      updatedAt: new Date().toISOString(),
    };

    await container.items.upsert(analytics);
    console.log(`📊 Updated daily analytics for ${today}`);
  } catch (error: any) {
    console.error('Error updating analytics:', error.message);
  }
}

async function startSimulation() {
  console.log('🚀 Memulai simulasi real-time traffic data...\n');
  console.log('📡 Mengirim data setiap 5 detik');
  console.log('📊 Update analytics setiap 1 menit');
  console.log('⚠️  Generate random events\n');
  console.log('Tekan Ctrl+C untuk menghentikan simulasi\n');
  console.log('═'.repeat(60) + '\n');

  // Insert data setiap 5 detik
  setInterval(insertTrafficData, 5000);

  // Generate random events
  setInterval(generateRandomEvent, 15000);

  // Update daily analytics setiap 1 menit
  setInterval(updateDailyAnalytics, 60000);

  // Insert pertama kali langsung
  await insertTrafficData();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Menghentikan simulasi...');
  console.log('✅ Simulasi dihentikan\n');
  process.exit(0);
});

// Start simulation
startSimulation().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
