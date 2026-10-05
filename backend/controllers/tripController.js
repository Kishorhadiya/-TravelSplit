const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const User = require('../models/User');
const { notifyTripMembers, createNotification } = require('../services/notificationService');

// Helper to load trip and attach to req
const loadTrip = async (tripId) => {
  return await Trip.findById(tripId).populate('members.user', 'name email profileImage');
};

// @desc    Create trip
// @route   POST /api/trips
// @access  Private
const createTrip = async (req, res, next) => {
  try {
    const { name, description, location, startDate, endDate, currency, budget } = req.body;

    const coverImage = req.file ? `/uploads/${req.file.filename}` : null;

    const trip = await Trip.create({
      name,
      description,
      location,
      startDate,
      endDate,
      currency: currency || 'INR',
      budget: budget || 0,
      coverImage,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });

    const populatedTrip = await loadTrip(trip._id);
    res.status(201).json({ success: true, message: 'Trip created successfully', data: populatedTrip });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all trips for user
// @route   GET /api/trips
// @access  Private
const getTrips = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = { 'members.user': req.user._id, isArchived: false };
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };

    const trips = await Trip.find(query)
      .populate('members.user', 'name email profileImage')
      .populate('createdBy', 'name email profileImage')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Enrich with expense totals
    const enrichedTrips = await Promise.all(
      trips.map(async (trip) => {
        const expenses = await Expense.find({ tripId: trip._id });
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        return {
          ...trip.toObject(),
          totalExpenses: Math.round(totalExpenses * 100) / 100,
          expenseCount: expenses.length,
        };
      })
    );

    const total = await Trip.countDocuments(query);

    res.json({
      success: true,
      data: enrichedTrips,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single trip
// @route   GET /api/trips/:tripId
// @access  Private
const getTrip = async (req, res, next) => {
  try {
    const trip = await loadTrip(req.params.tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const isMember = trip.members.some(
      (m) => m.user && m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

    const expenses = await Expense.find({ tripId: trip._id });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      success: true,
      data: {
        ...trip.toObject(),
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        expenseCount: expenses.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trip
// @route   PUT /api/trips/:tripId
// @access  Private (Admin/Owner)
const updateTrip = async (req, res, next) => {
  try {
    const trip = await loadTrip(req.params.tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const member = trip.members.find(
      (m) => m.user && m.user._id.toString() === req.user._id.toString()
    );
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Only admins can update the trip' });
    }

    const allowed = ['name', 'description', 'location', 'startDate', 'endDate', 'currency', 'budget', 'status'];
    const updateData = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    if (req.file) updateData.coverImage = `/uploads/${req.file.filename}`;

    const updated = await Trip.findByIdAndUpdate(req.params.tripId, updateData, {
      new: true,
      runValidators: true,
    }).populate('members.user', 'name email profileImage');

    await notifyTripMembers(trip, req.user._id, 'trip_updated', `${req.user.name} updated the trip "${trip.name}"`);

    res.json({ success: true, message: 'Trip updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete trip
// @route   DELETE /api/trips/:tripId
// @access  Private (Owner only)
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const member = trip.members.find(
      (m) => m.user && m.user.toString() === req.user._id.toString()
    );
    if (!member || member.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only the trip owner can delete the trip' });
    }

    // Delete related data
    await Expense.deleteMany({ tripId: trip._id });
    await Settlement.deleteMany({ tripId: trip._id });
    await Trip.findByIdAndDelete(trip._id);

    res.json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Archive/unarchive trip
// @route   PUT /api/trips/:tripId/archive
// @access  Private (Admin/Owner)
const archiveTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const member = trip.members.find(
      (m) => m.user && m.user.toString() === req.user._id.toString()
    );
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Only admins can archive the trip' });
    }

    trip.isArchived = !trip.isArchived;
    await trip.save();

    res.json({
      success: true,
      message: `Trip ${trip.isArchived ? 'archived' : 'unarchived'} successfully`,
      data: trip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to trip
// @route   POST /api/trips/:tripId/members
// @access  Private (Admin/Owner)
const addMember = async (req, res, next) => {
  try {
    const trip = await loadTrip(req.params.tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const requestingMember = trip.members.find(
      (m) => m.user && m.user._id.toString() === req.user._id.toString()
    );
    if (!requestingMember || (requestingMember.role !== 'owner' && requestingMember.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Only admins can add members' });
    }

    const { email, userId } = req.body;
    let userToAdd;

    if (userId) {
      userToAdd = await User.findById(userId);
    } else if (email) {
      userToAdd = await User.findOne({ email });
    }

    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const alreadyMember = trip.members.some(
      (m) => m.user && m.user._id.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this trip' });
    }

    trip.members.push({ user: userToAdd._id, role: 'member' });
    await trip.save();

    await createNotification({
      userId: userToAdd._id,
      type: 'trip_joined',
      message: `You were added to the trip "${trip.name}" by ${req.user.name}`,
      relatedTrip: trip._id,
    });

    const updated = await loadTrip(trip._id);
    res.json({ success: true, message: 'Member added successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Join trip via link
// @route   POST /api/trips/:tripId/join
// @access  Private
const joinTrip = async (req, res, next) => {
  try {
    const trip = await loadTrip(req.params.tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const alreadyMember = trip.members.some(
      (m) => m.user && m.user._id.toString() === req.user._id.toString()
    );
    if (alreadyMember) {
      return res.json({ success: true, message: 'You are already a member of this trip', data: trip });
    }

    trip.members.push({ user: req.user._id, role: 'member' });
    await trip.save();

    const updated = await loadTrip(trip._id);
    res.json({ success: true, message: 'Successfully joined trip! 🎉', data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from trip
// @route   DELETE /api/trips/:tripId/members/:userId
// @access  Private (Admin/Owner)
const removeMember = async (req, res, next) => {
  try {
    const trip = await loadTrip(req.params.tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const requestingMember = trip.members.find(
      (m) => m.user && m.user._id.toString() === req.user._id.toString()
    );

    const targetMember = trip.members.find(
      (m) => m.user && m.user._id.toString() === req.params.userId
    );

    if (!targetMember) {
      return res.status(404).json({ success: false, message: 'Member not found in trip' });
    }

    if (targetMember.role === 'owner') {
      return res.status(400).json({ success: false, message: 'Cannot remove the trip owner' });
    }

    const isSelf = req.params.userId === req.user._id.toString();
    if (!isSelf && (!requestingMember || (requestingMember.role !== 'owner' && requestingMember.role !== 'admin'))) {
      return res.status(403).json({ success: false, message: 'Only admins can remove members' });
    }

    trip.members = trip.members.filter(
      (m) => m.user && m.user._id.toString() !== req.params.userId
    );
    await trip.save();

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update member role
// @route   PUT /api/trips/:tripId/members/:userId/role
// @access  Private (Owner only)
const updateMemberRole = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const requestingMember = trip.members.find(
      (m) => m.user && m.user.toString() === req.user._id.toString()
    );
    if (!requestingMember || requestingMember.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only the trip owner can change roles' });
    }

    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const memberToUpdate = trip.members.find(
      (m) => m.user && m.user.toString() === req.params.userId
    );
    if (!memberToUpdate) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    memberToUpdate.role = role;
    await trip.save();

    res.json({ success: true, message: 'Member role updated' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrip,
  getTrips,
  getTrip,
  updateTrip,
  deleteTrip,
  archiveTrip,
  addMember,
  joinTrip,
  removeMember,
  updateMemberRole,
};
