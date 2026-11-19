# Staging Upahgo

APK QA **staging** terbaru: `.cache/qa/upahgo-qa-staging-0.1.0-arm64.apk`, SHA-256 `81cfc39a7ea530e56beb17d0d490fea0c260a38cb4bc8f9ad3055283375de7be`. Endpoint staging tertanam; APK demo lama tetap. Release build bertanda tangan debug, arm64/API24+, tanpa Maps key. Google aktif di staging; Phone tetap nonaktif. Login Google lengkap dan APK pada Android belum diuji. [Verifikasi APK](../audits/2026-11-18-production/remediation/qa-001/staging/live/apk.json).

19 November 2026. Pengguna mengonfirmasi proyek `aqzlgrahfxmbvtfwebsx` khusus pengujian dan belum berisi data nyata. Ini target staging, bukan target produksi. Konfirmasi tersebut bukan hasil inspeksi isi database. APK demo belum diuji pada Android fisik.

Sepuluh migrasi, hash/secret gateway, Worker staging dan Edge foto sudah diterapkan sesudah otorisasi pengguna. Tiga akun sintetis diuji melalui layanan nyata: 55 assertion pada tiga phase lulus. Google kini aktif dengan client Web dan secret pengganti; Phone, scheduler dan layanan berbayar tetap nonaktif. [Bukti deployment dan batas](../audits/2026-11-18-production/remediation/qa-001/staging/live/README.md).

## Target dan akses

| Komponen         | Target / status                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| Supabase staging | `https://aqzlgrahfxmbvtfwebsx.supabase.co`                                                         |
| Worker staging   | `https://upahgo-api-staging.upahgo-dev-rakan.workers.dev`; deployed                        |
| Worker produksi  | Nama existing `upahgo-api`; URL Supabase sengaja kosong sampai proyek produksi terpisah ditentukan |
| Klien Android QA | `UPAHGO_APP_VARIANT=qa`, package `id.upahgo.app.qa`, callback `upahgo-qa://auth/callback`          |
| Cloudflare CLI   | Login Wrangler terverifikasi baca-saja; satu akun tersedia, identitas/kredensial tidak dicatat     |
| Supabase CLI     | Login profil terisolasi berhasil; ref staging muncul dalam daftar proyek, selector default tidak berubah |

Status akses merupakan snapshot; periksa ulang setelah login atau perubahan izin. Jangan logout/menimpa sesi proyek lain secara otomatis. Pakai akun/profil yang memiliki akses ke target di atas. Jangan mengirim token, password, service key atau client secret melalui chat.

Snapshot sebelum penerapan 19 November (historis): schema `upahgo_private`, tabel riwayat migrasi dan RPC `upahgo_action` belum ada; katalog Storage tersedia. [Bukti](../audits/2026-11-18-production/remediation/qa-001/staging/schema-catalog.json). Tidak membaca row pengguna atau kebijakan bucket; hasil ini tidak membuktikan seluruh database kosong. Pemeriksaan memakai satu SELECT melalui Management API, menghindari preflight `db query --linked` yang dapat membuat role login sementara.

## Login CLI

Jalankan di Terminal Mac, berurutan. Node 22 sudah terpasang pada mesin pengujian ini; path Homebrew berikut khusus mesin tersebut.

```sh
cd /Users/rakan/Documents/UpahGo
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npx --no-install wrangler login --use-keyring
```

Pilih akun Cloudflare staging pada browser dan tinjau izin OAuth sebelum menyetujuinya. `--use-keyring` memakai penyimpanan kredensial OS yang didukung CLI terpasang. Tidak melakukan deploy.

CLI Supabase 2.119.0 menafsirkan `--profile` sebagai nama bawaan atau path file profil, bukan nama akun baru. Perintah lama `--profile upahgo-staging` ditolak dengan `ProfileLoadError`; jangan menggunakannya. Nama bawaan `supabase-staging` menunjuk infrastruktur internal Supabase yang berbeda, bukan proyek pengujian ini.

Gunakan file profil dengan nama kredensial tersendiri serta `SUPABASE_HOME` lokal agar selector dan fallback token tidak menimpa sesi default. Dari root proyek, pada shell yang sama:

```sh
export SUPABASE_HOME="$PWD/.cache/supabase-staging"
UPAHGO_SUPABASE_PROFILE="$SUPABASE_HOME/profile.json"
unset SUPABASE_ACCESS_TOKEN
mkdir -p "$SUPABASE_HOME"
chmod 700 "$SUPABASE_HOME"
if [ ! -e "$UPAHGO_SUPABASE_PROFILE" ]; then
  (umask 077; cat > "$UPAHGO_SUPABASE_PROFILE" <<'JSON'
{
  "name": "upahgo-staging",
  "api_url": "https://api.supabase.com",
  "dashboard_url": "https://supabase.com/dashboard",
  "docs_url": "https://supabase.com/docs",
  "project_host": "supabase.co",
  "pooler_host": "supabase.com"
}
JSON
  )
fi
supabase login --profile "$UPAHGO_SUPABASE_PROFILE" --no-browser --name upahgo-staging --output-format text --agent no
supabase projects list --profile "$UPAHGO_SUPABASE_PROFILE" --output json
```

