# Pemeriksaan desain Ceria

18 November 2026. Cakupan: artefak FigCraft untuk review, bukan aplikasi produksi.

## Bukti pemeriksaan

`build_design.py` menghasilkan 3.718 perintah; CLI FigCraft menyelesaikan semuanya tanpa hasil `ok:false` atau peringatan impor. Dokumen native dikonversi kembali, diperiksa oleh `verify_design.py`, lalu seluruh 79 frame diekspor: 75 layar Android dan empat papan panduan.

- Tujuh halaman desain, 22 variabel warna, 370 interaksi.
- Seluruh tujuan navigasi menunjuk frame yang ada.
- Seluruh 370 target interaktif memiliki kotak minimal 48 × 48 unit desain.
- 1.121 node teks, tidak ada teks di luar batas parent.
- 1.046 pasangan teks/permukaan solid diperiksa; kontras minimum 5,04:1. Batas minimum dibedakan menurut ukuran dan ketebalan teks.
- Gambar raster, kontras semua piksel artwork, tumpang tindih antar-sibling dan perilaku native bukan hasil pemeriksaan otomatis tersebut.

Inspeksi visual dilakukan dalam satu batch pada enam contact sheet, empat papan panduan dan overview. Satu batch perbaikan mengubah sisa warna hijau pada wajah avatar menjadi warna kulit, memendekkan metadata offline, memberi variasi avatar daftar serta memperbesar target tautan teks. Satu konfirmasi memperlihatkan avatar dan metadata offline yang sudah diperbaiki. Tidak ada putaran pemolesan subjektif tambahan.

Dokumen mandiri `UpahGo-Ceria.figcraft` benar-benar terbuka di aplikasi FigCraft: tujuh halaman `Ceria 00` sampai `Ceria 06`, 22 variabel, layar mulai/onboarding terlihat. Impor ke sesi bersama dicoba, tetapi navigasi/kontrol editor tidak memberi pembaruan yang bisa dikonfirmasi secara konsisten. **Sinkronisasi ke dokumen bersama dan walkthrough prototipe revisi ini belum terverifikasi.** Desain Kestrel sebelumnya tetap dipertahankan. Tidak mengklaim 370 kontrol telah diklik satu per satu.

## Antislop Delivery Gate

Mode `during`, sumber global preference yang diperiksa pada sesi ini. Design Read: Operate, ENERGY 3 / RHYTHM 2 / MOTION 2.

### Hard Gate

| Aturan | Hasil dan bukti sesuai cakupan |
| --- | --- |
| R-02 | Lulus: tidak ada em dash pada node teks; assert pada generator dan pemeriksa. |
| R-03 | Lulus batas 412 × 892 dan inspeksi sheet; metadata offline yang bertumpuk diperbaiki. Text scaling dan ukuran perangkat lain belum terverifikasi. |
| R-17, R-18 | Lulus: tidak ada statistik pemasaran/testimoni. Nama, upah, jarak dan status sintetis, berlabel prototipe. Avatar ilustratif, bukan foto atau ulasan faktual. |
| R-23 | Lulus: pengguna meminta seluruh halaman dan penyesuaian ikon/aset. Logo proyek asli; Google G resmi; sumber unDraw tercatat; objek layanan SVG dibuat khusus proyek. |
| R-24 | Lulus: lima tujuan navigasi ada. Semua 370 tujuan terhubung secara struktural. |
| R-25 | Lulus pada pasangan teks/solid yang dihitung: minimum 5,04:1. Raster dan keseluruhan UI native belum terverifikasi. |
| R-26 | Prototipe: tautan antarlayar ada. Form, filter dan editor foto memakai state tetap, dinyatakan pada panduan. Fungsi layanan nyata di luar artefak desain. |
| R-27 | Lulus cakupan: loading, kosong, error, offline, validasi, pending, consent dan hasil terpisah. |
| R-28 | Lulus: bantuan khusus lokasi, izin nomor, kerja/COD, rating, privasi dan laporan. Tidak ada FAQ pemasaran generik. |
| R-32 | Spesifikasi fokus dan target 48 ada; keyboard/TalkBack aplikasi belum terverifikasi. |
| R-33 | Lulus: sumber generator desain lokal diubah langsung. Tidak memodifikasi UI aplikasi dengan patch DOM/CSS eksternal. |
| R-34 | Tidak berlaku: satu tema terang; tidak ada toggle tema produk. |
| R-35 | File native dibangun, diekspor dan dibuka di FigCraft. Walkthrough seluruh kontrol revisi serta build aplikasi belum terverifikasi. |
| R-36, R-38 | Lulus: tidak ada klaim keamanan, performa, compliance, verifikasi identitas atau jaminan pembayaran. |
| R-37 | Lulus: arah fun ala aplikasi Gojek berasal dari permintaan terbaru pengguna. Identitas UpahGo dipertahankan. |

