/**
 * Balance Calculation Service
 * Computes net balances and simplifies settlements
 */
const { round } = require('./splitService');

/**
 * Calculate net balances for all members in a trip
 * Net Balance = Amount Paid - Amount Owed
 * Positive = person should receive money
 * Negative = person owes money
 *
 * @param {Array} expenses - Array of expense documents (populated)
 * @param {Array} settlements - Array of settlement documents (paid)
 * @returns {Object} - Map of userId => { paid, owed, netBalance }
 */
const calculateBalances = (expenses, settlements = []) => {
  const balances = {}; // { userId: { paid: number, owed: number, netBalance: number } }

  const ensureUser = (userId) => {
    const key = userId.toString();
    if (!balances[key]) {
      balances[key] = { paid: 0, owed: 0, netBalance: 0 };
    }
    return key;
  };

  // Process expenses
  for (const expense of expenses) {
    const payerId = ensureUser(expense.paidBy._id || expense.paidBy);
    balances[payerId].paid = round(balances[payerId].paid + expense.amount);

    // Add owed amounts for each participant
    for (const detail of expense.splitDetails) {
      const userId = ensureUser(detail.user._id || detail.user);
      balances[userId].owed = round(balances[userId].owed + detail.amount);
    }
  }

  // Process paid settlements - reduce outstanding debts
  for (const settlement of settlements) {
    if (settlement.status === 'paid') {
      const fromId = ensureUser(settlement.from._id || settlement.from);
      const toId = ensureUser(settlement.to._id || settlement.to);
      // from paid to, so from's debt decreases, to's receivable decreases
      balances[fromId].owed = round(balances[fromId].owed - settlement.amount);
      balances[toId].paid = round(balances[toId].paid - settlement.amount);
    }
  }

  // Calculate net balance for each user
  for (const userId of Object.keys(balances)) {
    balances[userId].netBalance = round(
      balances[userId].paid - balances[userId].owed
    );
  }

  return balances;
};

/**
 * Calculate who owes whom using the net balances
 * Uses a greedy algorithm to minimize number of transactions
 *
 * @param {Object} balances - Map of userId => { netBalance }
 * @param {Array} memberMap - Array of { _id, name, email, profileImage } for enrichment
 * @returns {Array} - Array of { from, to, amount } transactions
 */
const simplifySettlements = (balances, memberMap = []) => {
  const memberLookup = {};
  memberMap.forEach((m) => {
    memberLookup[m._id.toString()] = m;
  });

  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors = []; // People who should receive money
  const debtors = []; // People who owe money

  for (const [userId, balance] of Object.entries(balances)) {
    if (balance.netBalance > 0.01) {
      creditors.push({ userId, amount: balance.netBalance });
    } else if (balance.netBalance < -0.01) {
      debtors.push({ userId, amount: Math.abs(balance.netBalance) });
    }
  }

  const transactions = [];

  // Greedy algorithm
  let i = 0;
  let j = 0;
  const creditorsCopy = creditors.map((c) => ({ ...c }));
  const debtorsCopy = debtors.map((d) => ({ ...d }));

  while (i < creditorsCopy.length && j < debtorsCopy.length) {
    const creditor = creditorsCopy[i];
    const debtor = debtorsCopy[j];
    const settleAmount = round(Math.min(creditor.amount, debtor.amount));

    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: settleAmount,
      fromUser: memberLookup[debtor.userId] || null,
      toUser: memberLookup[creditor.userId] || null,
    });

    creditor.amount = round(creditor.amount - settleAmount);
    debtor.amount = round(debtor.amount - settleAmount);

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return transactions;
};

/**
 * Calculate trip totals and analytics
 */
const calculateTripAnalytics = (expenses) => {
  const categoryTotals = {};
  const memberTotals = {}; // { userId: { paid, owed, name } }
  const dailyTotals = {}; // { date: amount }

  let totalAmount = 0;

  for (const expense of expenses) {
    totalAmount = round(totalAmount + expense.amount);

    // Category totals
    const cat = expense.category;
    categoryTotals[cat] = round((categoryTotals[cat] || 0) + expense.amount);

    // Member paid totals
    const payerId = (expense.paidBy._id || expense.paidBy).toString();
    if (!memberTotals[payerId]) {
      memberTotals[payerId] = { paid: 0, owed: 0, user: expense.paidBy };
    }
    memberTotals[payerId].paid = round(memberTotals[payerId].paid + expense.amount);

    // Member owed totals
    for (const detail of expense.splitDetails) {
      const userId = (detail.user._id || detail.user).toString();
      if (!memberTotals[userId]) {
        memberTotals[userId] = { paid: 0, owed: 0, user: detail.user };
      }
      memberTotals[userId].owed = round(memberTotals[userId].owed + detail.amount);
    }

    // Daily totals
    const dateKey = new Date(expense.date).toISOString().split('T')[0];
    dailyTotals[dateKey] = round((dailyTotals[dateKey] || 0) + expense.amount);
  }

  return {
    totalAmount,
    categoryTotals,
    memberTotals,
    dailyTotals,
    expenseCount: expenses.length,
    highestExpense:
      expenses.length > 0
        ? expenses.reduce((max, e) => (e.amount > max.amount ? e : max), expenses[0])
        : null,
    mostExpensiveCategory:
      Object.keys(categoryTotals).length > 0
        ? Object.entries(categoryTotals).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
        : null,
  };
};

/**
 * Calculate budget status
 */
const calculateBudgetStatus = (budget, totalSpent) => {
  if (!budget || budget === 0) {
    return { hasBudget: false, spent: totalSpent, remaining: null, percentage: null };
  }

  const remaining = round(budget - totalSpent);
  const percentage = round((totalSpent / budget) * 100);

  return {
    hasBudget: true,
    budget,
    spent: totalSpent,
    remaining,
    percentage,
    isWarning: percentage >= 80 && percentage < 100,
    isExceeded: percentage >= 100,
    exceededBy: percentage >= 100 ? round(totalSpent - budget) : 0,
  };
};

module.exports = {
  calculateBalances,
  simplifySettlements,
  calculateTripAnalytics,
  calculateBudgetStatus,
};
