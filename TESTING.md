# Verifikasi Upahgo

18 November 2026. Lingkup: implementasi lokal, data sintetis. **Belum lulus rilis Android atau layanan live.** Tidak ada migrasi remote, deployment, login Google nyata, SMS, pesan WhatsApp atau pembayaran nyata dilakukan.

## Hasil terbaru: dua kartu per baris

Beranda dan daftar Temukan kembali dua kolom pada ukuran teks normal, termasuk telepon. Kartu <260 dp memakai avatar 36 dp, gambar 56 dp dan tag pada baris penuh; rating emas tetap rata kanan dan dapat turun baris agar nominal utuh. FontScale ≥1,5 tetap satu kolom untuk aksesibilitas. [Bukti 412 px](.impeccable/review/two-column-cards/row-412.png), [Delivery Gate](.impeccable/review/two-column-cards.md).

- `npm run typecheck`, `npm run lint`, `npm run build:web` lulus. Ekspor Android Hermes 4,5 MB lulus, bukan APK/AAB atau runtime perangkat.
- Dua tes browser core/prices lulus bersama dalam **33,6 detik**. Dua kolom pada 320/412/840/1440 px, gambar 56/80 px kanan tengah, nego satu kali tanpa latar, rating emas dan tanpa overflow kartu/halaman. Harga Rp50 juta utuh pada 320 px; harga kosong tetap tersedia pada detail.
- Click-through: demo/peran/lokasi, filter pekerjaan/radius/kecamatan, hasil kosong/reset, peta/cluster/daftar, profil melalui fokus + Enter, ganti aktor, edit harga/validasi/maksimum/hapus, consent dua pihak, tinjau/edit/kirim usulan upah dan penerimaan. `pageErrors` kosong. Run pertama berhenti pada locator “Bahas bersama” ambigu antara halaman tersembunyi dan profil; dibatasi ke halaman profil, tanpa melonggarkan assertion.
- Satu batch inspeksi visual: baris 320/412/840 px serta harga maksimum 320 px. Tanpa defect tambahan atau batch perbaikan visual. Preview existing dimuat ulang dengan demo, dua kartu sejajar terlihat.

Kontras memakai token existing yang sebelumnya lulus 34 pasangan; warna tidak diubah. Mechanical detector Impeccable tetap tidak tersedia, tidak diinstal. Runtime Android/fontScale/TalkBack dan layanan live belum diuji. Unit/domain/DB/Edge/Worker, audit dependensi dan suite web penuh tidak diulang untuk perubahan layout ini.

## Hasil sebelumnya: rating di kanan harga

Rating emas kembali pada kartu, sejajar di kanan nominal; nego menjadi teks hijau gelap tanpa kotak. Gambar 80 dp kanan tengah, avatar dan border tetap. [Bukti aplikasi](.impeccable/review/horizontal-card/card-412.png), [Delivery Gate](.impeccable/review/price-rating.md).

- Typecheck, lint, ekspor web dan ekspor Android Hermes 4,5 MB lulus.
- Dua tes browser core/prices lulus dalam 36,9 detik. Cakupan 320/412/840/1440: rating kanan/sejajar nominal, bintang emas, label nego transparan, artwork 80 px, harga maksimum/kosong, filter/peta/profil, consent dan usulan upah. pageErrors kosong.
- Studi revisi: lima kasus termasuk teks 200% dan nama/tag panjang, tanpa overflow; rating boleh turun baris. Verifier desain lulus seluruh check dan 34 pasangan kontras.
- Satu batch inspeksi visual bersih, tanpa perbaikan lanjutan. Detector Impeccable tetap tidak tersedia; tidak menginstal engine.

Runtime Android/fontScale/TalkBack dan layanan live belum diuji. Unit/domain/DB/Edge/Worker, audit dependensi dan seluruh suite web tidak diulang untuk slice presentasi ini.

## Hasil sebelumnya: kartu horizontal terpilih

Pengguna memilih alternatif 2, mengganti rating kartu dengan label nego dan meminta gambar lebih besar di kanan tengah. PersonCard bersama Beranda/daftar Temukan kini memakai artwork 80 dp, avatar tonal, label nego satu kali, panel harga bawah. Daftar satu kolom di telepon dan dua ketika ruang ≥600 dp; fontScale ≥1,5 memakai satu kolom. [Bukti aplikasi](.impeccable/review/horizontal-card/card-412.png), [Delivery Gate dan batas](.impeccable/review/horizontal-card.md).

