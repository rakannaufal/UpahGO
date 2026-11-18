# Rencana penyegaran UI Upahgo

18 November 2026. **Implementasi lokal parsial tersedia; bukan persetujuan setiap detail atau penerimaan rilis.** Katalog/filter/tenaga, kartu dua kolom, review kesepakatan dan foto opsional telah diterapkan untuk evaluasi. Delapan ilustrasi raster aktivitas belum tersedia; pictogram resmi adalah fallback sementara. Gerbang Android runtime, layanan live/foto dan review/remediasi dependensi tetap terbuka; verdict review **FIX**. Mengacu pada screenshot referensi pengguna pukul 21.04.14, aplikasi yang ada, [DESIGN.md](../DESIGN.md), [PRD](../prd.md) dan [brief Android](android.md). Tidak mengganti sumber token, logo, aturan akses, atau menyatakan aplikasi siap rilis.

## 1. Tujuan dan batas

Pekerja menemukan kebutuhan yang sesuai kemampuan; penyedia kerja menemukan orang yang sesuai tugas. Pengguna perlu mengenali pekerjaan dari gambar, membaca inti kartu, menyaring, lalu membuka detail tanpa mempelajari banyak kontrol.

Permintaan terbaru: seluruh halaman lebih menarik dan rapi, kualitas visual terinspirasi Apple, kartu bergambar, filter ringan/sedang/berat, katalog pekerjaan luas dan pilihan Lainnya. Katalog baru merupakan perluasan dari enam tag bersih-bersih yang saat ini aktif; daftar rencana tidak otomatis mengaktifkan semua kategori.

Tetap: Android pertama; lima tab tanpa judul tab berulang; Beranda dua kartu/baris; Temukan langsung peta; GPS foreground dan radius/kota server; consent sebelum WhatsApp; COD; penilaian dari pekerjaan selesai; demo berlabel sintetis. Profil boleh dilewati sesudah peran/lokasi wajib. Publikasi lowongan/lamaran terpisah tidak otomatis masuk lingkup ini.

Mode **Operate**, ENERGY 2 / RHYTHM 1 / MOTION 2: visual aktivitas memberi daya tarik, struktur stabil memudahkan pengulangan tugas, gerak singkat menjelaskan perubahan.

## 2. Pembacaan referensi

| Unsur referensi | Adaptasi Upahgo | Alasan |
| --- | --- | --- |
| Gambar produk jelas di atas bidang tenang | Ilustrasi aktivitas menjadi cover kartu; orang/tempat asli menjadi identitas opsional | Tugas dikenali sebelum teks dibaca |
| Putih, jarak teratur, pemisah halus | Permukaan putih pada dasar netral incumbent; batas hanya bila membantu | Konten memiliki hierarki tanpa semua elemen dibungkus panel |
| Judul dan tombol tegas | Nama/tugas mudah dipindai; satu aksi utama per detail/form | Mengurangi pilihan bersaing |
| Kartu dan sheet membulat | Radius incumbent: kartu 24, kontrol 18, sheet 28 dp | Memperhalus tanpa membuat sistem kedua |
| Baris detail tersusun konsisten | Label dan nilai, ikon seukuran, baseline dan area sentuh konsisten | Jadwal/upah/status mudah dibandingkan |
| Gambar dominan pada detail | Satu media utama, isi terstruktur, aksi Hubungi jelas | Memberi konteks sebelum meminta kontak |

Kualitas ala Apple diterjemahkan menjadi ketepatan jarak, tipografi, hierarki, dan respons. Navigasi, Back, dialog, switch, picker dan gesture tetap sesuai Android. SF Pro/SF Symbols, status bar iPhone, Apple Pay, keranjang, promo, bahasa farmasi dan warna biru referensi tidak dibawa ke produk. Logo hijau–emas dipertahankan. Tanpa glass/blur besar atau gradient pada setiap layar.

## 3. Tata visual yang diusulkan

