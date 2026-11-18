# Rating di kanan harga

Riwayat slice sebelumnya. Layout aplikasi terbaru memakai dua kartu per baris, lihat [review terbaru](two-column-cards.md).

18 November 2026. Koreksi lanjutan kartu horizontal: rating tetap ada di kanan nominal; “Bisa nego” tampil sebagai teks hijau gelap tanpa kotak. Gambar layanan 80 dp di kanan tengah, avatar tonal, border tipis dan komposisi terpilih tetap.

Impeccable Operate primary, antislop during dari preferensi global terverifikasi, ponytail full. Arah Ceria dan Design Read existing tetap: ENERGY 3 / RHYTHM 2 / MOTION 2. Teks nego 13/20 semibold membedakan status harga dari tag kebutuhan tanpa menyerupai tombol. Rating 13/20 lebih tenang daripada nominal 22/28. Baris membungkus pada ruang sempit/teks besar, rating tetap rata kanan. Bintang 24 dp memakai token `ratingStar`/`ratingStarOutline` emas pada seluruh shared Star, termasuk detail dan pilihan penilaian, sesuai preferensi pengguna. Nilai/jumlah ulasan tetap berasal data, tanpa nilai palsu ketika belum dinilai.

## Bukti dan batas

- Typecheck, lint, ekspor web lulus. Ekspor Android Hermes 4,5 MB lulus; bukan APK/AAB atau runtime perangkat.
- Playwright terarah core/prices: **2/2 lulus dalam 36,9 detik**, pageErrors kosong. Empat lebar 320/412/840/1440: rating di kanan nominal, pusat vertikal sejajar, fill emas, nego transparan satu kali, gambar 80×80 kanan tengah, harga di bawah isi, kolom responsif dan tanpa overflow. Alur harga maksimum/kosong tetap lulus.
- Click-through: demo/peran/lokasi, filter pekerjaan/radius/kecamatan, kosong/reset, peta/cluster/daftar, kartu membuka profil, ganti aktor, edit harga/validasi, consent dua pihak, usulan upah/tinjau/edit/rincian kerja dan persetujuan. Pemisahan kontak, proposal dan COD tidak berubah.
- Studi revisi lulus lima kasus: 960/412/320, teks 200% dan nama/tag panjang; tanpa overflow/error/request eksternal. Pada teks 200% rating turun baris di kanan dan nominal tetap terbaca utuh. `design/profile-card-variants/verification.json`: teks minimum 5,628:1; outline ikon minimum 3,774:1 pada panel netral.
- `python3 design/verify.py --write-report`: seluruh check dan **34 pasangan kontras lulus**, termasuk dua outline bintang dan teks nego di putih. Fill emas bukan satu-satunya penanda rating: outline kontras dan angka/jumlah ulasan tetap ada.
- Satu batch inspeksi visual: kartu aplikasi 320/412, studi kartu 2, studi teks 200%. Tidak ditemukan defect tambahan; tanpa batch perbaikan visual. Bukti: `horizontal-card/card-{320,412,840,1440}.png` dan `design/profile-card-variants/captures/{card-2,text-200-percent-320}.png`.
- Mechanical layout detector tidak dijalankan ulang: pada slice sebelumnya launcher menyatakan engine belum terpasang/cache tidak dapat dibuat. Tidak memasang engine. Penilaian layout manual dan browser terarah digunakan; detector tetap UNVERIFIED.
- Tidak mengubah domain, SQL, API, consent, penyimpanan atau pengiriman uang. Unit/domain, DB/Edge/Worker, audit dependensi dan suite web penuh tidak diulang. Android runtime/fontScale/TalkBack, jaringan live serta kesiapan rilis tetap belum diverifikasi.

## Delivery Gate

PASS dibatasi pada source dan Chrome yang diperiksa, bukan jaminan Android/live. N/A berarti teknik/flow tidak ada pada slice.

### 1. Hard Gate

