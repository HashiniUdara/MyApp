/**
 * habitApi.js  — offline-first
 *
 * Habits and completions both get local cache + sync queue support.
 * The completions map { [habitId]: { [dateStr]: true } } is stored
 * as a flat array of { habit_id, date } rows in cache to match the
 * Supabase response shape, then re-assembled into the map on read.
 */

import { dbQuery } from './supabaseClient';
import { readCache, writeCache, patchCache, enqueue } from '../utils/offlineStorage';
import { isOnline } from '../utils/networkStatus';
import { generateUUID } from '../utils/uuid';

const ENTITY      = 'habits';
const ENTITY_COMP = 'habit_completions';

// ─── Habits ───────────────────────────────────────────────────────

export async function fetchHabits(userId) {
  const cached = await readCache(ENTITY, userId);

  if (await isOnline()) {
    try {
      const data = await dbQuery(ENTITY, {
        filters: [`user_id=eq.${userId}`],
        order: 'created_at.asc',
      });
      const fresh = data ?? [];
      await writeCache(ENTITY, userId, fresh);
      return fresh;
    } catch { /* fall through */ }
  }

  return cached;
}

export async function createHabit(userId, item) {
  const record = { ...item, id: generateUUID(), user_id: userId, created_at: new Date().toISOString() };

  await patchCache(ENTITY, userId, (prev) => [...prev, record]);

  if (await isOnline()) {
    try {
      const saved = await dbQuery(ENTITY, { method: 'POST', body: record, single: true });
      await patchCache(ENTITY, userId, (prev) => prev.map((h) => (h.id === record.id ? saved : h)));
      return saved;
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: ENTITY, op: 'create', payload: record, userId });
  return record;
}

export async function updateHabit(id, patch) {
  const userId = patch.user_id ?? '_';
  await patchCache(ENTITY, userId, (prev) =>
    prev.map((h) => (h.id === id ? { ...h, ...patch } : h)),
  );

  if (await isOnline()) {
    try {
      return await dbQuery(ENTITY, { method: 'PATCH', body: patch, filters: [`id=eq.${id}`], single: true });
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: ENTITY, op: 'update', recordId: id, payload: patch, userId });
  return { id, ...patch };
}

export async function deleteHabit(id, userId) {
  await patchCache(ENTITY, userId, (prev) => prev.filter((h) => h.id !== id));
  // Also remove all completions for this habit from cache
  await patchCache(ENTITY_COMP, userId, (prev) => prev.filter((c) => c.habit_id !== id));

  if (await isOnline()) {
    try {
      await dbQuery(ENTITY, { method: 'DELETE', filters: [`id=eq.${id}`] });
      return;
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: ENTITY, op: 'delete', recordId: id, userId });
}

// ─── Completions ──────────────────────────────────────────────────

/** Returns { [habitId]: { [dateStr]: true } } */
export async function fetchCompletions(userId) {
  const toMap = (rows) => {
    const map = {};
    (rows ?? []).forEach(({ habit_id, date }) => {
      map[habit_id] ??= {};
      map[habit_id][date] = true;
    });
    return map;
  };

  const cachedRows = await readCache(ENTITY_COMP, userId);

  if (await isOnline()) {
    try {
      const rows = await dbQuery('habit_completions', {
        select: 'habit_id,date,habits!inner(user_id)',
        filters: [`habits.user_id=eq.${userId}`],
      });
      const fresh = rows ?? [];
      await writeCache(ENTITY_COMP, userId, fresh);
      return toMap(fresh);
    } catch { /* fall through */ }
  }

  return toMap(cachedRows);
}

export async function markCompletion(habitId, date, userId) {
  const row = { habit_id: habitId, date };

  await patchCache(ENTITY_COMP, userId ?? '_', (prev) => {
    // Avoid duplicates
    if (prev.some((r) => r.habit_id === habitId && r.date === date)) return prev;
    return [...prev, row];
  });

  if (await isOnline()) {
    try {
      await dbQuery('habit_completions', { method: 'POST', body: row });
      return;
    } catch { /* fall through */ }
  }

  await enqueue(userId ?? '_', {
    id: generateUUID(),
    entity: 'habit_completions',
    op: 'markCompletion',
    payload: { habitId, date },
    userId: userId ?? '_',
  });
}

export async function unmarkCompletion(habitId, date, userId) {
  await patchCache(ENTITY_COMP, userId ?? '_', (prev) =>
    prev.filter((r) => !(r.habit_id === habitId && r.date === date)),
  );

  if (await isOnline()) {
    try {
      await dbQuery('habit_completions', {
        method: 'DELETE',
        filters: [`habit_id=eq.${habitId}`, `date=eq.${date}`],
      });
      return;
    } catch { /* fall through */ }
  }

  await enqueue(userId ?? '_', {
    id: generateUUID(),
    entity: 'habit_completions',
    op: 'unmarkCompletion',
    payload: { habitId, date },
    userId: userId ?? '_',
  });
}
