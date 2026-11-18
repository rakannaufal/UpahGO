# Register Sumber dan Hak Pemakaian

## Ceria, 18 November 2026

Implementasi terbaru memakai dua ilustrasi unDraw berlisensi dari desain yang diminta pengguna, Google G resmi dan 29 kontrol/13 objek vektor asli proyek. Register sumber dan adaptasi ada di [assets/ceria/SOURCES.json](../ceria/SOURCES.json) serta [README](../ceria/README.md). Google G hanya untuk autentikasi Google. Tidak ada artwork Gojek atau avatar ilustratif yang dipakai sebagai foto pengguna. Catatan belum adanya ilustrasi di bawah merupakan status historis sebelum Ceria.

17 November 2026. Register provenance, bukan jaminan lisensi menyeluruh/hak merek. [Katalog](../catalog.json) menyimpan SHA-256 setiap file aktual. [Inventaris](../README.md), [produksi](../PRODUCTION.md), [sistem desain](../../DESIGN.md).

| Aset | Sumber / modifikasi | Hak dan batas |
| --- | --- | --- |
| Logo BR-01 | PNG dikirim pengguna, dipilih sebagai logo. Salinan asli 1254 × 1254 dipertahankan | Pembuat awal, generator, serta lisensi upstream belum diberikan. Tidak mengklaim buatan Codex, public domain, atau hak eksklusif |
| Turunan brand | Crop, chroma matte, resize dari PNG yang sama | Status sumber tetap berlaku; tidak mengubah hak melalui ekspor |
| Wordmark/lockup | Roboto 700 pendamping, SVG live text dan PNG; belum outline | Font OFL-1.1; visual pendamping masih usulan |
| UI-01 sampai UI-36 | Google Material Symbols Rounded 24/400/GRAD 0/FILL 0; sumber SVG dipertahankan, ekspor currentColor | Apache-2.0, [salinan](material-symbols-LICENSE.txt) |
| FONT-01 | Roboto variable, Google Fonts; font tidak dimodifikasi | OFL-1.1, [salinan](Roboto-OFL.txt) |
| MP-01/MP-02 | Komposisi marker custom, glyph person/work Google | Hak glyph Apache-2.0 tetap berlaku |
| Preview | Komposisi statis dari aset dan data simulasi berlabel | Bukan screenshot aplikasi atau bukti pengguna nyata |
| Ilustrasi/foto | Belum dibuat/diimpor | Tidak ada lisensi atau model gambar yang diklaim |
| Tiles/WhatsApp | Belum diintegrasikan | Ketentuan/atribusi layanan aktual diperiksa saat integrasi |

## Asal sumber

- Logo: lampiran pengguna codex-clipboard-a5310275-8bcc-4d8b-9b71-65baa57034f3.png, diterima 17 November 2026. Salinan: [upahgo-logo-approved.png](../brand/source/upahgo-logo-approved.png). SHA-256: 4a89b3c8b2a6f51d953a9c7daa086b7c694472833dd1481cd338aa072c99a142.
- Glyph resmi: `https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/{glyph}/default/24px.svg`, URL tiap glyph di katalog.
- Lisensi Material: [google/material-design-icons](https://github.com/google/material-design-icons/blob/master/LICENSE).
- Font: [Roboto variable TTF](https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/Roboto%5Bwdth,wght%5D.ttf).
- Lisensi font: [google/fonts Roboto OFL](https://github.com/google/fonts/blob/main/ofl/roboto/OFL.txt).

Glyph/font dan lisensi diimpor sebelumnya pada 17 November 2026. URL upstream tidak dipin commit; hash merekam salinan lokal. Revisi ini tidak mengunduh aset, mengirim lampiran ke layanan eksternal, atau memakai API generasi.

## Distribusi

Sertakan pemberitahuan dan lisensi yang diwajibkan oleh subset Material/Roboto yang benar-benar didistribusikan. Catat modifikasi tint/komposisi marker; jangan mengklaim glyph Google buatan Upahgo. Periksa NOTICE upstream yang relevan pada versi distribusi. Sumber/font/preview tidak otomatis masuk bundle, kewajiban lisensi derivat tetap perlu diperhatikan.

Draf ditolak dihapus atas permintaan pengguna. Penggunaan logo sebagai identitas tidak membuktikan ketersediaan merek atau penerimaan pendaftaran; register ini tidak menggantikan pemeriksaan sumber/hak saat rilis.

## Pembaruan aset aktivitas — 18 November 2026

11 glyph aktivitas Material resmi ditambahkan: cleaning_services, water_drop, inventory_2, kitchen, window, checkroom, countertops, bathtub, local_laundry_service, mop, water_bottle_large. Total 47 ikon UI. Sumber URL, hash dan normalisasi tint ada di assets/catalog.json (relatif root proyek); Apache 2.0. Sumber Material master belum dipin commit; hash lokal mencatat bytes yang diperiksa. Hasil verifier terbaru 52 rekaman, 128 hash, 99 SVG, 26 PNG; tujuh self-check unsafe SVG ditolak, pixel check lulus menurut pelaksana utama. Angka inventaris sebelumnya historis; papan preview tetap 36 ikon, tidak diregenerasi.

Delapan raster ilustrasi Stage A belum diproduksi, manifest ActivityMedia kosong: pictogram adalah fallback sementara, bukan cover ilustrasi selesai. Generator diizinkan tidak tersedia, tidak ada fallback berbayar. Tidak ada foto orang nyata dibuat/diimpor. Fixture JPEG bidang warna/EXIF sintetis hanya tes, bukan aset publik. Diagram onboarding native yang ada dipertahankan. Hak upstream logo masih belum terverifikasi.
