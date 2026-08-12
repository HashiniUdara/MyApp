import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import styles from './CalendarScreenStyles';
import CalendarDayScreen from './CalendarDayScreen';
import { themeColor } from '../../config/theme';
import { MONTHS, WEEKDAYS_MON } from '../../config/appConstants';
import { Ionicons } from '@expo/vector-icons';

function buildGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const prevLast = new Date(year, month, 0).getDate();
  const startSlot = (firstDay.getDay() + 6) % 7;
  const pad = (n) => String(n).padStart(2, '0');
  const cells = [];

  for (let i = startSlot - 1; i >= 0; i--) cells.push({ date: null, label: prevLast - i, faded: true });
  for (let d = 1; d <= lastDate; d++) cells.push({ date: `${year}-${pad(month + 1)}-${pad(d)}`, label: d, faded: false });
  const tail = 7 - (cells.length % 7);
  if (tail < 7) for (let d = 1; d <= tail; d++) cells.push({ date: null, label: d, faded: true });
  return cells;
}

function fmtShort(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(Math.round(n));
}

function fmtLKR(n) {
  return n.toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const pad = (n) => String(n).padStart(2, '0');

export default function CalendarScreen({ transactions, onAdd, onUpdate, onRemove }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [day, setDay] = useState(now.getDate());
  const [selDate, setSelDate] = useState(null);
  const [picker, setPicker] = useState(null);

  const clampDay = (nextYear, nextMonth, nextDay = day) => {
    const maxDay = new Date(nextYear, nextMonth + 1, 0).getDate();
    return Math.min(nextDay, maxDay);
  };

  const setMonthSafe = (nextMonth) => {
    setMonth(nextMonth);
    setDay(d => clampDay(year, nextMonth, d));
  };

  const selectedDate = `${year}-${pad(month + 1)}-${pad(clampDay(year, month))}`;

  const daily = useMemo(() => {
    const map = {};
    (transactions ?? []).forEach(({ type, amount, date }) => {
      const txDay = date?.split(' ')[0];
      if (!txDay) return;
      map[txDay] ??= { income: 0, expense: 0 };
      if (type === 'income') map[txDay].income += amount;
      if (type === 'expense') map[txDay].expense += amount;
    });
    return map;
  }, [transactions]);

  const grid = useMemo(() => buildGrid(year, month), [year, month]);
  const todayStr = now.toISOString().split('T')[0];

  const moveDay = (offset) => {
    const d = new Date(year, month, clampDay(year, month));
    d.setDate(d.getDate() + offset);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setDay(d.getDate());
  };

  const monthTotals = useMemo(() => {
    let income = 0, expense = 0;
    grid.forEach(c => {
      if (!c.date || c.faded) return;
      const d = daily[c.date];
      if (d) { income += d.income; expense += d.expense; }
    });
    return { income, expense, balance: income - expense };
  }, [grid, daily]);

  const rows = [];
  for (let i = 0; i < grid.length; i += 7) rows.push(grid.slice(i, i + 7));
  const yearOptions = Array.from({ length: 21 }, (_, i) => now.getFullYear() - 10 + i);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <View style={styles.selectorCard}>
          <View style={styles.selectorRow}>
            <TouchableOpacity style={styles.selectorValue} onPress={() => setPicker('year')}>
              <Text style={styles.selectorLabel}>Year</Text>
              <Text style={styles.selectorText}>{year}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectorValue} onPress={() => setPicker('month')}>
              <Text style={styles.selectorLabel}>Month</Text>
              <Text style={styles.selectorText}>{MONTHS[month]}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dayNavRow}>
            <TouchableOpacity style={styles.navBtn} onPress={() => moveDay(-1)}><Ionicons name="chevron-back" size={20} color={themeColor('textPrimary')} /></TouchableOpacity>
            <TouchableOpacity style={styles.dayCenter} onPress={() => setSelDate(selectedDate)}>
              <Text style={styles.selectorLabel}>Day</Text>
              <Text style={styles.navTitle}>{day}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navBtn} onPress={() => moveDay(1)}><Ionicons name="chevron-forward" size={20} color={themeColor('textPrimary')} /></TouchableOpacity>
          </View>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS_MON.map(d => <View key={d} style={styles.weekCell}><Text style={styles.weekLabel}>{d}</Text></View>)}
        </View>

        <View style={styles.grid}>
          {rows.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((cell, ci) => {
                const totals = cell.date ? daily[cell.date] : null;
                const isToday = cell.date === todayStr;
                const isSelected = cell.date === selectedDate;
                const hasData = totals && (totals.income > 0 || totals.expense > 0);
                return (
                  <TouchableOpacity
                    key={ci}
                    activeOpacity={cell.date ? 0.7 : 1}
                    style={[styles.cell, ci === 6 && styles.cellLast, cell.faded && styles.cellFaded, isToday && styles.cellToday, isSelected && styles.cellSelected]}
                    onPress={() => {
                      if (!cell.date) return;
                      const [y, m, d] = cell.date.split('-').map(Number);
                      setYear(y); setMonth(m - 1); setDay(d); setSelDate(cell.date);
                    }}
                  >
                    <Text style={[styles.cellNum, cell.faded && styles.cellNumFaded, isToday && styles.cellNumToday, isSelected && styles.cellNumSel]}>{cell.label}</Text>
                    {hasData && (
                      <View style={styles.cellAmounts}>
                        {totals.income > 0 && <Text style={[styles.cellAmt, styles.incomeColor]} numberOfLines={1}>+{fmtShort(totals.income)}</Text>}
                        {totals.expense > 0 && <Text style={[styles.cellAmt, styles.expenseColor]} numberOfLines={1}>-{fmtShort(totals.expense)}</Text>}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.summaryRow}>
          <SummaryPill label="Income" value={`+${fmtLKR(monthTotals.income)}`} color={themeColor('success')} />
          <SummaryPill label="Expense" value={`-${fmtLKR(monthTotals.expense)}`} color={themeColor('danger')} />
          <SummaryPill label="Balance" value={`${monthTotals.balance >= 0 ? '+' : '-'}${fmtLKR(Math.abs(monthTotals.balance))}`} color={monthTotals.balance >= 0 ? themeColor('success') : themeColor('danger')} />
        </View>
      </ScrollView>

      <PickerModal visible={picker === 'year'} title="Select Year" onClose={() => setPicker(null)}>
        <View style={styles.pickerGrid}>
          {yearOptions.map(y => (
            <TouchableOpacity key={y} style={[styles.pickerItem, y === year && styles.pickerItemActive]} onPress={() => { setYear(y); setDay(d => clampDay(y, month, d)); setPicker(null); }}>
              <Text style={styles.pickerItemText}>{y}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </PickerModal>

      <PickerModal visible={picker === 'month'} title="Select Month" onClose={() => setPicker(null)}>
        <View style={styles.pickerGrid}>
          {MONTHS.map((m, index) => (
            <TouchableOpacity key={m} style={[styles.pickerItem, index === month && styles.pickerItemActive]} onPress={() => { setMonthSafe(index); setPicker(null); }}>
              <Text style={styles.pickerItemText}>{m.slice(0, 3)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </PickerModal>

      <CalendarDayScreen visible={!!selDate} date={selDate} transactions={transactions} onClose={() => setSelDate(null)} onAdd={onAdd} onUpdate={onUpdate} onRemove={onRemove} />
    </>
  );
}

function SummaryPill({ label, value, color }) {
  return <View style={styles.pill}><Text style={styles.pillLabel}>{label}</Text><Text style={[styles.pillValue, { color }]}>{value}</Text></View>;
}

function PickerModal({ visible, title, onClose, children }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.pickerOverlay}>
        <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.pickerSheet}>
          <Text style={styles.pickerTitle}>{title}</Text>
          {children}
        </View>
      </View>
    </Modal>
  );
}
