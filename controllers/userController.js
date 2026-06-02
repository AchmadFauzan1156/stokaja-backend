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

        const profil = await User.findById(userId).select('-password -refreshToken');
        
        if (!profil) return res.status(404).json({ pesan: 'Profil tidak ditemukan' });

        res.status(200).json({ pesan: 'Berhasil memuat profil', data: profil });
    } catch (error) {
        next(error); // Lempar error ke pelindung Global Error Handler kita
    }
};

const updateProfil = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userLama = await User.findById(userId);
        
        // --- SECURITY PATCH: FILTER INPUT ---
        let updateData = {};

        // Update nama jika dikirim
        if (req.body.namaLengkap !== undefined) {
            updateData.namaLengkap = req.body.namaLengkap;
        }

        // Update noHP jika dikirim
        if (req.body.noHP !== undefined) {
            updateData.noHP = req.body.noHP;
        }

        // Update email jika dikirim (dengan validasi duplikasi)
        if (req.body.email !== undefined && req.body.email !== userLama.email) {
            const emailExist = await User.findOne({ email: req.body.email });
            if (emailExist) {
                return res.status(409).json({ pesan: 'Email sudah digunakan oleh akun lain!' });
            }
            updateData.email = req.body.email;
        }

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
        ).select('-password -refreshToken');

        if (!profilDiperbarui) return res.status(404).json({ pesan: 'Profil tidak ditemukan' });

        res.status(200).json({
            pesan: 'Profil berhasil diperbarui!',
            data: profilDiperbarui
        });
    } catch (error) {
        next(error);
    }
};

// === CRUD ALAMAT ===

// Tambah alamat baru
const tambahAlamat = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { label, alamatDetail, lat, lng } = req.body;

        if (!label || !alamatDetail) {
            return res.status(400).json({ pesan: 'Label dan alamat detail wajib diisi' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ pesan: 'User tidak ditemukan' });

        // SECURITY PATCH: Batasi maksimal 5 alamat untuk mencegah Document Bloat (DDoS level database)
        if (user.alamat.length >= 5) {
            return res.status(400).json({ pesan: 'Batas maksimum alamat tercapai (5 alamat). Hapus alamat lama untuk menambah yang baru.' });
        }

        user.alamat.push({ label, alamatDetail, lat, lng });
        await user.save();

        res.status(201).json({
            pesan: 'Alamat berhasil ditambahkan',
            data: user.alamat
        });
    } catch (error) {
        next(error);
    }
};

// Edit alamat
const editAlamat = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const alamatId = req.params.alamatId;
        const { label, alamatDetail, lat, lng } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ pesan: 'User tidak ditemukan' });

        const alamat = user.alamat.id(alamatId);
        if (!alamat) return res.status(404).json({ pesan: 'Alamat tidak ditemukan' });

        if (label) alamat.label = label;
        if (alamatDetail) alamat.alamatDetail = alamatDetail;
        if (lat !== undefined) alamat.lat = lat;
        if (lng !== undefined) alamat.lng = lng;

        await user.save();

        res.status(200).json({
            pesan: 'Alamat berhasil diperbarui',
            data: user.alamat
        });
    } catch (error) {
        next(error);
    }
};

// Hapus alamat
const hapusAlamat = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const alamatId = req.params.alamatId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ pesan: 'User tidak ditemukan' });

        const alamat = user.alamat.id(alamatId);
        if (!alamat) return res.status(404).json({ pesan: 'Alamat tidak ditemukan' });

        alamat.deleteOne();
        await user.save();

        res.status(200).json({
            pesan: 'Alamat berhasil dihapus',
            data: user.alamat
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { lihatProfil, updateProfil, tambahAlamat, editAlamat, hapusAlamat };