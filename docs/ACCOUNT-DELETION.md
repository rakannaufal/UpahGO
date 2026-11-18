# Penghapusan akun (PRIV-001)

Implementasi lokal, 18–19 November 2026. **Tidak aktif secara default; belum diterapkan ke Supabase atau scheduler remote.** Dokumen ini panduan operator, bukan kebijakan privasi publik atau persetujuan hukum. Rilis tetap NO-GO sampai kebijakan, tanggung jawab operator, konfigurasi backup dan bukti staging/native diterima.

## Kebijakan sebelum aktivasi

`202611180003_account_erasure.sql` menambah singleton privat `deletion_policy`. Nilai usulan: rincian kerja/komentar ulasan 365 hari, laporan 180 hari, backup maksimal 30 hari; target internal penyelesaian 7 hari dari permintaan. Angka ini usulan produk, bukan kewajiban hukum, SLA aktif, atau standar industri yang otomatis berlaku. Tinjau kebutuhan sengketa/COD, dasar pemrosesan, hak akses, vendor, kebijakan publik dan hukum dengan pihak berwenang.

`enabled=false` menahan claim, maintenance dan replay. Permintaan tetap dicatat, akun dibatasi dan lokasi/grant dicabut. Aplikasi menjelaskan bahwa pemrosesan belum aktif. Aktivasi membutuhkan versi kebijakan, `approved_by`, `approved_at`, dan `enabled=true`, melalui akses operator database yang diaudit. Jangan menaruh identitas approver/kasus atau service key di aplikasi. `bootstrap.deletionPolicy` hanya mengekspos versi, status dan durasi. Versi yang digunakan dicatat saat prepare.

`backup_days` adalah deklarasi kebijakan, **bukan pengaturan yang menghapus backup provider**. Operator harus membuktikan expiry pada seluruh snapshot/PITR/Storage backup, replika dan arsip. Jika provider menyimpan lebih lama, ubah layanan/kebijakan dan teks yang ditampilkan sebelum aktivasi. Legal hold hanya berdasarkan kasus berwenang, alasan dan tanggal akhir; tinjau ulang minimal bulanan. Penahanan tidak mempertahankan foto, lokasi, nomor atau akses masuk akun.

## Alur dan data

1. Pengguna bersesi mengonfirmasi `request_deletion`; tidak dapat menentukan akun target. Gateway dan pemeriksaan server tetap wajib. Pengulangan permintaan sendiri mengembalikan sukses tanpa membuat pekerjaan ganda. Akun langsung dibatasi, presence/lokasi dihapus dan izin kontak dicabut.
2. Runner server mengklaim satu job dengan lease 10 menit. `FOR UPDATE SKIP LOCKED` dan lock per akun mencegah claim/prepare ganda. Hanya `service_role` dapat menjalankan `upahgo_deletion_admin`; tidak ada endpoint pengguna untuk memilih target finalizer.
3. Prepare transaksi mengganti relasi peserta dengan profil acak `Akun dihapus`, tanpa Auth, nama lama, bio, area atau tag. Identitas peserta lain, nominal, status kerja dan pengakuan COD tetap utuh. Profil asli, foto terdaftar, konten peran/harga/usulan dan lokasi dibersihkan; sisa tabel pemilik dan rate bucket mengikuti cascade Auth. Hash nomor pada kontak terkait dikosongkan; grant aktif dicabut.
4. Storage `profile-photos/<UUID akun>/{worker,employer}` dikuras, termasuk objek yatim dengan nama foto yang sah. Folder/nama tak dikenal menahan job untuk pemeriksaan; tidak dihapus secara luas. Setiap invokasi maksimal empat batch 100 objek per peran. Batch besar yield dan dilanjutkan aman. Kegagalan Storage tidak boleh melewati tahap Auth.
5. `auth.admin.deleteUser` menghapus Auth dan sesi tersimpan provider; SQL menolak perpindahan sebelum baris Auth hilang. Trigger menolak penghapusan Auth akun aplikasi yang belum dipersiapkan. JWT lama mungkin belum kedaluwarsa, tetapi akun/publikasi lama hilang dan akses objek server ditolak. Integrasi JWT/RLS nyata tetap harus diuji staging.
6. Verifikasi ulang Storage dijadwalkan paling cepat satu jam setelah Auth hilang untuk menangkap upload yang telanjur berjalan. Tidak ada jaminan provider terhadap semua salinan/cache; buktikan batas waktu upload/Edge di staging. Job masuk `awaiting_ledger` sesudah sweep ini, lalu `completed` setelah file ledger tersimpan dan diakui.
7. Maintenance memproses maksimal 100 entri retensi per panggilan. Saat jatuh tempo, title/tasks menjadi teks netral, workContext dihapus, komentar ulasan dikosongkan dan laporan dihapus. Hold menunda penghapusan item terkait. Ulasan/laporan baru tentang peserta terhapus otomatis mendapat deadline. Nominal/status minimum tetap untuk peserta yang masih memiliki akun. Setelah kedua peserta terhapus dan retensi/hold kerja-ulasan habis, riwayat kerja/ulasan/kontak yang tak dimiliki dihapus; profil surrogate tanpa referensi dibersihkan. Ledger DB selesai dibersihkan setelah 90 hari, dengan syarat pernah diekspor.

