# Cakupan dan bukti audit

Lampiran [REPORT.md](REPORT.md), 18 November 2026. Status **lulus lokal** tidak berarti layanan live/native lulus. **Belum terverifikasi** berarti bukti belum diperoleh, bukan kondisi buruk yang diasumsikan.

## 1. Peta endpoint

### Transport dan trust boundary

| Metode / path | Autentikasi / pemilik | Validasi dan limit | Hasil audit |
| --- | --- | --- | --- |
| POST `/v1/action` | Bearer diverifikasi melalui Supabase Auth; actor diteruskan sebagai sesi pengguna, bukan service role | Body streaming 16 KiB; hanya `operation,args`; allowlist 30 operasi; 180/IP/menit, 90/aktor/menit; SQL checks tambahan | Unit gateway lulus; local runtime limiter lulus; live Auth/PostgREST belum diuji |
| GET `/v1/photo` | Bearer + SQL photo_access; owner/publik approved tunduk kota/radius/blokir | Hanya id/role/size; 90 read/aktor/menit, juga limit umum; signed URL 60 detik | Edge mock/SQL lulus; Storage live belum |
| POST `/v1/photo` | Bearer, akun/profil aktif, role dari bootstrap; consent eksplisit | `image/jpeg`; input maksimal 5 MB, decode maksimal 2048, output detail ≤1280/1 MB, thumb 160/100 KB; 3 write/aktor/menit | Decoder/EXIF dan penolakan tipe lulus; upload parsial bermasalah, MEDIA-001 |
| DELETE `/v1/photo` | Bearer; metadata pemilik/peran melalui service-only replacement RPC | 3 write/aktor/menit; objek dari key server | Failure removal direproduksi, MEDIA-001 |
| OPTIONS path Worker | Tidak perlu sesi; hanya origin exact yang diizinkan | Metode/header allowlist, max-age 600 | Unit origin ditolak lulus; CDN actual belum |
| `/auth/v1/authorize`, `/token`, `/user`, `/otp`, `/verify`, `/logout`, pembaruan user | Dikelola SDK Supabase; Google/OTP sesi sesuai operasinya | Callback PKCE/client diperiksa; provider rate limit/CAPTCHA/SMS quota **di luar limiter Worker** | Source diperiksa; provider live, expiry/revocation dan abuse konfigurasi belum diuji |
| POST `/rest/v1/rpc/upahgo_action` | JWT authenticated + gateway secret/hash + auth.uid | Semua input diperiksa SQL, privilege helper dicabut | 135 assertion lokal/shim; PostgREST live belum |
| `/functions/v1/profile-photo` | `verify_jwt=true`, getUser, gateway secret; service role hanya Edge | Upstream tetap; Storage privat; decoder berbatas | Deno/mocks lulus; gateway/JWT sebenarnya belum |
| RPC `upahgo_photo_replace` | Hanya service role, bukan anon/authenticated | User/peran/account aktif, path UUID, lock, key server | ACL SQL dan handler mock diperiksa; remote belum |
| Storage signed object | Pemegang URL singkat dapat mengakses sampai expiry | Bucket privat; tanpa policy/grant client langsung | SQL source + mock signing; real bucket/cache belum |

Tidak ada health endpoint khusus. Liveness Worker dapat diperiksa dari respons ringan, tetapi readiness harus menguji dependensi dengan synthetic probe terotorisasi tanpa membuka data/secret. Tidak ada webhook/queue bisnis/payment gateway yang perlu diinventarisasi.

### Semua 30 operasi `/v1/action`

Semua operasi memerlukan sesi. `A` = akun authenticated aktif; `P` = profil siap/nomor sesuai operasi; `W/E` = worker/employer. Identitas pengguna tidak dapat dipilih lewat body. Batas umum Worker berlaku di setiap baris. Angka/allowlist final berasal dari tujuh migrasi, bukan hanya validator client.

