"""Original characters drawn from primitives, following the pack's character rules
(05_Characters_and_Expressions.md): huge round head, bean torso, stick limbs, ball hands,
thick black outline (~1% frame width), minimalist faces, eyes/brows do the acting.

Every draw_* returns a dict: img (RGBA), anchor (feet px in img), glows [(x, y, r, rgb, k)],
points {name: (x, y)} in img px (e.g. muzzle, badge, pupil).
Local coordinates are in units of head radius R, origin at the feet, y up = negative.
"""
import math
from PIL import Image
import numpy as np
from .util import Pen, OUTLINE, SKIN, HAIR, GOLD, GOLD_HOT, lerp, smooth, to_f, to_img

TAN = (200, 154, 91)
TAN_DK = (160, 112, 62)
MUSTARD = (217, 169, 58)
SHIRT = (245, 240, 230)
RED = (190, 45, 45)
BOOT = (90, 53, 32)
LEATHER = (122, 72, 40)
GUNMETAL = (88, 95, 112)
LAVENDER = (196, 186, 232)
NAVY = (28, 32, 54)
HAT_BLK = (21, 23, 42)
CHALK = (238, 240, 242)
RIM_BLUE = (159, 195, 255)
AMBER = (255, 181, 74)
BLUE_DROP = (120, 190, 255)


class _Fig:
    def __init__(self, R, wu=9.0, hu=7.2, ax_u=4.5, ay_u=6.6):
        self.R = R
        self.pen = Pen(wu * R, hu * R)
        self.ax, self.ay = ax_u * R, ay_u * R
        self.ow = max(2.0, 0.085 * R)  # outline width
        self.glows = []
        self.points = {}

    def P(self, x, y):
        return (self.ax + x * self.R, self.ay + y * self.R)

    def ell(self, x, y, rx, ry, fill, outline=True):
        cx, cy = self.P(x, y)
        self.pen.ellipse(cx, cy, rx * self.R, ry * self.R, fill=fill,
                         outline=OUTLINE if outline else None, width=self.ow if outline else 0)

    def poly(self, pts, fill, outline=True, width=None):
        self.pen.poly([self.P(x, y) for x, y in pts], fill=fill,
                      outline=OUTLINE if outline else None, width=(width or self.ow) if outline else 0)

    def stick(self, pts, width_u=0.11, color=OUTLINE):
        self.pen.line([self.P(x, y) for x, y in pts], color, width_u * self.R)

    def done(self):
        return {'img': self.pen.image(), 'anchor': (self.ax, self.ay), 'glows': self.glows,
                'points': self.points, 'R': self.R}


def _star(cx, cy, r, n=5, inner=0.45, rot=-90):
    pts = []
    for i in range(n * 2):
        rr = r if i % 2 == 0 else r * inner
        a = math.radians(rot + i * 180.0 / n)
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return pts


def _gun(f, hx, hy, ang_deg, s, scale=1.0):
    """Revolver polygon in local units held at hand (hx, hy), pointing at angle (0 = toward s side)."""
    a = math.radians(ang_deg)
    dx, dy = math.cos(a) * s, math.sin(a)  # forward
    nx, ny = dy * s, -dx * s               # normal pointing "up" relative to the gun
    L, Wd = 0.95 * scale, 0.17 * scale

    def p(u, v):
        return (hx + dx * u + nx * v, hy + dy * u + ny * v)
    barrel = [p(-0.05, Wd * 0.55), p(L, Wd * 0.45), p(L, -Wd * 0.45), p(-0.05, -Wd * 0.6)]
    grip = [p(0.05, -Wd * 0.4), p(-0.25, -Wd * 2.3), p(-0.05, -Wd * 2.5), p(0.25, -Wd * 0.4)]
    # in local units, "-v" side is the grip side; make grip hang below the barrel
    f.poly(grip, LEATHER)
    f.poly(barrel, GUNMETAL)
    cyl = p(0.22, 0)
    f.ell(cyl[0], cyl[1], 0.17 * scale, 0.15 * scale, GUNMETAL)
    f.stick([p(0.05, Wd * 0.05), p(L * 0.95, Wd * 0.05)], 0.035 * scale, GOLD_HOT)
    muzzle = p(L + 0.02, 0)
    f.points['muzzle'] = f.P(*muzzle)
    f.points['gun_trim'] = f.P(*p(0.5, 0))


