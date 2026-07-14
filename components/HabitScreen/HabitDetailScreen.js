import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useHabits } from '../../store/habitStore/HabitContext';
import styles from './HabitDetailScreen.styles';
import { themeColor } from '../../config/theme';

const WEEKDAYS    = ['Mo','Tu','We','Th','Fr','Sa','Su'];
const MONTHS      = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];

const pad = (n) => String(n).padStart(2, '0');

function buildGrid(year, month) {
  const firstDay  = new Date(year, month, 1);
  const lastDate  = new Date(year, month + 1, 0).getDate();
  const prevLast  = new Date(year, month, 0).getDate();
  const startSlot = (firstDay.getDay() + 6) % 7;

  const cells = [];
  for (let i = startSlot - 1; i >= 0; i--)
    cells.push({ date: null, label: prevLast - i, faded: true });
  for (let d = 1; d <= lastDate; d++)
    cells.push({ date: `${year}-${pad(month + 1)}-${pad(d)}`, label: d, faded: false });
  const tail = 7 - (cells.length % 7);
  if (tail < 7)
    for (let d = 1; d <= tail; d++)
      cells.push({ date: null, label: d, faded: true });

  return cells;
}

export default function HabitDetailScreen({ habit, onBack }) {
  const { toggleDay, isDone, monthCount, streak } = useHabits();

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const grid     = useMemo(() => buildGrid(year, month), [year, month]);
  const todayStr = now.toISOString().split('T')[0];

  const yearMonth  = `${year}-${pad(month + 1)}`;
  const doneCount  = monthCount(habit.id, yearMonth);
  const totalDays  = new Date(year, month + 1, 0).getDate();
  const currentStreak = streak(habit.id);

  // Split into rows of 7
  const rows = [];
  for (let i = 0; i < grid.length; i += 7) rows.push(grid.slice(i, i + 7));

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else               setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else                setMonth(m => m + 1);
  };

  const handleDayPress = (dateStr) => {
    // Don't allow marking future dates
    if (dateStr > todayStr) return;
    toggleDay(habit.id, dateStr);
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{habit.emoji}</Text>
          <Text style={styles.headerTitle}>{habit.name}</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: habit.color }]}>
            <Text style={[styles.statValue, { color: habit.color }]}>{currentStreak}</Text>
            <Text style={styles.statLabel}>🔥 Streak</Text>
          </View>
          <View style={[styles.statCard, { borderColor: habit.color }]}>
            <Text style={[styles.statValue, { color: habit.color }]}>{doneCount}</Text>
            <Text style={styles.statLabel}>✅ This Month</Text>
          </View>
          <View style={[styles.statCard, { borderColor: habit.color }]}>
            <Text style={[styles.statValue, { color: habit.color }]}>
              {totalDays > 0 ? Math.round((doneCount / totalDays) * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>📊 Rate</Text>
          </View>
        </View>

        {/* Year navigator */}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={() => setYear(y => y - 1)}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>{year}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={() => setYear(y => y + 1)}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Month navigator */}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>{MONTHS[month]}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Weekday header */}
        <View style={styles.weekRow}>
          {WEEKDAYS.map(d => (
            <View key={d} style={styles.weekCell}>
              <Text style={styles.weekLabel}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {rows.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((cell, ci) => {
                const done    = cell.date ? isDone(habit.id, cell.date) : false;
                const isToday = cell.date === todayStr;
                const future  = cell.date && cell.date > todayStr;

                return (
                  <TouchableOpacity
                    key={ci}
                    activeOpacity={cell.date && !future ? 0.7 : 1}
                    style={[
                      styles.cell,
                      ci === 6 && styles.cellLast,
                      cell.faded && styles.cellFaded,
                      done       && { backgroundColor: habit.color },
                      isToday && !done && styles.cellToday,
                      isToday && !done && { borderColor: habit.color },
                    ]}
                    onPress={() => cell.date && handleDayPress(cell.date)}
                  >
                    <Text style={[
                      styles.cellNum,
                      cell.faded && styles.cellNumFaded,
                      done       && styles.cellNumDone,
                      isToday && !done && { color: habit.color },
                    ]}>
                      {cell.label}
                    </Text>
                    {done && <Text style={styles.checkMark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: habit.color }]} />
          <Text style={styles.legendText}>Completed</Text>
          <View style={[styles.legendDot, styles.legendDotEmpty, { borderColor: habit.color }]} />
          <Text style={styles.legendText}>Today</Text>
          <View style={[styles.legendDot, { backgroundColor: themeColor('surfaceAlt') }]} />
          <Text style={styles.legendText}>Not done</Text>
        </View>

        <Text style={styles.hint}>Tap a day to mark / unmark it</Text>

      </ScrollView>
    </View>
  );
}