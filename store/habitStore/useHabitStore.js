import { useState, useEffect, useCallback } from 'react';
import {
  fetchHabits, createHabit, updateHabit, deleteHabit,
  fetchCompletions, markCompletion, unmarkCompletion,
} from '../habitApi';

const COLORS = ['#CFCFF9', '#446949', '#E7A6CA', '#ECC657', '#215B80', '#F6CDBC', '#9BC0AA', '#D8EDF2'];

export function useHabitStore(userId) {
  const [habits,      setHabits]      = useState([]);
  const [completions, setCompletions] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const [h, c] = await Promise.all([fetchHabits(userId), fetchCompletions(userId)]);
      setHabits(h ?? []);
      setCompletions(c);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const addHabit = useCallback(async ({ name, emoji, color }) => {
    try {
      const saved = await createHabit(userId, { name, emoji, color });
      setHabits(prev => [...prev, saved]);
    } catch (e) { setError(e.message); }
  }, [userId]);

  const editHabit = useCallback(async (id, patch) => {
    try {
      const saved = await updateHabit(id, patch);
      setHabits(prev => prev.map(h => h.id === id ? saved : h));
      return saved;
    } catch (e) { setError(e.message); }
  }, []);

  const removeHabit = useCallback(async (id) => {
    try {
      await deleteHabit(id);
      setHabits(prev => prev.filter(h => h.id !== id));
      setCompletions(prev => { const c = { ...prev }; delete c[id]; return c; });
    } catch (e) { setError(e.message); }
  }, []);

  const toggleDay = useCallback(async (habitId, dateStr) => {
    const done = !!(completions[habitId]?.[dateStr]);
    setCompletions(prev => {
      const map = { ...(prev[habitId] ?? {}) };
      if (done) delete map[dateStr]; else map[dateStr] = true;
      return { ...prev, [habitId]: map };
    });
    try {
      if (done) await unmarkCompletion(habitId, dateStr);
      else      await markCompletion(habitId, dateStr);
    } catch (e) {
      setCompletions(prev => {
        const map = { ...(prev[habitId] ?? {}) };
        if (done) map[dateStr] = true; else delete map[dateStr];
        return { ...prev, [habitId]: map };
      });
      setError(e.message);
    }
  }, [completions]);

  const isDone = useCallback((habitId, dateStr) =>
    !!(completions[habitId]?.[dateStr]), [completions]);

  const monthCount = useCallback((habitId, yearMonth) => {
    const map = completions[habitId] ?? {};
    return Object.keys(map).filter(d => d.startsWith(yearMonth) && map[d]).length;
  }, [completions]);

  const streak = useCallback((habitId) => {
    const map = completions[habitId] ?? {};
    let count = 0, d = new Date();
    while (true) {
      const key = d.toISOString().split('T')[0];
      if (!map[key]) break;
      count++; d.setDate(d.getDate() - 1);
    }
    return count;
  }, [completions]);

  return { habits, loading, error, COLORS, addHabit, editHabit, removeHabit, toggleDay, isDone, monthCount, streak, reload: load };
}
