# Staging Upahgo

19 November 2026. Pengguna mengonfirmasi proyek `aqzlgrahfxmbvtfwebsx` khusus pengujian dan belum berisi data nyata. Ini target staging, bukan target produksi. Konfirmasi tersebut bukan hasil inspeksi isi database. APK demo belum diuji pada Android fisik.

Konfigurasi dan dry-run tersedia lokal. Belum ada migrasi, deployment, secret remote, akun uji, provider, scheduler atau layanan berbayar yang diaktifkan.

## Target dan akses

| Komponen         | Target / status                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| Supabase staging | `https://aqzlgrahfxmbvtfwebsx.supabase.co`                                                         |
| Worker staging   | Nama `upahgo-api-staging`; URL `workers.dev` belum tersedia, jangan ditebak                        |
| Worker produksi  | Nama existing `upahgo-api`; URL Supabase sengaja kosong sampai proyek produksi terpisah ditentukan |
| Klien Android QA | `UPAHGO_APP_VARIANT=qa`, package `id.upahgo.app.qa`, callback `upahgo-qa://auth/callback`          |
| Cloudflare CLI   | Belum login pada pemeriksaan baca-saja                                                             |
| Supabase CLI     | Sesi ada, tetapi proyek staging tidak muncul dalam daftar proyek sesi tersebut                     |

Status akses merupakan snapshot; periksa ulang setelah login atau perubahan izin. Jangan logout/menimpa sesi proyek lain secara otomatis. Pakai akun/profil yang memiliki akses ke target di atas. Jangan mengirim token, password, service key atau client secret melalui chat.

## Batas konfigurasi

`workers/api/wrangler.jsonc` memiliki environment `staging` dengan vars, binding Durable Object dan migrasi SQLite eksplisit. Binding limiter memakai kelas script staging sendiri, tanpa `script_name`/environment produksi. `routes: []` mencegah pewarisan custom domain produksi. Namespace remote tetap harus diverifikasi sesudah deployment; dry-run tidak membuatnya.

Variabel staging tidak mengambil URL produksi. Default produksi tanpa URL menolak operasi bisnis dengan `GATEWAY_NOT_CONFIGURED` sebelum request keluar. URL tidak valid dan HTTP loopback pada staging juga ditolak. `/healthz` hanya liveness dan dapat mengembalikan 204 ketika layanan bisnis belum terkonfigurasi; itu bukan bukti siap pakai.

Ancaman yang ditangani: salah target database, pemakaian limiter produksi, secret masuk bundle/log dan pembukaan foto/kontak lintas akun. Secret gateway hanya di Worker/Edge, database menyimpan hash; service-role hanya di Edge/server yang memang memerlukannya. Sesi klien, harga dan role tidak menjadi otoritas. Kontrol server/RLS, JWT, limiter, consent, pemisahan COD dan pending foto tetap berlaku pada staging.

Pemeriksaan lokal:

```sh
npm test
npm run worker:check
npm run worker:check:staging
npm run test:ops-local
```

Kedua `worker:check` hanya dry-run. Tidak membutuhkan login atau mengunggah Worker. CI memeriksa keduanya. `test:ops-local` memakai upstream sintetis dan loopback, bukan proyek Supabase tersebut. Untuk pengembangan biasa, isi `SUPABASE_URL` di `.dev.vars` dari contoh; default produksi tidak lagi menyediakan target pengujian secara implisit.

## Urutan deployment setelah diotorisasi

Langkah di bawah belum dijalankan. Cakupan perubahan yang harus disetujui: sepuluh migrasi pada proyek pengujian yang disebutkan, provisioning hash/secret gateway, Edge `profile-photo` dan Worker `upahgo-api-staging`. Tidak termasuk proyek/akun cloud baru, upgrade paket, SMS/Maps berbayar, publikasi APK, perubahan produksi atau aktivasi runner PRIV/MEDIA/monitor.

