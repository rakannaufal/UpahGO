# Usulan kapasitas, operasi dan peluncuran

Lampiran [REPORT.md](REPORT.md). Semua angka di bawah merupakan **target/usulan**, bukan layanan aktif, kontrak SLA, hasil benchmark, atau persetujuan pembelian. Tidak ada satu angka kapasitas/RPO/RTO yang berlaku universal bagi seluruh industri; target mengikuti dampak kehilangan catatan kerja dan keterbatasan tim awal.

## 1. Target awal yang disarankan

| Aspek | Beta terbatas | Publik tahap awal, sesudah beta lulus |
| --- | --- | --- |
| Cakupan | Satu kota yang benar-benar diprovisi dan ditinjau; undangan | Tetap satu kota sampai operasi/kualitas terbukti; tidak mengklaim nasional |
| Kapasitas penerimaan | **50 pengguna bersamaan**, sekitar 500 DAU sebagai asumsi perencanaan | Uji **200 pengguna bersamaan** sebelum menaikkan batas; tambah berdasarkan pengukuran |
| Lingkungan | Dev lokal + staging terpisah + production terpisah | Project/Auth/bucket/secret/Worker/Maps restriction terpisah, least privilege |
| Ketersediaan alur inti | **99,5% bulanan** | **99,9% bulanan**, hanya setelah monitoring dan kemampuan petugas mendukung |
| Anggaran gangguan 30 hari | 3 jam 36 menit | 43 menit 12 detik |
| Read latency | p95 ≤500 ms, p99 ≤2 s | Target sama, diuji dari wilayah pengguna |
| Write latency | p95 ≤1 s, p99 ≤3 s | Target sama, ambiguity commit ditangani |
| Pemrosesan foto | p95 ≤5 s server, waktu transfer dilaporkan terpisah | Batas CPU/memori dan antrean nyata diverifikasi |
| RPO: kehilangan data maksimum setelah bencana | **1 jam** | **15 menit** untuk DB catatan kerja, dengan paket/arsitektur yang mendukung |
| RTO: pemulihan layanan inti | **4 jam** | **1 jam**; dapat lebih ketat setelah latihan |
| Rollback aplikasi | Target Worker/web ≤15 menit | Target ≤10 menit; rollback Android tidak seketika melalui toko |
| Penanggung jawab | Pemilik produk/teknis + petugas cadangan ditunjuk | Jadwal siaga/eskalasi terdokumentasi; hak akses cadangan diuji |

RPO dihitung dari data terakhir yang benar-benar dapat dipulihkan, bukan sekadar interval job backup. RTO dihitung dari gangguan sampai alur inti pulih dan tervalidasi. Satu bencana dapat menghabiskan anggaran gangguan bulanan walaupun RTO tercapai; hentikan ekspansi/rilis berisiko saat error budget habis.

### Definisi SLI dan alert

- **Availability**: aksi sah pengguna yang selesai dengan hasil bisnis benar / seluruh aksi sah. Kegagalan `NETWORK_ERROR`/dependensi tetap dihitung meskipun HTTP dipetakan menjadi 400 oleh handler. Penolakan input/izin yang memang diharapkan tidak dihitung sebagai outage; throttle pengguna sah karena overload dihitung sebagai kegagalan layanan.
- **Latency**: end-to-end gateway termasuk Auth/RPC; ukur p50/p95/p99 per operasi, pisahkan image upload/download dan client network. Jangan mengutip latency limiter lokal sebagai latency API nyata.
- **Business integrity**: duplicate agreement/ACK yang salah, pengungkapan nomor tanpa consent, wrong-user data: target nol; satu kejadian menghentikan rilis dan memicu investigasi.
- Usulan alarm: synthetic probe gagal 3 kali dalam 3 menit; error internal >2% selama 5 menit dengan minimal 20 aksi; p95 read >1 s selama 10 menit; cleanup tertua >24 jam; backup tertinggal >RPO; Storage/DB/kuota >80%. Sesuaikan low-traffic agar alarm tidak bising.
- Satu petugas utama dan cadangan, kanal terpantau serta jadwal eskalasi harus diuji. Tidak ada pesan/alarm sungguhan yang dikirim oleh audit ini.
- Log allowlist: timestamp, random request ID, operation, status/error class, duration, dependency, build ID. Hindari bearer/OTP, nomor, email, nama, raw GPS, isi tugas/laporan, callback code, signed URL dan bytes foto. Evaluasi kebutuhan korelasi akun pseudonim; batasi akses/retensi.

