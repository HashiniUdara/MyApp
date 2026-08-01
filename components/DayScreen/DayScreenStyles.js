import { createThemedStyleSheet } from "../../config/theme";

export default createThemedStyleSheet((colors) => ({
  section: {
    alignItems: "center",
    width: "100%",
  },

  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 20,
  },

  sectionTitle: {
    width: "100%",
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 10,
  },

  empty: {
    color: colors.mutedText,
    fontSize: 15,
    marginVertical: 20,
  },

  emptyText: {
    width: "100%",
    color: colors.mutedText,
    marginBottom: 10,
  },

  incomeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    width: "100%",
  },

  expenseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.surfaceAlt,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    width: "100%",
  },

  categoryText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },

  subcategoryText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "400",
    marginTop: 2,
  },

  incomeAmount: {
    color: colors.success,
    fontWeight: "600",
    marginRight: 10,
  },

  expenseAmount: {
    color: colors.danger,
    fontWeight: "600",
    marginRight: 10,
  },

  deleteBtn: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "700",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 6,
    paddingHorizontal: 4,
  },

  totalLabel: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },

  totalAmount: {
    fontWeight: "700",
    fontSize: 16,
  },

  netRow: {
    marginTop: 25,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
    paddingTop: 15,
  },

  netLabel: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },

  netAmount: {
    fontSize: 18,
    fontWeight: "700",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },

  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    fontWeight: "600",
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },

  // Screen layout helpers (used by DayView)
  screenWrapper: { flex: 1, position: "relative" },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24, alignItems: "flex-start" },

  // Floating Action Button
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
  },

  fabText: {
    color: colors.textOnPrimary,
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 34,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
}));