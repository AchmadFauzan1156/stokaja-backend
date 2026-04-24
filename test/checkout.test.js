const request = require('supertest');
const mongoose = require('mongoose');
// 1. UBAH IMPORT INI (Gunakan ReplSet)
const { MongoMemoryReplSet } = require('mongodb-memory-server'); 
const app = require('../server'); 
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');

let mongoServer;
let tokenAdmin;
let produkUji;

// --- PERSIAPAN SEBELUM TESTING ---
beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    // 2. UBAH CARA PEMBUATAN DATABASE INI
    // Kita paksa membuat database di memori dengan mode Replica Set agar mendukung Transaksi (ACID)
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    tokenAdmin = jwt.sign({ id: new mongoose.Types.ObjectId(), role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    produkUji = new Product({
        nama: "Kopi Susu Gula Aren",
        harga: 15000,
        stok: 5,
        satuan: "gelas",
        hargaModal: 10000
    });
    await produkUji.save();
});

// --- BERSIHKAN DATABASE SETELAH TESTING SELESAI ---
afterAll(async () => {
    // Pastikan koneksi aman sebelum dihapus agar tidak terjadi Timeout
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
});

// --- SKENARIO PENGUJIAN ---
describe('Uji Coba API Transaksi Kasir', () => {

    it('Harus BERHASIL checkout jika stok mencukupi', async () => {
        const response = await request(app)
            .post('/api/v1/checkout')
            .set('Authorization', `Bearer ${tokenAdmin}`) // Masukkan token
            .send({
                isiKeranjang: [{ produkId: produkUji._id, jumlahBeli: 2 }], // Beli 2
                persentasePajak: 10
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.pesan).toBe('Checkout berhasil!');
        
        // Cek di database apakah stok benar-benar berkurang (5 - 2 = 3)
        const produkSetelahBeli = await Product.findById(produkUji._id);
        expect(produkSetelahBeli.stok).toBe(3);
    });

    it('Harus GAGAL jika membeli melebihi sisa stok (Proteksi Over-checkout)', async () => {
        // Sisa stok saat ini adalah 3 (dari test sebelumnya)
        const response = await request(app)
            .post('/api/v1/checkout')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({
                isiKeranjang: [{ produkId: produkUji._id, jumlahBeli: 5 }], // Coba beli 5!
                persentasePajak: 0
            });

        expect(response.statusCode).toBe(400); // Harus melempar error Bad Request
        expect(response.body.pesan).toContain('tidak mencukupi');
        
        // Pastikan stok di database TETAP 3 (tidak berubah jadi minus)
        const produkSetelahGagal = await Product.findById(produkUji._id);
        expect(produkSetelahGagal.stok).toBe(3);
    });

});