"""Light-led effects from the style pack (doc 04 §10): gold blow-out, muzzle flash,
glow pulses, cold flip, dust, smoke, vignette."""
import math
import numpy as np
from PIL import Image, ImageFilter
from .util import W, H, Pen, to_f, radial_alpha, screen, GOLD_HOT, COBALT, vignette_mask, INDIGO

_rng_cache = {}


def gold_blowout(arr, k, cx=W / 2, cy=H / 2):
    """Radial #FFE9A8 additive flood; k 0..1 (1 = full frame near white-gold)."""
    if k <= 0:
        return arr
    r = 200 + 2400 * k
    m = radial_alpha(W, H, cx, cy, r, r, 1.0, 0.0, 1.0 + 1.5 * (1 - k))[..., None] * min(1.0, k * 1.4)
    gold = np.array(GOLD_HOT, np.float32) / 255
    out = 1 - (1 - arr) * (1 - gold * m)
    white = np.array([1.0, 0.98, 0.9], np.float32)
    wk = max(0.0, (k - 0.6) / 0.4) ** 1.5
    return out * (1 - wk) + white * wk


def muzzle_flash(arr, k, x, y, size):
    """Gold star burst + glow at (x, y) on screen. k 0..1 intensity."""
    if k <= 0:
        return arr
    p = Pen(W, H)
    n = 8
    pts = []
    for i in range(n * 2):
        rr = size * k if i % 2 == 0 else size * 0.35 * k
        a = math.radians(i * 180.0 / n + 11)
        pts.append((x + rr * math.cos(a), y + rr * math.sin(a)))
    p.poly(pts, fill=(255, 238, 180))
    p.ellipse(x, y, size * 0.32 * k, size * 0.32 * k, fill=(255, 255, 245))
    img = p.image()
    a = to_f(img)
    arr = arr * (1 - a[..., 3:4]) + a[..., :3] * a[..., 3:4]
    g = img.filter(ImageFilter.GaussianBlur(size * 0.5))
    ga = to_f(g)
    arr = screen(arr, ga[..., :3] * ga[..., 3:4], 1.0)
    return arr


def point_glows(arr, glows, scale=1.0):
    """glows: list of (x, y, r, rgb, k) in screen px -> soft additive radial glows."""
    for (x, y, r, col, k) in glows:
        if k <= 0:
            continue
        r = r * scale
        x0, x1 = int(max(0, x - r * 3)), int(min(W, x + r * 3))
        y0, y1 = int(max(0, y - r * 3)), int(min(H, y + r * 3))
        if x1 <= x0 or y1 <= y0:
            continue
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        d2 = ((xx - x) ** 2 + (yy - y) ** 2) / (r * r)
        m = (np.exp(-d2 * 0.9) * k)[..., None]
        c = np.array(col, np.float32) / 255
        arr[y0:y1, x0:x1] = 1 - (1 - arr[y0:y1, x0:x1]) * (1 - c * m)
    return arr


def cold_flip_chars(rgba_img, k):
    """Pull character colours toward cobalt (cold light) by k."""
    if k <= 0:
        return rgba_img
    a = to_f(rgba_img)
    cob = np.array([92, 110, 210], np.float32) / 255
    lum = a[..., :3].mean(-1, keepdims=True)
    a[..., :3] = a[..., :3] * (1 - 0.55 * k) + (cob * (0.35 + 0.9 * lum)) * 0.55 * k
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), 'RGBA')


def dust(arr, f, n=70, seed=1, color=(255, 214, 160), strength=0.55, drift=(1.2, -0.25)):
    """Floating dust motes, deterministic per frame."""
    key = (n, seed)
    if key not in _rng_cache:
        rng = np.random.default_rng(seed)
        _rng_cache[key] = (rng.uniform(0, W, n), rng.uniform(0, H, n), rng.uniform(1.5, 5.0, n),
                           rng.uniform(0, 6.28, n), rng.uniform(0.3, 1.0, n))
    xs, ys, rs, ph, br = _rng_cache[key]
    glows = []
    for i in range(n):
        x = (xs[i] + f * drift[0] * (rs[i] / 3) + 18 * math.sin(f * 0.05 + ph[i])) % W
        y = (ys[i] + f * drift[1] * (rs[i] / 3) + 10 * math.cos(f * 0.04 + ph[i])) % H
        glows.append((x, y, rs[i] * 1.4, color, strength * br[i] * (0.6 + 0.4 * math.sin(f * 0.2 + ph[i]))))
    return point_glows(arr, glows)


def smoke(pen, x, y, t, scale=1.0, col=(210, 200, 225)):
    """Gun-smoke wisps drawn into a Pen (t = seconds since shot)."""
    for i in range(7):
        tt = t - i * 0.07
        if tt <= 0:
            continue
        r = (10 + 26 * tt) * scale
        yy = y - (40 * tt + i * 14) * scale
        xx = x + math.sin(tt * 3 + i) * 14 * scale
        a = int(max(0, 150 - 110 * tt - i * 12))
        if a > 0:
            pen.ellipse(xx, yy, r, r * 0.9, fill=col + (a,))


def finish(arr, vig, indigo=0.6):
    """Common finishing in-render: indigo-lifted blacks + vignette (pack: never pure black)."""
    ind = np.array(INDIGO, np.float32) / 255
    arr = arr * vignette_mask(vig)
    arr = np.maximum(arr, ind * indigo + arr * (1 - indigo))
    return arr
