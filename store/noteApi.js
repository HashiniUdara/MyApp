/**
 * noteApi.js  — offline-first
 */

import { dbQuery } from './supabaseClient';
import { readCache, writeCache, patchCache, enqueue } from '../utils/offlineStorage';
import { isOnline } from '../utils/networkStatus';
import { generateUUID } from '../utils/uuid';

const ENTITY = 'notes';

export async function fetchNotes(userId) {
  const cached = await readCache(ENTITY, userId);

  if (await isOnline()) {
    try {
      const data = await dbQuery(ENTITY, {
        filters: [`user_id=eq.${userId}`],
        order: 'updated_at.desc',
      });
      const fresh = data ?? [];
      await writeCache(ENTITY, userId, fresh);
      return fresh;
    } catch { /* fall through */ }
  }

  return cached.sort((a, b) =>
    (b.updated_at ?? '').localeCompare(a.updated_at ?? ''),
  );
}

export async function createNote(userId, item) {
  const now = new Date().toISOString();
  const record = { ...item, id: generateUUID(), user_id: userId, created_at: now, updated_at: now };

  await patchCache(ENTITY, userId, (prev) => [record, ...prev]);

  if (await isOnline()) {
    try {
      const saved = await dbQuery(ENTITY, { method: 'POST', body: record, single: true });
      await patchCache(ENTITY, userId, (prev) => prev.map((n) => (n.id === record.id ? saved : n)));
      return saved;
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: ENTITY, op: 'create', payload: record, userId });
  return record;
}

export async function updateNote(id, patch) {
  const now = new Date().toISOString();
  const fullPatch = { ...patch, updated_at: now };
  const userId = patch.user_id ?? '_';

  await patchCache(ENTITY, userId, (prev) =>
    prev.map((n) => (n.id === id ? { ...n, ...fullPatch } : n)),
  );

  if (await isOnline()) {
    try {
      return await dbQuery(ENTITY, {
        method: 'PATCH',
        body: fullPatch,
        filters: [`id=eq.${id}`],
        single: true,
      });
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: ENTITY, op: 'update', recordId: id, payload: fullPatch, userId });
  return { id, ...fullPatch };
}

export async function deleteNote(id, userId) {
  await patchCache(ENTITY, userId, (prev) => prev.filter((n) => n.id !== id));

  if (await isOnline()) {
    try {
      await dbQuery(ENTITY, { method: 'DELETE', filters: [`id=eq.${id}`] });
      return;
    } catch { /* fall through */ }
  }

  await enqueue(userId, { id: generateUUID(), entity: ENTITY, op: 'delete', recordId: id, userId });
}
