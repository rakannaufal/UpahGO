# Implementasi Upahgo Ceria

18 November 2026, diperbarui untuk ikon tanpa latar dan menu Akun v2.1. Penerimaan visual terbatas pada source dan preview web Chrome dengan demo sintetis. **Belum menerima rilis Android/live.** Arah: `DESIGN.md`, `design/tokens.json` v2.1, desain `design/figcraft-fun`, referensi komponen transportasi yang dilampirkan pengguna. Impeccable sebagai workflow utama; antislop `during` sesuai preferensi global; ponytail untuk lingkup implementasi.

## Perubahan

Seluruh route existing memakai tema, primitive dan hierarki Ceria. Masuk memakai Google G resmi; dua ilustrasi peran berdampingan; Beranda memakai hero hijau ringkas, pencarian, filter, pintasan layanan dan profil dua kolom. Profil, Aktivitas, Notifikasi, Akun, form dan alur konsekuensial memakai komponen yang sama. `assets/ceria` memuat 29 kontrol outline, 13 objek layanan multicolor, dua ilustrasi peran berlisensi dan provenance. Logo asli dipertahankan. Tidak ada artwork Gojek atau avatar ilustratif yang dijadikan identitas pengguna nyata.

Pin profil memakai foto publik berizin atau fallback. Titik bertumpuk dikelompokkan; zoom maksimum memisahkan pin secara stabil, dengan garis ke titik publik asal. Pemilihan cluster mempertahankan pusat kamera. Perubahan posisi hanya visual; tidak menyimpan atau memperluas lokasi publik.

Refinement v2.1: kartu/panel putih dengan border `cardOutline` 1 dp dan radius 20; ilustrasi profil inset 8 dp; tombol radius 16, field radius 14, font judul/item lebih ringkas. SearchField berbasis TextInput Paper dengan ikon pencarian, placeholder dan aksi hapus berlabel. Ikon akun di header lima tab dihapus. Aktivitas memisahkan judul, status, tanggal dan pengakuan uang; Notifikasi memakai body layanan, status baca serta jumlah belum dibaca dari data; Akun membagi pengaturan ke kelompok padat dengan satu border luar. Semua route dan aksi existing dipertahankan.

Ikon menu, navigasi, notifikasi dan fallback identitas kini tanpa bidang latar. Target sentuh tetap 48 dp; tab aktif memakai label dan garis pendek. Akun memuat Lainnya (Bantuan dan laporan, Ketentuan dan privasi, Atribusi data, Beri nilai Upahgo), lalu Kelola akun (Keluar akun/Keluar dari demo, Hapus akun). Logout memakai pending/lock existing; penghapusan tetap melalui konsekuensi dan consent. Halaman informasi memakai copy pengujian lokal serta sumber/lisensi aktual. Penilaian menampilkan keterangan belum adanya URL Google Play resmi, tanpa membuat tautan palsu.

## Bukti

