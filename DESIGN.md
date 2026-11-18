# Sistem desain Upahgo Ceria

Versi 2.3, 18 November 2026. Pengguna meminta implementasi desain Ceria untuk seluruh halaman aplikasi yang sudah tersedia, kemudian menyeragamkan ikon hijau 24 dp, memperkecil ilustrasi layanan dan mengikuti batas kartu tipis/lembut pada screenshot Gojek. Koreksi terbaru mempertahankan gambar berwarna Menyapu/Mengepel/Dapur/Lainnya, bukan menggantinya dengan ikon kontrol. Sumber visual awal: [file FigCraft](design/figcraft-fun/UpahGo-Ceria.figcraft), [overview](design/figcraft-fun/overview.png), [inventaris 75 layar/state](design/figcraft-fun/INVENTORY.md). Ceria menggantikan studi Kestrel sebagai arahan UI. Logo asli tetap utuh.

Aturan produk tetap pada [prd.md](prd.md), [PRODUCT.md](PRODUCT.md), [SECURITY.md](SECURITY.md). Status pengujian aktual pada [TESTING.md](TESTING.md). Desain dan bundle Hermes bukan bukti kesiapan rilis Android atau layanan live.

Refinement kartu terpilih: pengguna memilih [alternatif 2, profil horizontal](design/profile-card-variants/README.md) dan mempertahankan dua kartu per baris. Label “Bisa nego” berupa teks hijau gelap tanpa bidang latar, di atas tag; gambar layanan di kanan tengah berukuran 56 dp pada kartu sempit dan 80 dp pada kartu lebar. Rating tetap rata kanan pada panel harga bawah, memakai bintang emas dan jumlah ulasan. Pada ruang sempit/teks besar rating boleh turun baris agar nominal tidak dipotong.

## Arah dan alasan

Mode **Operate**, Android-first React Native + Expo. Design Read: aplikasi kerja harian Indonesia yang hangat dan ceria, objek layanan berwarna, putih lapang, hijau Upahgo, ilustrasi peran besar. **ENERGY 3 / RHYTHM 2 / MOTION 2**. Energi terkonsentrasi pada masuk, peran dan beranda; izin kontak, laporan dan uang tetap tenang.

- Hijau aksi menandai langkah berikutnya; hijau gelap/emas logo mempertahankan identitas pilihan pengguna.
- Putih memberi ruang baca; mint, peach dan sky mengelompokkan ilustrasi tanpa membuat setiap informasi menjadi kartu.
- Roboto/sans sistem mengikuti Android dan pembesaran teks, tanpa unduhan font saat membuka layar.
- Kartu putih dengan border `cardOutline` memisahkan profil, aktivitas dan notifikasi; kelompok pengaturan memakai satu border luar dan pemisah antarbaris. Canvas netral pada Aktivitas/Notifikasi/Akun memperjelas batas tanpa bayangan besar.
- Objek sapu, pel, dapur, koper dan rumah menjelaskan pekerjaan/layanan, bukan dekorasi generik. Ilustrasi pencari kerja dan perekrutan membedakan dua peran.
- Jarak 20 dp di telepon, 24 dp medium, 32 dp expanded memisahkan kelompok; sela 12 dp menyatukan dua pilihan/profil.
- Light theme mengikuti desain yang diminta; tidak ada toggle atau inversi parsial mengikuti OS.
- Ripple dan fade pengenalan memberi respons/kelanjutan. Tidak ada loop dekoratif atau runtime animasi baru.

Inspirasi Gojek berlaku pada kehangatan dan objek layanan berwarna. Logo, artwork, nama layanan dan fitur Gojek tidak disalin. Layout/alur tetap milik Upahgo.

## Token dan tipografi

[design/tokens.json](design/tokens.json) tetap satu sumber nilai mesin. [theme.ts](apps/mobile/src/theme.ts) memetakannya ke Material Paper; [ui.tsx](apps/mobile/src/ui.tsx) memiliki primitive bersama.

