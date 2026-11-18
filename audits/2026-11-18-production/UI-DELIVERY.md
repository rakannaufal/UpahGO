# Verifikasi perubahan label harga

Scope: **Harga tetap untuk profil berharga yang tidak membuka nego**, source dan preview web Chrome. Bukan penerimaan Android/live atau seluruh audit produksi. Primary: impeccable native Operate; filter antislop `during` dari preferensi global yang sudah diverifikasi; implementasi ponytail full. Tidak ada workflow identitas baru, aset baru atau instalasi.

## Perilaku

- Harga terisi + `priceNegotiable=true`: **Bisa nego**.
- Harga terisi + false/undefined: **Harga tetap**. Default false menjaga kompatibilitas profil lama.
- Harga kosong: tetap **Harga belum diisi / Bahas bersama**, tanpa status Harga tetap palsu.
- Status satu kali pada kartu, juga pada detail. Accessible name menyebut status; fixed profile tidak menawarkan tombol Tawar upah pada alur yang diuji.
- Dua kartu per baris tetap berlaku. Pengecualian aksesibilitas existing: fontScale≥1,5 memakai satu kolom. Avatar tonal, ilustrasi layanan kanan tengah, bintang emas/rating dan panel harga tetap.
- `ProfilePrice.showPriceTerms` mencegah duplikasi status pada PersonCard. Tidak mengubah nominal, consent, otorisasi, atau kesepakatan server.

File: `apps/mobile/src/ProfilePresentation.tsx`, `apps/mobile/src/PersonCard.tsx`, `tests/web/core.spec.ts`, paragraf harga `DESIGN.md`. Seluruhnya sudah masuk snapshot sebelum audit baca-saja. Paragraf deskripsi kartu lama pada DESIGN.md masih perlu sinkronisasi saat perbaikan disetujui; kode/status aktual di atas teruji.

## Bukti dan visual pass

Satu batch visual diperiksa: [320 px](evidence/fixed-card-320.png), [414 px](evidence/fixed-card-414.png). Pada320 status dua kata dapat membungkus menjadi dua baris; tidak keluar container. Enam viewport320/375/414/768/1024/1440 mempertahankan dua kolom, nol card/document overflow. Card focus+Enter membuka detail, Harga tetap tampil, jumlah tombol Tawar upah0. [browser-audit.json](evidence/browser-audit.json): pageerror0.

17 tes web lulus, termasuk regresi fixed label/accessibility name. Typecheck/lint/web export/Hermes export lulus. Kontras dihitung sRGB dari token aktual: metadata di putih **6,086:1**, metadata pada surfaceVariant **5,628:1**, nego hijau gelap di putih **10,191:1**. [label-contrast.json](evidence/label-contrast.json). Ini bukan audit semua piksel/AT native.

## Delivery Gate, batas delta source/web preview

### Hard Gate

| Aturan | Status dan bukti |
| --- | --- |
| R-02 teks | PASS: label baru hanya Harga tetap/Bisa nego; tanpa em dash. |
| R-03 overflow | PASS: enam lebar, nol overflow; dua screenshot diperiksa. |
| R-17 statistik | PASS: tidak menambah statistik; rating existing merupakan data demo yang diberi konteks sintetis. |
| R-18 testimonial | PASS: tidak membuat testimonial/identitas pelanggan. |
| R-23 aset | PASS: tidak membuat/mengimpor aset atau struktur navigasi baru. |
| R-24 tautan | PASS: kartu existing membuka detail; Enter diuji sampai Harga tetap tampil. |
| R-25 kontras | PASS untuk teks berubah: 6,086:1/10,191:1 pada surface, melampaui4,5:1. |
| R-26 fungsi | PASS: status read-only sesuai field; bukan tombol palsu; tombol tawar fixed tidak ditampilkan pada detail diuji. |
| R-27 states | PASS untuk delta: harga kosong/terisi/legacy ditangani conditional source; shared loader/error existing dan suite recovery lulus. Tidak mengklaim seluruh state live diuji. |
| R-28 FAQ | PASS: delta tidak menambah FAQ atau copy generik. |
| R-32 keyboard | PASS: satu target kartu, focus+Enter membuka detail; accessible name status diperiksa. |
| R-33 edit source | PASS: perubahan pada komponen source, bukan injeksi runtime/patch CSS eksternal. |
| R-34 tema | PASS: light-only sesuai arahan existing, tanpa toggle/theme baru. |
| R-35 run/click-through | PASS untuk target berubah: export+17 tes web, six widths dan card/detail click-through tercatat. Native runtime tetap belum terverifikasi. |
| R-36 klaim | PASS: tidak menambah klaim keamanan/hasil nyata; audit menyatakan NO-GO. |
| R-37 arahan | PASS: DESIGN.md existing, refinement Ceria diminta pengguna, tidak mengganti identitas. |
| R-38 konten | PASS: label berasal dari nominal/field pemilik; fixture tetap demo, tidak menambah profil faktual palsu. |

