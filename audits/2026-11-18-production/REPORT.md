# Audit kelayakan produksi Upahgo

Tanggal: 18 November 2026, WIB. Workspace: `/Users/rakan/Documents/UpahGo`.

## 1. Ringkasan eksekutif

1. **NO-GO untuk pengguna nyata/rilis publik.** Prototipe lokal dapat dipakai untuk demonstrasi dan pengujian sintetis.
2. Upahgo mempertemukan buruh dan penyedia kerja melalui lokasi perkiraan, izin kontak dua pihak, kesepakatan kerja, dan pencatatan pembayaran tunai.
3. Risiko terbesar: pekerjaan aktif lama tidak dapat dibuka setelah batas 100 riwayat; penghapusan akun belum tuntas; kegagalan hapus/upload foto meninggalkan objek; observability belum aktif; bukti backup/restore serta Android/live belum tersedia.
4. Ditemukan **0 P0 terkonfirmasi, 9 P1, 2 P2**. P1 mencakup cacat teruji dan persyaratan kesiapan yang belum dipenuhi; bukan sembilan eksploit keamanan.
5. Lulus: typecheck, lint, 30 tes Node, 135 assertion SQL, 17 tes web Chrome, 1 tes Edge existing, 1 probe kegagalan foto, export web/Hermes, dry-run Worker, serta clean install/typecheck/export web terisolasi.
6. `npm audit`: **41 paket high, 2 moderate, 0 critical**, berasal dari dua advisory. Eksploit melalui input pengguna runtime belum terbukti.
7. Sampel login web pada simulasi 4G lambat: **LCP 13,912 detik; CLS 0,0089**. Ini satu sampel lokal tanpa kompresi, bukan p75 lapangan atau hasil perangkat Android.
8. Usulan beta: 50 pengguna bersamaan, staging terpisah, SLO 99,5%, RPO 1 jam, RTO 4 jam; semua masih target yang harus dibuktikan.
9. Perkiraan awal pekerjaan teknis sebelum rilis: **15–25 hari kerja orang**, ditambah waktu penyedia layanan, keputusan legal, dan UAT. Bukan janji durasi kalender.
10. Tidak ada perbaikan temuan audit, deployment, migrasi remote, SMS nyata, atau aktivasi layanan berbayar. Perbaikan menunggu persetujuan laporan.

## 2. Asumsi, cakupan, dan pemeriksaan

### Konteks dan batas

- Target utama Android; web merupakan preview aplikasi. Stack dipertahankan: npm workspaces, TypeScript strict, React Native 0.88.1, Expo 58, React 19.3, Supabase Auth/PostgreSQL/Storage/Edge, Cloudflare Worker/Durable Object.
- Pengguna Indonesia, dua peran. Data: identitas akun, profil/foto opsional, lokasi, nomor terverifikasi, izin kontak, upah/kesepakatan, ulasan, laporan dan permintaan penghapusan.
- Pembayaran hanya catatan COD. Tidak ada gateway pembayaran, kartu, saldo, escrow, AI/LLM, webhook pembayaran, marketplace pelamar, atau operator web dalam slice ini. Pemeriksaan khusus fitur tersebut tidak berlaku.
- Semua pemeriksaan memakai source lokal, fixture sintetis, database disposable bernama `upahgo_test_audit_20261118`, upstream mock, atau localhost. Tidak mengakses sistem produksi.
- Pengguna meminta usulan kapasitas/pemulihan. Target di [OPERATIONS.md](OPERATIONS.md) adalah rekomendasi berbasis risiko, **bukan angka universal yang diwajibkan industri** dan belum menjadi hasil uji.
- Tahap audit baca-saja mengikuti dokumen pengguna. Penambahan label **Harga tetap** diselesaikan sebagai permintaan terpisah sebelum snapshot; sesudahnya source/config/test snapshot tidak diubah.

### Versi yang diperiksa

Tidak ada commit proyek yang dapat dijadikan identitas rilis. `git rev-parse --show-toplevel` menunjuk parent `/Users/rakan`; `git ls-files -- .` dan `git log --format=%H -- .` masing-masing menghasilkan nol file dan nol commit proyek. Riwayat parent di luar proyek tidak dipindai, tidak diubah, tidak dikomit.

Sebagai bukti pengganti sementara: [source-sha256.json](evidence/source-sha256.json), 108 file source/config/test. SHA-256 manifest: `dfb5dc9c51c8446c255e344f3d3a9179b864851879d0bf798b9ea8a3ba7fd9a9`. [audit-metadata.json](evidence/audit-metadata.json) mencatat tidak ada perubahan pada snapshot sesudah pemeriksaan. Manifest ini tidak menggantikan repository dan proses rilis.

### Hasil perintah aktual

