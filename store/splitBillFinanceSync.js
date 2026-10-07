/**
 * splitBillFinanceSync.js
 *
 * Keeps the daily finance (transactions) section in sync with
 * split-bill activity:
 *
 *   1. Split bill expense saved (create / update)
 *      → the app-user's personal share is written as an EXPENSE
 *        transaction.  On update the previous transaction is replaced.
 *
 *   2. Split bill expense deleted
 *      → the linked EXPENSE transaction is removed.
 *
 * Linking strategy — zero DB schema changes:
 *   AsyncStorage key  "sb_tx_ref:{userId}"
 *   Value: JSON map   { "sb_exp:{expenseId}": txId, … }
 *
 * Public API:
 *   ensureSplitBillCategory(userId)
 *   syncExpense({ userId, expense, groupName, isUpdate })
 *   removeExpenseSync({ userId, expenseId })
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTransaction, updateTransaction, deleteTransaction } from './transactionApi';
import { fetchTransactionCategoryRows, createTransactionCategory } from './categoryApi';
import { STORAGE_KEYS, SPLIT_BILL_FINANCE } from '../config/appConstants';

// ─── Constants (from config) ──────────────────────────────────────

const SPLIT_BILL_CATEGORY = SPLIT_BILL_FINANCE.category;
const SUBCATEGORY_EXPENSE = SPLIT_BILL_FINANCE.subcategoryExpense;

// ─── Ref-map helpers ──────────────────────────────────────────────
// A small AsyncStorage map links each split-bill expense to the
// transaction ID that was auto-created for it.

function refMapKey(userId) {
  return `${STORAGE_KEYS.splitBillTxRefPrefix}:${userId}`;
}

async function loadRefMap(userId) {
  try {
    const raw = await AsyncStorage.getItem(refMapKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveRefMap(userId, map) {
  try {
    await AsyncStorage.setItem(refMapKey(userId), JSON.stringify(map));
  } catch { /* storage full — silently ignore */ }
}

async function getLinkedTxId(userId, refKey) {
  const map = await loadRefMap(userId);
  return map[refKey] ?? null;
}

async function setLinkedTxId(userId, refKey, txId) {
  const map = await loadRefMap(userId);
  map[refKey] = txId;
  await saveRefMap(userId, map);
}

async function removeLinkedTxId(userId, refKey) {
  const map = await loadRefMap(userId);
  delete map[refKey];
  await saveRefMap(userId, map);
}

// ─── Internal: delete a previously linked transaction ─────────────

async function _deletePreviousTx(userId, refKey) {
  const txId = await getLinkedTxId(userId, refKey);
  if (!txId) return;
  try {
    await deleteTransaction(txId, userId);
  } catch { /* already deleted — ignore */ }
  await removeLinkedTxId(userId, refKey);
}

// ─── Category bootstrap ───────────────────────────────────────────

/**
 * Ensure the "Split Bill" expense category exists for this user.
 * Idempotent — safe to call on every screen mount.
 */
export async function ensureSplitBillCategory(userId) {
  const rows = await fetchTransactionCategoryRows(userId);

  const hasExpense = rows.some(
    (r) => r.type === 'expense' && r.name === SPLIT_BILL_CATEGORY,
  );

  if (!hasExpense) {
    await createTransactionCategory(userId, 'expense', SPLIT_BILL_CATEGORY, [
      SUBCATEGORY_EXPENSE,
    ]);
  }
}

// ─── Compute user's share from a normalised expense object ────────

function computeUserShare(expense, userId) {
  const { splits, splitWith, amount } = expense;

  // User is not a participant at all
  if (!splitWith || !splitWith.includes(userId)) return 0;

  // Use the pre-computed splits map when available
  if (splits && typeof splits === 'object' && userId in splits) {
    return Number(splits[userId]) || 0;
  }

  // Fallback: equal division
  const n = splitWith.length;
  if (n === 0) return 0;
  return Number((Number(amount) / n).toFixed(2));
}

// ─── Expense sync ─────────────────────────────────────────────────

/**
 * syncExpense({ userId, expense, groupName, isUpdate })
 *
 * expense must be the normalised shape used in SplitBillsScreen state:
 *   { id, amount, date, description, splits, splitWith, paidBy, groupId }
 *
 * groupName: display label of the group (appended to the description)
 * isUpdate:  true when editing an existing expense
 */
export async function syncExpense({ userId, expense, groupName = '', isUpdate = false }) {
  const refKey    = `sb_exp:${expense.id}`;
  const userShare = computeUserShare(expense, userId);

  // User has no share (e.g. removed from split, or amount set to 0) —
  // clean up any previously linked finance entry.
  if (userShare <= 0) {
    await _deletePreviousTx(userId, refKey);
    return;
  }

  const dateStr = expense.date
    ? `${expense.date} 00:00`
    : `${new Date().toISOString().slice(0, 10)} 00:00`;

  const groupLabel  = groupName ? ` [${groupName}]` : '';
  const description = `${expense.description}${groupLabel}`;

  const txBody = {
    type: 'expense',
    category: SPLIT_BILL_CATEGORY,
    subcategory: SUBCATEGORY_EXPENSE,
    description,
    amount: userShare,
    date: dateStr,
    user_id: userId,
  };

  const existingTxId = await getLinkedTxId(userId, refKey);

  if (isUpdate && existingTxId) {
    // Update the existing linked transaction in-place
    await updateTransaction(existingTxId, { ...txBody, user_id: userId });
  } else {
    // Remove any orphaned old transaction first
    if (existingTxId) {
      try { await deleteTransaction(existingTxId, userId); } catch { /* already gone */ }
    }
    const saved = await createTransaction(userId, txBody);
    await setLinkedTxId(userId, refKey, saved.id);
  }
}

// ─── Expense delete sync ──────────────────────────────────────────

/**
 * removeExpenseSync({ userId, expenseId })
 * Call after a split bill expense is deleted to remove the linked
 * finance transaction.
 */
export async function removeExpenseSync({ userId, expenseId }) {
  await _deletePreviousTx(userId, `sb_exp:${expenseId}`);
}
