# Penerimaan Android dan staging

APK QA **staging** terbaru: `.cache/qa/upahgo-qa-staging-0.1.0-arm64.apk`, SHA-256 `81cfc39a7ea530e56beb17d0d490fea0c260a38cb4bc8f9ad3055283375de7be`. Endpoint staging tertanam; APK demo lama tetap. Release build bertanda tangan debug, arm64/API24+, tanpa Maps key. Google/Phone belum aktif; APK belum dipasang/dijalankan pada Android. [Verifikasi APK](../audits/2026-11-18-production/remediation/qa-001/staging/live/apk.json).

QA-001 tetap terbuka sampai bukti perangkat dan layanan nyata diterima. Export Hermes, screenshot browser, tes SQL dengan shim Auth dan APK yang berhasil dikompilasi adalah bukti berbeda. Hasil aktual: [laporan QA-001](../audits/2026-11-18-production/remediation/qa-001/README.md).

## Build khusus pengujian

`UPAHGO_APP_VARIANT=qa` memakai nama **Upahgo QA**, package `id.upahgo.app.qa`, callback `upahgo-qa://auth/callback`. Tanpa variabel tersebut, identitas produksi tetap `id.upahgo.app` / `upahgo://auth/callback`. Nilai variant lain ditolak. Data kedua instalasi terpisah; QA tidak memperbarui aplikasi utama.

APK lokal QA menggunakan konfigurasi layanan sintetis, tanpa Maps key, dengan build type release dan sertifikat debug dari template Expo. Bundle disertakan, sehingga demo tidak memerlukan Metro. Ini artefak pengujian, bukan APK produksi atau artefak untuk Google Play. Belum ada AAB/signing produksi yang disetujui. Untuk layanan nyata, buat ulang dengan public env staging yang benar; debug-signed APK sintetis tidak berubah menjadi build live dengan memasukkan URL setelah instalasi.

SDK/cache lokal berada pada `.cache/android-sdk`, `.cache/android-user`, `.cache/gradle`, diabaikan Git. Tidak mengubah `HOME`, konfigurasi shell atau SDK global. Lisensi SDK disetujui pengguna untuk pekerjaan ini. Gunakan Node 22.x dan JDK yang kompatibel dengan Gradle/AGP pada lockfile/template. Jangan menganggap JDK 19 lokal sebagai pilihan maintenance jangka panjang.

Untuk mereproduksi build, gunakan checkout/salinan terisolasi dari commit yang akan diuji, pasang dependency dari lockfile, lalu:

1. Ekspor `ANDROID_HOME`, `ANDROID_USER_HOME`, `GRADLE_USER_HOME` ke direktori lokal yang sesuai. Catat versi toolchain, source commit dan hash lockfile. Jangan menyalin `.env` atau signing produksi ke bukti.
2. Dari `apps/mobile`, jalankan `UPAHGO_APP_VARIANT=qa EXPO_NO_DOTENV=1 EXPO_PUBLIC_SUPABASE_URL=https://supabase.invalid EXPO_PUBLIC_SUPABASE_ANON_KEY=synthetic-public-test-key EXPO_PUBLIC_API_URL=https://api.invalid GOOGLE_MAPS_ANDROID_API_KEY= npx --no-install expo prebuild --platform android --no-install`.
3. Dari Android hasil generasi, gunakan env sintetis dan variant yang sama untuk `./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a --max-workers=2 --no-daemon --console=plain`. ABI ini hanya untuk perangkat arm64; perangkat lain memerlukan build yang sesuai.
4. Verifikasi package/version/min SDK/ABI, manifest hasil merge, resource pengecualian backup, sertifikat dan SHA-256 APK. Simpan APK/source map/signing material di luar Git. Sertifikat debug harus tetap diberi label khusus pengujian.
5. Pada perangkat yang diotorisasi, pasang package QA; jangan uninstall/menimpa aplikasi lain untuk memaksa instalasi. Catat model, versi OS/API, ABI, hash APK dan hasil tiap kasus. Jangan merekam nomor, token, GPS tepat atau isi pribadi.

## Matriks perangkat

