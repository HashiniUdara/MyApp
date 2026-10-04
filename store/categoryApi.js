/**
 * categoryApi.js  — offline-first
 *
 * Three entity types: transaction_categories, todo_categories, saving_categories.
 * Each gets its own cache key and sync queue entries.
 */

import { dbQuery } from './supabaseClient';
import { readCache, writeCache, patchCache, enqueue } from '../utils/offlineStorage';
import { isOnline } from '../utils/networkStatus';
import { generateUUID } from '../utils/uuid';

// ── Transaction categories ─────────────────────────────────────────

const TX_CAT = 'transaction_categories';

export async function fetchTransactionCategoryRows(userId) {
  const cached = await readCache(TX_CAT, userId);

  if (await isOnline()) {
    try {
      const data = await dbQuery(TX_CAT, { filters: [`user_id=eq.${userId}`], order: 'id.asc' });
      const fresh = data ?? [];
      await writeCache(TX_CAT, userId, fresh);
      return fresh;
    } catch { /* fall through */ }
  }

  return cached;
}

export async function createTransactionCategory(userId, type, name, subcategories = []) {
  const record = { id: generateUUID(), user_id: userId, type, name, subcategories, created_at: new Date().toISOString() };

  await patchCache(TX_CAT, userId, (prev) => [...prev, record]);

  if (await isOnline()) {
    try {
      const saved = await dbQuery(TX_CAT, { method: 'POST', body: record, single: true });
      await patchCache(TX_CAT, userId, (prev) => prev.map((r) => (r.id === record.id ? saved : r)));
      return saved;
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: TX_CAT, op: 'create', payload: record, userId });
  return record;
}

export async function updateTransactionCategory(id, patch) {
  const userId = patch.user_id ?? '_';
  await patchCache(TX_CAT, userId, (prev) =>
    prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  );

  if (await isOnline()) {
    try {
      return await dbQuery(TX_CAT, { method: 'PATCH', body: patch, filters: [`id=eq.${id}`], single: true });
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: TX_CAT, op: 'update', recordId: id, payload: patch, userId });
  return { id, ...patch };
}

export async function deleteTransactionCategory(id, userId) {
  await patchCache(TX_CAT, userId, (prev) => prev.filter((r) => r.id !== id));

  if (await isOnline()) {
    try {
      await dbQuery(TX_CAT, { method: 'DELETE', filters: [`id=eq.${id}`] });
      return;
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: TX_CAT, op: 'delete', recordId: id, userId });
}

// ── Todo categories ───────────────────────────────────────────────

const TODO_CAT = 'todo_categories';

const toSlug = (text, userId) =>
  `${String(text || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'cat'}_${userId.slice(0, 8)}_${Date.now()}`;

export async function fetchTodoCategoryRows(userId) {
  const cached = await readCache(TODO_CAT, userId);

  if (await isOnline()) {
    try {
      const data = await dbQuery(TODO_CAT, { filters: [`user_id=eq.${userId}`], order: 'label.asc' });
      const fresh = data ?? [];
      await writeCache(TODO_CAT, userId, fresh);
      return fresh;
    } catch { /* fall through */ }
  }

  return cached;
}

export async function createTodoCategory(userId, { label, icon = 'pricetag-outline', color = '#2DA49E' }) {
  const record = { id: toSlug(label, userId), user_id: userId, label, icon, color, created_at: new Date().toISOString() };

  await patchCache(TODO_CAT, userId, (prev) => [...prev, record]);

  if (await isOnline()) {
    try {
      const saved = await dbQuery(TODO_CAT, { method: 'POST', body: record, single: true });
      await patchCache(TODO_CAT, userId, (prev) => prev.map((r) => (r.id === record.id ? saved : r)));
      return saved;
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: TODO_CAT, op: 'create', payload: record, userId });
  return record;
}

export async function updateTodoCategory(id, patch) {
  const userId = patch.user_id ?? '_';
  await patchCache(TODO_CAT, userId, (prev) =>
    prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  );

  if (await isOnline()) {
    try {
      return await dbQuery(TODO_CAT, { method: 'PATCH', body: patch, filters: [`id=eq.${id}`], single: true });
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: TODO_CAT, op: 'update', recordId: id, payload: patch, userId });
  return { id, ...patch };
}

export async function deleteTodoCategory(id, userId) {
  await patchCache(TODO_CAT, userId, (prev) => prev.filter((r) => r.id !== id));

  if (await isOnline()) {
    try {
      await dbQuery(TODO_CAT, { method: 'DELETE', filters: [`id=eq.${id}`] });
      return;
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: TODO_CAT, op: 'delete', recordId: id, userId });
}

// ── Saving categories ─────────────────────────────────────────────

const SAVING_CAT = 'saving_categories';

export async function fetchSavingCategories(userId) {
  const cached = await readCache(SAVING_CAT, userId);

  if (await isOnline()) {
    try {
      const data = await dbQuery(SAVING_CAT, { filters: [`user_id=eq.${userId}`], order: 'label.asc' });
      const fresh = data ?? [];
      await writeCache(SAVING_CAT, userId, fresh);
      return fresh;
    } catch { /* fall through */ }
  }

  return cached;
}

export async function createSavingCategory(userId, label) {
  // saving_categories uses a serial PK — use a temp negative int until synced
  const tempId = -(Date.now());
  const record = { id: tempId, user_id: userId, label, created_at: new Date().toISOString() };

  await patchCache(SAVING_CAT, userId, (prev) => [...prev, record]);

  if (await isOnline()) {
    try {
      const saved = await dbQuery(SAVING_CAT, { method: 'POST', body: { user_id: userId, label }, single: true });
      await patchCache(SAVING_CAT, userId, (prev) => prev.map((r) => (r.id === tempId ? saved : r)));
      return saved;
    } catch { /* fall through */ }
  }

  await enqueue(userId, {
    id: generateUUID(), entity: SAVING_CAT, op: 'create',
    payload: { user_id: userId, label }, userId,
  });
  return record;
}

export async function updateSavingCategory(id, patch) {
  const userId = patch.user_id ?? '_';
  await patchCache(SAVING_CAT, userId, (prev) =>
    prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  );

  if (await isOnline()) {
    try {
      return await dbQuery(SAVING_CAT, { method: 'PATCH', body: patch, filters: [`id=eq.${id}`], single: true });
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: SAVING_CAT, op: 'update', recordId: id, payload: patch, userId });
  return { id, ...patch };
}

export async function deleteSavingCategory(id, userId) {
  await patchCache(SAVING_CAT, userId, (prev) => prev.filter((r) => r.id !== id));

  if (await isOnline()) {
    try {
      await dbQuery(SAVING_CAT, { method: 'DELETE', filters: [`id=eq.${id}`] });
      return;
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: SAVING_CAT, op: 'delete', recordId: id, userId });
}
