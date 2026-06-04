const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const RawMaterial = require('../models/RawMaterial');
const buatNomorResi = require('../utils/generateResi');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const checkoutKasir = async (req, res, next) => {
    // MEMULAI SESI TRANSAKSI DATABASE
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { isiKeranjang, lokasiPengiriman, metodePembayaran = 'tunai', jumlahDibayar = 0 } = req.body;
        const persentasePajak = 0; // SECURITY PATCH: Hardcode 0% untuk mencegah eksploitasi dari frontend
        
        let totalHargaBarang = 0;
        let totalModalBarang = 0;
        let keranjangValid = [];

        // POTONG STOK SECARA ATOMIK (LANGSUNG SAAT LOOPING)
        for (let item of isiKeranjang) {
            const tipe = item.tipe || 'produk'; // Default: produk
            
            if (tipe === 'bahanBaku') {
                // --- BAHAN BAKU ---
                const bahan = await RawMaterial.findOneAndUpdate(
                    {
                        _id: item.produkId,
                        stok: { $gte: item.jumlahBeli }
                    },
                    {
                        $inc: { stok: -item.jumlahBeli }
                    },
                    { returnDocument: 'after', session }
                );

                if (!bahan) {
                    throw new Error(`Gagal: Stok bahan baku ID ${item.produkId} tidak mencukupi atau bahan dihapus.`);
                }

                totalHargaBarang += (bahan.hargaJual * item.jumlahBeli);
                totalModalBarang += ((bahan.hargaModal || 0) * item.jumlahBeli);

                keranjangValid.push({
                    produkId: bahan._id,
                    tipeItem: 'RawMaterial',
                    jumlahBeli: item.jumlahBeli,
                    hargaSatuan: bahan.hargaJual,
                    catatan: item.catatan || ''
                });

                // Trigger Socket.io jika stok menipis
                if (bahan.stok <= (bahan.stokMinimum || 5)) {
                    const io = req.app.get('io');
                    if (io) {
                        io.emit('alertAdmin', {
                            tipe: 'STOK_MENIPIS',
                            pesan: `⚠️ Peringatan: Stok bahan baku ${bahan.namaBahan} sisa ${bahan.stok} ${bahan.satuan}!`
                        });
                    }
                }
            } else {
                // --- PRODUK BIASA ---
                const produk = await Product.findOneAndUpdate(
                    {
                        _id: item.produkId,
                        stok: { $gte: item.jumlahBeli }
                    },
                    {
                        $inc: { stok: -item.jumlahBeli }
                    },
                    { returnDocument: 'after', session }
                );
                
                if (!produk) {
                    throw new Error(`Gagal: Stok produk ID ${item.produkId} tidak mencukupi atau produk dihapus.`);
                }

                totalHargaBarang += (produk.harga * item.jumlahBeli);
                totalModalBarang += ((produk.hargaModal || 0) * item.jumlahBeli);

                keranjangValid.push({
                    produkId: produk._id,
                    tipeItem: 'Product',
                    jumlahBeli: item.jumlahBeli,
                    hargaSatuan: produk.harga,
                    catatan: item.catatan || ''
                });

                // Trigger Socket.io jika stok menipis
                if (produk.stok <= (produk.stokMinimum || 5)) {
                    const io = req.app.get('io');
                    if (io) {
                        io.emit('alertAdmin', {
                            tipe: 'STOK_MENIPIS',
                            pesan: `⚠️ Peringatan: Stok ${produk.nama} sisa ${produk.stok} ${produk.satuan}!`
                        });
                    }
                }
            }
        }

        const nominalPajak = totalHargaBarang * (persentasePajak / 100);
        const totalBayarLengkap = totalHargaBarang + nominalPajak;
        const labaBersih = totalHargaBarang - totalModalBarang;

        // Validasi Logika Bisnis: Cegah pembayaran kurang
        if (jumlahDibayar > 0 && jumlahDibayar < totalBayarLengkap) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ pesan: `Uang tidak cukup! Total tagihan adalah Rp ${totalBayarLengkap}` });
        }

        // Hitung kembalian
        const kembalianDihitung = jumlahDibayar > 0 ? jumlahDibayar - totalBayarLengkap : 0;

        // SIMPAN TRANSAKSI
        const transaksiBaru = new Transaction({
            nomorResi: buatNomorResi(),
            pelangganId: req.user && req.user.role === 'pelanggan' ? req.user.id : null,
            keranjang: keranjangValid,
            metodePembayaran: metodePembayaran,
            jumlahDibayar: jumlahDibayar || totalBayarLengkap,
            kembalian: kembalianDihitung > 0 ? kembalianDihitung : 0,
            pajak: nominalPajak,
            totalHarga: totalBayarLengkap,
            marginKeuntungan: labaBersih,
            lokasiPengiriman: lokasiPengiriman || null
        });
        
        // WAJIB lampirkan session saat menyimpan!
        await transaksiBaru.save({ session });

        // JIKA SEMUA LANCAR, COMMIT (SIMPAN PERMANEN KE DATABASE)
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            pesan: 'Checkout berhasil!',
            rincianBiaya: {
                totalBarang: totalHargaBarang,
                pajakDikenakan: nominalPajak,
                totalBayar: totalBayarLengkap,
                keuntunganBersih: labaBersih,
                metodePembayaran: metodePembayaran,
                jumlahDibayar: jumlahDibayar || totalBayarLengkap,
                kembalian: kembalianDihitung > 0 ? kembalianDihitung : 0
            },
            struk: transaksiBaru
        });

    } catch (error) {
        // JIKA ADA 1 SAJA ERROR (Misal stok tiba-tiba habis), ROLLBACK SEMUA PERUBAHAN!
        // Uang kembali, stok yang tadinya sempat kepotong akan dikembalikan otomatis oleh MongoDB.
        await session.abortTransaction();
        session.endSession();

        // Tangkap pesan error buatan kita (stok habis)
        if (error.message.includes('Gagal: Stok')) {
            return res.status(400).json({ pesan: error.message });
        }
        
        next(error); // Jika error lain, lempar ke Global Error Handler
    }
};

