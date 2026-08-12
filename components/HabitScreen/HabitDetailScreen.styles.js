import { createThemedStyleSheet } from '../../config/theme';

export default createThemedStyleSheet((colors) => ({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderColor: colors.surfaceAlt,
  },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backArrow:    { color: colors.primary, fontSize: 28, fontWeight: '600' },
  headerCenter: { alignItems: 'center' },
  headerEmoji:  { fontSize: 28, marginBottom: 2 },
  headerTitle:  { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },

  inner: { padding: 20, paddingBottom: 48 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1,
  },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  statLabel: { color: colors.mutedText, fontSize: 11, fontWeight: '600' },

  // Navigator
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  navBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  navArrow: { color: colors.textPrimary, fontSize: 22, lineHeight: 26 },
  navTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },

  // Weekday row
  weekRow:  { flexDirection: 'row', marginBottom: 6 },
  weekCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  weekLabel:{ color: colors.mutedText, fontSize: 11, fontWeight: '700' },

  // Grid
  grid: { width: '100%' },
  row:  { flexDirection: 'row', marginBottom: 4 },
  cell: {
    flex: 1, minHeight: 46, marginRight: 4,
    backgroundColor: colors.primary, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.surfaceAlt,
  },
  cellLast:    { marginRight: 0 },
  cellFaded:   { backgroundColor: colors.background, borderColor: colors.background },
  cellToday:   { backgroundColor: colors.primary, borderWidth: 2 },
  cellNum:     { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  cellNumFaded:{ color: colors.surfaceAlt },
  cellNumDone: { color: colors.textPrimary },
  checkMark:   { fontSize: 10, color: colors.textPrimary, marginTop: 1 },

  // Legend
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, justifyContent: 'center' },
  legendDot: { width: 14, height: 14, borderRadius: 4 },
  legendDotEmpty: { backgroundColor: 'transparent', borderWidth: 2 },
  legendText: { color: colors.mutedText, fontSize: 12, marginRight: 6 },
  hint:       { color: colors.surfaceAlt, fontSize: 12, textAlign: 'center', marginTop: 8 },
}));
