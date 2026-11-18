# Rencana penyederhanaan Upahgo

17 November 2026. Status: **implementasi dan verifikasi lokal selesai; Android dan layanan live belum terverifikasi**. Dokumen ini merinci halaman dan perilaku slice; [DESIGN.md](../DESIGN.md) dan [tokens.json](tokens.json) tetap sumber identitas/token. Implementasi yang sudah ada dijelaskan pada [README.md](../README.md).

## 1. Permintaan pengguna dan rekomendasi

**Diminta pengguna:**

- Halaman lebih minimalis, rapi, mudah dipahami; hilangkan kata yang tidak membantu tindakan.
- Tambah Beranda dengan dua kartu per baris. Buruh melihat penyedia kerja; penyedia kerja melihat buruh.
- Dua peran pengguna: Buruh dan Penyedia kerja.
- Onboarding setelah login/pendaftaran baru; pengisian profil dapat dilewati lalu dilengkapi melalui Akun.
- Temukan berfokus pada peta dan titik akun aktif.
- Ubah seluruh label antarmuka Kabar menjadi Notifikasi.
- Onboarding mengikuti komposisi [referensi pengguna](references/onboarding-reference-2026-11-17.png), memakai identitas Upahgo.
- Tata komponen, teks, jarak dan posisi harus konsisten; kesiapan produksi dibuktikan melalui pengujian, bukan klaim visual.

**Rekomendasi diterapkan untuk evaluasi, belum kebijakan bisnis final:** satu akun dengan satu peran aktif, boleh diganti lewat Akun. Pilihan peran wajib sebelum Beranda; rincian profil opsional untuk menjelajah. Pengguna meminta pertimbangan kritis, belum menyetujui aturan pergantian peran.

| Pilihan peran | Manfaat | Kekurangan | Penilaian |
| --- | --- | --- | --- |
| Satu peran tetap per akun | Alur awal sederhana | Pengguna yang sesekali membutuhkan tenaga harus membuat akun lain; nomor, login dan riwayat terpisah | Terlalu membatasi untuk konteks pekerjaan harian |
| Dua peran sekaligus pada setiap layar | Semua fungsi cepat dijangkau | Feed, penanda, tag layanan/kebutuhan dan tindakan mudah tertukar | Terlalu ramai untuk MVP |
| Satu peran aktif, ganti melalui Akun | Beranda jelas; satu identitas dan riwayat; dapat melayani kedua kebutuhan | Memerlukan transisi peran yang benar | Direkomendasikan |

Jika rekomendasi dipilih: peran aktif hanya mengatur Beranda, profil terkait dan penanda baru. Pergantian mematikan penanda peta secara atomik; pengguna meninjau tag dan mengaktifkannya kembali sendiri. Riwayat dan permintaan tetap tersedia. Peran pekerja/pemberi kerja pada kesepakatan lama tidak berubah. Pergantian tidak memberi hak atas pekerjaan orang lain. Aktivitas lintas peran memiliki label peran singkat bila diperlukan.

## 2. Alur dan navigasi

**Pengguna baru:** Masuk dengan Google; onboarding pengenalan; pilih peran; isi profil atau Lewati dulu; Beranda.

**Pengguna lama:** Masuk; Beranda sesuai peran terakhir. Onboarding tidak diulang setiap login. Bila proses awal belum selesai, lanjutkan langkah yang belum tersimpan. Informasi onboarding dapat dibuka ulang dari Bantuan.

Pengenalan juga boleh dilewati. Pilihan peran tidak dilewati karena menentukan isi Beranda. Mengisi nama/area/tag tidak menjadi syarat membaca kartu atau peta. Nomor tidak diminta pada login Google atau dipublikasikan otomatis dari akun Google.

| Tab | Tugas tunggal | Bukan tempat untuk |
| --- | --- | --- |
| Beranda | Menelusuri kartu dari peran lawan | Peta besar atau seluruh pengaturan akun |
| Temukan | Melihat akun aktif di peta | Feed panjang di bawah peta |
| Aktivitas | Menindaklanjuti kontak dan pekerjaan | Pengulangan daftar notifikasi |
| Notifikasi | Membaca peristiwa/pembaruan | Menerima kontak atau pekerjaan tanpa meninjau detail |
| Akun | Profil, nomor, peran dan pengaturan | Form panjang yang selalu terbuka |

Lima tab berlabel, pola navigation bar Android pada layar kecil, rail pada expanded mulai 840 dp sesuai token. Tab tidak menampilkan tombol Kembali; layar detail/subhalaman menampilkannya dan mendukung System Back. Beranda menjadi tujuan utama setelah login. Menutup detail mempertahankan tab, posisi scroll, filter, dan titik peta sebelumnya.

### Akses ketika profil dilewati

