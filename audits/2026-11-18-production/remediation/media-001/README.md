# MEDIA-001: rekonsiliasi foto

19 November 2026, branch `codex/fix-media-001`, di atas PRIV-001 (`3bc6edd`). **Source lokal diterapkan; temuan produksi belum ditutup.** Runner default nonaktif. Tidak ada migrasi remote, scheduler, penghapusan Storage nyata, aktivasi layanan atau publikasi build.

## Perilaku yang berubah

- Reservasi privat sebelum upload detail/thumb. SQL membuat key kanonis per akun/peran, membatasi reservasi dan memeriksa akun/profil aktif. Upload parsial atau commit tak pasti tetap dapat ditemukan tanpa kompensasi inline yang bisa menghapus foto aktif.
- Replacement/hapus metadata mengantrekan key lama dalam transaksi. DELETE sekarang HTTP202, `cleanup: "queued"`; aplikasi menjelaskan penghapusan salinan server menunggu antrean. Demo menyebut penghapusan memori. Pesan error pada dialog tidak diduplikasi di halaman belakangnya.
- Consumer `media:process -- --apply`: satu pasangan, lease5 menit, retry/backoff, completion hanya sesudah Storage API berhasil dan kedua nama hilang dari katalog. CLI tidak mencetak key/UUID/isi error vendor. Exit nonzero dan counter memberi sinyal triase; pengiriman alarm masih OPS-001.
- Maintenance terbatas: reservasi kedaluwarsa15 menit dan orphan kanonis >1 jam. Metadata/reservasi aktif dilindungi; key retired tidak dapat dipasang kembali, termasuk setelah completion record dibersihkan30 hari. Objek yang kembali dari restore Storage dapat diantrekan lagi bila tak direferensikan.
- Tidak menambah dependency/aset/identitas visual. Tidak memutasi katalog Storage melalui SQL. [Runbook, urutan upgrade dan batas restore](../../../../docs/MEDIA-CLEANUP.md).

Baseline direproduksi sebelum perubahan memakai handler/decoder asli: DELETE200 meski remove403; thumbnail403 menyisakan satu detail tanpa metadata/consumer. [Probe dan hasil audit historis](../../evidence/photo-failure-probe.log) tidak ditulis ulang. Probe tersebut memang mengharapkan perilaku rentan; regresi baru menguji kontrak yang diperbaiki.

## Ancaman dan batas kepercayaan

| Aset/aktor | Kasus konkret | Kontrol dan bukti lokal |
| --- | --- | --- |
| Pengguna/anon | Memanggil cleanup/reserve untuk akun lain | RPC admin hanya service_role, tabel/helper tanpa hak klien. Edge memakai getUser, role bootstrap dan prefix terverifikasi. Tes ACL dan role/field asing. |
| Upload gagal | Detail tersimpan, thumbnail403; proses berhenti sebelum commit | Reservasi commit sebelum Storage ditulis; expiry menjadi job. Tes Edge urutan reservasi, upload parsial, commit gagal dan respons hilang sesudah commit. |
| Cleanup vs metadata | Retry/commit terlambat memasang key yang sedang dihapus | Lock pemilik, reservasi dikonsumsi, setiap queued key ditolak commit; idempotensi key aktif tidak mengantrekannya. SQL menguji reattachment/lease salah dan key aktif terlindung. |
| Worker ganda/crash | Claim ganda, lease lama melakukan ack, timeout completion | Lease UUID, lock dan recheck, masa5 menit, retry yang aman; SQL menguji lease kedaluwarsa/claim ulang dan unit menguji lost completion. Interleaving provider nyata belum diuji. |
| Storage yang tidak konsisten | API sukses tetapi katalog masih memuat objek | Ack SQL ditolak sampai kedua nama hilang. Unit menguji catalog lag; SQL memakai shim, bukan konsistensi provider nyata. |
| Scope penghapusan | Bucket lain, key asing, foto aktif atau upload baru ikut terhapus | Bucket/pasangan tetap, regex kanonis, grace dan reservasi; invalid/protected menjadi sinyal operator. Tes orphan parsial/tua/muda/in-flight, foreign bucket dan key malformed. |
| Restore/operasi | Foto kembali, antrean gagal diam-diam | Sweep ulang, counter/exit code, runbook pause/retry. Tidak ada ledger foto independen; DB restore lama membutuhkan rekonsiliasi perubahan setelah backup. Scheduler/alarm/offsite/expiry belum terbukti. |

Service credential merupakan otoritas tinggi, tetap harus dibatasi di secret store server. Kontrol ini tidak melindungi dari operator/service credential yang disalahgunakan atau mengubah metadata di luar alur. Completion tidak menjamin seluruh replika/cache/backup vendor telah dihapus.

## Pemeriksaan yang dijalankan

Node22.23.3, PostgreSQL17 disposable, Deno2 dengan cache/pinned WASM, Chrome. Data seluruhnya sintetis. Fixture MEDIA SQL di-rollback; perubahan jam/grace diuji lewat timestamp fixture, bukan menunggu SLA nyata.