### Rencana load test staging

1. Siapkan project staging dan aktor sintetis dengan lokasi/kota sah, dua peran, profil, kontak/pekerjaan/ulasan yang realistis. Jangan memakai data produksi.
2. Warm-up 5 menit; ramp 1/10/25/50 virtual user; steady 50 selama 30 menit; spike 100 selama 5 menit; soak 2 jam dengan beban lebih rendah. Uji failover dependensi secara terkontrol setelah baseline.
3. Think time acak 5–15 detik; campuran awal 60% discovery, 20% profile/reviews, 10% activity/notices, 10% write sintetis yang valid. Foto diuji terpisah karena biaya decoder/Storage berbeda.
4. Ukur sepuluh operasi utama: bootstrap, discover, profile, contacts, agreements, notifications, request_contact, respond_contact, create_agreement, agreement_action. Laporkan p50/p95/p99, business errors, throughput, cold start, DB connections/CPU, Storage/DO/quotas.
5. Uji IP terdistribusi dan **shared NAT**. Konfigurasi kini 180/IP/menit (rata-rata 3 request/detik); 50 orang di jaringan bersama dapat terkena throttle. Batas tetap menit juga memungkinkan burst sekitar pergantian window. Jangan menaikkan batas tanpa mengukur abuse/kapasitas.
6. Lulus: target p95, internal errors <1%, nol integrity/privacy defect, tidak ada antrean/koneksi/memori tumbuh terus selama soak, dan recovery setelah spike terbukti. Expected 429 akibat script sengaja melampaui limit dilaporkan terpisah.

Yang **sudah diukur** hanya burst local runtime limiter: 190 operasi invalid, maksimal 50 bersamaan, 180 HTTP400/10 HTTP429, nol connection failure, 390 ms total, p50 77,5/p95 143,7/p99 143,8 ms. Percobaan 190 sekaligus sebelumnya berakhir ECONNRESET; runtime tetap menjawab readiness sesudahnya. Ini batas eksperimen lokal yang dicatat, bukan bukti kapasitas cloud, bukan p95 operasi sah.

## 2. Backup dan retensi yang diusulkan

### Mekanisme pemulihan

- Pilih kemampuan provider yang dapat membuktikan RPO: PITR/WAL atau backup terjadwal yang sesuai, bukan asumsi bahwa plan gratis otomatis cukup. Aktivasi berbayar memerlukan persetujuan terpisah.
- Usulan awal: window pemulihan DB 7 hari, snapshot terenkripsi terpisah harian rolling 30 hari; untuk RPO beta satu jam tetap perlu pemulihan lebih rapat dari snapshot harian. RPO publik 15 menit membutuhkan mekanisme yang terbukti mendukungnya.
- Storage foto memerlukan backup/manifest tersendiri; backup DB saja tidak membuktikan objek foto dapat dipulihkan. Simpan pasangan metadata/objek yang konsisten, key aktif, checksum dan ledger penghapusan.
- Restore pertama ke lingkungan terisolasi sebelum beta; ulang bulanan selama awal operasi, setelah perubahan migrasi besar, lalu tinjau frekuensinya. Ukur waktu nyata, jumlah row/FK/RLS/key Storage dan alur synthetic.
- Ledger/tombstone hak penghapusan harus diterapkan kembali saat restore. Backup lama tidak boleh secara diam-diam mengaktifkan ulang profil/foto/kontak yang sudah dihapus.
- Tidak melakukan down migration destruktif saat rollback. Pertahankan schema compatibility; utamakan rollback artefak/stop write fitur terdampak. Pemulihan data produksi memerlukan otorisasi dan pengamanan tersendiri.

