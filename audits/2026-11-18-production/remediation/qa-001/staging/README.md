# QA-001: persiapan staging

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
| Akses remote              | [access.json](access.json): Cloudflare belum login; Supabase memiliki sesi tetapi target tidak terdaftar. Parsing diperiksa pada field `id` dan `ref`; identitas proyek lain tidak disimpan |

CLI Supabase terpasang menyediakan `--project-ref`, `--skip-vault`, function deploy bernama dan `--use-api`; sintaks runbook diperiksa melalui help. Percobaan awal help/version diblokir write cache telemetry di sandbox, lalu help dibaca dengan izin filesystem yang sesuai; tidak ada perubahan konfigurasi proyek remote. Tidak memakai flag yes/force, reset, repair atau disable JWT.

Threat assessment dan focused review: risiko utama adalah salah target, pembagian limiter/secret produksi, serta menganggap liveness sebagai kesiapan. Konfigurasi staging eksplisit dan default tanpa URL mencegah fallback target. Binding tidak menyebut script/environment lain; dry-run tidak membuktikan namespace cloud sudah terisolasi. Regresi membuktikan URL kosong/rusak/HTTP staging ditolak tanpa request keluar. Pembanding source baseline dan source baru membuktikan NETWORK_ERROR502 menjadi kesalahan konfigurasi503 tanpa request keluar; [hasil](config-before-after.json). validasi identitas dan otorisasi tetap. Tidak ada secret baru dibuat, dicetak atau diunggah.

Tidak ada UI baru; Delivery Gate visual N/A. APK demo existing tidak dibangun ulang: mobile/konfigurasi native/dependency tidak berubah. SQL/Edge/export/browser tidak diulang lokal untuk slice gateway/config ini; hasil source sebelumnya tidak dianggap penerimaan source baru atau layanan nyata. CI source staging berikutnya harus dicatat terpisah.

## Keputusan

Persiapan lokal tersedia, **staging belum di-deploy dan QA-001 tetap terbuka**. Login Cloudflare dan akses akun/profil Supabase ke proyek yang benar diperlukan. Sesudah akses benar, migrasi/secret/deployment masih memerlukan otorisasi target dan tinjauan kuota; persiapan source tidak mengizinkan upgrade paket, aktivasi SMS/Maps, publikasi APK, perubahan produksi atau pengiriman pesan nyata.

Google/Phone, tiga akun uji sintetis, direktori wilayah, JWT/PostgREST/Storage, perilaku Android, operator PRIV/MEDIA/OPS, kapasitas serta pemulihan cloud belum diterima. Rilis produksi tetap **NO-GO**.