| Operasi | Otorisasi objek/peran | Validasi dan perilaku utama | Bukti lokal / gap |
| --- | --- | --- | --- |
| bootstrap | Pemilik sesi; status restricted boleh dibaca untuk pemulihan | Args kosong, akun/progress sendiri; kota/area dari lokasi akun | SQL + web recovery; data remote belum |
| onboarding | A, progress sendiri | step `intro`/`profile`; profile step memerlukan role | SQL/web skip/entry gate |
| set_role | A, role sendiri | `worker`/`employer`; presence dicabut, snapshot peran dipulihkan | SQL/web role-history |
| set_area | A; legacy area milik akun | Area harus sah; penemuan tetap tunduk GPS/city, bukan pilihan kota bebas | SQL gate GPS; legacy client tidak boleh dipakai memperluas izin |
| set_location | A | Tipe/rentang koordinat, akurasi ≤1000 m, umur ≤5 menit, masa depan ≤1 menit; polygon menentukan kota | SQL polygon/hole + web denial/retry/outside |
| set_radius | A, lokasi sendiri | Radius allowlist; lokasi masih valid | SQL/web foreground/radius |
| save_profile | A W/E sendiri | Nama 2–60, region 3–100, bio ≤240, tag ≤5 aktif, context/effort, harga opsional integer Rp1.000–50.000.000 + bool | SQL invalid types/role/partial rollback; web form |
| discover | A, role dipilih dan lokasi valid | Kota/radius/block/status/expiry; query ≤80; filter/sort allowlist; 40 hasil, offset 0–1000 | SQL + web filter/map; data besar/performa belum |
| profile | A, target boleh ditemukan | UUID/peran, kota/radius/block/status/presence | SQL cross-city/block; web detail |
| visibility | P, profil sendiri | Bool; syarat profil/tag/nomor/lokasi; opt-in berbatas | SQL/web visibility/expiry |
| contacts | P atau [] untuk akun tanpa profil | Hanya participant; 100 terbaru, tanpa cursor | SQL/web; **CORE-001** |
| request_contact | P W/E berlawanan, target sah | consent true, verified phone, city/radius/presence, duplicate pair/expiry; limit khusus | SQL duplicate race + web bilateral |
| respond_contact | P, hanya penerima | ID/action, consent saat accept, belum expired; lock | SQL salah aktor + web accept/decline |
| revoke_contact | P, participant | ID milik participant; mencabut grant | SQL/web revoke/block |
| approved_contact | P, participant | Accepted, bilateral consent, phone hash mutakhir, belum expired/block | SQL nomor sebelum consent/nomor berubah; demo WhatsApp tidak nyata |
| agreements | P atau [] sebelum profil | Hanya worker/employer participant, 100 terbaru | SQL/web; **CORE-001** |
| create_agreement | P, participant kontak accepted | Nominal integer Rp1.000–50.000.000; judul 3–100, tugas 10–1000, jadwal/zona sah; context dan lock/unique active | SQL state/duplicate/input; web proposal/review; ambiguity-after-timeout live belum |
| agreement_action | P, participant/peran historis | Action/status/actor diperiksa; hasil selesai terpisah dari ACK tunai oleh worker | SQL + E2E dua pihak |
| report | P, pemohon sendiri terhadap target | Kategori allowlist; detail 10–1000; 3/menit | SQL/web submit; penanganan operator **OPS-002** |
| block | P, pemilik block | Target bukan diri; visibility/grant ditutup | SQL/web; histori kerja tidak dihapus |
| unblock | P, hanya pemilik block | Target; tidak mengubah block orang lain | SQL owner test; daftar blocked/unblock UI belum tersedia |
| notifications | P atau [] sebelum profil | Recipient sendiri, 100 terbaru | SQL/web; cursor masuk CORE-001 |
| read_notification | P, recipient | UUID milik recipient | SQL/web notices |
| request_deletion | A, diri sendiri, profil tidak wajib | confirm true; restrict + revoke presence/contact/location/photo metadata | SQL/web request; finalizer **PRIV-001** |
| reviews | A, target/peran boleh ditemukan | Kota/radius/block; 30 terbaru | SQL cross-target + web rating |
| agreement_reviews | P, participant historis | Agreement ID, peserta lain ditolak | SQL wrong-user |
| submit_review | P, participant pekerjaan completed | Integer 1–5, komentar ≤300, target/peran diturunkan server; unique immutable | SQL race/fake target/role + web rating dua pihak |
| suggest_job | P, usulan sendiri | Judul 3–80, detail 10–1000, no phone/link, effort/context valid, pending privat | SQL/web Other suggestion |
| job_suggestions | A/P sesuai gate akun, milik sendiri | 30 terbaru; tidak menjadi katalog publik otomatis | SQL/web private proposal |
| photo_access | A, target terotorisasi | Owner pending sendiri, publik hanya approved + discovery gate; role/UUID | SQL/mock Edge; signed bytes live belum |

Tidak ada OpenAPI yang dihasilkan. Ada kontrak operasi/results bersama dan tes kesesuaian Worker; `ActionArgs` masih `Record<string, unknown>`, sehingga validasi SQL wajib tetap dipertahankan. Pagination discovery berbatas; riwayat/review/usulan berbatas tetapi tidak semuanya dapat ditelusuri sampai akhir.

## 2. Inventaris 24 halaman dan alur

26 file route TSX termasuk dua `_layout`; 24 layar berikut. Setiap route teridentifikasi dari source. Semua layar bukan berarti seluruh state setiap layar sudah diuji live.