### Kandidat retensi untuk keputusan produk/legal

| Data | Usulan awal, belum diterapkan | Catatan |
| --- | --- | --- |
| Lokasi stale/presence expired | Purge paling lambat 24 jam setelah tidak diperlukan | TTL izin tetap sesuai server; hapus row tidak sama dengan menghentikan akses |
| Foto pending | Review ≤1 hari kerja; expiry jika tak diputuskan dalam 7 hari | Tidak publik sebelum approved |
| Foto ditolak/diganti/dihapus | Hapus bytes ≤24 jam setelah keputusan/hapus logis | Simpan audit minimal, bukan bytes foto; reconciliation grace period misalnya 1 jam untuk commit tak pasti |
| Objek yatim | Rekonsiliasi harian, maksimum 24 jam sesudah grace period | Pastikan key aktif/commit pending tidak terhapus |
| Profil aktif | Selama akun aktif dan tujuan pemrosesan berlaku | Hak edit, visibility revoke dan deletion request tersedia |
| Penghapusan akun | Acknowledge ≤1 hari kerja; target penyelesaian internal 7 hari bila tidak ada legal hold | Target layanan usulan, bukan tenggat hukum yang diklaim; retensi wajib/sengketa harus dijelaskan |
| Metadata consent/kerja/COD | Kandidat 12 bulan sesudah ditutup, lalu anonimasi bila boleh | **Wajib review hukum/produk**; hubungan kerja/sengketa bisa memerlukan masa lain. Jangan menghapus bukti peserta lain otomatis |
| Laporan | Kandidat 180 hari setelah kasus ditutup, legal hold terdokumentasi bila diperlukan | Pisahkan detail sensitif, akses petugas terbatas |
| Log operasi | 14 hari, security event minimum 90 hari bila dibutuhkan | Tanpa payload/PII; metadata provider/DPA tetap diperiksa |
| Rate bucket SQL | Purge bucket lama setelah jendela retry/analisis yang dibutuhkan, usulan 24 jam | DO sudah alarm 2 menit; SQL saat ini belum ada job purge |
| Backup | Rolling 30 hari, akses terbatas, expiry diuji | Tombstone deletion diterapkan ulang saat restore |

Angka retensi tidak boleh langsung dipublikasikan sebagai kebijakan atau diimplementasikan otomatis sebelum disetujui dan dicocokkan dengan kewajiban hukum. Penetapan ukuran data minimum harus mendahului finalizer PRIV-001.

## 3. Model biaya 1× / 10× / 100×

Belum ada invoice, plan, wilayah atau harga unit vendor yang terverifikasi. Karena itu **tidak ada kutipan harga paket atau janji biaya aktual**. Berikut unit perencanaan untuk meminta estimasi vendor setelah rencana disetujui.

Asumsi: 50 aksi aplikasi per DAU per hari, 30 hari/bulan, mean think time peak 10 detik. DAU dan CCU tidak sama; rasio ini hanya skenario.

| Skenario | DAU | CCU peak | Aksi/bulan | Perkiraan peak action/detik |
| --- | --- | --- | --- | --- |
| 1× beta | 500 | 50 | 750.000 | 5 |
| 10× | 5.000 | 500 | 7.500.000 | 50 |
| 100× | 50.000 | 5.000 | 75.000.000 | 500 |

Untuk action biasa source kini memanggil Auth + RPC dan kira-kira dua DO checks (IP/aktor) per request. Maka 1× berarti sekitar 750 ribu Worker action, 750 ribu Auth user validations, 750 ribu RPC, 1,5 juta DO checks, sebelum retry, photo, bootstrap tambahan dan traffic abuse. Bukan prediksi tagihan; tarif/durasi/CPU/storage provider berbeda.

