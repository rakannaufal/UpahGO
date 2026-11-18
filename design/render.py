"""Render static design references from tokens and the selected logo.

Requires local Pillow and Node/sharp for the licensed SVG icon contact sheet.
No browser, app implementation, installation, or external image API is used.
"""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT.parent / 'assets'
T = json.loads((ROOT / 'tokens.json').read_text())
C = T['color']
FONT = ASSETS / 'brand/source/Roboto-variable.ttf'


class Board:
    def __init__(self, width, height, background='background'):
        self.im = Image.new('RGB', (width, height), C[background])
        self.draw = ImageDraw.Draw(self.im)

    def font(self, size, bold=False):
        font = ImageFont.truetype(str(FONT), size)
        font.set_variation_by_name('Bold' if bold else 'Regular')
        return font

    def text(self, x, y, value, size=22, color='onSurface', bold=False, max_width=None):
        font = self.font(size, bold)
        if max_width:
            assert self.draw.textlength(value, font=font) <= max_width, f'Text overflow: {value}'
        self.draw.text((x, y), value, fill=C.get(color, color), font=font)

    def paragraph(self, x, y, value, width, size=18, color='onSurfaceVariant', bold=False):
        words, lines, line = value.split(), [], ''
        font = self.font(size, bold)
        for word in words:
            candidate = f'{line} {word}'.strip()
            if self.draw.textlength(candidate, font=font) > width and line:
                lines.append(line)
                line = word
            else:
                line = candidate
        lines.append(line)
        for index, line in enumerate(lines):
            self.text(x, y+index*round(size*1.5), line, size, color, bold, width)
        return y+len(lines)*round(size*1.5)

    def box(self, x, y, width, height, fill='surface', radius=24, outline=None, border=1):
        self.draw.rounded_rectangle((x, y, x+width, y+height), radius,
                                   fill=C[fill], outline=C[outline] if outline else None, width=border)

    def button(self, x, y, width, label, variant='primary', height=64, size=20):
        fill, fg, outline = {
            'primary': ('primary', 'onPrimary', None),
            'secondary': ('surface', 'actionText', 'outline'),
            'tonal': ('primaryContainer', 'onPrimaryContainer', 'focus'),
            'disabled': ('disabledContainer', 'onDisabledContainer', None),
        }[variant]
        self.box(x, y, width, height, fill, T['radius']['control'], outline)
        length = self.draw.textlength(label, font=self.font(size, True))
        assert length < width-24, f'Button overflow: {label}'
        self.text(x+(width-length)/2, y+(height-size)/2-3, label, size, fg, True)

    def tag(self, x, y, label, employer=False, size=18):
        width = self.draw.textlength(label, font=self.font(size))+20
        self.box(x, y, width, 36, 'warmContainer' if employer else 'primaryContainer', 10)
        self.text(x+10, y+6, label, size, 'onWarmContainer' if employer else 'onPrimaryContainer')
        return width+8

    def paste(self, path, x, y, width, height=None):
        with Image.open(path) as image:
            image = image.convert('RGBA')
            height = height or round(width*image.height/image.width)
            image = image.resize((width, height), Image.Resampling.LANCZOS)
            self.im.paste(image, (round(x), round(y)), image)

    def save(self, path):
        self.im.save(path, optimize=True)