| Bagian | Ketentuan rencana |
| --- | --- |
| Warna | Reuse primary #014C24, emas #E5C282, mint #E2F3E7, putih dan netral dari tokens.json; warna status selalu dengan label |
| Tipografi | Sans sistem Android melalui skala Material yang ada. Judul detail 22–28 sp; nama kartu 16–18 sp; isi 16 sp; metadata/tag 14 sp. Tanpa font khusus yang diunduh |
| Ritme | Skala 4/8/12/16/20/24/32 dp; tepi telepon 16 dp; gap grid 12 dp; teks kartu 12–16 dp. Nilai final diuji bersama agar gambar tidak menyisakan metadata terlalu sempit |
| Kedalaman | Kartu datar/outline ringan, elevasi hanya untuk kontrol di atas peta dan sheet. Tidak memberi shadow pada tiap baris |
| Ikon | Keluarga Material yang sudah ada; ukuran 20/24 dp. Ilustrasi aktivitas merupakan konten, bukan pengganti ikon navigasi |
| Sentuhan | Setiap kontrol minimal 48×48 dp; ikon 20 dp tetap memiliki target besar. Seluruh kartu membuka detail; tag informasi tidak menjadi tombol kecil |
| Gerak | Tekan 100 ms, ganti state 160 ms, sheet/detail 200 ms; maksimum 240 ms sesuai token. Tanpa list stagger/loop/parallax, reduced motion langsung mengganti state |
| Responsif | Dua kolom pada telepon bila terbaca; satu kolom pada pembesaran teks yang membutuhkan. Rail mulai 840 dp; lebar browse mengikuti token. Peta/detail dapat berdampingan pada layar luas tanpa merentangkan kartu |

Tidak menetapkan dark mode, library animasi, atau penggantian komponen native baru. Perubahan token permanen hanya dicatat setelah hasil implementasi diverifikasi, melalui DESIGN.md dan adapter yang sama.

## 4. Beranda yang diusulkan

Urutan layar kecil:

1. Lokasi ringkas: `Pekanbaru · 5 km`. Mengetuk membuka radius/kecamatan; kota mengikuti GPS, bukan dropdown pindah kota.
2. Pencarian `Cari pekerjaan` untuk buruh, `Cari layanan atau buruh` untuk penyedia kerja; tombol Filter di samping.
3. Pemilih tenaga `Semua / Ringan / Sedang / Berat`.
4. Grid kartu bergambar dua kolom. Tidak ada hero promosi, sapaan panjang, judul Beranda, atau carousel otomatis sebelum hasil.
5. Navigasi lima tab yang tetap.

Kategori, jenis pekerjaan, serta pengurutan berada pada satu sheet Filter; tampilkan ringkasan pilihan aktif dan Reset. Lokasi/radius tetap pada sheet sendiri karena merupakan batas pencarian, bukan kategori. Filter berlaku sama pada Beranda dan Temukan dalam sesi akun; perubahan peran menghapus filter jenis yang tidak berlaku. Simpan kondisi per akun, bersihkan saat logout. Peta tetap default ketika tab Temukan dibuka.

Pencarian mencocokkan nama jenis pekerjaan, alias dan nama publik. Kata `galon` dapat menemukan jenis `Angkat galon penuh`; tidak memperluas pencarian ke luar kota/radius. Debounce, batas hasil dan validasi server tetap diperlukan. Urutan awal terdekat berdasarkan titik perkiraan; rating menjadi opsi urutan, bukan skor rekomendasi yang tidak dijelaskan. Saat filter kosong, tampilkan Reset filter; saat memang belum ada akun dekat, jangan menaruh akun di luar radius.

## 5. Kartu dengan gambar

**Disepakati pengguna:** ilustrasi aktivitas menjadi gambar utama kartu; foto asli buruh/tempat opsional sebagai identitas kecil dan pada detail. Cover tidak bergantung pada kelengkapan foto. Contoh media sintetis ditandai dalam demo. Alur lokal foto opsional pada bagian 9 sudah tersedia untuk evaluasi, termasuk preview, consent dan status pending; layanan live serta operasi moderasi/retensi/pembersihan masih tertahan. Delapan ilustrasi raster aktivitas belum tersedia; persetujuan bentuk media tidak berarti seluruh aset siap atau setiap detail rencana disetujui.