| Komponen biaya | Formula / variabel yang harus diukur |
| --- | --- |
| Worker/DO | Request/duration/CPU, alarm/storage operations; action dan photo terpisah |
| Supabase DB/Auth | Compute, koneksi, RPC, active users/Auth rate, storage/backup/PITR dan egress |
| Foto | 2 objek per profil/peran aktif, detail maksimum1 MB + thumb100 KB; ukuran rata-rata, perubahan, views dan retention nyata |
| Maps/tile | Map sessions/tiles sesuai vendor; jangan mengasumsikan tile publik OSM untuk trafik besar |
| SMS | OTP attempts + resend + abuse × tarif aktual negara/provider; paling perlu budget cap/CAPTCHA |
| Monitoring | Volume event tersaring, retention, uptime checks, private source maps |
| Operasi | Jam support/moderation/on-call, domain/store/legal; tidak tertutup oleh hosting murah |

Usulan **batas anggaran beta Rp500.000/bulan sebagai envelope awal**, bukan estimasi bahwa seluruh kebutuhan pasti muat. Validasi provider backup/Maps/SMS dahulu; bila tidak muat, kurangi cakupan atau setujui budget baru. Alert billing 50%/80%/100%; cap fitur berbiaya dan investigasi lonjakan, bukan mematikan database tanpa rencana. Tidak ada spend limit/provider plan yang diubah audit ini.

Jangan menambah read replica/queue baru untuk mengejar angka 100×. Ukur discovery/rating dan koneksi dulu; virtualisasi daftar bila jank terbukti; gunakan cleanup job yang memang dibutuhkan; pilih vendor peta yang mengizinkan trafik target. Uji ulang saat p95 melampaui target, koneksi/kuota >70–80%, atau biaya per pekerjaan selesai naik signifikan.

## 4. Kesiapan operasional

| Area | Status | Syarat penerimaan |
| --- | --- | --- |
| Setup/build lokal/lockfile | Ada | Clean install/export lulus; commit/repository masih REL-001 |
| CI lint/type/unit/SQL/Edge/export/browser | Sebagian | Workflow ada; remote run/proteksi merge belum terbukti |
| Native release/signing/version | Sebagian | Config ID/icon/version ada; APK/signing/Play testing belum |
| Dev/staging/prod isolation | Sebagian / belum diverifikasi cloud | Separate projects/buckets/secrets/access, synthetic staging, denied cross-env tokens |
| IaC/config | Sebagian | Wrangler/SQL/Expo tersimpan; IAM/Auth/backup/DNS/provider settings belum direproduksi |
| Canary/rollback | Belum diterima | Artefak immutable/compatibility, latihan rollback, stop-write plan native |
| Central logs/request ID/error tracking | Belum pada source | OPS-001; redaction dan akses/retensi harus diuji |
| Metrics/SLO | Belum | Proposal pada dokumen ini, dashboard dan baselines belum |
| Uptime/certificate/domain alert | Belum diverifikasi | Probe eksternal/renewal/owner dan alarm latihan |
| On-call/akses cadangan/2FA | Belum diverifikasi | Dua petugas tepercaya, recovery account/domain/signing access terdokumentasi |
| Backup/restore DB+Storage | Belum diverifikasi | Bukti job/coverage/enkripsi/isolasi + restore drill terukur |
| Report/support/banding | Belum | OPS-002; kanal terpantau, pemilik, triase/audit/response |
| Photo moderation/cleanup | Belum | Pending tidak boleh jadi jalur buntu; MEDIA-001 dan operator siap |
| Legal/privacy/data rights | Sebagian | Draft ada; final policy/deletion/export/vendor/legal review belum |
| Domain/DNS/TLS/email | Belum diverifikasi | Pemilik, auto-renew/2FA, redirect/cert; SPF/DKIM/DMARC jika memakai domain email transaksional |
| Model pendapatan/faktur/pajak/sengketa | Belum diputuskan | COD langsung tidak berarti platform memberi jaminan; kebijakan produk/legal harus jelas |
| Cost forecast/billing alarms | Belum | Unit model ada; harga/kuota/invoice belum, tidak ada alarm aktif dibuktikan |
| UAT/launch staffing/status communication | Belum | 5–10 UAT, kriteria lulus, kanal gangguan dan jadwal72h pertama |