| Pemeriksaan | Hasil dan batas |
| --- | --- |
| `npm run typecheck`, `npm run lint` | Lulus. |
| `npm run build:web`, `npm run build:android` | Lulus; Android hanya ekspor Hermes 4,5 MB, bukan APK/AAB atau pengujian perangkat. |
| Playwright terarah core/prices | 2/2 lulus dalam 33,5 detik; empat lebar 320/412/840/1440, layout satu/dua kolom, artwork 80×80 di kanan tengah, harga bawah, label nego tunggal, pembukaan profil/filter/peta, edit harga, harga maksimum/kosong, consent dan proposal kerja tetap terpisah. pageErrors kosong. |
| Studi HTML revisi | Lima kasus 960/412/320, teks 200% dan nama/tag panjang; tanpa overflow, pageErrors atau request eksternal. Teks minimum 5,628:1; outline ikon 4,080:1. Studi bukan uji fontScale perangkat. |
| Visual | Satu batch kartu aplikasi 320/412, contoh terpilih dan halaman daftar pekerja 412; tidak ada defect tambahan, tanpa putaran perbaikan visual. |
| Impeccable layout detector | Tidak berjalan: engine 0.1.14 belum terpasang, cache tidak dapat dibuat. Tidak menginstal engine; struktur diperiksa manual dan browser. |

Suite web penuh, unit/domain, DB/Edge/Worker serta audit dependensi tidak diulang. Runtime Android/TalkBack/fontScale/insets dan layanan live tetap belum terverifikasi.

## Hasil sebelumnya: aset layanan dan border lembut v2.3

Koreksi pengguna mengembalikan empat gambar layanan berwarna pada 36 dp, menambah bingkai tombol Pekanbaru/lokasi-radius dan mengganti border 2 dp gelap menjadi 1 dp abu-abu muda pada seluruh primitive kartu/panel serta pengalih. Form/search/tombol sekunder juga memakai ketebalan 1 dp; ikon antarmuka tetap hijau 24 dp. [Preview](.impeccable/review/soft-borders/preview.png), [empat blok Delivery Gate](.impeccable/review/soft-borders.md).

| Pemeriksaan | Hasil dan batas |
| --- | --- |
| `npm run typecheck`, `npm run lint` | Lulus untuk perubahan UI. |
| `npm run test:web` | 15/17 lulus pada run penuh. Satu fixture GPS berhenti sebelum masuk karena OAuth sintetis dibatalkan; tes border lokasi awalnya menunjuk ripple bagian dalam, sedangkan border berada pada Surface pembungkus Paper. |
| Regresi terarah `--grep 'five tabs\|GPS bootstrap'` | 2/2 lulus dalam 28,6 detik setelah locator border diarahkan ke Surface; assertion 1 px/warna tetap. Tidak mengubah implementasi OAuth/GPS. Seluruh 17 skenario lulus lintas dua run, bukan satu run penuh hijau. Penyebab pembatalan OAuth sesaat belum dibuktikan. |
| Cakupan baru | Dua peran, 320/412/840/1440: keempat aset lama hadir pada 36 px, bukan ikon; border shortcut/lokasi/pengalih 1 px `#E3E7E4`; navigasi dan keyboard Akun tetap berfungsi. pageErrors kosong. |
| `npm run build:web`, `npm run build:android` | Lulus; Hermes 4,5 MB merupakan export, bukan APK/AAB atau runtime perangkat. |
| `python3 design/verify.py --write-report` | Semua check dan 31 pasangan kontras teks/ikon/kontrol lulus. Dua pasangan border kartu lama dihapus karena batas pengelompokan kini dekoratif; label/chevron yang kontras mengidentifikasi kontrol. Outline input `#78877D` dan fokus tetap diverifikasi. |
| Visual | Satu batch inspeksi: Beranda/Aktivitas/Notifikasi/Akun atas/bawah, profil, form, bantuan, compact 320/412 dan expanded 1440. Border tipis, aset berwarna dan label lokasi/radius 320 px terlihat utuh. Tidak membutuhkan perbaikan visual lanjutan. Screenshot disalin ke soft-borders agar bukti slice ini tetap tersedia. |

Unit/domain, DB/Edge/Worker dan audit dependensi tidak diulang untuk slice styling ini. Bukti 30 unit pada v2.2 tetap historis. Android perangkat/TalkBack/fontScale, layanan nyata dan kesiapan rilis tetap belum terverifikasi.

