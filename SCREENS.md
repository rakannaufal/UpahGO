# Halaman dan Alur Upahgo

Versi 0.3, 17 November 2026. **Katalog rancangan lebih luas daripada slice lokal yang sudah dibangun; bukan daftar seluruh fitur selesai.**

Implementasi UX lokal tersedia: Beranda grid dua kolom dari peran lawan; Temukan dengan peta, kelompok marker dan alternatif daftar; lima tab Beranda, Temukan, Aktivitas, Notifikasi, Akun; onboarding setelah login; pilih peran dan lokasi/radius wajib; profil boleh dilewati setelahnya. Progress, peran dan area pencarian disimpan per akun, terpisah dari profil publik. Profil minimum dan nomor terverifikasi tetap wajib untuk tindakan publik. Satu peran aktif yang dapat diganti melalui Akun diterapkan untuk evaluasi, belum merupakan persetujuan kebijakan bisnis final. [design/UX-PLAN.md](design/UX-PLAN.md) menjadi acuan slice terkini; katalog historis di bawah tidak memperluas fitur selesai.

Implementasi saat ini: onboarding, masuk Google (provider belum diaktifkan), profil/peran/tag/area, Beranda, Temukan, Aktivitas, Notifikasi, Akun, detail orang, permintaan kontak, kesepakatan/COD, laporan, blokir dan permintaan penghapusan. OTP dipakai untuk menautkan nomor setelah login Google, bukan metode login utama pada slice ini. Publikasi/lamaran, operator web dan halaman publik belum dibangun. Rute serta batas aktual: [README.md](README.md), [ARCHITECTURE.md](ARCHITECTURE.md), [TESTING.md](TESTING.md). Rincian di bawah tetap spesifikasi rencana bila belum tercakup implementasi.

Keputusan produk tetap dimiliki [prd.md](prd.md). Dokumen merinci **26 template Android**, 5 template operator web, 4 tujuan web publik. S-23 sampai S-26 menambahkan peta/profil marker/permintaan kontak pada 22 template sebelumnya. Jalur publikasi/lamaran tetap usulan pendukung dan dapat dipangkas saat P0 dikunci.

Satu template dapat dipakai pada beberapa langkah atau status. Onboarding tiga panel dihitung satu template; form bertahap satu template; ketentuan/privasi memakai satu pembaca dokumen. Dialog, picker, permission OS, serta status loading/error tidak dihitung sebagai halaman baru. Angka tersebut bukan jumlah route final atau estimasi biaya.

## Slice GPS dan penilaian — 17 November 2026

Lima tab tanpa judul badan berulang; judul detail tetap. Kartu dua per baris: nama, kecamatan, jarak perkiraan, rating, dua tag/+N; bio dan tag lengkap pada detail. Filter kecamatan/jenis pekerjaan, peta Leaflet/OSM aktual, lokasi/radius wajib setelah peran, profil opsional sesudahnya, penilaian bilateral setelah kesepakatan selesai. GPS denial/stale/kota tak terlayani menutup penemuan; akun lama tetap memiliki riwayat/Akun/bantuan. Demo Pekanbaru/riwayat seluruhnya sintetis, batas OSM aktual. Aturan/default pada [prd.md](prd.md), arsitektur pada [ARCHITECTURE.md](ARCHITECTURE.md), bukti pada [TESTING.md](TESTING.md).

Katalog bagian berikut menyimpan usulan historis (termasuk empat menu/publikasi) bila belum diganti oleh slice di atas; bukan kontrak implementasi terkini.

## 1. Batas keputusan

Sudah disepakati: nama Upahgo; Android; rencana Google Play; dua kelompok pengguna; seluruh Indonesia; bersih-bersih rumah; arah visual pengguna; dua peta akun aktif; kartu pekerja dengan tag layanan dan kartu pemberi kerja dengan tag kebutuhan; Hubungi mengirim permintaan sebelum WhatsApp tersedia; pembayaran COD.

Masih usulan: satu akun dua peran, pencatatan kesepakatan setelah komunikasi, total upah tetap dan waktu serah terima COD, batas layanan, verifikasi usia/identitas, expiry visibilitas/izin kontak, serta operasi pengaduan. Metode identitas dapat mengubah inventaris setelah D-04; tidak ada layar KTP/selfie yang diam-diam disetujui. Lokasi publik perkiraan dan consent nomor per pasangan merupakan rancangan perlindungan yang dirinci sebelum implementasi.

## 2. Navigasi utama yang diusulkan

| Menu | Tujuan | Isi utama |
| --- | --- | --- |
| Beranda | S-05 | Akses dua mode peta S-23, pengaturan tampil, serta daftar/pekerjaan pendukung sesuai daerah |
| Aktivitas | S-07 | Permintaan kontak S-25, kesepakatan/riwayat, serta lamaran/pekerjaan dipasang bila jalur pendukung diadopsi |
| Pemberitahuan | S-13 | Peristiwa pilihan, kesepakatan, penyelesaian, pembatalan, laporan yang memang boleh dilihat |
| Akun | S-14 | Profil, pengaturan, bantuan, dokumen, dan penghapusan akun |

Pada compact width gunakan navigation bar berlabel; pada expanded width gunakan rail/drawer sesuai [DESIGN.md](DESIGN.md). Detail, form, dan dialog mengikuti Back Android. Halaman autentikasi tidak menampilkan navigasi utama.

Usulan tujuan awal “Cari kerja” atau “Butuh tenaga” hanya mengubah prioritas tampilan Beranda, bukan membuat akun terpisah atau memberikan hak akses. Menu Aktivitas tetap dapat menemukan kedua jenis kegiatan. Akses “Pasang pekerjaan” tetap mudah ditemukan tanpa harus membuat akun baru.

## 3. Mulai, onboarding, dan autentikasi

### S-01. Sambutan dan onboarding

