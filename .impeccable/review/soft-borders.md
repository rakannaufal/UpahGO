# Aset layanan dan border lembut v2.3

18 November 2026. Refinement Ceria Operate, ENERGY 3 / RHYTHM 2 / MOTION 2. Impeccable primary, antislop during dari preferensi global, ponytail full. Arahan terbaru pengguna dan screenshot Gojek menggantikan ketebalan border v2.2. Bukan redesign identitas.

Empat pintasan memakai aset gambar lama berwarna 36 dp. Ikon antarmuka tetap hijau 24 dp. Batas pengelompokan kartu/panel/menu/pengalih 1 dp `#E3E7E4`; pemisah `#E8ECE9`. Tombol Pekanbaru/lokasi-radius memakai bingkai yang sama, label 14 sp dan padding ringkas. Input/search/aksi sekunder 1 dp dengan outline kontrol existing. Fokus 2 dp dan glyph radio/checkbox tetap untuk aksesibilitas. Avatar, pin dan ilustrasi peran tidak diubah.

Semua perubahan pada renderer aset, tokens, shared BrowseTools dan komponen existing; tidak menambah dependency, otoritas client, layanan, identitas atau konten produksi. Tidak melakukan commit, deployment, migrasi remote atau publikasi.

## Bukti dan batas

- Typecheck/lint lulus. Export web dan Hermes 4,5 MB lulus; bukan APK/AAB.
- Run penuh browser: 15/17 lulus. Fixture GPS berhenti sebelum masuk karena OAuth sintetis dibatalkan; tes UI membaca border ripple dalam, bukan Surface Paper. Sesudah locator dipindahkan, dua skenario tersebut lulus dalam 28,6 detik. Assertion ketebalan/warna tidak dikurangi; OAuth/GPS tidak diubah. Total 17 skenario lulus lintas dua run. Penyebab pembatalan sementara belum dibuktikan.
- Dua peran pada 320/412/840/1440: gambar layanan 36 px, border 1 px pada shortcut/lokasi/pengalih, ikon 24 px hijau, semua tab terjangkau, Akun via Enter, menu legal/Kembali dan logout. pageErrors kosong.
- Satu batch visual: `soft-borders/inspection-main.jpg` dan `inspection-other.jpg`, dari Chrome aplikasi final. Beranda, Aktivitas, Notifikasi, Akun atas/bawah, profil, form, bantuan dan compact/expanded. Tidak ditemukan defect layout tambahan; tanpa batch perbaikan visual. `soft-borders/preview.png` menampilkan empat halaman final.
- 31 pasangan kontras teks/ikon/outline kontrol lulus. Border kartu dekoratif sengaja halus mengikuti referensi; bukan indikator status atau satu-satunya penanda kontrol. Label dan chevron kontras tetap mengidentifikasi target, input mempertahankan outline yang memenuhi 3:1.
- Unit/domain, DB, Edge, Worker dan audit dependensi tidak diulang karena hanya styling. Android runtime, TalkBack, fontScale, System Back, IME/insets, OAuth/SMS/Maps nyata UNVERIFIED; penerimaan rilis native tetap tertahan.

## Delivery Gate

PASS di bawah dibatasi pada slice source dan Chrome sintetis yang diuji; bukan jaminan native/live.

### 1. Hard Gate

| Item | Status dan bukti |
| --- | --- |
| R-02 copy | PASS: copy produk dipertahankan, tidak menambah em dash. |
| R-03 layout | PASS web: overflow dan lima tab diuji pada empat lebar/dua peran; gambar dan label lokasi 320 diperiksa. |
| R-17 angka | PASS: tidak menambah statistik; data demo existing berlabel sintetis. |
| R-18 ulasan | PASS: tidak membuat testimonial atau foto manusia. |
| R-23 aset | PASS: pengguna meminta pengembalian aset lama; reuse services.json, tanpa identitas baru. |
| R-24 navigasi | PASS: lima tab, Akun dari Notifikasi/Enter, legal/Kembali dan logout diuji ulang. |
| R-25 kontras | PASS untuk teks/ikon/kontrol: 31 pasangan token lulus; border kartu dekoratif tidak dipakai sebagai indikator akses/status. |
| R-26 fungsi | PASS web: filter layanan, lokasi/radius, pengalih, search/reset, menu dan alur existing lulus lintas dua run. |
| R-27 state | PASS source/runtime relevan: loading/empty/error/retry tetap; suite recovery auth/GPS/tile lulus termasuk rerun GPS. |
| R-28 FAQ | PASS: tidak menambah FAQ generik. |
| R-32 keyboard | PASS web: suite keyboard/reduced-motion serta Akun Enter dua peran/empat lebar lulus; focus ring 2 dp tetap. |
| R-33 source | PASS: source diedit langsung dengan patch; Python hanya mengolah screenshot bukti. |
| R-34 tema | PASS: satu tema terang, tidak ada toggle baru. |
| R-35 dijalankan | PASS web: export, 17 skenario lintas dua run dan screenshot aplikasi final; native runtime UNVERIFIED. |
| R-36 klaim | PASS: tidak menambah klaim produksi, keamanan atau performa. |
| R-37 arah | PASS: koreksi eksplisit pengguna dan contoh Gojek diterapkan; DESIGN.md v2.3 otoritatif. |
| R-38 konten | PASS: konten/fixture existing, tidak menambah nama/angka/fitur palsu. |

### 2. Purpose-Gate

| Item | Status dan alasan |
| --- | --- |
| R-01 gradient/glow | PASS: tidak ditambahkan. |
| R-04 ikon | PASS: ikon kontrol satu keluarga hijau, gambar layanan menjelaskan sapu/pel/dapur/kardus sesuai permintaan. |
| R-06 tipe | PASS: sans platform untuk Android; label lokasi 14 sp agar radius tidak hilang pada compact. |
| R-07 pola | PASS: tidak menambah latar grid/dot; peta existing menyajikan geografi. |
| R-08 panah | PASS: chevron existing untuk disclosure/menu; tidak menambah panah dekoratif. |
| R-09 badge | PASS: status/tag existing tetap menyatakan keadaan atau tugas. |
| R-10 glass | PASS: tidak digunakan. |
| R-12 shadow | PASS: tidak menambah shadow besar; batas halus dan whitespace mengelompokkan konten. |
| R-13 glow | PASS: tidak digunakan. |
| R-14 seragam | PASS: slot layanan sama agar mudah dibandingkan; tinggi kartu tetap mengikuti konten/status. |
| R-19 motion | PASS: tidak menambah gerak; ripple/reduced-motion existing dipertahankan dan suite lulus. |
| R-22 ilustrasi | PASS: reuse alat layanan dan ilustrasi peran relevan, tanpa gambar generik baru. |

### 3. Liveliness

| Item | Status dan bukti |
| --- | --- |
| Dials | PASS: ENERGY 3 / RHYTHM 2 / MOTION 2 tetap di DESIGN.md. |
| Konsistensi | PASS: gambar layanan berwarna kembali, daftar/uang tenang; inspection-main.jpg dan inspection-other.jpg. |
| Fokus | PASS: layanan/profil pada Beranda, status pada Aktivitas, kabar pada Notifikasi, menu pada Akun. |
| Whitespace | PASS: struktur sela/padding existing tidak diubah; garis halus tidak menambah keramaian. |
| Aksen | PASS: hijau aksi/ikon, gambar layanan lokal berwarna sesuai brief. |
| Motif | PASS: objek kerja harian, bentuk lembut, avatar mint/peach, logo asli tetap. |
| Design Read | PASS: refinement incumbent dan koreksi terbaru ditetapkan sebelum edit. |

### 4. Craftsmanship dan Quality Locks

| Item | Status dan bukti |
| --- | --- |
| C-1 intentionality | PASS: aset lama/36 dp, bingkai lokasi dan border tipis menjawab tiga koreksi langsung pengguna. |
| C-2 fungsi | PASS web: tidak menambah kontrol baru; route/filter/form existing tetap lulus. |
| C-3 komposisi | PASS: tidak menambah section pengisi atau mengubah arsitektur halaman. |
| C-4 resilience | PASS pada Chrome teruji: dua peran, compact/rail, keyboard, recovery; native/live UNVERIFIED. |
| C-5 bukti | PASS: hasil tes dan kegagalan sementara dicatat sesuai kenyataan; demo tidak diklaim layanan nyata. |
| R-05 template | PASS: mempertahankan penemuan pekerja, kontak, pekerjaan dan pengaturan. |
| R-11 radius | PASS: control14/button16/card20/avatar bulat tetap, bukan seluruh elemen pill. |
| R-15 CTA | PASS: label kontrol existing menyatakan aksi/tujuan. |
| R-16 buzzword | PASS: tidak menambah copy pemasaran AI. |
| R-20 kekhususan | PASS: gambar alat rumah tangga, dua peran, harga per sesi, consent dan COD tetap milik Upahgo. |
| R-21 tema | PASS: terang sesuai brief. |
| R-29 palet | PASS: satu sumber tokens; hanya warna border/separator existing dilembutkan. |
| R-30 identitas | PASS: mengikuti kelembutan batas referensi, tidak menyalin logo/aset Gojek. |
| R-31 alasan | PASS: nilai dan tujuan ditulis di DESIGN.md; kontrol penting tetap memiliki kontras/fokus. |
