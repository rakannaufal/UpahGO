# PRD Upahgo

Versi: 0.7. Tanggal: 17 November 2026, Asia/Jakarta. Status: **Draf produk dengan implementasi lokal awal dan rencana penyederhanaan UX**.

Pengguna telah meminta pembangunan aplikasi, login Google, serta Cloudflare. Implementasi lokal mengikuti slice pada bagian berikut. Penggunaan layanan berbayar dan publikasi belum dilakukan. Fitur P0 pada katalog rencana tetap usulan; tidak semuanya diimplementasikan atau dianggap disetujui.

## Perubahan UX yang diterapkan lokal

Implementasi UX lokal tersedia: Beranda grid dua kolom dari peran lawan; Temukan dengan peta, kelompok marker dan alternatif daftar; lima tab Beranda, Temukan, Aktivitas, Notifikasi, Akun; onboarding setelah login; pilih peran dan lokasi/radius wajib; profil boleh dilewati sesudahnya. Progress, peran dan area pencarian disimpan per akun, terpisah dari profil publik. Profil minimum dan nomor terverifikasi tetap wajib untuk tindakan publik. Satu peran aktif yang dapat diganti melalui Akun diterapkan untuk evaluasi, belum merupakan persetujuan kebijakan bisnis final. [Rincian](design/UX-PLAN.md).

Dua peran yang diminta: Buruh dan Penyedia kerja. Rekomendasi **satu akun dengan satu peran aktif yang dapat diganti melalui Akun** belum disetujui pengguna; jangan memperlakukannya sebagai kebijakan final. Pilih peran wajib, browse tanpa profil publik, serta kelengkapan/verifikasi saat tindakan sensitif adalah rincian alur yang diusulkan pada rencana. Skip kini didukung akun/progress terpisah dan guard read-only server, tanpa membuat profil palsu. Peran dan lokasi/radius wajib sebelum penemuan; profil publik opsional untuk membaca sesudahnya.

## Status slice 0.1

Tersedia secara lokal: onboarding, profil/peran/tag, dua mode penemuan/peta, opt-in visibilitas, permintaan/persetujuan/penolakan/pencabutan kontak, jalur Google PKCE, penautan nomor, kesepakatan tugas/jadwal/upah, pencatatan hasil dan penerimaan uang tunai terpisah, kabar, blokir, laporan, permintaan penghapusan. Demo sintetis berfungsi tanpa akun. Google/Phone live, migrasi remote, direktori area nyata, Maps key dan deployment Cloudflare belum disiapkan. Android belum diuji pada perangkat.

Default untuk evaluasi, bukan kebijakan yang sudah dikonfirmasi: visibilitas 1 jam, permintaan 24 jam, grant kontak 30 hari, maksimal 5 tag, total upah Rp1.000–Rp50.000.000, jadwal sampai 1 tahun. GPS foreground wajib untuk penemuan; radius dan batas kota mengikuti ketentuan slice terbaru di bawah. Rincian pada ARCHITECTURE.md dan docs/SERVICES.md.

Lowongan/lamaran terpisah, wallet/escrow, push, admin web, dan penghapusan tuntas belum dibangun. Katalog halaman/fitur di bawah tetap peta rencana, bukan bukti penyelesaian.

## 1. Keputusan dan asumsi

### Disepakati

| Topik | Keputusan |
| --- | --- |
| Nama | Upahgo |
| Pengguna utama | Pekerja serabutan/buruh harian serta pemberi kerja yang membutuhkan tenaga |
| Platform awal | Android; rencana distribusi melalui Google Play Store |
| Cakupan | Seluruh Indonesia |
| Kategori pertama | Bersih-bersih rumah |
| Prinsip penggunaan | Sederhana bagi pengguna dengan pengalaman digital beragam |
| Brief desain | Cerah, menggambarkan energi pekerja keras, clean, modern, fun, responsif, animasi ringan |
| Logo | Gambar pilihan pengguna: pekerja bertopi, celemek emas, sapuan putih, bidang hijau. Sumber PNG di assets/brand/source/upahgo-logo-approved.png; aturan dan usulan turunannya di DESIGN.md |
| Penemuan melalui peta | Dua peta: pekerja aktif dan pemberi kerja aktif; marker dapat dibuka untuk melihat konteks dan menghubungi |
| Pembayaran awal | COD, uang diserahkan langsung di tempat; tanpa pembayaran dalam aplikasi |
| Hubungi dari peta | Kirim permintaan kontak; WhatsApp terbuka setelah penerima menyetujui |
| Kartu dan tag | Kartu pekerja menampilkan tag layanan yang dikerjakan; kartu pemberi kerja menampilkan tag kebutuhan pekerjaan |
| Permintaan implementasi | Bangun aplikasi, tambahkan login Google, gunakan Cloudflare; belum memiliki domain, siapkan konfigurasinya |
| Permintaan penyederhanaan UX | Beranda grid dua kolom dengan akun dari peran lawan; Temukan fokus peta; onboarding sesudah login baru dan profil dapat dilewati; label Notifikasi; copy singkat, komponen/alignment rapi. Diterapkan lokal; native/live belum terverifikasi |

### Usulan, belum disepakati

