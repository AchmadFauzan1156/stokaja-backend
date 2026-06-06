const Product = require('../models/Product');
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

const tambahProduk = async (req, res, next) => {
    try {
        const urlGambar = req.file ? req.file.path : null;
        
        const produkData = {
            ...req.body,
            kategori: req.body.kategoriId || req.body.kategori,
            gambar: urlGambar
        };
        delete produkData.kategoriId;
        
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
        // SECURITY PATCH: Cegah Memory Overload, limit maksimal 100
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const skip = (page - 1) * limit;

        // Filter berdasarkan search dan kategori
        let filter = {};
        const search = req.query.search;
        if (search) {
            if (typeof search !== 'string') {
                return res.status(400).json({ pesan: 'Format pencarian tidak valid.' });
            }
            if (search.length > 100) {
                return res.status(400).json({ pesan: 'Kata kunci pencarian terlalu panjang (maksimal 100 karakter).' });
            }
            const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const safeSearch = escapeRegex(search);
            filter.nama = { $regex: safeSearch, $options: 'i' };
        }
        if (req.query.kategori) {
            filter.kategori = req.query.kategori;
        }

        const semuaProduk = await Product.find(filter)
            .populate('kategori', 'nama')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalData = await Product.countDocuments(filter);

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

// DETAIL 1 PRODUK BY ID
const lihatDetailProduk = async (req, res, next) => {
    try {
        const produk = await Product.findById(req.params.id).populate('kategori', 'nama');
        
        if (!produk) {
            return res.status(404).json({ pesan: 'Produk tidak ditemukan!' });
        }

        res.status(200).json({
            pesan: 'Detail produk berhasil dimuat',
            data: produk
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
        if (dataBaru.kategoriId) {
            dataBaru.kategori = dataBaru.kategoriId;
            delete dataBaru.kategoriId;
        }

        if (req.file) {
            if (produkLama.gambar) {
                const publicId = getPublicId(produkLama.gambar);
                if (publicId) {
                    try {
                        await cloudinary.uploader.destroy(publicId);
                    } catch (err) {
                        console.error('Gagal menghapus gambar lama produk:', err.message);
                    }
                }
            }
            dataBaru.gambar = req.file.path;
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
            const publicId = getPublicId(produk.gambar);
            if (publicId) {
                await cloudinary.uploader.destroy(publicId);
            }
        }

        await Product.findByIdAndDelete(produkId);
        res.status(200).json({ pesan: 'Produk dan file gambar berhasil dihapus!' });
    } catch (error) {
        next(error);
    }
};

module.exports = { tambahProduk, lihatProduk, lihatDetailProduk, editProduk, hapusProduk };