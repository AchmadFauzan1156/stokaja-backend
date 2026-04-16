const User = require('../models/User');

const lihatProfil = async (req, res) => {
    try {
        const userId = req.user.id;

        const profil = await User.findById(userId).select('-password');
        
        if (!profil) return res.status(404).json({ pesan: 'Profil tidak ditemukan' });

        res.status(200).json(profil);
    } catch (error) {
        res.status(500).json({ pesan: 'Gagal mengambil profil', error: error.message });
    }
};

const updateProfil = async (req, res) => {
    try {
        const userId = req.user.id;
        const dataBaru = req.body;

        const profilDiperbarui = await User.findByIdAndUpdate(
            userId,
            dataBaru,
            { returnDocument: 'after', runValidators: true }
        ).select('-password');

        res.status(200).json({
            pesan: 'Profil berhasil diperbarui!',
            data: profilDiperbarui
        });
    } catch (error) {
        res.status(500).json({ pesan: 'Gagal memperbarui profil', error: error.message });
    }
};

module.exports = { lihatProfil, updateProfil };