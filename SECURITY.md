# Keamanan Upahgo

Kontrol implementasi 0.1 lokal, 17 November 2026. Threat assessment terarah pada identitas, kontak/lokasi, izin pasangan, dan catatan COD. OWASP MASVS/ASVS dipakai sebagai rujukan peninjauan, bukan sertifikasi atau audit menyeluruh.

## Aset dan ancaman

| Aset / batas | Ancaman konkret | Kontrol yang ada | Celah operasional |
| --- | --- | --- | --- |
| Sesi dan callback OAuth | Login CSRF, callback palsu, pencurian token | Supabase PKCE, external browser, callback scheme/host/path tepat, popup source/origin, SecureStore native, memori web | Provider/callback live dan cold-start Android belum diuji; custom scheme belum App Links |
| Lokasi publik | Penguntitan dan pengungkapan rumah | Opt-in 1 jam, GPS foreground tervalidasi server, kota/radius, origin 3 desimal/marker 2 desimal, tanpa alamat tepat/background | Direktori area nyata belum disiapkan |
| Penilaian | Review palsu, sasaran/peran direkayasa, enumerasi lintas kota | Kesepakatan selesai dan participant check; target/peran historis server; unique immutable per reviewer/agreement, integer 1–5, komentar ≤300 tanpa nomor/tautan; query kota/radius | Bukan verifikasi identitas, jaminan kualitas atau konfirmasi COD |
| Nomor WhatsApp | Enumerasi nomor, persetujuan palsu, nomor berubah | Nomor tidak ada pada profile/list; verified Auth phone, bilateral consent, expiry, participant check, hash nomor, blokir/revoke | Nomor yang pernah disalin/WhatsApp eksternal tidak dapat ditarik kembali |
| Akses data | Baca/edit object pengguna lain, bypass Worker | Schema privat, RLS tanpa grants/policies klien, RPC gateway-only, actor auth.uid(), checks server, privileges helper dicabut | Harus diverifikasi ulang pada staging Supabase/PostgREST sesungguhnya |
| Upah dan status | Pemalsuan upah, double-submit, mengaku sudah dibayar | Upah integer berbatas, proposal diterima pihak lain, row locks, unique active agreement, pekerja sendiri mengakui uang setelah hasil selesai | COD bukan escrow atau jaminan; sengketa perlu operator |
| API / SMS | Spam, body besar, habis kuota, retry write | Worker limiter persisten per IP/actor, batas body streaming 16 KiB, allowlist operation/fields, SQL limiter khusus, timeout | Auth/SMS langsung Supabase, belum dilindungi Turnstile, provider/kuota belum aktif |
| Laporan/penghapusan | Salah target, kehilangan bukti COD, akun muncul setelah restore | Akun dibatasi, finalizer service-only dengan lease/retry, relasi pseudonim, Storage sebelum Auth, ledger/replay | Kebijakan nonaktif; operator, backup/restore, staging, SLA/bantuan belum diterima |
| Foto retired/yatim | Upload parsial tertinggal, retry menghapus foto aktif, sukses hapus palsu | Reservasi sebelum upload, key retired tidak dapat dipasang ulang, lock/lease, Storage API dan pemeriksaan katalog, DELETE202 antrean | Runner nonaktif; provider, scheduler/alarm, beban dan rekonsiliasi backup belum diterima |
| Telemetry/monitor | Log PII, ID palsu, gagal diam-diam, kredensial monitor bocor | UUID server, allowlist scalar tanpa body/URL/Error, ID Edge hanya setelah gateway valid, probe terbatas, state privat/lock, webhook idempoten | Metadata provider, retensi/akses, owner/kanal/scheduler/deadman belum diterima; monitor API tidak mencakup antrean |

## Aturan penting

