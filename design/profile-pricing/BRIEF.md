# Kartu profil, detail dan harga

18 November 2026. Konsep untuk ditinjau, bukan tarif resmi atau implementasi transaksi. Referensi visual: tiga screenshot pengguna pada 12.32–12.33. Memperluas Ceria existing; `DESIGN.md` dan `design/tokens.json` tetap otoritas identitas.

- **Tugas:** pekerja dan pemberi kerja dapat membandingkan orang/kebutuhan, memahami ruang lingkup dan harga awal, lalu membicarakan nominal tanpa menganggapnya sudah disepakati.
- **Komposisi:** kartu dua kolom, cover pekerjaan lebih pendek, identitas beralas mint/peach dengan bingkai putih. Tag kecil mengikuti panjang teks, maksimal dua serta jumlah sisanya. Harga dipisahkan garis, bukan hero angka besar. Detail memisahkan identitas, harga, tugas, kondisi dan ulasan; ringkasan durasi/tenaga tidak bercampur dengan beban atau akses.
- **Harga:** pengguna memilih total per pekerjaan/sesi, mengikuti alur total upah existing. Buruh menampilkan “Mulai dari”; pemberi kerja “Anggaran”. Label “Bisa nego” hanya untuk pemilik yang mengizinkannya. Nominal contoh sintetis; bukan diturunkan dari rating atau aktivitas lama. Tanpa data: “Harga belum diisi”, tanpa nominal palsu.
- **Interaksi:** kartu membuka detail; Tawar upah melewati izin kontak dua pihak sebelum editor usulan. Simulasi izin harus dipilih eksplisit. Tinjau usulan menampilkan total dan tugas; simpan hanya draf lokal. Tidak mengirim tawaran atau menganggap harga diterima. Kelak penerimaan kesepakatan server dan pengakuan COD tetap terpisah.
- **Cakupan:** prototipe HTML mandiri dengan aset/logo/font existing. Tidak mengubah aplikasi React Native, kontrak API, SQL atau kebijakan uang. Screenshot 320/412 dan tampilan desktop, keyboard, dialog, input salah, tanpa harga, tag/nama panjang, pending/error/retry/empty diperiksa lokal. Android/TalkBack belum diverifikasi.

## Direction contract

**Thesis:** orang, pekerjaan dan harga terbaca sebelum membuka detail. Tag berhenti menjadi balok selebar kartu.

**Own-world:** Ceria hijau/putih, garis kartu jelas, objek layanan multicolor, Roboto, kontrol tanpa bidang warna. Latar hanya untuk identitas dan artwork.

**Story:** bandingkan, pahami tugas, lihat harga, minta izin, bicarakan usulan, tinjau kesepakatan.

**First viewport:** dua kartu per baris, cover 88 px, nama 16/22, metadata 13/19, tag 12/18, harga 18/24. Detail memakai nama 24/32, ringkasan harga dan rincian berlabel; aksi melekat pada dasar layar.

**Form:** perluasan komponen yang ditentukan pengguna; tanpa pergantian identitas atau turnamen konsep.

**Finish:** prototipe dapat dicoba, pemeriksaan terukur dan satu inspeksi visual lalu maksimal satu konfirmasi; dokumentasi menjelaskan batas prototipe.