- **Tujuan:** menjelaskan manfaat serta cara kerja tanpa meminta pengguna membaca panduan panjang.
- **Pengguna/akses:** instalasi pertama; tersedia tanpa sesi. Dapat dibuka ulang dari bantuan bila dibutuhkan.
- **Panel 1:** “Temukan pekerja atau pemberi kerja.” Kenalkan dua peta dan tombol tampil/nonaktif atas pilihan sendiri.
- **Panel 2:** “Hubungi setelah disetujui.” Marker membuka profil; permintaan diterima sebelum WhatsApp tersedia. Nomor tidak diumumkan ke semua orang di peta.
- **Panel 3:** “Sepakati tugas dan upah, bayar COD.” Jelaskan pembayaran langsung di tempat dan perlunya mengonfirmasi penerimaan uang; tidak menjanjikan pekerjaan atau upah terjamin.
- **Aksi:** Lanjut, Lewati, Mulai, Sudah punya akun. Keduanya berakhir di S-02 jika belum punya sesi; tidak perlu jalur daftar dan masuk terpisah untuk OTP.
- **Perilaku:** boleh dilewati; tidak muncul setiap login. Simpan hanya penanda onboarding nonsensitif. Tanpa permintaan GPS, kontak, kamera, atau notifikasi pada tahap ini.
- **Tampilan:** putih, hijau logo, mint dan emas muda; teks singkat, indikator langkah; tidak membutuhkan foto, maskot, atau animasi besar. Logo pilihan digunakan sesuai DESIGN.md. Pembaca layar mengumumkan panel aktif; isi dapat digulir saat teks membesar.
- **Aset usulan:** IL-01/IL-02/IL-03 pada [inventaris aset](assets/README.md) menjelaskan penemuan, consent, serta kesepakatan/COD. Ilustrasi statis tidak memuat teks penting; dapat mengecil/disembunyikan saat ruang pendek agar penjelasan/tombol tetap terjangkau. Prompt dan file tujuan belum merupakan gambar final.

### S-02. Masuk atau daftar dengan nomor HP

- **Tujuan:** satu pintu masuk untuk pengguna baru dan lama.
- **Isi:** nama aplikasi sebagai teks, penjelasan penggunaan nomor, kode negara Indonesia, label nomor HP, contoh format, tautan privasi/ketentuan S-21, dan Bantuan masuk S-17.
- **Aksi utama:** Kirim kode. Masukan dinormalisasi dan divalidasi server; tombol memiliki pending dan batas kirim ulang.
- **Persetujuan:** jelaskan ketentuan sebelum pemanggilan Auth yang dapat membuat akun. Metode persetujuan dan dasar pemrosesan mengikuti kebijakan final; tidak menyatukan seluruh pemrosesan sebagai persetujuan wajib tanpa dasar.
- **Keadaan:** nomor tidak valid, batas permintaan, layanan SMS gagal, koneksi terputus. Pesan tidak membocorkan keberadaan akun secara berlebihan.
- **Berikutnya:** S-03; tidak ada kata sandi atau tombol lupa kata sandi pada alur OTP ini.

### S-03. Verifikasi OTP

- **Tujuan:** membuktikan akses ke nomor HP, bukan memverifikasi identitas orang.
- **Isi:** nomor yang dimasking, satu input kode yang mendukung paste/autofill, masa berlaku/cooldown nyata dari server, Ubah nomor, Kirim ulang, Bantuan masuk.
- **Aksi utama:** Verifikasi. Cegah pengiriman ganda; tombol tidak menyatakan berhasil sebelum server merespons.
- **Keadaan:** salah, kedaluwarsa, terlalu banyak percobaan, sedang memeriksa, status pengiriman belum diketahui, sesi dibatasi. Tidak mengirim OTP atau token ke log/analitik.
- **Berikutnya:** akun baru ke S-04; akun lengkap ke tujuan yang diizinkan atau S-05. Deep link awal baru dilanjutkan setelah pemeriksaan akses objek.

### S-04. Lengkapi profil dan tujuan awal

- **Tujuan:** memperoleh konteks minimum agar pengguna dapat melanjutkan.
- **Isi:** nama tampilan, kota/kabupaten, kecamatan, tujuan awal Cari kerja/Butuh tenaga; ringkasan pengalaman relevan untuk pekerja. Tidak meminta alamat lengkap rumah untuk profil publik.
- **Tag pekerja:** pilihan layanan bersih-bersih dari katalog dapat diisi saat ini atau melalui S-15; rekomendasi minimal satu tag diperiksa sebelum tampil siap di peta, bukan syarat menyimpan profil awal. Tag kebutuhan pemberi kerja diisi saat mengatur kebutuhan aktif pada S-23.
- **Aksi utama:** Simpan dan lanjut. Pemilihan tujuan dapat diubah; pengguna tidak kehilangan aktivitas peran lain.
- **Batas data:** foto, KTP, selfie, tanggal lahir, rekening, dan izin lokasi tidak dikumpulkan sebagai default. Bila syarat usia dewasa diadopsi, metode pemeriksaannya harus ditentukan; checkbox bukan bukti identitas/usia.
- **Keadaan:** daerah gagal dimuat, field belum valid, penyimpanan gagal. Masukan tetap ada selama sesi form aktif.
- **Berikutnya:** S-05. Akun yang belum memenuhi kebijakan verifikasi final tidak boleh menjalankan tindakan yang memerlukan verifikasi tersebut.

## 4. Beranda, pencarian, dan aktivitas

### S-05. Beranda

- **Tujuan:** membawa pengguna ke pekerja/pemberi kerja yang relevan dan tindakan kontak dengan cepat.
- **Isi bersama:** daerah pilihan, akses Peta pekerja/Peta pemberi kerja melalui S-23, status tampil sendiri, permintaan kontak yang perlu direspons, serta akses bantuan.
- **Prioritas pekerja:** akses peta pemberi kerja aktif. Jika jalur publikasi diadopsi, daftar pekerjaan terbuka dalam daerah berisi tugas, total upah, tanggal/jam/zona, estimasi durasi, dan area publik. GPS foreground valid wajib; kota dari server, filter kecamatan/radius mempersempit hasil.
- **Prioritas pemberi kerja:** akses peta pekerja aktif dan kartu layanannya. Jika jalur publikasi diadopsi, Pasang pekerjaan dan pekerjaan sendiri yang memerlukan tindakan tetap terjangkau.
- **Aksi:** buka dua mode peta S-23, atur radius/filter kecamatan, atur tampil, tinjau kontak S-25; daftar S-06/publikasi S-08 tetap jalur pendukung. Jarak yang dihitung dari titik perkiraan tidak boleh dinyatakan sebagai jarak tepat ke seseorang.
- **Keadaan:** daftar loading, daerah kosong, error/retry, pekerjaan baru saja terisi, pagination. Jangan mengisi ruang kosong dengan pekerjaan atau angka fiktif.
- **Hierarki visual:** isi putih, mint untuk pilihan/tag layanan, emas muda untuk kebutuhan/upah, aksi utama hijau; satu ringkasan hijau bila informasi benar-benar perlu diprioritaskan. Nilai mengikuti tokens.json, bukan palet per layar.
- **Kartu:** bila daftar akun aktif ditampilkan, gunakan WorkerCard/EmployerCard yang sama dengan S-23/S-24; tidak menambahkan profil fiktif atau daftar rekomendasi otomatis. Tag berlabel layanan atau kebutuhan sesuai peran.

