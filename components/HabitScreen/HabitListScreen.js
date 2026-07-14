import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, TextInput, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabits } from '../../store/habitStore/HabitContext';
import ConfirmDialog from '../common/ConfirmDialog';
import styles from './HabitListScreen.styles';
import { themeColor } from '../../config/theme';

const EMOJIS = ['🏃','📚','💧','🧘','💪','🥗','😴','🎯','✍️','🎵','🧹','💊','🚴','🌿','🔥','⭐'];

export default function HabitListScreen({ onSelectHabit }) {
  const { habits, addHabit, editHabit, removeHabit, streak, COLORS } = useHabits();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [name,  setName]  = useState('');
  const [emoji, setEmoji] = useState('🏃');
  const [color, setColor] = useState(COLORS[0]);
  const [pendingDelete, setPendingDelete] = useState(null);

  const resetForm = () => {
    setEditingHabit(null);
    setName('');
    setEmoji('🏃');
    setColor(COLORS[0]);
  };

  const openAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (habit) => {
    setEditingHabit(habit);
    setName(habit.name ?? '');
    setEmoji(habit.emoji ?? '🏃');
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
    else await addHabit(payload);
    closeSheet();
  };

  const confirmDelete = () => {
    if (pendingDelete) removeHabit(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Habits</Text>

        {habits.length === 0 && (
          <Text style={styles.empty}>No habits yet. Tap + to add your first one!</Text>
        )}

        {habits.map(habit => {
          const s = streak(habit.id);
          return (
            <TouchableOpacity
              key={habit.id}
              style={[styles.habitRow, { borderLeftColor: habit.color, borderLeftWidth: 4 }]}
              onPress={() => onSelectHabit(habit)}
              activeOpacity={0.75}
            >
              <View style={[styles.emojiCircle, { backgroundColor: habit.color + '22' }]}> 
                <Text style={styles.emojiText}>{habit.emoji}</Text>
              </View>
              <View style={styles.habitInfo}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <Text style={styles.habitSub}>{s > 0 ? `🔥 ${s} day streak` : 'No streak yet'}</Text>
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(habit)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="pencil" size={18} color={themeColor('primary')} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setPendingDelete(habit)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={18} color={themeColor('danger')} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Ionicons name="add" size={28} color={themeColor('textPrimary')} />
      </TouchableOpacity>

      <ConfirmDialog
        visible={!!pendingDelete}
        title="Delete Habit"
        message={pendingDelete ? `Delete "${pendingDelete.name}"? This can't be undone.` : ''}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeSheet}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeSheet} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{editingHabit ? 'Edit Habit' : 'New Habit'}</Text>

            <TextInput
              style={styles.input}
              placeholder="Habit name  (e.g. Exercise)"
              placeholderTextColor={themeColor('mutedText')}
              value={name}
              onChangeText={setName}
              maxLength={40}
            />

            <Text style={styles.sheetLabel}>Icon</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map(e => (
                <TouchableOpacity key={e} style={[styles.emojiOption, emoji === e && styles.emojiOptionActive]} onPress={() => setEmoji(e)}>
                  <Text style={styles.emojiOptionText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sheetLabel}>Color</Text>
            <View style={styles.colorRow}>
              {COLORS.map((c, index) => (
                <TouchableOpacity key={`${c}-${index}`} style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]} onPress={() => setColor(c)} />
              ))}
            </View>

            <TouchableOpacity style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]} onPress={handleSave}>
              <Text style={styles.addBtnText}>{editingHabit ? 'Save Changes' : 'Add Habit'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}