| Pemeriksaan | Hasil aktual | Bukti / batas |
| --- | --- | --- |
| `npm ci --ignore-scripts` pada copy bersih, Node 22.x | Lulus, 868 paket ditambahkan | [clean-install-online.log](evidence/clean-install-online.log). Tanpa `.env`, `.git`, node_modules lama. Install offline pertama gagal `ENOTCACHED`; retry registry berhasil. Tidak mengubah instalasi aktif. |
| `npm run typecheck` | Lulus | [typecheck.log](evidence/typecheck.log). Diulang pada copy bersih: exit 0. |
| `npm run lint` | Lulus, nol warning | [lint.log](evidence/lint.log) |
| `node --experimental-strip-types --experimental-test-coverage --test tests/*.test.ts` | 30 lulus; 0 gagal, skip, cancelled | [unit-coverage.log](evidence/unit-coverage.log) |
| `TEST_DATABASE_URL=<disposable-local> npm run test:db` | 135 assertion lulus | [db-tests.log](evidence/db-tests.log). PostgreSQL lokal dengan Auth shim, bukan Supabase/PostgREST nyata. |
| `npm run test:web` | 17 lulus, 0 gagal, 2,7 menit | [web-tests.log](evidence/web-tests.log). Chrome terpasang, fixture/demo/mocked OAuth. Tidak menguji provider Google/SMS nyata. |
| `npm run test:photo-edge` | 1 lulus, 0 gagal | [photo-edge-network.log](evidence/photo-edge-network.log). Deno, decoder WASM nyata, upstream mock. Retry diperlukan karena DNS sandbox awal gagal. |
| Probe failure foto | 1 lulus: dua kegagalan direproduksi | [photo-failure-probe.log](evidence/photo-failure-probe.log). Lulus berarti temuan berhasil direproduksi, bukan fitur sehat. |
| `npm run build:web` | Export lulus | [build-web.log](evidence/build-web.log); copy bersih juga lulus: [clean-build-web-final.log](evidence/clean-build-web-final.log). |
| `npm run build:android` | Export Hermes lulus | [build-android.log](evidence/build-android.log). **Bukan APK/AAB, build Gradle, atau interaksi Android.** |
| Wrangler deploy `--dry-run` | Lulus, 10,34 KiB / 3,47 KiB gzip | [worker-build.log](evidence/worker-build.log). Tidak upload. Generator kontrak yang menulis source tidak dijalankan saat audit. |
| `npm ls --all --json` | Exit 0 | [npm-tree.json](evidence/npm-tree.json), stderr kosong. Tidak membuktikan seluruh paket diperlukan atau bebas celah. |
| `npm audit --json` | 43 paket terdampak: 41 high, 2 moderate | [npm-audit.json](evidence/npm-audit.json). Exit audit nonzero merupakan temuan, bukan kegagalan menjalankan scanner. |
| `npm run check:secrets` + pemindaian pola diperluas | 87 file pada scanner proyek; 168 file pada scan tambahan; tidak ada pola credential cocok | [secrets.log](evidence/secrets.log), [extended-secrets.json](evidence/extended-secrets.json). Nilai `.env/.dev.vars` tidak dibuka/disalin; riwayat proyek tidak tersedia. Bukan jaminan tidak ada secret. |
| 10 `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` | Berhasil | [data-probes.json](evidence/data-probes.json). Fixture kecil; tidak mengukur skala produksi. |
| Browser tambahan, enam lebar | Dua kolom, label benar, nol overflow / pageerror | [browser-audit.json](evidence/browser-audit.json), screenshot [320](evidence/fixed-card-320.png), [414](evidence/fixed-card-414.png). |
| Burst Worker lokal, 190 request, maksimum 50 bersamaan | 180 HTTP 400 + 10 HTTP 429; nol kegagalan koneksi | [worker-burst.json](evidence/worker-burst.json). Operasi invalid ditolak sebelum Auth; ini verifikasi limiter, bukan kapasitas API sah. |

Copy clean install pertama secara tidak sengaja mengecualikan folder ekspor brand bernama `android`, bersama folder native generated. Warning favicon pada `clean-build-web.log` berasal dari fixture audit tersebut. Aset dipulihkan pada copy, 108 hash source cocok, export akhir di `clean-build-web-final.log` lulus. Ini tidak dicatat sebagai cacat aplikasi.

### Belum terverifikasi

APK/AAB, perangkat/emulator Android, TalkBack, IME/System Back/safe area, fontScale 200%, SecureStore runtime, cold-start OAuth; Safari iOS/Firefox/Edge/WebView; staging Auth/JWT/PostgREST/Storage/Worker; provider Google/Phone saat ini; konfigurasi cloud, IAM/2FA, DNS/TLS/headers CDN, backup, restore dan rollback; load test API sah; UAT pengguna nyata. Android SDK/adb, browser Firefox/WebKit, axe dan Lighthouse CLI tidak tersedia pada lingkungan yang diperiksa. Tidak dipasang diam-diam.

## 3. Arsitektur dan integrasi

```text
Android React Native / web preview
  ├─ OAuth PKCE / verifikasi nomor ── Supabase Auth
  ├─ token native: SecureStore; preview web: memori
  ├─ GPS foreground ── validasi kota/radius pada SQL
  ├─ /v1/action ── Cloudflare Worker
  │                  ├─ Durable Object: limit IP/aktor
  │                  ├─ Supabase /auth/v1/user: validasi sesi
  │                  └─ PostgREST upahgo_action: actor + gateway hash
  │                        └─ schema privat PostgreSQL/RLS, 24 tabel
  ├─ /v1/photo ── Worker ── Edge profile-photo
  │                            ├─ decode/strip EXIF/reencode
  │                            └─ Storage privat + signed URL 60 detik
  └─ peta: Google Maps Android / Leaflet + tile OSM web

Persetujuan dua pihak ── kontak WhatsApp eksternal
Kesepakatan kerja ── konfirmasi hasil ── ACK tunai terpisah ── ulasan
Laporan / permintaan penghapusan ── data privat; operasi akhir belum siap
```