- Satu aplikasi dan satu akun yang dapat menjalankan kedua peran; pengguna tidak boleh melamar pekerjaan sendiri.
- Satu pekerja per pekerjaan; pemberi kerja memilih dari pelamar, lalu pekerja mengonfirmasi.
- Total upah tetap untuk tugas yang jelas; COD direkomendasikan setelah pekerjaan selesai. Nominal, waktu serah terima, serta penanganan sengketa perlu disepakati.
- Tanpa komisi selama uji awal. Model pendapatan jangka panjang belum dipilih.
- Alat dan bahan pembersih disediakan pemberi kerja.
- Peserta berusia minimal 18 tahun; metode pemeriksaan usia dan identitas belum ditetapkan.
- Alamat lengkap hanya untuk peserta yang telah sepakat. Permintaan kontak dapat dimulai sebelum kesepakatan; detail consent dua pihak, masa berlaku, dan pencabutan izin kontak masih perlu dirinci.
- Aktivasi diartikan sebagai pilihan sadar “Tampil di peta”, terpisah dari login. Lokasi publik berupa area perkiraan, bukan rumah/titik GPS tepat; ini rancangan perlindungan yang diusulkan.
- Operasi pengaduan dan moderasi dibantu operator manusia.
- Stack teknis pada bagian 4 merupakan rekomendasi.

Tagline “Cari tenaga. Temukan kerja.” masih usulan marketing. Pemeriksaan nama Upahgo di PDKI pada 16 November 2026 merupakan informasi yang dilaporkan pengguna; tidak diperiksa ulang dalam pekerjaan ini dan bukan jaminan hak merek.

## 2. Masalah dan hasil yang dituju

Pekerja membutuhkan pekerjaan yang lokasinya terjangkau, tugasnya dapat dipahami, serta upah dan jadwalnya jelas sebelum berangkat. Pemberi kerja membutuhkan cara menemukan tenaga, memilih orang yang sesuai, dan mencatat kesepakatan.

Hasil inti MVP: pekerja dan pemberi kerja dapat saling menemukan melalui dua peta, membuka marker/profil, menghubungi, menyepakati tugas/jadwal/upah, melaksanakan pekerjaan, dan membayar COD. Penerimaan uang dicatat terpisah dari penyelesaian tugas. Pemasangan pekerjaan/lamaran tetap merupakan jalur pendukung yang diusulkan, bukan prasyarat untuk menekan Hubungi dari peta.

Cakupan nasional berarti pengguna dapat mendaftar dan memasang pekerjaan dari berbagai daerah. Ketersediaan tenaga, jumlah pekerjaan, kecepatan mendapat pekerja, dan layanan lapangan tidak dijanjikan merata.

## 3. Pengguna dan peran

| Peran | Kebutuhan | Wewenang |
| --- | --- | --- |
| Pekerja | Menemukan pemberi kerja aktif, tampil siap bekerja, menanggapi/meminta kontak, menilai tugas/upah; melamar bila jalur pendukung diadopsi | Mengelola profil, visibilitas, izin kontak sendiri, serta pekerjaan/lamaran/kesepakatan yang berhak diakses |
| Pemberi kerja | Menemukan pekerja aktif, tampil membutuhkan tenaga, menanggapi/meminta kontak; publikasi/pemilihan pelamar bila jalur pendukung diadopsi | Mengelola profil, visibilitas, izin kontak sendiri, pekerjaan sendiri, dan kesepakatan yang diikutinya |
| Operator | Menangani laporan, moderasi, dan dukungan | Akses terbatas sesuai penugasan, dengan catatan audit |

Peran operator terpisah dari pilihan peran di aplikasi. Pengguna tidak dapat memberikan hak operator kepada dirinya sendiri.

## 4. Rekomendasi tech stack

| Area | Rekomendasi | Alasan |
| --- | --- | --- |
| Mobile | React Native + Expo + TypeScript | Satu aplikasi Android dengan akses kemampuan native dan jalur pengembangan iOS jika kelak disetujui |
| Navigasi | Expo Router | Mengelola alur layar dan tautan di lingkungan Expo |
| Backend/data | Supabase + PostgreSQL | Data relasional, autentikasi, kebijakan akses, dan transaksi tanpa membangun seluruh backend sendiri |
| Login | Supabase Auth dengan OTP nomor HP | Menghindari kewajiban email bagi pengguna; penyedia SMS dan kelayakan Indonesia harus diuji |
| Aturan bisnis | Transaksi/fungsi PostgreSQL; fungsi server untuk integrasi dan operasi istimewa | Keputusan pekerjaan dan hak akses ditegakkan di server |
| Admin dan halaman publik | Next.js + TypeScript | Panel operator serta halaman privasi/bantuan/penghapusan akun dalam satu web app |
| Sesi mobile | expo-secure-store | Penyimpanan sesi dengan perlindungan penyimpanan OS |
| Notifikasi | Catatan dalam aplikasi + expo-notifications, Expo Push Service/FCM | Peristiwa tetap terbaca ketika push terlambat atau ditolak |
| Validasi | Validasi server; skema TypeScript/Zod bila dibutuhkan | Validasi bentuk input konsisten tanpa mempercayai klien |
| Peta dan lokasi | Kandidat react-native-maps, lokasi foreground melalui API Expo yang kompatibel, pencarian geospasial PostgreSQL/PostGIS | Satu mesin peta dengan dua sumber marker; lokasi dan vendor dibatasi sesuai privasi/biaya |
| Pengujian | Unit/integrasi database; alat E2E Android dipilih setelah prototipe | Menguji aturan, izin, serta alur perangkat nyata |

Detail batas sistem ada di [ARCHITECTURE.md](ARCHITECTURE.md). Versi paket harus cocok dengan Expo SDK yang dipilih saat implementasi. Vendor OTP, hosting, push, CI, dan build belum diaktifkan; harga, kuota, lokasi pemrosesan data, serta kompatibilitas belum diverifikasi.

