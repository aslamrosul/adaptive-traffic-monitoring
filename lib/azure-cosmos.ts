// Azure Cosmos DB Connection
import { CosmosClient } from '@azure/cosmos';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  provider?: string; // 'credentials', 'google', 'azure'
  createdAt: Date;
  updatedAt: Date;
}

// Initialize Cosmos DB Client
let cosmosClient: CosmosClient | null = null;
let database: any = null;

function getCosmosClient() {
  if (!cosmosClient) {
    const endpoint = process.env.AZURE_COSMOS_ENDPOINT;
    const key = process.env.AZURE_COSMOS_KEY;

    if (!endpoint || !key) {
      throw new Error('Missing Azure Cosmos DB credentials in environment variables');
    }

    cosmosClient = new CosmosClient({ endpoint, key });
  }
  return cosmosClient;
}

function getDatabase() {
  if (!database) {
    const client = getCosmosClient();
    const databaseId = process.env.AZURE_COSMOS_DATABASE || 'TrafficDB';
    database = client.database(databaseId);
  }
  return database;
}

// Export containers for use in API routes
export const containers = {
  get users() {
    return getDatabase().container('users');
  },
  get trafficData() {
    return getDatabase().container('traffic_data');
  },
  get analyticsDaily() {
    return getDatabase().container('analytics_daily');
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
  get deviceStatus() {
    return getDatabase().container('device_status');
  },
};

// Simulasi database untuk fallback (akan diganti dengan Azure Cosmos DB)
const usersCollection: User[] = [];

export async function createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    usersCollection.push(newUser);

    // Try to save to Azure Cosmos DB
    try {
      await containers.users.items.create(newUser);
    } catch (error) {
      console.warn('Warning: Could not save to Azure Cosmos DB, using in-memory storage', error);
    }

    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  try {
    // Try to query from Azure Cosmos DB
    try {
      const { resources } = await containers.users.items
        .query(`SELECT * FROM c WHERE c.email = @email`, { 
          parameters: [{ name: '@email', value: email }] 
        })
        .fetchAll();
      if (resources.length > 0) return resources[0];
    } catch (error) {
      console.warn('Warning: Could not query Azure Cosmos DB, using in-memory storage', error);
    }

    return usersCollection.find(u => u.email === email);
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

export async function getUserById(id: string) {
  try {
    // Try to query from Azure Cosmos DB
    try {
      const { resources } = await containers.users.items
        .query(`SELECT * FROM c WHERE c.id = @id`, { 
          parameters: [{ name: '@id', value: id }] 
        })
        .fetchAll();
      if (resources.length > 0) return resources[0];
    } catch (error) {
      console.warn('Warning: Could not query Azure Cosmos DB, using in-memory storage', error);
    }

    return usersCollection.find(u => u.id === id);
  } catch (error) {
    console.error('Error getting user by id:', error);
    throw error;
  }
}

export async function updateUser(id: string, updates: Partial<User>) {
  try {
    const userIndex = usersCollection.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('User not found');

    usersCollection[userIndex] = {
      ...usersCollection[userIndex],
      ...updates,
      updatedAt: new Date(),
    };

    // Try to update in Azure Cosmos DB
    try {
      await containers.users.item(id).replace(usersCollection[userIndex]);
    } catch (error) {
      console.warn('Warning: Could not update Azure Cosmos DB, using in-memory storage', error);
    }

    return usersCollection[userIndex];
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    const userIndex = usersCollection.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('User not found');

    const deletedUser = usersCollection.splice(userIndex, 1)[0];

    // Try to delete from Azure Cosmos DB
    try {
      await containers.users.item(id).delete();
    } catch (error) {
      console.warn('Warning: Could not delete from Azure Cosmos DB, using in-memory storage', error);
    }

    return deletedUser;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}
