# Konfigurasi layanan

Belum ada deployment, migrasi remote, konfigurasi OAuth, aktivasi SMS, atau publikasi yang dilakukan. Tidak ada domain yang dibeli. Siapkan ini pada lingkungan staging sebelum data pengguna nyata.

## Supabase

Proyek pengguna: `https://aqzlgrahfxmbvtfwebsx.supabase.co`. Pemeriksaan dashboard 17 November 2026: Google dan Phone belum aktif. Status itu dapat berubah; periksa kembali sebelum pengujian live.

### Login Google

1. Di Google Cloud, buat/configure OAuth consent screen, audience, dan test users. Gunakan OAuth **Web application** untuk Supabase OAuth melalui browser eksternal.
2. Authorized redirect URI Google: `https://aqzlgrahfxmbvtfwebsx.supabase.co/auth/v1/callback`.
3. Masukkan Client ID dan Client Secret pada Supabase Authentication > Providers > Google, lalu aktifkan. Client Secret hanya di dashboard/server, tidak di `.env` aplikasi atau chat.
4. Pada Supabase URL Configuration, izinkan tepat `upahgo://auth/callback` dan, untuk preview komputer, `http://localhost:8081/auth/callback`. Jika memakai port 8082, daftarkan URL itu terpisah. Jangan gunakan wildcard callback produksi. Site URL gunakan URL web yang benar jika web dipublikasikan nanti.
5. Buat development build Android, uji masuk/batal/kedaluwarsa, cold-start callback, background/foreground, logout dan pergantian akun. Expo Go bukan bukti callback scheme aplikasi mandiri.

Native memakai browser eksternal dan PKCE milik Supabase. Callback harus cocok scheme/host/path. Web preview memakai popup dengan pemeriksaan `event.origin` dan `event.source`; PKCE verifier dan sesi tetap di memori jendela utama. Reload web mengakhiri sesi. Jangan ubah menjadi redirect penuh tanpa penyimpanan verifier yang sesuai.

Domain sendiri belum diperlukan untuk alur native ini. Custom scheme belum memberikan jaminan verified App Links. Saat domain tersedia, evaluasi Android App Links dan tautan penghapusan akun publik; PKCE tetap diperlukan.

### Nomor WhatsApp

Google tidak memberikan nomor WhatsApp yang sudah diverifikasi. Aplikasi menyediakan penautan nomor melalui `updateUser({phone})` dan `verifyOtp({type:'phone_change'})`. Ini memerlukan Phone provider, penyedia SMS, batas pengiriman, biaya, dan pengujian tersendiri. Belum diaktifkan dan belum mengirim SMS.

Aktifkan konfirmasi perubahan nomor sesuai kebijakan akun. Nomor diambil dari `auth.users` setelah `phone_confirmed_at` tersedia. Perubahan nomor membatalkan penggunaan grant kontak lama melalui pemeriksaan hash. Verifikasi SMS tidak membuktikan bahwa nomor memiliki akun WhatsApp.

Cloudflare Worker tidak melindungi endpoint Auth Supabase secara otomatis. Konfigurasikan rate limit dan kontrol penyalahgunaan Auth pada Supabase/Google. Turnstile belum diintegrasikan; jangan mengaktifkan CAPTCHA wajib pada alur yang belum bisa mengirim token CAPTCHA, khususnya perubahan nomor. Tinjau kontrol biaya SMS sebelum mengaktifkan Phone.

### Migrasi dan area

Tinjau migrasi berurutan `supabase/migrations/202611170001_core.sql`, `202611170002_onboarding.sql`, `202611170003_location_reviews.sql`, `202611170004_discovery_design.sql`, `202611170005_work_details_suggestions.sql`, `202611170006_profile_photos.sql`, lalu `202611180001_profile_prices.sql`, `202611180002_history_pagination.sql`, `202611180003_account_erasure.sql`, `202611190001_media_reconciliation.sql`. Backup bila database berisi data, terapkan berurutan melalui proses migrasi staging. Migrasi belum dijalankan remote pada pekerjaan ini; isi database remote tidak diperiksa. Jangan menerapkan ulang sebagai script idempoten.

Skema `upahgo_private` harus tidak termasuk daftar exposed schemas PostgREST. Klien `authenticated` hanya mendapat execute pada `public.upahgo_action(text,jsonb)`. Helper `public.upahgo_photo_replace` hanya dapat dijalankan service-role Edge, bukan klien authenticated/anon. Tidak ada service-role key di Worker/aplikasi.

