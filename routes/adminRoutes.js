const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const {
    lihatSemuaUser,
    ubahRoleUser,
    hapusUser
} = require('../controllers/adminController');

// Terapkan middleware langsung ke masing-masing endpoint agar tidak bocor (leak) ke router lain
router.get('/users', auth, authorizeRoles('admin'), lihatSemuaUser);
router.patch('/users/:id/role', auth, authorizeRoles('admin'), ubahRoleUser);
router.delete('/users/:id', auth, authorizeRoles('admin'), hapusUser);

module.exports = router;
