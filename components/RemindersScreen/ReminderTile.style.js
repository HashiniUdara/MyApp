import { createThemedStyleSheet } from '../../config/theme';

export default createThemedStyleSheet((colors) => ({
  tile: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
    padding: 16,
    marginBottom: 12,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tileTitle:    { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  tileSubtitle: { color: colors.mutedText, fontSize: 12, marginTop: 2 },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  timeRowDisabled: { opacity: 0.5 },

  timeLabel: { color: colors.textSecondary, fontSize: 13 },

  timeBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  timeBadgeDisabled: { backgroundColor: colors.surfaceSoft },

  timeText:         { color: colors.primary, fontSize: 15, fontWeight: '700' },
  timeTextDisabled: { color: colors.mutedText },

  permWarn: { color: colors.danger, fontSize: 11, marginTop: 10 },

  overlay:     { flex: 1, justifyContent: 'flex-end' },
  backdrop:    { ...require('react-native').StyleSheet.absoluteFillObject, backgroundColor: colors.backdrop },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  sheetSub:   { color: colors.mutedText, fontSize: 13, textAlign: 'center', marginBottom: 8 },
  iosPicker:  { height: 150 },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
}));