“Belum diverifikasi” tidak menyatakan konfigurasi eksternal pasti tidak ada. Source/draft saja tidak cukup untuk menerima rilis.

## 5. Tiga draf runbook

### Runbook A: API/login/penemuan tidak dapat dipakai

**Pemicu:** synthetic gagal/latency/error alert atau laporan berulang. **Pemilik:** petugas teknis utama; cadangan menerima eskalasi jika tidak ada ACK 15 menit. Kanal dan orang belum ditunjuk.

1. Catat waktu mulai, build ID, operasi dan request ID; periksa scope kota/platform. Jangan meminta screenshot token/nomor/lokasi nyata.
2. Bedakan client/network, Worker/DO, Auth, PostgREST/DB dan peta. Gunakan actor synthetic; lihat error envelope, bukan HTTP 5xx saja.
3. Jika map saja gagal, pertahankan list sesuai izin. Jika Auth/DB gagal, hentikan mutasi dan tampilkan retry yang jelas; jangan fallback ke demo atau mengulang write non-idempoten.
4. Bila terkait deploy, rollback Worker/web ke artefak terverifikasi yang kompatibel. Untuk native, stop write fitur terdampak/server guard; store rollback perlu waktu. Jangan drop schema/restore DB untuk menyelesaikan error kode.
5. Kirim status melalui kanal yang disetujui oleh petugas berwenang; jangan menjanjikan waktu yang belum diketahui. Eskalasi vendor bila dependency terkonfirmasi.
6. Verifikasi bootstrap, discovery, kontak/pekerjaan synthetic dan redaction; amati 30 menit sebelum tutup insiden. Catat dampak, data ambiguity, waktu recovery dan tindak lanjut.

**Bukti latihan:** waktu deteksi/ACK/rollback/pulih, request correlation, screenshot alarm dan synthetic checks. Saat ini belum dilatih.

### Runbook B: Backup/DB rusak, penuh atau Storage tidak konsisten

**Pemicu:** integrity error, ruang/koneksi kritis, data hilang, backup tertinggal. **Pemilik:** petugas data/teknis dan reviewer cadangan. RPO/RTO usulan beta1h/4h.

1. Hentikan write yang memperparah masalah; simpan bukti dan snapshot non-destruktif terotorisasi. Bedakan disk full/koneksi/error kode dari korupsi nyata.
2. Pilih recovery point yang bersih, ukur potensi data hilang; jangan menimpa target aktif tanpa persetujuan pemilik insiden.
3. Restore ke project/DB **terisolasi**, termasuk Storage/manifest dan ledger/tombstone. Verifikasi checksum, jumlah row/FK/status/ACL/RLS/helper grants serta role/signed photo/access gates.
4. Rekonsiliasi pekerjaan/ACK/consent yang terjadi setelah recovery point; jangan merekayasa penerimaan tunai atau menyatakan transaksi hilang sudah dibayar. Eskalasi data ambiguity kepada peserta melalui prosedur berizin.
5. Uji synthetic core flow, cleanup active-key protection dan deletion tombstones; persetujuan sebelum cutover. Pertahankan snapshot lama untuk investigasi sesuai kebijakan.
6. Catat RPO/RTO nyata, selisih row/objek, validasi pengguna dan keputusan kembali membuka write; lakukan postmortem tanpa menyalahkan.

**Bukti latihan:** backup timestamp, recovery point, restore start/end, manifest checks, exclusion secret, tes permission dan keputusan cutover. Tidak ada restore cloud dilakukan audit ini.

### Runbook C: Secret atau data pribadi diduga bocor

