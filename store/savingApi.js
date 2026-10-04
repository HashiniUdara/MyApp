/**
 * savingApi.js  — offline-first
 */

import { dbQuery } from './supabaseClient';
import { readCache, writeCache, patchCache, enqueue } from '../utils/offlineStorage';
import { isOnline } from '../utils/networkStatus';
import { generateUUID } from '../utils/uuid';

const ENTITY     = 'savings';
const ENTITY_CAT = 'saving_categories';

// ─── Savings ──────────────────────────────────────────────────────

export async function fetchSavings(userId) {
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
    } catch { /* fall through */ }
  }

  return cached;
}

export async function createSaving(userId, item) {
  const record = { ...item, id: generateUUID(), user_id: userId, created_at: new Date().toISOString() };

  await patchCache(ENTITY, userId, (prev) => [record, ...prev]);

  if (await isOnline()) {
    try {
      const saved = await dbQuery(ENTITY, { method: 'POST', body: record, single: true });
      await patchCache(ENTITY, userId, (prev) => prev.map((s) => (s.id === record.id ? saved : s)));
      return saved;
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: ENTITY, op: 'create', payload: record, userId });
  return record;
}

export async function updateSaving(id, item) {
  const userId = item.user_id ?? '_';
  await patchCache(ENTITY, userId, (prev) =>
    prev.map((s) => (s.id === id ? { ...s, ...item } : s)),
  );

  if (await isOnline()) {
    try {
      return await dbQuery(ENTITY, { method: 'PATCH', body: item, filters: [`id=eq.${id}`], single: true });
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: ENTITY, op: 'update', recordId: id, payload: item, userId });
  return { id, ...item };
}

export async function deleteSaving(id, userId) {
  await patchCache(ENTITY, userId, (prev) => prev.filter((s) => s.id !== id));

  if (await isOnline()) {
    try {
      await dbQuery(ENTITY, { method: 'DELETE', filters: [`id=eq.${id}`] });
      return;
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: ENTITY, op: 'delete', recordId: id, userId });
}

// ─── Saving categories (legacy path used by SavingsScreen) ────────
// These delegate to categoryApi to avoid duplicating cache logic.

export { fetchSavingCategories, createSavingCategory, updateSavingCategory, deleteSavingCategory }
  from './categoryApi';