- Sesi pengguna bukan service role. Worker memvalidasi lewat Supabase `getUser`, bukan decode JWT tanpa verifikasi. Database tetap mengidentifikasi `auth.uid()` dari JWT terverifikasi PostgREST.
- Gateway secret berada di secret store Worker (`GATEWAY_SECRET`) dan Edge foto (`UPAHGO_GATEWAY_SECRET`); database hanya menyimpan hash SHA-256. Nilai awal NULL menolak akses. Jangan memasukkan secret ke `EXPO_PUBLIC_*` atau log.
- CORS bukan otorisasi. Native tanpa Origin tetap harus memiliki sesi valid. Hanya origin web yang terdaftar diizinkan; tidak ada wildcard.
- Worker tidak menjadi proxy URL bebas. Upstream hanya origin Supabase konfigurasi, path Auth user/RPC tetap, redirect ditolak. Input klien tidak menentukan host/header gateway/actor.
- Semua input diperiksa kembali SQL. Masukan bukan field yang diizinkan ditolak. Error database internal tidak diteruskan kepada pengguna. Tidak ada SQL dinamis dari input pengguna.
- Tidak ada token di AsyncStorage/localStorage. SecureStore memakai chunks maksimal 1800 karakter, manifest terakhir, backup Android SecureStore exclusion. Sesi web preview berada di memori; OAuth popup mempertahankan verifier di jendela asal. Debug screenshot/tes hanya memakai data sintetis.
- Tidak ada cache data akun persisten, analytics/crash collector, upload dokumen, akses kontak telepon, atau pelacakan lokasi background dalam slice ini. GPS foreground hanya untuk alur penemuan; fix tepat tidak disimpan/log.
- Visibilitas, grant, agreement dan payment memakai state server. UI hanya membatasi kemungkinan tindakan; bukan bukti izin.
- Blokir menutup discovery dan kontak. Kesepakatan/riwayat tidak otomatis dihapus oleh blokir atau pencabutan kontak. Pengguna masih dapat menyelesaikan catatan/sengketa pekerjaan yang sudah disepakati.
- Write tidak diulang otomatis setelah timeout. UI menahan double tap, mempertahankan input. Request kontak berulang mengembalikan grant yang sama; proposal kerja berulang memberi konflik, ditemukan lagi di Aktivitas. ACK uang berulang idempoten.

## Ancaman harga awal dan nego

Aset: tarif/anggaran publik yang dipilih pemilik dan nominal kesepakatan. Ancaman: mengganti harga akun/peran lain, memalsukan angka/string/pecahan, menyamakan harga awal dengan persetujuan upah, melompati izin kontak atau mengubah upah lama.

Kontrol: `202611180001_profile_prices.sql` menyimpan harga pada tabel privat RLS tanpa grants klien. Wrapper mempertahankan gate gateway/akun/peran, actor lock dan key allowlist; actor tidak berasal dari ownerId. JSON dan ukuran body diperiksa sebelum field harga dipisahkan. Nominal integer Rp1.000–Rp50.000.000, bool eksplisit, null tidak boleh negotiable. Harga terpisah per user/peran, baru dibaca publik sesudah gate profile/discover; edit profil mencabut presence. Harga kosong tidak diturunkan dari rating atau upah historis.

Nego tidak memberi izin kontak atau menerima pekerjaan. Editor hanya memakai kontak accepted yang belum kedaluwarsa; server create_agreement tetap memeriksa izin/partisipasi dan nominal. Draft/catatan tidak dikirim lewat URL atau log. Review usulan belum mengirim apa pun, review tugas/jadwal mendahului write; penerima harus menyetujui, COD terpisah. Perubahan harga tidak menyentuh upah kesepakatan.

Tes SQL lokal memeriksa isolasi peran/pemilik, invalid type/range, partial update, rollback, body besar, gateway salah dan penolakan akses tabel/helper. Ini memakai Auth shim, belum membuktikan Supabase staging. Harga mengikuti pembatasan akun; cascade penghapusan Auth disiapkan, retensi dan penghapusan tuntas tetap membutuhkan operasi layanan.

## Konfigurasi dan insiden

PRIV-001 menambah batas kepercayaan operator/runner: `service_role` hanya di server, RPC tidak executable oleh pengguna/anon, target diambil dari job berizin. Lease/lock membatasi pemrosesan ganda, kegagalan Storage menahan Auth, SQL memverifikasi baris Auth hilang. Relasi dipseudonimkan agar upah/COD lawan tetap utuh; free text/komentar/laporan mengikuti retensi dan hold privat, bukan anonimitas permanen. Ledger UUID privat 0600 disinkronkan sebelum ack, ditolak jika symlink/format salah; replay mengantrekan kembali seluruh UUID termasuk Auth yang sudah hilang untuk menangani restore Storage terpisah. Jangan log ledger/PII. Kebijakan nonaktif sampai disetujui; expiry backup dan durable offsite tidak dibuktikan oleh fsync lokal. [Threat assessment, bukti dan syarat produksi](audits/2026-11-18-production/remediation/priv-001/README.md).