| Peran | Warna |
| --- | --- |
| Aksi / teks tombol | `#087F52` / `#FFFFFF` |
| Identitas asli | Hijau `#014C24`, emas `#E5C282` |
| Bintang penilaian / outline | `#F6BE3A` / `#A7740C` |
| Canvas / teks utama | `#FFFFFF` / `#20352B` |
| Permukaan sekunder / metadata | `#F3F7F4` / `#56665C` |
| Mint / label | `#DDF4EA` / `#014C24` |
| Peach / label | `#FFF0DF` / `#684509` |
| Info / label | `#E0EFFB` / `#275B79` |
| Batas kontrol / pemisah | `#78877D` / `#E1E9E3` |
| Error / permukaan error | `#AB3434` / `#FCE9E5` |
| Sukses / permukaan sukses | `#17623F` / `#DFF3E7` |

Warna sekunder tambahan lime/lilac adalah permukaan ilustrasi. Warna objek tidak menjadi label teks. Status selalu punya teks/ikon, tidak hanya warna. Hijau tidak menyatakan identitas, pekerjaan atau pembayaran terverifikasi.

| Teks | Ukuran / tinggi baris |
| --- | --- |
| Judul utama | 30 / 36 sp, 700 |
| Judul detail | 26 / 34 sp, 700 |
| Judul bagian | 20 / 28 sp, 700 |
| Judul item | 16 / 24 sp, 600 |
| Isi dan input | 16 / 24 sp |
| Metadata | 14 / 21 sp |

Nama kartu profil memakai 16/22, lokasi 13/20, tag ringkas 12/18, harga kartu 22/28. Pada kartu <260 dp: nama 14/20, lokasi 12/18 dan harga 18/25; nominal ≥Rp10 juta memakai 16/25 agar utuh pada layar 320 dp. Detail memakai nama 24/32 dan harga 26/34. Nama dan lokasi kartu boleh membungkus tanpa pemotongan baris. Nominal, jadwal dan konsekuensi tidak dipotong. Font scaling tidak dinonaktifkan.

## Bentuk dan komponen

- Tombol utama/sekunder dan text button minimum 48 dp, radius 16. Label dapat membuat tombol tumbuh; ukuran ringkas tidak mengurangi target sentuh. Pending mempertahankan label, mengunci pengiriman ganda, menampilkan hasil/error yang sah.
- Input form outlined berlabel tetap, radius 14; helper/error di bawah. Search memakai placeholder, ikon pencarian dan tombol hapus berlabel, dengan batas `outline` agar kontrol tetap terbaca. Keyboard sesuai tipe, paste/autofill tetap tersedia.
- Chip pilihan radius 24, radio/checkbox/switch dengan semantik checked/selected dan target minimum 48 dp. Tag informasi bukan tombol.
- Notice radius 16; panel/kartu radius 20, border 1 dp `#E3E7E4`, latar putih; pemisah baris `#E8ECE9`. Border ini mengelompokkan konten secara lembut mengikuti referensi terbaru, bukan indikator status atau satu-satunya penanda kontrol. Ikon/label yang kontras mengidentifikasi target; input/search tetap memakai outline `#78877D` setebal 1 dp. Fokus keyboard 2 dp tetap. Tanpa bayangan besar. Kartu profil memakai isi 16 dp dan panel harga dengan padding vertikal 14 dp; kartu sempit memakai isi 10 dp dan padding harga vertikal 12 dp.
- Ikon antarmuka memakai satu ukuran 24 dp dan hijau `primary`, tanpa bidang latar; centang pada bidang hijau memakai putih untuk kontras. Bintang penilaian adalah pengecualian yang diminta pengguna: fill `ratingStar` emas dan outline `ratingStarOutline` yang kontras, tetap 24 dp. Berlaku pada kartu, detail, ulasan dan pilihan rating. Slot ikon baris 40 dp, target tombol ikon 48 dp, baris pengaturan minimum 72 dp; pemisah hanya antarbaris. Aksi berisiko tetap dibedakan lewat teks dan konfirmasi.
- Ilustrasi layanan memakai `ServiceArt`, terpisah dari ikon antarmuka: empat pintasan berwarna 36 dp, gambar kanan kartu 56 dp (kartu sempit) atau 80 dp tanpa bidang latar, cover detail 48 dp (compact 32), hero Beranda 64 dp, ornamen masuk/peran 48–56 dp. Ilustrasi peran besar, logo asli, Google G dan foto publik mempertahankan warna/proporsinya. Pintasan Menyapu/Mengepel/Dapur/Lainnya tetap memakai aset gambar sebelumnya, dengan batas tipis; label menyatakan fungsi filter/katalog.
- Sheet radius atas 28, judul, tombol tutup, System Back, konten scroll. Aksi tidak memerlukan drag. Fokus keyboard awal pada tutup; pemulihan fokus perangkat perlu verifikasi.
- Satu fokus utama per layar. Error, kosong, loading dan retry memakai primitive yang sama di seluruh route.

