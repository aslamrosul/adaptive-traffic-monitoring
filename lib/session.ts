import { cacheGet, cacheSet, cacheDelete } from './redis';

interface UserSession {
  userId: string;
  email: string;
  role: string;
  preferences: any;
  lastActivity: number;
}

export async function createSession(userId: string, sessionData: Omit<UserSession, 'lastActivity'>) {
  const session: UserSession = {
    ...sessionData,
    lastActivity: Date.now()
  };

  const sessionKey = `session:${userId}`;
  await cacheSet(sessionKey, session, 3600); // 1 hour TTL

  return session;
}

export async function getSession(userId: string): Promise<UserSession | null> {
  const sessionKey = `session:${userId}`;
  return await cacheGet(sessionKey);
}

export async function updateSession(userId: string, updates: Partial<UserSession>) {
  const session = await getSession(userId);
  if (!session) return null;

  const updated = {
    ...session,
    ...updates,
    lastActivity: Date.now()
  };

  const sessionKey = `session:${userId}`;
  await cacheSet(sessionKey, updated, 3600);

  return updated;
}

export async function deleteSession(userId: string) {
  const sessionKey = `session:${userId}`;
  await cacheDelete(sessionKey);
}