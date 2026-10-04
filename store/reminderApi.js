/**
 * reminderApi.js  — offline-first
 *
 * Reminders are seeded server-side on new user creation (DB trigger),
 * so there's always exactly 3 rows per user.  We cache them locally
 * and optimistically apply any PATCH updates.
 * "ensureDefaultReminders" is skipped offline — the cached rows are
 * used directly, which is fine because they were fetched on first run.
 */

import { dbQuery } from './supabaseClient';
import { readCache, writeCache, patchCache, enqueue } from '../utils/offlineStorage';
import { isOnline } from '../utils/networkStatus';
import { generateUUID } from '../utils/uuid';

const ENTITY = 'reminders';

const DEFAULT_REMINDERS = [
  { id: 'transactions', label: 'Log Transactions', enabled: false, hour: 21, minute: 0 },
  { id: 'todos',        label: 'Review Todos',     enabled: false, hour: 20, minute: 0 },
  { id: 'habits',       label: 'Check Habits',     enabled: false, hour: 22, minute: 0 },
];

export async function ensureDefaultReminders(userId) {
  if (await isOnline()) {
    try {
      const existing = await dbQuery(ENTITY, { filters: [`user_id=eq.${userId}`] });
      const ids = new Set((existing ?? []).map((r) => r.id));
      const missing = DEFAULT_REMINDERS.filter((r) => !ids.has(r.id));
      if (missing.length) {
        await dbQuery(ENTITY, {
          method: 'POST',
          body: missing.map((r) => ({ ...r, user_id: userId })),
        });
      }
      const all = await dbQuery(ENTITY, { filters: [`user_id=eq.${userId}`], order: 'id.asc' });
      const fresh = all ?? [];
      await writeCache(ENTITY, userId, fresh);
      return fresh;
    } catch { /* fall through */ }
  }

  // Offline path — return cache, seeding with defaults if empty
  const cached = await readCache(ENTITY, userId);
  if (cached.length) return cached;

  // First run offline — use in-memory defaults so the UI isn't broken
  const defaults = DEFAULT_REMINDERS.map((r) => ({ ...r, user_id: userId }));
  await writeCache(ENTITY, userId, defaults);
  return defaults;
}

export async function fetchReminders(userId) {
  return ensureDefaultReminders(userId);
}

export async function saveReminder(userId, id, { enabled, hour, minute }) {
  const patch = { enabled, hour, minute, updated_at: new Date().toISOString() };

  await patchCache(ENTITY, userId, (prev) =>
    prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  );

  if (await isOnline()) {
    try {
      return await dbQuery(ENTITY, {
        method: 'PATCH',
        body: patch,
        filters: [`id=eq.${id}`, `user_id=eq.${userId}`],
      });
    } catch { /* fall through */ }
  }

  await enqueue(userId, {
    id: generateUUID(),
    entity: ENTITY,
    op: 'update',
    // reminders use a text PK ('transactions', 'todos', 'habits')
    recordId: id,
    payload: patch,
    userId,
  });
}
