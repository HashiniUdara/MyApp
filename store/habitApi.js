import { dbQuery } from './supabaseClient';

export async function fetchHabits(userId) {
  return dbQuery('habits', { filters: [`user_id=eq.${userId}`], order: 'created_at.asc' });
}

export async function createHabit(userId, item) {
  return dbQuery('habits', { method: 'POST', body: { ...item, user_id: userId }, single: true });
}

export async function updateHabit(id, patch) {
  return dbQuery('habits', { method: 'PATCH', body: patch, filters: [`id=eq.${id}`], single: true });
}

export async function deleteHabit(id) {
  return dbQuery('habits', { method: 'DELETE', filters: [`id=eq.${id}`] });
}

export async function fetchCompletions(userId) {
  // Join through habits to only get this user's completions
  const rows = await dbQuery('habit_completions', {
    select: 'habit_id,date,habits!inner(user_id)',
    filters: [`habits.user_id=eq.${userId}`],
  });
  const map = {};
  (rows ?? []).forEach(({ habit_id, date }) => {
    map[habit_id] ??= {};
    map[habit_id][date] = true;
  });
  return map;
}

export async function markCompletion(habitId, date) {
  return dbQuery('habit_completions', { method: 'POST', body: { habit_id: habitId, date } });
}

export async function unmarkCompletion(habitId, date) {
  return dbQuery('habit_completions', {
    method: 'DELETE',
    filters: [`habit_id=eq.${habitId}`, `date=eq.${date}`],
  });
}
