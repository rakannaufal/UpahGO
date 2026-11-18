# Konteks Produk Upahgo

Arahan visual aktif 18 November 2026: **Ceria**, disetujui pengguna untuk implementasi seluruh layar existing. Lihat [DESIGN.md](DESIGN.md) versi 2 dan `design/figcraft-fun`. Logo asli tetap; aksi hijau #087F52, canvas putih, objek layanan multicolor, ilustrasi peran besar. Catatan visual/ilustrasi tertunda di bagian historis bawah sudah digantikan oleh implementasi Ceria. Batas produk dan layanan live tetap berlaku.

<!-- impeccable:product-schema 1 -->

Konteks ringkas untuk pekerjaan desain. [prd.md](prd.md) tetap menjadi sumber keputusan produk dan aturan bisnis; tidak ada persetujuan fitur baru di sini.

## Platform

android

## Stack

Implementasi lokal: React Native + Expo + TypeScript, Supabase Auth/PostgreSQL, gateway Cloudflare Worker dan Durable Object. Preview web tersedia untuk demo sintetis. Belum di-deploy atau diuji pada Android. Lihat [ARCHITECTURE.md](ARCHITECTURE.md).

## Users

Pekerja serabutan/buruh harian yang mencari pekerjaan serta pemberi kerja yang membutuhkan tenaga. Pengalaman digital beragam.

## Product Purpose

Membantu kedua pihak menemukan satu sama lain melalui peta dan menghubungi untuk menyepakati pekerjaan. Kategori awal: bersih-bersih rumah; cakupan pendaftaran seluruh Indonesia.

## Capabilities and Constraints

Android menjadi platform pertama dengan rencana distribusi Google Play Store. Disepakati: peta pekerja aktif dan peta pemberi kerja aktif; marker membuka konteks dan Hubungi; permintaan diterima sebelum WhatsApp tersedia; pembayaran COD/tunai di tempat.

Disepakati tambahan: kartu pekerja dengan tag layanan yang dikerjakan dan kartu pemberi kerja dengan tag kebutuhan. Katalog nasional terstruktur; hanya enam tag bersih-bersih lama aktif pada live; default maksimal 5 pilihan untuk evaluasi, dua terlihat pada kartu dengan jumlah sisanya, seluruh tag/bio tersedia di detail. Tag merupakan pernyataan pengguna, bukan sertifikasi atau persetujuan kategori baru.

Slice lokal menerapkan tampil atas pilihan sadar, titik area perkiraan, GPS foreground wajib, radius dan batas kota tervalidasi server, daftar alternatif, serta izin nomor per pasangan yang terpisah dari kesepakatan kerja. Proposal tugas/jadwal/upah dan pencatatan COD tersedia sebagai implementasi untuk evaluasi. Publikasi pekerjaan/lamaran ditunda. Default expiry, batas nominal/tag, dan operasi pengaduan tetap perlu keputusan produk pada PRD. Layanan live belum siap: provider Google/Phone, direktori area, Maps key, migrasi dan deployment belum diselesaikan.

Implementasi UX lokal tersedia: Beranda grid dua kolom dari peran lawan; Temukan dengan peta, kelompok marker dan alternatif daftar; lima tab Beranda, Temukan, Aktivitas, Notifikasi, Akun; onboarding setelah login; pilih peran dan lokasi/radius wajib; profil boleh dilewati sesudahnya. Progress, peran dan lokasi/radius pencarian disimpan per akun, terpisah dari profil publik. Profil minimum dan nomor terverifikasi tetap wajib untuk tindakan publik. Satu peran aktif yang dapat diganti melalui Akun diterapkan untuk evaluasi, belum merupakan persetujuan kebijakan bisnis final. [Cakupan per halaman](design/UX-PLAN.md) membedakan implementasi dari rekomendasi dan batas verifikasi.

## Brand Commitments

Nama Upahgo. Brief: cerah, pekerja keras, clean, modern, fun, ramah pengguna, responsif, animasi ringan. Referensi UI mempertahankan bidang putih lapang dan kartu membulat.

Logo dipilih pengguna pada 17 November 2026: figur bertopi, celemek emas, sapuan melingkar putih, bidang hijau membulat. Gambar asli disimpan utuh. Hijau #014C24 dan emas #E5C282 disampel dari sumber; mint/putih, token, komponen dan wordmark pendamping merupakan rancangan turunan, bukan pilihan eksplisit setiap nilai. Tidak membuat alternatif logo baru. Draf ditolak dan turunannya dihapus sesuai permintaan, bukan diarsipkan. Tanpa API berbayar atau pengiriman sumber ke layanan eksternal.

