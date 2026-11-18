# Rekonsiliasi foto profil

MEDIA-001, 19 November 2026. Implementasi source lokal; **belum diaktifkan atau diterima untuk produksi**. Tidak ada objek remote dihapus. Penghapusan fisik tidak dapat dibatalkan.

## Alur dan batas

Edge mencatat reservasi privat sebelum menulis JPEG detail dan thumbnail. SQL membuat kunci acak milik akun/peran, dengan masa 15 menit dan maksimum 20 reservasi aktif per akun. Handler hanya memasang metadata setelah kedua upload berhasil. Commit mengonsumsi reservasi; pengulangan kunci aktif tidak mengubah status moderasi atau mengantrekannya. Setiap foto baru tetap pending, bukan otomatis disetujui.

Penggantian/hapus metadata dan antrean foto lama commit dalam satu transaksi dengan lock akun. DELETE mengembalikan **202**, `cleanup: "queued"`: hilang dari profil, penghapusan salinan server menunggu processor. Demo hanya menghapus memori. Signed URL yang sudah diterbitkan dapat berlaku hingga 60 detik; cache/perangkat penerima dan backup tidak dijamin terhapus oleh respons ini.

Upload parsial atau respons commit hilang tidak memicu kompensasi inline yang berisiko menghapus foto aktif. Reservasi kedaluwarsa masuk antrean; maintenance juga menemukan pasangan objek kanonis tanpa metadata/reservasi berumur lebih dari satu jam. Key yang sudah antre tidak dapat dipasang kembali. Ketiadaan reservasi juga mencegah pemakaian ulang sesudah record completion dibersihkan.

| Kontrol | Nilai implementasi |
| --- | --- |
| Reservasi | 15 menit, maksimum 20 aktif/akun |
| Grace orphan tanpa reservasi | 1 jam menurut `storage.objects.created_at` |
| Maintenance | Maksimum 100 reservasi kedaluwarsa +100 key orphan/panggilan |
| Claim | Memeriksa maksimum 25 kandidat, memproses satu pasangan/invokasi |
| Lease | UUID baru selama 5 menit; lease lama ditolak setelah claim ulang |
| Retry yang melaporkan error | 60 detik, eksponensial hingga maksimum sehari; gagal terminal bila error dilaporkan saat attempts≥12 |
| Record completion | Dibersihkan setelah 30 hari; objek yang muncul lagi dapat diantrekan ulang |
| Sinyal overdue | Antrean pending/deleting berumur >24 jam; usulan ambang operasi, bukan SLA |

Hanya bucket `profile-photos` dan pasangan `<UUID akun>/<worker|employer>/<UUID v4>.jpg` serta `-thumb.jpg` yang boleh dihapus. Format asing ditahan untuk triase, bukan dihapus dengan pencocokan prefix longgar. Metadata aktif dan reservasi valid dilindungi. Completion memerlukan lease sah dan kedua nama objek tidak ada pada katalog Storage. Katalog **dibaca saja**; byte selalu dihapus melalui Storage API, bukan DELETE SQL terhadap `storage.objects`.

## Aktivasi terkoordinasi

1. Siapkan staging terisolasi, backup dan approval lingkungan. Tinjau seluruh migrasi hingga `202611190001_media_reconciliation.sql`; uji ACL PostgREST, trigger/FK dan Storage API provider dengan foto sintetis. Nilai waktu/batas di atas masih perlu diterima operator.
2. Jeda write foto. Terapkan migrasi, siapkan pinned WASM melalui `npm run photo:prepare`, lalu deploy Edge baru sebelum menerima upload. Edge lama tidak memiliki reservasi sehingga commit upload ditolak skema baru. Jangan membuka traffic dengan kombinasi versi tersebut. Jalankan smoke test upload detail/thumb, replacement, pending/access, DELETE202 dan kegagalan terkontrol; baru buka write.
3. Sediakan runtime server Node22.x dan secret store `SUPABASE_URL` HTTPS serta `SUPABASE_SERVICE_ROLE_KEY`. Jangan memakai `EXPO_PUBLIC_*`, argumen terminal, log, screenshot atau Git untuk service key. Client server tidak menyimpan sesi, menolak redirect, timeout fetch15 detik. Worker/mobile tidak mendapat service key.
4. Catat approval privat pada singleton `upahgo_private.media_cleanup_config`: `approved_by`, `approved_at`, lalu `enabled=true`. Default false; singleton hilang juga menolak pemrosesan. Jangan mengaktifkan hanya untuk menghilangkan error tanpa penerimaan staging dan operator.
5. Jalankan satu invokasi pada fixture sintetis, periksa hasil provider dan statistik, lalu hubungkan scheduler/monitor. Scheduler dan pengiriman alarm belum dibuat pada slice ini (OPS-001).

```sh
# Hanya lingkungan yang diotorisasi; runtime server menyuntikkan secrets.
npm run media:process -- --apply
```

Satu invokasi bukan daemon. Usulan awal: tiap menit untuk pilot kecil, dengan kapasitas satu pasangan/menit. Ini **belum terbukti memadai**; ukur laju upload/hapus, umur antrean dan latensi Storage. Naikkan frekuensi/jumlah worker terkendali sesuai hasil pengukuran sebelum pertumbuhan. Lease/lock melindungi claim ganda; jangan mengandalkan proses singleton saja. Maintenance memakai lock global agar batch tidak digandakan, kemudian lock pemilik sesuai urutan replacement.

