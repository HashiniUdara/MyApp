import { createThemedStyleSheet } from '../../config/theme';

export default createThemedStyleSheet((colors) => ({
  inner:    { padding: 20, paddingBottom: 40 },
  greeting: { color: colors.textPrimary, fontSize: 26, fontWeight: '800', marginBottom: 4 },
}));
