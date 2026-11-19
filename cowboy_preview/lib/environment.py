"""Procedural environments ("lit dioramas") for the duel.

main_street(): low-angle wide-angle street with simple 3D projection of false-front buildings.
side_horizon(): profile view of the duel line with the sun on the horizon.
All layers are built once per process and cached (they are static; the camera moves them).
"""
import math
import functools
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from .util import (Pen, radial_gradient, vertical_gradient, radial_alpha, to_f, to_img, lerpc, clamp01,
                   HONEY, ROYAL, INDIGO, SLATE, COBALT, COBALT_DEEP, GOLD_HOT, GOLD)

FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'

# street layer geometry
LW, LH = 1400, 2400
VPX, HY = 700, 1080
FP, CAMH = 900.0, 1.2
SUN = (700, 1015)
LINE = (22, 16, 40)


def proj(X, Yup, Z):
    return (VPX + FP * X / Z, HY + FP * (CAMH - Yup) / Z)


def ground_y(Z):
    return HY + FP * CAMH / Z


def scale_at(Z):
    """pixels per world unit at depth Z."""
    return FP / Z


def _sky_stops(cold):
    warm = [(0.0, (255, 248, 226)), (0.05, (255, 238, 196)), (0.13, HONEY), (0.3, (238, 164, 98)),
            (0.52, (160, 92, 128)), (0.78, ROYAL), (1.15, (28, 28, 78))]
    coldst = [(0.0, (78, 92, 170)), (0.3, (48, 62, 150)), (0.6, COBALT), (1.15, COBALT_DEEP)]
    return coldst if cold else warm


