const RawMaterial = require('../models/RawMaterial');

// Create: Tambah bahan baku baru
const tambahBahanBaku = async (req, res, next) => {
    try {
        const bahanBaru = new RawMaterial(req.body);
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

// Update: Edit bahan atau tambah stok (Restock)
const updateBahanBaku = async (req, res, next) => {
    try {
        const bahanDiperbarui = await RawMaterial.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        if (!bahanDiperbarui) return res.status(404).json({ pesan: 'Bahan baku tidak ditemukan' });
        
        // Peringatan stok bisa ditambahkan ke Socket.io di sini jika perlu
        
        res.status(200).json({ pesan: 'Bahan baku berhasil diupdate', data: bahanDiperbarui });
    } catch (error) {
        next(error);
    }
};

// Delete: Hapus bahan baku dari database
const hapusBahanBaku = async (req, res, next) => {
    try {
        const bahanDihapus = await RawMaterial.findByIdAndDelete(req.params.id);
        if (!bahanDihapus) return res.status(404).json({ pesan: 'Bahan baku tidak ditemukan' });
        res.status(200).json({ pesan: 'Bahan baku berhasil dihapus' });
    } catch (error) {
        next(error);
    }
};

module.exports = { tambahBahanBaku, lihatBahanBaku, updateBahanBaku, hapusBahanBaku };