## Halaman dan navigasi

1. Masuk: lockup asli, ilustrasi besar, pesan produk singkat, tombol Google putih berbingkai dengan Google G resmi; demo eksplisit sintetis.
2. Pengenalan: ilustrasi peran, objek peta dan tiga langkah kontak/tugas/tunai. Tidak menyatakan transaksi telah terjadi.
3. Peran: dua ilustrasi besar kiri/kanan, latar sky/peach, label Cari kerja/Cari tenaga, border serta centang pilihan. Satu kolom pada fontScale >=1,5.
4. Lokasi: objek peta besar, penjelasan izin foreground, radius, retry/pengaturan. Live tidak memakai fallback demo atau kota manual.
5. Beranda: header merek, panel hijau dengan aksi peta, pencarian/filter, empat pintasan bergambar, dua kartu profil per baris pada semua lebar normal. FontScale ≥1,5 memakai satu kolom agar teks besar tetap terbaca. Tombol Pekanbaru/lokasi dan radius memakai border tipis yang sama pada Beranda/Temukan; label 14 sp dan padding ringkas agar muat pada compact. Pintasan hanya menyaring tag katalog; Lainnya membuka katalog yang membedakan aktif/rencana.
6. Temukan: peta geografis beratribusi, kontrol area/filter/daftar, status tampil sendiri, pin profil, sheet detail dan alternatif daftar.
7. Profil: cover aktivitas, identitas kecil terpisah, nama/peran/area/jarak, layanan/kebutuhan, konteks dan ulasan; Hubungi mengikuti kesiapan profil/nomor.
8. Aktivitas: judul 26 sp, pengalih Kontak/Pekerjaan tinggi minimum 48 dp dan lebar gabungan maksimum 320 dp, label 14/20 sp; filter di samping. Ikon person_add/work sama dengan Notifikasi; satu kartu per item, judul/detail/status/tanggal dipisahkan. Nominal dan pengakuan uang tetap terpisah dari status selesai.
9. Notifikasi: kartu putih per kabar, ikon sesuai route, isi dari layanan, tanggal pengelompokan dan penanda Sudah/Belum dibaca; jumlah belum dibaca berasal dari data yang dimuat.
10. Akun: kartu identitas/lokasi dan kelompok Profil dan lokasi (termasuk nomor WhatsApp). Lainnya berisi Bantuan dan laporan, Ketentuan dan privasi, Atribusi data, Beri nilai Upahgo. Kelola akun berisi Keluar akun (Keluar dari demo pada demo) dan Hapus akun. Simulasi tetap eksplisit dan hanya muncul pada demo. Tidak ada ikon akun tambahan di header lima tab; akses akun melalui navigasi utama.
11. Form profil/foto/nomor, kontak, kesepakatan, rating, katalog, laporan, penghapusan dan bantuan memakai token, kontrol dan hierarki Ceria. Tidak menambah publikasi lowongan, lamaran atau operator web.

Navigasi tetap lima tab: Beranda, Temukan, Aktivitas, Notifikasi, Akun. Semua ikon hijau 24 dp tanpa latar; tab aktif memakai varian terisi dan label tebal, tanpa garis bawah. Rail mulai 840 dp; setiap tab dapat menyusut agar Akun tetap berada dalam viewport compact. Akun dimount sejak awal untuk mengurangi jeda kosong saat pertama dibuka; peta tetap lazy. Detail mempertahankan app bar/Kembali. Insets tidak dihitung dua kali antara tab dan halaman. Avatar kartu dan detail profil memakai alas mint untuk buruh, peach untuk pemberi kerja, bingkai putih; ikon kontrol lain tetap tanpa bidang latar. Foto asli dan bentuk pin lokasi dipertahankan.