| Tindakan | Syarat yang direncanakan |
| --- | --- |
| Melihat Beranda, peta, kartu dan profil publik | Sesi sah + peran dipilih; area pencarian boleh dipilih tanpa mengisi profil |
| Melihat Aktivitas/Notifikasi milik sendiri | Sesi sah; keadaan kosong tetap tersedia tanpa profil publik |
| Mengirim/menyetujui kontak | Profil minimum + nomor terverifikasi + consent untuk pasangan tersebut |
| Tampil di peta | Profil minimum, area dan tag relevan; direkomendasikan nomor terverifikasi agar akun yang tampil dapat dihubungi |
| Membuka WhatsApp | Izin kontak masih sah, lolos pemeriksaan server, tombol ditekan manual |

Profil minimum untuk tindakan publik: nama tampilan, area umum, peran dan setidaknya satu tag relevan. Bio dan foto tidak wajib. Penggunaan nama Google hanya saran yang ditinjau pengguna, bukan publikasi otomatis. Detail syarat tampil/nomor merupakan rekomendasi produk untuk dikonfirmasi.

Saat tindakan memerlukan data tambahan, tampilkan satu pesan sesuai kebutuhan, misalnya “Lengkapi profil untuk menghubungi”, dengan tombol Lengkapi profil. Setelah berhasil, kembali ke detail asal; tidak otomatis mengirim kontak, membagikan nomor atau menampilkan akun di peta. Pengguna menekan tindakan lagi.

## 3. Rencana setiap halaman

Halaman di bawah adalah tujuan tugas, bukan kewajiban membuat route untuk setiap dialog. Form yang sama dipakai kembali bila fungsinya sama. Tidak menambahkan lowongan/lamaran, chat, wallet atau kategori baru. Penilaian bilateral masuk melalui keputusan terbaru pada bagian GPS di bawah.

| Halaman | Isi yang terlihat | Aksi dan penyederhanaan |
| --- | --- | --- |
| 1. Masuk | Logo, satu judul, Masuk dengan Google; akses ketentuan/privasi | Tidak menampilkan tiga paragraf produk. Demo terpisah dan berlabel sintetis pada preview. Tampilkan gagal/batal masuk dan coba lagi |
| 2. Onboarding pengenalan | Tiga panel ringan, ilustrasi mekanisme, satu judul dan satu kalimat tiap panel | Lewati di atas; Lanjut pada panel 1/2; Pilih peran pada panel 3. Swipe opsional, tombol selalu tersedia |
| 3. Pilih peran | Pertanyaan “Kamu ingin apa?”; pilihan Cari kerja / Cari tenaga | Pilihan menampilkan nama peran Buruh / Penyedia kerja. Satu pilihan aktif, tombol Lanjut. Tidak mencampur form profil di sini |
| 3a. Lokasi dan radius | GPS foreground, kota dari server, radius | Wajib sebelum profil; demo berlabel simulasi Pekanbaru. Denial/akurasi/kota tak terlayani menutup penemuan; Coba lagi/pengaturan |
| 4. Lengkapi profil awal | Nama, area, tag sesuai peran; bio opsional | Simpan profil atau Lewati dulu. Tidak ada nomor, OTP, KTP atau permintaan GPS di form ini. Input tersimpan setelah berhasil, status selesai tidak berdasarkan tombol saja |
| 5. Beranda | Lokasi/radius, filter kecamatan/jenis pekerjaan, grid dua kartu per baris; tanpa judul tab berulang | Buruh melihat penyedia kerja aktif; penyedia kerja melihat buruh tersedia. Kartu membuka detail; tanpa tombol Hubungi berulang di setiap kartu |
| 6. Temukan | Peta geografis dominan, kota/radius/filter kecamatan, titik aktif, status tampil diri | Ketuk titik membuka satu ringkasan bawah. Lokasi perkiraan menjadi label pendek. Penjelasan rinci ada pada info. Alternatif daftar tersedia tanpa ditampilkan bersamaan sebagai feed panjang |
| 7. Aktivitas | Pilihan Kontak / Pekerjaan; daftar ringkas dan status yang memerlukan tindakan | Tidak menumpuk dua daftar panjang. Baris menampilkan pihak, konteks dan status; ketuk membuka detail. Riwayat tersedia melalui filter sederhana |
| 8. Notifikasi | Daftar peristiwa, waktu, tanda belum dibaca | Gunakan baris dengan pemisah, bukan kartu besar dan tombol pada setiap item. Seluruh baris dapat dibuka. Tanda baca bukan tanda menerima pekerjaan/kontak |
| 9. Akun | Nama/peran atau status profil belum lengkap; menu pengaturan | Edit profil, Nomor WhatsApp, peran jika disetujui, Bantuan/Privasi, Penghapusan, Keluar. Form nomor dan penghapusan dipindahkan dari halaman utama Akun |
| 10. Detail orang | Nama, area umum, tag, ringkasan layanan/kebutuhan | Satu aksi utama Hubungi; laporan/blokir pada menu sekunder. Nomor/alamat tidak ditampilkan. Konten lengkap tidak dipotong seperti kartu Beranda |
| 11. Detail permintaan kontak | Pihak terkait, status, batas izin bila relevan | Penerima meninjau consent sebelum Setujui dan bagikan nomor; pengirim melihat Menunggu. Setelah disetujui tersedia Buka WhatsApp, lalu Buat kesepakatan sebagai tindakan sekunder. Cabut/batal di bagian sekunder |
| 12. Buat kesepakatan | Tugas, jadwal/zona waktu, total upah; catatan batas pekerjaan | Halaman form khusus, bukan form panjang yang mengembangkan halaman kontak. Picker tanggal/jam native. Satu tombol Kirim kesepakatan; draft dipertahankan saat error |
| 13. Detail pekerjaan / COD | Tugas, pihak, jadwal, total upah dan status | Tindakan utama mengikuti tahap dan aktor: terima, ajukan selesai, konfirmasi hasil atau akui uang diterima. Tidak menampilkan semua tombol sekaligus. Penyelesaian dan pembayaran tetap terpisah |
| 14. Edit profil | Form yang sama dengan profil awal, data tersimpan terisi | Satu Simpan; peringatan perubahan belum tersimpan bila keluar. Perubahan publik tidak otomatis mengaktifkan penanda peta. Field error dekat input |
| 15. Nomor WhatsApp | Nomor/status verifikasi, ubah nomor, OTP hanya saat diperlukan | Form bertahap pada halaman tersendiri. Bantuan panjang di tautan info. Status kirim/ulang mengikuti layanan, tanpa timer atau keberhasilan palsu |
| 16. Bantuan dan privasi | Daftar topik singkat dan dokumen yang relevan | Penjelasan area/nomor/COD lengkap di sini, bukan di setiap layar utama. Dokumen wajib memiliki isi nyata sebelum rilis |
| 17. Laporan | Alasan, uraian kejadian, akun tujuan | Kirim laporan; setelah sukses tampilkan hasil singkat. Jangan menjanjikan waktu penanganan yang belum tersedia |
| 18. Penghapusan akun | Akibat tindakan, status permintaan, konfirmasi | Dipisahkan dari Akun. Jelaskan singkat bahwa permintaan belum berarti data terhapus saat itu. Kebijakan lengkap ditautkan, tanpa tombol destruktif dekat Keluar |

