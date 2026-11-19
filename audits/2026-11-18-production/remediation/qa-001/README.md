# QA-001: penerimaan Android dan staging

Pembaruan 19 November: staging Worker/Supabase/Edge sudah diterapkan; 55 assertion nyata lulus. APK QA staging terpisah berhasil dibangun; belum dijalankan pada perangkat. [Bukti, APK dan batas](staging/live/README.md), [tindakan Google](../../../../docs/GOOGLE-STAGING.md). Riwayat build/CI di bawah tetap historis.

19 November 2026. Baseline `9d40db1` (SEC-001), branch `codex/qa-001`. **QA-001 belum ditutup; rilis produksi tetap NO-GO.** Pengguna memberikan URL Supabase, menyatakan memiliki Android fisik, menyetujui instalasi SDK/lisensi Google, lalu memilih menguji APK sendiri. Worker staging dan tiga akun sintetis belum tersedia. Tidak ada deployment, migrasi remote, aktivasi provider, SMS, pembuatan akun cloud atau perubahan data pengguna.

Tindak lanjut: pengguna mengonfirmasi Supabase khusus pengujian dan APK fisik belum diuji. [Persiapan staging terpisah](staging/README.md) tersedia pada `codex/staging-qa-001`; login Wrangler dan akses profil Supabase ke target terverifikasi. CI staging pertama62/63 browser; setelah sinkronisasi foreground diperbaiki, run [44528145983](https://github.com/rakannaufal/UpahGO/actions/runs/44528145983), source `b47d79c`, sukses:63 unit,280 SQL,1 Edge,4 Worker,63 browser, audit npm0 dan kedua dry-run. MCP Cloudflare berhasil OAuth Minimal; pemakaian tool runtime belum diuji. Tidak ada deployment/migrasi remote. Bukti di bawah tetap mencatat run/source historis masing-masing.

## Perubahan source

- Playwright menjalankan Chromium, Firefox dan WebKit. CI memasang ketiga runtime; tidak menambah retry atau pengecualian browser.
- Variant `UPAHGO_APP_VARIANT=qa` memisahkan nama, package dan callback native dari produksi. `id.upahgo.app.qa` / `upahgo-qa://auth/callback`; default produksi tetap. Nilai variant salah ditolak, scheme native dibatasi pada dua identitas tersebut.
- Dua regresi identitas native memeriksa scheme/package/default dan penolakan input tak dikenal. Tidak mengubah PKCE, penyimpanan SecureStore, izin server atau harga/consent/COD.
- Tes harga menarget elemen nominal dengan nilai tepat, menerima whitespace lokal yang berbeda. Fixture WebKit mengoreksi unit timestamp override driver; validasi lokasi aplikasi tetap. Fix enam menit lalu harus ditolak tanpa request ke server.
- [Runbook/matriks penerimaan](../../../../docs/QA-ACCEPTANCE.md) berisi A01–A11 dan S01–S08, build sintetis, kriteria bukti dan batas operasi remote.

Threat assessment: package/callback QA harus tidak mengambil alih instalasi/sesi produksi. Scheme berasal dari konfigurasi build tepercaya dan allowlist, bukan input pengguna; PKCE dan pemeriksaan target callback tetap berlaku. Public env bukan secret. APK sintetis tidak membawa akun, service key atau Maps key. Penandatanganan debug hanya untuk pengujian; tidak menerima APK tersebut sebagai artefak produksi. Perilaku cold start/session expiry/SecureStore pada perangkat belum dibuktikan oleh unit test ini.

## Bukti yang tersedia

| Pemeriksaan    | Hasil / batas                                                                                                                                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit           | 61/61 lulus, termasuk dua regresi identitas QA; [unit.txt](evidence/unit.txt)                                                                                                                                                                                                 |
| Typecheck/lint | Lulus; [typecheck.txt](evidence/typecheck.txt), [lint.txt](evidence/lint.txt)                                                                                                                                                                                                 |
| Export web     | Lulus, env sintetis/dotenv nonaktif; [build-web.txt](evidence/build-web.txt)                                                                                                                                                                                                  |
| Browser macOS  | Run final Chrome/WebKit **42/42 lulus** dalam 8,5 menit; [hasil](evidence/browser-final-macos.txt). Firefox berhenti sebelum halaman dimuat: `Could not find profile folder`; lihat uraian di bawah                                                                           |
| Android source | Prebuild dan manifest APK merge diperiksa: package/scheme, singleTask, keyboard resize, larangan kamera/audio/kontak/background location; resource backup terhubung mengecualikan SecureStore. [Source](evidence/native-prebuild.json), [APK](evidence/apk-verification.json) |
| SDK lokal      | CLI resmi ARM64 diverifikasi checksum metadata Google; platform 37.0, Build Tools 37.0.0, NDK 27.1.12297006, CMake 3.22.1, adb dipasang pada `.cache`. [sdk-download.json](evidence/sdk-download.json), [sdk-install.txt](evidence/sdk-install.txt)                           |
| APK            | Release arm64 QA berhasil, 33,65 MiB, signature v2/debug terverifikasi; [build](evidence/build-apk.txt), [manifest/ABI/backup/hash](evidence/apk-verification.json). Belum diinstal/dijalankan pada perangkat                                                                 |
| Perangkat      | adb tidak menemukan perangkat terhubung. Pengguna memilih uji sendiri; [adb-devices.json](evidence/adb-devices.json), serial tidak dicatat                                                                                                                                    |
| CI baseline    | SEC-001 `9d40db1` sukses; [metadata](evidence/baseline-github-ci.json). Ini belum bukti workflow QA yang berubah                                                                                                                                                              |
| Supabase       | Settings dan probe anonim tanpa sesi/data pribadi; [supabase-readonly.json](evidence/supabase-readonly.json)                                                                                                                                                                  |

## Artefak Android dan batas

APK lokal: `.cache/qa/upahgo-qa-0.1.0-arm64.apk`, **35.282.721 byte / 33,65 MiB**, SHA-256 `8952d412fbfff89fa03cddfa0bd431b416b76aec91600f7bd84cc5d9e6405957`. Android arm64/API24+, target36/compile37, label Upahgo QA dan package `id.upahgo.app.qa`. Gradle selesai dalam 21 menit 55 detik; 641 task. Bundle Hermes disertakan; tidak ada source map, env file atau signing material di APK. APK dan checksum tetap lokal/diabaikan Git.

Pemeriksaan APK membuktikan endpoint/key sintetis, ketiadaan nilai kredensial lokal yang diperiksa dan host Supabase pengguna. Tidak membawa Maps key. Signature v2 valid dengan **Android Debug**, bukan signing produksi; `debuggable=false` tidak mengubah status sertifikat tersebut. Restore nyata, cold start, keyboard, TalkBack, jaringan dan pemakaian baterai belum diuji. Manifest masih berisi `SYSTEM_ALERT_WINDOW`, permission boot/foreground service/biometrik dari template/library, serta storage legacy dibatasi API32; minimisasi manifest produksi dan perilaku OS tetap perlu review. Source flag location service nonaktif tidak berarti semua deklarasi service library hilang.

Instalasi SDK pertama mencoba package `platforms;android-37` yang tidak ada; platform kemudian dipasang dengan ID metadata resmi `platforms;android-37.0`. [Log koreksi](evidence/sdk-platform-install.txt), [prebuild QA](evidence/prebuild-qa.txt). Warning Gradle API deprecated dan `expo-system-ui` belum terpasang dicatat; light-style enforcement native belum diterima. Tidak mengganti toolchain mayor untuk menghilangkan warning.

Run unit bersamaan kompilasi native menghasilkan 60/61: probe matcher terisolasi melewati timeout 1,5 detik. [Run gagal](evidence/unit-concurrent-build.txt) disimpan. Sesudah build selesai, perintah `npm test` yang sama lulus 61/61 dalam 3,36 detik, tanpa mengubah assertion, timeout atau dependency. Kontensi resource diduga, belum dibuktikan lewat isolasi penyebab.

## Penelusuran kegagalan browser

Run awal 63 kasus: 35 lulus, 28 gagal. Chrome 21 lulus. Firefox macOS gagal pada 21 peluncuran sebelum aplikasi dijalankan. Profil sementara normal, path kanonis `/private/tmp`, profil persisten yang diverifikasi ada, serta runtime Firefox cache lama memberikan kegagalan yang sama. Tidak menonaktifkan sandbox browser, menurunkan versi dependency atau mengubah permission OS global untuk menyembunyikannya. Penerimaan Firefox memerlukan hasil runner yang berfungsi; konfigurasi CI Linux tetap menjalankan browser tersebut.

Tujuh kegagalan WebKit terdiri dari pencocokan rupiah yang mengasumsikan spasi dan timestamp GPS emulasi dalam mikrodetik. Probe dengan koordinat/akurasi sintetis yang sama menunjukkan Chrome memberi timestamp milidetik, WebKit sekitar 1.000 kali lipat; aplikasi benar menolaknya sebagai fix masa depan. Koreksi dibatasi pada fixture tes, tidak mengubah freshness check aplikasi atau jam perangkat. Regresi fix stale ditambahkan. Run targeted berikut lulus 7/8; kegagalan sisa berasal dari `textContent` kartu yang menyambung nominal dan rating tanpa spasi. Assertion diperbaiki ke elemen nominal tepat; tidak melonggarkan angka, consent atau status server. [Run awal](evidence/browser-first.txt), [targeted](evidence/webkit-targeted.txt).

## Firefox pada CI Linux dan perbaikan fixture

Run [44444494366](https://github.com/rakannaufal/UpahGO/actions/runs/44444494366), source `9eb1570`, berhasil melewati clean install, audit, typecheck/lint, 61 unit, Edge, SQL (280 assertion), export web/Hermes, Worker dry-run/runtime dan instalasi tiga browser. Suite browser **57/63 lulus, enam kegagalan Firefox**; [metadata](evidence/github-ci-first.json), [log browser](evidence/browser-ci-first.txt). Kegagalan asli tetap disimpan.

Lima kasus live sintetis tertahan oleh LOCATION_STALE. Source instrumentasi Firefox revision1572 yang sama dengan lockfile menunjukkan mock Juggler menambahkan satu hari ke timestamp agar override tidak kedaluwarsa. [Cuplikan dan hash arsip macOS](evidence/firefox-geolocation-source.json). Aplikasi menolak fix masa depan sesuai kontrak. Fixture menormalkan offset satu hari hanya untuk objek GeolocationPosition native Firefox dalam rentang mock yang diketahui; objek sintetis biasa, fix stale dan fix masa depan dua menit tetap diuji ditolak tanpa write server. Koreksi WebKit mikrodetik tetap spesifik engine. Tidak mengubah pembacaan lokasi aplikasi, validator atau server.

Kasus fokus memakai `.focus()` setelah onboarding melalui mouse, sehingga tidak menjamin modalitas keyboard untuk `:focus-visible` Firefox. Tes kini mencapai Akun melalui Tab nyata dengan batas50 langkah, memeriksa fokus dan outline solid2px, lalu Enter; assertion outline sesudah navigasi tetap. Tidak mengganti CSS untuk memaksa ring pada interaksi mouse. Setelah koreksi, empat regresi fokus/lokasi Chrome dan WebKit lulus dalam 23,4 detik; [hasil](evidence/browser-fixtures-local.txt). Penerimaan Firefox melalui CI berikutnya tetap harus dicatat terpisah dari run gagal di atas. Tidak ada source runtime aplikasi berubah; APK QA tetap memakai source/hash yang sama.

## Instalasi browser CI yang tertahan

Percobaan pertama run [44447385562](https://github.com/rakannaufal/UpahGO/actions/runs/44447385562), source `f36fb6f`, dibatalkan setelah langkah instalasi browser berjalan lebih dari 13 menit. Log berhenti pada unduhan dependency sistem dari mirror Ubuntu `us-east-2.ec2.archive.ubuntu.com`, sesudah `Get:130`; tidak ada hasil browser karena langkah tes belum dimulai. [Metadata per langkah](evidence/github-ci-install-cancelled.json), [cuplikan installer](evidence/browser-install-cancelled.txt). Penyebab jaringan/mirror belum dipastikan. Run diulang tanpa perubahan aplikasi, fixture, dependency atau konfigurasi CI; hasil percobaan kedua harus dinilai terpisah.

## Pratinjau foto pada Firefox CI

Percobaan kedua run `44447385562` melewati instalasi dan menghasilkan **62/63 lulus** dalam 8,9 menit. Seluruh kasus GPS/fokus yang sebelumnya gagal sudah lulus. Satu kasus foto demo Firefox tidak menampilkan preview; trace mencatat `Node.removeChild: The node to be removed is not a child of this node`. [Metadata](evidence/github-ci-photo-failure.json), [log](evidence/browser-ci-photo-failure.txt).

Source Juggler revision1572 menunjukkan picker yang dicegat sengaja dibatalkan segera. Expo membaca cancel sebagai pilihan kosong dan menghapus input; `setFiles` berikutnya memicu change pada input yang sudah dilepas. [Cuplikan source dan hash](evidence/firefox-file-picker-source.json). Adapter hanya pada kasus upload sintetis Firefox mengabaikan satu event cancel milik picker driver. Pemilihan file nyata melalui input, decode/resize/crop, consent, simpan dan hapus tetap diuji; assertion pageErrors kosong ditambahkan. Tidak mengubah kode aplikasi, dependency atau APK. Dua regresi foto Chrome/WebKit lokal lulus dalam 21,4 detik; [hasil](evidence/browser-photo-local.txt). Percobaan pertama lokal terhalang izin localhost sandbox sebelum tes berjalan; run berizin memakai preview existing. Penerimaan run penuh setelah koreksi dicatat terpisah.

## Pemeriksaan Supabase yang ditunjuk

Pada waktu probe, `/auth/v1/settings` HTTP200: **Google false, Phone false, Email true, anonymous false**. Tidak menyalakan provider atau mengirim email/SMS.

POST anonim `/rest/v1/rpc/upahgo_action` dengan `{p_operation:"bootstrap",p_args:{}}` menghasilkan HTTP404/PGRST202. Ini tidak membuktikan object authorization lulus atau migrasi pasti tidak ada: role anonim/schema cache dapat mempengaruhi discovery fungsi. Request awal salah menggunakan `op/args`; hasil itu tidak dipakai untuk menyimpulkan deployment, lalu probe dikoreksi. GET private schema `profiles?select=id&limit=0` menghasilkan HTTP406/PGRST106; tidak membaca row pengguna. Key publik dibatasi pada publishable/role anon, tidak menggunakan service role. Nilai key dan raw response tidak disimpan.

URL proyek yang tersedia belum membuktikan staging terpisah. Worker/accounts belum ada menurut pengguna. Auth Google/Phone, JWT lintas environment, PostgREST signed-in, object authorization, Storage bytes/expiry, Maps, runner PRIV/MEDIA, alarm, race/offline-after-commit dan 50 CCU tetap **belum diuji end-to-end**. Tidak ada kapasitas/RPO/RTO atau penerimaan live yang diklaim dari shim/404 ini.

## CI final pada source yang diperbaiki

Run [44451749849](https://github.com/rakannaufal/UpahGO/actions/runs/44451749849), percobaan pertama, source `d38c4c8565bc43cbee453d8a32e6f28ba1ab4448`, **sukses**. Suite browser penuh **63/63 lulus** dalam 8,8 menit: masing-masing 21 Chromium, Firefox dan WebKit. Kasus GPS stale/future, fokus keyboard dan foto Firefox termasuk dalam run tersebut. Tidak menambah retry, mengecualikan browser, melonggarkan assertion atau mengubah validasi aplikasi. [Metadata per langkah dan hash log](evidence/github-ci-final.json), [log browser](evidence/browser-ci-final.txt).

Clean install, audit npm 0 temuan, typecheck/lint, 61 unit tanpa skip, 280 assertion PostgreSQL disposable dengan shim Auth, 1 integrasi Deno Edge, export web/Hermes serta Worker dry-run/4 skenario runtime juga lulus. [Ringkasan log](evidence/checks-ci-final.txt). Ini verifikasi source dan fixture sintetis; tidak membuktikan Google/Phone, PostgREST/Storage, alarm, kapasitas, pemulihan atau Android nyata. APK tidak dibangun ulang karena source aplikasi/native dan lockfile tetap sama; perubahan sesudah build hanya tes, dokumentasi dan bukti.

Source pada CI di atas menjadi referensi penerimaan teknis. Commit lanjutan yang mencatat hasil ini hanya mengubah dokumentasi/bukti. Riwayat CI gagal dan instalasi yang dibatalkan tetap disimpan; tidak dinyatakan lulus secara retroaktif. QA-001 tetap terbuka sampai penerimaan perangkat/staging yang berlaku terpenuhi.

## Keputusan

Focused review mencakup pembentukan callback, validasi target, pertukaran PKCE, konfigurasi package, caller, regresi identitas dan fixture browser. Tidak ditemukan defect baru pada source yang ditinjau. Identitas QA berasal dari konfigurasi build; tidak ada pelemahan pemeriksaan callback, validasi lokasi atau otorisasi server. Penerimaan perilaku terpasang tetap memerlukan perangkat, bukan kesimpulan review source.

APK/demo dan gate browser adalah langkah persiapan/pengujian, bukan penutupan otomatis QA-001. Hasil fisik tetap perlu model/OS/ABI/hash APK, kasus A yang dijalankan, hasil aktual dan bukti tanpa PII. S01–S08 bergantung lingkungan terisolasi, deployment/provider/fixtures yang disetujui, serta operator. Target awal 50 CCU, SLO99,5%, RPO1 jam/RTO4 jam masih target usulan pada audit/OPS, bukan hasil uji.

Tidak ada perubahan visual komponen atau identitas merek. Delivery Gate desain baru N/A; interaksi Android, TalkBack dan skala teks native tetap belum diverifikasi. APK/debug signing, CLI/cache dan source map tidak dimasukkan Git. Log bukti boleh dinormalisasi ANSI/whitespace tanpa mengubah hasil. Temuan privasi/legal/operasi dan seluruh gate lain tetap terbuka.