Ini **pseudonimisasi**, bukan anonimisasi permanen: teks bukti bersama dapat memuat data pribadi selama retensi terbatas, operator memiliki pemetaan UUID sementara, dan lawan mungkin sudah menyimpan nomor/bukti di luar aplikasi. Tidak ada cascade membabi buta pada bukti finansial. Tidak ada janji penarikan data dari WhatsApp atau perangkat pihak lain.

## Menjalankan runner

Pada staging yang diotorisasi, terapkan urutan migrasi yang lengkap, verifikasi Auth/Storage lalu setujui kebijakan. Runner memerlukan Node 22.x, lockfile proyek, `SUPABASE_URL` HTTPS dan `SUPABASE_SERVICE_ROLE_KEY` dari secret store server. Jangan masukkan key ke `.env` mobile, log, terminal argumen, screenshot atau Git. Client menolak redirect, memakai timeout fetch 15 detik, tidak menyimpan sesi.

```sh
# Hanya environment yang telah diotorisasi; secrets diinjeksi oleh runtime server.
npm run privacy:process -- --apply
npm run privacy:ledger -- export /private/durable/privacy-ledger-20261118T120000Z.json --apply
```

Satu panggilan memproses satu job dan satu batch maintenance; bukan daemon. Scheduler belum dibuat. Usulan awal: invokasi tiap menit, monitoring umur antrean, error dan kapasitas sebelum menaikkan throughput. Ekspor ledger tiap menit dan sebelum/sesudah maintenance terencana ke lokasi terenkripsi yang persisten **di luar domain restore database**. Pantau timestamp ekspor terakhir; celah ekspor adalah potensi kehilangan permintaan setelah restore, sehingga target freshness maksimal satu menit perlu diukur dan diterima. Tidak ada klaim RPO nol atau kapasitas yang sudah teruji.

Output hanya status/kode error/jumlah, tanpa UUID/nama/nomor. Runner gagal dengan exit nonzero pada error/retry; `pending` memerlukan invokasi berikutnya. `attempts`, `last_error`, `next_attempt_at`, `lease_until` privat mendukung triase; lease kedaluwarsa dapat diklaim ulang. Retry memakai backoff 60 detik sampai maksimal satu hari; setelah 12 claim yang melaporkan error job menjadi `failed`. `defer` batch besar tidak menghabiskan jatah retry. Timeout dengan hasil tak pasti dilanjutkan dari tahap database yang sudah commit.

Alarm usulan: setiap job `failed`, invalid key, ekspor gagal/basi, lease terus kedaluwarsa, umur antrean >24 jam; eskalasi sebelum target 7 hari terlewati. Tetapkan petugas dan jalur bantuan nyata sebelum rilis. [OPS-001](OPERATIONS.md) menyediakan telemetry/monitor API dan panduan integrasi; scheduler serta alarm antrean/ledger tetap belum diprovisi, tidak dicakup oleh probe API.

## Ledger dan restore

Ledger berisi UUID asli, waktu permintaan dan versi kebijakan, **bukan ekspor data pengguna PRIV-003**. Isinya mencakup semua permintaan, termasuk yang masih antre/gagal, supaya restore tidak melupakan permintaan yang belum selesai. Export paginasi 1.000, batas 100.000 entri; jika batas terlampaui, berhenti dan atur ekspor bersegmen sebelum pertumbuhan berikutnya. File baru dibuat eksklusif mode 0600, disinkronkan bersama direktori, lalu ack per 100 job. File lama tidak ditimpa. Ack hanya menyelesaikan job `awaiting_ledger`; job antre tidak ditandai selesai. Kegagalan sebelum ack aman diulang dengan nama file baru; kegagalan sebagian ack aman diulang.

Fsync membuktikan penulisan filesystem, **bukan replikasi offsite**. Sebelum menyalakan scheduler, buktikan lokasi tersebut terenkripsi, tahan kegagalan host, memiliki akses operator terbatas dan pemulihan independen. Lindungi direktori dari penulisan pihak lain. Replay menolak symlink, file nonreguler, permission grup/publik, >32 MiB, format/UUID salah; file tetap merupakan input operator tepercaya. File tidak boleh dimodifikasi selama ekspor/replay. Git mengabaikan `privacy-ledger*.json`; jangan mengganti nama agar masuk Git.

