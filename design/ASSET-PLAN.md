# Rencana aset untuk penyegaran Upahgo

17 November 2026. **Inventaris dan prompt usulan; belum ada file gambar baru yang diproduksi.** Tidak mengubah logo pilihan atau membuat foto orang/tempat fiktif sebagai pengguna nyata. Mengikuti [REDESIGN-PLAN.md](REDESIGN-PLAN.md), [JOB-CATALOG.md](JOB-CATALOG.md) serta [register aset saat ini](../assets/README.md).

## 1. Tiga jenis media yang berbeda

| Media | Pemakaian | Kebenaran konten |
| --- | --- | --- |
| Ilustrasi aktivitas aplikasi | Cover kategori/layanan/kebutuhan dan fallback | Menjelaskan kegiatan, bukan foto buruh atau tempat yang ditemukan |
| Foto asli buruh/tempat | Identitas kecil opsional pada kartu dan detail | Dari pemilik dengan izin, dapat diganti/dihapus; tidak diambil acak dari internet atau dibuat AI |
| Media demo | Menunjukkan komposisi saat belum ada pengguna nyata | Ilustrasi/sintetis berlabel; rating/akun/pekerjaan tetap dummy |

Disepakati pengguna: ilustrasi aktivitas menjadi cover utama, foto asli kecil buruh/tempat opsional menjadi identitas. Kartu tetap lengkap tanpa unggahan foto. Logo tidak dipakai sebagai avatar semua orang atau gambar semua pekerjaan. Persetujuan media ini tidak mengaktifkan layanan unggah atau menyetujui setiap aset/rincian produksi.

## 2. Gaya ilustrasi

Ilustrasi editorial aktivitas dengan bentuk jelas, proporsi wajar dan volume halus. Fokus satu pekerjaan/objek per gambar; mudah dibaca ketika tampil kecil. Latar cover putih/mint/emas muda mengikuti kategori/peran, isi boleh mempertahankan warna objek yang diperlukan untuk pengenalan. Figur berpakaian kerja sehari-hari Indonesia, tanpa menyamakan gender, warna kulit atau penampilan dengan tingkat kemampuan.

Tepi bersih, tanpa detail latar ramai, tulisan, label harga, watermark, efek kaca, confetti atau glow. Tidak memakai gaya dokter/farmasi dari referensi. Figur ilustrasi tidak memalsukan identitas; tidak membuat potret fotorealistis pekerja demo yang dianggap orang nyata. Tetap satu keluarga gaya di semua kategori.

Tidak menyalin foto/produk dari screenshot referensi. Seluruh karya baru harus memiliki prompt/sumber, hak penggunaan yang jelas, dan file tujuan. Tidak mengirim foto privat pengguna atau kode ke generator eksternal; tidak mengaktifkan layanan berbayar untuk rencana ini.

## 3. Struktur folder usulan

```text
assets/
  brand/                         # incumbent; dipertahankan
  icons/                         # Material incumbent; dipertahankan
  illustrations/
    source/
      jobs/                      # master kegiatan + metadata sumber/prompt
      onboarding/                # tiga komposisi bila benar diperlukan
    exports/
      jobs/                      # ukuran delivery menurut artworkKey
      onboarding/
  previews/                      # contact sheet review, bukan gambar aplikasi
  licenses/                      # asal/hak penggunaan sesuai sumber
  catalog.json                   # hanya merekam aset yang benar-benar ada
```

Foto pengguna disimpan di Storage berizin, **bukan** assets/ repository. Fixture ilustrasi demo boleh memakai artwork aplikasi; foto nyata yang privat tidak disalin ke seed, screenshot pengujian atau Git.

## 4. Inventaris cover

Nama berikut calon `artworkKey`; bukan file yang sudah tersedia. Satu artwork dapat dipakai ulang bila aktivitasnya memang sama. Jangan membuat 129 gambar sebelum kategorinya aktif dan ada kebutuhan visual.