Worker stateless terhadap data bisnis; limiter tersimpan di Durable Object, bukan memori proses. PostgreSQL menjadi otoritas izin/status/nominal. Cache UI dan demo hanya memori. Ketergantungan utama tetap Supabase Auth/DB dan Cloudflare; kegagalan layanan ini menutup operasi live. Tidak ada klaim multi-region failover.

Vendor: Supabase, Cloudflare, Google OAuth/Maps, OSM tile, WhatsApp saat pengguna membuka kontak. Detail data dan inventaris 30 operasi/24 route ada di [COVERAGE.md](COVERAGE.md). Layanan SMS, wilayah hosting, kontrak pemrosesan, akun pembayaran cloud dan paket yang dipakai belum diverifikasi.

## 4. Skor kesiapan

Skor merupakan penilaian editorial kesiapan rilis, bukan persentase keamanan, sertifikasi ASVS, atau probabilitas bebas bug. Setiap modul bobot sama; total adalah jumlah sepuluh skor.

| Modul | Skor / 10 | Alasan |
| --- | --- | --- |
| 1 Arsitektur/kode | 7 | Batas client/server jelas, strict TS; source belum berada dalam riwayat proyek yang dapat dirilis. |
| 2 Backend/API | 7 | Validasi, locks dan limit kuat secara lokal; detail riwayat terbatas dan telemetry kurang. |
| 3 Database/data | 6 | 7 migrasi/135 assertion lulus; penghapusan, retensi, dan bukti restore belum lengkap. |
| 4 Frontend/UX/aksesibilitas | 7 | Alur demo/keyboard/responsif teruji Chrome; aksesibilitas native dan lintas browser belum diterima. |
| 5 Performa/kapasitas | 4 | Ada split route dan limit; sampel web lambat dan kapasitas API sah belum diukur. |
| 6 Keamanan | 6 | Isolasi/consent/server authority diperiksa; advisory high dan verifikasi staging masih terbuka. |
| 7 QA | 6 | Assertion bermakna meliputi lintas aktor/konkurensi; matriks native/live belum dijalankan. |
| 8 DevOps/pemulihan | 3 | Ada workflow/config; observability, deployment terverifikasi, restore dan rollback belum terbukti. |
| 9 Privasi | 3 | Minimisasi lokasi/nomor dan foto privat baik; penghapusan/ekspor/retensi/vendor/legal belum tuntas. |
| 10 Produk/operasi | 3 | Nilai inti/demo jelas; dukungan, operator dan peluncuran belum siap. |
| **Total** | **52 / 100** | **Gerbang rilis menentukan keputusan; skor tidak dapat menggantikan gerbang.** |

## 5. Temuan prioritas

### CORE-001 · P1 · Riwayat 100 entri membuat pekerjaan aktif lama tidak dapat dibuka

| Bidang | Bukti / keputusan |
| --- | --- |
| Modul / keyakinan | Backend, database, UX; **terverifikasi** melalui fixture SQL dan penelusuran caller. |
| Lokasi | `supabase/migrations/202611170001_core.sql:218–221,279–282,343–346`; `apps/mobile/app/contact/[id].tsx:40–44`; `apps/mobile/app/agreement/[id].tsx:37–41`. |
| Reproduksi | Probe menambahkan 101 kontak dan 101 kesepakatan dalam transaction. Kontak accepted tertua dan pekerjaan agreed tertua tetap ada, tetapi tidak masuk hasil 100 terbaru. Detail menjalankan `list.find(id)` lalu `throw new Error("UNAVAILABLE")`. Seluruh tambahan di-rollback. |
| Dampak | Tautan/riwayat lama gagal; pekerjaan yang masih aktif tidak dapat diselesaikan atau dicatat penerimaan tunainya lewat layar detail. Data tidak hilang dari DB, tetapi tidak terjangkau melalui alur UI tersebut. |
| Perbaikan minimum | Tambah operasi detail kontak/kesepakatan berdasarkan ID dengan participant check server; detail route memanggilnya langsung. Tambah pagination cursor stabil pada riwayat/notifikasi; pekerjaan aktif tetap terjangkau. Jangan menghapus limit tanpa pengganti. |
| Usaha | **M**, 1–2 hari termasuk kontrak/SQL/caller/regresi. |
| Verifikasi | Fixture >100; buka objek tertua dari kedua pihak, lakukan transisi sah, aktor ketiga tetap ditolak. Pagination tidak duplikat/menghilangkan entri saat insert baru. Bukti: [data-probes.json](evidence/data-probes.json), [reproduce-data.mjs](evidence/reproduce-data.mjs). |

### PRIV-001 · P1 · Penghapusan akun berhenti pada pembatasan akses

