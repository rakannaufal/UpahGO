# Gate delta CORE-001

Scope: source React Native dan preview Chrome. Tidak menyatakan native/live diterima. Primary impeccable native Operate, antislop `during` dari preferensi global terverifikasi, ponytail full. Design Read existing Ceria untuk pekerja/pemberi kerja Indonesia, ENERGY 3 / RHYTHM 2 / MOTION 2. Delta hanya alur riwayat, kontrol pagination dan copy jumlah notifikasi.

Satu batch visual: `older-contact-390.png`, `older-notice-320.png`, `older-notice-1440.png`, seluruhnya diperiksa. Nol overflow dokumen pada320/1440 dalam regresi. E2E18 lulus, termasuk button, retry, filter, tab, detail dan keyboard Enter pada notifikasi lama. Tidak ada koreksi kosmetik setelah inspeksi.

## Hard Gate

| Item | Status / bukti delta |
| --- | --- |
| R-02 teks | PASS: copy baru Muat lebih banyak/Coba muat lagi/jumlah yang dimuat, tanpa em dash. |
| R-03 mobile | PASS preview: screenshot320/390 dan assertion overflow320/1440; native/text scaling belum terverifikasi. |
| R-17 angka | PASS: unread diturunkan dari entri yang dimuat, tidak menyatakan total server. |
| R-18 testimonial | PASS: tidak menambah testimonial. |
| R-23 aset | PASS: tidak menambah logo/avatar/aset/navigasi. |
| R-24 tautan | PASS: kontak lama dan dua pembukaan kesepakatan via notifikasi memakai route yang nyata dalam E2E. |
| R-25 kontras | PASS delta: tombol secondary dan metadata memakai token existing; rasio pada `ui-contrast.json`, minimal4,5:1. |
| R-26 fungsi | PASS: Muat lebih banyak/retry memanggil cursor; filter mengubah query server; read_notification membuka detail. |
| R-27 state | PASS: loading/busy/error/retry/empty memakai primitive existing; retry dan filter kosong diuji browser. |
| R-28 FAQ | PASS: tidak menambah FAQ. |
| R-32 keyboard | PASS preview: notifikasi lama difokuskan, Enter membuka kesepakatan; primitive Action mempertahankan fokus/role existing. |
| R-33 source | PASS: perubahan melalui source TypeScript/SQL, tanpa injeksi style runtime. |
| R-34 tema | PASS: light theme existing, tidak menambah toggle/tema. |
| R-35 run | PASS source/preview: export web/Hermes, lint/typecheck, E2E18 dan click-through kontrol berubah; bukan uji native. |
| R-36 klaim | PASS: hasil dibatasi lokal/sintetis, keputusan rilis tetap NO-GO. |
| R-37 arah | PASS: DESIGN.md dan token Ceria dipertahankan. |
| R-38 konten | PASS: fixture diberi nama/konteks sintetis; tidak menambah klaim produk faktual. |

## Purpose Gate

| Item | Status / alasan |
| --- | --- |
| R-01 gradient | PASS: tidak ada gradient baru. |
| R-04 ikon | PASS: tidak ada ikon baru, ikon kontak/pekerjaan existing menjelaskan objek. |
| R-06 font | PASS: Roboto/sans platform existing untuk keterbacaan Android. |
| R-07 pola | PASS: tidak menambah pola latar. |
| R-08 panah | PASS: tidak menambah panah dekoratif pada pagination. |
| R-09 badge | PASS: tidak menambah badge; status existing menunjukkan status kontak/kerja. |
| R-10 glass | PASS: tidak menambah glass. |
| R-12 shadow | PASS: tidak menambah shadow; border existing membatasi item. |
| R-13 glow | PASS: tidak menambah glow. |
| R-14 kartu | PASS: layout existing untuk objek kontak/kerja, bukan feature grid; setiap kartu membuka objek peserta. |
| R-19 motion | PASS: tidak menambah animasi; feedback busy memakai Action existing. |
| R-22 ilustrasi | PASS: tidak menambah ilustrasi, aset Ceria tetap. |

## Liveliness

| Item | Status / bukti |
| --- | --- |
| Dials eksplisit | PASS: ENERGY3/RHYTHM2/MOTION2 dari DESIGN.md. |
| Konsistensi dials | PASS: riwayat tetap tenang, ekspresi existing di onboarding/beranda; tidak menambah dekorasi. |
| Focal point | PASS: status dan objek aktivitas tetap fokus; pagination sekunder di akhir daftar. |
| Whitespace | PASS: Page gap16 dan padding20/32 existing memisahkan item pada screenshot. |
| Aksen | PASS: hijau aksi/status existing; tombol pagination secondary. |
| Motif | PASS: logo hijau asli, ikon tunggal hijau, sudut dan border Ceria existing. |
| Design Read | PASS: arah Operate existing dicatat sebelum perubahan, tidak mengganti dunia visual. |

## Craftsmanship / Quality Locks

| Item | Status / alasan |
| --- | --- |
| C-1 sengaja | PASS: tombol secondary karena aksi utama tetap membuka objek; copy menyatakan batas jumlah yang dimuat. |
| C-2 lengkap | PASS: seluruh kontrol delta menjalankan query/retry/navigation dalam E2E. |
| C-3 isi | PASS: kontrol muncul hanya ketika halaman penuh, tidak menambah section pemasaran. |
| C-4 tahan state | PASS preview: error mempertahankan entri, respons basi diabaikan saat pindah jenis aktivitas; ukuran sempit/lebar diperiksa. |
| C-5 bukti | PASS: angka tes berasal dari runner; tidak menambah data/claim produksi palsu. |
| R-05 layout | PASS: daftar data existing, bukan hero/bento/feature template. |
| R-11 radius | PASS: Action/card existing memakai token, tidak menambah radius. |
| R-15 CTA | PASS: Muat lebih banyak dan Coba muat lagi menjelaskan aksi. |
| R-16 copy | PASS: tanpa jargon pemasaran baru. |
| R-20 identitas | PASS: logo/palet/typography Ceria tetap, terlihat pada screenshot. |
| R-21 tema | PASS: light-only mengikuti permintaan pengguna dan DESIGN.md existing. |
| R-29 warna | PASS: hijau aksi, neutral canvas, status existing; tidak menambah warna. |
| R-30 referensi | PASS: refinement identitas existing yang diminta; tidak menyalin aset/brand Gojek. |
| R-31 alasan | PASS: warna/font/spacing existing untuk kontinuitas; layout daftar untuk riwayat; pagination secondary untuk menjangkau objek lama dengan request terbatas. |

UNVERIFIED: APK/runtime Android, TalkBack, text scaling native, performa banyak halaman di perangkat, integrasi cloud. Gate ini tidak menutup QA-001 atau gerbang produksi.