## 5. Alur utama yang diusulkan

1. **Masuk, lokasi dan profil.** Google login, pengenalan, pilih peran dan lokasi/radius foreground wajib, lalu profil opsional. Nomor diverifikasi terpisah sebelum tindakan publik. Ringkasan pengalaman pekerja tidak menjadi klaim identitas terverifikasi.
2. **Atur visibilitas.** Pekerja memilih “Siap menerima pekerjaan”; pemberi kerja memilih “Sedang mencari pekerja”, lalu memilih area yang boleh ditampilkan. Melihat peta tidak harus membuat diri sendiri tampil. Login tidak otomatis menyiarkan lokasi.
3. **Temukan pihak lain.** Pekerja membuka peta pemberi kerja; pemberi kerja membuka peta pekerja. Marker dapat diklik untuk melihat profil/kebutuhan minimum. GPS foreground wajib; server membatasi hasil dalam radius dan kota/kabupaten GPS. Filter kecamatan mempersempit hasil. Tidak ada pelacakan perjalanan.
4. **Minta kontak.** Hubungi mengirim permintaan yang terikat dua akun. Sebelum mengirim, jelaskan bahwa nomor WhatsApp pengirim akan dibagikan kepada penerima jika diterima. Penerima dapat menerima, menolak, atau memblokir; nomor belum dibuka saat pending.
5. **Buka WhatsApp.** Setelah persetujuan dua pihak tercatat, tombol WhatsApp tersedia untuk pasangan tersebut. Menyetujui permintaan tidak membagikan nomor kepada semua pengguna peta. Aplikasi tidak mengirim pesan WhatsApp otomatis dan tidak membaca percakapan eksternal.
6. **Catat kesepakatan.** Usulan pendukung: setelah berbicara, catat tugas, jadwal, peserta, dan total upah di Upahgo lalu minta konfirmasi pihak lain. Persetujuan kontak tidak otomatis menjadi kesepakatan kerja. Alamat lengkap dibuka/dibagikan hanya untuk pelaksanaan yang disepakati.
7. **Laksanakan dan bayar COD.** Uang tunai diserahkan langsung sesuai kesepakatan; usulan awal setelah pekerjaan selesai. Penyelesaian dan pengakuan uang diterima dicatat terpisah. Upahgo tidak menerima, menahan, atau menjamin dana.
8. **Tangani pengecualian.** Pembatalan, ketidakhadiran, kontak mengganggu, atau upah tak dibayar dapat dilaporkan. Mematikan visibilitas, mencabut izin kontak, dan menghentikan pekerjaan tidak aman adalah tindakan yang berbeda.

Jalur pemasangan pekerjaan/lamaran dari rancangan sebelumnya tetap usulan pendukung: pemberi kerja memasang rincian, pekerja melamar, satu pelamar dipilih lalu mengonfirmasi. Jalur ini tidak menjadi syarat untuk menemukan akun aktif dan meminta kontak dari peta. Prioritas akhirnya perlu ditentukan saat mengunci MVP.

## 6. Fitur dan prioritas rancangan

Peta, visibilitas, permintaan kontak, dan COD mengikuti keputusan terbaru. Fitur pendukung dari rancangan sebelumnya belum otomatis disetujui; khusus publikasi/lamaran dievaluasi terhadap alur peta sebelum mengunci P0.

| ID | Fitur | Perilaku yang harus tersedia |
| --- | --- | --- |
| F-01 | Akun dan sesi | OTP, masuk/keluar, penanganan nomor salah/kode kedaluwarsa, pembatasan kirim ulang, pemulihan akses yang aman |
| F-02 | Profil dasar | Nama tampilan, daerah, ringkasan pengalaman; kontak privat; penanda HP terverifikasi tidak menyatakan identitas terverifikasi |
| F-03 | Publikasi pekerjaan | Formulir, validasi, pratinjau, publikasi, daftar pekerjaan milik sendiri, pembatalan |
| F-04 | Pencarian daerah | Filter kota/kecamatan, urutan yang jelas, pagination, keadaan kosong dan coba lagi |
| F-05 | Lamaran | Melamar, menarik lamaran, melihat status; pemilik melihat pelamar untuk pekerjaannya sendiri |
| F-06 | Pilihan dan kesepakatan | Pilih satu pelamar, terima/tolak pilihan, cegah pilihan ganda dan benturan jadwal yang telah disepakati |
| F-07 | Detail pekerjaan aktif | Ringkasan kesepakatan, alamat/kontak sesuai izin, jadwal, langkah berikutnya |
| F-08 | Penyelesaian dan COD | Catatan penyelesaian terpisah dari pengakuan uang tunai diterima oleh pekerja; tidak ada checkout atau penyimpanan dana |
| F-09 | Pemberitahuan | Peristiwa permintaan/persetujuan kontak, pekerjaan, dan laporan; push opsional dengan daftar dalam aplikasi |
| F-10 | Riwayat | Pekerjaan/lamaran sendiri, status terakhir, waktu kejadian, alasan pembatalan yang relevan |
| F-11 | Keselamatan | Lapor, blokir interaksi baru, alasan laporan, petunjuk keselamatan, jalur bantuan |
| F-12 | Operasi admin | Antrean laporan, pemeriksaan konteks seperlunya, moderasi, pembatasan akun, catatan tindakan dan hasil |
| F-13 | Privasi dan akun | Ketentuan, kebijakan privasi, pengelolaan izin, permintaan penghapusan akun, status permintaan |
| F-14 | Dua peta penemuan | Peta pekerja dan peta pemberi kerja aktif; klik marker menampilkan profil minimum dan akses Hubungi; daftar tetap menjadi alternatif aksesibel |
| F-15 | Visibilitas/aktivasi peta | Pengguna memilih peran dan area, mengaktifkan/menonaktifkan tampil; expiry dan kondisi kelayakan diperiksa server; tidak otomatis aktif karena login |
| F-16 | Permintaan kontak dan WhatsApp | Hubungi mengirim permintaan; persetujuan penerima membuka WhatsApp bagi pasangan yang setuju; nomor tidak ada pada peta; tolak, batalkan, cabut izin, blokir, rate limit |
| F-17 | Kartu pekerja dan pemberi kerja | Kartu pada daftar/marker berisi identitas minimum, area, status, dan tag layanan pekerja atau kebutuhan pemberi kerja; detail/Hubungi mengikuti izin yang sama dengan peta |