| Bidang | Bukti / keputusan |
| --- | --- |
| Modul / keyakinan | Data/privasi; **terverifikasi untuk implementasi lokal**, bukan klaim kondisi cloud. |
| Lokasi | `apps/mobile/app/delete-account.tsx:25–46`; core SQL `:352–359`; onboarding SQL `:109–115`; photo SQL `:62–65`; `docs/SERVICES.md:62`. |
| Reproduksi | `request_deletion` memasukkan permintaan, mencabut kontak/presence dan mengubah status. Tidak ada finalizer penghapusan dalam proyek. Probe penghapusan Auth langsung pada akun berelasi ditolak SQLSTATE `23503`, constraint `contacts_receiver_id_fkey`. |
| Dampak | Pengguna dapat mengajukan penghapusan, tetapi tidak ada jalur akhir yang terbukti untuk menghapus/anonimkan data, menutup Auth, dan menyelesaikan backup retention. Tidak memenuhi gerbang privasi dalam brief audit. |
| Perbaikan minimum | Tetapkan kebijakan simpan bukti pekerjaan/sengketa; implementasikan finalizer terotorisasi, bertahap, idempoten, dengan anonimasi yang tepat, pembersihan Auth/Storage dan ledger progres. Jangan mengatasi FK dengan cascade membabi buta. |
| Usaha | **L**, 3–5 hari teknis setelah kebijakan disetujui. |
| Verifikasi | Akun dengan kontak, pekerjaan/COD, laporan, ulasan, foto dan dua peran dapat diproses tuntas; retry tidak menghapus data peserta lain; backup expiry/tombstone mencegah data terhapus muncul kembali setelah restore. Bukti: `authDelete` pada [data-probes.json](evidence/data-probes.json). |

### MEDIA-001 · P1 · Kegagalan Storage meninggalkan foto tanpa rekonsiliasi

| Bidang | Bukti / keputusan |
| --- | --- |
| Modul / keyakinan | Backend/data/privasi; **terverifikasi** dengan handler asli, decoder asli, upstream gagal yang di-mock. |
| Lokasi | `supabase/functions/profile-photo/handler.ts:102–114,127–145`; `202611170006_profile_photos.sql:7,26,62–65`; `docs/SERVICES.md:82`. |
| Reproduksi | Storage remove mengembalikan 403, tetapi handler DELETE mengembalikan HTTP 200/status null sesudah metadata dihapus. Pada upload, detail berhasil lalu thumbnail 403: HTTP 400, 1 objek tersisa, 0 compensation call, 0 metadata commit. Queue `media_cleanup` ada, consumer/orphan sweep belum tersedia di proyek. |
| Dampak | Foto privat bisa bertahan melebihi permintaan pengguna; retry dan penghapusan akun tidak membuktikan bytes terhapus. Objek yatim menambah retensi dan biaya. Bucket privat mengurangi paparan, tetapi tidak menyelesaikan penghapusan. |
| Perbaikan minimum | Consumer cleanup dengan retry berbatas/backoff, status/attempt/error aman, dan alarm; rekonsiliasi objek yatim setelah grace period untuk commit tak pasti. Pastikan key aktif tidak pernah terhapus oleh sweep. Nyatakan status hapus logis vs fisik secara akurat. |
| Usaha | **L**, 2–4 hari. |
| Verifikasi | Inject delete/upload/commit timeout; jalankan retry/sweep dua kali; tidak ada orphan sesudah SLA, key aktif tetap ada. [photo-failure-probe.ts](evidence/photo-failure-probe.ts), [hasil](evidence/photo-failure-probe.log). |

### OPS-001 · P1 · Gangguan tidak mempunyai telemetry dan alert yang dapat ditindaklanjuti

| Bidang | Bukti / keputusan |
| --- | --- |
| Modul / keyakinan | Backend/DevOps/keamanan; **terverifikasi pada konfigurasi source**. Observability dashboard cloud tidak diperiksa. |
| Lokasi | `workers/api/wrangler.jsonc:7`: `"observability": { "enabled": false }`; `workers/api/src/handler.mjs:217–239` mengembalikan error generik tanpa request ID/telemetry; `SECURITY.md` mengakui logging nonaktif. |
| Dampak | Auth/RPC/limiter gagal dapat terlihat sama bagi pengguna; tim tidak punya bukti yang disiapkan untuk mendeteksi, menelusuri, atau mengukur gangguan. |
| Perbaikan minimum | Request ID server, event terstruktur allowlist tanpa body/token/nomor/GPS, metrik latency/error/dependency, crash collector tersaring bila diperlukan, uptime synthetic dan alert dengan pemilik. Simpan source map privat. |
| Usaha | **M**, 1–2 hari, ditambah verifikasi kanal alarm. |
| Verifikasi | Ganggu Auth/DB/limiter staging secara terkendali: satu request dapat ditelusuri, alarm sampai ke petugas, error redaction tetap berlaku; test redaction PII. OWASP Top 10:2025 **A09 Security Logging and Alerting Failures**. |

### REL-001 · P1 · Tidak ada source proyek terlacak untuk checkout dan rollback rilis