### Purpose-Gate

| Aturan | Status dan alasan |
| --- | --- |
| R-01 gradient | PASS: tidak menambah gradient/glow. |
| R-04 ikon | PASS: tidak menambah ikon status; star existing tetap bermakna rating. |
| R-06 tipografi | PASS: sans sistem existing, status12–14/20 semibold menjaga hierarki di bawah identitas. |
| R-07 background | PASS: status tanpa pola/latar baru. |
| R-08 arrow | PASS: tidak menambah arrow dekoratif. |
| R-09 badge | PASS: status harga faktual, teks tanpa badge; tujuannya membedakan keterbukaan nego. |
| R-10 glass | PASS: tidak menambah blur/glass. |
| R-12 shadow | PASS: tidak menambah shadow, batas kartu existing dipertahankan. |
| R-13 glow | PASS: tidak menambah glow. |
| R-14 card | PASS: dua profil sejenis dibandingkan dalam grid sesuai pilihan pengguna, bukan feature grid dekoratif. |
| R-19 motion | PASS: tidak ada animasi baru; status statis tidak memerlukan gerak. |
| R-22 ilustrasi | PASS: artwork layanan existing tetap menjelaskan jenis pekerjaan; tidak membuat visual generik baru. |

### Liveliness

| Item | Status dan bukti |
| --- | --- |
| Dials eksplisit | PASS: DESIGN.md menetapkan ENERGY3/RHYTHM2/MOTION2; refinement tidak mengubahnya. |
| Konsistensi dials | PASS: status tenang pada informasi harga, energi tetap pada ilustrasi layanan existing. |
| Focal point | PASS: nama/identitas dan nominal memimpin; status memakai ukuran metadata. |
| Whitespace | PASS: gap tengah/tag/panel harga existing tetap, screenshot tidak menumpuk label. |
| Aksen | PASS: hijau gelap untuk nego, metadata untuk fixed; emas khusus rating. |
| Motif | PASS: avatar tonal, ServiceArt, border lembut dan panel harga merupakan pola Upahgo existing. |
| Design Read | PASS: refinement incumbent native Operate berdasarkan DESIGN.md, bukan arah baru yang tidak disetujui. |

### Craftsmanship dan Quality Locks

| Item | Status dan bukti |
| --- | --- |
| C-1 intention / R-31 alasan | PASS: status eksplisit menghindari keharusan menebak dari tidak adanya label; warna/ukuran mengikuti metadata existing. |
| C-2 completeness | PASS: card/detail dan status fixed bekerja pada alur web diuji. |
| C-3 content / R-05 struktur | PASS: tidak menambah section/template, hanya metadata profil yang diminta. |
| C-4 resilience | PASS pada delta web: harga kosong/legacy, enam lebar, keyboard dan guard existing; native di luar penerimaan ini. |
| C-5 evidence | PASS: screenshot, JSON metrik, assertion dan logs tersedia; tidak mengarang hasil perangkat. |
| R-11 radius | PASS: radius token existing, status bukan pill baru. |
| R-15 CTA | PASS: tidak menambah CTA generik; Harga tetap adalah label. |
| R-16 copy | PASS: label Indonesia singkat, tanpa buzzword. |
| R-20 identity | PASS: layout/aset/warna existing dipertahankan, tidak menggenerasikan identitas baru. |
| R-21 theme | PASS: light theme existing diminta pengguna; tidak menambah mode tak teruji. |
| R-29 palette | PASS: hanya token warna existing, tidak menambah warna brand. |
| R-30 references | PASS: mengikuti refinement pengguna; tidak mengimpor aset Gojek/Kestrel. |

**Keputusan delta: PASS pada source/web preview yang dinyatakan. Android, TalkBack, fontScale perangkat, native gallery/maps/OAuth dan layanan nyata belum terverifikasi; gerbang produksi penuh tetap NO-GO sesuai REPORT.md.**
