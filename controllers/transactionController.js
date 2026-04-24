const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const buatNomorResi = require('../utils/generateResi');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const checkoutKasir = async (req, res, next) => {
    try {
        const { isiKeranjang, lokasiPengiriman, persentasePajak = 0 } = req.body;
        
        let totalHargaBarang = 0;
        let totalModalBarang = 0;
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
            totalModalBarang += ((produk.hargaModal || 0) * item.jumlahBeli);

            keranjangValid.push({
                produkId: produk._id,
                jumlahBeli: item.jumlahBeli,
                hargaSatuan: produk.harga
            });
        }

        const nominalPajak = totalHargaBarang * (persentasePajak / 100);
        const totalBayarLengkap = totalHargaBarang + nominalPajak;
        const labaBersih = totalHargaBarang - totalModalBarang;

        for (let item of keranjangValid) {
            const produk = await Product.findById(item.produkId);
            produk.stok -= item.jumlahBeli;
            await produk.save();

            if (produk.stok <= (produk.stokMinimum || 5)) {
                const io = req.app.get('io');
                if (io) {
                    io.emit('alertAdmin', {
                        tipe: 'STOK_MENIPIS',
                        pesan: `⚠️ Peringatan: Stok ${produk.nama} sisa ${produk.stok} pcs!`
                    });
                }
            }
        }

        const transaksiBaru = new Transaction({
            nomorResi: buatNomorResi(),
            pelangganId: req.user.role === 'pelanggan' ? req.user.id : null,
            keranjang: keranjangValid,
            pajak: nominalPajak,
            totalHarga: totalBayarLengkap,
            marginKeuntungan: labaBersih,
            lokasiPengiriman: lokasiPengiriman || null
        });
        await transaksiBaru.save();

        res.status(201).json({
            pesan: 'Checkout berhasil!',
            rincianBiaya: {
                totalBarang: totalHargaBarang,
                pajakDikenakan: nominalPajak,
                totalBayar: totalBayarLengkap,
                keuntunganBersih: labaBersih
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
        res.status(200).end();

    } catch (error) {
        next(error);
    }
};

// FITUR GENERATE STRUK PDF
const generateStrukPDF = async (req, res, next) => {
    try {
        const transaksi = await Transaction.findById(req.params.id).populate('keranjang.produkId', 'nama');
        
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
            doc.fontSize(10).text(`${item.produkId.nama} x ${item.jumlahBeli} @ Rp ${item.hargaSatuan.toLocaleString()} = Rp ${subtotal.toLocaleString()}`);
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

module.exports = {
    checkoutKasir,
    lihatPesananSaya,
    laporanKeuntungan,
    ubahStatusPesanan,
    grafikPendapatan,
    lihatDaftarPesanan,
    exportLaporanExcel,
    generateStrukPDF
};