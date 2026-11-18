# Delivery Gate: artefak desain FigCraft

18 November 2026. Cakupan **desain untuk review**, bukan aplikasi atau persetujuan rilis produksi. PASS berarti bukti pada artefak; N/A dan BELUM DIVERIFIKASI tidak dianggap hasil lulus aplikasi.

## Bukti

- Native FigCraft membuka dan menyimpan dokumen bersama, 75 frame layar, 3 papan, 19 variabel. Page 1 kosong asli dipertahankan.
- Build log: 3.178 perintah, tanpa `ok:false`.
- `verification.json`: 1.149 teks, 368 interaksi, nol tujuan navigasi hilang, nol teks keluar dari parent; 999 pasangan warna teks, minimum 4,61:1.
- 78 PNG hasil ekspor. Inspeksi batch mencakup enam halaman layar dan papan komponen; konfirmasi ukuran penuh pada Masuk, peran, Beranda, pin terpisah, privasi dan consent foto.
- Walkthrough FigCraft: Masuk, Coba demo, pengenalan, lewati, pilih Cari tenaga, lokasi, profil, simpan, Beranda, peta, kelompok pin. Navigasi lintas halaman berjalan. Tujuan seluruh tautan diverifikasi secara struktural; klik manual seluruh 368 tautan tidak dilakukan.
- Gambar peta yang berisi blokir penyedia dihapus. Skema final diberi label. Anotasi ganda lokasi dibersihkan di file generator dan kanvas native.

## Hard Gate

R-02 PASS: self-check memeriksa seluruh teks, tidak ada em dash.

R-03 PASS untuk frame 412×892: seluruh 1.149 text node berada dalam parent; inspeksi PNG melengkapi pemeriksaan batas. Layout lebar lain dan text scaling native BELUM DIVERIFIKASI.

R-17 PASS: angka upah, jarak dan status berlabel contoh; tidak ada statistik pengguna atau klaim bisnis.

R-18 PASS: tidak ada testimonial. Profil contoh adalah data sintetis, bukan dukungan pelanggan.

R-23 PASS: logo asli dipertahankan; pengguna meminta dua gambar peran dan pin profil. Dua ilustrasi berlisensi, avatar ilustratif, peta skematis diberi konteks contoh; sumber dicatat.

R-24 PASS: lima tab tetap sesuai rute yang ada. Semua tujuan navigasi prototipe ditemukan pada dokumen.

R-25 PASS pada teks/permukaan solid: 999 pasangan dihitung, minimum 4,61:1. Raster dan kontras peta aktual saat implementasi BELUM DIVERIFIKASI.

R-26 PASS pada batas prototipe: papan panduan dan README menyebut isian/filter/editor memakai state tetap. 368 tautan alur tersedia. Fungsi aplikasi penuh BELUM DIVERIFIKASI.

R-27 PASS: halaman 06 memiliki loading, kosong, error, offline, validasi, sesi berakhir, lokasi ditolak dan jalur pemulihan.

R-28 PASS: enam topik bantuan diturunkan dari `apps/mobile/app/help.tsx`; masing-masing mempunyai isi relevan.

R-32 PASS untuk spesifikasi visual fokus: contoh fokus dengan stroke hijau 3 dp pada papan komponen. TalkBack, urutan fokus dan keyboard aplikasi BELUM DIVERIFIKASI.

R-33 PASS: artefak dibangun dari sumber `build_design.py` melalui API perintah native FigCraft; tidak memodifikasi kode aplikasi lewat patch eksternal.

R-34 N/A: hanya tema terang diminta, tidak ada toggle tema yang dirancang.

R-35 PASS untuk file desain: dibangun, diekspor, diimpor, disimpan dan alur utama dicoba di FigCraft. Build aplikasi serta walkthrough seluruh kontrol aplikasi BELUM DIVERIFIKASI.

R-36 PASS: tidak ada klaim keamanan, compliance, performa atau layanan produksi. Batas COD dan operator tertulis eksplisit.

R-37 PASS: arah Kestrel Pay dipilih pengguna; Design Read Operate, ENERGY 2 / RHYTHM 1 / MOTION 2 tercantum pada panduan.

R-38 PASS: setiap layar bertanda `Prototipe · data contoh`; fitur deferred tidak ditampilkan sebagai layanan jadi.

## Purpose Gate

R-01 PASS: permukaan solid, tanpa gradient atau glow.

R-04 PASS: ikon Material proyek dipakai sesuai fungsi. Semua nama ikon yang dipakai memiliki sumber SVG; tidak memakai fallback ikon yang hilang.

R-06 PASS: Roboto variabel menjaga pola native Android, skala 32/38 untuk judul dan 16/24 untuk isi; tanpa monospace dekoratif.

R-07 PASS: garis hanya menjadi geometri peta skematis yang berlabel; tidak ada grid dekoratif di latar aplikasi.

