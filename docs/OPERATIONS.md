# Operasi dan pemantauan (OPS-001)

Source lokal, 19 November 2026. **Belum di-deploy; belum ada scheduler, petugas atau kanal alarm produksi yang diterima.** Panduan ini tidak mengaktifkan layanan. Rilis tetap NO-GO sampai penerimaan staging, privasi vendor dan kepemilikan operasi selesai.

## Kepemilikan dan target awal

Sebelum aktivasi, catat pada sistem operator privat: pemilik utama, pengganti, jam cakupan, kanal utama/cadangan, waktu respons dan cara eskalasi. `OPS_OWNER_REF` hanya referensi tim dalam payload, bukan bukti penugasan. Jangan memakai nama contoh sebagai petugas nyata.

Usulan pilot berikut perlu disetujui dan dikalibrasi dengan baseline staging/beban. Ini bukan hasil pengukuran atau jaminan industri universal.

| Sinyal                 | Usulan awal                                                      | Tindakan                                                                                        |
| ---------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Ketersediaan API       | SLO 99,5% per bulan untuk permintaan aplikasi valid              | Tinjau error budget dan insiden; ukur gateway 5xx serta kegagalan probe, bukan hanya `/healthz` |
| Latensi gateway        | p95 <1 detik untuk action; <5 detik untuk foto                   | Ukur per route/operation; network perangkat di luar durasi server                               |
| Gangguan API           | 5xx >5% selama 5 menit dengan ≥100 request action/photo          | Alarm petugas; trafik sedikit ditopang synthetic, bukan ambang persentase tanpa sampel          |
| Latensi meningkat      | p95 di atas target selama 10 menit, ≥100 request                 | Triase dependency dominan, bukan menaikkan timeout tanpa bukti                                  |
| Limiter                | 429 >10% selama 5 menit dengan ≥100 request                      | Tinjau abuse, lonjakan dan pengguna sah; pisahkan dari 5xx                                      |
| Synthetic              | Jadwal tiap menit, alarm setelah 3 invokasi gagal berturut-turut | Ulangi tiap 15 menit setelah webhook diakui; kirim recovery setelah sukses                      |
| Monitor/scheduler diam | Tidak ada completion selama >5 menit                             | Deadman independen, bukan proses monitor yang memantau dirinya sendiri                          |

Definisikan denominator SLO secara tertulis sebelum pelaporan: hanya action/photo yang valid, pisahkan expected business rejection, auth denial dan rate limiting. Jangan memasukkan health/preflight/404 ke statistik keberhasilan bisnis. Waktu deteksi bergantung scheduler dan durasi probe; tiga kegagalan bukan jaminan alarm tepat tiga menit. Keputusan RPO/RTO, backup expiry dan kapasitas tetap mengikuti penerimaan [PRIV](ACCOUNT-DELETION.md) dan [MEDIA](MEDIA-CLEANUP.md).

## Event dan ID korelasi

Gateway membuat UUIDv4 baru; header klien `X-Request-ID` diabaikan. Semua respons mempunyai `X-Request-ID`; error JSON menambah `requestId`. CORS mengekspos header ini untuk origin yang diizinkan. Body sukses kompatibel dengan klien lama. Gateway meneruskan `x-upahgo-request-id` ke RPC dan Edge foto. Edge hanya menerima ID setelah secret gateway valid, lalu meneruskannya ke upstream sendiri. SQL tidak menambahkan log PII atau tabel audit baru.

`shared/observability.mjs` membangun JSON dari field scalar allowlist. Tidak melakukan serialisasi Request, Error, URL, body atau header. Satu event terminal per permintaan ditambah event untuk setiap transport dependency:

| Field                               | Isi                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `version`, `timestamp`, `requestId` | Versi 1, waktu UTC, UUIDv4 server                                      |
| `service`, `environment`            | gateway/photo; development/staging/production/unknown                  |
| `route`, `method`, `operation`      | Nama tetap dari allowlist; tidak memuat path/parameter mentah          |
| `kind=request`                      | `status`, kode error allowlist atau null, `durationMs`                 |
| `kind=dependency`                   | auth/database/limiter/photo/storage, `status`, `outcome`, `durationMs` |

