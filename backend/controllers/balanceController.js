const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const Trip = require('../models/Trip');
const { calculateBalances, simplifySettlements } = require('../services/balanceService');

// @desc    Get balances for a trip
// @route   GET /api/trips/:tripId/balances
// @access  Private (Trip Member)
const getBalances = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('members.user', 'name email profileImage');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const isMember = trip.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

    const expenses = await Expense.find({ tripId: trip._id })
      .populate('paidBy', 'name email profileImage')
      .populate('splitDetails.user', 'name email profileImage');

    const settlements = await Settlement.find({ tripId: trip._id, status: 'paid' });

    const balances = calculateBalances(expenses, settlements);

    // Enrich with user data
    const members = trip.members.map((m) => m.user);
    const enrichedBalances = members.map((member) => {
      const userId = member._id.toString();
      const balance = balances[userId] || { paid: 0, owed: 0, netBalance: 0 };
      return {
        user: member,
        paid: balance.paid,
        owed: balance.owed,
        netBalance: balance.netBalance,
      };
    });

    res.json({ success: true, data: enrichedBalances });
  } catch (error) {
    next(error);
  }
};

// @desc    Get simplified settlements for a trip
// @route   GET /api/trips/:tripId/simplified-balances
// @access  Private (Trip Member)
const getSimplifiedBalances = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('members.user', 'name email profileImage');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const isMember = trip.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

    const expenses = await Expense.find({ tripId: trip._id })
      .populate('paidBy', 'name email profileImage')
      .populate('splitDetails.user', 'name email profileImage');

    const settlements = await Settlement.find({ tripId: trip._id, status: 'paid' });

    const balances = calculateBalances(expenses, settlements);
    const members = trip.members.map((m) => m.user);
    const simplified = simplifySettlements(balances, members);

    res.json({ success: true, data: simplified });
  } catch (error) {
    next(error);
  }
};

// @desc    Get settlements for a trip
// @route   GET /api/trips/:tripId/settlements
// @access  Private (Trip Member)
const getSettlements = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const isMember = trip.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

    const { status } = req.query;
    const query = { tripId: trip._id };
    if (status) query.status = status;

    const settlements = await Settlement.find(query)
      .populate('from', 'name email profileImage')
      .populate('to', 'name email profileImage')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: settlements });
  } catch (error) {
    next(error);
  }
};

// @desc    Create settlement
// @route   POST /api/trips/:tripId/settlements
// @access  Private (Trip Member)
const createSettlement = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('members.user', 'name email profileImage');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const isMember = trip.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

    const { from, to, amount, paymentMethod, notes } = req.body;

    if (!from || !to || !amount) {
      return res.status(400).json({ success: false, message: 'From, to, and amount are required' });
    }

    if (from === to) {
      return res.status(400).json({ success: false, message: 'From and to cannot be the same person' });
    }

    const settlement = await Settlement.create({
      tripId: trip._id,
      from,
      to,
      amount: parseFloat(amount),
      paymentMethod: paymentMethod || 'cash',
      notes,
      status: 'paid',
      paidAt: new Date(),
      createdBy: req.user._id,
    });

    const populated = await Settlement.findById(settlement._id)
      .populate('from', 'name email profileImage')
      .populate('to', 'name email profileImage');

    res.status(201).json({ success: true, message: 'Settlement recorded successfully', data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update settlement status
// @route   PUT /api/settlements/:settlementId
// @access  Private
const updateSettlement = async (req, res, next) => {
  try {
    const settlement = await Settlement.findById(req.params.settlementId).populate('tripId');
    if (!settlement) return res.status(404).json({ success: false, message: 'Settlement not found' });

    const { status, paymentMethod } = req.body;
    const updateData = {};

    if (status) {
      updateData.status = status;
      if (status === 'paid') updateData.paidAt = new Date();
    }
    if (paymentMethod) updateData.paymentMethod = paymentMethod;

    const updated = await Settlement.findByIdAndUpdate(settlement._id, updateData, { new: true })
      .populate('from', 'name email profileImage')
      .populate('to', 'name email profileImage');

    res.json({ success: true, message: 'Settlement updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBalances, getSimplifiedBalances, getSettlements, createSettlement, updateSettlement };
