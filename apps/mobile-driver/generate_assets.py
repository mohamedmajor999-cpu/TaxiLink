"""
Generates placeholder Expo assets for apps/mobile-driver.

Files:
- assets/icon.png            1024x1024  (App icon iOS + Android legacy)
- assets/adaptive-icon.png   1024x1024  (Android adaptive icon foreground)
- assets/splash.png          1284x2778  (iPhone Pro Max portrait — Expo handles smaller via resizeMode)
- assets/favicon.png         48x48      (PWA / web fallback, optionnel)

Style placeholder : fond jaune TaxiLink #FFD23F + lettres "TL" centrees noires.
Sera remplace en Phase 1 Sem 11 par le vrai design icon (logo wordmark Plus Jakarta Sans + i-stems custom).
"""
import os
from PIL import Image, ImageDraw, ImageFont

YELLOW = (255, 210, 63)
DARK = (26, 26, 26)
PAPER = (255, 255, 255)

ASSETS_DIR = os.path.join(os.path.dirname(__file__), 'assets')
os.makedirs(ASSETS_DIR, exist_ok=True)


def find_bold_font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        'C:/Windows/Fonts/arialbd.ttf',
        'C:/Windows/Fonts/Arial Bold.ttf',
        'C:/Windows/Fonts/Calibri-Bold.ttf',
        'C:/Windows/Fonts/Tahoma.ttf',
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_centered_text(img: Image.Image, text: str, color: tuple, font: ImageFont.FreeTypeFont) -> None:
    draw = ImageDraw.Draw(img)
    w, h = img.size
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (w - tw) // 2 - bbox[0]
    y = (h - th) // 2 - bbox[1]
    draw.text((x, y), text, fill=color, font=font)


def make_icon(path: str, size: int = 1024, bg: tuple = YELLOW, text: str = 'TL') -> None:
    img = Image.new('RGB', (size, size), bg)
    font = find_bold_font(size // 2)
    draw_centered_text(img, text, DARK, font)
    img.save(path, 'PNG', optimize=True)
    print(f'[ok] {path}  {size}x{size}  {os.path.getsize(path)/1024:.1f} KB')


def make_adaptive_icon(path: str, size: int = 1024) -> None:
    """Android adaptive icon foreground : transparent background + safe zone 66% au centre."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    safe_radius = int(size * 0.33)
    cx, cy = size // 2, size // 2
    draw.ellipse(
        [cx - safe_radius, cy - safe_radius, cx + safe_radius, cy + safe_radius],
        fill=YELLOW,
    )
    font = find_bold_font(size // 3)
    draw_centered_text(img, 'TL', DARK, font)
    img.save(path, 'PNG', optimize=True)
    print(f'[ok] {path}  {size}x{size} (adaptive)  {os.path.getsize(path)/1024:.1f} KB')


def make_splash(path: str, w: int = 1284, h: int = 2778, bg: tuple = YELLOW) -> None:
    """Splash screen plein ecran. Expo l'affiche centre puis fade-out."""
    img = Image.new('RGB', (w, h), bg)
    font = find_bold_font(min(w, h) // 6)
    draw_centered_text(img, 'TaxiLink', DARK, font)
    img.save(path, 'PNG', optimize=True)
    print(f'[ok] {path}  {w}x{h}  {os.path.getsize(path)/1024:.1f} KB')


def make_favicon(path: str, size: int = 48) -> None:
    img = Image.new('RGB', (size, size), YELLOW)
    font = find_bold_font(size // 2)
    draw_centered_text(img, 'T', DARK, font)
    img.save(path, 'PNG', optimize=True)
    print(f'[ok] {path}  {size}x{size}  {os.path.getsize(path)/1024:.1f} KB')


def main() -> None:
    make_icon(os.path.join(ASSETS_DIR, 'icon.png'))
    make_adaptive_icon(os.path.join(ASSETS_DIR, 'adaptive-icon.png'))
    make_splash(os.path.join(ASSETS_DIR, 'splash.png'))
    make_favicon(os.path.join(ASSETS_DIR, 'favicon.png'))
    print('Done.')


if __name__ == '__main__':
    main()