## Monitoring dan pemulihan kegagalan

Stdout JSON hanya status/counter/boolean: `status`, `enabled`, `pending`, `failed`, `overdue`, `protected`, `invalidObjects`, `incompleteProfiles`. Tanpa kunci objek, UUID, nama, nomor atau isi error upstream. `completed` hanya menyatakan satu pasangan telah dihapus dan katalog diperiksa; tidak berarti seluruh antrean kosong. `idle` juga dapat disertai antrean yang belum jatuh tempo.

Exit nonzero untuk retry, kegagalan RPC/Storage, konfigurasi nonaktif, failed/overdue/protected, key asing atau foto aktif kehilangan salah satu objek. Integrasikan kode keluar dan counter dengan alarm yang benar-benar diterima operator; sinyal CLI saja belum menjadi sistem alarm. Setiap claim menaikkan attempts. Crash sebelum `fail` menunggu expiry lease dan tidak langsung mengubah status menjadi failed; pantau lease yang terus kedaluwarsa. Error aman: `STORAGE_FAILED`, `DATABASE_FAILED`, `INVALID_STORAGE_KEY`.

- `failed`: jeda runner terkait, cocokkan akun/key/metadata/reservasi/katalog melalui akses operator privat. Perbaiki kredensial/policy/provider. Untuk key sah yang terbukti tidak aktif/tidak sedang upload, reset record terarah ke pending, attempts0, lease/lease_until/completed_at/last_error NULL, next_attempt_at=now(). Catat operator/alasan di audit privat, uji satu job sintetis. Tidak ada endpoint retry publik.
- `protected`: job lama menunjuk foto aktif/reservasi. Jangan memaksa hapus. Periksa penyebab antrean; foto aktif baru boleh diproses sesudah replacement/hapus yang sah. Reservasi kedaluwarsa akan direkonsiliasi maintenance. Counter ini sengaja memerlukan triase.
- `invalidObjects`/`INVALID_STORAGE_KEY`: identifikasi provenance dan kepemilikan setiap objek secara privat. Lakukan pemulihan terarah melalui Storage API setelah review. Jangan menghapus bucket atau mengendurkan regex untuk membersihkan counter.
- `incompleteProfiles`: salah satu JPEG foto aktif tidak ditemukan. Jangan menjalankan cleanup atas bagian yang tersisa. Selidiki kegagalan/restore provider; pulihkan dari sumber yang sah atau minta pemilik mengganti/menghapus foto. RPC commit mempercayai Edge telah mengunggah kedua file; statistik mendeteksi ketidakcocokan selanjutnya.

Untuk pause, hentikan scheduler, set `enabled=false`, tunggu semua invokasi selesai. RPC berikutnya ditolak, tetapi Storage request yang sudah berjalan dapat selesai. Pertahankan schema/reservasi/antrean, perbaiki maju. Jangan rollback ke Edge tanpa reservasi atau menghapus antrean untuk membungkam alarm. Perubahan source/konfigurasi tidak mengembalikan bytes yang sudah dihapus.

## Penghapusan akun dan restore

PRIV-001 tetap memiliki kebijakan/runner terpisah: menguras seluruh prefix kedua peran sebelum Auth dan sweep kedua satu jam kemudian. MEDIA-001 mengurus foto retired/yatim termasuk akun yang masih aktif; tidak menggantikan ledger akun. Persaingan penghapusan pasangan yang sama aman untuk diulang; bila PRIV menghapus job MEDIA saat invokasi berjalan, ack lease MEDIA gagal dan dilaporkan, bukan dianggap sukses. Reservasi terkait Auth terhapus melalui FK; objek upload terlambat yang kanonis tetap dapat ditemukan sweep. Race provider tersebut wajib diuji staging.

Sebelum restore, tutup traffic, penulis Storage dan kedua runner. Pulihkan ke lingkungan terisolasi; jalankan replay ledger PRIV sebelum traffic sesuai [ACCOUNT-DELETION.md](ACCOUNT-DELETION.md). Cocokkan metadata aktif, kedua JPEG dan reservasi dengan katalog Storage. Jalankan rekonsiliasi MEDIA terkontrol hingga antrean/error/objek asing dipahami; objek lama yang muncul kembali tanpa referensi dapat diantrekan ulang. Foto aktif yang kembali bersama backup DB memerlukan catatan perubahan/penghapusan independen dan rekonsiliasi operator: MEDIA tidak memiliki ledger foto terpisah dan tidak dapat membedakan keadaan backup lama dari niat pengguna terbaru. Jangan membuka traffic bila penghapusan setelah titik backup belum dapat direkonsiliasi. Putuskan retensi/expiry backup dan bukti pemulihan sebelum produksi.

Ketiadaan nama di katalog setelah Storage API sukses bukan bukti penghapusan seluruh replika/cache/backup vendor. Uji provider nyata, crash/timeout, upload berjalan, permission error, katalog tertinggal, beban/batch, restore DB/Storage terpisah serta Android/TalkBack masih wajib. [Bukti dan batas lokal](../audits/2026-11-18-production/remediation/media-001/README.md).
