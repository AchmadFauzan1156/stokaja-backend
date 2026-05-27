const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const {
    lihatSemuaUser,
    ubahRoleUser,
    hapusUser
} = require('../controllers/adminController');

// Semua endpoint hanya untuk admin
router.use(auth, authorizeRoles('admin'));

router.get('/users', lihatSemuaUser);
router.patch('/users/:id/role', ubahRoleUser);
router.delete('/users/:id', hapusUser);

module.exports = router;
