/**
 * syncQueue.js
 *
 * Drains the pending-operations queue for a user by replaying each
 * enqueued operation against Supabase in order.
 *
 * Called from:
 *   • useAppStore  – on every app load (after connectivity check)
 *   • App.js       – when AppState changes to 'active'
 *
 * Operation schema stored in AsyncStorage:
 * {
 *   id:          string   — unique op ID (UUID)
 *   entity:      string   — Supabase table name  e.g. 'transactions'
 *   op:          'create' | 'update' | 'delete' | 'upsert'
 *   recordId:    string   — the record's id (for update/delete)
 *   payload:     object   — body to send  (for create/update/upsert)
 *   userId:      string   — owner user id
 *   enqueuedAt:  number   — Date.now() when queued
 *   conflictCols?: string — e.g. 'user_id,month'  (for upsert)
 * }
 *
 * Returns { synced: number, failed: number }
 */

import { readQueue, writeQueue } from './offlineStorage';
import { dbQuery, SUPABASE_URL, SUPABASE_ANON, getAuthToken } from '../store/supabaseClient';

/**
 * Execute a single queued operation against Supabase.
 * Throws on failure so the caller can decide to keep or drop it.
 */
async function executeOp(op) {
  const { entity, op: kind, recordId, payload, conflictCols } = op;

  switch (kind) {
    case 'create':
      await dbQuery(entity, { method: 'POST', body: payload });
      break;

    case 'update':
      await dbQuery(entity, {
        method: 'PATCH',
        body: payload,
        filters: [`id=eq.${recordId}`],
      });
      break;

    case 'delete':
      await dbQuery(entity, {
        method: 'DELETE',
        filters: [`id=eq.${recordId}`],
      });
      break;

    case 'upsert': {
      // Budget uses a custom upsert with on_conflict — replicate it here
      const token = getAuthToken() ?? SUPABASE_ANON;
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${entity}?on_conflict=${conflictCols}&select=*`,
        {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      break;
    }

    case 'markCompletion':
      await dbQuery('habit_completions', {
        method: 'POST',
        body: { habit_id: payload.habitId, date: payload.date },
      });
      break;

    case 'unmarkCompletion':
      await dbQuery('habit_completions', {
        method: 'DELETE',
        filters: [
          `habit_id=eq.${payload.habitId}`,
          `date=eq.${payload.date}`,
        ],
      });
      break;

    default:
      // Unknown op type — silently discard
      break;
  }
}

/**
 * Flush all pending operations for userId.
 * Stops on the first network error (keeps remaining ops for next attempt).
 * Permanently drops ops that fail with a 4xx (conflict, gone, etc.).
 */
export async function flushQueue(userId) {
  const queue = await readQueue(userId);
  if (!queue.length) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining = [];

  for (const op of queue) {
    try {
      await executeOp(op);
      synced++;
    } catch (err) {
      const msg = String(err.message ?? '');
      // 4xx errors mean the server rejected it (conflict, not found, etc.)
      // Drop them so they don't block the queue forever.
      const isClientError = /\b4\d\d\b/.test(msg);
      if (isClientError) {
        console.warn(`[syncQueue] Dropped op ${op.id} (${op.entity}/${op.op}):`, msg);
        failed++;
      } else {
        // Network error — keep remainder and stop processing
        remaining.push(op, ...queue.slice(queue.indexOf(op) + 1));
        break;
      }
    }
  }

  await writeQueue(userId, remaining);
  return { synced, failed };
}

/**
 * Returns the count of pending operations for userId.
 */
export async function pendingCount(userId) {
  const q = await readQueue(userId);
  return q.length;
}
