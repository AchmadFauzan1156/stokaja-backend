const User = require('../models/User');

const lihatProfil = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const profil = await User.findById(userId).select('-password');
        
        if (!profil) return res.status(404).json({ pesan: 'Profil tidak ditemukan' });

        res.status(200).json(profil);
    } catch (error) {
        next(error); // Lempar error ke pelindung Global Error Handler kita
    }
};

const updateProfil = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // --- SECURITY PATCH: FILTER INPUT ---
        const { namaLengkap, noHP, alamatLengkap } = req.body;

        const profilDiperbarui = await User.findByIdAndUpdate(
            userId,
            { namaLengkap, noHP, alamatLengkap },
            { returnDocument: 'after', runValidators: true }
        ).select('-password');

        if (!profilDiperbarui) return res.status(404).json({ pesan: 'Profil tidak ditemukan' });

        res.status(200).json({
            pesan: 'Profil berhasil diperbarui!',
            data: profilDiperbarui
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { lihatProfil, updateProfil };