Halaman callback Google tetap teknis: status masuk atau gagal + Ulangi masuk. Bukan tab dan tidak berisi pengenalan produk lagi. Blokir tetap memakai konfirmasi singkat pada detail akun; daftar akun diblokir/unblock adalah kebutuhan lanjutan, belum diam-diam menjadi fitur yang disetujui.

## 4. Beranda dan kartu dua kolom

Mode: **Operate**, ENERGY 2 / RHYTHM 1 / MOTION 2, mengikuti brief Android. Identitas tetap hijau #014C24, emas #E5C282, mint/putih dan logo pilihan; tidak mengambil logo/palet oranye/ungu dari referensi.

Urutan: top bar Beranda + area; satu baris kategori/filter; hasil. Tidak ada hero besar, slogan, angka pengguna, banner tutorial atau panel status peta besar di atas kartu. Pengingat profil cukup satu baris Lengkapi profil yang dapat dibuka; jangan diulang di semua tab.

| Elemen kartu | Buruh yang dilihat penyedia kerja | Penyedia kerja yang dilihat buruh |
| --- | --- | --- |
| Identitas | Nama tampilan | Nama tampilan |
| Visual | Foto hanya bila fitur/sumbernya sah tersedia; sementara ikon/inisial netral yang jujur | Aturan sama, tanpa foto rumah/pengguna rekaan |
| Tag | Maksimal dua layanan pada kartu, sisanya +N | Maksimal dua kebutuhan pada kartu, sisanya +N |
| Area | Nama area singkat | Nama area singkat |
| Ringkasan | Bio opsional maksimal dua baris | Kebutuhan singkat maksimal dua baris |
| Interaksi | Seluruh kartu membuka detail | Seluruh kartu membuka detail |

Kartu tidak mengulang label peran jika konteks seluruh grid sudah jelas. Menampilkan rating agregat sah per peran dan jarak perkiraan; tanpa badge terverifikasi, jarak tepat, tarif atau upah rekaan. Angka upah hanya muncul jika ada data yang memang disepakati/ditetapkan melalui alur produk; profil penyedia kerja bukan lowongan baru terselubung.

