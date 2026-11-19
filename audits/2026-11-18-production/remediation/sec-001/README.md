# SEC-001: disposition dan remediasi dependensi

19 November 2026. Baseline `1d6ec27` (OPS-001), branch `codex/fix-sec-001`. Cakupan: advisory npm pada toolchain, pemanggil glob, lockfile, regresi kompatibilitas dan CI. Tidak mengubah aplikasi, skema, Expo SDK atau React Native. Tidak ada deployment, layanan berbayar atau data pengguna yang diproses.

## Disposition advisory

| Advisory                                                                            | Bukti terkini                                                                                                                                              | Disposition                                                                                                                                                    |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), picomatch | GitHub API mencatat withdrawn pada `2026-11-18T15:38:56Z`; npm tidak lagi melaporkannya. Registry latest tetap 4.0.7, tanpa patched release pada advisory. | Ditarik upstream, **bukan diperbaiki oleh perubahan proyek**. Pola extglob mahal tetap dapat direproduksi; jangan menerima pola tak tepercaya di proses utama. |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), minimatch | Aktif, moderate; rentang 7–<11.0.1. Sebelum perubahan: minimatch 10.2.6 lewat Expo fingerprint, tiga entri npm termasuk dua parent transitif.              | Diganti 11.0.9 hanya pada `@expo/fingerprint@0.21.10`; tidak ada pengecualian atau advisory yang disembunyikan.                                                |

[Metadata advisory resmi](evidence/advisories.json), [audit sebelum](evidence/audit-before.json), [audit sesudah](evidence/audit-after.json). Audit sebelum remediasi sudah **0 high/3 moderate**, berbeda dari snapshot audit awal 41 high/2 moderate karena status advisory berubah. Sesudah remediasi: **0 temuan seluruh severity**, pada waktu pemeriksaan ini. Angka parent transitif bukan jumlah cacat independen. Laporan audit 18 November tetap historis, tidak ditulis ulang.