def draw_kid(R, facing=1, draw=0.0, expr='determined', back=False, twitch=0.0, light=1.0,
             holster_side=None, gun_scale=1.0):
    """facing: +1 looks screen-right, -1 left, 0 front. draw: 0 holstered -> 1 aimed."""
    f = _Fig(R)
    s = facing if facing != 0 else 1
    hs = holster_side or s
    d = smooth(draw)
    # legs + boots
    f.stick([(-0.28, -1.55), (-0.42, -0.12)])
    f.stick([(0.28, -1.55), (0.42, -0.12)])
    f.ell(-0.48, -0.08, 0.3, 0.15, BOOT)
    f.ell(0.48, -0.08, 0.3, 0.15, BOOT)
    # torso (vest)
    f.ell(0, -2.12, 0.66, 0.74, MUSTARD)
    f.pen.ellipse(*f.P(0, -2.1), 0.13 * R, 0.6 * R, fill=SHIRT)
    # belt + holster
    f.poly([(-0.6, -1.62), (0.6, -1.62), (0.56, -1.47), (-0.56, -1.47)], LEATHER)
    f.ell(0, -1.55, 0.13, 0.09, GOLD_HOT)
    hx0 = hs * 0.68
    if not back or True:
        f.poly([(hx0 - 0.17, -1.6), (hx0 + 0.19, -1.6), (hx0 + 0.13, -0.95), (hx0 - 0.09, -0.95)], LEATHER)
    if not back:
        bx, by = -0.32 * s, -2.35
        f.pen.poly(_star(*f.P(bx, by), 0.16 * R), fill=GOLD_HOT, outline=OUTLINE, width=f.ow * 0.5)
        f.points['badge'] = f.P(bx, by)
        f.glows.append((*f.P(bx, by), 0.35 * R, GOLD_HOT, 0.6 * light))
    # bandana
    if not back:
        f.poly([(-0.42, -2.78), (0.42, -2.78), (0.0, -2.38)], RED)
    else:
        f.poly([(-0.45, -2.8), (0.45, -2.8), (0.4, -2.65), (-0.4, -2.65)], RED)
    # arms
    sh_y = -2.6
    off = (-s * 0.85, -1.5)
    f.stick([(-s * 0.55, sh_y), off])
    f.ell(*off, 0.17, 0.17, SKIN)
    hover = (hs * 0.95, -1.82 + twitch)
    aim = (s * 2.55, -2.78)
    hand = (lerp(hover[0], aim[0], d), lerp(hover[1], aim[1], d) - math.sin(d * math.pi) * 0.25)
    if draw <= 0.18:
        # gun grip in holster
        f.poly([(hx0 - 0.06, -1.62), (hx0 + 0.04, -1.98), (hx0 + 0.22, -1.95), (hx0 + 0.15, -1.6)], LEATHER)
        f.stick([(hx0, -1.66), (hx0 + 0.14, -1.66)], 0.035, GOLD_HOT)
        f.points['gun_trim'] = f.P(hx0 + 0.1, -1.8)
        f.stick([(s * 0.55, sh_y), hand])
        f.ell(*hand, 0.17, 0.17, SKIN)
    else:
        f.stick([(s * 0.55, sh_y), hand])
        ang = lerp(80, 0, smooth((draw - 0.18) / 0.82))
        _gun(f, hand[0], hand[1], ang, s, gun_scale)
        f.ell(*hand, 0.17, 0.17, SKIN)
    # head
    hy = -3.78
    f.ell(0, hy, 1.0, 1.0, SKIN)
    if not back:
        # lavender shade crescent on the side away from the light (light comes from facing side)
        f.pen.ellipse(*f.P(0, hy), 0.955 * R, 0.955 * R, fill=LAVENDER)
        f.pen.ellipse(*f.P(0.13 * s, hy - 0.04), 0.9 * R, 0.92 * R, fill=SKIN)
    # hair
    if back:
        pts = [(math.cos(math.radians(a)) * 0.96, hy + math.sin(math.radians(a)) * 0.96) for a in range(150, 391, 10)]
        zig = []
        for i in range(9):
            x = lerp(0.9, -0.9, i / 8.0)
            zig.append((x, hy + (0.55 if i % 2 == 0 else 0.3)))
        f.poly(pts + zig, HAIR, outline=False)
        for i in range(4):
            x = -0.5 + i * 0.33
            f.stick([(x, hy - 0.3), (x + 0.12, hy + 0.0), (x, hy + 0.25)], 0.04, (150, 50, 25))
    else:
        fringe = [(-0.95, hy - 0.35)]
        for i in range(9):
            x = lerp(-0.85, 0.85, i / 8.0)
            fringe.append((x, hy - (0.12 if i % 2 == 0 else 0.42)))
        fringe += [(0.95, hy - 0.35), (0.7, hy - 0.85), (-0.7, hy - 0.85)]
        f.poly(fringe, HAIR, outline=False)
        f.stick([(-0.4, hy - 0.62), (-0.25, hy - 0.4)], 0.05, (255, 200, 170))
        f.stick([(0.1, hy - 0.65), (0.22, hy - 0.42)], 0.05, (255, 200, 170))
        # side tuft
        tx = -0.95 * s
        f.poly([(tx, hy - 0.5), (tx - 0.32 * s, hy - 0.42), (tx - 0.05 * s, hy - 0.2)], HAIR)
    # hat
    f.ell(0, hy - 0.72, 1.48, 0.27, TAN)
    f.poly([(-0.74, hy - 0.72), (-0.68, hy - 1.55), (-0.3, hy - 1.72), (0, hy - 1.55), (0.3, hy - 1.72),
            (0.68, hy - 1.55), (0.74, hy - 0.72)], TAN)
    f.poly([(-0.72, hy - 0.8), (0.72, hy - 0.8), (0.71, hy - 1.0), (-0.71, hy - 1.0)], GOLD)
    f.stick([(-0.68, hy - 0.66), (0.68, hy - 0.66)], 0.07, TAN_DK)
    if not back:
        _face(f, hy, s * 0.24, expr, kind='kid')
    f.points['head'] = f.P(0, hy)
    return f.done()


