# Konsistensi UI Ceria v2.2

18 November 2026. Scope: refinement antarmuka Android-first React Native + Expo, divalidasi lewat Chrome preview sintetis. Impeccable primary, antislop during dari preferensi global, ponytail full. Design Read tetap Ceria Operate, ENERGY 3 / RHYTHM 2 / MOTION 2; koreksi pengguna menjadi dasar ukuran, warna ikon dan border. Bukan penerimaan rilis native/live.

Border 2 dp menghindari pembulatan 1,5 menjadi 1 px pada web. Hijau 24 dp menyatukan ikon layanan, menu, detail, pencarian, rating, Aktivitas dan Notifikasi. Centang putih hanya pada bidang hijau untuk kontras. Tab aktif memakai varian SVG terisi, label tebal dan semantik selected; garis bawah dihapus. Akun eager mount mengurangi jeda mount awal, sementara peta tetap lazy. Pengalih Kontak/Pekerjaan maksimum 320 dp, target sentuh 48 px, label 14/20. Action minimum 48 dp. Artwork cover 48 dp, compact 32; hero 64. Avatar tonal tetap, ilustrasi peran dan logo asli tetap.

Tidak ada perubahan otoritas server, identitas, izin kontak atau uang. Tidak ada dependency/layanan baru. Tidak ada commit, deployment, migrasi remote atau publikasi.

## Bukti

- Typecheck/lint lulus, 30 unit lulus, export web dan Hermes 4,5 MB lulus. Bukan APK/AAB.
- `npm run check:secrets`: 87 source/config/doc tanpa pola credential tertanam; env/build/dependencies dikecualikan, bukan audit menyeluruh.
- Run browser penuh: 16 skenario existing lulus, regresi baru gagal pada langkah tes check filter yang sudah checked. Setelah click eksplisit, regresi baru lulus 1/1 dalam 25,9 detik. Semua 17 skenario lulus lintas dua run.
- Regresi baru mencakup kedua peran dan 320/412/840/1440: semua tab dapat diketuk, ikon selected terisi, ikon lain outline, ikon tampak hijau 24 px, border 2 px, target pengalih 48 px dan segmen ≤160 px. Akun dari Notifikasi juga dibuka lewat Enter; ketentuan/Kembali dan logout diuji. pageErrors kosong.
- 33 pasangan token lulus pada `design/contrast-report.json`. Border putih 3,36:1, canvas 3,10:1; ikon hijau putih 5,04:1, canvas 4,66:1.
- Satu batch inspeksi: `ui-consistency/inspection-mobile.jpg` dan `inspection-responsive.jpg`. Beranda, Kontak, Pekerjaan, Notifikasi, Akun atas/bawah 320/412/1440; tidak ditemukan defect visual penting. Capture baru dari regresi juga tersedia di folder yang sama. `preview.png` memakai empat screenshot aplikasi dari run penuh final.
- Pemeriksaan langsung browser in-app setelah reload: alur demo, Aktivitas, Notifikasi, Akun; Akun langsung menampilkan menu. Bukti ini hanya menunjukkan hasil inspeksi, bukan jaminan tidak ada keterlambatan pada perangkat lain.

## Delivery Gate

Status di bawah dibatasi pada source yang diubah dan Chrome sintetis. Android runtime, fontScale perangkat, TalkBack, System Back, IME/insets, OAuth/Phone/Maps live: **UNVERIFIED**. SDK/adb tidak tersedia. Batas ini menahan penerimaan rilis native.

### 1. Hard Gate

| Item | Status dan bukti |
| --- | --- |
| R-02 copy | PASS: copy produk existing dipertahankan; tidak menambah em dash atau slogan baru. |
| R-03 layout | PASS web: assertion overflow 320/412/840/1440 dua peran; lima tab berada dalam viewport. Capture compact/expanded diperiksa. |
| R-17 angka | PASS: tidak menambah statistik; angka orang/upah/riwayat tetap data sintetis berlabel. |
| R-18 ulasan | PASS: tidak menambah testimonial atau foto manusia. Bintang existing hanya menyatakan penilaian. |
| R-23 aset | PASS: perubahan warna/ukuran ikon dan varian nav terisi diminta eksplisit pengguna; reuse artwork/identitas existing. |
| R-24 navigasi | PASS: lima tab benar-benar terbuka; Akun dari Notifikasi diuji click/Enter; Ketentuan/Kembali juga diuji. |
| R-25 kontras | PASS token: 33 pasangan lulus; batas kartu ≥3:1 pada dua canvas yang dipakai; ikon hijau ≥4,66:1 pada putih/canvas. |
| R-26 fungsi | PASS web: pengalih, filter, kategori, search/reset, lima tab, menu akun, Kembali dan logout dicakup regresi baru serta suite Ceria/core. |
| R-27 state | PASS source/runtime relevan: useLoad/LoadState/Empty/error/retry dipertahankan; auth/bootstrap/GPS/tile recovery lulus pada suite penuh. Pending Action tetap mengunci pengiriman. |
| R-28 FAQ | PASS: tidak menambah FAQ. Bantuan existing berkaitan dengan lokasi, kontak, pekerjaan dan laporan. |
| R-32 keyboard | PASS web: Akun melalui fokus/Enter pada dua peran/empat lebar; suite core keyboard/reduced motion lulus. Focus ring existing tetap. |
| R-33 source | PASS: implementasi langsung lewat patch source; Python hanya menyusun gambar bukti, tidak menulis ulang source/CSS. |
| R-34 tema | PASS: satu tema terang; tidak menambah toggle atau inversi parsial. |
| R-35 dijalankan | PASS web: export final dan semua 17 skenario lulus lintas dua run, pageErrors kosong; click-through di bawah. Native UNVERIFIED. |
| R-36 klaim | PASS: tidak menambah klaim keamanan, kesiapan produksi, performa atau pembayaran. |
| R-37 arah | PASS: Ceria existing, arahan ukuran/warna/border pengguna; dials tetap, DESIGN.md v2.2 disinkronkan. |
| R-38 konten | PASS: tidak menambah nama, statistik, social proof atau tujuan navigasi fiktif; demo tetap berlabel. |

### 2. Purpose-Gate

| Item | Status dan alasan |
| --- | --- |
| R-01 gradient/glow | PASS: tidak digunakan. |
| R-04 ikon | PASS: alat untuk kategori, orang/koper untuk kontak/pekerjaan, bintang untuk rating; warna/ukuran tunggal menjawab koreksi pengguna. |
| R-06 tipe | PASS: sans platform existing untuk Android dan text scaling; label pengalih 14/20 membuat kontrol ringkas. |
| R-07 pola | PASS: tidak menambah grid/dot dekoratif; peta existing menyajikan lokasi geografis. |
| R-08 panah | PASS: chevron menyatakan detail/menu yang bisa dibuka; tidak ditambahkan pada seluruh CTA. |
| R-09 badge | PASS: hanya status dan tag faktual dari fixture/input; tidak menambah badge pemasaran. |
| R-10 glass | PASS: tidak digunakan. |
| R-12 shadow | PASS: border menentukan batas; tidak menambah shadow kartu. |
| R-13 glow | PASS: tidak digunakan. |
| R-14 ukuran | PASS: slot ikon sama agar scanning konsisten; konten kartu dan kelompok akun menentukan tinggi masing-masing. |
| R-19 motion | PASS: ripple existing untuk feedback, tanpa engine/gerak dekoratif baru; suite reduced-motion lulus. |
| R-22 ilustrasi | PASS: objek pekerjaan dan ilustrasi dua peran existing punya hubungan produk; ukurannya diperkecil, bukan menambah ilustrasi generik. |

### 3. Liveliness

| Item | Status dan bukti |
| --- | --- |
| Dials | PASS: ENERGY 3 / RHYTHM 2 / MOTION 2, DESIGN.md. |
| Konsistensi | PASS: ekspresi berada pada peran/hero/cover, daftar kontak dan uang tenang; screenshot mobile. |
| Fokus | PASS: layanan/profil pada Beranda, daftar/status pada Aktivitas, kabar pada Notifikasi, identitas/menu pada Akun. |
| Whitespace | PASS: padding kartu 16, sela isi 12/14, bagian 16+, label/subtitle dekat; layout inspected. |
| Aksen | PASS: hijau identitas/aksi dan ikon sesuai permintaan; teks utama tetap gelap netral. |
| Motif | PASS: bentuk lembut, objek rumah tangga, mint/peach avatar dan logo Upahgo tetap. |
| Design Read | PASS: arah incumbent dibaca sebelum edit, refinement tidak mengganti identitas. |

### 4. Craftsmanship dan Quality Locks

| Item | Status dan bukti |
| --- | --- |
| C-1 intentionality | PASS: border untuk batas, 24 dp untuk konsistensi, batas lebar pengalih untuk proporsi, filled untuk selected; semuanya berasal koreksi pengguna. |
| C-2 fungsi | PASS web: tidak menambah kontrol tanpa handler; regresi lima tab/menu/filter dan suite alur produk lulus. |
| C-3 komposisi | PASS: struktur halaman dan konten tugas tetap; tidak menambah bagian pengisi template. |
| C-4 resilience | PASS pada Chrome teruji: compact/rail, dua peran, keyboard, async/recovery existing. Native/live UNVERIFIED. |
| C-5 bukti | PASS: status build/test dan demo disebut sesuai cakupan; tidak ada klaim produksi. |
| R-05 template | PASS: mempertahankan daftar kontak/kerja, penemuan profil dan pengaturan; tidak menambah pola landing. |
| R-11 radius | PASS: control 14, button16, card20, avatar bulat; tidak menyamakan seluruh elemen menjadi pill. |
| R-15 CTA | PASS: Kontak/Pekerjaan, Edit profil, Hubungi, Tawar upah dan Keluar tetap menyebut tindakan/tujuan. |
| R-16 buzzword | PASS: tidak menambah buzzword pemasaran. |
| R-20 kekhususan | PASS: peran Buruh/Penyedia kerja, kategori rumah tangga, kontak berizin dan COD tetap inti produk. |
| R-21 tema | PASS: terang sesuai arahan pengguna. |
| R-29 palet | PASS: tokens.json satu otoritas, tidak menambah warna inti; ikon justru disatukan. |
| R-30 identitas | PASS: logo dan aset Upahgo dipertahankan; tidak menyalin aset/merek Gojek. |
| R-31 alasan | PASS: ukuran, warna, bentuk, nav dan border dijelaskan di DESIGN.md serta catatan perubahan di atas. |

## Click-through dan batas

Regresi baru: onboarding demo dua peran, semua tab empat lebar, Kontak/Pekerjaan, filter Riwayat, Notifikasi ke Akun, keyboard Enter, Ketentuan/Kembali, logout. Suite existing: search/filter/reset, profil/harga, peta/list/cluster, menu akun/bantuan/atribusi/legal/rating placeholder, kontak dua pihak, draft/form, pekerjaan/COD/rating, laporan/blokir/penghapusan serta recovery auth/GPS/tile. URL eksternal distub sesuai suite; tidak menguji layanan nyata.

DB/Edge/Worker tidak diubah atau diulang. Tidak menambah dependency; audit lama 43 advisory tetap terbuka. Native dan layanan live memerlukan perangkat/staging sebelum rilis.
