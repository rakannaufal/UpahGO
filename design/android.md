# Brief Permukaan Android Upahgo

## Arahan aktif: Ceria, 18 November 2026

Pengguna menyetujui implementasi desain Ceria. Mode **Operate · ENERGY 3 / RHYTHM 2 / MOTION 2**. Putih lapang, hijau aksi #087F52, identitas logo asli hijau/emas, objek layanan multicolor, ilustrasi peran kiri/kanan, daftar berpemisah. [DESIGN.md](../DESIGN.md) dan [tokens.json](tokens.json) versi 2 menggantikan nilai visual lama di catatan historis berikut. Lima tab, aturan produk/privasi, server, Android Back/insets dan batas verifikasi tetap berlaku. Web memakai peta geografis, pin foto yang disetujui/fallback ikon; zoom maksimal memisahkan titik berdekatan secara visual tanpa mengubah koordinat. Bukti terbaru pada [TESTING.md](../TESTING.md).

## Catatan sebelum Ceria

Status: implementasi Android-first React Native + Expo tersedia di apps/mobile; preview web terverifikasi dengan data sintetis. Export Hermes lulus, bukan APK/AAB atau bukti runtime Android. Arah dan token incumbent tetap dipertahankan.

Mode: **Operate**. Pengguna harus memahami siapa yang siap bekerja/membutuhkan tenaga, daerah perkiraan, izin kontak, tugas, waktu, total upah COD, dan langkah berikutnya dengan cepat.

Design Read: aplikasi kerja harian Indonesia; logo pilihan berupa pekerja bertopi/celemek emas/sapuan putih pada hijau. Bidang putih lapang, aksi hijau, tag mint/emas muda, kartu membulat, struktur Material Android yang akrab. Identitas mengikuti logo pilihan, tanpa alternatif baru. **ENERGY 2 / RHYTHM 1 / MOTION 2**.

## Prioritas informasi

1. Pada peta: mode pekerja/pemberi kerja, area perkiraan, status tampil sendiri, serta kartu marker terpilih. Kartu pekerja berisi tag layanan, kartu pemberi kerja berisi tag kebutuhan; semua tag tersedia di detail. Melihat peta tidak harus menampilkan diri.
2. Pada kontak: Hubungi mengirim permintaan; penerima menyetujui sebelum WhatsApp tersedia. Persetujuan kontak terpisah dari kesepakatan kerja dan izin alamat.
3. Pada pekerjaan: tugas, total upah COD, daerah, serta jadwal/zona. Nominal dan waktu serah terima belum dikunci.
4. Status menyebut pihak yang perlu bertindak; satu aksi utama per konteks. Alamat, nomor, dan pengaduan mengikuti izin server pada PRD dan SECURITY.md.

## Ciri yang diulang

Hijau untuk aksi utama/identitas, mint untuk pilihan/tag layanan pekerja, emas muda untuk kebutuhan/upah, angka tegas, ringkasan tugas-waktu-upah. Bentuk marker dan label peran membedakan kedua kelompok. Satu panel hijau dapat menjadi fokus. Kesan fun dari bentuk ramah, warna hangat/segar dan respons sentuhan. Sapuan logo tetap pada identitas, tidak menjadi dekorasi bergerak di setiap layar.

## Batas

- Katalog rencana tidak mengaktifkan kategori live otomatis. Foto opsional dengan consent/pending, tanpa klaim verifikasi. Penilaian bilateral tetap terpisah dari COD.
- Komponen navigasi ditentukan sebagai pola, bukan persetujuan rute baru; tujuan berasal dari inventaris PRD.
- Android mengikuti Material, System Back, window insets, dan pembesaran font.
- GPS foreground valid wajib untuk penemuan; server menentukan kota dari polygon dan membatasi radius. Native react-native-maps memerlukan key yang belum disiapkan; tanpa key tersedia penjelasan dan daftar. Origin pencarian 3 desimal, marker publik 2 desimal/fallback pusat area sah; bukan rumah/GPS tepat. Web memakai Leaflet/OSM geografis beratribusi. Perilaku peta native/atribusi/marker padat belum diuji.
- design/screens-preview.png tetap studi statis. 41 capture pada manifest .impeccable/review/browser-evidence.json berasal dari aplikasi berjalan pada browser sintetis; bukan screenshot atau bukti performa Android.

## Ukuran keberhasilan

Pengguna mengenali dua mode peta, konsekuensi tampil/berbagi nomor, tugas, waktu, upah, status, dan langkah berikutnya tanpa menebak ikon. Penerimaan permintaan kontak, kesepakatan kerja, penyelesaian, dan penerimaan uang COD tetap berbeda. Pengujian pemahaman pengguna serta perangkat belum dilakukan.

