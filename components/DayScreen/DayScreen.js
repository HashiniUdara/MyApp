import DayView from './DayView';

export default function DayScreen({
  expenses, incomes, transactions,
  onRemoveExpense, onRemoveIncome,
  onAddExpense, onAddIncome,
  onUpdateExpense, onUpdateIncome,
  expenseCategories, incomeCategories,
}) {
  const today = new Date().toISOString().split('T')[0];

  const allTxns = transactions ?? [
    ...incomes.map(t  => ({ ...t, type: 'income'  })),
    ...expenses.map(t => ({ ...t, type: 'expense' })),
  ];

  const handleAdd    = (entry) => entry.type === 'income' ? onAddIncome(entry) : onAddExpense(entry);
  const handleUpdate = (id, entry) => entry.type === 'income' ? onUpdateIncome(id, entry) : onUpdateExpense(id, entry);
  const handleRemove = (item) => item.type === 'income'
    ? onRemoveIncome(item.originalIndex ?? incomes.findIndex(t => t.id === item.id))
    : onRemoveExpense(item.originalIndex ?? expenses.findIndex(t => t.id === item.id));

  return (
    <DayView
      date={today}
      transactions={allTxns}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onRemove={handleRemove}
      expenseCategories={expenseCategories}
      incomeCategories={incomeCategories}
    />
  );
}