| Route / layar | Alur dan gate | Pemeriksaan aktual / batas |
| --- | --- | --- |
| `/` | Masuk Google atau demo eksplisit; bootstrap | Web UI/recovery/Google G/callback invalid; Google nyata belum |
| `/auth/callback` | PKCE exchange, origin/source/path/code | Source dan fixture; cold-start Android belum |
| `/onboarding` | Pengenalan/skip tersimpan | Web happy/skip; layar static tidak memerlukan empty data |
| `/intro-preview` | Pengenalan ulang dari bantuan | Web navigasi demo; tanpa write onboarding |
| `/role` | Dua peran/ganti role | Web + SQL peran historis |
| `/location` | Izin GPS, radius, retry, unsupported city | Web mock denial/inaccurate/retry/resume; OS permission nyata belum |
| `/setup` | Profil/tag/harga/nego/context; draft guard/skip | Web validasi/review/simpan + SQL; IME perangkat belum |
| `/phone` | Input nomor/verifikasi OTP/consent | Validasi client dan demo; SMS, resend/abuse/session expiry nyata belum |
| `/(tabs)/home` | Pintasan, filter, dua kolom rekomendasi | Web enam lebar dan card keyboard; loading/error shared gate |
| `/(tabs)/discover` | Peta/list/filter/cluster zoom | Web cluster, tile failure, radius/bounds/list; native maps belum |
| `/(tabs)/activity` | Kontak dan kesepakatan, kosong/filter | Web riwayat populated + bilateral; >100 **CORE-001** |
| `/(tabs)/notices` | Recipient notices/read/detail | Web routing/read; riwayat terbatas |
| `/(tabs)/account` | Profil/peran/lokasi, Lainnya, logout/delete | Web semua lima tab reachable/filled active, menu/settings; store link resmi belum |
| `/person/[id]` | Detail profil, harga/status/rating, request kontak, report/block | Web detail/demo negotiation; target fixed tidak menampilkan Tawar upah |
| `/contact/[id]` | Accept/decline/revoke/buka WhatsApp/usul kerja | Web happy/consent/recovery; detail list.find rusak >100 |
| `/new-agreement` | Review harga/tugas/jadwal sebelum kirim | Web negotiated proposal, draft/input; offline-after-commit nyata belum |
| `/agreement/[id]` | Accept/cancel/completion/ACK COD/rating | Web dua pihak + SQL state; detail list.find rusak >100 |
| `/profile-photo` | Galeri/crop/consent/upload/pending/delete | Web optional pending, Deno decoder/failure probes; galeri Android belum |
| `/report/[id]` | Kategori/detail, private report/block | Web form + SQL; operator belum aktif |
| `/delete-account` | Consent dan request restriction | Web + SQL; final deletion tidak ada |
| `/help` | FAQ sheets, katalog, intro | Web navigasi/keyboard; dukungan aktual belum tersedia |
| `/legal` | Draft kebijakan/terms | Source diperiksa; masih menyebut pengujian lokal |
| `/attribution` | Sumber peta/aset | Source/provenance; hak upstream logo belum terverifikasi |
| `/job-catalog` | Kategori aktif vs rencana; Other privat | Web search/gate; katalog lengkap bukan klaim seluruh kategori live |

### Perjalanan kritis dan jumlah langkah indikatif

Hitungan berasal dari alur source/demo dan dapat berubah oleh izin/isi form; bukan hasil UAT.

| Tugas | Langkah utama | Bukti |
| --- | --- | --- |
| Mulai demo sampai Beranda | Coba demo, Lewati, pilih peran, Lanjut, Gunakan lokasi demo, Lewati profil: 6 aksi | Browser audit; data sintetis |
| Mulai live | Google + keputusan provider, intro, peran, izin/radius GPS, profil/skip; nomor dibutuhkan saat aksi kontak/publik sesuai gate | Source; jumlah dialog OS/provider belum diukur |
| Hubungi orang | Buka profil, ajukan/consent, pihak lain menerima/consent, buka kontak | E2E + SQL; WhatsApp nyata tidak dikirim |
| Sepakati pekerjaan | Kontak accepted, review upah, rincian tugas/jadwal, review final, kirim, pihak lain setuju | E2E harga; bukan auto-accept |
| Selesaikan/COD | Ajukan selesai, pihak lain konfirmasi, worker ACK uang, ulasan opsional | E2E + SQL, status terpisah |
| Hapus akun | Akun, penghapusan, consent, ajukan | Request lulus; finalizer gagal readiness |
| Lupa password | Tidak ada login password dalam produk | Tidak berlaku; pemulihan akun Google/nomor melalui provider perlu runbook/support |

## 3. Matriks ancaman dan uji serangan

