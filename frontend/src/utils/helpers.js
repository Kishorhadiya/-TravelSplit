import { CURRENCIES, CATEGORIES } from './constants';
import { format, formatDistanceToNow } from 'date-fns';

export const formatCurrency = (amount, currencyCode = 'INR') => {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.INR;
  return `${currency.symbol}${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '';
  return format(new Date(date), fmt);
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const getCategoryInfo = (categoryName) => {
  return CATEGORIES.find((c) => c.name === categoryName) || CATEGORIES[CATEGORIES.length - 1];
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getAvatarColor = (name) => {
  const colors = [
    '#6366f1', '#f97316', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899', '#3b82f6',
  ];
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export const calculateSplitPreview = (amount, splitType, participants, splitDetails) => {
  if (!participants || participants.length === 0) return [];
  const total = parseFloat(amount) || 0;

  switch (splitType) {
    case 'equal': {
      const perPerson = Math.floor((total / participants.length) * 100) / 100;
      const remainder = Math.round((total - perPerson * participants.length) * 100) / 100;
      return participants.map((p, i) => ({
        user: p,
        amount: i === 0 ? Math.round((perPerson + remainder) * 100) / 100 : perPerson,
      }));
    }
    case 'exact':
    case 'unequal':
      return splitDetails || participants.map((p) => ({ user: p, amount: 0 }));
    case 'percentage':
      return (splitDetails || []).map((d) => ({
        user: d.user,
        amount: Math.round((total * (d.percentage || 0)) / 100 * 100) / 100,
        percentage: d.percentage || 0,
      }));
    case 'shares': {
      const totalShares = (splitDetails || []).reduce((s, d) => s + (d.shares || 0), 0);
      return (splitDetails || []).map((d) => ({
        user: d.user,
        shares: d.shares || 0,
        amount: totalShares > 0 ? Math.round((total * (d.shares || 0)) / totalShares * 100) / 100 : 0,
      }));
    }
    default:
      return [];
  }
};

export const getBudgetColor = (percentage) => {
  if (percentage >= 100) return '#ef4444';
  if (percentage >= 80) return '#f59e0b';
  return '#10b981';
};

export const truncate = (str, maxLength = 30) => {
  if (!str) return '';
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
};
