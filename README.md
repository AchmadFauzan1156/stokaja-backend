<div align="center">

# 📦 StokAja! — Backend API

**Backend RESTful API untuk aplikasi manajemen inventaris StokAja!**

Dibangun dengan Node.js, Express.js, dan MongoDB Atlas. Mengelola produk, transaksi stok, autentikasi pengguna, dan komunikasi *real-time* via WebSocket.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.2.1-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.3-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](LICENSE)

</div>

---

## Daftar Isi

- [📦 StokAja! — Backend API](#-stokaja--backend-api)
  - [Daftar Isi](#daftar-isi)
  - [Fitur Utama](#fitur-utama)
  - [Tech Stack](#tech-stack)
  - [Struktur Proyek](#struktur-proyek)
  - [Prasyarat](#prasyarat)
  - [Instalasi \& Menjalankan Lokal](#instalasi--menjalankan-lokal)
  - [Environment Variables](#environment-variables)
  - [API Reference](#api-reference)
    - [🔐 Autentikasi](#-autentikasi)
      - [`POST /api/register`](#post-apiregister)
      - [`POST /api/login`](#post-apilogin)
    - [🛍️ Produk](#️-produk)
      - [`GET /api/produk`](#get-apiproduk)
      - [`POST /api/produk`](#post-apiproduk)
      - [`PUT /api/produk/:id`](#put-apiprodukid)
      - [`DELETE /api/produk/:id`](#delete-apiprodukid)
    - [💳 Transaksi](#-transaksi)
      - [`POST /api/checkout`](#post-apicheckout)
    - [👤 Profil](#-profil)
      - [`GET /api/profil`](#get-apiprofil)
  - [Format Response](#format-response)
  - [WebSocket Events](#websocket-events)
    - [Events dari Client ke Server](#events-dari-client-ke-server)
    - [Events dari Server ke Client](#events-dari-server-ke-client)
  - [Keamanan](#keamanan)
  - [Kontribusi](#kontribusi)

---

## Fitur Utama

- **Autentikasi JWT** — Register, login, dan proteksi endpoint menggunakan JSON Web Token.
- **Manajemen Produk (CRUD)** — Tambah, ubah, hapus produk lengkap dengan upload & hapus gambar otomatis via Multer.
- **Paginasi** — API produk mendukung query `?page=` dan `?limit=` untuk efisiensi beban server.
- **Sistem Transaksi** — Checkout dengan pengurangan stok otomatis dan histori transaksi.
- **Export Data** — Ekspor data produk dan transaksi ke format Excel (`.xlsx`) dan PDF.
- **Real-time Chat** — Private messaging antar pengguna menggunakan Socket.io.
- **Keamanan Berlapis** — Helmet, CORS, Rate Limiting, dan validasi input dengan express-validator.
- **Global Error Handler** — Semua error ditangani terpusat dengan format response yang konsisten.

---

## Tech Stack

| Kategori | Teknologi |
|---|---|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js 5.2.1 |
| **Database** | MongoDB Atlas via Mongoose ODM |
| **Real-time** | Socket.io 4.8.3 |
| **Autentikasi** | JSON Web Token (jsonwebtoken) + bcrypt |
| **Upload File** | Multer 2.1.1 |
| **Validasi** | express-validator 7.3.2 |
| **Keamanan** | Helmet, CORS, express-rate-limit |
| **Export** | ExcelJS (xlsx), PDFKit (pdf) |
| **Dev Tools** | Nodemon, ESLint, Prettier |

---

## Struktur Proyek

```
stokaja-backend/
├── config/             # Konfigurasi database dan app
├── controllers/        # Logic handler untuk setiap resource
│   ├── authController.js
│   ├── produkController.js
│   ├── transaksiController.js
│   └── profilController.js
├── middlewares/        # Middleware kustom (auth, error handler, dll.)
│   ├── authMiddleware.js
│   └── errorHandler.js
├── models/             # Skema Mongoose
│   ├── User.js
│   ├── Produk.js
│   └── Transaksi.js
├── routes/             # Definisi routing
│   ├── authRoutes.js
│   ├── produkRoutes.js
│   ├── transaksiRoutes.js
│   └── profilRoutes.js
├── utils/              # Helper functions
├── validations/        # Aturan validasi input
├── uploads/            # File gambar produk (di-ignore git)
├── .env.example        # Template environment variables
├── server.js           # Entry point aplikasi
└── package.json
```

---

## Prasyarat

Pastikan sudah terinstall di mesin Anda:

- **Node.js** versi 18 atau lebih baru — [Download Node.js](https://nodejs.org)
- **npm** versi 9 atau lebih baru (sudah termasuk dengan Node.js)
- **Akun MongoDB Atlas** (gratis) — [Daftar di mongodb.com](https://www.mongodb.com/cloud/atlas/register)

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

Salin file template dan isi nilai yang sesuai:

```bash
cp .env.example .env
```

Lalu edit file `.env` (lihat bagian [Environment Variables](#environment-variables) di bawah).

**4. Jalankan server**

- Mode development (auto-restart saat ada perubahan file):
  ```bash
  npm run dev
  ```

- Mode production:
  ```bash
  npm start
  ```

Server akan berjalan di `http://localhost:5000` (atau port yang diatur di `.env`).

---

## Environment Variables

Buat file `.env` di root proyek berdasarkan `.env.example`:

```env
# ==============================================
# SERVER
# ==============================================
PORT=5000
NODE_ENV=development

# ==============================================
# DATABASE
# Salin Connection String dari MongoDB Atlas
# ==============================================
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<nama_database>

# ==============================================
# AUTENTIKASI JWT
# Gunakan random string minimal 32 karakter:
#   $ openssl rand -hex 32
# ==============================================
JWT_SECRET=ganti_dengan_random_string_minimal_32_karakter
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=ganti_dengan_random_string_berbeda_minimal_32_karakter
JWT_REFRESH_EXPIRES_IN=7d

# ==============================================
# CORS
# Isi dengan URL frontend yang diizinkan
# ==============================================
CORS_ORIGIN=http://localhost:3000
```

| Variable | Deskripsi | Contoh Nilai |
|---|---|---|
| `PORT` | Port yang digunakan server | `5000` |
| `NODE_ENV` | Environment aplikasi | `development` / `production` |
| `MONGO_URI` | Connection string MongoDB Atlas | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key untuk signing access token (min. 32 karakter) | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Masa berlaku access token | `15m`, `1h`, `1d` |
| `JWT_REFRESH_SECRET` | Secret key untuk refresh token (berbeda dari JWT_SECRET) | `openssl rand -hex 32` |
| `JWT_REFRESH_EXPIRES_IN` | Masa berlaku refresh token | `7d`, `30d` |
| `CORS_ORIGIN` | URL frontend yang diizinkan mengakses API | `http://localhost:3000` |

> **Penting:** Jangan pernah meng-commit file `.env` ke repository. File ini sudah dimasukkan ke `.gitignore`.

---

## API Reference

Base URL: `http://localhost:5000`

Semua endpoint yang membutuhkan autentikasi harus menyertakan header:

```
Authorization: Bearer <access_token>
```

---

### 🔐 Autentikasi

#### `POST /api/register`

Mendaftarkan akun pengguna baru.

**Request Body:**
```json
{
  "nama": "Budi Santoso",
  "email": "budi@example.com",
  "password": "password123"
}
```

**Response Sukses `201`:**
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "nama": "Budi Santoso",
      "email": "budi@example.com"
    }
  }
}
```

---

#### `POST /api/login`

Login dan mendapatkan access token.

**Request Body:**
```json
{
  "email": "budi@example.com",
  "password": "password123"
}
```

**Response Sukses `200`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "nama": "Budi Santoso",
      "email": "budi@example.com"
    }
  }
}
```

---

### 🛍️ Produk

Semua endpoint produk membutuhkan autentikasi.

#### `GET /api/produk`

Mengambil daftar produk dengan paginasi.

**Query Parameters:**

| Parameter | Tipe | Default | Deskripsi |
|---|---|---|---|
| `page` | `number` | `1` | Halaman yang ingin diambil |
| `limit` | `number` | `10` | Jumlah produk per halaman |
| `search` | `string` | — | Cari produk berdasarkan nama |

**Contoh Request:**
```
GET /api/produk?page=1&limit=10&search=baju
Authorization: Bearer <token>
```

**Response Sukses `200`:**
```json
{
  "success": true,
  "data": {
    "produk": [
      {
        "id": "64f1a2b3c4d5e6f7a8b9c0d1",
        "nama": "Baju Batik",
        "harga": 150000,
        "stok": 25,
        "gambar": "/uploads/baju-batik.jpg",
        "createdAt": "2024-09-01T10:00:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "totalPages": 5
  }
}
```

---

#### `POST /api/produk`

Menambah produk baru. Menggunakan `multipart/form-data` untuk upload gambar.

**Request (form-data):**

| Field | Tipe | Wajib | Deskripsi |
|---|---|---|---|
| `nama` | `string` | Ya | Nama produk |
| `harga` | `number` | Ya | Harga produk (dalam Rupiah) |
| `stok` | `number` | Ya | Jumlah stok awal |
| `deskripsi` | `string` | Tidak | Deskripsi produk |
| `gambar` | `file` | Tidak | Gambar produk (jpg/png, maks 2MB) |

**Response Sukses `201`:**
```json
{
  "success": true,
  "message": "Produk berhasil ditambahkan",
  "data": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d2",
    "nama": "Baju Batik",
    "harga": 150000,
    "stok": 25,
    "gambar": "/uploads/baju-batik-1693562400000.jpg"
  }
}
```

---

#### `PUT /api/produk/:id`

Mengubah data produk. Bisa sekaligus mengganti gambar.

**Request (form-data):** Field sama seperti `POST /api/produk`, semua opsional.

**Response Sukses `200`:**
```json
{
  "success": true,
  "message": "Produk berhasil diperbarui",
  "data": { "id": "64f1a2b3c4d5e6f7a8b9c0d2", "..." }
}
```

---

#### `DELETE /api/produk/:id`

Menghapus produk beserta file gambarnya dari server.

**Response Sukses `200`:**
```json
{
  "success": true,
  "message": "Produk berhasil dihapus"
}
```

---

### 💳 Transaksi

#### `POST /api/checkout`

Melakukan transaksi baru dan memotong stok produk secara otomatis.

Membutuhkan autentikasi.

**Request Body:**
```json
{
  "items": [
    { "produkId": "64f1a2b3c4d5e6f7a8b9c0d1", "jumlah": 2 },
    { "produkId": "64f1a2b3c4d5e6f7a8b9c0d2", "jumlah": 1 }
  ]
}
```

**Response Sukses `201`:**
```json
{
  "success": true,
  "message": "Transaksi berhasil",
  "data": {
    "transaksiId": "64f1a2b3c4d5e6f7a8b9c0d3",
    "total": 450000,
    "waktu": "2024-09-01T10:30:00.000Z"
  }
}
```

**Response Error — Stok Tidak Cukup `400`:**
```json
{
  "success": false,
  "message": "Stok tidak cukup untuk produk: Baju Batik (tersedia: 1, diminta: 2)"
}
```

---

### 👤 Profil

#### `GET /api/profil`

Mengambil data profil pengguna yang sedang login. Membutuhkan autentikasi.

**Response Sukses `200`:**
```json
{
  "success": true,
  "data": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "nama": "Budi Santoso",
    "email": "budi@example.com",
    "createdAt": "2024-08-15T08:00:00.000Z"
  }
}
```

---

## Format Response

Semua response API menggunakan format yang konsisten:

**Response Sukses:**
```json
{
  "success": true,
  "message": "Pesan opsional",
  "data": { ... }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Deskripsi error yang terjadi"
}
```

**Kode HTTP yang Digunakan:**

| Kode | Keterangan |
|---|---|
| `200` | OK — Request berhasil |
| `201` | Created — Data berhasil dibuat |
| `400` | Bad Request — Input tidak valid |
| `401` | Unauthorized — Token tidak ada atau tidak valid |
| `403` | Forbidden — Tidak punya izin |
| `404` | Not Found — Resource tidak ditemukan |
| `409` | Conflict — Data sudah ada (misal: email duplikat) |
| `429` | Too Many Requests — Rate limit terlampaui |
| `500` | Internal Server Error — Error di sisi server |

---

## WebSocket Events

Koneksi ke WebSocket server menggunakan [Socket.io](https://socket.io).

**Endpoint:** `ws://localhost:5000`

> **Catatan:** Autentikasi diperlukan saat melakukan koneksi. Kirimkan access token di bagian `auth` pada handshake:
> ```js
> const socket = io('http://localhost:5000', {
>   auth: { token: '<access_token>' }
> });
> ```

### Events dari Client ke Server

| Event | Payload | Deskripsi |
|---|---|---|
| `gabungRuangan` | `"nama_ruangan"` (string) | Bergabung ke private room |
| `kirimPesanPrivate` | `{ ruangan, teks }` | Mengirim pesan ke ruangan |

### Events dari Server ke Client

| Event | Payload | Deskripsi |
|---|---|---|
| `pesanBaru` | `{ pengirim, teks, waktu }` | Pesan baru masuk di ruangan |
| `bergabung` | `{ ruangan, status }` | Konfirmasi berhasil bergabung |
| `error` | `"pesan error"` | Notifikasi error dari server |

**Contoh penggunaan:**
```js
// Bergabung ke ruangan
socket.emit('gabungRuangan', 'ruangan_A1');

// Mengirim pesan
socket.emit('kirimPesanPrivate', {
  ruangan: 'ruangan_A1',
  teks: 'Halo, stok sudah diperbarui!'
});

// Mendengarkan pesan baru
socket.on('pesanBaru', ({ pengirim, teks, waktu }) => {
  console.log(`[${waktu}] ${pengirim}: ${teks}`);
});
```

---

## Keamanan

Proyek ini mengimplementasikan beberapa lapisan keamanan:

- **Helmet** — Mengatur HTTP security headers secara otomatis.
- **CORS** — Membatasi domain yang dapat mengakses API.
- **Rate Limiting** — Membatasi jumlah request per IP untuk mencegah brute force dan DDoS.
- **Validasi Input** — Semua input divalidasi menggunakan `express-validator` sebelum diproses.
- **Hashing Password** — Password disimpan menggunakan `bcrypt` dengan salt rounds 12.
- **JWT** — Token menggunakan algoritma HS256 dengan masa berlaku terbatas.

---

## Kontribusi

1. Fork repositori ini.
2. Buat branch fitur baru: `git checkout -b feat/nama-fitur`
3. Commit perubahan: `git commit -m 'feat: tambah fitur X'`
4. Push ke branch: `git push origin feat/nama-fitur`
5. Buat Pull Request.

Harap ikuti konvensi commit: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.

---

<div align="center">
  <sub>Dibuat dengan ☕ oleh <a href="https://github.com/AchmadFauzan1156">Achmad Fauzan</a></sub>
</div>