Dua kolom menjadi default ponsel; jumlah ganjil menyisakan ruang satu kartu tanpa placeholder palsu. Kartu dalam satu baris mengikuti tinggi konten terpanjang dan batas teks yang sama. Pada 320 dp perlu diverifikasi tetap terbaca; bila teks diperbesar sampai merusak keterbacaan, satu kolom menjadi fallback aksesibilitas, bukan mengecilkan font. Pada tablet/web, pertahankan dua kolom dalam lebar isi terkendali pada slice ini; tidak menambah jumlah kolom tanpa alasan.

Area pencarian dan area tampil diri berbeda. Peran dan lokasi/radius wajib sebelum profil boleh dilewati. GPS tidak sah menutup penemuan; tidak mengisi grid dengan akun palsu atau lokasi acak. Beranda dan Temukan memakai sumber akun aktif/filter yang sama. Akun nonaktif, kedaluwarsa, diri sendiri, terblokir atau dibatasi tidak tampil. Urutan awal dapat memakai aktivitas terbaru yang nyata; jangan diberi label Rekomendasi atau Terdekat tanpa mekanisme/data pendukung.

## 5. Temukan sebagai peta

- Peta mengisi sisa layar di antara top bar ringkas dan navigasi bawah. Tombol area/filter ditempatkan tanpa menutup atribusi vendor.
- Default menampilkan peran lawan. Dua sumber peta tetap tersedia melalui filter **Lihat: Buruh / Penyedia kerja**; ini memilih isi peta, bukan mengubah peran akun.
- Tampil di peta adalah pilihan terpisah dari login. Kontrol ringkas menampilkan Nonaktif / Tampil beserta expiry saat aktif; rincian pengaturan dibuka saat ditekan.
- Ketuk titik: satu bottom sheet berisi nama, area, dua tag dan Lihat profil. Jangan membuka kontak otomatis. Ketuk titik lain mengganti isi sheet; Back menutupnya dulu.
- Beberapa akun dalam satu area dikelompokkan dengan jumlah nyata atau daftar sheet saat dipilih; jangan menyebarkan koordinat secara acak agar seolah berbeda lokasi.
- Label kecil **Lokasi perkiraan** selalu tersedia. Detail alasan tidak menjadi paragraf permanen. Publik tidak memperoleh alamat rumah atau raw GPS; slice memakai GPS foreground tervalidasi dan pembulatan lokasi tanpa pelacakan latar belakang.
- Alternatif Daftar menjaga filter dan pilihan area. Mendukung pembaca layar; tidak wajib melakukan gesture peta.
- Kegagalan peta menyediakan Coba lagi / Lihat daftar. Preview web memakai geografi Leaflet/OSM dan atribusi; akun, posisi dan aktivitas demo tetap berlabel sintetis.

## 6. Onboarding dari referensi

Yang diadaptasi: logo kecil di atas, ruang putih, visual mekanisme di tengah, judul tegas, deskripsi singkat, indikator langkah dan satu tombol utama di bawah. Yang tidak diambil: identitas WanderWise, foto destinasi, statistik/rating, isi travel, bingkai/status bar iPhone, serta dekorasi mahal. Implementasi memakai OnboardingArt.tsx: diagram UI native ringan, berlabel ilustrasi; tanpa raster baru, layanan berbayar atau perubahan logo.

| Panel | Judul | Satu kalimat | Visual yang direncanakan |
| --- | --- | --- | --- |
| 1 | Cari kerja. Cari tenaga. | Pilih akun yang sesuai di areamu. | Dua contoh kartu dari peran berbeda, tag bersih-bersih; konten contoh diberi konteks ilustrasi |
| 2 | Temukan di peta | Lihat akun yang sedang aktif. | Diagram area dengan marker dua peran, bukan peta rumah tepat atau dunia dekoratif |
| 3 | Sepakati. Kerjakan. Bayar tunai. | Kontak dibuka setelah disetujui. | Ringkasan izin kontak dan upah tunai; tanpa label pembayaran dijamin |

Visual tidak memuat informasi yang hanya dapat dipahami dari gambar. Panel memiliki label aksesibel dan indikator langkah yang bukan semata titik warna. Pada tinggi layar pendek/teks besar, visual mengecil lebih dulu dan konten dapat digulir. Tombol tetap di atas safe area, bukan menimpa teks.

Gerakan hanya perpindahan panel/feedback 160–200 ms dengan native API yang sudah ada; tanpa autoplay, parallax, animasi marker terus-menerus atau library baru. System Remove animations membuat transisi instan. Lewati tidak membuka profil publik atau melewati pemilihan peran.

## 7. Copy: singkat dan tepat waktu

Tidak ada subtitle otomatis di bawah setiap judul. Tidak mengulang tutorial di Beranda, Temukan, Aktivitas dan Notifikasi. Label field tetap ada; placeholder bukan pengganti label. Empty/error memakai satu kalimat dan satu tindakan pemulihan. Pesan panjang hanya di Bantuan atau saat konsekuensi tindakan perlu dipahami.

