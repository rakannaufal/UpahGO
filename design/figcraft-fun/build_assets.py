"""Project-local editable icon assets. No external generation service."""
import json
import pathlib
import subprocess
import xml.etree.ElementTree as ET

OUT = pathlib.Path(__file__).resolve().parent / "assets"
OLD = OUT.parent.parent / "figcraft" / "assets"
OUT.mkdir(exist_ok=True)
ICONS = {
    "home": 'M4 10 12 3 20 10V20H15V14H9V20H4Z',
    "location_on": 'M20 10C20 16 12 22 12 22S4 16 4 10A8 8 0 1 1 20 10ZM15 10A3 3 0 1 1 9 10A3 3 0 1 1 15 10',
    "search": 'M16.5 10A6.5 6.5 0 1 1 3.5 10A6.5 6.5 0 1 1 16.5 10M15 15 21 21',
    "arrow_back": 'M14 5 7 12 14 19M7 12H21',
    "chevron_right": 'M9 5 16 12 9 19',
    "check": 'M5 12 10 17 20 6',
    "person": 'M16 7A4 4 0 1 1 8 7A4 4 0 1 1 16 7M4 21V18C4 12 20 12 20 18V21Z',
    "person_add": 'M13 7A4 4 0 1 1 5 7A4 4 0 1 1 13 7M2 21V18C2 12 16 12 16 18V21ZM19 8V14M16 11H22',
    "description": 'M6 3H14L20 9V21H4V5Q4 3 6 3ZM14 3V9H20M8 13H16M8 17H14',
    "notifications": 'M5 16V10C5 1 19 1 19 10V16L21 18H3ZM9 21H15',
    "map": 'M3 5 9 3 15 5 21 3V19L15 21 9 19 3 21ZM9 3V19M15 5V21',
    "info": 'M22 12A10 10 0 1 1 2 12A10 10 0 1 1 22 12M12 11V17M12 7V7.1',
    "help_outline": 'M22 12A10 10 0 1 1 2 12A10 10 0 1 1 22 12M9 8C9 4 16 4 16 8C16 11 12 10 12 13M12 17V17.1',
    "error_outline": 'M22 12A10 10 0 1 1 2 12A10 10 0 1 1 22 12M12 6V13M12 17V17.1',
    "warning_amber": 'M12 3 22 21H2ZM12 9V14M12 18V18.1',
    "schedule": 'M22 12A10 10 0 1 1 2 12A10 10 0 1 1 22 12M12 6V12L16 15',
    "event": 'M5 5H19Q21 5 21 7V19Q21 21 19 21H5Q3 21 3 19V7Q3 5 5 5ZM7 2V8M17 2V8M3 11H21M8 15H9M14 15H15',
    "edit": 'M4 15 16 3Q18 1 21 4Q23 6 21 8L9 20 3 21ZM14 5 19 10',
    "work": 'M8 7V3H16V7M3 7H21V20H3ZM3 12Q12 18 21 12M12 13V17',
    "payments": 'M2 6H22V19H2ZM15 12.5A3 3 0 1 1 9 12.5A3 3 0 1 1 15 12.5M5 9H6M18 16H19',
    "open_in_new": 'M14 3H21V10M21 3 11 13M10 4H4V20H20V14',
    "hourglass_empty": 'M5 3H19M5 21H19M7 3V7L12 12 7 17V21M17 3V7L12 12 17 17V21',
    "report": 'M12 3 21 6V13C21 18 12 22 12 22S3 18 3 13V6ZM12 8V13M12 17V17.1',
    "cleaning_services": 'M18 3 10 13M6 12 15 18 11 22 2 16ZM5 17 7 14M8 19 10 16',
    "mop": 'M16 2 10 15M6 14H15L19 22H2ZM7 17 5 22M11 17V22M14 17 16 22',
    "countertops": 'M3 12H21V21H3ZM2 12H22M7 12V7Q7 3 11 3Q15 3 15 7M13 7H17M8 16V18M16 16V18',
    "bathtub": 'M2 12H22L20 19H4ZM5 12V5Q5 1 9 3L11 5M5 22V19M19 22V19M11 5 8 8',
    "window": 'M3 3H21V21H3ZM12 3V21M3 12H21M6 7 8 5M15 18 18 15',
    "inventory_2": 'M3 7 12 3 21 7V20H3ZM3 7H21M9 7V12H15V7',
}

