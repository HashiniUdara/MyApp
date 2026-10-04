/**
 * splitBillApi.js  — offline-first
 *
 * Four entities: split_bill_people, split_bill_groups,
 *                split_bill_expenses, split_bill_settlements.
 */

import { dbQuery } from './supabaseClient';
import { readCache, writeCache, patchCache, enqueue } from '../utils/offlineStorage';
import { isOnline } from '../utils/networkStatus';
import { generateUUID } from '../utils/uuid';

// ─── generic helpers ──────────────────────────────────────────────

async function _fetch(entity, userId, order) {
  const cached = await readCache(entity, userId);
  if (await isOnline()) {
    try {
      const data = await dbQuery(entity, { filters: [`user_id=eq.${userId}`], order });
      const fresh = data ?? [];
      await writeCache(entity, userId, fresh);
      return fresh;
    } catch { /* fall through */ }
  }
  return cached;
}

async function _create(entity, userId, body) {
  const record = { ...body, id: generateUUID(), user_id: userId, created_at: new Date().toISOString() };
  await patchCache(entity, userId, (prev) => [...prev, record]);
  if (await isOnline()) {
    try {
      const saved = await dbQuery(entity, { method: 'POST', body: record, single: true });
      await patchCache(entity, userId, (prev) => prev.map((r) => (r.id === record.id ? saved : r)));
      return saved;
    } catch { /* fall through */ }
  }
  await enqueue(userId, { id: generateUUID(), entity, op: 'create', payload: record, userId });
  return record;
}

async function _update(entity, userId, id, body) {
  await patchCache(entity, userId, (prev) =>
    prev.map((r) => (r.id === id ? { ...r, ...body } : r)),
  );
  if (await isOnline()) {
    try {
      return await dbQuery(entity, { method: 'PATCH', body, filters: [`id=eq.${id}`], single: true });
    } catch { /* fall through */ }
  }
  await enqueue(userId, { id: generateUUID(), entity, op: 'update', recordId: id, payload: body, userId });
  return { id, ...body };
}

async function _delete(entity, userId, id) {
  await patchCache(entity, userId, (prev) => prev.filter((r) => r.id !== id));
  if (await isOnline()) {
    try {
      await dbQuery(entity, { method: 'DELETE', filters: [`id=eq.${id}`] });
      return;
    } catch { /* fall through */ }
  }
  await enqueue(userId, { id: generateUUID(), entity, op: 'delete', recordId: id, userId });
}

// ─── People ───────────────────────────────────────────────────────

const PEOPLE = 'split_bill_people';

export const fetchSplitBillPeople   = (userId)         => _fetch(PEOPLE, userId, 'created_at.asc');
export const createSplitBillPerson  = (userId, person) => _create(PEOPLE, userId, person);
export const updateSplitBillPerson  = (id, person, userId) => _update(PEOPLE, userId, id, person);
export const deleteSplitBillPerson  = (id, userId)     => _delete(PEOPLE, userId, id);

// ─── Groups ───────────────────────────────────────────────────────

const GROUPS = 'split_bill_groups';

export const fetchSplitBillGroups   = (userId)        => _fetch(GROUPS, userId, 'created_at.asc');
export const createSplitBillGroup   = (userId, group) => _create(GROUPS, userId, group);
export const updateSplitBillGroup   = (id, group, userId) => _update(GROUPS, userId, id, group);
export const deleteSplitBillGroup   = (id, userId)    => _delete(GROUPS, userId, id);

// ─── Expenses ─────────────────────────────────────────────────────

const EXPENSES = 'split_bill_expenses';

export const fetchSplitBillExpenses  = (userId)          => _fetch(EXPENSES, userId, 'created_at.desc');
export const createSplitBillExpense  = (userId, expense) => _create(EXPENSES, userId, expense);
export const updateSplitBillExpense  = (id, expense, userId) => _update(EXPENSES, userId, id, expense);
export const deleteSplitBillExpense  = (id, userId)      => _delete(EXPENSES, userId, id);

// ─── Settlements ──────────────────────────────────────────────────

const SETTLEMENTS = 'split_bill_settlements';

export async function fetchSplitBillSettlements(userId) {
  return _fetch(SETTLEMENTS, userId, 'created_at.desc');
}

export async function createSplitBillSettlement(userId, settlement) {
  return _create(SETTLEMENTS, userId, settlement);
}
