"""Generate responsive WebP derivatives and social/icon assets from the real
photographs supplied for the TEMS Academy site.

Source photographs live in images/_live/ and are the same files published on the
current live site. Run from the repository root:

    python scripts/prepare-images.py
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "images" / "_live"
OUT = ROOT / "assets" / "img"
OUT.mkdir(parents=True, exist_ok=True)

# slug -> (source file, widths, crop ratio for the social card)
PHOTOS = {
    "chairman-bdmso": ("Chairman with bdmso winners.jpg", [480, 800, 1200, 1600]),
    "classroom": ("Students in classroom 1.jpg", [480, 800, 1200, 1600]),
    "teacher": ("teacher teaching in class.jpg", [480, 800, 1200, 1600]),
    "ijso-silver": ("Ijso Silver.jpg", [480, 800, 1200]),
    "imso-winners": ("IMSO winers frm bangladesh.jpg", [480, 800]),
    "nabeh-bdmso": ("nabeh bdmso champion with tems chairman.jpg", [480, 800]),
    "physics-winners": ("Phy_oly_winners landscape.jpg", [480, 800, 1200, 1600]),
    "math-winners": ("Mayth oly winners landscape.jpg", [480, 800]),
    "scholarship": ("Chairman giving prizemoney to students.jpg", [480, 800, 1200]),
    "lab-class": ("LAB STUDENTS IN CLASS.jpg", [480, 800, 1200, 1600]),
    "lab-two": ("Labpic2.jpg", [480, 800, 1200]),
    "lab-one": ("lab pic one.jpg", [480, 800, 1200]),
    "lab-exam": ("lab students in exam.jpg", [480, 800, 1200, 1600]),
    "pi-day-one": ("pidaycelebration1.jpg", [480, 800, 1200]),
    "pi-day-two": ("pidaycelebration2.jpg", [480, 800, 1200]),
    "exam-one": ("Students focused in exams in tems.jpg", [480, 800, 1200, 1600]),
    "exam-two": ("Students focused in exams in xm 3.jpg", [480, 800, 1200, 1600]),
}

manifest: dict[str, dict] = {}

for slug, (filename, widths) in PHOTOS.items():
    source = SRC / filename
    if not source.exists():
        raise SystemExit(f"Missing source photo: {source}")
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
    sources = []
    for width in widths:
        if width > image.width:
            continue
        height = round(image.height * width / image.width)
        webp = OUT / f"{slug}-{width}.webp"
        avif = OUT / f"{slug}-{width}.avif"
        resized = image.resize((width, height), Image.Resampling.LANCZOS)
        resized.save(webp, "WEBP", quality=82, method=6)
        resized.save(avif, "AVIF", quality=58, speed=7)
        sources.append(
            {
                "width": width,
                "height": height,
                "webp": f"assets/img/{webp.name}",
                "avif": f"assets/img/{avif.name}",
            }
        )
    if not sources:
        width = image.width
        height = image.height
        webp = OUT / f"{slug}-{width}.webp"
        avif = OUT / f"{slug}-{width}.avif"
        image.save(webp, "WEBP", quality=82, method=6)
        image.save(avif, "AVIF", quality=58, speed=7)
        sources.append(
            {
                "width": width,
                "height": height,
                "webp": f"assets/img/{webp.name}",
                "avif": f"assets/img/{avif.name}",
            }
        )
    largest = sources[-1]
    manifest[slug] = {
        "width": largest["width"],
        "height": largest["height"],
        "src": largest["webp"],
        "sources": sources,
        "alt": "",
    }

# Social card: crop the champion photograph to the standard 1200x630 canvas.
with Image.open(SRC / "Chairman with bdmso winners.jpg") as opened:
    card = ImageOps.exif_transpose(opened).convert("RGB")
card = ImageOps.fit(card, (1200, 630), method=Image.Resampling.LANCZOS, centering=(0.5, 0.42))
card.save(OUT / "og-image.jpg", "JPEG", quality=86, optimize=True, progressive=True)

# Logo icons. The 2048px transparent mark is the cleanest supplied asset.
with Image.open(ROOT / "TEMS Logo - main transparent.png") as opened:
    logo = ImageOps.exif_transpose(opened).convert("RGBA")
bbox = logo.getbbox()
if bbox:
    logo = logo.crop(bbox)
for size, name in [(32, "favicon-32.png"), (180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")]:
    icon = ImageOps.contain(logo, (size, size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(icon, ((size - icon.width) // 2, (size - icon.height) // 2))
    canvas.save(OUT / name, "PNG", optimize=True)
# Small responsive logo marks for the header and footer.
logo_sources = []
for size in (96, 160):
    icon = ImageOps.contain(logo, (size, size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(icon, ((size - icon.width) // 2, (size - icon.height) // 2))
    webp = OUT / f"logo-{size}.webp"
    avif = OUT / f"logo-{size}.avif"
    canvas.save(webp, "WEBP", quality=90, method=6)
    canvas.save(avif, "AVIF", quality=70, speed=7)
    logo_sources.append(
        {
            "width": size,
            "height": size,
            "webp": f"assets/img/{webp.name}",
            "avif": f"assets/img/{avif.name}",
        }
    )
manifest["logo"] = {
    "width": 160,
    "height": 160,
    "src": "assets/img/logo-160.webp",
    "sources": logo_sources,
    "alt": "",
}

(ROOT / "data" / "images.json").write_text(
    json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
)
print(f"Wrote {len(manifest)} photo sets to {OUT}")
