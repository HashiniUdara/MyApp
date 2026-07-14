import { SUPABASE_URL, SUPABASE_ANON, getAuthToken, dbQuery } from './supabaseClient';

export async function fetchBudget(userId, month) {
  return dbQuery('monthly_budgets', {
    filters: [`user_id=eq.${userId}`, `month=eq.${month}`],
    single: true,
  });
}

export async function upsertBudget(userId, month, amount) {
  const token = getAuthToken() ?? SUPABASE_ANON;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/monthly_budgets?on_conflict=user_id,month&select=*`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({ user_id: userId, month, amount }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data[0] ?? null;
}