### 6a. Kartu dan tag pekerjaan

Kebutuhan dua jenis kartu dan tag sudah disepakati. Rincian berikut merupakan usulan tampilan/data, belum keputusan final atas setiap field atau batas tag.

| Kartu | Informasi yang ditampilkan | Arti tag |
| --- | --- | --- |
| Pekerja | Nama tampilan, label Pekerja, area perkiraan, status Siap menerima pekerjaan jika aktif, ringkasan pengalaman opsional, Lihat detail dan Hubungi | Layanan yang dinyatakan dapat dikerjakan oleh pekerja; bukan sertifikasi kompetensi |
| Pemberi kerja | Nama tampilan, label Pemberi kerja, area perkiraan, kebutuhan saat ini, status Sedang mencari pekerja jika aktif, Lihat detail dan Hubungi | Tugas yang sedang dibutuhkan; bukan keahlian pemilik akun |

- Usulan katalog awal dalam kategori bersih-bersih rumah: Menyapu, Mengepel, Bersihkan kamar mandi, Bersihkan dapur, Bersihkan kaca terjangkau. Nama ini contoh usulan, bukan persetujuan menambah kategori lain. Kaca di ketinggian tetap di luar lingkup.
- Gunakan katalog yang sama agar kedua pihak memahami istilah yang sama. Pekerja memilih layanan pada profil; pemberi kerja memilih kebutuhan saat mengatur tampil di peta, tanpa diwajibkan memasang pekerjaan.
- Usulan batas: 1 sampai 5 tag sebelum tampil aktif; kartu ringkas menampilkan 3 tag pertama dan keterangan jumlah sisanya. Semua tag tersedia melalui Lihat detail. Profil awal tetap dapat disimpan sebelum memilih tag; status yang belum lengkap tidak ditampilkan seolah siap.
- Tag kebutuhan melekat pada kebutuhan aktif, bukan keahlian permanen pemberi kerja. Aktivasi ulang harus meninjau kembali kebutuhan lama. Tag profil tidak otomatis mengubah pekerjaan atau kesepakatan yang sudah dicatat.
- Jadwal dan upah pemberi kerja ditampilkan hanya jika ada rincian sah yang memang terkait. Tanpa nominal, gunakan Upah belum disepakati; tanpa jadwal, Jadwal belum ditentukan. Jangan mengarang tarif, rating, jumlah pengalaman, foto, atau verifikasi.
- Tag hanya merangkum layanan/kebutuhan. Tugas rinci, alat, jadwal, dan nominal COD tetap perlu disepakati. Tag tidak otomatis mencocokkan, memilih pekerja, atau membuka nomor/alamat.
- Kartu peta/daftar hanya untuk akun yang aktif dan boleh dilihat. Ringkasan pada konteks kerja yang sudah berizin tetap mengikuti izin objek tersebut, tanpa mensyaratkan pengguna terus tampil publik.

## 7. Aturan bisnis dan kasus tepi

