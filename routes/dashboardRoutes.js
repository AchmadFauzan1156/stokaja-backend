const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { getDashboardStats } = require('../controllers/dashboardController');

// Hanya admin yang boleh akses dashboard
router.get('/dashboard/stats', auth, authorizeRoles('admin'), getDashboardStats);

module.exports = router;
