═══════════════════════════════════════════════════════
  DATA STRUCTURES
═══════════════════════════════════════════════════════

People = [{ id, name }]
  e.g. [A, B, C, D]

Expense = {
  id,
  description,
  amount,         // total amount spent
  paidBy,         // person id who paid
  splitType,      // 'equally' | 'byAmount' | 'byPercentage'
  participants,   // list of person ids involved
  splits: {       // how it's divided
    personId -> amount_owed
  }
}

Expenses = [Expense1, Expense2, ...]


═══════════════════════════════════════════════════════
  STEP 1: CALCULATE SPLITS WHEN ADDING AN EXPENSE
═══════════════════════════════════════════════════════

function calculateSplits(expense):

  splits = {}

  if splitType == 'equally':
    share = expense.amount / participants.length
    for each person in participants:
      splits[person] = share

    // Example: A pays 1000 for A,B,C
    // splits = { A:333.33, B:333.33, C:333.33 }


  if splitType == 'byAmount':
    // User manually enters how much each person owes
    // Validation: sum of amounts must equal total
    validate: sum(manualAmounts) == expense.amount
    splits = manualAmounts

    // Example: A pays 1000, split B=200, C=300, A=500
    // splits = { A:500, B:200, C:300 }


  if splitType == 'byPercentage':
    // User enters percentage per person
    // Validation: percentages must sum to 100
    validate: sum(percentages) == 100
    for each person in participants:
      splits[person] = expense.amount * (percentage[person] / 100)

    // Example: A pays 1000, B=50%, C=50%
    // splits = { A:0, B:500, C:500 }

  return splits


═══════════════════════════════════════════════════════
  STEP 2: BUILD NET BALANCE MAP FROM ALL EXPENSES
═══════════════════════════════════════════════════════

// balance[person] = net amount
// positive = others owe them money
// negative = they owe money to others

function calculateNetBalances(expenses, people):

  balance = {}
  for each person in people:
    balance[person] = 0

  for each expense in expenses:
    payer = expense.paidBy
    splits = expense.splits

    for each (person, owed_amount) in splits:

      if person == payer:
        // Payer paid for themselves — no transaction needed
        continue

      // Person owes payer
      balance[payer]  += owed_amount   // payer is owed more
      balance[person] -= owed_amount   // person owes more

  return balance

  // Example with one expense:
  // A pays 1000, splits equally among A,B,C (333.33 each)
  // balance[A] += 333.33  (B owes A)
  // balance[B] -= 333.33
  // balance[A] += 333.33  (C owes A)
  // balance[C] -= 333.33
  // Result: A=+666.66, B=-333.33, C=-333.33


═══════════════════════════════════════════════════════
  STEP 3: SIMPLIFY DEBTS (minimize transactions)
═══════════════════════════════════════════════════════

// Instead of showing raw balances, find the minimum
// number of payments to settle everything.
// Uses a greedy algorithm: match biggest debtor with biggest creditor

function simplifyDebts(balances):

  // Separate into who owes (negative) and who is owed (positive)
  creditors = [(person, amount) where balance > 0]  // sorted descending
  debtors   = [(person, amount) where balance < 0]  // sorted ascending (most negative first)

  settlements = []

  while creditors not empty AND debtors not empty:

    creditor = creditors[0]   // person owed the most
    debtor   = debtors[0]     // person who owes the most

    // How much can be settled in this transaction
    settleAmount = min(creditor.amount, abs(debtor.amount))

    settlements.append({
      from:   debtor.person,
      to:     creditor.person,
      amount: settleAmount
    })

    // Reduce balances
    creditor.amount -= settleAmount
    debtor.amount   += settleAmount

    // Remove if fully settled
    if creditor.amount == 0: remove creditor from list
    if debtor.amount  == 0: remove debtor  from list

  return settlements


═══════════════════════════════════════════════════════
  EXAMPLE: FULL WALKTHROUGH
═══════════════════════════════════════════════════════

People: A, B, C

Expense 1: A pays 900, split equally among A,B,C
  splits = { A:300, B:300, C:300 }
  B owes A 300, C owes A 300

Expense 2: B pays 600, split by percentage: A=50%, B=0%, C=50%
  splits = { A:300, B:0, C:300 }
  A owes B 300, C owes B 300

Expense 3: C pays 300, split by amount: A=100, B=100, C=100
  splits = { A:100, B:100, C:100 }
  A owes C 100, B owes C 100

───────────────────────────────────────────────────────
NET BALANCES:
  balance[A] = 0
              + 300  (B owes A from exp1)
              + 300  (C owes A from exp1)
              - 300  (A owes B from exp2)
              - 100  (A owes C from exp3)
              = +200

  balance[B] = 0
              - 300  (B owes A from exp1)
              + 300  (A owes B from exp2) -- wait, B paid
                      actually: B paid 600
                      B's split = 0, so B owes nobody from exp2
              + 300  (C owes B from exp2)
              - 100  (B owes C from exp3)
              = -100

  balance[C] = 0
              - 300  (C owes A from exp1)
              - 300  (C owes B from exp2)
              + 100  (A owes C from exp3)
              + 100  (B owes C from exp3)
              = -100  -- wait, let me recalc: -300-300+100+100 = -100 -- but sum must = 0
              // A=+200, B=-100, C=-100 → sum=0 ✓
───────────────────────────────────────────────────────
SIMPLIFY:
  Creditors: [A: +200]
  Debtors:   [B: -100, C: -100]

  Round 1: B pays A 100 → A: +100, B: 0 (settled)
  Round 2: C pays A 100 → A: 0 (settled), C: 0

FINAL RESULT:
  B pays A  100
  C pays A  100
  → Only 2 transactions to settle everything ✓


═══════════════════════════════════════════════════════
  EDGE CASES TO HANDLE
═══════════════════════════════════════════════════════

1. Payer is NOT in participants
   → Payer paid for others only, owed the full amount

2. Payer IS in participants
   → Payer's own share is subtracted: they effectively paid for themselves

3. Percentage doesn't add to 100
   → Show validation error before saving

4. By amount doesn't add to total
   → Show validation error before saving

5. Rounding errors (333.33 * 3 = 999.99 not 1000)
   → Add rounding remainder to last person in list

6. Person settles up outside the app
   → Add a "record payment" feature that creates a
      manual settlement entry and adjusts balances

7. Multiple groups
   → Each group has its own people list and expenses list
      Run the same logic independently per group