# PRIV-001: penghapusan akun bertahap

18–19 November 2026, branch `codex/fix-priv-001` di atas CORE-001 (`e01004b`). **Source lokal selesai; temuan produksi belum ditutup.** Kebijakan default nonaktif. Tidak ada migrasi remote, akun nyata dihapus, scheduler, aktivasi layanan atau publikasi build.

## Perubahan

- `202611180003_account_erasure.sql`: kebijakan privat, antrean tanpa FK ke identitas yang akan dihapus, lease/retry, pemutusan identitas melalui surrogate, retensi/hold dan guard penghapusan Auth. Bukti upah/status/COD lawan tetap utuh. Fungsi privileged memakai `search_path=''`; admin RPC hanya service role.
- `shared/account-erasure.mjs`: Storage dua peran dan objek yatim dengan key sah dikuras sebelum Auth. Batch dibatasi, invalid key ditolak, error tanpa PII, hasil tak pasti dapat dilanjutkan. Sweep kedua setelah satu jam mendahului completion.
- `privacy:process`: satu job dan maintenance. `privacy:ledger`: snapshot privat sebelum ack, replay sebelum traffic restore dibuka. Replay juga mengantrekan UUID tanpa Auth agar Storage yang dipulihkan terpisah dibersihkan. Semua permintaan termasuk antre/gagal masuk ledger.
- Bootstrap mengekspos metadata kebijakan tanpa identitas approver. Layar penghapusan membedakan pembatasan, pemrosesan nonaktif, retensi dan demo. Consent web mendukung Spasi serta Enter; perilaku native existing dipertahankan.
- Tanpa dependency/aset/identitas visual baru. Pemeriksaan pola secret mencakup script server.

Usulan retensi 365/180/30 hari dan target internal tujuh hari **belum merupakan kebijakan/SLA aktif atau nasihat hukum**. Catatan minimum peserta aktif dapat bertahan; komentar/rincian memiliki deadline dan hold. Ini pseudonimisasi, bukan anonimisasi permanen. [Runbook lengkap](../../../../docs/ACCOUNT-DELETION.md).

## Ancaman dan batas kepercayaan

| Aset/aktor | Risiko | Kontrol dan bukti lokal |
| --- | --- | --- |
| Pengguna/anon | Menghapus akun lain atau memanggil admin | Target request dari `auth.uid()`, field target ditolak, gateway/consent; authenticated/anon ditolak ACL admin. |
| Runner | Proses ganda, retry setelah commit, salah prefix | Claim SKIP LOCKED, lock akun, lease UUID, transaksi prepare, whitelist bucket/path/key; tes lease salah, pengulangan, backoff dan batch besar. Service credential tetap privileged. |
| Peserta lawan | Bukti upah/COD hilang karena cascade | Relasi ke profil scrubbed tanpa Auth; tes detail sebagai lawan, nominal/status/pengakuan tetap. |
| Storage/identitas | Foto tertinggal, Auth hilang sebelum foto, upload terlambat | Storage kosong sebelum Auth, sweep ulang satu jam, invalid key menahan job. Upstream sintetis; race/provider nyata wajib staging. |
| Sengketa | Bukti terhapus dini atau tertahan selamanya | Deadline, hold bertanggal dan case reference, retensi bukti baru, cleanup kedua peserta. Review hold berkala tetap tanggung jawab operator. |
| Backup/ledger | Identitas/foto kembali atau ledger bocor | File 0600/exclusive, fsync file/direktori sebelum ack, replay batch100, validasi file. Enkripsi/offsite/expiry/restore cloud belum terbukti. |

## Pemeriksaan yang dijalankan

Node 22.23.3, PostgreSQL 17 disposable dengan Auth shim, Chrome dan fixture sintetis. Fixture PRIV SQL di-rollback; tidak menyentuh Supabase remote.