| Tampilan saat ini / pola yang dihindari | Rencana |
| --- | --- |
| Cari tenaga di areamu + paragraf penjelasan | Judul tab Beranda atau Temukan; area menjadi kontrol tersendiri |
| Bersih-bersih rumah. Kontak dibuka setelah saling setuju. | Hapus dari header; kategori sudah pada tag/filter; penjelasan consent berada saat kontak |
| Titik menunjukkan area umum. Beberapa akun dapat berada di titik yang sama. Gunakan daftar untuk melihat semua hasil. | Lokasi perkiraan + tombol info; akun bertumpuk ditangani UI kelompok/daftar |
| Kabar / Perbarui kabar / Belum ada kabar | Notifikasi / refresh melalui gesture atau aksi kecil / Belum ada notifikasi |
| Paragraf profil belum lengkap di beberapa tab | Satu baris Lengkapi profil di Akun/Beranda; gate kontekstual saat diperlukan |
| Tombol Lihat profil pada setiap kartu kecil | Seluruh kartu dapat ditekan, dengan semantik tombol dan feedback |
| Form verifikasi, bantuan dan penghapusan terbuka sekaligus di Akun | Menu ringkas menuju halaman masing-masing |

Teks yang **tetap wajib di konteksnya**: consent “Bagikan nomor WhatsApp dengan [nama]”; status Lokasi perkiraan; nominal dan zona waktu; status uang belum diterima; konfirmasi uang tunai; akibat blokir/penghapusan. Teks penting tidak dipindah seluruhnya ke info yang mudah terlewat. Tidak memakai klaim “COD lebih aman” atau “pengguna terverifikasi” tanpa bukti yang sesuai.

## 8. Kerapian komponen dan standar penerimaan

Kriteria berikut memandu implementasi lokal; penerimaan native/live tetap membutuhkan bukti terpisah. Gunakan komponen bersama dan token yang ada; jangan mengatur offset/font/radius berbeda untuk tiap layar.

| Komponen | Aturan tata letak dan teks | Pemeriksaan sebelum diterima |
| --- | --- | --- |
| Top bar | Tinggi minimum 64 dp; judul dan tombol sejajar; target ikon 48 dp; satu judul, tanpa subtitle default | Judul panjang, status bar/cutout, tombol Back dan teks besar tidak bertumpuk |
| Konten | Padding ponsel 16 dp, medium 24 dp, expanded 32 dp; satu garis awal untuk heading, input dan daftar | Tepi kiri/kanan konsisten; tidak ada margin kompensasi negatif |
| Grid | Dua kolom; gap 12 dp; padding kartu 16 dp, radius 24 dp sesuai token | Lebar berasal dari ruang tersedia, bukan angka lebar tetap; tinggi per baris selaras; nama/tag panjang diuji |
| Teks | Headline hanya untuk onboarding; halaman operasional memakai title; body 16/24, metadata 14/22 sesuai role token | Tanpa mengecilkan font agar muat; align kiri; pembatasan dua baris hanya untuk ringkasan kartu, bukan consent/upah/error |
| Kartu | Avatar/ikon, nama, area, tag dan ringkasan memiliki urutan/slot konsisten | Tidak ada kartu bersarang; target tekan jelas, label pembaca layar menyebut nama/peran/area |
| Tag | Gap 8 dp; maksimal dua pada kartu, semua di detail; tag panjang membungkus secara wajar | Tidak memotong makna menjadi singkatan samar; +N hanya bila jumlahnya nyata |
| Tombol | Tinggi minimum 56 dp, padding horizontal 20 dp; satu aksi utama per konteks | Label tidak terpotong; busy mencegah submit ganda; disabled memiliki alasan; bukan seluruh baris penuh tombol |
| Input | Tinggi minimum 56 dp; label tetap, helper hanya bila membantu atau ada error | Keyboard tidak menutup input/aksi; paste/OTP/autofill sesuai platform; nilai bertahan setelah kegagalan |
| List/menu | Ikon 24 dp dalam slot tetap; label sejajar; trailing icon/status di sisi akhir | Seluruh baris dapat ditekan; teks panjang tidak mendorong ikon keluar; pembeda dibaca/tidak bukan warna saja |
| Navigasi | Ikon dan label konsisten, lima tujuan; active state dari token | Label Notifikasi tidak dipotong; fontScale diuji; tidak ada dua tab terpilih atau route mati |
| Bottom sheet | Padding 16/24 dp, radius 28 dp; ringkasan singkat; maksimal satu primary action | Mendukung Back, fokus/screen reader, safe area; tidak menutup atribusi peta dan tidak meninggalkan fokus di belakang |
| Status/error | Inline dekat objek; satu pesan pemulihan; snackbar hanya untuk hasil sementara | Pesan sukses hanya setelah server sukses; error tidak membocorkan detail internal; demo tetap berlabel |