const lihatPesananSaya = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        // SECURITY PATCH: Cegah Memory Overload, limit maksimal 100
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;

        let filter = { pelangganId: req.user.id };

        // Filter by status
        if (req.query.status) {
            filter.statusPesanan = req.query.status;
        }

        const riwayatPesanan = await Transaction.find(filter)
            .populate('keranjang.produkId', 'nama namaBahan gambar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalData = await Transaction.countDocuments(filter);

        res.status(200).json({
            pesan: 'Berhasil memuat riwayat pesanan Anda',
            total: totalData,
            page,
            limit,
            totalPages: Math.ceil(totalData / limit),
            data: riwayatPesanan
        });
    } catch (error) {
        next(error);
    }
};

const laporanKeuntungan = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        // FITUR FILTER TANGGAL
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }

        const semuaTransaksi = await Transaction.find(query);
        if (semuaTransaksi.length === 0) {
            return res.status(200).json({ pesan: 'Belum ada transaksi', totalPendapatan: 0, totalKeuntunganBersih: 0 });
        }

        let totalPendapatan = 0;
        let totalKeuntunganBersih = 0;

        semuaTransaksi.forEach(t => {
            totalPendapatan += t.totalHarga;
            totalKeuntunganBersih += (t.marginKeuntungan || 0);
        });

        res.status(200).json({
            pesan: 'Laporan berhasil dibuat',
            periode: startDate && endDate ? `${startDate} s/d ${endDate}` : 'Semua Waktu',
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
        
        // Cari transaksi sebelum diupdate untuk mengecek status lama
        const transaksiLama = await Transaction.findById(transaksiId);
        if (!transaksiLama) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }

        let transaksiDiperbarui;

        if (statusBaru === 'batal' && transaksiLama.statusPesanan !== 'batal') {
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                // Kembalikan stok
                for (let item of transaksiLama.keranjang) {
                    if (item.tipeItem === 'RawMaterial') {
                        await RawMaterial.findByIdAndUpdate(item.produkId, { $inc: { stok: item.jumlahBeli } }, { session });
                    } else {
                        await Product.findByIdAndUpdate(item.produkId, { $inc: { stok: item.jumlahBeli } }, { session });
                    }
                }
                // Ubah status pesanan di dalam sesi yang sama
                transaksiDiperbarui = await Transaction.findByIdAndUpdate(
                    transaksiId,
                    { statusPesanan: statusBaru },
                    { returnDocument: 'after', runValidators: true, session }
                );
                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                throw error;
            } finally {
                session.endSession();
            }
        } else {
            // Pembaruan normal jika bukan pembatalan
            transaksiDiperbarui = await Transaction.findByIdAndUpdate(
                transaksiId,
                { statusPesanan: statusBaru },
                { returnDocument: 'after', runValidators: true }
            );
        }

        res.status(200).json({
            message: `Status pesanan berhasil diupdate menjadi ${statusBaru}`,
            transaksi: transaksiDiperbarui,
        });
    } catch (error) {
        next(error);
    }
};