def foundations():
    b = Board(1600, 1900)
    b.paste(ASSETS/'brand/exports/upahgo-badge.png', 64, 48, 88)
    b.text(180, 44, 'Upahgo', 60, 'primary', True)
    b.text(180, 120, 'Sistem desain Android · Hijau, emas, ruang untuk bekerja.', 24)
    b.text(64, 176, 'Rancangan 1.0 · Contoh statis; seluruh profil dan nominal simulasi.', 21, 'onSurfaceVariant')
    swatches = [('primary', 'Hijau pekerja', 'onPrimary'), ('brandGold', 'Emas hangat', 'onBrandGold'),
                ('primaryContainer', 'Mint muda', 'onPrimaryContainer'), ('surface', 'Putih lapang', 'onSurface')]
    for i, (key, name, fg) in enumerate(swatches):
        x = 64+i*376
        b.box(x, 232, 344, 140, key, 24, 'outlineVariant' if key == 'surface' else None)
        b.text(x+24, 252, name, 26, fg, True)
        b.text(x+24, 316, C[key], 24, fg)
    b.text(64, 414, 'Satu aksi utama, state yang terbaca', 32, bold=True)
    for i, (label, variant, caption) in enumerate([
            ('Hubungi', 'primary', 'Default · min 56 dp'), ('Lihat detail', 'secondary', 'Pendamping · outline'),
            ('Hubungi · mengirim', 'primary', 'Pending · cegah kirim ganda'), ('Tidak tersedia', 'disabled', 'Disabled · alasan tetap terlihat')]):
        x = 64+i*376
        b.button(x, 474, 344, label, variant)
        b.text(x, 552, caption, 19, 'onSurfaceVariant')
    b.text(64, 616, 'Daerah kerja', 21, bold=True)
    b.box(64, 652, 700, 68, outline='focus', radius=18, border=2)
    b.text(88, 672, 'Pilih kota/kabupaten', 22, 'onSurfaceVariant')
    b.text(64, 734, 'Bisa dipilih manual tanpa mengaktifkan GPS.', 20, 'onSurfaceVariant')
    b.text(836, 616, 'Pilihan aktif dan status tampil', 21, bold=True)
    b.button(836, 652, 300, 'Cari pekerja', 'tonal')
    b.box(1160, 662, 64, 40, 'primary', 20)
    b.draw.ellipse((1192, 669, 1218, 695), fill=C['surface'])
    b.text(1240, 666, 'Tampil di peta', 21, bold=True)
    b.text(836, 734, 'Area perkiraan · aktivasi atas pilihan sendiri.', 20, 'onSurfaceVariant')
    b.text(64, 804, 'Kartu orang, konteks kerja', 32, bold=True)
    for x, employer in ((64, False), (836, True)):
        b.box(x, 868, 700, 340)
        b.text(x+24, 890, 'Pemberi kerja contoh' if employer else 'Pekerja contoh', 28, bold=True)
        b.text(x+24, 936, 'Pemberi kerja · mencari tenaga' if employer else 'Pekerja · siap menerima pekerjaan', 20, 'onSurfaceVariant')
        b.text(x+24, 972, 'Kecamatan contoh · lokasi perkiraan', 20, 'onSurfaceVariant')
        b.text(x+24, 1016, 'Butuh bantuan untuk' if employer else 'Layanan yang ditawarkan', 20, bold=True)
        xx = x+24
        for tag in (('Mengepel', 'Kamar mandi') if employer else ('Menyapu', 'Mengepel', 'Dapur')):
            xx += b.tag(xx, 1052, tag, employer)
        b.text(x+24, 1112, 'Upah belum disepakati · tunai di tempat' if employer else 'Tag adalah pernyataan pengguna.', 20, 'onSurfaceVariant')
        b.text(x+24, 1162, 'Lihat detail', 20, 'actionText', True)
        b.button(x+468, 1138, 208, 'Hubungi', height=56)
    b.text(64, 1252, 'Status selalu punya teks', 30, bold=True)
    for i, (key, label) in enumerate([('success', 'Selesai dikonfirmasi'), ('warning', 'Menunggu respons'), ('error', 'Data belum tersimpan'), ('info', 'Tidak ada koneksi')]):
        x = 64+i*376
        b.box(x, 1310, 344, 58, key+'Container', 10)
        b.text(x+16, 1326, label, 21, key)
    b.text(64, 1422, 'Tipografi yang akrab', 30, bold=True)
    b.text(64, 1478, 'Cari kerja dekatmu.', 40, 'primary', True)
    b.text(64, 1540, 'Roboto / sans sistem Android', 24)
    b.text(64, 1580, '28/36 · 24/32 · 22/28 · 18/26 · 16/24 · 14/22 sp', 20, 'onSurfaceVariant')
    b.text(836, 1422, 'Gerak secukupnya', 30, bold=True)
    b.text(836, 1478, '100 ms     160 ms     200 ms', 34, 'primary', True)
    b.text(836, 1532, 'Sentuhan       State             Masuk', 21, 'onSurfaceVariant')
    b.paragraph(836, 1580, 'Tanpa loop dekoratif. Reduced motion mengubah state langsung, tanpa transform.', 660, 21)
    b.draw.line((64, 1684, 1536, 1684), fill=C['outlineVariant'], width=2)
    b.text(64, 1720, '48 dp target sentuh · 8 dp sela · form tumbuh mengikuti skala teks', 25, bold=True)
    b.text(64, 1776, '320–599 dp satu kolom · 600–839 dp isi terpusat · mulai 840 dp daftar/detail', 22, 'onSurfaceVariant')
    b.text(64, 1828, 'Semua ukuran dan animasi adalah spesifikasi. Build, aksesibilitas, performa Android belum diuji.', 21, 'onSurfaceVariant')
    b.save(ROOT/'preview.png')


