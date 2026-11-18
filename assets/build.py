"""Rebuild technical derivatives of the selected raster logo and map markers.

Requires local Pillow, numpy and Node with sharp. No downloads or generation API.
Original supplied pixels are preserved in source/. No application source is edited.
"""

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
TOKENS = json.loads((ROOT.parent / 'design/tokens.json').read_text())
C = TOKENS['color']
FONT = ROOT / 'brand/source/Roboto-variable.ttf'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def png_record(path, opaque=None):
    with Image.open(path) as im:
        record = {'path': str(path.relative_to(ROOT)), 'sha256': digest(path),
                  'width': im.width, 'height': im.height, 'bytes': path.stat().st_size}
    if opaque is not None:
        record['opaque'] = opaque
    return record


def save(im, relative):
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, optimize=True)
    return png_record(path, im.convert('RGBA').getchannel('A').getextrema() == (255, 255))


def selected_logo():
    source = ROOT / 'brand/source/upahgo-logo-approved.png'
    with Image.open(source) as im:
        assert im.size == (1254, 1254), 'Review crop before using a different source'
        # This box belongs to the supplied image, not an inferred vector master.
        crop = im.convert('RGB').crop((154, 154, 1100, 1100))
    rgb = np.asarray(crop).astype(float)
    green = np.array([1, 76, 36])
    alpha = np.maximum((rgb[:, :, 0] - 1) / 228, (rgb[:, :, 2] - 36) / 219)
    alpha = np.clip(alpha, 0, 1)
    alpha[alpha < .08] = 0
    alpha[alpha > .94] = 1
    # Detach from numpy's read-only buffer before Pillow's in-place flood fill.
    bright = Image.fromarray(np.uint8(alpha > 0) * 255).copy()
    for xy in ((0, 0), (945, 0), (0, 945), (945, 945)):
        if bright.getpixel(xy) == 255:
            ImageDraw.floodfill(bright, xy, 128)
    exterior = np.asarray(bright) == 128
    assert exterior[0, 0] and exterior[945, 945], 'Outer white margin was not removed'
    alpha[exterior] = 0
    foreground = np.clip((rgb - green * (1 - alpha[:, :, None])) /
                         np.maximum(alpha[:, :, None], .001), 0, 255)
    rgba = np.dstack((foreground, alpha * 255)).astype('uint8')
    emblem = Image.fromarray(rgba).crop(Image.fromarray(rgba).getbbox())
    assert emblem.width > 750 and emblem.height > 750
    assert emblem.getchannel('A').getextrema() == (0, 255)
    assert np.count_nonzero((rgba[:, :, 0] > 180) & (rgba[:, :, 1] > 140) &
                            (rgba[:, :, 2] < 170) & (rgba[:, :, 3] == 255)) > 40000
    badge = crop.convert('RGBA')
    badge_alpha = np.full(alpha.shape, 255, dtype='uint8')
    badge_alpha[exterior] = 0
    badge.putalpha(Image.fromarray(badge_alpha))
    assert badge.getpixel((0, 0))[3] == 0
    records = [save(badge.resize((1024, 1024), Image.Resampling.LANCZOS),
                    'brand/exports/upahgo-badge.png')]

    def canvas(size, max_edge, background=None, safe_radius=None):
        target = Image.new('RGBA', (size, size), background or (0, 0, 0, 0))
        scale = max_edge / max(emblem.size)
        if safe_radius:
            yy, xx = np.where(np.asarray(emblem.getchannel('A')) > 0)
            radius = np.max(np.hypot(xx-(emblem.width-1)/2, yy-(emblem.height-1)/2))
            scale = min(scale, safe_radius / radius)
        mark = emblem.resize((round(emblem.width*scale), round(emblem.height*scale)), Image.Resampling.LANCZOS)
        target.alpha_composite(mark, ((size-mark.width)//2, (size-mark.height)//2))
        return target

    records.append(save(canvas(1024, 800), 'brand/exports/upahgo-emblem.png'))
    for dark in (False, True):
        lockup = Image.new('RGBA', (1000, 256), (0, 0, 0, 0))
        lockup.alpha_composite(badge.resize((192, 192), Image.Resampling.LANCZOS), (32, 32))
        font = ImageFont.truetype(str(FONT), 144)
        font.set_variation_by_name('Bold')
        ImageDraw.Draw(lockup).text((264, 126), 'Upahgo', font=font,
                                   fill=C['onInverseSurface' if dark else 'primary'], anchor='lm')
        records.append(save(lockup, f'brand/exports/upahgo-lockup-{"dark" if dark else "light"}.png'))
    native = 'brand/exports/android/'
    records.append(save(canvas(1024, 800, C['primary']), native+'launcher-icon.png'))
    foreground_canvas = canvas(1024, 560, safe_radius=300)
    # Geometric containment self-check; device masks still require native tests.
    a = np.asarray(foreground_canvas.getchannel('A'))
    yy, xx = np.where(a > 0)
    assert np.max(np.hypot(xx-511.5, yy-511.5)) <= 313
    records.append(save(foreground_canvas, native+'adaptive-foreground.png'))
    records.append(save(Image.new('RGB', (1024, 1024), C['primary']), native+'adaptive-background.png'))
    mono = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    mono.putalpha(foreground_canvas.getchannel('A'))
    records.append(save(mono, native+'adaptive-monochrome.png'))
    records.append(save(canvas(512, 400, C['primary']), native+'play-store-icon.png'))
    records.append(save(foreground_canvas, native+'splash-mark.png'))
    return {'id': 'BR-01', 'kind': 'brand-logo', 'status': 'user-selected-raster',
            'source': str(source.relative_to(ROOT)), 'sha256': digest(source),
            'source_png': png_record(source, True), 'png_derivatives': records,
            'method': 'Original PNG retained byte-for-byte; crop/chroma matte/resize only. No vector tracing or external generation.',
            'rights': 'User supplied; upstream authorship/license not provided.',
            'note': 'Wordmark/lockups are companion proposals. Android exports are technical candidates, not device-approved.'}


def markers(node):
    namespace = {'s': 'http://www.w3.org/2000/svg'}
    shapes = {
        'worker': 'M24 3C12.4 3 3 12.4 3 24C3 33 9.8 39.8 16 45L24 53L32 45C38.2 39.8 45 33 45 24C45 12.4 35.6 3 24 3Z',
        'employer': 'M13 3H35Q45 3 45 13V31Q45 37 39 40L24 53L9 40Q3 37 3 31V13Q3 3 13 3Z'}
    records = []
    js = "const sharp=require('sharp'); const [src,out,w,h]=process.argv.slice(1); sharp(src).resize(+w,+h).png().toFile(out).catch(e=>{console.error(e.message);process.exit(1)});"
    for index, role in enumerate(shapes, 1):
        glyph = 'person' if role == 'worker' else 'work'
        paths = ET.parse(ROOT/f'icons/source/material-rounded/{glyph}.svg').findall('s:path', namespace)
        glyph_paths = ''.join(f'<path d="{p.attrib["d"]}"/>' for p in paths)
        variants, derivatives = [], []
        for state in ('default', 'selected'):
            path = ROOT / f'icons/source/markers/{role}-{state}.svg'
            fill = C['primaryContainer' if role == 'worker' else 'brandGold']
            svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56"><title>Upahgo {role} marker, {state}</title><desc>Approximate area; role requires an accessible text label.</desc><path d="{shapes[role]}" fill="{fill}" stroke="{C["primary"]}" stroke-width="{3.5 if state == "selected" else 2}" stroke-linejoin="round"/><g fill="{C["primary"]}" transform="translate(12 35) scale(0.025)">{glyph_paths}</g></svg>\n'
            path.write_text(svg)
            variants.append({'path': str(path.relative_to(ROOT)), 'sha256': digest(path)})
            for scale in (1, 2, 3):
                output = ROOT/f'icons/exports/map-{role}-{state}{"@"+str(scale)+"x" if scale > 1 else ""}.png'
                subprocess.run([node, '-e', js, str(path), str(output), str(48*scale), str(56*scale)], check=True)
                derivatives.append(png_record(output, False))
        records.append({'id': f'MP-0{index}', 'kind': 'map-marker', 'status': 'design-proposal',
                        'source_variants': variants, 'png_derivatives': derivatives,
                        'license': 'Glyph Apache-2.0; custom marker composition',
                        'license_file': 'licenses/material-symbols-LICENSE.txt'})
    return records


def update_catalog(logo, marker_records):
    path = ROOT / 'catalog.json'
    catalog = json.loads(path.read_text())
    retained = [entry for entry in catalog['assets'] if entry['kind'] in
                ('ui-icon', 'font-source', 'wordmark-candidate')]
    for entry in retained:
        if entry['kind'] == 'wordmark-candidate':
            entry.update(sha256=digest(ROOT/entry['source']), status='companion-proposal')
        if entry['kind'] == 'font-source':
            entry['usage'] = 'Local review typography and companion wordmark, not automatically bundled.'
    catalog.update(version=4, token_version=TOKENS['meta']['version'],
                   scope='User-selected worker/cap/gold-apron/orbit raster logo; synchronized green/gold design system.',
                   updated_at=datetime.now(timezone.utc).isoformat(),
                   assets=retained+[logo]+marker_records)
    catalog['previews'] = [png_record(p) for p in sorted((ROOT/'previews').glob('*.png'))]
    path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2)+'\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default='node', help='Local Node runtime with sharp available')
    args = parser.parse_args()
    logo = selected_logo()
    update_catalog(logo, markers(args.node))
    print('Rebuilt selected logo, native candidates, four marker SVGs, twelve marker PNGs and catalog.')
