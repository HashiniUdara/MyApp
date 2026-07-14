import { dbQuery } from './supabaseClient';

export async function fetchTransactions(userId) {
  return dbQuery('transactions', {
    filters: [`user_id=eq.${userId}`],
    order: 'date.desc',
  });
}

export async function createTransaction(userId, item) {
  return dbQuery('transactions', {
    method: 'POST',
    body: { ...item, user_id: userId },
    single: true,
  });
}

export async function updateTransaction(id, item) {
  return dbQuery('transactions', {
    method: 'PATCH', body: item,
    filters: [`id=eq.${id}`], single: true,
  });
}

export async function deleteTransaction(id) {
  return dbQuery('transactions', { method: 'DELETE', filters: [`id=eq.${id}`] });
}

export async function fetchTransactionCategories() {
  const data = await dbQuery('transaction_categories', { order: 'id.asc' });
  const expense = {}, income = {};
  (data ?? []).forEach(row => {
    if (row.type === 'expense') expense[row.name] = row.subcategories;
    else                        income[row.name]  = row.subcategories;
  });
  return { expense, income };
}
