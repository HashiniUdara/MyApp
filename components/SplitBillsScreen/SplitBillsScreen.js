import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import ConfirmDialog from '../common/ConfirmDialog';
import { useAuth } from '../../store/authStore/AuthContext';
import { WORDINGS } from '../../config/wordings';
import { SPLIT_BILL_TABS } from '../../config/appConstants';
import styles from './SplitBillsScreen.styles';
import { themeColor } from '../../config/theme';
import { toDateStr, parseDateStr } from '../../utils/dateUtils';
import {
  fetchSplitBillPeople,
  createSplitBillPerson,
  updateSplitBillPerson,
  deleteSplitBillPerson,
  fetchSplitBillGroups,
  createSplitBillGroup,
  updateSplitBillGroup,
  deleteSplitBillGroup,
  fetchSplitBillExpenses,
  createSplitBillExpense,
  updateSplitBillExpense,
  deleteSplitBillExpense,
  fetchSplitBillSettlements,
  createSplitBillSettlement,
} from '../../store/splitBillApi';

const normalizeExpense = (item) => ({
  id: item.id,
  description: item.description,
  amount: Number(item.amount) || 0,
  paidBy: item.paid_by,
  date: item.date,
  splitWith: item.split_with ?? [],
  splitType: item.split_type ?? item.splitType ?? 'equally',
  groupId: item.group_id ?? item.groupId ?? null,
  // `splits` is a map: personId -> amount owed. If API didn't provide it,
  // we'll compute an equal split as a fallback.
  splits: item.splits ?? undefined,
  createdAt: item.created_at,
});

const calculateSplitsFromExpense = (expense) => {
  const amount = Number(expense.amount) || 0;
  const participants = expense.splitWith ?? expense.participants ?? [];
  const splitType = expense.splitType ?? expense.split_type ?? 'equally';

  const toFixed2 = (n) => Number(Number(n).toFixed(2));

  if (participants.length === 0) return {};

  if (splitType === 'equally') {
    const rawShare = amount / participants.length;
    const share = Math.floor(rawShare * 100) / 100; // floor to cents
    const res = {};
    participants.forEach((p) => { res[p] = share; });
    const assigned = Object.values(res).reduce((s, v) => s + v, 0);
    const remainder = toFixed2(amount - assigned);
    if (remainder !== 0) {
      const last = participants[participants.length - 1];
      res[last] = toFixed2(res[last] + remainder);
    }
    return Object.fromEntries(Object.entries(res).map(([k, v]) => [k, toFixed2(v)]));
  }

  if (splitType === 'byAmount') {
    if (expense.splits && typeof expense.splits === 'object') {
      const res = {};
      const keys = Object.keys(expense.splits);
      keys.forEach((k) => { res[k] = toFixed2(Number(expense.splits[k] || 0)); });
      const assigned = Object.values(res).reduce((s, v) => s + v, 0);
      const remainder = toFixed2(amount - assigned);
      if (remainder !== 0 && keys.length > 0) {
        const last = keys[keys.length - 1];
        res[last] = toFixed2(res[last] + remainder);
      }
      return res;
    }
    // Fallback to equal
    return calculateSplitsFromExpense({ ...expense, splitType: 'equally' });
  }

  if (splitType === 'byPercentage') {
    if (expense.percentages && typeof expense.percentages === 'object') {
      const res = {};
      const keys = Object.keys(expense.percentages);
      keys.forEach((k) => {
        const pct = Number(expense.percentages[k] || 0) / 100;
        res[k] = toFixed2(amount * pct);
      });
      const assigned = Object.values(res).reduce((s, v) => s + v, 0);
      const remainder = toFixed2(amount - assigned);
      if (remainder !== 0 && keys.length > 0) {
        const last = keys[keys.length - 1];
        res[last] = toFixed2(res[last] + remainder);
      }
      return res;
    }
    // Fallback to equal
    return calculateSplitsFromExpense({ ...expense, splitType: 'equally' });
  }

  // Default fallback
  return calculateSplitsFromExpense({ ...expense, splitType: 'equally' });
};