## Hasil sebelumnya: konsistensi ikon, border dan navigasi v2.2

Border kartu, panel, search dan input 2 dp. Ikon antarmuka hijau 24 dp, tanpa bidang latar; navigasi aktif terisi tanpa garis bawah. Akun eager mount; peta tetap lazy. Aktivitas/Notifikasi memakai ikon identik. Pengalih maksimum 320 dp dengan target sentuh 48 dp, tombol utama minimum 48 dp, artwork layanan diperkecil. Avatar profil tetap tonal. [Preview](.impeccable/review/ui-consistency/preview.png), [empat blok Delivery Gate](.impeccable/review/ui-consistency.md).

| Pemeriksaan | Hasil dan batas |
| --- | --- |
| `npm run typecheck`, `npm run lint` | Lulus pada slice terbaru. |
| `npm test` | 30/30 lulus; tidak mengubah domain, API, SQL, consent atau nilai uang. |
| `npm run test:web` | 16 skenario existing lulus bersama dalam run penuh; satu regresi baru awalnya gagal karena tes memakai check pada filter yang sudah terpilih. |
| `npm run test:web -- tests/web/ui-consistency.spec.ts` | 1/1 lulus setelah langkah tersebut memakai click, dalam 25,9 detik. Total 17 skenario lulus lintas dua run; bukan satu run penuh 17/17. Dua kegagalan implementasi awal (border pecahan dibulatkan browser dan target ripple pengalih 34 px) diperbaiki menjadi border 2 dp dan target 48 px sebelum run final. |
| Regresi navigasi baru | Lima tab, kedua peran, 320/412/840/1440; semua tab dalam viewport, selected filled/empat outline, tanpa garis bawah. Ikon tampak 24 px hijau, border 2 px, pengalih 48 px dan setiap segmen ≤160 px. Filter, halaman ketentuan/Kembali dan Akun dari Notifikasi melalui Enter berfungsi. pageErrors kosong. |
| `npm run build:web` | Export final lulus. Preview static harus direload untuk mengambil bundle terbaru. |
| `npm run build:android` | Export Hermes final 4,5 MB lulus; bukan APK/AAB atau pengujian perangkat. `adb` tidak tersedia. |
| `python3 design/verify.py --write-report` | Seluruh check dan 33/33 pasangan kontras lulus. Batas kartu 3,36:1 pada putih, 3,10:1 pada canvas sekunder. Report statis: design/contrast-report.json. |
| `npm run check:secrets` | 87 source/config/doc tanpa pola credential tertanam; env/build/dependencies dikecualikan, bukan audit menyeluruh. |
| Visual | Satu batch inspeksi compact/expanded, Kontak/Pekerjaan, Notifikasi, Akun atas/bawah. Screenshot settled suite Ceria dan regresi baru tersimpan lokal; tidak ada defect tambahan yang memerlukan batch perbaikan visual. Browser aplikasi juga direload, Akun terbuka dari Notifikasi tanpa layar kosong pada inspeksi akhir. |

DB/Edge/Worker tidak diubah atau diulang. Audit dependensi 43 advisory tetap hasil historis dan belum diremediasi. TalkBack, fontScale, gesture/back, IME/insets, peta dan layanan native/live tetap belum terverifikasi. Slice UI ini tidak mengesahkan rilis produksi.

## Hasil sebelumnya: kartu profil, harga per sesi dan nego

Kartu/detail memakai avatar beralas mint/peach, tag ringkas, harga pemilik per pekerjaan/sesi dan tindakan di footer. Edit profil menyimpan nominal serta kesediaan nego per peran. Nego melalui izin kontak dua pihak, editor/review usulan, rincian tugas/jadwal, lalu kesepakatan existing yang diterima pihak lain. Upah lama serta COD tetap terpisah. Review source/ancaman, click-through dan empat blok Delivery Gate: [.impeccable/review/profile-pricing-implementation.md](.impeccable/review/profile-pricing-implementation.md).

