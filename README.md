# 📦 StokAja! - Backend API Services

Backend services untuk aplikasi manajemen inventaris **StokAja!**, dibangun menggunakan Node.js, Express.js, dan MongoDB Atlas. Repositori ini mengelola logika inti dari manajemen produk, transaksi, profil pengguna, hingga fitur komunikasi *real-time* menggunakan WebSockets.

---

## ✨ Fitur Utama

- **Autentikasi & Otorisasi:** Menggunakan JWT (JSON Web Token) untuk login dan registrasi yang aman.
- **Manajemen Produk (CRUD):** Lengkap dengan fitur *upload* dan hapus gambar fisik secara otomatis menggunakan Multer.
- **Paginasi Otomatis:** API Produk mendukung paginasi (`limit` & `skip`) untuk efisiensi beban server.
- **Sistem Transaksi:** Logika *checkout* dengan sinkronisasi pengurangan stok secara otomatis.
- **Real-time Chat:** Fitur *private messaging* antar pengguna menggunakan Socket.io.
- **Keamanan Ekstra:** Dilengkapi dengan Rate Limiting, CORS, dan Global Error Handling terpusat.

---

## 🛠️ Tech Stack

- **Server:** Node.js, Express.js
- **Database:** MongoDB Atlas (Cloud), Mongoose ODM
- **Real-time:** Socket.io
- **Utilities:** Multer (File Upload), Cors, Express-rate-limit, Dotenv

---

## ⚙️ Environment Variables

Untuk menjalankan proyek ini, Anda perlu membuat file `.env` di *root folder* dan menambahkan variabel berikut:

```text
PORT=5000
MONGO_URI=mongodb://<username>:<password>@<cluster-url>/<nama_database>
```

*(Catatan: Sesuaikan MONGO_URI dengan Connection String dari MongoDB Atlas Anda)*

---

## 🚀 Cara Menjalankan Server Lokal

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di komputer Anda:

### 1. Clone Repositori

```bash
git clone https://github.com/AchmadFauzan1156/stokaja-backend.git
cd stokaja-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Jalankan Server

```bash
npm run dev

node server.js
```

---

## 📡 API Reference

### 🔐 Autentikasi

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/register` | Mendaftarkan akun pengguna baru |
| `POST` | `/api/login` | Login dan mendapatkan token akses |

---

### 🛍️ Produk

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/produk` | Mengambil data produk (Mendukung query `?page=1&limit=10`) |
| `POST` | `/api/produk` | Menambah produk baru (Multipart/form-data) |
| `PUT` | `/api/produk/:id` | Mengubah detail atau mengganti gambar produk |
| `DELETE`| `/api/produk/:id` | Menghapus data produk dan file fisik gambarnya |

### 💳 Transaksi & Profil

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/checkout` | Melakukan transaksi baru dan memotong stok |
| `GET` | `/api/profil` | Melihat profil pengguna yang sedang login |

---

## 💬 WebSockets (Socket.io)

Aplikasi ini mendukung *event listener* berikut untuk fitur Live Chat / Walkie-Talkie:

- **`gabungRuangan`**: Klien mengirimkan string nama ruangan untuk bergabung ke *private room*.
- **`kirimPesanPrivate`**: Klien mengirimkan objek JSON (contoh: `{ ruangan: "A1", pengirim: "User1", teks: "Halo" }`).
- **`pesanBaru`**: Server memancarkan kembali pesan ke klien di ruangan yang sama.