- TypeScript dan ESLint lulus pada source terbaru; 28 tes unit lulus pada slice sebelumnya, tidak diulang untuk perubahan ikon/menu. Tes unit mencakup determinisme/immutability, cluster, dense 40 pin dan tabrakan antarkelompok pada `tests/map-layout.test.ts`.
- Export web lulus; export Android Hermes 4,5 MB lulus. Export bukan APK/AAB atau pengujian perangkat.
- Browser ikon/menu: 14/15 lulus pada run penuh; satu capture gagal karena locator Lainnya juga menemukan teks Beranda tersembunyi. Locator dibatasi ke halaman Akun, tanpa perubahan source atau pelonggaran assertion; kedua tes Ceria kemudian lulus dalam 31,2 detik. Seluruh 15 skenario lulus lintas dua run; bukan klaim satu run penuh hijau. Route ketentuan/atribusi, keterangan penilaian dan logout exercised; enam URL atribusi dicek melalui stub `window.open`, tanpa membuka halaman eksternal. Sumber `tests/web/*.spec.ts`.
- 39 capture aplikasi berjalan, daftar pada `ceria/captures.json`; `pageErrors: []`. Lebar representatif 320, 412, 600 dan 1440; tes responsive juga 360/390/411/840. Tambahan terbaru merekam menu bawah Akun compact/expanded, ketentuan, atribusi dan keterangan penilaian.
- Konfirmasi akhir: tes `Ceria route` diulang, 1/1 lulus dalam 26,5 detik; hanya posisi scroll capture diubah agar Keluar/Hapus akun terlihat sekaligus. Percobaan sandbox terhalang `listen EPERM`, kemudian run lokal di luar sandbox berhasil. Bukti `ceria/account-menu-confirmation.jpg`.
- 29 pasangan kontras token v2.1 lulus pada `ceria/contrast-refinement.json`; bukan audit semua piksel.
- `npm run check:secrets`: 85 file source/config/doc, tidak ada pola credential tertanam. Env/build/dependencies dikecualikan; bukan audit menyeluruh.
- Visual QA ikon/menu: satu batch inspeksi Akun atas/bawah pada compact/expanded, Notifikasi, ketentuan, atribusi dan keterangan penilaian; satu konfirmasi menu bawah pada 320/412/1440. Tidak ditemukan clipping/overflow penting; tanpa putaran polish tambahan. Capture merupakan viewport halaman scroll, bukan seluruh isi halaman sekaligus. Tidak mengklaim inspeksi setiap capture baru satu per satu.
- Preview gabungan terbaru: `ceria/account-menu-preview.png`; `refinement-preview.png` dan `implementation-preview.png` adalah preview slice sebelumnya.

## Delivery Gate antislop

PASS berikut hanya berlaku pada source dan state web yang diperiksa. Native, provider nyata dan operasi produksi belum diverifikasi; tidak mendapat PASS implisit. N/A berarti teknik tidak digunakan, bukan pemeriksaan yang gagal dijalankan.

### Hard Gate

| Item | Status dan bukti |
| --- | --- |
| R-02 tanda baca | PASS: pencarian `—` pada `apps/mobile/app` dan `apps/mobile/src` tidak menemukan teks tersebut. |
| R-03 overflow | PASS web: assertion scrollWidth pada 39 capture dan viewport responsive; inspeksi layar terkait serta konfirmasi menu bawah 320/412/1440. |
| R-17 statistik | PASS: jumlah hasil berasal dari data; nominal/riwayat demo diberi label sintetis. Tidak ada metrik pemasaran. |
| R-18 testimoni | PASS: tidak ada testimoni pemasaran; ulasan profil berasal dari demo sintetis atau kontrak layanan existing. |
| R-23 otorisasi aset | PASS: pengguna meminta seluruh halaman, ikon dan aset Ceria. Logo asli, sumber/lisensi `assets/ceria/SOURCES.json`; foto pengguna tetap alur berizin. |
| R-24 tautan | PASS web: lima tab, detail/form dan halaman ketentuan/atribusi dituju dalam tes; enam URL atribusi dispatched melalui stub. Native/external belum diuji. |
| R-25 kontras | PASS token v2.1: 29/29 pasangan memenuhi ambang; field tetap memakai outline, warna teks/status dipetakan lewat theme. Tidak mengklaim audit foto/tiles. |
| R-26 kontrol | PASS alur web teruji: navigasi, filter, radius, peta, consent, pekerjaan, COD, rating, foto, laporan, penghapusan dan logout. Beri nilai membuka sheet berlabel belum tersedia karena URL toko resmi belum ada. Login/nomor nyata tetap belum diuji. |
| R-27 state | PASS web: tes auth-recovery/location/core mencakup loading, validasi, kosong, gagal, retry, denial dan pending. |
| R-28 FAQ | PASS: bantuan membahas kontak, lokasi perkiraan, tugas, tunai dan privasi Upahgo. |
| R-32 keyboard | PASS web: tes fokus terlihat, Enter pada tab, Escape pada sheet termasuk keterangan penilaian; label/role native pada source. TalkBack belum diuji. |
| R-33 source | PASS: fitur ditulis pada TSX/TS dan token; aset generator hanya menghasilkan artwork, bukan menambal source runtime. |
| R-34 tema | N/A: satu light theme, tidak ada toggle. |
| R-35 run/click-through | PASS web teruji: build serta 15 skenario core/location/auth-recovery/Ceria lulus lintas dua run; 39 capture settled. Search hapus, filter, header tanpa shortcut akun, menu baru dan logout teruji. Native/provider nyata belum diuji. |
| R-36 klaim | PASS: tidak ada klaim sertifikasi/keamanan/performa; demo dan batas rilis tertulis pada UI/dokumen. |
| R-37 arahan | PASS: desain Ceria permintaan pengguna, Design Read dan ENERGY 3 / RHYTHM 2 / MOTION 2 pada `DESIGN.md`. |
| R-38 konten | PASS: akun, review dan aktivitas demo diberi label sintetis; tidak membuat profil nyata dari avatar FigCraft. |

