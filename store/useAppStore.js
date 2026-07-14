import { useState, useEffect, useCallback } from 'react';
import {
  fetchTransactions, createTransaction,
  updateTransaction, deleteTransaction,
} from './transactionApi';

export function useAppStore(userId) {
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const expenses = transactions.filter(t => t.type === 'expense');
  const incomes  = transactions.filter(t => t.type === 'income');

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const data = await fetchTransactions(userId);
      setTransactions(data ?? []);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const addExpense = async (item) => {
    try {
      const saved = await createTransaction(userId, { ...item, type: 'expense' });
      setTransactions(prev => [...prev, saved]);
    } catch (e) { setError(e.message); }
  };

  const addIncome = async (item) => {
    try {
      const saved = await createTransaction(userId, { ...item, type: 'income' });
      setTransactions(prev => [...prev, saved]);
    } catch (e) { setError(e.message); }
  };

  const updateExpense = async (id, item) => {
    try {
      const updated = await updateTransaction(id, { ...item, type: 'expense' });
      setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    } catch (e) { setError(e.message); }
  };

  const updateIncome = async (id, item) => {
    try {
      const updated = await updateTransaction(id, { ...item, type: 'income' });
      setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    } catch (e) { setError(e.message); }
  };

  const removeExpense = async (i) => {
    const target = expenses[i];
    if (!target) return;
    try {
      await deleteTransaction(target.id);
      setTransactions(prev => prev.filter(t => t.id !== target.id));
    } catch (e) { setError(e.message); }
  };

  const removeIncome = async (i) => {
    const target = incomes[i];
    if (!target) return;
    try {
      await deleteTransaction(target.id);
      setTransactions(prev => prev.filter(t => t.id !== target.id));
    } catch (e) { setError(e.message); }
  };

  return {
    transactions, expenses, incomes, loading, error,
    addExpense, addIncome, updateExpense, updateIncome,
    removeExpense, removeIncome,
    reload: load,
  };
}