Periksa isi file existing sebelum memakainya; blok di atas tidak menimpanya. Profil berisi endpoint publik, bukan token. CLI menyimpan token pada entri Keychain `Supabase CLI` / `upahgo-staging`; jika Keychain tidak tersedia, fallback token berada dalam direktori privat di atas dengan mode 0600. `.cache` diabaikan Git. Blok menghapus `SUPABASE_ACCESS_TOKEN` hanya dari shell saat ini agar token lingkungan tidak mengalahkan profil; kredensial tersimpan tetap. `--output-format text --agent no` diperlukan agar deteksi agen tidak mengubah prompt interaktif menjadi JSON. Jangan menjalankan `logout` untuk memperbaiki akses, karena CLI juga menghapus kredensial legacy bersama.

Masuk dengan akun yang dapat membuka proyek `aqzlgrahfxmbvtfwebsx`; URL dari `--no-browser` dibuka di browser Codex, kode login hanya dimasukkan pada alur resmi CLI. Pastikan ref tersebut muncul di daftar. Jika tidak, periksa akun dan keanggotaan organisasi; login berhasil saja belum membuktikan akses target. Pada 19 November, login dan daftar proyek dengan file profil ini berhasil; selector default dibandingkan sebelum/sesudah dan tidak berubah. [Snapshot akses](../audits/2026-11-18-production/remediation/qa-001/staging/access.json). Jangan menyalin token atau keluaran privat ke chat/Git. Semua perintah Supabase lanjutan memakai variabel profil dan `SUPABASE_HOME` dari shell di atas serta ref eksplisit. Login tidak mengotorisasi migrasi, deployment, upgrade paket atau aktivasi provider.

Pada sesi ini, callback OAuth Wrangler pertama ditolak karena CSRF. Alur perangkat resmi berikut berhasil melalui browser Codex:

```sh
npx --no-install wrangler login --device --browser=false --use-keyring
```

CLI memberikan URL/kode sementara untuk dimasukkan pada halaman Cloudflare. Jangan memakai kembali kode lama atau memasukkannya ke laporan. Pemeriksaan `whoami --json` disaring menjadi status/jumlah akun saja; tidak membuktikan paket, kuota atau izin deploy telah diterima.