const lihatDaftarPesanan = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        // SECURITY PATCH: Cegah Memory Overload, limit maksimal 100
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;

        const { status, search, startDate, endDate } = req.query;
        let aturanPencarian = {};
        
        if (status) {
            aturanPencarian.statusPesanan = status;
        }

        // Search by nomor resi dengan Escape Regex (Mencegah ReDoS)
        if (search) {
            const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const safeSearch = escapeRegex(search);
            aturanPencarian.nomorResi = { $regex: safeSearch, $options: 'i' };
        }

        // Filter tanggal
        if (startDate && endDate) {
            aturanPencarian.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }

        const daftarPesanan = await Transaction.find(aturanPencarian)
            .populate('keranjang.produkId', 'nama namaBahan harga hargaJual gambar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalData = await Transaction.countDocuments(aturanPencarian);
        
        res.status(200).json({
            pesan: 'Berhasil memuat daftar pesanan',
            total: totalData,
            page,
            limit,
            totalPages: Math.ceil(totalData / limit),
            data: daftarPesanan
        });
    } catch (error) {
        next(error);
    }
};

const grafikPendapatan = async (req, res, next) => {
    try {
        const dataGrafik = await Transaction.aggregate([
            { $match: { statusPesanan: 'selesai' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                    totalPendapatan: { $sum: "$totalHarga" },
                    totalKeuntungan: { $sum: "$marginKeuntungan" },
                    jumlahTransaksi: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            pesan: 'Data grafik berhasil direkap',
            data: dataGrafik
        });
    } catch (error) {
        next(error);
    }
};

const exportLaporanExcel = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }

        const semuaTransaksi = await Transaction.find(query).sort({ createdAt: -1 });
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Laporan Penjualan');

        worksheet.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Tanggal', key: 'tanggal', width: 20 },
            { header: 'Nomor Resi', key: 'resi', width: 20 },
            { header: 'Pajak (Rp)', key: 'pajak', width: 15 },
            { header: 'Total Harga (Rp)', key: 'total', width: 20 },
            { header: 'Untung Bersih (Rp)', key: 'untung', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
        ];

        semuaTransaksi.forEach((t, index) => {
            worksheet.addRow({
                no: index + 1,
                tanggal: t.createdAt.toLocaleString('id-ID'),
                resi: t.nomorResi,
                pajak: t.pajak || 0,
                total: t.totalHarga,
                untung: t.marginKeuntungan || 0,
                status: t.statusPesanan
            });
        });

        worksheet.getRow(1).font = { bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Laporan_StokAja_${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        // Hapus res.status(200).end() karena xlsx.write(res) sudah mengelola stream response

    } catch (error) {
        next(error);
    }
};

// FITUR GENERATE STRUK PDF
const generateStrukPDF = async (req, res, next) => {
    try {
        const transaksi = await Transaction.findById(req.params.id).populate('keranjang.produkId', 'nama namaBahan');
        
        if (!transaksi) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

        // --- SECURITY PATCH: Cegah Pelanggan mengintip struk orang lain ---
        if (req.user.role === 'pelanggan') {
            if (!transaksi.pelangganId || transaksi.pelangganId.toString() !== req.user.id) {
                return res.status(403).json({
                    message: 'Akses ditolak! Anda tidak berhak melihat struk pesanan ini.'
                });
            }
        }

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Struk_${transaksi.nomorResi}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('STOKAJA!', { align: 'center' });
        doc.fontSize(10).text('Solusi Stok Cerdas untuk UMKM', { align: 'center' });
        doc.moveDown();
        doc.text(`------------------------------------------------------------`);
        doc.text(`No. Resi  : ${transaksi.nomorResi}`);
        doc.text(`Tanggal   : ${transaksi.createdAt.toLocaleString('id-ID')}`);
        doc.text(`Status    : ${transaksi.statusPesanan.toUpperCase()}`);
        doc.text(`------------------------------------------------------------`);
        doc.moveDown();

        // Items
        doc.fontSize(12).text('Rincian Belanja:', { underline: true });
        doc.moveDown(0.5);
        
        transaksi.keranjang.forEach(item => {
            const subtotal = item.jumlahBeli * item.hargaSatuan;
            const namaItem = item.produkId?.nama || item.produkId?.namaBahan || 'Item Dihapus';
            doc.fontSize(10).text(`${namaItem} x ${item.jumlahBeli} @ Rp ${item.hargaSatuan.toLocaleString()} = Rp ${subtotal.toLocaleString()}`);
        });

        doc.moveDown();
        doc.text(`------------------------------------------------------------`);
        doc.fontSize(10).text(`Total Barang : Rp ${(transaksi.totalHarga - transaksi.pajak).toLocaleString()}`, { align: 'right' });
        doc.text(`Pajak        : Rp ${transaksi.pajak.toLocaleString()}`, { align: 'right' });
        doc.fontSize(12).text(`TOTAL BAYAR  : Rp ${transaksi.totalHarga.toLocaleString()}`, { align: 'right', bold: true });
        doc.text(`------------------------------------------------------------`);
        
        doc.moveDown(2);
        doc.fontSize(10).text('Terima kasih telah berbelanja di StokAja!', { align: 'center', italic: true });

        doc.end();
    } catch (error) {
        next(error);
    }
};

// LAPORAN MARGIN PER PRODUK
const laporanPerProduk = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let matchStage = { statusPesanan: 'selesai' };

        if (startDate && endDate) {
            matchStage.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }

        const dataPerProduk = await Transaction.aggregate([
            { $match: matchStage },
            { $unwind: '$keranjang' },
            {
                $group: {
                    _id: {
                        produkId: '$keranjang.produkId',
                        tipeItem: '$keranjang.tipeItem'
                    },
                    totalTerjual: { $sum: '$keranjang.jumlahBeli' },
                    totalPendapatan: { $sum: { $multiply: ['$keranjang.hargaSatuan', '$keranjang.jumlahBeli'] } },
                    jumlahTransaksi: { $sum: 1 }
                }
            },
            { $sort: { totalPendapatan: -1 } }
        ]);

        // Populate nama produk/bahan baku
        const hasil = await Promise.all(dataPerProduk.map(async (item) => {
            let nama = 'Item Dihapus';
            if (item._id.tipeItem === 'Product') {
                const p = await Product.findById(item._id.produkId).select('nama');
                if (p) nama = p.nama;
            } else {
                const b = await RawMaterial.findById(item._id.produkId).select('namaBahan');
                if (b) nama = b.namaBahan;
            }
            return {
                produkId: item._id.produkId,
                tipeItem: item._id.tipeItem,
                nama,
                totalTerjual: item.totalTerjual,
                totalPendapatan: item.totalPendapatan,
                jumlahTransaksi: item.jumlahTransaksi
            };
        }));

        res.status(200).json({
            pesan: 'Laporan per produk berhasil dibuat',
            data: hasil
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
    grafikPendapatan,
    lihatDaftarPesanan,
    exportLaporanExcel,
    generateStrukPDF,
    laporanPerProduk
};