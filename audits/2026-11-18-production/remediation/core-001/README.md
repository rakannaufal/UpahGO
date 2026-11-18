# CORE-001: riwayat dan detail lama

Perubahan memperbaiki akses data lokal/source. Bukan persetujuan rilis Android atau layanan produksi. Skills: ponytail full, impeccable Operate, antislop `during` (preferensi global terverifikasi), review terarah ponytail-review. Arah Ceria existing, ENERGY 3 / RHYTHM 2 / MOTION 2; tidak ada identitas/aset/dependensi baru.

## Perubahan dan reproduksi

Regresi SQL dibuat sebelum perbaikan. Pada baseline, operasi detail gagal `INVALID_INPUT` karena belum tersedia; probe audit awal telah membuktikan objek lama tidak ada dalam halaman 100 terbaru. Setelah migrasi, kedua peserta dapat membaca kontak/kesepakatan tertua, menjalankan penyelesaian pekerjaan lama dan mengakui COD. Pihak ketiga ditolak.

- `contact`/`agreement` membaca objek berdasarkan ID dengan actor dari sesi database. `agreement` tetap menyertakan `workContext`.
- `contacts`/`agreements`/`notifications` tetap array, maksimal 100 per halaman, urutan `(created_at DESC, id DESC)`, cursor tervalidasi. Timestamp asli dipertahankan sampai mikrodetik. Tanggal sama tidak menyebabkan entri terlewat atau duplikat; insert baru di depan cursor tidak menggeser halaman lama.
- Filter Aktif/Riwayat dijalankan sebelum limit; expiry kontak dihitung server. Lookup grant profil juga dibatasi pasangan/peran di server, sehingga izin lama tetap dapat ditemukan.
- Aktivitas/Notifikasi memiliki Muat lebih banyak, loading/disabled, retry tanpa menghapus entri yang sudah dimuat. Pergantian fokus/filter/aktor mengabaikan respons lama; refresh memulai kembali halaman terbaru. Angka belum dibaca menyatakan jumlah dari notifikasi yang dimuat.
- Detail kontak, detail kerja dan editor kesepakatan memakai operasi ID. Dua kartu profil per baris dan gaya existing tetap.

## Ancaman dan review akses data

Aset: izin kontak, rincian/upah pekerjaan, status COD dan notifikasi privat. Actor: dua peserta, pengguna lain, akun dibatasi dan klien yang memalsukan parameter. Batas kepercayaan: aplikasi, gateway berizin, RPC security definer, tabel privat.

Gate baru mempertahankan JWT actor, hash gateway, batas JSON 16 KiB, advisory lock actor, status akun/profil, pembatas SQL 90/menit, input allowlist dan `search_path=''`. Semua helper privat tetap tidak dapat dieksekusi klien. Pembacaan detail membutuhkan peserta; pagination notifikasi dibatasi recipient. Cursor bukan otorisasi. Nomor tidak ditambahkan ke hasil; akses nomor tetap memerlukan persetujuan, expiry, hash nomor dan pemeriksaan blokir.

Riwayat sengaja tetap tersedia sesudah ganti peran, blokir atau GPS tidak tersedia, sesuai perilaku histori existing. Filter target menggunakan peran actor dari DB. Review juga menangkap potensi hilangnya `workContext` ketika melewati wrapper lama; field dipertahankan dan diuji. Operasi null ditolak eksplisit.

## Pemeriksaan

Lingkungan: Node 22.23.3, PostgreSQL 17.11 disposable pada loopback, Chrome macOS. Data/Auth/OTP/upstream browser sintetis. Tidak ada login Google, SMS, WhatsApp atau pembayaran nyata.

| Pemeriksaan yang dijalankan | Hasil |
| --- | --- |
| `npm run typecheck`, `npm run lint` | Lulus, tanpa error/peringatan lint |
| `npm test` | 31 tes lulus, termasuk regresi demo/kontrak Worker |
| `npm run test:db` | 189 assertion lulus, 54 tambahan mencakup riwayat/akses/COD/rollback |
| `npm run test:web` | 18 tes Chrome lulus, termasuk regresi paging, retry, filter dan respons basi |
| `npm run build:web` | Export web lulus |
| `npm run build:android` | Bundle Hermes lulus, bukan APK/AAB atau uji perangkat |
| `npm run worker:check` | Bundel/dry-run lulus, tidak deploy |
| `npm run photo:prepare`, `npm run test:photo-edge` | WASM disiapkan lokal, 1 tes Deno Edge lulus |
| `npm run check:secrets` | 90 file source/config/dokumen diperiksa pada pass final, tidak ada pola credential cocok; bukan scan menyeluruh |
| `git diff --check` | Lulus |

Tes browser awal memerlukan koreksi fixture: Beranda live meminta izin GPS, sehingga tes riwayat menunggu tab yang tetap tersedia; pilihan radio yang langsung menutup sheet dipilih lewat klik lalu diverifikasi hasil filternya. Tidak ada aturan GPS/filter yang dilemahkan. Semua 18 tes kemudian lulus. Gate visual delta: [UI-DELIVERY.md](UI-DELIVERY.md).

Screenshot diperiksa dalam satu batch: [kontak lama 390](older-contact-390.png), [notifikasi 320](older-notice-320.png), [notifikasi 1440](older-notice-1440.png). Tidak ada overflow dokumen pada dua ukuran notifikasi; kartu tetap terbaca. Native tidak tersedia untuk inspeksi.

## Batas dan rollback

Belum: APK/AAB atau runtime Android, TalkBack/text scaling native, staging Auth/PostgREST/Worker, performa scroll native banyak halaman, CI remote, backup/restore cloud. ScrollView existing masih memasang seluruh baris yang sudah dimuat; virtualisasi perlu dinilai pada pengujian riwayat besar di perangkat sebelum peluncuran luas. Halaman bukan snapshot: perubahan status/expiry saat paging perlu refresh.

Migrasi menambah API, tidak mengubah/menghapus data. Urutan staging: migrasi, allowlist Worker, klien. Semua layanan remote tetap membutuhkan otorisasi terpisah. Rollback transaksional tersedia di `supabase/rollbacks/202611180002_history_pagination.sql`; diuji lokal dengan data tetap utuh. Pulihkan klien/Worker lama sebelum RPC, karena operasi detail baru tidak tersedia pada RPC lama. Rollback mengembalikan bug CORE-001, sehingga bukan solusi rilis.

Putusan review: perubahan source dapat diajukan untuk review; rilis tetap NO-GO karena temuan lain dan verifikasi native/live terbuka.
