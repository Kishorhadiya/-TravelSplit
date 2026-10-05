const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const { calculateTripAnalytics, calculateBudgetStatus } = require('../services/balanceService');

// @desc    Get trip analytics
// @route   GET /api/trips/:tripId/analytics
// @access  Private (Trip Member)
const getTripAnalytics = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('members.user', 'name email profileImage');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const isMember = trip.members.some(
      (m) => m.user && m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

    const expenses = await Expense.find({ tripId: trip._id })
      .populate('paidBy', 'name email profileImage')
      .populate('splitDetails.user', 'name email profileImage')
      .sort({ date: 1 });

    const analytics = calculateTripAnalytics(expenses);
    const budgetStatus = calculateBudgetStatus(trip.budget, analytics.totalAmount);

    // Format for charts
    const categoryChartData = Object.entries(analytics.categoryTotals || {}).map(([name, value]) => ({
      name,
      value,
    }));

    const memberChartData = Object.values(analytics.memberTotals || {}).map((m) => ({
      name: m.user?.name || 'Unknown',
      paid: m.paid || 0,
      owed: m.owed || 0,
    }));

    const dailyChartData = Object.entries(analytics.dailyTotals || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));

    res.json({
      success: true,
      data: {
        ...analytics,
        budgetStatus,
        charts: {
          category: categoryChartData,
          member: memberChartData,
          daily: dailyChartData,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all user trips
    const trips = await Trip.find({ 'members.user': userId, isArchived: false });
    const tripIds = trips.map((t) => t._id);

    // Get all expenses in these trips
    const allExpenses = await Expense.find({ tripId: { $in: tripIds } })
      .populate('paidBy', 'name email')
      .populate('splitDetails.user', 'name email');

    let totalExpenses = 0;
    let youOwe = 0;
    let youGet = 0;

    for (const expense of allExpenses) {
      totalExpenses += expense.amount || 0;

      const payerId = expense.paidBy?._id ? expense.paidBy._id.toString() : expense.paidBy ? expense.paidBy.toString() : null;

      if (payerId && payerId === userId.toString()) {
        // I paid - calculate how much others owe me
        const myShare = (expense.splitDetails || []).find(
          (d) => d.user && (d.user._id ? d.user._id.toString() : d.user.toString()) === userId.toString()
        );
        const myShareAmount = myShare ? myShare.amount || 0 : 0;
        youGet += (expense.amount || 0) - myShareAmount;
      } else {
        // Someone else paid - calculate how much I owe
        const myShare = (expense.splitDetails || []).find(
          (d) => d.user && (d.user._id ? d.user._id.toString() : d.user.toString()) === userId.toString()
        );
        if (myShare) youOwe += myShare.amount || 0;
      }
    }

    const recentTrips = await Trip.find({ 'members.user': userId, isArchived: false })
      .populate('members.user', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentExpenses = await Expense.find({ tripId: { $in: tripIds } })
      .populate('paidBy', 'name email profileImage')
      .populate('tripId', 'name currency')
      .sort({ createdAt: -1 })
      .limit(5);

    const activeTrips = trips.filter((t) => t.status === 'active').length;
    const upcomingTrips = trips.filter((t) => t.status === 'upcoming').length;

    res.json({
      success: true,
      data: {
        stats: {
          activeTrips,
          upcomingTrips,
          totalTrips: trips.length,
          totalExpenses: Math.round(totalExpenses * 100) / 100,
          youOwe: Math.round(youOwe * 100) / 100,
          youGet: Math.round(youGet * 100) / 100,
          netBalance: Math.round((youGet - youOwe) * 100) / 100,
        },
        recentTrips,
        recentExpenses,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTripAnalytics, getDashboardAnalytics };