def screens():
    board = Board(1600, 1420)
    board.text(64, 44, 'Upahgo di layar', 56, 'primary', True)
    board.text(64, 122, 'Studi visual Android · Gambar statis, data simulasi, bukan aplikasi berfungsi.', 24, 'onSurfaceVariant')
    for index, caption in enumerate(('Onboarding', 'Penemuan pekerja', 'Persetujuan kontak')):
        x = 64+index*504
        board.text(x, 198, caption, 27, bold=True)
        p = Board(440, 1000, 'surface')
        if index == 0:
            p.box(24, 28, 392, 292, 'primaryContainer', 28)
            p.paste(ASSETS/'brand/exports/upahgo-badge.png', 144, 100, 152)
            p.text(24, 358, 'Cari kerja.', 36, 'primary', True)
            p.text(24, 404, 'Temukan tenaga.', 36, 'primary', True)
            p.paragraph(24, 474, 'Untuk pekerja harian dan orang yang butuh bantuan bersih-bersih rumah.', 380, 18)
            p.text(24, 598, 'Pilih kebutuhanmu', 20, bold=True)
            p.button(24, 650, 392, 'Saya mencari kerja', height=56, size=18)
            p.button(24, 722, 392, 'Saya mencari pekerja', 'secondary', height=56, size=18)
            p.paragraph(24, 826, 'Pilihan peran dapat disesuaikan nanti. Lokasi dan nomor dibagikan setelah ada konteks dan izin.', 376, 16)
        elif index == 1:
            p.text(24, 28, 'Cari pekerja', 28, 'primary', True)
            p.text(24, 82, 'Kecamatan contoh', 18, bold=True)
            p.text(24, 112, 'Area dipilih manual · simulasi', 15, 'onSurfaceVariant')
            p.button(24, 158, 188, 'Cari pekerja', 'tonal', height=56, size=15)
            p.button(228, 158, 188, 'Cari pemberi kerja', 'secondary', height=56, size=15)
            p.text(24, 236, 'Peta', 17, 'actionText', True)
            p.text(110, 236, 'Daftar', 17, 'onSurfaceVariant')
            p.draw.line((24, 263, 66, 263), fill=C['primary'], width=3)
            p.box(24, 286, 392, 210, 'surfaceVariant', 24)
            p.text(40, 302, 'Diagram area, bukan peta nyata', 14, 'onSurfaceVariant')
            p.draw.line((48, 392, 368, 392), fill=C['surface'], width=20)
            p.draw.line((198, 344, 198, 470), fill=C['surface'], width=16)
            p.paste(ASSETS/'icons/exports/map-worker-selected@2x.png', 100, 350, 48, 56)
            p.paste(ASSETS/'icons/exports/map-worker-default@2x.png', 290, 404, 48, 56)
            p.text(24, 524, 'Pekerja contoh', 25, bold=True)
            p.text(24, 568, 'Pekerja · siap menerima pekerjaan', 16, 'onSurfaceVariant')
            p.text(24, 600, 'Lokasi perkiraan', 16, 'onSurfaceVariant')
            p.text(24, 652, 'Layanan yang ditawarkan', 18, bold=True)
            xx = 24
            for label in ('Menyapu', 'Mengepel', 'Dapur'):
                xx += p.tag(xx, 690, label, size=16)
            p.button(24, 766, 392, 'Hubungi', height=56, size=18)
            p.text(24, 850, 'Lihat detail', 18, 'actionText', True)
            p.paragraph(24, 900, 'Nomor tersedia setelah permintaan diterima. Melihat peta tidak mengaktifkan akunmu.', 376, 15)
        else:
            p.text(24, 28, 'Permintaan kontak', 28, 'primary', True)
            p.box(24, 94, 392, 44, 'primaryContainer', 10)
            p.text(40, 107, 'Permintaan masuk · simulasi', 16, 'primary')
            p.text(24, 174, 'Pemberi kerja contoh', 25, bold=True)
            p.text(24, 220, 'Butuh bantuan bersih-bersih', 18)
            p.tag(24, 260, 'Mengepel', True, 16)
            p.tag(126, 260, 'Kamar mandi', True, 16)
            p.box(24, 334, 392, 196, 'warmContainer', 24)
            p.text(44, 354, 'Bagikan nomor?', 22, 'onWarmContainer', True)
            p.paragraph(44, 400, 'Jika diterima, kalian dapat membuka WhatsApp dan melihat nomor satu sama lain. Nomor yang sudah disimpan tidak dapat ditarik kembali.', 346, 17, 'onWarmContainer')
            p.button(24, 574, 392, 'Terima dan bagikan nomor', height=64, size=18)
            p.button(24, 654, 392, 'Tolak', 'secondary', height=56, size=18)
            p.paragraph(24, 754, 'Persetujuan kontak tidak otomatis menyepakati pekerjaan atau membagikan alamat rumah.', 376, 17)
            p.paragraph(24, 868, 'Setelah disetujui, Buka WhatsApp tersedia sebagai tindakan manual. Pembayaran tunai di tempat.', 376, 16)
        frame = Board(448, 1008)
        frame.box(0, 0, 447, 1007, 'surface', 0, 'outlineVariant', 2)
        frame.im.paste(p.im, (4, 4))
        board.im.paste(frame.im, (x, 258))
    board.text(64, 1310, 'Dua peran dibedakan lewat teks, bentuk marker, dan warna. Pemberi kerja memakai tag emas muda.', 21)
    board.text(64, 1352, 'Navigasi, safe area, skala teks, izin, dan integrasi WhatsApp perlu diuji pada Android.', 21, 'onSurfaceVariant')
    board.save(ROOT/'screens-preview.png')


