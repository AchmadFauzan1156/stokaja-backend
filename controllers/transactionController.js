const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const buatNomorResi = require('../utils/generateResi');

const checkoutKasir = async (req, res, next) => {
    try {
        const { isiKeranjang, lokasiPengiriman, persentasePajak = 0 } = req.body;
        
        let totalHargaBarang = 0;
        let totalModalBarang = 0; // TAMBAHAN: Untuk menghitung modal
        let keranjangValid = [];

        for (let item of isiKeranjang) {
            const produk = await Product.findById(item.produkId);
            
            if (!produk) {
                return res.status(404).json({ pesan: `Produk dengan ID ${item.produkId} tidak ditemukan!` });
            }
            if (produk.stok < item.jumlahBeli) {
                return res.status(400).json({ pesan: `Maaf, stok ${produk.nama} tidak mencukupi!` });
            }

            totalHargaBarang += (produk.harga * item.jumlahBeli);
            // TAMBAHAN: Hitung total modal dari supplier
            totalModalBarang += ((produk.hargaModal || 0) * item.jumlahBeli);

            keranjangValid.push({
                produkId: produk._id,
                jumlahBeli: item.jumlahBeli,
                hargaSatuan: produk.harga
            });
        }

        const nominalPajak = totalHargaBarang * (persentasePajak / 100);
        const totalBayarLengkap = totalHargaBarang + nominalPajak;
        
        // TAMBAHAN: Hitung laba bersih transaksi ini
        const labaBersih = totalHargaBarang - totalModalBarang;

        for (let item of keranjangValid) {
            const produk = await Product.findById(item.produkId);
            produk.stok -= item.jumlahBeli;
            await produk.save();

            // --- TAMBAHAN: FITUR REAL-TIME ALERT SOCKET.IO ---
            if (produk.stok <= (produk.stokMinimum || 5)) {
                const io = req.app.get('io'); // Memanggil Socket.io dari server.js
                if (io) {
                    io.emit('alertAdmin', {
                        tipe: 'STOK_MENIPIS',
                        pesan: `⚠️ Peringatan Darurat: Stok ${produk.nama} hampir habis (Sisa: ${produk.stok} pcs)!`
                    });
                }
            }
            // -------------------------------------------------
        }

        const transaksiBaru = new Transaction({
            nomorResi: buatNomorResi(),
            pelangganId: req.user.role === 'pelanggan' ? req.user.id : null,
            keranjang: keranjangValid,
            pajak: nominalPajak,
            totalHarga: totalBayarLengkap,
            marginKeuntungan: labaBersih, // TAMBAHAN: Simpan laba ke database
            lokasiPengiriman: lokasiPengiriman || null
        });
        await transaksiBaru.save();

        res.status(201).json({
            pesan: 'Checkout berhasil!',
            rincianBiaya: {
                totalBarang: totalHargaBarang,
                pajakDikenakan: nominalPajak,
                totalBayar: totalBayarLengkap,
                keuntunganBersih: labaBersih // Info tambahan untuk front-end (opsional disembunyikan nanti)
            },
            struk: transaksiBaru
        });

    } catch (error) {
        next(error);
    }
};

const lihatPesananSaya = async (req, res, next) => {
    try {
        const riwayatPesanan = await Transaction.find({ pelangganId: req.user.id })
            .populate('keranjang.produkId', 'nama gambar')
            .sort({ createdAt: -1 });

        res.status(200).json({
            pesan: 'Berhasil memuat riwayat pesanan Anda',
            data: riwayatPesanan
        });
    } catch (error) {
        next(error);
    }
};

const laporanKeuntungan = async (req, res, next) => {
    try {
        const semuaTransaksi = await Transaction.find();
        if (semuaTransaksi.length === 0) {
            return res.status(200).json({ pesan: 'Belum ada transaksi', totalPendapatan: 0, totalKeuntunganBersih: 0 });
        }

        let totalPendapatan = 0;
        let totalKeuntunganBersih = 0; // TAMBAHAN: Untuk laporan Admin

        semuaTransaksi.forEach(t => {
            totalPendapatan += t.totalHarga;
            totalKeuntunganBersih += (t.marginKeuntungan || 0);
        });

        res.status(200).json({
            pesan: 'Laporan berhasil dibuat',
            jumlahTransaksi: semuaTransaksi.length,
            totalPendapatan: totalPendapatan,
            totalKeuntunganBersih: totalKeuntunganBersih,
            rincian: semuaTransaksi
        });

    } catch (error) {
        next(error);
    }
};

const ubahStatusPesanan = async (req, res, next) => {
    try {
        const transaksiId = req.params.id;
        const { statusBaru } = req.body;
        
        const transaksiDiperbarui = await Transaction.findByIdAndUpdate(
            transaksiId,
            { statusPesanan: statusBaru },
            { returnDocument: 'after', runValidators: true }
        );

        if (!transaksiDiperbarui) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }
        
        res.status(200).json({
            message: `Status pesanan berhasil diupdate menjadi ${statusBaru}`,
            transaksi: transaksiDiperbarui,
        });
    } catch (error) {
        next(error);
    }
};

const lihatDaftarTransaksi = async (req, res, next) => {
    try {
        const { status } = req.query;
        let aturanSaringan = {};
        
        if (status) {
            aturanSaringan.statusPesanan = status;
        }
        
        const daftarTransaksi = await Transaction.find(aturanSaringan).sort({ createdAt: -1 });
        res.status(200).json(daftarTransaksi);
    } catch (error) {
        next(error);
    }
};

const lihatDaftarPesanan = async (req, res, next) => {
    try {
        const { status } = req.query;
        let aturanPencarian = {};
        
        if (status) {
            aturanPencarian.statusPesanan = status;
        }

        const daftarPesanan = await Transaction.find(aturanPencarian)
            .populate('keranjang.produkId', 'nama harga') 
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            pesan: 'Berhasil memuat daftar pesanan',
            jumlahData: daftarPesanan.length,
            data: daftarPesanan
        });
    } catch (error) {
        next(error);
    }
};

const grafikPendapatan = async (req, res, next) => {
    try {
        const dataGrafik = await Transaction.aggregate([
            {
                $match: { statusPesanan: 'selesai' }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                    totalPendapatan: { $sum: "$totalHarga" },
                    totalKeuntungan: { $sum: "$marginKeuntungan" },
                    jumlahTransaksi: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.status(200).json({
            pesan: 'Data grafik berhasil direkap',
            data: dataGrafik
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    checkoutKasir,
    lihatPesananSaya,
    laporanKeuntungan,
    ubahStatusPesanan,
    lihatDaftarTransaksi,
    grafikPendapatan,
    lihatDaftarPesanan
};