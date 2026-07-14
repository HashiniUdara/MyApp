import { dbQuery } from './supabaseClient';

export async function fetchNotes(userId) {
  return dbQuery('notes', {
    filters: [`user_id=eq.${userId}`],
    order: 'updated_at.desc',
  });
}

export async function createNote(userId, item) {
  return dbQuery('notes', {
    method: 'POST',
    body: { ...item, user_id: userId },
    single: true,
  });
}

export async function updateNote(id, patch) {
  return dbQuery('notes', {
    method: 'PATCH',
    body: { ...patch, updated_at: new Date().toISOString() },
    filters: [`id=eq.${id}`],
    single: true,
  });
}

export async function deleteNote(id) {
  return dbQuery('notes', { method: 'DELETE', filters: [`id=eq.${id}`] });
}
