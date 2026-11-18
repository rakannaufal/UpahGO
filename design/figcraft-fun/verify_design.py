"""Check the serialized FigCraft design, without claiming application coverage."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
document = json.loads((ROOT / "document.json").read_text())
manifest = json.loads((ROOT / "manifest.json").read_text())
nodes = {int(key): value for key, value in document["nodes"].items()}
screens = [node for node in nodes.values() if node["type"] == "frame"
           and node["width"] == 412 and node["height"] == 892]
assert len(screens) == len(manifest["screens"]) == 75
assert len(document["pages"]) == 7
assert len(document["variables"]["variables"]) == len(manifest["palette"]) == 22
assert not any('"ok":false' in line for line in (ROOT / "build.log").read_text().splitlines())


def luminance(color):
    values = [color[key] for key in ["r", "g", "b"]]
    linear = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in values]
    return sum(a * b for a, b in zip(linear, [0.2126, 0.7152, 0.0722]))


def solid_color(node):
    for fill in reversed(node.get("fills", [])):
        if fill.get("type") == "solid" and fill.get("visible", True) and fill.get("opacity", 1) == 1:
            color = fill["color"]
            if color.get("a", 1) == 1:
                return color
    return None


def background_for(node):
    parent = nodes.get(node.get("parent"))
    if not parent:
        return None
    x, y = node.get("transform", [1, 0, 0, 1, 0, 0])[4:6]
    preceding = parent.get("children", [])
    preceding = preceding[:preceding.index(node["id"])]
    for sibling_id in reversed(preceding):
        sibling = nodes[sibling_id]
        if sibling["type"] not in ["rectangle", "ellipse", "frame"]:
            continue
        sx, sy = sibling.get("transform", [1, 0, 0, 1, 0, 0])[4:6]
        if sx <= x and sy <= y and sx + sibling["width"] >= x + node["width"] and sy + sibling["height"] >= y + node["height"]:
            fill = solid_color(sibling)
            if fill:
                return fill
    return solid_color(parent) or background_for(parent)


text_count = interactions = 0
contrast_ratios = []
for node in nodes.values():
    if node.get("interactions"):
        assert min(node["width"], node["height"]) >= 48, (node["name"], "small target")
    for interaction in node.get("interactions", []):
        interactions += 1
        for action in interaction.get("actions", []):
            if action["type"] == "navigate":
                assert action["dest"] in nodes, action
                assert nodes[action["dest"]]["type"] == "frame", action
    if node["type"] != "text":
        continue
    text_count += 1
    assert "—" not in node["characters"]
    parent = nodes.get(node.get("parent"))
    if not parent or parent["type"] == "page":
        continue
    x, y = node["transform"][4:6]
    assert x >= -0.1 and y >= -0.1, node["name"]
    assert x + node["width"] <= parent["width"] + 0.1, node["name"]
    assert y + node["height"] <= parent["height"] + 0.1, node["name"]
    background = background_for(node)
    foreground = solid_color(node)
    if foreground and background:
        a, b = sorted([luminance(foreground), luminance(background)])
        ratio = (b + 0.05) / (a + 0.05)
        size = node["style"]["font_size"]
        weight = node["style"].get("variations", {}).get("wght", 400)
        threshold = 3 if size >= 24 or (size >= 18.67 and weight >= 700) else 4.5
        assert ratio >= threshold, (node["name"], ratio, threshold)
        contrast_ratios.append(ratio)

assert interactions == manifest["interactionCount"]
result = {
    "scope": "serialized design only; no native application runtime validation",
    "screens": len(screens), "pages": len(document["pages"]),
    "textNodes": text_count, "interactions": interactions,
    "brokenNavigationTargets": 0, "textOutsideParentBounds": 0,
    "interactiveTargetsBelow48": 0,
    "contrastPairsChecked": len(contrast_ratios),
    "minimumTextContrast": round(min(contrast_ratios), 2),
    "limits": ["Solid ancestor and covering sibling surface calculation; raster artwork excluded.",
               "Bounds do not detect every sibling overlap. Batched visual inspection supplements this check.",
               "Only selected prototype paths were exercised. Form input and filters use fixed illustrative states.",
               "TalkBack, text scaling, native keyboard, device behavior and real services remain unverified."]
}
(ROOT / "verification.json").write_text(json.dumps(result, indent=2))
print(json.dumps(result, indent=2))
