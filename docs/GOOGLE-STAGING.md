# Login Google untuk staging

Konfigurasi 19 November 2026: proyek Google Cloud **UpahGO**, ID `upahgo`, ditemukan melalui akun yang dipilih pengguna (`authuser=3`). Branding UpahGO dibuat dengan kontak bantuan/pengembang `rakandevs@gmail.com`, audience External dalam mode Testing. Pengguna menyetujui kebijakan Google dan pembuatan kredensial untuk Supabase staging. Provider Google kini aktif; Client ID dan secret pengganti dipasang melalui Management API resmi. Phone tetap nonaktif.

| Pengaturan | Nilai |
| --- | --- |
| Client | `UpahGO staging Supabase`, Web application |
| Client ID publik | `519463236471-390khtm851l6q7gb77v7k4irr8pr6p5t.apps.googleusercontent.com` |
| Callback Google | `https://aqzlgrahfxmbvtfwebsx.supabase.co/auth/v1/callback` |
| Callback aplikasi QA | `upahgo-qa://auth/callback` |
| Authorized JavaScript origins | Kosong; alur browser melalui server Supabase |
| Secret | Server Supabase dan file privat `.cache/qa/staging-private/google-oauth.json`, mode 0600/direktori 0700; diabaikan Git |

Pembacaan ulang menunjukkan Google aktif, Client ID cocok dan secret terisi. Probe authorize dengan PKCE S256 menghasilkan redirect302 ke Google, Client ID/callback sesuai, state tersedia dan scope hanya `email profile`. Probe token dengan kode sengaja tidak valid menerima `invalid_grant`, bukan sesi pengguna; ini pemeriksaan kredensial, bukan bukti login/consent selesai. [Bukti tersaring](../audits/2026-11-18-production/remediation/qa-001/staging/live/google-oauth.json).

Secret awal sempat muncul pada keluaran pemeriksaan internal. Pengguna membuat secret pengganti, yang berbeda dan sudah dipasang. Setelah izin spesifik, secret awal dinonaktifkan; Google menampilkan **Disabled** untuk secret awal dan **Enabled** untuk pengganti. Propagasi pencabutan dapat memerlukan waktu; secret awal tidak dihapus permanen. Jangan memakai kembali secret awal atau mengunggah keluaran privat. Callback allowlist, Site URL `http://localhost:3000` dan Phone dipertahankan; native memakai redirect eksplisit, bukan fallback Site URL.

Implementasi `apps/mobile/src/auth.ts` memakai `signInWithOAuth`, browser eksternal dan PKCE, lalu `exchangeCodeForSession`. Konfigurasi yang diperlukan sekarang adalah OAuth **Web application** untuk Supabase. OAuth client Android/SHA-1 bukan prasyarat alur browser ini; package/fingerprint diperlukan terpisah untuk pembatasan Maps Android bila nanti diaktifkan.

## Konfigurasi dan pemeriksaan berikut

1. Gunakan [Google Auth Platform proyek upahgo](https://console.cloud.google.com/auth/clients?project=upahgo&authuser=3). Client sudah dibuat; jangan membuat duplikat. Tidak perlu billing atau Maps untuk OAuth browser.
2. Pertahankan mode **Testing** dan hanya cakupan identitas dasar. Dashboard menunjukkan External/Testing dan 0 test users; tidak menambahkan akun lain. Untuk permintaan yang hanya mencakup nama/email/profil atau Sign in with Google, [Google mengecualikan kewajiban trusted user list dan masa otorisasi tujuh hari](https://support.google.com/cloud/answer/15549945?hl=en). Pengecualian ini tidak berlaku jika scopes lain ditambahkan; pembatasan akun Google Workspace/jenis akun tetap dapat berlaku. Jangan mempublikasikan consent screen atau menambahkan Drive, Gmail atau Contacts.
3. Authorized redirect URI client **Web application** yang terpasang harus persis:

   ```text
   https://aqzlgrahfxmbvtfwebsx.supabase.co/auth/v1/callback
   ```

   Custom scheme QA bukan redirect URI Google. Google kembali ke Supabase, kemudian Supabase kembali ke aplikasi melalui callback QA yang sudah diizinkan.

4. [Supabase Google provider](https://supabase.com/dashboard/project/aqzlgrahfxmbvtfwebsx/auth/providers) sudah aktif dengan secret pengganti. Bila dirotasi lagi, pasang secret baru melalui kanal privat, verifikasi, lalu cabut secret lama setelah izin spesifik. Jangan kirim secret melalui chat atau masukkan ke Git/mobile. Backup konfigurasi sebelum aktivasi ada dalam direktori privat yang sama; rollback harus ditinjau dan hanya menyentuh field Google, tidak memulihkan seluruh konfigurasi Auth secara buta.
5. Periksa [Supabase URL Configuration](https://supabase.com/dashboard/project/aqzlgrahfxmbvtfwebsx/auth/url-configuration): callback native QA tepat `upahgo-qa://auth/callback`, tanpa wildcard. Callback produksi `upahgo://auth/callback` tidak ditambahkan pada staging ini. Untuk web diperlukan callback localhost exact dan origin Worker yang sesuai; web live belum diaktifkan.
6. Pasang APK **staging**, bukan APK demo lama. Uji A09/A10 pada [matriks QA](QA-ACCEPTANCE.md): masuk/batal, callback cold start/asing/duplikat, kill/resume, expiry, logout offline dan pergantian akun. Catat model/Android/hash APK. Akun sintetis backend memakai password fixture admin; hasilnya tidak membuktikan login Google/OTP berhasil.

Aktivasi provider tidak memerlukan rebuild APK staging karena endpoint dan callback sudah tertanam. Login Google lengkap dan penerimaan Android fisik belum diuji. Threat assessment: callback palsu/intersepsi custom scheme ditangani dengan PKCE serta validasi scheme/host/path dan pertukaran kode; secret tidak masuk bundle; scopes identitas minimum membatasi akses Google. Custom scheme belum menjadi verified App Link. Google tidak memberi nomor WhatsApp terverifikasi; tindakan yang mensyaratkan nomor tetap tertahan sampai Phone/OTP diterima. Aktivasi ini tidak menutup QA-001 atau gerbang produksi NO-GO.

Phone tetap nonaktif. SMS membutuhkan provider, nomor uji, batas biaya dan kontrol abuse tersendiri. Jangan mengaktifkannya hanya karena ada nama provider default pada konfigurasi. Maps juga tetap tanpa key; tidak mengaktifkan layanan berbayar pada pekerjaan ini.

Sumber resmi: [Google melalui Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [callback aplikasi native](https://supabase.com/docs/guides/auth/native-mobile-deep-linking). Status remote tersaring: [deployment.json](../audits/2026-11-18-production/remediation/qa-001/staging/live/deployment.json).