def brand():
    b = Board(1400, 1120)
    b.text(64, 44, 'Identitas Upahgo', 52, 'primary', True)
    b.text(64, 118, 'Logo pilihan pengguna · sumber raster dipertahankan', 23, 'onSurfaceVariant')
    b.paste(ASSETS/'brand/exports/upahgo-badge.png', 64, 206, 300)
    b.paste(ASSETS/'brand/exports/upahgo-lockup-light.png', 468, 222, 800)
    b.box(468, 454, 804, 200, 'primary', 24)
    b.paste(ASSETS/'brand/exports/upahgo-lockup-dark.png', 484, 460, 760)
    b.text(64, 558, 'Hijau #014C24', 24, 'primary', True)
    b.text(64, 600, 'Emas #E5C282', 24, 'onWarmContainer', True)
    b.text(64, 704, 'Ukuran dan turunan teknis', 30, bold=True)
    for x, size in ((64, 40), (152, 48), (256, 64), (376, 96)):
        b.paste(ASSETS/'brand/exports/upahgo-badge.png', x, 778+(96-size), size)
        b.text(x, 900, str(size)+' px', 18, 'onSurfaceVariant')
    for x, name, label in ((656, 'launcher-icon.png', 'Launcher'), (876, 'adaptive-foreground.png', 'Foreground'), (1096, 'adaptive-monochrome.png', 'Mask satu warna')):
        b.box(x, 770, 160, 160, 'primaryContainer', 20)
        b.paste(ASSETS/'brand/exports/android'/name, x+16, 786, 128)
        b.text(x, 948, label, 19)
    b.text(64, 1016, 'Clear space 0,25 × tinggi badge · wordmark pendamping masih usulan · bukan master vektor', 21)
    b.text(64, 1060, 'Ukuran kecil dan mask Android perlu uji perangkat; contoh piksel bukan hasil uji pengenalan.', 21, 'onSurfaceVariant')
    b.save(ASSETS/'previews/brand.png')


