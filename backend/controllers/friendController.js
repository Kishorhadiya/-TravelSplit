const Friend = require('../models/Friend');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

// @desc    Get friends list
// @route   GET /api/friends
// @access  Private
const getFriends = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const friendships = await Friend.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { receiver: userId, status: 'accepted' },
      ],
    })
      .populate('requester', 'name email profileImage')
      .populate('receiver', 'name email profileImage');

    const friends = friendships.map((f) => {
      const friend = f.requester._id.toString() === userId.toString() ? f.receiver : f.requester;
      return { ...friend.toObject(), friendshipId: f._id };
    });

    res.json({ success: true, data: friends });
  } catch (error) {
    next(error);
  }
};

// @desc    Get friend requests
// @route   GET /api/friends/requests
// @access  Private
const getFriendRequests = async (req, res, next) => {
  try {
    const requests = await Friend.find({
      receiver: req.user._id,
      status: 'pending',
    }).populate('requester', 'name email profileImage');

    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

// @desc    Send friend request
// @route   POST /api/friends/request
// @access  Private
const sendFriendRequest = async (req, res, next) => {
  try {
    const { email, userId } = req.body;
    let targetUser;

    if (userId) {
      targetUser = await User.findById(userId);
    } else if (email) {
      targetUser = await User.findOne({ email });
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot send friend request to yourself' });
    }

    // Check existing relationship
    const existing = await Friend.findOne({
      $or: [
        { requester: req.user._id, receiver: targetUser._id },
        { requester: targetUser._id, receiver: req.user._id },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ success: false, message: 'Already friends' });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ success: false, message: 'Friend request already sent' });
      }
    }

    const request = await Friend.create({
      requester: req.user._id,
      receiver: targetUser._id,
      status: 'pending',
    });

    await createNotification({
      userId: targetUser._id,
      type: 'friend_request',
      message: `${req.user.name} sent you a friend request`,
      relatedUser: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Friend request sent', data: request });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to friend request (accept/reject)
// @route   PUT /api/friends/:requestId
// @access  Private
const respondToRequest = async (req, res, next) => {
  try {
    const request = await Friend.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    if (request.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be accepted or rejected' });
    }

    request.status = status;
    await request.save();

    if (status === 'accepted') {
      await createNotification({
        userId: request.requester,
        type: 'friend_accepted',
        message: `${req.user.name} accepted your friend request`,
        relatedUser: req.user._id,
      });
    }

    res.json({ success: true, message: `Friend request ${status}` });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove friend
// @route   DELETE /api/friends/:friendId
// @access  Private
const removeFriend = async (req, res, next) => {
  try {
    const friendship = await Friend.findOneAndDelete({
      $or: [
        { requester: req.user._id, receiver: req.params.friendId },
        { requester: req.params.friendId, receiver: req.user._id },
      ],
      status: 'accepted',
    });

    if (!friendship) {
      return res.status(404).json({ success: false, message: 'Friend not found' });
    }

    res.json({ success: true, message: 'Friend removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users
// @route   GET /api/friends/search
// @access  Private
const searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    })
      .select('name email profileImage')
      .limit(10);

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFriends, getFriendRequests, sendFriendRequest, respondToRequest, removeFriend, searchUsers };