| Pemeriksaan | Hasil dan batas |
| --- | --- |
| Typecheck/lint | Lulus, nol warning ESLint. |
| `npm test` | **43 lulus**, termasuk empat regresi consumer: pasangan terarah/idempotensi, Storage/catalog error, lost completion dan disabled/malformed claim. [Output](evidence/unit.txt). |
| `npm run test:db` | **280 assertion lulus**, termasuk40 MEDIA: disabled/missing config, ACL, reservasi/kapasitas, commit idempoten, active key, key retired, lease/backoff/reclaim, verifikasi katalog, orphan/grace, expiry record, objek kembali, terminal failure dan sweep101 objek dalam100+1+0. [Output](evidence/db.txt). Auth/Storage catalog shim, bukan Supabase/PostgREST. |
| Deno Edge | **1 tes integrasi lulus**, decoder WASM nyata, Auth/RPC/Storage sintetis. Reservasi memakai service credential dan mendahului upload; tidak ada inline remove pada partial/uncertain/DELETE202. [Output](evidence/edge.txt). |
| Browser suite | **20 existing lulus** pada run21 tes; tes MEDIA menemukan dua alert error (halaman+dialog), sehingga run penuh tersebut tidak hijau. Source diperbaiki, assertion tidak dilonggarkan. |
| Browser MEDIA final | **1/1 lulus**. Google/API/GPS sintetis; keyboard Enter, Escape, Tutup, Batal tanpa DELETE, error503, satu alert, retry, busy disabled, dua request saja, respons202, status antrean dan tombol hapus hilang. 320/390/1440 tanpa overflow horizontal, target48px, satu heading aktif, pageErrors kosong. [Output final](evidence/browser.txt). Total21 skenario lulus lintas run, bukan satu run penuh21/21. |
| `build:web`, `build:android` | Source final lulus. [Web](evidence/build-web.txt), [Hermes4,5 MB](evidence/build-android.txt). Bukan APK/AAB atau runtime Android. |
| `worker:check` | Kontrak dan Wrangler dry-run lulus, tanpa deploy. Log sandbox awal EPERM; run final memakai log `/private/tmp`. [Output](evidence/worker.txt). Worker source tidak diubah. |
| `python3 design/verify.py` | Seluruh check dan34 pasangan kontras token lulus, tanpa report/rerender baru. Bukan audit piksel/native. |
| Secret/diff/format | `check:secrets`:111 file source/config/doc tanpa pola credential cocok; env/build/dependency dan riwayat Git tidak diaudit. [Output](evidence/secrets.txt). `git diff --check` dan Prettier seluruh source berubah lulus. Test fixture baru ditinjau, hanya credential sintetis. |

Log bukti hanya dinormalisasi kode warna dan whitespace. Cluster PostgreSQL disposable dihentikan sesudah tes, data fixture lokal tidak dihapus. Tidak menjalankan Auth/PostgREST/Storage nyata, race dua runner dengan provider, load test, alarm delivery, restore/expiry backup atau Android/TalkBack. Audit dependency tidak diulang karena lockfile/dependency tidak berubah; SEC-001 tetap terbuka. Hasil bukan sertifikasi keamanan atau penerimaan produksi.

## Review perubahan

Review terarah ponytail-review menelusuri pemanggil foto, gateway forward, Edge/SDK, RPC replacement/admin, ACL, helper/key, Storage API, overlap PRIV dan CLI/tests. Perbaikan konkret: konfigurasi singleton hilang kini fail closed; key aktif tidak dikompensasi setelah commit tak pasti; lease lama ditolak; sweep melanjutkan batch; UI tidak menggandakan error. Invariant utama: key yang telah queued tidak dapat diaktifkan kembali oleh commit biasa. Pemrosesan ulang sesudah timeout tetap aman untuk primary pair.

Tidak ditemukan blocker source tambahan pada cakupan yang ditinjau. Review bukan independen/menyeluruh. Throughput satu pasangan/invokasi dan scans katalog belum diuji beban; scheduler/kapasitas, alarm dan provider merupakan syarat produksi. Verdict: source dapat dikomit untuk ditinjau; rilis **NO-GO**.

## Delivery Gate UI

Lingkup kecil: copy penghapusan dan satu alert saat dialog terbuka. Impeccable native Operate primary, antislop **during** dari preferensi global yang telah diverifikasi, ponytail full. Design Read existing: tugas sehari-hari untuk pengguna Indonesia, Ceria, ENERGY3/RHYTHM2/MOTION2. Form sensitif tetap tenang. Tidak menciptakan identitas/aset baru.

Satu inspeksi dialog320/1440; satu konfirmasi status320/1440 dan dialog390 setelah perbaikan alert. Capture fullPage awal memperlihatkan artefak header pada perluasan viewport screenshot; capture diganti viewport, sesuai app yang memakai scroll internal, dengan assertion satu heading aktif. Tidak ada perubahan gaya atau loop polish. [Konfirmasi320](evidence/confirm-320.png), [390](evidence/confirm-390.png), [1440](evidence/confirm-1440.png); [antrean320](evidence/queued-320.png), [390](evidence/queued-390.png), [1440](evidence/queued-1440.png).

### Hard Gate

