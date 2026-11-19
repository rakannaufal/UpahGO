# Upahgo

Baseline tersimpan pada repository proyek mandiri [rakannaufal/UpahGO](https://github.com/rakannaufal/UpahGO), commit `9952922`. Status audit dan perbaikan: [remediasi 18 November 2026](audits/2026-11-18-production/remediation/README.md). Rilis produksi masih **NO-GO** sampai temuan terbuka dan penerimaan Android/live diselesaikan.

Aplikasi Android untuk mempertemukan pekerja harian dengan pemberi kerja. Kategori awal bersih-bersih rumah; pendaftaran direncanakan seluruh Indonesia. Dua mode peta, kartu bertag, izin kontak sebelum WhatsApp, pembayaran COD.

Kartu terbaru mengikuti pilihan pengguna: **dua kartu per baris** di Beranda/daftar Temukan, avatar berlatar, “Bisa nego” sebagai teks hijau gelap tanpa kotak, gambar layanan di kanan tengah (56 dp pada kartu sempit, 80 dp pada kartu lebar). Rating emas rata kanan pada panel harga bawah, boleh turun baris agar nominal utuh. FontScale ≥1,5 memakai satu kolom untuk aksesibilitas. [Contoh terpilih](design/profile-card-variants/captures/card-2.png), [bukti aplikasi dan batas](.impeccable/review/two-column-cards.md).

## Status implementasi

Desain **Upahgo Ceria** sudah diterapkan pada seluruh halaman existing: masuk Google, ilustrasi peran, Beranda, peta dengan pin profil yang terpisah pada zoom maksimal, daftar dan form. Refinement v2.3 mengikuti koreksi terbaru pengguna: aset gambar berwarna Menyapu/Mengepel/Dapur/Lainnya kembali pada ukuran 36 dp, tombol Pekanbaru/lokasi-radius berbingkai, border seluruh kartu/panel/pengalih 1 dp abu-abu muda mengikuti contoh Gojek. Input tetap berbingkai 1 dp dengan kontras kontrol. Ikon antarmuka hijau 24 dp tanpa bidang latar; navigasi aktif terisi tanpa garis bawah, tombol minimum 48 dp. Akun dimuat sejak awal, peta tetap lazy. Logo dan ilustrasi peran asli tetap. Arahan aktif: [DESIGN.md](DESIGN.md). [Preview terbaru](.impeccable/review/soft-borders/preview.png), [review dan batas penerimaan](.impeccable/review/soft-borders.md).

Akun memiliki Lainnya (bantuan dan laporan, ketentuan dan privasi, atribusi data, penilaian aplikasi) dan Kelola akun (keluar, hapus). Penilaian aplikasi masih menampilkan keterangan belum adanya tautan Google Play resmi.

Versi awal lokal tersedia: React Native + Expo + TypeScript, Supabase Auth/SQL, gateway Cloudflare. Demo multi-profil dan riwayat sintetis dapat dicoba pada preview web. APK **Upahgo QA 0.1.0 arm64** berhasil dikompilasi pada 19 November, tersimpan lokal di `.cache/qa/upahgo-qa-0.1.0-arm64.apk` (33,65 MiB, Android 7.0/API24+). Package terpisah, build release bertanda tangan debug, layanan sintetis; pilih **Coba demo**. Ini bukan APK produksi. [Panduan uji mandiri](docs/QA-ACCEPTANCE.md), [bukti dan SHA-256](audits/2026-11-18-production/remediation/qa-001/evidence/apk-verification.json). Belum di-deploy atau diuji pada perangkat Android. Google dan Phone masih perlu konfigurasi provider; direktori area nyata, Maps key, serta layanan operasional belum tersedia.

```sh
# Node 22.13+ seri 22
npm ci --ignore-scripts
npm run web
```

Atau `npm run build:web`, `npm run preview`, buka http://localhost:8081. Pilih **Coba demo**, lewati atau ikuti pengenalan, pilih peran, lokasi demo/radius, lalu isi profil atau **Lewati dulu** menuju Beranda. Menu simulasi Buruh/Penyedia kerja di Akun mengganti aktor demo; menu Peran akun mengganti peran akun aktif. Demo tidak menghubungi orang atau memindahkan uang; reload menghapus data demo.

Panduan lengkap: [Pengembangan](docs/DEVELOPMENT.md), [Konfigurasi Google/Supabase/Cloudflare/Maps](docs/SERVICES.md). Domain belum diperlukan untuk konfigurasi `workers.dev`; deployment belum dilakukan.

Konfigurasi staging terpisah tersedia untuk proyek Supabase pengujian yang dikonfirmasi pengguna: `upahgo-api-staging`, binding limiter sendiri dan dry-run `npm run worker:check:staging`. URL Supabase produksi sengaja kosong. [Akses, manifest migrasi dan urutan deployment](docs/STAGING.md); belum ada deployment/migrasi remote. Login Wrangler dan akses Supabase ke ref staging terverifikasi; profil Supabase memakai file serta direktori lokal terisolasi. MCP Cloudflare berhasil OAuth Minimal, pemakaian tool menunggu muat ulang Codex. CI source `b47d79c`, run [44528145983](https://github.com/rakannaufal/UpahGO/actions/runs/44528145983), sukses:63 unit,280 SQL,1 Edge,4 Worker,63 browser; audit npm0 dan kedua dry-run lulus. Penerimaan perangkat dan layanan staging tetap terbuka.

## Slice yang tersedia

- Kartu dengan avatar beralas warna, tag ringkas dan harga per pekerjaan/sesi. Edit profil menyimpan tarif/anggaran serta kesediaan nego. Detail terstruktur dan Tawar upah mengikuti izin kontak dua pihak, lalu proposal tugas/jadwal yang harus diterima pihak lain. Harga awal tidak mengubah upah yang sudah disepakati.
- Onboarding, login Google PKCE yang siap dikonfigurasi, profil/peran/tag/area, penautan nomor melalui SMS jika provider disiapkan.
- Dua mode penemuan pekerja/pemberi kerja, visibilitas opt-in dengan expiry, daftar/filter, detail profil. GPS foreground, radius dan batas kota server; peta native Google memerlukan key, web memakai Leaflet/OSM beratribusi.
- Permintaan, persetujuan/penolakan/pencabutan izin kontak. WhatsApp dibuka manual sesudah izin server; demo hanya simulasi.
- Proposal tugas/jadwal/upah, penerimaan pihak lain, pemeriksaan hasil, pengakuan uang tunai oleh pekerja secara terpisah.
- Penilaian kedua pihak setelah kesepakatan selesai, terpisah dari pengakuan COD.
- Notifikasi dalam aplikasi, blokir, pengiriman laporan, permintaan penghapusan. Finalizer akun/Auth/Storage dan retensi tersedia lokal, nonaktif sampai kebijakan disetujui; [runbook](docs/ACCOUNT-DELETION.md). Operator dan penerimaan cloud belum tersedia.
- Rekonsiliasi foto: reservasi upload, antrean penghapusan dengan lease/retry dan sweep objek yatim tersedia lokal, runner default nonaktif. Hapus foto mengakui antrean melalui HTTP202; [runbook MEDIA-001](docs/MEDIA-CLEANUP.md). Scheduler/alarm dan Storage nyata belum diterima.
- Operasi: ID permintaan server, event JSON terbatas, metrik dependency/latensi dan monitor API sintetis dengan state privat, retry alarm/recovery tersedia source. [Runbook OPS-001](docs/OPERATIONS.md). Belum diaktifkan remote; owner, kanal alarm, metadata provider dan scheduler masih perlu penerimaan.

Publikasi lowongan/lamaran terpisah, chat internal, wallet/escrow, push, admin web tidak ditambahkan pada slice ini. `SCREENS.md` tetap katalog rancangan yang lebih luas, bukan daftar fitur selesai.

## Dokumen dan sumber

| File | Isi |
| --- | --- |
| [prd.md](prd.md) | Keputusan pengguna, rekomendasi, cakupan produk |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Sistem dan kontrak yang diterapkan |
| [DESIGN.md](DESIGN.md) | Sistem desain otoritatif; nilai pada `design/tokens.json` |
| [SECURITY.md](SECURITY.md) | Ancaman, kontrol aktual, kekurangan rilis |
| [TESTING.md](TESTING.md) | Bukti pemeriksaan dan target belum teruji |
| [SCREENS.md](SCREENS.md) | Katalog layar rencana, tidak semuanya diimplementasikan |
| [assets/README.md](assets/README.md) | Logo pilihan, Material icons, marker, lisensi |
| [AGENTS.md](AGENTS.md) | Petunjuk implementasi proyek |

Logo pilihan pengguna tetap utuh pada `assets/brand/source/upahgo-logo-approved.png`. Palet hijau `#014C24`, emas `#E5C282`, mint/putih; tidak membuat identitas pengganti. Rincian default waktu, batas upah dan tag adalah implementasi untuk evaluasi, bukan kebijakan bisnis yang dianggap telah disetujui.

Implementasi UX lokal tersedia: Beranda dengan dua kartu per baris dari peran lawan (satu kolom pada fontScale ≥1,5); Temukan dengan peta, kelompok marker dan alternatif daftar; lima tab Beranda, Temukan, Aktivitas, Notifikasi, Akun; onboarding setelah login; pilih peran; profil boleh dilewati untuk menjelajah. Progress, peran dan area pencarian disimpan per akun, terpisah dari profil publik. Profil minimum dan nomor terverifikasi tetap wajib untuk tindakan publik. Satu peran aktif yang dapat diganti melalui Akun diterapkan untuk evaluasi, belum merupakan persetujuan kebijakan bisnis final. [Rincian implementasi dan batas](design/UX-PLAN.md).

## Pemeriksaan

`npm run typecheck`, `npm run lint`, `npm test`, `npm run test:db`, `npm run test:web`, `npm run build:web`, `npm run build:android`, `npm run worker:check`. DB perlu PostgreSQL disposable; browser memerlukan preview berjalan. `build:android` mengekspor bundle Hermes, bukan APK/AAB. Hasil serta batas cakupan dicatat di TESTING.md.

`npm run audit:dependencies` menolak advisory moderate atau lebih tinggi pada CI. Remediasi SEC-001 menambal minimatch secara terbatas; audit online 19 November menghasilkan 0 temuan. Advisory picomatch lama ditarik upstream, pola tak tepercaya tetap dibatasi. [Disposition dan batas](audits/2026-11-18-production/remediation/sec-001/README.md); hasil scanner tidak menggantikan penerimaan Android/live.

## Slice GPS dan penilaian — 17 November 2026

GPS foreground dan radius wajib setelah peran, profil opsional sesudahnya; hasil dibatasi kota GPS dan radius. Kartu dua kolom, filter kecamatan/jenis pekerjaan, peta OSM aktual dan penilaian bilateral tersedia. Demo Pekanbaru: 12 profil sintetis + `demo-me`, riwayat lengkap; batas kota OSM aktual. Niat nasional tetap, direktori live belum diprovisi. Aturan/default evaluasi: [prd.md](prd.md); privasi: [SECURITY.md](SECURITY.md); bukti: [TESTING.md](TESTING.md).

## Slice katalog, tenaga dan foto — 18 November 2026

Slice ini mendahului penerapan Ceria. Arah aktif kini native Operate (ENERGY 3 / RHYTHM 2 / MOTION 2), logo hijau/emas pilihan pengguna dan token v2. Lima tab tanpa judul badan berulang, dua kartu per baris; pencarian, kecamatan, kategori, jenis pekerjaan dan tenaga dibagi Beranda/Temukan dalam sesi per akun/peran, direset saat akun/peran berubah. GPS kota/radius, consent kontak, COD dan penilaian tetap berlaku.

`shared/job-catalog.json` memuat 128 pekerjaan/16 kategori; enam tag bersih-bersih lama aktif live. Demo mengaktifkan 18 tugas (J001–J016, galon dan kardus), bukan kategori live baru. Demo tetap **12 profil sintetis (6 per peran) + demo-me**, dengan konteks galon/kardus/cuci piring dan Ringan/Sedang/Berat/Perlu rincian. Entri katalog lain adalah rencana, bukan layanan tersedia. “Lainnya” mengirim usulan privat pending; tidak mengaktifkan kategori otomatis. Estimasi tenaga memakai konteks durasi, jumlah, beban, lantai/lift, jarak, pekerja dan alat; bukan batas angkat aman/penilaian medis. Kesepakatan menampilkan konteks dan review eksplisit sebelum kirim; COD terpisah.

Cover aktivitas kini memakai objek SVG multicolor Ceria, menggantikan fallback pictogram Material dari slice sebelumnya. Delapan adegan raster Stage A lama tidak dibuat; arah aktif mengikuti aset Ceria. Foto identitas/tempat opsional terpisah dari cover; galeri, crop, resize JPEG, preview, consent, draft dan hapus tersedia untuk evaluasi. Pending hanya terlihat pemilik, bukan persetujuan nyata. Tidak ada foto orang nyata dibuat/diimpor; fixture foto adalah bidang warna sintetis untuk tes. Rilis native/live dan remediasi dependensi tetap terbuka; lihat [TESTING.md](TESTING.md).

