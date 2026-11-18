# Kartu profil, detail dan harga per sesi

18 November 2026. Implementasi React Native + Expo, arah Ceria existing. Antislop during dari preferensi global. Mode Operate, ENERGY 3 / RHYTHM 2 / MOTION 2. Konsep disetujui pengguna, unit per pekerjaan/sesi. Identitas tetap pada DESIGN.md dan design/tokens.json.

## Perubahan

- Avatar kartu/detail memakai mint/peach dan bingkai putih. Cover 88/108 dp. Ikon kontrol tetap transparan.
- Tag mengikuti teks, maksimal dua pada kartu beserta jumlah sisanya. Detail memakai label katalog lengkap.
- Harga awal di dasar kartu; identitas, harga, tugas, kondisi dan ulasan dipisahkan pada detail. Aksi tetap di footer, rincian akses dapat dibuka lewat keyboard.
- Edit profil menyimpan nominal opsional dan kesediaan nego per peran. Harga kosong dinyatakan terang. Nominal ≥Rp10 juta memakai 16 sp di kartu agar tetap utuh pada 320 dp.
- Kontak dua pihak mendahului editor usulan. Review usulan belum mengirim data; tugas/jadwal dan review final mendahului create_agreement. Pihak lain menerima pekerjaan; COD tetap langkah terpisah.
- SQL privat menyimpan harga awal terpisah dari Agreement.wage. Klien lama tanpa field harga mempertahankan data. Tidak ada dependency baru, migrasi remote, deployment, publikasi atau commit melalui parent repository.

## Review terarah izin dan uang

What this change does: Menyimpan harga awal yang dipilih pemilik per peran, menampilkannya melalui penemuan berizin, memakai alur kesepakatan existing untuk nego. Harga awal tidak mengubah upah yang sudah disepakati.

Boundary diperiksa: setup/MoneyField → shared parser → DemoApi atau API Worker → wrapper harga → photo_action/work_action/design_action/geo_action/core_action → tabel privat. Profile/discover tetap tunduk consent visibilitas, kota/radius, akun aktif dan blokir. Wrapper harga membatasi body asli sebelum stripping, memvalidasi actor auth.uid(), membiarkan gate/actor lock existing berlaku, menulis dengan role hasil server, serta mencabut grants helper. PK user/peran mengisolasi data, exception me-rollback edit profil dan harga sekaligus. Discovery dibatasi 40 hasil; helper harga memakai lookup PK, bukan request jaringan per kartu.

Flow diperiksa: profil mencari accepted/pending contact dengan ID dan peran kedua pihak; kontak expired tidak membuka editor. Draft usulan hanya di memori, URL berisi contactId/intent. Tidak ada pengiriman otomatis, penerimaan otomatis atau perubahan status uang dari tombol Tawar upah. Server create_agreement tetap otoritas peserta, consent, nominal, konflik proposal dan transisi.

Temuan diperbaiki: demo sebelumnya menormalkan priceNegotiable:null menjadi false, berbeda dengan SQL yang menolak. Kini nilai eksplisit harus boolean, regression assertion pada tests/prices.test.ts. UI menghapus error nominal ketika pengguna mengedit angka; input valid tidak terus diberi pesan invalid. Batas dan data lama tetap dipertahankan.

Inspeksi visual dua batch selesai. Batch pertama menunjukkan error nominal tertinggal; batch konfirmasi membuktikan perbaikan dan harga maksimum utuh, tetapi label floating pada editor 320 px masih bertumpuk saat viewport berubah. Perbaikan terakhir memakai label tetap di atas input nominal/catatan. Pemeriksaan posisi label/input dilakukan lewat assertion browser pada 320/412/1440, tanpa batch inspeksi visual ketiga. Capture editor lama di folder bukti mendahului perbaikan label; preview handoff hanya memakai kartu/detail yang tidak berubah. Native tetap belum diverifikasi.

