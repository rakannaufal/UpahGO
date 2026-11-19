# QA-001: persiapan dan penerapan staging

Status terbaru 19 November:10 migrasi, Worker staging dan Edge foto sudah diterapkan.55 assertion layanan nyata lulus; [bukti dan batas](live/README.md). Catatan persiapan/CI/katalog di bawah adalah snapshot sebelum penerapan. Google/Phone dan penerimaan Android tetap terbuka.

19 November 2026, baseline `49f69e1`, branch `codex/staging-qa-001`. Pengguna mengonfirmasi proyek Supabase `aqzlgrahfxmbvtfwebsx` khusus pengujian dan belum berisi data nyata; APK fisik belum diuji. Konfirmasi pengguna tidak menggantikan inspeksi schema/riwayat sebelum migrasi.

## Perubahan

- Environment `staging` bernama `upahgo-api-staging`, vars/binding limiter/migrasi SQLite eksplisit, tanpa route produksi. URL pengujian dipindah dari default produksi ke environment staging; default produksi sengaja tidak memiliki target.
- Konfigurasi upstream kosong/rusak dikembalikan sebagai `GATEWAY_NOT_CONFIGURED`503 sebelum limiter/Auth/DB dipanggil. HTTP loopback tetap hanya diizinkan pada development. Tidak mengubah JWT, hak objek, input bisnis, harga/consent/COD, SQL, mobile atau dependency.
- `worker:check:staging` dan gate CI tambahan hanya dry-run. Contoh `.dev.vars` menambahkan URL lokal eksplisit. [Runbook staging](../../../../../docs/STAGING.md) memuat akses, secret, batas deployment, migrasi, rollback dan matriks penerimaan.
- [Manifest sepuluh migrasi](migration-plan.json) berisi SHA-256 file yang harus dibandingkan dengan schema/riwayat target; tidak menerapkan ulang file atau memperbaiki migration history otomatis.

## Verifikasi lokal

| Pemeriksaan               | Hasil / bukti                                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit penuh                | 63/63 lulus pada run lokal; [unit.txt](unit.txt)                                                                                                                                            |
| Regresi konfigurasi final | 2/2 lulus sesudah assertion binding/migrasi diperjelas dan HTTP loopback staging ditambahkan; [config-regressions.txt](config-regressions.txt). Bukan pengganti run penuh CI final          |
| Typecheck/lint            | Lulus; [typecheck.txt](typecheck.txt), [lint.txt](lint.txt)                                                                                                                                 |
| Worker default/staging    | Kedua dry-run lulus, masing-masing 15,46 KiB / 4,83 KiB gzip; [default](worker-default.txt), [staging](worker-staging.txt). Tidak mengunggah Worker atau membuat namespace                  |
| Runtime lokal             | Wrangler/workerd + SQLite Durable Object, empat skenario dengan upstream loopback sintetis lulus; [runtime.txt](runtime.txt)                                                                |
| Akses remote              | [access.json](access.json): login Wrangler terverifikasi, satu akun tersedia. Login Supabase profil terisolasi berhasil dan ref staging terlihat; selector default tidak berubah. Identitas/kredensial tidak disimpan |

CLI Supabase terpasang menyediakan `--project-ref`, `--skip-vault`, function deploy bernama dan `--use-api`; sintaks runbook diperiksa melalui help. Percobaan awal help/version diblokir write cache telemetry di sandbox, lalu help dibaca dengan izin filesystem yang sesuai; tidak ada perubahan konfigurasi proyek remote. Tidak memakai flag yes/force, reset, repair atau disable JWT.

Threat assessment dan focused review: risiko utama adalah salah target, pembagian limiter/secret produksi, serta menganggap liveness sebagai kesiapan. Konfigurasi staging eksplisit dan default tanpa URL mencegah fallback target. Binding tidak menyebut script/environment lain; dry-run tidak membuktikan namespace cloud sudah terisolasi. Regresi membuktikan URL kosong/rusak/HTTP staging ditolak tanpa request keluar. Pembanding source baseline dan source baru membuktikan NETWORK_ERROR502 menjadi kesalahan konfigurasi503 tanpa request keluar; [hasil](config-before-after.json). validasi identitas dan otorisasi tetap. Tidak ada secret baru dibuat, dicetak atau diunggah.

Tidak ada UI baru; Delivery Gate visual N/A. APK demo existing tidak dibangun ulang: mobile/konfigurasi native/dependency tidak berubah. SQL/Edge/export tidak diulang lokal untuk slice gateway/config ini; CI dan regresi browser lanjutan dicatat terpisah di bawah. Hasil sintetis tidak dianggap penerimaan layanan nyata.

## CI staging dan sinkronisasi tes foreground

