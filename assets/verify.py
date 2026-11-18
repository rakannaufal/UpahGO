"""Check the local asset catalog; --pixels additionally requires Pillow.

This checks the current SVG subset and file integrity, not arbitrary SVG safety
or Android rendering. It never downloads, modifies, or installs anything.
"""

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import struct
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent
SVG_NS = "http://www.w3.org/2000/svg"
TAGS = {"svg", "title", "desc", "defs", "mask", "g", "path", "rect", "text"}
ATTRS = {"width", "height", "viewBox", "fill", "d", "x", "y", "transform",
         "stroke", "stroke-width", "stroke-linejoin", "id", "maskUnits", "mask",
         "font-family", "font-size", "font-weight", "stroke-linecap"}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def local_file(relative):
    path = (ROOT / relative).resolve()
    require(path.is_relative_to(ROOT), f"Path leaves assets/: {relative}")
    require(path.is_file(), f"Missing file: {relative}")
    return path


def check_svg(data):
    require(not re.search(rb"<!\s*(DOCTYPE|ENTITY)\b|<\?", data, re.I),
            "SVG declarations or processing instructions are not allowed")
    root = ET.fromstring(data)
    require(root.tag == f"{{{SVG_NS}}}svg", "Invalid SVG root")
    ids = {node.attrib["id"] for node in root.iter() if "id" in node.attrib}
    for node in root.iter():
        require(node.tag.startswith(f"{{{SVG_NS}}}"), "Foreign SVG namespace")
        require(node.tag.rsplit("}", 1)[-1] in TAGS, f"Unsupported SVG tag: {node.tag}")
        for key, value in node.attrib.items():
            require(key in ATTRS, f"Unsupported SVG attribute: {key}")
            if key == "mask":
                match = re.fullmatch(r"url\(#([A-Za-z][\w-]*)\)", value)
                require(match is not None and match[1] in ids, "Invalid local SVG mask")
            else:
                require(not re.search(r"url\s*\(|https?:|data:|javascript:", value, re.I),
                        f"External or active SVG value: {key}")
    return root


def svg_self_check():
    valid = f'<svg xmlns="{SVG_NS}" viewBox="0 0 24 24"><path d="M0 0Z"/></svg>'
    check_svg(valid.encode())
    unsafe = [
        valid.replace("<path", '<script/> <path'),
        valid.replace("<path", '<foreignObject/> <path'),
        valid.replace("<path", '<image href="https://example.com/a.png"/> <path'),
        valid.replace("<path", '<path onload="alert(1)"/><path'),
        valid.replace("<path", '<path fill="url(https://example.com/a)"/><path'),
        valid.replace("<path", '<path mask="url(#missing)"/><path'),
        '<!DOCTYPE svg [<!ENTITY x "unsafe">]>' + valid,
    ]
    for sample in unsafe:
        try:
            check_svg(sample.encode())
        except ValueError:
            continue
        raise ValueError("SVG unsafe-input self-check failed")
    return len(unsafe)