**Pemicu:** credential valid ditemukan di source/log/artifact, wrong-user data, akun operator diambil alih. **Pemilik:** pemimpin insiden + penanggung jawab privasi; keduanya belum ditunjuk.

1. Batasi endpoint/akses yang terdampak; pertahankan bukti dengan akses minimum. Jangan menyalin secret, payload pribadi atau link foto ke chat/tiket publik.
2. Tentukan jenis key dan cakupan. Untuk gateway, rotasi secret Worker dan Edge serta hash SQL secara terkoordinasi; mismatch harus menolak akses. Untuk service role/provider/deploy token, cabut/ganti melalui pemilik layanan yang berwenang. Client anon key bukan pengganti service-role secret.
3. Cabut sesi yang relevan, tinjau akses operator/IAM/deployment dan riwayat pemakaian. Logout lokal tidak otomatis mencabut seluruh sesi/perangkat.
4. Nilai data/akun/periode terdampak; pisahkan fakta dari dugaan. Periksa kewajiban pemberitahuan bersama pihak hukum; jangan mengarang tenggat atau mengklaim tidak ada dampak tanpa bukti.
5. Verifikasi key lama ditolak, key baru hanya bekerja pada target tepat, wrong-user tests lulus dan tidak ada credential pada artifact/log. Bersihkan source/history sesuai rencana setelah rotasi, bukan pengganti rotasi.
6. Petugas berwenang mengirim pemberitahuan yang diwajibkan/disetujui, dokumentasikan tindakan dan akar masalah; audit ulang sebelum membuka fitur.

**Bukti latihan:** tabletop key synthetic, timeline rotasi/deny, hasil ACL/redaction, daftar keputusan/pemilik; tidak perlu membocorkan credential asli untuk latihan.

## 6. Peluncuran tiga tahap

Keadaan saat ini NO-GO. Tahap berikut tidak dimulai hanya karena draf ini tersedia. Tidak ada deployment/pesan/publikasi yang diotorisasi oleh laporan.

| Tahap | Batas dan durasi usulan | Kriteria masuk | Kriteria keluar / berhenti |
| --- | --- | --- | --- |
| 1 Beta tertutup | 20–30 akun undangan, maks10 bersamaan, satu kota, ≥7 hari | P0/P1 tertutup/mitigasi diterima yang memenuhi gerbang; security/data terbukti; final deletion/support siap; APK/device/staging lulus; no real paid SMS tanpa rencana | Core UAT≥90%, nol integrity/privacy incident, laporan tertangani, restore+rollback diuji. Berhenti untuk salah consent, kehilangan data, auth bug atau operator tak mampu merespons |
| 2 Undangan terbatas | 300–500 akun, maks50 bersamaan, ≥14 hari | Beta tertutup lulus; load50/soak; telemetry/kuota/billing/roster siap | SLO99,5%, p95 target, error<1%, nol P1 terbuka, RPO/RTO terukur, biaya sesuai envelope. Jangan ekspansi saat error budget habis/cleanup atau laporan menumpuk |
| 3 Publik bertahap | Satu kota; mulai kecil, penerimaan sampai200CCU setelah uji | Semua gerbang produksi lulus; legal/store/vendor final; load200; dukungan/siaga72h; approval rilis terpisah | Naikkan undangan bertahap, evaluasi mingguan; kota baru setelah geo/vendor/operasi diverifikasi. Rollback/stop write bila integrity/privacy atau batas kapasitas dilanggar |

Foto dapat tetap tidak dibuka selama cleanup/moderasi belum siap, asalkan produk/live UI tidak menawarkan jalur yang belum berfungsi dan scope penerimaan jelas. Ini usulan mitigasi yang harus disetujui, belum diimplementasikan.

72 jam pertama: satu petugas teknis utama/cadangan, satu dukungan/moderasi, satu pemilik keputusan produk/privasi (peran dapat dirangkap jika jadwal/akses tetap realistis). Tinjau dashboard dan antrean minimal pagi/sore, on-call untuk insiden sensitif. Jangan menjanjikan dukungan24/7 sebelum staffing ada.