### S-06. Detail pekerjaan

- **Pengguna:** pekerja yang menilai pekerjaan; tampilan publik terbatas untuk pengguna berizin sesuai kebijakan akses.
- **Isi:** judul, lingkup tugas/bagian rumah, durasi, jadwal dan WIB/WITA/WIT, daerah, alat/bahan, kondisi relevan untuk keselamatan, total upah, serta profil minimum pemberi kerja yang memang diizinkan.
- **Privasi:** alamat lengkap memerlukan izin kesepakatan kerja; nomor memerlukan persetujuan kontak terpisah dan dapat dibuka sebelum pekerjaan disepakati. Respons daftar/detail publik tidak memuat data privat untuk sekadar disembunyikan di UI.
- **Aksi utama:** Ajukan diri jika akun memenuhi syarat dan pekerjaan masih terbuka. Konfirmasi singkat merangkum tugas, upah, jadwal, dan konsekuensi lamaran.
- **Setelah melamar:** halaman yang sama menampilkan status lamaran dan Tarik lamaran bila masih diizinkan. Jika dipilih, arahkan ke S-12 untuk membaca serta menerima/menolak pilihan.
- **Keadaan:** sudah melamar, pekerjaan sendiri, penuh/terisi, kedaluwarsa, dibatalkan, akun dibatasi, atau konten tidak dapat diakses. Lapor tersedia melalui S-18 jika konteksnya sah.

### S-07. Aktivitas dan riwayat

- **Tujuan:** satu tempat untuk menemukan kegiatan akun, termasuk akses Permintaan kontak S-25; tidak perlu halaman riwayat pekerjaan terpisah.
- **Isi:** lamaran, pilihan menunggu respons, pekerjaan disepakati, pekerjaan yang dipasang, selesai/dibatalkan/kedaluwarsa. Setiap item menjelaskan peran pengguna serta siapa yang harus bertindak.
- **Filter usulan:** peran Semua/Pekerja/Pemberi kerja dan kelompok Aktif/Riwayat; penyajian akhir diuji agar tidak menjadi tab bertingkat yang membingungkan.
- **Aksi:** lamaran terbuka ke S-06; pilihan/kesepakatan ke S-12; pekerjaan dipasang ke S-10.
- **Riwayat:** mencatat status penyelesaian dan penerimaan upah secara terpisah; “Selesai” tidak otomatis “Upah diterima”.
- **Keadaan:** belum ada kegiatan, salah satu peran kosong, sinkronisasi gagal, objek berubah status saat dibuka. Hanya aktivitas milik akun yang ditampilkan.

## 5. Memasang pekerjaan dan memilih pelamar

Bagian ini jalur pendukung yang diusulkan. Orang dapat menemukan marker dan meminta kontak tanpa harus menerbitkan pekerjaan atau melamar terlebih dahulu. Bentuk pencatatan kesepakatan setelah percakapan WhatsApp masih harus dikunci pada D-01.

### S-08. Formulir pasang pekerjaan

- **Pengguna/akses:** akun yang memenuhi persyaratan untuk memasang pekerjaan. Usulan satu form bertahap, bukan halaman kategori yang belum diperlukan.
- **Langkah 1, tugas:** judul, lingkup pembersihan, bagian/ukuran rumah yang relevan, dan kondisi kerja yang perlu diketahui. Kategori bersih-bersih rumah sudah ditentukan.
- **Langkah 2, lokasi dan waktu:** kota/kabupaten/kecamatan, alamat lengkap privat, petunjuk akses yang diperlukan, tanggal, jam, estimasi durasi. Zona ditentukan dari daerah dan terlihat pada ringkasan.
- **Langkah 3, upah dan perlengkapan:** total upah rupiah, label COD/tunai di tempat, waktu serah terima sesuai kesepakatan, alat/bahan mengikuti D-02/D-03. Tidak ada checkout atau rekening.
- **Aksi:** Lanjut, Kembali, Tinjau pekerjaan. Pertahankan input saat berganti langkah dalam sesi aktif; penyimpanan lintas restart belum dijanjikan.
- **Validasi:** tugas terlarang/berbahaya, panjang teks, waktu lampau, nominal tidak sah, daerah tidak lengkap, serta nomor/alamat yang ditulis pada field publik ditangani sesuai kebijakan final.
- **Berikutnya:** S-09. Keluar dengan perubahan memerlukan peringatan kehilangan masukan; alamat tidak disimpan ke cache umum.

### S-09. Tinjau sebelum publikasi

- **Tujuan:** memastikan rincian benar sebelum mulai menerima lamaran.
- **Isi:** tugas, daerah, jadwal/zona, durasi, upah, perlengkapan, kondisi keselamatan. Pisahkan pratinjau publik dari alamat lengkap yang hanya untuk peserta berizin.
- **Aksi:** Ubah rincian kembali ke bagian terkait S-08; Terbitkan pekerjaan menjalankan validasi server.
- **Penjelasan penting:** rincian material dikunci sesuai usulan PRD; perubahan setelah terbit memerlukan pembatalan/publikasi baru. COD telah dipilih; nominal dan waktu serah terima mengikuti D-02.
- **Keadaan:** sedang menerbitkan, validasi gagal, jaringan putus setelah submit, status publikasi belum diketahui. Idempotensi dan sinkronisasi mencegah pekerjaan ganda.
- **Berikutnya:** S-10 setelah hasil publikasi diketahui. Keberhasilan berupa pesan inline/snackbar, bukan halaman sukses tersendiri.

### S-10. Kelola pekerjaan dan daftar pelamar