def icon_boards(node):
    b = Board(1280, 1040)
    b.text(48, 32, 'Ikon fungsi Upahgo', 42, 'primary', True)
    b.text(48, 100, '36 Material Symbols Rounded · 24 / 400 · currentColor · Apache-2.0', 22, 'onSurfaceVariant')
    catalog = json.loads((ASSETS/'catalog.json').read_text())
    js = "const s=require('sharp');const fs=require('fs');const [src,out]=process.argv.slice(1);s(Buffer.from(fs.readFileSync(src,'utf8').replace(/currentColor/g,'#014C24'))).resize(48,48).png().toFile(out).catch(e=>{console.error(e.message);process.exit(1)});"
    with tempfile.TemporaryDirectory() as tmp:
        for i, entry in enumerate(e for e in catalog['assets'] if e['kind'] == 'ui-icon'):
            png = Path(tmp)/f'{i}.png'
            subprocess.run([node, '-e', js, str(ASSETS/entry['export']), str(png)], check=True)
            x, y = 48+(i%6)*204, 170+(i//6)*134
            b.paste(png, x+64, y, 48)
            b.text(x, y+62, entry['glyph'], 17, max_width=190)
    b.text(48, 1002, 'Ikon bukan bukti verifikasi. Label/semantik dan adapter SVG native tetap diperlukan.', 20, 'onSurfaceVariant')
    b.save(ASSETS/'previews/ui-icons-v01.png')
    m = Board(1200, 600)
    m.text(48, 32, 'Marker dua peran', 42, 'primary', True)
    m.text(48, 100, 'Lokasi perkiraan · label dan alternatif daftar wajib · tanpa pulse', 23, 'onSurfaceVariant')
    for i, (role, state, label) in enumerate([('worker', 'default', 'Pekerja'), ('worker', 'selected', 'Pekerja dipilih'), ('employer', 'default', 'Pemberi kerja'), ('employer', 'selected', 'Pemberi kerja dipilih')]):
        x = 48+i*288
        m.paste(ASSETS/f'icons/exports/map-{role}-{state}@3x.png', x+48, 210, 96, 112)
        m.text(x, 366, label, 23, bold=True, max_width=280)
        m.text(x, 410, 'person · membulat' if role == 'worker' else 'work · kotak lembut', 20, 'onSurfaceVariant')
    m.text(48, 512, 'ViewBox 48 × 56 · 1x/2x/3x · anchor (0.5, 1) kandidat SDK', 22)
    m.text(48, 554, 'Ketebalan outline membedakan pilihan. Kontras basemap/clipping belum diuji.', 21, 'onSurfaceVariant')
    m.save(ASSETS/'previews/map-markers-v01.png')


def render_preview(tokens=None, regular_path=None, bold_path=None, node='node'):
    foundations()
    screens()
    brand()
    icon_boards(node)
    path = ASSETS/'catalog.json'
    catalog = json.loads(path.read_text())
    catalog['previews'] = []
    for p in sorted((ASSETS/'previews').glob('*.png')):
        with Image.open(p) as image:
            catalog['previews'].append({'path': str(p.relative_to(ASSETS)),
                                        'sha256': hashlib.sha256(p.read_bytes()).hexdigest(),
                                        'width': image.width, 'height': image.height, 'bytes': p.stat().st_size})
    path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2)+'\n')
    print('Rendered two design boards and three asset boards; refreshed preview hashes.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default='node')
    render_preview(node=parser.parse_args().node)
