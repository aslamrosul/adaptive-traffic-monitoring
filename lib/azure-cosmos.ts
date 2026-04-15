// Azure Cosmos DB Configuration
import { CosmosClient } from '@azure/cosmos';

const endpoint = process.env.AZURE_COSMOS_ENDPOINT || '';
const key = process.env.AZURE_COSMOS_KEY || '';
const databaseId = process.env.AZURE_COSMOS_DATABASE || 'TrafficDB';

// Initialize Cosmos Client
const client = new CosmosClient({ endpoint, key });

// Database and Container references
const database = client.database(databaseId);

export const containers = {
  trafficData: database.container('traffic_data'),
  intersections: database.container('intersections'),
  events: database.container('events'),
  reports: database.container('reports'),
  notifications: database.container('notifications'),
  users: database.container('users'),
  deviceStatus: database.container('device_status'),
  analyticsDaily: database.container('analytics_daily'),
};

export { client, database };