| Key / basename usulan | Isi gambar yang harus terbaca | Pemetaan awal | Tahap |
| --- | --- | --- | --- |
| sweep | Orang menyapu ruangan, sapu dan pengki terlihat | J001 | A |
| mop | Orang mengepel lantai dengan ember | J002 | A |
| dust | Tangan mengelap meja/rak rendah dengan kain | J003 | A |
| kitchen-clean | Membersihkan meja dapur tanpa api/gas aktif | J004 | A |
| bathroom-clean | Membersihkan lantai/kamar mandi dengan alat sesuai | J005 | A |
| window-clean | Mengelap kaca yang terjangkau dari lantai | J006 | A |
| water-carry | Galon air dan aktivitas memindahkannya dengan alat bantu yang sesuai | J025; varian galon kosong terpisah bila dibutuhkan | A |
| box-move | Dua orang memindahkan kardus dengan troli, rute rata | J026/J032 | A |
| laundry | Melipat pakaian, keranjang dan lipatan rapi | J010/J014/J016; setrika bukan dipetakan ke gambar setrika yang tidak ada | B |
| dishwash | Tangan mencuci piring di bak cuci | J009/J047 bila konteks cocok | B |
| garden | Menyiram tanaman rendah dari halaman | J019; pekerjaan kebun lain memerlukan thumbnail yang benar-benar sesuai | B |
| shelf-stock | Menata barang pada rak rendah toko | J033/J038 | B |
| parcel-pack | Mengemas pesanan kecil di meja | J037/J094/J116 | B |
| food-pack | Mengemas makanan dengan lingkungan bersih | J045 | B |
| event-setup | Menata meja/kursi acara dengan jumlah terbatas | J054 | B |
| vehicle-wash | Membersihkan kendaraan diam di area cuci | J057–J059 hanya jika varian kendaraan sesuai | B |
| seedling | Menanam bibit di wadah/lahan rendah | J066/J067 | C |
| animal-feed | Menyiapkan pakan hewan jinak dengan wadah | J073/J074 | C |
| fish-pack | Mengemas ikan pada meja bersih, tanpa kolam/perahu | J083/J084 | C |
| craft-pack | Merangkai dan mengemas kerajinan di meja | J089/J092/J094 | C |
| furniture-assemble | Merakit rak lepas sesuai petunjuk dengan alat tangan | J097/J098 | C |
| local-errand | Membawa tas barang ringan berjalan kaki | J109/J110 | C |
| stock-record | Mencatat barang di meja toko, layar/kertas tanpa teks terbaca | J114/J115 | C |
| recycle-sort | Memilah kardus dan botol bersih dengan wadah | J121–J123 | C |

**Tahap A: delapan cover** untuk mengevaluasi kegiatan saat ini dan contoh angkat galon/pindahan yang diminta. Aktivitas baru tetap memakai label rencana/demo sampai fungsi katalog mendukung. **B: delapan cover** untuk perluasan berikutnya. **C: delapan cover** setelah kategori serta operasinya tersedia. Ini pembagian produksi, bukan persetujuan semua kategori.

Lainnya menggunakan ikon fungsi + ringkasan teks atau cover kategori terdekat yang jujur; tidak menaruh gambar pekerjaan spesifik yang belum diketahui. Saat kecocokan tidak ada, placeholder netral berlabel lebih benar daripada gambar yang salah.

## 5. Onboarding dan empty state

Tiga panel onboarding sudah memiliki diagram native. Evaluasi ulang setelah kartu baru hadir; jangan menggantinya hanya karena tersedia generator. Jika ilustrasi raster membantu pemahaman:

| Usulan key | Komposisi | Tujuan |
| --- | --- | --- |
| intro-roles | Dua pihak dengan kegiatan saling melengkapi, tanpa teks di gambar | Memahami Cari kerja / Cari tenaga |
| intro-nearby | Pin dan area kota sederhana, dua titik/peran | Memahami radius dan wilayah, bukan GPS tracking |
| intro-agreement | Tugas disepakati dan serah tunai yang jelas sebagai ilustrasi | Memahami persetujuan/COD; bukan bukti pembayaran |

Empty/error memakai ikon yang sudah ada + satu kalimat + aksi. Tidak membuat ilustrasi berbeda untuk setiap error, OTP gagal, izin ditolak, atau penghapusan akun. Peta memakai tiles geografis beratribusi, tidak diganti gambar peta ilustrasi sebagai hasil nyata.

## 6. Ukuran, format dan anggaran

| Jenis | Usulan teknis untuk diuji |
| --- | --- |
| Master cover aktivitas | Rasio 4:3, sekitar 1536×1152 px; sumber PNG transparan bila figur/objek terisolasi, tanpa UI/teks tertanam |
| Ekspor kartu | 192×144, 384×288, 576×432; pilih ukuran sesuai density. Target awal ≤15/35/70 KB per varian, bukan hasil kompresi yang sudah dicapai |
| Detail | Reuse master delivery hingga 960×720 bila dibutuhkan, jangan membesarkan thumbnail kecil |
| Foto identitas | Thumbnail persegi/crop aman, sisi 96/192/288; tampil sekitar 32–40 dp, target interaktif tetap 48 dp bila bisa ditekan |
| Foto tempat | Thumbnail identitas persegi; versi detail dapat 4:3, tidak mengganti cover ilustrasi kartu. Identitas pemilik/izin jelas, tanpa alamat privat di metadata |
| Onboarding | Tiga komposisi terpisah; target delivery masing-masing ≤120 KB bila raster benar diperlukan |
| Format | WebP statis bila dukungan SDK58/native/web telah diverifikasi; PNG untuk transparansi yang membutuhkannya. Tidak mengasumsikan format/decoder tanpa uji |
| Runtime | Reuse kemampuan Image yang ada terlebih dahulu; evaluasi library image tambahan hanya bila caching/decode/memori terukur memerlukannya |

Rasio media dicadangkan sebelum file termuat. Load media sesuai viewport, placeholder ringan, retry berbatas, fallback tetap relevan. Tidak memuat semua master atau semua galeri di Beranda; tidak autoplay video/animasi pada kartu. Unggahan asli di-reencode server dan EXIF/GPS dibuang sebelum delivery. Ukuran file dicatat di katalog, tanpa mengklaim target performa sudah lulus.

## 7. Prompt induk