| Elemen | Kartu buruh, dilihat penyedia kerja | Kartu penyedia kerja, dilihat buruh |
| --- | --- | --- |
| Cover 4:3 | Ilustrasi aktivitas layanan utama, misalnya membawa galon | Ilustrasi aktivitas kebutuhan utama |
| Identitas | Foto asli kecil opsional + nama buruh; fallback ikon peran | Nama penyedia/tempat; thumbnail tempat opsional |
| Konteks | Satu layanan utama, misalnya `Angkat galon` | Satu kebutuhan aktif, misalnya `Bantuan angkat galon` |
| Metadata | Kecamatan + jarak perkiraan; rating sah dan jumlah ulasan | Kecamatan + jarak perkiraan; rating penyedia kerja dari pekerjaan sah |
| Tag | Maksimal dua layanan + jumlah sisanya bila perlu | Maksimal dua kebutuhan + jumlah sisanya bila perlu |
| Tenaga | Preferensi tenaga yang bersedia diterima; bukan klaim kemampuan medis | Ringan/Sedang/Berat berdasarkan rincian kebutuhan. Jika tidak cukup data: `Perlu rincian` |
| Aksi | Seluruh kartu membuka profil | Seluruh kartu membuka profil/kebutuhan aktif |

Foto bukan syarat melengkapi profil. Foto orang tidak dibuat AI seolah buruh asli; ilustrasi aktivitas juga tidak membuktikan pengalaman atau kondisi tempat. Cover tidak ditimpa nama/rating agar kontras stabil. Foto belum tersedia memakai ilustrasi yang memang terkait tugas, bukan placeholder kosong atau foto rumah acak.

Nama maksimal dua baris, konteks maksimal dua; upah/jadwal hanya tampil di detail jika benar-benar ada kesepakatan/rincian sah. Jangan menambah harga palsu, tarif per jam, badge terverifikasi, tombol favorit atau chat yang tidak diminta. Bila kartu terlalu padat di 320 dp, pindahkan tag kedua ke detail sebelum mengecilkan teks; font scaling dapat mengubah menjadi satu kolom.

Kartu penyedia saat ini adalah profil dengan kebutuhan, bukan listing lowongan. Model kebutuhan terstruktur harus ditambahkan secara eksplisit untuk mengklasifikasikan tenaga; tidak mengarang jumlah galon, harga atau waktu dari tag. Satu foto tempat tidak boleh mengungkap alamat tepat sebelum izin yang sesuai.

## 6. Seluruh halaman dan perubahan