export default function SplitBillsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('expenses');
  const [people, setPeople] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExpenses, setExpandedExpenses] = useState(new Set());
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPeopleModal, setShowPeopleModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingPerson, setEditingPerson] = useState(null);
  const [pendingDeleteExpense, setPendingDeleteExpense] = useState(null);
  const [pendingDeletePerson, setPendingDeletePerson] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [personName, setPersonName] = useState('');
  const [splitType, setSplitType] = useState('equally');
  const [manualSplits, setManualSplits] = useState({});
  const [percentages, setPercentages] = useState({});
  const [splitValidationError, setSplitValidationError] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [expenseGroupId, setExpenseGroupId] = useState(null);
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [expandedSettlementKeys, setExpandedSettlementKeys] = useState(new Set());
  const [settlementInputs, setSettlementInputs] = useState({});

  const allPeople = people;

  const personNameById = useMemo(
    () => Object.fromEntries(allPeople.map((person) => [person.id, person.name])),
    [allPeople]
  );

  const groupNameById = useMemo(
    () => Object.fromEntries(groups.map((group) => [group.id, group.name])),
    [groups]
  );

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  );

  const peopleForCurrentGroup = useMemo(
    () => (selectedGroup ? allPeople.filter((person) => selectedGroup.member_ids.includes(person.id)) : allPeople),
    [allPeople, selectedGroup]
  );

  const orderedPeople = useMemo(() => {
    if (!allPeople || allPeople.length === 0) return [];
    const you = user?.id ? allPeople.find((p) => p.id === user.id) : null;
    const others = allPeople.filter((p) => p.id !== user?.id);
    return you ? [...others, you] : others;
  }, [allPeople, user?.id]);

  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return bDate - aDate;
    }),
    [expenses]
  );

  const filteredExpenses = useMemo(
    () => {
      if (!selectedGroupId) return [];
      return sortedExpenses.filter((expense) => expense.groupId === selectedGroupId);
    },
    [sortedExpenses, selectedGroupId]
  );

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        let peopleData = await fetchSplitBillPeople(user.id);
        peopleData = peopleData ?? [];
        if (!peopleData.some((person) => person.id === user.id)) {
          await createSplitBillPerson(user.id, { id: user.id, name: 'You' });
          peopleData = await fetchSplitBillPeople(user.id) ?? [];
        }
        const groupsData = await fetchSplitBillGroups(user.id);
        const expensesData = await fetchSplitBillExpenses(user.id);
        const settlementsData = await fetchSplitBillSettlements(user.id);
        setPeople(peopleData);
        setGroups(groupsData ?? []);
        setSelectedGroupId(groupsData?.[0]?.id ?? null);
        setExpenses((expensesData ?? []).map(normalizeExpense));
        setSettlements(settlementsData ?? []);
      } catch (error) {
        console.warn('SplitBills load error', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    const [peopleData, groupsData, expensesData, settlementsData] = await Promise.all([
      fetchSplitBillPeople(user.id),
      fetchSplitBillGroups(user.id),
      fetchSplitBillExpenses(user.id),
      fetchSplitBillSettlements(user.id),
    ]);
    setPeople(peopleData ?? []);
    setGroups(groupsData ?? []);
    setSelectedGroupId((current) => current ?? groupsData?.[0]?.id ?? null);
    setExpenses((expensesData ?? []).map(normalizeExpense));
    setSettlements(settlementsData ?? []);
  };

  const togglePersonSelection = (personId) => {
    setSelectedPeople((current) =>
      current.includes(personId)
        ? current.filter((id) => id !== personId)
        : [...current, personId]
    );
  };

  const resetExpenseForm = () => {
    const defaultPeople = selectedGroup && selectedGroup.member_ids?.length
      ? selectedGroup.member_ids
      : user?.id ? [user.id] : [];
    setDescription('');
    setAmount('');
    // prefer current user if they're in the group, otherwise first group member
    const defaultPayer = defaultPeople.includes(user?.id) ? user?.id : (defaultPeople[0] ?? user?.id ?? '');
    setPaidBy(defaultPayer || '');
    setExpenseDate(new Date());
    setSelectedPeople(defaultPeople);
    setExpenseGroupId(selectedGroupId);
    setEditingExpense(null);
    setSplitType('equally');
    setManualSplits({});
    setPercentages({});
    setSplitValidationError('');
  };

  const openExpenseModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setDescription(expense.description);
      setAmount(String(expense.amount));
      setPaidBy(expense.paidBy);
      setExpenseDate(parseDateStr(expense.date));
      setSelectedPeople(expense.splitWith);
      setExpenseGroupId(expense.groupId || null);
      setSplitType(expense.splitType || 'equally');
      
      // Load splits into the appropriate state based on splitType
      if (expense.splits && Object.keys(expense.splits).length > 0) {
        if (expense.splitType === 'byAmount') {
          setManualSplits(expense.splits);
          setPercentages({});
        } else if (expense.splitType === 'byPercentage') {
          // Calculate percentages from splits
          const pcts = {};
          const total = expense.amount || 1;
          Object.entries(expense.splits).forEach(([pid, amt]) => {
            pcts[pid] = ((Number(amt) / total) * 100).toFixed(1);
          });
          setPercentages(pcts);
          setManualSplits({});
        } else {
          setManualSplits({});
          setPercentages({});
        }
      }
    } else {
      resetExpenseForm();
    }
    setShowExpenseModal(true);
  };

  const openPersonModal = (person = null) => {
    if (person) {
      setEditingPerson(person);
      setPersonName(person.name);
    } else {
      setEditingPerson(null);
      setPersonName('');
    }
    setShowPeopleModal(true);
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') return;
    if (selectedDate) setExpenseDate(selectedDate);
  };

  const saveExpense = async () => {
    if (!user?.id) return;
    const cleanedAmount = Number(amount);
    if (!description.trim() || Number.isNaN(cleanedAmount) || cleanedAmount <= 0) return;

    // Validate based on split type
    setSplitValidationError('');
    if (splitType === 'byAmount') {
      const sum = Object.values(manualSplits).reduce((s, v) => s + Number(v || 0), 0);
      const rounded = Number(sum.toFixed(2));
      if (Math.abs(rounded - cleanedAmount) > 0.01) {
        setSplitValidationError(`Amounts must sum to ${cleanedAmount}`);
        return;
      }
    }
    if (splitType === 'byPercentage') {
      const sum = Object.values(percentages).reduce((s, v) => s + Number(v || 0), 0);
      if (Math.abs(sum - 100) > 0.1) {
        setSplitValidationError('Percentages must sum to 100');
        return;
      }
    }

    // Build payload with splits computed according to splitType
    if (selectedPeople.length === 0) {
      setSplitValidationError('Select at least one person to split with.');
      return;
    }

    const tempExpense = {
      amount: cleanedAmount,
      splitWith: selectedPeople,
      splitType,
      splits: splitType === 'byAmount' ? manualSplits : 
              splitType === 'byPercentage' ? percentages : undefined,
      percentages: splitType === 'byPercentage' ? percentages : undefined,
    };
    const computedSplits = calculateSplitsFromExpense(tempExpense);

    const payload = {
      description: description.trim(),
      amount: cleanedAmount,
      paid_by: paidBy,
      date: toDateStr(expenseDate),
      split_with: selectedPeople,
      split_type: splitType,
      splits: computedSplits,
      group_id: expenseGroupId,
    };

    try {
      if (editingExpense) {
        await updateSplitBillExpense(editingExpense.id, payload);
      } else {
        await createSplitBillExpense(user.id, payload);
      }
      await loadData();
      setShowExpenseModal(false);
      resetExpenseForm();
    } catch (error) {
      console.warn('Save expense error', error);
    }
  };

  const savePerson = async () => {
    if (!user?.id) return;
    const cleanedName = personName.trim();
    if (!cleanedName) return;
    const exists = allPeople.some((person) => person.name.toLowerCase() === cleanedName.toLowerCase());
    if (editingPerson) {
      try {
        await updateSplitBillPerson(editingPerson.id, { name: cleanedName });
        await loadData();
        setShowPeopleModal(false);
        setEditingPerson(null);
        setPersonName('');
      } catch (error) {
        console.warn('Update person error', error);
      }
      return;
    }

    if (exists) return;

    try {
      await createSplitBillPerson(user.id, { name: cleanedName });
      await loadData();
      setShowPeopleModal(false);
      setPersonName('');
    } catch (error) {
      console.warn('Create person error', error);
    }
  };

  const deleteExpense = (expense) => {
    setPendingDeleteExpense(expense);
  };

  const deletePerson = (person) => {
    if (person.id === user?.id) return;
    setPendingDeletePerson(person);
  };

  const confirmDeleteExpense = async () => {
    if (!user?.id || !pendingDeleteExpense) return;
    try {
      await deleteSplitBillExpense(pendingDeleteExpense.id);
      await loadData();
    } catch (error) {
      console.warn('Delete expense error', error);
    } finally {
      setPendingDeleteExpense(null);
    }
  };

  const confirmDeletePerson = async () => {
    if (!user?.id || !pendingDeletePerson) return;
    try {
      await deleteSplitBillPerson(pendingDeletePerson.id);
      await loadData();
    } catch (error) {
      console.warn('Delete person error', error);
    } finally {
      setPendingDeletePerson(null);
    }
  };

  const openGroupModal = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setGroupName(group.name);
      setSelectedGroupMembers(group.member_ids || []);
    } else {
      setEditingGroup(null);
      setGroupName('');
      setSelectedGroupMembers([]);
    }
    setShowGroupModal(true);
  };

  const saveGroup = async () => {
    if (!user?.id) return;
    const trimmedName = groupName.trim();
    if (!trimmedName) return;

    const payload = {
      name: trimmedName,
      member_ids: selectedGroupMembers,
    };

    try {
      if (editingGroup) {
        await updateSplitBillGroup(editingGroup.id, payload);
      } else {
        await createSplitBillGroup(user.id, payload);
      }
      await loadData();
      setShowGroupModal(false);
      setEditingGroup(null);
      setGroupName('');
      setSelectedGroupMembers([]);
    } catch (error) {
      console.warn('Save group error', error);
    }
  };

  const deleteGroup = (group) => {
    setPendingDeleteGroup(group);
  };

  const confirmDeleteGroup = async () => {
    if (!user?.id || !pendingDeleteGroup) return;
    try {
      await deleteSplitBillGroup(pendingDeleteGroup.id);
      await loadData();
    } catch (error) {
      console.warn('Delete group error', error);
    } finally {
      setPendingDeleteGroup(null);
    }
  };

  const toggleExpenseDetails = (expenseId) => {
    setExpandedExpenses((current) => {
      const next = new Set(current);
      if (next.has(expenseId)) next.delete(expenseId);
      else next.add(expenseId);
      return next;
    });
  };

  const balanceSummary = useMemo(() => {
    if (!selectedGroup) return [];
    const relevantPeople = allPeople.filter((person) => selectedGroup.member_ids.includes(person.id));
    const expensesForBalance = filteredExpenses;
    const balances = {};
    relevantPeople.forEach((person) => {
      balances[person.id] = 0;
    });

    expensesForBalance.forEach((expense) => {
      const splits = expense.splits && Object.keys(expense.splits).length > 0
        ? expense.splits
        : calculateSplitsFromExpense(expense);

      Object.entries(splits).forEach(([personId, owedAmount]) => {
        const owed = Number(owedAmount) || 0;
        if (personId === expense.paidBy) return;
        if (!(personId in balances) || !(expense.paidBy in balances)) return;
        balances[expense.paidBy] = (balances[expense.paidBy] ?? 0) + owed;
        balances[personId] = (balances[personId] ?? 0) - owed;
      });
    });

    settlements
      .filter((settlement) => settlement.group_id === selectedGroup.id)
      .forEach((settlement) => {
        const amount = Number(settlement.amount) || 0;
        if (!(settlement.from_person in balances) || !(settlement.to_person in balances)) return;
        balances[settlement.to_person] = (balances[settlement.to_person] ?? 0) - amount;
        balances[settlement.from_person] = (balances[settlement.from_person] ?? 0) + amount;
      });

    return Object.entries(balances)
      .map(([personId, amount]) => ({ id: personId, name: personNameById[personId] || personId, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [expenses, filteredExpenses, allPeople, personNameById, selectedGroupId, selectedGroup, settlements]);

  const settlementPlan = useMemo(() => {
    const creditors = balanceSummary.filter((item) => item.amount > 0);
    const debtors = balanceSummary.filter((item) => item.amount < 0);
    const transfers = [];

    const remainingCreditors = creditors.map((item) => ({ ...item }));
    const remainingDebtors = debtors.map((item) => ({ ...item }));

    remainingCreditors.forEach((creditor) => {
      remainingDebtors.forEach((debtor) => {
        if (creditor.amount <= 0 || debtor.amount >= 0) return;
        const transferAmount = Math.min(creditor.amount, Math.abs(debtor.amount));
        if (transferAmount <= 0) return;
        transfers.push({
          key: `${debtor.id}-${creditor.id}-${transfers.length}`,
          from: debtor.name,
          to: creditor.name,
          fromId: debtor.id,
          toId: creditor.id,
          amount: Number(transferAmount.toFixed(2)),
        });
        creditor.amount -= transferAmount;
        debtor.amount += transferAmount;
      });
    });

    return transfers;
  }, [balanceSummary]);

  const effectiveBalanceSummary = balanceSummary;

  const toggleSettlementDetails = (key) => {
    setExpandedSettlementKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const updateSettlementInput = (key, value) => {
    setSettlementInputs((current) => ({ ...current, [key]: value }));
  };

  const settleTransfer = async (key, transfer) => {
    if (!user?.id || !selectedGroupId) return;
    const rawValue = Number(settlementInputs[key] ?? '');
    if (!Number.isFinite(rawValue) || rawValue <= 0) return;
    const amountToSettle = Math.min(rawValue, transfer.amount);
    if (amountToSettle <= 0) return;

    try {
      await createSplitBillSettlement(user.id, {
        group_id: selectedGroupId,
        from_person: transfer.fromId,
        to_person: transfer.toId,
        amount: amountToSettle,
      });
      await loadData();
      setSettlementInputs((current) => ({ ...current, [key]: '' }));
    } catch (error) {
      console.warn('Create settlement error', error);
    }
  };

  const settleTransferFull = async (key, transfer) => {
    if (!user?.id || !selectedGroupId) return;
    const amountToSettle = transfer.amount;
    if (amountToSettle <= 0) return;

    try {
      await createSplitBillSettlement(user.id, {
        group_id: selectedGroupId,
        from_person: transfer.fromId,
        to_person: transfer.toId,
        amount: amountToSettle,
      });
      await loadData();
      setSettlementInputs((current) => ({ ...current, [key]: '' }));
    } catch (error) {
      console.warn('Create settlement error', error);
    }
  };

  const renderGroupSelector = () => {
    if (!groups.length) return null;
    return (
      <View style={[styles.sectionCard, styles.groupFilterSection]}>
        <View style={styles.chipRow}>
          {/* no 'All' option — always pick a group */}
          {groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={[styles.chip, selectedGroupId === group.id && styles.chipActive]}
              onPress={() => setSelectedGroupId(group.id)}
            >
              <Text style={[styles.chipText, selectedGroupId === group.id && styles.chipTextActive]}>{group.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderExpensesTab = () => (
    <View>
      {renderGroupSelector()}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionSubtitle}>{WORDINGS.splitBills.expensesSubtitle}</Text>
      </View>

      {filteredExpenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{WORDINGS.splitBills.noExpenses}</Text>
        </View>
      ) : (
        filteredExpenses.map((expense) => {
          const expanded = expandedExpenses.has(expense.id);
          return (
            <View key={expense.id} style={styles.expenseCard}>
              <TouchableOpacity
                style={styles.expenseTitleRow}
                onPress={() => toggleExpenseDetails(expense.id)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.expenseTitle}>{expense.description}</Text>
                  <Text style={styles.expenseAmount}>LKR {expense.amount.toFixed(2)}</Text>
                </View>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={themeColor('textSecondary')}
                />
              </TouchableOpacity>

              {expanded && (
                <View style={styles.expenseDetails}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>{WORDINGS.splitBills.paidBy}</Text>
                    <Text style={styles.metaValue}>{personNameById[expense.paidBy] || expense.paidBy}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>{WORDINGS.splitBills.date}</Text>
                    <Text style={styles.metaValue}>{expense.date}</Text>
                  </View>
                  {expense.groupId ? (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>{WORDINGS.splitBills.group}</Text>
                      <Text style={styles.metaValue}>{groupNameById[expense.groupId] || WORDINGS.splitBills.noGroups}</Text>
                    </View>
                  ) : null}
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>{WORDINGS.splitBills.splitWith}</Text>
                    <Text style={styles.metaValue}>
                      {expense.splitWith.map((id) => personNameById[id] || id).join(', ')}
                    </Text>
                  </View>
                  <View style={styles.expenseActionRow}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => openExpenseModal(expense)}
                    >
                      <Ionicons name="pencil-outline" size={18} color={themeColor('textPrimary')} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.iconButtonDelete]}
                      onPress={() => deleteExpense(expense)}
                    >
                      <Ionicons name="trash-outline" size={18} color={themeColor('danger')} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );

  const renderBalanceTab = () => (
    <View>
      {renderGroupSelector()}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionSubtitle}>{WORDINGS.splitBills.balanceSubtitle}</Text>
      </View>

      {settlementPlan.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{WORDINGS.splitBills.noSettled}</Text>
        </View>
      ) : (
        settlementPlan.map((transfer) => {
          const expanded = expandedSettlementKeys.has(transfer.key);
          const transferText = transfer.toId === user?.id
            ? `${transfer.from} owes you`
            : transfer.fromId === user?.id
            ? `You owe ${transfer.to}`
            : `${transfer.from} owes ${transfer.to}`;
          return (
            <View key={transfer.key} style={styles.balanceCard}>
              <View style={{ width: '100%' }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                  onPress={() => toggleSettlementDetails(transfer.key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.balanceText}>{transferText}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.balanceAmountSmall}>LKR{transfer.amount.toFixed(2)}</Text>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={themeColor('textSecondary')}
                    />
                  </View>
                </TouchableOpacity>

                {expanded && (
                  <View style={{ marginTop: 10 }}>
                    <View style={styles.splitInputRow}>
                      <TextInput
                        style={styles.splitInput}
                        value={settlementInputs[transfer.key] ?? ''}
                        onChangeText={(value) => updateSettlementInput(transfer.key, value)}
                        placeholder="Amount"
                        placeholderTextColor={themeColor('mutedText')}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity style={styles.miniButton} onPress={() => settleTransfer(transfer.key, transfer)}>
                        <Text style={styles.miniButtonText}>Settle</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.miniButton} onPress={() => settleTransferFull(transfer.key, transfer)}>
                        <Text style={styles.miniButtonText}>Full</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Net balances</Text>
        {effectiveBalanceSummary.map((item) => (
          <View key={item.name} style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>{item.name}</Text>
            <Text style={[styles.balanceValue, item.amount >= 0 ? styles.positive : styles.negative]}>
              {item.amount >= 0 ? `+` : ''}LKR{item.amount.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderGroupsTab = () => (
    <View>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionSubtitle}>{WORDINGS.splitBills.groupsSubtitle}</Text>
      </View>

      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{WORDINGS.splitBills.noGroups}</Text>
        </View>
      ) : (
        groups.map((group) => (
          <View key={group.id} style={styles.personItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.personName}>{group.name}</Text>
              <Text style={styles.metaText}>{group.member_ids.length} members</Text>
              <Text style={styles.metaText}>
                {group.member_ids.map((id) => personNameById[id] || id).join(', ')}
              </Text>
            </View>
            <View style={styles.personRowActions}>
              <TouchableOpacity style={styles.iconButton} onPress={() => openGroupModal(group)}>
                <Ionicons name="pencil-outline" size={18} color={themeColor('textPrimary')} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, styles.iconButtonDelete]} onPress={() => deleteGroup(group)}>
                <Ionicons name="trash-outline" size={18} color={themeColor('danger')} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderGroupModal = () => (
    <Modal visible={showGroupModal} transparent animationType="slide" onRequestClose={() => setShowGroupModal(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowGroupModal(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{editingGroup ? WORDINGS.common.edit : 'New Group'}</Text>
            <TouchableOpacity onPress={() => setShowGroupModal(false)}>
              <Ionicons name="close" size={22} color={themeColor('textPrimary')} />
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>{WORDINGS.splitBills.groupName}</Text>
          <TextInput
            value={groupName}
            onChangeText={setGroupName}
            placeholder={WORDINGS.splitBills.groupNamePlaceholder}
            placeholderTextColor={themeColor('mutedText')}
            style={styles.textInput}
          />

          <Text style={styles.fieldLabel}>{WORDINGS.splitBills.members}</Text>
          <View style={styles.chipRow}>
            {allPeople.map((person) => {
              const isSelected = selectedGroupMembers.includes(person.id);
              return (
                <TouchableOpacity
                  key={`group-member-${person.id}`}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => {
                    setSelectedGroupMembers((current) =>
                      current.includes(person.id)
                        ? current.filter((id) => id !== person.id)
                        : [...current, person.id]
                    );
                  }}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{person.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={saveGroup}>
            <Text style={styles.primaryButtonText}>{WORDINGS.common.save}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderPeopleTab = () => (
    <View>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionSubtitle}>{WORDINGS.splitBills.peopleSubtitle}</Text>
      </View>

      {allPeople.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{WORDINGS.splitBills.noPeople}</Text>
        </View>
      ) : (
        orderedPeople.map((person) => (
          <View key={person.id} style={styles.personItem}>
            <Text style={styles.personName}>{person.name}</Text>
            <View style={styles.personRowActions}>
              {person.id !== user?.id && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => openPersonModal(person)}
                >
                  <Ionicons name="pencil-outline" size={18} color={themeColor('textPrimary')} />
                </TouchableOpacity>
              )}
              {person.id !== user?.id && (
                <TouchableOpacity
                  style={[styles.iconButton, styles.iconButtonDelete]}
                  onPress={() => deletePerson(person)}
                >
                  <Ionicons name="trash-outline" size={18} color={themeColor('danger')} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.pageTitle}>{WORDINGS.splitBills.title}</Text>
        <View style={styles.tabRow}>
          {SPLIT_BILL_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                  {WORDINGS.splitBills[tab.labelKey]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{WORDINGS.common.loading}</Text>
          </View>
        ) : (
          <>
            {activeTab === 'expenses' && renderExpensesTab()}
            {activeTab === 'balance' && renderBalanceTab()}
            {activeTab === 'groups' && renderGroupsTab()}
            {activeTab === 'people' && renderPeopleTab()}
          </>
        )}
      </ScrollView>

      {activeTab === 'expenses' ? (
        <TouchableOpacity style={styles.fab} onPress={() => openExpenseModal(null)}>
          <Ionicons name="add" size={28} color={themeColor('textOnPrimary')} />
        </TouchableOpacity>
      ) : null}

      {activeTab === 'groups' ? (
        <TouchableOpacity style={styles.fab} onPress={() => openGroupModal(null)}>
          <Ionicons name="people-outline" size={24} color={themeColor('textOnPrimary')} />
        </TouchableOpacity>
      ) : null}
      {activeTab === 'people' ? (
        <TouchableOpacity style={styles.fab} onPress={() => openPersonModal(null)}>
          <Ionicons name="person-add" size={24} color={themeColor('textOnPrimary')} />
        </TouchableOpacity>
      ) : null}

      <ConfirmDialog
        visible={!!pendingDeleteExpense}
        title="Delete Expense"
        message={pendingDeleteExpense ? WORDINGS.splitBills.expenseDeleteConfirm(pendingDeleteExpense.description) : ''}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDeleteExpense}
        onCancel={() => setPendingDeleteExpense(null)}
      />

      <ConfirmDialog
        visible={!!pendingDeletePerson}
        title="Delete Person"
        message={pendingDeletePerson ? WORDINGS.splitBills.personDeleteConfirm(pendingDeletePerson.name) : ''}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDeletePerson}
        onCancel={() => setPendingDeletePerson(null)}
      />

      <ConfirmDialog
        visible={!!pendingDeleteGroup}
        title="Delete Group"
        message={pendingDeleteGroup ? `Delete "${pendingDeleteGroup.name}"? This can't be undone.` : ''}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDeleteGroup}
        onCancel={() => setPendingDeleteGroup(null)}
      />

      <Modal visible={showExpenseModal} transparent animationType="slide" onRequestClose={() => setShowExpenseModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowExpenseModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {editingExpense ? WORDINGS.splitBills.editExpense : WORDINGS.splitBills.newExpense}
              </Text>
              <TouchableOpacity onPress={() => setShowExpenseModal(false)}>
                <Ionicons name="close" size={22} color={themeColor('textPrimary')} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>{WORDINGS.splitBills.description}</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={WORDINGS.splitBills.description}
              placeholderTextColor={themeColor('mutedText')}
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>{WORDINGS.splitBills.amount}</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={themeColor('mutedText')}
              keyboardType="decimal-pad"
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>{WORDINGS.splitBills.paidBy}</Text>
            <View style={styles.chipRow}>
              {peopleForCurrentGroup.map((person) => (
                <TouchableOpacity
                  key={person.id}
                  style={[styles.chip, paidBy === person.id && styles.chipActive]}
                  onPress={() => setPaidBy(person.id)}
                >
                  <Text style={[styles.chipText, paidBy === person.id && styles.chipTextActive]}>{person.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>{WORDINGS.splitBills.date}</Text>
            <TouchableOpacity style={styles.datePickerTrigger} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.datePickerText}>{toDateStr(expenseDate)}</Text>
              <Ionicons name="calendar-outline" size={20} color={themeColor('textSecondary')} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={expenseDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            <Text style={styles.fieldLabel}>{WORDINGS.splitBills.splitWith}</Text>
            <View style={styles.chipRow}>
              {peopleForCurrentGroup.map((person) => {
                const isSelected = selectedPeople.includes(person.id);
                return (
                  <TouchableOpacity
                    key={`${person.id}-split`}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => togglePersonSelection(person.id)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{person.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>{WORDINGS.splitBills.splitTypeLabel}</Text>
            <View style={styles.chipRow}>
              {['equally', 'byAmount', 'byPercentage'].map((type) => (
                <TouchableOpacity
                  key={`split-${type}`}
                  style={[styles.chip, splitType === type && styles.chipActive]}
                  onPress={() => {
                    setSplitType(type);
                    setSplitValidationError('');
                  }}
                >
                  <Text style={[styles.chipText, splitType === type && styles.chipTextActive]}>
                    {type === 'equally' ? 'Equally' : type === 'byAmount' ? 'By Amount' : 'By %'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {splitType === 'byAmount' && selectedPeople.length > 0 && (
              <View>
                <Text style={styles.fieldLabel}>{WORDINGS.splitBills.amountPerPerson}</Text>
                {selectedPeople.map((personId) => (
                  <View key={`amt-${personId}`} style={styles.splitInputRow}>
                    <Text style={styles.splitInputLabel}>{personNameById[personId] || personId}</Text>
                    <TextInput
                      value={String(manualSplits[personId] || '')}
                      onChangeText={(val) => {
                        setManualSplits({ ...manualSplits, [personId]: val });
                        setSplitValidationError('');
                      }}
                      placeholder="0.00"
                      placeholderTextColor={themeColor('mutedText')}
                      keyboardType="decimal-pad"
                      style={styles.splitInput}
                    />
                  </View>
                ))}
              </View>
            )}

            {splitType === 'byPercentage' && selectedPeople.length > 0 && (
              <View>
                <Text style={styles.fieldLabel}>{WORDINGS.splitBills.percentagePerPerson}</Text>
                {selectedPeople.map((personId) => (
                  <View key={`pct-${personId}`} style={styles.splitInputRow}>
                    <Text style={styles.splitInputLabel}>{personNameById[personId] || personId}</Text>
                    <View style={styles.percentageInputContainer}>
                      <TextInput
                        value={String(percentages[personId] || '')}
                        onChangeText={(val) => {
                          setPercentages({ ...percentages, [personId]: val });
                          setSplitValidationError('');
                        }}
                        placeholder="0"
                        placeholderTextColor={themeColor('mutedText')}
                        keyboardType="decimal-pad"
                        style={styles.splitInput}
                      />
                      <Text style={styles.percentageSymbol}>%</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {splitValidationError && (
              <Text style={styles.errorText}>{splitValidationError}</Text>
            )}

            <TouchableOpacity style={styles.primaryButton} onPress={saveExpense}>
              <Text style={styles.primaryButtonText}>{WORDINGS.common.save}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showPeopleModal} transparent animationType="slide" onRequestClose={() => setShowPeopleModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowPeopleModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editingPerson ? WORDINGS.common.edit : WORDINGS.splitBills.addPerson}</Text>
              <TouchableOpacity onPress={() => setShowPeopleModal(false)}>
                <Ionicons name="close" size={22} color={themeColor('textPrimary')} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>{WORDINGS.splitBills.personName}</Text>
            <TextInput
              value={personName}
              onChangeText={setPersonName}
              placeholder={WORDINGS.splitBills.enterPersonName}
              placeholderTextColor={themeColor('mutedText')}
              style={styles.textInput}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={savePerson}>
              <Text style={styles.primaryButtonText}>{WORDINGS.common.save}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {renderGroupModal()}
    </View>
  );
}