| Bidang | Bukti / keputusan |
| --- | --- |
| Modul / keyakinan | Arsitektur/DevOps; **terverifikasi**. |
| Lokasi / bukti | Workspace berada di parent Git; 0 file/0 commit proyek. `.github/workflows/checks.yml:19` membutuhkan checkout. [audit-metadata.json](evidence/audit-metadata.json). |
| Dampak | Source lokal dapat dibangun, tetapi belum ada commit proyek yang bisa direproduksi oleh CI atau dipakai sebagai batas rollback/review. |
| Perbaikan minimum | Buat repository proyek terpisah sesuai otorisasi pengguna, periksa ignore/secret, masukkan source dan lockfile, aktifkan PR checks/proteksi branch, tag artefak rilis dengan commit. Jangan mengomit melalui parent repository. |
| Usaha | **M**, setengah hari termasuk validasi checkout bersih/CI. |
| Verifikasi | Checkout baru hanya dari repository proyek menjalankan pipeline; commit/tag/artifact konsisten; rollback ke artefak sebelumnya diuji tanpa menghapus data. |

### QA-001 · P1 · Target Android dan integrasi layanan nyata belum diterima

| Bidang | Bukti / keputusan |
| --- | --- |
| Modul / keyakinan | QA/keamanan/rilis; **terverifikasi sebagai kekurangan bukti**, bukan bug runtime yang sudah terbukti. |
| Lokasi | `apps/mobile/package.json`: build Android adalah `expo export`; `playwright.config.ts` hanya Chrome; `docs/DEVELOPMENT.md:3–18`, `docs/SERVICES.md:66,79–85`. SDK/adb tidak tersedia. |
| Dampak | Export Hermes dan SQL shim tidak membuktikan OAuth cold start, izin GPS, penyimpanan sesi, peta native, keyboard, atau kesesuaian JWT/PostgREST/Storage di layanan yang akan dirilis. |
| Perbaikan minimum | Bangun APK/AAB staging bertanda tangan sesuai kebutuhan uji; jalankan matriks perangkat dan staging sintetis pada [COVERAGE.md](COVERAGE.md). Verifikasi Google/Phone/Maps serta callback sesuai environment. Untuk publikasi web, tambah WebKit/Firefox; kewajiban tiga browser berasal dari gerbang dokumen. |
| Usaha | **L**, 3–5 hari setelah akses/konfigurasi tersedia; waktu provider/store terpisah. |
| Verifikasi | Rekam OS/device/build ID dan hasil izin ditolak, resume, logout/account switch, kedaluwarsa token, cold-start deep link, offline sesudah commit, TalkBack, teks 200%, dan seluruh core flow live sintetis. |

### SEC-001 · P1 · Advisory high pada toolchain belum mempunyai disposition rilis

| Bidang | Bukti / keputusan |
| --- | --- |
| Modul / keyakinan | Keamanan/supply chain; **paket terdampak terverifikasi; eksploit runtime belum terverifikasi**. |
| Lokasi | `package-lock.json`; [npm-audit.json](evidence/npm-audit.json), [advisory-paths.log](evidence/advisory-paths.log). |
| Bukti | `picomatch <=4.0.7`, GHSA-fc5q-39xc-vjpf, high ReDoS; `minimatch >=7 <11.0.1`, GHSA-g3hv-75wg-m249, moderate amplification. Npm menghitung paket terdampak/transitif: 43, bukan 43 cacat independen. Jalur ditemukan pada Expo/Metro/glob/Jest tooling; source app/gateway tidak mengimpor langsung keduanya. |
| Skenario / dampak | Pola glob tidak tepercaya yang mencapai versi rentan berpotensi menghabiskan CPU pada proses tooling/CI. Belum ditemukan jalur input pengguna aplikasi ke sink tersebut. Karena bukti reachability dan mitigasi belum disahkan, gerbang keamanan belum dapat diterima. |
| Perbaikan minimum | Telusuri advisory sampai pemanggil, uji pola reproduksi aman dengan timeout di proses terisolasi, update kompatibel bila tersedia, atau tulis pembatasan input/exploitability dan mitigasi CI untuk persetujuan pemilik risiko. Jangan `npm audit fix --force`: rekomendasi npm dapat menurunkan mayor Expo. |
| Usaha | **M** untuk triase 1–2 hari; migrasi dependency jika diperlukan dapat **L**. |
| Verifikasi | Audit lockfile baru, tes/build semua target dan probe pola; dokumentasikan apakah paket masuk bundle atau hanya build, siapa dapat mengontrol glob, serta keputusan risiko. OWASP Top 10:2025 **A03 Software Supply Chain Failures**. |

### PRIV-002 · P1 · Kebijakan publik, retensi dan tanggung jawab data masih draf

| Bidang | Bukti / keputusan |
| --- | --- |
| Modul / keyakinan | Privasi/legal; **terverifikasi bahwa konten aplikasi masih draf**. Kontrak/cloud/legal eksternal belum diperiksa. |
| Lokasi | `apps/mobile/app/legal.tsx:10–12,30–34`; `apps/mobile/src/help-content.ts:1–2`; `docs/SERVICES.md:62,72–85`; `assets/licenses/README.md` menyatakan hak upstream logo belum diberikan. |
| Dampak | Belum ada janji retensi, kontak pengendali, daftar vendor/wilayah, prosedur hak/insiden dan ketentuan layanan final yang bisa dicocokkan dengan praktik nyata. |
| Perbaikan minimum | Finalisasi inventaris data/vendor dan kebijakan retensi, dasar pemrosesan/consent, penghapusan/backup, kontak pengendali, terms COD/sengketa, deklarasi Play dan hak aset. Tinjau UU PDP/PSE/transfer lintas negara/klasifikasi hubungan kerja dengan konsultan berwenang. |
| Usaha | **L**, 2–4 hari teknis/dokumentasi; tinjauan legal di luar estimasi. |
| Verifikasi | Dokumen publik versi/tanggal tersedia sebelum pendaftaran; tidak ada klaim berbeda dari implementasi; contoh request hak/insiden diselesaikan dalam prosedur yang disetujui. Audit ini bukan nasihat atau sertifikasi hukum. |