Jarak mengikuti skala 4/8/12/16/20/24/32 dp. Item terkait berjarak lebih rapat daripada kelompok berbeda; tidak menambah divider sekaligus shadow berat. Pilihan font, warna, border/focus dan motion tetap dari tokens.json. Perubahan varian kartu ringkas nantinya didokumentasikan pada sistem yang sama, bukan membuat token paralel.

### Matriks sebelum menyebut layak produksi

- Android nyata/emulator: navigasi, System Back, insets, keyboard, background/foreground, login/cold callback dan sesi. Browser hanya bukti preview.
- Layout 320/360/390/411/600/840 dp; nama panjang, dua tag panjang, bio kosong/panjang, jumlah kartu ganjil, fontScale 1.0/1.3/2.0. Fallback satu kolom saat diperlukan; tidak mengecilkan font.
- TalkBack: urutan baca, label kartu, tombol ikon, status terpilih, fokus sheet/dialog dan alternatif daftar peta. Target sentuh minimal 48 dp, jarak minimal 8 dp.
- Kontras AA sesuai token; tidak membuat teks putih di emas. Placeholder dan disabled tetap terbaca. Reduced motion mempertahankan semua konten/aksi.
- State setiap halaman: loading, kosong, gagal/retry, offline, expired, hasil sudah berubah, pending, sukses. Filter dan input dipertahankan setelah error; mutasi tidak otomatis diulang.
- Izin tetap di server. Akun tanpa profil boleh membaca hanya data publik yang diizinkan; tidak bisa tampil/meminta kontak dengan profil kosong. Uji aktor lain, expired grant, nomor berubah dan akun diblokir.
- Google/Phone, direktori area, Maps, Cloudflare staging dan kebijakan/operator harus disiapkan serta diuji sebelum rilis; penataan UI tidak menyelesaikan celah operasional tersebut.

## 9. Dampak teknis dan urutan pengerjaan

**Kondisi sebelum implementasi:** tombol Lewati saja tidak cukup. Layout utama dan SQL lama menolak pengguna tanpa profil. `profiles` sekaligus menjadi akar relasi kontak/pekerjaan, dan `bootstrap` belum memiliki status onboarding/peran yang terpisah. Jangan membuat nama/area/tag palsu untuk melewati validasi.

Rencana: pisahkan status pendaftaran/peran/onboarding dari kelengkapan profil publik, dengan satu sumber peran aktif. Pertahankan validasi profil minimum untuk tindakan publik. Read-only discovery boleh untuk akun bersesi yang memilih peran; pembatasan, blokir dan rate limit tetap berlaku. Simpan progress per akun di server; draft lokal bila diperlukan dibatasi per akun dan dibersihkan saat keluar. Detail skema/migrasi ditentukan pada tahap implementasi, menjaga data/foreign key yang ada.

| Tahap | Perubahan | Syarat selesai |
| --- | --- | --- |
| 1. Kontrak onboarding | Status pendaftaran, peran, profile completeness, read-only access, guard, migrasi dan tes SQL | Skip benar-benar bisa menjelajah; tidak membuat profil palsu; aksi publik tetap ditolak server jika belum lengkap |
| 2. Struktur utama | Tambah route Beranda, lima tab, label Notifikasi, tujuan login ke Beranda | Pengguna lama tidak terjebak onboarding; deep link/Back/logout tetap benar; route notices lama tetap dapat diarahkan bila dipertahankan |
| 3. Kartu dan halaman utama | PersonCard ringkas, grid dua kolom, peta memenuhi ruang, filter/area terkoordinasi | Akun lawan peran tampil, card/detail/peta konsisten; layar kecil/teks besar lolos |
| 4. Masuk/onboarding/profil | Pengenalan mengikuti referensi, pilih peran, profil opsional, resume dan gate kontekstual | Skip/Back/restart bekerja; tindakan sensitif tidak terjadi otomatis setelah profil lengkap |
| 5. Halaman pendukung | Sederhanakan Aktivitas/Notifikasi/Akun; pisah form kesepakatan, nomor, bantuan dan penghapusan | Aksi mudah ditemukan, copy singkat, draft/error/retry terpelihara |
| 6. Verifikasi | Tes regresi domain/SQL/browser, build, uji perangkat dan visual review satu batch | Bukti tercatat; blokir rilis bila native/live/otorisasi belum memenuhi syarat |