| Layar / route sekarang | Komposisi dan prioritas | Perilaku dan state wajib |
| --- | --- | --- |
| Masuk `/` | Logo secukupnya, satu ilustrasi aktivitas, judul pendek, Masuk dengan Google; Coba demo sekunder | Pending login, batal, konfigurasi belum siap, error/retry. Kebijakan tetap mudah dibuka |
| Callback `/auth/callback` | Status memproses singkat, tanpa layar kosong atau dekorasi besar | Callback sah/tidak sah, cold start, batal, sesi kedaluwarsa; Ulangi masuk |
| Onboarding `/onboarding` | Tiga panel: pilih bantuan/layanan, temukan dalam radius, sepakati/COD. Satu ilustrasi konsisten tiap panel, judul satu-dua baris | Lanjut, Sebelumnya, Lewati; indikator aksesibel; tidak meminta izin sebelum konteksnya |
| Pilih peran `/role` | Dua pilihan vertikal besar dengan ilustrasi kecil: Cari kerja / Cari tenaga | Satu terpilih jelas, Lanjut. Edit peran menjelaskan dampak presence, tanpa menghapus riwayat |
| Lokasi `/location` | Ilustrasi pin sederhana, alasan GPS satu kalimat, radius chips, Aktifkan lokasi | Wajib untuk penemuan; denied/services off/inaccurate/unsupported city/stale/retry/settings. Demo memakai lokasi simulasi; bantuan/logout tersedia |
| Profil awal `/setup` | Nama, foto opsional, layanan/kebutuhan, kecamatan; isi bertahap dalam satu form yang jelas | Lewati tetap tersedia saat awal; draft/input dipertahankan. Picker kategori/tag dapat dicari; tidak menuntut foto atau KTP |
| Beranda `/home` | Lokasi, search/filter, pemilih tenaga, grid bergambar | Loading awal, refresh, kosong hasil vs kosong wilayah, gagal/retry, gambar gagal. Scroll/posisi dipulihkan setelah detail |
| Temukan `/discover` | Peta langsung, toolbar ringkas, kontrol kategori/tenaga yang sama melalui sheet, marker, status tampil sendiri | Hasil radius+kota; marker cluster/daftar; tile gagal; pengguna tidak otomatis tampil karena membuka peta. Atribusi dan zoom tidak tertutup overlay |
| Ringkasan marker (sheet) | Thumbnail aktivitas, nama, kecamatan/jarak, rating, kebutuhan inti, Lihat detail | Marker bertumpuk membuka daftar; status target off/expired tidak menawarkan kontak baru |
| Profil publik `/person/[id]` | Cover aktivitas, identitas, layanan/kebutuhan, tingkat tenaga beserta konteks, area, rating/ulasan; Hubungi di area aksi | Belum dinilai tidak diberi bintang palsu. Empty/error/retry, blokir/lapor, akses lintas radius ditolak server |
| Aktivitas `/activity` | Segmen Kontak/Pekerjaan; daftar dengan thumbnail kecil, nama/tugas, status, waktu | Aktif/Riwayat pada satu filter; unread tidak menimpa status; kosong sesuai segmen; refresh/error/retry |
| Permintaan kontak `/contact/[id]` | Identitas ringkas, status, persetujuan nomor, aksi yang sesuai pihak | Pending/accept/decline/revoke/expiry. WhatsApp hanya setelah consent sah; demo tidak membuka kontak sungguhan |
| Buat kesepakatan `/new-agreement` | Tugas, batas kerja, konteks tenaga, jadwal, total upah COD; ringkasan sebelum kirim | Validasi, draft guard, pending, repeated submission/conflict, kegagalan setelah commit. Foto tidak menggantikan rincian |
| Detail kesepakatan `/agreement/[id]` | Tugas sebagai fokus, pihak, jadwal, total upah, status dan langkah berikutnya; timeline ringkas hanya peristiwa yang nyata | Proposal/accept/cancel/completion/COD terpisah; status berubah/expired/network. Aksi utama menyesuaikan peran |
| Rating (sheet dalam agreement) | Nama pihak, lima pilihan bintang besar, komentar opsional, Kirim penilaian | Hanya peserta pekerjaan selesai; satu kiriman; pending/error; tampil Penilaianmu dan Penilaian untukmu |
| Notifikasi `/notices` | Daftar ringkas dikelompokkan hari, judul bermakna, waktu, titik belum dibaca | Tautan konteks sah; riwayat tidak tersedia punya recovery. Tanpa banner promosi atau title tab berulang |
| Akun `/account` | Foto/ikon, nama, peran; daftar kelompok Profil, Lokasi, Privasi/Bantuan; Keluar terpisah | Peran aktif terlihat; demo actor tools hanya saat demo; status restricted/deletion jelas |
| Edit profil `/setup?edit` | Struktur yang sama dengan setup, ditambah pratinjau kartu bila dibutuhkan | Foto/tag/bio opsional tervalidasi, crop/remove; loading/saved/error/draft guard. Hapus foto berbeda dari hapus akun |
| Nomor `/phone` | Nomor dan status; penautan/OTP hanya jika diperlukan | Format nomor, request bounded, OTP expiry/cooldown/retry; tidak mengklaim identitas terverifikasi dari nomor |
| Bantuan `/help` | Kelompok topik pendek, pencarian topik bila jumlahnya meningkat; detail dengan paragraf singkat | GPS, izin nomor, COD, rating, keselamatan; kanal bantuan hanya yang benar tersedia |
| Lapor `/report/[id]` | Konteks akun/pekerjaan, jenis masalah, uraian, Kirim laporan | Validasi, pending, receipt; jangan menjanjikan waktu respons operator yang belum tersedia |
| Kebijakan/privasi (sheet/reader) | Dokumen terbaca, judul/tanggal/tautan; bukan kartu dekoratif | Scroll, akses sebelum login, tutup/back, versi dokumen; jangan menyembunyikan syarat pada teks kecil |
| Penghapusan `/delete-account` | Penjelasan dampak singkat, konfirmasi, Ajukan penghapusan | Tidak mengaku data langsung terhapus; state requested/restricted, logout; tidak memakai ilustrasi perayaan |
| Dialog/sheet bersama | Filter, radius, katalog, gallery, confirmation; tinggi mengikuti konten | Fokus dan Back benar; scroll internal, safe area/IME; Escape/keyboard pada web; jangan menumpuk sheet |

