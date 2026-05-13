#!/usr/bin/env python3
"""
Convierte el logo de agencia a PNG (RGBA) y WebP para el sitio.

Uso (desde la raíz del repo):
  .venv-logo/bin/python scripts/convert-logo.py RUTA_A_TU_ARCHIVO

Opciones útiles si el archivo trae fondo negro plano:
  --transparent-black   Pone transparente los píxeles casi negros (RGB max < umbral)
  --threshold 32        Umbral 0-255 (por defecto 30). Sube si quedan restos de negro.

Salida (sobrescribe):
  images/subground-logo.png
  images/subground-logo.webp

Requisitos: crear el venv una vez en la raíz del proyecto:
  python3 -m venv .venv-logo
  .venv-logo/bin/pip install Pillow
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    out_png = root / "images" / "subground-logo.png"
    out_webp = root / "images" / "subground-logo.webp"

    parser = argparse.ArgumentParser(description="Convierte logo a PNG+WebP en images/")
    parser.add_argument("input", type=Path, help="Archivo fuente (.png, .jpg, .webp, etc.)")
    parser.add_argument(
        "--transparent-black",
        action="store_true",
        help="Hace transparentes los píxeles oscuros (logo sobre negro)",
    )
    parser.add_argument(
        "--threshold",
        type=int,
        default=30,
        help="Con --transparent-black: píxeles con max(R,G,B) <= umbral → transparente (default 30)",
    )
    args = parser.parse_args()

    src = args.input if args.input.is_absolute() else (Path.cwd() / args.input)
    if not src.is_file():
        print(f"No existe el archivo: {src}", file=sys.stderr)
        return 1

    im = Image.open(src)
    im = im.convert("RGBA")

    if args.transparent_black:
        thr = max(0, min(255, args.threshold))
        px = im.load()
        w, h = im.size
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if max(r, g, b) <= thr:
                    px[x, y] = (0, 0, 0, 0)

    out_png.parent.mkdir(parents=True, exist_ok=True)
    im.save(out_png, "PNG", optimize=True)
    im.save(out_webp, "WEBP", quality=88, method=6)

    print(f"OK → {out_png}")
    print(f"OK → {out_webp}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
