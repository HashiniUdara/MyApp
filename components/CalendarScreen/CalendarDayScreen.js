/**
 * CalendarDayScreen
 * Full-screen modal shown when a calendar day is tapped.
 * Reuses DayView — identical UI to DayScreen with add/edit/delete.
 */
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DayView from '../DayScreen/DayView';
import styles from './CalendarDayScreen.styles';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];

function formatTitle(dateStr) {
  // 'YYYY-MM-DD' → '26 Jun 2026'
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${MONTHS_SHORT[parseInt(m) - 1]} ${y}`;
}

export default function CalendarDayScreen({
  visible,
  date,
  transactions,
  onClose,
  onAdd,
  onUpdate,
  onRemove,
}) {
  if (!date) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>

        {/* Header bar with back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{formatTitle(date)}</Text>
          {/* Spacer to center title */}
          <View style={styles.backBtn} />
        </View>

        {/* Full DayView — same as DayScreen */}
        <DayView
          date={date}
          title={formatTitle(date)}
          transactions={transactions}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />

      </View>
    </Modal>
  );
}