| Pemeriksaan | Hasil dan batas |
| --- | --- |
| `npm run typecheck`, `npm run lint` | Lulus pada source final, termasuk label tetap. |
| `npm test` | 30/30 lulus; batas/parser harga, isolasi peran, legacy save, null boolean ditolak, hapus harga tidak mengubah wage. Label akhir hanya mengubah UI, unit tidak diulang sesudahnya. |
| `npm run test:db` | 135 assertion lulus pada PostgreSQL 17.11 disposable dengan Auth shim. Seluruh migrasi termasuk `202611180001_profile_prices.sql`; price bounds/type, pemilik/peran, rollback, legacy save, gateway, visibilitas dan private grants. Server disposable sudah dihentikan. Bukan Supabase/PostgREST. |
| `npm run test:web` | 16/16 lulus dalam 2,4 menit sebelum perbaikan label tetap. Alur lama dan harga/nego lulus bersama. |
| `UPAHGO_SKIP_CAPTURES=1 npm run test:web -- tests/web/prices.spec.ts` | Source final 1/1 lulus dalam 21 detik: label tetap harus berada di atas input pada 320/412/1440, beserta alur harga/consent/proposal/penerimaan. Satu percobaan sebelumnya timeout pada tombol Lewati di onboarding, sebelum mencapai perubahan; pengulangan tanpa build paralel lulus. Penyebab timeout belum dibuktikan. |
| `npm run build:web`, `npm run build:android` | Lulus pada source final. Android bundle Hermes 4,5 MB, bukan APK/AAB/runtime. |
| `npm run worker:check` | Dry-run 10,34 KiB / 3,47 KiB gzip lulus; kontrak error PRICE_INVALID tergenerasi, tanpa upload. Tidak ada perubahan Worker setelahnya. |
| `python3 design/verify.py` | Semua check dan 29 pasangan token lulus. Sembilan pasangan teks tambahan untuk slice 4,66–13,08:1, `profile-pricing/contrast.json`. Bukan audit semua piksel. |
| `npm run check:secrets` | 87 source/config/doc tanpa pola kredensial tertanam; env/build/dependencies dikecualikan, bukan audit menyeluruh. |
| Visual | Dua batch inspeksi, 22 capture settled, pageErrors kosong. Harga Rp50 juta utuh di kartu 320 px. Label floating editor 320 terdeteksi pada konfirmasi, diganti label tetap dan diverifikasi lewat assertion posisi; tidak ada batch visual ketiga. Capture editor mendahului label final; preview handoff hanya kartu/detail yang tidak berubah. |

Browser menguji edit harga salah/valid/maksimum/hapus, error hilang saat edit, toggle nego, presence opt-in ulang, kartu/detail pada kedua peran, akses kondisi click/Enter, consent pending tanpa editor/nomor, penerimaan pihak kedua, usulan blank/review/edit, draft guard, nilai/catatan terbawa, kirim proposal dan penerimaan tanpa COD otomatis. Penghapusan harga tidak mengubah harga kesepakatan. Cabang gagal memuat harga awal/retry diperiksa source, belum dipicu runtime; input nominal manual tetap tersedia.

Preview aplikasi: http://localhost:8081, pilih Coba demo. [Preview kartu/detail](.impeccable/review/profile-pricing/implementation-preview.png). Konsep HTML di design/profile-pricing tetap artefak terpisah, bukan preview aplikasi terbaru. Native/live, audit dependensi lama 43 advisory dan operasi layanan masih terbuka. Tidak ada klaim siap produksi dari hasil lokal ini.

## Hasil sebelumnya: ikon tanpa latar dan menu Akun Ceria v2.1

Ikon menu/navigasi/notifikasi dan fallback identitas tanpa bidang latar; border kartu tetap. Akun memiliki Lainnya dan Kelola akun, halaman ketentuan/privasi dan atribusi, serta keterangan penilaian aplikasi yang belum memiliki URL Google Play resmi. Hasil pada source terbaru:

