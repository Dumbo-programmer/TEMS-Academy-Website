"""Pin the optical-size axis of the self-hosted variable fonts.

The Google Fonts builds in assets/fonts/ carry both a weight axis (kept, so the
design system can use the full range) and an optical-size axis. Pinning the
optical-size axis removes a large amount of variation data from each file,
which measurably shortens the font swap that delays the hero headline on slow
connections. The weight axis is untouched.

Run from the repository root:

    python scripts/prepare-fonts.py

The script is idempotent: files that no longer have an `opsz` axis are skipped.
"""

from __future__ import annotations

import os
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "assets" / "fonts"

OPTICAL_SIZE = {
    "source-serif-latin.woff2": 24,
    "source-serif-italic-latin.woff2": 24,
    "dm-sans-latin.woff2": 16,
    "dm-sans-italic-latin.woff2": 16,
}


def pin_optical_size(path: Path, value: int) -> bool:
    font = TTFont(path)
    if "fvar" not in font:
        return False
    axes = {axis.axisTag for axis in font["fvar"].axes}
    if "opsz" not in axes:
        return False

    instantiateVariableFont(font, {"opsz": value}, inplace=True, updateFontNames=False)
    font.flavor = "woff2"
    temporary = path.with_suffix(".tmp.woff2")
    font.save(temporary)
    font.close()
    os.replace(temporary, path)
    return True


changed = 0
for filename, value in OPTICAL_SIZE.items():
    path = FONTS / filename
    if not path.exists():
        raise SystemExit(f"Missing font: {path}")
    if pin_optical_size(path, value):
        changed += 1
        print(f"Pinned opsz={value}: {filename} ({path.stat().st_size:,} bytes)")

if not changed:
    print("All fonts already have a single optical size.")
