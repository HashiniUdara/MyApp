/**
 * budgetApi.js  — offline-first
 *
 * Budget uses an upsert (insert-or-update by user_id + month).
 * Offline: store a single record per month in cache, queue a 'upsert' op.
 */

import { SUPABASE_URL, SUPABASE_ANON, getAuthToken, dbQuery } from './supabaseClient';
import { readCache, writeCache, patchCache, enqueue } from '../utils/offlineStorage';
import { isOnline } from '../utils/networkStatus';
import { generateUUID } from '../utils/uuid';

const ENTITY = 'monthly_budgets';

export async function fetchBudget(userId, month) {
  // Check cache first
  const cached = await readCache(ENTITY, userId);
  const fromCache = (cached ?? []).find((b) => b.month === month) ?? null;

  if (await isOnline()) {
    try {
      const record = await dbQuery(ENTITY, {
        filters: [`user_id=eq.${userId}`, `month=eq.${month}`],
        single: true,
      });
      // Merge into cache
      await patchCache(ENTITY, userId, (prev) => {
        const without = prev.filter((b) => b.month !== month);
        return record ? [...without, record] : without;
      });
      return record;
    } catch { /* fall through */ }
  }

  return fromCache;
}

export async function upsertBudget(userId, month, amount) {
  const record = { user_id: userId, month, amount, updated_at: new Date().toISOString() };

  // Update cache immediately
  await patchCache(ENTITY, userId, (prev) => {
    const without = prev.filter((b) => b.month !== month);
    return [...without, record];
  });

  if (await isOnline()) {
    try {
      const token = getAuthToken() ?? SUPABASE_ANON;
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${ENTITY}?on_conflict=user_id,month&select=*`,
        {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(record),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const saved = data[0] ?? null;
      if (saved) {
        await patchCache(ENTITY, userId, (prev) => {
          const without = prev.filter((b) => b.month !== month);
          return [...without, saved];
        });
      }
      return saved ?? record;
    } catch { /* fall through */ }
  }

  await enqueue(userId, {
    id: generateUUID(),
    entity: ENTITY,
    op: 'upsert',
    conflictCols: 'user_id,month',
    payload: record,
    userId,
  });
  return record;
}