@functools.lru_cache(maxsize=None)
def street_layers(cold=False):
    """Returns dict of RGBA layers at street-layer size: sky (opaque), ground (buildings+road), emit."""
    sky = radial_gradient(LW, LH, SUN[0], SUN[1] + (220 if cold else 0), 900, 1150, _sky_stops(cold)).convert('RGBA')
    sp = Pen(LW, LH)
    # mesas on the horizon
    mesa_col = (52, 50, 112) if cold else (176, 112, 132)
    mesa_far = (70, 70, 135) if cold else (214, 150, 140)
    sp.poly([(0, HY), (0, HY - 70), (90, HY - 72), (130, HY - 40), (260, HY - 38), (300, HY - 95), (420, HY - 98),
             (450, HY - 60), (520, HY - 55), (560, HY + 2)], fill=mesa_far)
    sp.poly([(840, HY + 2), (900, HY - 50), (1010, HY - 52), (1050, HY - 110), (1220, HY - 112), (1260, HY - 60),
             (1400, HY - 58), (1400, HY)], fill=mesa_col)
    sky_arr = to_f(sky)
    m = to_f(sp.image())
    sky_arr[..., :3] = sky_arr[..., :3] * (1 - m[..., 3:4]) + m[..., :3] * m[..., 3:4]
    if not cold:
        # sun disc + god rays
        rays = Image.new('RGBA', (LW, LH), (0, 0, 0, 0))
        rd = ImageDraw.Draw(rays)
        rng = np.random.default_rng(3)
        for i in range(14):
            a = math.radians(-180 + i * (180 / 13.0) + rng.uniform(-4, 4))
            w = math.radians(rng.uniform(1.5, 3.5))
            L = 1600
            p1 = (SUN[0] + L * math.cos(a - w), SUN[1] + L * math.sin(a - w))
            p2 = (SUN[0] + L * math.cos(a + w), SUN[1] + L * math.sin(a + w))
            rd.polygon([SUN, p1, p2], fill=(255, 225, 170, int(rng.uniform(9, 20))))
        rays = rays.filter(ImageFilter.GaussianBlur(10))
        ra = to_f(rays)
        sky_arr[..., :3] = 1 - (1 - sky_arr[..., :3]) * (1 - ra[..., :3] * ra[..., 3:4])
        dp = Pen(LW, LH)
        dp.ellipse(SUN[0], SUN[1], 62, 62, fill=(255, 250, 232))
        d = to_f(dp.image())
        sky_arr[..., :3] = sky_arr[..., :3] * (1 - d[..., 3:4]) + d[..., :3] * d[..., 3:4]
    sky = to_img(sky_arr, 'RGBA')

    # ---- ground + buildings layer
    g = Pen(LW, LH)
    # ground plane (gradient applied via mask later)
    g.poly([(0, HY), (LW, HY), (LW, LH), (0, LH)], fill=(255, 255, 255))
    ground_mask = g.image()
    if cold:
        gstops = [(0.0, (70, 72, 140)), (0.08, (48, 46, 108)), (0.3, (32, 28, 72)), (1.0, (16, 14, 40))]
    else:
        gstops = [(0.0, (240, 190, 128)), (0.06, (214, 146, 104)), (0.22, (132, 82, 98)), (0.5, (66, 44, 82)),
                  (1.0, (26, 20, 52))]
    grad = to_f(vertical_gradient(LW, LH, gstops, HY, LH))
    # sun reflection streak on the dusty road
    if not cold:
        streak = radial_alpha(LW, LH, SUN[0], HY + 40, 170, 900, 0.55, 0.0, 1.4)[..., None]
        grad = 1 - (1 - grad) * (1 - np.array([1.0, 0.82, 0.55], np.float32) * streak)
    gm = to_f(ground_mask)
    base = np.concatenate([grad, gm[..., 3:4]], -1)

    # buildings: (side, z0, z1, height, colour)
    b = Pen(LW, LH)
    emit = Pen(LW, LH)
    face_warm = [(92, 66, 104), (110, 70, 92), (84, 70, 110), (120, 82, 96), (96, 74, 118)]
    face_cold = [(40, 42, 94), (46, 44, 100), (36, 40, 90), (50, 48, 104), (42, 46, 98)]
    haze = (232, 170, 130) if not cold else (60, 66, 140)
    rng = np.random.default_rng(11)
    for side in (-1, 1):
        blds = []
        z = 2.2
        i = 0
        while z < 70:
            L = rng.uniform(4.5, 8.0)
            blds.append((z, z + L, rng.uniform(4.2, 6.5), i))
            z += L + rng.uniform(0.2, 1.4)
            i += 1
        for z0, z1, h, i in reversed(blds):
            fade = clamp01((z0 - 3) / 55.0) ** 0.7
            base_c = (face_cold if cold else face_warm)[i % 5]
            fc = lerpc(base_c, haze, fade * 0.85)
            front = lerpc(lerpc(base_c, INDIGO, 0.45), haze, fade * 0.8)
            X = 5.6 * side
            # front face (facing camera)
            pts = [proj(X, 0, z0), proj(X + 7 * side, 0, z0), proj(X + 7 * side, h, z0), proj(X, h, z0)]
            b.poly(pts, fill=front, outline=LINE, width=2)
            # street facade with stepped false-front
            zm1, zm2 = z0 + (z1 - z0) * 0.25, z0 + (z1 - z0) * 0.75
            top = h + rng.uniform(0.6, 1.2)
            fac = [proj(X, 0, z0), proj(X, 0, z1), proj(X, h, z1), proj(X, h, zm2), proj(X, top, zm2),
                   proj(X, top, zm1), proj(X, h, zm1), proj(X, h, z0)]
            b.poly(fac, fill=fc, outline=LINE, width=2)
            # trim line
            b.line([proj(X, h - 0.25, z0), proj(X, h - 0.25, z1)], lerpc(fc, (255, 220, 170), 0.35 if not cold else 0.1), 3, caps=False)
            # windows
            nwin = max(1, int((z1 - z0) / 2.2))
            for k in range(nwin):
                wz0 = z0 + (k + 0.3) * (z1 - z0) / nwin
                wz1 = wz0 + (z1 - z0) / nwin * 0.45
                for (y0, y1) in ((1.0, 2.1), (3.0, 3.9)):
                    if y1 > h - 0.3:
                        continue
                    lit = rng.random() < 0.6
                    q = [proj(X, y0, wz0), proj(X, y0, wz1), proj(X, y1, wz1), proj(X, y1, wz0)]
                    if lit:
                        wc = lerpc((255, 178, 90), haze, fade * 0.5) if not cold else (255, 170, 80)
                        b.poly(q, fill=wc, outline=LINE, width=2)
                        emit.poly(q, fill=(255, 170, 80))
                    else:
                        b.poly(q, fill=lerpc(INDIGO, haze, fade * 0.6), outline=LINE, width=2)
            # boardwalk
            bw = [proj(X, 0.3, z0), proj(X, 0.3, z1), proj(X - 1.4 * side, 0.3, z1), proj(X - 1.4 * side, 0.3, z0)]
            b.poly(bw, fill=lerpc((70, 46, 60) if not cold else (30, 28, 64), haze, fade * 0.7), outline=LINE, width=2)
            # porch roof underside + posts
            pr = [proj(X, 2.9, z0), proj(X, 2.9, z1), proj(X - 1.6 * side, 2.8, z1), proj(X - 1.6 * side, 2.8, z0)]
            b.poly(pr, fill=lerpc(lerpc(base_c, INDIGO, 0.6), haze, fade * 0.8), outline=LINE, width=2)
            for pz in (z0 + 0.2, (z0 + z1) / 2, z1 - 0.2):
                b.line([proj(X - 1.5 * side, 0.3, pz), proj(X - 1.5 * side, 2.8, pz)], LINE,
                       max(2, 0.14 * scale_at(pz)), caps=False)
    # water tower (left, far)
    wx, wz = -15, 34
    for lx in (-1.2, 1.2):
        b.line([proj(wx + lx, 0, wz), proj(wx + lx * 0.7, 7, wz)], LINE, 4, caps=False)
    tank = [proj(wx - 1.6, 7, wz), proj(wx + 1.6, 7, wz), proj(wx + 1.6, 10, wz), proj(wx, 11.2, wz), proj(wx - 1.6, 10, wz)]
    b.poly(tank, fill=lerpc((120, 80, 100) if not cold else (44, 46, 104), haze, 0.55), outline=LINE, width=2)
    # banner across the street + bunting
    bz = 15.0
    l, r = proj(-5.6, 4.9, bz), proj(5.6, 4.9, bz)
    b.line([l, r], LINE, 3, caps=False)
    bl, bt = proj(-3.3, 4.75, bz), proj(3.3, 3.75, bz)
    b.poly([(bl[0], bl[1]), (bt[0], bl[1]), (bt[0], bt[1]), (bl[0], bt[1])], fill=(30, 34, 70), outline=(181, 137, 85), width=4)
    fs = int((bt[1] - bl[1]) * 0.52 * 2)
    font = ImageFont.truetype(FONT, fs)
    while font.getlength('LAST CHANCE SALOON') > (bt[0] - bl[0]) * 2 * 0.9:
        fs -= 2
        font = ImageFont.truetype(FONT, fs)
    b.text(((bl[0] + bt[0]) / 2, (bl[1] + bt[1]) / 2 + 2), 'LAST CHANCE SALOON', font,
           (247, 205, 120) if not cold else (200, 170, 110), stroke=1, stroke_fill=(60, 30, 10, 255))
    fl = proj(-5.6, 5.6, bz + 6)
    fr = proj(5.6, 5.6, bz + 6)
    cols = [(220, 70, 60), (240, 190, 90), (90, 130, 200), (240, 240, 230)]
    n = 16
    for k in range(n):
        t0, t1 = k / n, (k + 1) / n
        x0 = fl[0] + (fr[0] - fl[0]) * t0
        x1 = fl[0] + (fr[0] - fl[0]) * t1
        sag = lambda t: 26 * math.sin(math.pi * t)
        y0, y1 = fl[1] + sag(t0), fl[1] + sag(t1)
        c = cols[k % 4] if not cold else lerpc(cols[k % 4], (40, 50, 120), 0.6)
        b.poly([(x0, y0), (x1, y1), ((x0 + x1) / 2, (y0 + y1) / 2 + 16)], fill=c, outline=LINE, width=1.5)
    b.line([fl] + [(fl[0] + (fr[0] - fl[0]) * t, fl[1] + 26 * math.sin(math.pi * t)) for t in np.linspace(0, 1, 20)] + [fr],
           LINE, 2, caps=False)
    bimg = to_f(b.image())
    out = base.copy()
    out[..., :3] = out[..., :3] * (1 - bimg[..., 3:4]) + bimg[..., :3] * bimg[..., 3:4]
    out[..., 3:4] = np.maximum(out[..., 3:4], bimg[..., 3:4])
    # road-edge ambient occlusion: darken toward screen sides near the bottom
    yy, xx = np.mgrid[0:LH, 0:LW].astype(np.float32)
    ao = np.clip((np.abs(xx - VPX) / 700.0) ** 2 * np.clip((yy - HY) / 900.0, 0, 1), 0, 1)[..., None]
    out[..., :3] *= (1 - 0.45 * ao)
    # atmospheric haze around the sun / vanishing point
    hz = radial_alpha(LW, LH, SUN[0], HY - 10, 520, 300, 0.7 if not cold else 0.35, 0.0, 1.3)[..., None]
    hcol = np.array([255, 206, 150] if not cold else [80, 92, 170], np.float32) / 255
    out[..., :3] = out[..., :3] * (1 - hz) + hcol * hz
    return {'sky': sky, 'ground': to_img(out, 'RGBA'), 'emit': emit.image()}