Ketentuan/privasi menampilkan informasi pengujian lokal yang sama dengan bantuan, tanpa menganggap kebijakan publik sudah final. Atribusi menyebut OSM/ODbL dan sumber batas Pekanbaru, Leaflet, unDraw, Material Symbols serta Roboto dengan tautan sumber. Beri nilai Upahgo membuka keterangan belum adanya tautan toko resmi; tidak membuka URL Google Play yang belum terverifikasi. Logout memakai pending/lock; Hapus akun tetap menuju form konsekuensi dan consent existing, tanpa penghapusan dari satu ketukan.

PersonCard: dua kartu per baris, sela 12 dp, maksimum browse 864 dp; satu kolom hanya saat fontScale >=1,5. Avatar tonal 48 dp di kiri nama/area/jarak, 36 dp pada kartu <260 dp. Baris tengah berisi label nego tanpa latar (13/20, semibold) dan ilustrasi layanan 80 dp di kanan yang sejajar pusat baris. Pada kartu sempit, nego 12/20, gambar 56 dp dan tag berada pada baris penuh di bawah gambar agar tidak terjepit. Label hanya tampil jika harga terisi dan `priceNegotiable` benar, satu kali per kartu, tanpa ikon pensil. Dua tag beserta jumlah sisanya mengikuti panjang teks, tidak memenuhi lebar kartu. Garis memisahkan panel harga netral di dasar; rating 13/20 dengan bintang emas 24 dp rata kanan, sejajar nominal bila cukup ruang atau turun baris. Rating tanpa data menampilkan “Belum dinilai” dan bintang outline. Semua tag/bio/tenaga dan ulasan tetap tersedia pada detail. Satu kartu satu target; tidak ada tombol bersarang. Nama aksesibilitas mencakup tarif/anggaran, satuan, kesediaan nego dan nilai/jumlah ulasan.

## Harga profil dan usulan upah

Implementasi konsep [kartu, detail dan harga](design/profile-pricing/BRIEF.md), disetujui pengguna: **per pekerjaan/sesi**. Buruh menampilkan Mulai dari, pemberi kerja Anggaran. Nominal opsional dimasukkan pemilik pada Edit profil, terpisah per peran. Tanpa nominal tampil Harga belum diisi dan Bahas bersama. Harga terisi menampilkan Bisa nego jika pemilik mengaktifkannya, atau Harga tetap jika tidak. Keduanya tanpa badge; nego hijau gelap, harga tetap warna metadata. Label yang sama tersedia pada kartu dan detail, tanpa mengubah persetujuan upah kedua pihak.

Detail memisahkan identitas, harga, tugas, kondisi dan ulasan lewat ruang serta garis. Cover 108 dp. Durasi, tenaga, jumlah, alat, beban positif dan lantai positif terbaca langsung; akses tambahan dapat dibuka dengan tombol berlabel. Fakta dua kolom menjadi satu pada fontScale >=1,5. Footer Hubungi/Tawar upah di luar scroll agar aksi tidak hilang; tetap berada di KeyboardAvoidingView dan safe area.

Tawar upah memakai izin kontak existing, tanpa persetujuan otomatis. Sebelum diterima hanya ada permintaan kontak. Sesudahnya, editor nominal/catatan, tinjau usulan, rincian tugas/jadwal, tinjau kesepakatan lalu kirim. Tinjau usulan belum mengirim apa pun. Pihak lain harus menerima kesepakatan; pengakuan COD tetap terpisah. Usulan tidak membawa nominal/catatan di URL. Harga profil tidak pernah mengubah upah kesepakatan lama.

