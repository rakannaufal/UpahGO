# Produksi Aset Upahgo

17 November 2026. **Logo pilihan pengguna diterapkan; belum aplikasi atau rilis Android.** Tidak membuat konsep baru, tidak memakai model gambar/API berbayar, tidak mengunggah lampiran.

## Hasil aktual

| Kelompok | Hasil | Status |
| --- | --- | --- |
| Sumber logo | PNG asli 1254 × 1254, 1.153.831 byte; SHA-256 di katalog | User-selected; upstream hak belum diberikan |
| Brand | Badge, emblem alpha, dua lockup pendamping, enam kandidat native | 10 PNG turunan; master tetap raster |
| Wordmark | SVG live text Roboto 700 hijau, font sumber dan OFL | Usulan pendamping, belum outline |
| UI | 36 sumber SVG resmi dan 36 ekspor currentColor | Apache-2.0; runtime adapter belum dipilih |
| Marker | Empat SVG, 12 PNG pada 1x/2x/3x | Dua peran, default/selected, palet sinkron |
| Preview aset | Brand, ikon, marker | Tiga gambar statis diperiksa |
| Preview desain | Fondasi/komponen; onboarding/peta/kontak | Dua gambar statis di design/, bukan aplikasi |

[Catalog](catalog.json): 41 rekaman, 106 file berhash, 77 SVG, 26 PNG, satu font dan dua lisensi. PNG mencakup satu sumber, 22 turunan dan tiga preview aset. Tidak ada rekaman ilustrasi tanpa media.

## Metode dan bukti

Sumber PNG disalin tanpa perubahan byte. Badge menghilangkan margin putih luar yang terhubung tepi; figur putih di dalam dipertahankan. Emblem memisahkan hijau dengan chroma matte. Tidak menebak ulang geometri menjadi SVG. Lockup memakai font berlisensi yang sudah tersedia; label wordmark usulan tetap eksplisit.

Launcher/Play memakai bidang hijau persegi tanpa mask sudut permanen. Adaptive foreground alpha dipusatkan; piksel motif diperiksa secara geometris di radius maksimum 313 pada kanvas 1024. Ini bukan bukti mask/perangkat native. Monochrome memakai RGB hitam dan alpha motif, bukan screenshot grayscale. Splash menggunakan motif yang sama, bukan poster atau animasi startup.

Marker dibangun dari glyph resmi person/work serta bentuk yang sama dengan sebelumnya, membaca token 1.0.0: mint untuk pekerja, emas untuk pemberi kerja, outline/glyph hijau. Bentuk dan label membedakan peran; selected mempertebal outline. Ikon UI tetap satu keluarga; source path glyph tidak diubah.

Pillow/numpy dan Node/sharp lokal menghasilkan aset dan board; tanpa instalasi/unduhan. build.py memiliki self-check ukuran sumber, alpha luar, jumlah piksel emas, dan containment adaptive. Detachment buffer sebelum flood fill diperiksa dengan assertion sudut transparan, sehingga margin putih tidak ikut menjadi bagian emblem/mask. Original source tidak dimodifikasi.

## Pemeriksaan visual

[Brand](previews/brand.png), [ikon](previews/ui-icons-v01.png), [marker](previews/map-markers-v01.png), [fondasi](../design/preview.png) dan [layar](../design/screens-preview.png) diperiksa dalam satu putaran gabungan; perbaikan matte/sudut board dilakukan satu batch, lalu dikonfirmasi. Tidak terlihat teks terpotong atau tumpang tindih pada board final. Transparansi logo dilihat pada putih, mint, dan hijau; topi, celemek dan sapuan tetap terbaca. Sampel 40/48/64/96 px tidak membuktikan pengenalan calon pengguna.

Tiga layar hanya studi visual. Diagram area diberi label bukan peta nyata. Kartu profil memakai nama contoh, tidak ada foto/rating/testimoni. Tombol adalah bagian PNG, tidak diklaim dapat ditekan. Kontrak perilaku/state dimiliki DESIGN/SCREENS.

## Pemeriksaan lokal

