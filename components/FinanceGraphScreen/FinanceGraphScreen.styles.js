import { createThemedStyleSheet } from '../../config/theme';

export default createThemedStyleSheet((colors) => ({
  container: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginBottom: 4 },
  description: { color: colors.mutedText, fontSize: 13, marginBottom: 16 },

  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginBottom: 16,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.surfaceAlt,
  },
  navBtnDisabled: { opacity: 0.4 },
  yearText: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },

  tabRow: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12,
    padding: 4, marginBottom: 16, borderWidth: 1, borderColor: colors.surfaceAlt,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: colors.primary },
  tabText: { color: colors.mutedText, fontWeight: '700', fontSize: 12 },
  tabTextActive: { color: colors.textOnPrimary },

  card: {
    backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1,
    borderColor: colors.surfaceAlt, padding: 16, marginBottom: 16,
  },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  cardSubtitle: { color: colors.mutedText, fontSize: 12, marginBottom: 12 },

  summaryGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryBox: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.surfaceAlt,
  },
  summaryLabel: { color: colors.mutedText, fontSize: 11, fontWeight: '700', marginBottom: 6 },
  summaryValue: { fontSize: 18, fontWeight: '900' },
  summaryValueIncome: { color: colors.success },
  summaryValueExpense: { color: colors.danger },
  summaryValueNet: { color: colors.textPrimary },

  legendRow: { flexDirection: 'row', gap: 18, marginBottom: 8, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },

  catRow: { marginBottom: 16 },
  catRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catNameWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', flexShrink: 1 },
  catAmount: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  catBarTrack: {
    height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden',
  },
  catBarFill: { height: '100%', borderRadius: 4 },
  catPercent: { color: colors.mutedText, fontSize: 11, marginTop: 4, textAlign: 'right' },

  loadingText: { color: colors.mutedText, fontSize: 13, textAlign: 'center', marginTop: 20 },
  emptyText: { color: colors.mutedText, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  error: { color: colors.danger, fontSize: 12, marginBottom: 12, textAlign: 'center' },
}));