Migrasi memasukkan enam tag bersih-bersih, **tanpa area geografis nyata**. Isi direktori `areas` dengan sumber wilayah berlisensi/terverifikasi, titik area umum, zona waktu WIB/WITA/WIT yang benar. Jangan memasukkan alamat pengguna atau koordinat rumah. Provisioning `cities` dengan polygon dan `areas` yang sah wajib untuk lokasi awal/penemuan; kota tak terlayani gagal tertutup. Profil opsional hanya setelah peran/lokasi wajib. Tidak ada provisioning live nasional pada pekerjaan ini.

## Cloudflare tanpa domain

`workers/api/wrangler.jsonc` menyiapkan `upahgo-api`, `workers_dev: true`, Durable Object SQLite. Setelah akun dan deployment disetujui, URL akan mengikuti subdomain `workers.dev` akun; URL nyata belum diketahui. Tidak perlu menebak URL atau membeli domain.

Sebelum deployment:

1. Tinjau paket/kuota Cloudflare yang berlaku. Tidak ada harga atau jaminan bebas biaya pada konfigurasi ini.
2. Buat gateway secret acak minimal 32 byte menggunakan generator kriptografis. Simpan sebagai secret `GATEWAY_SECRET` pada Worker. Jangan tempel nilai pada source, build variable publik, riwayat perintah, atau chat.
3. Provision hash SHA-256 secret yang sama ke `upahgo_private.gateway_config.secret_hash` melalui koneksi admin terotorisasi. Gunakan parameter query / secret manager. Database menyimpan hash, bukan secret; Worker dan Edge foto menyimpan secret yang sama pada secret store masing-masing. Nilai awal NULL menolak semua operasi.
4. Isi `SUPABASE_PUBLISHABLE_KEY` sebagai binding Worker; URL proyek sudah ada pada konfigurasi. Publishable key bersifat publik tetapi service-role tetap dilarang.
5. Untuk native, `ALLOWED_ORIGINS` boleh kosong. Untuk preview/web, isi daftar origin tepat tanpa wildcard. Ini hanya kontrol browser; otorisasi selalu sesi dan SQL.
6. Jalankan `npm run worker:check`. Deployment nyata melalui Wrangler merupakan langkah terpisah setelah tinjauan konfigurasi dan otorisasi publikasi. Isi URL HTTPS hasil deployment ke `EXPO_PUBLIC_API_URL`, bangun ulang aplikasi.

Pembatas: 180 permintaan/IP/menit, 90 permintaan/akun/menit, jendela menit tetap. Batas ini dapat melonjak di pergantian menit. IP di-hash dengan secret sebelum nama Durable Object; tidak dicatat di log aplikasi. Durable Object bersih setelah alarm dua menit. SQL menambahkan batas khusus permintaan kontak/laporan. Kegagalan pembatas menolak permintaan.

WAF zona/domain, custom rules, dan Turnstile tidak terpasang oleh konfigurasi Worker ini. Saat domain tersedia, domain dan aturan tambahan dapat disiapkan berdasarkan ancaman nyata. Worker hanya meneruskan endpoint aplikasi yang ditetapkan ke origin Supabase tetap.

## Google Maps Android

Aktifkan Maps SDK for Android pada proyek Google Cloud yang sesuai. Buat API key dengan pembatas aplikasi Android `id.upahgo.app`, SHA-1 sertifikat penandatanganan setiap environment, dan API restriction Maps SDK for Android. Key ini masuk binary sehingga tidak dianggap rahasia.

Isi `GOOGLE_MAPS_ANDROID_API_KEY` pada environment build. Tanpa key, aplikasi menampilkan penjelasan dan daftar akun; tidak mencoba memasang peta yang berisiko crash. Web memakai Leaflet lazy/OSM beratribusi. GPS foreground wajib untuk penemuan; tanpa background watcher/service. Fix tepat hanya untuk validasi server, marker publik perkiraan.

## Rilis belum terbuka

Tentukan operator pengaduan/penghapusan, retensi, kontak bantuan, privacy policy dan URL penghapusan publik, verifikasi kebijakan Play, signing, dan uji perangkat Android. Finalizer PRIV-001 tersedia lokal dan nonaktif; aktivasi, scheduler, ledger independen, backup expiry serta restore drill mengikuti [ACCOUNT-DELETION.md](ACCOUNT-DELETION.md). Permintaan tetap hanya pembatasan hingga layanan tersebut diaktifkan. Tidak ada escrow/jaminan pembayaran. Rilis publik tetap tertahan sampai kebutuhan ini selesai.

## Koordinasi rilis onboarding

