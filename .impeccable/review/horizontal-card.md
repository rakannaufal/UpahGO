# Kartu horizontal terpilih

Arsip slice pertama. Koreksi berikutnya mempertahankan rating di kanan harga dan mengubah nego menjadi teks tanpa kotak. Bukti terbaru: [price-rating.md](price-rating.md); captures kartu pada folder horizontal-card kini merekam revisi terbaru.

18 November 2026. Pengguna memilih alternatif 2 dan meminta rating pada kartu diganti “Bisa nego”, gambar layanan besar di kanan tengah. Slice ini menerapkan pilihan itu pada `PersonCard` bersama untuk Beranda dan daftar Temukan. Konsep alternatif tetap tersimpan pada `design/profile-card-variants`.

## Keputusan dan cakupan

Mode Operate; arah Ceria existing, ENERGY 3 / RHYTHM 2 / MOTION 2. Impeccable primary, antislop during global preference, ponytail full. Avatar tonal 48 dp memimpin identitas; nego dan tag dikelompokkan di kiri; ServiceArt existing 80 dp di kanan, sejajar tengah baris; panel netral bawah memisahkan harga 22/28. Border lembut 1 dp dan radius 20 existing tetap. Satu kolom pada ruang daftar <600 dp/fontScale ≥1,5; dua pada ruang lebar, agar label dan artwork tidak berebut lebar telepon.

Label nego berasal `priceNegotiable` dan harga non-null, bukan hasil rating; hanya satu pada kartu. Badge mint/hijau gelap tanpa pensil dipakai juga oleh shared ProfilePrice. Rating tetap tersedia pada detail/ulasan. Nama/area boleh membungkus, nama aksesibilitas kartu menyertakan harga, satuan dan kesediaan nego. Tidak menambah kontak otomatis, tawaran, foto identitas, klaim atau otoritas client.

Perubahan: PersonCard.tsx, ProfilePresentation.tsx, tes core layout, studi HTML terpilih, DESIGN.md/README.md/TESTING.md. Tidak mengubah schema, API, consent, COD, sesi atau penyimpanan. Tidak ada instalasi, upload desain, publikasi, commit atau migrasi.

## Bukti

- `npm run typecheck`, `npm run lint`, `npm run build:web`: lulus.
- `npm run build:android`: ekspor Hermes 4,5 MB lulus; bukan APK/AAB atau runtime perangkat.
- Playwright target `responsive horizontal cards` dan `profile price edits`: **2/2 lulus, 33,5 detik**. Ukuran 320/412/840/1440, satu/dua kolom sesuai ruang, gambar 80×80, pusat vertikal tepat, label nego satu kali, rating tidak tampil pada kartu, harga di bawah isi, tanpa overflow dokumen. Harga maksimum Rp50 juta dan harga kosong diuji dalam alur existing.
- Click-through aktual: masuk demo/pilih peran/lokasi; kartu membuka profil; filter pekerjaan/radius/kecamatan, kosong dan reset; peta/cluster/daftar; ganti aktor; edit harga dan validasi; izin kontak dua pihak; tawar, tinjau/edit, lanjut rincian kerja dan persetujuan. Hasil kontak, proposal dan COD tetap terpisah; pageErrors kosong pada dua skenario.
- Studi statis revisi: lima kasus 960/412/320, teks 200% pada 320, nama/tag panjang; tanpa overflow/pageErrors/request eksternal. Label nego menggantikan rating hanya pada alternatif 2, artwork 80 px; lainnya tetap 40 px. `design/profile-card-variants/verification.json`: teks minimum 5,628:1; outline ikon minimum 4,080:1. Aplikasi memakai pasangan token teks/badge yang sama; tidak ada warna teks baru.
- Satu batch inspeksi visual: kartu aplikasi 320/412, kartu konsep terpilih, halaman daftar pekerja 412. Tidak ditemukan defect tambahan; tanpa batch perbaikan visual. Bukti aplikasi `horizontal-card/card-{320,412,840,1440}.png`, halaman pekerja `profile-pricing/cards-412.png`; konsep `design/profile-card-variants/captures/card-2.png`.
- Pemindai layout Impeccable **tidak berjalan**: launcher mengembalikan engine 0.1.14 belum terpasang dan cache tidak dapat dibuat. Tidak menginstal engine. Penilaian struktur manual dan assertion browser dilakukan; mechanical scan tetap UNVERIFIED.
- Unit/domain, DB, Edge, Worker, dependency audit dan seluruh suite web tidak diulang; tidak ada perubahan domain/backend. Android runtime, fontScale/TalkBack perangkat, sentuhan/Back/insets tetap UNVERIFIED. Ekspor Hermes tidak menutup batas rilis native/live pada TESTING.md.

## Delivery Gate

Semua PASS berikut terbatas pada source dan preview Chrome yang dijalankan. N/A tidak berarti target native telah diverifikasi.

### 1. Hard Gate

