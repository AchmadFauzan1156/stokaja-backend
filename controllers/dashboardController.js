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
            Transaction.find({ createdAt: { $gte: today, $lt: tomorrow } }),
            Product.find({ $expr: { $lte: ['$stok', '$stokMinimum'] } }).select('nama stok stokMinimum satuan'),
            RawMaterial.find({ $expr: { $lte: ['$stok', '$stokMinimum'] } }).select('namaBahan stok stokMinimum satuan')
        ]);

        // Hitung total pendapatan & keuntungan hari ini
        let pendapatanHariIni = 0;
        let keuntunganHariIni = 0;
        transaksiHariIni.forEach(t => {
            pendapatanHariIni += t.totalHarga;
            keuntunganHariIni += (t.marginKeuntungan || 0);
        });

        res.status(200).json({
            pesan: 'Dashboard stats berhasil dimuat',
            data: {
                totalProduk,
                totalBahanBaku,
                totalUser,
                jumlahTransaksiHariIni: transaksiHariIni.length,
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
