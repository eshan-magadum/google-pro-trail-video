"""Shared drawing utilities: colours, easing, gradients, supersampled pen, blending.

Style tokens come from the Every_Memory_Has_a_Price style pack (docs 04 + 09).
"""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1080, 1920
FPS = 30
SS = 2  # supersampling factor for vector drawing (Pillow has no anti-aliasing)

# ---- colour tokens (style pack) -------------------------------------------
INDIGO = (15, 13, 37)        # #0F0D25 lifted indigo black
SLATE = (64, 56, 92)         # #40385C violet-slate mid
HONEY = (247, 217, 159)      # #F7D99F honey centre
ROYAL = (58, 68, 142)        # #3A448E royal-blue edge
PEACH_HI = (217, 197, 190)   # #D9C5BE peach highlight
GOLD = (181, 137, 85)        # #B58955
GOLD_HOT = (255, 233, 168)   # #FFE9A8
COBALT = (32, 50, 155)       # #20329B
COBALT_DEEP = (23, 24, 59)   # #17183B
SKIN = (243, 217, 189)       # #F3D9BD
HAIR = (217, 83, 42)         # #D9532A
OUTLINE = (10, 9, 20)        # near-black ink (lines are "pure black" in the pack)


def hexc(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# ---- easing / timing --------------------------------------------------------
def clamp01(t):
    return 0.0 if t < 0 else 1.0 if t > 1 else t


def seg(f, a, b):
    """0..1 progress of frame f through [a, b]."""
    return clamp01((f - a) / float(b - a))


def smooth(t):
    t = clamp01(t)
    return t * t * (3 - 2 * t)


def ease_cubic(t):
    t = clamp01(t)
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def ease_out_back(t, s=1.6):
    t = clamp01(t) - 1
    return 1 + t * t * ((s + 1) * t + s)


def lerp(a, b, t):
    return a + (b - a) * t


def lerpc(c1, c2, t):
    return tuple(int(round(a + (b - a) * t)) for a, b in zip(c1, c2))


# ---- gradients ---------------------------------------------------------------
def _stops(d, stops):
    pos = np.array([s[0] for s in stops], np.float32)
    cols = np.array([s[1][:3] for s in stops], np.float32)
    out = np.stack([np.interp(d, pos, cols[:, i]) for i in range(3)], -1)
    return out


def radial_gradient(w, h, cx, cy, rx, ry, stops):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
    return Image.fromarray(_stops(d, stops).clip(0, 255).astype(np.uint8), 'RGB')


def vertical_gradient(w, h, stops, y0=0, y1=None):
    y1 = h if y1 is None else y1
    d = (np.arange(h, dtype=np.float32) - y0) / float(y1 - y0)
    col = _stops(d, stops)  # (h,3)
    arr = np.repeat(col[:, None, :], w, axis=1)
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8), 'RGB')


def radial_alpha(w, h, cx, cy, rx, ry, inner=1.0, outer=0.0, power=1.0):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.clip(np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2), 0, 1)
    return inner + (outer - inner) * d ** power