`/intro-preview` tetap route pratinjau pengembangan, bukan tujuan navigasi pengguna. Halaman katalog lowongan, pelamar, dashboard operator, wallet dan pembayaran online tidak ditambahkan melalui penyegaran visual ini.

## 7. Katalog dan filter pekerjaan

Daftar luas dan baseline tenaga ada pada [JOB-CATALOG.md](JOB-CATALOG.md). Jenis pekerjaan dipisahkan dari tingkat tenaga. `Bersih-bersih` adalah kategori; `Mengepel` jenis; `Sedang` contoh tingkat berdasarkan rincian aktual. Satu jenis dapat memiliki lebih dari satu tingkat.

Tingkat tenaga bukan tingkat bahaya atau jaminan kemampuan. Konteks minimal menurut tugas: berat/beban bila ada, jumlah, durasi, lantai/lift, jarak angkut, alat dan jumlah tenaga. Data kurang tidak otomatis menjadi Ringan. Pekerja memilih layanan serta tingkat yang bersedia diterima; detail kebutuhan tetap harus dibaca.

Pilihan Lainnya membuka uraian, konteks dan usulan kategori. Tidak membuka tag bebas tanpa batas atau membuat jenis baru publik secara otomatis. Permintaan yang belum terklasifikasi tetap berlabel Perlu rincian; tidak muncul pada filter Ringan secara default. Aturan moderasi dan operasional kategori baru harus tersedia sebelum fitur Lainnya dipublikasikan. Tidak memerlukan AI classifier atau API berbayar.

## 8. Komponen reusable

| Komponen rencana | Fungsi / perubahan |
| --- | --- |
| ScreenShell / existing Page | Insets, lebar isi, scroll/keyboard, posisi aksi; hideTitle tab tetap |
| LocationControl | Kota terkunci dari GPS, kecamatan/radius, refresh lokasi |
| DiscoverySearch / FilterSheet | Kata kunci, kategori/jenis, tingkat tenaga, urutan, Reset/Terapkan; count hasil bila memang diketahui |
| EffortSelector / EffortLabel | Semua/Ringan/Sedang/Berat; label teks bukan warna saja; Perlu rincian terpisah |
| ActivityArtwork / MediaThumbnail | Rasio tetap, ukuran file varian, placeholder terkait jenis, cache, error fallback |
| PersonCard varian worker/employer | Satu struktur, perbedaan isi/label; cover dan identitas tidak tertukar |
| ProfileIdentity / ProfileMedia | Foto asli opsional, fallback, crop, hapus; informasi kepemilikan jelas |
| StatusRow / ActivityRow | Nama, tugas, status, waktu dengan baseline yang konsisten |
| RatingSummary / RatingForm | Reuse komponen sekarang; rapikan jarak dan state, tidak mengganti aturan server |
| FormSection / Existing Field | Label tetap, helper saat diperlukan, validasi dekat field, input tidak hilang |
| Pending / Empty / Error / Success | Pola bersama, tidak membuat versi copy dan ukuran baru per layar |

