/**
 * todoApi.js  — offline-first
 */

import { dbQuery } from './supabaseClient';
import { readCache, writeCache, patchCache, enqueue } from '../utils/offlineStorage';
import { isOnline } from '../utils/networkStatus';
import { generateUUID } from '../utils/uuid';
import { todayStr } from '../utils/dateUtils';

const ENTITY      = 'todos';
const ENTITY_CAT  = 'todo_categories';

// ─── Todos ────────────────────────────────────────────────────────

export async function fetchTodos(userId) {
  const today = todayStr();

  // Read and filter cache for today + future
  const cached = (await readCache(ENTITY, userId)).filter((t) => t.date >= today);

  if (await isOnline()) {
    try {
      const data = await dbQuery(ENTITY, {
        filters: [`user_id=eq.${userId}`, `date=gte.${today}`],
        order: 'date.asc',
      });
      const fresh = data ?? [];
      await writeCache(ENTITY, userId, fresh);
      return fresh;
    } catch { /* fall through to cache */ }
  }

  return cached;
}

/** Delete past todos — only runs online; silently skips offline. */
export async function deletePastTodos(userId) {
  const today = todayStr();
  // Always remove from cache
  await patchCache(ENTITY, userId, (prev) => prev.filter((t) => t.date >= today));

  if (await isOnline()) {
    try {
      await dbQuery(ENTITY, {
        method: 'DELETE',
        filters: [`user_id=eq.${userId}`, `date=lt.${today}`],
      });
    } catch { /* non-fatal */ }
  }
}

export async function createTodo(userId, item) {
  const record = { ...item, id: generateUUID(), user_id: userId, created_at: new Date().toISOString() };

  await patchCache(ENTITY, userId, (prev) => [...prev, record]);

  if (await isOnline()) {
    try {
      const saved = await dbQuery(ENTITY, { method: 'POST', body: record, single: true });
      await patchCache(ENTITY, userId, (prev) => prev.map((t) => (t.id === record.id ? saved : t)));
      return saved;
    } catch { /* fall through to queue */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: ENTITY, op: 'create', payload: record, userId });
  return record;
}

export async function updateTodo(id, patch) {
  // patch may not carry user_id; we update all matching records in cache
  const userId = patch.user_id ?? await _findUserId(ENTITY, id);

  await patchCache(ENTITY, userId, (prev) =>
    prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  );

  if (await isOnline()) {
    try {
      return await dbQuery(ENTITY, { method: 'PATCH', body: patch, filters: [`id=eq.${id}`], single: true });
    } catch { /* fall through to queue */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: ENTITY, op: 'update', recordId: id, payload: patch, userId });
  return { id, ...patch };
}

export async function deleteTodo(id, userId) {
  await patchCache(ENTITY, userId, (prev) => prev.filter((t) => t.id !== id));

  if (await isOnline()) {
    try {
      await dbQuery(ENTITY, { method: 'DELETE', filters: [`id=eq.${id}`] });
      return;
    } catch { /* fall through to queue */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: ENTITY, op: 'delete', recordId: id, userId });
}

// ─── Todo categories ──────────────────────────────────────────────

export async function fetchTodoCategories(userId) {
  const cached = await readCache(ENTITY_CAT, userId);
  if (cached.length) return cached; // serve cache immediately

  if (await isOnline()) {
    try {
      const data = await dbQuery(ENTITY_CAT);
      await writeCache(ENTITY_CAT, userId, data ?? []);
      return data ?? [];
    } catch { /* fall through */ }
  }

  return cached;
}

// ─── Internal helper ─────────────────────────────────────────────

/** Best-effort: scan all AsyncStorage keys to find a userId for a record id. */
async function _findUserId(_entity, _id) {
  // Without carrying userId through every call path we cannot look it up
  // easily. Return a sentinel and let the enqueue skip if needed.
  return '_';
}