# ---- supersampled pen --------------------------------------------------------
class Pen:
    """Draw with 1x coordinates on a SSx RGBA canvas; .image() returns the AA result."""

    def __init__(self, w, h, k=SS):
        self.w, self.h, self.k = int(w), int(h), k
        self.img = Image.new('RGBA', (int(w * k), int(h * k)), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.img)

    def _c(self, c, a=255):
        return tuple(c[:3]) + ((c[3],) if len(c) == 4 else (a,))

    def ellipse(self, cx, cy, rx, ry, fill=None, outline=None, width=0):
        k = self.k
        box = [(cx - rx) * k, (cy - ry) * k, (cx + rx) * k, (cy + ry) * k]
        if outline is not None and width:
            # draw outline as a larger black ellipse then the fill inset -> centred stroke
            hw = width / 2.0
            self.d.ellipse([(cx - rx - hw) * k, (cy - ry - hw) * k, (cx + rx + hw) * k, (cy + ry + hw) * k],
                           fill=self._c(outline))
            if fill is not None:
                self.d.ellipse([(cx - rx + hw) * k, (cy - ry + hw) * k, (cx + rx - hw) * k, (cy + ry - hw) * k],
                               fill=self._c(fill))
        elif fill is not None:
            self.d.ellipse(box, fill=self._c(fill))

    def poly(self, pts, fill=None, outline=None, width=0):
        k = self.k
        p = [(x * k, y * k) for x, y in pts]
        if fill is not None:
            self.d.polygon(p, fill=self._c(fill))
        if outline is not None and width:
            self.line(list(pts) + [pts[0]], outline, width)

    def line(self, pts, color, width, caps=True):
        k = self.k
        p = [(x * k, y * k) for x, y in pts]
        c = self._c(color)
        self.d.line(p, fill=c, width=max(1, int(round(width * k))), joint='curve')
        if caps:
            r = width / 2.0
            for x, y in (pts if len(pts) <= 3 else [pts[0], pts[-1]]):
                self.d.ellipse([(x - r) * k, (y - r) * k, (x + r) * k, (y + r) * k], fill=c)

    def arc(self, cx, cy, rx, ry, a0, a1, color, width):
        k = self.k
        self.d.arc([(cx - rx) * k, (cy - ry) * k, (cx + rx) * k, (cy + ry) * k], a0, a1,
                   fill=self._c(color), width=max(1, int(round(width * k))))

    def chord(self, cx, cy, rx, ry, a0, a1, fill):
        k = self.k
        self.d.chord([(cx - rx) * k, (cy - ry) * k, (cx + rx) * k, (cy + ry) * k], a0, a1, fill=self._c(fill))

    def text(self, xy, s, font, fill, anchor='mm', stroke=0, stroke_fill=None):
        k = self.k
        self.d.text((xy[0] * k, xy[1] * k), s, font=font, fill=self._c(fill), anchor=anchor,
                    stroke_width=int(stroke * k), stroke_fill=stroke_fill)

    def image(self):
        if self.k == 1:
            return self.img
        return self.img.resize((self.w, self.h), Image.LANCZOS)


# ---- compositing (numpy float, 0..1) ------------------------------------------
def to_f(img):
    return np.asarray(img, dtype=np.float32) / 255.0


def to_img(arr, mode='RGB'):
    return Image.fromarray((np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8), mode)


def over(base_rgb, layer_rgba):
    """Alpha-composite RGBA layer over RGB float base (both float arrays)."""
    a = layer_rgba[..., 3:4]
    return base_rgb * (1 - a) + layer_rgba[..., :3] * a


def screen(base, add, opacity=1.0):
    return 1 - (1 - base) * (1 - add * opacity)


def glow(layer_img, sigma, opacity, base):
    """Blur an RGB(A) emissive layer and screen it onto float base."""
    g = layer_img.filter(ImageFilter.GaussianBlur(sigma))
    ga = to_f(g)
    if ga.shape[-1] == 4:
        ga = ga[..., :3] * ga[..., 3:4]
    return screen(base, ga, opacity)


_VIG = {}


def vignette_mask(strength, power=2.2):
    """Multiplier with centre 1.0, corners -> (1 - strength)."""
    key = (round(strength, 3), power)
    if key not in _VIG:
        y, x = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt(((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2) / math.sqrt(2)
        _VIG[key] = (1 - strength * np.clip(d, 0, 1) ** power)[..., None].astype(np.float32)
    return _VIG[key]


def tint_shadow_indigo(arr, amount=1.0):
    """Lift blacks toward indigo (pack: never pure black)."""
    ind = np.array(INDIGO, np.float32) / 255.0
    lum = arr.mean(-1, keepdims=True)
    w = np.clip(1 - lum / 0.25, 0, 1) * amount
    return arr * (1 - w * 0.6) + np.maximum(arr, ind) * (w * 0.6)