File terdampak nantinya: `apps/mobile/app/(tabs)/_layout.tsx`, route Beranda baru, `discover.tsx`, `notices.tsx`, `activity.tsx`, `account.tsx`, `index.tsx`, `setup.tsx`, detail kontak/pekerjaan; komponen `PersonCard`, UI/tema, session/api/contracts; migrasi baru dan tes. Gunakan migrasi tambahan, jangan mengubah migrasi yang sudah pernah diterapkan pada lingkungan lain. Dokumentasi arsitektur, PRD, sistem desain dan layanan ikut diperbarui saat implementasi.

## 10. Rekaman gate perencanaan historis

Rekaman berikut hanya untuk tahap perencanaan sebelum implementasi, bukan status source terkini. Kode aplikasi dan token browseMaxWidth kini berubah; hasil implementasi pada bagian 11 dan TESTING.md. Tidak ada layanan live diaktifkan. Referensi pengguna disalin sebagai bahan rencana, bukan aset aplikasi.

Gate ini menilai dokumen, bukan mengulang kelulusan aplikasi lama. PASS di bawah hanya berarti persyaratan rencana sudah tertulis; semua hasil runtime untuk rencana ini **belum diverifikasi**.

| Item | Hasil lingkup perencanaan |
| --- | --- |
| R-02 | PASS: copy usulan tanpa em dash |
| R-03 | PASS rencana: lebar/teks besar/fallback dijabarkan pada bagian 4/8; runtime belum diuji |
| R-17 | PASS: tidak menciptakan angka pengguna/performa |
| R-18 | PASS: tidak menciptakan testimoni |
| R-23 | PASS: navigasi/onboarding diminta pengguna, logo dipertahankan, referensi hanya bahan rencana; aset baru tidak dibuat |
| R-24 | N/A runtime: tujuan halaman dan ketergantungan route dirinci, bukan tautan yang diklaim bekerja |
| R-25 | PASS rencana: mempertahankan token AA; perubahan tampilan belum diuji |
| R-26 | PASS rencana: setiap kontrol memiliki hasil/transisi pada bagian 2–8; belum implementasi |
| R-27 | PASS rencana: loading/empty/error/retry/offline/expiry wajib pada bagian 8 |
| R-28 | N/A: tidak menambah FAQ |
| R-32 | PASS rencana: semantik/fokus/Back/TalkBack/target sentuh menjadi kriteria, bukan hasil uji |
| R-33 | N/A kode: tidak menambal source atau CSS |
| R-34 | N/A: tema terang tetap; tidak menambah toggle |
| R-35 | N/A runtime baru: hanya dokumen; tidak mengklaim build/klik rencana sudah lulus |
| R-36 | PASS: tanpa jaminan keamanan/upah/performa atau klaim siap produksi |
| R-37 | PASS: identitas/tokens incumbent dan referensi pengguna eksplisit |
| R-38 | PASS: tidak membuat profil/foto/data aktual rekaan; visual onboarding nanti harus jelas contoh |
| R-01 | PASS: hijau aksi dan emas kebutuhan/upah; tanpa gradient/glow |
| R-04 | PASS: Material untuk fungsi nyata; ikon/inisial hanya fallback identitas yang jujur |
| R-06 | PASS: tipografi Android dan role token untuk keterbacaan |
| R-07 | PASS: peta/diagram untuk penemuan, bukan pola dekoratif |
| R-08 | PASS: panah hanya navigasi |
| R-09 | PASS: tag layanan/status faktual, tanpa badge aman/verified |
| R-10 | N/A: tanpa glass |
| R-12 | PASS: outline/elevasi sesuai fungsi; tanpa shadow semua komponen |
| R-13 | N/A: tanpa glow |
| R-14 | PASS: kartu seragam untuk perbandingan dua peran; halaman lain mengikuti tugas |
| R-19 | PASS rencana: motion native singkat/reduced motion; tidak menambah library |
| R-22 | PASS rencana: visual mekanisme produk, tanpa ilustrasi generik; aset belum dibuat |
| Dials | PASS: Operate 2/1/2 mempertahankan arah |
| Konsistensi dials | PASS rencana: daftar tenang, aksen dan feedback terbatas |
| Fokus | PASS rencana: satu tugas utama per halaman pada bagian 3 |
| Whitespace | PASS rencana: ritme dan alignment bagian 8 |
| Aksen | PASS rencana: emas untuk kebutuhan/upah |
| Motif | PASS: kartu dua peran, area, consent dan COD |
| Design Read | PASS: bagian 4 menetapkan mode dan sumber arah sebelum pembangunan |
| C-1 | PASS: keputusan warna/tipografi/layout diberi alasan dan mengikuti sistem |
| C-2 | PASS rencana: kontrol memiliki aksi, simulasi harus berlabel |
| C-3 | PASS: tidak menambahkan section pengisi |
| C-4 | PASS rencana: matriks resilience ditetapkan; runtime belum diuji |
| C-5 | PASS: bukti lama tidak dianggap bukti rencana baru |
| R-05 | PASS: komposisi mengikuti penemuan, consent dan pekerjaan |
| R-11 | PASS: radius token berbeda untuk kartu/kontrol/sheet |
| R-15 | PASS: label aksi spesifik, bukan slogan tombol |
| R-16 | PASS: tanpa buzzword pemasaran |
| R-20 | PASS: konteks buruh/penyedia kerja dan COD jelas |
| R-21 | PASS: tidak mengubah tema atau menambah dark mode |
| R-29 | PASS: hijau/emas/mint/netral mengikuti sistem yang ada |
| R-30 | PASS: komposisi referensi diadaptasi, merek/aset travel tidak disalin ke aplikasi |
| R-31 | PASS: alasan/kriteria komponen dirinci bagian 4–8 |