- R-02 PASS: copy baru tanpa em dash.
- R-03 PASS Chrome: tiga lebar, assertion overflow dan capture viewport di atas. Native UNVERIFIED.
- R-17 PASS: tidak ada statistik pemasaran baru; counter hanya operasi server.
- R-18 PASS: tanpa testimoni/foto orang baru.
- R-23 PASS: tanpa aset/nav/identitas baru.
- R-24 PASS: Akun, foto dan dialog dapat dibuka/ditutup pada tes.
- R-25 PASS token/source:34 pasangan kontras lulus; body/note/aksi memakai komponen existing. Native UNVERIFIED.
- R-26 PASS: upload/crop/demo melalui core; hapus/batal/tutup/retry melalui regresi MEDIA.
- R-27 PASS Chrome: pending existing, kosong setelah hapus, busy disabled, error tunggal/retry dan feedback antrean diuji.
- R-28 N/A: tanpa FAQ.
- R-32 PASS Chrome: fokus/Enter membuka dialog, Escape/Tutup/Batal menutup; focus ring existing terlihat pada capture. TalkBack UNVERIFIED.
- R-33 PASS: perubahan di source aplikasi; tanpa injeksi runtime/CSS.
- R-34 N/A: light existing, tanpa toggle baru.
- R-35 PASS Chrome/source: build dan click-through; Hermes tersedia. Runtime Android UNVERIFIED.
- R-36 PASS: status membedakan logis/fisik/demo, tanpa klaim completion vendor/produksi.
- R-37 PASS: arahan existing dipertahankan, bukan desain tanpa arah.
- R-38 PASS: fixture sintetis dan status operasi faktual; tidak menambah konten produksi rekaan.

### Purpose-Gate

- R-01 PASS: tanpa gradient/glow baru; mint existing menandai feedback.
- R-04 PASS: identitas/peran dan close/back existing, tanpa ikon dekoratif baru.
- R-06 PASS: sans/skala existing untuk keterbacaan tugas; tanpa font/uppercase baru.
- R-07 N/A: tanpa pola latar.
- R-08 N/A: tanpa panah dekoratif.
- R-09 N/A: tanpa badge baru.
- R-10 N/A: tanpa glass/blur.
- R-12 N/A: tanpa shadow tambahan.
- R-13 N/A: tanpa glow.
- R-14 N/A: tanpa kartu fitur baru.
- R-19 PASS: feedback pending existing, tanpa animasi baru.
- R-22 N/A: tanpa ilustrasi baru.

### Liveliness

- PASS dials:3/2/2 dari DESIGN.md existing.
- PASS konsistensi: form sensitif tenang sesuai arah produk, tidak menambah gerak promosi.
- PASS fokus: konfirmasi hapus menjadi tindakan utama dialog.
- PASS whitespace: akibat dipisahkan dari konfirmasi dan pembatalan.
- PASS aksen: hijau pada tindakan, mint pada hasil.
- PASS identitas: komponen/radius/type Ceria existing.
- PASS Design Read: arah existing ditetapkan sebelum copy diubah.

### Craftsmanship dan quality locks

- C-1/R-31 PASS: palet/type/spacing/layout existing untuk konsistensi; kalimat baru menjelaskan batas hasil sebelum tindakan.
- C-2 PASS: kontrol lingkup diuji, tidak ada kontrol baru kosong.
- C-3 PASS: satu form/konfirmasi, tanpa section pengisi.
- C-4 PASS Chrome: tiga lebar, keyboard, gagal/retry/busy; native UNVERIFIED.
- C-5 PASS: tidak ada klaim/aset faktual dibuat-buat.
- R-05 PASS: struktur tugas existing, tanpa template promosi.
- R-11 PASS: radius komponen existing dipertahankan.
- R-15 PASS: tindakan spesifik Hapus foto dari profil, Batal.
- R-16 PASS: tanpa buzzword marketing.
- R-20 PASS: identitas Upahgo/Ceria existing dipertahankan.
- R-21 PASS: light existing sesuai brief pengguna.
- R-29 PASS: palet existing, tanpa warna baru.
- R-30 PASS: refinement existing sesuai referensi yang diminta; tidak mengganti identitas.

Mechanical detector Impeccable UNVERIFIED: runtime tidak tersedia pada awal sesi, tidak dipasang. Gate mencakup delta layar ini, bukan seluruh UI/native.

## Syarat penutupan produksi

Terima konfigurasi/grace/retensi, operator dan kapasitas. Deploy migration+Edge secara terkoordinasi pada staging terotorisasi, aktifkan runner sesudah verifikasi. Buktikan Storage API/catalog, partial upload, commit/delete timeout, key aktif/in-flight, lease/crash, overlap PRIV, restore terpisah dan kegagalan permission. Hubungkan scheduler/metrics/alarm dengan petugas dan uji alarm sampai diterima. Verifikasi retensi backup serta rekonsiliasi penghapusan foto setelah titik backup sebelum traffic. Lengkapi penerimaan Android.

Langkah berikut: **OPS-001**. Aktivasi dan deployment tetap terpisah dari commit source; temuan MEDIA belum ditutup untuk produksi.
