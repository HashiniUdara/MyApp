import { useState, useEffect, useCallback, useMemo } from 'react';
import { todayStr } from '../../utils/dateUtils';
import { fetchTodos, createTodo, updateTodo, deleteTodo, deletePastTodos } from '../todoApi';

export function useTodoStore(userId) {
  const [todos,   setTodos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      // Clean up past todos first, then load
      await deletePastTodos(userId).catch(() => {});
      setTodos(await fetchTodos(userId) ?? []);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const addTodo = useCallback(async ({ title, notes, category, date, time }) => {
    try {
      const saved = await createTodo(userId, {
        title: title.trim(), notes: (notes ?? '').trim(),
        category, date: date || todayStr(), time: time || null, completed: false,
      });
      setTodos(prev => [...prev, saved]);
      return saved.id;
    } catch (e) { setError(e.message); }
  }, [userId]);

  const updateTodoItem = useCallback(async (id, patch) => {
    try {
      const saved = await updateTodo(id, patch);
      setTodos(prev => prev.map(t => t.id === id ? saved : t));
    } catch (e) { setError(e.message); }
  }, []);

  const removeTodo = useCallback(async (id) => {
    try {
      await deleteTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (e) { setError(e.message); }
  }, []);

  const toggleComplete = useCallback(async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    await updateTodoItem(id, { completed: !todo.completed });
  }, [todos, updateTodoItem]);

  const todosForDate = useCallback((dateStr) =>
    todos.filter(t => t.date === dateStr)
         .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99')),
  [todos]);

  const categoryCounts = useCallback((dateStr) => {
    const scoped = dateStr ? todos.filter(t => t.date === dateStr) : todos;
    return scoped.reduce((acc, t) => {
      const c = acc[t.category] ?? { total: 0, completed: 0 };
      c.total++;
      if (t.completed) c.completed++;
      acc[t.category] = c;
      return acc;
    }, {});
  }, [todos]);

  const datesWithTodos = useMemo(() => new Set(todos.map(t => t.date)), [todos]);

  // Today's todo summary for TodayScreen
  const todaySummary = useMemo(() => {
    const today = todos.filter(t => t.date === todayStr());
    return { total: today.length, completed: today.filter(t => t.completed).length };
  }, [todos]);

  return {
    todos, loading, error,
    addTodo, updateTodo: updateTodoItem,
    removeTodo, toggleComplete,
    todosForDate, categoryCounts, datesWithTodos,
    todaySummary,
    reload: load,
  };
}
