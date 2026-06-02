const User = require('../models/User');

// Lihat semua user (tanpa password & refreshToken)
const lihatSemuaUser = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const { role, search } = req.query;
        let query = {};

        if (role) query.role = role;
        if (search) {
            const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const safeSearch = escapeRegex(search);
            query.$or = [
                { namaLengkap: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password -refreshToken')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalData = await User.countDocuments(query);

        res.status(200).json({
            pesan: 'Berhasil memuat daftar user',
            total: totalData,
            page,
            limit,
            totalPages: Math.ceil(totalData / limit),
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// Update role user (admin mengangkat kasir, dll.)
const ubahRoleUser = async (req, res, next) => {
    try {
        const { role } = req.body;
        const targetId = req.params.id;

        // Cegah admin mengubah role dirinya sendiri
        if (targetId === req.user.id) {
            return res.status(400).json({ pesan: 'Tidak bisa mengubah role akun sendiri' });
        }

        const user = await User.findByIdAndUpdate(
            targetId,
            { role },
            { new: true, runValidators: true }
        ).select('-password -refreshToken');

        if (!user) return res.status(404).json({ pesan: 'User tidak ditemukan' });

        res.status(200).json({
            pesan: `Role user berhasil diubah menjadi ${role}`,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// Hapus user
const hapusUser = async (req, res, next) => {
    try {
        const targetId = req.params.id;

        // Cegah admin menghapus dirinya sendiri
        if (targetId === req.user.id) {
            return res.status(400).json({ pesan: 'Tidak bisa menghapus akun sendiri' });
        }

        const user = await User.findByIdAndDelete(targetId);
        if (!user) return res.status(404).json({ pesan: 'User tidak ditemukan' });

        res.status(200).json({ pesan: 'User berhasil dihapus' });
    } catch (error) {
        next(error);
    }
};

module.exports = { lihatSemuaUser, ubahRoleUser, hapusUser };