Pemilihan helper baru mengikuti kebutuhan nyata pada implementasi; tabel bukan kewajiban membuat package/component framework baru.

## 9. Data, foto dan keamanan yang perlu direncanakan

Model sekarang hanya Tag{id,label}, profil bertag, lokasi/rating. Usulan menambah katalog kategori/jenis, alias pencarian, artworkKey, baseline tenaga, kebutuhan konteks dan status kategori; kebutuhan aktif punya deskripsi/konteks/tingkat aktual; preferensi buruh terpisah. Rating target tetap akun dan peran dari kesepakatan, bukan gambar atau kategori baru.

Filter keyword/kategori/tenaga harus diterapkan di server sebelum limit hasil, bersamaan dengan batas kota/radius. Jangan memfilter hanya 40 hasil yang sudah diambil lalu menyimpulkan tidak ada akun. Bila hasil bertambah, tambahkan pagination/cursor berbatas; query/index diuji pada data staging. Perubahan skema, RPC dan allowlist Worker harus selaras.

Foto asli memerlukan Supabase Storage dan alur unggah baru: batas ukuran/jumlah, validasi isi/MIME di server, decode/re-encode, strip EXIF/GPS, key aman, ownership/RLS, penghapusan/replacement, akses publik yang sengaja disetujui, pelaporan dan moderasi. Preview lokal sebelum unggah; permission galeri hanya saat memilih foto; kamera bukan syarat. Pembulatan marker tidak menutupi alamat yang tampak pada foto, plat nomor atau nomor rumah; ingatkan dan sediakan crop/hapus. Jangan menyimpan dokumen identitas atau mengambil foto orang lain tanpa hak.

Asumsi ukuran awal untuk diuji, bukan kebijakan disepakati: satu foto identitas buruh atau tempat, unggahan asal maksimal 5 MB, hasil detail maksimal sisi panjang 1280 px, versi thumbnail dibuat server. Cover kartu tetap ilustrasi aktivitas. Artwork aplikasi lokal berbeda dari unggahan pengguna. Detail aset pada [ASSET-PLAN.md](ASSET-PLAN.md).

Tidak ada kredensial server dalam aplikasi. Jangan mematikan RLS, mengubah hak kontak atau menambah tracking background untuk memenuhi desain baru. Tidak ada migrasi produksi, aktivasi berbayar atau publikasi dalam pekerjaan perencanaan ini.

## 10. Urutan pengerjaan yang diusulkan

1. **Finalisasi rincian brief.** Media kartu sudah dipilih: ilustrasi aktivitas + foto asli opsional. Tetapkan kategori yang akan diaktifkan, aturan tenaga/konteks dan posisi foto asli. Rincian lainnya masih draf reviewable.
2. **Satu irisan lengkap.** Beranda, Filter, kartu dua peran dan detail dengan contoh menyapu, mencuci piring, serta angkat galon. Gunakan fixture sintetis, termasuk Perlu rincian. Validasi komposisi sebelum menyebarkan ke semua halaman.
3. **Fondasi komponen dan media.** Produksi aset gelombang awal, integrasi catalog/filter server, state gambar/error dan query; migrasi staging terkoordinasi.
4. **Alur awal dan peta.** Masuk/onboarding/peran/lokasi/profil/Temukan serta sheet/list, tanpa merusak pembatasan wilayah dan consent.
5. **Alur kerja dan akun.** Aktivitas, kontak, kesepakatan/COD/rating, Notifikasi, Akun, nomor, bantuan/lapor/privasi/hapus.
6. **Foto asli opsional.** Upload/storage/moderasi/retensi diuji sebelum dinyalakan; cover ilustrasi tersedia tanpa foto. Tidak menjadikan gambar dummy sebagai foto asli.
7. **Penerimaan native dan staging.** Review visual independen, dokumen yang terpengaruh, verifikasi aturan server dan perangkat; baru menilai kesiapan distribusi.

Tidak memberi estimasi biaya/hari tanpa cakupan aktivasi kategori, ketersediaan gambar dan perangkat. Tidak menambah publikasi lowongan atau sistem lamaran sebagai jalan pintas mengisi kartu.

