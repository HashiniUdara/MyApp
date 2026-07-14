import { dbQuery } from './supabaseClient';
import { todayStr } from '../utils/dateUtils';

// Fetch only today + future todos
export async function fetchTodos(userId) {
  return dbQuery('todos', {
    filters: [`user_id=eq.${userId}`, `date=gte.${todayStr()}`],
    order: 'date.asc',
  });
}

// Delete all past todos for a user (called on app start)
export async function deletePastTodos(userId) {
  return dbQuery('todos', {
    method: 'DELETE',
    filters: [`user_id=eq.${userId}`, `date=lt.${todayStr()}`],
  });
}

export async function createTodo(userId, item) {
  return dbQuery('todos', { method: 'POST', body: { ...item, user_id: userId }, single: true });
}

export async function updateTodo(id, patch) {
  return dbQuery('todos', { method: 'PATCH', body: patch, filters: [`id=eq.${id}`], single: true });
}

export async function deleteTodo(id) {
  return dbQuery('todos', { method: 'DELETE', filters: [`id=eq.${id}`] });
}

export async function fetchTodoCategories() {
  return dbQuery('todo_categories');
}