Outcome: ok, denied(401/403), limited(429), error, timeout. Status0 berarti tidak ada respons transport. Durasi dibatasi 0–120000 ms; dependency mengukur sampai header fetch diterima, **bukan** seluruh pembacaan/decoding body. Request duration mencakup penanganan sampai respons dibuat. JSON rusak dengan HTTP200 bisa mempunyai transport outcome ok tetapi request terminal 5xx; selalu baca keduanya. Kegagalan sink log tidak mengulang atau menggagalkan mutasi bisnis; ketiadaan log perlu dideteksi terpisah oleh operator/provider.

Auth/DB transport gagal menghasilkan NETWORK_ERROR 502, konfigurasi/limiter tak tersedia 503. Penolakan bisnis yang dikenali tetap 4xx; pesan PostgREST tak dikenal menjadi502 tanpa isi vendor. Edge foto tidak menyamarkan Auth outage sebagai sesi invalid. Gateway memakai `redirect: manual`, karena workerd tidak mendukung `error`; respons non-2xx ditolak tanpa meneruskan kredensial ke Location. Edge/CLI Node memakai redirect error sesuai runtime masing-masing.

Di viewer cloud, cari **field custom `requestId`**, lalu service/kind/dependency. Verifikasi lokasi field JSON pada ekspor/provider nyata sebelum membuat saved query; tidak ada nama dataset atau path provider yang diasumsikan source. Hitung count request 5xx/request, p50/p95 request duration, jumlah outcome dependency dan p95 per dependency. Jangan mencampur latency gateway dan Edge menjadi satu distribusi karena perjalanan foto tercatat pada dua service. Jangan jadikan requestId sebagai label metrik berdimensi tinggi. Dashboard/alert metrik di atas belum diprovisi.

## Aktivasi telemetry dan privasi

1. Tinjau paket, kuota, retensi, akses log least privilege, biaya dan kebijakan provider. Source bukan bukti layanan aktif. [Cloudflare Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) menjelaskan konfigurasi; cocokkan dengan versi Wrangler yang dikunci.
2. Worker source menyiapkan `TELEMETRY_ENABLED=true`, observability logs sampling 1, `invocation_logs=false`, `redact_query_string=true`, traces nonaktif. `.dev.vars.example` menonaktifkan custom telemetry lokal. Sampling1 diperlukan agar count source utuh; keterlambatan/drop/retensi provider tetap harus diukur. Jangan memperpanjang retensi otomatis.
3. Edge default diam; pada staging terotorisasi set `UPAHGO_TELEMETRY_ENABLED=true` dan `UPAHGO_ENVIRONMENT=staging` melalui secret/config store server. `production` hanya untuk lingkungan produksi yang disetujui. Jangan menaruh secret pada source atau app build.
4. Injeksikan sentinel sintetis pada body, nomor, GPS, token, query foto/callback dan error upstream. Periksa **raw event beserta seluruh metadata bawaan Cloudflare dan Supabase**, bukan hanya custom JSON. Provider dapat menambahkan URL/path/metadata transport sendiri. Kurangi/nonaktifkan capture yang membocorkan data sebelum menerima lingkungan. Jika tidak dapat memenuhi minimisasi, tahan aktivasi terkait. Jangan menyalin log berisi data nyata ke laporan publik.
5. `upload_source_maps=true` menyiapkan upload source map Worker sebagai artefak privat provider saat deployment terotorisasi. Batasi akses; jangan meletakkannya di static/public bucket. Upload belum dilakukan. Native crash SDK tidak ditambah pada slice backend ini; bila kelak dipakai, perlu consent/retensi, penyaringan breadcrumb dan private symbol/source-map upload tersendiri.

Custom event tidak memuat actor ID, IP, GPS, nomor, OTP, token, gateway/service key, signed URL, object key, query atau isi error vendor. Tes sentinel memeriksa kode aplikasi, bukan jaminan provider. ID korelasi tetap metadata operasional, jangan menggabungkannya ke profil pengguna tanpa dasar yang ditinjau.

## Synthetic satu invokasi

Monitor eksternal menguji GET `/healthz` 204 lalu POST `/v1/action` operasi bootstrap bersesi. Health hanya liveness gateway, tanpa Auth/DB/limiter; bootstrap menguji Auth, limiter dan DB dengan akun sintetis aktif. Tidak menulis profil, mengirim SMS atau menghubungi pengguna. Respons wajib mempunyai ID server dan account ID yang cocok; body dibatasi 256 KiB lalu dibuang. Ini tidak menguji upload foto, seluruh RPC, Google/SMS/Maps, jaringan pengguna atau antrean penghapusan.

