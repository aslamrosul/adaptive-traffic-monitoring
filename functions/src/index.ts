import * as cors from 'cors';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// CORS configuration
const corsHandler = cors({ origin: true });

// ============================================
// Function 1: Add Traffic Data from ESP32
// ============================================
export const addTrafficData = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const {
        intersectionId,
        deviceId,
        vehicleCount,
        congestionLevel,
        timestamp,
        averageSpeed,
        density,
        metadata
      } = req.body;

      // Validate required fields
      if (!intersectionId || !deviceId || vehicleCount === undefined || !congestionLevel) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['intersectionId', 'deviceId', 'vehicleCount', 'congestionLevel']
        });
      }

      // Validate congestion level
      const validLevels = ['low', 'medium', 'high', 'critical'];
      if (!validLevels.includes(congestionLevel)) {
        return res.status(400).json({ 
          error: 'Invalid congestion level',
          validLevels
        });
      }

      // Create traffic data document
      const trafficData = {
        intersectionId,
        deviceId,
        vehicleCount: Number(vehicleCount),
        congestionLevel,
        timestamp: timestamp ? admin.firestore.Timestamp.fromDate(new Date(timestamp)) : admin.firestore.FieldValue.serverTimestamp(),
        averageSpeed: averageSpeed ? Number(averageSpeed) : null,
        density: density ? Number(density) : null,
        metadata: metadata || {},
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Add to Firestore
      const docRef = await db.collection('traffic_data').add(trafficData);

      // Update intersection last update time
      await db.collection('intersections').doc(intersectionId).update({
        lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active'
      });

      functions.logger.info('Traffic data added', { 
        dataId: docRef.id, 
        intersectionId,
        congestionLevel 
      });

      return res.status(200).json({
        success: true,
        dataId: docRef.id,
        message: 'Traffic data added successfully'
      });

    } catch (error: any) {
      functions.logger.error('Error adding traffic data', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  });
});

// ============================================
// Function 2: Auto-generate Alerts
// ============================================
export const generateAlerts = functions.firestore
  .document('traffic_data/{dataId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const { intersectionId, congestionLevel, vehicleCount } = data;

    try {
      // Only create alert for high or critical congestion
      if (congestionLevel !== 'high' && congestionLevel !== 'critical') {
        return null;
      }

      // Check if there's already an active alert for this intersection
      const existingAlerts = await db.collection('alerts')
        .where('intersectionId', '==', intersectionId)
        .where('resolved', '==', false)
        .where('type', '==', 'congestion')
        .limit(1)
        .get();

      if (!existingAlerts.empty) {
        functions.logger.info('Alert already exists for intersection', { intersectionId });
        return null;
      }

      // Get intersection details
      const intersectionDoc = await db.collection('intersections').doc(intersectionId).get();
      const intersectionName = intersectionDoc.exists ? intersectionDoc.data()?.name : 'Unknown';

      // Create alert
      const alert = {
        intersectionId,
        intersectionName,
        type: 'congestion',
        severity: congestionLevel,
        message: `Kemacetan ${congestionLevel} terdeteksi di ${intersectionName}. Jumlah kendaraan: ${vehicleCount}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        resolved: false,
        resolvedAt: null,
        trafficDataId: context.params.dataId
      };

      await db.collection('alerts').add(alert);

      functions.logger.info('Alert created', { 
        intersectionId, 
        severity: congestionLevel 
      });

      return null;
    } catch (error) {
      functions.logger.error('Error generating alert', error);
      return null;
    }
  });

// ============================================
// Function 3: Calculate Daily Analytics
// ============================================
export const calculateDailyAnalytics = functions.pubsub
  .schedule('0 0 * * *') // Run every day at midnight
  .timeZone('Asia/Jakarta')
  .onRun(async (context) => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all traffic data from yesterday
      const snapshot = await db.collection('traffic_data')
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .where('timestamp', '<', admin.firestore.Timestamp.fromDate(today))
        .get();

      if (snapshot.empty) {
        functions.logger.info('No traffic data for yesterday');
        return null;
      }

      // Calculate analytics
      let totalVehicles = 0;
      let congestionSum = 0;
      const byIntersection: { [key: string]: any } = {};
      const hourlyData: { [key: number]: number } = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        totalVehicles += data.vehicleCount;

        // Map congestion level to number
        const congestionValue = {
          'low': 1,
          'medium': 2,
          'high': 3,
          'critical': 4
        }[data.congestionLevel] || 0;
        congestionSum += congestionValue;

        // By intersection
        if (!byIntersection[data.intersectionId]) {
          byIntersection[data.intersectionId] = {
            totalVehicles: 0,
            dataPoints: 0,
            congestionSum: 0
          };
        }
        byIntersection[data.intersectionId].totalVehicles += data.vehicleCount;
        byIntersection[data.intersectionId].dataPoints += 1;
        byIntersection[data.intersectionId].congestionSum += congestionValue;

        // By hour
        const hour = data.timestamp.toDate().getHours();
        hourlyData[hour] = (hourlyData[hour] || 0) + data.vehicleCount;
      });

      // Find peak hours
      const peakHours = Object.entries(hourlyData)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => Number(hour));

      // Calculate averages
      const averageCongestion = congestionSum / snapshot.size;

      // Prepare analytics document
      const dateStr = yesterday.toISOString().split('T')[0];
      const analytics = {
        date: dateStr,
        totalVehicles,
        averageCongestion: Math.round(averageCongestion * 100) / 100,
        dataPoints: snapshot.size,
        peakHours,
        byIntersection,
        calculatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Save to Firestore
      await db.collection('analytics').doc(`daily_${dateStr}`).set(analytics);

      functions.logger.info('Daily analytics calculated', { 
        date: dateStr, 
        totalVehicles,
        intersections: Object.keys(byIntersection).length
      });

      return null;
    } catch (error) {
      functions.logger.error('Error calculating daily analytics', error);
      return null;
    }
  });

// ============================================
// Function 4: Resolve Alert
// ============================================
export const resolveAlert = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { alertId } = req.body;

      if (!alertId) {
        return res.status(400).json({ error: 'Missing alertId' });
      }

      await db.collection('alerts').doc(alertId).update({
        resolved: true,
        resolvedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      functions.logger.info('Alert resolved', { alertId });

      return res.status(200).json({
        success: true,
        message: 'Alert resolved successfully'
      });

    } catch (error: any) {
      functions.logger.error('Error resolving alert', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  });
});

// ============================================
// Function 5: Get Analytics
// ============================================
export const getAnalytics = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { startDate, endDate, intersectionId } = req.query;

      let query: any = db.collection('analytics');

      if (startDate) {
        query = query.where('date', '>=', startDate);
      }
      if (endDate) {
        query = query.where('date', '<=', endDate);
      }

      const snapshot = await query.orderBy('date', 'desc').limit(30).get();

      const analytics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return res.status(200).json({
        success: true,
        data: analytics,
        count: analytics.length
      });

    } catch (error: any) {
      functions.logger.error('Error getting analytics', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  });
});
