import { dbQuery } from './supabaseClient';

export async function fetchSavings(userId) {
  return dbQuery('savings', {
    filters: [`user_id=eq.${userId}`],
    order: 'date.desc',
  });
}

export async function createSaving(userId, item) {
  return dbQuery('savings', {
    method: 'POST',
    body: { ...item, user_id: userId },
    single: true,
  });
}

export async function updateSaving(id, item) {
  return dbQuery('savings', {
    method: 'PATCH',
    body: item,
    filters: [`id=eq.${id}`],
    single: true,
  });
}

export async function deleteSaving(id) {
  return dbQuery('savings', {
    method: 'DELETE',
    filters: [`id=eq.${id}`],
  });
}

export async function fetchSavingCategories() {
  return dbQuery('saving_categories', { order: 'label.asc' });
}

export async function createSavingCategory(label) {
  return dbQuery('saving_categories', {
    method: 'POST',
    body: { label: label.trim() },
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
