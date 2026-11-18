# OPS-001: telemetry dan operasi

19 November 2026. Dasar `0a72d59` (MEDIA-001), branch `codex/fix-ops-001`. **Implementasi source dan verifikasi lokal selesai; temuan produksi masih terbuka, rilis NO-GO.** Tidak ada deployment, migrasi remote, aktivasi scheduler/provider, webhook nyata atau pengiriman pesan petugas.

## Masalah dan hasil perubahan

Baseline handler diberi DB HTTP503 sintetis: respons 400 INVALID_INPUT, tanpa request ID/log. [Reproduksi](evidence/baseline.txt). Laporan audit awal tidak ditulis ulang.

Gateway/Edge kini memakai UUIDv4 server untuk respons, error dan korelasi upstream; ID klien tidak dipercaya. Helper telemetry menyusun JSON scalar allowlist, tanpa body, header, URL, actor, nomor, GPS atau pesan vendor. Ada event terminal request dan dependency auth/database/limiter/photo/storage dengan status, outcome dan duration. Transport failure/DB error tak dikenal menjadi 5xx, penolakan bisnis dikenal tetap 4xx; DELETE foto mempertahankan 202. Edge Auth outage dibedakan dari 401. Flag custom log dapat dimatikan tanpa menghilangkan ID respons.

Konfigurasi source Worker menyiapkan logs sampling 1, query redaction, invocation logs/traces nonaktif dan private source-map upload. Belum diterapkan ke cloud; tes aplikasi **tidak** membuktikan raw metadata provider bebas PII. Edge telemetry default nonaktif sampai flag server disetujui. Tidak menambah analytics/crash SDK mobile atau dependency.

Monitor Node 22 satu invokasi menguji liveness 204 dan bootstrap akun sintetis melalui API. Bootstrap existing dapat menginisialisasi account dan mengubah rate bucket; bukan transaksi SQL read-only. Token harus milik akun sintetis terverifikasi. Body dibatasi, hasil hanya kode/status/durasi/ID. State/lock private 0600 dengan parent 0700, validasi/symlink guard dan fsync+rename. Alarm setelah 3 kegagalan, repeat 15 menit, recovery, retry dengan kunci idempoten dan ack setelah 2xx. Ini source receiver contract, bukan kanal yang sudah mengirim ke petugas. Scheduler, deadman, dashboard dan integrasi alarm antrean/ledger masih konfigurasi operator yang belum diterima.

## Bug runtime yang ikut diperbaiki

Uji pertama pada workerd asli menemukan `redirect: error` tidak didukung runtime ini. Mock Node dan dry-run bundle tidak mendeteksinya; Auth fetch gagal sebelum mencapai upstream. [Diagnostik sebelum perbaikan](evidence/runtime-diagnostic.txt) memuat error platform dan hanya fixture sintetis. Gateway sekarang menggunakan manual, menolak non-2xx, tanpa mengikuti Location. Node/Deno mempertahankan error yang didukung runtime masing-masing. Tes runtime final menggunakan entry point produksi asli, tanpa wrapper diagnostik.

## Threat assessment terarah

Rujukan OWASP A09/ASVS/MASVS sesuai batas server/mobile; bukan sertifikasi atau audit menyeluruh.

| Aset/batas                | Ancaman                                                                | Kontrol dan bukti                                                                                     | Batas                                                                                              |
| ------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Request menuju log/vendor | Kebocoran token, nomor, GPS, signed URL, isi error                     | Konstruktor event allowlist scalar; sentinel body/header/query/response/error diuji unit/Edge/runtime | Metadata bawaan Cloudflare/Supabase wajib diperiksa di staging                                     |
| ID klien/gateway/Edge     | Pemalsuan korelasi, log injection                                      | Gateway UUID baru; Edge menerima UUID hanya setelah secret valid; upstream ID sama                    | Tidak menambahkan audit transaksi SQL, bukan bukti otorisasi dengan ID saja                        |
| Dependency/response       | Outage terlihat sebagai invalid input; redirect membocorkan kredensial | Mapping 5xx, manual redirect workerd, failure events, regression runtime                              | Provider timeout/limiter fault nyata perlu drill staging                                           |
| Monitor/receiver          | Token/URL bocor, target salah, alarm duplikat/diam                     | Config operator HTTPS, fixed endpoint, batas body/waktu, output allowlist, Idempotency-Key            | Konfigurasi tepercaya; egress/DNS, receiver auth/dedupe, expiry token dan human ack perlu operator |
| State/scheduler           | Race, korupsi/symlink, crash/disk, kehilangan hitungan                 | Lock eksklusif, private mode, read nofollow, atomic durable save; tes filesystem                      | Single host; fsync bukan offsite; crash lock/deadman butuh operasi independen                      |
| Foto/penghapusan          | Monitor sehat disalahartikan sebagai antrean tuntas                    | Kontrak foto 202 tetap, runbook membedakan API/PRIV/MEDIA/ledger                                      | Monitor API tidak memproses atau memantau admin queue                                              |

## Verifikasi yang dijalankan