Lihat [SERVICES.md](docs/SERVICES.md) untuk Google, Phone, Maps, Cloudflare, provisioning hash, dan pemisahan staging/production. OPS-001 menyiapkan custom JSON telemetry allowlist dan konfigurasi observability Worker, bukan aktivasi remote. Invocation logs dan traces nonaktif, query redaction aktif pada source; Edge custom log default nonaktif. Jangan log Authorization, OTP, nomor, body pribadi, atau URL callback berisi code. Cloud provider dapat menambahkan metadata transport di luar event aplikasi; raw-log privacy review, retensi dan akses wajib sebelum aktivasi. [Runbook dan threat assessment](docs/OPERATIONS.md).

Jika secret terpapar: hentikan/matikan endpoint terdampak, rotasi secret Worker, secret Edge foto dan hash gateway, periksa log tanpa menyebarkan token, cabut sesi bila perlu, evaluasi dampak serta kewajiban pemberitahuan. Ketidakcocokan secret saat rotasi menghasilkan penolakan akses, bukan bypass.

Data produksi belum ada pada implementasi lokal. Sebelum pengguna nyata: tetapkan retensi setiap tabel, penghapusan akun/Auth dan backup, akses operator least privilege, kontak dukungan, backup/restore, serta prosedur sengketa/pengaduan. Permintaan penghapusan saat ini bukan penghapusan tuntas dan belum memenuhi seluruh kebutuhan rilis toko.

## Verifikasi dan gerbang rilis

`tests/domain.test.ts`, `tests/worker.test.ts`, `scripts/test-db.mjs` menguji kontrol dan failure modes dengan data sintetis. Hasil dieksekusi di [TESTING.md](TESTING.md); keberhasilan tes lokal bukan jaminan keamanan lengkap.

Audit dependency awal: tiga temuan sedang melalui `minimatch` pada `@expo/fingerprint`/Expo, advisory GHSA-g3hv-75wg-m249. Jalur yang ditemukan adalah glob tooling build lokal, bukan input pengguna aplikasi. Tidak menerapkan `npm audit fix --force` yang menurunkan Expo ke SDK 52. Tinjau perbaikan kompatibel sebelum rilis; hasil audit dapat berubah.

Rilis ditahan untuk: broken authorization, secret terbuka, exploitable critical/high, kegagalan integrity; juga konfigurasi live, operator/penghapusan/retensi dan pengujian Android yang belum selesai pada slice ini. Tidak ada klaim bahwa Cloudflare saja membuat aplikasi aman.

## Batas onboarding dan pergantian peran

Aktor bersesi dapat membuat akun/progress tanpa profil publik. Risiko: skip dipakai melewati syarat publik, pergantian peran mempertahankan presence atau mengubah hak kesepakatan lama, pemanggilan fungsi inti melewati gate baru. Wrapper publik memeriksa account/role/profile/phone dan gateway; core_action privat tidak dapat dieksekusi klien. accounts/role_profiles privat dengan RLS dan tanpa grant klien. set_role memulihkan bio/tag sesuai peran serta mematikan presence atomik; kesepakatan lama tetap memiliki snapshot peserta/peran. Request penghapusan tidak memerlukan profil palsu. Tes SQL mencakup skip, discovery tanpa profil, penolakan tindakan publik, isolasi progress dan transisi peran; layanan staging tetap belum terverifikasi.

## Batas kepercayaan GPS dan penilaian

Fix tepat dikirim klien → Worker → RPC; server memvalidasi akurasi ≤1.000 m, umur ≤5 menit dan masa depan ≤60 detik, lalu menentukan kota dari polygon. Tidak menerima kota pilihan klien. Penyimpanan hanya origin pencarian 3 desimal dan marker publik 2 desimal; fallback pusat area sah bila pembulatan keluar polygon. Tidak ada query geocoder, log raw GPS atau watcher/service background. Data kota, lokasi akun dan review privat/RLS. Discovery, profil, daftar ulasan dan kontak baru diperiksa kota/radius di server; pan/zoom tidak memperluas izin.

GPS dapat dipalsukan; pembulatan tidak menjamin anonimitas terhadap korelasi. Penyedia tile web menerima IP dan koordinat tile/viewport; raw fix tidak dikirim langsung. Tinjau kebijakan vendor, kapasitas dan deklarasi privasi sebelum publik. Permission native coarse/fine foreground diizinkan, background/kontak/audio diblokir pada config; manifest APK dan perilaku perangkat belum diuji.

