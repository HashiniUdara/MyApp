import { createThemedStyleSheet } from '../../config/theme';

export default createThemedStyleSheet((colors) => ({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24 },
  card:      { backgroundColor: colors.surface, borderRadius: 20, padding: 28, borderWidth: 1, borderColor: colors.surfaceAlt },

  appName:  { color: colors.textPrimary, fontSize: 30, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  tagline:  { color: colors.mutedText, fontSize: 13, textAlign: 'center', marginBottom: 28 },

  toggle:          { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 12, padding: 4, marginBottom: 20 },
  toggleBtn:       { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText:      { color: colors.mutedText, fontWeight: '600', fontSize: 14 },
  toggleTextActive:{ color: colors.textPrimary },

  successBox: { backgroundColor: colors.successSoft, borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.success },
  successText:{ color: colors.success, fontSize: 13, lineHeight: 20 },

  label: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.surfaceAlt,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    color: colors.textPrimary, fontSize: 15, marginBottom: 12,
  },

  error: { color: colors.danger, fontSize: 13, marginBottom: 12, textAlign: 'center' },

  btn:         { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },

  hint:     { color: colors.mutedText, fontSize: 13, textAlign: 'center', marginTop: 16 },
  hintLink: { color: colors.primary, fontWeight: '600' },

  // Password field with eye toggle
  passwordWrap:  { position: 'relative', marginBottom: 0 },
  passwordInput: { paddingRight: 50, marginBottom: 12 },
  eyeBtn:        { position: 'absolute', right: 14, top: 13, padding: 4 },
}));