Tidak menyimpulkan semua pola picomatch aman dari status withdrawn. [Diskusi maintainer](https://github.com/micromatch/picomatch/pull/235) menekankan batas pola dari pihak tak tepercaya; proyek mempertahankan batas tersebut. Tidak memasang fork/PR yang belum dirilis.

## Pemanggil, input dan batas kepercayaan

`npm ls`/`npm explain` menelusuri minimatch10 ke Expo 58.0.25, lalu fingerprint 0.21.10 dan `build/utils/Path.js`. Ignore berasal dari default, `.fingerprintignore`, opsi CLI atau konfigurasi source. `Options.js` memanggil matcher dengan `{dot:true}`; optimizationLevel default 1, sedangkan advisory mensyaratkan ≥2. Tidak ditemukan route aplikasi yang menerima pola glob. Ini mengurangi exposure sebelum patch, tetapi bukan alasan mempertahankan paket rentan bila perbaikan dapat diverifikasi.

Picomatch 4 dipakai Expo CLI/Metro config dan tinyglobby/fdir React Native; picomatch 2 melalui Metro file map/micromatch dan Jest worker/util. Pola berasal dari developer/config source build. Source aplikasi/gateway/Edge tidak mengimpor picomatch/minimatch/micromatch. [Jalur dan pencarian source](evidence/reachability.json), [tree sebelum](evidence/dependency-tree-before.json), [minimatch explain](evidence/minimatch-paths.json).

Inventaris **source map export produksi** tidak menemukan picomatch, minimatch, micromatch atau fingerprint: web 29 map/1.147 source unik, Android 1 map/1.581 source unik. Positive control menemukan 201 source React Native/web dan 461 source React Native Android. [Bukti](evidence/bundle-reachability.json). Source map dibuat dengan environment sintetis di direktori lokal sementara, tidak dipublikasikan atau dimasukkan Git. Ini membuktikan graph JavaScript pada dua export yang diuji, bukan APK, seluruh native library atau semua versi masa depan.

Threat assessment: aktor aplikasi mengendalikan data profil/tugas, bukan konfigurasi glob tooling. Kontributor source dapat mengubah konfigurasi dan kode build; CI tetap input tak tepercaya. Workflow memakai push/pull_request biasa, token contents read, tanpa pull_request_target atau deployment/secret produksi, serta timeout job 30 menit. Pertahankan tanpa secrets pada PR tak tepercaya, runner disposable dan pembatas komputasi. Jangan mengekspos Metro/CLI sebagai layanan publik, menyalurkan pola pengguna ke matcher, atau memasukkan pola dari data remote ke config. Jika fitur semacam itu ditambahkan, wajib isolasi CPU/memori/waktu dan tinjauan baru; panjang pola saja tidak menjamin kompleksitas aman.

## Perubahan minimum

Root `overrides` dibatasi pada `@expo/fingerprint@0.21.10` untuk minimatch 11.0.9. Registry fingerprint terbaru masih 0.21.10 dengan rentang ^10.2.6; patch Expo 58.0.26 tetap memakai dependency itu, sehingga mengganti Expo saja tidak menutup advisory. Kandidat 11.0.9 menyediakan CommonJS/ESM, mendukung Node 20 atau ≥22, lisensi BlueOak-1.0.0 seperti versi 10; dependency dan metadata lifecycle ditinjau. [Metadata](evidence/minimatch-candidate.json). Install scripts dinonaktifkan. Paket 11 ini sebelumnya sudah ada melalui parser TypeScript ESLint; npm mendeduplikasinya, bukan menambah dependency aplikasi langsung.

Lockfile hanya mengganti minimatch 10.2.6 menjadi 11.0.9, menghapus salinan 11 duplikat dan menyesuaikan penanda dev transitif. Expo 58.0.25, RN 0.88.1 dan seluruh versi paket lain tetap. Override melintasi rentang major upstream, sehingga kompatibilitas tidak diasumsikan: API pencocokan nyata, hash fingerprint dan export diperiksa. Override exact-parent sengaja tidak berlaku diam-diam untuk versi fingerprint baru. Hapus override setelah upstream memilih versi patched, lalu re-resolve dan ulangi pemeriksaan.

`npm install --package-lock-only` awal tidak me-resolve ulang entri terkunci; `npm update minimatch --package-lock-only --ignore-scripts --no-audit --no-fund` menerapkan perubahan terarah. `npm ci --ignore-scripts` berikutnya sukses, `npm ls` tanpa invalid dependency. Tidak memakai audit fix, force downgrade, patch node_modules atau penggantian package manager.

CI menjalankan `npm run audit:dependencies` sesudah clean install, gagal mulai severity moderate. Tidak memakai omit dev, allowlist advisory, continue-on-error atau pengabaian registry gagal. Audit perlu akses registry publik; kegagalan akses menahan pipeline. Temuan baru tetap memerlukan reachability review, bukan auto audit fix. Timeout job membatasi build/PR bermasalah; tidak membuat kode PR menjadi tepercaya.

## Probe dan regresi

`scripts/probe-glob-security.mjs` hanya memakai pola sintetis tetap pada child process: heap 128 MiB, deadline 1.500 ms, output ≤16 KiB. Tidak memanggil service. Minimatch diuji dengan segmen berbeda `xN/**/..` lalu `/z`; picomatch dengan `+(*a)` terhadap 30 huruf a dan tanda seru. Timeout proses bukan bukti endpoint publik dapat dieksploitasi.

Baseline 14 segmen menghasilkan 8.192 globParts pada level 2 dalam sekitar 1,25 detik; level 1 hanya 1. Untuk pembanding 16 segmen, tarball 10.2.6 resmi diverifikasi terhadap SHA-512 lockfile baseline dan dieksekusi dari direktori sementara, **bukan dipasang kembali ke aplikasi**: melewati deadline 1.500 ms dan dihentikan. Versi 11.0.9 dengan 16 segmen menolak ekspansi secara eksplisit (`RangeError`, dicatat sebagai GLOB_EXPANSION_LIMIT), sekitar 264 ms pada run yang disimpan. [Baseline 14](evidence/probe-before.json), [baseline 16](evidence/probe-baseline-amplification.json), [sesudah](evidence/probe-after.json). Durasi ini satu sampel lokal, bukan jaminan performa.

Picomatch 2.3.2 dan 4.0.7 tetap melewati deadline yang sama. Perilaku itu sengaja dicatat sebagai batas pola tak tepercaya, bukan diubah menjadi PASS keamanan atau diklaim fixed. Tidak ada input publik menuju matcher yang ditemukan dalam source/graph yang diperiksa.

Tiga regresi baru: ignore/negation/path native melalui helper fingerprint asli; penolakan amplifikasi dengan batas proses; `createFingerprintAsync` pada fixture Android sintetis memastikan output build yang diabaikan tidak mengubah hash, sedangkan perubahan source native mengubahnya. Fixture melengkapi marker Gradle/AndroidManifest agar jalur generic native benar-benar diuji, bukan diabaikan sebagai managed/CNG. Tidak memerlukan Gradle, SDK atau emulator.

## Verifikasi

Node 22.23.3, npm 10.9.9, macOS. Hasil final:

| Pemeriksaan                        | Hasil / bukti                                                                                                                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clean install                      | Lulus, 867 paket; [clean-install.txt](evidence/clean-install.txt)                                                                                                                            |
| Audit online dan gate CI           | 0 kerentanan; [audit-after.json](evidence/audit-after.json), [audit-gate.txt](evidence/audit-gate.txt)                                                                                       |
| `npm test`                         | 59/59 lulus, termasuk 3 regresi dependency; [unit.txt](evidence/unit.txt)                                                                                                                    |
| Typecheck / lint                   | Lulus; [typecheck.txt](evidence/typecheck.txt), [lint.txt](evidence/lint.txt)                                                                                                                |
| Export web / Android Hermes        | Lulus; [build-web.txt](evidence/build-web.txt), [build-android.txt](evidence/build-android.txt)                                                                                              |
| Source-map web / Android inventory | Tidak memuat empat paket tooling yang diperiksa; [bundle-reachability.json](evidence/bundle-reachability.json)                                                                               |
| Worker dry-run / runtime lokal     | Lulus, 4 skenario runtime; [worker.txt](evidence/worker.txt), [runtime.txt](evidence/runtime.txt)                                                                                            |
| Browser                            | 21/21 lulus pada Chrome macOS, satu run penuh; [browser.txt](evidence/browser.txt)                                                                                                           |
| Secret/format/diff                 | Scanner 117 file tanpa pola credential; format/diff dan scan tambahan file perubahan lulus. [secrets.txt](evidence/secrets.txt), [hygiene.txt](evidence/hygiene.txt). Bukan scan menyeluruh. |

Build memakai public env sintetis, dotenv nonaktif. Preview existing localhost dipertahankan, HTML dibandingkan persis dengan export baru: [preview-build.txt](evidence/preview-build.txt). Percobaan awal CI=true menolak port yang telah dipakai; suite final memakai reuseExistingServer sesuai konfigurasi repo, tanpa menghentikan proses pengguna. Source-map build tambahan web memakai direktori sementara. Log teks pada direktori bukti ini dinormalisasi dengan menghapus ANSI dan whitespace akhir baris; isi hasil pemeriksaan dipertahankan.

Warning existing: Metro Leaflet CSS local-resource dan warna terminal tidak menggagalkan export; clean install memperingatkan ESLint 9.39.5 sudah unsupported. Advisory aktif untuk ESLint tidak ditemukan pada audit ini, tetapi status maintenance tetap perlu upgrade tooling terkoordinasi Expo. Tidak mengubah major ESLint dalam remediasi minimatch ini.

DB, Deno Edge, perangkat Android/Gradle/APK, TalkBack dan Supabase/Cloudflare nyata tidak diulang: SQL/Deno lock/runtime aplikasi tidak berubah. Export Hermes tidak membuktikan aplikasi terpasang. CI GitHub/proteksi branch belum diterima. Tidak ada deployment atau acceptance cloud/native yang diklaim lulus.

## Focused review dan keputusan

Ponytail-review memeriksa diff lockfile, scope override, caller Path/Options fingerprint, pengaruh CommonJS/Node, input build, workflow/token dan output bundle. Penghapusan duplikat tidak menghapus dependency yang masih diperlukan; seluruh versi lain tetap. Tes memeriksa hasil nyata, bukan hanya angka versi. Tidak ditemukan blocker source dari perubahan ini dalam cakupan tersebut. UI tidak diubah: Delivery Gate visual antislop N/A, bukan PASS visual baru.

SEC-001 tersedia untuk penutupan **pada cakupan advisory/source yang diuji**, setelah bukti final diterima reviewer. Tidak meminta penerimaan diam-diam atas high yang masih aktif: high lama ditarik upstream, moderate ditambal, tidak ada exception scanner. Audit 0 bukan jaminan semua risiko supply chain atau aplikasi hilang. Rilis keseluruhan tetap **NO-GO** karena penerimaan native/staging, operasi, privasi/legal dan temuan audit lain masih terbuka.

Langkah berikut yang disarankan: QA-001, menyiapkan dan menjalankan matriks Android serta integrasi staging berizin. Publikasi build/deployment dan perubahan data produksi tetap di luar pekerjaan ini.

## Pemeriksaan ulang setelah QA-001

Pengguna meminta SEC-001 dilanjutkan sesudah paket QA. [Pemeriksaan ulang source `9eb1570`](recheck-qa001/README.md): audit online tetap 0, override masih dibutuhkan upstream, probe minimatch lulus, picomatch tetap memiliki batas pola tidak tepercaya, dan graph bundle APK QA tidak memuat paket tooling yang diperiksa. CI QA final source `d38c4c8` sukses: audit 0, 61 unit dan 63 browser lulus, beserta gate SQL/Edge/Worker/export. Tidak ada dependency/source runtime diubah; penerimaan rilis keseluruhan tetap terpisah.
