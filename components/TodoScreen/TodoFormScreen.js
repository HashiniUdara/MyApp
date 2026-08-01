import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  ScrollView, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCategories } from '../../store/categoryStore/CategoryContext';
import { toDateStr, parseDateStr, toTimeStr, parseTimeStr } from '../../utils/dateUtils';
import styles from './TodoFormStyles';
import { themeColor } from '../../config/theme';
import { MONTHS_SHORT } from '../../config/appConstants';
import { WORDINGS } from '../../config/wordings';

function ErrorText({ message }) {
  if (!message) return null;
  return (
    <View style={styles.errorRow}>
      <Ionicons name="alert-circle" size={13} color={themeColor('danger')} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export default function TodoFormScreen({ visible, todo, defaultDate, onClose, onSave, onDelete }) {
  const isEdit = !!todo;
  const { todoCategories: TODO_CATEGORIES } = useCategories();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState(null);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset / hydrate form whenever it opens
  useEffect(() => {
    if (!visible) return;
    if (todo) {
      setTitle(todo.title ?? '');
      setNotes(todo.notes ?? '');
      setCategory(todo.category ?? null);
      setDate(todo.date ? parseDateStr(todo.date) : new Date());
      setTime(todo.time ? parseTimeStr(todo.time) : null);
    } else {
      setTitle('');
      setNotes('');
      setCategory(null);
      setDate(defaultDate ? parseDateStr(defaultDate) : new Date());
      setTime(null);
    }
    setErrors({});
  }, [visible, todo, defaultDate]);

  const clearError = (field) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const validate = () => {
    const next = {};
    if (!title.trim()) next.title = WORDINGS.todo.titleRequired;
    else if (title.trim().length > 60) next.title = WORDINGS.todo.titleTooLong;
    if (!category) next.category = WORDINGS.todo.categoryRequired;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      id: todo?.id,
      title: title.trim(),
      notes: notes.trim(),
      category,
      date: toDateStr(date),
      time: time ? toTimeStr(time) : null,
    });
  };

  const handleDatePickerChange = (event, selected) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) setDate(selected);
  };

  const handleTimePickerChange = (event, selected) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selected) setTime(selected);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>{isEdit ? WORDINGS.todo.EditTask : WORDINGS.todo.NewTask}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={18} color={themeColor('textSecondary')} />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={styles.fieldLabel}>{WORDINGS.todo.titleLabel}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder={WORDINGS.todo.titlePlaceholder}
                placeholderTextColor={themeColor('mutedText')}
                value={title}
                onChangeText={(v) => { setTitle(v); clearError('title'); }}
                maxLength={60}
              />
            </View>
            <ErrorText message={errors.title} />
            {!errors.title && <View style={styles.spacer} />}

            {/* Notes */}
            <Text style={styles.fieldLabel}>{WORDINGS.todo.notesLabel}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder={WORDINGS.todo.notesPlaceholder}
                placeholderTextColor={themeColor('mutedText')}
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={200}
              />
            </View>
            <View style={styles.spacer} />

            {/* Category */}
            <Text style={styles.fieldLabel}>{WORDINGS.todo.categoryLabel}</Text>
            <View style={styles.categoryGrid}>
              {TODO_CATEGORIES.map((c) => {
                const active = category === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.categoryOption, active && styles.categoryOptionActive, active && { borderColor: c.color }]}
                    onPress={() => { setCategory(c.id); clearError('category'); }}
                  >
                    <Ionicons name={c.icon} size={14} color={active ? c.color : themeColor('mutedText')} />
                    <Text style={[styles.categoryOptionText, active && styles.categoryOptionTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <ErrorText message={errors.category} />
            {!errors.category && <View style={styles.spacer} />}

            {/* Date & Time */}
            <View style={styles.rowFields}>
              <View style={styles.rowField}>
                <Text style={styles.fieldLabel}>{WORDINGS.todo.dateLabel}</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={16} color={themeColor('textPrimary')} />
                  <Text style={styles.pickerBtnText}>{`${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.rowField}>
                <Text style={styles.fieldLabel}>{WORDINGS.todo.Alarm}</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
                  <Ionicons name="alarm-outline" size={16} color={themeColor('textPrimary')} />
                  <Text style={[styles.pickerBtnText, !time && styles.pickerBtnPlaceholder]}>
                    {time ? toTimeStr(time) : 'None'}
                  </Text>
                  {time && (
                    <TouchableOpacity style={styles.clearTimeBtn} onPress={() => setTime(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={15} color={themeColor('mutedText')} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker value={date} mode="date" display="default" onChange={handleDatePickerChange} />
            )}
            {showTimePicker && (
              <DateTimePicker value={time ?? new Date()} mode="time" display="default" onChange={handleTimePickerChange} />
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Ionicons name={isEdit ? 'checkmark-circle-outline' : 'add-circle-outline'} size={19} color={themeColor('textPrimary')} />
              <Text style={styles.submitBtnText}>{isEdit ? 'Save Changes' : 'Add Task'}</Text>
            </TouchableOpacity>

            {isEdit && (
              <TouchableOpacity style={styles.deleteLink} onPress={() => onDelete(todo.id)}>
                <Ionicons name="trash-outline" size={14} color={themeColor('danger')} />
                <Text style={styles.deleteLinkText}>{WORDINGS.todo.deleteTask}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