def _eye(f, x, y, kind, look, amber=0.0):
    R = f.R
    if kind == 'dot':
        f.ell(x, y, 0.07, 0.07, OUTLINE, outline=False)
        return
    f.ell(x, y, 0.23, 0.25, (255, 255, 255))
    px, py = x + look * 0.08, y + 0.02
    if amber > 0:
        f.ell(px, py, 0.11, 0.11, AMBER, outline=False)
        f.ell(px, py, 0.045, 0.045, (80, 30, 0), outline=False)
        f.glows.append((*f.P(px, py), 0.3 * R, AMBER, amber))
        f.points.setdefault('pupils', []).append(f.P(px, py))
    else:
        f.ell(px, py, 0.1, 0.1, OUTLINE, outline=False)
        f.ell(px - 0.035, py - 0.04, 0.03, 0.03, (255, 255, 255), outline=False)
    if kind == 'half':
        f.pen.chord(*f.P(x, y), 0.27 * R, 0.29 * R, 180, 360, SKIN if 'skin' not in f.points else f.points['skin'])
        f.stick([(x - 0.24, y), (x + 0.24, y)], 0.07)


def _face(f, hy, fx, expr, kind='kid', amber=0.0):
    look = 1 if fx > 0 else -1 if fx < 0 else 0
    ey = hy - 0.02
    eye_kind = {'deadpan': 'half', 'hollow': 'dot'}.get(expr, 'ring')
    for sx in (-0.37, 0.37):
        _eye(f, fx + sx, ey, eye_kind, look, amber)
    # brows: inner end down = determined/angry; up = worried
    tilt = {'determined': 0.12, 'sweat': -0.1, 'wary': -0.06, 'deadpan': 0.0, 'grin': 0.14,
            'flat': 0.18, 'hollow': -0.04}.get(expr, 0)
    bw = 0.09 if kind == 'rival' else 0.065
    for sx in (-1, 1):
        ex = fx + sx * 0.37
        inner = (ex - sx * 0.2, ey - 0.38 + tilt)
        outer = (ex + sx * 0.2, ey - 0.38 - tilt * 0.5)
        f.stick([inner, outer], bw)
    my = hy + 0.45
    if kind == 'rival':
        # handlebar moustache
        mx = fx
        f.poly([(mx - 0.05, my - 0.18), (mx - 0.45, my - 0.12), (mx - 0.62, my - 0.3), (mx - 0.5, my - 0.05),
                (mx, my - 0.02), (mx + 0.5, my - 0.05), (mx + 0.62, my - 0.3), (mx + 0.45, my - 0.12),
                (mx + 0.05, my - 0.18)], OUTLINE, outline=False)
        my += 0.12
    if expr == 'grin':
        cx, cy = f.P(fx, my - 0.02)
        f.pen.chord(cx, cy, 0.5 * f.R, 0.32 * f.R, 0, 180, OUTLINE)
        f.pen.chord(cx, cy - 0.02 * f.R, 0.43 * f.R, 0.25 * f.R, 0, 180, (255, 255, 250))
        for i in range(-3, 4):
            x = fx + i * 0.11
            f.stick([(x, my), (x, my + 0.2 * (1 - abs(i) / 4.0))], 0.025)
    elif expr in ('flat', 'deadpan', 'determined'):
        w = 0.22 if expr != 'determined' else 0.16
        f.stick([(fx - w, my), (fx + w, my)], 0.07)
    elif expr == 'sweat':
        pts = [(fx - 0.22 + i * 0.055, my + (0.04 if i % 2 else -0.04)) for i in range(9)]
        f.stick(pts, 0.05)
        sx = fx + (0.92 if fx >= 0 else -0.92)
        f.poly([(sx, hy - 0.55), (sx - 0.12, hy - 0.25), (sx, hy - 0.15), (sx + 0.12, hy - 0.25)], BLUE_DROP,
               width=f.ow * 0.6)
        f.ell(sx, hy - 0.25, 0.12, 0.12, BLUE_DROP, outline=False)
    elif expr == 'hollow':
        f.ell(fx, my + 0.05, 0.09, 0.07, OUTLINE, outline=False)
    else:
        f.ell(fx, my, 0.05, 0.05, OUTLINE, outline=False)


