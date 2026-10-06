/**
 * Expense Splitting Service
 * Core business logic for splitting expenses among trip members
 */

/**
 * Round to 2 decimal places to avoid floating-point issues
 */
const round = (num) => Math.round(num * 100) / 100;

/**
 * Calculate equal split
 * @param {number} amount - Total expense amount
 * @param {Array} participantIds - Array of participant user IDs
 * @returns {Array} - Array of { user, amount }
 */
const calculateEqualSplit = (amount, participantIds) => {
  if (!participantIds || participantIds.length === 0) {
    throw new Error('At least one participant is required');
  }
  const count = participantIds.length;
  const baseAmount = Math.floor((amount / count) * 100) / 100;
  const remainder = round(amount - baseAmount * count);

  return participantIds.map((userId, index) => ({
    user: userId,
    amount: index === 0 ? round(baseAmount + remainder) : baseAmount,
    percentage: round((1 / count) * 100),
    shares: 1,
  }));
};

/**
 * Calculate exact split - users specify exact amounts
 * @param {Array} splitDetails - Array of { user, amount }
 * @param {number} totalAmount - Total expense amount
 * @returns {Array} - Validated split details
 */
const calculateExactSplit = (splitDetails, totalAmount) => {
  if (!splitDetails || splitDetails.length === 0) {
    throw new Error('Split details are required');
  }

  const total = round(splitDetails.reduce((sum, detail) => sum + detail.amount, 0));

  if (Math.abs(total - totalAmount) > 0.01) {
    throw new Error(
      `Split amounts (${total}) must equal the total expense amount (${totalAmount})`
    );
  }

  return splitDetails.map((detail) => ({
    user: detail.user,
    amount: round(detail.amount),
    percentage: round((detail.amount / totalAmount) * 100),
  }));
};

/**
 * Calculate percentage split
 * @param {Array} splitDetails - Array of { user, percentage }
 * @param {number} totalAmount - Total expense amount
 * @returns {Array} - Calculated split details
 */
const calculatePercentageSplit = (splitDetails, totalAmount) => {
  if (!splitDetails || splitDetails.length === 0) {
    throw new Error('Split details are required');
  }

  const totalPercentage = round(
    splitDetails.reduce((sum, detail) => sum + detail.percentage, 0)
  );

  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`Percentages must equal 100%. Current total: ${totalPercentage}%`);
  }

  const calculated = splitDetails.map((detail) => ({
    user: detail.user,
    percentage: round(detail.percentage),
    amount: Math.floor((totalAmount * detail.percentage) / 100 * 100) / 100,
  }));

  // Adjust for rounding error
  const calculatedTotal = round(calculated.reduce((sum, d) => sum + d.amount, 0));
  const diff = round(totalAmount - calculatedTotal);
  if (diff !== 0) {
    calculated[0].amount = round(calculated[0].amount + diff);
  }

  return calculated;
};

/**
 * Calculate shares split
 * @param {Array} splitDetails - Array of { user, shares }
 * @param {number} totalAmount - Total expense amount
 * @returns {Array} - Calculated split details
 */
const calculateSharesSplit = (splitDetails, totalAmount) => {
  if (!splitDetails || splitDetails.length === 0) {
    throw new Error('Split details are required');
  }

  const totalShares = splitDetails.reduce((sum, detail) => sum + detail.shares, 0);
  if (totalShares <= 0) {
    throw new Error('Total shares must be greater than 0');
  }

  const calculated = splitDetails.map((detail) => ({
    user: detail.user,
    shares: detail.shares,
    percentage: round((detail.shares / totalShares) * 100),
    amount: Math.floor((totalAmount * detail.shares) / totalShares * 100) / 100,
  }));

  // Adjust for rounding error
  const calculatedTotal = round(calculated.reduce((sum, d) => sum + d.amount, 0));
  const diff = round(totalAmount - calculatedTotal);
  if (diff !== 0) {
    calculated[0].amount = round(calculated[0].amount + diff);
  }

  return calculated;
};

/**
 * Calculate unequal split - alias for exact split but with separate validation
 * @param {Array} splitDetails - Array of { user, amount }
 * @param {number} totalAmount - Total expense amount
 * @returns {Array} - Validated split details
 */
const calculateUnequalSplit = (splitDetails, totalAmount) => {
  return calculateExactSplit(splitDetails, totalAmount);
};

/**
 * Calculate personal split - 100% amount assigned to one person, 0 to others
 * @param {Array} splitDetails - Array of { user, amount }
 * @param {number} totalAmount - Total expense amount
 * @returns {Array} - Validated split details
 */
const calculatePersonalSplit = (splitDetails, totalAmount) => {
  return calculateExactSplit(splitDetails, totalAmount);
};

/**
 * Main function to compute split based on type
 * @param {string} splitType - 'equal' | 'exact' | 'percentage' | 'shares' | 'unequal' | 'personal'
 * @param {number} amount - Total amount
 * @param {Array} participants - Array of user IDs
 * @param {Array} splitDetails - Optional split details for non-equal methods
 * @returns {Array} - Computed split details
 */
const computeSplit = (splitType, amount, participants, splitDetails) => {
  switch (splitType) {
    case 'equal':
      return calculateEqualSplit(amount, participants);
    case 'exact':
      return calculateExactSplit(splitDetails, amount);
    case 'percentage':
      return calculatePercentageSplit(splitDetails, amount);
    case 'shares':
      return calculateSharesSplit(splitDetails, amount);
    case 'unequal':
      return calculateUnequalSplit(splitDetails, amount);
    case 'personal':
      return calculatePersonalSplit(splitDetails, amount);
    default:
      throw new Error(`Unknown split type: ${splitType}`);
  }
};

module.exports = {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  calculateUnequalSplit,
  computeSplit,
  round,
};
