const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

const tambahProduk = async (req, res, next) => {
    try {
        const namaFileGambar = req.file ? req.file.filename : null;
        
        const produkData = {
            ...req.body,
            gambar: namaFileGambar
        };
        
        const produk = new Product(produkData);
        await produk.save();
        
        res.status(201).json({
            message: 'Produk berhasil ditambahkan',
            data: produk
        });
    } catch (error) {
        next(error);
    }
};

const lihatProduk = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const semuaProduk = await Product.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalData = await Product.countDocuments();

        res.status(200).json({
            total: totalData,
            page,
            limit,
            totalPages: Math.ceil(totalData / limit),
            data: semuaProduk
        });
    } catch (error) {
        next(error);
    }
};

const editProduk = async (req, res, next) => {
    try {
        const produkId = req.params.id;
        const produkLama = await Product.findById(produkId);

        if (!produkLama) {
            return res.status(404).json({ pesan: 'Produk tidak ditemukan!' });
        }

        let dataBaru = { ...req.body };

        if (req.file) {
            if (produkLama.gambar) {
                const oldPath = path.join(__dirname, '..', 'uploads', produkLama.gambar);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            dataBaru.gambar = req.file.filename;
        }

        const produkDiperbarui = await Product.findByIdAndUpdate(
            produkId,
            dataBaru,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            pesan: 'Produk berhasil diperbarui!',
            data: produkDiperbarui
        });
    } catch (error) {
        next(error);
    }
};

const hapusProduk = async (req, res, next) => {
    try {
        const produkId = req.params.id;
        const produk = await Product.findById(produkId);

        if (!produk) {
            return res.status(404).json({ pesan: 'Produk tidak ditemukan!' });
        }

        if (produk.gambar) {
            const imagePath = path.join(__dirname, '..', 'uploads', produk.gambar);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Product.findByIdAndDelete(produkId);
        res.status(200).json({ pesan: 'Produk dan file gambar berhasil dihapus!' });
    } catch (error) {
        next(error);
    }
};

module.exports = { tambahProduk, lihatProduk, editProduk, hapusProduk };