- **Pengguna/akses:** pemilik pekerjaan; bukan daftar pelamar lintas semua pekerjaan.
- **Bagian rincian:** ketentuan yang telah dipublikasikan, status pekerjaan, waktu, total upah, alasan pembatalan bila ada, dan tindakan yang masih sah.
- **Bagian pelamar:** nama tampilan, ringkasan pengalaman, status lamaran, serta akses ke S-11. Isi menggunakan data nyata yang telah diberi izin; tidak menambah rating.
- **Aksi:** tinjau pelamar, pilih satu lewat S-11, batalkan dengan alasan melalui dialog, atau buka kesepakatan S-12.
- **Keadaan:** belum ada pelamar, pilihan menunggu konfirmasi, terisi, kedaluwarsa, dibatalkan, error/retry. Selama satu pilihan aktif, pemilihan pekerja kedua dicegah dengan penjelasan.
- **Batas:** jangan menyajikan edit upah/jadwal/lingkup setelah terkunci; nomor hanya melalui izin kontak dua pihak, bukan dipublikasikan dalam daftar pelamar.

### S-11. Detail pelamar

- **Pengguna/akses:** pemilik pekerjaan terkait melalui S-10. Direktori akun aktif S-23/S-24 tidak memperluas akses ke riwayat/lamaran privat pada layar ini.
- **Isi:** nama tampilan, area, tag layanan pekerja, ringkasan pengalaman, lamaran pada pekerjaan ini, dan penjelasan verifikasi yang benar-benar dilakukan. Tag tidak memperluas akses ke kontak atau riwayat privat.
- **Aksi utama:** Pilih pekerja; dialog menampilkan pekerjaan, upah, jadwal, dan penjelasan bahwa pekerja masih harus menerima.
- **Privasi:** nomor HP, alamat pribadi pekerja, riwayat privat, dan laporan pihak lain tidak ditampilkan tanpa dasar/izin yang sesuai.
- **Keadaan:** lamaran ditarik, akun dibatasi, pekerjaan terisi, pilihan lain masih aktif, atau respons server konflik. Setelah memilih, kembali ke status aktual S-10/S-12.

## 6. Kesepakatan, pelaksanaan, dan penyelesaian

### S-12. Detail pilihan dan kesepakatan

Satu template bersama, dengan aksi berdasarkan aktor dan status server; tidak membuat layar baru untuk setiap status.

| Tahap | Isi | Aksi pekerja | Aksi pemberi kerja |
| --- | --- | --- | --- |
| Menunggu penerimaan | Tugas, daerah, jadwal/zona, upah, batas konfirmasi yang benar-benar berlaku | Terima pekerjaan atau Tolak pilihan | Lihat status menunggu; pembatalan sesuai aturan |
| Disepakati | Snapshot tugas/jadwal/upah, alamat berizin, status izin kontak, petunjuk keselamatan | Buka WhatsApp bila izin berlaku atau minta kontak; Ajukan selesai/lapor | Buka WhatsApp bila izin berlaku atau minta kontak; lapor/batal |
| Penyelesaian diajukan | Ringkasan pekerjaan dan pihak yang perlu merespons | Lihat status; ajukan bantuan bila tidak direspons | Konfirmasi selesai atau Laporkan masalah |
| Selesai | Riwayat penyelesaian dan status penerimaan uang COD | Nyatakan Upah sudah diterima setelah memegang uang atau laporkan belum menerima | Lihat pengakuan penerimaan pekerja; bukan settlement bank |
| Ditolak/kedaluwarsa/dibatalkan | Status dan alasan yang boleh dilihat | Kembali ke aktivitas/pencarian; lapor jika relevan | Kembali ke pekerjaan sendiri; tindakan berikut sesuai status |

- **Konfirmasi:** menerima, membatalkan, mengajukan/menyetujui selesai, dan mengakui upah memakai dialog/ringkasan konsekuensi. Pengakuan upah tidak boleh dicentang otomatis atau diasumsikan dari diamnya pengguna.
- **Privasi:** pemilihan/kesepakatan tidak otomatis memberikan consent nomor. Nomor memerlukan request diterima; alamat memerlukan izin objek kerja. Akses setelah penutupan mengikuti retensi serta pencabutan masing-masing.
- **Komunikasi:** WhatsApp sesudah permintaan kontak disetujui, dibuka atas aksi pengguna. Upahgo tidak mengirim pesan otomatis atau membaca percakapan eksternal.
- **Keselamatan:** Lapor/Bantuan mudah ditemukan; menghentikan pekerjaan tidak aman tidak bergantung pada selesainya perubahan status aplikasi.
- **Kegagalan:** jadwal bentrok, pilihan kedaluwarsa, sesi berakhir, koneksi gagal, submit ulang, pihak lain mengubah status, dan tenggat respons lewat memiliki pesan serta pemulihan. Tidak ada sukses lokal sebelum server menyetujui.

## 7. Pemberitahuan, akun, dan pengaturan

### S-13. Pemberitahuan

- **Isi:** permintaan kontak/penerimaan/penolakan, pilihan kerja, pembatalan, penyelesaian, perkembangan laporan yang diizinkan. Item memuat waktu dan status dibaca; membuka notifikasi tidak otomatis menerima permintaan.
- **Aksi:** buka objek terkait, lalu server memeriksa izin serta status terkini; jangan mempercayai isi push sebagai keputusan akhir.
- **Keadaan:** kosong, sedang memuat, gagal, objek sudah tidak tersedia, akses dicabut. Push yang terlambat/duplikat tidak mengubah status pekerjaan.
- **Izin:** penjelasan notifikasi dapat muncul sesudah manfaatnya jelas, misalnya lamaran pertama. Penolakan izin tidak menghalangi daftar peristiwa ini.
- **Privasi:** payload lock screen tidak memuat alamat, nomor HP, token, atau isi laporan sensitif.

### S-14. Akun

- **Isi:** nama tampilan, nomor dimasking, daerah, ringkasan pengalaman bila relevan, serta status verifikasi yang benar-benar tersedia.
- **Menu:** Edit profil S-15, Pengaturan dan privasi S-16, Bantuan S-17, Laporan saya S-19, dokumen S-21, dan Hapus akun S-22.
- **Aksi:** ubah tujuan awal, akses kedua peran, keluar melalui konfirmasi. Logout membersihkan sesi/cache dan melepaskan perangkat dari pengiriman akun sebelumnya.
- **Batas:** tidak menampilkan saldo, level pekerja, penghasilan terverifikasi, atau foto wajib yang belum ada dalam MVP.
- **Keadaan:** profil gagal dimuat, sesi berakhir, akun dibatasi; kebijakan pemulihan/keberatan diarahkan ke bantuan yang benar-benar tersedia.

