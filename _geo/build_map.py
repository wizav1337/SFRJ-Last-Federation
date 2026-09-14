"""
Build a game-ready SFRJ 1990 SVG from Wikimedia Commons
'Yugoslavia, administrative divisions - es - colored (1946-1974).svg'
(CC BY 4.0, User:Milenioscuro). Geographic borders of the six republics
and two autonomous provinces are those of 1946–1990 / 1990 SFRJ.
"""
from __future__ import annotations

import math
import re
import xml.etree.ElementTree as ET
from pathlib import Path

SRC = Path("wiki_admin.svg")
OUT = Path("../assets/map.svg")

SVG_NS = "http://www.w3.org/2000/svg"
INK = "http://www.inkscape.org/namespaces/inkscape"

# 1990 names only on the live map.
UNIT_META = {
    "SI": {"name": "SR Slovenia", "capital": "Ljubljana"},
    "HR": {"name": "SR Croatia", "capital": "Zagreb"},
    "BA": {"name": "SR Bosnia and Herzegovina", "short": "SR BiH", "capital": "Sarajevo"},
    "RS": {"name": "SR Serbia", "capital": "Belgrade"},
    "ME": {"name": "SR Montenegro", "capital": "Titograd"},
    "MK": {"name": "SR Macedonia", "capital": "Skopje"},
    "VO": {"name": "SAP Vojvodina", "capital": "Novi Sad"},
    "XK": {"name": "SAP Kosovo", "capital": "Priština"},
}

# Approximate capital positions in the Wikimedia location-map projection
# (lon/lat → the same viewBox as the source SVG). Tuned after first pass
# against known city locations.
CAPITALS_LL = {
    "SI": (14.505, 46.056),   # Ljubljana
    "HR": (15.982, 45.815),   # Zagreb
    "BA": (18.413, 43.856),   # Sarajevo
    "RS": (20.462, 44.817),   # Belgrade
    "ME": (19.263, 42.441),   # Titograd / Podgorica
    "MK": (21.432, 41.998),   # Skopje
    "VO": (19.833, 45.255),   # Novi Sad
    "XK": (21.166, 42.663),   # Priština
}

# Source map is a Wikipedia location map of Yugoslavia 1946–1990.
# Standard Wikimedia geo model for that file (equirectangular-like
# with the published geo="..." on related location maps):
# File:Yugoslavia (1946-1990) location map.svg uses:
# top=46.9 bottom=40.85 left=13.4 right=23.05  (typical for this series)
# We'll fit lon/lat → SVG using the subdivision bboxes vs known geography.

TOKEN = re.compile(
    r"([MmLlHhVvCcSsQqTtAaZz])|([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)"
)


def tokenize(d: str):
    for m in TOKEN.finditer(d):
        cmd, num = m.group(1), m.group(2)
        if cmd:
            yield cmd
        else:
            yield float(num)