def draw_rival(R, facing=-1, draw=0.0, expr='grin', amber=0.6, fall=0.0, hat_on=True):
    f = _Fig(R)
    s = facing if facing != 0 else -1
    d = smooth(draw)
    f.stick([(-0.28, -1.5), (-0.4, -0.12)])
    f.stick([(0.28, -1.5), (0.4, -0.12)])
    f.ell(-0.46, -0.08, 0.3, 0.15, (40, 30, 30))
    f.ell(0.46, -0.08, 0.3, 0.15, (40, 30, 30))
    # duster coat
    f.poly([(-0.62, -3.0), (0.62, -3.0), (1.0, -0.85), (0.15, -0.95), (0, -1.6), (-0.15, -0.95), (-1.0, -0.85)], NAVY)
    # pale-blue rim line on the light side (opposite the facing because sun is behind him)
    rs = -s
    f.stick([(rs * 0.6, -2.9), (rs * 0.96, -0.95)], 0.05, RIM_BLUE)
    f.poly([(-0.62, -1.62), (0.62, -1.62), (0.66, -1.47), (-0.66, -1.47)], (60, 40, 30))
    f.poly([(s * 0.75 - 0.15, -1.6), (s * 0.75 + 0.2, -1.6), (s * 0.75 + 0.14, -0.98), (s * 0.75 - 0.08, -0.98)],
           LEATHER)
    sh_y = -2.75
    off = (-s * 0.95, -1.55)
    f.stick([(-s * 0.55, sh_y), off])
    f.ell(*off, 0.17, 0.17, CHALK)
    hover = (s * 1.0, -1.85)
    aim = (s * 2.5, -2.9)
    hand = (lerp(hover[0], aim[0], d), lerp(hover[1], aim[1], d) - math.sin(d * math.pi) * 0.25)
    f.stick([(s * 0.55, sh_y), hand])
    if draw > 0.18:
        _gun(f, hand[0], hand[1], lerp(80, 0, smooth((draw - 0.18) / 0.82)), s)
    else:
        hx0 = s * 0.75
        f.poly([(hx0 - 0.06, -1.62), (hx0 + 0.04, -1.98), (hx0 + 0.22, -1.95), (hx0 + 0.15, -1.6)], LEATHER)
    f.ell(*hand, 0.17, 0.17, CHALK)
    # head
    hy = -3.98
    f.ell(0, hy, 0.95, 1.08, CHALK)
    f.pen.ellipse(*f.P(0, hy), 0.9 * f.R, 1.03 * f.R, fill=(205, 206, 228))
    f.pen.ellipse(*f.P(0.12 * s, hy - 0.04), 0.84 * f.R, 0.98 * f.R, fill=CHALK)
    f.points['skin'] = CHALK
    if hat_on:
        _rival_hat(f, 0, hy)
    _face(f, hy + 0.05, s * 0.2, expr, kind='rival', amber=amber if expr != 'hollow' else 0)
    f.points['head'] = f.P(0, hy)
    out = f.done()
    return out