def verify(pixels=False):
    rejected = svg_self_check()
    catalog = json.loads((ROOT / "catalog.json").read_text())
    records = catalog["assets"]
    ids = [entry["id"] for entry in records]
    require(len(ids) == len(set(ids)), "Duplicate catalog asset IDs")
    counts = Counter(entry["kind"] for entry in records)
    require(counts == {"ui-icon": 47, "brand-logo": 1, "map-marker": 2,
                       "font-source": 1,
                       "wordmark-candidate": 1},
            f"Unexpected inventory: {counts}")
    checked = set()
    png_count = 0

    def check_file(relative, expected_hash):
        path = local_file(relative)
        require(re.fullmatch(r"[a-f0-9]{64}", expected_hash) is not None,
                f"Invalid hash: {relative}")
        data = path.read_bytes()
        require(hashlib.sha256(data).hexdigest() == expected_hash,
                f"Hash mismatch: {relative}")
        if path.suffix == ".svg":
            check_svg(data)
        checked.add(path)
        return path, data

    def check_png(entry):
        nonlocal png_count
        path, data = check_file(entry["path"], entry["sha256"])
        require(data[:8] == b"\x89PNG\r\n\x1a\n" and data[12:16] == b"IHDR",
                f"Invalid PNG header: {path.name}")
        width, height, depth, color = struct.unpack(">IIBB", data[16:26])
        require((width, height) == (entry["width"], entry["height"]),
                f"PNG dimensions differ: {path.name}")
        require(depth == 8 and color in (2, 6), f"Unexpected PNG format: {path.name}")
        if "bytes" in entry:
            require(len(data) == entry["bytes"], f"PNG byte count differs: {path.name}")
        if entry.get("opaque") is False:
            require(color == 6, f"Missing alpha channel: {path.name}")
        if pixels:
            from PIL import Image
            with Image.open(path) as bitmap:
                bitmap.load()
                alpha = bitmap.convert("RGBA").getchannel("A").getextrema()
                if "opaque" in entry:
                    expected = (255, 255) if entry["opaque"] else (0, 255)
                    require(alpha == expected, f"Unexpected alpha range: {path.name}")
                if path.name == "adaptive-monochrome.png":
                    rgba = bitmap.convert("RGBA")
                    require(all(rgba.getchannel(channel).getextrema() == (0, 0)
                                for channel in ("R", "G", "B")),
                            "Monochrome mask contains color")
        png_count += 1

    for license_entry in catalog["license_files"]:
        check_file(license_entry["path"], license_entry["sha256"])
    for entry in records:
        for field, hash_field in (("source", "sha256"), ("export", "export_sha256"),
                                  ("inverse", "inverse_sha256"),
                                  ("monochrome", "monochrome_sha256")):
            if field in entry:
                check_file(entry[field], entry[hash_field])
        if "license_file" in entry:
            local_file(entry["license_file"])
        if "source_png" in entry:
            check_png(entry["source_png"])
            require(entry["source_png"]["path"] == entry["source"], "Logo source mismatch")
        for variant in entry.get("source_variants", []):
            path, data = check_file(variant["path"], variant["sha256"])
            require(check_svg(data).attrib["viewBox"] == "0 0 48 56",
                    f"Unexpected marker viewBox: {path.name}")
        for derivative in entry.get("png_derivatives", []):
            check_png(derivative)
        if entry["kind"] == "ui-icon":
            glyph = entry['glyph']
            require(entry["source_url"] in (
                    "https://fonts.gstatic.com/s/i/short-term/"
                    f"release/materialsymbolsrounded/{glyph}/default/24px.svg",
                    "https://raw.githubusercontent.com/google/material-design-icons/"
                    f"master/symbols/web/{glyph}/materialsymbolsrounded/{glyph}_24px.svg"),
                    "Unexpected glyph source URL")
            require(entry["license"] == "Apache-2.0", "Missing icon license")
            require(check_svg(local_file(entry["export"]).read_bytes()).attrib["fill"]
                    == "currentColor", "Export must permit UI tint")
        if "font_asset" in entry:
            require(entry["font_asset"] in ids, "Missing font catalog reference")
    require(len(catalog["previews"]) == 3, "Expected three current review boards")
    for preview in catalog["previews"]:
        check_png(preview)
    actual = {path.resolve() for path in ROOT.rglob("*")
              if path.suffix in (".svg", ".png", ".ttf")}
    require(actual.issubset(checked), "Unused or uncataloged SVG/PNG/font found")
    require(png_count == 26, "Expected source PNG, 22 derivatives and three review boards")
    return {"catalogRecords": len(records), "hashedFiles": len(checked),
            "svgFiles": len([path for path in checked if path.suffix == ".svg"]),
            "pngFiles": png_count, "unsafeSamplesRejected": rejected,
            "pixelChecks": pixels, "nativeAndroid": "not tested"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pixels", action="store_true", help="Decode PNGs with Pillow")
    args = parser.parse_args()
    print(json.dumps(verify(args.pixels), indent=2))