| Pemeriksaan | Hasil dan batas |
| --- | --- |
| `npm run typecheck`, `npm run lint` | Lulus |
| `npm test` | 28 tes lulus pada slice sebelumnya; tidak diulang untuk perubahan ikon/menu ini |
| `npm run test:web` | 14/15 lulus; satu capture gagal karena locator Lainnya juga menemukan teks Beranda tersembunyi |
| `npm run test:web -- tests/web/ceria.spec.ts` | 2/2 lulus dalam 31,2 detik setelah locator dibatasi ke halaman Akun. Tidak ada source berubah atau assertion dilonggarkan. Seluruh 15 skenario lulus lintas dua run, bukan satu run penuh hijau |
| Konfirmasi capture menu bawah | Tes `Ceria route` diulang, 1/1 lulus dalam 26,5 detik setelah capture digulir ke Hapus akun. Percobaan sandbox sebelumnya terhalang `listen EPERM`; run lokal di luar sandbox berhasil |
| `npm run build:web`, `npm run build:android` | Lulus; Hermes 4,5 MB merupakan bundle, bukan APK/AAB/runtime Android |
| `python3 design/verify.py` | Seluruh check dan 29 pasangan kontras token v2.1 lulus; `.impeccable/review/ceria/contrast-refinement.json` |
| `npm run check:secrets` | 85 file source/config/doc diperiksa, tanpa pola kredensial tertanam; env/build/dependencies dikecualikan, bukan audit menyeluruh |
| Capture | 39 settled, `pageErrors: []`; menu bawah Akun pada 320/412/1440 px, halaman ketentuan, atribusi dan keterangan penilaian turut direkam. Preview `account-menu-preview.png`; manifest `captures.json` |

Satu batch inspeksi visual selesai pada Akun atas/bawah, compact/expanded, Notifikasi, ketentuan, atribusi dan keterangan penilaian; konfirmasi akhir merekam kedua baris Kelola akun. Tidak ditemukan defect layout penting. Tes memverifikasi route baru, keluar demo dan dispatch enam URL atribusi melalui stub `window.open`; halaman eksternal dan pembukaan tautan native tidak diuji. Pencarian, header tanpa shortcut akun, status aktivitas dan kontak/uang tetap dicakup. Native/live tetap belum diuji; audit dependensi 43 advisory di bawah adalah hasil sebelumnya, tidak diulang untuk perubahan komponen ini. DB/Edge/Worker tidak diubah atau diuji ulang.

## Hasil implementasi Ceria sebelum refinement, 18 November 2026

Hasil berikut dijalankan pada source Ceria. Tidak ada perubahan backend, migrasi remote atau deployment. Review dan Delivery Gate berbukti: [.impeccable/review/ceria-implementation.md](.impeccable/review/ceria-implementation.md).

| Pemeriksaan | Hasil dan batas |
| --- | --- |
| `npm run typecheck`, `npm run lint` | Lulus |
| `npm test` | 28 tes lulus; termasuk 4 tes cluster/pemisahan pin, determinisme, input immutable dan tabrakan antarkelompok |
| `npm run test:web` | **15 tes lulus dalam 1,9 menit**, satu suite penuh sesudah perbaikan kamera peta; Chrome dengan fixture sintetis |
| `npm run build:web` | Export web lulus |
| `npm run build:android` | Export Hermes 4,5 MB lulus; **bukan APK/AAB atau runtime Android** |
| Capture visual | 27 capture settled, `pageErrors: []`, pada `.impeccable/review/ceria/captures.json`; 24 layar/state + Beranda 320/600/1440 px. Bounded visual QA: inspeksi, perbaikan satu batch, konfirmasi |
| Kontras | 29/29 pasangan token lulus, `.impeccable/review/ceria/contrast.json`; bukan audit setiap piksel |
| `npm run check:secrets` | 82 file source/config/doc diperiksa setelah dokumentasi diperbarui, tanpa pola credential tertanam; bukan audit menyeluruh |
| `npm audit` online | 43 advisory: 41 high, 2 moderate, 0 critical. Dua asal picomatch/minimatch; `.impeccable/review/ceria/dependency-audit.json`. Belum diremediasi, tidak melakukan downgrade mayor Expo/RN |

Suite browser memverifikasi Google G tampil, pilihan peran berdampingan, filter/role reset, state foto, katalog aktif/rencana, kontak dua pihak, pekerjaan/COD/rating terpisah, draft/validasi, laporan/blokir/penghapusan, keyboard/fokus, reduced motion, responsive 320–1440, auth recovery, GPS denial/akurasi/kota/retry/foreground, kegagalan tiles dan daftar alternatif. Tes pin memastikan target berada dalam viewport dan dapat diklik sesudah cluster dipilih serta zoom maksimal; zoom out kembali ke kelompok. Tidak memverifikasi login Google, SMS atau peta Android nyata.

Android SDK/adb tidak tersedia. TalkBack, font scaling perangkat, System Back, IME/insets, native maps, cold-start OAuth, SecureStore dan performa belum diuji. DB/Edge/Worker tidak diulang pada slice Ceria; bukti di bawah bersifat historis. Kesiapan rilis tetap tertahan oleh native/live, dependensi dan operasi layanan yang belum selesai.

