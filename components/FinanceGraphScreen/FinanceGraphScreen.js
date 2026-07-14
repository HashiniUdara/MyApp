import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchYearlyFinanceOverview } from '../../store/financeApi';
import MonthlyTrendChart from './MonthlyTrendChart';
import CategoryBreakdownChart from './CategoryBreakdownChart';
import { WORDINGS } from '../../config/wordings';
import styles from './FinanceGraphScreen.styles';
import { themeColor } from '../../config/theme';

const CURRENT_YEAR = new Date().getFullYear();
const TABS = [
  { id: 'overview', labelKey: 'tabOverview' },
  { id: 'income', labelKey: 'tabIncome' },
  { id: 'expense', labelKey: 'tabExpense' },
];

export default function FinanceGraphScreen() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (y) => {
    try {
      setLoading(true);
      setError(null);
      const overview = await fetchYearlyFinanceOverview(y);
      setData(overview);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(year); }, [year, load]);

  const changeYear = (delta) => {
    const next = year + delta;
    if (next > CURRENT_YEAR) return;
    setYear(next);
  };

  const net = data ? data.totals.income - data.totals.expense : 0;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{WORDINGS.graph.title}</Text>
      <Text style={styles.description}>{WORDINGS.graph.screenDescription}</Text>

      {/* Year selector */}
      <View style={styles.yearRow}>
        <TouchableOpacity style={styles.navBtn} onPress={() => changeYear(-1)}>
          <Ionicons name="chevron-back" size={20} color={themeColor('textPrimary')} />
        </TouchableOpacity>
        <Text style={styles.yearText}>{year}</Text>
        <TouchableOpacity
          style={[styles.navBtn, year >= CURRENT_YEAR && styles.navBtnDisabled]}
          onPress={() => changeYear(1)}
          disabled={year >= CURRENT_YEAR}
        >
          <Ionicons name="chevron-forward" size={20} color={themeColor('textPrimary')} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>
              {WORDINGS.graph[t.labelKey]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && <Text style={styles.error}>{WORDINGS.graph.loadError}: {error}</Text>}

      {loading ? (
        <View style={{ paddingVertical: 30, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={themeColor('accent')} />
          <Text style={styles.loadingText}>{WORDINGS.graph.loading}</Text>
        </View>
      ) : data && (
        <>
          {/* Summary cards, always visible */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>{WORDINGS.graph.totalIncome}</Text>
              <Text style={[styles.summaryValue, styles.summaryValueIncome]}>
                {data.totals.income.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>{WORDINGS.graph.totalExpense}</Text>
              <Text style={[styles.summaryValue, styles.summaryValueExpense]}>
                {data.totals.expense.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>{WORDINGS.graph.net}</Text>
              <Text
                style={[
                  styles.summaryValue,
                  net >= 0 ? styles.summaryValueIncome : styles.summaryValueExpense,
                ]}
              >
                {net.toFixed(2)}
              </Text>
            </View>
          </View>

          {tab === 'overview' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{WORDINGS.graph.monthlyTrendTitle}</Text>
              <Text style={styles.cardSubtitle}>{WORDINGS.graph.monthlyTrendSubtitle(year)}</Text>
              <MonthlyTrendChart months={data.months} />
            </View>
          )}

          {tab === 'income' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{WORDINGS.graph.incomeByCategoryTitle}</Text>
              <Text style={styles.cardSubtitle}>{WORDINGS.graph.yearSubtitle(year)}</Text>
              <CategoryBreakdownChart
                byCategory={data.incomeByCategory}
                emptyLabel={WORDINGS.graph.emptyIncome}
              />
            </View>
          )}

          {tab === 'expense' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{WORDINGS.graph.expenseByCategoryTitle}</Text>
              <Text style={styles.cardSubtitle}>{WORDINGS.graph.yearSubtitle(year)}</Text>
              <CategoryBreakdownChart
                byCategory={data.expenseByCategory}
                emptyLabel={WORDINGS.graph.emptyExpense}
              />
            </View>
          )}
        </>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}