Gunakan satu prompt dasar dan brief kegiatan per key. Prompt berikut siap digunakan saat produksi memang dimulai; format/alpha diperiksa pada file hasil, bukan dipercaya dari teks prompt.

> Buat satu ilustrasi aktivitas untuk aplikasi Upahgo, layanan kerja harian Indonesia. Subjek utama: [AKTIVITAS]. Objek penting: [OBJEK]. Kondisi: [KONDISI]. Gaya editorial kontemporer, bentuk bersih, proporsi manusia dan benda wajar, volume halus, tidak seperti maskot mainan. Komposisi 4:3, kegiatan langsung dikenali pada kartu kecil. Palet utama hijau tua #014C24, mint #E2F3E7 dan aksen emas hangat #E5C282; pakaian sederhana, warna objek tetap dapat dikenali. Satu fokus, ruang aman sekitar 10% di tepi, latar transparan untuk subjek terisolasi. Tidak ada kata, angka, logo, watermark, badge atau UI. Tidak ada rumah/alamat/identitas yang bisa dianggap tempat atau orang nyata. Peralatan dan cara kerja sesuai tugas; jangan menggambarkan tindakan berbahaya sebagai contoh yang dianjurkan.

Hindari: potret fotorealistis, karakter generik berbentuk blob, tangan/anggota tubuh berlebih, galon salah bentuk, perspektif membingungkan, latar toko ramai, teks acak, warna neon, gradient latar besar, glow, detail kecil berlebihan, logo merek pihak lain.

### Brief delapan cover pertama

| Key | AKTIVITAS | OBJEK | KONDISI |
| --- | --- | --- | --- |
| sweep | Menyapu lantai ruangan | Sapu, pengki, sedikit debu | Lantai rata, ruangan sederhana, pose kerja masuk akal |
| mop | Mengepel lantai | Pel, ember, kain | Area terbatas, tidak menggambarkan orang lain berjalan di lantai licin |
| dust | Mengelap meja rendah | Kain lap, meja, rak rendah | Semua permukaan terjangkau, tanpa memanjat |
| kitchen-clean | Membersihkan permukaan dapur | Lap, meja dapur, sarung tangan bila sesuai | Kompor mati, tidak mencampur bahan kimia, tanpa merek |
| bathroom-clean | Membersihkan kamar mandi | Sikat, ember, sarung tangan | Alas kaki sesuai dan ventilasi, tanpa label bahan kimia atau kotoran ekstrem |
| window-clean | Membersihkan kaca rendah | Kain dan pembersih kaca | Kedua kaki di lantai, jendela terjangkau; tanpa tangga/gedung tinggi |
| water-carry | Memindahkan galon air dengan alat bantu | Galon penuh, troli tangan yang sesuai | Rute rata, pose natural, tanpa mengangkat beban di atas kepala; gambar tidak menyatakan berat aman universal |
| box-move | Memindahkan barang rumah | Kardus, troli, dua figur bila diperlukan | Rute lapang, beban stabil, tidak menutupi pandangan atau menumpuk berlebihan |

Prompt tiap file akhir menyimpan substitusi lengkap, bukan hanya template. Bila gambar gagal menyampaikan tugas pada ukuran kecil, revisi gambar atau pilih komposisi lain; jangan mengompensasi dengan paragraf panjang di kartu.

## 8. Pemeriksaan produksi aset

- File benar-benar ada sebelum direkam di catalog.json; nama/prompt/sumber/lisensi/hash/ukuran konsisten.
- Buka seluruh hasil pada ukuran kartu, detail, latar putih/mint/emas; alpha, tepi, warna, crop dan ruang aman diperiksa.
- Gambar kegiatan dan alat benar; tidak menyarankan kerja ketinggian, pose angkut berbahaya atau penggunaan alat yang salah.
- Tanpa teks/brand/potret palsu; foto nyata tetap terpisah dari ilustrasi dan demo.
- Rasio/crop stabil di 320 dp, density tinggi, font scaling dan gambar gagal; nama/rating tidak ditimpa gambar.
- Decode/scroll/memori/jaringan diuji Android, bukan hanya browser. Target ukuran bukan bukti kelulusan performa.
- Draf yang ditolak dihapus setelah tidak dirujuk dan sesuai lingkup permintaan; jangan menghapus logo/aset incumbent yang masih dipakai.

Tidak ada generator, upload foto, layanan berbayar, aset baru atau codec/library yang dijalankan/dipasang untuk dokumen rencana ini.

## Status implementasi — 18 November 2026

Fallback pictogram Material resmi sudah tersedia dan terdaftar; 11 glyph aktivitas ditambahkan ke 36 ikon awal. `ActivityMedia.tsx` memakai pictogram sementara, manifest raster masih kosong. Delapan ilustrasi raster Stage A belum dibuat atau direview, sehingga kebutuhan cover ilustrasi belum selesai. Generator dalam otorisasi tidak tersedia; fallback berbayar tidak diizinkan. Diagram onboarding native dipertahankan; tidak ada foto orang nyata dibuat/diimpor. Status bukti dan batas: [TESTING.md](../TESTING.md).