## Hasil historis sebelum Ceria

Hasil final slice redesign/katalog/foto berikut dilaporkan pelaksana utama, dicocokkan dengan artefak review/gate; dokumenter tidak menjalankan ulang build atau tes. Data sintetis, PostgreSQL disposable dengan shim Auth, browser Chrome. Bukan penerimaan Android/live.

| Pemeriksaan | Hasil dan batas |
| --- | --- |
| `npm run typecheck`, `npm run lint` | Lulus |
| `npm test` | 24 tes lulus |
| `npm run test:db` | 109 assertion PostgreSQL 17 disposable/shim Auth lulus; termasuk polygon Pekanbaru OSM, hole polygon dan penolakan target review palsu; bukan Supabase Auth/PostgREST |
| `npm run test:web` | 13 Playwright Chrome sintetis lulus (1,5 menit): kontak/kerja/COD/rating bilateral, denial/akurasi/kota/retry/bootstrap GPS, radius/foreground, tiles diblokir/list, keyboard/reduced motion/auth recovery |
| `npm run test:photo-edge` | 1 integrasi Deno 2 lulus, decoder WASM nyata + upstream mock; bukan layanan remote |
| `npm run build:web` | Export web lulus; Leaflet lazy sekitar 149 KB |
| `npm run build:android` | Export Hermes 4,4 MB lulus; **bukan APK/AAB atau runtime Android** |
| `npm run worker:check` | Dry-run 10,32 KiB / 3,47 KiB gzip lulus, tanpa upload; outdir portabel workers/api/.wrangler/check |
| `python3 design/verify.py` | Semua check/29 pasangan kontras lulus; tanpa rerender/report baru, bukan seluruh piksel aplikasi |
| `npm run check:secrets` | 80 file source/config/doc bersih; pelaksana utama telah mengulang setelah sinkronisasi dokumentasi; pemeriksaan pola, bukan audit menyeluruh |
| `npm audit` online | 41 high + 2 moderate propagated packages; dua advisory asal picomatch GHSA-fc5q-39xc-vjpf dan minimatch GHSA-g3hv-75wg-m249. Fix kompatibel belum ditemukan; tidak force downgrade Expo, tidak ada klaim eksploit runtime langsung |
| Expo native config introspection | `id.upahgo.app`, coarse/fine foreground allowed, background/kontak/audio blocked; background/service expo-location false; `mapsConfigured=false`. Bukan manifest APK final |

`assets/verify.py --pixels` terbaru: 52 rekaman/128 hash/99 SVG/26 PNG lulus, termasuk tujuh self-check SVG berbahaya ditolak. Papan preview lama tetap 36 ikon. Tes limiter Worker 190 request (180 HTTP 400 + 10 HTTP 429) merupakan bukti historis, bukan tes baru redesign.

Perintah dan prasyarat: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). Workflow GitHub Actions disiapkan di `.github/workflows/checks.yml`; belum dijalankan remote karena belum ada repository proyek tersendiri. Fixture OAuth browser memakai sesi sintetis dengan respons token/API yang diintersep, tidak memvalidasi penyedia Google sebenarnya.

## Cakupan alur dan otorisasi

Playwright mencakup lebar 320/360/390/411/600/840/1440, keyboard, reduced motion, bootstrap/retry, demo lengkap dengan riwayat, kedua peran dan rating. Fixture OAuth/API sintetis menguji pemulihan autentikasi; tidak memvalidasi Google/Phone nyata. Denial, fix tidak akurat, luar kota, bootstrap lokasi gagal dan resume foreground tidak membuka discovery tanpa fix valid. Tiles diblokir tetap memiliki daftar. AccountGate/LocationGate menjaga akses yang sesuai; akun lama tetap memiliki riwayat/Akun/bantuan saat discovery tertahan.

`scripts/test-db.mjs`: tanpa sesi, gateway salah, akses tabel privat/anon ditolak, nomor tidak tersedia sebelum consent, aktor ketiga/pengirim tidak bisa menerima, grant kedaluwarsa atau nomor berubah, presence expiry, input tidak sah, request berulang dan dua koneksi bersamaan, kesepakatan ganda, peran penyelesaian/penerimaan tunai, blokir/pencabutan, unblock milik aktor untuk target tertentu, pembatasan setelah permintaan penghapusan. **Jangan memakai database produksi**; schema uji dihapus pada awal.

