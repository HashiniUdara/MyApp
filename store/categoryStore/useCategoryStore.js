import { useState, useEffect, useCallback } from 'react';
import {
  fetchTransactionCategoryRows, createTransactionCategory, updateTransactionCategory, deleteTransactionCategory,
  fetchTodoCategoryRows, createTodoCategory, updateTodoCategory, deleteTodoCategory,
  fetchSavingCategories, createSavingCategory, updateSavingCategory, deleteSavingCategory,
} from '../categoryApi';

// ── In-code fallbacks (used only if DB fails) ─────────────────────
const FB_EXPENSE = { 'General': ['Expense'] };
const FB_INCOME  = { 'General': ['Income']  };
const FB_TODO    = [{ id: 'general', label: 'General', icon: 'pricetag-outline', color: '#2DA49E' }];
const FB_SAVING  = [{ id: 'general', label: 'General' }];

export function useCategoryStore(userId) {
  const [expenseCategories,       setExpenseCategories]       = useState(FB_EXPENSE);
  const [incomeCategories,        setIncomeCategories]        = useState(FB_INCOME);
  const [todoCategories,          setTodoCategories]          = useState(FB_TODO);
  const [savingCategories,        setSavingCategories]        = useState(FB_SAVING);
  const [transactionCategoryRows, setTransactionCategoryRows] = useState([]);
  const [loaded,                  setLoaded]                  = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [txCats, todoCats, savingCats] = await Promise.all([
        fetchTransactionCategoryRows(userId),
        fetchTodoCategoryRows(userId),
        fetchSavingCategories(userId),
      ]);

      if (txCats?.length) {
        setTransactionCategoryRows(txCats);
        const expense = {}, income = {};
        txCats.forEach(row => {
          if (row.type === 'expense') expense[row.name] = row.subcategories;
          else                        income[row.name]  = row.subcategories;
        });
        if (Object.keys(expense).length) setExpenseCategories(expense);
        if (Object.keys(income).length)  setIncomeCategories(income);
      }
      if (todoCats?.length)   setTodoCategories(todoCats);
      if (savingCats?.length) {
        const validSavingCats = savingCats.filter(row => row && row.label);
        if (validSavingCats.length) setSavingCategories(validSavingCats);
      }
    } catch (e) {
      console.warn('Categories: using fallbacks.', e.message);
    } finally {
      setLoaded(true);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const getCategory = useCallback((id) =>
    todoCategories.find(c => c.id === id) ?? todoCategories[todoCategories.length - 1],
  [todoCategories]);

  // ── Transaction categories ──────────────────────────────────────
  const addTransactionCategory = useCallback(async (type, name) => {
    const saved = await createTransactionCategory(userId, type, name.trim(), []);
    await load(); return saved;
  }, [userId, load]);

  const renameTransactionCategory = useCallback(async (id, name) => {
    const saved = await updateTransactionCategory(id, { name: name.trim() });
    await load(); return saved;
  }, [load]);

  const removeTransactionCategory = useCallback(async (id) => {
    await deleteTransactionCategory(id); await load();
  }, [load]);

  const addTransactionSubcategory = useCallback(async (row, subcategory) => {
    const next = Array.from(new Set([...(row.subcategories ?? []), subcategory.trim()].filter(Boolean)));
    const saved = await updateTransactionCategory(row.id, { subcategories: next });
    await load(); return saved;
  }, [load]);

  const renameTransactionSubcategory = useCallback(async (row, oldName, newName) => {
    const next = (row.subcategories ?? []).map(s => s === oldName ? newName.trim() : s).filter(Boolean);
    const saved = await updateTransactionCategory(row.id, { subcategories: Array.from(new Set(next)) });
    await load(); return saved;
  }, [load]);

  const removeTransactionSubcategory = useCallback(async (row, subcategory) => {
    const next = (row.subcategories ?? []).filter(s => s !== subcategory);
    const saved = await updateTransactionCategory(row.id, { subcategories: next });
    await load(); return saved;
  }, [load]);

  // ── Todo categories ─────────────────────────────────────────────
  const addTodoCategory = useCallback(async (label, icon = 'pricetag-outline', color = '#2DA49E') => {
    const saved = await createTodoCategory(userId, { label: label.trim(), icon, color });
    await load(); return saved;
  }, [userId, load]);

  const renameTodoCategory = useCallback(async (id, label) => {
    const saved = await updateTodoCategory(id, { label: label.trim() });
    await load(); return saved;
  }, [load]);

  const removeTodoCategory = useCallback(async (id) => {
    await deleteTodoCategory(id); await load();
  }, [load]);

  const updateTodoCategoryStyle = useCallback(async (id, patch) => {
    const saved = await updateTodoCategory(id, patch);
    await load(); return saved;
  }, [load]);

  // ── Saving categories ───────────────────────────────────────────
  const addSavingCategory = useCallback(async (label) => {
    const saved = await createSavingCategory(userId, label.trim());
    await load(); return saved;
  }, [userId, load]);

  const renameSavingCategory = useCallback(async (id, label) => {
    const saved = await updateSavingCategory(id, { label: label.trim() });
    await load(); return saved;
  }, [load]);

  const removeSavingCategory = useCallback(async (id) => {
    await deleteSavingCategory(id); await load();
  }, [load]);

  return {
    expenseCategories, incomeCategories, todoCategories, savingCategories,
    transactionCategoryRows, getCategory, loaded, reload: load,
    addTransactionCategory, renameTransactionCategory, removeTransactionCategory,
    addTransactionSubcategory, renameTransactionSubcategory, removeTransactionSubcategory,
    addTodoCategory, renameTodoCategory, removeTodoCategory, updateTodoCategoryStyle,
    addSavingCategory, renameSavingCategory, removeSavingCategory,
  };
}
