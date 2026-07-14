import { createThemedStyleSheet } from '../../config/theme';

export default createThemedStyleSheet((colors) => ({
  inner:    { padding: 20, paddingBottom: 40 },
  greeting: { color: colors.textPrimary, fontSize: 26, fontWeight: '800', marginBottom: 4 },
  dateLabel:{ color: colors.mutedText, fontSize: 13, marginBottom: 24 },

  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 12, marginTop: 8 },

  cardRow:   { flexDirection: 'row', gap: 10, marginBottom: 10 },
  summaryCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: colors.surfaceAlt, alignItems: 'flex-start',
  },
  summaryLabel: { color: colors.mutedText, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 14, fontWeight: '700' },

  balanceCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, marginBottom: 8,
  },
  balanceLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  balanceValue: { fontSize: 16, fontWeight: '800' },

  progressCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.surfaceAlt, marginBottom: 8,
  },
  progressTop:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel:{ color: colors.textSecondary, fontSize: 13 },
  progressPct:  { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
  progressTrack:{ height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 3, marginBottom: 12 },
  progressFill: { height: 6, borderRadius: 3 },

  habitRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  habitDot:  { width: 10, height: 10, borderRadius: 5 },
  habitName: { color: colors.textSecondary, fontSize: 13, flex: 1 },

  quickRow: { flexDirection: 'row', gap: 10 },
  quickBtn: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.surfaceAlt,
  },
  quickLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', textAlign: 'center' },
}));
