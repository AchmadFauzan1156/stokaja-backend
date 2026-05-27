const User = require('../models/User');
const fs = require('fs');
const path = require('path');

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
        const userLama = await User.findById(userId);
        
        // --- SECURITY PATCH: FILTER INPUT ---
        let updateData = {
            namaLengkap: req.body.namaLengkap,
            noHP: req.body.noHP,
            alamatLengkap: req.body.alamatLengkap
        };

        if (req.file) {
            if (userLama.avatar) {
                const oldPath = path.join(__dirname, '..', 'uploads', userLama.avatar);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            updateData.avatar = req.file.filename;
        }

        const profilDiperbarui = await User.findByIdAndUpdate(
            userId,
            updateData,
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