Refresh foreground/app-resume mempertahankan radius. Saat lokasi ditolak/tidak sah, penemuan ditutup; riwayat/Akun/bantuan akun yang sudah ada tetap tersedia. Logout mencoba menghapus presence; kegagalan jaringan masih memungkinkan sisa tampil sampai lokasi 30 menit atau presence 1 jam kedaluwarsa. Tidak ada jaminan penghapusan marker seketika saat offline.

Penilaian tidak dapat diubah setelah terkirim; hanya peserta kesepakatan selesai, satu per pemberi ulasan/kesepakatan. Target dan peran historis ditentukan server; tidak mengikuti pergantian peran sekarang. Agregat per peran, terpisah dari pengakuan COD. Uji SQL lokal mencakup pemalsuan target, polygon aktual dan hole; hasil itu tidak membuktikan keamanan staging Supabase atau anti-fraud.

## Ancaman foto opsional dan usulan tugas

Aset: foto privat, identitas pemilik, lokasi/consent dan usulan privat. Ancaman: baca lintas akun/kota/radius atau setelah blokir, bypass gateway/rate limit, file menyamar sebagai JPEG, EXIF lokasi, replacement lintas pemilik dan objek yatim. Kontrol: getUser + gateway secret Edge, SQL photo_access, bucket privat/RLS, signed URL 60 detik, pending owner-only, RPC replacement service-only dengan lock/path/ownership. Secret service-role hanya Edge dan runner server.

Decoder JPEG nyata melakukan orientasi, strip metadata dan reencode; input ≤5 MB, dimensi decode ≤2048, detail ≤1280/1 MB, thumbnail 160/100 KB. Batas memori/waktu decoder tersedia. Worker membatasi foto write 3/menit dan read 90/menit terpisah, ditambah umum 90/akun dan 180/IP. Tidak ada log bytes, URL privat, nomor atau token. Bytes render base64 di memori mengurangi penggunaan cache URL privat; jangan menjanjikan penghapusan seluruh cache OS. Galeri/crop native dan crop manual web perlu bukti perangkat tersendiri.

Usulan Lainnya dibatasi/divalidasi, privat pending; tidak otomatis menjadi tag publik. MEDIA-001 menambah reservasi privat15 menit, queue dengan lease/retry, perlindungan foto aktif/in-flight dan sweep orphan kanonis >1 jam. Tidak ada kompensasi inline setelah commit tak pasti. Runner hanya memegang service credential server; ACL menolak anon/authenticated, input berbatas dan search_path tetap. Key asing gagal tertutup dan memicu sinyal triase; output runner hanya counter/kode aman. Tidak ada DELETE langsung ke katalog Storage. [Threat assessment dan batas](audits/2026-11-18-production/remediation/media-001/README.md).

Moderasi manual, operator, scheduler/penyampaian alarm, retensi backup dan uji provider harus siap sebelum live. Default runner nonaktif. HTTP202/metadata hilang bukan bukti semua bytes/cache/backup terhapus. Restore DB lama dapat memulihkan referensi foto; MEDIA tidak memiliki ledger penghapusan foto independen. Rekonsiliasi operator sebelum traffic diwajibkan dalam [runbook](docs/MEDIA-CLEANUP.md).

SEC-001, 19 November 2026: audit online setelah clean install menghasilkan 0 temuan. Advisory picomatch GHSA-fc5q-39xc-vjpf ditarik GitHub 18 November; itu perubahan status upstream, bukan patch proyek. Pola extglob mahal tetap dapat direproduksi dan harus tetap berasal dari konfigurasi build tepercaya. Minimatch 10.2.6 pada Expo fingerprint diganti 11.0.9 melalui override exact-parent yang diuji. Tidak mengganti Expo/RN, tidak menggunakan audit fix/exception. [Disposition, probe dan bukti](audits/2026-11-18-production/remediation/sec-001/README.md).

CI menjalankan `npm run audit:dependencies`, menolak moderate atau lebih tinggi termasuk dev dependency; registry gagal tidak diabaikan. Job dibatasi 30 menit, token read-only dan tanpa secret produksi pada PR. Jangan menerima glob dari data pengguna atau mengekspos Metro/tooling ke publik. Inventaris source map export web/Hermes tidak memuat picomatch/minimatch/micromatch/fingerprint; ini bukan verifikasi APK atau jaminan seluruh source aman. Snapshot 41 high/2 moderate pada audit 18 November tetap historis. Seluruh gerbang rilis lain tetap berlaku.

