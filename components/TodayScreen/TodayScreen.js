import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore }  from '../../store/useAppStore';
import { useTodos }     from '../../store/todoStore/TodoContext';
import { useHabits }    from '../../store/habitStore/HabitContext';
import { useAuth }      from '../../store/authStore/AuthContext';
import { todayStr }     from '../../utils/dateUtils';
import styles from './TodayScreen.styles';
import { themeColor } from '../../config/theme';
import {MONTHS_SHORT, WEEKDAYS} from '../../config/appConstants';
import { WORDINGS } from '../../config/wordings';
import { getQuickAccessItems, getQuickAccessLabel, getQuickAccessIcon } from '../../utils/quickAccess';

function fmtLKR(n) {
  return n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SummaryCard({ label, value, color, icon }) {
  return (
    <View style={styles.summaryCard}>
      <Ionicons name={icon} size={20} color={color} style={{ marginBottom: 8 }} />
      <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

export default function TodayScreen({ setActiveTab }) {
  const { user }  = useAuth();
  const store     = useAppStore(user.id);
  const { todaySummary } = useTodos();
  const { habits, isDone } = useHabits();

  const [quickAccessItems, setQuickAccessItems] = useState([]);
  const today = todayStr();
  const now   = new Date();
  const dateLabel = `${WEEKDAYS[now.getDay()]}, ${now.getDate()} ${MONTHS_SHORT[now.getMonth()]} ${now.getFullYear()}`;

  // Finance totals for today
  const todayTxns    = store.transactions.filter(t => t.date?.startsWith(today));
  const totalIncome  = todayTxns.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0);
  const totalExpense = todayTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance      = totalIncome - totalExpense;

  // Habits for today
  const habitsDone  = habits.filter(h => isDone(h.id, today)).length;
  const habitsTotal = habits.length;
  const habitPct    = habitsTotal > 0 ? Math.round((habitsDone / habitsTotal) * 100) : 0;

  // Todos for today
  const { total: todoTotal, completed: todoCompleted } = todaySummary;

  useEffect(() => {
    let mounted = true;
    getQuickAccessItems().then((items) => {
      if (mounted) setQuickAccessItems(items);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
      <Text style={styles.greeting}>Good {greet()}!</Text>
      <Text style={styles.dateLabel}>{dateLabel}</Text>

      {/* Finance summary */}
      <Text style={styles.sectionTitle}>Finance</Text>
      <View style={styles.cardRow}>
        <SummaryCard label="Income"  value={`LKR ${fmtLKR(totalIncome)}`}  color={themeColor('success')} icon="arrow-down-circle-outline" />
        <SummaryCard label="Expense" value={`LKR ${fmtLKR(totalExpense)}`} color={themeColor('danger')} icon="arrow-up-circle-outline" />
      </View>
      <TouchableOpacity key={'day'} onPress={() => setActiveTab('day')}>
        <View style={[styles.balanceCard, { borderColor: balance >= 0 ? themeColor('success') : themeColor('danger') }]}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={[styles.balanceValue, { color: balance >= 0 ? themeColor('success') : themeColor('danger') }]}>
            {balance >= 0 ? '+' : ''}LKR {fmtLKR(balance)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Todos summary */}
      <TouchableOpacity key={'todos'} onPress={() => setActiveTab('todos')}>
        <Text style={styles.sectionTitle}>{WORDINGS.todaysummary.todoTitle}</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>
              {WORDINGS.todaysummary.completedTodos(todoCompleted, todoTotal)}
            </Text>
            <Text style={styles.progressPct}>
              {todoTotal > 0 ? Math.round((todoCompleted / todoTotal) * 100) : 0}%
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {
              width: todoTotal > 0 ? `${(todoCompleted / todoTotal) * 100}%` : '0%',
              backgroundColor: themeColor('accent'),
            }]} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Habits summary */}
      <TouchableOpacity key={'habits'} onPress={() => setActiveTab('habits')}>
        <Text style={styles.sectionTitle}>{WORDINGS.todaysummary.habitTitle}</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>
              {WORDINGS.todaysummary.completedHabits(habitsDone, habitsTotal)}
            </Text>
            <Text style={styles.progressPct}>{habitPct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {
              width: `${habitPct}%`,
              backgroundColor: themeColor('warning'),
            }]} />
          </View>
          {habits.map(h => (
            <View key={h.id} style={styles.habitRow}>
              <View style={[styles.habitDot, { backgroundColor: isDone(h.id, today) ? h.color : themeColor('surfaceAlt') }]} />
              <Text style={[styles.habitName, !isDone(h.id, today) && { color: themeColor('mutedText') }]}>
                {h.emoji} {h.name}
              </Text>
              {isDone(h.id, today) && <Ionicons name="checkmark" size={14} color={h.color} />}
            </View>
          ))}
        </View>
      </TouchableOpacity>

      {/* Quick links */}
      <Text style={styles.sectionTitle}>{WORDINGS.todaysummary.quickAccess}</Text>
      <View style={styles.quickRow}>
        {quickAccessItems.length > 0 ? quickAccessItems.map((itemId) => {
          const label = getQuickAccessLabel(itemId);
          const icon = getQuickAccessIcon(itemId);
          return (
            <TouchableOpacity key={itemId} style={styles.quickBtn} onPress={() => setActiveTab(itemId)}>
              <Ionicons name={icon} size={22} color={themeColor('primary')} />
              <Text style={styles.quickLabel}>{label}</Text>
            </TouchableOpacity>
          );
        }) : null}
      </View>
    </ScrollView>
  );
}

function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}