| Aktor / aset / batas | Ancaman | Kontrol diperiksa | Hasil dan batas |
| --- | --- | --- | --- |
| Anonymous terhadap API/DB | Baca profil/nomor/pekerjaan tanpa sesi | Bearer/Auth, grants/RLS/gateway | Unit/SQL menolak; provider live belum |
| Akun A terhadap objek B | BOLA/IDOR, ganti participant/owner | auth.uid, participant checks, key allowlist | SQL wrong-user contacts/agreement/review/photo/helper menolak; bukan semua kombinasi 30 operasi lewat HTTP live |
| Worker vs employer | Eskalasi role/ACK pembayaran | Role snapshot agreement, transisi server | SQL/web dua pihak lulus |
| Client terhadap nominal | Angka negatif, pecahan/string, melebihi batas; mass assignment | SQL numeric/type/range/check_keys, integer rupiah | SQL harga/upah invalid lulus |
| Pengirim terhadap consent | Menerima permintaan sendiri atau membaca nomor lebih awal | Receiver-only, bilateral consent, verified phone/hash/expiry | SQL/web lulus |
| Akun diblokir/dihapus | Tetap discover/contact/photo | Server status/block/city/radius checks | SQL/lokal lulus; signed URL yang sudah terbit masih berlaku sampai TTL |
| Client terhadap gateway | URL bebas/SSRF, redirect upstream | Host/path tetap, redirect error | Unit fixed URL lulus; DNS/cloud IAM tidak diuji |
| Browser asing | CORS bypass | Origin exact, token + SQL bukan CORS saja | Unit origin unknown/missing token menolak |
| Pemilik content | SQL injection/XSS/tautan berbahaya | Parameter SQL, no dynamic SQL dari input; native Text, tanpa innerHTML app | Source/pattern checks; fuzz lengkap/CSP hosting belum |
| Penyerang volume | Body besar/operation arbitrary/limiter failure | Streaming 16 KiB, allowlist, persistent limiter fail closed | Unit + 190 burst runtime; 180 rejected invalid/10 throttled |
| Penyerang upload | Fake JPEG, EXIF lokasi, dimensi besar, upload lintas user | Decode/reencode/strip, bounds, owner key, consent | Node + Deno + SQL lulus lokal; fuzz decoder/service DoS belum |
| Storage failure | Hapus palsu/objek yatim | Queue direncanakan, consumer belum | **Gagal**, MEDIA-001 direproduksi |
| Dua request | Duplicate contact/review/agreement, race status | Locks/unique/transactions | SQL multi-connection dan E2E lulus untuk kasus yang ada |
| Sesi callback palsu | Login CSRF/code replay/multiple code/origin | PKCE/callback validation/dedupe | Source/fixture, invalid callback lulus; native cold start/live belum |
| Supply chain | Glob ReDoS tooling | Lockfile/ignore-scripts | Advisory terdeteksi; sink exploitable belum diuji, SEC-001 |
| Operator/service role | Akses berlebih/penyalahgunaan data | Service role hanya Edge, helper grants dicabut | Source/SQL; IAM staf, key scopes dan audit trail cloud belum |

Tidak ada temuan credential asli yang wajib dirotasi dari scan ini. **Ini bukan pernyataan bahwa seluruh secret historis aman.** Bila riwayat/provisioning kemudian membuktikan kebocoran, rotasi key terkait, bukan sekadar hapus dari source. Daftar yang harus disiapkan untuk rotasi insiden: gateway Worker/Edge + hash SQL terkoordinasi, service role Supabase, OAuth client secret, SMS/provider key, token deployment, dan signing material yang relevan. Jangan menyalin nilainya ke laporan.

Matriks peran minimum: anonymous tidak mengakses data; owner mengubah profil/progress sendiri; participant kontak/kesepakatan melakukan aksi sesuai peran; pihak ketiga ditolak; service role hanya backend foto terkontrol. Tidak ada tenant organisasi atau admin UI dalam slice ini, sehingga tidak mengarang matriks tenant/admin produk yang tidak ada.

Prioritas keamanan terbesar: disposition supply chain, verifikasi otorisasi/JWT/Storage staging, final deletion/cleanup, telemetry redacted + respons insiden, penanganan laporan berizin. Bukti tidak menunjukkan takeover/kebocoran aktif; penilaian risiko rilis tetap tinggi karena kontrol operasional belum diterima.

## 4. Peta data pribadi dan vendor

Retensi di bawah memisahkan TTL yang benar-benar dikodekan dari kebutuhan kebijakan yang belum ditetapkan. TTL akses bukan jadwal penghapusan fisik.

| Data | Sumber / tujuan | Simpan / akses | Retensi aktual dan gap |
| --- | --- | --- | --- |
| ID Auth, email Google/nomor terverifikasi | Auth/OAuth/OTP, identitas/session | Supabase Auth; user/service sesuai izin; token SecureStore native atau memori web | Retensi Auth/backup belum diputuskan; email tidak perlu disebarkan lewat API profil |
| Nama/region/bio/tag/peran/harga | Form pemilik, profil dan matching | profiles/role_profiles/discovery_details/profile_prices privat; subset publik melewati discovery gates | Tidak ada jadwal purge umum; delete request belum final |
| Fix GPS tepat | OS foreground, validasi wilayah | Transit client–Worker–RPC; bukan kolom raw fix terpisah | Tidak dicatat pada log app; metadata transport vendor belum diverifikasi |
| Origin lokasi dibulatkan 3 desimal, marker 2 desimal | Radius/matching/peta perkiraan | account_locations/presences; publik hanya subset perkiraan | Validitas lokasi sekitar 30 menit/presence 1 jam sesuai gate; expiry tidak selalu menghapus row; retention fisik perlu policy |
| Nomor WhatsApp | Auth verified phone, pengungkapan bilateral | Auth; contact menyimpan hash; nomor baru dikembalikan saat grant sah | Pending 24 jam/accepted 30 hari; disalin di luar app tidak dapat ditarik; retensi row/grant belum final |
| Kesepakatan, tugas/jadwal/upah, ACK tunai | Peserta pekerjaan, bukti kesepakatan | agreements/agreement_details, participant-only | Tidak ada kebijakan simpan/anonymize sengketa/backup; jangan cascade bukti pihak lain |
| Rating/komentar | Participant pekerjaan completed | reviews; subset publik melalui target visibility | Immutable, 1 per reviewer/agreement; retensi/moderasi belum final |
| Foto/thumbnail/EXIF | Galeri ber-consent; identitas/tempat opsional | Bucket privat profile-photos; pending owner-only, approved tunduk izin; base64 render memori | EXIF dihapus saat reencode; URL akses 60 detik, bukan expiry objek; cleanup/orphan belum selesai |
| Laporan, blokir, usulan Other | Pengguna, keselamatan/umpan balik | reports/blocks/job_suggestions privat | Operator, akses staf, jadwal retensi/banding belum disahkan |
| Notifications/deletion request | Perubahan server/hak pengguna | Recipient/owner, schema privat | List 100; row/history dan penghapusan belum lengkap |
| IP/rate metadata | Cloudflare; abuse prevention | DO key di-hash dengan secret, bucket counter/alarm; SQL rate_buckets actor+minute | DO alarm cleanup 2 menit; SQL rate_buckets belum mempunyai purge yang terjadwal dalam repo; cloud transport/log retention belum diperiksa |
| Telemetry | Belum ada collector aplikasi aktif | Tidak ada collector yang disiapkan dalam source | Rekomendasi metadata minimum; jangan menganggap nol metadata pada provider |