### Purpose-Gate

| Item | Status dan alasan |
| --- | --- |
| R-01 gradient/glow | N/A: warna datar. |
| R-04 ikon | PASS: objek pekerjaan menjelaskan layanan; kontrol outline tanpa latar menjelaskan aksi; bintang pada ulasan dan menu penilaian aplikasi. |
| R-06 tipografi | PASS: Roboto/sans sistem sesuai Android, mudah dibaca, tidak mengunduh font saat membuka layar. |
| R-07 pola latar | N/A: tanpa grid/dot dekoratif. |
| R-08 panah | PASS: arah hanya navigasi/kembali, bukan dekorasi setiap CTA. |
| R-09 badge | PASS: status/peran/demo/tag mengomunikasikan keadaan dan filter, tanpa klaim promosi. |
| R-10 glass | N/A: tanpa glassmorphism. |
| R-12 shadow | PASS: panel/kartu memakai warna dan ruang; tidak memberi bayangan besar pada semua komponen. |
| R-13 glow | N/A: tanpa glow. |
| R-14 kartu | PASS: grid profil konsisten untuk membandingkan orang; hierarki masuk/peran/daftar/form berbeda sesuai isi. |
| R-19 motion | PASS: ripple/fade untuk respons dan kontinuitas; reduced motion diuji web, tanpa loop dekoratif. |
| R-22 ilustrasi | PASS: job-hunt/hiring membedakan pencari kerja/pencari tenaga, objek layanan mengikatnya pada pekerjaan harian; sumber berlisensi tercatat. |

### Liveliness

| Item | Status dan bukti |
| --- | --- |
| Dials eksplisit | PASS: ENERGY 3 / RHYTHM 2 / MOTION 2, `DESIGN.md`. |
| Konsistensi dials | PASS: ilustrasi berenergi pada masuk/peran, hero beranda; kontak/uang/form lebih tenang. Menu Akun transparan tetap mengikuti hierarki Ceria, preview `account-menu-preview.png`. |
| Fokus layar | PASS: ilustrasi/peran/aksi utama atau judul ringkasan tunggal pada capture final. |
| Whitespace | PASS: 20/24/32 dp konten, sela 12 dp pada pasangan profil; isi kartu 16 dp, kelompok akun memakai pemisah tanpa garis akhir. |
| Aksen | PASS: hijau memandu aksi utama; multicolor terbatas pada objek layanan. |
| Motif | PASS: objek kerja sehari-hari berwarna, bentuk lembut, kontrol outline transparan dan header logo asli berulang pada lima tujuan. |
| Design Read | PASS: arah tertulis `DESIGN.md`; implementasi mengikuti studi Ceria pengguna. |

### Craftsmanship dan Quality Locks

