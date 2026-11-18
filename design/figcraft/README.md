# UpahGo: review desain Kestrel

18 November 2026. **75 layar/state Android, 3 papan panduan, 19 variabel warna, 368 tautan prototipe.** Desain sudah diimpor dan disimpan pada dokumen FigCraft yang dibagikan pengguna.

- [Kanvas bersama tersimpan](UpahGo-Kestrel-shared.figcraft): dokumen yang sedang dibuka di FigCraft; Page 1 kosong asli dipertahankan.
- [File mandiri](UpahGo-Kestrel.figcraft): tujuh halaman desain tanpa Page 1 kosong.
- [Ringkasan visual](overview.png).
- [Inventaris lengkap](INVENTORY.md), [hasil pemeriksaan](REVIEW.md), [hasil otomatis](verification.json).

## Arah desain

Referensi pengguna: [Kestrel Pay, Kombai](https://kombai.com/gallery/inspirations/bento-grid-ios-6/), [live preview](https://agent.kombai.com/kombai-inspiration-library/sections/bento-grid/ios/6/index.html). Kanvas bone `#F5F1EA`, panel ivory `#FEFBF6`, tomato `#C14033`, sky `#C6D8ED`, lime `#D8E46E`, ink `#24211D` mengikuti referensi yang diperiksa. Teks sekunder `#625B52` diperkuat untuk kontras. Logo hijau/emas asli tetap utuh.

Design Read: Operate, ENERGY 2 / RHYTHM 1 / MOTION 2. Pembaca mencari kerja atau tenaga harian; tugas utama harus terbaca cepat di Android. Warna hangat dan bidang besar memberi karakter, susunan konsisten menjaga orientasi. Tomato memusatkan aksi, sky mengelompokkan layanan pekerja, lime mengelompokkan kebutuhan dan pilihan; status memakai label serta warna. Roboto mempertahankan bahasa visual native dan keterbacaan. Prototipe memakai transisi instan; spesifikasi motion ringan tidak berarti animasi aplikasi telah dibuat.

Perubahan utama:

1. Masuk menggunakan tombol putih, label jelas, Google G resmi.
2. Pilih peran menggunakan dua ilustrasi besar berdampingan, pilihan bertanda centang.
3. Beranda memiliki panel aksi penuh, pencarian berlabel, filter ringkas, dua kartu profil per baris.
4. Peta memakai pin beravatar ilustratif. Dua titik sama terpisah secara visual dengan garis ke titik asal; koordinat publik tetap perkiraan.
5. Kontak, penerimaan pekerjaan, pemeriksaan hasil, penerimaan uang COD menjadi langkah berbeda dengan konsekuensi tertulis.
6. Bantuan, consent foto, error, kosong, loading, offline, validasi dan pemulihan masuk turut dirancang.

`DESIGN.md`, `design/tokens.json`, dan kode aplikasi belum diubah. Palet FigCraft adalah usulan redesign untuk review ini, belum menjadi token produksi.

## Mencoba prototipe

1. Buka file FigCraft. Pilih halaman `01 · Mulai dan onboarding`.
2. Pilih frame `login · Masuk`, tekan **Present**. Bisa pula memilih frame Beranda, peta, atau kesepakatan sebagai titik awal.
3. Klik tombol alur. Pilihan peran berpindah ke state yang sesuai. Pada peta, klik kelompok `2` untuk melihat pemisahan pin.
4. Kembali ke editor untuk meninjau halaman lain. Semua teks, bidang, ikon dan susunan tetap dapat diedit. Ilustrasi, avatar dan logo adalah gambar tertanam.

Alur yang benar-benar dicoba di aplikasi FigCraft: Masuk → Coba demo → Pengenalan → Lewati → Pilih peran → Cari tenaga → Lokasi → Profil → Simpan → Beranda → Buka peta → Kelompok 2. Navigasi antarhalaman berhasil. Semua 368 tujuan tautan diperiksa secara struktural; seluruh kontrol belum diklik satu per satu.

**Batas desain:** isian, filter, pilihan angka, editor foto dan radius memakai state contoh tetap. Kontrol tersebut belum menjalankan fungsi aplikasi. Checkbox izin foto berpindah antara state belum/setuju; pengiriman tampak disabled sebelum dipilih. Data orang, jarak, waktu, upah dan status bersifat sintetis, berlabel pada layar. Tidak ada login, GPS, SMS, WhatsApp, laporan, penghapusan atau pembayaran nyata dijalankan.

Peta adalah skema berlabel, bukan data navigasi. Percobaan tile menghasilkan gambar blokir akses dan tidak digunakan. Implementasi nanti harus memakai peta yang terkonfigurasi, beratribusi, menjaga pembulatan koordinat dan pemisahan pin pada zoom maksimum.

## Sumber aset

Sumber dan lisensi: [assets/SOURCES.json](assets/SOURCES.json). Dua ilustrasi unDraw gratis dipakai untuk konteks mencari kerja dan merekrut tenaga; avatar contoh adalah crop ilustrasinya, bukan foto manusia nyata. Google G berasal dari panduan resmi. Ikon Material dan logo memakai aset proyek yang ada. Tidak ada layanan berbayar atau generator gambar digunakan.

## Verifikasi dan gerbang produksi

`python3 design/figcraft/build_design.py` menyusun perintah native. `figcraft-cli run` menyelesaikan 3.178 perintah tanpa error; `figcraft-cli export` menghasilkan 78 PNG, yaitu 75 layar dan 3 papan panduan. `python3 design/figcraft/verify_design.py` memeriksa dokumen serial: 75 layar, 19 variabel, 368 interaksi valid, 1.149 node teks, tanpa teks di luar batas parent, 999 pasangan kontras dengan minimum 4,61:1. Perhitungan mengecualikan gambar raster dan tidak menggantikan inspeksi visual.

Pemeriksaan visual dilakukan dalam batch, diikuti satu batch perbaikan dan konfirmasi. Perbaikan anotasi lokasi yang ditemukan pada walkthrough ikut disimpan pada kanvas bersama. Enam contact sheet merangkum halaman layar.

**Belum layak dinyatakan sebagai aplikasi produksi:** kode belum diimplementasikan dari desain ini. TalkBack, text scaling, keyboard, safe area perangkat, performa, pemulihan koneksi, kontrol otorisasi serta integrasi live harus diuji saat implementasi. Tidak menjalankan lint, test atau build aplikasi karena perubahan hanya artefak desain. Tidak ada publikasi atau deployment.

Langkah berikutnya: review visual dan alur di FigCraft, tetapkan perubahan yang diterima, lalu implementasikan bertahap pada React Native + Expo tanpa mengubah kontrak keamanan produk.
