/**
 * ConfirmDialog
 *
 * React Native's Alert.alert() is a documented no-op on web (react-native-web
 * ships an empty stub), so its onPress callbacks never fire in a browser.
 * This in-app modal works identically on native and web.
 */
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './ConfirmDialog.styles';
import { themeColor } from '../../config/theme';

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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel} />
        <View style={styles.card}>
          {/* <View style={[styles.iconWrap, destructive && styles.iconWrapDanger]}>
            <Ionicons name={destructive ? 'trash-outline' : 'log-out-outline'} size={20} color={destructive ? themeColor('danger') : themeColor('accent')} />
          </View> */}
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
    </Modal>
  );
}