## Evidence on Hand

Logo pilihan raster dan sistem desain 1.0, kode aplikasi/backend, pengujian lokal dan screenshot preview web pada `.impeccable/review/`. Tidak ada screenshot Android, data pengguna nyata, testimoni, atau hasil performa perangkat. Bukti dan batas verifikasi pada [TESTING.md](TESTING.md).

assets/ berisi PNG logo asli, 10 PNG turunan brand termasuk enam kandidat Android, wordmark live text Roboto 700, 47 glyph Material resmi (36 ikon UI awal + 11 glyph aktivitas), empat marker SVG dan 12 PNG marker, serta tiga papan aset. design/ memuat fondasi/komponen dan studi tiga layar statis. Master vektor logo belum tersedia; delapan ilustrasi aktivitas Stage A masih belum diproduksi, fallback pictogram sementara. Papan preview ikon lama tetap berisi 36 ikon. Path/hash/sumber ada di assets/catalog.json dan assets/licenses/README.md; hasil/batas di assets/PRODUCTION.md. Studi visual bukan bukti aplikasi berfungsi.

## Accessibility & Inclusion

Bahasa Indonesia lugas, token kontras terukur, target sentuh Android minimal 48 dp, semantik native dan reduced motion. Keyboard serta reflow diuji pada preview web. TalkBack, pembesaran teks, safe area, System Back, jaringan/background dan performa tetap membutuhkan perangkat Android.

## Slice GPS dan penilaian — 17 November 2026

Keputusan terbaru: lima tab tanpa judul badan berulang, dua kartu per baris, filter kecamatan/jenis pekerjaan, GPS foreground/radius wajib, hasil dalam radius dan kota GPS, peta geografis serta penilaian kedua pihak. Demo Pekanbaru berisi 12 profil sintetis + `demo-me` dan riwayat; batas OSM aktual. Nasional tetap tujuan, direktori live belum tersedia. Peran/lokasi wajib sebelum profil opsional. Aturan serta default evaluasi pada [prd.md](prd.md), privasi pada [SECURITY.md](SECURITY.md), bukti pada [TESTING.md](TESTING.md).

## Slice katalog, tenaga dan foto — 18 November 2026

Arah tetap native Operate (ENERGY 2 / RHYTHM 1 / MOTION 2), logo hijau/emas pilihan pengguna dan token yang sama. Lima tab tanpa judul badan berulang, dua kartu per baris; pencarian, kecamatan, kategori, jenis pekerjaan dan tenaga dibagi Beranda/Temukan dalam sesi per akun/peran, direset saat akun/peran berubah. GPS kota/radius, consent kontak, COD dan penilaian tetap berlaku.

`shared/job-catalog.json` memuat 128 pekerjaan/16 kategori; enam tag bersih-bersih lama aktif live. Demo mengaktifkan 18 tugas (J001–J016, galon dan kardus), bukan kategori live baru. Demo tetap **12 profil sintetis (6 per peran) + demo-me**, dengan konteks galon/kardus/cuci piring dan Ringan/Sedang/Berat/Perlu rincian. Entri katalog lain adalah rencana, bukan layanan tersedia. “Lainnya” mengirim usulan privat pending; tidak mengaktifkan kategori otomatis. Estimasi tenaga memakai konteks durasi, jumlah, beban, lantai/lift, jarak, pekerja dan alat; bukan batas angkat aman/penilaian medis. Kesepakatan menampilkan konteks dan review eksplisit sebelum kirim; COD terpisah.

Cover aktivitas masih pictogram Material resmi: manifest raster `ActivityMedia.tsx` kosong. Delapan ilustrasi Stage A belum dibuat; generator yang diizinkan tidak tersedia, fallback berbayar tidak diizinkan. Foto identitas/tempat opsional terpisah dari cover; galeri, crop, resize JPEG, preview, consent, draft dan hapus tersedia untuk evaluasi. Pending hanya terlihat pemilik, bukan persetujuan nyata. Tidak ada foto orang nyata dibuat/diimpor; fixture foto adalah bidang warna sintetis untuk tes. Rilis native/live dan ilustrasi tetap terbuka; lihat [TESTING.md](TESTING.md).

