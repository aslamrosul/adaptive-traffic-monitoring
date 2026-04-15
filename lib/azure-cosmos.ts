// Azure Cosmos DB Configuration
import { CosmosClient, Database } from '@azure/cosmos';

let client: CosmosClient | null = null;
let database: Database | null = null;

function getClient() {
  if (!client) {
    const endpoint = process.env.AZURE_COSMOS_ENDPOINT || '';
    const key = process.env.AZURE_COSMOS_KEY || '';
    
    if (!endpoint || !key) {
      throw new Error('Azure Cosmos DB credentials not configured');
    }
    
    client = new CosmosClient({ endpoint, key });
  }
  return client;
}

function getDatabase() {
  if (!database) {
    const databaseId = process.env.AZURE_COSMOS_DATABASE || 'TrafficDB';
    database = getClient().database(databaseId);
  }
  return database;
}

export const containers = {
  get trafficData() {
    return getDatabase().container('traffic_data');
  },
  get intersections() {
    return getDatabase().container('intersections');
  },
  get events() {
    return getDatabase().container('events');
  },
  get reports() {
    return getDatabase().container('reports');
  },
  get notifications() {
    return getDatabase().container('notifications');
  },
  get users() {
    return getDatabase().container('users');
  },
  get deviceStatus() {
    return getDatabase().container('device_status');
  },
  get analyticsDaily() {
    return getDatabase().container('analytics_daily');
  },
};

export { getClient as client, getDatabase as database };