1. Tutup traffic aplikasi, Auth signup/login, job lain dan penulis Storage sebelum restore. Pilih backup lingkungan yang benar; pastikan migrasi PRIV-001 dan kebijakan yang telah disetujui tersedia pada hasil restore.
2. Pulihkan database/Storage ke staging terisolasi. Ambil ledger paling baru dari tempat independen, bukan salinan lama di backup. Cocokkan lingkungan asal/tujuan, tanggal dan bukti kelengkapan sebelum menjalankan replay; gunakan secret tujuan yang benar.
3. Jalankan `npm run privacy:ledger -- replay /private/durable/privacy-ledger-latest.json --apply`. Semua UUID ledger dimasukkan kembali ke antrean, termasuk yang Auth-nya sudah hilang tetapi fotonya mungkin kembali dari restore Storage terpisah. Akun Auth yang muncul lagi langsung dibatasi. Perintah aman diulang sebelum runner dilanjutkan; tidak menargetkan UUID di luar file.
4. Jalankan processor berulang hingga job replay selesai sweep satu jam dan ekspor baru. Periksa count/status/error dengan akses operator privat; pastikan Auth, lokasi, akses konten, foto kedua peran, objek yatim dan sesi lama ditolak. Rekonsiliasi permintaan yang diterima setelah ekspor terakhir dari sumber operasional yang terlindungi; jika tidak dapat dibuktikan, traffic tetap ditutup.
5. Buka traffic hanya setelah tidak ada job replay pending/failed, bukti kontrol akses lulus dan ledger/backup sesuai kebijakan. Dokumentasikan drill tanpa UUID/PII di laporan publik.

Simpan snapshot ledger yang masih diperlukan untuk seluruh backup yang dapat dipulihkan. Usulan: hingga backup terakhir yang mendahului permintaan kedaluwarsa, ditambah buffer 7 hari; verifikasi tidak ada ekspor lama terlupakan. Penghapusan file/arsip dan expiry provider tidak dijalankan oleh CLI ini. Ledger DB 90 hari tidak boleh menjadi satu-satunya pengaman jika backup sebenarnya lebih panjang. Tanpa bukti ledger independen/expiry/restore drill, PRIV-001 belum tertutup untuk produksi.

## Hold, kegagalan dan penghentian

Hanya operator berwenang boleh mengisi `deletion_retention.hold_until`/`hold_case`; referensi kasus 6–80 karakter huruf/angka/underscore/hyphen, tanpa isi pengaduan. Jadwalkan tinjau ulang dan hapus hold yang tak lagi sah. Record hold tetap privat. Tidak ada konsol operator baru.

Job gagal: hentikan runner terkait; periksa kode aman dan tahap terakhir pada akses privat. Cocokkan Storage/Auth aktual dengan ledger. Untuk invalid key, validasi kepemilikan dan provenance sebelum cleanup terarah; jangan menghapus bucket. Setelah perbaikan, operator mengembalikan status ke tahap aman yang cocok dengan bukti (`requested`, `storage`, `auth`, `verify`), mengosongkan lease/lease_until, mengatur attempts=0 dan next_attempt_at=now(). `requested` hanya untuk akun yang belum diprepare; jangan menghidupkan identitas lama. Catat operator/alasan di sistem audit privat, kemudian uji satu job sintetis sebelum melanjutkan. Tidak ada endpoint retry manual publik.

Untuk pause: matikan scheduler lalu `deletion_policy.enabled=false`. Pengaturan ini menolak RPC berikutnya, tetapi operasi Storage/Auth yang sudah berjalan dapat selesai; tunggu seluruh invokasi selesai sebelum maintenance. Schema dan status tetap. **Penghapusan fisik tidak dapat di-rollback.** Jangan menjalankan rollback migrasi CORE/harga di bawah wrapper PRIV, menghapus trigger pengaman, atau merestore identitas untuk membatalkan penghapusan. Perbaiki maju; restore bencana wajib memakai replay dan gerbang traffic di atas.

## Penerimaan yang masih wajib

Tes lokal memakai PostgreSQL Auth shim dan upstream Storage/Auth sintetis. Bukti Supabase Auth admin, FK/trigger dengan role provider, PostgREST service ACL, Storage nyata termasuk error/paginasi/race, backup expiry, restore drill, scheduler/alarm, Android/TalkBack, public deletion URL/kontak bantuan dan kebijakan legal belum tersedia. Tidak ada akun nyata atau backup remote dihapus. [Bukti lokal](../audits/2026-11-18-production/remediation/priv-001/README.md).
