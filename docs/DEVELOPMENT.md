# Pengembangan Upahgo

Status: implementasi awal lokal, 17 November 2026. Android adalah target utama. Preview browser membantu memeriksa alur; bukan bukti bahwa Android telah berjalan.

## Menjalankan

1. Gunakan Node 22.13+ dalam seri 22. Jalankan `npm ci --ignore-scripts` dari root.
2. Salin `apps/mobile/.env.example` ke `.env` di direktori yang sama. URL Supabase dan publishable/anon key bersifat publik. Jangan isi service-role key.
3. `npm run web` membuka Metro web. Alternatif: `npm run build:web`, lalu `npm run preview`, buka http://localhost:8081.
4. Pilih **Coba demo**, pengenalan, peran, lokasi/radius simulasi Pekanbaru, lalu isi profil atau **Lewati dulu**. Demo memakai 12 profil sintetis (6 tiap peran), `demo-me`, serta riwayat di memori; profil awal terisi untuk preview. Keluar atau muat ulang menghapus sesi demo. Tidak ada SMS, nomor nyata, WhatsApp eksternal, atau uang berpindah.
5. **Akun**, menu simulasi Buruh/Penyedia kerja mengganti aktor sintetis untuk menguji pengirim/penerima. Ini berbeda dari **Peran akun**, yang mengganti peran aktif akun yang sama dan mematikan presence secara atomik.

`npm run android` membutuhkan Android SDK, JDK, emulator/perangkat, dan konfigurasi native. `npm run build:android` hanya mengekspor bundle JavaScript/Hermes ke `apps/mobile/dist-android`; bukan APK/AAB. Jangan menyerahkan bundle itu sebagai aplikasi siap dipasang.

QA-001 menambah variant `UPAHGO_APP_VARIANT=qa`: package `id.upahgo.app.qa`, nama Upahgo QA dan callback `upahgo-qa://auth/callback`. Gunakan env yang sama saat prebuild dan Gradle bundling; default produksi tetap. [Build APK sintetis, matriks perangkat/staging dan kriteria penerimaan](QA-ACCEPTANCE.md). SDK/cache lokal `.cache` tidak masuk Git; APK debug-signed bukan artefak produksi.

## Mode live

Tidak pernah beralih diam-diam ke demo saat jaringan gagal. Urutan konfigurasi: [SERVICES.md](SERVICES.md). API live membutuhkan migrasi, gateway secret, Worker, dan direktori area. Tanpa konfigurasi, backend menolak akses. Tujuan cakupan tetap seluruh Indonesia; server memerlukan polygon kota/area yang diprovisi dan fix foreground valid. Hanya Pekanbaru demo tersedia; tidak ada direktori live nasional.

`EXPO_PUBLIC_API_URL=http://localhost:8787` cocok untuk preview pada komputer yang sama. Pada emulator Android gunakan alamat host emulator yang sesuai atau endpoint HTTPS Worker. Pada perangkat fisik gunakan endpoint pengembangan HTTPS yang dapat dijangkau; `localhost` berarti perangkat itu sendiri. Jangan melemahkan TLS untuk build produksi.

## Cloudflare lokal

Salin `workers/api/.dev.vars.example` ke `.dev.vars`, isi nilai lokal. File tersebut diabaikan Git. `npm run worker:dev`. `npm run worker:check` hanya membundel melalui dry-run, tidak mengunggah.

Bila sandbox menolak folder preferensi Wrangler, gunakan `XDG_CONFIG_HOME=/private/tmp/upahgo-cloudflare WRANGLER_LOG_PATH=/private/tmp/upahgo-wrangler.log WRANGLER_SEND_METRICS=false`. Jangan mengubah HOME atau permission global.

`node scripts/test-worker-local.mjs` mengirim 190 permintaan dengan operasi tidak dikenal ke localhost:8787; operasi ditolak sebelum menghubungi Supabase. Jalankan pada penyimpanan limiter lokal yang baru untuk pemeriksaan tepat 180/10. Penyimpanan berada di `.wrangler/`, bukan layanan produksi.

