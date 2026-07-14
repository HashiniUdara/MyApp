/**
 * DayView — the scrollable body shared by DayScreen (today) and
 * CalendarDayScreen (any selected day from the calendar).
 *
 * Props:
 *   date          string  'YYYY-MM-DD'  – which day to display
 *   title         string  – header text, e.g. "Today's Summary" or "26 Jun"
 *   transactions  array   – ALL transactions (store.transactions)
 *   onAdd         fn(entry)
 *   onUpdate      fn(id, entry)
 *   onRemove      fn(transaction)  – receives the full transaction object
 */
import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import styles from './DayScreenStyles';
import AddTransactionModal from './AddTransactionModal';
import ConfirmDialog from '../common/ConfirmDialog';
import { Ionicons } from '@expo/vector-icons';
import { themeColor } from '../../config/theme';

export default function DayView({ date, title, transactions, onAdd, onUpdate, onRemove, expenseCategories, incomeCategories }) {
  const [modalVisible,        setModalVisible]        = useState(false);
  const [editingTransaction,  setEditingTransaction]  = useState(null);
  const [pendingDelete,       setPendingDelete]       = useState(null);

  // Filter to the requested day
  const dayTxns = useMemo(() =>
    (transactions ?? [])
      .filter(t => t.date?.startsWith(date))
      .sort((a, b) => a.date.localeCompare(b.date)),
    [transactions, date]
  );

  const dayExpenses = dayTxns.filter(t => t.type === 'expense');
  const dayIncomes  = dayTxns.filter(t => t.type === 'income');

  const totalExpenses = dayExpenses.reduce((s, t) => s + t.amount, 0);
  const totalIncomes  = dayIncomes.reduce((s, t)  => s + t.amount, 0);
  const netTotal      = totalIncomes - totalExpenses;

  const handleEdit = (item) => {
    setEditingTransaction(item);
    setModalVisible(true);
  };

  const handleClose = () => {
    setModalVisible(false);
    setEditingTransaction(null);
  };

  // Wrap add so we can close the modal
  const handleAdd = (entry) => { onAdd(entry); };

  // Update delegates to parent with the txn's id
  const handleUpdate = (id, entry) => { onUpdate(id, entry); };

  // Adapters so AddTransactionModal still works unchanged
  const handleAddExpense    = (entry) => handleAdd({ ...entry, type: 'expense' });
  const handleAddIncome     = (entry) => handleAdd({ ...entry, type: 'income' });
  const handleUpdateExpense = (id, entry) => handleUpdate(id, { ...entry, type: 'expense' });
  const handleUpdateIncome  = (id, entry) => handleUpdate(id, { ...entry, type: 'income' });

  const confirmDelete = () => {
    if (pendingDelete) onRemove(pendingDelete);
    setPendingDelete(null);
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{title}</Text>

        {dayTxns.length === 0 && (
          <Text style={styles.empty}>No transactions yet. Tap + to add one!</Text>
        )}

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, { color: themeColor('success') }]}>{totalIncomes.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={[styles.summaryValue, { color: themeColor('danger') }]}>- {totalExpenses.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { color: netTotal >= 0 ? themeColor('success') : themeColor('danger') }]}>Balance</Text>
            <Text style={[styles.summaryValue, { color: netTotal >= 0 ? themeColor('success') : themeColor('danger') }]}>{netTotal.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, styles.netRow]}>Transactions</Text>

        {dayTxns.length === 0 ? (
          <Text style={styles.emptyText}>No transactions added.</Text>
        ) : (
          dayTxns.map((item, index) => (
            <TouchableOpacity
              key={item.id ?? `${item.type}-${index}`}
              style={item.type === 'income' ? styles.incomeItem : styles.expenseItem}
              onPress={() => handleEdit(item)}
              activeOpacity={0.75}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.categoryText}>{item.category}</Text>
                <Text style={styles.subcategoryText}>{item.subcategory}</Text>
              </View>
              <Text style={item.type === 'income' ? styles.incomeAmount : styles.expenseAmount}>
                {item.type === 'income' ? '+' : '-'} {item.amount.toFixed(2)}
              </Text>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setPendingDelete(item)}>
                <Ionicons name="trash-outline" size={18} color={themeColor('danger')} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color={themeColor('textPrimary')} />
      </TouchableOpacity>

      <ConfirmDialog
        visible={!!pendingDelete}
        title="Delete Transaction"
        message={pendingDelete ? `Delete "${pendingDelete.category}"? This can't be undone.` : ''}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <AddTransactionModal
        visible={modalVisible}
        onClose={handleClose}
        onAddExpense={handleAddExpense}
        onAddIncome={handleAddIncome}
        onUpdateExpense={handleUpdateExpense}
        onUpdateIncome={handleUpdateIncome}
        editingTransaction={editingTransaction}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
      />
    </View>
  );
}
