import { createThemedStyleSheet } from '../../config/theme';

export default createThemedStyleSheet((colors) => ({
  overlay:  {
    ...require('react-native').StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1000, elevation: 1000,
  },
  backdrop: { ...require('react-native').StyleSheet.absoluteFillObject, backgroundColor: colors.backdrop },
  sheet:    {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%'
  },
  handle:   {
    width: 40,
    height: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },

  toggle:              { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 12, padding: 4, marginBottom: 20 },
  toggleBtn:           { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleExpenseActive: { backgroundColor: colors.dangerSoft },
  toggleIncomeActive:  { backgroundColor: colors.successSoft },
  toggleText:          { color: colors.mutedText, fontWeight: '600', fontSize: 14 },
  toggleTextActive:    { color: colors.textPrimary },

  label: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 4 },

  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 10
  },
  dateIcon: { fontSize: 16 },
  dateText: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },

  iosPicker: { height: 150, marginBottom: 12 },

  pills:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pill:          {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceAlt
  },
  pillActive:    { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText:      { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  pillTextActive:{ color: colors.textPrimary },

  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: 12
  },

  addBtn:         {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText:     { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
}));