1. Pastikan akun Cloudflare dan Supabase benar, akses proyek tersedia, paket/kuota ditinjau dan izin perubahan staging disetujui. Verifikasi ref sebelum setiap perintah. Simpan kredensial di secret store/file privat yang diabaikan Git; jangan memasukkannya sebagai literal argumen command atau log. Jangan mengubah izin organisasi hanya untuk melewati kegagalan akses.
2. Inspeksi schema, tabel aplikasi, bucket dan riwayat migrasi pada target. Jangan menyimpulkan database bersih dari nama staging atau respons RPC404. Jika ditemukan data/versi tidak sesuai rencana, hentikan penerapan dan tinjau backup serta kompatibilitasnya. Jangan menjalankan `test:db`, `db reset`, migration repair atau SQL penghapusan schema pada proyek remote.
3. Bandingkan file lokal dengan [manifest sepuluh migrasi dan SHA-256](../audits/2026-11-18-production/remediation/qa-001/staging/migration-plan.json). CLI terpasang menyediakan `--project-ref` sehingga tidak perlu mengandalkan proyek yang terakhir di-link. Setelah izin dan akses target tersedia, tinjau rencana terlebih dahulu:

   ```sh
   supabase migration list --project-ref aqzlgrahfxmbvtfwebsx
   supabase db push --project-ref aqzlgrahfxmbvtfwebsx --dry-run --skip-vault
   ```

   Jangan memakai `--include-all`, `--include-seed` atau `--include-roles` untuk memaksa riwayat cocok. Setelah rencana cocok dan disetujui, perintah penerapan adalah:

   ```sh
   supabase db push --project-ref aqzlgrahfxmbvtfwebsx --skip-vault
   ```

   `--skip-vault` mencegah pembaruan Vault yang bukan cakupan migrasi. Jangan menaruh password database pada flag `--password`; gunakan mekanisme kredensial privat CLI yang ditinjau. Verifikasi urutan/hasil dan simpan bukti yang disaring. Schema `upahgo_private` tidak boleh diekspos PostgREST; bucket foto tetap privat.

4. Buat secret gateway acak kriptografis minimal 32 byte, khusus staging. Set `GATEWAY_SECRET` pada Worker dengan `--env staging`, `UPAHGO_GATEWAY_SECRET` pada Edge dengan ref eksplisit, dan hash SHA-256 secret yang sama pada `upahgo_private.gateway_config.secret_hash`. Gunakan parameter query admin, bukan interpolasi secret ke SQL. Isi `SUPABASE_PUBLISHABLE_KEY` Worker dari proyek staging; service-role tidak boleh masuk Worker/mobile. Rotasi harus serentak pada ketiga lokasi.
5. Siapkan WASM, tinjau deployment foto, lalu deploy function yang dituju saja:

   ```sh
   npm run photo:prepare
   supabase functions deploy profile-photo --project-ref aqzlgrahfxmbvtfwebsx --use-api
   ```

   Pertahankan `verify_jwt = true`, static WASM dan bucket privat. Jangan memakai `--no-verify-jwt` atau `--prune`. Uji JWT/Auth/Storage sebenarnya; kegagalan autentikasi bukan alasan membuka function. Tunda write foto selama koordinasi migrasi/Edge sesuai [MEDIA-CLEANUP.md](MEDIA-CLEANUP.md).

6. Deploy Worker staging pada akun yang disetujui, sesudah kedua dry-run lulus:

   ```sh
   npx --no-install wrangler deploy --env staging --config workers/api/wrangler.jsonc
   ```

   Catat URL HTTPS, deployment ID dan binding limiter aktual. Jangan menjalankan deploy tanpa `--env staging`. Origin kosong sesuai klien native; bila preview web diperlukan, tambahkan origin tepat yang disetujui, tanpa wildcard. Ikuti [OPERATIONS.md](OPERATIONS.md) untuk akses/retensi log dan raw metadata provider.

7. Siapkan tiga identitas sintetis yang terisolasi: pekerja, pemberi kerja dan pihak ketiga. Tinjau provisioning wilayah/geometri berlisensi; jangan menganggap fixture demo sebagai direktori layanan nasional. Konfigurasikan Google dan callback QA exact sebelum uji login aplikasi. Verifikasi nomor hanya melalui nomor/mode uji provider yang disetujui; jangan mengirim SMS atau WhatsApp nyata sebagai efek samping tes. Akun/nomor yang dibuat admin tidak membuktikan alur OTP lulus.
8. Bangun APK QA live dengan public env staging dan URL Worker aktual. APK demo existing tidak berubah menjadi live dengan memasukkan URL setelah instalasi. Tidak memasukkan service key/secret gateway ke bundle. Jalankan [A01–A11 dan S01–S08](QA-ACCEPTANCE.md), catat platform/build/hash, hasil dan bukti tanpa token/PII. `401`, `404` atau `/healthz`204 saja tidak membuktikan alur bisnis/otorisasi berhasil.

## Pemulihan dan gerbang rilis

Jika validasi gagal, hentikan write baru dan kembalikan Worker/klien ke versi kompatibel yang sudah dicatat. Pertahankan schema, bucket dan riwayat migrasi; jangan otomatis drop tabel atau memutar balik wrapper PRIV/MEDIA. Perubahan database berikutnya harus ditinjau sebagai perbaikan maju. Jangan menyatakan backup atau restore berhasil sebelum drill terisolasi benar-benar dijalankan.

PRIV/MEDIA/monitor tetap nonaktif sampai pemilik, retensi, scheduler, alarm dan penerimaan provider ditetapkan sesuai runbook masing-masing. Target kapasitas/RPO/RTO masih usulan, bukan hasil uji. Penerimaan Android fisik, Google/Phone, Storage, object authorization, operasi dan pemulihan cloud tetap terbuka. Konfigurasi staging dan dry-run tidak menutup QA-001 atau mengubah status produksi **NO-GO**.
