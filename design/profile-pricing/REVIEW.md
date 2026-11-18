# Review konsep profil dan harga

18 November 2026. **Konsep mandiri, belum diterapkan ke aplikasi.** Pengguna memilih harga per pekerjaan/sesi. `index.html` memakai font, ikon dan artwork Ceria existing; tidak ada dependency, foto atau identitas baru. Nilai contoh sintetis, bukan tarif rekomendasi/resmi.

## Bukti dan batas

- `node design/profile-pricing/build.mjs` lulus; HTML mandiri dihasilkan dari template dan aset existing.
- `node design/profile-pricing/verify.mjs` lulus pada Chrome. Empat belas capture perangkat serta satu halaman desktop, tanpa `pageerror`. Hasil pada `verification.json`.
- Pemeriksaan mencakup 320/412 px, nama/tag panjang, harga kosong, dua peran, izin kontak/pending, nominal salah, review/edit, draf memori, escaping, pencarian/kosong/gagal/retry/loading, Escape/pemulihan fokus, reduced motion.
- `python3 design/verify.py` lulus: 29 pasangan kontras serta aturan token. Sampel teks DOM detail akhir minimum 4,66:1; bukan audit setiap piksel/artwork.
- Satu inspeksi batched, satu batch perbaikan (format rupiah, kembali, ikon rincian), satu konfirmasi `overview.png`. Tidak ada putaran polish lanjutan.
- Source aplikasi React Native/API/SQL tidak diubah. Lint/build/unit/DB aplikasi tidak diulang untuk artefak ini. Android, TalkBack, keyboard perangkat, integrasi nyata dan pengiriman tawaran belum diuji.

## Implikasi implementasi

Kontrak `Person` saat ini belum memiliki tarif/anggaran; `Agreement.wage` adalah total yang terkait kesepakatan. Implementasi berikutnya perlu input tarif/anggaran oleh pemilik dan pembacaan server, bukan mengarang harga dari profil atau riwayat. Harga yang belum diisi harus tetap kosong secara eksplisit. “Bisa nego” memerlukan pilihan pemilik. Harga awal tidak otomatis mengubah nominal kesepakatan.

Negosiasi di prototipe hanya draf lokal setelah simulasi persetujuan kontak. Belum ada API kirim/terima tawaran. Implementasi harus mempertahankan izin kontak dua pihak, akses berdasarkan aktor server, penerimaan tugas/jadwal/upah oleh pihak terkait, serta pengakuan COD terpisah. Tidak mengubah kebijakan produk melalui mockup.

## Delivery Gate antislop

PASS hanya untuk prototipe dan state web yang diperiksa. N/A berarti teknik tidak digunakan. Tidak memberi PASS Android atau transaksi nyata.

### Hard Gate

| Item | Status dan bukti |
| --- | --- |
| R-02 tanda baca | PASS: pencarian tanda em dash pada template/brief tidak menemukan teks tersebut. |
| R-03 overflow | PASS web: assertion scrollWidth untuk device/content/card/section/summary pada capture 320/412; nama/tag panjang ikut diperiksa. |
| R-17 statistik | PASS: angka dan rating berlabel data sintetis, tanpa metrik pemasaran. |
| R-18 testimoni | PASS: ulasan contoh berasal dari fixture sintetis, banner konsep selalu terlihat. |
| R-23 aset | PASS: pengguna meminta konsep kartu/detail/harga; hanya memakai aset Ceria existing dan ikon rumah/orang sebagai fallback, tanpa foto orang baru. |
| R-24 tautan | PASS: kontrol navigasi lokal menuju state yang ada, tanpa URL toko atau layanan palsu. |
| R-25 kontras | PASS token: 29 pasangan lulus; sampel teks DOM 4,66:1 minimum. Artwork tidak disertifikasi. |
| R-26 kontrol | PASS prototipe: navigasi, detail, pencarian, accordion, izin, nominal, review/edit dan draf mempunyai handler; alur utama dijalankan melalui verify.mjs. Tidak ada pengiriman nyata diklaim. |
| R-27 state | PASS: memuat, kosong, gagal/retry, consent, pending, validasi dan draf tersedia serta diuji. |
| R-28 FAQ | N/A: tidak menambah FAQ. |
| R-32 keyboard | PASS web teruji: kontrol native HTML, focus-visible, dialog Escape dan fokus kembali ke pemicu; label/input dan aria-expanded tersedia. |
| R-33 source | PASS: fitur ditulis langsung pada template; build.mjs hanya menyisipkan aset/font lokal. |
| R-34 tema | N/A: satu tema terang mengikuti Ceria. |
| R-35 runtime | PASS prototipe: Chrome menjalankan alur lokal dan menghasilkan 14 capture + desktop, tanpa pageerror. Bukan penerimaan aplikasi atau setiap integrasi nyata. |
| R-36 klaim | PASS: tidak mengklaim tarif resmi, keamanan, performa atau kesiapan rilis. |
| R-37 arah | PASS: Ceria existing, Operate, ENERGY 3 / RHYTHM 2 / MOTION 2 diwarisi dari DESIGN.md, brief permukaan tercatat. |
| R-38 konten | PASS: setiap device memiliki label konsep/data sintetis; hasil simpan menyebut tidak ada tawaran dikirim. |

