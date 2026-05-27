const PaymentMethod = require('../models/PaymentMethod');

const tambahMetode = async (req, res, next) => {
    try {
        const metode = new PaymentMethod(req.body);
        await metode.save();
        res.status(201).json({ pesan: 'Metode pembayaran berhasil ditambahkan', data: metode });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ pesan: 'Metode pembayaran sudah ada' });
        }
        next(error);
    }
};

const lihatMetode = async (req, res, next) => {
    try {
        const metode = await PaymentMethod.find().sort({ nama: 1 });
        res.status(200).json({ data: metode });
    } catch (error) {
        next(error);
    }
};

const updateMetode = async (req, res, next) => {
    try {
        const metode = await PaymentMethod.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!metode) return res.status(404).json({ pesan: 'Metode pembayaran tidak ditemukan' });
        res.status(200).json({ pesan: 'Metode pembayaran berhasil diperbarui', data: metode });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ pesan: 'Nama metode pembayaran sudah ada' });
        }
        next(error);
    }
};

const hapusMetode = async (req, res, next) => {
    try {
        const metode = await PaymentMethod.findByIdAndDelete(req.params.id);
        if (!metode) return res.status(404).json({ pesan: 'Metode pembayaran tidak ditemukan' });
        res.status(200).json({ pesan: 'Metode pembayaran berhasil dihapus' });
    } catch (error) {
        next(error);
    }
};

module.exports = { tambahMetode, lihatMetode, updateMetode, hapusMetode };
