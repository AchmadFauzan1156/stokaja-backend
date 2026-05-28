const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const bcrypt = require('bcrypt');

const getPublicId = (url) => {
    if (!url) return null;
    const folderName = 'stokaja_uploads';
    const parts = url.split(`/${folderName}/`);
    if(parts.length > 1) {
        const filePart = parts[1].split('.')[0];
        return `${folderName}/${filePart}`;
    }
    return null;
};

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

        // Handle password update if requested
        if (req.body.passwordBaru) {
            if (!req.body.passwordLama) {
                return res.status(400).json({ pesan: 'Password lama wajib diisi untuk mengganti password baru!' });
            }
            const isMatch = await bcrypt.compare(req.body.passwordLama, userLama.password);
            if (!isMatch) {
                return res.status(400).json({ pesan: 'Password lama tidak cocok!' });
            }
            const salt = await bcrypt.genSalt(12);
            updateData.password = await bcrypt.hash(req.body.passwordBaru, salt);
        }

        if (req.file) {
            if (userLama.avatar) {
                const publicId = getPublicId(userLama.avatar);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            }
            updateData.avatar = req.file.path;
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