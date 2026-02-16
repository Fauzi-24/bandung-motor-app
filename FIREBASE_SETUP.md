# Panduan Mendapatkan Firebase Config

Untuk mendapatkan `apiKey`, `authDomain`, `projectId`, dll, ikuti langkah-langkah berikut:

## 1. Buat Project di Firebase Console
1.  Buka [console.firebase.google.com](https://console.firebase.google.com/).
2.  Login dengan akun Google kamu.
3.  Klik **"Add project"** atau **"Create a project"**.
4.  Beri nama project: **Bandung Motor**.
5.  Klik **Continue**. Matikan *Google Analytics* (biar lebih cepat setupnya), lalu klik **Create Project**.
6.  Tunggu sebentar, lalu klik **Continue**.

## 2. Daftarkan Aplikasi Web
1.  Di halaman dashboard project, klik tombol ikon **Web** `</>` (lingkaran putih di bawah tulisan "Get started by adding Firebase to your app").
2.  Isi **App nickname**: `Web Bengkel` (bebas).
3.  Klik **Register app**.

## 3. Salin Config (Bagian yang kamu cari)
1.  Setelah register, akan muncul kode script.
2.  Cari bagian `const firebaseConfig = { ... };`.
3.  **Copy** text di dalam kurung kurawal `{ ... }` itu (termasuk `apiKey`, `authDomain`, dll).
4.  **Paste** ke file `src/lib/firebase.js` di VS Code kamu, menggantikan tulisan placeholder yang ada.

---

## ⚠️ PENTING: Wajib Aktifkan Database & Auth
Agar aplikasi bisa jalan (bisa simpan barang & login), kamu **HARUS** melakukan ini juga di Firebase Console:

### A. Aktifkan Firestore (Database)
1.  Di menu kiri, klik **Build** > **Firestore Database**.
2.  Klik **Create database**.
3.  Location: Pilih default saja (atau `asia-southeast2` jakarta kalau ada).
4.  **Rules**: Pilih **Start in test mode** (Penting! supaya aplikasi langsung bisa baca-tulis data).
5.  Klik **Create**.

### B. Aktifkan Authentication (Login)
1.  Di menu kiri, klik **Build** > **Authentication**.
2.  Klik **Get started**.
3.  Di tab **Sign-in method**, pilih **Email/Password**.
4.  Aktifkan togle **Enable**.
5.  Klik **Save**.
6.  (Saran) Klik tab **Users** > **Add user** untuk bikin akun admin pertama.
    *   Email: `admin@bandungmotor.com`
    *   Password: `admin123`
    *   (Nanti kamu pakai akun ini untuk login di aplikasi).

Setelah semua itu selesai, coba jalankan `npm run dev` di VS Code dan login! 🚀
