const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check Authorization header first
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Then check cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

/**
 * Check if user is a member of the trip
 */
const tripMember = (req, res, next) => {
  const trip = req.trip;
  if (!trip) {
    return res.status(404).json({ success: false, message: 'Trip not found' });
  }

  const isMember = trip.members.some(
    (m) => m.user.toString() === req.user._id.toString()
  );

  if (!isMember) {
    return res
      .status(403)
      .json({ success: false, message: 'You are not a member of this trip' });
  }

  next();
};

/**
 * Check if user is trip owner or admin
 */
const tripAdmin = (req, res, next) => {
  const trip = req.trip;
  if (!trip) {
    return res.status(404).json({ success: false, message: 'Trip not found' });
  }

  const member = trip.members.find(
    (m) => m.user.toString() === req.user._id.toString()
  );

  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    return res
      .status(403)
      .json({ success: false, message: 'Only trip admins can perform this action' });
  }

  next();
};

module.exports = { protect, tripMember, tripAdmin };