# ---------------------------------------------------------------- side horizon (S4/S5)
SW, SH = 1700, 2200
S_HY = 1240
S_SUN = (850, 1150)


@functools.lru_cache(maxsize=None)
def side_layers(deep=0):
    """deep: 0 = honey sunset, 1 = deeper flushed version (blend per frame)."""
    if deep:
        stops = [(0.0, (255, 236, 190)), (0.06, (255, 196, 120)), (0.16, (236, 128, 70)), (0.34, (176, 70, 88)),
                 (0.6, (78, 50, 120)), (0.85, (34, 34, 96)), (1.2, (18, 16, 52))]
    else:
        stops = [(0.0, (255, 248, 226)), (0.06, (255, 236, 190)), (0.15, HONEY), (0.34, (238, 164, 98)),
                 (0.58, (156, 96, 136)), (0.85, ROYAL), (1.2, (30, 30, 84))]
    sky = to_f(radial_gradient(SW, SH, S_SUN[0], S_SUN[1], 1000, 1250, stops))
    p = Pen(SW, SH)
    # sun disc
    p.ellipse(S_SUN[0], S_SUN[1], 118, 118, fill=(255, 246, 222) if not deep else (255, 226, 170))
    sun = to_f(p.image())
    sky = sky * (1 - sun[..., 3:4]) + sun[..., :3] * sun[..., 3:4]
    # far mesas (hazy) and ground silhouette
    m = Pen(SW, SH)
    far = (196, 128, 140) if not deep else (150, 78, 108)
    m.poly([(0, S_HY + 4), (0, S_HY - 90), (160, S_HY - 95), (210, S_HY - 50), (520, S_HY - 46), (560, S_HY - 120),
            (700, S_HY - 124), (730, S_HY + 4)], fill=far)
    m.poly([(1080, S_HY + 4), (1120, S_HY - 70), (1330, S_HY - 74), (1370, S_HY - 140), (1560, S_HY - 142),
            (1600, S_HY - 80), (1700, S_HY - 78), (1700, S_HY + 4)], fill=far)
    mm = to_f(m.image())
    sky = sky * (1 - mm[..., 3:4]) + mm[..., :3] * mm[..., 3:4]
    gstops = [(0.0, (226, 150, 110) if not deep else (190, 100, 90)), (0.04, (120, 72, 96)), (0.25, (52, 36, 76)),
              (1.0, INDIGO)]
    ground = to_f(vertical_gradient(SW, SH, gstops, S_HY, SH))
    yy = np.arange(SH)[:, None, None]
    out = np.where(yy >= S_HY, ground, sky)
    # sun glint along the ground line + haze
    hz = radial_alpha(SW, SH, S_SUN[0], S_HY, 700, 200, 0.55, 0.0, 1.2)[..., None]
    out = out * (1 - hz) + np.array([255, 210, 160], np.float32) / 255 * hz
    # cactus + fence silhouettes for depth
    c = Pen(SW, SH)
    dark = (40, 28, 62)
    for cx, hgt in ((300, 230), (1480, 170)):
        c.poly([(cx - 22, S_HY + 30), (cx - 22, S_HY - hgt), (cx + 22, S_HY - hgt), (cx + 22, S_HY + 30)], fill=dark,
               outline=(20, 14, 34), width=3)
        c.ellipse(cx, S_HY - hgt, 22, 22, fill=dark)
        c.poly([(cx + 22, S_HY - hgt * 0.5), (cx + 70, S_HY - hgt * 0.5), (cx + 70, S_HY - hgt * 0.8),
                (cx + 48, S_HY - hgt * 0.8), (cx + 48, S_HY - hgt * 0.62), (cx + 22, S_HY - hgt * 0.62)], fill=dark)
    for fx in range(0, SW, 140):
        c.line([(fx, S_HY + 70), (fx, S_HY + 10)], (30, 22, 50), 7, caps=False)
    c.line([(0, S_HY + 30), (SW, S_HY + 30)], (30, 22, 50), 5, caps=False)
    ci = to_f(c.image())
    out = out * (1 - ci[..., 3:4]) + ci[..., :3] * ci[..., 3:4]
    return to_img(out)


# ---------------------------------------------------------------- bokeh sky (S3 faces)
@functools.lru_cache(maxsize=None)
def bokeh_sky(variant=0):
    w, h = 1400, 2300
    cx = 330 if variant == 0 else 1070
    stops = [(0.0, (255, 240, 200)), (0.12, HONEY), (0.35, (232, 150, 96)), (0.65, (130, 80, 126)), (1.0, ROYAL),
             (1.4, (26, 26, 72))]
    img = to_f(radial_gradient(w, h, cx, 1500, 1100, 1300, stops))
    rng = np.random.default_rng(5 + variant)
    p = Pen(w, h, k=1)
    for _ in range(26):
        x, y = rng.uniform(0, w), rng.uniform(1100, 2000)
        r = rng.uniform(30, 90)
        p.ellipse(x, y, r, r, fill=(255, 200, 130, int(rng.uniform(40, 90))))
    bk = p.image().filter(ImageFilter.GaussianBlur(6))
    b = to_f(bk)
    img = 1 - (1 - img) * (1 - b[..., :3] * b[..., 3:4])
    return to_img(img)
