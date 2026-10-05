const express = require('express');
const router = express.Router();
const { updateSettlement } = require('../controllers/balanceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.put('/:settlementId', updateSettlement);

module.exports = router;