### OPS-002 · P1 · Laporan pengguna belum memiliki penanganan operasional

| Bidang | Bukti / keputusan |
| --- | --- |
| Modul / keyakinan | Produk/operasi; **terverifikasi pada produk/dokumentasi lokal**. |
| Lokasi | `apps/mobile/app/help.tsx:29–30,60–61`; `202611170001_core.sql:72–75,339–342`; `docs/SERVICES.md:62,82`. |
| Bukti / dampak | Laporan privat dapat disimpan, tetapi aplikasi sendiri menyebut operator belum diaktifkan. Tidak ditemukan prosedur antrean, penanggung jawab, waktu tanggap atau eskalasi. Laporan pelecehan/kerja tidak aman/upah belum dibayar berisiko tidak ditangani; foto pending juga memerlukan keputusan moderator yang belum disiapkan. |
| Perbaikan minimum | Tetapkan petugas dan jalur dukungan terpantau; sediakan alur manual berizin paling sederhana untuk triase, audit tindakan, pembatasan, banding dan umpan balik. Tidak perlu membangun operator web yang memang ditunda. Foto tetap nonaktif sampai moderasi/cleanup siap. |
| Usaha | **L**, 2–3 hari penyiapan dan latihan; staffing berkelanjutan terpisah. |
| Verifikasi | Kirim laporan sintetis dari aplikasi sampai petugas, respons dan penyelesaian tercatat; akses petugas dibatasi; uji sengketa/blokir serta foto approve/reject tanpa akses publik pending. |

### PRIV-003 · P2 · Ekspor data belum tersedia

| Bidang | Bukti / keputusan |
| --- | --- |
| Modul / keyakinan | Privasi; **terverifikasi dalam cakupan proyek**. |
| Lokasi | Seluruh 30 operasi `shared/worker-contract.mjs:2–33` dan route Akun tidak memiliki alur permintaan/download ekspor. |
| Dampak | Pengguna tidak dapat mengambil salinan data melalui alur yang disiapkan; gerbang dokumen audit tetap mensyaratkan ekspor sebelum GO walaupun severity implementasinya P2. |
| Perbaikan minimum | Ekspor terotorisasi dengan verifikasi ulang yang sesuai, data milik pemohon saja, redaksi data pihak lain, batas ukuran/laju, TTL download dan audit progres. Untuk beta dapat dimulai dari prosedur manual aman yang teruji. |
| Usaha | **M**, 1–2 hari untuk jalur awal terkontrol. |
| Verifikasi | Akun A hanya memperoleh datanya; tidak memperoleh nomor/laporan privat milik pihak lain; expiry/link salah akun ditolak; ekspor besar dan retry berbatas. |

### PERF-001 · P2 · Web cold start lambat pada kondisi 4G yang diuji

| Bidang | Bukti / keputusan |
| --- | --- |
| Modul / keyakinan | Performa; **terverifikasi pada satu sampel preview lokal**, belum pada hosting produksi/native. |
| Lokasi | Build web pada `apps/mobile/dist`; `scripts/serve-preview.mjs:29–33` menggunakan `no-store` tanpa kompresi. [browser-audit.json](evidence/browser-audit.json). |
| Bukti / dampak | Chrome 375×900, CPU 4×, latency 150 ms, 1,6 Mbps turun/0,75 Mbps naik: LCP 13.912 ms, CLS 0,00889, JS transfer 2.241.785 byte. Entry 1.120.408 byte + common 1.112.079 byte, gzip lokal masing-masing 295.076/284.302 byte. Pengguna web di jaringan lambat menunggu lama. |
| Perbaikan minimum | Verifikasi CDN staging dengan Brotli/gzip dan cache immutable aset hash, HTML sesuai kebutuhan; profile cold route, kurangi impor/dependensi/aset yang harus masuk login. Jangan mengganti stack berdasarkan satu sampel. |
| Usaha | **M**, 1–2 hari untuk ukur dan perbaikan terbesar; scope lanjutan bergantung hasil. |
| Verifikasi | Lighthouse/WebPageTest pada staging, minimal lima cold/warm run; catat median/sebaran dan transfer. Target LCP <2,5 s, CLS <0,1, INP p75 <200 ms dari data yang layak. Pengujian API sah dan Android terpisah. |

Tidak ada temuan P3 yang dibesarkan menjadi blocker. Inkonsistensi dokumentasi kecil, misalnya paragraf lama `DESIGN.md:84` yang masih menyebut label hanya saat nego, dicatat untuk sinkronisasi pada tahap perbaikan. Tidak ada bukti cukup untuk menyatakan file/dependency tertentu aman dihapus; tidak mengusulkan refactor spekulatif.

