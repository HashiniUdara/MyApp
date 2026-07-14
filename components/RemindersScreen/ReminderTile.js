import { useState } from 'react';
import {
  View, Text, Switch, TouchableOpacity,
  Modal, Platform, StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useReminders } from '../../store/reminderStore/ReminderContext';
import styles from './ReminderTile.style';
import { themeColor } from '../../config/theme';

const pad = (n) => String(n).padStart(2, '0');

function fmt12(hour, minute) {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h    = hour % 12 || 12;
  return `${h}:${pad(minute)} ${ampm}`;
}

export default function ReminderTile({ reminderId, style }) {
  const { getReminder, setReminder, permissionStatus } = useReminders();
  const reminder = getReminder(reminderId);

  const [sheetVisible,   setSheetVisible]   = useState(false);
  const [androidVisible, setAndroidVisible] = useState(false);
  const [pickerDate,     setPickerDate]     = useState(() => {
    const d = new Date();
    d.setHours(reminder?.hour ?? 21, reminder?.minute ?? 0, 0, 0);
    return d;
  });

  if (!reminder) return null;

  // Fix 4: Toggle only changes enabled — time is independent
  const handleToggle = (val) => {
    setReminder(reminderId, { enabled: val });
  };

  // Fix 3: Time picker is always accessible (not gated behind enabled)
  const openSheet = () => {
    const d = new Date();
    d.setHours(reminder.hour, reminder.minute, 0, 0);
    setPickerDate(d);
    if (Platform.OS === 'android') {
      setAndroidVisible(true);
    } else {
      setSheetVisible(true);
    }
  };

  // Android: save time immediately on pick
  const handleAndroidChange = (event, date) => {
    setAndroidVisible(false);
    if (event.type === 'dismissed' || !date) return;
    // Save time — keep current enabled state unchanged
    setReminder(reminderId, {
      hour:    date.getHours(),
      minute:  date.getMinutes(),
      enabled: reminder.enabled, // preserve current enabled state
    });
  };

  // iOS: save on "Save" button press
  const handleIOSSave = () => {
    setReminder(reminderId, {
      hour:    pickerDate.getHours(),
      minute:  pickerDate.getMinutes(),
      enabled: reminder.enabled, // preserve current enabled state
    });
    setSheetVisible(false);
  };

  const permDenied = permissionStatus === 'denied';

  return (
    <View style={[styles.tile, style]}>

      {/* Header: label + toggle */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tileTitle}>🔔 {reminder.label}</Text>
          <Text style={styles.tileSubtitle}>Daily reminder</Text>
        </View>
        <Switch
          value={reminder.enabled}
          onValueChange={handleToggle}
          trackColor={{ false: themeColor('surfaceAlt'), true: themeColor('primary') }}
          thumbColor={reminder.enabled ? themeColor('primary') : themeColor('mutedText')}
        />
      </View>

      {/* Time row — always visible so user can set time before or after enabling */}
      <TouchableOpacity
        style={[styles.timeRow, !reminder.enabled && styles.timeRowDisabled]}
        onPress={openSheet}
        activeOpacity={0.7}
      >
        <Text style={styles.timeLabel}>
          {reminder.enabled ? 'Remind me at' : 'Will remind at'}
        </Text>
        <View style={[styles.timeBadge, !reminder.enabled && styles.timeBadgeDisabled]}>
          <Text style={[styles.timeText, !reminder.enabled && styles.timeTextDisabled]}>
            {fmt12(reminder.hour, reminder.minute)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Permission warning */}
      {permDenied && reminder.enabled && (
        <Text style={styles.permWarn}>
          ⚠️ Notifications are disabled. Enable them in device Settings.
        </Text>
      )}

      {/* iOS bottom sheet time picker */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setSheetVisible(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Set Reminder Time</Text>
            <Text style={styles.sheetSub}>{reminder.label}</Text>
            <DateTimePicker
              value={pickerDate}
              mode="time"
              display="spinner"
              onChange={(_, d) => d && setPickerDate(d)}
              style={styles.iosPicker}
              textColor={themeColor('textPrimary')}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleIOSSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Android native time picker */}
      {androidVisible && (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          display="default"
          onChange={handleAndroidChange}
        />
      )}
    </View>
  );
}