Node 22.23.3 pada macOS; Wrangler 4.163.0. Semua upstream/akun/webhook pengujian sintetis, kecuali runtime decoder WASM dan Worker/SQLite DO yang benar-benar dijalankan lokal.

| Pemeriksaan                           | Hasil                                                                                                                              | Bukti                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `npm test`                            | 56/56 lulus: 43 existing + 7 telemetry + 6 monitor                                                                                 | [unit.txt](evidence/unit.txt)                                                         |
| Deno cached-only Edge, allow-env/read | 1 integrasi lulus, decoder asli; Auth 503, Storage 403, commit failure, ID/redaction dan 202                                       | [edge.txt](evidence/edge.txt)                                                         |
| `npm run test:ops-local`              | 4 skenario runtime lulus: sukses, Auth 503, PostgREST 400 tak dikenal, redirect 302 ditolak; ID upstream/event sama, redaksi lulus | [runtime.txt](evidence/runtime.txt), [script](../../../../scripts/test-ops-local.mjs) |
| `npm run typecheck`                   | Lulus                                                                                                                              | [typecheck.txt](evidence/typecheck.txt)                                               |
| `npm run lint`                        | Lulus; lint repository mencakup app mobile                                                                                         | [lint.txt](evidence/lint.txt)                                                         |
| `npm run worker:check`                | Dry-run lulus, 15.37 KiB /4.82 KiB gzip; tidak deploy                                                                              | [worker.txt](evidence/worker.txt)                                                     |
| Secret pattern check, format dan diff | Lulus: 116 file dipindai tanpa pola credential, Prettier dan diff check bersih                                                     | [secrets.txt](evidence/secrets.txt), [hygiene.txt](evidence/hygiene.txt)              |

Unit monitor mencakup probe salah akun/token/JSON besar, error jaringan, 3 kegagalan, repeat/recovery, webhook503 retry kunci sama, state corrupt/permission/symlink/lock serta CLI explicit apply/error aman. Unit telemetry mencakup Auth/DB/limiter fault dan timeout sintetis, malformed response, early reject, terminal event tunggal, flag off dan sink error tanpa menggagalkan respons. Alert diuji melalui **mock receiver**, tidak melalui petugas nyata.

Runtime test memakai config/env kosong dan state sementara, loopback port dinamis, entry point asli, tidak membaca `.dev.vars` proyek. Proses/server/state milik tes dibersihkan pada finally. CI menambahkan command runtime yang sama; hasil GitHub Actions belum diterima. Evidence command disimpan sebagai teks dengan ANSI/trailing whitespace dinormalisasi; tidak mengubah hasil semantik.

SQL, app UI dan dependency tidak berubah. DB, browser, ekspor web/Hermes, perangkat Android/TalkBack tidak diulang untuk slice backend ini; hasil MEDIA sebelumnya tetap historis. Tidak ada verifikasi cloud dashboard, private source-map upload nyata, Supabase raw metadata, provider/storage, beban produksi atau delivery kanal. Dependency audit tidak diulang; SEC-001 masih terbuka, tidak ada klaim versi rentan telah diperbaiki.

## Focused review

Ponytail-review menelusuri gateway ke limiter/Auth/RPC/Edge, Edge ke Auth/Storage/RPC, client error decoder existing, monitor, state dan receiver, script/CI dan konfigurasi source. Asumsi: pilot API dengan batas existing 180/IP dan 90/akun per menit; monitor satu host dengan direktori operator privat, bukan cluster.

Must-fix yang ditemukan selama implementasi sudah diperbaiki dan diuji: redirect error tak didukung workerd; PostgREST error internal disamarkan 400; HTTP 202 foto diratakan 200; Edge Auth 503 disamarkan 401. Unknown log codes route 404/method 405 juga masuk allowlist tetap. Tidak ditemukan blocker source tersisa dalam cakupan review ini; penerimaan operasional di bawah tetap blocker rilis.

UI tidak diubah, sehingga seluruh Delivery Gate antislop untuk visual/layout/control/motion **N/A**, bukan PASS palsu. Tidak membuat aset/identitas/copy layar baru. Tidak menambah framework, dependency atau backend metrik terpisah; memakai event provider dan CLI single-host yang dapat ditinjau. Panduan target/ambang dinyatakan usulan, bukan metrik yang telah dicapai.

## Syarat penutupan produksi

Ikuti [OPERATIONS.md](../../../../docs/OPERATIONS.md). Wajib owner utama/pengganti dan eskalasi nyata; izin/retensi/biaya log; private source maps; dashboard error/latency/dependency; fault drill Auth/DB/limiter; korelasi gateway/Edge; raw metadata provider redaction; synthetic token expiry; receiver delivered+human acknowledgement+dedupe+recovery; scheduler/deadman independen; alarm PRIV/MEDIA dan ledger; backup/restore serta target kapasitas yang diterima. Tidak ada satu pun kanal nyata diklaim aktif oleh hasil lokal.

Langkah source berikut yang disarankan: SEC-001, disposition/remediasi advisory toolchain. Aktivasi cloud, migration, scheduler dan pengiriman alarm memerlukan otorisasi lingkungan terpisah. Jangan membuka produksi berdasarkan tes lokal ini saja.
