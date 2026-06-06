const Category = require('../models/Category');

// Tambah kategori baru
const tambahKategori = async (req, res, next) => {
    try {
        const { nama, deskripsi, urutan } = req.body;
        const kategori = new Category({ nama, deskripsi, urutan });
        await kategori.save();
        res.status(201).json({ pesan: 'Kategori berhasil ditambahkan', data: kategori });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ pesan: 'Nama kategori sudah ada' });
        }
        next(error);
    }
};

// Lihat semua kategori
const lihatKategori = async (req, res, next) => {
    try {
        const kategori = await Category.find().sort({ urutan: 1, nama: 1 });
        res.status(200).json({ data: kategori });
    } catch (error) {
        next(error);
    }
};

// Update kategori
const updateKategori = async (req, res, next) => {
    try {
        const { nama, deskripsi, urutan } = req.body;
        const kategori = await Category.findByIdAndUpdate(
            req.params.id,
            { nama, deskripsi, urutan },
            { new: true, runValidators: true }
        );
        if (!kategori) return res.status(404).json({ pesan: 'Kategori tidak ditemukan' });
        res.status(200).json({ pesan: 'Kategori berhasil diperbarui', data: kategori });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ pesan: 'Nama kategori sudah ada' });
        }
        next(error);
    }
};

// Hapus kategori
const hapusKategori = async (req, res, next) => {
    try {
        const kategori = await Category.findByIdAndDelete(req.params.id);
        if (!kategori) return res.status(404).json({ pesan: 'Kategori tidak ditemukan' });
        res.status(200).json({ pesan: 'Kategori berhasil dihapus' });
    } catch (error) {
        next(error);
    }
};

module.exports = { tambahKategori, lihatKategori, updateKategori, hapusKategori };