| Vendor | Data yang dapat diterima | Status verifikasi |
| --- | --- | --- |
| Supabase | Auth, nomor, profil, lokasi dibulatkan, tugas/upah/laporan/foto dan metadata request | Kode/config lokal; region, DPA, subprocessor, backup/enkripsi dashboard belum diperiksa |
| Cloudflare | IP, bearer/body lewat gateway, GPS transit, metadata limiter | Source/runtimelokal; region processing, retensi cloud, WAF/IAM belum |
| Google OAuth | Login dan data akun sesuai consent provider | Integrasi source; konfigurasi akun/branding/redirect live belum |
| Google Maps Android | Request SDK/peta/lokasi yang digunakan SDK | Konfigurasi/key restriction/perilaku native belum diuji |
| OSM tile | IP dan koordinat tile viewport web | Atribusi/source diperiksa; bukan geocoder raw GPS; kebijakan kapasitas/vendor publik perlu keputusan |
| WhatsApp | Nomor/pesan setelah tindakan eksternal pengguna | Persetujuan kontak dalam app; pesan eksternal tidak ditarik kembali oleh Upahgo |
| Penyedia SMS/email | Nomor/OTP atau pesan sesuai konfigurasi Auth | Vendor, kuota, CAPTCHA, SPF/DKIM/DMARC dan biaya belum diverifikasi |

Dokumen yang ada: SECURITY.md, DESIGN.md, TESTING.md, DEVELOPMENT/SERVICES/GEO-DATA, register sumber aset, legal/help draft. Yang belum final/terbukti: privacy policy publik, terms, retention/deletion schedule, prosedur ekspor, vendor/DPA/transfer lintas negara, kebijakan komunitas/moderasi/banding, kontak pengendali, incident/breach policy, deklarasi Data safety/URL deletion Play. PSE, UU PDP, perlindungan konsumen/relasi kerja, persyaratan anak/minimum umur, penggunaan merek/logo dan transaksi COD perlu keputusan produk/legal; tidak dinyatakan patuh dari pemeriksaan kode.

## 5. Ringkasan skema, indeks dan query

24 tabel, 38 indeks, 24 fungsi publik/privat yang terinventarisasi. Detail atribut RLS, ACL, function search_path, DDL indeks dan plan ada di [data-probes.json](evidence/data-probes.json).

| Kelompok | Tabel | Relasi dan kontrol |
| --- | --- | --- |
| Identitas/profil | accounts, profiles, role_profiles, profile_prices, profile_photos, discovery_details | FK Auth, PK user/peran, constraint role/nominal/status, privat |
| Geografi/penemuan | cities, areas, account_locations, presences, tags, job_catalog | City/area FK; bounds/polygon/radius; index presence city/role/expiry dan area/role/expiry |
| Kontak/kerja | contacts, agreements, agreement_details, reviews | Participant FK, unique live pair/active agreement/reviewer, integer rupiah/status, index participant+tanggal |
| Keselamatan/komunikasi | blocks, reports, notifications, job_suggestions, deletion_requests | Owner/target/recipient FK, PK/unique/length constraints; index recipient/owner+tanggal |
| Infrastruktur | gateway_config, rate_buckets, media_cleanup | Hash gateway server, actor/operation/window PK, object key cleanup PK; retensi perlu operasi |

Tujuh migrasi dari database kosong lulus; bukan jaminan script dapat diputar ulang pada database populated secara idempoten. Rename wrapper harus dijalankan berurutan. Rollback client mempertahankan skema; destructive down migration tidak diuji/diusulkan. Fixtures disisipkan oleh test, tidak termasuk seed pengguna produksi. Direktori kota live nasional belum dibuktikan; Pekanbaru fixture bukan klaim layanan nasional.

