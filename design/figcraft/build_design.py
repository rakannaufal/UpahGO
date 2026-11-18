"""Author the UpahGo review canvas through FigCraft's documented command API.

This is a design artifact generator. It does not change application code or tokens.
"""
import json
import math
import pathlib
import re
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = pathlib.Path(__file__).resolve().parent
ASSETS = OUT / "assets"
W, H = 412, 892
PALETTE = {
    "Canvas": "#F5F1EA", "Surface": "#FEFBF6", "Focus": "#C14033",
    "Sky": "#C6D8ED", "Lime": "#D8E46E", "Text": "#24211D",
    "Muted": "#625B52", "Outline": "#887F73", "Divider": "#DED7CE",
    "BrandGreen": "#014C24", "BrandGold": "#E5C282", "White": "#FFFFFF",
    "Success": "#205C40", "SuccessSurface": "#E5EEDC",
    "Error": "#A52A25", "ErrorSurface": "#FBE5DF", "BlueText": "#264C70",
    "Disabled": "#E4DFD7", "Map": "#E9ECE1",
}
commands, screens, links, pages, aliases = [], {}, [], [], set()
counter = 0


def ref(name):
    return {"$ref": name}


def cmd(command, params=None, name=None):
    global counter
    counter += 1
    name = name or f"n{counter}"
    assert name not in aliases, name
    aliases.add(name)
    commands.append({"command": command, "params": params or {}, "as": name})
    return name


def color(value):
    return {"$var": value} if value in PALETTE else value


def shape(parent, x, y, width, height, fill="Surface", radius=0, stroke=None, name=None, kind="rectangle", **extra):
    props = {"fill": color(fill), "cornerRadius": radius, **extra}
    if stroke:
        props.update(stroke=color(stroke), strokeWeight=1.25)
    return cmd("node.create", {"type": kind, "parent": ref(parent), "x": x, "y": y,
                              "width": width, "height": height, "name": name or kind,
                              "props": props, "select": False})


def text(parent, value, x, y, width=372, size=16, weight=400, fill="Text", line=None, align="left", name=None):
    assert "—" not in value
    return cmd("text.create", {"text": value, "x": x, "y": y, "width": width,
                               "parent": ref(parent), "name": name or value[:55], "select": False,
                               "props": {"fontFamily": "Roboto", "fontStyle": "Regular",
                                         "fontVariations": {"wght": weight}, "fontSize": size,
                                         "lineHeight": line or round(size * 1.35), "fill": color(fill),
                                         "textAutoResize": "height", "textAlign": align}})


def image(parent, filename, x, y, width, height, name="Illustration", fit="fit"):
    path = pathlib.Path(filename)
    if not path.is_absolute():
        path = ASSETS / filename
    assert path.is_file(), path
    return cmd("image.place", {"path": str(path), "x": x, "y": y, "width": width,
                               "height": height, "parent": ref(parent), "mode": fit, "name": name})


def icon(parent, name, x, y, size=24, fill="Text"):
    path = ROOT / "assets/icons/exports" / f"ui-{name}.svg"
    if not path.exists():
        path = ROOT / "assets/icons/exports/ui-help_outline.svg"
    root = ET.parse(path).getroot()
    paths = [el.attrib["d"] for el in root.iter() if "d" in el.attrib]
    node = cmd("vector.create", {"path": " ".join(paths), "parent": ref(parent),
                                 "width": size, "height": size, "name": f"Icon/{name}",
                                 "props": {"fill": color(fill)}, "select": False})
    cmd("node.set", {"ids": [ref(node)], "x": x, "y": y})
    return node


def connect(node, target=None, action="navigate"):
    links.append((node, target, action))


def button(parent, label, y, target=None, x=20, width=372, variant="primary", height=56, ico=None):
    fills = {"primary": "Focus", "secondary": "Surface", "tonal": "Sky", "quiet": "Canvas", "disabled": "Disabled", "danger": "Error"}
    foreground = "White" if variant in ("primary", "danger") else "Text"
    frame = shape(parent, x, y, width, height, fills[variant], 18,
                  stroke="Outline" if variant == "secondary" else None, name=f"Button/{label}", kind="frame")
    if ico:
        icon(frame, ico, 16, (height - 22) / 2, 22, foreground)
    text(frame, label, 14 if not ico else 42, (height - 22) / 2, width - (28 if not ico else 56), 16, 650, foreground, 22, "center")
    if target:
        connect(frame, target)
    return frame


def chip(parent, label, x, y, width, selected=False, fill=None, target=None):
    frame = shape(parent, x, y, width, 48, fill or ("Lime" if selected else "Surface"), 12,
                  stroke="Text" if selected else "Outline", name=f"Chip/{label}", kind="frame")
    text(frame, label, 8, 14, width - 16, 14, 550, line=20, align="center")
    if target:
        connect(frame, target)
    return frame


def field(parent, label, value, y, width=372, x=20, error=None, multiline=False, ico=None):
    text(parent, label, x, y, width, 14, 550, line=20)
    box = shape(parent, x, y + 28, width, 88 if multiline else 56, "Surface", 14,
                stroke="Error" if error else "Outline", name=f"Field/{label}", kind="frame")
    if ico:
        icon(box, ico, 16, 17, 22, "Muted")
    text(box, value, 16 if not ico else 48, 16, width - (32 if not ico else 64), 16, 400,
         "Muted" if not value or value.startswith("Pilih") else "Text", 23)
    if error:
        text(parent, error, x, y + (124 if multiline else 92), width, 13, 400, "Error", 19)
    return box


def note(parent, title, body, y, fill="Sky", height=108, ico="info"):
    box = shape(parent, 20, y, 372, height, fill, 20, name=f"Notice/{title}", kind="frame")
    icon(box, ico, 16, 18, 22, "Error" if fill == "ErrorSurface" else "Text")
    text(box, title, 50, 15, 302, 16, 650, line=23)
    text(box, body, 50, 43, 302, 14, 400, line=21)
    return box


def small_tag(parent, label, x, y, width, fill="Sky"):
    shape(parent, x, y, width, 28, fill, 8)
    text(parent, label, x + 8, y + 5, width - 16, 12, 500, line=18)


def avatar(parent, x, y, size=48, kind="worker", index=0):
    frame = shape(parent, x, y, size, size, "Sky" if kind == "worker" else "Lime", size / 2,
                  name="Identity/illustrative avatar", kind="frame", clip=True)
    avatar_path = ASSETS / f"avatar-{index % 3}.png"
    if avatar_path.exists():
        image(frame, avatar_path, 0, 0, size, size, "Illustrated avatar, not a real user photo", "fill")
    else:
        icon(frame, "person" if kind == "worker" else "home", size * .25, size * .25, size * .5)
    return frame


def pin(parent, x, y, kind="worker", index=0, target="map_selected", count=None):
    frame = shape(parent, x, y, 54, 66, "Canvas", 0, name="Map pin/approximate location", kind="frame")
    cmd("node.set", {"ids": [ref(frame)], "fill": "none"})
    tip = cmd("vector.create", {"path": "M0 0 L20 0 L10 16 Z", "parent": ref(frame),
                                "name": "Pin point", "props": {"fill": color("Focus" if kind == "worker" else "BrandGreen")}})
    cmd("node.set", {"ids": [ref(tip)], "x": 17, "y": 45})
    shape(frame, 0, 0, 54, 54, "Focus" if kind == "worker" else "BrandGreen", 27)
    if count:
        text(frame, str(count), 0, 14, 54, 21, 700, "White", 28, "center")
    else:
        avatar(frame, 4, 4, 46, kind, index)
    connect(frame, target)
    return frame


def nav(parent, active):
    bar = shape(parent, 0, 800, W, 68, "Surface", name="Navigation bar", kind="frame")
    items = [("Beranda", "home", "home_worker"), ("Temukan", "location_on", "map_worker"),
             ("Aktivitas", "description", "activity_contacts"), ("Notifikasi", "notifications", "notifications"),
             ("Akun", "person", "account")]
    for i, (label, glyph, target) in enumerate(items):
        tab = shape(bar, 6 + i * 80, 2, 80, 64, "Surface", name=f"Tab/{label}", kind="frame")
        if label == active:
            shape(tab, 15, 4, 50, 30, "ErrorSurface", 15)
        icon(tab, glyph, 29, 8, 22, "Focus" if label == active else "Muted")
        text(tab, label, 1, 41, 78, 11, 650 if label == active else 450,
             "Focus" if label == active else "Muted", 16, "center")
        connect(tab, target)


def page(name):
    p = cmd("page.add", {"name": name})
    pages.append({"name": name, "alias": p, "count": 0})
    cmd("page.setBackground", {"color": "#E8E3DC"})
    return p


