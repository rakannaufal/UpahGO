# Review empat contoh kartu

Revisi terbaru mempertahankan rating emas di kanan harga pada pilihan 2; nego berupa teks hijau gelap tanpa kotak. `verification.json`/captures telah diperbarui. Bukti aplikasi terbaru: [price-rating.md](../../.impeccable/review/price-rating.md).

Catatan berikut merekam studi awal sebelum pengguna memilih layout. Revisi terbaru memilih alternatif 2: rating diganti label nego dan gambar kanan 80 px; kini diterapkan ke aplikasi. `verification.json` dan captures diperbarui untuk studi revisi. Bukti implementasi terbaru: [horizontal-card.md](../../.impeccable/review/horizontal-card.md). Klaim “aplikasi tidak diubah” di arsip review awal tidak menggambarkan slice revisi ini.

18 November 2026. Studi komponen statis untuk memilih layout; bukan perubahan aplikasi, bukan bukti kesiapan Android/live. Primary: impeccable Operate; filter: antislop during dari global preference terverifikasi; implementation: ponytail full. Superdesign tidak digunakan, tidak ada upload ke layanan desain atau generasi berbayar.

## Cakupan dan bukti

- Arahan dan Design Read mengikuti `../../DESIGN.md`: kerja harian Indonesia, hangat, ceria, hierarki uang tenang. ENERGY 3 / RHYTHM 2 / MOTION 2. Pada lembar perbandingan statis, tidak ada gerak karena tidak ada perubahan state.
- Empat struktur berbeda memakai isi sintetis yang sama: cover atas, identitas horizontal, harga pertama, rail ilustrasi samping. Nomor pilihan berada di luar kartu. Semua berlabel data contoh; rating bukan klaim pengguna nyata.
- `build.mjs` memakai token existing, Roboto lokal, ikon rumah dan sapu existing. Bintang adalah bentuk rating existing yang diberi fill emas sesuai permintaan. Aplikasi, token otoritatif, autentikasi, backend dan uang tidak diubah.
- `node build.mjs` dan `node verify.mjs` lulus. Chrome lokal, ukuran 960/412/320 px, teks 200% pada 320 px, nama dan tag panjang. Tidak ada page error, overflow horizontal, atau request HTTP eksternal. Border empat kartu 1 px `#E3E7E4`, ikon rumah/bintang 24 px, artwork 40 px.
- Kontras teks terukur minimum 5,628:1; batas ikon minimum 4,080:1. Fill emas dekoratif diperkuat outline kontras serta teks nilai/jumlah ulasan. Border pengelompokan lembut bukan indikator kontrol.
- Inspeksi visual pertama menemukan nominal pecah antar digit pada varian 3/4 saat teks 200%. Satu batch perbaikan menjaga digit satu baris, mengizinkan `Rp` pada baris terpisah, serta memindahkan rail ke atas pada ruang sempit/teks besar. Konfirmasi kedua bersih pada kasus yang sama. Tidak ada putaran polish lanjutan.
- Tangkapan final: `overview.png`, `captures/desktop-960.png`, `captures/mobile-412.png`, `captures/mobile-320.png`, `captures/text-200-percent-320.png`, `captures/long-content-320.png`, `captures/card-1.png` sampai `card-4.png`. Hasil mesin: `verification.json`.
- Click-through: tidak ada tombol, tautan, form, atau elemen fokus palsu pada lembar ini (assert jumlah 0). Kartu berupa `article` statis, bukan kontrol aplikasi. Loading/error/empty/pending/retry tidak berlaku karena semua isi lokal statis, tanpa fetch atau mutasi. Semua isi dapat dibaca dalam urutan DOM dengan heading yang terstruktur; ikon dekoratif disembunyikan dari accessibility tree.
- Native Android, TalkBack, fontScale perangkat, grid asli 2 kolom, navigasi profil dan alur nego belum diuji untuk studi ini. Pemeriksaan domain/backend/build aplikasi tidak diulang karena source aplikasi tidak berubah. Implementasi React Native menunggu pilihan layout.

## Delivery Gate

PASS hanya untuk artefak studi statis pada cakupan Chrome di atas. N/A dinyatakan dengan alasan; tidak dianggap verifikasi native atau live.

### 1. Hard Gate

| Item | Hasil dan bukti |
| --- | --- |
| R-02 em dash | PASS: tidak ada em dash pada copy HTML. |
| R-03 containment | PASS: 5 kasus ukuran/konten, overflow container dan halaman kosong; digit nominal tidak terpecah. |
| R-17 statistik | PASS: tidak ada klaim statistik; nilai contoh ditandai sintetis. |
| R-18 testimonial | PASS: tidak ada testimonial atau foto manusia. |
| R-23 aset | PASS: memakai aset produk yang sudah ada; pengecualian emas diminta pengguna. |
| R-24 tautan | N/A: tidak ada navbar/tautan pada lembar statis. |
| R-25 kontras | PASS: teks ≥5,628:1, outline ikon ≥4,080:1, angka rating juga tertulis. |
| R-26 kontrol | PASS: tidak ada kontrol palsu; jumlah elemen interaktif terverifikasi 0. |
| R-27 state | N/A: statis lokal, tidak ada operasi asinkron/input/list dinamis. |
| R-28 FAQ | N/A: tidak ada FAQ. |
| R-32 keyboard | N/A untuk kontrol/fokus: tidak ada elemen interaktif. Struktur baca heading/article/list tetap semantik. Screen reader native belum diuji. |
| R-33 source | PASS: HTML/CSS ditulis pada template source; build hanya mengisi font, token dan aset, tanpa patch source aplikasi. |
| R-34 tema | N/A: light Ceria yang diminta, tanpa toggle. |
| R-35 runtime | PASS: HTML dibangun dan dirender di Chrome; elemen interaktif 0, pageErrors 0. |
| R-36 klaim | PASS: tidak ada klaim keamanan, kinerja, compliance atau pengguna nyata. |
| R-37 direction | PASS: DESIGN.md existing dibaca sebelum UI dibuat; permintaan terbaru mengatur empat alternatif dan bintang emas. |
| R-38 truth | PASS: nama, harga, jarak dan rating sumber screenshot demo diberi label sintetis. |

