import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import TabPager from './components/common/TabPager';
import { ThemeProvider, useTheme, createThemedStyleSheet } from './config/theme';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BOTTOM_TABS, MORE_MENU_ITEMS, SELF_SCROLLING_TABS } from './config/appConstants';
import { WORDINGS } from './config/wordings';
import { extractRecoveryTokensFromWebUrl, extractRecoveryTokensFromUrl, clearWebRecoveryHash } from './utils/recoveryLink';

import { AuthProvider, useAuth }   from './store/authStore/AuthContext';
import { useAppStore }              from './store/useAppStore';
import { ReminderProvider }         from './store/reminderStore/ReminderContext';
import { HabitProvider }            from './store/habitStore/HabitContext';
import { TodoProvider }             from './store/todoStore/TodoContext';
import { CategoryProvider }         from './store/categoryStore/CategoryContext';

import AuthScreen           from './components/AuthScreen/AuthScreen';
import SetNewPasswordScreen from './components/AuthScreen/SetNewPasswordScreen';
import TodayScreen          from './components/TodayScreen/TodayScreen';
import TodoScreen           from './components/TodoScreen/TodoScreen';
import DayScreen            from './components/DayScreen/DayScreen';
import CalendarScreen       from './components/CalendarScreen/CalendarScreen';
import HabitScreen          from './components/HabitScreen/HabitScreen';
import SettingsScreen       from './components/Settings/SettingsScreen';
import RemindersScreen      from './components/RemindersScreen/RemindersScreen';
import ProfileScreen        from './components/ProfileScreen/ProfileScreen';
import NotesScreen          from './components/NotesScreen/NotesScreen';
import CalculatorScreen     from './components/calculator/CalculatorScreen';
import BudgetScreen         from './components/BudgetScreen/BudgetScreen';
import SavingsScreen     from './components/SavingsScreen/SavingsScreen';
import FinanceGraphScreen from './components/FinanceGraphScreen/FinanceGraphScreen';
import SplitBillsScreen from './components/SplitBillsScreen/SplitBillsScreen';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('today');
  const [showMore, setShowMore]   = useState(false);
  const store = useAppStore(user.id);
  const { colors, isDark } = useTheme();

  // Only the tabs shown directly on the bottom bar (excluding "more", which
  // just toggles the overlay menu below) are swipeable between each other.
  const SWIPEABLE_TABS = BOTTOM_TABS.filter(t => t.id !== 'more').map(t => t.id);
  const swipeIndex = SWIPEABLE_TABS.indexOf(activeTab);
  const isSwipeableTab = swipeIndex !== -1;

  const navigate = (tab) => {
    setShowMore(false);
    setActiveTab(tab);
  };

  const renderTab = (tabId) => {
    switch (tabId) {
      case 'today':
        return <TodayScreen setActiveTab={navigate} />;
      case 'todos':
        return <TodoScreen />;
      case 'habits':
        return <HabitScreen />;
      case 'reminders':
        return <RemindersScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'notes':
        return <NotesScreen />;
      case 'splitbills':
        return <SplitBillsScreen />;
      case 'calculator':
        return <CalculatorScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'budget':
        return <BudgetScreen userId={user.id} transactions={store.transactions} />;
      case 'savings':
        return <SavingsScreen userId={user.id} />;
      case 'graph':
        return <FinanceGraphScreen userId={user.id} transactions={store.transactions} />;
      case 'day':
        return (
          <DayScreen
            transactions={store.transactions}
            expenses={store.expenses}
            incomes={store.incomes}
            onRemoveExpense={store.removeExpense}
            onRemoveIncome={store.removeIncome}
            onAddExpense={store.addExpense}
            onAddIncome={store.addIncome}
            onUpdateExpense={store.updateExpense}
            onUpdateIncome={store.updateIncome}
          />
        );
      case 'calendar':
        return (
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
            <CalendarScreen
              transactions={store.transactions}
              onAdd={(entry) => entry.type === 'income' ? store.addIncome(entry) : store.addExpense(entry)}
              onUpdate={(id, entry) => entry.type === 'income' ? store.updateIncome(id, entry) : store.updateExpense(id, entry)}
              onRemove={(item) => item.type === 'income'
                ? store.removeIncome(store.incomes.findIndex(t => t.id === item.id))
                : store.removeExpense(store.expenses.findIndex(t => t.id === item.id))}
            />
          </View>
        );
      default:
        return <TodayScreen setActiveTab={navigate} />;
    }
  };

  // Wraps a tab's content the same way it always was: screens in
  // SELF_SCROLLING_TABS manage their own ScrollView, everything else gets
  // wrapped in one here.
  const wrapTab = (tabId, node) => (
    SELF_SCROLLING_TABS.includes(tabId)
      ? <View style={styles.content}>{node}</View>
      : <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>{node}</ScrollView>
  );


  return (
    <View style={styles.container}>
      <ExpoStatusBar style={isDark ? "light" : "dark"} />

      {/* Content area */}
      {isSwipeableTab ? (
        <TabPager
          style={styles.content}
          activeIndex={swipeIndex}
          onIndexChange={(index) => {
            const tab = SWIPEABLE_TABS[index];
            if (tab) navigate(tab);
          }}
        >
          {SWIPEABLE_TABS.map((tabId) => (
            <View key={tabId} style={{ flex: 1 }}>
              {wrapTab(tabId, renderTab(tabId))}
            </View>
          ))}
        </TabPager>
      ) : (
        wrapTab(activeTab, renderTab(activeTab))
      )}

      {/* More overlay menu */}
      {showMore && (
        <View style={styles.moreOverlay}>
          <TouchableOpacity style={styles.moreBackdrop} activeOpacity={1} onPress={() => setShowMore(false)} />
          <View style={styles.moreMenu}>
            <Text style={styles.moreTitle}>{WORDINGS.common.more}</Text>
            <View style={styles.moreGrid}>
              {MORE_MENU_ITEMS.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.moreItem}
                  onPress={() => navigate(item.id)}
                >
                  <View style={styles.moreIconWrap}>
                    <Ionicons name={item.icon} size={24} color={colors.textPrimary} />
                  </View>
                  <Text style={styles.moreLabel}>{WORDINGS.nav[item.labelKey]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Bottom navigator */}
      <SafeAreaView style={styles.bottomNav}>
        {BOTTOM_TABS.map(tab => {
          const isMore   = tab.id === 'more';
          const isActive = isMore ? showMore : activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.navItem}
              onPress={() => isMore ? setShowMore(s => !s) : navigate(tab.id)}
            >
              <Ionicons
                name={isActive
                  ? tab.icon.replace('-outline', '')
                  : tab.icon}
                size={24}
                color={isActive ? colors.textPrimary : colors.mutedText}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {WORDINGS.nav[tab.labelKey]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </SafeAreaView>
    </View>
  );
}

function Root() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const [resetPayload, setResetPayload] = useState(null);

  // Listen for password reset redirects — works on both web and native
  useEffect(() => {
    // ── Web: check window.location.hash immediately ───────────────
    if (typeof window !== 'undefined' && window.location) {
      const payload = extractRecoveryTokensFromWebUrl();
      if (payload) {
        setResetPayload(payload);
        clearWebRecoveryHash();
        return; // Don't set up native listener on web
      }
    }

    // ── Native: listen for deep links ─────────────────────────────
    let sub;
    const handleUrl = (event) => {
      const payload = extractRecoveryTokensFromUrl(event?.url ?? event);
      if (payload) setResetPayload(payload);
    };

    import('expo-linking').then(Linking => {
      Linking.getInitialURL().then(url => { if (url) handleUrl({ url }); });
      sub = Linking.addEventListener('url', handleUrl);
    });

    return () => sub?.remove?.();
  }, []);

  // Show reset password screen if deep link token present
  if (resetPayload) {
    return (
      <SetNewPasswordScreen
        recoveryPayload={resetPayload}
        onDone={() => setResetPayload(null)}
      />
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <CategoryProvider userId={user.id}>
    <ReminderProvider userId={user.id}>
    <HabitProvider userId={user.id}>
    <TodoProvider userId={user.id}>
      <MainApp />
    </TodoProvider>
    </HabitProvider>
    </ReminderProvider>
    </CategoryProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = createThemedStyleSheet((colors) => ({
  loadingContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  container:        { flex: 1, backgroundColor: colors.background },
  content:          { flex: 1 },
  contentInner:     { padding: 20, paddingBottom: 20 },

  // Bottom nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.surfaceAlt,
    paddingTop: 10,
    paddingBottom: 4,
  },
  navItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 4,
  },
  navLabel:       { color: colors.mutedText, fontSize: 10, fontWeight: '600' },
  navLabelActive: { color: colors.textPrimary },

  // More overlay
  moreOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 100 },
  moreBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.backdrop },
  moreMenu: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 100, // above bottom nav
  },
  moreTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 20 },
  moreGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moreItem:  { width: '30%', alignItems: 'center', gap: 8 },
  moreIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  moreLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  comingSoonContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28,
  },
  comingSoonIcon: {
    width: 74, height: 74, borderRadius: 24, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  comingSoonTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginBottom: 8 },
  comingSoonSubtitle: { color: colors.primary, fontSize: 16, fontWeight: '800', marginBottom: 10 },
  comingSoonText: { color: colors.mutedText, fontSize: 14, textAlign: 'center', lineHeight: 20 },
}));