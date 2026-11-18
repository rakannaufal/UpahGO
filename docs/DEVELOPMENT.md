# Pengembangan Upahgo

Status: implementasi awal lokal, 17 November 2026. Android adalah target utama. Preview browser membantu memeriksa alur; bukan bukti bahwa Android telah berjalan.

## Menjalankan

1. Gunakan Node 22.13+ dalam seri 22. Jalankan `npm ci --ignore-scripts` dari root.
2. Salin `apps/mobile/.env.example` ke `.env` di direktori yang sama. URL Supabase dan publishable/anon key bersifat publik. Jangan isi service-role key.
3. `npm run web` membuka Metro web. Alternatif: `npm run build:web`, lalu `npm run preview`, buka http://localhost:8081.
4. Pilih **Coba demo**, pengenalan, peran, lokasi/radius simulasi Pekanbaru, lalu isi profil atau **Lewati dulu**. Demo memakai 12 profil sintetis (6 tiap peran), `demo-me`, serta riwayat di memori; profil awal terisi untuk preview. Keluar atau muat ulang menghapus sesi demo. Tidak ada SMS, nomor nyata, WhatsApp eksternal, atau uang berpindah.
5. **Akun**, menu simulasi Buruh/Penyedia kerja mengganti aktor sintetis untuk menguji pengirim/penerima. Ini berbeda dari **Peran akun**, yang mengganti peran aktif akun yang sama dan mematikan presence secara atomik.

`npm run android` membutuhkan Android SDK, JDK, emulator/perangkat, dan konfigurasi native. `npm run build:android` hanya mengekspor bundle JavaScript/Hermes ke `apps/mobile/dist-android`; bukan APK/AAB. Jangan menyerahkan bundle itu sebagai aplikasi siap dipasang.

## Mode live

Tidak pernah beralih diam-diam ke demo saat jaringan gagal. Urutan konfigurasi: [SERVICES.md](SERVICES.md). API live membutuhkan migrasi, gateway secret, Worker, dan direktori area. Tanpa konfigurasi, backend menolak akses. Tujuan cakupan tetap seluruh Indonesia; server memerlukan polygon kota/area yang diprovisi dan fix foreground valid. Hanya Pekanbaru demo tersedia; tidak ada direktori live nasional.

`EXPO_PUBLIC_API_URL=http://localhost:8787` cocok untuk preview pada komputer yang sama. Pada emulator Android gunakan alamat host emulator yang sesuai atau endpoint HTTPS Worker. Pada perangkat fisik gunakan endpoint pengembangan HTTPS yang dapat dijangkau; `localhost` berarti perangkat itu sendiri. Jangan melemahkan TLS untuk build produksi.

## Cloudflare lokal

Salin `workers/api/.dev.vars.example` ke `.dev.vars`, isi nilai lokal. File tersebut diabaikan Git. `npm run worker:dev`. `npm run worker:check` hanya membundel melalui dry-run, tidak mengunggah.

Bila sandbox menolak folder preferensi Wrangler, gunakan `XDG_CONFIG_HOME=/private/tmp/upahgo-cloudflare WRANGLER_LOG_PATH=/private/tmp/upahgo-wrangler.log WRANGLER_SEND_METRICS=false`. Jangan mengubah HOME atau permission global.

`node scripts/test-worker-local.mjs` mengirim 190 permintaan dengan operasi tidak dikenal ke localhost:8787; operasi ditolak sebelum menghubungi Supabase. Jalankan pada penyimpanan limiter lokal yang baru untuk pemeriksaan tepat 180/10. Penyimpanan berada di `.wrangler/`, bukan layanan produksi.

## Database pengujian

Gunakan PostgreSQL 17 lokal yang dapat dibuang. Script menghapus schema `auth`, `upahgo_private`, dan fungsi API pada database target. Nama database harus diawali `upahgo_test`. **Jangan menggunakan URL database produksi.**

```sh
createdb upahgo_test_core
TEST_DATABASE_URL=postgresql://localhost/upahgo_test_core npm run test:db
```

Tes membuat shim `auth.users` dan `auth.uid()`, role `anon`/`authenticated`, migrasi, dan data sintetis. Ini memverifikasi SQL, bukan layanan Auth/PostgREST/SMS Supabase yang sebenarnya. Tidak membutuhkan Docker.

