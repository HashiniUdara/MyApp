/**
 * useAppStore.js — offline-first
 *
 * Manages transactions (expenses + incomes).
 * On mount: flushes any pending sync queue, then loads data (cache-first).
 * Exposes `syncing` and `pendingOps` so the UI can show a sync banner.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchTransactions, createTransaction,
  updateTransaction, deleteTransaction,
} from './transactionApi';
import { flushQueue, pendingCount } from '../utils/syncQueue';
import { isOnline } from '../utils/networkStatus';

export function useAppStore(userId) {
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [syncing,      setSyncing]      = useState(false);
  const [pendingOps,   setPendingOps]   = useState(0);

  const expenses = transactions.filter(t => t.type === 'expense');
  const incomes  = transactions.filter(t => t.type === 'income');

  // ── Refresh pending count ──────────────────────────────────────
  const refreshPending = useCallback(async () => {
    if (!userId) return;
    const count = await pendingCount(userId);
    setPendingOps(count);
  }, [userId]);

  // ── Flush queue then reload ────────────────────────────────────
  const sync = useCallback(async () => {
    if (!userId) return;
    if (!(await isOnline())) { await refreshPending(); return; }
    setSyncing(true);
    try {
      await flushQueue(userId);
    } finally {
      setSyncing(false);
      await refreshPending();
    }
  }, [userId, refreshPending]);

  // ── Load transactions (cache-first) ───────────────────────────
  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      // Attempt to drain the queue before loading so we see fresh data
      await sync();
      const data = await fetchTransactions(userId);
      setTransactions(data ?? []);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }, [userId, sync]);

  useEffect(() => { load(); }, [load]);

  // ── CRUD ──────────────────────────────────────────────────────

  const addExpense = async (item) => {
    try {
      const saved = await createTransaction(userId, { ...item, type: 'expense' });
      setTransactions(prev => [saved, ...prev.filter(t => t.id !== saved.id)]);
      await refreshPending();
    } catch (e) { setError(e.message); }
  };

  const addIncome = async (item) => {
    try {
      const saved = await createTransaction(userId, { ...item, type: 'income' });
      setTransactions(prev => [saved, ...prev.filter(t => t.id !== saved.id)]);
      await refreshPending();
    } catch (e) { setError(e.message); }
  };

  const updateExpense = async (id, item) => {
    try {
      const updated = await updateTransaction(id, { ...item, type: 'expense', user_id: userId });
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
      await refreshPending();
    } catch (e) { setError(e.message); }
  };

  const updateIncome = async (id, item) => {
    try {
      const updated = await updateTransaction(id, { ...item, type: 'income', user_id: userId });
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
      await refreshPending();
    } catch (e) { setError(e.message); }
  };

  const removeExpense = async (i) => {
    const target = expenses[i];
    if (!target) return;
    try {
      await deleteTransaction(target.id, userId);
      setTransactions(prev => prev.filter(t => t.id !== target.id));
      await refreshPending();
    } catch (e) { setError(e.message); }
  };

  const removeIncome = async (i) => {
    const target = incomes[i];
    if (!target) return;
    try {
      await deleteTransaction(target.id, userId);
      setTransactions(prev => prev.filter(t => t.id !== target.id));
      await refreshPending();
    } catch (e) { setError(e.message); }
  };

  return {
    transactions, expenses, incomes,
    loading, error, syncing, pendingOps,
    addExpense, addIncome, updateExpense, updateIncome,
    removeExpense, removeIncome,
    reload: load, sync,
  };
}
