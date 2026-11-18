# Konsep profil dan harga

Pengguna memilih total **per pekerjaan/sesi**. Konsep mempertahankan latar avatar, merapikan tag dan rincian, menampilkan harga awal serta alur usulan upah setelah izin kontak.

- [Preview tiga layar](overview.png)
- [Prototipe interaktif mandiri](index.html)
- [Brief dan batas implementasi](BRIEF.md)
- [Review, bukti, Delivery Gate](REVIEW.md)
- [Hasil verifikasi](verification.json)

Semua nama, ulasan dan harga sintetis. Prototipe di folder ini tidak mengirim kontak/tawaran, tidak memindahkan uang, tidak menyimpan draf setelah reload.

Konsep kini sudah diimplementasikan pada aplikasi React Native dan kontrak harga lokal/SQL. Aplikasi memakai izin kontak dan kesepakatan existing; detail perubahan, verifikasi dan batas live pada [review implementasi](../../.impeccable/review/profile-pricing-implementation.md). Coba aplikasi pada http://localhost:8081, berbeda dari prototipe HTML folder ini.

Bangun ulang dari root dengan Node 22:

```sh
node design/profile-pricing/build.mjs
node design/profile-pricing/verify.mjs
```

Verifier memakai Playwright existing dan Google Chrome lokal; dapat dioverride dengan `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. Preview dapat disajikan hanya dari folder ini dengan server statis lokal. Android dan integrasi live belum diuji.
