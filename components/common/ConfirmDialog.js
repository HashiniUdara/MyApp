/**
 * ConfirmDialog
 *
 * Rendered as a plain absolutely-positioned overlay rather than RN's native
 * <Modal>. ConfirmDialog is used from inside DayView, which itself is
 * sometimes rendered inside another native Modal (CalendarDayScreen). RN's
 * <Modal> spawns its own native Window/Dialog on Android, and nesting one
 * Modal inside another crashes the app on Android (works fine on web/iOS,
 * where Modal doesn't use a separate native window in the same way — which
 * is why this only showed up on native, not in the browser). A plain View
 * overlay with a high zIndex/elevation gives the same visual result without
 * that native window nesting.
 */
import { View, Text, TouchableOpacity } from 'react-native';
import styles from './ConfirmDialog.styles';

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel} />
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {!!message && <Text style={styles.message}>{message}</Text>}

        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, destructive ? styles.confirmBtnDanger : styles.confirmBtn]}
            onPress={onConfirm}
          >
            <Text style={styles.confirmText}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}