def path_points(d: str):
    """Walk an SVG path; yield (x,y) including curve control points."""
    tokens = list(tokenize(d))
    i = 0
    cx = cy = 0.0
    sx = sy = 0.0
    last_c = None
    pts = []

    def add(x, y):
        pts.append((x, y))

    def take(n):
        nonlocal i
        vals = tokens[i : i + n]
        i += n
        return vals

    while i < len(tokens):
        t = tokens[i]
        if isinstance(t, str):
            cmd = t
            i += 1
        else:
            # implicit command repeat
            cmd = last_c
        last_c = cmd if cmd not in "Zz" else last_c
        abs_cmd = cmd.upper()
        rel = cmd.islower()

        def xy():
            x, y = take(2)
            if rel:
                return cx + x, cy + y
            return x, y

        if abs_cmd == "M":
            x, y = xy()
            cx, cy = x, y
            sx, sy = x, y
            add(cx, cy)
            last_c = "l" if rel else "L"
            while i < len(tokens) and not isinstance(tokens[i], str):
                x, y = xy()
                cx, cy = x, y
                add(cx, cy)
        elif abs_cmd == "L":
            while i < len(tokens) and not isinstance(tokens[i], str):
                x, y = xy()
                cx, cy = x, y
                add(cx, cy)
        elif abs_cmd == "H":
            while i < len(tokens) and not isinstance(tokens[i], str):
                x = take(1)[0]
                cx = cx + x if rel else x
                add(cx, cy)
        elif abs_cmd == "V":
            while i < len(tokens) and not isinstance(tokens[i], str):
                y = take(1)[0]
                cy = cy + y if rel else y
                add(cx, cy)
        elif abs_cmd == "C":
            while i < len(tokens) and not isinstance(tokens[i], str):
                x1, y1 = xy()
                x2, y2 = xy()
                x, y = xy()
                add(x1, y1)
                add(x2, y2)
                cx, cy = x, y
                add(cx, cy)
        elif abs_cmd == "S":
            while i < len(tokens) and not isinstance(tokens[i], str):
                x2, y2 = xy()
                x, y = xy()
                add(x2, y2)
                cx, cy = x, y
                add(cx, cy)
        elif abs_cmd == "Q":
            while i < len(tokens) and not isinstance(tokens[i], str):
                x1, y1 = xy()
                x, y = xy()
                add(x1, y1)
                cx, cy = x, y
                add(cx, cy)
        elif abs_cmd == "T":
            while i < len(tokens) and not isinstance(tokens[i], str):
                x, y = xy()
                cx, cy = x, y
                add(cx, cy)
        elif abs_cmd == "A":
            while i < len(tokens) and not isinstance(tokens[i], str):
                _rx, _ry, _ang, _large, _sweep = take(5)
                x, y = xy()
                cx, cy = x, y
                add(cx, cy)
        elif abs_cmd == "Z":
            cx, cy = sx, sy
            add(cx, cy)
        else:
            raise RuntimeError(f"unknown cmd {cmd}")
    return pts


def bbox(pts):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def centroid(pts):
    # average of points is good enough to ID a region
    return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)


def layer(root, name):
    for g in root.iter(f"{{{SVG_NS}}}g"):
        if g.attrib.get(f"{{{INK}}}label") == name:
            return g
    raise KeyError(name)


def path_d(el):
    return el.attrib.get("d", "")


def geom_d(el):
    tag = el.tag.split("}")[-1]
    if tag == "path":
        return el.attrib.get("d", "")
    if tag in ("polyline", "polygon"):
        pts = el.attrib.get("points", "").strip()
        if not pts:
            return ""
        joined = " L ".join(pts.split())
        if tag == "polygon":
            return f"M {joined} Z"
        return f"M {joined}"
    return ""


def layer_ds(root, name):
    g = layer(root, name)
    out = []
    for el in list(g):
        d = geom_d(el)
        if d:
            out.append(d)
    return out


# Cartographer-placed name anchors from the source SVG (Spanish labels).
LABEL_ANCHORS = {
    "SI": (127.60, 173.43),
    "HR": (371.07, 251.93),
    "BA": (519.42, 470.04),
    "RS": (898.74, 533.12),
    "ME": (672.83, 709.41),
    "MK": (970.89, 918.85),
    "VO": (791.12, 262.23),
    "XK": (892.88, 743.20),
}


def identify_units(sub_paths):
    """Assign each subdivision path to a unit by nearest label anchor."""
    stats = []
    for el in sub_paths:
        d = path_d(el)
        pts = path_points(d)
        bb = bbox(pts)
        cx, cy = centroid(pts)
        stats.append(
            {
                "el": el,
                "d": d,
                "id": el.attrib.get("id"),
                "bb": bb,
                "c": (cx, cy),
                "area": (bb[2] - bb[0]) * (bb[3] - bb[1]),
                "n": len(pts),
            }
        )

    uids = list(LABEL_ANCHORS)
    best = None
    for perm in __import__("itertools").permutations(range(len(stats))):
        cost = 0.0
        for uid, idx in zip(uids, perm):
            ax, ay = LABEL_ANCHORS[uid]
            cx, cy = stats[idx]["c"]
            cost += math.hypot(cx - ax, cy - ay)
        if best is None or cost < best[0]:
            best = (cost, perm)
    mapping = {uid: stats[idx] for uid, idx in zip(uids, best[1])}
    print(f"assignment cost {best[0]:.1f}")
    return mapping