### S-15. Edit profil

- **Isi:** nama tampilan, daerah, ringkasan pengalaman, serta picker tag layanan pekerja dari katalog. Kebutuhan pemberi kerja dikelola pada S-23, bukan dianggap keahlian profil. Perubahan tercermin sesuai proyeksi/izin profil dan tidak mengubah kesepakatan lama.
- **Aksi:** Simpan perubahan, Batal/Back. Validasi server, pending, field error, serta peringatan perubahan yang belum tersimpan.
- **Batas:** tidak mengubah pemilik/role operator/status verifikasi lewat field pengguna. Perubahan daerah profil tidak mengubah alamat/jadwal kesepakatan yang telah dibuat.
- **Nomor HP:** tidak diganti melalui field biasa; perubahan nomor/pemulihan memerlukan jalur aman yang akan ditetapkan pada F-01 dan SECURITY.md.

### S-16. Pengaturan dan privasi

- **Isi:** status tampil per peran dan area publik, izin lokasi/notifikasi, izin kontak yang pernah diterima, penjelasan data, serta blokir milik sendiri. Detail request/izin kontak berada di S-25/S-26.
- **Aksi:** buka pengaturan notifikasi OS, lihat akun yang diblokir, buka blokir dengan konfirmasi jika kebijakan ini diadopsi. Daftar blokir memakai subview/sheet; bukan direktori akun.
- **Keadaan:** izin ditolak/permanen, kembali dari OS, daftar blokir kosong, operasi gagal. Label mengikuti keadaan OS nyata.
- **Batas:** lokasi foreground wajib untuk penemuan; denial menutup penemuan tetapi akun lama tetap dapat membuka riwayat/Akun/bantuan. Tidak menambah pelacakan background, dark mode, bahasa tambahan, atau izin kamera. Off peta tidak otomatis membatalkan pekerjaan atau mencabut nomor yang sudah dibagikan.
- **Keputusan:** mekanisme buka blokir adalah usulan pengelolaan tindakan yang reversibel; efek pada pekerjaan aktif tetap mengikuti laporan/keselamatan.

## 8. Bantuan, keselamatan, dan laporan

### S-17. Bantuan dan keselamatan

- **Akses:** tersedia setelah login; varian bantuan masuk tanpa sesi hanya menampilkan informasi umum.
- **Isi:** cara memakai peta dan visibilitas, consent/WhatsApp, COD dan upah tak dibayar, batas pembersihan, keselamatan, masalah OTP/nomor hilang, jam/kanal dukungan yang nyata.
- **Aksi:** baca panduan; jika memiliki konteks akun/pekerjaan, laporkan melalui S-18; buka Laporan saya S-19; gunakan kontak bantuan yang telah dioperasikan.
- **Pemulihan:** jelaskan proses verifikasi aman ketika akses nomor hilang. Tidak menjanjikan akun pulih hanya dari pengakuan, tidak memintas OTP melalui operator, dan tidak meminta KTP melalui kanal publik tanpa rancangan/otorisasi.
- **Keadaan:** konten gagal dimuat atau kanal belum beroperasi harus jujur. Jangan menampilkan FAQ, nomor telepon, jam layanan, atau janji darurat fiktif.

### S-18. Buat laporan

- **Isi:** pekerjaan/akun/permintaan kontak yang sah sebagai konteks, kategori masalah termasuk kontak mengganggu, uraian, dan penjelasan data yang dipakai. Penerima tidak perlu sudah memiliki pekerjaan untuk melaporkan spam kontak.
- **Kategori usulan:** upah belum diterima, tidak hadir, tugas tidak sesuai, kondisi berbahaya, perilaku tidak pantas, penyalahgunaan akun. Label final mengikuti operasi laporan.
- **Aksi utama:** Kirim laporan. Opsi blokir interaksi baru dapat ditawarkan sesuai konteks dengan konsekuensi jelas, bukan otomatis menghilangkan pekerjaan aktif.
- **Batas data:** tanpa lampiran foto/video, unggahan identitas, atau lokasi langsung dalam MVP. Batasi uraian dan cegah pengguna tanpa izin memperoleh konteks pekerjaan lewat form.
- **Keadaan:** validasi, pending, gagal, hasil pengiriman belum diketahui, laporan duplikat. Sukses memberi nomor referensi dan mengarah ke S-20.

### S-19. Laporan saya

- **Isi:** laporan yang diajukan akun sendiri, nomor referensi, kategori/konteks minimum, waktu, serta status operasional yang disetujui.
- **Aksi:** buka S-20. Sediakan loading, kosong, gagal/retry, dan akses dicabut.
- **Privasi:** tidak menampilkan laporan yang diajukan pihak lain atau catatan internal operator.
- **Batas:** label seperti Diterima/Ditinjau/Selesai adalah status penanganan, bukan bukti pihak terlapor bersalah atau upah telah dibayar.

### S-20. Detail laporan

- **Isi:** uraian milik pelapor, status, waktu kejadian penanganan yang boleh dibagikan, hasil/tindak lanjut, serta kanal bantuan terkait.
- **Aksi:** baca perkembangan, kembali ke pekerjaan jika masih berizin, atau ikuti instruksi bantuan yang sah. Bukan chat admin real-time.
- **Privasi:** catatan internal, data pelapor lain, keputusan investigasi yang belum boleh dibuka, dan data pihak lain dibatasi server.
- **Keadaan:** masih menunggu, ditinjau, selesai, gagal memuat, tidak berhak. Jangka respons hanya ditampilkan jika ada komitmen operasi nyata.

## 9. Dokumen dan penghapusan akun

### S-21. Pembaca kebijakan dan ketentuan

- **Template reusable:** Kebijakan privasi dan Ketentuan penggunaan adalah dua dokumen, memakai satu pembaca yang sama; dapat diakses sebelum login.
- **Isi:** judul, versi/tanggal berlaku yang nyata, bagian yang dapat dibaca TalkBack, serta kontak pihak yang benar-benar bertanggung jawab.
- **Aksi:** buka tautan resmi yang diizinkan dan kembali ke langkah sebelumnya tanpa kehilangan masukan form.
- **Keadaan:** loading, dokumen tidak tersedia, error/retry. Teks legal final memerlukan peninjauan; tidak mengisi dokumen dengan klaim kepatuhan generik.
- **Batas:** perubahan kebijakan tidak otomatis dianggap telah disetujui hanya karena halaman pernah dibuka; mekanisme persetujuan mengikuti kebutuhan hukum/produk final.