### Purpose-Gate

| Item | Status dan alasan |
| --- | --- |
| R-01 gradient/glow | N/A: warna datar. |
| R-04 ikon | PASS: objek pekerjaan menjelaskan tugas; orang/rumah membedakan identitas; pensil menandai harga dapat dibahas. |
| R-06 font | PASS: Roboto existing mengikuti Android dan skala Ceria, tanpa display font dekoratif. |
| R-07 pola | N/A: tanpa grid/dot latar. |
| R-08 panah | PASS: kembali dan buka/tutup rincian, bukan dekorasi CTA. |
| R-09 badge | PASS: tag mengidentifikasi tugas; state izin/demo menjelaskan keadaan, tanpa badge promosi. |
| R-10 glass | N/A: tanpa glassmorphism. |
| R-12 bayangan | N/A: border dan ruang, tanpa shadow besar. |
| R-13 glow | N/A: tanpa glow. |
| R-14 kartu | PASS: struktur seragam hanya untuk membandingkan profil, detail memakai section berpemisah. |
| R-19 motion | PASS: tidak ada gerak dekoratif; reduced motion tetap dapat membuka/menutup dialog. |
| R-22 ilustrasi | PASS: sapu/pel/dapur dari aset Ceria berhubungan langsung dengan pekerjaan. |

### Liveliness

| Item | Status dan bukti |
| --- | --- |
| Dials | PASS: ENERGY 3 / RHYTHM 2 / MOTION 2 existing; tidak menciptakan identitas baru. |
| Konsistensi | PASS: artwork ceria di kartu, detail/form lebih tenang, tanpa animasi pengalih perhatian. |
| Fokus | PASS: kartu mengutamakan orang/harga; detail nama/tugas; editor nominal usulan. overview.png. |
| Whitespace | PASS: kelompok identitas rapat, section 20–22 px, footer terpisah; detail teknis dibuka progresif. |
| Aksen | PASS: hijau untuk aksi; peach/mint terbatas pada artwork dan identitas. |
| Motif | PASS: artwork tugas, avatar berbingkai putih dan ikon kontrol transparan mengikuti Upahgo. |
| Design Read | PASS: pekerjaan harian, harga terlihat sebelum kontak, hierarki pada BRIEF.md. |

### Craftsmanship dan Quality Locks

| Item | Status dan bukti |
| --- | --- |
| C-1 intentionality | PASS: alasan komposisi dan harga ditulis pada BRIEF.md. |
| C-2 fungsi | PASS prototipe: handler nyata mengubah state lokal; simulasi tidak disamarkan sebagai aksi server. |
| C-3 komposisi | PASS: profil, lingkup, harga dan izin mendukung keputusan kerja; tanpa section promosi. |
| C-4 resilience | PASS state web teruji: 320/412, panjang, kosong, gagal, pending, validasi, keyboard dialog. Native belum diverifikasi. |
| C-5 bukti | PASS: angka contoh dilabeli; tidak mengklaim hasil layanan nyata. |
| R-05 template | PASS: kartu komparasi dan detail kebutuhan kerja, bukan pola landing/bento promosi. |
| R-11 radius | PASS: tag 8, field 14, tombol 16, kartu 20, dialog 24; tidak semua berbentuk pil. |
| R-15 CTA | PASS: Hubungi, Tawar upah, Tinjau usulan, Simpan draf; label menjelaskan aksi. |
| R-16 buzzword | PASS: copy berorientasi tugas, tanpa klaim AI/promosi generik. |
| R-20 kekhususan | PASS: peran, tugas rumah, lokasi perkiraan, izin WhatsApp, upah total dan COD terpisah. |
| R-21 tema | PASS: terang sesuai arahan; tidak menambah dark mode parsial. |
| R-29 palet | PASS: token Ceria, warna objek existing terpisah dari status/teks. |
| R-30 identitas | PASS: bahasa komponen dan aset Upahgo, tanpa menyalin artwork aplikasi referensi. |
| R-31 alasan | PASS: alasan latar avatar, tag, section, harga dan aksi ada pada brief serta catatan konsep. |