| Item | Hasil dan bukti |
| --- | --- |
| R-02 | PASS: copy Indonesia pendek, tanpa em dash baru. |
| R-03 | PASS Chrome: empat lebar aplikasi/lima kasus studi; rating/nominal sejajar, teks besar membungkus tanpa memecah digit. Native belum diuji. |
| R-17, R-18, R-38 | PASS: harga/rating dari data existing; demo tetap sintetis; tanpa statistik/testimonial/foto orang baru. |
| R-23 | PASS: aset existing, perubahan emas dan posisi rating diminta pengguna. |
| R-24, R-26 | PASS: kartu satu aksi membuka profil, caller harga dan seluruh click-through tercatat lulus; tidak ada tombol palsu baru. |
| R-25 | PASS: 34 pasangan token; teks ≥5,628:1 dan outline emas ≥3,774:1 pada studi; background/foreground sama dengan aplikasi. |
| R-27 | PASS source/subset runtime: loading/error/retry parent tidak berubah, harga kosong/validasi/filter kosong diuji. Rating tanpa data menampilkan outline + Belum dinilai pada source; cabang itu belum dipicu runtime. |
| R-28 | N/A: tidak ada FAQ. |
| R-32 | PASS source: semantik button existing, nama aksesibilitas kini mencakup rating/jumlah, ikon dekoratif hidden, tanpa kontrol baru. Pointer flow lulus; keyboard spesifik kartu dan TalkBack tidak diuji ulang. |
| R-33 | PASS: edit langsung source; generator studi hanya memasukkan aset/font/token. |
| R-34 | N/A: light Ceria, tanpa toggle. |
| R-35 | PASS: ekspor web/Hermes dan dua skenario aktual lulus; runtime native belum diuji. |
| R-36, R-37 | PASS: tanpa klaim baru, arah existing dan koreksi pemilik dibaca sebelum edit. |

### 2. Purpose-Gate

| Item | Hasil dan alasan |
| --- | --- |
| R-01, R-04 | PASS: emas mengidentifikasi penilaian; rumah/orang/objek layanan tetap sesuai isi, tanpa gradient atau glyph dekoratif baru. |
| R-06 | PASS: Roboto/platform sans Android existing, nominal lebih kuat daripada rating/status. |
| R-07, R-08 | PASS: tanpa pola latar atau panah dekoratif. |
| R-09 | PASS: status nego kini teks biasa tanpa badge; tag tetap menyatakan kebutuhan pekerjaan. |
| R-10, R-12, R-13 | PASS: tanpa glass, shadow baru atau glow. |
| R-14 | PASS: kartu profil ekuivalen untuk perbandingan, layout terpilih dipertahankan. |
| R-19 | PASS: feedback existing, tanpa gerak/dependency baru. |
| R-22 | PASS: artwork lama terkait layanan, bukan ilustrasi generik baru. |

### 3. Liveliness

PASS: dials 3/2/2 dinyatakan dan tetap konsisten; nama/avatar memimpin, nominal menjadi fokus panel bawah, rating pendukung. Whitespace memisahkan identitas/status/tag/harga. Emas hanya untuk penilaian, hijau gelap untuk nego. Motif Ceria berupa avatar tonal dan objek layanan tetap. Design Read dan alasan struktur ditetapkan sebelum edit, tidak mengganti identitas.

### 4. Craftsmanship dan consistency locks

PASS C-1/R-31: warna/status/posisi/ukuran memiliki alasan di atas. PASS C-2: satu kartu satu aksi, caller teruji. PASS C-3/R-05: isi kebutuhan produk, tanpa template baru. PASS C-4 pada cakupan Chrome; native belum diverifikasi. PASS C-5: tidak menambah klaim/data nyata. PASS R-11: radius komponen existing, nego tanpa container baru. PASS R-15/R-16: tanpa CTA generik/buzzword. PASS R-20/R-30: identitas Upahgo/aset asli. PASS R-21: light sesuai brief. PASS R-29: dua token emas semantik, warna lain existing. Detector layout terpisah tetap belum terverifikasi.
