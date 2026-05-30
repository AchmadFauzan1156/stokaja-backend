const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { getChatHistory, getChatContacts, markAsRead, markAllAsRead } = require('../controllers/chatController');

// Riwayat chat (semua role yang login)
router.get('/chat/history', auth, getChatHistory);

// Daftar kontak chat (admin/kasir only)
router.get('/chat/contacts', auth, authorizeRoles('admin', 'kasir'), getChatContacts);

// Tandai 1 pesan dibaca
router.patch('/chat/:id/read', auth, markAsRead);

// Tandai semua pesan dari 1 pelanggan dibaca (admin bulk read)
router.patch('/chat/pelanggan/:pelangganId/read-all', auth, authorizeRoles('admin', 'kasir'), markAllAsRead);

module.exports = router;
