import { createThemedStyleSheet } from '../../config/theme';

export default createThemedStyleSheet((colors) => ({
  container: { flex: 1 },
  inner: { padding: 20, paddingBottom: 120 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.mutedText, fontSize: 13, marginTop: 3, fontWeight: '500' },
  headerIconBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconBtnDisabled: { opacity: 0.35 },

  readOnlyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.surfaceAlt,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 18,
  },
  readOnlyBannerText: { color: colors.mutedText, fontSize: 12.5, fontWeight: '600', flex: 1 },

  // ── Date strip ──────────────────────────────────────────────
  dateStrip: { marginBottom: 20 },
  dateStripContent: { gap: 10, paddingRight: 4 },
  datePill: {
    width: 52, paddingVertical: 10, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceAlt,
  },
  datePillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  datePillToday: { borderColor: colors.primary },
  dateDay: { color: colors.mutedText, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  dateDayActive: { color: colors.textPrimary },
  dateNum: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  dateDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 4 },
  dateDotActive: { backgroundColor: colors.textPrimary },

  // ── Category cards ──────────────────────────────────────────
  sectionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  categoryStrip: { marginBottom: 22 },
  categoryStripContent: { gap: 10, paddingRight: 4 },
  categoryCard: {
    width: 128, borderRadius: 16, padding: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceAlt,
  },
  categoryCardActive: { borderColor: colors.primary, backgroundColor: colors.surfaceSoft },
  categoryCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  categoryIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  categoryCount: { color: colors.mutedText, fontSize: 11, fontWeight: '700' },
  categoryLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  categoryProgressTrack: { height: 5, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  categoryProgressFill: { height: '100%', borderRadius: 3 },

  // ── Filter tabs ─────────────────────────────────────────────
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceAlt },
  filterTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterTabText: { color: colors.mutedText, fontSize: 13, fontWeight: '700' },
  filterTabTextActive: { color: colors.textPrimary },

  // ── Todo item ───────────────────────────────────────────────
  todoItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.surface, borderRadius: 16, padding: 15, marginBottom: 10,
    borderWidth: 1, borderColor: colors.surfaceAlt,
  },
  todoItemDone: { opacity: 0.55 },
  todoItemReadOnly: { opacity: 0.7 },
  checkTap: { paddingRight: 12, paddingTop: 1 },
  todoBody: { flex: 1 },
  todoTitle: { color: colors.textPrimary, fontSize: 15.5, fontWeight: '700' },
  todoTitleDone: { textDecorationLine: 'line-through', color: colors.mutedText },
  todoNotes: { color: colors.mutedText, fontSize: 12.5, marginTop: 3 },
  todoMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9 },
  todoMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  todoMetaText: { fontSize: 11.5, fontWeight: '600' },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  categoryChipText: { fontSize: 11, fontWeight: '700' },
  todoActions: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  actionBtn: {
    width: 30, height: 30, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.surfaceAlt,
  },

  empty: { alignItems: 'center', marginTop: 50, gap: 10 },
  emptyText: { color: colors.mutedText, fontSize: 14, fontWeight: '600' },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 8, zIndex: 20,
  },
  fabDisabled: { backgroundColor: colors.surfaceAlt, shadowOpacity: 0 },
}));