Gunakan akun/data sintetis. Nomor kasus tidak berarti sudah lulus; setiap hasil harus mempunyai identitas build, langkah aktual, hasil, bukti yang disaring dan penanggung jawab. Pengguna memilih menguji APK sendiri terlebih dahulu.

### Uji mandiri APK demo

1. Salin APK QA ke Android arm64 dengan Android 7.0/API 24 atau lebih baru. Izinkan instalasi dari aplikasi pengirim/file manager hanya bila Android memintanya; setelah selesai, matikan kembali izin sumber tersebut. Jangan mematikan Play Protect atau menghapus instalasi lain jika pemasangan ditolak.
2. Buka **Upahgo QA**, pilih **Coba demo**, pilih peran dan lokasi demo, lalu isi profil sintetis atau **Lewati dulu**. Login Google, SMS, GPS live dan Google Maps belum menjadi cakupan APK sintetis ini.
3. Buka Beranda, Temukan, Aktivitas, Notifikasi dan Akun. Periksa kartu dua kolom, harga, rating emas, label nego/tidak nego, filter, detail, tombol kembali dan seluruh menu Akun. Coba pula saat koneksi internet dimatikan; tiles peta web atau layanan eksternal bukan fitur offline.
4. Simulasikan kontak dan pekerjaan melalui menu ganti aktor demo di Akun. Periksa persetujuan kedua pihak, upah kesepakatan dan pengakuan COD terpisah. Tidak ada pesan atau pembayaran nyata.
5. Jalankan A01–A07 yang tersedia. Ulangi bagian form/tab dengan teks sistem 200% dan TalkBack. Tutup paksa lalu buka aplikasi; data demo berada di memori dan dapat kembali ke keadaan awal.
6. Catat model ponsel, versi Android, SHA-256 APK, kasus lulus/gagal dan langkah reproduksi. Untuk kegagalan, sertakan screenshot atau rekaman berisi data sintetis. A08–A11 dan S01–S08 tetap menunggu staging terkonfigurasi.

Format hasil: `Model / Android / SHA-256 / ID kasus / Lulus atau Gagal / Langkah dan hasil aktual`. Kegagalan instalasi perlu pesan Android persis, bukan penghapusan data sebagai percobaan pertama.

| ID  | Langkah / kondisi                                                                                        | Kriteria penerimaan                                                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A01 | Pasang, cold start, tutup paksa, buka kembali                                                            | Package QA benar; tidak crash/layar kosong; demo selalu diberi label; tidak memerlukan Metro                                                           |
| A02 | Demo: masuk, lewati intro, peran, lokasi demo, lewati profil; buka lima tab dan seluruh menu Akun        | Semua tab/detail/back Android dapat dicapai; dua kartu per baris pada skala normal; data sintetis jelas                                                |
| A03 | Buka detail, kontak bilateral, usulan upah, setuju kerja, selesai, ACK COD                               | Tidak ada consent otomatis; selesai tidak berarti uang diterima; hanya pekerja mengakui penerimaan uang; demo tidak membuka percakapan/transaksi nyata |
| A04 | Ubah teks sistem ke 200%, landscape, isi nama/bio panjang, buka keyboard pada profil/usulan/OTP          | Konten dan tombol tetap dapat dijangkau; input/fokus tidak tertutup IME; nominal dan label tidak terpotong                                             |
| A05 | TalkBack aktif, telusuri tab/kartu/form/dialog dan tombol kembali                                        | Nama/peran/status terbaca; fokus dialog benar; tidak ada focus trap atau aksi yang bergantung warna saja                                               |
| A06 | Gallery pilih/batal, crop, consent, upload pending, hapus/retry                                          | Izin sesuai OS; foto pending hanya pemilik; HTTP202 bukan klaim bytes sudah hilang; draft pulih setelah kegagalan                                      |
| A07 | Tanpa Maps key, masuk Temukan dan alternatif daftar                                                      | Penjelasan konfigurasi dan daftar tersedia; tidak crash. Peta Google yang sebenarnya tetap perlu build terkonfigurasi                                  |
| A08 | Live: GPS ditolak/permanen ditolak, coarse/inaccurate, layanan lokasi mati, kota di luar layanan, resume | Tidak fallback ke demo/kota lain; pemulihan jelas; riwayat/Akun tetap tersedia; permission hanya foreground                                            |
| A09 | Live: Google masuk/batal, cold-start callback, callback asing/duplikat, kill/resume                      | PKCE milik perangkat, callback tepat QA, akun benar, tidak stuck; kode/token tidak dicatat                                                             |
| A10 | Live: token expired/revoked, offline saat refresh/logout, ganti akun dan buka detail lama                | Sesi aman di SecureStore; cache/draft privat tidak berpindah akun; tidak ada write otomatis memakai identitas lama                                     |
| A11 | Dua perangkat live mengirim accept/cancel/confirm/ACK bersamaan; putus jaringan sesudah commit           | Satu transisi sah, tidak duplikat; hasil dapat ditemukan ulang dari Aktivitas tanpa menebak keberhasilan                                               |