def compact_path(d: str) -> str:
    d = re.sub(r"\s+", " ", d).strip()
    d = d.replace(" ,", ",").replace(", ", ",")
    return d


def main():
    tree = ET.parse(SRC)
    root = tree.getroot()
    subs = [p for p in list(layer(root, "Subdivisions")) if p.tag.endswith("path")]
    assert len(subs) == 8, len(subs)
    units = identify_units(subs)

    print("Identified units:")
    for uid, s in units.items():
        bb = s["bb"]
        print(
            f"  {uid:2}  c=({s['c'][0]:7.1f},{s['c'][1]:7.1f})  "
            f"bbox=({bb[0]:.0f},{bb[1]:.0f})-({bb[2]:.0f},{bb[3]:.0f})  pts={s['n']}"
        )

    water = layer_ds(root, "Waterbodies")
    coast = layer_ds(root, "Coast")
    subdiv_borders = layer_ds(root, "Borders Subdivisions")
    country_borders = layer_ds(root, "Borders Countries")

    # Crop to Yugoslavia + a little sea/neighbors. Source viewBox is the
    # full locator frame including Italy/Hungary/Greece labels.
    # Keep the original viewBox so coast and Adriatic sit correctly,
    # then the game CSS can object-fit the SVG.
    vb = "0 0 1219.65 1057.485"

    # Neighbor country names (1990 neighbours), not successor-state flags.
    neighbor_labels = [
        (200, 48, "AUSTRIA"),
        (180, 980, "ITALY"),
        (620, 42, "HUNGARY"),
        (1145, 250, "ROMANIA"),
        (1168, 735, "BULGARIA"),
        (1105, 1025, "GREECE"),
        (780, 990, "ALBANIA"),
        (300, 880, "ADRIATIC SEA"),
    ]

    label_xy = {
        "SI": (190, 145),
        "HR": (340, 220),
        "BA": (530, 480),
        "VO": (830, 250),
        "RS": (920, 530),
        "ME": (720, 730),
        "XK": (920, 750),
        "MK": (1000, 910),
    }

    parts = []
    parts.append(
        f'''<?xml version="1.0" encoding="UTF-8"?>
<!--
  Borders traced from Wikimedia Commons:
  "Yugoslavia, administrative divisions - es - colored (1946-1974).svg"
  by User:Milenioscuro, CC BY 4.0.
  Geographic outlines of the six republics and two autonomous provinces
  are the 1946–1990 / 1990 SFRJ boundaries (unchanged through 1990).
-->
<svg viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Political map of SFRJ, 1990">
  <defs>
    <filter id="paper" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.06"/></feComponentTransfer>
    </filter>
  </defs>
  <rect width="1219.65" height="1057.485" fill="#2c3c48"/>
  <rect width="1219.65" height="1057.485" fill="#cfc8b8"/>
  <rect width="1219.65" height="1057.485" filter="url(#paper)" fill="#fff" pointer-events="none"/>
'''
    )

    # Water (Adriatic + lakes) over the land wash.
    parts.append('  <g id="water" fill="#3a4d5c" fill-rule="evenodd" stroke="none">\n')
    for d in water:
        parts.append(f'    <path d="{compact_path(d)}"/>\n')
    parts.append("  </g>\n")

    # Units — fill is painted at runtime; default grey so the file is readable alone.
    parts.append(
        '  <g id="units" fill="#7a756c" stroke="#2a241c" stroke-width="1.1" '
        'stroke-linejoin="round" fill-rule="evenodd">\n'
    )
    # Paint order: large coastal republics first so small provinces stay on top for hits.
    order = ["HR", "BA", "RS", "SI", "MK", "ME", "VO", "XK"]
    for uid in order:
        s = units[uid]
        meta = UNIT_META[uid]
        parts.append(
            f'    <path id="unit-{uid}" class="unit-hit" data-unit="{uid}" tabindex="0" '
            f'aria-label="{meta["name"]}" d="{compact_path(s["d"])}"/>\n'
        )
    parts.append("  </g>\n")

    # Internal republic/province borders, slightly stronger than fill stroke.
    parts.append(
        '  <g id="internal-borders" fill="none" stroke="#2a241c" stroke-width="1.35" '
        'stroke-linejoin="round" stroke-linecap="round" pointer-events="none">\n'
    )
    for d in subdiv_borders:
        parts.append(f'    <path d="{compact_path(d)}"/>\n')
    parts.append("  </g>\n")

    parts.append(
        '  <g id="outer-borders" fill="none" stroke="#1a140c" stroke-width="1.8" '
        'stroke-linejoin="round" pointer-events="none">\n'
    )
    for d in country_borders:
        parts.append(f'    <path d="{compact_path(d)}"/>\n')
    parts.append("  </g>\n")

    parts.append(
        '  <g id="coast" fill="none" stroke="#1b2a4a" stroke-width="1.15" '
        'stroke-linejoin="round" pointer-events="none">\n'
    )
    for d in coast:
        parts.append(f'    <path d="{compact_path(d)}"/>\n')
    parts.append("  </g>\n")

    parts.append(
        '  <g pointer-events="none">\n'
        '    <rect x="16" y="14" width="455" height="54" fill="#101828" fill-opacity="0.88"/>\n'
        '    <text x="28" y="36" fill="#c4a35a" font-family="IBM Plex Mono, Consolas, monospace" '
        'font-size="15" letter-spacing="2.2">SFRJ 1990 — FEDERAL MAP</text>\n'
        '    <text x="28" y="56" fill="#d8ccb4" font-family="Libre Baskerville, Georgia, serif" '
        'font-size="14">Socialist Federal Republic of Yugoslavia</text>\n'
        '  </g>\n'
    )

    parts.append(
        '  <g id="neighbors" fill="#8a9aaa" font-family="IBM Plex Sans, Arial, sans-serif" '
        'font-size="14" letter-spacing="1.4" pointer-events="none">\n'
    )
    for x, y, name in neighbor_labels:
        if name == "ADRIATIC SEA":
            parts.append(
                f'    <text x="{x}" y="{y}" fill="#9bb0bc" font-style="italic" '
                f'letter-spacing="2.2" font-size="18">{name}</text>\n'
            )
        else:
            parts.append(f'    <text x="{x}" y="{y}" text-anchor="middle">{name}</text>\n')
    parts.append("  </g>\n")

    parts.append(
        '  <g id="labels" fill="#1a1a1a" stroke="#f7f1e3" stroke-width="3.5" paint-order="stroke" '
        'font-family="Libre Baskerville, Georgia, serif" pointer-events="none">\n'
    )
    for uid, (x, y) in label_xy.items():
        meta = UNIT_META[uid]
        title = meta.get("short", meta["name"])
        size = 15 if uid not in ("VO", "XK", "ME") else 13
        parts.append(
            f'    <text data-label="{uid}" x="{x}" y="{y}" text-anchor="middle" '
            f'font-size="{size}" font-weight="700">{title}</text>\n'
            f'    <text data-label="{uid}" x="{x}" y="{y + 16}" text-anchor="middle" '
            f'font-size="11">{meta["capital"]}</text>\n'
        )
    parts.append("  </g>\n")

    # Capitals sit inside each 1990 unit (Belgrade south of Vojvodina).
    capital_xy = {
        "SI": (195, 145),
        "HR": (325, 195),
        "BA": (555, 530),
        "VO": (825, 305),
        "RS": (875, 445),
        "ME": (710, 775),
        "XK": (915, 750),
        "MK": (1025, 880),
    }
    parts.append('  <g id="capitals" fill="#1a1a1a" pointer-events="none">\n')
    for uid, (x, y) in capital_xy.items():
        parts.append(f'    <circle data-cap="{uid}" cx="{x}" cy="{y}" r="3.2"/>\n')
    parts.append("  </g>\n")
    parts.append("</svg>\n")

    OUT.write_text("".join(parts), encoding="utf-8")
    print("wrote", OUT, "bytes", OUT.stat().st_size)


if __name__ == "__main__":
    main()