## 6. Hal yang sudah baik

- Sesi/native memakai SecureStore; web di memori. PKCE memakai browser eksternal, callback scheme/host/path diperiksa, popup origin/source divalidasi, exchange code dideduplikasi.
- Worker memvalidasi pengguna lewat Auth, memakai upstream tetap dan menolak redirect, input operasi/field dibatasi, body JSON 16 KiB streaming, timeout eksplisit, limiter gagal tertutup. CORS bukan satu-satunya otorisasi.
- Semua 24 tabel privat hasil migrasi memiliki RLS dan tidak menyediakan kebijakan/grant klien langsung. **Nol policy di schema privat ini disengaja**, bukan tabel terbuka; akses melalui RPC berizin. Fungsi privileged memakai `search_path=''`, actor dari `auth.uid()`, gateway hash dan checks objek.
- SQL memisahkan peran aktif dari peran historis pekerjaan. Advisory/row locks, unique constraints, transisi status, wage integer dan aturan penerimaan tunai diperiksa server.
- Nomor tidak tampil pada discover/profile. Pengungkapan memerlukan nomor terverifikasi, persetujuan kedua pihak, grant belum kedaluwarsa dan tidak diblokir/dicabut.
- GPS foreground, consent presence dan marker perkiraan; tidak ada background tracker. Foto privat pending owner-only, decoder nyata, strip metadata, ukuran berbatas, signed URL singkat.
- Live tidak beralih ke demo saat gagal. Demo dinyatakan sintetis/in-memory; tidak ada klaim SMS/uang/identitas nyata. Hasil selesai, ACK tunai dan rating dibedakan.
- Tes mencakup penolakan lintas aktor, input invalid, race kontak/review, blokir, kedaluwarsa dan pemulihan bootstrap/GPS. Ini layak dipertahankan saat perbaikan.

## 7. Gerbang produksi

| Gerbang | Status | Bukti / syarat yang tersisa |
| --- | --- | --- |
| Keamanan | **Belum bisa dinilai; menahan rilis** | Kontrol lokal/IDOR lulus, tidak ada credential cocok pada scan. Disposition high, riwayat secret dan kontrol Auth/Storage staging belum terbukti. Tidak mengklaim ada high runtime exploitable yang sudah terbukti. |
| Data | **Belum bisa dinilai; menahan rilis** | Migrasi dari kosong dan isolasi SQL lulus; backup otomatis/restore/pooling/enkripsi cloud belum diperiksa. Penghapusan/rekonsiliasi juga terbuka. |
| Fungsional | **Gagal** | CORE-001; hanya Chrome dan upstream sintetis. Native/live/tiga browser belum lulus gerbang brief. |
| Performa | **Gagal untuk sampel web; kapasitas belum bisa dinilai** | LCP 13,9 s; belum ada load test API sah 50 CCU atau p95 staging. CLS sampel lulus. |
| Keandalan | **Gagal pada konfigurasi yang diaudit** | Observability false; bukti uptime/alert/rollback/restore belum ada. Draf runbook audit belum berarti latihan selesai. |
| Aksesibilitas/UX | **Belum bisa dinilai menyeluruh** | Keyboard/six widths/kontras label lulus terbatas; axe, screen reader, native/text scaling dan seluruh state lintas platform belum diverifikasi. |
| Privasi/legal | **Gagal** | Final deletion, ekspor, retensi, kebijakan publik dan review legal belum tuntas. |
| Operasional | **Gagal** | Operator/dukungan/insiden dan rencana rilis belum disahkan/dilatih; DNS/email eksternal belum diperiksa. |
| Kualitas kode | **Sebagian; gerbang belum lulus** | Clean install/typecheck/export lulus, demo eksplisit. Belum ada repository/remote CI/proteksi branch; APK tidak dibangun. |

**GO mensyaratkan seluruh gerbang lulus. GO BERSYARAT tidak sesuai saat bukti Keamanan/Data belum dapat diterima. NO-GO adalah keputusan penerimaan rilis saat ini, bukan pernyataan bahwa server cloud pasti tidak mempunyai backup atau bahwa kebocoran telah terjadi.**

## 8. Roadmap berdasarkan dampak dan usaha

### Sebelum pengguna nyata

1. **REL-001**: repository/commit/CI dasar. Paralel: tetapkan pemilik operasi/legal dan akses staging yang terpisah.
2. **CORE-001**: reproduksi menjadi regresi, detail by ID + pagination. Dapat paralel dengan observability.
3. **SEC-001**: triase jalur high; hasil terverifikasi dan keputusan risiko keamanan. Jangan force downgrade.
4. **PRIV-001, MEDIA-001**: kebijakan data, finalizer, cleanup/reconciliation dan tes kegagalan. Kebijakan harus mendahului penghapusan fisik.
5. **OPS-001** dan bukti Data: telemetry/alerts, backup terpisah, restore dan rollback drill; ukur RPO/RTO nyata.
6. **QA-001**: APK/AAB + perangkat, integrasi staging, browser yang relevan, otorisasi end-to-end, beban 50 CCU. Bergantung layanan siap; bukan paralel tanpa batas dengan perubahan skema.
7. **PRIV-002, OPS-002**, serta **PRIV-003** yang diwajibkan gerbang: kebijakan publik, ekspor aman, dukungan/moderasi, latihan sengketa dan UAT.
8. **PERF-001**: wajib jika web menjadi kanal rilis; bila web tetap preview internal, tetap catat gap dan terima scope secara tertulis. Audit ulang gerbang, baru beta.

