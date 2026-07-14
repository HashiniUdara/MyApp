import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ConfirmDialog from "../common/ConfirmDialog";
import { useCategories } from "../../store/categoryStore/CategoryContext";
import { TODO_CATEGORY_COLORS, TODO_CATEGORY_ICONS } from "../../config/appConstants";
import { WORDINGS } from "../../config/wordings";
import styles from "./SettingsScreen.styles";
import { themeColor } from '../../config/theme';

const showError = (message, err) =>
  Alert.alert(message, err?.message ?? WORDINGS.common.pleaseTryAgain);

function SmallButton({ label, icon, danger, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.smallBtn, danger && styles.dangerBtn]}
      onPress={onPress}
    >
      {icon && (
        <Ionicons name={icon} size={13} color={danger ? themeColor('danger') : themeColor('textPrimary')} />
      )}
      <Text style={[styles.smallBtnText, danger && styles.dangerText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function TextPrompt({ value, onChangeText, placeholder }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={themeColor('mutedText')}
      style={styles.input}
    />
  );
}

function CollapsibleSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={styles.cardTitle}>{title}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={themeColor('textPrimary')}
        />
      </TouchableOpacity>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

// Tracks which individual category rows (by key) are expanded within a
// section. Each category row starts collapsed, showing just its name;
// tapping the chevron reveals its details (subcategories, edit/delete
// controls, color/icon pickers, etc).
function useOpenRows() {
  const [openKeys, setOpenKeys] = useState(() => new Set());
  const isOpen = (key) => openKeys.has(key);
  const toggle = (key) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  return { isOpen, toggle };
}

function RowChevron({ open }) {
  return (
    <Ionicons
      name={open ? "chevron-up" : "chevron-down"}
      size={16}
      color={themeColor('textSecondary')}
    />
  );
}

function TransactionCategoryManager({
  title,
  type,
  categories,
  api,
  defaultOpen,
}) {
  const [newCategory, setNewCategory] = useState("");
  const [editingCat, setEditingCat] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [newSubs, setNewSubs] = useState({});
  const [editingSub, setEditingSub] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const { isOpen, toggle } = useOpenRows();

  const rows = useMemo(
    () =>
      Object.entries(categories).map(([name, subcategories]) => ({
        ...(api.txRows?.find((r) => r.type === type && r.name === name) ?? {}),
        name,
        subcategories,
      })),
    [categories, api.txRows, type],
  );

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await api.addTransactionCategory(type, newCategory);
      setNewCategory("");
    } catch (e) {
      showError(WORDINGS.errors.addCategory, e);
    }
  };

  const saveCategory = async (row) => {
    if (!row.id)
      return Alert.alert(
        WORDINGS.settings.categoryNotSavedTitle,
        WORDINGS.settings.categoryNotSavedMessage,
      );
    try {
      await api.renameTransactionCategory(row.id, editingValue);
      setEditingCat(null);
    } catch (e) {
      showError(WORDINGS.errors.updateCategory, e);
    }
  };

  const askDeleteCategory = (row) => {
    if (!row.id)
      return Alert.alert(
        WORDINGS.settings.categoryNotSavedTitle,
        WORDINGS.settings.categoryNotSavedDeleteMessage,
      );
    setPendingDelete({ kind: "category", row });
  };

  const askDeleteSubcategory = (row, sub) => {
    if (!row.id)
      return Alert.alert(
        WORDINGS.settings.categoryNotSavedTitle,
        WORDINGS.settings.subcategoryNotSavedDeleteMessage,
      );
    setPendingDelete({ kind: "subcategory", row, sub });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.kind === "category") {
        await api.removeTransactionCategory(pendingDelete.row.id);
      } else {
        await api.removeTransactionSubcategory(
          pendingDelete.row,
          pendingDelete.sub,
        );
      }
    } catch (e) {
      showError(
        pendingDelete.kind === "category"
          ? WORDINGS.errors.deleteCategory
          : WORDINGS.errors.deleteSubcategory,
        e,
      );
    } finally {
      setPendingDelete(null);
    }
  };

  const addSubcategory = async (row) => {
    if (!row.id)
      return Alert.alert(
        WORDINGS.settings.categoryNotSavedTitle,
        WORDINGS.settings.categoryNotSavedAddSubMessage,
      );
    try {
      await api.addTransactionSubcategory(row, newSubs[row.id] ?? "");
      setNewSubs((s) => ({ ...s, [row.id]: "" }));
    } catch (e) {
      showError(WORDINGS.errors.addSubcategory, e);
    }
  };

  const saveSubcategory = async (row, oldName) => {
    try {
      await api.renameTransactionSubcategory(row, oldName, editingSub.value);
      setEditingSub(null);
    } catch (e) {
      showError(WORDINGS.errors.updateSubcategory, e);
    }
  };

  return (
    <CollapsibleSection title={title} defaultOpen={defaultOpen}>
      <View style={styles.addRow}>
        <TextPrompt
          value={newCategory}
          onChangeText={setNewCategory}
          placeholder={WORDINGS.settings.newCategory}
        />
        <SmallButton label={WORDINGS.common.add} icon="add" onPress={addCategory} />
      </View>
      {rows.map((row) => {
        const rowKey = `${type}-${row.id ?? row.name}`;
        const open = isOpen(rowKey);
        return (
        <View key={rowKey} style={styles.categoryBox}>
          <TouchableOpacity
            style={styles.categoryHeader}
            activeOpacity={0.8}
            onPress={() => toggle(rowKey)}
          >
            {editingCat === row.id ? (
              <TextInput
                value={editingValue}
                onChangeText={setEditingValue}
                style={[styles.input, { flex: 1 }]}
              />
            ) : (
              <Text style={styles.categoryName}>{row.name}</Text>
            )}
            <Text style={styles.subCount}>{(row.subcategories ?? []).length}</Text>
            <RowChevron open={open} />
          </TouchableOpacity>
          {open && (
            <View style={styles.sectionBody}>
              <View style={styles.categoryHeader}>
                {editingCat === row.id ? (
                  <SmallButton
                    label={WORDINGS.common.save}
                    icon="checkmark"
                    onPress={() => saveCategory(row)}
                  />
                ) : (
                  <SmallButton
                    label={WORDINGS.common.edit}
                    icon="create-outline"
                    onPress={() => {
                      if (!row.id)
                        return Alert.alert(
                          WORDINGS.settings.categoryNotSavedTitle,
                          WORDINGS.settings.categoryNotSavedMessage,
                        );
                      setEditingCat(row.id);
                      setEditingValue(row.name);
                    }}
                  />
                )}
                <SmallButton
                  label={WORDINGS.common.delete}
                  icon="trash-outline"
                  danger
                  onPress={() => askDeleteCategory(row)}
                />
              </View>
              <Text style={styles.subTitle}>{WORDINGS.settings.subcategories}</Text>
              {(row.subcategories ?? []).map((sub) => (
            <View key={sub} style={styles.subRow}>
              {editingSub?.rowId === row.id && editingSub?.oldName === sub ? (
                <TextInput
                  value={editingSub.value}
                  onChangeText={(v) =>
                    setEditingSub({ ...editingSub, value: v })
                  }
                  style={[styles.input, { flex: 1 }]}
                />
              ) : (
                <Text style={styles.subName}>{sub}</Text>
              )}
              {editingSub?.rowId === row.id && editingSub?.oldName === sub ? (
                <SmallButton
                  label={WORDINGS.common.save}
                  icon="checkmark"
                  onPress={() => saveSubcategory(row, sub)}
                />
              ) : (
                <SmallButton
                  label={WORDINGS.common.edit}
                  icon="create-outline"
                  onPress={() => {
                    if (!row.id)
                      return Alert.alert(
                        WORDINGS.settings.categoryNotSavedTitle,
                        WORDINGS.settings.subcategoryNotSavedMessage,
                      );
                    setEditingSub({ rowId: row.id, oldName: sub, value: sub });
                  }}
                />
              )}
              <TouchableOpacity
                onPress={() => askDeleteSubcategory(row, sub)}
                style={styles.iconBtn}
              >
                <Ionicons name="trash-outline" size={15} color={themeColor('danger')} />
              </TouchableOpacity>
            </View>
              ))}
              <View style={styles.addRow}>
                <TextPrompt
                  value={newSubs[row.id] ?? ""}
                  onChangeText={(v) => setNewSubs((s) => ({ ...s, [row.id]: v }))}
                  placeholder={WORDINGS.settings.newSubcategory}
                />
                <SmallButton
                  label={WORDINGS.common.add}
                  icon="add"
                  onPress={() => addSubcategory(row)}
                />
              </View>
            </View>
          )}
        </View>
        );
      })}
      <ConfirmDialog
        visible={!!pendingDelete}
        title={
          pendingDelete?.kind === "subcategory"
            ? WORDINGS.settings.deleteSubcategoryTitle
            : WORDINGS.settings.deleteCategoryTitle
        }
        message={
          pendingDelete?.kind === "subcategory"
            ? WORDINGS.settings.deleteSubcategoryMessage(pendingDelete.sub, pendingDelete.row.name)
            : pendingDelete
              ? WORDINGS.settings.deleteCategoryMessage(pendingDelete.row.name)
              : ""
        }
        confirmLabel={WORDINGS.common.delete}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </CollapsibleSection>
  );
}