### 2. Purpose-Gate

| Teknik | Hasil dan alasan |
| --- | --- |
| R-01 warna/gradient | PASS: token hijau/mint/peach Ceria mengelompokkan identitas dan uang; emas hanya rating. Tanpa gradient/glow. |
| R-04 ikon | PASS: rumah mewakili profil pemberi kerja, bintang mewakili nilai rating. Bukan feature icon dekoratif. |
| R-06 tipografi | PASS: Roboto existing mengikuti Android, skala dekat untuk hierarki produk; tanpa display/monospace/uppercase dekoratif. |
| R-07 pola latar | PASS: tidak ada grid visual, tekstur, atau pola dekoratif. Grid CSS hanya alat perbandingan empat opsi. |
| R-08 panah | PASS: tidak ada panah/CTA dekoratif. |
| R-09 badge | PASS: label nego menyampaikan kesediaan membicarakan harga; bukan badge verifikasi/keamanan. |
| R-10 glass | PASS: tidak ada glass/blur. |
| R-12 shadow | PASS: tidak ada shadow; satu border lembut memisahkan profil. |
| R-13 glow | PASS: tidak ada glow. |
| R-14 kartu | PASS: pengguna meminta empat kartu profil, isi sama untuk perbandingan; empat susunan berbeda, tanpa feature-card template. |
| R-19 animasi | N/A: perbandingan statis, tidak ada perubahan state yang perlu gerak. |
| R-22 ilustrasi | PASS: sapu existing menjelaskan Menyapu, bukan scene generik baru. |

### 3. Liveliness

| Item | Hasil dan bukti |
| --- | --- |
| Dials jelas | PASS: ENERGY 3 / RHYTHM 2 / MOTION 2 dari Ceria; statis pada artefak pemilihan. |
| Konsisten dengan dials | PASS: peach/mint dan artwork lokal memberi energi, kelompok isi tetap tenang, tanpa gerak yang tidak perlu. |
| Fokus | PASS: varian 1/2 identitas pertama, varian 3 harga pertama, varian 4 kolom isi terpisah dari gambar. |
| Ruang struktural | PASS: sela 4–8 px metadata, 12–16 px kelompok, 32–36 px antaralternatif. |
| Aksen disengaja | PASS: emas mengidentifikasi rating, hijau label nego; tidak memakai aksen pada setiap teks. |
| Motif identitas | PASS: avatar tonal, objek sapu, Roboto, hijau/mint/peach Ceria berulang. |
| Design Read | PASS: Design Read dari DESIGN.md dibaca sebelum edit dan dicatat kembali pada README studi. |

### 4. Craftsmanship dan consistency locks

| Item | Hasil dan bukti |
| --- | --- |
| C-1 intentionality | PASS: warna, font, jarak, border, ilustrasi dan tiap layout mempunyai alasan di README. |
| C-2 completeness | PASS: tidak ada affordance/tombol yang menjanjikan aksi. |
| C-3 content | PASS: semua isi hanya profil, lokasi, rating, kebutuhan dan anggaran; pengantar menjelaskan perbandingan. |
| C-4 resilience | PASS web pada 5 kasus; rail menjadi strip pada ruang sempit, digit harga tidak dipecah. Native belum diverifikasi. |
| C-5 evidence | PASS: semua data realistis berlabel sintetis, tanpa klaim layanan nyata. |
| R-05 template | PASS: empat contoh komponen diminta pengguna, bukan struktur landing page/bento default. |
| R-11 radius | PASS: kartu 20, cover 13, tag 8, label 6, avatar bulat sesuai peran komponen. |
| R-15 CTA | N/A: tidak ada CTA. |
| R-16 copy | PASS: copy deskriptif dan konteks harga, tanpa buzzword. |
| R-20 identity | PASS: aset, warna, avatar dan tipografi produk Upahgo tetap. |
| R-21 theme | PASS: light theme mengikuti brief, tanpa dark mode tambahan. |
| R-29 palette | PASS: hijau/mint, peach, netral dan satu aksen emas; artwork existing mempertahankan warna aslinya. |
| R-30 clone | PASS: mengambil kelembutan batas yang diminta; tidak memakai logo, layanan, atau susunan layar Gojek. |
| R-31 reason | PASS: setiap keputusan besar dan alasan setiap alternatif tertulis pada README. |
