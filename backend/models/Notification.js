const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'expense_added',
        'expense_edited',
        'expense_deleted',
        'settlement_made',
        'trip_joined',
        'trip_updated',
        'budget_warning',
        'budget_exceeded',
        'friend_request',
        'friend_accepted',
        'invitation_received',
        'member_removed',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedTrip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
    },
    relatedExpense: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense',
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
