# Login Google untuk staging

Pemeriksaan 19 November 2026: provider Google Supabase nonaktif; Client ID dan secret belum terisi. Callback `upahgo-qa://auth/callback` sudah ditambahkan dan dibaca ulang melalui API. Site URL masih `http://localhost:3000`; jangan mengandalkannya sebagai fallback aplikasi. Pencarian proyek bernama “Upah” pada akun Google Cloud yang aktif tidak menemukan hasil. Ini tidak membuktikan proyek tidak tersedia pada akun/nama lain. Tidak membuka atau memakai kredensial proyek lain.

Implementasi `apps/mobile/src/auth.ts` memakai `signInWithOAuth`, browser eksternal dan PKCE, lalu `exchangeCodeForSession`. Konfigurasi yang diperlukan sekarang adalah OAuth **Web application** untuk Supabase. OAuth client Android/SHA-1 bukan prasyarat alur browser ini; package/fingerprint diperlukan terpisah untuk pembatasan Maps Android bila nanti diaktifkan.

## Tindakan berikut

1. Di [Google Auth Platform](https://console.cloud.google.com/auth/clients), pilih proyek khusus **UpahGO staging** yang dimiliki tim. Bila belum ada, buat proyek setelah pemilik menyetujui nama/organisasinya. Tidak perlu mengaktifkan billing atau Maps untuk OAuth browser.
2. Isi Branding dan Audience menggunakan identitas/kontak bantuan yang benar. Gunakan mode **Testing** dan tambahkan akun penguji yang memang diizinkan. Jangan mempublikasikan consent screen sebagai bagian pengujian. Minta hanya cakupan identitas dasar; tidak menambahkan Drive, Gmail atau Contacts.
3. Buat client bertipe **Web application**, misalnya `UpahGO staging Supabase`. Authorized redirect URI Google harus persis:

   ```text
   https://aqzlgrahfxmbvtfwebsx.supabase.co/auth/v1/callback
   ```

   Custom scheme QA bukan redirect URI Google. Google kembali ke Supabase, kemudian Supabase kembali ke aplikasi melalui callback QA yang sudah diizinkan.

4. Di [Supabase Google provider](https://supabase.com/dashboard/project/aqzlgrahfxmbvtfwebsx/auth/providers), masukkan Client ID dan Client Secret tersebut, lalu aktifkan Google. Secret hanya di Supabase/server. Bila memakai file lokal, simpan di direktori privat `.cache/qa/staging-private/` dengan mode 0600; jangan kirim melalui chat atau masukkan ke Git/mobile.
5. Periksa [Supabase URL Configuration](https://supabase.com/dashboard/project/aqzlgrahfxmbvtfwebsx/auth/url-configuration): callback native QA tepat `upahgo-qa://auth/callback`, tanpa wildcard. Callback produksi `upahgo://auth/callback` tidak ditambahkan pada staging ini. Untuk web diperlukan callback localhost exact dan origin Worker yang sesuai; web live belum diaktifkan.
6. Pasang APK **staging**, bukan APK demo lama. Uji A09/A10 pada [matriks QA](QA-ACCEPTANCE.md): masuk/batal, callback cold start/asing/duplikat, kill/resume, expiry, logout offline dan pergantian akun. Catat model/Android/hash APK. Akun sintetis backend memakai password fixture admin; hasilnya tidak membuktikan login Google/OTP berhasil.

Phone tetap nonaktif. SMS membutuhkan provider, nomor uji, batas biaya dan kontrol abuse tersendiri. Jangan mengaktifkannya hanya karena ada nama provider default pada konfigurasi. Maps juga tetap tanpa key; tidak mengaktifkan layanan berbayar pada pekerjaan ini.

Sumber resmi: [Google melalui Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [callback aplikasi native](https://supabase.com/docs/guides/auth/native-mobile-deep-linking). Status remote tersaring: [deployment.json](../audits/2026-11-18-production/remediation/qa-001/staging/live/deployment.json).