| Query EXPLAIN | Execution lokal ms | Risiko yang harus diuji pada data realistis |
| --- | --- | --- |
| active-presences | 0,009 | City/role/expiry dan radius di discovery; ukuran kandidat/geometri |
| profile-id | 0,006 | Lookup ID cepat, gates tetap dominan; sequential scan fixture kecil wajar |
| contacts | 0,046 | OR participant + sort; cursor dan akses >100 |
| agreements | 0,046 | OR participant + sort; pekerjaan aktif lama |
| notifications | 0,008 | Pertumbuhan recipient/history dan retention |
| reviews | 0,017 | Target/peran + sort, pemilihan indeks saat volume tumbuh |
| rating-average | 0,009 | Agregasi rating kandidat sebelum limit pada discovery final |
| profile-photo | 0,004 | Lookup user/peran; bytes/signing/network tidak tercakup |
| profile-price | 0,004 | PK user/peran; tambahan join pada list |
| media-cleanup | 0,011 | Queue tertua memerlukan worker/indeks berdasarkan beban nyata |

Tidak menyebut query “lambat” dari fixture sekecil ini. Sepuluh plan adalah query representatif, **bukan sepuluh RPC penuh dengan seluruh wrapper/akses jaringan**. Paling perlu benchmark: discovery dengan rating/radius/polygon, OR-list participant besar, retention rate_buckets/notices dan sweep Storage. Pooling/koneksi/provider backup/enkripsi at rest belum dinilai dari cloud.

## 6. Checklist seluruh sepuluh modul