def svg(body, size=64, viewbox=64):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {viewbox} {viewbox}">{body}</svg>'

def line(name, color="#25382E", size=24):
    return svg(f'<path d="{ICONS[name]}" fill="none" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', size, 24)

# Color belongs to the object, rather than a repeated container around it.
SERVICES = {
 "cleaning_services": '<path d="M46 8 27 35" stroke="#995A32" stroke-width="8" stroke-linecap="round"/><path d="M20 29 42 44 31 58 7 42Z" fill="#F8C650"/><path d="M20 29 42 44 38 49 16 34Z" fill="#E68D27"/><path d="M16 43 24 34M23 48 31 39M30 53 38 44" stroke="#CE7B25" stroke-width="2.5" stroke-linecap="round"/>',
 "mop": '<path d="M42 6 29 39" stroke="#147AAB" stroke-width="7" stroke-linecap="round"/><path d="M20 34H38L50 57H8Z" fill="#65C3E5"/><path d="M22 42 18 56M29 42V57M36 42 42 56" stroke="#248CB6" stroke-width="3" stroke-linecap="round"/><rect x="19" y="31" width="21" height="8" rx="4" fill="#087F52"/>',
 "countertops": '<rect x="6" y="28" width="52" height="29" rx="7" fill="#F5A978"/><rect x="3" y="25" width="58" height="7" rx="3.5" fill="#C87246"/><path d="M24 26V16C24 4 42 4 42 16" fill="none" stroke="#2185A8" stroke-width="6" stroke-linecap="round"/><path d="M37 17H48" stroke="#2185A8" stroke-width="5" stroke-linecap="round"/><path d="M32 35V55M19 39V46M45 39V46" stroke="#AC613B" stroke-width="3" stroke-linecap="round"/>',
 "bathtub": '<path d="M9 31V17C9 4 26 4 26 17" fill="none" stroke="#217DA0" stroke-width="6" stroke-linecap="round"/><rect x="4" y="29" width="56" height="8" rx="4" fill="#4CBACD"/><path d="M8 35H56L51 53Q32 61 13 53Z" fill="#8CD8E4"/><path d="M17 56V60M47 56V60" stroke="#217DA0" stroke-width="4" stroke-linecap="round"/><circle cx="40" cy="18" r="6" fill="#C9EFF4"/><circle cx="51" cy="24" r="4" fill="#C9EFF4"/>',
 "window": '<rect x="7" y="6" width="50" height="52" rx="9" fill="#86C5ED"/><path d="M32 9V55M10 32H54" stroke="#316DAB" stroke-width="5"/><path d="M16 21 23 14M41 48 49 40" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>',
 "inventory_2": '<path d="M6 19 32 7 58 19V54Q32 63 6 54Z" fill="#E8A45D"/><path d="M6 19 32 31 58 19M32 31V59" fill="none" stroke="#AF6E35" stroke-width="3"/><path d="M24 11 47 24 47 35 39 39V28L17 15Z" fill="#FAD6A0"/>',
 "location_on": '<path d="M8 18 25 12 42 18 58 12V49L42 55 25 49 8 55Z" fill="#80D4C7"/><path d="M25 15V49M42 20V55" stroke="#298E77" stroke-width="3"/><path d="M48 19C48 29 36 38 36 38S24 29 24 19A12 12 0 1 1 48 19Z" fill="#087F52"/><circle cx="36" cy="19" r="4" fill="#FFFFFF"/>',
 "payments": '<rect x="5" y="19" width="51" height="34" rx="8" fill="#087F52"/><rect x="11" y="11" width="50" height="34" rx="8" fill="#75CDA4"/><circle cx="36" cy="28" r="10" fill="#DEF3D5"/><path d="M36 21V35M40 24C31 19 30 28 36 28C43 28 41 37 32 32" fill="none" stroke="#227957" stroke-width="2.5" stroke-linecap="round"/>',
 "description": '<rect x="12" y="9" width="42" height="51" rx="9" fill="#A3C4F4"/><rect x="8" y="5" width="42" height="49" rx="9" fill="#E1ECFF"/><path d="M18 18H39M18 26H36M18 34H30" stroke="#5286C4" stroke-width="4" stroke-linecap="round"/><circle cx="48" cy="46" r="13" fill="#087F52"/><path d="M42 46 46 50 54 41" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
 "person_add": '<path d="M7 14Q7 5 16 5H48Q57 5 57 14V35Q57 44 48 44H29L16 55V44Q7 44 7 35Z" fill="#B5A5E8"/><path d="M18 19H46M18 28H37" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/><circle cx="48" cy="46" r="12" fill="#087F52"/><path d="M48 40V52M42 46H54" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>',
 "work": '<rect x="6" y="21" width="52" height="35" rx="9" fill="#ECAF49"/><path d="M22 20V11H42V20" fill="none" stroke="#AD7429" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 31Q32 45 56 31" fill="none" stroke="#BF812B" stroke-width="3"/><rect x="28" y="31" width="8" height="13" rx="3" fill="#FFF0C2"/>',
 "help_outline": '<path d="M7 28A25 25 0 1 1 46 49L29 59 29 53A25 25 0 0 1 7 28Z" fill="#E1B4DA"/><path d="M25 23C25 12 43 12 43 23C43 30 33 29 33 36M33 43V43.1" fill="none" stroke="#885583" stroke-width="5" stroke-linecap="round"/>',
 "home": '<path d="M7 29 32 7 57 29V54Q57 58 53 58H11Q7 58 7 54Z" fill="#F7C173"/><path d="M4 29 32 5 60 29" fill="none" stroke="#C87742" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><rect x="26" y="35" width="14" height="23" rx="4" fill="#087F52"/><rect x="13" y="34" width="8" height="10" rx="2" fill="#FFF5D7"/>',
}