Bootstrap bukan transaksi SQL read-only: jalur existing menginisialisasi `accounts` bila belum ada dan memperbarui rate bucket. Inisialisasi akun sintetis lebih dahulu, periksa pemilik token melalui proses admin privat, jangan gunakan sesi pengguna nyata. Monitor memeriksa ID hasil tetapi tidak dapat membatalkan inisialisasi bila operator memasang token akun yang salah. Tidak ada retry mutasi bisnis baru ditambahkan.

Siapkan akun sintetis melalui proses admin staging yang diotorisasi, tanpa identitas/nomor pengguna nyata. Simpan access token pada secret store server. Monitor tidak memiliki service role atau refresh token; token kedaluwarsa menghasilkan SYNTHETIC_AUTH_FAILED dan alarm, tidak menyegarkan dirinya sendiri. Tetapkan pemilik rotasi token dan uji expiry sebelum jadwal diaktifkan. HTTP403 juga perlu triase konfigurasi/origin/izin, bukan otomatis dianggap insiden Auth vendor.

| Environment server           | Aturan                                                          |
| ---------------------------- | --------------------------------------------------------------- |
| `OPS_API_ORIGIN`             | Origin HTTPS saja, tanpa path/query/credentials                 |
| `OPS_SYNTHETIC_USER_ID`      | UUIDv4 akun sintetis yang diharapkan                            |
| `OPS_SYNTHETIC_ACCESS_TOKEN` | Bearer token dari secret store, bukan argumen terminal          |
| `OPS_OWNER_REF`              | Referensi tim 3–40 karakter huruf kecil/angka/underscore/hyphen |
| `OPS_ALERT_WEBHOOK_URL`      | HTTPS receiver terotorisasi; URL dapat menjadi secret           |

URL berasal dari konfigurasi operator tepercaya, bukan input pengguna. Literal IP/localhost dan hostname `.local`/`.internal` ditolak; redirect tidak diikuti. Validasi tersebut bukan pengaman SSRF untuk input publik/DNS rebinding. Batasi egress host monitor ke tujuan yang disetujui pada infrastruktur, jangan mengekspos konfigurasi ini sebagai endpoint pengguna.

```sh
# Node 22.x, secrets diinjeksi runtime; direktori dibuat operator mode 0700.
# Hanya setelah lingkungan dan kanal penerima disetujui.
npm run ops:monitor -- /private/ops/ops-monitor.json --apply
```

Satu invokasi, bukan daemon. State single-host disimpan 0600, write temporary+fsync+rename atomik+fsync direktori, lock eksklusif. State/corrupt/symlink/permission grup-publik ditolak sebelum network. Gunakan direktori privat persisten 0700 yang dimiliki akun OS khusus; jangan NFS/shared directory atau beberapa replika tanpa desain state terkoordinasi. `.gitignore` mengabaikan `ops-monitor*.json*`; jangan masukkan state/kredensial ke repository.

Scheduler harus menangkap stdout/status keluar, batas waktu proses (usulan 60 detik), overlap yang ditolak, error lock/disk/permission dan completion timestamp. Setiap kegagalan scheduler/runner harus mencapai kanal cadangan yang tidak bergantung pada API yang diuji. Deployment scheduler dan deadman belum dibuat. Saat crash, lock sengaja tertinggal: hentikan jadwal, pastikan proses pemilik sudah mati, tinjau state, baru hapus **file lock monitor itu saja** melalui akses operator. Jangan mereset state untuk membungkam insiden.

Output hanya `ok`, stage health/api, status, requestId, kode tetap, durationMs, failures dan notification none/sent/failed. Exit nonzero saat probe gagal, webhook gagal atau state/config rusak. Jangan mem-pipe seluruh environment/response ke log scheduler. Jika state hilang, hitungan/insiden sebelumnya hilang; pulihkan state yang sah atau rekonsiliasi insiden receiver sebelum mulai ulang. Jangan menjalankan state staging terhadap origin produksi.

## Kontrak penerima alarm

Webhook POST memakai JSON `version`, `event` alert/recovery, `ownerRef`, `monitor=api`, `code`, `requestId`, `status`, `incidentStartedAt`. Tidak membawa token, URL target atau response body. Timeout 5 detik, redirect ditolak. Receiver perlu menerjemahkan payload ke kanal petugas yang sebenarnya dan melakukan deduplikasi `Idempotency-Key`.

