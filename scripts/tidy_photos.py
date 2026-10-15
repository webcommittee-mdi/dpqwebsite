"""
Tidies photos the Delphique team uploads, so the website stays fast to build.
Run automatically by .github/workflows/tidy-photos.yml after every upload.

  - iPhone HEIC/HEIF, JFIF, AVIF, TIFF, BMP  -> JPG (same name)
  - photos larger than 2500 px on the long side -> shrunk to 2500 px
  - sideways phone photos -> turned upright
  - "photo.jpg.jpg" -> "photo.jpg"

Files it can't open are left alone (the website skips them and lists them on /check).
Logos are only converted, never shrunk below 2500 px or turned into JPG if they're PNG/SVG.
"""
from pathlib import Path
import re
import sys

from PIL import Image, ImageOps

try:
    import pillow_heif

    pillow_heif.register_heif_opener()
except ImportError:  # HEIC support missing: those files are left for the website to convert
    pass

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else "content")
MAX = 2500
CONVERT = {".heic", ".heif", ".jfif", ".avif", ".tif", ".tiff", ".bmp"}
KEEP = {".jpg", ".jpeg", ".png", ".webp"}
changed = []


def clean_name(p: Path) -> Path:
    """'x.jpg.jpg' -> 'x.jpg', 'x.JPG ' -> 'x.JPG', '#' '%' '?' removed (they break web addresses)"""
    name = re.sub(r"(\.(jpe?g|png|webp|heic|heif))+$", lambda m: "." + m.group(2), p.name.strip(), flags=re.I)
    name = re.sub(r"\s*[#%?]\s*", " ", name).replace("  ", " ").strip()
    return p.with_name(name)


def free(target: Path, original: Path) -> Path:
    """Never overwrite a different file: 'IMG_1.jpg' taken -> 'IMG_1 (2).jpg'"""
    if target == original or not target.exists():
        return target
    n = 2
    while True:
        alt = target.with_name(f"{target.stem} ({n}){target.suffix}")
        if not alt.exists():
            return alt
        n += 1


for p in sorted(ROOT.rglob("*")):
    if not p.is_file() or p.name.startswith("."):
        continue
    ext = p.suffix.lower()
    if ext not in CONVERT and ext not in KEEP:
        continue
    try:
        with Image.open(p) as im:
            im.load()
            fixed = ImageOps.exif_transpose(im)
            rotated = fixed is not im and fixed.size != im.size or im.getexif().get(0x0112, 1) not in (1, None)
            too_big = max(fixed.size) > MAX
            target = clean_name(p)
            if ext in CONVERT:
                target = free(target.with_suffix(".jpg"), p)
            elif target != p and target.exists():
                target = p  # the tidy name is taken by another file: keep this name, just fix the photo
            if not (ext in CONVERT or too_big or rotated or target != p):
                continue
            out = fixed
            if too_big:
                out = out.copy()
                out.thumbnail((MAX, MAX), Image.LANCZOS)
            fmt = {".png": "PNG", ".webp": "WEBP"}.get(target.suffix.lower(), "JPEG")
            if fmt == "JPEG" and out.mode not in ("RGB", "L"):
                out = out.convert("RGB")
            save = {"quality": 86, "optimize": True} if fmt == "JPEG" else {"optimize": True} if fmt == "PNG" else {"quality": 86}
            out.save(target, fmt, **save)
        if target != p:
            p.unlink()
        changed.append(f"{p} -> {target.name}" if target != p else f"{p} (resized/rotated)")
    except Exception as e:  # not a readable image: leave it
        print(f"skipped {p}: {e}")

print("\n".join(changed) if changed else "nothing to tidy")