## 7. Sepuluh draf jawaban dukungan

Untuk review internal; selaraskan dengan implementasi final sebelum dipublikasikan. Tidak ada alamat email/WhatsApp, SLA atau kemampuan penghapusan otomatis yang dibuat-buat.

| Pertanyaan | Draf jawaban |
| --- | --- |
| 1. Tidak bisa masuk Google? | Periksa koneksi dan akun Google yang dipilih, lalu ulangi masuk. Jika dibatalkan, kembali ke halaman masuk. Jangan kirim kata sandi atau kode verifikasi kepada petugas. Pemulihan akun Google dilakukan melalui layanan Google. |
| 2. Mengapa perlu lokasi? | Lokasi saat aplikasi digunakan membantu mencari akun dalam kota dan radiusmu. Aktifkan izin lokasi, lalu coba lagi. Jika wilayah belum dilayani, aplikasi memberi penjelasan; riwayat dan Akun tetap dapat dibuka bagi akun yang sudah ada. |
| 3. Apakah pin menunjukkan rumah tepat? | Pin menunjukkan lokasi perkiraan. Konfirmasikan tempat kerja dengan pihak lain setelah persetujuan kontak. Titik peta dan rating bukan verifikasi identitas atau jaminan keamanan. |
| 4. Mengapa nomor belum terlihat? | Kedua pihak perlu menyetujui kontak dan memiliki nomor terverifikasi. Izin dapat kedaluwarsa, dicabut atau ditutup oleh pemblokiran. Nomor yang sudah disalin ke luar aplikasi tidak dapat ditarik kembali. |
| 5. Apa beda Bisa nego dan Harga tetap? | Bisa nego berarti pemilik membuka pembahasan nominal. Harga tetap berarti pemilik tidak menawarkan negosiasi. Harga ditampilkan per pekerjaan/sesi; pastikan rincian dan upah pada kesepakatan sebelum mulai. |
| 6. Apakah menawar langsung membuat pekerjaan? | Tidak. Usulan masih perlu ditinjau dan dikirim, lalu disetujui pihak lain. Periksa tugas, alat, jadwal, lokasi dan total upah pada kesepakatan. |
| 7. Mengapa selesai belum berarti lunas? | Konfirmasi hasil selesai dan pengakuan uang diterima adalah dua catatan terpisah. Pembayaran tunai dilakukan langsung. Pekerja mengakui uang diterima hanya setelah benar-benar menerimanya; Upahgo tidak menyediakan escrow/jaminan pembayaran. |
| 8. Bagaimana melaporkan akun atau upah belum dibayar? | Gunakan Lapor dari profil akun terkait, pilih kategori dan jelaskan kejadian tanpa menaruh data sensitif yang tidak diperlukan. Blokir membatasi kontak/penemuan. Laporan bukan layanan darurat. Petugas harus mengikuti prosedur triase yang sudah disetujui sebelum beta dibuka. |
| 9. Bagaimana menghapus akun? | Ajukan melalui Akun, lalu baca konsekuensi dan beri persetujuan. Saat ini implementasi lokal membatasi akun dan mengajukan permintaan; penghapusan tuntas belum siap. Jangan menjanjikan data sudah terhapus sebelum finalizer dan kebijakan retensi selesai. |
| 10. Mengapa foto masih ditinjau? | Foto bersifat opsional dan tidak langsung dipublikasikan. Foto pending hanya tersedia bagi pemilik sesuai izin. Moderasi dan penanganan penggantian/penghapusan harus aktif sebelum fitur foto live dibuka. |

Nomor kasus, siapa yang menjawab, status, eskalasi dan tanggal penutupan harus dicatat dengan akses terbatas. Prosedur meminta nomor/identitas tambahan hanya boleh dipakai jika diperlukan untuk verifikasi, melalui kanal yang aman dan sudah ditetapkan.