## 11. Kriteria penerimaan

- Semua route pada tabel memiliki hierarchy/spacing/komponen yang sama sistemnya; tidak mengulang nama tab pada badan layar.
- Pengguna dapat mengenali jenis pekerjaan, kecamatan/jarak, rating dan pihak yang dihubungi tanpa membuka beberapa sheet. Uji tugas dengan calon pekerja serta penyedia kerja; hasil belum tersedia.
- Foto nyata, ilustrasi dan demo dibedakan jujur. Rasio media stabil saat loading/gagal; tidak ada lompatan layout atau gambar tak terkait.
- Telepon 320/360/390/411 dp, tablet/rail 600/840+, teks 1.0/1.3/1.5/2.0 diuji; tidak menahan fontScale untuk menyelamatkan dua kolom. Input/aksi tidak tertutup keyboard.
- Target Android 48 dp, contrast AA, label TalkBack, urutan fokus, non-color state, Back/predictive Back, denied permission, reduce motion dan offline/retry diperiksa pada perangkat.
- Filter gabungan dan Reset benar; jenis/tingkat yang tidak aktif tidak dipromosikan; Lainnya tidak melompati validasi. Search tidak dapat menghindari batas kota/radius atau blokir.
- Uji ulang peserta/sasaran rating, consent/nomor, COD dan account switch; foto lintas akun tidak dapat diubah/dihapus, EXIF/GPS tidak bocor.
- Ukur list scroll, waktu decode gambar, memori, startup, bundle, network dan baterai pada Android kelas menengah/bawah; target ukuran aset adalah anggaran, bukan hasil terukur.
- Dua ronde visual terbatas: capture gabungan, satu batch koreksi, konfirmasi; setelahnya reviewer independen dan dokumentasi. Browser tambahan tidak menggantikan bukti Android.
- Known release blockers lama tetap: Android runtime, Google/Phone/Maps config, direktori live, operasional/legal, staging dan advisory dependensi. Desain menarik bukan bukti kelulusan produksi.

## 12. Pemeriksaan rencana

PASS dokumen: referensi dan seluruh route aktual dipetakan; identitas/token tidak diganti; kategori/tenaga/risiko/media dibedakan; asumsi dan batas disebut; state/pemulihan/aksesibilitas dan rencana server/native tersedia. Pemeriksaan perencanaan ini bukan Delivery Gate UI. Pada 18 November implementasi lokal dan bukti Chrome telah tersedia; status aktual pada [TESTING.md](../TESTING.md) dan [gate implementasi](IMPLEMENTATION-GATE.md). Delapan ilustrasi, bukti Android runtime, layanan live dan disposition dependensi belum selesai; penerimaan tetap menunggu gerbang bagian 11.

| Blok gate rencana | Status / bukti |
| --- | --- |
| Hard Gate | PASS cakupan dokumen: tidak mengklaim UI baru sudah berfungsi, foto/ulasan nyata atau kelulusan produksi; media sintetis dan batas akses dinyatakan |
| Purpose Gate | PASS: alasan media, layout, font, warna, bentuk dan motion tercatat pada bagian 2–5; tidak menambahkan dekorasi atau library tanpa kebutuhan |
| Liveliness | PASS rencana: Operate, ENERGY 2 / RHYTHM 1 / MOTION 2; gambar aktivitas menjadi fokus, hijau/emas dan ritme kartu menjaga identitas. Render belum dinilai |
| Craftsmanship | PASS spesifikasi: semua route, loading/empty/error/retry, adaptasi teks/sentuhan dan rencana izin server/native dipetakan; penerimaan runtime tetap belum terverifikasi |

Pemeriksaan struktur dijalankan: tiga dokumen, 10 tautan lokal, 28 tabel valid sebelum tabel gate ini ditambahkan; 128 ID pekerjaan berurutan dalam 16 kelompok + Lainnya; 24 cover usulan terbagi A/B/C masing-masing delapan. Tidak ada tes aplikasi atau generation asset yang diperlukan untuk perubahan dokumen ini.