def screen(key, title, route, active=None, back=True, heading=None, subtitle=None, height=H):
    p = pages[-1]
    index = p["count"]
    p["count"] += 1
    x, y = (index % 4) * 500, (index // 4) * 1040 + 110
    text(p["alias"], title, x, y - 65, W, 22, 700, line=30)
    text(p["alias"], route, x, y - 29, W, 12, 400, "Muted", 18)
    frame = cmd("frame.create", {"x": x, "y": y, "width": W, "height": height,
                                 "name": f"{key} · {title}", "props": {"fill": color("Canvas"), "clip": True, "cornerRadius": 0},
                                 "select": False}, name=f"screen_{key}")
    screens[key] = {"alias": frame, "page": p["name"], "title": title, "route": route,
                    "x": x, "y": y, "width": W, "height": height}
    text(frame, "09:41", 20, 10, 60, 12, 600, line=17)
    text(frame, "Prototipe · data contoh", 210, 10, 182, 11, 400, "Muted", 17, "right")
    if back:
        bt = shape(frame, 8, 36, 48, 48, "Canvas", 24, name="Back", kind="frame")
        icon(bt, "arrow_back", 22 - 8, 50 - 36, 22)
        connect(bt, action="back")
        text(frame, title if len(title) < 27 else "UpahGo", 64, 48, 308, 18, 600, line=25)
    else:
        image(frame, ROOT / "assets/brand/exports/upahgo-badge.png", 20, 43, 34, 34, "Approved UpahGo logo")
        text(frame, "UpahGo", 64, 46, 200, 22, 750, line=30)
        account = shape(frame, 344, 37, 48, 48, "Surface", 18, name="Open account", kind="frame")
        icon(account, "person", 13, 12, 22)
        connect(account, "account")
    if heading:
        text(frame, heading, 20, 113, 372, 32, 750, line=38)
    if subtitle:
        text(frame, subtitle, 20, 162 if heading and "\n" not in heading else 200, 372, 15, 400, "Muted", 23)
    if active:
        text(frame, "Contoh desain. Bukan akun atau transaksi nyata.", 20, 778, 372, 10, 400, "Muted", 15)
        nav(frame, active)
    shape(frame, 165, height - 10, 82, 4, "Text", 2, name="Android gesture area")
    return frame


def intro_art(parent, kind, y=180):
    bg = "Sky" if kind == 0 else "Lime" if kind == 1 else "Focus"
    panel = shape(parent, 20, y, 372, 310, bg, 28, name="Onboarding visual", kind="frame", clip=True)
    if kind == 0:
        image(panel, "job-hunt.png", 36, 25, 300, 260, "Job discovery illustration")
    elif kind == 1:
        map_art(panel, 0, 0, 372, 310, with_controls=False)
        pin(panel, 65, 75, index=0)
        pin(panel, 228, 156, kind="employer", index=1)
    else:
        box = shape(panel, 35, 34, 302, 226, "Surface", 22, name="Agreement overview", kind="frame")
        for i, (glyph, a, b) in enumerate([("person_add", "Izin kontak", "Disetujui kedua pihak"),
                                         ("description", "Tugas dan upah", "Disepakati sebelum mulai"),
                                         ("payments", "Tunai di tempat", "Dikonfirmasi penerima")]):
            yy = 20 + i * 68
            icon(box, glyph, 20, yy + 7, 24, "BrandGreen")
            text(box, a, 60, yy, 226, 16, 650, line=22)
            text(box, b, 60, yy + 25, 226, 12, 400, "Muted", 18)


def map_art(parent, x=0, y=92, width=W, height=685, with_controls=True):
    panel = shape(parent, x, y, width, height, "Map", name="Map/labeled schematic, not geographic navigation", kind="frame", clip=True)
    # Tile endpoint returned a block notice. The design uses honest editable geometry.
    for xx, yy, ww, hh in [(25, 150, 88, 120), (245, 280, 120, 98), (50, 450, 120, 95)]:
        shape(panel, xx, yy, ww, hh, "#D6E3C8", 20, name="Schematic green space")
    for off in [80, 210, 340, 470, 600]:
        road = cmd("vector.create", {"path": f"M0 0 L{width*.36} 42 L{width*.7} 17 L{width} 60", "parent": ref(panel),
                  "name": "Schematic local road", "props": {"fill": "none", "stroke": "#FEFBF6", "strokeWeight": 14}, "select": False})
        cmd("node.set", {"ids": [ref(road)], "x": 0, "y": off})
    for off in [40, 178, 320]:
        road = cmd("vector.create", {"path": f"M62 0 L0 {height*.48} L42 {height}", "parent": ref(panel),
                  "name": "Schematic connecting road", "props": {"fill": "none", "stroke": "#FEFBF6", "strokeWeight": 11}, "select": False})
        cmd("node.set", {"ids": [ref(road)], "x": off, "y": 0})
    text(panel, "Area contoh", 24, height * .35, width - 48, 12, 500, "Muted", 18)
    if with_controls:
        shape(panel, 20, 17, width - 40, 58, "Surface", 18)
        icon(panel, "location_on", 36, 35, 21)
        text(panel, "Pekanbaru · radius 5 km", 70, 30, width - 110, 15, 650, line=22)
        text(panel, "Area perkiraan", 70, 52, width - 110, 11, 400, "Muted", 16)
        control = shape(panel, width - 68, 158, 48, 108, "Surface", 16, name="Map zoom", kind="frame")
        text(control, "+", 0, 8, 48, 28, 400, align="center", line=34)
        shape(control, 10, 54, 28, 1, "Divider")
        text(control, "−", 0, 62, 48, 28, 400, align="center", line=34)
        connect(control, "map_spread")
        text(panel, "Skema ilustratif, bukan peta navigasi", 14, height - 20, width - 28, 10, 400, "Muted", 14)
    elif height > 230:
        text(panel, "Skema ilustratif", 14, height - 22, width - 28, 11, 400, "Muted", 16)
    return panel


def person_card(parent, x, y, name, area, tag, kind="worker", index=0, target=None):
    box = shape(parent, x, y, 180, 226, "Surface", 22, name=f"PersonCard/{name}", kind="frame", clip=True)
    art = shape(box, 0, 0, 180, 98, "Sky" if kind == "worker" else "Lime", name="Task cover", kind="frame")
    icon(art, "cleaning_services" if index % 2 == 0 else "countertops", 66, 24, 49, "BlueText" if kind == "worker" else "BrandGreen")
    avatar(box, 12, 77, 40, kind, index)
    text(box, name, 12, 126, 156, 17, 700, line=23)
    text(box, area, 12, 153, 156, 12, 400, "Muted", 17)
    small_tag(box, tag, 12, 183, 156, "Sky" if kind == "worker" else "Lime")
    connect(box, target or ("person_worker" if kind == "worker" else "person_employer"))
    return box


def person_row(parent, name, detail, y, target=None, ico=None, kind="worker", status=None, row_height=80):
    row = shape(parent, 20, y, 372, 92 if status else row_height, "Surface", 20, name=f"Row/{name}", kind="frame")
    if ico:
        shape(row, 14, 16, 48, 48, "Sky", 16)
        icon(row, ico, 27, 29, 22)
    else:
        avatar(row, 14, 16, 48, kind)
    text(row, name, 76, 15, 252, 16, 650, line=22)
    text(row, detail, 76, 42, 252, 13, 400, "Muted", 19)
    icon(row, "chevron_right", 340, 29, 16, "Muted")
    if status:
        text(row, status, 76, 66, 270, 11, 550, "Focus", 16)
    if target:
        connect(row, target)
    return row


def summary(parent, y=190, state="Menunggu konfirmasi", fill="Sky", wage="Rp150.000"):
    panel = shape(parent, 20, y, 372, 248, fill, 26, name="Agreement summary", kind="frame")
    text(panel, "Bersih-bersih rumah", 20, 22, 332, 23, 700, line=30)
    text(panel, "Rumah Bu Rina · Sukajadi", 20, 61, 332, 14, 400, line=21)
    text(panel, wage, 20, 101, 332, 35, 750, line=44)
    text(panel, "Total upah · tunai di tempat", 20, 150, 332, 13, 400, line=20)
    shape(panel, 20, 185, 332, 1, "Outline")
    text(panel, state, 20, 203, 332, 14, 650, line=21)
    return panel


def init():
    cmd("file.rename", {"name": "UpahGo · Kestrel · Review desain"})
    cmd("page.list", name="initial_pages")
    cmd("text.loadFont", {"path": str(ROOT / "assets/brand/source/Roboto-variable.ttf")})
    collection = cmd("variable.createCollection", {"name": "Usulan UI Kestrel", "modes": ["Terang"]})
    for name, value in PALETTE.items():
        cmd("variable.create", {"collection": ref(collection), "name": name, "type": "color", "value": value})


def build_start():
    page("01 · Mulai dan onboarding")
    p = screen("login", "Masuk", "/", back=False)
    art = shape(p, 20, 112, 372, 290, "Focus", 28, name="Welcome illustration", kind="frame")
    image(art, "job-hunt.png", 60, 20, 252, 250, "Illustration of finding work")
    text(p, "Cari tenaga.\nTemukan kerja.", 20, 438, 372, 36, 750, line=42)
    text(p, "Bertemu lewat peta. Sepakati tugas dan upah sebelum mulai bekerja.", 20, 545, 372, 16, 400, "Muted", 24)
    g = button(p, "Masuk dengan Google", 644, "intro_1", variant="secondary")
    cmd("node.set", {"ids": [ref(g)], "fill": color("White"), "cornerRadius": 4})
    image(g, "google-g.png", 18, 17, 22, 22, "Official Google G")
    button(p, "Coba demo", 712, "intro_1", variant="quiet")
    l = text(p, "Privasi dan bantuan", 20, 799, 372, 14, 500, "Text", 21, "center")
    connect(l, "help")
    text(p, "Demo memakai data sintetis.", 20, 774, 372, 12, 400, "Muted", 18, "center")
    intros = [("Temukan bantuan\ndi sekitarmu.", "Cari pekerja atau pemberi kerja dalam jangkauan yang kamu pilih."),
              ("Kenalan lewat peta.\nLokasi tetap perkiraan.", "Ketuk pin untuk melihat profil. Nomor dibagikan setelah izin kontak disetujui."),
              ("Sepakati dulu.\nBayar tunai di tempat.", "Tugas, waktu, dan upah jelas sebelum bekerja. Konfirmasi uang hanya setelah diterima.")]
    for i, (heading, body) in enumerate(intros):
        p = screen(f"intro_{i+1}", f"Pengenalan {i+1} dari 3", "/onboarding · /intro-preview", back=False)
        intro_art(p, i, 125)
        text(p, heading, 20, 478, 372, 32, 750, line=39)
        text(p, body, 20, 584, 372, 16, 400, "Muted", 24)
        for j in range(3):
            shape(p, 20 + j * 28, 680, 20 if j == i else 8, 8, "Focus" if j == i else "Outline", 4)
        button(p, "Pilih peran" if i == 2 else "Lanjut", 742, "role" if i == 2 else f"intro_{i+2}")
        skip = text(p, "Lewati pengenalan", 20, 818, 372, 14, 500, "Text", 20, "center")
        connect(skip, "role")
    p = screen("role", "Pilih peran", "/role", heading="Kamu ingin apa?", subtitle="Pilih kebutuhanmu saat ini.")
    for i, (label, body, asset, tone) in enumerate([("Cari kerja", "Tawarkan bantuan\ndan layanan harian.", "job-hunt.png", "Sky"),
                                                  ("Cari tenaga", "Temukan orang untuk\nmembantu pekerjaanmu.", "hiring.png", "Lime")]):
        card = shape(p, 20 + i * 192, 226, 180, 350, tone, 26, "Focus" if i == 0 else None,
                     name=f"Role/{label}", kind="frame")
        image(card, asset, 10, 20, 160, 190, f"Role illustration/{label}")
        text(card, label, 16, 231, 148, 23, 750, line=30)
        text(card, body, 16, 274, 148, 14, 400, line=22)
        connect(card, "role" if i == 0 else "role_employer")
        if i == 0:
            shape(card, 138, 15, 26, 26, "Focus", 13)
            icon(card, "check", 144, 21, 14, "White")
    text(p, "Peran bisa diubah melalui Akun. Riwayat pekerjaan tetap tersimpan.", 20, 618, 372, 15, 400, "Muted", 23)
    button(p, "Lanjut", 742, "location")
    # Duplicate selection state is explicit and remains editable.
    p2 = screen("role_employer", "Pilih peran · Cari tenaga", "/role · pilihan penyedia kerja", heading="Kamu ingin apa?", subtitle="Pilih kebutuhanmu saat ini.")
    for i, (label, body, asset, tone) in enumerate([("Cari kerja", "Tawarkan bantuan\ndan layanan harian.", "job-hunt.png", "Sky"),
                                                  ("Cari tenaga", "Temukan orang untuk\nmembantu pekerjaanmu.", "hiring.png", "Lime")]):
        card = shape(p2, 20 + i * 192, 226, 180, 350, tone, 26, "Focus" if i == 1 else None, name=f"Role/{label}", kind="frame")
        image(card, asset, 10, 20, 160, 190, f"Role illustration/{label}")
        text(card, label, 16, 231, 148, 23, 750, line=30)
        text(card, body, 16, 274, 148, 14, 400, line=22)
        connect(card, "role" if i == 0 else "role_employer")
        if i == 1:
            shape(card, 138, 15, 26, 26, "Focus", 13)
            icon(card, "check", 144, 21, 14, "White")
    text(p2, "Peran bisa diubah melalui Akun. Riwayat pekerjaan tetap tersimpan.", 20, 618, 372, 15, 400, "Muted", 23)
    button(p2, "Lanjut", 742, "location_employer")
    for suffix, nxt in [("", "setup_worker"), ("_employer", "setup_employer")]:
        p = screen("location" + suffix, "Lokasi dan jangkauan", "/location", heading="Cari di sekitarmu.")
        panel = map_art(p, 20, 178, 372, 230, False)
        pin(panel, 155, 82, target="location" + suffix, count=1)
        small_tag(panel, "Contoh area Pekanbaru", 20, 189, 190, "Surface")
        text(p, "Lokasi saat aplikasi digunakan", 20, 440, 372, 18, 650, line=26)
        text(p, "Lokasi menentukan kota dan jangkauan pencarian. Titik publik tetap perkiraan.", 20, 480, 372, 15, 400, "Muted", 23)
        text(p, "Radius pencarian", 20, 555, 372, 14, 550, line=20)
        for i, v in enumerate(["1 km", "3 km", "5 km", "10 km"]):
            chip(p, v, 20 + i * 96, 589, 84, i == 2, target="location" + suffix)
        button(p, "Gunakan lokasi saya", 710, nxt, ico="location_on")
        text(p, "Contoh desain tidak meminta GPS nyata.", 20, 789, 372, 12, 400, "Muted", 18, "center")
    for kind, name in [("worker", "Dimas Saputra"), ("employer", "Rumah Bu Rina")]:
        p = screen(f"setup_{kind}", "Profil buruh" if kind == "worker" else "Profil penyedia kerja", "/setup", heading="Kenalkan dirimu.")
        avatar(p, 20, 177, 64, kind)
        ph = text(p, "Tambah foto (opsional)", 104, 197, 270, 14, 550, "Focus", 20)
        connect(ph, "photo_empty")
        field(p, "Nama tampilan", name, 271)
        field(p, "Tentang layananmu" if kind == "worker" else "Bantuan yang dibutuhkan", "Bantu bersihkan rumah dan kos." if kind == "worker" else "Bersih-bersih rumah sebelum akhir pekan.", 379, multiline=True)
        text(p, "Layanan saya" if kind == "worker" else "Butuh bantuan untuk", 20, 523, 372, 15, 650, line=22)
        chip(p, "Menyapu", 20, 560, 114, True, target="catalog")
        chip(p, "Mengepel", 146, 560, 114, True, target="catalog")
        chip(p, "Lainnya", 272, 560, 120, target="catalog")
        text(p, "Tenaga yang diterima" if kind == "worker" else "Perkiraan tenaga", 20, 630, 372, 14, 550, line=20)
        chip(p, "Ringan", 20, 665, 114, True, target="work_context")
        chip(p, "Sedang", 146, 665, 114, target="work_context")
        chip(p, "Berat", 272, 665, 120, target="work_context")
        button(p, "Simpan profil", 744, "home_employer" if kind == "employer" else "home_worker")
        skip = text(p, "Lewati dulu", 20, 820, 372, 14, 500, align="center")
        connect(skip, "home_employer" if kind == "employer" else "home_worker")
    p = screen("phone", "Nomor WhatsApp", "/phone", heading="Hubungkan nomor\nWhatsApp-mu.")
    text(p, "Nomor tidak tampil di peta. Bagikan hanya setelah izin kontak disetujui.", 20, 226, 372, 16, 400, "Muted", 24)
    field(p, "Nomor WhatsApp", "+62 8xx xxxx xxxx", 336, ico="person_add")
    note(p, "Verifikasi akses nomor", "Kode SMS membuktikan akses ke nomor, bukan identitas pemilik akun.", 478, height=120)
    button(p, "Kirim kode verifikasi", 730, "otp")
    p = screen("otp", "Verifikasi nomor", "/phone · OTP", heading="Periksa SMS-mu.")
    text(p, "Kode dikirim ke nomor tersamarkan.\nNomor dan kode pada desain ini hanya contoh.", 20, 180, 372, 16, 400, "Muted", 24)
    field(p, "Kode verifikasi", "••••••", 292)
    button(p, "Verifikasi nomor", 418, "account")
    resend = text(p, "Kirim ulang kode", 20, 509, 372, 15, 550, "Focus", 22, "center")
    connect(resend, "otp")
    button(p, "Ubah nomor", 560, "phone", variant="quiet")


def build_browse():
    page("02 · Beranda dan Temukan")
    for kind in ["worker", "employer"]:
        viewing = "employer" if kind == "worker" else "worker"
        p = screen(f"home_{kind}", "Beranda · " + ("buruh" if kind == "worker" else "penyedia kerja"), "/(tabs)/home", active="Beranda", back=False)
        hero = shape(p, 20, 108, 372, 184, "Focus", 28, name="Local discovery action", kind="frame", clip=True)
        text(hero, "Temukan kerja\ndi dekatmu." if kind == "worker" else "Bantuan harian,\ndekat dari rumah.", 20, 18, 268, 27, 750, "White", 33)
        text(hero, "Sukajadi, Pekanbaru · 5 km", 20, 96, 300, 13, 450, "White", 19)
        icon(hero, "location_on", 294, 22, 52, "White")
        button(hero, "Buka peta sekitar", 128, "map_employer" if kind == "worker" else "map_worker", x=20, width=332, variant="secondary", height=48, ico="map")
        search = field(p, "Cari kebutuhan atau layanan", "Cari pekerjaan atau layanan", 316, ico="search")
        connect(search, "filters")
        chip(p, "Kecamatan", 20, 420, 124, target="filters")
        chip(p, "Jenis kerja", 156, 420, 124, target="filters")
        chip(p, "Tenaga", 292, 420, 100, target="filters")
        text(p, "Butuh bantuan di dekatmu" if kind == "worker" else "Buruh di dekatmu", 20, 493, 372, 20, 700, line=27)
        names = ["Rumah Bu Rina", "Kedai Pak Andi", "Rumah Kak Maya", "Kos Melati"] if viewing == "employer" else ["Dimas Saputra", "Siti Rahma", "Rudi Hartono", "Ayu Lestari"]
        for i, name in enumerate(names[:2]):
            person_card(p, 20 + i * 192, 538, name, "Sukajadi · ±1,2 km" if i == 0 else "Senapelan · ±2,1 km", "Menyapu · Mengepel" if i == 0 else "Dapur · Kamar mandi", viewing, i)
    for key, title, viewing in [("map_worker", "Peta buruh", "worker"), ("map_employer", "Peta penyedia kerja", "employer"),
                                ("map_spread", "Pin terpisah · zoom maksimal", "worker"), ("map_selected", "Profil dipilih di peta", "worker")]:
        p = screen(key, title, "/(tabs)/discover", active="Temukan", back=False)
        m = map_art(p, 0, 98, W, 679)
        switch = chip(m, "Buruh" if viewing == "worker" else "Penyedia kerja", 20, 90, 166, True, fill="Surface", target="map_employer" if viewing == "worker" else "map_worker")
        chip(m, "Filter", 198, 90, 84, target="filters")
        chip(m, "Daftar", 294, 90, 98, target="discover_list")
        if key == "map_spread":
            # All offsets are presentational. No geographic position is rewritten.
            center = (180, 302)
            for xx, yy in [(112, 266), (245, 266)]:
                cmd("vector.create", {"path": f"M{center[0]} {center[1]} L{xx+27} {yy+53}", "parent": ref(m),
                                      "props": {"fill": "none", "stroke": color("Focus"), "strokeWeight": 1.5}, "select": False})
                pin(m, xx, yy, index=0 if xx == 112 else 1)
            shape(m, 174, 296, 12, 12, "Focus", 6)
            note(p, "Dua akun di area yang sama", "Pin dipisah agar bisa dipilih. Titik asal tetap lokasi perkiraan.", 618, height=116)
        else:
            pin(m, 84, 220, viewing, 0)
            pin(m, 246, 342, viewing, 1)
            pin(m, 158, 445, viewing, 2, "map_spread", count=2)
        if key == "map_selected":
            sheet = shape(p, 12, 548, 388, 219, "Surface", 28, name="Selected profile sheet", kind="frame")
            avatar(sheet, 20, 22, 56)
            text(sheet, "Dimas Saputra", 92, 23, 272, 21, 700, line=28)
            text(sheet, "Sukajadi · jarak perkiraan ±1,2 km", 92, 59, 272, 13, 400, "Muted", 19)
            small_tag(sheet, "Menyapu", 20, 100, 100)
            small_tag(sheet, "Mengepel", 132, 100, 100)
            button(sheet, "Lihat profil", 147, "person_worker", x=20, width=348, height=52)
    p = screen("discover_list", "Hasil dalam daftar", "/(tabs)/discover · daftar", active="Temukan", heading="Sekitar Sukajadi")
    chip(p, "Buruh", 20, 178, 120, True, target="map_worker")
    chip(p, "Filter", 152, 178, 112, target="filters")
    chip(p, "Peta", 276, 178, 116, target="map_worker")
    for i, (name, area) in enumerate([("Dimas Saputra", "Sukajadi · Menyapu, mengepel"), ("Siti Rahma", "Senapelan · Dapur, kamar mandi"),
                                       ("Rudi Hartono", "Marpoyan Damai · Jendela"), ("Ayu Lestari", "Sukajadi · Angkat galon")]):
        person_row(p, name, area, 250 + i * 98, "person_worker")
    p = screen("filters", "Filter pencarian", "Sheet bersama · Beranda/Temukan", heading="Persempit pencarian.")
    field(p, "Kecamatan", "Semua kecamatan", 190)
    field(p, "Kategori", "Bersih-bersih", 298)
    field(p, "Jenis pekerjaan", "Menyapu, mengepel", 406)
    text(p, "Tenaga", 20, 518, 372, 14, 550, line=20)
    chip(p, "Ringan", 20, 554, 114, True, target="filters")
    chip(p, "Sedang", 146, 554, 114, target="filters")
    chip(p, "Berat", 272, 554, 120, target="filters")
    text(p, "Filter mempersempit kota dan radius lokasi saat ini.", 20, 629, 372, 14, 400, "Muted", 21)
    button(p, "Tampilkan hasil", 730, "discover_list")
    button(p, "Reset filter", 804, "discover_list", variant="quiet", height=48)
    p = screen("visibility", "Tampil di peta", "Sheet · pengaturan visibilitas", heading="Siap dihubungi?")
    note(p, "Tampil di peta atas pilihanmu", "Melihat peta tidak otomatis menampilkan akunmu.", 190, height=112)
    person_row(p, "Peran aktif", "Buruh · Sukajadi", 334, ico="person")
    person_row(p, "Masa aktif", "Mengikuti batas yang ditetapkan server", 432, ico="schedule")
    text(p, "Mematikan penanda tidak mencabut nomor yang sudah kamu bagikan.", 20, 563, 372, 15, 400, "Muted", 23)
    button(p, "Tampilkan saya di peta", 730, "map_worker")


def build_contacts():
    page("03 · Profil dan izin kontak")
    for kind, name in [("worker", "Dimas Saputra"), ("employer", "Rumah Bu Rina")]:
        p = screen(f"person_{kind}", "Profil buruh" if kind == "worker" else "Profil penyedia kerja", "/person/[id]")
        panel = shape(p, 20, 112, 372, 198, "Sky" if kind == "worker" else "Lime", 28, kind="frame")
        icon(panel, "cleaning_services" if kind == "worker" else "home", 256, 48, 92, "BlueText" if kind == "worker" else "BrandGreen")
        avatar(panel, 20, 23, 76, kind)
        text(panel, "Buruh" if kind == "worker" else "Penyedia kerja", 20, 121, 220, 14, 500, line=21)
        text(panel, name, 20, 152, 250, 24, 750, line=31)
        text(p, "Sukajadi, Pekanbaru · ±1,2 km", 20, 338, 372, 15, 400, "Muted", 22)
        text(p, "Jarak dihitung dari lokasi perkiraan.", 20, 370, 372, 12, 400, "Muted", 18)
        text(p, "Layanan yang ditawarkan" if kind == "worker" else "Butuh bantuan untuk", 20, 426, 372, 18, 650, line=26)
        small_tag(p, "Menyapu", 20, 470, 112)
        small_tag(p, "Mengepel", 144, 470, 112)
        text(p, "Bantu bersihkan rumah dan kos." if kind == "worker" else "Bersih-bersih rumah. Alat dan bahan disediakan.", 20, 530, 372, 16, 400, line=24)
        text(p, "Ringan · Sedang" if kind == "worker" else "Perkiraan tenaga: Ringan", 20, 599, 372, 14, 550, "BlueText", 21)
        button(p, "Minta izin kontak", 710, "contact_sent", ico="person_add")
        report = text(p, "Laporkan atau blokir akun", 20, 801, 372, 14, 500, "Text", 21, "center")
        connect(report, "report")
    p = screen("activity_contacts", "Aktivitas · kontak", "/(tabs)/activity", active="Aktivitas", back=False)
    text(p, "Perlu tanggapanmu", 20, 118, 372, 28, 750, line=36)
    chip(p, "Kontak", 20, 181, 180, True, target="activity_contacts")
    chip(p, "Pekerjaan", 212, 181, 180, target="activity_work")
    person_row(p, "Rumah Bu Rina", "Meminta izin berbagi nomor", 255, "contact_incoming", kind="employer", status="Menunggu tanggapanmu")
    person_row(p, "Dimas Saputra", "Permintaan yang kamu kirim", 363, "contact_sent", status="Menunggu persetujuan")
    person_row(p, "Kedai Pak Andi", "Izin kontak disetujui", 471, "contact_approved", kind="employer", status="Buka detail kontak")
    contacts = [("contact_incoming", "Permintaan kontak masuk", "Rumah Bu Rina ingin menghubungimu.", "incoming"),
                ("contact_sent", "Permintaan terkirim", "Menunggu persetujuan Dimas Saputra.", "sent"),
                ("contact_approved", "Kontak diizinkan", "Kedua pihak telah menyetujui berbagi nomor.", "approved"),
                ("contact_revoked", "Izin kontak dicabut", "Nomor tidak bisa dibuka lagi melalui UpahGo.", "revoked")]
    for key, title, body, state in contacts:
        p = screen(key, title, "/contact/[id]", heading=title)
        person_row(p, "Rumah Bu Rina" if state == "incoming" else "Dimas Saputra", "Sukajadi · Pekanbaru", 194, "person_employer" if state == "incoming" else "person_worker", kind="employer" if state == "incoming" else "worker")
        note(p, title, body, 315, "SuccessSurface" if state == "approved" else "Sky", 126,
             "check" if state == "approved" else "person_add")
        text(p, "Izin kontak hanya untuk berbagi nomor. Ini belum berarti pekerjaan atau upah telah disepakati.", 20, 478, 372, 16, 400, "Muted", 24)
        if state == "incoming":
            text(p, "Jika diterima, nomor WhatsApp-mu dibagikan kepada akun ini.", 20, 593, 372, 15, 550, line=23)
            button(p, "Terima dan bagikan nomor", 708, "contact_approved")
            button(p, "Tolak permintaan", 782, "activity_contacts", variant="secondary")
        elif state == "sent":
            button(p, "Batalkan permintaan", 730, "activity_contacts", variant="secondary")
        elif state == "approved":
            button(p, "Buka WhatsApp", 640, "whatsapp_notice", ico="open_in_new")
            button(p, "Buat kesepakatan kerja", 712, "agreement_form", variant="secondary")
            revoke = text(p, "Cabut izin kontak", 20, 808, 372, 14, 500, "Error", 21, "center")
            connect(revoke, "contact_revoked")
        else:
            text(p, "Nomor yang sudah disalin di luar aplikasi tidak dapat ditarik kembali.", 20, 593, 372, 14, 400, "Muted", 21)
            button(p, "Kembali ke aktivitas", 730, "activity_contacts", variant="secondary")


def build_agreements():
    page("04 · Kesepakatan dan COD")
    p = screen("activity_work", "Aktivitas · pekerjaan", "/(tabs)/activity", active="Aktivitas", back=False)
    text(p, "Pekerjaanmu", 20, 118, 372, 28, 750, line=36)
    chip(p, "Kontak", 20, 181, 180, target="activity_contacts")
    chip(p, "Pekerjaan", 212, 181, 180, True, target="activity_work")
    person_row(p, "Bersih-bersih rumah", "Rumah Bu Rina · Rp150.000", 255, "agreement_waiting", ico="description", status="Menunggu konfirmasi buruh")
    person_row(p, "Bersihkan dapur kedai", "Kedai Pak Andi · Rp120.000", 363, "agreement_active", ico="cleaning_services", status="Disepakati")
    person_row(p, "Mengepel kos", "Kos Melati · Rp100.000", 471, "agreement_cod", ico="payments", status="Selesai · upah belum diakui diterima")
    p = screen("agreement_form", "Buat kesepakatan", "/new-agreement", heading="Sepakati rinciannya.")
    field(p, "Nama pekerjaan", "Bersih-bersih rumah", 178)
    field(p, "Tugas dan batas pekerjaan", "Menyapu dan mengepel ruang tamu. Tidak termasuk naik tangga.", 278, multiline=True)
    field(p, "Total upah tunai (Rp)", "150.000", 411, ico="payments")
    field(p, "Jadwal", "20 Nov 2026 · 09.00 WIB", 511, ico="event")
    context = button(p, "Kondisi kerja dan perlengkapan", 621, "work_context", variant="secondary", ico="description")
    button(p, "Tinjau kesepakatan", 742, "agreement_review")
    p = screen("work_context", "Kondisi kerja", "/new-agreement · rincian kondisi", heading="Batas pekerjaan jelas.")
    field(p, "Perkiraan durasi", "45 menit", 185)
    field(p, "Jumlah atau beban", "2 ruangan · tanpa angkat berat", 290)
    field(p, "Akses lokasi", "Lantai dasar · tanpa tangga", 395)
    field(p, "Alat dan bahan", "Disediakan pemberi kerja", 500)
    note(p, "Perkiraan tenaga: Ringan", "Perkiraan bukan batas angkat aman atau penilaian medis.", 611, height=100)
    button(p, "Simpan rincian", 755, "agreement_form")
    p = screen("agreement_review", "Tinjau kesepakatan", "/new-agreement · review", heading="Periksa sebelum kirim.")
    summary(p, 184, "Draf · belum dikirim", "Sky")
    text(p, "20 November 2026 · 09.00 WIB", 20, 465, 372, 17, 650, line=25)
    text(p, "Menyapu dan mengepel ruang tamu.\nLantai dasar, sekitar 45 menit.\nAlat dan bahan disediakan.", 20, 509, 372, 15, 400, line=25)
    text(p, "Pihak lain masih perlu menerima kesepakatan ini.", 20, 630, 372, 14, 400, "Muted", 22)
    button(p, "Kirim kesepakatan", 730, "agreement_waiting")
    button(p, "Ubah rincian", 805, "agreement_form", variant="quiet", height=48)
    states = [("agreement_waiting", "Menunggu penerimaan", "Menunggu konfirmasi buruh", "Sky"),
              ("agreement_active", "Pekerjaan disepakati", "Disepakati kedua pihak", "Lime"),
              ("agreement_completion", "Periksa hasil pekerjaan", "Penyelesaian diajukan buruh", "Sky"),
              ("agreement_cod", "Pekerjaan selesai", "Upah belum diakui diterima", "Lime"),
              ("agreement_paid", "Upah diterima", "Buruh menyatakan uang diterima", "SuccessSurface"),
              ("agreement_cancelled", "Kesepakatan dibatalkan", "Dibatalkan sebelum mulai", "Disabled")]
    for key, title, status, tone in states:
        p = screen(key, title, "/agreement/[id]")
        summary(p, 124, status, tone)
        text(p, "20 Nov 2026 · 09.00 WIB", 20, 410, 372, 18, 650, line=26)
        text(p, "Menyapu dan mengepel ruang tamu.\nAlat dan bahan disediakan pemberi kerja.", 20, 455, 372, 15, 400, "Muted", 24)
        if key == "agreement_waiting":
            text(p, "Dilihat sebagai buruh. Periksa tugas, waktu, dan total upah sebelum menerima.", 20, 558, 372, 15, 400, line=23)
            button(p, "Terima kesepakatan", 708, "agreement_active")
            button(p, "Tolak kesepakatan", 782, "agreement_cancelled", variant="secondary")
        elif key == "agreement_active":
            person_row(p, "Kontak dan alamat kerja", "Tersedia hanya untuk pihak berizin", 552, "contact_approved", ico="location_on")
            button(p, "Ajukan pekerjaan selesai", 708, "agreement_completion")
            action = text(p, "Laporkan masalah", 20, 810, 372, 14, 500, "Error", 21, "center")
            connect(action, "report")
        elif key == "agreement_completion":
            note(p, "Dilihat sebagai pemberi kerja", "Konfirmasi selesai setelah memeriksa hasil pekerjaan.", 554, height=110)
            button(p, "Konfirmasi pekerjaan selesai", 708, "agreement_cod")
            button(p, "Laporkan masalah", 782, "report", variant="secondary")
        elif key == "agreement_cod":
            note(p, "Selesai kerja berbeda dari pembayaran", "Hanya buruh yang menerima uang dapat menyatakan upah diterima.", 550, "Sky", 124, "payments")
            button(p, "Saya sudah menerima uang tunai", 728, "cod_confirm")
        elif key == "agreement_paid":
            note(p, "Pernyataan penerima uang", "Ini pengakuan COD, bukan bukti transfer bank atau jaminan pembayaran.", 550, "SuccessSurface", 124, "check")
            button(p, "Beri penilaian", 728, "rating")
        else:
            note(p, "Tidak ada pembayaran otomatis", "Lihat alasan pembatalan dan hubungi bantuan bila ada masalah.", 550, height=112)
            button(p, "Kembali ke aktivitas", 728, "activity_work", variant="secondary")
    p = screen("cod_confirm", "Konfirmasi uang diterima", "Dialog · pengakuan COD", heading="Uangnya sudah\nkamu terima?")
    summary(p, 235, "Konfirmasi sebagai buruh", "Lime")
    text(p, "Pilih konfirmasi hanya setelah uang tunai benar-benar berada di tanganmu.", 20, 531, 372, 17, 550, line=26)
    button(p, "Ya, uang sudah saya terima", 708, "agreement_paid")
    button(p, "Belum, kembali", 782, "agreement_cod", variant="secondary")
    p = screen("rating", "Beri penilaian", "/agreement/[id] · penilaian", heading="Bagaimana\npengalamannya?")
    person_row(p, "Rumah Bu Rina", "Bersih-bersih rumah · selesai", 237, "person_employer", kind="employer")
    text(p, "Nilai pengalaman kerja", 20, 360, 372, 16, 650, line=23)
    for i in range(5):
        star = chip(p, str(i + 1), 20 + i * 76, 406, 68, i == 4, target="rating")
    text(p, "1 kurang baik · 5 sangat baik", 20, 462, 372, 13, 400, "Muted", 20)
    field(p, "Komentar (opsional)", "Tugas jelas, alat sudah disiapkan.", 522, multiline=True)
    text(p, "Penilaian akan tampil publik setelah dikirim.", 20, 666, 372, 13, 400, "Muted", 20)
    button(p, "Kirim penilaian", 755, "rating_success")


def build_account():
    page("05 · Akun dan bantuan")
    p = screen("notifications", "Notifikasi", "/(tabs)/notices", active="Notifikasi", back=False)
    text(p, "Yang perlu kamu tahu", 20, 118, 372, 28, 750, line=36)
    text(p, "Hari ini", 20, 184, 372, 15, 650, line=22)
    person_row(p, "Permintaan kontak baru", "Rumah Bu Rina · 10 menit lalu", 227, "contact_incoming", ico="person_add")
    person_row(p, "Kesepakatan diterima", "Bersihkan dapur kedai · 1 jam lalu", 323, "agreement_active", ico="description")
    text(p, "Sebelumnya", 20, 446, 372, 15, 650, line=22)
    person_row(p, "Pekerjaan dikonfirmasi selesai", "Mengepel kos · kemarin", 489, "agreement_cod", ico="check")
    note(p, "Notifikasi tidak mengambil keputusan", "Buka rincian untuk meninjau dan memberi persetujuan.", 616, height=114)
    p = screen("account", "Akun", "/(tabs)/account", active="Akun", back=False)
    panel = shape(p, 20, 112, 372, 140, "Lime", 26, kind="frame")
    avatar(panel, 20, 24, 72)
    text(panel, "Dimas Saputra", 112, 27, 240, 23, 750, line=30)
    text(panel, "Buruh · Sukajadi", 112, 67, 240, 14, 400, line=21)
    text(panel, "Profil contoh", 112, 99, 240, 12, 400, "Muted", 18)
    rows = [("Edit profil", "Layanan dan keterangan", "edit", "setup_worker"),
            ("Nomor WhatsApp", "Kelola verifikasi nomor", "person_add", "phone"),
            ("Foto profil", "Opsional · izin tampilan publik", "person", "photo_empty"),
            ("Peran akun", "Cari kerja atau cari tenaga", "work", "role"),
            ("Lokasi dan jangkauan", "Pekanbaru · radius 5 km", "location_on", "location"),
            ("Bantuan dan privasi", "Panduan dan perlindungan data", "help_outline", "help")]
    for i, (a, b, glyph, dest) in enumerate(rows):
        person_row(p, a, b, 278 + i * 76, dest, ico=glyph, row_height=68)
    exit_link = text(p, "Keluar akun", 20, 748, 180, 14, 550, "Error", 21)
    connect(exit_link, "login")
    delete_link = text(p, "Penghapusan akun", 212, 748, 180, 13, 400, "Muted", 21, "right")
    connect(delete_link, "delete_account")
    for key, title in [("photo_empty", "Foto profil opsional"), ("photo_preview", "Pratinjau foto"), ("photo_consent", "Izin foto dipilih"), ("photo_pending", "Menunggu peninjauan")]:
        p = screen(key, title, "/profile-photo", heading="Foto yang kamu pilih.")
        box = shape(p, 56, 196, 300, 300, "Sky", 28, name="Photo preview", kind="frame", clip=True)
        if key == "photo_empty":
            icon(box, "person", 100, 80, 100, "BlueText")
            text(box, "Belum ada foto", 20, 218, 260, 16, 550, "BlueText", 24, "center")
        else:
            image(box, "avatar-0.png", 0, 0, 300, 300, "Illustrative image, not an actual user photo", "fill")
            text(p, "Gambar ilustratif untuk pratinjau desain.", 20, 513, 372, 12, 400, "Muted", 18, "center")
        if key == "photo_empty":
            text(p, "Gunakan foto yang kamu berhak bagikan. Foto identitas berbeda dari cover aktivitas.", 20, 547, 372, 15, 400, "Muted", 23)
            button(p, "Pilih dari galeri", 730, "photo_preview", variant="secondary")
        elif key in ["photo_preview", "photo_consent"]:
            chip(p, "Putar", 20, 554, 180, target="photo_preview")
            chip(p, "Potong persegi", 212, 554, 180, target="photo_preview")
            consent = shape(p, 8, 617, 48, 48, "Canvas", 5, name="Consent tap target", kind="frame")
            shape(consent, 12, 12, 24, 24, "Surface", 5, stroke="Outline")
            connect(consent, "photo_consent" if key == "photo_preview" else "photo_preview")
            if key == "photo_consent":
                icon(consent, "check", 16, 16, 16, "Focus")
            text(p, "Saya berhak membagikan foto ini dan menyetujui tampilan publik setelah disetujui.", 58, 626, 334, 14, 400, line=22)
            button(p, "Kirim untuk ditinjau", 755, "photo_pending" if key == "photo_consent" else None, variant="primary" if key == "photo_consent" else "disabled")
        else:
            note(p, "Belum tampil publik", "Foto menunggu peninjauan. Status ini hanya contoh desain, bukan hasil moderasi nyata.", 559, "Sky", 130)
            button(p, "Kembali ke akun", 755, "account", variant="secondary")
    p = screen("catalog", "Katalog pekerjaan", "/job-catalog", heading="Bantuan untuk\npekerjaan harian.")
    text(p, "Ketersediaan mengikuti kategori aktif. Entri rencana tidak otomatis bisa dipilih.", 20, 218, 372, 15, 400, "Muted", 23)
    person_row(p, "Bersih-bersih", "Lihat jenis layanan aktif", 304, "catalog_detail", ico="cleaning_services")
    person_row(p, "Angkat dan pindahkan", "Contoh demo · ketersediaan live terpisah", 400, "catalog_detail", ico="inventory_2")
    person_row(p, "Kebutuhan lainnya", "Kirim usulan privat", 496, "catalog_suggest", ico="description")
    note(p, "Status kategori harus jelas", "Usulan baru menunggu peninjauan dan tidak langsung menjadi layanan tersedia.", 625, height=126)
    p = screen("catalog_detail", "Bersih-bersih", "/job-catalog · kategori", heading="Pilih jenis pekerjaan.")
    for i, (a, glyph) in enumerate([("Menyapu", "cleaning_services"), ("Mengepel", "mop"), ("Membersihkan dapur", "countertops"),
                                   ("Kamar mandi", "bathtub"), ("Membersihkan jendela", "window")]):
        person_row(p, a, "Periksa rincian dan batas pekerjaan", 195 + i * 100, "setup_worker", ico=glyph)
    p = screen("catalog_suggest", "Usulkan pekerjaan", "/job-catalog · usulan privat", heading="Belum ada\nyang sesuai?")
    field(p, "Nama pekerjaan", "Tulis pekerjaan yang dibutuhkan", 248)
    field(p, "Rincian singkat", "Jelaskan kebutuhan tanpa nomor atau alamat pribadi.", 365, multiline=True)
    note(p, "Usulan bersifat privat", "Dikirim untuk peninjauan. Belum menjadi kategori atau layanan aktif.", 548, height=120)
    button(p, "Kirim usulan", 755, "suggest_success")
    p = screen("help", "Bantuan dan privasi", "/help", heading="Ada yang\ningin kamu pahami?")
    for i, (a, glyph, target) in enumerate([("Lokasi di peta", "location_on", "help_location"), ("Nomor dan izin kontak", "person_add", "help_article"),
                                   ("Kesepakatan dan COD", "payments", "help_cod"), ("Rating dan ulasan", "description", "help_rating"),
                                   ("Privasi dan ketentuan", "help_outline", "help_privacy"), ("Laporkan masalah", "error_outline", "help_report")]):
        person_row(p, a, "Baca penjelasan", 232 + i * 76, target, ico=glyph, row_height=68)
    button(p, "Lihat pengenalan aplikasi", 741, "intro_1", variant="secondary")
    p = screen("help_article", "Nomor dan izin kontak", "/help · artikel", heading="Nomormu dibagikan\nsetelah kamu setuju.")
    text(p, "Meminta kontak", 20, 247, 372, 20, 700, line=28)
    text(p, "Permintaan kontak dikirim ke akun yang kamu pilih. Nomor belum bisa dibuka selama menunggu persetujuan.", 20, 293, 372, 17, 400, line=28)
    text(p, "Saat kamu menerima", 20, 423, 372, 20, 700, line=28)
    text(p, "Kedua pihak menyetujui berbagi nomor. Membuka WhatsApp tetap tindakan terpisah dan tidak menyepakati pekerjaan.", 20, 469, 372, 17, 400, line=28)
    note(p, "Pahami batas pencabutan", "Nomor atau pesan yang tersimpan di luar UpahGo tidak dapat ditarik kembali.", 625, height=126)
    for key, title, heading, body, caution in [
        ("help_location", "Lokasi di peta", "Lokasi tetap\nperkiraan.", "Lokasi digunakan saat aplikasi dibuka untuk mencari di kota dan radius hasil GPS. Titik publik dibulatkan. Aktifkan Tampil di peta hanya saat siap dihubungi.", "GPS dan batas wilayah bukan jaminan keamanan. Skema peta prototipe bukan petunjuk arah."),
        ("help_cod", "Kesepakatan dan COD", "Sepakati tugas.\nPastikan uang diterima.", "Periksa tugas, alat, durasi, lokasi dan total upah sebelum bekerja. Pembayaran dilakukan langsung secara tunai. Konfirmasi hasil kerja terpisah dari konfirmasi penerimaan uang.", "Tidak ada escrow atau jaminan pembayaran. Konfirmasi COD hanya setelah uang berada di tanganmu."),
        ("help_rating", "Rating dan ulasan", "Nilai pengalaman\nsetelah pekerjaan selesai.", "Peserta pekerjaan selesai dapat memberi satu penilaian untuk pihak lain. Penilaian dipisahkan menurut peran pada pekerjaan tersebut. Ulasan tampil publik setelah dikirim.", "Penilaian bukan verifikasi identitas atau jaminan keamanan. Laporkan penyalahgunaan pada akun terkait."),
        ("help_privacy", "Privasi dan ketentuan", "Pahami data\nyang kamu bagikan.", "Profil, area umum, izin kontak, catatan kerja dan laporan diproses sesuai alur yang dipilih. Demo hanya memakai data sintetis di memori.", "Layanan publik belum tersedia. Retensi, kontak operator dan ketentuan final perlu ditetapkan sebelum rilis."),
        ("help_report", "Laporkan masalah", "Laporkan akun\nyang bermasalah.", "Gunakan Laporkan atau blokir pada profil terkait. Ceritakan masalah seperlunya tanpa membagikan nomor, alamat atau informasi sensitif yang tidak dibutuhkan.", "Form laporan bukan layanan darurat. Jika ada bahaya langsung, menjauh dan hubungi layanan darurat setempat.")]:
        p = screen(key, title, "/help · artikel", heading=heading)
        text(p, body, 20, 263, 372, 18, 400, line=29)
        note(p, "Perlu kamu ketahui", caution, 526, height=164)
        button(p, "Kembali ke bantuan", 755, "help", variant="secondary")
    p = screen("report", "Laporkan akun", "/report/[id]", heading="Ceritakan masalahnya.")
    person_row(p, "Dimas Saputra", "Akun yang dilaporkan", 185, "person_worker")
    field(p, "Kategori masalah", "Perilaku tidak pantas", 302)
    field(p, "Uraian masalah", "Jelaskan kejadian dan konteksnya.", 412, multiline=True)
    text(p, "Jangan sertakan nomor telepon, alamat lengkap, atau informasi sensitif yang tidak diperlukan.", 20, 555, 372, 14, 400, "Muted", 22)
    button(p, "Kirim laporan", 697, "report_success")
    button(p, "Blokir akun", 771, "block_confirm", variant="secondary")
    for key, title, body in [("report_success", "Laporan terkirim", "Laporan diterima oleh sistem. Ini belum berarti masalah telah ditangani."),
                             ("suggest_success", "Usulan terkirim", "Usulan masih menunggu peninjauan dan belum menjadi layanan aktif.")]:
        p = screen(key, title, "/report/[id] · hasil" if key == "report_success" else "/job-catalog · hasil", heading=title)
        note(p, title, body, 236, "SuccessSurface", 142, "check")
        text(p, "Contoh status pada prototipe, bukan pengiriman nyata.", 20, 422, 372, 15, 400, "Muted", 23)
        button(p, "Kembali ke akun", 730, "account", variant="secondary")
    p = screen("block_confirm", "Blokir akun", "Dialog · blokir", heading="Blokir akun ini?")
    person_row(p, "Dimas Saputra", "Profil contoh", 215, "person_worker")
    text(p, "Akun ini tidak ditampilkan dalam penemuanmu. Permintaan berikutnya mengikuti aturan blokir server.", 20, 350, 372, 17, 400, line=27)
    note(p, "Percakapan di luar aplikasi", "Blokir UpahGo tidak menghapus nomor atau percakapan di WhatsApp.", 520, height=126)
    button(p, "Blokir akun", 708, "activity_contacts", variant="danger")
    button(p, "Batal", 782, "person_worker", variant="secondary")
    p = screen("delete_account", "Penghapusan akun", "/delete-account", heading="Ajukan\npenghapusan akun.")
    text(p, "Permintaan tidak berarti seluruh data terhapus saat itu. Status pekerjaan dan kewajiban retensi perlu diperiksa.", 20, 237, 372, 17, 400, line=27)
    note(p, "Pahami konsekuensinya", "Akses akun dan data yang dapat dipulihkan mengikuti proses penghapusan yang berlaku.", 390, "ErrorSurface", 142, "warning_amber")
    field(p, "Ketik HAPUS untuk mengonfirmasi", "HAPUS", 582)
    button(p, "Ajukan penghapusan", 730, "delete_requested", variant="danger")
    button(p, "Kembali", 805, "account", variant="quiet", height=48)
    p = screen("delete_requested", "Permintaan penghapusan", "/delete-account · hasil", heading="Permintaan tercatat.")
    note(p, "Belum berarti data terhapus", "Penghapusan tuntas dan penanganan operator belum tersedia pada versi lokal.", 236, "Sky", 142)
    text(p, "Status contoh desain. Tidak ada akun yang dihapus.", 20, 422, 372, 15, 400, "Muted", 23)
    button(p, "Kembali ke akun", 730, "account", variant="secondary")


def build_states():
    page("06 · State dan pemulihan")
    states = [
        ("empty", "Belum ada hasil", "Belum ada akun yang cocok.", "Coba kurangi filter atau ubah radius pencarian.", "Ubah filter", "filters", "search"),
        ("network_error", "Gagal memuat hasil", "Data belum berhasil dimuat.", "Filter dan radius tetap disimpan. Periksa koneksi lalu coba lagi.", "Coba lagi", "home_worker", "error_outline"),
        ("location_denied", "Izin lokasi ditolak", "Lokasi dibutuhkan untuk penemuan.", "Aktifkan izin lokasi saat aplikasi digunakan. Riwayat dan Akun tetap dapat dibuka untuk akun lama.", "Periksa izin lokasi", "location", "location_on"),
        ("city_unavailable", "Area belum terlayani", "Penemuan belum tersedia di kota ini.", "Jangan mengganti kota secara manual. Riwayat dan bantuan tetap dapat dibuka.", "Buka akun", "account", "location_on"),
        ("bootstrap_error", "Akun belum termuat", "Data akun belum berhasil dimuat.", "Coba lagi tanpa mengubah akun atau beralih ke demo secara otomatis.", "Muat ulang akun", "home_worker", "error_outline"),
        ("auth_error", "Masuk dibatalkan atau gagal", "Kamu belum berhasil masuk.", "Kembali ke halaman masuk untuk mencoba lagi. Demo tetap pilihan terpisah.", "Kembali ke masuk", "login", "person"),
        ("session_expired", "Sesi berakhir", "Masuk kembali untuk melanjutkan.", "Data pribadi tidak ditampilkan sebelum sesi dipulihkan.", "Masuk dengan Google", "login", "person"),
        ("target_unavailable", "Profil tidak tersedia", "Akun sedang tidak tampil di peta.", "Status bisa berubah atau akses sudah tidak tersedia. Permintaan baru tidak dikirim.", "Kembali ke Temukan", "map_worker", "person"),
        ("rating_success", "Penilaian terkirim", "Terima kasih atas penilaianmu.", "Penilaian dipisahkan dari pengakuan penerimaan uang tunai.", "Lihat kesepakatan", "agreement_paid", "check"),
        ("whatsapp_notice", "Pratinjau WhatsApp", "Prototipe tidak membuka nomor nyata.", "Pada aplikasi, nomor hanya tersedia setelah izin server diperiksa dan pengguna memilih membukanya.", "Kembali ke kontak", "contact_approved", "open_in_new"),
    ]
    for key, title, heading, body, label, dest, glyph in states:
        p = screen(key, title, "State bersama · " + key.replace("_", " "), heading=heading)
        shape(p, 20, 241, 372, 220, "Sky" if key not in ["rating_success", "empty"] else "Lime", 28)
        icon(p, glyph, 164, 295, 84, "BlueText" if key not in ["rating_success", "empty"] else "BrandGreen")
        text(p, body, 20, 511, 372, 17, 400, "Muted", 27)
        button(p, label, 730, dest, variant="secondary")
    p = screen("offline", "Offline · hasil tersimpan", "State · koneksi terputus", active="Beranda", back=False)
    note(p, "Tidak ada koneksi", "Hasil sebelumnya · belum diperbarui. Tindakan kontak perlu koneksi.", 118, "ErrorSurface", 120, "error_outline")
    person_card(p, 20, 274, "Dimas Saputra", "Sukajadi · hasil sebelumnya", "Menyapu · Mengepel")
    person_card(p, 212, 274, "Siti Rahma", "Senapelan · hasil sebelumnya", "Dapur · Kamar mandi", index=1)
    button(p, "Coba sambungkan kembali", 655, "home_employer", variant="secondary")
    p = screen("validation", "Form perlu diperbaiki", "State · validasi dan masukan dipertahankan", heading="Periksa rinciannya.")
    field(p, "Nama pekerjaan", "Bersih-bersih rumah", 197)
    field(p, "Total upah tunai (Rp)", "", 315, error="Isi total upah yang disepakati.")
    field(p, "Jadwal", "20 Nov 2026 · 09.00 WIB", 454)
    note(p, "Masukan lain tetap tersimpan", "Kesalahan ditampilkan dekat isian. Tidak ada pengiriman sebelum valid.", 592, "ErrorSurface", 118, "error_outline")
    button(p, "Tinjau kesepakatan", 755, "agreement_form")
    p = screen("loading", "Sedang memuat", "State · loading", heading="Memuat akun\ndi area ini.")
    shape(p, 20, 253, 372, 206, "Sky", 26)
    icon(p, "hourglass_empty", 177, 299, 58, "BlueText")
    text(p, "Memuat hasil pencarian…", 40, 392, 332, 16, 550, "BlueText", 24, "center")
    text(p, "Contoh pengguna tidak ditampilkan sebagai hasil nyata selama memuat.", 20, 511, 372, 16, 400, "Muted", 25)
    button(p, "Kembali", 730, "home_worker", variant="secondary")


def build_foundation():
    page("00 · Panduan dan komponen")
    p = cmd("frame.create", {"x": 0, "y": 0, "width": 1440, "height": 1080,
                             "name": "Panduan desain UpahGo", "props": {"fill": color("Canvas")}, "select": False}, "foundation")
    image(p, ROOT / "assets/brand/exports/upahgo-lockup-light.png", 48, 40, 180, 60, "Approved UpahGo logo")
    text(p, "Kerja harian,\ndengan langkah yang jelas.", 48, 150, 900, 60, 750, line=68)
    text(p, "Review desain sebelum implementasi · Android · Bahasa Indonesia", 48, 320, 1100, 21, 400, "Muted", 30)
    text(p, "Referensi: Kestrel Pay / Kombai. Kanvas bone, panel ivory, fokus tomato, biru dan lime untuk kelompok informasi.", 48, 388, 1240, 21, 400, line=32)
    for i, name in enumerate(["Canvas", "Surface", "Focus", "Sky", "Lime", "Text"]):
        shape(p, 48 + i * 216, 498, 192, 130, name, 24)
        text(p, name, 48 + i * 216, 652, 192, 18, 650, line=26)
        text(p, PALETTE[name], 48 + i * 216, 690, 192, 16, 400, "Muted", 24)
    text(p, "Identitas", 48, 781, 260, 22, 700, line=30)
    text(p, "Logo hijau/emas tetap asli. Sistem warna ini usulan pada artefak desain; token aplikasi belum diubah.", 48, 831, 600, 19, 400, line=29)
    text(p, "Batas prototipe", 760, 781, 600, 22, 700, line=30)
    text(p, "Data sintetis. Isian, filter dan editor foto memakai state contoh tetap. Tombol alur berpindah layar; tidak ada login, GPS, SMS atau transaksi nyata.", 760, 831, 600, 19, 400, line=29)
    text(p, "Operate · ENERGY 2 / RHYTHM 1 / MOTION 2 · Roboto · target sentuh 48 dp · body 16/24 · kartu 24–28 dp", 48, 995, 1340, 17, 500, "Muted", 25)
    p = cmd("frame.create", {"x": 0, "y": 1240, "width": 1440, "height": 1120, "name": "Komponen dan state", "props": {"fill": color("Canvas")}, "select": False}, "components_board")
    text(p, "Komponen yang dipakai bersama", 48, 48, 1320, 38, 750, line=48)
    examples = []
    examples.append(button(p, "Simpan perubahan", 150, x=48, width=372))
    examples.append(button(p, "Kembali", 226, x=48, width=372, variant="secondary"))
    examples.append(button(p, "Menyimpan…", 302, x=48, width=372, variant="disabled"))
    examples.append(button(p, "Ajukan penghapusan", 378, x=48, width=372, variant="danger"))
    focus = button(p, "Fokus keyboard", 430, x=520, width=372, variant="secondary")
    cmd("node.set", {"ids": [ref(focus)], "stroke": color("BrandGreen"), "strokeWeight": 3})
    field(p, "Nama tampilan", "Dimas Saputra", 150, x=520)
    field(p, "Total upah tunai (Rp)", "", 286, x=520, error="Isi total upah yang disepakati.")
    for i, tone in enumerate(["Sky", "Lime", "SuccessSurface", "ErrorSurface"]):
        shape(p, 1010, 150 + i * 80, 350, 60, tone, 16)
        text(p, ["Layanan buruh", "Kebutuhan tenaga", "Dikonfirmasi penerima", "Perlu diperbaiki"][i], 1028, 168 + i * 80, 314, 16, 550, line=24)
    text(p, "Pin lokasi dan identitas", 48, 522, 800, 24, 700, line=32)
    pin(p, 48, 598, index=0)
    pin(p, 144, 598, kind="employer", index=1)
    pin(p, 240, 598, count=2, target="map_spread")
    text(p, "Foto contoh", 48, 690, 170, 14, 400, "Muted", 21)
    text(p, "Kelompok akun", 240, 690, 200, 14, 400, "Muted", 21)
    text(p, "Titik sama, zoom maksimal", 520, 570, 400, 18, 650, line=26)
    pin(p, 540, 624, index=0)
    pin(p, 676, 624, index=1)
    text(p, "Pemisahan visual. Koordinat dan lokasi perkiraan tidak berubah.", 520, 730, 400, 15, 400, "Muted", 23)
    text(p, "Ukuran dan hierarki", 1010, 570, 350, 18, 650, line=26)
    text(p, "Judul 32/38\nSubjudul 22/30\nIsi 16/24\nMetadata 14/21\nTombol 56 dp\nSentuhan 48 dp", 1010, 620, 350, 20, 400, line=42)
    text(p, "State wajib", 48, 870, 800, 24, 700, line=32)
    text(p, "Default · dipilih · fokus · pending · disabled · validasi · loading · kosong · offline · error · berhasil", 48, 925, 1280, 19, 400, line=30)
    text(p, "State di atas adalah spesifikasi desain. TalkBack, keyboard, kontras akhir dan perilaku perangkat tetap perlu diverifikasi saat implementasi.", 48, 998, 1280, 17, 400, "Muted", 26)
    for c in examples:
        cmd("component.create", {"ids": [ref(c)]})
    p = cmd("frame.create", {"x": 0, "y": 2520, "width": 1440, "height": 680, "name": "Alur inti dan batas implementasi", "props": {"fill": color("Canvas")}, "select": False}, "flow_board")
    text(p, "Alur inti", 48, 48, 1240, 38, 750, line=48)
    flows = [("Mulai", "Google, pengenalan, peran, lokasi, profil", "login"),
             ("Temukan", "Cari, filter, peta dan profil", "home_worker"),
             ("Izin kontak", "Permintaan, persetujuan, WhatsApp", "activity_contacts"),
             ("Sepakati kerja", "Tugas, jadwal, upah dan review", "agreement_form"),
             ("Selesai dan COD", "Hasil kerja dan penerimaan uang terpisah", "agreement_cod"),
             ("Akun dan bantuan", "Foto, peran, laporan dan privasi", "account")]
    for i, (a, b, dest) in enumerate(flows):
        x, y = 48 + (i % 3) * 450, 145 + (i // 3) * 185
        card = shape(p, x, y, 414, 150, "Sky" if i % 2 == 0 else "Lime", 24, name=f"Flow/{a}", kind="frame")
        text(card, a, 22, 22, 370, 23, 700, line=31)
        text(card, b, 22, 69, 370, 17, 400, line=26)
        connect(card, dest)
    text(p, "Klik kartu alur atau mulai Present pada halaman 01. Publikasi lowongan, lamaran dan operator web tetap di luar cakupan.", 48, 572, 1320, 17, 400, "Muted", 26)


def finish():
    cmd("page.delete", {"id": {"$ref": "initial_pages", "field": "0/id"}})
    for node, target, action in links:
        params = {"id": ref(node), "trigger": {"type": "onClick"}, "action": {"type": action},
                  "transition": {"type": "instant"}}
        if action == "navigate":
            assert target in screens, f"Missing destination {target}"
            params["action"]["dest"] = ref(screens[target]["alias"])
        cmd("proto.interaction.add", params)
    cmd("proto.flow.add", {"start": ref(screens["login"]["alias"]), "name": "Mulai dari masuk"})
    cmd("proto.flow.add", {"start": ref(screens["home_worker"]["alias"]), "name": "Jelajah sebagai buruh"})
    cmd("proto.flow.add", {"start": ref(screens["home_employer"]["alias"]), "name": "Jelajah sebagai penyedia kerja"})
    cmd("proto.flow.add", {"start": ref(screens["agreement_form"]["alias"]), "name": "Kesepakatan dan COD"})
    cmd("proto.settings", {"device": "Custom size", "width": W, "height": H, "background": "#E8E3DC", "responsive": False})
    cmd("page.move", {"id": ref(pages[-1]["alias"]), "index": 0})
    cmd("page.select", {"id": ref(pages[0]["alias"])})
    cmd("select.set", {"ids": [ref(screens["role"]["alias"])]})
    cmd("view.zoomSelection")
    manifest = {"name": "UpahGo Kestrel design review", "date": "2026-11-18", "platform": "Android",
                "status": "design-only; not implementation approval", "screenSize": [W, H],
                "pages": [{"name": p["name"], "screens": p["count"]} for p in pages],
                "screens": screens, "interactionCount": len(links), "commandCount": len(commands), "palette": PALETTE}
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "commands.json").write_text(json.dumps(commands, ensure_ascii=False))
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    assert len(screens) >= 55, len(screens)
    assert all(s["width"] == W for s in screens.values())
    assert all(path.is_file() for path in [ASSETS / "job-hunt.png", ASSETS / "hiring.png", ASSETS / "google-g.png"])
    print(json.dumps({"screens": len(screens), "pages": len(pages), "interactions": len(links), "commands": len(commands)}))


if __name__ == "__main__":
    init()
    build_start()
    build_browse()
    build_contacts()
    build_agreements()
    build_account()
    build_states()
    build_foundation()
    finish()
