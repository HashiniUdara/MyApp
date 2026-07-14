import { dbQuery } from './supabaseClient';

const DEFAULT_REMINDERS = [
  { id: 'transactions', label: 'Log Transactions', enabled: false, hour: 21, minute: 0 },
  { id: 'todos',        label: 'Review Todos',     enabled: false, hour: 20, minute: 0 },
  { id: 'habits',       label: 'Check Habits',     enabled: false, hour: 22, minute: 0 },
];

export async function ensureDefaultReminders(userId) {
  const existing = await dbQuery('reminders', { filters: [`user_id=eq.${userId}`] });
  const ids = new Set((existing ?? []).map(r => r.id));
  const missing = DEFAULT_REMINDERS.filter(r => !ids.has(r.id));
  if (missing.length) {
    await dbQuery('reminders', {
      method: 'POST',
      body: missing.map(r => ({ ...r, user_id: userId })),
    });
  }
  return dbQuery('reminders', { filters: [`user_id=eq.${userId}`], order: 'id.asc' });
}

export async function fetchReminders(userId) {
  return ensureDefaultReminders(userId);
}

export async function saveReminder(userId, id, { enabled, hour, minute }) {
  return dbQuery('reminders', {
    method: 'PATCH',
    body: { enabled, hour, minute, updated_at: new Date().toISOString() },
    filters: [`id=eq.${id}`, `user_id=eq.${userId}`],
  });
}
