const express = require('express');
const router = express.Router();
const { getFriends, getFriendRequests, sendFriendRequest, respondToRequest, removeFriend, searchUsers } = require('../controllers/friendController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getFriends);
router.get('/requests', getFriendRequests);
router.get('/search', searchUsers);
router.post('/request', sendFriendRequest);
router.put('/:requestId', respondToRequest);
router.delete('/:friendId', removeFriend);

module.exports = router;
