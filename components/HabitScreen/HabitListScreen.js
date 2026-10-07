import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabits } from '../../store/habitStore/HabitContext';
import styles from './HabitListScreen.styles';
import { themeColor } from '../../config/theme';
import { WORDINGS } from '../../config/wordings';

export default function HabitListScreen({ onSelectHabit, onAddHabit, onEditHabit, onDeleteHabit }) {
  const { habits, toggleDay, isDone, streak } = useHabits();

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{WORDINGS.habits.title}</Text>

        {habits.length === 0 && (
          <Text style={styles.empty}>{WORDINGS.habits.empty}</Text>
        )}

        {habits.map(habit => {
          const s        = streak(habit.id);
          const donToday = isDone(habit.id, todayStr);

          return (
            <TouchableOpacity
              key={habit.id}
              style={[styles.habitRow, { borderLeftColor: habit.color, borderLeftWidth: 4 }]}
              onPress={() => onSelectHabit(habit)}
              activeOpacity={0.75}
            >
              {/* Emoji */}
              <View style={[styles.emojiCircle, { backgroundColor: habit.color + '22' }]}>
                <Text style={styles.emojiText}>{habit.emoji}</Text>
              </View>

              {/* Name + streak */}
              <View style={styles.habitInfo}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <Text style={styles.habitSub}>
                  {s > 0 ? WORDINGS.habits.haveStreak(s) : WORDINGS.habits.noStreak}
                </Text>
              </View>

              {/* Today checkbox */}
              <TouchableOpacity
                style={[
                  styles.todayCheckbox,
                  donToday && { backgroundColor: habit.color, borderColor: habit.color },
                ]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  toggleDay(habit.id, todayStr);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                {donToday && (
                  <Ionicons name="checkmark" size={16} color={themeColor('textPrimary')} />
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB — add new habit */}
      <TouchableOpacity style={styles.fab} onPress={onAddHabit}>
        <Ionicons name="add" size={28} color={themeColor('textPrimary')} />
      </TouchableOpacity>
    </View>
  );
}
