import { createThemedStyleSheet } from '../../config/theme';

export default createThemedStyleSheet((colors) => ({
  inner: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginBottom: 6 },
  sub:   { color: colors.mutedText, fontSize: 13, marginBottom: 24, lineHeight: 20 },
}));