`npm run test:ops-local` menjalankan Worker/workerd dan SQLite Durable Object asli pada port loopback sementara, mengganti Auth/PostgREST dengan server sintetis. Konfigurasi/.env/state terisolasi, tidak memuat `.dev.vars` proyek atau men-deploy. Menguji sukses, Auth503, DB400 tak dikenal dan redirect302 yang tidak diikuti, korelasi ID serta redaksi event aplikasi. Memerlukan izin localhost; membersihkan hanya proses/direktori milik tes. Ini menemukan incompatibility `redirect: error` di workerd; gateway kini manual dan gagal tertutup pada non-2xx. Deno/Node tetap mendukung error.

`npm test` mencakup telemetry/monitor dengan upstream sintetis dan filesystem privat sementara; `npm run test:photo-edge` juga memeriksa ID gateway, Auth outage dan redaksi. Tidak mengirim webhook nyata. CLI `npm run ops:monitor -- /private/ops/ops-monitor.json --apply` hanya untuk server/kanal terotorisasi, bukan dijalankan sebagai tes development. [Environment, state, jadwal dan penerimaan](OPERATIONS.md).

## Database pengujian

Gunakan PostgreSQL 17 lokal yang dapat dibuang. Script menghapus schema `auth`, `storage`, `upahgo_private`, dan fungsi API pada database target. Nama database harus diawali `upahgo_test`. **Jangan menggunakan URL database produksi.**

```sh
createdb upahgo_test_core
TEST_DATABASE_URL=postgresql://localhost/upahgo_test_core npm run test:db
```

Tes membuat shim `auth.users`, `auth.uid()` dan katalog `storage.objects`, role `anon`/`authenticated`/`service_role`, migrasi, dan data sintetis. Ini memverifikasi SQL, bukan layanan Auth/PostgREST/Storage/SMS Supabase yang sebenarnya. Tidak membutuhkan Docker.

## Pemeriksaan

- `npm run typecheck`, `npm run lint`, `npm test`.
- `npm run test:db` dengan database disposable.
- `npm run build:web`, `npm run preview`, `npm run test:web`.
- `npm run build:android` untuk bundle; uji perangkat terpisah masih wajib.
- `npm run worker:check`, `npm audit`, `npm run check:secrets`.
- `npm run audit:dependencies` adalah gate CI: moderate atau lebih tinggi menolak, termasuk tooling/dev. Jangan memakai audit fix force atau mengabaikan registry error. Override minimatch hanya untuk `@expo/fingerprint@0.21.10`; tinjau/hapus saat upstream patched, re-resolve lockfile terarah lalu clean install/test/export. `npm test` memeriksa matcher dan hash fingerprint nyata pada fixture sementara. [Alasan dan bukti SEC-001](../audits/2026-11-18-production/remediation/sec-001/README.md).
- `python3 assets/verify.py`, `python3 design/verify.py` untuk paket identitas.

Playwright menjalankan Chromium, Firefox dan WebKit. Chromium memakai Chrome macOS bila tersedia; `PLAYWRIGHT_CHROMIUM_EXECUTABLE` hanya mempengaruhi project Chromium. Pasang runtime Firefox/WebKit yang sesuai versi lockfile; CI memasang ketiganya. `npm run test:web -- --project=chromium` memeriksa satu engine saja. Tes memakai data sintetis dan tidak melakukan login Google/SMS nyata. Batas runtime dan hasil aktual dicatat dalam [QA-001](../audits/2026-11-18-production/remediation/qa-001/README.md).

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

## Riwayat dan detail (CORE-001)

Migrasi lokal tambahan: `202611180002_history_pagination.sql`, sesudah migrasi harga. Terapkan hanya ke staging yang diotorisasi sebelum Worker/klien baru; sesi ini tidak melakukan migrasi remote. `contacts`, `agreements`, `notifications` tetap mengembalikan array maksimal 100, dengan cursor opsional `after: { id, createdAt }`. Jangan mengubah timestamp cursor menjadi `Date.toISOString()`: pecahan mikrodetik dari PostgreSQL harus dipertahankan. Detail memakai operasi `contact`/`agreement` dengan `id`, bukan pencarian di halaman daftar.