| Modul / bagian | Yang diperiksa | Hasil dan batas |
| --- | --- | --- |
| 1A struktur/state/dependencies | UI/src/shared/Worker/SQL, state session/demo/cache, vendor failure | Batas jelas, stateless Worker + DO, Supabase/Cloudflare dependency utama; tidak ada failover teruji |
| 1B kode/config/error | Strict + noUncheckedIndexedAccess, any/ts-ignore/log/innerHTML patterns, hooks/error redaction, env examples | Tidak ada pola any/ts-ignore/console pada source runtime yang discan. Catch logout/foreground best effort memiliki tujuan; observability kurang. Besar file saja tidak dianggap bug |
| 1C sisa pengembangan | Demo actor switch, synthetic phone/history, TODO/debug/bypass | Demo eksplisit/in-memory, live tidak fallback; tidak menemukan hidden bypass. Fitur katalog rencana dilabeli. Tidak membuktikan seluruh dependency digunakan |
| 1D pemeliharaan | README/DEVELOPMENT/SERVICES, clean install/build | Copy bersih jalan; total onboarding developer <30 menit belum ditiming end-to-end; REL-001 menghambat checkout |
| 2A kontrak | Allowlist/typed result/HTTP envelope/status, semua list | Batas hasil ada; CORE-001. Belum OpenAPI, args unknown dilindungi SQL |
| 2B bisnis | Server types/bounds, rupiah integer, locks/state/zone/role snapshots | SQL/race/input tests lulus lokal; gangguan sesudah commit perlu staging |
| 2C ketahanan | Timeout 8/10/25 detik Worker, 15 detik client, retry write, upload, limiter | Tidak ada auto-retry write buta; cleanup kurang; internal SDK Edge timeout/resource behavior live belum diukur; webhook/job bisnis N/A |
| 2D efisiensi/cache | Discovery limit40/offset, list100, cache actor/filter key, foto no-store | Tidak menemukan API bebas mengembalikan seluruh tabel; agregasi/kandidat/1040 retained UI item perlu profiling |
| 2E observasi | Request IDs/events/alerts | OPS-001; redaction baik tetapi deteksi/triase belum siap |
| 3A skema/indeks/retensi | 24 tables/38 indexes, constraints/FK, 10 EXPLAIN | Lokal lulus; SQL rate/history retention belum dioperasikan |
| 3B migrasi | Urutan tujuh migrasi dari kosong, rollback docs | Lulus lokal; populated/rolling deploy/restore belum teruji |
| 3C akses data | RLS/grants/helper/gateway/auth.uid, wrong user | SQL menolak; Auth shim tidak menggantikan PostgREST nyata |
| 3D integritas/konkurensi | Multi-step SQL transaction, locks, unique/status, delete FK | Race lulus untuk kasus yang ada; PRIV-001. Pooling/koneksi cloud belum |
| 3E continuity/enkripsi/storage | Private bucket/signed URL/config, backup docs | Foto privat di source; backup terenkripsi/terpisah/restore at rest cloud belum diperiksa |
| 4A states/forms/recovery | useTask lock, useLoad stale result guard, AccountGate/LocationGate, recovery/draft | Web fixture lulus; custom fatal ErrorBoundary tidak ditemukan; default Expo belum diuji fatal runtime. Offline/expiry nyata belum |
| 4B perangkat | 320/375/414/768/1024/1440, no overflow, responsive nav | Chrome lulus untuk browse baru; 17 suite lebih luas. Landscape+IME/200% native/3 browser belum |
| 4C copy/UX | Indonesia/Rupiah, consent destructive, price/COD, beta/deferred labels | Alur/copy terpisah jelas; UAT/task success belum, operasional draft |
| 4D aksesibilitas | Roles/labels/focus/live-region/reduced-motion, token contrast dan key flow | Label AA lulus; keyboard/card Enter lulus. Axe/AT native dan seluruh pixel contrast belum, bukan klaim WCAG penuh |
| 4E client security | Storage tokens, callback, no unsafe HTML/public service key patterns | Source scan/control baik; device extraction/history tidak diuji |
| 4F SEO/sharing | SPA auth application/preview, favicon/config | SEO marketing/structured data N/A; noindex staging/headers actual perlu verifikasi sebelum web publik |
| 5A web | Cold LCP/CLS, bytes/gzip, routes/split, no-store preview | PERF-001. Bukan Lighthouse, field p75 atau INP; cache/CDN/Brotli actual belum |
| 5B API | Timeout/bounds, 10 plans, local DO burst50 | Rate guard lulus; legitimate top10 p50/p95/p99 dan 50CCU API staging belum |
| 5C cost/scale | Units/scenarios/quotas/bottleneck hypotheses | Model pada OPERATIONS, tanpa harga yang dikarang; actual invoice/provider plans belum |
| 6A access | Actor/object/role/gateway/helper ACL; admin/tenant boundaries | Local negative tests lulus; tidak ada tenant/admin UI; HTTP live matrix belum |
| 6B session | PKCE/SecureStore/in-memory/callback/auth errors | Source/fixture; token revocation/account recovery/native cold start belum |
| 6C input/injection | Fixed upstream, SQL parameters/key allowlist, no HTML injection | Local unit/SQL lulus; fuzz menyeluruh tidak dilakukan |
| 6D data/secrets | Pattern scanner, env isolation, crypto library/hash, signed storage | No credential match; history unavailable; cloud encryption/IAM/key scopes belum |
| 6E supply chain/CI | Lockfile, ignore-scripts, audit/tree/workflow permissions | SEC-001; contents read baik; remote CI/proteksi branch belum |
| 6F abuse | IP/user/write limits, byte bounds, no blind retries | Local guard lulus; Auth/SMS/CAPTCHA quota dan shared NAT perlu staging |
| 6G pembayaran | COD ack integer/role/status, no gateway/cards | SQL/web lulus; bank/payment webhook/PCI N/A, tidak ada jaminan pembayaran |
| 6H AI | Tidak ada AI/LLM/tools integration produk | N/A |
| 6I infra/insiden | HTTPS upstream/redirect deny, config/docs, identity permissions | Source baik; TLS/IAM/dashboard/separate env/alert/rotation drill belum |
| 7A tes/coverage | 30 Node,135 SQL,17 web,1 Edge,1 audit failure | Semuanya lulus; coverage Node termasuk tes; tidak ada retry suite untuk menyembunyikan flaky |
| 7B rencana tes | Negative/race/offline/UAT/smoke/staging/browser/device | Sepuluh tes awal di bawah; UAT5–10 nyata belum |
| 7C bug | Reproduksi history/delete/photo + source corroboration | Bukti lokal terpisah; tidak mengubah source saat audit |
| 7D proses | Lint/typecheck/formatter/workflow/data synthetic | Remote merge protection/review/precommit belum diverifikasi; formatter bukan release gate saat ini |
| 8A build/rilis | Clean install/typecheck/export, config and workflow | Lokal lulus; repository, native artifact, canary/rollback belum |
| 8B observability | Logs/metrics/crash/uptime/alerts/on-call/SLO | OPS-001; proposal belum diaktifkan |
| 8C scale/degradasi | Stateless/DO, fallback list/deny location, timeouts | Source/runtime guard; quota & legitimate load/cold start/soak belum |
| 8D DR/ownership | Backup/restore/rollback/secret incident docs | Runbook draf pada OPERATIONS; pemilik akses cadangan/2FA/latihan belum |
| 8E biaya | Model1x/10x/100x/alert budget | Proposal, actual price/plan belum |
| 9A data map | Fields/vendor/storage/access/TTL | Tabel di atas; region/provider retention belum |
| 9B dasar/hak/policy | Consent/contact/photo/presence, edit/delete/export/terms | Consent tidak prechecked; PRIV-001/002/003. Tracking nonessential tidak ditemukan; bukan bukti tidak ada provider metadata |
| 9C teknis | Minimisasi/rounding, private schema/photos, redaction, staffing | Source baik; staff audit/retention/at-rest cloud belum |
| 9D insiden/DPIA | Sensitive location/contact/report risks, rotation docs | Owner/prosedur pemberitahuan/penilaian dampak harus ditetapkan; tidak mengarang tenggat hukum |
| 9E regulasi/IP/store | UU PDP/PSE/COD/consumers/assets/Play | Review ahli dan hak logo/label store belum; tidak ada klaim sertifikasi |
| 10A kesiapan produk | Core flow/onboarding/help/reports/deferred categories | Demo jelas; activation/retention/business metrics/UAT belum terpasang/diukur |
| 10B dukungan/komunikasi | Help/incident/FAQ, DNS/email/vendor docs | OPS-002; monitored channel/SPF/DKIM/DMARC/domain ownership belum |
| 10C abuse/moderasi | Report/block, pending photo, no user-facing false publication | Operator/banding/cleanup belum; operator web memang ditunda, bukan wajib dibangun |
| 10D bisnis | Direct COD/no escrow; no platform invoice/payment code | Revenue/tax/dispute/cost policies belum diputuskan; jangan mengarang monetisasi |
| 10E rollout | Rencana tiga tahap/kriteria stop/72h duty | Usulan pada OPERATIONS, belum persetujuan peluncuran |

