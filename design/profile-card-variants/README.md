# Empat layout kartu profil

Studi komponen, 18 November 2026. Pengguna memilih alternatif 2, memperbesar gambar di kanan tengah, lalu mempertahankan rating di kanan harga. “Bisa nego” tampil di atas tag sebagai teks hijau gelap tanpa kotak. Revisi ini sudah diterapkan pada PersonCard aplikasi; alternatif 1/3/4 tetap arsip pembanding. Semua nama, harga, jarak, dan rating studi berlabel data sintetis.

Arahan: Ceria Operate dari `../../DESIGN.md`, ENERGY 3 / RHYTHM 2 / MOTION 2. Tidak ada animasi karena perbandingan statis. Impeccable sebagai workflow utama, antislop during sebagai filter, ponytail full untuk scope. Lane live-generate khusus web tidak dipakai untuk komponen native; HTML hanya lembar perbandingan, bukan runtime mobile baru.

1. Ilustrasi di atas: mempertahankan urutan profil lalu anggaran, lebih cocok untuk grid.
2. Profil horizontal (terpilih): label nego tanpa latar di atas tag, rating emas di kanan harga; gambar 80 px di kanan tengah. Aplikasi satu kolom pada compact, dua ketika ruang daftar ≥600 dp, kembali satu pada fontScale ≥1,5.
3. Harga sebagai fokus: menempatkan anggaran pertama saat pengguna membandingkan biaya.
4. Panel ilustrasi samping: memisahkan gambar dari kolom teks pada daftar.

Semua memakai Roboto lokal, token warna/border existing, avatar beralas, ikon rumah 24 px, ilustrasi sapu existing 40 px; khusus pilihan 2 ilustrasi 80 px tanpa latar. Bintang emas memakai fill `#F6BE3A`, stroke `#A7740C` agar batas bentuk terlihat di atas putih/panel netral. Label “Bisa nego” pilihan 2 berupa teks hijau gelap tanpa kotak, tidak menyerupai tombol, tanpa pensil atau tanda verifikasi. Pada aplikasi label mengikuti flag pemilik dan hanya tampil bila harga terisi. Tidak menambah foto identitas, klaim, tombol transaksi, atau data layanan nyata.

Alasan komposisi: border lembut 1 px memisahkan satu profil; jarak 4–8 px menyatukan metadata, 12–16 px memisahkan profil dan harga; font 12/13/16/22–24 menjaga hierarki tanpa font baru. Peach mengelompokkan gambar, mint menandai konteks harga/nego, emas khusus penilaian. Nomor 1–4 hanya alat memilih varian di luar kartu, bukan UI produk.

```sh
PATH=/opt/homebrew/opt/node@22/bin:$PATH node design/profile-card-variants/build.mjs
PATH=/opt/homebrew/opt/node@22/bin:$PATH node design/profile-card-variants/verify.mjs
python3 -m http.server 8094 --bind 127.0.0.1 --directory design/profile-card-variants
```

`index.html` mandiri, font/aset embedded tanpa request eksternal. Buka `http://127.0.0.1:8094/#option-2`. Hasil visual di `overview.png`; bukti studi di `REVIEW.md` serta `verification.json`. Implementasi React Native dan pemeriksaan web aplikasi terbaru dicatat pada `../../.impeccable/review/price-rating.md`. Runtime/fontScale Android belum terverifikasi.