| Item | Status dan bukti |
| --- | --- |
| C-1 intentionality | PASS: alasan warna, font, ruang, bentuk, gambar dan gerak tertulis `DESIGN.md`. |
| C-2 fungsi | PASS alur web teruji: suite browser menjalankan tindakan utama serta error/retry, tidak menambah CTA dekoratif. |
| C-3 komposisi | PASS: peta/daftar/form/riwayat memenuhi alur kerja harian existing; tanpa bagian promosi pengisi. |
| C-4 resilience | PASS state web teruji: 320–1440, keyboard/reduced motion, lokasi/tile/error recovery; native belum diverifikasi. |
| C-5 bukti | PASS: fixture sintetis eksplisit; tidak ada klaim produksi dari tes lokal. |
| R-05 template | PASS: struktur berdasarkan peran, penemuan geografis, izin kontak dan kesepakatan, bukan landing template. |
| R-11 radius | PASS: tombol 16, field 14, notice 16, kartu/panel 20, sheet 28; baris pengaturan berbagi border kelompok. |
| R-15 CTA | PASS: label tindakan nyata, misalnya Masuk dengan Google, Buka peta sekitar, Kirim permintaan kontak. |
| R-16 buzzword | PASS: copy Indonesia berorientasi tugas; tidak ada klaim pemasaran AI. |
| R-20 kekhususan | PASS: peran buruh/penyedia, layanan rumah, radius/kota, izin kontak dan COD terpisah. |
| R-21 tema | PASS: light theme sesuai desain yang diminta, tanpa dark mode parsial. |
| R-29 palette | PASS: hierarki token hijau/putih/netral; warna ilustrasi terpisah dari warna status/teks. |
| R-30 identitas | PASS: logo/aset proyek sendiri, hanya karakter ramah dan objek multicolor terinspirasi referensi; tidak menyalin artwork Gojek. |
| R-31 alasan | PASS: setiap keputusan utama punya alasan satu baris pada bagian Arah dan alasan `DESIGN.md`. |

## Privasi dan ancaman perubahan

Foto publik tetap melalui otorisasi existing dan `readPhoto` yang membatasi origin, tipe serta ukuran; data foto di memori. Marker web memakai textContent/elemen DOM untuk konten pengguna, bukan interpolasi HTML. SVG berasal dari aset proyek. Pemisahan marker tidak mengubah koordinat publik/otorisasi radius. Consent foto dinonaktifkan selama proses agar pilihan tidak berlomba dengan reset. Tidak ada perubahan SQL, otoritas peran, nomor, consent kontak atau pengakuan COD. Tes sintetis tidak menggantikan pengujian kebijakan Supabase nyata.

Refinement tidak menambah endpoint atau mutasi. Isi notifikasi dirender sebagai Text, rute tetap allowlist contact/agreement, status dibaca menunggu API; pengiriman ganda tetap dikunci. Border kartu adalah pengelompokan dekoratif; batas field memakai `outline`, teks/ikon/status tetap memberi petunjuk nonwarna.

Perubahan menu tidak mengubah auth, COD atau SQL. Logout memanggil alur existing dengan pending/lock; hapus akun tetap menuju form persetujuan existing. Informasi ketentuan/atribusi tidak memanggil API privat; URL sumber fixed pada source, teks dirender sebagai Text. Tidak membuat URL toko atau klaim kebijakan final. Runtime logout, secure storage dan pembukaan tautan Android belum diuji pada perangkat.

## Terbuka sebelum rilis

- Android SDK/adb tidak tersedia: belum ada APK/AAB, runtime peta native, TalkBack, fontScale, IME/insets, System Back atau performa perangkat.
- Google/Phone/WhatsApp dan staging end-to-end belum diuji. DB/Edge/Worker tidak diubah atau diuji ulang pada slice Ceria; hasil lama tetap historis.
- Audit online: 43 advisory terpropagasi (41 high, 2 moderate), dua asal picomatch/minimatch. Detail `ceria/dependency-audit.json`. Reachability runtime belum dibuktikan; remediasi kompatibel diperlukan. Tidak memaksa downgrade Expo/RN.
- Tidak ada deployment, migrasi remote, publishing atau commit melalui parent repository.