Tidak ada temuan correctness/otorisasi tambahan pada slice ini setelah perbaikan. Ini review terarah source dan tes sintetis, bukan audit seluruh repo atau penerimaan Supabase/Android/live. Gerbang rilis tetap terbuka untuk target dan dependensi yang belum diverifikasi di TESTING.md.

## Batas platform dan operasi

Android SDK/adb tidak tersedia saat pemeriksaan. Export Hermes bukan APK/AAB. System Back, TalkBack, fontScale perangkat, IME/insets, lifecycle, peta native, OAuth/SMS, penyimpanan sesi dan performa belum diuji pada perangkat. SQL menggunakan PostgreSQL disposable dengan Auth shim, bukan PostgREST/Supabase staging. Migrasi harga hanya tersedia lokal.

Audit dependensi 43 advisory (41 high, 2 moderate) adalah hasil sebelumnya, tidak diulang dalam slice harga. Remediasi/reachability dan operasi layanan tetap diperlukan sebelum rilis. Tidak ada klaim produksi dari preview atau bundle.

## Delivery Gate, lingkup preview web lokal

Pemeriksaan: typecheck/lint final lulus; 30 unit lulus; 135 assertion SQL disposable lulus; suite penuh 16/16 sebelum label tetap; tes harga final 1/1 (21 detik) dengan assertion posisi label 320/412/1440. Web dan Android export final lulus. Worker dry-run dan verifier token lulus. Satu tes final sempat timeout di onboarding sebelum mencapai form; pengulangan tanpa build paralel lulus, penyebab timeout belum diketahui. Rincian di TESTING.md.

Report berikut membatasi PASS pada source dan preview web yang diuji. Android/live UNVERIFIED, bukan PASS rilis. Bukti capture: profile-pricing/captures.json (22 capture, pageErrors kosong), confirmation.jpg, implementation-preview.png. Editor pada capture mendahului label tetap; lihat catatan inspeksi di atas. Kontras: profile-pricing/contrast.json, sembilan pasangan 4,66–13,08:1; verifier token juga lulus 29 pasangan.

### Hard Gate

| Item | Status dan bukti |
| --- | --- |
| R-02 copy | PASS: pencarian karakter em dash pada enam source UI berubah tidak menemukan hasil; copy baru Indonesia berorientasi tugas. |
| R-03 responsive | PASS web: overflow dokumen diperiksa 320/412/1440; harga Rp50 juta satu baris, target Tawar upah ≥48 px. Label floating yang terdeteksi diganti label tetap, ditambah assertion posisi label/input. Native belum diuji. |
| R-17 angka | PASS: harga berasal input pemilik, nullable; angka seed hanya pada Demo · data sintetis. Tidak mengarang harga dari rating atau riwayat. |
| R-18 ulasan | PASS: tidak menambah testimonial/foto orang; ulasan existing hanya fixture demo berlabel. |
| R-23 aset | PASS: avatar berlatar diminta pengguna, ikon/aset existing digunakan ulang; tidak membuat identitas/foto baru. |
| R-24 navigasi | PASS: kartu membuka profil, footer mengarah kontak/kesepakatan existing; tidak menambah tujuan kosong. |
| R-25 kontras | PASS: sembilan kombinasi teks pada slice ≥4,66:1, contrast.json; light theme token existing. |
| R-26 fungsi | PASS untuk kontrol teruji dalam daftar click-through di bawah. Retry harga memakai priceLoad.reload existing, diperiksa source; belum dipicu pada layanan live. |
| R-27 state | PASS source dan subset runtime: useLoad memberi loading/error/retry, harga kosong tampil jujur, error nominal diuji dan input bertahan, pending kontak tidak membuka editor. Kegagalan harga awal dapat dilanjutkan manual; cabang itu diperiksa source, belum dipicu runtime. |
| R-28 FAQ | PASS: tidak menambah FAQ. |
| R-32 keyboard | PASS web: disclosure Enter/aria-expanded, draft Escape/tombol, fokus dan navigasi existing melalui suite core; input punya accessibilityLabel. TalkBack belum diuji. |
| R-33 penulisan source | PASS: komponen diubah langsung lewat patch source; script Python hanya menyusun bukti gambar, tidak mengubah CSS/source. |
| R-34 tema | PASS: satu tema terang sesuai arahan; tidak ada toggle atau mode parsial baru. |
| R-35 dijalankan | PASS pada alur tercatat: web export, Chrome sintetis, daftar kontrol di bawah, pageErrors kosong. Android hanya export, bukan runtime. |
| R-36 klaim | PASS: tidak menambah jaminan keamanan, pendapatan, performa atau status pembayaran. |
| R-37 arah | PASS: DESIGN.md dan konsep pengguna menjadi authority; Ceria Operate, ENERGY 3 / RHYTHM 2 / MOTION 2. |
| R-38 konten | PASS: label katalog dan data layanan/input pemilik; simulasi tetap eksplisit, tanpa social proof produksi. |

