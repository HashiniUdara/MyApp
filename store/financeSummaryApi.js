import { dbQuery } from './supabaseClient';

const pad = (n) => String(n).padStart(2, '0');
export const monthKey = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
export const previousMonthKey = (date = new Date()) => monthKey(new Date(date.getFullYear(), date.getMonth() - 1, 1));

export function emptyMonthlySummary(yearMonth) {
  return {
    year_month: yearMonth,
    total_income: 0,
    total_expense: 0,
    income_by_category: {},
    expense_by_category: {},
  };
}

export function summarizeTransactionsForMonth(transactions = [], yearMonth) {
  const summary = emptyMonthlySummary(yearMonth);

  transactions
    .filter((txn) => txn.date?.startsWith(yearMonth))
    .forEach((txn) => {
      const amount = Number(txn.amount ?? 0) || 0;
      const category = txn.category || 'Uncategorized';

      if (txn.type === 'income') {
        summary.total_income += amount;
        summary.income_by_category[category] = (summary.income_by_category[category] ?? 0) + amount;
      } else if (txn.type === 'expense') {
        summary.total_expense += amount;
        summary.expense_by_category[category] = (summary.expense_by_category[category] ?? 0) + amount;
      }
    });

  summary.total_income = Number(summary.total_income.toFixed(2));
  summary.total_expense = Number(summary.total_expense.toFixed(2));
  return summary;
}

export async function fetchFinanceSummaries(userId, year) {
  return dbQuery('monthly_finance_summaries', {
    filters: [
      `user_id=eq.${userId}`,
      `year_month=gte.${year}-01`,
      `year_month=lte.${year}-12`,
    ],
    order: 'year_month.asc',
  });
}

export async function upsertFinanceSummary(userId, summary) {
  return dbQuery('monthly_finance_summaries', {
    method: 'POST',
    body: {
      user_id: userId,
      year_month: summary.year_month,
      total_income: summary.total_income,
      total_expense: summary.total_expense,
      income_by_category: summary.income_by_category,
      expense_by_category: summary.expense_by_category,
      summarized_at: new Date().toISOString(),
    },
    onConflict: 'user_id,year_month',
    single: true,
  });
}

export async function ensurePreviousMonthSummary(userId, transactions = [], now = new Date()) {
  const prevMonth = previousMonthKey(now);
  const existing = await dbQuery('monthly_finance_summaries', {
    filters: [`user_id=eq.${userId}`, `year_month=eq.${prevMonth}`],
    single: true,
  });
  if (existing) return existing;
  return upsertFinanceSummary(userId, summarizeTransactionsForMonth(transactions, prevMonth));
}
