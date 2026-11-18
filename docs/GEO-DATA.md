# Data batas wilayah

Batas Kota Pekanbaru di shared/pekanbaru.json berasal dari OpenStreetMap relation 16563796, diambil melalui Nominatim pada 17 November 2026. Geometri dipertahankan tanpa simplifikasi, Polygon dibungkus sebagai MultiPolygon.

Sumber: https://www.openstreetmap.org/relation/16563796
Lisensi data: https://www.openstreetmap.org/copyright (ODbL 1.0). Atribusi ditampilkan pada peta. File ini adalah extract data OSM, bukan batas resmi pemerintah atau jaminan lokasi.

Data ini dipakai oleh demo, dengan seluruh akun/aktivitas/ulasan dan titiknya sintetis. Tidak memanggil Nominatim untuk GPS pengguna. Staging memerlukan direktori kota/area berlisensi yang ditinjau operator; jangan menganggap satu kota ini sebagai cakupan nasional.

Peta web memakai tile standar OpenStreetMap, mengikuti https://operations.osmfoundation.org/policies/tiles/: tanpa prefetch/offline download, atribusi terlihat, caching browser normal. Akses tile mengungkap IP/viewport kepada penyedia; Fix tepat hanya diteruskan melalui Worker ke RPC untuk validasi kota; tidak disimpan/log atau dikirim ke geocoder/vendor tile secara langsung. Penyedia tile menerima koordinat tile, bukan payload fix. Untuk produksi tentukan penyedia dan kapasitas yang sesuai sebelum rilis.