Nominal dan catatan usulan memakai label tetap di atas input, berlabel aksesibilitas, agar teks panjang tidak bertumpuk saat viewport berubah. Error nominal dihapus saat angka diedit; input tetap bertahan jika submit ditolak.

## Peta dan privasi foto

Web memakai Leaflet/OpenStreetMap; Android memakai react-native-maps/Google dengan key yang dikonfigurasi. Jangan menyalin peta skematis FigCraft sebagai geografi aplikasi. Vendor gagal tetap menyediakan pesan/retry dan daftar.

Koordinat publik tetap perkiraan yang disediakan server. Zoom/pan tidak memperluas query, radius atau batas kota. Kelompok titik sama membuka daftar akun. Pada zoom maksimal 18, pin berdekatan dipisahkan secara visual dan dihubungkan ke koordinat publik asal; `mapMarkers` tidak menulis posisi baru. Urutan ID membuat susunannya stabil. Daftar tetap alternatif saat padat.

Pin memakai foto publik yang disetujui melalui `readPhoto`, dengan fallback ikon orang saat kosong/gagal. Signed URL tidak diberikan langsung kepada cache gambar native; foto dibaca sebagai data di memori. Tidak memakai avatar ilustratif desain sebagai foto orang nyata. Foto pending hanya terlihat pemilik sesuai kontrak existing. Foto tetap opsional dan terpisah dari cover aktivitas.

## Aset dan identitas

Logo pilihan tetap `assets/brand/exports`, sumber asli utuh. Proporsi, topi, celemek dan sapuan tidak diubah. Clear space 0,25 tinggi badge; badge UI minimum 40 dp; tidak dipakai sebagai badge verifikasi. Master raster, belum master vektor.

[assets/ceria](assets/ceria) memuat dua ilustrasi unDraw berlisensi yang diadaptasi aksennya, Google G resmi, serta definisi SVG kontrol/objek asli proyek. Sumber pada [SOURCES.json](assets/ceria/SOURCES.json). Versi desain/vektor lengkap tetap pada `design/figcraft-fun/assets`. Ikon kontrol lama yang belum tergantikan tetap Material resmi berlisensi. Tidak ada foto pengguna nyata, layanan berbayar atau generasi identitas pengganti.

## Perilaku dan state yang dipertahankan

- Demo sintetis dalam memori; tidak ada SMS/WhatsApp/pembayaran sungguhan. Mode live tidak pernah beralih ke demo saat error.
- Profil/nomor yang siap diperlukan untuk tindakan publik. Tampil di peta pilihan sadar, terpisah dari login dan melihat hasil.
- Izin kontak dua pihak mendahului akses WhatsApp, diperiksa server saat dibuka. Nomor yang sudah disalin tidak dapat ditarik kembali.
- Persetujuan kontak, penerimaan pekerjaan, pengajuan/konfirmasi selesai dan pengakuan COD adalah langkah terpisah. Hanya pekerja terkait mengakui uang diterima.
- Laporan/blokir/penghapusan tidak memberi jaminan penanganan operator yang belum aktif.
- Input/draft bertahan pada error yang dapat dipulihkan; keluar dari form memberi peringatan. Tidak menjanjikan draft lintas restart.
- Loading, kosong, gagal/retry, GPS ditolak/stale/tidak akurat, kota tak terlayani, tiles gagal, target tak tersedia, pending/ditolak/expired/revoked dan akses dibatasi tetap terlihat sesuai hasil layanan.

## Verifikasi dan batas penerimaan

Minimum kontras 4,5:1 teks, 3:1 indikator kontrol. Target Android 48 dp; tombol dapat tumbuh dengan teks. Window compact/medium/expanded, keyboard, nama panjang, reduced motion dan alur sintetis harus diperiksa. System Back, TalkBack, fontScale, keyboard/safe area dan peta native memerlukan Android yang berjalan.

Pengujian aktual, screenshot aplikasi berjalan, delivery gate dan hal yang belum diuji dicatat di [TESTING.md](TESTING.md) serta [.impeccable/review/ceria-implementation.md](.impeccable/review/ceria-implementation.md). Tidak menyebut preview web atau export Hermes sebagai APK/AAB atau kelulusan native/live.
