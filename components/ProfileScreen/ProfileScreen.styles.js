import { createThemedStyleSheet } from '../../config/theme';

export default createThemedStyleSheet((colors) => ({
  container: { flex: 1, padding: 20 },
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
  cardLabel: { color: colors.mutedText, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  cardValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.dangerSoft, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.danger, marginTop: 8,
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
}));