Run [44522471306](https://github.com/rakannaufal/UpahGO/actions/runs/44522471306), source `a862e57`, percobaan pertama, gagal pada satu kasus Chromium: **62/63 browser lulus** dalam 9,5 menit. Unit63, SQL280, Edge1, audit npm0, export web/Hermes, typecheck/lint, kedua dry-run Worker dan empat skenario runtime lokal lulus. [Metadata](github-ci-first.json), [browser](browser-ci-first.txt), [ringkasan checks](checks-ci-first.txt). Tidak menyatakan run ini sukses.

Trace menunjukkan request `set_location` radius3 dimulai pada125704,762ms; tes memicu visibility pada125708,297ms, sementara bootstrap sesudah write baru selesai sekitar125737,329ms. Refresh lokasi masih berjalan, sehingga guard existing menggabungkan pemicu foreground dan tidak membuat write kelima. Assertion sebelumnya hanya menunggu request mulai, bukan alur selesai. Trace tetap privat pada cache; metadata menyimpan hash log asal.

Fixture kini memberi latensi bootstrap250ms agar race dapat direproduksi. Tes lama gagal dengan nilai4 yang sama; [reproduksi](foreground-reproduced.txt). Percobaan sinkronisasi `networkidle` masih gagal; runtime WebKit juga belum ditemukan karena path lokal belum disertakan, bukan kegagalan aplikasi pada engine tersebut; [bukti](foreground-first-fix.txt). Perbaikan final membuka Perbarui GPS, menunggu tombol Aktifkan lokasi enabled sebagai bukti `locating` selesai, lalu kembali ke Beranda sebelum memicu foreground. Assertion write baru/radius3 tetap; tidak menambah retry suite, menaikkan timeout, atau mengubah kode aplikasi/validasi lokasi. Seluruh delapan kasus lokasi Chromium/WebKit kemudian lulus dalam34,7 detik dengan runtime lokal yang sudah terpasang; [hasil](foreground-final-local.txt).

Run koreksi [44528145983](https://github.com/rakannaufal/UpahGO/actions/runs/44528145983), source `b47d79cfe8324be94d3a565abfd3b672d13beb63`, percobaan pertama, **sukses**. Browser 63/63 dalam 9,3 menit, masing-masing 21 Chromium/Firefox/WebKit; unit63, SQL280, Edge1, runtime Worker4, audit npm0, typecheck/lint, export web/Hermes dan kedua dry-run lulus. [Metadata per langkah dan hash log](github-ci-final.json), [browser](browser-ci-final.txt), [ringkasan checks](checks-ci-final.txt). Commit pencatatan sesudahnya hanya dokumentasi/bukti; source runtime, tes, konfigurasi dan lockfile tetap sama dengan source CI ini. Run gagal sebelumnya tetap dicatat terpisah.

[Pemeriksaan dokumentasi akhir](final-documentation-hygiene.json): JSON, tautan lokal, sintaks blok shell, pola kredensial dan `git diff --check` lulus; scanner source memeriksa120 file tanpa match. Tidak mengulang build/perangkat untuk perubahan dokumen; seluruh source yang diuji CI tetap sama. Pemeriksaan pola bukan audit keamanan menyeluruh.

## Login dan setup agen

Setup agen Cloudflare diminta pengguna secara terpisah. Sebanyak 22 skill resmi terpasang dan MCP berhasil OAuth Minimal (`user:read`, `account:read`, `offline_access`); CLI mencatat `o_auth`. Tool MCP pada runtime belum diuji, perlu muat ulang Codex. Login Wrangler alur perangkat berhasil setelah callback pertama ditolak CSRF. Ini akses/tooling lokal, bukan deployment, validasi kuota atau penerimaan cloud. [Runbook](../../../../../docs/STAGING.md).

Panduan awal `supabase login --profile upahgo-staging` salah: versi 2.119.0 membutuhkan nama bawaan atau path file. `ProfileLoadError` terjadi sebelum login. Source resmi revisi `3cb948c5a70d31fbcb0fd1dcc616ee196a125cd0` diperiksa untuk resolusi profil, keyring dan penyimpanan selector. Login kemudian berhasil dengan file `.cache/supabase-staging/profile.json`, nama kredensial `upahgo-staging`, endpoint Supabase standar dan `SUPABASE_HOME` lokal terpisah. Deteksi agen awal menolak prompt JSON; `--output-format text --agent no` memungkinkan alur interaktif. Token tersimpan di Keychain; selector default dibandingkan sebelum/sesudah dan tidak berubah. Daftar proyek dibaca dan hasil disaring ke keberadaan ref target saja. Tidak logout, membaca atau menimpa kredensial default. File cache tidak masuk Git.

## Katalog staging baca-saja

Satu SELECT metadata melalui Management API menghasilkan HTTP 201: schema `upahgo_private` belum ada, tabel riwayat `supabase_migrations.schema_migrations` belum ada, RPC publik `upahgo_action` tidak ada. Katalog Storage tersedia. [Snapshot](schema-catalog.json). Tidak membaca row pengguna, isi objek, atau membuat role database sementara; ini belum membuktikan seluruh database kosong maupun kebijakan bucket aman.

Percobaan awal `db query --project-ref` tanpa `--linked` ditolak lokal dengan `DbQueryMutuallyExclusiveFlagsError`, sebelum SQL dikirim. Source resmi menunjukkan `--linked` dapat membuat role login sementara dalam preflight, sehingga pemeriksaan menggunakan API resmi langsung dengan kredensial profil staging hanya di memori. Versi migrasi tidak dapat dibandingkan karena tabel riwayat belum ada; kebijakan bucket belum diperiksa. Inspeksi kompatibilitas/backup tetap wajib sebelum write staging.

## Keputusan

Persiapan lokal, CI dan penerapan staging tersedia; **QA-001 tetap terbuka**. Login Wrangler dan akses akun/profil Supabase target sudah terverifikasi. Migrasi/secret/deployment staging kemudian diotorisasi dan diterapkan sesudah tinjauan target/kuota. Pekerjaan ini tidak mengizinkan upgrade paket, aktivasi SMS/Maps, publikasi APK, perubahan produksi atau pengiriman pesan nyata.

Tiga akun sintetis, satu area QA Pekanbaru, JWT/PostgREST/Storage pending dan alur bisnis sudah diuji nyata. Google/Phone, direktori nasional, perilaku Android, moderasi/runner PRIV/MEDIA/OPS, kapasitas serta pemulihan cloud belum diterima. Rilis produksi tetap **NO-GO**.