### S-22. Penghapusan akun

- **Isi:** data yang akan dihapus/dipisahkan identitasnya, data yang perlu ditahan beserta alasan/jangka waktunya, dampak pada pekerjaan aktif/laporan, serta langkah permintaan.
- **Aksi:** verifikasi kepemilikan sesuai kebijakan keamanan, Kirim permintaan, atau Batal. Alasan penghapusan opsional; jangan membuat penghapusan bergantung pada survei.
- **Keadaan:** verifikasi gagal, permintaan sedang diproses, berhasil diterima, status penghapusan/retensi, atau gangguan layanan. Tidak menjanjikan semua backup langsung hilang.
- **Setelah akses dicabut:** presence peta dimatikan, permintaan baru/akses nomor dihentikan, pengguna keluar. Tindak lanjut melalui kanal terverifikasi; tidak membuka data lewat ID/token URL publik. OTP setelah penghapusan tidak mengaktifkan akun lama diam-diam. Nomor yang sudah tersalin di WhatsApp tidak dapat ditarik kembali.
- **Keputusan terbuka:** retensi, verifikasi ulang, pekerjaan yang belum selesai, status akun selama proses, dan jalur perkembangan setelah logout mengikuti D-10. Fitur belum dapat dirilis sebelum aturan ini jelas.

## 10. Peta dan permintaan kontak

### S-23. Peta pekerja dan peta pemberi kerja

- **Dua mode:** Cari Pekerja untuk akun yang siap menerima pekerjaan; Cari Pemberi Kerja untuk akun yang sedang membutuhkan tenaga. Satu template/SDK dipakai ulang, kedua sumber marker tetap terpisah dan berlabel.
- **Isi:** area/viewport yang dipilih, marker aktif yang masih layak/belum expired, clustering bila padat, waktu/keterangan kesegaran yang sesuai. Marker dibedakan label/bentuk, bukan hanya warna.
- **Aksi penemuan:** pilih marker untuk kartu ringkas pekerja/pemberi kerja; Lihat detail ke S-24, Hubungi melalui alur consent S-26. Pindah area lalu Cari di area ini; ganti mode; pilih Peta/Daftar. Daftar memakai kartu, data, dan izin yang sama agar aksesibilitas tidak bergantung membaca peta.
- **Aksi pemilik:** Siap menerima pekerjaan atau Sedang mencari pekerja, pilih area perkiraan, baca siapa yang dapat melihat, lalu konfirmasi tampil. Aktif/nonaktif perlu hasil server; tidak aktif otomatis karena login atau melihat orang lain.
- **Tag sebelum tampil:** pekerja meninjau layanan profil; pemberi kerja memilih kebutuhan saat ini dari katalog bersih-bersih. Usulan 1 sampai 5 tag, minimal 1 saat aktif. Saat aktivasi ulang pemberi kerja meninjau kebutuhan lama, bukan menayangkannya otomatis. Tidak wajib memasang pekerjaan.
- **Lokasi:** GPS foreground wajib, radius dipilih saat onboarding; server menentukan kota/kabupaten. Marker publik dibulatkan dan memakai pusat area sah jika keluar polygon; bukan posisi rumah/GPS tepat. Tidak memerlukan izin background.
- **Privasi:** beri label Lokasi perkiraan dan batas masa tampil. Tidak menyatakan pengguna pasti berada di marker atau jarak tepat ke orang tersebut. Kontak/alamat tidak dikirim pada daftar marker.
- **Keadaan:** izin ditolak/perkiraan saja, GPS tidak tersedia, area kosong, vendor/tiles gagal, koneksi terputus, target baru off, expiry, akun dibatasi, marker bertumpuk. Data usang tidak boleh diam-diam memulai permintaan baru.
- **Performa:** permintaan dibatasi viewport/hasil; clustering dan refresh terkendali, bukan seluruh Indonesia atau fetch setiap frame saat panning. Hindari marker animasi terus-menerus.

### S-24. Profil ringkas marker

- **Pengguna/akses:** dibuka dari marker/daftar yang sah. Pengecekan aktif/expiry/blokir diulangi pada server saat direct lookup; tidak ada jalur menebak ID untuk membuka profil tersembunyi.
- **Isi pekerja:** WorkerCard dengan nama tampilan, label Pekerja, area perkiraan, seluruh tag layanan yang dipilih, ringkasan pengalaman opsional, dan status siap menerima jika masih aktif. Rating agregat dari kesepakatan selesai tersedia; tanpa nominal tarif atau verifikasi identitas fiktif.
- **Isi pemberi kerja:** EmployerCard dengan nama tampilan, label Pemberi kerja, area perkiraan, kebutuhan saat ini dan seluruh tag tugas; jadwal/total upah hanya bila ada rincian sah terkait. Jika belum ada: Jadwal belum ditentukan / Upah belum disepakati. Label COD: Tunai di tempat. Tidak wajib menerbitkan pekerjaan sebelum tampil.
- **Bentuk kartu:** tiga tag pertama pada ringkasan, jumlah sisanya sebagai teks; S-24 memuat semua tag. Tag bukan tombol filter. Nama/label/tag mengikuti pembesaran teks, membungkus tanpa scroll horizontal; tidak menambah foto/unggahan sebagai syarat.
- **Aksi utama:** Hubungi. Konfirmasi menjelaskan nomor WhatsApp pengirim akan dibagikan kepada penerima hanya jika diterima; penerima harus menyetujui pembagian nomornya juga. Setelah dikirim, S-26 menampilkan pending.
- **Privasi:** nomor, alamat lengkap, riwayat privat, dan raw GPS tetap tidak ada di profil. Tombol WhatsApp baru tersedia jika grant untuk pasangan ini masih berlaku.
- **Keadaan:** request sudah pending, ditolak/belum boleh diulang, target off/expired, diblokir, akun sendiri, atau batas permintaan. Lapor/blokir tersedia sesuai konteks.

### S-25. Permintaan kontak

