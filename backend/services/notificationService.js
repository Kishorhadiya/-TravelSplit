const Notification = require('../models/Notification');

/**
 * Create a notification for a user
 */
const createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

/**
 * Notify all trip members except the actor
 */
const notifyTripMembers = async (trip, actorId, type, message, extras = {}) => {
  const notifications = trip.members
    .filter((m) => m.user.toString() !== actorId.toString())
    .map((m) => ({
      userId: m.user,
      type,
      message,
      relatedTrip: trip._id,
      ...extras,
    }));

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }
};

module.exports = { createNotification, notifyTripMembers };
