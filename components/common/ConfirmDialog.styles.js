import { createThemedStyleSheet } from '../../config/theme';

export default createThemedStyleSheet((colors) => ({
  overlay: {
    ...require('react-native').StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', padding: 24,
    zIndex: 1000, elevation: 1000,
  },
  backdrop: { ...require('react-native').StyleSheet.absoluteFillObject, backgroundColor: colors.backdrop },
  card: {
    width: '100%', maxWidth: 340,
    backgroundColor: colors.surface, borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: colors.surfaceAlt,
  },
  iconWrap: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  iconWrapDanger: { backgroundColor: colors.dangerSoft },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  message: { color: colors.mutedText, fontSize: 13.5, lineHeight: 19, marginBottom: 20 },
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.surfaceAlt },
  cancelText: { color: colors.textSecondary, fontWeight: '700', fontSize: 14 },
  confirmBtn: { backgroundColor: colors.primary },
  confirmBtnDanger: { backgroundColor: colors.danger },
  confirmText: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
}));