- Upah harus positif, dinyatakan sebagai total untuk satu pekerjaan; rentang yang diizinkan dan kebijakan kepatuhan upah masih terbuka. Jangan menyebut nilai tertentu sebagai tarif resmi.
- Tanggal mulai harus di masa depan saat publikasi. Waktu disimpan sebagai UTC dan ditampilkan dengan zona pekerjaan: WIB, WITA, atau WIT. Tidak menganggap seluruh Indonesia memakai WIB.
- Tugas, jadwal, upah, dan alamat menjadi ketentuan material. Usulan sederhana: rincian dikunci setelah publikasi; perubahan material dilakukan melalui pembatalan dan publikasi baru dengan alasan.
- Pemilihan pelamar dan penerimaan pekerja harus atomik. Dua permintaan bersamaan tidak boleh membuat dua pekerja disepakati untuk satu pekerjaan.
- Pekerja boleh melamar beberapa pekerjaan. Konfirmasi ditolak bila waktunya bertabrakan dengan pekerjaan yang sudah disepakati; estimasi durasi dipakai sebagai rentang jadwal. Kebijakan jeda perjalanan belum diputuskan.
- Pilihan yang ditolak/kedaluwarsa dapat membuka kembali pekerjaan bila jadwal belum lewat. Batas waktu konfirmasi harus ditentukan sebelum implementasi fitur tersebut.
- Pekerjaan terbuka yang melewati waktu mulai ditutup dari pencarian dan diberi status kedaluwarsa. Pekerjaan yang telah disepakati tidak otomatis dinyatakan selesai atau dibayar.
- Pembatalan sebelum mulai memberi tahu pihak terdampak. Setelah waktu mulai, pembatalan/ketidakhadiran tetap dicatat dan dapat ditinjau operator; tidak ada denda atau pemotongan otomatis dalam usulan MVP.
- Jika pemberi kerja tidak merespons penyelesaian, tampilkan “menunggu konfirmasi” dan sediakan eskalasi. Jangan menganggap diam sebagai bukti pembayaran.
- Laporan terpisah dari status pekerjaan. Laporan dapat dibuka setelah pekerjaan selesai; operator tidak boleh mengubah catatan menjadi pembayaran terverifikasi.
- Blokir menghentikan interaksi baru. Pekerjaan aktif dan kebutuhan keselamatan ditangani melalui laporan; nomor yang sudah dilihat di luar aplikasi tidak dapat ditarik kembali.
- Permintaan tulis yang terkirim ulang karena jaringan tidak boleh membuat pekerjaan, lamaran, atau kesepakatan ganda. Jika hasil belum diketahui, ambil status dari server sebelum mencoba ulang.
- Status akun, status tampil di peta, dan status pekerjaan berbeda. Menonaktifkan peta tidak menghapus akun atau membatalkan kesepakatan yang telah dibuat.
- Pemberi kerja dapat menampilkan kebutuhan umum tanpa harus menerbitkan pekerjaan terlebih dahulu. Jika ada pekerjaan terbuka terkait, marker dapat menampilkan ringkasannya; jangan menjanjikan tugas/upah yang belum ditentukan.
- Rekomendasi lokasi publik: titik representatif area yang dipilih, diberi label “Lokasi perkiraan”. Jangan mengirim koordinat rumah/GPS tepat ke API marker atau menggeser titik privat secara acak setiap request yang dapat dirata-ratakan penyerang.
- Visibilitas dapat dimatikan, harus memiliki batas kedaluwarsa server, dan tidak diperpanjang oleh pembaca peta. Interval pembaruan/expiry belum diputuskan. Tidak ada pelacakan background dalam cakupan awal.
- COD mengurangi kebutuhan integrasi keuangan, tetapi tidak menjamin upah dibayar atau keselamatan pertemuan. Status selesai dan pengakuan uang diterima tetap terpisah.

## 8. Layar minimum

| Kelompok | Layar/kebutuhan |
| --- | --- |
| Akun | Penjelasan singkat, nomor HP, OTP, profil dasar, ketentuan |
| Pekerja | Cari kerja, filter daerah, detail pekerjaan, status lamaran/pilihan |
| Pemberi kerja | Formulir dan pratinjau pekerjaan, pekerjaan sendiri, daftar pelamar |
| Bersama | Detail kesepakatan, penyelesaian/upah, riwayat, pemberitahuan |
| Bantuan | Lapor, blokir, status laporan, petunjuk keselamatan, kontak bantuan |
| Pengaturan | Profil, privasi, izin notifikasi, keluar, penghapusan akun |
| Peta dan kontak | Dua mode peta, profil marker, kontrol tampil/area, permintaan kontak masuk/keluar, persetujuan, dan WhatsApp setelah diterima |
| Operator web | Login operator, antrean laporan, rincian kasus, moderasi, catatan audit |

Ini adalah inventaris kebutuhan, bukan keputusan navigasi atau tampilan final. Satu layar dapat memenuhi beberapa kebutuhan jika tetap mudah dipahami.

Rincian berada di [SCREENS.md](SCREENS.md): 26 template Android, termasuk empat tambahan peta/profil marker/daftar dan detail permintaan kontak pada 22 template dasar. Inventaris jalur pendukung dapat dipangkas saat P0 dikunci. Navigasi dan jumlah template bukan route final atau estimasi pengembangan.

## 9. Keselamatan, privasi, dan operasi

Pekerjaan di rumah pribadi menimbulkan risiko bagi kedua pihak: penipuan, pelecehan, alamat bocor, tugas berbahaya, kerusakan, ketidakhadiran, dan upah tidak dibayar.

- Lingkup awal diusulkan hanya pembersihan rumah biasa. Pekerjaan di ketinggian, bahan berbahaya, limbah berbahaya, dan tugas yang memerlukan kompetensi khusus dikecualikan.
- Pemberi kerja wajib menjelaskan kondisi yang berpengaruh pada keselamatan serta perlengkapan. Pekerja dapat menolak tugas di luar kesepakatan atau menghentikan pekerjaan yang tidak aman.
- Metode pemeriksaan identitas, usia, dan kecukupannya untuk pekerjaan di rumah belum diputuskan. Uji dengan pengguna asing diblokir sampai keputusan serta prosedur keselamatan siap.
- Jangan mengumpulkan KTP, selfie, rekening, riwayat perjalanan, atau foto rumah sebagai default. GPS foreground diperlukan untuk penemuan atas tindakan pengguna yang jelas. Fix tepat diteruskan melalui Worker ke RPC untuk validasi kota; tidak disimpan atau dicatat dalam log. Marker publik tetap perkiraan.
- Tetapkan operator, jam layanan, eskalasi, penanganan laporan mendesak, serta batas bantuan sebelum uji publik. Tidak menjanjikan bantuan darurat, asuransi, atau penggantian kerugian tanpa layanan nyata.
- Pengaduan terkait keselamatan atau upah memerlukan tindak lanjut manusia; keputusan sanksi dan jalur keberatan harus terdokumentasi.
- Retensi, penghapusan, dasar pemrosesan, penempatan data, dan akses vendor wajib diputuskan sebelum data nyata dikumpulkan. Rincian kontrol ada di [SECURITY.md](SECURITY.md).

