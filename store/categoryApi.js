import { dbQuery } from './supabaseClient';

// ── Transaction categories (per user) ─────────────────────────────
export async function fetchTransactionCategoryRows(userId) {
  return dbQuery('transaction_categories', {
    filters: [`user_id=eq.${userId}`],
    order: 'id.asc',
  });
}

export async function createTransactionCategory(userId, type, name, subcategories = []) {
  return dbQuery('transaction_categories', {
    method: 'POST',
    body: { user_id: userId, type, name, subcategories },
    single: true,
  });
}

export async function updateTransactionCategory(id, patch) {
  return dbQuery('transaction_categories', {
    method: 'PATCH',
    body: patch,
    filters: [`id=eq.${id}`],
    single: true,
  });
}

export async function deleteTransactionCategory(id) {
  return dbQuery('transaction_categories', {
    method: 'DELETE',
    filters: [`id=eq.${id}`],
  });
}

// ── Todo categories (per user) ────────────────────────────────────
const toSlug = (text, userId) =>
  `${String(text || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'') || 'cat'}_${userId.slice(0,8)}_${Date.now()}`;

export async function fetchTodoCategoryRows(userId) {
  return dbQuery('todo_categories', {
    filters: [`user_id=eq.${userId}`],
    order: 'label.asc',
  });
}

export async function createTodoCategory(userId, { label, icon = 'pricetag-outline', color = '#2DA49E' }) {
  return dbQuery('todo_categories', {
    method: 'POST',
    body: { id: toSlug(label, userId), user_id: userId, label, icon, color },
    single: true,
  });
}

export async function updateTodoCategory(id, patch) {
  return dbQuery('todo_categories', {
    method: 'PATCH',
    body: patch,
    filters: [`id=eq.${id}`],
    single: true,
  });
}

export async function deleteTodoCategory(id) {
  return dbQuery('todo_categories', {
    method: 'DELETE',
    filters: [`id=eq.${id}`],
  });
}

// ── Saving categories (per user) ──────────────────────────────────
export async function fetchSavingCategories(userId) {
  return dbQuery('saving_categories', {
    filters: [`user_id=eq.${userId}`],
    order: 'label.asc',
  });
}

export async function createSavingCategory(userId, label) {
  return dbQuery('saving_categories', {
    method: 'POST',
    body: { user_id: userId, label },
    single: true,
  });
}

export async function updateSavingCategory(id, patch) {
  return dbQuery('saving_categories', {
    method: 'PATCH',
    body: patch,
    filters: [`id=eq.${id}`],
    single: true,
  });
}

export async function deleteSavingCategory(id) {
  return dbQuery('saving_categories', {
    method: 'DELETE',
    filters: [`id=eq.${id}`],
  });
}