`npm run test:db` juga menjalankan `scripts/test-history.mjs`: fixture >100, timestamp sama, akses peserta/lawan, filter aktif, COD lama, input buruk dan rollback. Seluruh fixture tambahan di-rollback. `tests/web/history.spec.ts` memakai upstream sintetis, termasuk error/retry halaman lanjutan dan respons basi.

Rollback staging: kembalikan klien dan allowlist Worker sebelumnya dahulu, lalu jalankan `supabase/rollbacks/202611180002_history_pagination.sql` dalam satu transaksi (`psql --single-transaction`). Script hanya mengembalikan RPC lama; data tidak dihapus, tetapi bug CORE-001 kembali. Migrasi ini diuji lokal saja; backup dan latihan pemulihan cloud tetap wajib sebelum rilis.

## Tes Edge foto lokal

MEDIA-001 menambah `202611190001_media_reconciliation.sql` setelah PRIV. `scripts/test-media.mjs` memakai fixture rollback; unit processor memakai Storage sintetis. Regresi Edge meliputi reservasi sebelum upload, thumbnail gagal, commit gagal/tak pasti dan DELETE202 tanpa penghapusan inline. CLI `npm run media:process -- --apply` hanya server terotorisasi; default nonaktif. Koordinasikan migrasi dan Edge baru dengan write foto dijeda. [Aktivasi, retry, monitoring dan restore](MEDIA-CLEANUP.md).

PRIV-001 menambah `202611180003_account_erasure.sql` setelah migrasi riwayat. `test:db` menjalankan fixture `scripts/test-deletion.mjs` dalam transaksi rollback; `npm test` mencakup processor/ledger dengan Storage/Auth sintetis dan filesystem sementara. CLI `privacy:process` dan `privacy:ledger` hanya untuk lingkungan yang diotorisasi dengan secret server, tidak memuat `.env` mobile. Kebijakan default nonaktif; [runbook dan batas](ACCOUNT-DELETION.md). Jangan menjalankan rollback CORE/harga di bawah wrapper PRIV; pause runner/kebijakan, perbaiki maju.

Node 22.x; siapkan dependency lockfile proyek. Jalankan `npm run photo:prepare`, lalu `npm run test:photo-edge` dengan Deno 2 tersedia. `DENO_DIR` boleh diatur lokal bila diperlukan; tidak ada path host wajib. Prepare menyalin WASM pinned ke folder Edge yang diabaikan Git; bukan aset aplikasi mobile. Tes memakai decoder WASM asli dan upstream sintetis, tidak menyentuh Supabase remote. CI menyiapkan Deno melalui setup-deno@v2 dan menjalankan prepare/test; workflow belum dieksekusi remote.

Migrasi tambahan lokal: 004 discovery_design, 005 work_details_suggestions, 006 profile_photos, lalu `202611180001_profile_prices.sql`. Review seluruh urutan tanggal 17 November sebelum migrasi harga tanggal 18 November; jangan menjalankan test:db pada produksi. Harga profil opsional per pekerjaan/sesi tersimpan per peran; save lama tanpa field harga mempertahankannya. Setup Edge/retensi/rollback: [SERVICES.md](SERVICES.md).

Untuk mencoba harga/nego: Edit profil, isi tarif/anggaran serta Harga bisa dinegosiasikan, simpan, lalu aktifkan kembali Tampil di peta. Ganti aktor demo lawan melalui Akun, buka profil dan Tawar upah. Pengirim memberi consent, penerima harus menyetujui kontak melalui Aktivitas. Tawar upah pada kontak yang diterima membuka editor, review usulan, rincian tugas/jadwal dan review final. Kesepakatan baru dikirim pada Kirim kesepakatan, kemudian diterima pihak lain. Tidak ada uang atau WhatsApp nyata dalam demo. Muat ulang menghapus draft dan data simulasi.

