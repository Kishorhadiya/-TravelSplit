const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const { computeSplit } = require('../services/splitService');
const { notifyTripMembers } = require('../services/notificationService');

const CATEGORIES = ['Food', 'Hotel', 'Transport', 'Fuel', 'Tickets', 'Shopping', 'Drinks', 'Entertainment', 'Medical', 'Other'];

// @desc    Create expense
// @route   POST /api/trips/:tripId/expenses
// @access  Private (Trip Member)
const createExpense = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('members.user', 'name email profileImage');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const isMember = trip.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

    const { title, amount, category, paidBy, splitType, participants, splitDetails, notes, date } = req.body;

    // Validate paidBy is a trip member
    const payerIsMember = trip.members.some((m) => m.user._id.toString() === paidBy);
    if (!payerIsMember) {
      return res.status(400).json({ success: false, message: 'Payer must be a member of the trip' });
    }

    // Validate all participants are trip members
    const memberIds = trip.members.map((m) => m.user._id.toString());
    const invalidParticipants = participants.filter((p) => !memberIds.includes(p));
    if (invalidParticipants.length > 0) {
      return res.status(400).json({ success: false, message: 'All participants must be trip members' });
    }

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    // Compute split
    let parsedSplitDetails = splitDetails;
    if (typeof splitDetails === 'string') {
      parsedSplitDetails = JSON.parse(splitDetails);
    }

    const computedSplit = computeSplit(splitType, parseFloat(amount), participants, parsedSplitDetails);

    const receiptPath = req.file ? `/uploads/${req.file.filename}` : null;

    const expense = await Expense.create({
      tripId: trip._id,
      title,
      amount: parseFloat(amount),
      category,
      paidBy,
      splitType,
      participants,
      splitDetails: computedSplit,
      notes,
      receipt: receiptPath,
      date: date || new Date(),
      createdBy: req.user._id,
    });

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name email profileImage')
      .populate('participants', 'name email profileImage')
      .populate('splitDetails.user', 'name email profileImage')
      .populate('createdBy', 'name email profileImage');

    // Notify trip members
    await notifyTripMembers(
      trip,
      req.user._id,
      'expense_added',
      `${req.user.name} added a new expense "${title}" of ${trip.currency} ${amount}`,
      { relatedExpense: expense._id }
    );

    res.status(201).json({ success: true, message: 'Expense created successfully', data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all expenses for a trip
// @route   GET /api/trips/:tripId/expenses
// @access  Private (Trip Member)
const getExpenses = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const isMember = trip.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

    const { category, paidBy, startDate, endDate, minAmount, maxAmount, splitType, search, sort = 'newest', page = 1, limit = 50 } = req.query;

    const query = { tripId: trip._id };

    if (category) query.category = category;
    if (paidBy) query.paidBy = paidBy;
    if (splitType) query.splitType = splitType;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    const sortMap = {
      newest: { date: -1 },
      oldest: { date: 1 },
      highest: { amount: -1 },
      lowest: { amount: 1 },
    };

    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email profileImage')
      .populate('participants', 'name email profileImage')
      .populate('splitDetails.user', 'name email profileImage')
      .populate('createdBy', 'name email')
      .sort(sortMap[sort] || { date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: expenses,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:expenseId
// @access  Private
const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.expenseId)
      .populate('paidBy', 'name email profileImage')
      .populate('participants', 'name email profileImage')
      .populate('splitDetails.user', 'name email profileImage')
      .populate('createdBy', 'name email profileImage')
      .populate('tripId', 'name currency members');

    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    const isMember = expense.tripId.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

    res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:expenseId
// @access  Private
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.expenseId).populate('tripId');
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    // Only creator or trip admin can edit
    const trip = await Trip.findById(expense.tripId);
    const member = trip.members.find((m) => m.user.toString() === req.user._id.toString());
    const canEdit =
      expense.createdBy.toString() === req.user._id.toString() ||
      (member && (member.role === 'owner' || member.role === 'admin'));

    if (!canEdit) {
      return res.status(403).json({ success: false, message: 'You cannot edit this expense' });
    }

    const { title, amount, category, paidBy, splitType, participants, splitDetails, notes, date } = req.body;

    let parsedSplitDetails = splitDetails;
    if (typeof splitDetails === 'string') {
      parsedSplitDetails = JSON.parse(splitDetails);
    }

    const newAmount = parseFloat(amount) || expense.amount;
    const newParticipants = participants || expense.participants.map((p) => p.toString());
    const computedSplit = computeSplit(
      splitType || expense.splitType,
      newAmount,
      newParticipants,
      parsedSplitDetails
    );

    const updateData = {
      title: title || expense.title,
      amount: newAmount,
      category: category || expense.category,
      paidBy: paidBy || expense.paidBy,
      splitType: splitType || expense.splitType,
      participants: newParticipants,
      splitDetails: computedSplit,
      notes: notes !== undefined ? notes : expense.notes,
      date: date || expense.date,
    };

    if (req.file) updateData.receipt = `/uploads/${req.file.filename}`;

    const updated = await Expense.findByIdAndUpdate(expense._id, updateData, { new: true })
      .populate('paidBy', 'name email profileImage')
      .populate('participants', 'name email profileImage')
      .populate('splitDetails.user', 'name email profileImage');

    res.json({ success: true, message: 'Expense updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:expenseId
// @access  Private
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    const trip = await Trip.findById(expense.tripId);
    const member = trip ? trip.members.find((m) => m.user.toString() === req.user._id.toString()) : null;
    const canDelete =
      expense.createdBy.toString() === req.user._id.toString() ||
      (member && (member.role === 'owner' || member.role === 'admin'));

    if (!canDelete) {
      return res.status(403).json({ success: false, message: 'You cannot delete this expense' });
    }

    await Expense.findByIdAndDelete(expense._id);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createExpense, getExpenses, getExpense, updateExpense, deleteExpense };
