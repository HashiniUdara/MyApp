import { createThemedStyleSheet } from '../../config/theme';

export default createThemedStyleSheet((colors) => ({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...require('react-native').StyleSheet.absoluteFillObject, backgroundColor: colors.backdrop },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  scrollInner: { padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: colors.surfaceAlt, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },

  sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.surfaceAlt,
  },

  fieldLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 4, letterSpacing: 0.3 },

  inputWrap: { marginBottom: 4 },
  input: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.surfaceAlt,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    color: colors.textPrimary, fontSize: 15,
  },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  inputError: { borderColor: colors.danger },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, marginBottom: 10 },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '600' },
  spacer: { height: 16 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.surfaceAlt,
  },
  categoryOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  categoryOptionText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  categoryOptionTextActive: { color: colors.textPrimary },

  rowFields: { flexDirection: 'row', gap: 12 },
  rowField: { flex: 1 },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.surfaceAlt,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  pickerBtnText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 },
  pickerBtnPlaceholder: { color: colors.mutedText },
  clearTimeBtn: { paddingLeft: 4 },

  submitBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },

  deleteLink: { alignItems: 'center', marginTop: 16, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  deleteLinkText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
}));
