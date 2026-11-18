# UpahGo Ceria: desain sebelum implementasi

Pembaruan: pengguna kemudian meminta implementasi ke aplikasi. Kode aktif kini memakai aset Ceria di `assets/ceria`, `DESIGN.md`/token versi 2. Catatan di bawah merekam status saat artefak desain dibuat; pemeriksaan aplikasi terpisah ada di `TESTING.md`.

18 November 2026. Revisi arahan pengguna: semua layar lebih fun ala aplikasi Gojek, terutama ikon dan aset, tanpa bentuk kotak yang berulang. Logo UpahGo hijau/emas dipertahankan.

75 layar/state Android 412 × 892 pada tujuh halaman, empat papan panduan, 22 variabel warna dan 370 tautan prototipe. Versi Kestrel lama tetap tersedia di `../figcraft/` untuk perbandingan. Ini artefak review desain, bukan persetujuan implementasi atau rilis.

- `UpahGo-Ceria.figcraft`: file mandiri yang dapat diedit.
- `overview.png`: masuk, pilih peran, beranda, pemisahan pin.
- `previews/0/Aset Ceria · ikon dan ilustrasi.png`: papan semua aset.
- `contact-1.png` sampai `contact-6.png`: seluruh layar.
- `manifest.json`, `INVENTORY.md`: daftar layar dan alur.
- `verification.json`, `REVIEW.md`: bukti dan batas pemeriksaan.

## Arah visual

Design Read: **Operate · ENERGY 3 / RHYTHM 2 / MOTION 2**. Pengguna mencari kerja atau tenaga harian di Android. Karakter ceria muncul pada objek layanan berwarna, ilustrasi peran dan pin identitas. Form, izin kontak dan nilai upah tetap tenang dan mudah dipindai.

Hijau aksi `#087F52`, putih `#FFFFFF`, teks hijau gelap `#20352B`. Mint, peach, biru dan lilac mengelompokkan objek/layanan; merah khusus kesalahan dan tindakan berisiko. Roboto mempertahankan keterbacaan native. Radius beragam: tombol/chip membulat, bidang isian 16, informasi 16–20, ilustrasi 28–36. Daftar memakai ruang dan garis pemisah; kartu profil hanya mengelompokkan identitas serta layanan.

Referensi visual diperiksa di [Gojek](https://www.gojek.com/id-id) dan [halaman aplikasi resmi](https://apps.apple.com/id/app/gojek/id944875099). Pengaruh pada kehangatan, hijau, ilustrasi dan keterbacaan; logo, nama layanan, navigasi dan artwork Gojek tidak disalin.

## Perubahan

1. Masuk: Google G resmi, tombol putih berbingkai dengan area sentuh besar.
2. Peran: dua ilustrasi besar berdampingan, aksen koper dan rumah, centang pilihan.
3. Beranda: aksi peta dominan, pencarian, empat pintasan layanan berwarna, profil sekitar.
4. Temukan: pin beravatar, cluster dan pemisahan dua pin pada zoom maksimal, titik asal dipertahankan.
5. Aktivitas, notifikasi, akun dan katalog: daftar lega, ikon berwarna sesuai konteks.
6. Form dan bantuan: hierarki ringkas, permukaan lembut, tombol tindakan jelas.
7. Loading, kosong, error, offline, validasi, consent, pending dan hasil dirancang terpisah.

## Aset

`assets/icon-*.svg`: 29 ikon kontrol dengan stroke bulat. `assets/service-*.svg` dan PNG 256: 13 ikon objek multicolor buatan khusus proyek. Dua ilustrasi peran unDraw yang sudah berlisensi disesuaikan aksennya. Tiga avatar dipotong dari SVG resolusi tinggi; semuanya ilustratif, bukan foto pengguna. Sumber/lisensi berada di `assets/SOURCES.json`. Logo proyek dan Google G tetap asli. Tidak ada generator gambar atau layanan berbayar digunakan.

SVG layanan/kontrol di FigCraft tetap berupa layer vektor yang dapat diedit. Gambar peran, identitas dan logo tertanam. `assets/instances/` berisi ukuran/warna SVG yang dipakai pembangun canvas, bukan aset tambahan berbeda.

## Batas prototipe

Data orang, jarak, waktu dan upah sintetis, berlabel pada setiap layar. Isian, filter, radius dan editor foto menunjukkan state tetap. Tautan menghubungkan layar; prototipe tidak menjalankan Google OAuth, GPS, SMS, kontak nyata, laporan, penghapusan atau COD. Persetujuan nomor, penerimaan pekerjaan, penyelesaian dan pengakuan uang tunai tetap langkah berbeda.

Peta adalah skema ilustratif berlabel. Bukan data geografis atau navigasi. Foto contoh bukan verifikasi identitas. Tidak ada klaim keamanan atau jaminan pembayaran.

## Membangun ulang

Jalankan `python3 design/figcraft-fun/build_assets.py`, lalu `python3 design/figcraft-fun/build_design.py`. Gunakan CLI FigCraft yang sudah terpasang untuk menjalankan `commands.json`, mengonversi ke `document.json` dan mengekspor tujuh halaman bernama `Ceria 00` sampai `Ceria 06`. Jalankan `verify_design.py`. `build_previews.py` memerlukan Python yang memiliki Pillow; runtime bawaan Codex tersedia di mesin ini.

Kode aplikasi, `DESIGN.md`, `design/tokens.json` dan ekspor logo produksi tidak diubah. Lint, test dan build aplikasi tidak dijalankan untuk artefak desain ini. TalkBack, pembesaran teks, keyboard, safe area perangkat, performa dan integrasi live masih harus diuji saat implementasi. Belum layak disebut aplikasi siap produksi.