## 10. Kebutuhan non-fungsional

- Bahasa Indonesia yang lugas; tanggal, angka, rupiah, dan zona waktu mudah dikenali.
- Target sentuh Android minimal 48 dp, label pembaca layar, dukungan TalkBack dan pembesaran teks, informasi status selain warna.
- Kontras minimum 4,5:1 untuk teks biasa dan 3:1 untuk teks besar/indikator yang relevan; verifikasi setelah warna ditetapkan.
- Daftar dipaginasi; usulan awal 20 item per halaman dan maksimum server 50. Batas panjang input, laju permintaan, dan kirim OTP ditegakkan server-side.
- Koneksi lambat/putus menampilkan status yang jujur dan retry. MVP tidak mengantre mutasi offline; masukan dipertahankan selama layar aktif tanpa mengklaim sudah tersimpan.
- Cache dipisahkan per akun dan dibersihkan saat keluar/berganti akun. Data alamat/kontak tidak dipersistenkan ke cache umum.
- Tombol aksi penting mencegah klik ganda; perlindungan server tetap wajib.
- Target awal untuk diuji: daftar awal dapat dipakai dalam 3 detik pada perangkat Android kelas menengah dan skenario jaringan 4G yang dicatat. Ini target rancangan, bukan hasil pengukuran.
- Rentang versi Android dan perangkat minimum ditentukan setelah memilih Expo SDK dan menguji perangkat calon pengguna. iOS belum termasuk target rilis.

## 11. Di luar MVP

- Dompet, escrow, pembayaran dalam aplikasi, penagihan komisi, dan pencairan dana.
- Lelang/negosiasi upah dalam aplikasi, kerja berulang, tim atau banyak pekerja per pesanan.
- Chat internal, lampiran/foto bukti, panggilan dalam aplikasi, serta pelacakan perjalanan/lokasi background. Komunikasi pilihan awal adalah WhatsApp setelah permintaan kontak diterima.
- Rekomendasi AI, prioritas berbayar, referral, promosi, langganan. Penilaian bilateral sudah masuk slice terbaru.
- Kategori pekerjaan tambahan, iOS, layanan asuransi, serta jaminan pekerja/upah.

Pemindahan fitur ke MVP memerlukan perubahan keputusan dan evaluasi risiko, bukan sekadar penambahan layar.

## 12. Kriteria penerimaan inti

| ID | Kriteria |
| --- | --- |
| AC-01 | Akun sintetis pekerja dan pemberi kerja dapat menjalankan alur utuh pada Android sampai selesai; penerimaan upah tetap tercatat terpisah |
| AC-02 | Pihak tanpa izin spesifik tidak memperoleh alamat, nomor, lamaran, atau riwayat privat lewat API/tautan; izin nomor berdasarkan persetujuan kontak dua pihak, sedangkan alamat/lamaran/riwayat mengikuti izin objek kerja |
| AC-03 | Pilihan dan konfirmasi bersamaan menghasilkan maksimum satu pekerja yang disepakati; benturan jadwal serta permintaan ulang diuji |
| AC-04 | Nomor salah, OTP kedaluwarsa, kirim ulang berlebihan, sesi berakhir, dan logout ditangani tanpa membocorkan sesi atau memberi akses yang salah |
| AC-05 | Tidak ada pekerjaan setempat, lamaran ditolak, pilihan kedaluwarsa, pembatalan, dan tidak hadir memiliki status serta langkah berikutnya yang jelas |
| AC-06 | Putus jaringan sesudah submit tidak menggandakan data; status dapat dipulihkan setelah tersambung lagi |
| AC-07 | Pengguna dapat melapor/blokir; operator berizin dapat menindaklanjuti dengan audit; admin palsu ditolak |
| AC-08 | TalkBack, pembesaran teks, target sentuh, keyboard, kontras, dan izin notifikasi ditolak diuji pada Android yang dicatat |
| AC-09 | Jalur penghapusan akun berjalan sesuai retensi yang telah disetujui; tidak meninggalkan akun aktif atau cache milik akun sebelumnya |
| AC-10 | UI tidak menyatakan identitas, pekerjaan selesai, atau pembayaran terverifikasi melebihi bukti yang dimiliki |
| AC-11 | Kedua peta hanya mengembalikan marker yang aktif, layak, belum kedaluwarsa, dan tidak diblokir; klik marker membuka konteks yang benar tanpa koordinat/kontak privat |
| AC-12 | Toggle off, logout, pemblokiran, penghapusan, expiry, dan pencabutan izin yang relevan ditangani; respons lama tidak mengaktifkan marker kembali; akses riwayat/Akun/bantuan tetap tersedia bagi akun yang sudah ada saat lokasi tidak sah |
| AC-13 | Hubungi mengirim permintaan; WhatsApp hanya terbuka atas aksi pengguna setelah persetujuan penerima dan consent berbagi nomor kedua pihak tercatat. Tolak spam/akses silang/pemalsuan persetujuan; kontak tidak menjadi kesepakatan kerja atau izin alamat |
| AC-14 | Alur COD tidak memiliki penarikan dana/checkout; hanya pekerja terkait dapat menyatakan uang diterima, dan pekerjaan selesai tidak otomatis membuat status tersebut |
| AC-15 | Kartu pekerja/pemberi kerja memakai tag layanan/kebutuhan yang benar, konsisten antara daftar dan detail; seluruh tag dapat dibaca pada teks besar/TalkBack, input tag divalidasi server, dan kartu tidak membuka nomor/alamat tanpa izin |