### Purpose-Gate

| Item | Status dan alasan |
| --- | --- |
| R-01 gradient/glow | PASS: tidak digunakan pada slice. |
| R-04 ikon | PASS: rumah/orang untuk peran, alat kerja untuk layanan, pensil untuk nego; sistem ikon existing, tanpa sparkle dekoratif. |
| R-06 tipe | PASS: Roboto/platform sans sesuai Android; angka ditebalkan untuk membandingkan nominal, tanpa monospace/uppercase dekoratif. |
| R-07 pola latar | PASS: permukaan polos; latar warna avatar memisahkan identitas dari cover sesuai permintaan. |
| R-08 panah | PASS: chevron hanya disclosure akses; tanpa panah dekoratif pada CTA. |
| R-09 badge | PASS: tag menyebut jenis tugas; Bisa nego adalah status input pemilik, tanpa glow/kapsul pemasaran. |
| R-10 glass | PASS: tidak digunakan. |
| R-12 shadow | PASS: border mengelompokkan kartu, tidak menambah bayangan besar. |
| R-13 glow | PASS: tidak digunakan. |
| R-14 ukuran seragam | PASS: dua kartu per baris untuk membandingkan orang/harga, detail memakai bagian berurutan; alasan pada DESIGN.md. |
| R-19 gerak | PASS: memakai feedback existing dan reduce-motion; tidak menambah engine atau efek dekoratif. |
| R-22 ilustrasi | PASS: alat layanan existing berkaitan dengan tag pekerjaan; tidak menambah ilustrasi generik baru. |

### Liveliness

| Item | Status dan bukti |
| --- | --- |
| Dials | PASS: ENERGY 3 / RHYTHM 2 / MOTION 2 pada DESIGN.md dan brief konsep. |
| Konsistensi | PASS: warna pada artwork/avatar; harga dan consent tetap tenang, confirmation.jpg. |
| Fokus | PASS: orang dan harga pada kartu, identitas pada detail, nominal pada editor. |
| Whitespace | PASS: sela kartu 12 dp, isi 12 dp, bagian detail 20/22 dp; garis memisahkan tugas/harga. |
| Aksen | PASS: hijau untuk langkah utama; bukan semua baris informasi. |
| Motif | PASS: objek kerja, avatar mint/peach, bentuk lembut dan logo Upahgo existing. |
| Design Read | PASS: arah Operate Ceria dan konsep per sesi dinyatakan sebelum implementasi, BRIEF.md/DESIGN.md. |

### Craftsmanship dan Quality Locks