Rujukan: [DESIGN.md](../DESIGN.md), [PRD](../prd.md), [tokens.json](tokens.json).

Implementasi UX lokal: Beranda memakai PersonCard ringkas dua kolom, maksimal dua tag dan jumlah sisanya; bio/tag lengkap pada detail; browse max 864 dp, fallback satu kolom pada fontScale >=1.5. Inventaris rancangan: [SCREENS.md](../SCREENS.md), lebih luas dari slice yang dibangun. Navigasi aktual: Beranda, Temukan, Aktivitas, Notifikasi, Akun; tab bawah pada lebar kecil, rail mulai 840. Detail profil, kontak, kesepakatan dan laporan memiliki route. Login mendahului onboarding akun baru; pilihan peran dan lokasi/radius wajib, profil boleh dilewati setelahnya; halaman detail memakai AccountGate agar bootstrap gagal menampilkan pesan, Kembali dan Coba lagi. Proposal/penerimaan, penyelesaian dan pengakuan COD dipisahkan; demo selalu berlabel sintetis. Publikasi lowongan/lamaran dan operator web ditunda.

Bukti: [TESTING.md](../TESTING.md), [review](REVIEW.md), [gate implementasi](IMPLEMENTATION-GATE.md). Layout browser 320/360/390/411/600/840/1440, keyboard dan pemulihan kedua route detail diuji; TalkBack, fontScale, System Back, insets dan keyboard perangkat belum diuji. Tidak ada klaim persetujuan rilis native/live.


Lima tab tanpa judul tab berulang di badan; detail mempertahankan judul. Filter kecamatan/jenis pekerjaan, GPS foreground/app-resume dengan radius tersimpan, batas kota dan radius pada server; tidak ada watcher/service background. Denial/stale/kota tak terlayani menutup discovery tanpa demo fallback. Akun lama tetap dapat membuka riwayat/Akun/bantuan; onboarding lokasi pertama tetap wajib. Review kedua pihak tersedia setelah kesepakatan selesai, dipisah dari COD. Demo Pekanbaru berisi 12 profil sintetis dan `demo-me` beserta riwayat; geografi OSM aktual, bukan bukti direktori live nasional. Review terakhir: [finish-review-redesign.md](../.impeccable/review/finish-review-redesign.md), **FIX**, source/web saja; ilustrasi aktivitas belum selesai.

## Slice katalog, tenaga dan foto — 18 November 2026

Arah tetap native Operate (ENERGY 2 / RHYTHM 1 / MOTION 2), logo hijau/emas pilihan pengguna dan token yang sama. Lima tab tanpa judul badan berulang, dua kartu per baris; pencarian, kecamatan, kategori, jenis pekerjaan dan tenaga dibagi Beranda/Temukan dalam sesi per akun/peran, direset saat akun/peran berubah. GPS kota/radius, consent kontak, COD dan penilaian tetap berlaku.

`shared/job-catalog.json` memuat 128 pekerjaan/16 kategori; enam tag bersih-bersih lama aktif live. Demo mengaktifkan 18 tugas (J001–J016, galon dan kardus), bukan kategori live baru. Demo tetap **12 profil sintetis (6 per peran) + demo-me**, dengan konteks galon/kardus/cuci piring dan Ringan/Sedang/Berat/Perlu rincian. Entri katalog lain adalah rencana, bukan layanan tersedia. “Lainnya” mengirim usulan privat pending; tidak mengaktifkan kategori otomatis. Estimasi tenaga memakai konteks durasi, jumlah, beban, lantai/lift, jarak, pekerja dan alat; bukan batas angkat aman/penilaian medis. Kesepakatan menampilkan konteks dan review eksplisit sebelum kirim; COD terpisah.

Cover aktivitas masih pictogram Material resmi: manifest raster `ActivityMedia.tsx` kosong. Delapan ilustrasi Stage A belum dibuat; generator yang diizinkan tidak tersedia, fallback berbayar tidak diizinkan. Foto identitas/tempat opsional terpisah dari cover; galeri, crop, resize JPEG, preview, consent, draft dan hapus tersedia untuk evaluasi. Pending hanya terlihat pemilik, bukan persetujuan nyata. Tidak ada foto orang nyata dibuat/diimpor; fixture foto adalah bidang warna sintetis untuk tes. Rilis native/live dan ilustrasi tetap terbuka; lihat [TESTING.md](../TESTING.md).

