import { rpcQuery } from './supabaseClient';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const emptyMonth = () => ({
  total_income: 0,
  total_expense: 0,
  income_by_category: {},
  expense_by_category: {},
});

/**
 * Fetches the full-year finance overview for the given year in a single
 * round trip. Finalized months are served from the pre-aggregated
 * `monthly_summaries` table; the current (in-progress) month, and any
 * older month that doesn't have a stored summary yet, is computed live —
 * all inside the `get_year_finance_overview` Postgres function.
 *
 * Returns:
 *  {
 *    months: [{ month: 1, label: 'January', income, expense }, ...12],
 *    totals: { income, expense },
 *    incomeByCategory:  { [category]: amount },
 *    expenseByCategory: { [category]: amount },
 *  }
 */
export async function fetchYearlyFinanceOverview(year) {
  const raw = (await rpcQuery('get_year_finance_overview', { p_year: year })) ?? {};

  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNo = i + 1;
    const row = raw[String(monthNo)] ?? emptyMonth();
    return {
      month: monthNo,
      label: MONTH_NAMES[i],
      income: Number(row.total_income ?? 0),
      expense: Number(row.total_expense ?? 0),
    };
  });

  const incomeByCategory = {};
  const expenseByCategory = {};
  Object.values(raw).forEach((row) => {
    Object.entries(row?.income_by_category ?? {}).forEach(([cat, amt]) => {
      incomeByCategory[cat] = (incomeByCategory[cat] ?? 0) + Number(amt);
    });
    Object.entries(row?.expense_by_category ?? {}).forEach(([cat, amt]) => {
      expenseByCategory[cat] = (expenseByCategory[cat] ?? 0) + Number(amt);
    });
  });

  const totals = months.reduce(
    (acc, m) => ({ income: acc.income + m.income, expense: acc.expense + m.expense }),
    { income: 0, expense: 0 },
  );

  return { months, totals, incomeByCategory, expenseByCategory };
}

export { MONTH_NAMES };