A06 dan A08–A11 memerlukan layanan/perangkat terkonfigurasi; demo hanya memverifikasi simulasi. Mengubah permission dengan adb atau membaca manifest tidak menggantikan interaksi permission OS.

## Staging sebelum penerimaan live

Pengguna mengonfirmasi proyek Supabase yang ditunjuk khusus pengujian dan belum berisi data nyata. Konfirmasi itu belum membuktikan schema/migrasi lengkap. [Persiapan staging](STAGING.md) menyediakan environment Worker terpisah dan manifest sepuluh migrasi; login Wrangler dan akses Supabase target kini terverifikasi dengan profil terisolasi. Worker HTTPS,10 migrasi, Edge foto dan tiga akun sintetis kini sudah diterapkan/diuji atas instruksi pengguna. [55 assertion nyata dan batas](../audits/2026-11-18-production/remediation/qa-001/staging/live/README.md). Jangan menerapkan ulang migrasi atau menjalankan fault/load/restore, aktivasi SMS atau perubahan produksi sebagai efek samping smoke.

1. Tetapkan lingkungan khusus pengujian, pemilik, izin perubahan, backup dan jendela uji. Review urutan migrasi/source Worker/Edge dari [SERVICES.md](SERVICES.md), [PRIV](ACCOUNT-DELETION.md), [MEDIA](MEDIA-CLEANUP.md), [OPS](OPERATIONS.md). Deploy/provisioning merupakan tindakan terpisah yang harus diotorisasi.
2. Siapkan Worker HTTPS, Auth/PKCE, callback QA exact, direktori area yang ditinjau, bucket privat, Edge dan key Maps Android yang dibatasi package/SHA-1 sertifikat QA. Aktifkan Phone hanya dengan batas biaya/abuse dan nomor uji provider yang disetujui. Jangan menaruh service key dalam aplikasi.
3. Siapkan tiga identitas sintetis: pekerja, pemberi kerja, pihak ketiga. Simpan kredensial pada file privat yang diabaikan Git; jangan masukkan dalam chat, trace, screenshot atau laporan. Tentukan namespace fixture dan cleanup yang tidak menyentuh pengguna lain.
4. Jalankan matriks di bawah melalui endpoint nyata dan perangkat. Simpan status HTTP/kode allowlist/request ID dan assertion; singkirkan bearer, nomor, signed URL serta body pribadi dari bukti. Jangan menerima `404` atau error gateway sebagai bukti object authorization.