## 7. Sepuluh tes pertama paling bernilai

Semua berikut **diusulkan**, belum ditambahkan ke source dalam audit baca-saja. Regression harus gagal pada cacat yang dituju, lalu lulus setelah perbaikan.

| Urutan / prioritas | Kasus konkret | Hasil wajib |
| --- | --- | --- |
| 1 / P1 CORE | Buat >100 kontak/pekerjaan; satu pekerjaan aktif tertua; buka dari notifikasi kedua pihak/aktor ketiga | Participant dapat membaca/menyelesaikan; pihak lain ditolak; pagination stabil |
| 2 / P1 PRIV | Final deletion akun dengan dua peran, foto, kontak, COD, review/report; retry tiap tahap | Progres idempoten; data tak perlu hilang, bukti pihak lain sesuai retensi; Auth ditutup |
| 3 / P1 MEDIA | Detail upload sukses/thumb gagal, commit timeout, remove403; worker restart saat retry | Reconciler/sweep menghapus orphan sesudah grace period, tidak pernah key aktif |
| 4 / P1 SECURITY | HTTP staging: no token, expired/malformed token, tokenA + idB, fake gateway, direct helper/table/Storage | Semua ditolak tanpa data pribadi; JWT issuer/audience dan provider sesuai environment |
| 5 / P1 NATIVE | APK cold-start Google PKCE, cancel, callback duplikat/asing, background/kill/resume | Sesi benar/aman, tidak stuck atau tukar account, no token log |
| 6 / P1 NATIVE | GPS deny/permanent deny/coarse/inaccurate/outside city; foreground refresh; maps key/tile gagal | Recovery jelas; list tetap bisa dipakai sesuai gate, history/account tetap tersedia |
| 7 / P1 INTEGRITY | Dua perangkat accept/cancel/create/confirm/ACK bersamaan; jaringan putus sesudah commit | Satu transisi sah, tidak duplikat; user dapat menemukan hasil di Aktivitas |
| 8 / P1 DR | Backup staging DB+Storage, insert marker sintetis, simulasi kerusakan, restore ke target terisolasi | Ukur RPO/RTO/count/FK/RLS/bytes; deletion tombstone tetap ditaati; rollback compatible |
| 9 / P1 OPS | Submit laporan, moderator terbatas menindak, banding; forced upstream failure memicu alert | Petugas menerima tanpa PII berlebihan; audit trail/response SLA dan request ID terbukti |
| 10 / P2 A11Y/PERF | Chrome/Firefox/WebKit, TalkBack, teks200%, 320–1440, keyboard/IME, slow4G; lalu 50CCU sah | Tidak terpotong/focus trap; state terbaca; target latency/availability dan CWV diuji dengan metodologi tercatat |

Tambahan: ekspor A tidak membocorkan B; nonce/rate SMS dan CAPTCHA sesuai provider; EXIF/decoder fuzz terisolasi; secret pattern scanner self-test; UI Harga tetap pada false/undefined vs harga kosong; UAT5–10 pengguna kedua peran dengan data sintetis.

### Smoke setelah deploy yang disetujui

1. Halaman/login shell dan versi artefak benar; staging tidak terindeks.
2. Synthetic Auth bootstrap, role/location gate dan profile read sah.
3. No token/wrong user/direct RPC tanpa gateway ditolak.
4. Discovery+filter list/marker perkiraan dan fallback list.
5. Consent kedua pihak + kesepakatan sintetis + transisi/ACK terpisah.
6. Photo pending privat, signed expiry, cleanup tertunda diproses.
7. Report masuk antrean terpantau; tidak ada PII/token pada telemetry.
8. Alert dependency/uptime serta rollback artifact siap; tidak melakukan transaksi/SMS nyata tanpa persetujuan.

### UAT yang diusulkan

5–10 orang, kedua peran, Android kelas bawah/menengah, tugas scripted: mulai, cari, pahami harga/nego, consent kontak, sepakati kerja, COD, lapor, hapus. Rekam persentase task completion, waktu, salah paham dan kebutuhan bantuan tanpa merekam nomor/lokasi nyata. Target awal ≥90% tugas inti selesai, nol salah paham “selesai berarti sudah dibayar” atau “rating menjamin keamanan”; kegagalan sensitif wajib diperbaiki. Angka target bukan hasil penelitian yang sudah dilakukan.