def _rival_hat(f, x, hy):
    f.ell(x, hy - 0.78, 1.5, 0.25, HAT_BLK)
    f.poly([(x - 0.72, hy - 0.8), (x - 0.7, hy - 1.68), (x + 0.7, hy - 1.68), (x + 0.72, hy - 0.8)], HAT_BLK)
    f.poly([(x - 0.71, hy - 0.86), (x + 0.71, hy - 0.86), (x + 0.71, hy - 1.04), (x - 0.71, hy - 1.04)], (110, 25, 30))
    f.stick([(x - 0.62, hy - 1.6), (x + 0.6, hy - 1.6)], 0.04, RIM_BLUE)


def draw_rival_hat(R, angle=0.0):
    f = _Fig(R, wu=3.4, hu=2.4, ax_u=1.7, ay_u=1.2)
    _rival_hat(f, 0, 0.85)
    img = f.done()
    img['img'] = img['img'].rotate(angle, resample=Image.BICUBIC, center=img['anchor'])
    return img


def light_tint(img, warm=(255, 226, 190), cool=(178, 170, 228), sun_side=1, strength=0.35, dark=0.0,
               dark_col=(42, 34, 70), rim=None, rim_px=6):
    """Pack rule: characters get a tint overlay (warm key side / lavender shade side), not 3D shading.
    dark: blend toward a silhouette colour; rim: (rgb, strength) adds a rim on the sun-facing edge."""
    a = to_f(img)
    rgb, al = a[..., :3], a[..., 3:4]
    w = img.size[0]
    x = np.linspace(-1, 1, w, dtype=np.float32)[None, :, None] * sun_side
    k = (x + 1) / 2
    tint = np.array(cool, np.float32) / 255 * (1 - k) + np.array(warm, np.float32) / 255 * k
    rgb = rgb * (1 - strength) + rgb * tint * strength
    if dark > 0:
        rgb = rgb * (1 - dark) + (np.array(dark_col, np.float32) / 255) * dark
    if rim is not None:
        col, rk = rim
        sh = np.roll(al, -sun_side * rim_px, axis=1)
        sh = np.minimum(sh, np.roll(al, rim_px // 2, axis=0))
        edge = np.clip(al - sh, 0, 1)
        rgb = rgb * (1 - edge * rk) + (np.array(col, np.float32) / 255) * edge * rk
    return to_img(np.concatenate([rgb, al], -1), 'RGBA')