Urutan staging: migrasi 001–006 tanggal 17 November, `202611180001_profile_prices.sql`, provisioning kota/area yang ditinjau, Worker dengan allowlist terbaru, lalu klien. Klien GPS baru tidak kompatibel dengan klien manual lama; uji staging/backup/rollback sebelum deploy. Rilis harus dikoordinasikan dan diuji staging sebelum publikasi. Tidak ada migrasi remote atau deployment dilakukan. Pertahankan skema saat rollback; jangan menghapus tabel akun/profil yang sudah berisi data.

## Direktori GPS dan vendor peta

Tambahan harga: sesudah seluruh migrasi tanggal 17 November, terapkan `202611180001_profile_prices.sql` sebelum klien harga baru. Verifikasi pada staging: owner/peran terisolasi, save lama mempertahankan harga, null menghapus, edit mematikan presence, profile/discover tunduk kota/radius/blokir, invalid type/range ditolak. Tabel/helper tidak boleh dapat dieksekusi langsung oleh klien. Rollback klien mempertahankan skema; jangan drop tabel harga atau membalik rename wrapper otomatis. Tidak menambah layanan berbayar atau payment gateway.

Cakupan nasional tetap tujuan produk; direktori live belum diprovisi. Batas Pekanbaru OSM hanya untuk demo/geometri fixture; tidak memasukkan semua kota atau membuktikan layanan nasional. Tinjau sumber, lisensi, polygon/area dan timezone sebelum provisioning. Server menentukan kota dari fix valid, bukan city ID pilihan klien. Di luar kota terlayani ditolak dengan pemulihan yang jelas.

Tile standar OSM memberi geografi aktual pada preview web, atribusi tetap terlihat. Vendor menerima IP dan koordinat tile; tidak ada query geocoder GPS. Ikuti kebijakan tile: tanpa prefetch/offline download, cache browser normal; evaluasi vendor, kapasitas, privasi dan biaya sebelum publik. Sumber: [GEO-DATA.md](GEO-DATA.md). Google Maps Android key belum tersedia; tidak ada aktivasi paid API. Uji permission foreground, denial, lifecycle, kamera/marker/atribusi dan list fallback pada perangkat sebelum rilis.

## Foto privat: persiapan staging, belum dijalankan

1. Tinjau seluruh urutan migrasi di atas hingga MEDIA-001 pada staging terotorisasi. Jeda write foto, terapkan migrasi lalu Edge yang memakai reservasi sebelum membuka write; Edge lama tidak kompatibel dengan commit baru. Backup/restore dan grants harus ditinjau. Enam tag lama tetap live; katalog 128/16 tidak berarti semua kategori diaktifkan.
2. Siapkan bucket privat profile-photos dan pastikan RLS/grants migrasi 006, ownership replacement RPC service-only serta penolakan lintas akun/kota/blokir berlaku pada Supabase nyata.
3. Edge memakai secret server `UPAHGO_GATEWAY_SECRET` yang sama dengan gateway Worker; built-in `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` hanya pada environment Edge. Jangan menyalin service key ke Worker/mobile. `supabase/config.toml` mempertahankan verify_jwt=true dan static_files WASM. Uji kompatibilitas JWT/Auth staging sebelum layanan dibuka.
4. Jalankan photo:prepare sebelum tes/deploy Edge agar magick.wasm tersedia, tinjau deno.lock, lalu uji gateway, getUser, decoder, storage, signed URL dan limiter end-to-end dengan data sintetis. Deployment memerlukan otorisasi terpisah; tidak dilakukan di sini.
5. Tetapkan operator moderasi manual, kriteria approve/reject dan retensi. Runner MEDIA-001 tersedia source, default nonaktif; aktivasi, scheduler, alarm, retry, sweep dan restore mengikuti [MEDIA-CLEANUP.md](MEDIA-CLEANUP.md). Uji upload parsial/commit tak pasti, foto aktif/in-flight, penggantian/hapus202, logout/blokir dan overlap penghapusan akun. Kebijakan privasi publik harus menjelaskan galeri, foto tempat, pending, antrean penghapusan, akses singkat serta metadata vendor.
6. Rollback klien/gateway secara kompatibel; hentikan write baru bila layanan bermasalah, pertahankan skema/objek sampai rekonsiliasi dan backup selesai. Rotasi gateway harus mengoordinasikan SQL hash, Worker dan Edge. Jangan drop tabel/bucket atau menghapus data produksi otomatis.

Foto live tetap tertahan sampai operasi tersebut siap; screenshot pending dan tes mock tidak membuktikan layanan moderasi/storage remote. Audit high tooling terbaru juga perlu disposition sebelum rilis, lihat [TESTING.md](../TESTING.md).

