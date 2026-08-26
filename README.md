# Moklet Event Center

Aplikasi mobile untuk mengelola dan mengikuti kegiatan lomba di lingkungan SMK Telkom Malang. **Moklet Event Center (MEC)** menyediakan satu tempat bagi siswa, panitia, dan admin kesiswaan untuk mengakses event, pendaftaran lomba, pengumuman, serta data operasional.

Project ini adalah **frontend** berbasis React Native dan Expo. Data aplikasi diambil melalui REST API dari backend MEC.

## Fitur Utama

### Siswa

- Login menggunakan email dan password sekolah
- Registrasi akun dan verifikasi OTP
- Login atau registrasi menggunakan Google
- Melengkapi dan menghubungkan profil siswa
- Melihat event dan detail lomba
- Mendaftar lomba secara individu atau sebagai tim
- Melihat riwayat pendaftaran
- Mengelola dan melihat ruang tim
- Membaca pengumuman

### Panitia

- Dashboard operasional event
- Membuat, mengedit, dan mengelola event
- Mengatur cabang lomba dan jadwal
- Menambahkan atau menghapus anggota panitia
- Membuat dan mengelola pengumuman
- Melihat riwayat event

### Admin Kesiswaan

- Dashboard statistik aplikasi
- Mengelola data siswa
- Mengelola akun panitia
- Mengelola kelas
- Mengatur konfigurasi sistem

## Teknologi

- React Native `0.81.5`
- Expo SDK `54`
- Expo Router `6`
- React `19`
- TypeScript dengan mode strict
- Axios untuk komunikasi REST API
- Expo Secure Store untuk penyimpanan token di perangkat
- React Native WebView untuk alur Google OAuth
- React Native SVG untuk ikon SVG

## Prasyarat

Pastikan perangkat pengembangan sudah memiliki:

- Node.js versi LTS
- npm
- Git
- Android Studio dan Android SDK jika menjalankan native Android
- Emulator Android atau perangkat Android fisik
- Java Development Kit yang kompatibel dengan Android/Expo SDK yang digunakan

Untuk memeriksa instalasi Node dan npm:

```powershell
node --version
npm --version
```

## Instalasi

1. Clone repository dan masuk ke folder project:

```powershell
git clone <URL_REPOSITORY>
cd Moklet-Event-Center-Front-End
```

2. Install dependency:

```powershell
npm install
```

3. Buat file environment dari template:

```powershell
Copy-Item .env.example .env
```

4. Isi `.env` dengan URL backend yang aktif:

```env
EXPO_PUBLIC_API_URL=https://alamat-backend-anda.com
```

`EXPO_PUBLIC_API_URL` harus berupa alamat dasar backend tanpa path endpoint. Contoh endpoint login akan dibentuk oleh aplikasi dari alamat tersebut.

> File `.env` bersifat lokal dan tidak boleh di-commit. Template `.env.example` boleh di-commit agar anggota tim mengetahui nama variable yang diperlukan.

## Menjalankan Project

### Expo development server

```powershell
npx expo start
```

Setelah server berjalan, pilih salah satu cara berikut:

- Tekan `a` untuk membuka Android emulator
- Scan QR code dengan Expo Go pada perangkat fisik
- Tekan `w` untuk menjalankan versi web

Atau gunakan script npm:

```powershell
npm run start
npm run android
npm run ios
npm run web
```

### Membersihkan cache Expo

Jika perubahan `.env`, route, asset, atau dependency belum terlihat:

```powershell
npx expo start -c
```

Jika menggunakan native Android dan build bermasalah:

```powershell
cd android
.\gradlew clean
cd ..
npx expo start -c
```

## Google OAuth

Login Google menggunakan endpoint backend berikut:

```text
<EXPO_PUBLIC_API_URL>/auth/google
```

Backend akan mengarahkan user ke Google dan menangani callback melalui:

```text
<EXPO_PUBLIC_API_URL>your_url/auth/google/callback
```

Agar tidak terjadi error `redirect_uri_mismatch`, callback URL yang dikirim backend harus terdaftar persis pada **Authorized redirect URIs** di Google Cloud Console. Perhatikan protocol, domain, path, port, dan trailing slash.

Contoh:

```text
https://your_url/auth/google/callback
```

Konfigurasi Google OAuth berada di backend, sedangkan frontend hanya membuka endpoint dan membaca hasil callback melalui WebView.

## Struktur Project

```text
.
├── app/                  # Halaman dan route Expo Router
│   ├── (admin)/          # Area Admin Kesiswaan
│   ├── (panitia)/        # Area Panitia
│   ├── (tabs)/           # Area utama siswa
│   ├── login.tsx         # Login email/password
│   ├── register.tsx      # Registrasi akun
│   ├── google-oauth.tsx  # Alur Google OAuth
│   └── verify-otp.tsx    # Verifikasi OTP
├── components/           # Komponen UI yang dapat digunakan ulang
├── constants/            # Theme dan nilai konstanta aplikasi
├── context/              # State global, termasuk autentikasi
├── services/             # Client API dan fungsi request ke backend
├── assets/               # Logo, icon, dan asset aplikasi
├── app.json              # Konfigurasi Expo
├── package.json          # Dependency dan script project
└── tsconfig.json         # Konfigurasi TypeScript
```

Folder `services/` tetap merupakan bagian dari frontend. Isinya bertugas mengirim request ke backend, menyimpan token, menormalisasi respons, dan menangani error API. Folder ini tidak menjalankan server dan tidak mengakses database secara langsung.

## Alur Autentikasi

1. User memasukkan kredensial pada frontend.
2. Frontend mengirim request ke backend melalui Axios.
3. Backend memvalidasi kredensial dan mengembalikan token.
4. Token disimpan menggunakan Expo Secure Store.
5. Frontend mengambil profil user melalui endpoint `/auth/me`.
6. User diarahkan berdasarkan role: siswa, panitia, atau admin kesiswaan.

Token dan request terautentikasi dikelola melalui [services/api.ts](services/api.ts) dan [context/AuthContext.tsx](context/AuthContext.tsx).

## Perintah Pengembangan

```powershell
# Menjalankan development server
npm run start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web

# Cek tipe TypeScript
npx tsc --noEmit
```

## Troubleshooting

### API tidak merespons

- Pastikan `EXPO_PUBLIC_API_URL` benar.
- Pastikan backend sedang aktif dan dapat diakses dari perangkat.
- Jika memakai perangkat fisik, jangan gunakan `localhost` untuk backend yang berjalan di komputer lokal. Gunakan IP lokal komputer atau URL publik.
- Restart dengan `npx expo start -c` setelah mengubah `.env`.

### `redirect_uri_mismatch` saat login Google

Pastikan callback backend sudah didaftarkan di Google Cloud Console dan sama persis dengan URL yang dikirim backend.

### Route atau tab tidak ditemukan

Pastikan nama route mengikuti struktur file Expo Router. Sebagai contoh, halaman yang berada di `app/(panitia)/events/index.tsx` direferensikan sebagai route `events/index` pada custom tab navigator.

### Dependency native tidak terbaca

Setelah memasang atau mengubah dependency native, restart Expo. Jika menggunakan development build/native Android, rebuild aplikasi:

```powershell
npm run android
```

## Catatan Kontribusi

- Gunakan TypeScript dan pertahankan mode strict.
- Jangan commit `.env`, token, password, atau credential OAuth.
- Setelah mengubah dependency, commit `package.json` dan `package-lock.json` bersama-sama.
- Uji perubahan pada route dan role yang terdampak.
- Jalankan `npx tsc --noEmit` sebelum membuat pull request.

## Lisensi

Lihat file [LICENSE](LICENSE) untuk informasi lisensi project.
