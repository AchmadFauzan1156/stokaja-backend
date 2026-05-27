const RawMaterial = require('../models/RawMaterial');
const fs = require('fs');
const path = require('path');

// Create: Tambah bahan baku baru (dengan upload gambar)
const tambahBahanBaku = async (req, res, next) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.gambar = req.file.filename;
        }
        const bahanBaru = new RawMaterial(data);
        await bahanBaru.save();
        res.status(201).json({ pesan: 'Bahan baku berhasil ditambahkan', data: bahanBaru });
    } catch (error) {
        next(error);
    }
};

// Read: Lihat semua bahan baku
const lihatBahanBaku = async (req, res, next) => {
    try {
        const bahanBaku = await RawMaterial.find().sort({ namaBahan: 1 });
        res.status(200).json(bahanBaku);
    } catch (error) {
        next(error);
    }
};

// Update: Edit bahan atau tambah stok (Restock) — dengan upload gambar
const updateBahanBaku = async (req, res, next) => {
    try {
        const data = { ...req.body };

        // Jika ada gambar baru, hapus gambar lama
        if (req.file) {
            const bahanLama = await RawMaterial.findById(req.params.id);
            if (bahanLama && bahanLama.gambar) {
                const oldPath = path.join(__dirname, '..', 'uploads', bahanLama.gambar);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            data.gambar = req.file.filename;
        }

        const bahanDiperbarui = await RawMaterial.findByIdAndUpdate(
            req.params.id, 
            data, 
            { new: true, runValidators: true }
        );
        if (!bahanDiperbarui) return res.status(404).json({ pesan: 'Bahan baku tidak ditemukan' });
        
        res.status(200).json({ pesan: 'Bahan baku berhasil diupdate', data: bahanDiperbarui });
    } catch (error) {
        next(error);
    }
};

// Delete: Hapus bahan baku dari database + hapus gambar
const hapusBahanBaku = async (req, res, next) => {
    try {
        const bahanDihapus = await RawMaterial.findByIdAndDelete(req.params.id);
        if (!bahanDihapus) return res.status(404).json({ pesan: 'Bahan baku tidak ditemukan' });

        // Hapus file gambar jika ada
        if (bahanDihapus.gambar) {
            const filePath = path.join(__dirname, '..', 'uploads', bahanDihapus.gambar);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.status(200).json({ pesan: 'Bahan baku berhasil dihapus' });
    } catch (error) {
        next(error);
    }
};

module.exports = { tambahBahanBaku, lihatBahanBaku, updateBahanBaku, hapusBahanBaku };