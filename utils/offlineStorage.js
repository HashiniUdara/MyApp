/**
 * offlineStorage.js
 *
 * Two responsibilities:
 *   1. Local entity cache  — keyed by  "cache:{entity}:{userId}"
 *      Stores the full array of records for an entity so the app can
 *      read data instantly while offline.
 *
 *   2. Pending sync queue — keyed by  "syncQueue:{userId}"
 *      Stores an ordered array of operations (create / update / delete)
 *      that have not yet been pushed to Supabase.  When connectivity
 *      returns, syncQueue.js drains this list.
 *
 * All keys use a userId suffix so multiple accounts on the same device
 * never share data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Cache helpers ────────────────────────────────────────────────

function cacheKey(entity, userId) {
  return `cache:${entity}:${userId}`;
}

/** Read the cached array for an entity. Returns [] if nothing stored. */
export async function readCache(entity, userId) {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(entity, userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Overwrite the entire cached array for an entity. */
export async function writeCache(entity, userId, records) {
  try {
    await AsyncStorage.setItem(cacheKey(entity, userId), JSON.stringify(records ?? []));
  } catch { /* storage full — silently ignore */ }
}

/** Apply a partial update to the cache without re-fetching from the server. */
export async function patchCache(entity, userId, updater) {
  const current = await readCache(entity, userId);
  const next = updater(current);
  await writeCache(entity, userId, next);
  return next;
}

/** Remove all cached data for a user (called on sign-out). */
export async function clearUserCache(userId) {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const userKeys = allKeys.filter(k => k.endsWith(`:${userId}`));
    if (userKeys.length) await AsyncStorage.multiRemove(userKeys);
  } catch { /* ignore */ }
}

// ─── Sync-queue helpers ───────────────────────────────────────────

function queueKey(userId) {
  return `syncQueue:${userId}`;
}

/**
 * Read the full pending-operations array for a user.
 * Each operation is:
 *   { id, entity, op: 'create'|'update'|'delete', payload, enqueuedAt }
 */
export async function readQueue(userId) {
  try {
    const raw = await AsyncStorage.getItem(queueKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Append a new operation to the end of the queue. */
export async function enqueue(userId, operation) {
  try {
    const queue = await readQueue(userId);
    queue.push({ ...operation, enqueuedAt: Date.now() });
    await AsyncStorage.setItem(queueKey(userId), JSON.stringify(queue));
  } catch { /* ignore */ }
}

/** Replace the entire queue (used after flushing some/all operations). */
export async function writeQueue(userId, queue) {
  try {
    await AsyncStorage.setItem(queueKey(userId), JSON.stringify(queue ?? []));
  } catch { /* ignore */ }
}

/** Remove all pending operations for a user (called on sign-out). */
export async function clearQueue(userId) {
  try {
    await AsyncStorage.removeItem(queueKey(userId));
  } catch { /* ignore */ }
}

/** Return true if there are any unsynced operations waiting. */
export async function hasPending(userId) {
  const q = await readQueue(userId);
  return q.length > 0;
}