## Pemeriksaan

- `npm run typecheck`, `npm run lint`, `npm test`.
- `npm run test:db` dengan database disposable.
- `npm run build:web`, `npm run preview`, `npm run test:web`.
- `npm run build:android` untuk bundle; uji perangkat terpisah masih wajib.
- `npm run worker:check`, `npm audit`, `npm run check:secrets`.
- `python3 assets/verify.py`, `python3 design/verify.py` untuk paket identitas.

Playwright memakai Chrome macOS bila tersedia. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` untuk binary lain; pada Linux gunakan browser Playwright yang sudah dipasang. Tes browser memakai data sintetis dan tidak melakukan login Google atau SMS nyata.

## Struktur

- `apps/mobile/app`: route Expo Router.
- `apps/mobile/src`: UI, tema, sesi, API live, simulator demo.
- `shared/contracts.ts`: operasi, tipe, validasi ringan dan transisi UI. SQL tetap otoritas.
- `workers/api`: gateway Cloudflare dan Durable Object pembatas.
- `supabase/migrations`: skema privat dan RPC berizin.
- `tests`, `scripts`: pemeriksaan lokal dan build.
- `design/tokens.json`, `DESIGN.md`: sumber sistem desain; jangan membuat sistem paralel.

## Lokasi dan peta

Demo tidak meminta GPS nyata; lokasi Pekanbaru dan seluruh profil/riwayat diberi label sintetis. Live memerlukan izin foreground, layanan lokasi dan fix baru yang sah; denial, akurasi buruk, kota tidak terlayani dan bootstrap gagal menutup penemuan tanpa fallback demo. Lokasi/radius wajib setelah peran; profil opsional sesudahnya. Radius tersimpan, diperbarui saat foreground/app-resume. Akun lama tetap dapat mengakses riwayat/Akun/bantuan ketika lokasi tertahan.

Web memakai Leaflet lazy dan tile OSM beratribusi; jaringan tile gagal masih menyediakan daftar. Android membutuhkan Google Maps key dan pengujian perangkat. Provisioning live: migrasi 001–006 tanggal 17 November, `202611180001_profile_prices.sql`, kota/area berlisensi ditinjau, Worker allowlist, klien. Klien manual lama tidak kompatibel dengan gate GPS baru; staging/backup/rollback diperlukan sebelum deployment. Tidak ada migrasi remote atau layanan berbayar diaktifkan. Lihat [GEO-DATA.md](GEO-DATA.md) dan [SERVICES.md](SERVICES.md).

## Tes Edge foto lokal

Node 22.x; siapkan dependency lockfile proyek. Jalankan `npm run photo:prepare`, lalu `npm run test:photo-edge` dengan Deno 2 tersedia. `DENO_DIR` boleh diatur lokal bila diperlukan; tidak ada path host wajib. Prepare menyalin WASM pinned ke folder Edge yang diabaikan Git; bukan aset aplikasi mobile. Tes memakai decoder WASM asli dan upstream sintetis, tidak menyentuh Supabase remote. CI menyiapkan Deno melalui setup-deno@v2 dan menjalankan prepare/test; workflow belum dieksekusi remote.

Migrasi tambahan lokal: 004 discovery_design, 005 work_details_suggestions, 006 profile_photos, lalu `202611180001_profile_prices.sql`. Review seluruh urutan tanggal 17 November sebelum migrasi harga tanggal 18 November; jangan menjalankan test:db pada produksi. Harga profil opsional per pekerjaan/sesi tersimpan per peran; save lama tanpa field harga mempertahankannya. Setup Edge/retensi/rollback: [SERVICES.md](SERVICES.md).

Untuk mencoba harga/nego: Edit profil, isi tarif/anggaran serta Harga bisa dinegosiasikan, simpan, lalu aktifkan kembali Tampil di peta. Ganti aktor demo lawan melalui Akun, buka profil dan Tawar upah. Pengirim memberi consent, penerima harus menyetujui kontak melalui Aktivitas. Tawar upah pada kontak yang diterima membuka editor, review usulan, rincian tugas/jadwal dan review final. Kesepakatan baru dikirim pada Kirim kesepakatan, kemudian diterima pihak lain. Tidak ada uang atau WhatsApp nyata dalam demo. Muat ulang menghapus draft dan data simulasi.