Estimasi 15–25 hari kerja orang mempertimbangkan pekerjaan yang berbagi implementasi/tes; menjumlahkan maksimum tiap temuan akan menggandakan sebagian integrasi. Waktu layanan, legal, store dan staffing tidak dapat dijanjikan dari source.

### Minggu pertama setelah beta yang disetujui

Pantau error/latency/contact acceptance/work completion tanpa isi pribadi; triase laporan harian; periksa konsumsi kuota dan salah throttle NAT; tuntaskan temuan UAT. Lakukan restore drill pertama terhadap snapshot staging yang baru. Perbaikan P1 tidak ditunda ke minggu ini tanpa mitigasi tertulis yang memenuhi gerbang.

### Bulan pertama

Uji soak dan data realistis, virtualisasi daftar bila profiling membuktikan jank, rapikan dokumentasi historis, ukur biaya nyata, latih pemulihan dan banding, kaji kapasitas 10×. Jangan menambah replika/queue/service baru tanpa bottleneck yang terbukti.

## 9. Risiko tersisa dan persetujuan

**Belum ada risiko audit yang disetujui untuk diterima.** Usulan target, roadmap, budget dan runbook bukan persetujuan rilis/biaya.

Pemilik produk perlu menunjuk pemilik teknis, dukungan/moderasi, keamanan/privasi dan akses cadangan. Keputusan yang masih memerlukan bukti: wilayah/proyek staging, plan backup yang sanggup memenuhi RPO, vendor peta/SMS, kebijakan retensi/sengketa, dukungan terpantau, hak logo dan status regulasi. Rekomendasi default tersedia pada [OPERATIONS.md](OPERATIONS.md), sehingga audit tidak menunggu keputusan kapasitas tambahan.

## 10. CI dan penerimaan berikutnya

- Checkout repository proyek, Node 22.x, `npm ci --ignore-scripts`, typecheck/lint/unit, prepare WASM/Edge test, secret scan, DB dari kosong, web/Hermes export dan Worker dry-run.
- Tambah regresi CORE-001 dan failure foto, test finalizer/export tenant ownership, limiter runtime, redaction dan kontrak client/SQL. Gunakan fixture sintetis; jangan menaruh service secret di log/artifact.
- Tambah audit dependency dengan reachability/disposition tercatat dan gate exploitable critical/high; audit scanner tidak menggantikan review.
- Web: Chrome/Firefox/WebKit bila dipublikasikan, enam viewport, keyboard/axe, states dan screenshot; native: Gradle release validation, emulator/perangkat, permission/deep-link/session/IME/TalkBack. Simpan OS/build ID.
- Buat staging synthetic smoke setelah deploy, persetujuan produksi terpisah, rollback drill dan restore drill. Tidak mengotomatisasi migrasi destruktif.
- Coverage baseline harus khusus source yang relevan. Angka Node saat ini **90,86% line / 88,27% branch / 89,64% function mencakup file tes**, tidak mewakili seluruh aplikasi. `handler.mjs` 92,95/75,56; `contracts.ts` 94,51/84,21; `map-model.ts` 92,68/92,86. Auth/session/UI/Edge/DO/SQL tidak termasuk pengukuran Node tersebut.
- Sepuluh tes bernilai tertinggi, matriks serangan/cakupan, inventaris endpoint/data, rencana UAT, tiga runbook, biaya dan peluncuran tersedia pada lampiran.

## Lampiran dan acuan

- [COVERAGE.md](COVERAGE.md): checklist seluruh 10 modul, endpoint/route, peta data, schema/query, threat matrix dan rencana tes.
- [OPERATIONS.md](OPERATIONS.md): kapasitas/SLO, biaya, kesiapan operasi, runbook, peluncuran 3 tahap dan FAQ dukungan.
- [UI-DELIVERY.md](UI-DELIVERY.md): perubahan Harga tetap, bukti visual dan batas platform.
- [evidence/](evidence/): log, snapshot, probe reproduksi, metrik dan screenshot.

Acuan resmi diperiksa 18 November 2026: [OWASP Top 10:2025](https://owasp.org/projects/Top-Ten), [API Security Top 10:2023](https://owasp.org/projects/api-security-project), [ASVS 5.0.0 stable](https://asvs.owasp.org/), [MASVS](https://masvs.owasp.org/), [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds). ASVS level 2 menjadi kerangka telaah, **bukan klaim semua requirement L2 sudah diuji atau dipenuhi**. Pemeriksaan UU PDP merupakan tinjauan teknis yang perlu validasi hukum.

Berhenti pada laporan sesuai instruksi pengguna: “Jangan mengubah kode, data, atau konfigurasi sebelum aku menyetujui laporan.” Pengecualian yang sudah selesai sebelum audit adalah permintaan label Harga tetap; seluruh probe/data tambahan hanya sintetis dan lokal.
