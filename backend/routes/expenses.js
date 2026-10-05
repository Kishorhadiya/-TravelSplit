const express = require('express');
const router = express.Router();
const { getExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/:expenseId')
  .get(getExpense)
  .put(upload.single('receipt'), updateExpense)
  .delete(deleteExpense);

module.exports = router;