Tiga kegagalan membuka insiden. State tersimpan sebelum pengiriman. Hanya HTTP 2xx yang mengakui pengiriman; kehilangan respons/ack file dapat mengirim ulang dengan kunci yang sama. Alarm berulang memakai kunci berikut setelah 15 menit dari ack terakhir. Recovery diulang sampai mendapat 2xx. Delivery bersifat **at least once**, bisa duplikat; receiver harus idempoten. Recovery bisa diterima tanpa alert sebelumnya bila pengiriman alert terus gagal. Simpan urutan insiden, jangan mengasumsikan pasangan alert/recovery pasti lengkap.

HTTP 2xx hanya bukti receiver menerima, **bukan bukti petugas melihat atau mengakui**. Uji delivered, human acknowledgement, backup/escalation dan kegagalan receiver/deadman. Token salah/expiry, webhook offline, disk penuh, state corruption dan scheduler berhenti harus terlihat di operasi. Payload tanpa kredensial bukan pengganti autentikasi receiver; lindungi endpoint secret/TLS, akses, rate limit dan rotasi URL. Jangan memakai endpoint Slack/email umum yang tidak menerima kontrak ini tanpa adapter terotorisasi.

## Antrean PRIV/MEDIA dan ledger

`ops:monitor` hanya monitor API. Tidak memanggil RPC admin atau memantau antrean/ledger. Runner PRIV/MEDIA tetap default nonaktif. Infrastruktur scheduler harus memasang routing alarm terpisah sebelum kedua layanan dinyalakan:

| Pekerjaan                              | Sinyal wajib                                                               | Pemulihan                                                                |
| -------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `privacy:process -- --apply`           | Exit nonzero, failed, lease berulang, antrean >24 jam                      | [ACCOUNT-DELETION.md](ACCOUNT-DELETION.md); target 7 hari masih usulan   |
| `privacy:ledger -- export ... --apply` | Ekspor gagal/basi, kapasitas/durabilitas lokasi independen                 | Usulan freshness 1 menit; buktikan offsite dan expiry backup             |
| `media:process -- --apply`             | Exit nonzero, failed/overdue/protected, invalidObjects, incompleteProfiles | [MEDIA-CLEANUP.md](MEDIA-CLEANUP.md); jangan paksa hapus key terlindungi |
| Seluruh scheduler                      | Last completion, overlap/lock, timeout, secret expiry, disk penuh          | Deadman dan kanal cadangan independen                                    |

Jangan menyatakan API sehat berarti penghapusan berjalan. CLI counter lokal bukan alarm terkirim. Rekam owner, jadwal, throughput dan bukti alarm masing-masing; aktivasi, provisioning serta backup/ledger store tidak dilakukan OPS-001.

## Triase, pause dan penerimaan

1. Catat waktu UTC, environment, release commit dan requestId aman. Cari terminal event dan dependency terkait. Bedakan401/403 sesi/izin,429 pembatas,5xx dependency/config, timeout dan body decode. Jangan meminta pengguna mengirim OTP/token/signed URL.
2. Periksa kondisi provider/limiter, perubahan secret/deployment dan konfigurasi. Jangan mengulang mutasi non-idempoten otomatis; cocokkan status bisnis sebelum retry. Worker dan Edge foto mempertahankan ID yang sama, tetapi provider request ID internal dapat berbeda.
3. Bila custom log bermasalah, set flag Worker/Edge false melalui proses deploy terotorisasi; respons tetap mempunyai ID. Untuk metadata capture provider, tinjau juga observability config dan logging Supabase. Pause scheduler lewat operator, catat insiden dan ganti pemantauan sementara; jangan diam-diam membungkam kanal.
4. Rollback artefak gateway/Edge ke commit yang diverifikasi, tanpa mengubah skema atau menghapus state/antrean. Rollback ke versi sebelum perbaikan redirect dapat mengembalikan outage workerd; jangan memilihnya tanpa uji kompatibilitas. Penghapusan bytes PRIV/MEDIA tidak dapat di-rollback lewat source.
5. Sebelum menutup OPS-001 produksi: fault drill Auth/DB/limiter staging, korelasi lintas gateway/Edge, redaction **raw provider metadata**, private source maps, dashboard/count/latency baseline, synthetic expiry, receiver delivered+human ack+escalation, deadman, scheduler antrean/ledger, retensi/biaya/akses dan owner/pengganti diterima. Rekam bukti privat tanpa PII. Tanpa bukti ini, status hanya source siap ditinjau, produksi NO-GO.

[Bukti lokal, threat assessment dan cakupan](../audits/2026-11-18-production/remediation/ops-001/README.md).
