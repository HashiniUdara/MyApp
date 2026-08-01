import { createThemedStyleSheet } from '../../config/theme';

export default createThemedStyleSheet((colors) => ({
  container: { flex: 1 },
  contentInner: { padding: 20, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  title:     { color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginBottom: 28 },

  avatarWrap: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: colors.textPrimary, fontSize: 32, fontWeight: '700' },
  email:      { color: colors.textSecondary, fontSize: 14 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: colors.surfaceAlt, marginBottom: 12, gap: 14,
  },
  cardInfo:  { flex: 1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardLabel: { color: colors.mutedText, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  cardValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  quickAccessOptions: { marginBottom: 12, gap: 8 },
  quickAccessOption: {
    marginLeft: 25,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.surfaceAlt,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  quickAccessOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  quickAccessOptionText: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  quickAccessOptionTextActive: { color: colors.textPrimary },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.dangerSoft, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.danger, marginTop: 8, marginBottom: 12,
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
}));
