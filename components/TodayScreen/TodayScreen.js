import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore }  from '../../store/useAppStore';
import { useTodos }     from '../../store/todoStore/TodoContext';
import { useHabits }    from '../../store/habitStore/HabitContext';
import { useAuth }      from '../../store/authStore/AuthContext';
import { todayStr }     from '../../utils/dateUtils';
import styles from './TodayScreen.styles';
import { themeColor } from '../../config/theme';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAYS     = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

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
      <View style={[styles.balanceCard, { borderColor: balance >= 0 ? themeColor('success') : themeColor('danger') }]}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={[styles.balanceValue, { color: balance >= 0 ? themeColor('success') : themeColor('danger') }]}>
          {balance >= 0 ? '+' : ''}LKR {fmtLKR(balance)}
        </Text>
      </View>

      {/* Todos summary */}
      <Text style={styles.sectionTitle}>Todos</Text>
      <View style={styles.progressCard}>
        <View style={styles.progressTop}>
          <Text style={styles.progressLabel}>
            {todoCompleted} of {todoTotal} completed
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

      {/* Habits summary */}
      <Text style={styles.sectionTitle}>Habits</Text>
      <View style={styles.progressCard}>
        <View style={styles.progressTop}>
          <Text style={styles.progressLabel}>
            {habitsDone} of {habitsTotal} done today
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

      {/* Quick links */}
      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.quickRow}>
        {[
          { label: 'notes', tab: 'notes',    icon: 'document-text-outline' },
          { label: 'split bills',        tab: 'splitbills',  icon: 'receipt-outline' },
        ].map(q => (
          <TouchableOpacity key={q.tab} style={styles.quickBtn} onPress={() => setActiveTab(q.tab)}>
            <Ionicons name={q.icon} size={22} color={themeColor('primary')} />
            <Text style={styles.quickLabel}>{q.label}</Text>
          </TouchableOpacity>
        ))}
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