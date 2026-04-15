// Azure Cosmos DB Configuration
import { CosmosClient, Database } from '@azure/cosmos';

let client: CosmosClient | null = null;
let database: Database | null = null;

function getClient() {
  if (!client) {
    const endpoint = process.env.AZURE_COSMOS_ENDPOINT;
    const key = process.env.AZURE_COSMOS_KEY;
    
    if (!endpoint || !key) {
      // Return a dummy client during build time
      if (process.env.NODE_ENV === 'production' && !process.env.AZURE_COSMOS_ENDPOINT) {
        console.warn('Azure Cosmos DB credentials not available during build');
        return null as any;
      }
      throw new Error('Azure Cosmos DB credentials not configured');
    }
    
    client = new CosmosClient({ endpoint, key });
  }
  return client;
}

function getDatabase() {
  if (!database) {
    const databaseId = process.env.AZURE_COSMOS_DATABASE || 'TrafficDB';
    const cosmosClient = getClient();
    if (!cosmosClient) return null as any;
    database = cosmosClient.database(databaseId);
  }
  return database;
}

export const containers = {
  get trafficData() {
    const db = getDatabase();
    return db ? db.container('traffic_data') : null as any;
  },
  get intersections() {
    const db = getDatabase();
    return db ? db.container('intersections') : null as any;
  },
  get events() {
    const db = getDatabase();
    return db ? db.container('events') : null as any;
  },
  get reports() {
    const db = getDatabase();
    return db ? db.container('reports') : null as any;
  },
  get notifications() {
    const db = getDatabase();
    return db ? db.container('notifications') : null as any;
  },
  get users() {
    const db = getDatabase();
    return db ? db.container('users') : null as any;
  },
  get deviceStatus() {
    const db = getDatabase();
    return db ? db.container('device_status') : null as any;
  },
  get analyticsDaily() {
    const db = getDatabase();
    return db ? db.container('analytics_daily') : null as any;
  },
};

export { getClient as client, getDatabase as database };

