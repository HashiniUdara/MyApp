import { dbQuery } from './supabaseClient';

export async function fetchSplitBillPeople(userId) {
  return dbQuery('split_bill_people', {
    filters: [`user_id=eq.${userId}`],
    order: 'created_at.asc',
  });
}

export async function createSplitBillPerson(userId, person) {
  return dbQuery('split_bill_people', {
    method: 'POST',
    body: { ...person, user_id: userId },
    single: true,
  });
}

export async function updateSplitBillPerson(id, person) {
  return dbQuery('split_bill_people', {
    method: 'PATCH',
    body: person,
    filters: [`id=eq.${id}`],
    single: true,
  });
}

export async function deleteSplitBillPerson(id) {
  return dbQuery('split_bill_people', {
    method: 'DELETE',
    filters: [`id=eq.${id}`],
  });
}

export async function fetchSplitBillGroups(userId) {
  return dbQuery('split_bill_groups', {
    filters: [`user_id=eq.${userId}`],
    order: 'created_at.asc',
  });
}

export async function createSplitBillGroup(userId, group) {
  return dbQuery('split_bill_groups', {
    method: 'POST',
    body: { ...group, user_id: userId },
    single: true,
  });
}

export async function updateSplitBillGroup(id, group) {
  return dbQuery('split_bill_groups', {
    method: 'PATCH',
    body: group,
    filters: [`id=eq.${id}`],
    single: true,
  });
}

export async function deleteSplitBillGroup(id) {
  return dbQuery('split_bill_groups', {
    method: 'DELETE',
    filters: [`id=eq.${id}`],
  });
}

export async function fetchSplitBillExpenses(userId) {
  return dbQuery('split_bill_expenses', {
    filters: [`user_id=eq.${userId}`],
    order: 'created_at.desc',
  });
}

export async function createSplitBillExpense(userId, expense) {
  return dbQuery('split_bill_expenses', {
    method: 'POST',
    body: { ...expense, user_id: userId },
    single: true,
  });
}

export async function updateSplitBillExpense(id, expense) {
  return dbQuery('split_bill_expenses', {
    method: 'PATCH',
    body: expense,
    filters: [`id=eq.${id}`],
    single: true,
  });
}

export async function deleteSplitBillExpense(id) {
  return dbQuery('split_bill_expenses', {
    method: 'DELETE',
    filters: [`id=eq.${id}`],
  });
}