| Item | Bukti |
| --- | --- |
| R-02 copy | PASS: label baru pendek dalam bahasa Indonesia, tanpa em dash. |
| R-03 containment | PASS Chrome: 4 lebar aplikasi, 5 kasus konsep; posisi artwork/harga dan digit nominal diperiksa. Native text scaling belum diuji. |
| R-17 angka, R-18 ulasan, R-38 truth | PASS: harga tetap input pemilik; seluruh profil/angka pengujian berlabel demo sintetis; tidak membuat ulasan atau statistik nyata. |
| R-23 aset | PASS: objek layanan dan avatar existing, diposisikan/diperbesar sesuai instruksi pengguna. |
| R-24 navigasi | PASS: kartu satu target membuka profil, filter dan map/list existing bekerja. |
| R-25 kontras | PASS pada pasangan token terpakai: teks ≥5,628:1 pada verifier studi; UI label/nominal aplikasi memakai warna dan permukaan sama. Border dekoratif bukan indikator status. |
| R-26 kontrol | PASS: tidak menambah tombol bersarang; alur interaktif yang berubah dan caller harga berjalan pada daftar click-through di atas. |
| R-27 states | PASS source/subset runtime: parent loading/error/retry tidak berubah; filter kosong/reset, harga kosong dan validasi/pending kontak dijalankan. Kegagalan jaringan live tidak diuji ulang. |
| R-28 FAQ | N/A: tidak ada FAQ. |
| R-32 aksesibilitas | PASS source: button native existing, nama aksesibilitas memuat informasi harga/nego, artwork dekoratif disembunyikan. Aktivasi kartu dengan pointer diuji; keyboard fokus existing tidak diubah. TalkBack/native belum diuji. |
| R-33 source | PASS: edit langsung pada source; build studi hanya menyisipkan aset/font/token. |
| R-34 tema | N/A: light Ceria tetap, tanpa toggle baru. |
| R-35 runtime | PASS Chrome dan export: dua skenario lulus, pageErrors kosong; belum runtime Android. |
| R-36 klaim | PASS: tidak menambah klaim keamanan, pembayaran atau pendapatan. |
| R-37 arah | PASS: DESIGN.md existing, alternatif 2 yang dipilih, koreksi pengguna menjadi authority. |

### 2. Purpose-Gate

| Item | Alasan/bukti |
| --- | --- |
| R-01 warna | PASS: mint menandai nego, putih untuk identitas, panel netral untuk harga; tanpa gradient/glow. |
| R-04 ikon | PASS: rumah/orang untuk profil, objek layanan untuk tag; tidak menambah ikon generik atau pensil nego. |
| R-06 tipe | PASS: Roboto/platform sans Android existing; 16/22 identitas, 13/20 lokasi, 12/18 tag, 22/28 nominal. |
| R-07 pola | PASS: tidak ada pola latar dekoratif. |
| R-08 panah | PASS: tidak ada panah/CTA tambahan. |
| R-09 badge | PASS: kesediaan nego berasal data pemilik; bukan klaim verifikasi, bukan tombol. |
| R-10 glass, R-12 shadow, R-13 glow | PASS: tidak digunakan. |
| R-14 pengulangan kartu | PASS: daftar profil ekuivalen untuk membandingkan kebutuhan dan anggaran; satu kolom pada telepon menjaga kepadatan. |
| R-19 motion | PASS: ripple/reveal existing, tidak ada animasi dekoratif atau dependency baru. |
| R-22 ilustrasi | PASS: sapu/pel/dapur/kardus existing menjelaskan layanan aktual di tag. |

### 3. Liveliness

| Item | Bukti |
| --- | --- |
| Dials | PASS: 3/2/2 dinyatakan; Operate mempertahankan energi pada artwork, feedback pada kontrol existing. |
| Konsistensi | PASS: identitas Ceria tidak diganti, informasi uang tetap tenang. |
| Fokus | PASS: nama/avatar memimpin, status nego/tag kedua, harga terpisah bawah. |
| Ruang | PASS: gap 4 identitas, 10 nego/tag, 12 gambar/teks, 16 isi/baris; panel harga terpisah pemisah 1 dp. |
| Aksen | PASS: mint/hijau gelap mengidentifikasi nego, gambar berwarna menjadi satu fokus visual pendukung. |
| Motif | PASS: avatar tonal, objek kerja berwarna, border lembut dan Roboto tetap. |
| Design Read | PASS: arah dibaca sebelum edit; spatial thesis dinyatakan pada komentar awal dan dicatat di atas. |

### 4. Craftsmanship dan consistency locks

| Item | Bukti |
| --- | --- |
| C-1, R-31 intentionality | PASS: setiap ukuran, grouping, warna dan perubahan kolom mempunyai alasan di atas/DESIGN.md. |
| C-2 functional completeness | PASS: satu kartu satu aksi; caller detail/harga dan alur negosiasi teruji. |
| C-3, R-05 content | PASS: komponen profil yang dipilih pengguna, tanpa template halaman atau bagian dekoratif baru. |
| C-4 resilience | PASS Chrome pada cakupan tercatat; native/device states tetap belum diverifikasi. |
| C-5 evidence | PASS: tidak membuat klaim atau data produksi baru. |
| R-11 radius | PASS: kartu 20, avatar bulat, tag 8, label 6 sesuai fungsi. |
| R-15 CTA, R-16 copy | PASS: aksi Lihat profil existing, copy faktual, tanpa slogan/CTA generik. |
| R-20 identity, R-30 clone | PASS: warna/aset merek Upahgo; tidak menyalin produk/logo/layanan Gojek. |
| R-21 tema | PASS: light theme yang diminta. |
| R-29 palet | PASS: tidak menambah warna; gambar mempertahankan warna sumber. |
