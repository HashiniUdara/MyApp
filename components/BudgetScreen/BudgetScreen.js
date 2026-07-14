import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchBudget, upsertBudget } from '../../store/budgetApi';
import styles from './BudgetScreen.styles';
import { themeColor } from '../../config/theme';

const pad = (n) => String(n).padStart(2, '0');
const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const daysInMonth = (key) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

export default function BudgetScreen({ userId, transactions = [] }) {
  const [month, setMonth] = useState(monthKey());
  const [budget, setBudget] = useState(null);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setError(null);
    fetchBudget(userId, month)
      .then(row => { if (!mounted) return; setBudget(row); setAmount(row?.amount ? String(row.amount) : ''); })
      .catch(e => { if (mounted) setError(e.message); });
    return () => { mounted = false; };
  }, [userId, month]);

  const stats = useMemo(() => {
    const expense = (transactions ?? [])
      .filter(t => t.type === 'expense' && t.date?.startsWith(month))
      .reduce((s, t) => s + Number(t.amount ?? 0), 0);
    const total = Number(budget?.amount ?? amount ?? 0) || 0;
    const left = total - expense;
    const percent = total > 0 ? Math.min(100, Math.round((expense / total) * 100)) : 0;
    const today = new Date();
    const isCurrent = month === monthKey(today);
    const daysTotal = daysInMonth(month);
    const dayNo = isCurrent ? today.getDate() : daysTotal;
    const dailyBudget = total > 0 ? total / daysTotal : 0;
    const expectedSpend = dailyBudget * dayNo;
    return { expense, total, left, percent, dayNo, daysTotal, dailyBudget, expectedSpend };
  }, [transactions, month, budget, amount]);

  const changeMonth = (delta) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(monthKey(d));
  };

  const save = async () => {
    const value = Number(amount);
    if (!value || value <= 0) { setError('Please enter a valid monthly budget.'); return; }
    try {
      setSaving(true); setError(null);
      setBudget(await upsertBudget(userId, month, value));
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Budget</Text>
      <View style={styles.monthRow}>
        <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(-1)}><Ionicons name="chevron-back" size={20} color={themeColor('textPrimary')} /></TouchableOpacity>
        <Text style={styles.monthText}>{month}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(1)}><Ionicons name="chevron-forward" size={20} color={themeColor('textPrimary')} /></TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Monthly budget</Text>
        <View style={styles.inputRow}>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="Amount" placeholderTextColor={themeColor('mutedText')} keyboardType="numeric" />
          <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}><Text style={styles.saveText}>{saving ? 'Saving' : 'Save'}</Text></TouchableOpacity>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.progressCard}>
        <View style={styles.ringWrap}>
          <View style={styles.ringOuter}><View style={[styles.ringInner, { width: `${100 - stats.percent}%` }]} /></View>
          <Text style={styles.percent}>{stats.percent}%</Text>
          <Text style={styles.used}>Used</Text>
        </View>
        <View style={styles.amountGrid}>
          <View style={styles.amountBox}><Text style={styles.boxLabel}>Budget</Text><Text style={styles.boxValue}>{stats.total.toFixed(2)}</Text></View>
          <View style={styles.amountBox}><Text style={styles.boxLabel}>Spent</Text><Text style={[styles.boxValue, { color: themeColor('danger') }]}>{stats.expense.toFixed(2)}</Text></View>
          <View style={styles.amountBox}><Text style={styles.boxLabel}>Remaining</Text><Text style={[styles.boxValue, { color: stats.left >= 0 ? themeColor('success') : themeColor('danger') }]}>{stats.left.toFixed(2)}</Text></View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily progress</Text>
        <View style={styles.dailyRow}><Text style={styles.dailyLabel}>Day</Text><Text style={styles.dailyValue}>{stats.dayNo} / {stats.daysTotal}</Text></View>
        <View style={styles.dailyRow}><Text style={styles.dailyLabel}>Daily budget</Text><Text style={styles.dailyValue}>{stats.dailyBudget.toFixed(2)}</Text></View>
        <View style={styles.dailyRow}><Text style={styles.dailyLabel}>Expected spend by today</Text><Text style={styles.dailyValue}>{stats.expectedSpend.toFixed(2)}</Text></View>
        <View style={styles.barTrack}><View style={[styles.barFill, { width: `${stats.percent}%` }]} /></View>
      </View>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}