- **Isi:** tab/filter Masuk dan Terkirim, nama/peran lawan, konteks minimum, waktu, serta pending/diterima/ditolak/dibatalkan/kedaluwarsa/izin dicabut.
- **Akses:** dari Aktivitas, Pemberitahuan, Akun/pengelolaan izin, atau status request pada profil. Hanya pasangan terkait melihat request; operator kasus mendapat akses minimum yang sah.
- **Aksi:** buka S-26. Pending masuk memiliki Terima/Tolak melalui penjelasan consent; pending keluar dapat dibatalkan. Riwayat tidak menyimpan nomor dalam payload daftar.
- **Keadaan:** kosong/loading/error, request direspons pada perangkat lain, akun dibatasi/dihapus, pembatasan request ulang. Tidak menambah chat internal atau kolom pesan berantai.

### S-26. Detail permintaan dan izin kontak

- **Pending, pengirim:** tampil konteks dan Menunggu persetujuan, Batalkan, Lapor/Blokir bila relevan. Nomor pihak lain belum ada pada respons API.
- **Pending, penerima:** nama/peran/area/konteks pengirim; penjelasan siapa yang memperoleh nomor, lalu Terima dan bagikan nomor atau Tolak. Tidak otomatis menerima dari notifikasi, Back, atau membuka halaman.
- **Diterima:** kedua pihak dapat menekan Buka WhatsApp selama consent masih berlaku. Nomor tujuan diperoleh dari operasi server berizin; tidak berasal dari URL marker. Pengirim juga telah menyetujui pembagian nomornya saat mengajukan.
- **Buka WhatsApp:** hanya membuka layanan eksternal atas aksi pengguna, tanpa mengirim pesan otomatis. Jika tidak terpasang/nomor tidak tersedia, berikan fallback yang jelas dan tetap menjaga izin; tidak menambahkan panggilan/chat aplikasi secara diam-diam.
- **Pencabutan:** Cabut izin menutup pembukaan kontak berikutnya di Upahgo sesuai kebijakan. Jelaskan sebelum consent bahwa nomor yang sudah dilihat/disalin/dihubungi di luar aplikasi tidak dapat ditarik kembali.
- **State akhir:** ditolak, dibatalkan, expired, revoked, blocked, atau akun dibatasi tidak boleh mengembalikan nomor lewat API/cache/deep link. Batas waktu dan kapan dapat mengirim ulang menunggu D-14.
- **Batas bisnis:** consent nomor tidak mengonfirmasi pekerjaan, membagikan alamat lengkap, memastikan pihak aman, atau memastikan upah COD dibayar. Catatan pekerjaan mengikuti alur kesepakatan yang akan dikunci.

## 11. Dialog, sheet, dan state bersama

| Jenis | Dipakai di | Perilaku |
| --- | --- | --- |
| Pilih daerah | S-04, S-05, S-08, S-15 | Pencarian kota/kecamatan, loading/kosong/error; kota dari GPS valid server; kecamatan/radius hanya mempersempit hasil |
| Konfirmasi lamaran/tarik lamaran | S-06 | Ringkasan tugas/upah/jadwal; transisi hanya jika server menyetujui |
| Pilih pekerja | S-11 | Menjelaskan pilihan masih perlu diterima; cegah pilihan ganda |
| Terima/tolak pilihan | S-12 | Ringkasan kesepakatan dan konsekuensi, cek tenggat/jadwal |
| Batal pekerjaan | S-10, S-12 | Alasan wajib sesuai kebijakan, dampak ke pihak lain, status server aktual |
| Ajukan/konfirmasi selesai | S-12 | Penyelesaian tugas dipisahkan dari pengakuan upah |
| Upah diterima | S-12 | Hanya pernyataan pekerja terkait; tidak otomatis tercentang |
| Blokir/buka blokir | S-12, S-16, S-18 | Konsekuensi interaksi baru jelas; keselamatan kasus aktif tetap ditangani |
| Keluar/perubahan belum disimpan | S-08, S-14, S-15 | Tindakan serta potensi kehilangan input dijelaskan |
| Permission notifikasi OS | Konteks manfaat/S-16 | Dapat ditolak; fungsi inti tetap tersedia |
| Tampil/nonaktif dan area peta | S-05, S-16, S-23 | Pilihan sadar per peran; perubahan perlu hasil server; GPS foreground wajib untuk penemuan |
| Kirim/terima/tolak/cabut kontak | S-24, S-25, S-26 | Consent dua pihak, berlaku per pasangan; tidak otomatis berarti kesepakatan kerja |

Splash, pemeriksaan sesi awal, maintenance, offline, akses ditolak, objek dihapus, sesi kedaluwarsa, serta akun dibatasi merupakan state sistem bersama. Splash memakai logo pilihan tanpa delay buatan; kandidat launcher/adaptive tersedia di assets/brand/exports/android/, belum diuji pada perangkat. State sistem bukan tambahan menu atau puluhan halaman terpisah.

Semua form memiliki label/error yang aksesibel, pending, validasi server, perlindungan submit ganda, serta pemulihan input yang sesuai. Native Back, window insets, TalkBack, fontScale, reduced motion, layar sempit/lebar, dan keyboard mengikuti DESIGN/TESTING. Sebagian state diuji pada preview web sintetis; runtime Android belum diuji. Bukti terkini: TESTING.md.

## 12. Operator web dan tujuan web publik

### Operator, terpisah dari aplikasi pengguna

| ID | Halaman | Isi/aksi dan batas |
| --- | --- | --- |
| A-01 | Login operator dan MFA | Akun yang dibuat terkontrol; verifikasi faktor sebelum akses; pengguna biasa tidak memperoleh role admin |
| A-02 | Antrean laporan | Kasus, status/urgensi, penugasan sesuai hak; tanpa dashboard metrik fiktif atau ekspor massal |
| A-03 | Detail kasus dan moderasi | Konteks minimum pekerjaan/akun, catatan internal terpisah dari balasan yang boleh dibagikan, tindakan dan hasil yang diaudit |
| A-04 | Permintaan penghapusan | Antrean/rincian permintaan, verifikasi, retensi yang sah, dan pencatatan tindakan; akses sesuai penugasan |
| A-05 | Catatan audit | Aktor/tindakan/waktu/hasil yang disanitasi; baca terbatas, bukan fasilitas mengubah riwayat |

### Web publik pendukung distribusi

