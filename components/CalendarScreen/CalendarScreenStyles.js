import { createThemedStyleSheet } from '../../config/theme';

// Each cell is exactly 1/7 of the grid width.
// The grid fills 100% of the parent — padding is on the screen wrapper.
const CELL_PCT = (1 / 7 * 100).toFixed(4) + '%'; // '14.2857%'
const GAP = 2; // gap between cells in pixels

export default createThemedStyleSheet((colors) => ({

  container: { flex: 1 },
  inner:     { paddingTop: 20, paddingBottom: 48 },


  selectorCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 14, marginBottom: 18,
    borderWidth: 1, borderColor: colors.surfaceAlt,
  },
  selectorRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  selectorValue: {
    flex: 1, backgroundColor: colors.background, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.surfaceAlt,
  },
  selectorLabel: { color: colors.mutedText, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  selectorText: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  dayNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayCenter: { alignItems: 'center', flex: 1 },

  // ── Month navigator ───────────────────────────────────────
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  navArrow: { color: colors.textPrimary, fontSize: 22, lineHeight: 26 },
  navTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },

  // ── Weekday header ────────────────────────────────────────
  // One flex row: each cell takes exactly 1/7
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  weekLabel: { color: colors.mutedText, fontSize: 11, fontWeight: '700' },

  // ── Grid ─────────────────────────────────────────────────
  // Explicit rows of 7 — no flexWrap, so alignment is guaranteed
  grid: { width: '100%' },

  row: {
    flexDirection: 'row',
    marginBottom: GAP,
  },

  cell: {
    flex: 1,                    // each of the 7 cells shares the row equally
    minHeight: 52,
    marginRight: GAP,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 8,
    padding: 4,
  },

  // Remove the extra right margin on the last cell of each row
  // (applied inline in the component with a style override)
  cellLast: { marginRight: 0 },

  cellFaded:    { backgroundColor: colors.surfaceSoft },
  cellToday:    { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
  cellSelected: { backgroundColor: colors.operatorBg },

  cellNum:       { fontSize: 11, fontWeight: '700', color: colors.textSecondary,    marginBottom: 2 },
  cellNumFaded:  { color: colors.mutedText },
  cellNumToday:  { color: colors.accent },
  cellNumSel:    { color: colors.textPrimary },

  cellAmounts: { gap: 1 },
  cellAmt:     { fontSize: 8, fontWeight: '600' },

  incomeColor:  { color: colors.success },
  expenseColor: { color: colors.danger },

  // ── Month summary bar ─────────────────────────────────────
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 14, gap: 8,
  },
  pill: {
    flex: 1, backgroundColor: colors.surfaceSoft, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center',
  },
  pillLabel: { color: colors.mutedText, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  pillValue: { fontSize: 13, fontWeight: '700' },

  // ── Day detail panel ─────────────────────────────────────
  detail: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.surfaceAlt,
  },
  detailTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  detailEmpty: { color: colors.mutedText, fontSize: 14, textAlign: 'center', paddingVertical: 12 },

  // Mini summary cards — mirrors DayScreen summaryRow
  detailSummaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 14, gap: 6,
  },
  detailSummaryCard: {
    flex: 1, backgroundColor: colors.background,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 6,
    alignItems: 'center', borderWidth: 1, borderColor: colors.surfaceAlt,
  },
  detailSummaryLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginBottom: 6 },
  detailSummaryValue: { fontSize: 13, fontWeight: '700' },

  // Transaction cards — mirrors DayScreen incomeItem / expenseItem
  incomeItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.successSoft, borderColor: colors.success,
    borderWidth: 1, borderRadius: 12,
    padding: 14, marginBottom: 8,
  },
  expenseItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderColor: colors.surfaceAlt,
    borderWidth: 1, borderRadius: 12,
    padding: 14, marginBottom: 8,
  },
  categoryText:    { color: colors.textPrimary,  fontSize: 14, fontWeight: '600' },
  subcategoryText: { color: colors.textSecondary,  fontSize: 12, marginTop: 2 },
  incomeAmount:    { color: colors.success, fontWeight: '600' },
  expenseAmount:   { color: colors.danger, fontWeight: '600' },

  pickerOverlay: { flex: 1, justifyContent: 'center', padding: 24 },
  pickerBackdrop: { ...require('react-native').StyleSheet.absoluteFillObject, backgroundColor: colors.backdrop },
  pickerSheet: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.surfaceAlt },
  pickerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  pickerItem: { minWidth: 78, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', borderWidth: 1, borderColor: colors.surfaceAlt },
  pickerItemActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  pickerItemText: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
}));
