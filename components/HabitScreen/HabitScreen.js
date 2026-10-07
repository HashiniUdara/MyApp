import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabits } from '../../store/habitStore/HabitContext';
import ConfirmDialog from '../common/ConfirmDialog';
import HabitListScreen   from './HabitListScreen';
import HabitDetailScreen from './HabitDetailScreen';
import styles from './HabitListScreen.styles';
import { themeColor } from '../../config/theme';
import { WORDINGS } from '../../config/wordings';
import { EMOJIS } from '../../config/appConstants';

/**
 * HabitScreen
 *
 * Owns ALL mutable UI state — the add/edit modal and the delete dialog —
 * so they are always mounted and work from both the list and detail views.
 *
 * HabitListScreen and HabitDetailScreen are purely presentational:
 * they receive callbacks and call them; they never own modal state.
 */
export default function HabitScreen() {
  const { habits, addHabit, editHabit, removeHabit, COLORS } = useHabits();

  const [selectedHabit, setSelectedHabit] = useState(null);

  // ── Modal state ──────────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [name,         setName]         = useState('');
  const [emoji,        setEmoji]        = useState(EMOJIS[0]);
  const [color,        setColor]        = useState(COLORS[0]);

  // ── Delete dialog state ──────────────────────────────────────────
  const [pendingDelete, setPendingDelete] = useState(null);

  // ── Modal helpers ────────────────────────────────────────────────
  const resetForm = () => {
    setEditingHabit(null);
    setName('');
    setEmoji(EMOJIS[0]);
    setColor(COLORS[0]);
  };

  const openAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (habit) => {
    setEditingHabit(habit);
    setName(habit.name ?? '');
    setEmoji(habit.emoji ?? EMOJIS[0]);
    setColor(habit.color ?? COLORS[0]);
    setModalVisible(true);
  };

  const closeSheet = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const payload = { name: name.trim(), emoji, color };
    if (editingHabit) await editHabit(editingHabit.id, payload);
    else              await addHabit(payload);
    closeSheet();
  };

  // ── Delete helpers ───────────────────────────────────────────────
  const openDelete = (habit) => setPendingDelete(habit);

  const confirmDelete = () => {
    if (pendingDelete) removeHabit(pendingDelete.id);
    setPendingDelete(null);
    // If we were viewing the deleted habit's detail, go back to the list
    if (selectedHabit?.id === pendingDelete?.id) setSelectedHabit(null);
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>

      {/* Sub-screens — only one renders at a time */}
      {selectedHabit ? (
        <HabitDetailScreen
          habit={selectedHabit}
          onBack={() => setSelectedHabit(null)}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      ) : (
        <HabitListScreen
          onSelectHabit={setSelectedHabit}
          onAddHabit={openAdd}
          onEditHabit={openEdit}
          onDeleteHabit={openDelete}
        />
      )}

      {/* Delete confirm dialog — always mounted */}
      <ConfirmDialog
        visible={!!pendingDelete}
        title={WORDINGS.habits.confirmDelete}
        message={pendingDelete ? WORDINGS.common.deleteMessage(pendingDelete.name) : ''}
        confirmLabel={WORDINGS.common.delete}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {/* Add / edit modal — always mounted */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeSheet}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeSheet} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>
              {editingHabit ? WORDINGS.habits.editHabit : WORDINGS.habits.newHabit}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={WORDINGS.habits.habitNamePlaceholder}
              placeholderTextColor={themeColor('mutedText')}
              value={name}
              onChangeText={setName}
              maxLength={40}
            />

            <Text style={styles.sheetLabel}>{WORDINGS.habits.iconLabel}</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiOption, emoji === e && styles.emojiOptionActive]}
                  onPress={() => setEmoji(e)}
                >
                  <Text style={styles.emojiOptionText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sheetLabel}>{WORDINGS.habits.colorLabel}</Text>
            <View style={styles.colorRow}>
              {COLORS.map((c, index) => (
                <TouchableOpacity
                  key={`${c}-${index}`}
                  style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
              onPress={handleSave}
            >
              <Text style={styles.addBtnText}>
                {editingHabit ? WORDINGS.common.saveChanges : WORDINGS.common.add}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}