| ID  | Kasus HTTP/layanan                                                                                                   | Hasil wajib                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| S01 | Tanpa token, token expired/malformed/wrong-project; direct RPC tanpa gateway; private schema/helper/Storage langsung | Ditolak tanpa data pribadi; buktikan penolakan pada lapisan yang dimaksud, bukan karena fungsi/layanan tidak tersedia                                        |
| S02 | Token A membaca/mengubah objek B dan pihak ketiga mencoba kontak, agreement, ulasan, notifikasi, foto                | Owner/participant-only; target/role/harga dari client tidak menjadi otoritas; tidak ada enumerasi                                                            |
| S03 | Kedua peran: profil/harga/nego, lokasi/radius, discovery, consent, agreement, completion/COD, ulasan, laporan/blokir | Keadaan server benar, consent bilateral dan ACK terpisah; laporan masuk alur petugas yang terpantau                                                          |
| S04 | Foto pending/approved, signed URL expiry, blokir/logout, upload parsial, replace/delete202, runner retry             | Privasi bytes dan idempotensi terbukti; orphan dibersihkan sesudah grace; foto aktif/in-flight tidak dihapus                                                 |
| S05 | Penghapusan dua peran dengan histori, Auth/Storage retry, ledger dan restore terisolasi                              | Kebijakan yang disetujui dipatuhi; akun tertutup, bukti pihak lain utuh, tombstone tidak dibatalkan restore                                                  |
| S06 | Gangguan Auth/DB/limiter/foto terkontrol dan pemulihan                                                               | Gagal tertutup, request ID terlacak, redaksi benar; alarm/recovery diterima petugas; jangan memutus layanan pengguna                                         |
| S07 | 50 pengguna bersamaan dengan operasi bisnis sah, ramp-up/soak dan budget disetujui                                   | Ukur throughput/error/p50/p95/p99 per operasi; pisahkan 401/404/429/rejection dari sukses bisnis; target awal gateway p95 <1 detik, foto <5 detik sesuai OPS |
| S08 | Restore/rollback pada target terisolasi dengan DB + bytes Storage                                                    | Ukur RPO/RTO, FK/RLS/count/bytes dan replay penghapusan; target usulan RPO 1 jam/RTO 4 jam bukan hasil uji                                                   |

Hasil aktual 19 November: S01/S02/S03 sebagian diverifikasi melalui Auth/PostgREST/Worker nyata; S04 pending/private/DELETE202/signed URL TTL60detik lulus; pembatasan segera S05 lulus. Google/Phone nonaktif; callback QA sudah dipasang. Approved/moderasi, runner/retry/ledger, operator, fault/load/restore dan Android tetap terbuka. Detail per assertion ada pada bukti live; smoke tidak menutup seluruh baris S01–S08. [Tindakan Google](GOOGLE-STAGING.md).

## Browser dan keputusan

CI Linux terbaru source `b47d79c`, run [44528145983](https://github.com/rakannaufal/UpahGO/actions/runs/44528145983), lulus 63/63 browser (21 per engine) dalam 9,3 menit. Unit63, SQL280, Edge1, Worker4, audit npm0, typecheck/lint, export web/Hermes dan kedua dry-run lulus. Ini bukti sintetis; matriks Android/staging di atas tetap memerlukan hasil aktual. [Metadata dan log](../audits/2026-11-18-production/remediation/qa-001/staging/README.md). Run QA sebelumnya tetap tercatat pada laporan historis.

`npm run test:web` menjalankan Chromium, Firefox dan WebKit, tanpa retry suite otomatis. Pasang runtime yang cocok menggunakan `npx --no-install playwright install --with-deps chromium firefox webkit`; pada macOS tidak perlu `--with-deps`. Variabel `PLAYWRIGHT_BROWSERS_PATH` dapat mengisolasi unduhan. `--project=chromium` tersedia untuk pemeriksaan terbatas, bukan pengganti gate tiga browser.

Fixture WebKit menormalkan timestamp mikrodetik yang dikeluarkan override Playwright menjadi milidetik. Mock native Firefox menambahkan satu hari; fixture menghapus offset tersebut hanya pada objek native dan rentang yang diketahui. Validasi lokasi aplikasi tidak diubah; regresi menolak fix enam menit lalu serta dua menit di masa depan sebelum request server. Uji ring fokus mencapai Akun lewat Tab nyata, memeriksa outline solid2px dan Enter, tanpa memaksa modalitas keyboard melalui `.focus()`. Harga diperiksa pada elemen nominal dengan nilai tepat, sambil menerima perbedaan whitespace `Intl.NumberFormat` antar engine.

QA-001 hanya ditutup setelah A/S yang berlaku lulus pada build dan environment tercatat, masalah sensitif diperbaiki, bukti ditinjau, serta penerimaan browser/native/staging disetujui. Blocker eksternal tetap tercatat sebagai belum diuji. Tidak ada skor buatan atau klaim siap produksi dari kompilasi saja.
