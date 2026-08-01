import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ConfirmDialog from "../common/ConfirmDialog";
import { useCategories } from "../../store/categoryStore/CategoryContext";
import {
  fetchSavings,
  createSaving,
  updateSaving,
  deleteSaving,
} from "../../store/savingApi";
import { WORDINGS } from "../../config/wordings";
import styles from "./SavingsScreen.styles";
import { themeColor } from '../../config/theme';

const pad = (n) => String(n).padStart(2, "0");
const todayText = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function CategoryModal({ visible, categories, onSelect, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{WORDINGS.savings.selectCategory}</Text>
          <FlatList
            data={categories}
            keyExtractor={(item) => String(item.id ?? item.label)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  onSelect(item.label);
                  onClose();
                }}
              >
                <Text style={styles.modalOptionText}>{item.label}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => (
              <View style={styles.modalSeparator} />
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function SavingsScreen({ userId }) {
  const { savingCategories } = useCategories();
  const [items, setItems] = useState([]);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayText());
  const [note, setNote] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setItems((await fetchSavings(userId)) ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  const sortedItems = useMemo(
    () =>
      [...(items ?? [])].sort((a, b) => {
        const dateCompare = String(b.date ?? "").localeCompare(
          String(a.date ?? ""),
        );
        if (dateCompare !== 0) return dateCompare;
        return String(b.created_at ?? b.id ?? "").localeCompare(
          String(a.created_at ?? a.id ?? ""),
        );
      }),
    [items],
  );

  const totals = useMemo(() => {
    const byCategory = {};
    let total = 0;
    (items ?? []).forEach((item) => {
      const value = Number(item.amount ?? 0);
      total += value;
      const key = item.category || WORDINGS.savings.uncategorized;
      byCategory[key] = (byCategory[key] ?? 0) + value;
    });
    return { total, byCategory };
  }, [items]);

  const resetForm = () => {
    setEditing(null);
    setCategory("");
    setAmount("");
    setDate(todayText());
    setNote("");
    setError(null);
  };

  const openNew = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setCategory(item.category ?? "");
    setAmount(String(item.amount ?? ""));
    setDate(item.date ?? todayText());
    setNote(item.note ?? "");
    setError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    resetForm();
  };

  const save = async () => {
    const value = Number(amount);
    if (!category) {
      setError(WORDINGS.savings.categoryRequired);
      return;
    }
    if (!value || value <= 0) {
      setError(WORDINGS.savings.amountRequired);
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const payload = { category, amount: value, date, note: note.trim() };
      if (editing?.id) {
        const updated = await updateSaving(editing.id, payload);
        setItems((prev) =>
          prev.map((row) => (row.id === editing.id ? updated : row)),
        );
      } else {
        const saved = await createSaving(userId, payload);
        setItems((prev) => [saved, ...prev]);
      }
      closeForm();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteSaving(pendingDelete.id);
      setItems((prev) => prev.filter((row) => row.id !== pendingDelete.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{WORDINGS.savings.title}</Text>
        <Text style={styles.description}>{WORDINGS.savings.description}</Text>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>{WORDINGS.savings.total}</Text>
          <Text style={styles.totalValue}>{totals.total.toFixed(2)}</Text>
          <View style={styles.grid}>
            {Object.entries(totals.byCategory).map(([label, value]) => (
              <View key={label} style={styles.categoryBox}>
                <Text style={styles.categoryLabel}>{label}</Text>
                <Text style={styles.categoryValue}>
                  {Number(value).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={openNew}
          activeOpacity={0.85}
        >
          <Text style={styles.addBtnText}>{WORDINGS.savings.add}</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setRecordsOpen((v) => !v)}
            activeOpacity={0.85}
          >
            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>
              {WORDINGS.savings.records}
            </Text>
            <Ionicons
              name={recordsOpen ? "chevron-up" : "chevron-down"}
              size={20}
              color={themeColor('textPrimary')}
            />
          </TouchableOpacity>
          {recordsOpen && (
            <View style={styles.sectionBody}>
              {loading ? (
                <Text style={styles.emptyText}>{WORDINGS.savings.loading}</Text>
              ) : null}
              {!loading && sortedItems.length === 0 ? (
                <Text style={styles.emptyText}>{WORDINGS.savings.empty}</Text>
              ) : null}
              {sortedItems.map((item) => (
                <View key={item.id} style={styles.item}>
                  <View style={styles.itemTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemCategory}>{item.category}</Text>
                      <Text style={styles.itemMeta}>{item.date}</Text>
                      {!!item.note && (
                        <Text style={styles.itemNote}>{item.note}</Text>
                      )}
                    </View>
                    <Text style={styles.itemAmount}>
                      {Number(item.amount).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.smallBtn}
                      onPress={() => openEdit(item)}
                    >
                      <Ionicons name="create-outline" size={14} color={themeColor('textPrimary')} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallBtn, styles.dangerBtn]}
                      onPress={() => setPendingDelete(item)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={14}
                        color={themeColor('danger')}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {error && !formOpen && <Text style={styles.error}>{error}</Text>}
        <View style={{ height: 30 }} />
      </ScrollView>

      <ConfirmDialog
        visible={!!pendingDelete}
        title={WORDINGS.savings.deleteTitle}
        message={
          pendingDelete
            ? WORDINGS.savings.deleteMessage(Number(pendingDelete.amount).toFixed(2), pendingDelete.category)
            : ""
        }
        confirmLabel={WORDINGS.common.delete}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <Modal
        visible={formOpen}
        transparent
        animationType="slide"
        onRequestClose={closeForm}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={closeForm}
          />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>
              {editing ? WORDINGS.savings.edit : WORDINGS.savings.add}
            </Text>
            <TouchableOpacity
              style={[styles.input, styles.dropdown]}
              onPress={() => setShowCategoryModal(true)}
              activeOpacity={0.8}
            >
              <Text style={category ? styles.selectedText : styles.placeholder}>
                {category || WORDINGS.savings.categoryPlaceholder}
              </Text>
              <Ionicons name="chevron-down" size={18} color={themeColor('textPrimary')} />
            </TouchableOpacity>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.rowInput]}
                value={amount}
                onChangeText={setAmount}
                placeholder={WORDINGS.savings.amountPlaceholder}
                placeholderTextColor={themeColor('mutedText')}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.rowInput]}
                value={date}
                onChangeText={setDate}
                placeholder={WORDINGS.savings.datePlaceholder}
                placeholderTextColor={themeColor('mutedText')}
              />
            </View>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder={WORDINGS.savings.notePlaceholder}
              placeholderTextColor={themeColor('mutedText')}
            />
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={save}
              disabled={saving}
            >
              <Text style={styles.saveText}>
                {saving ? WORDINGS.common.saving : editing ? WORDINGS.common.saveChanges : WORDINGS.savings.add}
              </Text>
            </TouchableOpacity>
            {error && <Text style={styles.error}>{error}</Text>}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CategoryModal
        visible={showCategoryModal}
        categories={savingCategories}
        onSelect={setCategory}
        onClose={() => setShowCategoryModal(false)}
      />
    </View>
  );
}
