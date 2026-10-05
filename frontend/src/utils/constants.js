export const CURRENCIES = {
  INR: { symbol: '₹', name: 'Indian Rupee', code: 'INR' },
  USD: { symbol: '$', name: 'US Dollar', code: 'USD' },
  EUR: { symbol: '€', name: 'Euro', code: 'EUR' },
  GBP: { symbol: '£', name: 'British Pound', code: 'GBP' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', code: 'AED' },
};

export const CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#f97316' },
  { name: 'Hotel', icon: '🏨', color: '#8b5cf6' },
  { name: 'Transport', icon: '🚕', color: '#3b82f6' },
  { name: 'Fuel', icon: '⛽', color: '#ef4444' },
  { name: 'Tickets', icon: '🎟', color: '#ec4899' },
  { name: 'Shopping', icon: '🛍', color: '#06b6d4' },
  { name: 'Drinks', icon: '🍹', color: '#84cc16' },
  { name: 'Entertainment', icon: '🎭', color: '#f59e0b' },
  { name: 'Medical', icon: '💊', color: '#10b981' },
  { name: 'Other', icon: '📦', color: '#6b7280' },
];

export const SPLIT_TYPES = [
  { value: 'equal', label: 'Equal Split', description: 'Divide equally among participants' },
  { value: 'exact', label: 'Exact Amount', description: 'Specify exact amount for each person' },
  { value: 'percentage', label: 'Percentage', description: 'Split by percentage (must total 100%)' },
  { value: 'shares', label: 'By Shares', description: 'Divide by share ratio' },
  { value: 'unequal', label: 'Unequal', description: 'Custom amounts for each person' },
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'other', label: 'Other', icon: '💳' },
];

export const TRIP_STATUS = {
  upcoming: { label: 'Upcoming', color: '#3b82f6', bg: '#eff6ff' },
  active: { label: 'Active', color: '#10b981', bg: '#ecfdf5' },
  completed: { label: 'Completed', color: '#6b7280', bg: '#f9fafb' },
};

export const CHART_COLORS = [
  '#6366f1', '#f97316', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899', '#3b82f6',
];