## Bukti visual browser historis sebelum Ceria

Manifest `.impeccable/review/browser-evidence.json`: 41 capture settled, errors[], fokus solid 2 px. Review `.impeccable/review/finish-review-redesign.md` tetap **FIX**: tidak ada defect visual tambahan di capture yang diperiksa, tetapi ilustrasi aktivitas belum lengkap dan dokumentasi perlu disinkronkan; native/live/dependensi tetap terbuka. Capture 504 px hanya lebar representatif, bukan viewport pengguna yang diketahui. Semua akun/ulasan/riwayat sintetis; batas Pekanbaru/tiles OSM geografis aktual. **Bukan screenshot native**.

## Belum terverifikasi / menahan rilis

- Android SDK/emulator/adb tidak tersedia. APK/AAB, System Back, gesture, safe area, keyboard perangkat, TalkBack, fontScale, permission denial, background/foreground, cold-start OAuth, SecureStore dan performa/baterai belum diuji. Bundle Hermes tidak menggantikan pemeriksaan ini.
- Google dan Phone belum aktif saat inspeksi Supabase. OAuth eksternal/PKCE nyata, expiry/revokasi sesi, SMS/verifikasi nomor dan WhatsApp nyata belum diuji.
- SQL memakai shim lokal. RLS/grant/RPC pada Supabase staging, Auth, PostgREST, proxy header, jaringan Cloudflare dan limiter terdistribusi belum diuji end-to-end.
- Direktori area nyata dan Maps Android key belum ada. Peta native/atribusi/marker padat/tiles gagal belum diuji. Web Leaflet/OSM beratribusi telah diperiksa, termasuk kegagalan tile dengan daftar alternatif; tidak memverifikasi map Android. Akun pada area sama dikelompokkan melalui sheet; perilaku native tetap belum diuji.
- Jaringan putus sesudah commit, expiry selama form terbuka, jadwal lintas zona, penautan/perubahan nomor dan persaingan blokir/consent membutuhkan uji staging/perangkat tambahan. Mutasi tidak otomatis dicoba ulang.
- Penanganan laporan operator, retensi/penghapusan tuntas, kebijakan privasi/ketentuan, kontak bantuan, URL penghapusan publik, signing dan persyaratan Play belum selesai. Blokir tersedia; daftar akun diblokir/unblock UI belum tersedia.
- Endpoint Supabase Auth/SMS langsung tidak otomatis dilindungi Worker. WAF domain dan Turnstile belum diterapkan. Konfigurasi `workers.dev` disiapkan, belum deployment.

Konfigurasi staging: [docs/SERVICES.md](docs/SERVICES.md). Ancaman/kontrol aktual: [SECURITY.md](SECURITY.md). Hasil tes tidak menjamin keamanan menyeluruh atau kemudahan pemakaian bagi pengguna nyata.

## Batas tambahan redesign

Pada slice sebelum Ceria, delapan cover aktivitas Stage A belum dibuat; ActivityMedia memakai manifest raster kosong dan fallback pictogram resmi. Ceria kini menggantinya dengan objek layanan SVG multicolor, sesuai arah baru pengguna. Tidak ada foto orang nyata; synthetic-photo.jpg hanya fixture bidang warna dengan EXIF sintetis, bukan aset publik. Tes awal localhost EPERM adalah batas sandbox; suite lokal berizin kemudian lulus, bukan kegagalan produk. Locator katalog ambigu diperbaiki dengan scope katalog terlihat sebelum suite final.

Photo moderation manual, retensi, cleanup queue dan orphan sweep operasional belum siap. CI setup-deno@v2/prepare/test disiapkan, belum berjalan remote. Konfigurasi Expo memblokir kamera/audio/kontak/background; foreground location aktif, tanpa foreground service, mapsConfigured=false. Dependency manifest memuat read/write external storage maxSDK32; ini belum verifikasi manifest APK.

Audit online terkini menggantikan angka lama 3 moderate: 41 high/2 moderate melalui toolchain glob/build; picomatch terbaru diperiksa 4.0.7, 4.0.8 E404. Tidak ada import langsung picomatch/minimatch di app/gateway; reachability runtime belum dibuktikan. Rilis tetap tertahan untuk review/remediasi kompatibel, tanpa force downgrade Expo.
