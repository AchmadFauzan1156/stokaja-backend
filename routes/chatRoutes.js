const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getChatHistory } = require('../controllers/chatController');

router.get('/chat/history', auth, getChatHistory);

module.exports = router;
