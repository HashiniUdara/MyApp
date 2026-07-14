import { createThemedStyleSheet } from '../../config/theme';

export default createThemedStyleSheet((colors) => ({
  container:  { padding: 20, paddingBottom: 40 },
  title:      { color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginBottom: 20 },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  box: {
    width: '47%', backgroundColor: colors.surface, paddingVertical: 24,
    borderRadius: 14, marginBottom: 14, alignItems: 'center',
    borderWidth: 1, borderColor: colors.surfaceAlt, gap: 10,
  },
  boxPressed: { opacity: 0.7, borderColor: colors.primary },
  boxText:    { color: colors.textPrimary, fontSize: 13, fontWeight: '600', textAlign: 'center' },
}));