| Item | Status dan bukti |
| --- | --- |
| C-1 intentionality | PASS: alas avatar, tag pendek, harga terpisah dan footer menjawab koreksi pengguna, DESIGN.md. |
| C-2 fungsi | PASS untuk alur teruji: simpan/edit/clear, disclosure, izin kontak, usulan/review/edit, draft guard, proposal dan penerimaan pihak kedua. |
| C-3 komposisi | PASS: identitas, tugas, kondisi dan harga berasal kebutuhan membandingkan serta menyepakati pekerjaan. |
| C-4 resilience | PASS web teruji: 320/412/1440, keyboard, input salah/blank/maksimum, kontak pending, harga dihapus, draft bertahan. Native/live tetap UNVERIFIED. |
| C-5 bukti | PASS: fixture sintetis, input pemilik dan bukti lokal diberi batas; tidak ada klaim produksi. |
| R-05 template | PASS: grid hasil penemuan dan detail tugas, tanpa pola landing/hero statistik baru. |
| R-11 radius | PASS: token control 14, button 16, card 20, tag 8, avatar bulat; tidak menyeragamkan semua bentuk menjadi pill. |
| R-15 CTA | PASS: Hubungi, Tawar upah, Tinjau usulan, Lanjut ke rincian kerja, Kirim kesepakatan menyebut tindakan. |
| R-16 buzzword | PASS: copy tugas dan consent, tanpa istilah pemasaran AI. |
| R-20 kekhususan | PASS: Buruh/Penyedia kerja, pekerjaan rumah, perkiraan jarak, izin nomor dan COD terpisah. |
| R-21 tema | PASS: terang sesuai arahan; tidak menambah dark mode. |
| R-29 palet | PASS: satu sumber token hijau/putih/netral, mint/peach untuk identitas existing; tidak menambah sistem warna. |
| R-30 identitas | PASS: mempertahankan logo/aset Upahgo, tidak menyalin merek atau artwork Gojek. |
| R-31 alasan | PASS: alasan ukuran, label, ruang, warna dan status tertulis di DESIGN.md, bukan default tanpa tujuan. |

## Click-through tercatat

| Kontrol | Bukti hasil |
| --- | --- |
| Kartu orang/kebutuhan | Profil yang dipilih terbuka dengan harga pemilik dan tag lengkap. |
| Akses dan kondisi lokasi | Click/Enter mengubah aria-expanded, rincian jarak/lantai muncul lalu tertutup. |
| Edit profil: nominal | 999 memberi error, input bertahan; 135000 tampil 135.000, simpan berhasil. Edit angka menghapus error lama. |
| Harga bisa dinegosiasikan | Toggle tersimpan; menghapus nominal mematikan dan menonaktifkan toggle. |
| Tampil di peta | Edit profil mematikan presence; opt-in ulang diperlukan sebelum terlihat aktor lawan. |
| Tawar upah sebelum consent | Membuka permintaan kontak; kirim terkunci sampai consent, lalu pending tanpa WhatsApp/editor. |
| Penerimaan kontak | Pihak penerima memberi consent eksplisit, membuka Tawar upah. Tidak ada auto-accept. |
| Tinjau usulan | Blank memberi error; nominal/catatan valid membuka review, dinyatakan belum dikirim. |
| Edit usulan | Mengembalikan angka terformat dan catatan; draft tidak hilang. |
| Kembali dari draft | Buang perubahan? muncul; Lanjut mengisi mempertahankan input. |
| Lanjut ke rincian kerja | Nominal serta catatan terbawa ke form tugas/jadwal existing. |
| Tinjau/Kirim kesepakatan | Review final menampilkan upah/jadwal; kirim membuat status Menunggu kesepakatan. |
| Setujui pekerjaan | Hanya pihak lain lewat dialog konfirmasi menghasilkan Disepakati; tidak menampilkan pengakuan COD. |
| Harga maksimum | Rp50.000.000 utuh pada kartu 320 px, tinggi teks ≤25 px. |
| Hapus harga | Kartu/detail menampilkan Harga belum diisi/Bahas bersama, tanpa tombol nego profil. |

Muat ulang harga hanya diperiksa source (priceLoad.reload dan input manual tetap tersedia), belum dipicu runtime. Alur gagal bootstrap, recovery lokasi, tiles, laporan, blokir, rating, tema terang, keyboard dan lima tab dicakup suite existing. Ini tidak memvalidasi layanan eksternal atau native.
