import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTodos } from '../../store/todoStore/TodoContext';
import { useCategories } from '../../store/categoryStore/CategoryContext';
import { toDateStr, isPastDateStr, isTodayDateStr } from '../../utils/dateUtils';
import ConfirmDialog from '../common/ConfirmDialog';
import styles from './TodoListStyles';
import { themeColor } from '../../config/theme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const buildDateRange = () => {
  const out = [];
  const today = new Date();
  // Show today first, then 30 days forward
  for (let i = 0; i <= 30; i++) {
    const dt = new Date(today);
    dt.setDate(today.getDate() + i);
    out.push(dt);
  }
  return out;
};

const FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All' },
];

function formatTime(time) {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function TodoItem({ todo, readOnly, onToggle, onEdit, onRequestDelete, getCategory }) {
  const cat = getCategory(todo.category);

  return (
    <View style={[styles.todoItem, todo.completed && styles.todoItemDone, readOnly && styles.todoItemReadOnly]}>
      <TouchableOpacity
        style={styles.checkTap}
        onPress={() => !readOnly && onToggle(todo.id)}
        disabled={readOnly}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={todo.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={todo.completed ? cat.color : themeColor('surfaceAlt')}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.todoBody}
        activeOpacity={readOnly ? 1 : 0.7}
        onPress={() => !readOnly && onEdit(todo)}
        disabled={readOnly}
      >
        <Text style={[styles.todoTitle, todo.completed && styles.todoTitleDone]} numberOfLines={1}>
          {todo.title}
        </Text>
        {!!todo.notes && (
          <Text style={styles.todoNotes} numberOfLines={1}>{todo.notes}</Text>
        )}

        <View style={styles.todoMetaRow}>
          {/* {!!todo.time && (
            <View style={styles.todoMetaItem}>
              <Ionicons name="time-outline" size={13} color={themeColor('mutedText')} />
              <Text style={[styles.todoMetaText, { color: themeColor('mutedText') }]}>{formatTime(todo.time)}</Text>
            </View>
          )} */}
          <View style={[styles.categoryChip, { backgroundColor: cat.color + '22' }]}>
            <Ionicons name={cat.icon} size={11} color={cat.color} />
            <Text style={[styles.categoryChipText, { color: cat.color }]}>{cat.label}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {!readOnly && (
        <View style={styles.todoActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onRequestDelete(todo)}>
            <Ionicons name="trash-outline" size={15} color={themeColor('danger')} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function TodoListScreen({ onAdd, onEdit }) {
  const { todosForDate, toggleComplete, removeTodo, categoryCounts } = useTodos();
  const { todoCategories: TODO_CATEGORIES, getCategory } = useCategories();

  const dateRange = useMemo(buildDateRange, []);
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [filter, setFilter] = useState('active');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const readOnly = isPastDateStr(selectedDate);

  const dayTodos = todosForDate(selectedDate);
  const counts = categoryCounts(selectedDate);

  let filteredTodos = dayTodos.filter(t => {
    if (filter === 'active' && t.completed) return false;
    if (filter === 'completed' && !t.completed) return false;
    if (categoryFilter && t.category !== categoryFilter) return false;
    return true;
  });

  // In the "All" view, push completed tasks to the bottom while keeping
  // each group ordered by time (todosForDate already sorted by time).
  if (filter === 'all') {
    filteredTodos = [
      ...filteredTodos.filter(t => !t.completed),
      ...filteredTodos.filter(t => t.completed),
    ];
  }

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const subtitle = `${WEEKDAYS_FULL[selectedDateObj.getDay()]}, ${selectedDateObj.getDate()} ${MONTHS[selectedDateObj.getMonth()]}`;

  const handleAddPress = () => {
    if (readOnly) return;
    onAdd(selectedDate);
  };

  const confirmDelete = () => {
    if (pendingDelete) removeTodo(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Todo List</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

        </View>

        {/* Date strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dateStrip}
          contentContainerStyle={styles.dateStripContent}
        >
          {dateRange.map((dt) => {
            const dStr = toDateStr(dt);
            const isActive = dStr === selectedDate;
            const isToday = isTodayDateStr(dStr);
            return (
              <TouchableOpacity
                key={dStr}
                style={[styles.datePill, isActive && styles.datePillActive, !isActive && isToday && styles.datePillToday]}
                onPress={() => setSelectedDate(dStr)}
              >
                <Text style={[styles.dateDay, isActive && styles.dateDayActive]}>{WEEKDAYS[dt.getDay()]}</Text>
                <Text style={styles.dateNum}>{dt.getDate()}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Category cards */}
        {/* <Text style={styles.sectionLabel}>Categories</Text> */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryStrip}
          contentContainerStyle={styles.categoryStripContent}
        >
          {TODO_CATEGORIES.map((cat) => {
            const c = counts[cat.id] ?? { total: 0, completed: 0 };
            const progress = c.total ? c.completed / c.total : 0;
            const isActive = categoryFilter === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, isActive && styles.categoryCardActive]}
                onPress={() => setCategoryFilter(isActive ? null : cat.id)}
                activeOpacity={0.8}
              >
                <View style={styles.categoryCardTop}>
                  <View style={[styles.categoryIconWrap, { backgroundColor: cat.color + '22' }]}>
                    <Ionicons name={cat.icon} size={16} color={cat.color} />
                  </View>
                  <Text style={styles.categoryCount}>{c.total} task{c.total === 1 ? '' : 's'}</Text>
                </View>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <View style={styles.categoryProgressTrack}>
                  <View style={[styles.categoryProgressFill, { width: `${progress * 100}%`, backgroundColor: cat.color }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterTab, filter === f.id && styles.filterTabActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[styles.filterTabText, filter === f.id && styles.filterTabTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Todo list */}
        {filteredTodos.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={30} color={themeColor('surfaceAlt')} />
            <Text style={styles.emptyText}>
              {filter === 'completed' ? 'Nothing completed yet' : filter === 'active' ? 'All caught up for this day' : 'No tasks for this day'}
            </Text>
          </View>
        ) : (
          filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              readOnly={readOnly}
              onToggle={toggleComplete}
              onEdit={onEdit}
              onRequestDelete={setPendingDelete}
              getCategory={getCategory}
            />
          ))
        )}
      </ScrollView>

      {!readOnly && (
        <TouchableOpacity style={styles.fab} onPress={handleAddPress}>
          <Ionicons name="add" size={28} color={themeColor('textPrimary')} />
        </TouchableOpacity>
      )}

      <ConfirmDialog
        visible={!!pendingDelete}
        title="Delete Task"
        message={pendingDelete ? `Delete "${pendingDelete.title}"? This can't be undone.` : ''}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  );
}
