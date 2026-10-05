const mongoose = require('mongoose');

const splitDetailSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  percentage: { type: Number, min: 0, max: 100 },
  shares: { type: Number, min: 0 },
  isPaid: { type: Boolean, default: false },
});

const expenseSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Food',
        'Hotel',
        'Transport',
        'Fuel',
        'Tickets',
        'Shopping',
        'Drinks',
        'Entertainment',
        'Medical',
        'Other',
      ],
      default: 'Other',
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Paid by is required'],
    },
    splitType: {
      type: String,
      required: [true, 'Split type is required'],
      enum: ['equal', 'exact', 'percentage', 'shares', 'unequal'],
      default: 'equal',
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    splitDetails: [splitDetailSchema],
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    receipt: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      required: [true, 'Expense date is required'],
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
expenseSchema.index({ tripId: 1, date: -1 });
expenseSchema.index({ tripId: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
