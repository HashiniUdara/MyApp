import { createThemedStyleSheet } from '../../config/theme';

const BTN_SIZE = 76;

export default createThemedStyleSheet((colors) => ({
  container: { flex: 1, backgroundColor: colors.background, padding: 16, justifyContent: 'flex-end' },

  displayBox: { alignItems: 'flex-end', paddingHorizontal: 8, marginBottom: 24 },
  opHint:    { color: colors.mutedText, fontSize: 18, marginBottom: 4 },
  display:   { color: colors.textPrimary, fontSize: 64, fontWeight: '300' },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },

  btn: {
    width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE / 2,
    backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  btnEquals:  { backgroundColor: colors.primary },
  btnOp:      { backgroundColor: colors.operatorBg },
  btnOpActive:{ backgroundColor: colors.primary },
  btnSpecial: { backgroundColor: colors.surfaceSoft },

  btnText:        { color: colors.textPrimary, fontSize: 26, fontWeight: '400' },
  btnTextEquals:  { color: colors.textPrimary, fontWeight: '600' },
  btnTextOp:      { color: colors.accent, fontWeight: '600' },
  btnTextSpecial: { color: colors.textSecondary },



// styles for the Counter screen

  section: { alignItems: 'center' },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  counterDisplay: { fontSize: 96, fontWeight: '800', color: colors.primary, marginVertical: 20 },
  row1: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn1: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, minWidth: 70, alignItems: 'center' },
  btnDanger: { backgroundColor: colors.danger },
  btnSuccess: { backgroundColor: colors.success },
  btnSecondary: { backgroundColor: colors.surfaceAlt },
  btnText1: { color: colors.textPrimary, fontWeight: '700', fontSize: 18 },
}));