<div align="center">

# 📦 StokAja! — Backend API

**Backend RESTful API untuk aplikasi manajemen inventaris & POS StokAja!**

Dibangun dengan Node.js, Express.js, dan MongoDB Atlas. Mengelola produk, transaksi, autentikasi pengguna, upload gambar via Cloudinary, dan komunikasi *real-time* via Socket.io.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.2.1-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Upload-3448C5?style=flat-square&logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.3-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](LICENSE)

🌐 **Production:** [stokaja-backend-production.up.railway.app](https://stokaja-backend-production.up.railway.app)

</div>

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Prasyarat](#prasyarat)
- [Instalasi & Menjalankan Lokal](#instalasi--menjalankan-lokal)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [WebSocket Events](#websocket-events)
- [Deployment (Railway)](#deployment-railway)
- [Keamanan](#keamanan)
- [Kontribusi](#kontribusi)

---

## Fitur Utama

- **Autentikasi JWT (Dual Token)** — Register, login, refresh token, dan logout. Access token berumur pendek (15 menit) + refresh token berumur panjang (7 hari).
- **Manajemen Produk (CRUD)** — Tambah, ubah, hapus produk dengan upload gambar otomatis ke **Cloudinary** (gambar lama dihapus otomatis saat diganti).
- **Manajemen Bahan Baku (CRUD)** — Kelola stok bahan baku dengan harga modal, harga jual, dan upload gambar ke Cloudinary.
- **Sistem Transaksi (POS)** — Checkout mendukung produk **dan** bahan baku dalam satu transaksi. Stok dipotong secara atomik.
- **Manajemen Profil** — Update nama, email, password, dan **upload foto profil ke Cloudinary**. Multi-alamat pengiriman (CRUD).
- **Dashboard Admin** — Statistik ringkasan (total produk, user, transaksi hari ini, stok menipis).
- **Laporan & Grafik** — Laporan keuntungan dengan filter tanggal, grafik pendapatan harian, laporan per-produk.
- **Export Data** — Ekspor laporan ke Excel (`.xlsx`) dan generate struk PDF per transaksi.
- **Live Chat Real-time** — Chat pelanggan ↔ admin via Socket.io dengan riwayat pesan, daftar kontak, dan status baca.
- **Reset Password** — Forgot & reset password via email (Nodemailer + Gmail).
- **Role-Based Access** — 3 role: `admin`, `kasir`, `pelanggan`. Setiap endpoint memiliki pembatasan akses sesuai role.
- **Keamanan Berlapis** — Helmet, multi-origin CORS, Rate Limiting, input validation, bcrypt password hashing.

---

## Tech Stack

| Kategori | Teknologi |
|---|---|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js 5.2.1 |
| **Database** | MongoDB Atlas via Mongoose 9.x |
| **Real-time** | Socket.io 4.8.3 |
| **Autentikasi** | JSON Web Token + bcrypt |
| **Upload Gambar** | Multer 2.1.1 + Cloudinary (multer-storage-cloudinary) |
| **Validasi** | express-validator 7.3.2 |
| **Keamanan** | Helmet, CORS, express-rate-limit |
| **Email** | Nodemailer (Gmail) |
| **Export** | ExcelJS (xlsx), PDFKit (pdf) |
| **Logging** | Winston + Morgan |
| **Dev Tools** | Nodemon, ESLint, Prettier, Jest + Supertest |

---

## Struktur Proyek

```
stokaja-backend/
├── config/                 # Konfigurasi external services
│   ├── cloudinary.js       # Konfigurasi Cloudinary SDK
│   ├── db.js               # Koneksi MongoDB Atlas
│   └── socket.js           # Inisialisasi Socket.io + auth middleware
├── controllers/            # Business logic handler
│   ├── adminController.js  # Kelola user (CRUD, ubah role)
│   ├── authController.js   # Register, login, logout, refresh token, reset password
│   ├── categoryController.js
│   ├── chatController.js   # Riwayat chat, kontak, tandai dibaca
│   ├── dashboardController.js
│   ├── paymentMethodController.js
│   ├── productController.js
│   ├── rawMaterialController.js
│   ├── transactionController.js  # Checkout, pesanan, laporan, export
│   └── userController.js   # Profil, avatar upload, CRUD alamat
├── middlewares/
│   ├── auth.js             # Verifikasi JWT access token
│   ├── roleMiddleware.js   # Pembatasan akses berdasarkan role
│   ├── upload.js           # Multer + CloudinaryStorage
│   └── errorHandler.js     # Global error handler
├── models/                 # Skema Mongoose
│   ├── Category.js
│   ├── Message.js          # Chat messages (pengirim, penerima, isiPesan, dibaca)
│   ├── PaymentMethod.js
│   ├── Product.js          # Produk (stok, stokMinimum, stokMaksimum, hargaModal)
│   ├── RawMaterial.js
│   ├── Transaction.js      # Transaksi (keranjang, nomorResi, statusPesanan)
│   └── User.js             # User (namaLengkap, avatar, alamat[], role)
├── routes/                 # Definisi routing per-resource
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── categoryRoutes.js
│   ├── chatRoutes.js
│   ├── dashboardRoutes.js
│   ├── paymentMethodRoutes.js
│   ├── productRoutes.js
│   ├── rawMaterialRoutes.js
│   ├── transactionRoutes.js
│   └── userRoutes.js
├── validations/            # Aturan validasi input (express-validator)
├── utils/                  # Helper (logger, sendEmail, generateResi)
├── test/                   # Unit & integration tests (Jest + Supertest)
├── .env.example
├── server.js               # Entry point aplikasi
└── package.json
```

---

## Prasyarat

- **Node.js** versi 18+ — [Download](https://nodejs.org)
- **npm** versi 9+
- **Akun MongoDB Atlas** (gratis) — [Daftar](https://www.mongodb.com/cloud/atlas/register)
- **Akun Cloudinary** (gratis) — [Daftar](https://cloudinary.com/users/register_free)

---

## Instalasi & Menjalankan Lokal

**1. Clone repositori**

```bash
git clone https://github.com/AchmadFauzan1156/stokaja-backend.git
cd stokaja-backend
```

**2. Install dependencies**

```bash
npm install
```

**3. Buat file `.env`**

```bash
cp .env.example .env
```

Edit file `.env` sesuai panduan di bagian [Environment Variables](#environment-variables).

**4. Jalankan server**

```bash
# Development (auto-restart dengan nodemon)
npm run dev

# Production
npm start
```

Server berjalan di `http://localhost:5001` (atau sesuai `PORT` di `.env`).

---

## Environment Variables

Buat file `.env` di root proyek:

```env
# ==============================================
# SERVER
# ==============================================
PORT=5001
NODE_ENV=development

# ==============================================
# DATABASE (MongoDB Atlas)
# ==============================================
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>

# ==============================================
# AUTENTIKASI JWT
# Generate: openssl rand -hex 32
# ==============================================
JWT_SECRET=<random_string_min_32_karakter>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<random_string_berbeda_min_32_karakter>
JWT_REFRESH_EXPIRES_IN=7d

# ==============================================
# CORS — URL frontend yang diizinkan (pisah koma)
# ==============================================
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# ==============================================
# EMAIL (Nodemailer + Gmail App Password)
# ==============================================
EMAIL_SERVICE=gmail
EMAIL_USER=email@gmail.com
EMAIL_PASS=xxxx_xxxx_xxxx_xxxx

# ==============================================
# CLOUDINARY (Upload Gambar)
# Dapatkan dari: https://console.cloudinary.com
# ==============================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

| Variable | Deskripsi |
|---|---|
| `PORT` | Port server (default: `5001`) |
| `NODE_ENV` | `development` atau `production` |
| `MONGO_URI` | Connection string MongoDB Atlas |
| `JWT_SECRET` | Secret untuk signing access token |
| `JWT_EXPIRES_IN` | Masa berlaku access token (`15m`) |
| `JWT_REFRESH_SECRET` | Secret untuk refresh token (harus berbeda) |
| `JWT_REFRESH_EXPIRES_IN` | Masa berlaku refresh token (`7d`) |
| `CORS_ORIGIN` | URL frontend yang diizinkan (pisahkan dengan koma) |
| `EMAIL_SERVICE` | Service email (`gmail`) |
| `EMAIL_USER` | Email pengirim |
| `EMAIL_PASS` | App Password dari Google |
| `CLOUDINARY_CLOUD_NAME` | Nama cloud Cloudinary |
| `CLOUDINARY_API_KEY` | API Key Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret Cloudinary |

> ⚠️ **Penting:** Jangan commit file `.env` ke repository. Pastikan `.env` ada di `.gitignore`.

> ⚠️ **Railway:** Saat deploy ke Railway, pastikan `CLOUDINARY_API_KEY` dan `CLOUDINARY_API_SECRET` tidak tertukar. Ini adalah penyebab error upload gambar yang paling sering terjadi.

---

## API Reference

**Base URL:** `https://stokaja-backend-production.up.railway.app/api/v1`
**Lokal:** `http://localhost:5001/api/v1`

Semua endpoint yang memerlukan autentikasi harus menyertakan header:
```
Authorization: Bearer <access_token>
```

---

### 🔐 Autentikasi

| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `POST` | `/register` | Registrasi user baru | Public |
| `POST` | `/login` | Login, mendapatkan access + refresh token | Public |
| `POST` | `/refresh-token` | Tukar refresh token → access token baru | Public |
| `POST` | `/logout` | Hapus refresh token dari database | Authenticated |
| `POST` | `/forgot-password` | Kirim link reset password via email | Public |
| `POST` | `/reset-password/:token` | Reset password dengan token | Public |

**Register — `POST /register`**
```json
{
  "namaLengkap": "Budi Santoso",
  "email": "budi@example.com",
  "password": "password123"
}
```

**Login — `POST /login`**
```json
// Request
{ "email": "budi@example.com", "password": "password123" }

// Response 200
{
  "pesan": "Login berhasil",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": { "_id": "...", "namaLengkap": "Budi Santoso", "email": "...", "role": "pelanggan" }
  }
}
```

**Refresh Token — `POST /refresh-token`**
```json
// Request
{ "refreshToken": "eyJhbGciOi..." }

// Response 200
{ "success": true, "data": { "accessToken": "...", "refreshToken": "..." } }
```

---

### 🛍️ Produk

| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `GET` | `/produk` | Daftar produk (`?page=`, `?limit=`, `?search=`) | Authenticated |
| `GET` | `/produk/:id` | Detail produk by ID | Authenticated |
| `POST` | `/produk` | Tambah produk baru (form-data + gambar) | Admin |
| `PUT` | `/produk/:id` | Edit produk (gambar lama dihapus dari Cloudinary) | Admin |
| `DELETE` | `/produk/:id` | Hapus produk + gambar dari Cloudinary | Admin |

**Field Produk (form-data):**

| Field | Tipe | Wajib | Deskripsi |
|---|---|---|---|
| `nama` | string | Ya | Nama produk |
| `deskripsi` | string | Tidak | Deskripsi produk |
| `kategori` | MongoId | Tidak | ID kategori |
| `harga` | number | Ya | Harga jual |
| `hargaModal` | number | Tidak | Harga modal/beli |
| `stok` | number | Ya | Jumlah stok |
| `stokMinimum` | number | Tidak | Batas minimum stok (alert) |
| `stokMaksimum` | number | Tidak | Batas maksimum stok |
| `satuan` | string | Tidak | Satuan (pcs, kg, dll) |
| `gambar` | file | Tidak | Gambar produk (jpg/png/webp, di-upload ke Cloudinary) |

---

### 🧪 Bahan Baku

| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `GET` | `/bahan-baku` | Daftar bahan baku | Admin, Kasir |
| `POST` | `/bahan-baku` | Tambah bahan baku (form-data + gambar) | Admin |
| `PUT` | `/bahan-baku/:id` | Edit bahan baku | Admin |
| `DELETE` | `/bahan-baku/:id` | Hapus bahan baku + gambar | Admin |

---

### 💳 Transaksi & POS

| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `POST` | `/checkout` | Checkout / buat transaksi baru | All Authenticated |
| `GET` | `/pesananku` | Riwayat pesanan pelanggan (`?limit=`) | Pelanggan, Admin |
| `GET` | `/transaksi` | Semua pesanan toko (`?status=`) | Admin, Kasir |
| `PATCH` | `/transaksi/:id/status` | Ubah status pesanan | Admin, Kasir |
| `GET` | `/transaksi/:id/pdf` | Generate struk PDF | Authenticated |

**Checkout — `POST /checkout`**
```json
{
  "isiKeranjang": [
    { "produkId": "64f1...", "jumlahBeli": 2, "tipe": "produk" },
    { "produkId": "64f2...", "jumlahBeli": 1, "tipe": "bahanBaku" }
  ],
  "lokasiPengiriman": "Jl. Contoh No. 123",
  "metodePembayaran": "Transfer Bank",
  "jumlahDibayar": 200000,
  "persentasePajak": 10
}
```

---

### 📊 Dashboard & Laporan

| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `GET` | `/dashboard/stats` | Statistik ringkasan admin | Admin |
| `GET` | `/laporan` | Laporan keuntungan (`?startDate=&endDate=`) | Admin |
| `GET` | `/grafik` | Data grafik pendapatan harian | Admin |
| `GET` | `/laporan/per-produk` | Penjualan & margin per-produk | Admin |
| `GET` | `/laporan/excel` | Export laporan ke Excel (.xlsx) | Admin |

---

### 👤 Profil & Alamat

| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `GET` | `/profil` | Lihat profil user yang login | Authenticated |
| `PUT` | `/profil` | Update profil (form-data, termasuk upload avatar ke Cloudinary) | Authenticated |
| `POST` | `/profil/alamat` | Tambah alamat baru | Authenticated |
| `PUT` | `/profil/alamat/:alamatId` | Edit alamat | Authenticated |
| `DELETE` | `/profil/alamat/:alamatId` | Hapus alamat | Authenticated |

**Update Profil — `PUT /profil` (form-data)**

| Field | Tipe | Deskripsi |
|---|---|---|
| `namaLengkap` | string | Nama lengkap |
| `email` | string | Email baru (dicek duplikasi) |
| `noHP` | string | Nomor HP |
| `passwordLama` | string | Password lama (wajib jika ganti password) |
| `passwordBaru` | string | Password baru |
| `avatar` | file | Foto profil (di-upload ke Cloudinary, foto lama dihapus otomatis) |

---

### 📑 Kategori & Metode Pembayaran

| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `GET` | `/kategori` | Semua kategori | Authenticated |
| `POST` | `/kategori` | Tambah kategori | Admin |
| `PUT` | `/kategori/:id` | Edit kategori | Admin |
| `DELETE` | `/kategori/:id` | Hapus kategori | Admin |
| `GET` | `/metode-bayar` | Semua metode pembayaran | Authenticated |
| `POST` | `/metode-bayar` | Tambah metode bayar | Admin |
| `PUT` | `/metode-bayar/:id` | Edit metode bayar | Admin |
| `DELETE` | `/metode-bayar/:id` | Hapus metode bayar | Admin |

---

### 💬 Live Chat

| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `GET` | `/chat/history` | Riwayat chat (`?pelangganId=` untuk admin lihat chat spesifik) | **All Authenticated** |
| `GET` | `/chat/contacts` | Daftar pelanggan yang pernah chat + pesan terakhir | Admin, Kasir |
| `PATCH` | `/chat/:id/read` | Tandai 1 pesan sudah dibaca | Authenticated |
| `PATCH` | `/chat/pelanggan/:pelangganId/read-all` | Tandai semua pesan dari 1 pelanggan sudah dibaca | Admin, Kasir |

---

### 👥 Kelola User (Admin)

| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `GET` | `/users` | Daftar user (`?role=`, `?search=`) | Admin |
| `PATCH` | `/users/:id/role` | Ubah role user | Admin |
| `DELETE` | `/users/:id` | Hapus user | Admin |

---

## WebSocket Events

Koneksi ke WebSocket menggunakan [Socket.io](https://socket.io).

**URL:** `https://stokaja-backend-production.up.railway.app` (Production) atau `http://localhost:5001` (Lokal)

**Autentikasi saat handshake:**
```js
import { io } from "socket.io-client";

const socket = io("https://stokaja-backend-production.up.railway.app", {
  auth: { token: "<access_token>" },
  transports: ["websocket", "polling"],
});
```

### Events

| Arah | Event | Payload | Deskripsi |
|---|---|---|---|
| Client → Server | `send_message` | `{ penerima: "userId" \| null, pesan: "teks" }` | Kirim pesan (null = ke admin) |
| Server → Client | `receive_message` | `{ _id, pengirim, penerima, isiPesan, createdAt }` | Pesan baru diterima (broadcast) |

---

## Deployment (Railway)

Proyek ini di-deploy di [Railway](https://railway.app).

**Catatan penting saat deploy:**
1. **Tidak perlu Build Command** — Aplikasi Express.js murni tidak memerlukan proses build. Kosongkan Build Command di Railway Settings, atau isi dengan `echo "No build needed"`.
2. **Start Command:** `npm start` (yang menjalankan `node server.js`).
3. **Environment Variables:** Pastikan semua variabel di bagian [Environment Variables](#environment-variables) sudah diatur di tab **Variables** Railway

---

## Keamanan

| Lapisan | Teknologi | Deskripsi |
|---|---|---|
| HTTP Headers | Helmet | Mengatur security headers otomatis |
| CORS | cors | Multi-origin, credentials enabled |
| Rate Limiting | express-rate-limit | Maks 100 request/15 menit per IP |
| Input Validation | express-validator | Validasi semua input sebelum diproses |
| Password | bcrypt (12 salt rounds) | Hashing password satu arah |
| Auth | JWT (HS256) | Dual token (access + refresh) |
| Upload | Cloudinary | File tidak disimpan di server (ephemeral-safe) |

---

## Kontribusi

1. Fork repositori ini.
2. Buat branch fitur baru: `git checkout -b feat/nama-fitur`
3. Commit perubahan: `git commit -m 'feat: tambah fitur X'`
4. Push ke branch: `git push origin feat/nama-fitur`
5. Buat Pull Request.

Konvensi commit: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.

---

<div align="center">
  <sub>Dibuat dengan ☕ oleh <a href="https://github.com/AchmadFauzan1156">Achmad Fauzan</a></sub>
</div>