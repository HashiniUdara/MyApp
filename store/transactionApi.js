/**
 * transactionApi.js  — offline-first
 *
 * Every read  → local cache first, then Supabase (updates cache on success).
 * Every write → local cache updated immediately, then Supabase attempted.
 *               If Supabase fails the op is queued for later sync.
 */

import { dbQuery } from './supabaseClient';
import { readCache, writeCache, patchCache, enqueue } from '../utils/offlineStorage';
import { isOnline } from '../utils/networkStatus';
import { generateUUID } from '../utils/uuid';

const ENTITY = 'transactions';

// ─── Read ─────────────────────────────────────────────────────────

export async function fetchTransactions(userId) {
  // Always return cache immediately for offline use
  const cached = await readCache(ENTITY, userId);

  if (await isOnline()) {
    try {
      const data = await dbQuery(ENTITY, {
        filters: [`user_id=eq.${userId}`],
        order: 'date.desc',
      });
      const fresh = data ?? [];
      await writeCache(ENTITY, userId, fresh);
      return fresh;
    } catch { /* fall through to cache */ }
  }

  return cached;
}

// ─── Create ───────────────────────────────────────────────────────

export async function createTransaction(userId, item) {
  const record = { ...item, id: generateUUID(), user_id: userId, created_at: new Date().toISOString() };

  // Optimistic cache update
  await patchCache(ENTITY, userId, (prev) => [record, ...prev]);

  if (await isOnline()) {
    try {
      const saved = await dbQuery(ENTITY, { method: 'POST', body: record, single: true });
      // Replace the optimistic record with the server response
      await patchCache(ENTITY, userId, (prev) =>
        prev.map((t) => (t.id === record.id ? saved : t)),
      );
      return saved;
    } catch { /* fall through to queue */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: ENTITY, op: 'create', payload: record, userId });
  return record;
}

// ─── Update ───────────────────────────────────────────────────────

export async function updateTransaction(id, item) {
  // Optimistic cache update — find the record by id (no userId needed here)
  let updated;
  await patchCache(ENTITY, item.user_id ?? '_', (prev) => {
    return prev.map((t) => {
      if (t.id !== id) return t;
      updated = { ...t, ...item };
      return updated;
    });
  });
  // Also patch across all user caches — simpler: we store userId on the item
  // The store always passes the full item including user_id so the cache key is correct.

  if (await isOnline()) {
    try {
      const saved = await dbQuery(ENTITY, {
        method: 'PATCH', body: item,
        filters: [`id=eq.${id}`], single: true,
      });
      return saved;
    } catch { /* fall through to queue */ }
  }

  await enqueue(item.user_id ?? '_', {
    id: generateUUID(), entity: ENTITY, op: 'update', recordId: id, payload: item, userId: item.user_id,
  });
  return updated ?? { id, ...item };
}

// ─── Delete ───────────────────────────────────────────────────────

export async function deleteTransaction(id, userId) {
  await patchCache(ENTITY, userId, (prev) => prev.filter((t) => t.id !== id));

  if (await isOnline()) {
    try {
      await dbQuery(ENTITY, { method: 'DELETE', filters: [`id=eq.${id}`] });
      return;
    } catch { /* fall through to queue */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: ENTITY, op: 'delete', recordId: id, userId });
}
