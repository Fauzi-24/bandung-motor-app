# Panduan Membuat Aplikasi Android (APK)

Panduan ini menjelaskan cara build aplikasi Bandung Motor menjadi file APK yang siap diinstall di HP Android.

## Prasyarat

Pastikan software berikut sudah terinstall di komputer Anda:

1.  **Node.js** (Sudah terinstall)
2.  **Android Studio** (Wajib untuk build final)
    - Download: [https://developer.android.com/studio](https://developer.android.com/studio)
    - Saat instalasi, pastikan mencentang **Android SDK** dan **AVD (Android Virtual Device)**.

## Langkah-langkah Build

### 1. Update Project Web
Setiap kali Anda mengubah kode website (file `.jsx`, `.css`, dll), cukup jalankan perintah ini di terminal VS Code:

```bash
npm run android
```

Perintah ini akan otomatis:
1.  Build ulang website (`npm run build`) -> Menghasilkan folder `dist`
2.  Copy file terbaru ke project Android (`npx cap sync`)
3.  Membuka Android Studio secara otomatis (`npx cap open android`)

### 2. Build APK di Android Studio
Setelah Android Studio terbuka:

1.  Tunggu proses **Gradle Sync** selesai (lihat loading bar di bawah kanan).
2.  Di menu bagian atas, klik **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3.  Tunggu proses build selesai.
4.  Akan muncul notifikasi "APK(s) generated successfully". Klik **locate** pada notifikasi tersebut.
5.  Folder akan terbuka berisi file bernama `app-debug.apk` (atau `release`). File inilah yang bisa Anda kirim ke HP Android dan install.

## Troubleshooting

### Error: "JAVA_HOME is not set"
Jika muncul error ini saat menjalankan `npx cap sync` atau `npm run android`, artinya Java Development Kit (JDK) belum terdeteksi.
- Pastikan JDK sudah terinstall (biasanya terinstall bersama Android Studio).
- Set Environment Variable `JAVA_HOME` ke folder instalasi JDK Anda.

### Error: "SDK location not found"
- Buka file `android/local.properties` (jika ada) dan pastikan path `sdk.dir` benar.
- Jika file tidak ada, Android Studio biasanya akan membuatnya otomatis saat dibuka pertama kali.