Skenario dan bukti yang diperlukan ada di [TESTING.md](TESTING.md). Sebagian kontrol slice lokal telah diuji melalui unit/SQL/browser sintetis; kriteria perangkat dan layanan live tetap belum terverifikasi. Hasil terkini ada di TESTING.md, bukan penerimaan seluruh katalog.

## 13. Validasi manfaat dan metrik

Validasi awal dilakukan dengan calon pengguna nyata dari kedua sisi. Cakupan pendaftaran tetap nasional; rekrutmen uji dapat dimulai dari jaringan yang dapat didampingi tanpa menjanjikan kepadatan nasional.

Ukur pencarian peta yang memiliki hasil relevan, permintaan kontak yang diterima, waktu sampai kontak disetujui, dan kesepakatan/pekerjaan selesai yang memang tercatat. Untuk jalur publikasi/lamaran jika diadopsi, ukur pekerjaan layak dan pekerjaan dengan pelamar. Pantau pengakuan upah diterima, pembatalan, ketidakhadiran, dan laporan. Definisikan periode serta penyebut sebelum menghitung rasio. Membuka WhatsApp tidak membuktikan percakapan/pekerjaan terjadi; bedakan tidak ada konfirmasi dengan kegagalan aktual.

Jangan mengirim alamat, nomor HP, isi laporan, atau isi tugas ke analitik. Usulan awal memakai agregat dari database operasional; SDK analitik pihak ketiga belum diperlukan. Target keberhasilan numerik ditetapkan setelah baseline, bukan dibuat seolah sudah terbukti.

## 14. Keputusan terbuka dan urutannya

| ID | Keputusan | Rekomendasi awal | Harus diputuskan sebelum |
| --- | --- | --- | --- |
| D-01 | Cara mencatat pilihan/kesepakatan | Penemuan dan Hubungi melalui peta disepakati; alur lamaran/undangan dan konfirmasi pekerjaan setelah percakapan masih perlu dirumuskan | Implementasi kesepakatan |
| D-02 | Nominal dan waktu COD | Metode COD disepakati; usulan total tetap dan serah terima setelah selesai; aturan upah tak dibayar masih perlu ditetapkan | Implementasi status upah |
| D-03 | Batas layanan | Pembersihan biasa, satu pekerja; alat/bahan oleh pemberi kerja | Formulir dan uji pengguna |
| D-04 | Usia, identitas, keselamatan | Dewasa; metode verifikasi dan prosedur belum dipilih | Uji dengan pengguna asing |
| D-05 | Operasional | Operator, jam layanan, eskalasi, moderasi, keberatan | Uji publik |
| D-06 | Batas konfirmasi dan jadwal | Kedaluwarsa pilihan; cegah jadwal tumpang tindih | Implementasi state machine |
| D-07 | Pendapatan | Tanpa komisi saat uji; evaluasi kemudian | Menawarkan layanan/biaya ke pengguna |
| D-08 | Stack dan anggaran | Rekomendasi bagian 4; pilih vendor OTP/hosting sesuai uji dan anggaran | Integrasi layanan/dependensi |
| D-09 | Detail desain visual | Logo pilihan pengguna sudah ditetapkan. DESIGN.md/token 1.0 merinci usulan warna, wordmark pendamping, komponen dan motion; studi layar belum komponen aplikasi | Implementasi antarmuka |
| D-10 | Data, kebijakan, dan kepatuhan | Minimasi; tetapkan retensi, penghapusan, vendor, dan tinjau ketentuan terkait | Pengumpulan data nyata |
| D-11 | Target Android dan distribusi | Validasi perangkat pengguna dan SDK; persyaratan Play terbaru | Build distribusi |
| D-12 | Jadwal dan anggaran pengembangan | Belum ada estimasi yang disepakati | Komitmen waktu/biaya |
| D-13 | Aktivasi dan privasi peta | Toggle sadar, area perkiraan, expiry server, akses akun berizin; presisi area dan durasi aktif belum dipilih | Implementasi direktori peta |
| D-14 | Masa berlaku dan pencabutan izin kontak | Kanal disepakati: permintaan diterima sebelum WhatsApp terbuka. TTL request/grant, consent nomor dua pihak, dan pemulihan nomor berubah perlu dirinci | Implementasi komunikasi/izin nomor |
| D-15 | Vendor peta dan biaya | Kandidat SDK peta Android serta PostGIS; pilih penyedia tiles/maps, batas API, atribusi, dan lokasi pemrosesan | Integrasi vendor peta |

## 15. Tahapan dan gerbang rilis

1. **Kesepakatan produk:** putuskan D-01 sampai D-06; validasi tugas dan alur dengan kedua kelompok pengguna.
2. **Persiapan teknis/desain:** putuskan D-08 sampai D-15 yang relevan, termasuk presisi/expiry peta, lifecycle izin nomor, dan vendor peta; sketsa alur, skema, izin, dan rencana uji. Tidak mengaktifkan layanan berbayar tanpa otorisasi.
3. **Alur internal:** bangun dan uji P0 dengan data sintetis, termasuk operasi admin dan kegagalan jaringan/izin.
4. **Uji terbatas:** peserta yang diotorisasi, operator siap, kebijakan dan prosedur keselamatan berlaku. Catat hasil serta revisi.
5. **Google Play:** audit dependensi/rahasia, uji perangkat, signing, halaman kebijakan, formulir store, dukungan, pemulihan data, dan persyaratan terbaru diperiksa. Publikasi memerlukan otorisasi.