Atas permintaan pengguna, setup agen mengikuti [panduan resmi Cloudflare](https://developers.cloudflare.com/agent-setup/prompt.md): 22 skill dari `cloudflare/skills` revisi `5108325ecceabc899c761e07aa617b09c02445ee` dipasang ke direktori skill Codex dan diverifikasi terhadap unduhan yang ditinjau. MCP `https://mcp.cloudflare.com/mcp` didaftarkan pada konfigurasi Codex dengan backup privat dan pengaturan lain tetap. OAuth MCP berhasil dengan pilihan Minimal: `user:read`, `account:read`, `offline_access`; CLI mencatat `auth_status: o_auth`. Pemakaian tool MCP pada runtime belum diuji; muat ulang Codex agar server baru dimuat. Skill tersedia pada giliran berikutnya. CLI `cf` beta opsional tidak dipasang karena proyek memakai Wrangler. Setup tooling tidak mengubah layanan aplikasi atau memberi izin deployment.

## Status penerapan aktual

Instruksi pengguna “lanjutkan sampai selesai” mengotorisasi rencana staging yang sudah ditinjau. Preflight menemukan 0 akun Auth/tabel publik/bucket/objek; target ACTIVE_HEALTHY, region ap-northeast-1. Workers Free dikonfirmasi lewat dashboard, tanpa upgrade. Sepuluh versi remote cocok; 28 tabel privat memakai RLS; bucket JPEG privat 1 MiB. Worker dan Edge ACTIVE dengan JWT wajib; limiter mempunyai namespace staging tersendiri. Area QA memakai batas Pekanbaru beratribusi, bukan direktori nasional.

Alur inti, COD, concurrency, pihak ketiga, foto pending/Storage, blokir dan signed URL expiry diuji melalui endpoint nyata. Runner PRIV/MEDIA dan monitor tetap nonaktif; foto diantrekan, bukan diklaim sudah dihapus. [Status layanan](../audits/2026-11-18-production/remediation/qa-001/staging/live/deployment.json), [matriks hasil](../audits/2026-11-18-production/remediation/qa-001/staging/live/README.md). Callback QA exact sudah dipasang; [konfigurasi Google berikutnya](GOOGLE-STAGING.md). Jangan menerapkan ulang migrasi/secret yang sudah terpasang.

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

Langkah1–7 sudah diterapkan untuk staging ini; daftar berikut menjadi runbook reproduksi dan pemeriksaan, bukan instruksi replay migrasi. Cakupan penerapan yang telah diotorisasi: sepuluh migrasi pada proyek pengujian yang disebutkan, provisioning hash/secret gateway, Edge `profile-photo` dan Worker `upahgo-api-staging`. Tidak termasuk proyek/akun cloud baru, upgrade paket, SMS/Maps berbayar, publikasi APK, perubahan produksi atau aktivasi runner PRIV/MEDIA/monitor.

1. Pastikan akun Cloudflare dan Supabase benar, akses proyek tersedia, paket/kuota ditinjau dan izin perubahan staging disetujui. Verifikasi ref sebelum setiap perintah. Simpan kredensial di secret store/file privat yang diabaikan Git; jangan memasukkannya sebagai literal argumen command atau log. Jangan mengubah izin organisasi hanya untuk melewati kegagalan akses.
2. Inspeksi schema, tabel aplikasi, bucket dan riwayat migrasi pada target. Jangan menyimpulkan database bersih dari nama staging atau respons RPC404. Jika ditemukan data/versi tidak sesuai rencana, hentikan penerapan dan tinjau backup serta kompatibilitasnya. Jangan menjalankan `test:db`, `db reset`, migration repair atau SQL penghapusan schema pada proyek remote.
3. Bandingkan file lokal dengan [manifest sepuluh migrasi dan SHA-256](../audits/2026-11-18-production/remediation/qa-001/staging/migration-plan.json). CLI terpasang menyediakan `--project-ref` sehingga tidak perlu mengandalkan proyek yang terakhir di-link. Setelah izin dan akses target tersedia, tinjau rencana terlebih dahulu:

   ```sh
   supabase migration list --profile "$UPAHGO_SUPABASE_PROFILE" --project-ref aqzlgrahfxmbvtfwebsx
   supabase db push --profile "$UPAHGO_SUPABASE_PROFILE" --project-ref aqzlgrahfxmbvtfwebsx --dry-run --skip-vault
   ```

   Jangan memakai `--include-all`, `--include-seed` atau `--include-roles` untuk memaksa riwayat cocok. Setelah rencana cocok dan disetujui, perintah penerapan adalah:

   ```sh
   supabase db push --profile "$UPAHGO_SUPABASE_PROFILE" --project-ref aqzlgrahfxmbvtfwebsx --skip-vault
   ```

   `--skip-vault` mencegah pembaruan Vault yang bukan cakupan migrasi. Jangan menaruh password database pada flag `--password`; gunakan mekanisme kredensial privat CLI yang ditinjau. Verifikasi urutan/hasil dan simpan bukti yang disaring. Schema `upahgo_private` tidak boleh diekspos PostgREST; bucket foto tetap privat.

4. Buat secret gateway acak kriptografis minimal 32 byte, khusus staging. Set `GATEWAY_SECRET` pada Worker dengan `--env staging`, `UPAHGO_GATEWAY_SECRET` pada Edge dengan ref eksplisit, dan hash SHA-256 secret yang sama pada `upahgo_private.gateway_config.secret_hash`. Gunakan parameter query admin, bukan interpolasi secret ke SQL. Penerapan ini menghitung SHA-256 secara lokal dan hanya mengirim digest hex64 yang divalidasi melalui Management API; raw secret tidak pernah menjadi literal SQL. Isi `SUPABASE_PUBLISHABLE_KEY` Worker dari proyek staging; service-role tidak boleh masuk Worker/mobile. Rotasi harus serentak pada ketiga lokasi.
5. Siapkan WASM, tinjau deployment foto, lalu deploy function yang dituju saja:

   ```sh
   npm run photo:prepare
   supabase functions deploy profile-photo --profile "$UPAHGO_SUPABASE_PROFILE" --project-ref aqzlgrahfxmbvtfwebsx --use-api
   ```

   Metode `--use-api` gagal413 untuk WASM15MB pada staging ini. Bundling Docker lokal kemudian berhasil dengan menghilangkan flag tersebut; gunakan `DOCKER_HOST` profil yang ditinjau dan `DOCKER_CONFIG` privat. Tidak mengubah dependency/decoder untuk menghindari batas provider.

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

PRIV/MEDIA/monitor tetap nonaktif sampai pemilik, retensi, scheduler, alarm dan penerimaan provider ditetapkan sesuai runbook masing-masing. Target kapasitas/RPO/RTO masih usulan, bukan hasil uji. Penerimaan Android fisik, Google/Phone, moderasi/cleanup Storage, fault/load/restore dan operasi tetap terbuka. Smoke layanan nyata menutup sebagian pemeriksaan object authorization/foto pending, bukan keseluruhan matriks. Deployment tidak menutup QA-001 atau mengubah status produksi **NO-GO**.