| ID | Tujuan | Batas |
| --- | --- | --- |
| W-01 | Kebijakan privasi | Isi/versioning sama dengan S-21; tidak ada data akun |
| W-02 | Ketentuan penggunaan | Isi/versioning sama dengan S-21 |
| W-03 | Bantuan dan kontak | Jam/kanal nyata; informasi pemulihan umum tanpa mengungkap data pengguna |
| W-04 | Permintaan penghapusan akun | Penjelasan serta proses verifikasi aman, rate limit, dan respons yang tidak membocorkan keberadaan akun |

Ini tujuan konten/akses, bukan persetujuan membangun landing page marketing. Satu aplikasi web dapat melayani seluruh kebutuhan tersebut; akses operator tetap privat.

## 13. Alur lengkap

**Pengguna baru aktual:** login Google, pengenalan, pilih peran, profil atau Lewati dulu, Beranda dan pilih area pencarian. OTP hanya untuk penautan nomor saat dibutuhkan. Pengguna lama dengan sesi sah langsung melanjutkan tujuan yang berizin; tidak mengulang onboarding/profil yang sudah lengkap.

**Peta dan kontak, jalur utama:** pengguna memilih area dan status tampil bila ingin ditemukan. Buka S-23 pada mode pihak yang dicari, klik marker ke S-24, kirim permintaan ke S-26. Penerima meninjau lewat S-25/S-26; setelah diterima, WhatsApp tersedia untuk pasangan itu. Tugas/jadwal/upah dibicarakan dan direkomendasikan dicatat sebelum kerja. Bayar COD di tempat; pengakuan uang diterima tetap terpisah dari pekerjaan selesai.

**Pekerja, jalur lamaran pendukung:** dari S-05 buka S-06, ajukan diri, pantau S-07/S-13. Saat dipilih, baca dan terima pada S-12. Ajukan selesai, tunggu konfirmasi, lalu nyatakan uang COD diterima jika benar-benar diterima. Riwayat di S-07.

**Pemberi kerja, jalur publikasi pendukung:** dari S-05 buka S-08, tinjau S-09, terbitkan/kelola S-10. Baca pelamar S-11, pilih satu, tunggu penerimaan S-12. Setelah pelaksanaan, konfirmasi selesai di S-12. Catatan uang COD dari pekerja terpisah.

**Masalah:** dari konteks sah buka S-18, lalu pantau S-19/S-20. S-17 tersedia untuk panduan/bantuan. Pembatalan, laporan, dan penghentian karena keselamatan tidak otomatis berarti upah telah dibayar.

## 14. Pemetaan kebutuhan PRD

| Fitur | Template yang mendukung |
| --- | --- |
| F-01 | S-02, S-03, S-04, S-14, S-17 |
| F-02 | S-04, S-11, S-14, S-15, S-24 |
| F-03 | S-08, S-09, S-10 |
| F-04 | S-05, S-06 |
| F-05 | S-06, S-07, S-10 |
| F-06 | S-11, S-12 |
| F-07 | S-12 |
| F-08 | S-12 |
| F-09 | S-13 |
| F-10 | S-07, S-10, S-12 |
| F-11 | S-12, S-16, S-17, S-18, S-19, S-20 |
| F-12 | A-01, A-02, A-03, A-04, A-05 |
| F-13 | S-02, S-16, S-21, S-22, W-01, W-02, W-03, W-04 |
| F-14 | S-05, S-23, S-24 |
| F-15 | S-05, S-16, S-23 |
| F-16 | S-07, S-13, S-24, S-25, S-26 |
| F-17 | S-04, S-05, S-11, S-15, S-23, S-24 |

## 15. Belum termasuk

Dompet/saldo, checkout, pembayaran dalam aplikasi, chat internal, pelacakan perjalanan/background, upload bukti/KTP/selfie, langganan, referral, promosi, kategori tambahan, serta iOS tetap di luar rancangan awal. Dua peta, consent kontak, WhatsApp setelah diterima, dan COD telah masuk berdasarkan permintaan terbaru.

Katalog historis onboarding, empat menu dan pengelolaan buka blokir memuat usulan tahap sebelumnya; navigasi aktual kini lima tab dan pengenalan setelah login. Daftar buka blokir tetap belum tersedia. Belum diuji dengan pengguna. Slice aktual dijelaskan di awal dokumen; katalog ini tidak menyatakan kelulusan gate native.

## 16. Implementasi aktual redesign — 18 November 2026

Bagian ini memperbarui inventaris implementasi; daftar template historis di atas bukan daftar fitur selesai. Lima tujuan tetap Beranda, Temukan, Aktivitas, Notifikasi dan Akun; tidak ada judul tab berulang di badan.

| Route/alur aktual | Isi dan batas |
| --- | --- |
| Beranda / Temukan | Dua kartu per baris; pencarian, kecamatan, kategori, jenis dan tenaga berbagi state per akun/peran. GPS kota/radius tetap wajib. Cover 4:3 masih pictogram aktivitas sementara; foto identitas kecil opsional terpisah. |
| `/job-catalog` | Katalog 128 pekerjaan/16 kategori, status tersedia versus rencana, pencarian dan usulan Lainnya privat pending. Live hanya enam tag lama, demo 18 tugas; tidak mengaktifkan kategori otomatis. |
| Detail profil / setup | Layanan/kebutuhan, tenaga diterima atau estimasi dari konteks, bio lengkap dan foto opsional. Konteks durasi/jumlah/beban/lantai/lift/jarak/pekerja/alat; Perlu rincian saat data kurang. |
| `/profile-photo` | Galeri, crop (native versus manual web), resize JPEG/preview, consent kepemilikan, draft, simpan pending dan hapus. Pending hanya pemilik; moderasi operasional belum tersedia. |
| `/new-agreement` | Pilihan tugas dan rincian konteks, jadwal/upah, lalu ringkasan review eksplisit sebelum kirim. Penyelesaian, COD dan penilaian tetap terpisah. |
| Aktivitas / Notifikasi / Akun | Kelompok kontak/kerja/status serta pengaturan ringkas; setup dan onboarding memakai kelompok terarah. Demo dan pending tetap diberi keterangan jujur. |

Delapan raster aktivitas belum dibuat, tidak ada foto orang nyata diimpor/dihasilkan. Bukti 41 capture Chrome bukan screenshot Android. [TESTING.md](TESTING.md) mencatat hasil lokal dan gerbang native/live/dependensi yang tetap terbuka. Publikasi lowongan/lamaran, operator web dan daftar buka blokir tetap ditunda.