Saran pergantian peran dan detail syarat publik tetap perlu tanggapan pengguna sebelum diperlakukan sebagai kebijakan final. Permintaan utama dan penyederhanaan copy sudah menjadi dasar rencana ini.

## 11. Implementasi lokal dan penerimaan terbuka

- Lima tab dan rail >=840 dp tersedia. Beranda default menampilkan peran lawan; grid dua kolom dibatasi 864 dp dan menjadi satu kolom pada fontScale >=1.5. PersonCard menampilkan rating/jarak perkiraan, maksimal dua tag dan +N; bio hanya di detail; seluruh kartu membuka profil.
- Login mendahului intro, peran, lokasi/radius wajib dan profil opsional. accounts menyimpan intro/setup/peran/area pencarian; role_profiles menyimpan bio/tag per peran. Skip tidak membuat profil palsu. Ganti peran dari Akun memulihkan bio/tag serta mematikan presence atomik; riwayat tetap. Menu simulasi demo mengganti aktor sintetis, berbeda dari peran akun.
- Temukan menyediakan sheet kelompok marker, ringkasan dan alternatif daftar. Aktivitas memisahkan Kontak/Pekerjaan dengan Semua/Aktif/Riwayat; Notifikasi menandai dibaca sebelum navigasi yang berizin. Akun mengarah ke form terpisah; consent kontak, form kesepakatan, hasil dan penerimaan COD tetap berbeda.
- TextButton/segmen minimum 48 dp pada source; Action utama 56 dp. SchedulePicker Android memakai datetimepicker 9.2.1, preview web memakai input tanggal/jam; kalender/zona divalidasi. Diagram onboarding native dibuat lokal tanpa raster/logo baru.
- Migrasi tambahan 202611170002_onboarding.sql menyediakan gate akun, onboarding/set_role/set_area, discovery tanpa profil dan penghapusan tanpa profil. Profil minimum/nomor tetap wajib untuk tindakan publik. Core lama menjadi privat; wrapper publik mempertahankan gateway dan ACL.

Bukti sebelum koreksi UI akhir target 48 dp: 13 tes unit, 49 assertion SQL lokal/shim Auth, tujuh tes Playwright Chrome sintetis lulus; typecheck/lint/export web/Hermes/Worker dry-run, pemindai pola secret, kontras dan aset lulus. Typecheck/lint/export web/Hermes sesudah koreksi 48 dp lulus, capture final errors[] dan fokus 2 px. Rerun final tujuh tes browser dengan assertion ukuran lulus dalam 1,2 menit; review ulang menyatakan temuan target sentuh resolved pada source/preview. Rincian pada TESTING.md dan IMPLEMENTATION-GATE.md. Browser bukan Android. SDK/emulator/adb tidak tersedia; TalkBack, fontScale perangkat, Back, IME, lifecycle sesi, peta native, APK/AAB dan layanan live belum terverifikasi. Rilis tetap tertahan.

## Slice GPS dan penilaian — 17 November 2026

Keputusan terbaru: hilangkan judul badan berulang lima tab, pertahankan judul detail; dua kartu per baris; filter kecamatan/jenis pekerjaan; lokasi/radius wajib sesudah peran sebelum profil opsional; hasil dalam kota GPS dan radius; peta Leaflet/OSM aktual; penilaian bilateral sesudah kesepakatan selesai. Demo Pekanbaru 12 profil sintetis + `demo-me` dan riwayat; batas OSM aktual. Aturan/default evaluasi pada [prd.md](../prd.md), privasi pada [SECURITY.md](../SECURITY.md), bukti final pada [TESTING.md](../TESTING.md).

Bukti terkini menggantikan angka tahap UX sebelumnya: 17 unit, 84 assertion SQL PostgreSQL disposable/shim Auth, 11 tes Chrome sintetis lulus; typecheck/lint/web/Hermes/Worker dry-run lulus. Rincian dan batas Android/live: [TESTING.md](../TESTING.md). Review source/web: [.impeccable/review/finish-review-gps.md](../.impeccable/review/finish-review-gps.md).