R-08 PASS: Back, chevron baris dan open-in-new menjelaskan navigasi; tombol utama memakai label tindakan.

R-09 PASS: tag memuat jenis kerja, status atau pilihan. Tidak ada klaim New, Secure atau AI Powered.

R-10 PASS: tidak ada glassmorphism.

R-12 PASS: tidak ada bayangan besar berulang; hierarki berasal dari bidang, ruang dan outline.

R-13 PASS: tidak ada glow.

R-14 PASS: dua kartu profil setara untuk perbandingan, panel aksi lebar untuk tindakan utama, daftar vertikal untuk aktivitas dan pengaturan. Struktur mengikuti isi.

R-19 PASS untuk prototipe: perpindahan instan, tanpa animasi dekoratif. Implementasi motion dan reduced motion BELUM DIVERIFIKASI.

R-22 PASS: Job Hunt mengilustrasikan mencari kerja; Hiring mengilustrasikan mencari tenaga. Keduanya langsung menjelaskan dua peran yang diminta.

## Liveliness

Dials PASS: Operate / ENERGY 2 / RHYTHM 1 / MOTION 2 tercantum pada papan panduan dan README.

Consistency PASS: panel besar berwarna pada orientasi/aksi, susunan task yang konsisten pada formulir dan aktivitas; transisi prototipe instan.

Focal point PASS: Masuk memakai artwork dan Google; peran memakai dua pilihan besar; Beranda memakai panel peta; kesepakatan memakai tugas/upah dan aksi berikutnya.

Whitespace PASS: margin 20 dp, gap kartu 12 dp, label/isian terkelompok; pemisahan bagian diatur lewat posisi eksplisit sumber.

Accent PASS: tomato untuk tindakan/fokus, sky/lime untuk kelompok isi yang dijelaskan, bukan setiap elemen.

Identity motif PASS: bidang hangat membulat, bobot judul kuat, pasangan kebutuhan/layanan, pin profil dan pemisahan consent/COD berulang sebagai bahasa produk.

Design Read PASS: referensi pengguna, mode, dial, peran warna, alasan font dan konteks penggunaan ditulis pada panduan.

## Craftsmanship dan Quality Locks

C-1 PASS: warna, font, gambar, layout, ikon dan radius mempunyai alasan pada README/panduan.

C-2 PASS dalam batas artefak: fungsi statis prototipe diberi penjelasan; tujuan tautan valid. Fungsi nyata aplikasi BELUM DIVERIFIKASI.

C-3 PASS: semua layar memetakan alur/rute/state produk yang ada; tidak ada logo bar, pricing, dashboard atau statistik buatan.

C-4 PASS untuk ukuran desain: bounds dan batch PNG diperiksa; perangkat, ukuran teks dan tema sistem lain BELUM DIVERIFIKASI.

C-5 PASS: tidak ada testimonial, metrik sosial atau hasil layanan nyata yang dibuat.

R-05 PASS: panel penuh dan pasangan kartu mengikuti permintaan Kestrel serta kebutuhan membandingkan profil; formulir dan bantuan tidak dipaksakan menjadi mosaik.

R-11 PASS: radius bervariasi sesuai fungsi: Google 4, isian 14, tombol 18, kartu 22–28, avatar lingkaran, frame layar persegi.

R-15 PASS: CTA menyebut tindakan, termasuk `Buka peta sekitar`, `Minta izin kontak`, `Tinjau kesepakatan`, `Konfirmasi pekerjaan selesai`, `Ya, uang sudah saya terima`. `Lanjut` hanya untuk urutan onboarding.

R-16 PASS: copy memakai bahasa tugas Indonesia, tanpa slogan AI/teknologi generik.

R-20 PASS: profil/tenaga/radius, izin nomor, tugas, upah dan COD menentukan susunan; identitas bukan sekadar logo yang ditempel pada template.

R-21 PASS: tema terang sesuai referensi dan konteks mobile, tidak memaksakan dark mode.

R-29 PASS: 19 variabel terpusat dengan peran eksplisit; tomato fokus, sky/lime kelompok, hijau/emas logo, warna status semantik dan netral.

R-30 PASS: mengambil suasana/warna Kestrel sesuai brief; tidak menyalin wallet, metrik belanja atau fitur fintech.

R-31 PASS: keputusan utama dan batas implementasi dijelaskan dalam README; tidak ada dekorasi tanpa fungsi produk.

## Gerbang produksi terpisah

BELUM DIVERIFIKASI: implementasi React Native, target sentuh nyata untuk tautan teks, TalkBack, keyboard, ukuran teks besar, safe areas, performa perangkat, offline dan perubahan akun, integrasi Google/GPS/nomor/peta, otorisasi, serta kondisi error layanan. Tidak menjalankan test/build aplikasi untuk artefak desain ini. Tidak ada klaim lulus gerbang rilis.
