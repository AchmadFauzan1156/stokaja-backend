const Product = require('../models/Product');
const RawMaterial = require('../models/RawMaterial');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// GET /api/v1/dashboard/stats — Ringkasan data untuk halaman admin dashboard
const getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Jalankan semua query secara paralel agar cepat
        const [
            totalProduk,
            totalBahanBaku,
            totalUser,
            transaksiHariIni,
            produkStokMenipis,
            bahanBakuStokMenipis
        ] = await Promise.all([
            Product.countDocuments(),
            RawMaterial.countDocuments(),
            User.countDocuments(),
            Transaction.aggregate([
                { $match: { createdAt: { $gte: today, $lt: tomorrow }, statusPesanan: 'selesai' } },
                { $group: { _id: null, count: { $sum: 1 }, totalPendapatan: { $sum: "$totalHarga" }, totalKeuntungan: { $sum: "$marginKeuntungan" } } }
            ]),
            Product.find({ $expr: { $lte: ['$stok', '$stokMinimum'] } }).select('nama stok stokMinimum satuan'),
            RawMaterial.find({ $expr: { $lte: ['$stok', '$stokMinimum'] } }).select('namaBahan stok stokMinimum satuan')
        ]);

        // Ekstrak hasil agregasi
        const statsTransaksi = transaksiHariIni[0] || { count: 0, totalPendapatan: 0, totalKeuntungan: 0 };
        const jumlahTransaksiHariIni = statsTransaksi.count;
        const pendapatanHariIni = statsTransaksi.totalPendapatan;
        const keuntunganHariIni = statsTransaksi.totalKeuntungan;

        res.status(200).json({
            pesan: 'Dashboard stats berhasil dimuat',
            data: {
                totalProduk,
                totalBahanBaku,
                totalUser,
                jumlahTransaksiHariIni,
                pendapatanHariIni,
                keuntunganHariIni,
                produkStokMenipis,
                bahanBakuStokMenipis
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats };
