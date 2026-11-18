# Dua kartu per baris

18 November 2026. Koreksi pengguna mempertahankan dua kartu per baris di Beranda dan daftar Temukan, dengan gaya kartu terpilih. Impeccable Operate primary, antislop during dari preferensi global terverifikasi, ponytail full. Design Read existing: aplikasi kerja harian Indonesia, Ceria hangat, ENERGY 3 / RHYTHM 2 / MOTION 2.

## Keputusan dan bukti

- Dua kolom mendukung perbandingan profil dan memenuhi permintaan pemilik. Sela 12 dp tetap; fontScale ≥1,5 memakai satu kolom untuk mempertahankan keterbacaan. Cabang native ini belum diuji pada perangkat.
- Kartu <260 dp memakai isi 10 dp, avatar 36 dp, nama 14/20 dan lokasi 12/18. Gambar layanan 56 dp tetap di kanan tengah; tag di baris penuh menghindari ruang teks yang terjepit. Kartu lebar mempertahankan avatar 48 dp, gambar 80 dp dan isi 16 dp.
- Harga 18/25 pada kartu sempit, 22/28 pada kartu lebar, 16/25 untuk nominal ≥Rp10 juta. Rating tetap rata kanan, sejajar nominal bila cukup ruang; wrap mempertahankan digit utuh. Emas tetap hanya untuk penilaian. Nego hijau gelap tanpa kotak membedakannya dari tag layanan.
- Typecheck, lint, ekspor web lulus. Ekspor Hermes Android 4,5 MB lulus, bukan APK/AAB atau uji runtime.
- Playwright core/prices 2/2 lulus bersama dalam 33,6 detik. Empat lebar 320/412/840/1440: dua kartu sejajar, gambar 56/80 px kanan tengah, nego transparan satu kali, rating emas, harga di panel bawah, tanpa overflow kartu/halaman. Harga maksimum Rp50 juta satu baris pada 320 px. `pageErrors` kosong.
- Click-through: demo, lewati pengenalan, pilih peran/lokasi; filter pekerjaan/radius/kecamatan membuka dan menerapkan, hasil kosong/reset; cluster peta membuka daftar akun, Escape menutup; daftar Temukan menampilkan kartu, fokus + Enter membuka profil; Akun mengganti aktor, editor menolak nominal salah dan menyimpan/menghapus nominal; consent dua pihak mendahului usulan; tinjau/edit/kirim/penerimaan kesepakatan berjalan tanpa COD otomatis. Harga kosong menampilkan Bahas bersama pada detail.
- Run pertama: core lulus; prices berhenti pada locator ambigu “Bahas bersama” dari halaman tersembunyi. Locator dibatasi ke page-Profil; run bersama final lulus tanpa mengurangi cakupan.
- Satu batch visual: `two-column-cards/row-{320,412,840}.png`, `profile-pricing/maximum-price-320.png`. Nama/lokasi/tag membungkus, batas tipis terlihat, harga utuh. Tidak membutuhkan perbaikan visual. Preview existing dimuat ulang dan dua kartu sejajar terlihat.
- Detector layout tidak tersedia pada sesi ini: engine 0.1.14 belum terpasang/cache gagal. Tidak memasang engine. Struktur diperiksa manual dan melalui browser; detector UNVERIFIED.

## Delivery Gate

Hasil berlaku untuk source dan preview Chrome yang diperiksa. Android runtime, TalkBack, fontScale perangkat, insets dan layanan live UNVERIFIED. Tidak mengubah domain, API, SQL, consent, penyimpanan atau uang. Unit/domain/DB/Edge/Worker, suite web penuh dan audit dependensi tidak diulang. Token warna tetap; 34 pasangan kontras dari slice sebelumnya tidak diulang.

### 1. Hard Gate

| Item | Hasil dan bukti |
| --- | --- |
| R-02 | PASS: copy baru tanpa em dash. |
| R-03 | PASS Chrome: dua kolom 320/412/840/1440, assertion overflow halaman dan setiap kartu, nominal maksimum satu baris. Native UNVERIFIED. |
| R-17, R-18, R-38 | PASS: tidak menambah data/ulasan/foto; demo existing eksplisit sintetis. |
| R-23 | PASS: aset existing dan dua kolom diminta pemilik; tanpa aset baru. |
| R-24 | PASS: lima tab dan route existing, Beranda/Temukan/Akun serta detail exercised. |
| R-25 | PASS source: warna token tidak berubah; laporan sebelumnya memverifikasi 34 pasangan, teks nego ≥5,628:1 dan outline bintang ≥3,774:1. Bukan audit setiap piksel. |
| R-26 | PASS: satu kartu satu target, profil terbuka lewat Enter dan pointer pada tes harga; filter/cluster/editor/consent/proposal tercatat di atas. |
| R-27 | PASS source/subset runtime: loading/error/retry parent tidak berubah; filter kosong, harga kosong dan validasi diuji. Cabang loading/error tidak dipicu ulang. |
| R-28 | N/A: tanpa FAQ. |
| R-32 | PASS Chrome/source: kartu fokus dan Enter membuka profil, Escape menutup sheet; focus ring existing 2 px dan semantik/nama aksesibilitas dipertahankan. TalkBack UNVERIFIED. |
| R-33 | PASS: perubahan langsung pada source, tanpa script patch UI. |
| R-34 | N/A: light sesuai brief, tanpa toggle. |
| R-35 | PASS: ekspor web/Hermes dan dua skenario browser final lulus; bukti click-through di atas. Native UNVERIFIED. |
| R-36, R-37 | PASS: tanpa klaim produksi; arah existing dan koreksi pemilik menjadi dasar. |

### 2. Purpose-Gate

| Item | Hasil dan alasan |
| --- | --- |
| R-01 | PASS: hijau identitas/nego dan emas penilaian existing; tanpa gradient/glow. |
| R-04 | PASS: bintang menyatakan rating, rumah/orang menyatakan peran; glyph kontrol tetap 24 dp. |
| R-06 | PASS: Roboto/platform sans Android existing; harga lebih kuat dari metadata, ukuran disesuaikan lebar kartu. |
| R-07, R-08 | N/A: tanpa pola latar/panah dekoratif. |
| R-09 | PASS: nego teks biasa, tag menyatakan kebutuhan aktual. |
| R-10, R-12, R-13 | N/A: tanpa glass, shadow baru atau glow. |
| R-14 | PASS: profil ekuivalen perlu komposisi konsisten untuk dibandingkan dalam dua kolom. |
| R-19 | PASS: feedback existing, tanpa gerak/runtime baru. |
| R-22 | PASS: objek sapu/kardus dan layanan existing sesuai kebutuhan profil. |

### 3. Liveliness

PASS: dials 3/2/2 dan Design Read existing dipertahankan. Identitas nama/avatar memimpin kartu, harga memimpin panel bawah, rating mendukung. Isi/tag/panel harga dipisahkan ruang dan garis tipis. Emas adalah aksen penilaian; avatar tonal serta objek layanan mempertahankan motif Ceria. Gambar tetap berwarna sesuai permintaan pemilik.

### 4. Craftsmanship dan quality locks

PASS C-1/R-31: alasan warna/layout/type/spacing/kartu/artwork tercatat di atas. PASS C-2: interaksi tercatat pada tes final. PASS C-3/R-05: dua kolom untuk perbandingan profil, tanpa bagian template baru. PASS C-4 pada Chrome: lebar sempit/lebar/harga maksimum/kosong/keyboard diuji; native UNVERIFIED. PASS C-5: tanpa klaim/data baru. PASS R-11: radius kartu 20 dp dan tag 8 dp existing, nego tanpa container. PASS R-15/R-16: kontrol tindakan existing dan copy spesifik, tanpa buzzword baru. PASS R-20/R-30: identitas/aset Upahgo, inspirasi Gojek atas permintaan pemilik. PASS R-21: light sesuai brief. PASS R-29: palet existing, tanpa warna baru.