### Purpose Gate

| Aturan | Alasan atau ketiadaan teknik |
| --- | --- |
| R-01, R-07, R-10, R-12, R-13 | Tidak memakai gradient, glow, glass atau shadow dekoratif. Garis jalan hanya pada skema peta berlabel. |
| R-04 | 29 ikon kontrol membulat untuk navigasi/tindakan. 13 ikon objek berwarna menunjukkan pekerjaan, rumah, peta, kontak, bantuan dan tunai. Tidak ada ikon dekoratif AI/magic. |
| R-06 | Roboto dari aset proyek: kesinambungan Android dan pembacaan formulir. Bukan perubahan identitas tipografi. |
| R-08, R-09 | Chevron menunjukkan baris navigasi. Tag menjelaskan layanan/status; tidak ada badge klaim pemasaran atau panah pada semua CTA. |
| R-14 | Kesamaan ukuran pada dua pilihan peran/profil mendukung perbandingan. Form, daftar, peta dan bantuan memiliki komposisi sesuai isi. |
| R-19 | Prototipe transisi instan. MOTION 2 merupakan maksud feedback/continuity untuk implementasi berikutnya, bukan animasi yang sudah diuji. |
| R-22 | Dua ilustrasi unDraw secara khusus menunjukkan pencarian kerja dan pemilihan tenaga. Objek koper/rumah serta layanan harian memberi konteks produk. |

### Liveliness

Semua poin desain memiliki bukti: dials dinyatakan; fokus tunggal pada tindakan inti tiap layar; jarak memisahkan kelompok; hijau menandai aksi; ikon objek berwarna dan ujung bulat menjadi motif berulang. Energi paling kuat di masuk, peran dan beranda, lebih tenang pada consent/COD. Ritme berganti antara ilustrasi, daftar, formulir, peta dan artikel.

### Craftsmanship dan consistency locks

- C-1/R-31: keputusan warna, tipografi, bentuk, jarak dan ilustrasi dijelaskan pada README.
- C-2: batas fungsi prototipe tertulis; layanan aplikasi nyata belum dibuat dari revisi ini.
- C-3/R-05: layar mengikuti alur nyata UpahGo, tanpa pricing, testimonial, logo wall atau bento dekoratif.
- C-4: state pemulihan dirancang; ketahanan runtime dan input nyata belum terverifikasi.
- C-5: tidak mengarang bukti pengguna/layanan. Data contoh berlabel.
- R-11: radius bervariasi; pill untuk tombol/chip, daftar tanpa kartu, bidang informasi dan isian 16–20, ilustrasi 28–36.
- R-15/R-16: CTA menjelaskan tindakan, tanpa buzzword pemasaran.
- R-20/R-30: hijau/emas logo UpahGo, layanan kerja harian, pin profil, consent dan COD milik produk. Inspirasi Gojek pada keramahan dan ikon, bukan penyalinan merek/aset/fitur.
- R-21: tema terang sesuai permintaan dan pencarian kerja sehari-hari.
- R-29: hijau/putih/ink adalah inti; warna pendukung dikendalikan menurut objek dan status.

## Batas rilis

Hasil ini dapat direview sebagai desain. Gerbang aplikasi produksi tetap **belum terverifikasi**, khususnya seluruh interaksi, aksesibilitas native, ukuran teks, safe area, Android perangkat nyata, autentikasi, otorisasi, privasi, jaringan dan performa. Tidak menjalankan lint, test, build atau deployment aplikasi karena kode aplikasi tidak diubah. Tidak ada pesan, SMS, pembayaran atau data produksi dikirim.
