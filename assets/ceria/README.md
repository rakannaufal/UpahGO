# Aset aplikasi Ceria

Diport dari desain yang diminta pengguna, `design/figcraft-fun`.

- `controls.json`: 29 SVG kontrol asli proyek, viewBox 24, rounded stroke 2. Kontrol yang belum dipindahkan memakai glyph Material existing, bukan unduhan runtime.
- Semua ikon antarmuka dirender 24 dp hijau melalui `Icon`; lima varian navigasi terisi didefinisikan di komponen tersebut sesuai permintaan pengguna. Bintang penilaian juga hijau 24 dp. Centang putih pada pilihan hijau menjaga kontras.
- `services.json`: 13 SVG objek layanan multicolor asli proyek, viewBox 64. Dirender `react-native-svg` pada Android/web.
- Objek multicolor dirender melalui `ServiceArt`, dengan ukuran diperkecil. Empat pintasan layanan mempertahankan gambar sebelumnya pada 36 dp sesuai koreksi pengguna; Aktivitas, Notifikasi dan menu tetap memakai ikon antarmuka monokrom tanpa bidang latar.
- `job-hunt.png`, `hiring.png`: ilustrasi peran unDraw berlisensi, warna aksen disesuaikan; sumber di `SOURCES.json`.
- `google-g.png`: Google G resmi. Hanya pada tombol autentikasi Google putih.

Logo asli tetap dari `assets/brand/exports`. Foto profil publik tetap dari alur foto berizin existing. Avatar contoh FigCraft tidak diport sebagai identitas pengguna. Peta skematis desain tidak diport ke aplikasi geografis. Tidak ada aset Gojek disalin atau layanan generasi berbayar dipakai.

Master SVG dan definisi generator objek tetap `design/figcraft-fun/build_assets.py`. JSON merupakan subset vektor yang dipakai aplikasi, bukan token warna UI alternatif. Sumber/provenance: `SOURCES.json` dan `assets/licenses/README.md`.