Rilis ditahan jika otorisasi rusak, data pribadi terbuka, integritas pekerjaan bermasalah, temuan kritis/tinggi yang dapat dieksploitasi belum ditangani, atau operasi keselamatan belum siap. Tidak ada tanggal rilis maupun klaim siap produksi pada versi dokumen ini.

## Slice GPS dan penilaian — 17 November 2026

Keputusan terbaru pengguna: lima tab tanpa judul tab berulang di badan, kartu dua per baris, filter kecamatan dan jenis pekerjaan, peta geografis pada Temukan, GPS foreground wajib untuk penemuan, radius saat onboarding, hasil hanya dalam radius **dan** kota/kabupaten dari GPS, penilaian kedua pihak, serta demo lengkap dengan riwayat sintetis. Profil boleh dilewati setelah peran dan lokasi wajib selesai. Pergantian peran aktif melalui Akun tersedia untuk evaluasi; bukan kebijakan bisnis final.

Demo memakai Pekanbaru: 12 profil lawan/bukan diri (6 pekerja, 6 pemberi kerja) dan aktor `demo-me`; profil, posisi kecamatan, kontak, kesepakatan, ulasan dan peristiwa semuanya sintetis. Batas Pekanbaru berasal dari OSM, bukan geografi rekaan. Default 5 km menghasilkan 5 kartu peran lawan, 1 km 2 kartu, 10 km 6 kartu pada fixture awal. Tidak ada SMS, WhatsApp, pembayaran atau persetujuan layanan nyata. Niat cakupan tetap nasional; direktori live belum diprovisi. Satu kota demo tidak membuktikan cakupan live nasional.

Default implementasi untuk evaluasi: radius 1/3/5/10/20 km, awal 5 km; fix maksimum 5 menit, akurasi ≤1.000 m, toleransi masa depan 60 detik; kesegaran penemuan 30 menit. Server menentukan kota melalui polygon dari fix tervalidasi, tanpa pemilihan kota manual. Titik pencarian dibulatkan 3 desimal (sekitar 110 m), marker publik 2 desimal (sekitar 1 km), dengan pusat area sah bila pembulatan keluar polygon. Ini bukan jaminan anonimitas, identitas atau anti-pemalsuan GPS.

Lokasi ditolak, tidak akurat, kedaluwarsa atau di luar kota terlayani menutup penemuan/kontak baru; tidak ada fallback live ke demo. Akun yang sudah ada tetap dapat membuka Aktivitas, Akun dan bantuan. Pembaruan foreground dan saat aplikasi aktif kembali mempertahankan radius; tanpa watcher/service background. Login tidak mengaktifkan visibilitas. Logout mencoba menyembunyikan presence; jika jaringan gagal, kesegaran lokasi 30 menit atau expiry presence 1 jam membatasi sisa tampil.

Penilaian 1–5 integer, komentar opsional maksimal 300 karakter tanpa nomor/tautan: hanya peserta kesepakatan selesai, satu penilaian immutable per kesepakatan/pemberi ulasan. Server menentukan sasaran dan peran historis; agregat dipisah per peran. Pekerja dan pemberi kerja/tempat dapat dinilai. Penilaian, penyelesaian pekerjaan dan pengakuan uang COD tetap tindakan berbeda. Consent sebelum WhatsApp dan visibilitas opt-in tetap berlaku.

## Slice katalog, tenaga dan foto — 18 November 2026

Arah tetap native Operate (ENERGY 2 / RHYTHM 1 / MOTION 2), logo hijau/emas pilihan pengguna dan token yang sama. Lima tab tanpa judul badan berulang, dua kartu per baris; pencarian, kecamatan, kategori, jenis pekerjaan dan tenaga dibagi Beranda/Temukan dalam sesi per akun/peran, direset saat akun/peran berubah. GPS kota/radius, consent kontak, COD dan penilaian tetap berlaku.

`shared/job-catalog.json` memuat 128 pekerjaan/16 kategori; enam tag bersih-bersih lama aktif live. Demo mengaktifkan 18 tugas (J001–J016, galon dan kardus), bukan kategori live baru. Demo tetap **12 profil sintetis (6 per peran) + demo-me**, dengan konteks galon/kardus/cuci piring dan Ringan/Sedang/Berat/Perlu rincian. Entri katalog lain adalah rencana, bukan layanan tersedia. “Lainnya” mengirim usulan privat pending; tidak mengaktifkan kategori otomatis. Estimasi tenaga memakai konteks durasi, jumlah, beban, lantai/lift, jarak, pekerja dan alat; bukan batas angkat aman/penilaian medis. Kesepakatan menampilkan konteks dan review eksplisit sebelum kirim; COD terpisah.

Cover aktivitas masih pictogram Material resmi: manifest raster `ActivityMedia.tsx` kosong. Delapan ilustrasi Stage A belum dibuat; generator yang diizinkan tidak tersedia, fallback berbayar tidak diizinkan. Foto identitas/tempat opsional terpisah dari cover; galeri, crop, resize JPEG, preview, consent, draft dan hapus tersedia untuk evaluasi. Pending hanya terlihat pemilik, bukan persetujuan nyata. Tidak ada foto orang nyata dibuat/diimpor; fixture foto adalah bidang warna sintetis untuk tes. Rilis native/live dan ilustrasi tetap terbuka; lihat [TESTING.md](TESTING.md).

