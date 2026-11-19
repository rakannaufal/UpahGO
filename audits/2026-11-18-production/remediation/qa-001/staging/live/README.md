# QA-001: layanan staging nyata

APK QA **staging** terbaru: `.cache/qa/upahgo-qa-staging-0.1.0-arm64.apk`, SHA-256 `81cfc39a7ea530e56beb17d0d490fea0c260a38cb4bc8f9ad3055283375de7be`. Endpoint staging tertanam; APK demo lama tetap. Release build bertanda tangan debug, arm64/API24+, tanpa Maps key. Google aktif di staging; Phone tetap nonaktif. Login Google lengkap dan APK pada Android belum diuji. [Verifikasi APK](apk.json).

19 November 2026. Proyek khusus pengujian `aqzlgrahfxmbvtfwebsx`; source layanan `2715d87772c4a8bbc73cf8ecde0a6eb75cd7ddab`. Instruksi pengguna untuk melanjutkan sampai selesai mencakup penerapan rencana staging yang sudah ditinjau. Produksi, paket berbayar, SMS nyata dan publikasi aplikasi tidak diaktifkan.

## Hasil

| Pemeriksaan | Bukti / hasil |
| --- | --- |
| Migrasi remote | Sepuluh versi diterapkan berurutan sesudah dry-run cocok. Hash file sesuai manifest. Tidak reset/repair atau menjalankan test-db pada remote. [database.json](database.json) |
| Database | 28 tabel privat, seluruhnya RLS; authenticated tidak memiliki USAGE schema privat; anon tidak mendapat execute RPC. Bucket foto privat, JPEG, batas 1 MiB. Gateway menyimpan hash SHA-256, raw secret hanya di secret store/file privat |
| Cloudflare | Workers Free dikonfirmasi melalui dashboard; subdomain khusus staging dibuat. [Worker HTTPS](https://upahgo-api-staging.upahgo-dev-rakan.workers.dev/healthz), limiter SQLite namespace sendiri dan secret diunggah atomik. Health204 hanya liveness. [Versi/binding](deployment.json) |
| Edge foto | `profile-photo` v1 ACTIVE, `verify_jwt=true`, static WASM. API bundling gagal413 karena ukuran; bundling Docker lokal resmi berhasil, paket16MB. Tidak membuka JWT atau bucket |
| Alur inti | [core.json](core.json):30 assertion lulus, Auth/PostgREST/Worker nyata. Profil harga/nego, lokasi/discovery, kontak/consent bilateral, kesepakatan, completion/COD terpisah, concurrency, ulasan/notifikasi/laporan dan penolakan pihak ketiga |
| Foto/blokir | [media.json](media.json):14 assertion lulus. JPEG diproses WASM dan disimpan privat; pending hanya pemilik; direct Storage ditolak; DELETE202 antrean, blokir menutup discovery/kontak, histori tetap tersedia, permintaan penghapusan membatasi akun |
| Batas keamanan | [security.json](security.json):11 assertion lulus. Edge tanpa JWT401, JWT valid tanpa gateway403, helper service-only403, origin asing403, body besar413, signature JWT berubah401, public Storage ditolak, signed URL ditolak setelah TTL60detik |
| OAuth | Google aktif, client Web/secret pengganti terpasang; probe kredensial dan redirect302 lulus. Login Google/Android belum diuji; Phone nonaktif. [Bukti](google-oauth.json), [konfigurasi dan batas](../../../../../../docs/GOOGLE-STAGING.md) |

Satu percobaan awal core berhenti karena skrip mengharapkan `FORBIDDEN` untuk pihak ketiga, sedangkan kontrak SQL sengaja memakai `UNAVAILABLE`. [core-initial.json](core-initial.json) dipertahankan. Ekspektasi diperbaiki berdasarkan SQL dan dilanjutkan dari checkpoint kontak yang sudah diterima; tidak melonggarkan hak akses/mengulang transaksi. Core final memuat assertion awal dan lanjutan, termasuk pengulangan pemeriksaan login. Angka assertion bukan jumlah skenario unik atau skor keamanan.

Tiga akun sepenuhnya sintetis: email `.invalid`, password acak, nomor fiksi rentang NANP5550100–0199 dikonfirmasi melalui admin fixture. Tidak ada SMS/email/WhatsApp dikirim. Session password Auth nyata tidak memverifikasi Google, PKCE native atau OTP. Identitas/nomor/token/signed URL/body privat tidak disimpan di bukti publik. Kredensial, secret dan respons mentah berada dalam `.cache/qa/staging-private/` mode0600/direktori0700, diabaikan Git. Jangan memasukkannya ke artefak CI.

City memakai batas beratribusi dari `shared/pekanbaru.json` (OpenStreetMap/ODbL1.0); area berlabel **Area sintetis QA Pekanbaru**. Ini bukan direktori layanan nasional. Dua akun aktif/fixture pekerjaan tetap tersimpan; pihak ketiga berstatus deletion_requested. Foto retired diantrekan; runner tetap nonaktif sehingga belum ada klaim bytes telah terhapus. Tidak membersihkan fixture melalui penghapusan Auth langsung yang melewati protokol PRIV.

## Reproduksi dan batas

`scripts/test-staging.mjs` memerlukan file JSON privat mode0600 dan opt-in ref tepat. File berisi `ref`, `supabaseUrl`, `anonKey`, `serviceRoleKey`, `workerUrl`, `areaId`, lalu checkpoint/credentials fixture. Secret gateway tidak dibaca oleh skrip pengujian; skrip tidak dapat mengirim header bypass. Jangan memakai produksi atau mengganti ref untuk melewati guard. Core menolak replay scenario yang sudah memiliki kontak/kesepakatan; gunakan fixture terisolasi baru setelah meninjau lifecycle nomor/akun. Opsi `--resume` hanya untuk checkpoint kegagalan awal yang tercatat, bukan retry mutasi otomatis.

```sh
export UPAHGO_STAGING_WRITE_ACK=aqzlgrahfxmbvtfwebsx
export UPAHGO_STAGING_CREDENTIALS="$PWD/.cache/qa/staging-private/runtime.json"
export UPAHGO_STAGING_JPEG="$PWD/tests/fixtures/synthetic-photo.jpg"
node scripts/test-staging.mjs core
node scripts/test-staging.mjs media
node scripts/test-staging.mjs security
```

Perintah ini menghasilkan data dan menulis bukti sesuai phase, bukan dry-run. Jangan menjalankan ulang pada checkpoint saat ini atau menimpa bukti penerimaan lama. `scripts/test-db.mjs` hanya untuk PostgreSQL disposable lokal: script tersebut menghapus schema.

Belum diterima: A01–A11 pada Android fisik; Google/Phone nyata; foto approved/moderasi dan cleanup cloud retry/orphan; erasure/ledger/restore; fault injection dan alarm/operator; limiter threshold terdistribusi; ramp-up/soak50 pengguna; RPO/RTO. Latensi tes ini bukan benchmark kapasitas. Retensi/raw metadata provider masih memerlukan penerimaan operator. PRIV/MEDIA/monitor/scheduler tetap nonaktif, belum ada backup/restore drill cloud atau proteksi branch yang diverifikasi. **QA-001 tetap terbuka; produksi NO-GO.**

Bundling: Docker/Colima yang sudah terpasang memakai profil `upahgo-qa`, direktori VM lokal `.cache/colima`/`.cache/lima`, socket profil tersendiri dan `DOCKER_CONFIG` privat tanpa helper Desktop yang sudah tidak tersedia. Konteks default tidak diaktifkan. Image resmi `public.ecr.aws/supabase/edge-runtime:v1.77.1`, digest `sha256:645d0e45446181f3e9d87efeef637b494615f32365befff00e2d2b0fe8535fef`. [Batas bundling resmi](https://supabase.com/kb/troubleshooting/edge-function-bundle-size-issues). CLI terpasang memakai Docker saat flag `--use-api` dihilangkan; flag `--use-docker` pada dokumentasi terbaru belum tersedia di versi ini.

Postflight agregat:3 akun Auth (2 aktif,1 dibatasi),1 kesepakatan completed dengan ACK COD,1 kontak dicabut,1 laporan sintetis,4 objek foto retired,2 antrean cleanup,0 referensi foto aktif dan0 upload in-flight. [Hitungan akhir](postflight.json). VM bundling khusus UpahGO sudah dihentikan; file/cache tetap.

Verifikasi lokal akhir:63/63 unit, typecheck/lint, pola secret, syntax/format skrip dan npm audit0 temuan. Build APK dan pemeriksaan bytes/signature lulus. [Catatan pemeriksaan](verification.json). Source runtime/dependency/lockfile tidak berubah dari deployment; browser/SQL/Edge/runtime lokal penuh terakhir tetap pada CI yang ditautkan di laporan staging. Tidak mengulang tes tersebut sebagai klaim layanan nyata. Tidak ada perubahan UI; visual gate N/A.