| Pemeriksaan | Hasil dan batas |
| --- | --- |
| Typecheck/lint | Lulus, nol warning ESLint. |
| `npm test` | **39 lulus**, termasuk delapan tes processor/demo/ledger: isolasi Storage, kegagalan/retry, commit tak pasti, invalid key, >400 foto, idempotensi, file sebelum ack, batch/replay dan file tidak aman. |
| `npm run test:db` | **240 assertion lulus** (189 existing +51 PRIV): kebijakan, bootstrap, ACL, raw Auth delete ditolak, request ganda, lease/prepare, cleanup dua peran, bukti lawan, hold/expiry/bukti baru, kedua peserta terhapus, restore/replay, akun tanpa profil, batas retry dan pemulihan operator. |
| Browser existing | **18 tes existing lulus** pada run suite20 terakhir; dua tes PRIV run tersebut terhenti oleh exception fixture logout. Run tersebut tidak sepenuhnya hijau. |
| Browser PRIV final | **2/2 lulus, 10,4 detik** setelah mock error/logout diperbaiki. Kebijakan aktif/nonaktif, legal/back, consent Spasi/Enter, disabled/busy, gagal jaringan, input tetap, retry, pembatasan, logout, pageErrors kosong. OAuth/API/GPS sintetis. |
| `build:web` | Source final lulus; 320/390/1440 tanpa overflow. |
| `build:android` | Ekspor Hermes final 4,5 MB lulus, bukan APK/AAB atau runtime. |
| `worker:check` | Kontrak dan Wrangler dry-run lulus; tidak deploy. Worker tidak diubah. |
| `check:secrets` | 106 file termasuk script, tanpa pola credential cocok. Env/build/dependency dikecualikan; bukan audit menyeluruh/riwayat Git. |
| `git diff --check` | Lulus. |

Baseline sebelum migrasi PRIV gagal SQL `42883`: finalizer belum tersedia. Tes implementasi menemukan alias PL/pgSQL ambigu, sudah diperbaiki. Browser awal gagal karena fixture GPS belum berizin. Setelah setup benar, tes keyboard membuktikan Spasi belum bekerja pada checkbox; diperbaiki di `Consent` bersama, tanpa melonggarkan assertion. Exception `ACCOUNT_RESTRICTED` berikutnya berasal dari mock yang melempar ke test runner saat logout; mock kini mengembalikan kontrak error API serta respons logout. Dua skenario final lulus.

Deno Edge foto dan audit dependency tidak diulang: source Edge/lockfile tidak berubah. SEC-001 tetap terbuka. Tidak menjalankan load test, Auth/Storage nyata, restore cloud, expiry backup, scheduler/alert atau Android/TalkBack. Hasil lokal bukan sertifikasi keamanan/produksi.

## Review perubahan

Review terarah ponytail-review mencakup request/gateway, rantai wrapper SQL, FK Auth, helper profile/contact/agreement/review/report, replacement foto, runner SDK, filesystem ledger dan pemanggil UI. Perbaikan konkret: constraint identitas terhadap NULL, hak trigger Auth, alias SQL, replay Storage tanpa Auth, file sebelum ack dan keyboard platform. Tidak ditemukan blocker source lain dalam cakupan tersebut; bukan review independen/menyeluruh.

Verdict: source dapat dikomit untuk ditinjau. Rilis produksi **NO-GO**.

## Delivery Gate UI

Impeccable Operate native primary, antislop **during** dari preferensi global yang diverifikasi pada awal sesi, ponytail full. Design Read existing: aplikasi kerja harian Indonesia, Ceria hangat, ENERGY3/RHYTHM2/MOTION2. Lingkup: copy penghapusan/legal dan consent. Token/aset tetap. Satu inspeksi awal 320px; konfirmasi final bersama aktif320/nonaktif1440, tanpa defect visual tambahan. Capture390 tersedia; tanpa loop polish.

### Hard Gate

