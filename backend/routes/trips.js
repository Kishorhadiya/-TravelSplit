const express = require('express');
const router = express.Router();
const {
  createTrip, getTrips, getTrip, updateTrip, deleteTrip, archiveTrip,
  addMember, joinTrip, removeMember, updateMemberRole,
} = require('../controllers/tripController');
const { createExpense, getExpenses } = require('../controllers/expenseController');
const { getBalances, getSimplifiedBalances, getSettlements, createSettlement } = require('../controllers/balanceController');
const { getTripAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

router.use(protect);

router.route('/').get(getTrips).post(uploadSingle('coverImage'), createTrip);
router.route('/:tripId').get(getTrip).put(uploadSingle('coverImage'), updateTrip).delete(deleteTrip);
router.put('/:tripId/archive', archiveTrip);

// Members & Join
router.post('/:tripId/members', addMember);
router.post('/:tripId/join', joinTrip);
router.delete('/:tripId/members/:userId', removeMember);
router.put('/:tripId/members/:userId/role', updateMemberRole);

// Expenses
router.route('/:tripId/expenses').get(getExpenses).post(uploadSingle('receipt'), createExpense);

// Balances
router.get('/:tripId/balances', getBalances);
router.get('/:tripId/simplified-balances', getSimplifiedBalances);

// Settlements
router.route('/:tripId/settlements').get(getSettlements).post(createSettlement);

// Analytics
router.get('/:tripId/analytics', getTripAnalytics);

module.exports = router;