function TodoCategoryManager({ categories, api, defaultOpen }) {
  const [label, setLabel] = useState("");
  const [edit, setEdit] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const { isOpen, toggle } = useOpenRows();
  const askDelete = (row) => setPendingDelete(row);
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await api.removeTodoCategory(pendingDelete.id);
    } catch (e) {
      showError(WORDINGS.errors.deleteTodoCategory, e);
    } finally {
      setPendingDelete(null);
    }
  };
  const addTodo = async () => {
    if (!label.trim()) return;
    try {
      await api.addTodoCategory(label);
      setLabel("");
    } catch (e) {
      showError(WORDINGS.errors.addTodoCategory, e);
    }
  };
  const saveTodo = async (row) => {
    try {
      await api.renameTodoCategory(row.id, edit.label);
      setEdit(null);
    } catch (e) {
      showError(WORDINGS.errors.updateTodoCategory, e);
    }
  };
  return (
    <CollapsibleSection title={WORDINGS.settings.todoCategories} defaultOpen={defaultOpen}>
      <View style={styles.addRow}>
        <TextPrompt
          value={label}
          onChangeText={setLabel}
          placeholder={WORDINGS.settings.newTodoCategory}
        />
        <SmallButton label={WORDINGS.common.add} icon="add" onPress={addTodo} />
      </View>
      {categories.map((row) => {
        const open = isOpen(row.id);
        return (
        <View key={row.id} style={styles.todoRow}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
            activeOpacity={0.8}
            onPress={() => toggle(row.id)}
          >
            <View style={[styles.colorDot, { backgroundColor: row.color }]}>
              <Ionicons name={row.icon} size={14} color={themeColor('textOnPrimary')} />
            </View>
            {edit?.id === row.id ? (
              <TextInput
                value={edit?.label ?? ''}
                onChangeText={(v) => setEdit({ ...edit, label: v })}
                style={[styles.input, { flex: 1 }]}
              />
            ) : (
              <Text style={styles.categoryName}>{row.label}</Text>
            )}
            <RowChevron open={open} />
          </TouchableOpacity>
          {open && (
            <View style={styles.styleRow}>
              {edit?.id === row.id ? (
                <SmallButton
                  label={WORDINGS.common.save}
                  icon="checkmark"
                  onPress={() => saveTodo(row)}
                />
              ) : (
                <SmallButton
                  label={WORDINGS.common.edit}
                  icon="create-outline"
                  onPress={() => setEdit({ id: row.id, label: row.label })}
                />
              )}
              <SmallButton
                label={WORDINGS.common.delete}
                icon="trash-outline"
                danger
                onPress={() => askDelete(row)}
              />
            </View>
          )}
          {open && (
            <View style={styles.styleRow}>
              {TODO_CATEGORY_COLORS.map((c, index) => (
                <TouchableOpacity
                  key={`${c}-${index}`}
                  style={[
                    styles.colorPick,
                    { backgroundColor: c },
                    row.color === c && styles.pickActive,
                  ]}
                  onPress={() =>
                    api
                      .updateTodoCategoryStyle(row.id, { color: c })
                      .catch((e) => showError(WORDINGS.errors.updateColor, e))
                  }
                />
              ))}
            </View>
          )}
          {open && (
            <View style={styles.styleRow}>
              {TODO_CATEGORY_ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[styles.iconPick, row.icon === ic && styles.pickActive]}
                  onPress={() =>
                    api
                      .updateTodoCategoryStyle(row.id, { icon: ic })
                      .catch((e) => showError(WORDINGS.errors.updateIcon, e))
                  }
                >
                  <Ionicons name={ic} size={14} color={themeColor('textPrimary')} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        );
      })}
      <ConfirmDialog
        visible={!!pendingDelete}
        title={WORDINGS.settings.deleteTodoCategoryTitle}
        message={
          pendingDelete
            ? WORDINGS.settings.deleteCategoryMessage(pendingDelete.label)
            : ""
        }
        confirmLabel={WORDINGS.common.delete}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </CollapsibleSection>
  );
}

function SavingCategoryManager({ categories, api, defaultOpen }) {
  const [label, setLabel] = useState("");
  const [edit, setEdit] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const { isOpen, toggle } = useOpenRows();

  const addSaving = async () => {
    if (!label.trim()) return;
    try {
      await api.addSavingCategory(label);
      setLabel("");
    } catch (e) {
      showError(WORDINGS.errors.addSavingCategory, e);
    }
  };

  const saveSaving = async (row) => {
    try {
      await api.renameSavingCategory(row.id, edit.label);
      setEdit(null);
    } catch (e) {
      showError(WORDINGS.errors.updateSavingCategory, e);
    }
  };

  const askDelete = (row) => {
    if (!row.id)
      return Alert.alert(
        WORDINGS.settings.categoryNotSavedTitle,
        WORDINGS.settings.categoryNotSavedDeleteMessage,
      );
    setPendingDelete(row);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await api.removeSavingCategory(pendingDelete.id);
    } catch (e) {
      showError(WORDINGS.errors.deleteSavingCategory, e);
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <CollapsibleSection title={WORDINGS.settings.savingCategories} defaultOpen={defaultOpen}>
      <View style={styles.addRow}>
        <TextPrompt
          value={label}
          onChangeText={setLabel}
          placeholder={WORDINGS.settings.newSavingCategory}
        />
        <SmallButton label={WORDINGS.common.add} icon="add" onPress={addSaving} />
      </View>
      {categories.filter(Boolean).map((row, index) => {
        const rowLabel = row.label ?? '';
        const rowKey = row.id ?? `${rowLabel || 'saving-category'}-${index}`;
        const open = isOpen(rowKey);
        return (
        <View key={rowKey} style={styles.todoRow}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
            activeOpacity={0.8}
            onPress={() => toggle(rowKey)}
          >
            {edit?.id === row.id ? (
              <TextInput
                value={edit?.label ?? ''}
                onChangeText={(v) => setEdit({ ...edit, label: v })}
                style={[styles.input, { flex: 1 }]}
              />
            ) : (
              <Text style={styles.categoryName}>{rowLabel}</Text>
            )}
            <RowChevron open={open} />
          </TouchableOpacity>
          {open && (
            <View style={styles.styleRow}>
              {edit?.id === row.id ? (
                <SmallButton
                  label={WORDINGS.common.save}
                  icon="checkmark"
                  onPress={() => saveSaving(row)}
                />
              ) : (
                <SmallButton
                  label={WORDINGS.common.edit}
                  icon="create-outline"
                  onPress={() => {
                    if (!row.id)
                      return Alert.alert(
                        WORDINGS.settings.categoryNotSavedTitle,
                        WORDINGS.settings.categoryNotSavedMessage,
                      );
                    setEdit({ id: row.id, label: rowLabel });
                  }}
                />
              )}
              <SmallButton
                label={WORDINGS.common.delete}
                icon="trash-outline"
                danger
                onPress={() => askDelete(row)}
              />
            </View>
          )}
        </View>
        );
      })}
      <ConfirmDialog
        visible={!!pendingDelete}
        title={WORDINGS.settings.deleteSavingCategoryTitle}
        message={
          pendingDelete
            ? WORDINGS.settings.deleteSavingCategoryMessage(pendingDelete.label)
            : ""
        }
        confirmLabel={WORDINGS.common.delete}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </CollapsibleSection>
  );
}

export default function SettingsScreen() {
  const cats = useCategories();
  const api = { ...cats, txRows: cats.transactionCategoryRows ?? [] };
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{WORDINGS.settings.title}</Text>
      <Text style={styles.description}>{WORDINGS.settings.description}</Text>
      <TransactionCategoryManager
        title={WORDINGS.settings.incomeCategories}
        type="income"
        categories={cats.incomeCategories}
        api={api}
      />
      <TransactionCategoryManager
        title={WORDINGS.settings.expenseCategories}
        type="expense"
        categories={cats.expenseCategories}
        api={api}
      />
      <SavingCategoryManager categories={cats.savingCategories} api={api} />
      <TodoCategoryManager categories={cats.todoCategories} api={api} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
