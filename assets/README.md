# Aset Upahgo

Versi 1.0, 17 November 2026. **Logo pilihan pengguna sudah diterapkan.** Figur bertopi, celemek emas, sapuan putih, bidang hijau dipertahankan. [Preview brand](previews/brand.png). PNG asli disimpan utuh; wordmark pendamping dan aturan pemakaian merupakan usulan turunan. Master logo vektor belum tersedia.

Rujukan: [DESIGN.md](../DESIGN.md), [SCREENS.md](../SCREENS.md), [brief produksi](PROMPTS.md), [hasil](PRODUCTION.md), [katalog](catalog.json), [sumber/lisensi](licenses/README.md). Token tunggal: [tokens.json](../design/tokens.json), versi 1.0.0.

## Struktur

```text
assets/
  brand/
    source/           PNG asli, wordmark live text, font berlisensi
    exports/          badge, emblem, lockup terang/gelap
      android/        enam kandidat integrasi native
  icons/
    source/material-rounded/   36 glyph SVG resmi
    source/markers/            empat marker SVG
    exports/                   36 SVG currentColor, 12 PNG marker
  previews/           tiga papan statis, bukan bundle aplikasi
  licenses/           register sumber, Apache-2.0, OFL-1.1
  build.py            produksi deterministik lokal
  verify.py           hash, subset SVG, PNG, alpha
  catalog.json        file aktual dan provenance
```

Tidak ada folder ilustrasi kosong atau arsip draf ditolak. Katalog memuat **41 rekaman**, **106 file berhash**, **77 SVG**, **26 PNG**, satu font dan dua lisensi. PNG mencakup satu sumber, 22 turunan dan tiga preview. Dua papan desain di design/ merupakan dokumentasi terpisah.

## Paket brand

Semua path berikut relatif terhadap assets/brand/. Dimensi px, bukan dp.

| File | Dimensi | Pemakaian / batas |
| --- | --- | --- |
| source/upahgo-logo-approved.png | 1254 × 1254 | Gambar pilihan asli; byte tidak diubah, margin putih asli dipertahankan |
| exports/upahgo-badge.png | 1024 × 1024 | Crop badge, alpha pada luar sudut hijau; figur putih tetap utuh |
| exports/upahgo-emblem.png | 1024 × 1024 | Figur dan sapuan, alpha di luar motif; gunakan pada latar hijau |
| source/upahgo-wordmark-candidate-v01.svg | viewBox 440 × 144 | Teks Upahgo, Roboto 700 hijau; editable, memerlukan font; bukan outline |
| exports/upahgo-lockup-light.png | 1000 × 256 | Badge + wordmark hijau untuk permukaan terang; usulan pendamping |
| exports/upahgo-lockup-dark.png | 1000 × 256 | Badge + wordmark putih untuk permukaan hijau; usulan pendamping |
| exports/android/launcher-icon.png | 1024 × 1024 | Bidang hijau persegi opak, emblem yang sama, tanpa mask sudut permanen |
| exports/android/adaptive-foreground.png | 1024 × 1024 | Emblem transparan dipusatkan; safe-zone geometris diperiksa, mask perangkat belum |
| exports/android/adaptive-background.png | 1024 × 1024 | Warna solid #014C24, opak |
| exports/android/adaptive-monochrome.png | 1024 × 1024 | RGB hitam, alpha motif; kandidat themed icon, bukan versi cetak |
| exports/android/play-store-icon.png | 512 × 512 | PNG opak; persyaratan store perlu verifikasi saat rilis |
| exports/android/splash-mark.png | 1024 × 1024 | Motif transparan; native mengatur latar/ukuran, tanpa delay |

Logo dipilih secara visual; tidak ada bukti lisensi upstream atau hak merek eksklusif. Lihat register sumber. Turunan raster tidak diklaim sebagai logo vektor. Material UI tidak memakai figur logo sebagai ikon fungsi.

## Ikon fungsi

36 **Material Symbols Rounded**, optical size 24, weight 400, GRAD 0, FILL 0. [Contact sheet](previews/ui-icons-v01.png). SVG resmi dan lisensi dipertahankan; ekspor menambahkan fill currentColor. Bukan ikon yang dihasilkan AI. Pemetaan per glyph dan URL sumber ada di katalog.

| Kelompok | Glyph aktual | Pemakaian |
| --- | --- | --- |
| Navigasi | home, list_alt, notifications, person | Beranda, aktivitas, pemberitahuan, akun sesuai SCREENS |
| Kembali/pilih | arrow_back, close, chevron_right, expand_more | Back, tutup, detail, picker |
| Temukan | search, filter_list, location_on, my_location, map, format_list_bulleted | Cari area, filter yang tersedia, lokasi, dua mode dan alternatif daftar |
| Kerja/upah | work, event, schedule, payments | Peran pemberi kerja, tanggal/zona, COD |
| Status | check, hourglass_empty, cancel, error_outline, info, warning_amber | Status dengan teks, bukan badge verifikasi |
| Bantuan | help_outline, report, block, more_vert | Bantuan, pengaduan, blokir, tindakan sekunder |
| Akun | edit, settings, logout, delete_outline | Edit, pengaturan, keluar, konfirmasi penghapusan |
| Pendukung | refresh, person_add, open_in_new, description | Retry, permintaan kontak, WhatsApp eksternal, dokumen |

