const RawMaterial = require('../models/RawMaterial');
const cloudinary = require('../config/cloudinary');

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

// Create: Tambah bahan baku baru (dengan upload gambar)
const tambahBahanBaku = async (req, res, next) => {
    try {
        const { namaBahan, stok, satuan, hargaModal, hargaJual, stokMinimum } = req.body;
        const data = { namaBahan, stok, satuan, hargaModal, hargaJual, stokMinimum };
        if (req.file) {
            data.gambar = req.file.path;
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
        res.status(200).json({ data: bahanBaku });
    } catch (error) {
        next(error);
    }
};

// Update: Edit bahan atau tambah stok (Restock) — dengan upload gambar
const updateBahanBaku = async (req, res, next) => {
    try {
        const { namaBahan, stok, satuan, hargaModal, hargaJual, stokMinimum } = req.body;
        const data = { namaBahan, stok, satuan, hargaModal, hargaJual, stokMinimum };

        // Jika ada gambar baru, hapus gambar lama
        if (req.file) {
            const bahanLama = await RawMaterial.findById(req.params.id);
            if (bahanLama && bahanLama.gambar) {
                const publicId = getPublicId(bahanLama.gambar);
                if (publicId) {
                    try {
                        await cloudinary.uploader.destroy(publicId);
                    } catch (err) {
                        console.error('Failed to delete old image from Cloudinary:', err.message);
                    }
                }
            }
            data.gambar = req.file.path;
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
            const publicId = getPublicId(bahanDihapus.gambar);
            if (publicId) {
                await cloudinary.uploader.destroy(publicId);
            }
        }

        res.status(200).json({ pesan: 'Bahan baku berhasil dihapus' });
    } catch (error) {
        next(error);
    }
};

module.exports = { tambahBahanBaku, lihatBahanBaku, updateBahanBaku, hapusBahanBaku };