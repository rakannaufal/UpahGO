# Inventaris layar UpahGo Ceria

75 layar/state; Android 412 × 892. Semua data sintetis.

## Ceria 00 · Panduan dan komponen

Empat papan: panduan, komponen/state, alur, ikon/ilustrasi.

## Ceria 01 · Mulai dan onboarding

| Frame | Layar | Route/konteks |
| --- | --- | --- |
| `login` | Masuk | / |
| `intro_1` | Pengenalan 1 dari 3 | /onboarding · /intro-preview |
| `intro_2` | Pengenalan 2 dari 3 | /onboarding · /intro-preview |
| `intro_3` | Pengenalan 3 dari 3 | /onboarding · /intro-preview |
| `role` | Pilih peran | /role |
| `role_employer` | Pilih peran · Cari tenaga | /role · pilihan penyedia kerja |
| `location` | Lokasi dan jangkauan | /location |
| `location_employer` | Lokasi dan jangkauan | /location |
| `setup_worker` | Profil buruh | /setup |
| `setup_employer` | Profil penyedia kerja | /setup |
| `phone` | Nomor WhatsApp | /phone |
| `otp` | Verifikasi nomor | /phone · OTP |

## Ceria 02 · Beranda dan Temukan

| Frame | Layar | Route/konteks |
| --- | --- | --- |
| `home_worker` | Beranda · buruh | /(tabs)/home |
| `home_employer` | Beranda · penyedia kerja | /(tabs)/home |
| `map_worker` | Peta buruh | /(tabs)/discover |
| `map_employer` | Peta penyedia kerja | /(tabs)/discover |
| `map_spread` | Pin terpisah · zoom maksimal | /(tabs)/discover |
| `map_selected` | Profil dipilih di peta | /(tabs)/discover |
| `discover_list` | Hasil dalam daftar | /(tabs)/discover · daftar |
| `filters` | Filter pencarian | Sheet bersama · Beranda/Temukan |
| `visibility` | Tampil di peta | Sheet · pengaturan visibilitas |

## Ceria 03 · Profil dan izin kontak

| Frame | Layar | Route/konteks |
| --- | --- | --- |
| `person_worker` | Profil buruh | /person/[id] |
| `person_employer` | Profil penyedia kerja | /person/[id] |
| `activity_contacts` | Aktivitas · kontak | /(tabs)/activity |
| `contact_incoming` | Permintaan kontak masuk | /contact/[id] |
| `contact_sent` | Permintaan terkirim | /contact/[id] |
| `contact_approved` | Kontak diizinkan | /contact/[id] |
| `contact_revoked` | Izin kontak dicabut | /contact/[id] |

## Ceria 04 · Kesepakatan dan COD

| Frame | Layar | Route/konteks |
| --- | --- | --- |
| `activity_work` | Aktivitas · pekerjaan | /(tabs)/activity |
| `agreement_form` | Buat kesepakatan | /new-agreement |
| `work_context` | Kondisi kerja | /new-agreement · rincian kondisi |
| `agreement_review` | Tinjau kesepakatan | /new-agreement · review |
| `agreement_waiting` | Menunggu penerimaan | /agreement/[id] |
| `agreement_active` | Pekerjaan disepakati | /agreement/[id] |
| `agreement_completion` | Periksa hasil pekerjaan | /agreement/[id] |
| `agreement_cod` | Pekerjaan selesai | /agreement/[id] |
| `agreement_paid` | Upah diterima | /agreement/[id] |
| `agreement_cancelled` | Kesepakatan dibatalkan | /agreement/[id] |
| `cod_confirm` | Konfirmasi uang diterima | Dialog · pengakuan COD |
| `rating` | Beri penilaian | /agreement/[id] · penilaian |

## Ceria 05 · Akun dan bantuan

| Frame | Layar | Route/konteks |
| --- | --- | --- |
| `notifications` | Notifikasi | /(tabs)/notices |
| `account` | Akun | /(tabs)/account |
| `photo_empty` | Foto profil opsional | /profile-photo |
| `photo_preview` | Pratinjau foto | /profile-photo |
| `photo_consent` | Izin foto dipilih | /profile-photo |
| `photo_pending` | Menunggu peninjauan | /profile-photo |
| `catalog` | Katalog pekerjaan | /job-catalog |
| `catalog_detail` | Bersih-bersih | /job-catalog · kategori |
| `catalog_suggest` | Usulkan pekerjaan | /job-catalog · usulan privat |
| `help` | Bantuan dan privasi | /help |
| `help_article` | Nomor dan izin kontak | /help · artikel |
| `help_location` | Lokasi di peta | /help · artikel |
| `help_cod` | Kesepakatan dan COD | /help · artikel |
| `help_rating` | Rating dan ulasan | /help · artikel |
| `help_privacy` | Privasi dan ketentuan | /help · artikel |
| `help_report` | Laporkan masalah | /help · artikel |
| `report` | Laporkan akun | /report/[id] |
| `report_success` | Laporan terkirim | /report/[id] · hasil |
| `suggest_success` | Usulan terkirim | /job-catalog · hasil |
| `block_confirm` | Blokir akun | Dialog · blokir |
| `delete_account` | Penghapusan akun | /delete-account |
| `delete_requested` | Permintaan penghapusan | /delete-account · hasil |

## Ceria 06 · State dan pemulihan

| Frame | Layar | Route/konteks |
| --- | --- | --- |
| `empty` | Belum ada hasil | State bersama · empty |
| `network_error` | Gagal memuat hasil | State bersama · network error |
| `location_denied` | Izin lokasi ditolak | State bersama · location denied |
| `city_unavailable` | Area belum terlayani | State bersama · city unavailable |
| `bootstrap_error` | Akun belum termuat | State bersama · bootstrap error |
| `auth_error` | Masuk dibatalkan atau gagal | State bersama · auth error |
| `session_expired` | Sesi berakhir | State bersama · session expired |
| `target_unavailable` | Profil tidak tersedia | State bersama · target unavailable |
| `rating_success` | Penilaian terkirim | State bersama · rating success |
| `whatsapp_notice` | Pratinjau WhatsApp | State bersama · whatsapp notice |
| `offline` | Offline · hasil tersimpan | State · koneksi terputus |
| `validation` | Form perlu diperbaiki | State · validasi dan masukan dipertahankan |
| `loading` | Sedang memuat | State · loading |