Ikon 24 dp, metadata 20 dp, target sentuh minimal 48 dp. Aksi inti berlabel. Jangan menambah ikon per tag atau font glyph ganda. SVG tidak otomatis dirender React Native Image; adapter/versi dan tint harus diuji ketika stack tersedia. Jika runtime memakai pustaka glyph, hindari membundel jalur SVG dan font yang sama sekaligus.

## Marker

| Peran | Bentuk / warna | File |
| --- | --- | --- |
| Pekerja | Kepala membulat, person hijau, mint #E2F3E7 | source/markers/worker-default.svg, worker-selected.svg |
| Pemberi kerja | Kepala kotak lembut, work hijau, emas #E5C282 | source/markers/employer-default.svg, employer-selected.svg |

Path marker relatif terhadap assets/icons/. Ekspor map-{role}-{state}.png, @2x, @3x tersedia di icons/exports/: 48 × 56, 96 × 112, 144 × 168. [Preview marker](previews/map-markers-v01.png). Default outline 2, selected 3,5 unit. Warna, bentuk, glyph, label peran saling mendukung. Anchor usulan (0.5, 1), hit area, clipping, cluster dan kontras basemap perlu diuji pada SDK nyata. Marker padat tetap dapat diakses lewat daftar. Titik hanya area perkiraan; off/expired tidak ditampilkan. Tidak ada pulse atau angka cluster statis rekaan.

## Penerapan halaman

| Halaman | Aset dan komponen |
| --- | --- |
| S-01 onboarding | Badge/lockup, teks, pilihan peran; tanpa batch ilustrasi |
| S-02/S-03 masuk | Wordmark seperlunya; form nomor/OTP native tetap fokus |
| S-04/S-11/S-15 profil | person, edit, lokasi, tag teks; tanpa foto pekerja palsu |
| S-05/S-23 penemuan | map/list, location, search, marker, WorkerCard/EmployerCard |
| S-24 detail publik | Label peran, seluruh tag, Hubungi; bukan logo sebagai avatar |
| S-25/S-26 kontak | person_add, status, penjelasan nomor, open_in_new setelah consent |
| S-06 sampai S-12 alur kerja | work, event, schedule, payments, status sesuai konteks |
| S-13 sampai S-22 akun/bantuan | Glyph fungsi sesuai tabel; teks/retry untuk state |
| A-01 sampai A-05 / W-01 sampai W-04 | Ikon relevan yang sama; logo seperlunya; belum aplikasi admin/web |

Splash memakai splash-mark. Screenshot store nantinya berasal dari aplikasi yang berjalan. Onboarding kini memakai diagram UI native yang ditulis di apps/mobile/src/OnboardingArt.tsx, berlabel ilustrasi sintetis; bukan raster/media katalog baru. Ilustrasi empty, maskot, foto dan feature graphic belum diproduksi. Tidak ada rekaman ilustrasi tanpa file. Tidak membuat logo WhatsApp tiruan, tiles peta, sertifikasi, rating, bukti bayar atau pengguna rekaan.

## Produksi ulang dan verifikasi

Pemeriksaan tanpa instalasi:

```sh
python3 assets/verify.py
python3 design/verify.py
```

Produksi memerlukan runtime lokal dengan Pillow, numpy, serta Node/sharp. Tidak ada unduhan otomatis:

```sh
python3 assets/build.py --node /path/to/node
python3 design/verify.py --write-report --render-preview --node /path/to/node
python3 assets/verify.py --pixels
```

NODE_PATH harus menunjuk modul lokal jika sharp tidak teresolusi. build.py menulis turunan/logo/marker dan katalog; render menulis lima board dan memperbarui hash preview. Jalankan berurutan. Sumber user PNG dipertahankan; alpha memisahkan putih luar yang terhubung tepi, bukan menghapus semua warna putih. Self-check menolak crop berbeda dan margin yang gagal dihapus.

Bundle hanya ekspor terpakai, bukan source/font/preview. Lisensi distribusi tetap disertakan sesuai pemakaian. Hash dan byte bukan bukti performa, safe area, aksesibilitas, keamanan, atau kelulusan Google Play. Rincian bukti/batas di PRODUCTION.md.

## Pembaruan aset aktivitas — 18 November 2026

11 glyph aktivitas Material resmi ditambahkan: cleaning_services, water_drop, inventory_2, kitchen, window, checkroom, countertops, bathtub, local_laundry_service, mop, water_bottle_large. Total 47 ikon UI. Sumber URL, hash dan normalisasi tint ada di assets/catalog.json (relatif root proyek); Apache 2.0. Sumber Material master belum dipin commit; hash lokal mencatat bytes yang diperiksa. Hasil verifier terbaru 52 rekaman, 128 hash, 99 SVG, 26 PNG; tujuh self-check unsafe SVG ditolak, pixel check lulus menurut pelaksana utama. Angka inventaris sebelumnya historis; papan preview tetap 36 ikon, tidak diregenerasi.

Delapan raster ilustrasi Stage A belum diproduksi, manifest ActivityMedia kosong: pictogram adalah fallback sementara, bukan cover ilustrasi selesai. Generator diizinkan tidak tersedia, tidak ada fallback berbayar. Tidak ada foto orang nyata dibuat/diimpor. Fixture JPEG bidang warna/EXIF sintetis hanya tes, bukan aset publik. Diagram onboarding native yang ada dipertahankan. Hak upstream logo masih belum terverifikasi.