| Aturan | Status dan bukti |
| --- | --- |
| R-02 | PASS: copy aplikasi baru tanpa em dash. |
| R-03 | PASS Chrome: assertion overflow 320/390/1440; [aktif320](evidence/policy-enabled-320.png), [nonaktif1440](evidence/policy-disabled-1440.png), isi tetap di container. Native UNVERIFIED. |
| R-17/R-18/R-38 | PASS: tanpa statistik/testimoni/foto baru, fixture/demo sintetis. |
| R-23 | PASS: tanpa aset/nav baru; alur diminta pemilik. |
| R-24 | PASS: legal/penghapusan/back/account/logout exercised. |
| R-25 | PASS token source: body/surface13,080:1, note/mint8,834:1, primary/surface5,038:1, error/container5,478:1. Bukan audit piksel native. |
| R-26 | PASS: consent/back/submit/retry/logout berfungsi pada dua skenario final. |
| R-27 | PASS: consent off/on, pending disabled, error dan retry/input tetap diuji. Bootstrap/error gate diuji suite existing. Empty-list N/A pada form. |
| R-28 | N/A: tanpa FAQ. |
| R-32 | PASS Chrome: fokus checkbox, Spasi/Enter, label/aria-checked; focus ring existing2px. TalkBack UNVERIFIED. |
| R-33 | PASS: source langsung, tanpa patch runtime/CSS eksternal. |
| R-34 | N/A: light existing sesuai brief, tanpa toggle. |
| R-35 | PASS Chrome/source: build final dan click-through dua skenario; ekspor Hermes tersedia. Runtime native UNVERIFIED. |
| R-36/R-37 | PASS: arah existing, copy membedakan nonaktif/simulasi/retensi; tanpa klaim compliance/produksi. |

### Purpose-Gate

PASS R-01/R-04: tanpa efek/ikon baru; hijau/check existing menyatakan identitas/persetujuan. PASS R-06: sans/skala platform existing, judul memimpin tindakan. N/A R-07/R-08/R-09/R-10/R-12/R-13: tanpa pola, panah dekoratif, badge, glass, glow atau shadow tambahan. PASS R-14: satu form/catatan/consent, tanpa grid promosi. PASS R-19: feedback existing, tanpa gerak baru. N/A R-22: tanpa ilustrasi baru.

### Liveliness

PASS: dials3/2/2 dan motif Ceria existing. Form sensitif sengaja tenang sesuai DESIGN.md. Judul/aksi menjadi fokus; ruang memisahkan akibat, kebijakan dan konfirmasi. Hijau/mint aksen identitas; tanpa kebutuhan artwork/animasi baru.

### Craftsmanship dan quality locks

PASS C-1/R-31: warna/type/spacing/layout existing untuk konsistensi; kebijakan sebelum consent; tanpa cards/artwork baru. PASS C-2: kontrol lingkup diuji. PASS C-3/R-05: struktur pengajuan, tanpa template tambahan. PASS C-4 Chrome: tiga lebar, keyboard, pending/error/retry; native UNVERIFIED. PASS C-5: klaim berbukti. PASS R-11: radius existing sesuai komponen. PASS R-15/R-16: tindakan spesifik, tanpa buzzword. PASS R-20/R-30: identitas Upahgo. PASS R-21/R-29: light/palet existing. Detector mekanis Impeccable UNVERIFIED: runtime tidak tersedia saat awal sesi, tidak dipasang.

## Syarat penutupan produksi

Setujui kebijakan/retensi/legal serta kontak pengendali. Siapkan operator/hold/triase, scheduler dan ledger terenkripsi independen. Buktikan Auth/PostgREST/Storage, role trigger, JWT lama, upload berjalan dan kegagalan di staging. Verifikasi backup expiry, restore DB/Storage terpisah dan replay sebelum traffic. Terima Android serta URL penghapusan publik. `completed` berarti primary cleanup/file ledger diakui, bukan semua backup/cache provider lenyap.

Penghapusan fisik tidak dapat di-rollback. Pause scheduler/kebijakan dan tunggu invokasi selesai; perbaiki maju. Jangan rollback CORE/harga di bawah wrapper PRIV. [Pause, retry, hold dan restore](../../../../docs/ACCOUNT-DELETION.md).

Langkah source berikut: **MEDIA-001**, rekonsiliasi upload/hapus gagal dan objek yatim akun aktif. Pengurasan prefix akun terhapus tidak menggantikan rekonsiliasi media menyeluruh.