def service(name, size=64):
    return svg(SERVICES[name], size)

def build():
    for name in ICONS:
        (OUT / f"icon-{name}.svg").write_text(line(name))
    for name in SERVICES:
        file = OUT / f"service-{name}.svg"
        file.write_text(service(name))
        subprocess.run(["rsvg-convert", "-w", "256", "-h", "256", "-o", str(file.with_suffix('.png')), str(file)], check=True)
    # Existing licensed illustrations; green accents, natural skin on identity samples.
    for source, target in [("job-hunt.svg", "job-hunt"), ("hiring.svg", "hiring")]:
        content = (OLD / source).read_text().replace('#6c63ff', '#087F52').replace('#6C63FF', '#087F52')
        if target == 'hiring':
            root = ET.fromstring(content)
            for index, el in enumerate(root.iter()):
                if el.attrib.get('fill') == '#087F52' and (el.tag.endswith('circle') or index == 26):
                    el.set('fill', '#C68D6F')
            content = ET.tostring(root, encoding='unicode')
        (OUT / f"{target}-upahgo.svg").write_text(content)
        subprocess.run(['rsvg-convert', '-w', '1200', '-o', str(OUT / f'{target}.png'), str(OUT / f'{target}-upahgo.svg')], check=True)
    # High resolution crops from SVG, not upscaled thumbnails. Illustrative identities only.
    source = ET.fromstring((OUT / 'hiring-upahgo.svg').read_text())
    for i, viewbox in enumerate(['35 140 110 120', '416 46 112 112', '241 216 112 112']):
        source.set('viewBox', viewbox)
        source.set('width', '256'); source.set('height', '256')
        file = OUT / f'avatar-{i}.svg'
        file.write_text(ET.tostring(source, encoding='unicode'))
        subprocess.run(['rsvg-convert', '-w', '512', '-h', '512', '-o', str(file.with_suffix('.png')), str(file)], check=True)
    provenance = json.loads((OLD / 'SOURCES.json').read_text())
    provenance['usage'] = 'Two licensed illustrations for role selection; natural skin recolor and vector-resolution identity crops. Original project icons authored in build_assets.py. No Gojek artwork copied.'
    provenance['customIcons'] = {'author': 'Original UpahGo project artwork', 'outline': len(ICONS), 'multicolor': len(SERVICES), 'source': 'build_assets.py'}
    provenance['visualReference'] = ['https://www.gojek.com/id-id', 'https://apps.apple.com/id/app/gojek/id944875099']
    (OUT / 'SOURCES.json').write_text(json.dumps(provenance, indent=2))
    print(f'{len(ICONS)} outline icons; {len(SERVICES)} color service icons; 2 role illustrations; 3 identity samples')

if __name__ == '__main__':
    build()