Dijalankan:

```sh
python3 design/verify.py --write-report
python3 assets/verify.py
```

Pemeriksaan pixel tambahan dijalankan dengan Python lokal yang memiliki Pillow:

```sh
python3 assets/verify.py --pixels
```

Hasil: 29 pasangan kontras lolos; seluruh spesifikasi target sentuh/jarak/teks/window/motion dan sumber logo lolos. 41 ID unik, 106 hash cocok; 77 SVG dalam subset yang diizinkan, 26 PNG sesuai dimensi/byte/alpha, satu font dan dua lisensi tersedia. Tujuh sampel SVG berbahaya ditolak self-check. Media tidak terdaftar ditolak verifier. Ini bukan sanitizer umum atau audit aplikasi.

Turunan PNG brand total 1.781.869 byte, 12 PNG marker 33.080 byte; 36 SVG ekspor UI 19.981 byte. Ukuran tersebut bukan penggunaan RAM atau hasil performa. Sumber/font/preview tidak otomatis dibundel. Tidak menambah video/GIF/Lottie/runtime animasi.

## Pembersihan

Revisi ini menghapus 12 berkas logo draf sebelumnya beserta preview/turunannya, 210.456 byte, satu folder kosong. Total pembersihan dari otorisasi pengguna: **108 file, 1.011.348 byte, sembilan folder kosong**. Tidak membuat arsip baru. Ikon fungsi, marker, font, lisensi dan dokumen dipertahankan. Referensi di folder sementara pengguna tidak dihapus.

## Delivery Gate dan batas

[Delivery Gate lengkap](../design/REVIEW.md) mencakup empat blok dan seluruh aturan yang relevan. Lingkup PASS: spesifikasi, token, aset, serta board statis yang benar-benar diperiksa. Native tidak terverifikasi, bukan PASS rilis.

Belum diuji: build Android/Expo, launcher/adaptive masks/themed icon/splash, Play requirements, SVG runtime, TalkBack, fontScale, keyboard/Back/insets, responsivitas perangkat, SDK peta/anchor/clipping/atribusi, izin/expiry, consent/revoke, WhatsApp, COD, startup, RAM, baterai dan frame time. Hak upstream logo serta master vektor belum tersedia. Tidak ada klaim aman/unik/terverifikasi atau jaminan pembayaran.

## Diagram onboarding implementasi

OnboardingArt.tsx menyusun kartu, area dan consent/COD dari primitive native ringan. Konten berlabel ilustrasi sintetis, bukan screenshot layanan nyata. Tidak ada raster baru, perubahan logo, panggilan model berbayar atau upload; katalog media tetap 41 rekaman/106 hash. Export Hermes telah diperiksa pada tahap implementasi; pengenalan, fontScale dan render Android nyata tetap belum terverifikasi.

## Pembaruan aset aktivitas — 18 November 2026

11 glyph aktivitas Material resmi ditambahkan: cleaning_services, water_drop, inventory_2, kitchen, window, checkroom, countertops, bathtub, local_laundry_service, mop, water_bottle_large. Total 47 ikon UI. Sumber URL, hash dan normalisasi tint ada di assets/catalog.json (relatif root proyek); Apache 2.0. Sumber Material master belum dipin commit; hash lokal mencatat bytes yang diperiksa. Hasil verifier terbaru 52 rekaman, 128 hash, 99 SVG, 26 PNG; tujuh self-check unsafe SVG ditolak, pixel check lulus menurut pelaksana utama. Angka inventaris sebelumnya historis; papan preview tetap 36 ikon, tidak diregenerasi.

Delapan raster ilustrasi Stage A belum diproduksi, manifest ActivityMedia kosong: pictogram adalah fallback sementara, bukan cover ilustrasi selesai. Generator diizinkan tidak tersedia, tidak ada fallback berbayar. Tidak ada foto orang nyata dibuat/diimpor. Fixture JPEG bidang warna/EXIF sintetis hanya tes, bukan aset publik. Diagram onboarding native yang ada dipertahankan. Hak upstream logo masih belum terverifikasi.
