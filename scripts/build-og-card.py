#!/usr/bin/env python3
"""Build the wordless 1200 x 630 blockDAG social card and its PNG copy."""
import os
import shutil
import subprocess

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PNG_NAME = "og-kaspa-explained.png"


def rasterize(root, svg_path):
    if not os.path.exists(CHROME):
        print("skip PNG: Chrome not found at", CHROME)
        return None
    out = os.path.join(root, PNG_NAME)
    tmp = os.path.join(root, ".og-shot.png")
    subprocess.run([
        CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
        f"--screenshot={tmp}", f"--window-size={W},{H}",
        "file://" + svg_path,
    ], check=True, capture_output=True)
    shutil.move(tmp, out)
    print("wrote", out)
    return out

BG = "#0a0b0b"
ACCENT = "#6fc7ba"
DANGER = "#ef8f84"
LINE = "#3b403d"

# Each tuple is (block id, red classification).
GENS = [
    [("a", False)],
    [("b", False), ("c", False)],
    [("d", False), ("e", False), ("f", False)],
    [("g", False), ("h", True)],
    [("i", False)],
]
# child -> parents it references
EDGES = {
    "b": ["a"], "c": ["a"],
    "d": ["b"], "e": ["b", "c"], "f": ["c"],
    "g": ["d", "e"], "h": ["f"],
    "i": ["g", "h"],
}

W, H = 1200, 630
BW, BH, R = 104, 74, 18
X0, XSTEP = 132, 234
YMID, YSTEP = 328, 158


def positions():
    pos = {}
    for gi, gen in enumerate(GENS):
        x = X0 + gi * XSTEP
        n = len(gen)
        for bi, (bid, red) in enumerate(gen):
            y = YMID + (bi - (n - 1) / 2) * YSTEP
            pos[bid] = (x, y, red)
    return pos


def build():
    pos = positions()
    out = []
    out.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}" role="img" '
        f'aria-label="A blockDAG with one block marked red. The red block keeps '
        f'its place, its parents and its transactions.">'
    )
    out.append(f'<rect width="{W}" height="{H}" fill="{BG}"/>')

    # Draw edges before blocks so each parent relationship stays legible.
    def edge_path(child, parent):
        cx, cy, _ = pos[child]
        px, py, _ = pos[parent]
        x1, y1 = px + BW / 2, py
        x2, y2 = cx - BW / 2, cy
        mid = (x1 + x2) / 2
        return (f'M{x1:.0f} {y1:.0f} C{mid:.0f} {y1:.0f} '
                f'{mid:.0f} {y2:.0f} {x2:.0f} {y2:.0f}')

    red_ids = {block_id for generation in GENS for block_id, is_red in generation if is_red}
    out.append(f'<g stroke="{LINE}" stroke-width="5" fill="none">')
    for child, parents in EDGES.items():
        for p in parents:
            if child in red_ids or p in red_ids:
                continue
            out.append(f'<path d="{edge_path(child, p)}"/>')
    out.append('</g>')
    out.append(f'<g stroke="{DANGER}" stroke-width="9" fill="none">')
    for child, parents in EDGES.items():
        for p in parents:
            if child in red_ids or p in red_ids:
                out.append(f'<path d="{edge_path(child, p)}"/>')
    out.append('</g>')

    for x, y, red in pos.values():
        out.append(
            f'<rect x="{x - BW/2:.0f}" y="{y - BH/2:.0f}" width="{BW}" '
            f'height="{BH}" rx="{R}" fill="{DANGER if red else ACCENT}"/>'
        )

    out.append('</svg>')
    return "\n".join(out) + "\n"


if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dest = os.path.join(root, "og-kaspa-explained.svg")
    with open(dest, "w", encoding="utf-8") as fh:
        fh.write(build())
    print("wrote", dest)
    rasterize(root, dest)
