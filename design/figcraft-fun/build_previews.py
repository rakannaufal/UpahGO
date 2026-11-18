"""Assemble exported frames into review sheets using Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
font = ImageFont.truetype(str(ROOT.parents[1] / 'assets/brand/source/Roboto-variable.ttf'), 18)
canvas = Image.new('RGB', (1768, 1004), '#E7EEE9')
draw = ImageDraw.Draw(canvas)
for i, (page, key, label) in enumerate([(1, 'login', 'Masuk'), (1, 'role', 'Pilih peran'),
                                       (2, 'home_employer', 'Beranda'), (2, 'map_spread', 'Pin di lokasi sama')]):
    file = next((ROOT / 'previews' / str(page)).glob(f'{key} · *.png'))
    canvas.paste(Image.open(file).convert('RGB'), (24 + i * 438, 72))
    draw.text((24 + i * 438, 30), label, font=font, fill='#20352B')
canvas.save(ROOT / 'overview.png')
for page in range(1, 7):
    files = sorted((ROOT / 'previews' / str(page)).glob('*.png'))
    sheet = Image.new('RGB', (1124, ((len(files) + 3) // 4) * 590 + 24), '#E7EEE9')
    draw = ImageDraw.Draw(sheet)
    for i, file in enumerate(files):
        x, y = 24 + (i % 4) * 275, 24 + (i // 4) * 590
        draw.text((x, y), file.name.split(' · ')[0], font=font, fill='#20352B')
        image = Image.open(file).convert('RGB')
        image.thumbnail((247, 535))
        sheet.paste(image, (x, y + 30))
    sheet.save(ROOT / f'contact-{page}.png')
assert len(list((ROOT / 'previews').rglob('*.png'))) == 79
print('79 frames; 6 contact sheets; 1 overview')
