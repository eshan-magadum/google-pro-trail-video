"""Shot list + transitions for the 10 s duel (300 frames @ 30 fps).

S1  f0-74    wide low-angle Main Street, slow push, tumbleweed       -> T1 swing-pitch (f66-81)
S2  f72-124  holster macro, hand twitch, gold glint, rack focus      -> T2 face-position dissolve (f112-124)
S3  f112-182 eyes duel (Kid -> Rival dissolve), Dutch tilt           -> T3 pupil->sun shape match (f170-182)
S4  f174-209 profile silhouette hold, sky flushes deeper              -> continuous camera
S5  f204-228 push + whip-pan, the draw, muzzle flash, gold blow-out   -> gold blow-out peak (f226-230)
S6  f229-299 aftermath, rival falls (dot eyes), cold flip, freeze 270-299
"""
import math
import functools
import numpy as np
from PIL import Image, ImageFilter

from lib.util import (W, H, Pen, to_f, to_img, lerp, lerpc, seg, smooth, ease_cubic, clamp01, screen, over,
                      OUTLINE, SKIN, GOLD_HOT, HONEY)
from lib.camera import transform
from lib.characters import draw_kid, draw_rival, draw_rival_hat, light_tint, LEATHER, MUSTARD
from lib import environment as env
from lib.fx import gold_blowout, muzzle_flash, point_glows, cold_flip_chars, dust, smoke, finish

FREEZE_FROM = 269
WARM_RIM = (255, 206, 150)


# ------------------------------------------------------------------ helpers
def fwd(pt, layer_pt, screen_pt, zoom, roll):
    """Forward map a layer point to the screen for a camera transform()."""
    a = math.radians(roll)
    c, s = math.cos(a), math.sin(a)
    dx, dy = pt[0] - layer_pt[0], pt[1] - layer_pt[1]
    return (screen_pt[0] + zoom * (c * dx + s * dy), screen_pt[1] + zoom * (-s * dx + c * dy))


def place(layer, img, x, y):
    """Alpha-composite img onto RGBA layer with its top-left at (x, y) (may be negative)."""
    x, y = int(round(x)), int(round(y))
    lw, lh = layer.size
    iw, ih = img.size
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(lw, x + iw), min(lh, y + ih)
    if x1 <= x0 or y1 <= y0:
        return
    crop = img.crop((x0 - x, y0 - y, x1 - x, y1 - y))
    layer.alpha_composite(crop, dest=(x0, y0))


def place_char(layer, ch, fx, fy, glows=None, img=None, rotate=0.0):
    """Place a character dict with its feet at (fx, fy); collect glows / points in layer coords."""
    im = img if img is not None else ch['img']
    ax, ay = ch['anchor']
    if rotate:
        im = im.rotate(rotate, resample=Image.BICUBIC, center=(ax, ay))
    place(layer, im, fx - ax, fy - ay)
    ox, oy = fx - ax, fy - ay

    def rot(p):
        if not rotate:
            return p
        a = math.radians(rotate)
        dx, dy = p[0] - ax, p[1] - ay
        return (ax + dx * math.cos(a) + dy * math.sin(a), ay - dx * math.sin(a) + dy * math.cos(a))
    pts = {}
    for k, v in ch['points'].items():
        if k == 'pupils':
            pts[k] = [(rot(p)[0] + ox, rot(p)[1] + oy) for p in v]
        elif isinstance(v, tuple) and len(v) == 2:
            p = rot(v)
            pts[k] = (p[0] + ox, p[1] + oy)
    if glows is not None:
        for (gx, gy, r, col, k) in ch['glows']:
            p = rot((gx, gy))
            glows.append((p[0] + ox, p[1] + oy, r, col, k))
    return pts


@functools.lru_cache(maxsize=64)
def kid_c(R, facing=1, draw=0.0, expr='determined', back=False, twitch=0.0, holster_side=None):
    return draw_kid(R, facing=facing, draw=draw, expr=expr, back=back, twitch=twitch, holster_side=holster_side)


@functools.lru_cache(maxsize=64)
def rival_c(R, facing=-1, draw=0.0, expr='grin', amber=0.6, hat_on=True):
    return draw_rival(R, facing=facing, draw=draw, expr=expr, amber=amber, hat_on=hat_on)


def q(x, n=40):
    """Quantise a parameter so the character cache gets hits."""
    return round(x * n) / n


def shadow_poly(pen, fx, fy, width, length, vp=(env.VPX, env.HY), alpha=120):
    dx, dy = fx - vp[0], fy - vp[1]
    L = math.hypot(dx, dy) or 1
    ux, uy = dx / L, dy / L
    nx, ny = -uy, ux
    tip = (fx + ux * length, fy + uy * length)
    pen.poly([(fx + nx * width / 2, fy + ny * width / 2), (fx - nx * width / 2, fy - ny * width / 2),
              (tip[0] - nx * width * 0.7, tip[1] - ny * width * 0.7),
              (tip[0] + nx * width * 0.7, tip[1] + ny * width * 0.7)], fill=(20, 14, 40, alpha))


def tumbleweed(pen, x, y, r, ang):
    rng = np.random.default_rng(9)
    for i in range(16):
        a0 = rng.uniform(0, 360) + ang
        rr = r * rng.uniform(0.55, 1.0)
        ox, oy = rng.uniform(-0.25, 0.25) * r, rng.uniform(-0.25, 0.25) * r
        pen.arc(x + ox, y + oy, rr, rr * rng.uniform(0.7, 1.0), a0, a0 + rng.uniform(120, 260),
                (122, 82, 52), max(1.5, r * 0.06))
        pen.arc(x + ox, y + oy, rr, rr * 0.9, a0 + 30, a0 + 90, (40, 26, 30), max(1, r * 0.03))


def _compose(layers_rgba, base_rgb):
    out = base_rgb
    for L in layers_rgba:
        out = over(out, to_f(L))
    return out


# ------------------------------------------------------------------ street (S1 + S6)
@functools.lru_cache(maxsize=4)
def street_arrays(cold):
    L = env.street_layers(cold)
    emit_blur = L['emit'].filter(ImageFilter.GaussianBlur(16))
    return (np.asarray(L['sky']), np.asarray(L['ground']), np.asarray(emit_blur))


def street_env(k_cold):
    """Blend warm/cold street layers (uint8 RGBA) -> PIL images."""
    w = street_arrays(False)
    if k_cold <= 0:
        return [Image.fromarray(a, 'RGBA') for a in w]
    c = street_arrays(True)
    if k_cold >= 1:
        return [Image.fromarray(a, 'RGBA') for a in c]
    out = []
    for i, (a, b) in enumerate(zip(w, c)):
        if i == 2:  # emissive windows stay warm (tiny warm lights = hope), just dimmer
            m = a.astype(np.float32) * (1 - 0.4 * k_cold)
        else:
            m = a.astype(np.float32) * (1 - k_cold) + b.astype(np.float32) * k_cold
        out.append(Image.fromarray(m.astype(np.uint8), 'RGBA'))
    return out


def render_street(f, cam, chars_fn, k_cold=0.0, vig=0.36, extra=None):
    """cam = (cx, cy, zoom, roll) in street-layer coords. chars_fn(layer, glows) draws characters."""
    sky, ground, emit = street_env(k_cold)
    cx, cy, z, roll = cam
    ref = (700, 1200)
    sc = (W / 2, H / 2)
    # parallax: sky p=0.3
    p = 0.3
    sky_pt = (ref[0] + (cx - ref[0]) * p, ref[1] + (cy - ref[1]) * p)
    out = to_f(transform(sky, sky_pt, sc, z ** p, roll * p))[..., :3]
    gl = transform(ground, (cx, cy), sc, z, roll)
    out = over(out, to_f(gl))
    em = to_f(transform(emit, (cx, cy), sc, z, roll))
    out = screen(out, em[..., :3] * em[..., 3:4], 0.65)
    chars = Image.new('RGBA', (env.LW, env.LH), (0, 0, 0, 0))
    glows = []
    chars_fn(chars, glows)
    out = over(out, to_f(transform(chars, (cx, cy), sc, z, roll)))
    sg = [(fwd((x, y), (cx, cy), sc, z, roll), r * z, col, k) for (x, y, r, col, k) in glows]
    out = point_glows(out, [(p[0], p[1], r, col, k) for (p, r, col, k) in sg])
    # sun bloom
    if k_cold < 1:
        sp = fwd(env.SUN, sky_pt, sc, z ** 0.3, roll * 0.3)
        out = point_glows(out, [(sp[0], sp[1], 230, (255, 226, 170), 0.55 * (1 - k_cold))])
    if extra:
        out = extra(out)
    return finish(out, vig)


# ---- S1
KID1 = dict(X=-1.0, Z=2.6)
KID1_R = 115
RIV1_R = 13


def kid1_feet():
    return env.proj(KID1['X'], 0, KID1['Z'])


def s1_chars(f):
    def fn(layer, glows):
        sp = Pen(env.LW, env.LH, k=1)
        rfx, rfy = env.proj(0, 0, 24)
        kfx, kfy = kid1_feet()
        shadow_poly(sp, rfx, rfy, 16, 260, alpha=110)
        shadow_poly(sp, kfx, kfy, 120, 900, alpha=120)
        # tumbleweed rolling right -> left at Z=6
        t = seg(f, 0, 80)
        tX = lerp(5.5, -6.5, t)
        tz = 6.0
        tx, ty = env.proj(tX, 0, tz)
        r = 0.45 * env.scale_at(tz)
        bounce = abs(math.sin(t * math.pi * 3.2)) * 0.5 * r
        sp.ellipse(tx, ty, r * 0.9, r * 0.18, fill=(20, 14, 40, 90))
        layer.alpha_composite(sp.image())
        tp = Pen(env.LW, env.LH)
        tumbleweed(tp, tx, ty - r - bounce, r, -t * 900)
        layer.alpha_composite(tp.image())
        riv = rival_c(RIV1_R, facing=-1, expr='grin', amber=0.9)
        rimg = light_tint(riv['img'], sun_side=1, strength=0.2, dark=0.45, rim=(WARM_RIM, 0.9), rim_px=2)
        place_char(layer, riv, rfx, rfy, glows, img=rimg)
        tw = 0.0
        kid = kid_c(KID1_R, facing=1, back=True, twitch=tw, holster_side=1)
        kimg = light_tint(kid['img'], sun_side=1, strength=0.3, dark=0.35, rim=(WARM_RIM, 0.95), rim_px=5)
        place_char(layer, kid, kfx, kfy, glows, img=kimg)
    return fn


def s1_cam(f):
    k = ease_cubic(seg(f, 0, 66))
    cx, cy, z, roll = 700 - 10 * k, 1200 - 25 * k, 1.0 + 0.07 * k, 0.0
    # T1 swing-pitch: fast eased tilt down onto the Kid's holster (f66-81)
    kt = ease_cubic(seg(f, 66, 80))
    if kt > 0:
        kfx, kfy = kid1_feet()
        hx, hy = kfx + 0.75 * KID1_R, kfy - 1.6 * KID1_R
        cx, cy = lerp(cx, hx, kt), lerp(cy, hy, kt)
        z = lerp(z, 3.2, kt)
        roll = lerp(0, -8, kt)
    return cx, cy, z, roll


def S1(f):
    def extra(out):
        return dust(out, f, n=60, seed=1, strength=0.5)
    return render_street(f, s1_cam(f), s1_chars(f), 0.0, vig=0.36, extra=extra)


# ------------------------------------------------------------------ S2 holster macro
ML_W, ML_H = 1300, 2300
M_OFF = (110, 190)  # layer = screen + offset


@functools.lru_cache(maxsize=2)
def s2_background():
    L = env.street_layers(False)
    im = L['sky'].copy()
    im.alpha_composite(L['ground'])
    riv = draw_rival(13, facing=-1, expr='grin', amber=1.0)
    rfx, rfy = env.proj(0, 0, 24)
    place(im, riv['img'], rfx - riv['anchor'][0], rfy - riv['anchor'][1])
    crop = im.crop((700 - 260, 1060 - 460, 700 + 260, 1060 + 465)).resize((ML_W, ML_H), Image.BICUBIC).convert('RGB')
    a = crop.filter(ImageFilter.GaussianBlur(6))
    b = crop.filter(ImageFilter.GaussianBlur(18))
    return np.asarray(a), np.asarray(b)


@functools.lru_cache(maxsize=2)
def s2_static():
    p = Pen(ML_W, ML_H)
    ow = 13
    # legs (stick limbs, scaled up)
    p.line([(560, 1090), (500, 2400)], OUTLINE, 44)
    p.line([(250, 1110), (150, 2400)], OUTLINE, 44)
    # vest bottom
    p.poly([(-20, -20), (980, -20), (930, 640), (760, 990), (-20, 1060)], fill=MUSTARD, outline=OUTLINE, width=ow)
    p.poly([(330, -20), (430, -20), (420, 1030), (320, 1040)], fill=(245, 240, 230))
    p.line([(330, -20), (320, 1040)], OUTLINE, 6, caps=False)
    p.line([(430, -20), (420, 1030)], OUTLINE, 6, caps=False)
    # belt
    p.poly([(-20, 1000), (1320, 860), (1320, 990), (-20, 1130)], fill=LEATHER, outline=OUTLINE, width=ow)
    for bx in (120, 520, 1150):
        by = 1065 - bx * 0.105
        p.ellipse(bx, by, 26, 22, fill=GOLD_HOT, outline=OUTLINE, width=6)
    # holster
    hol = [(630, 950), (950, 915), (915, 1720), (720, 1745)]
    p.poly(hol, fill=(150, 90, 52), outline=OUTLINE, width=ow)
    for i in range(22):
        t0, t1 = i / 22.0, (i + 0.5) / 22.0
        a = (lerp(665, 742, t0), lerp(990, 1700, t0))
        b = (lerp(665, 742, t1), lerp(990, 1700, t1))
        p.line([a, b], (236, 196, 130), 5, caps=False)
    p.poly([(640, 1060), (945, 1025), (943, 1085), (638, 1120)], fill=(118, 68, 38), outline=OUTLINE, width=8)
    p.ellipse(790, 1072, 22, 22, fill=GOLD_HOT, outline=OUTLINE, width=5)
    # gun grip + hammer + gold trim
    p.poly([(840, 600), (905, 548), (930, 575), (880, 640)], fill=(70, 74, 88), outline=OUTLINE, width=9)
    p.poly([(690, 960), (640, 650), (735, 590), (870, 610), (900, 945)], fill=(112, 62, 40), outline=OUTLINE, width=ow)
    p.line([(700, 930), (665, 665), (740, 618), (858, 632)], GOLD_HOT, 9, caps=True)
    for gy in range(700, 900, 50):
        p.line([(700, gy), (860, gy - 10)], (88, 48, 30), 5, caps=False)
    return p.image()


def S2(f):
    lf = f - 72
    k = smooth(seg(f, 72, 124))
    a, b = s2_background()
    rack = smooth(seg(f, 80, 110))
    bg = (a.astype(np.float32) * (1 - rack) + b.astype(np.float32) * rack) / 255.0
    layer = Image.new('RGBA', (ML_W, ML_H), (0, 0, 0, 0))
    st = s2_static()
    st = light_tint(st, sun_side=1, strength=0.3, rim=(WARM_RIM, 0.85), rim_px=7)
    layer.alpha_composite(st)
    # hand + arm (twitches at f88 and f100)
    tw = 0.0
    for t0 in (88, 100):
        u = seg(f, t0, t0 + 5)
        tw += math.sin(u * math.pi) * (-26)
    hx, hy = 770, 380 + tw
    hp = Pen(ML_W, ML_H)
    hp.line([(260, -60), (hx - 40, hy - 40)], OUTLINE, 36)
    hp.ellipse(hx, hy, 92, 92, fill=SKIN, outline=OUTLINE, width=13)
    hp.ellipse(hx + 22, hy - 25, 60, 58, fill=(250, 228, 204))
    layer.alpha_composite(light_tint(hp.image(), sun_side=1, strength=0.35))
    # camera: slow push + slight roll; T1 entry from below (swing-pitch continuation)
    entry = 1 - ease_cubic(seg(f, 72, 84))
    z = 1.0 + 0.08 * k + 0.25 * entry
    roll = 2 * k - 8 * entry
    lp = (650 + 60 * k, 1150 - 180 * k + 260 * entry)
    sc = (W / 2, H / 2)
    bgi = transform(to_img(bg), (650, 1150), sc, 1 + 0.03 * k, roll * 0.5)
    out = to_f(bgi)
    out = over(out, to_f(transform(layer, lp, sc, z, roll)))
    # gold glint pulse on the trim (pack: emissive 100 -> 140 -> 100 %)
    g = (740, 618)
    gs = fwd(g, lp, sc, z, roll)
    pulse = 0.6 + 0.6 * math.sin(seg(f, 90, 106) * math.pi)
    out = point_glows(out, [(gs[0], gs[1], 60 * z, GOLD_HOT, pulse)])
    sp = Pen(W, H)
    rr = 70 * pulse * z
    sp.poly([(gs[0], gs[1] - rr), (gs[0] + rr * 0.18, gs[1]), (gs[0], gs[1] + rr), (gs[0] - rr * 0.18, gs[1])],
            fill=(255, 245, 210, 230))
    sp.poly([(gs[0] - rr, gs[1]), (gs[0], gs[1] + rr * 0.18), (gs[0] + rr, gs[1]), (gs[0], gs[1] - rr * 0.18)],
            fill=(255, 245, 210, 230))
    out = over(out, to_f(sp.image()))
    out = dust(out, f, n=40, seed=2, strength=0.45)
    return finish(out, 0.42)


# ------------------------------------------------------------------ S3 eyes duel
CW, CH = 1400, 2300
C_OFF = (160, 190)
KID3 = (430, 760)
RIV3 = (650, 800)
R3 = 300


@functools.lru_cache(maxsize=4)
def s3_face(who, expr):
    if who == 'kid':
        ch = draw_kid(R3, facing=1, expr=expr)
        img = light_tint(ch['img'], sun_side=-1, strength=0.35, rim=(WARM_RIM, 0.9), rim_px=10)
        hx, hy = KID3[0] + C_OFF[0], KID3[1] + C_OFF[1]
        fx, fy = hx, hy + 3.78 * R3
    else:
        ch = draw_rival(R3, facing=-1, expr=expr, amber=1.0)
        img = light_tint(ch['img'], sun_side=1, strength=0.3, rim=(WARM_RIM, 0.9), rim_px=10)
        hx, hy = RIV3[0] + C_OFF[0], RIV3[1] + C_OFF[1]
        fx, fy = hx, hy + 3.98 * R3
    layer = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
    glows = []
    pts = place_char(layer, ch, fx, fy, glows, img=img)
    return layer, glows, pts


def s3_canvas(f):
    a = smooth(seg(f, 145, 156))  # face-position dissolve Kid (left) -> Rival (right)
    bg0 = to_f(env.bokeh_sky(0))
    bg = bg0 if a <= 0 else bg0 * (1 - a) + to_f(env.bokeh_sky(1)) * a
    out = bg
    glows = []
    if a < 1:
        kl, kg, _ = s3_face('kid', 'sweat')
        kf = to_f(kl)
        kf[..., 3] *= (1 - a)
        # subtle breathing drift of the kid face
        out = over(out, kf)
        glows += [(x, y, r, c, k * (1 - a)) for (x, y, r, c, k) in kg]
    pupil = None
    if a > 0:
        g2 = smooth(seg(f, 160, 166))
        rl, rg, rp = s3_face('rival', 'grin')
        rf = to_f(rl)
        if g2 > 0:
            fl, fg, rp = s3_face('rival', 'flat')
            rf = rf * (1 - g2) + to_f(fl) * g2
        rf[..., 3] *= a
        out = over(out, rf)
        flare = 0.5 + 0.9 * smooth(seg(f, 150, 172))
        glows += [(x, y, r * (1 + 0.6 * flare), c, flare * a) for (x, y, r, c, k) in rg]
        pupil = rp['pupils'][0]
    return out, glows, pupil


def S3(f):
    canvas, glows, pupil = s3_canvas(f)
    canvas = point_glows_canvas(canvas, glows)
    roll = lerp(8, 12, seg(f, 112, 182))
    z = 1.0 + 0.05 * seg(f, 112, 170)
    lp, sp = (CW / 2, CH / 2), (W / 2, H / 2)
    t = seg(f, 170, 182)
    if t > 0 and pupil is not None:
        kz = t * t
        s = smooth(t)
        lp = (lerp(lp[0], pupil[0], s), lerp(lp[1], pupil[1], s))
        sp = (W / 2, lerp(H / 2, 1010, s))
        z = z * (7.0 ** kz)
        roll = lerp(roll, 0, s)
    out = to_f(transform(to_img(canvas), lp, sp, z, roll))
    out = dust(out, f, n=30, seed=3, strength=0.35)
    return finish(out, 0.4)


def point_glows_canvas(canvas, glows):
    # glows in canvas coords; canvas is CWxCH
    from lib import fx as _fx
    saveW, saveH = _fx.W, _fx.H
    _fx.W, _fx.H = CW, CH
    try:
        return _fx.point_glows(canvas, glows)
    finally:
        _fx.W, _fx.H = saveW, saveH


# ------------------------------------------------------------------ S4 + S5 profile duel
R4 = 95
KID4 = (460, 1300)
RIV4 = (1240, 1300)
KID_CHEST = (KID4[0], KID4[1] - 2.6 * R4)
RIV_CHEST = (RIV4[0], RIV4[1] - 2.6 * R4)


def s45_cam(f):
    base = (850 + 0.35 * max(0, f - 190), 1100)
    t0 = seg(f, 174, 192)
    s = smooth(t0)
    lp = (lerp(env.S_SUN[0], base[0], s), lerp(env.S_SUN[1], base[1], s))
    sp = (W / 2, lerp(1010, H / 2, s))
    z = lerp(1.3, 1.0, s)
    k1 = ease_cubic(seg(f, 203, 209))
    if k1 > 0:
        lp = (lerp(lp[0], RIV_CHEST[0], k1), lerp(lp[1], RIV_CHEST[1], k1))
        z = lerp(z, 1.3, k1)
    k2 = ease_cubic(seg(f, 209, 220))
    if k2 > 0:
        lp = (lerp(lp[0], KID_CHEST[0], k2), lerp(lp[1], KID_CHEST[1], k2))
    k3 = smooth(seg(f, 220, 228))
    z = z + 0.12 * k3
    return lp, sp, z


def S45(f):
    deep = smooth(seg(f, 180, 215))
    a = np.asarray(env.side_layers(0)).astype(np.float32)
    if deep > 0:
        a = a * (1 - deep) + np.asarray(env.side_layers(1)).astype(np.float32) * deep
    sky = Image.fromarray(a.astype(np.uint8), 'RGB')
    lp, sp, z = s45_cam(f)
    out = to_f(transform(sky, lp, sp, z, 0))
    dark = lerp(0.55, 0.3, smooth(seg(f, 203, 210)))
    layer = Image.new('RGBA', (env.SW, env.SH), (0, 0, 0, 0))
    glows = []
    kd = q(smooth(seg(f, 213, 219)), 12)
    rd = q(0.85 * smooth(seg(f, 210, 222)), 12)
    rexpr = 'flat' if f >= 206 else 'grin'
    riv = rival_c(R4, facing=-1, draw=rd, expr=rexpr, amber=1.0)
    kid = kid_c(R4, facing=1, draw=kd, expr='determined')
    sh = Pen(env.SW, env.SH, k=1)
    for (x, y) in (KID4, RIV4):
        sh.ellipse(x, y, 1.1 * R4, 0.2 * R4, fill=(16, 12, 34, 140))
    layer.alpha_composite(sh.image())
    place_char(layer, riv, *RIV4, glows,
               img=light_tint(riv['img'], sun_side=-1, strength=0.25, dark=dark, rim=(WARM_RIM, 1.0), rim_px=6))
    kp = place_char(layer, kid, *KID4, glows,
                    img=light_tint(kid['img'], sun_side=1, strength=0.25, dark=dark, rim=(WARM_RIM, 1.0), rim_px=6))
    out = over(out, to_f(transform(layer, lp, sp, z, 0)))
    gl = []
    for (x, y, r, c, k) in glows:
        p = fwd((x, y), lp, sp, z, 0)
        gl.append((p[0], p[1], r * z, c, k))
    sun = fwd(env.S_SUN, lp, sp, z, 0)
    gl.append((sun[0], sun[1], 300 * z, (255, 220, 160), 0.5))
    out = point_glows(out, gl)
    out = dust(out, f, n=50, seed=4, strength=0.45)
    # muzzle flash + gold blow-out (the Kid fires first)
    if 'muzzle' in kp and f >= 220:
        m = fwd(kp['muzzle'], lp, sp, z, 0)
        fk = {220: 0.7, 221: 1.0, 222: 0.9, 223: 0.7}.get(f, 0.5 if f < 229 else 0)
        out = muzzle_flash(out, fk, m[0], m[1], 170 * z)
        out = finish(out, 0.38)
        return gold_blowout(out, smooth(seg(f, 221, 227)), m[0], m[1])
    return finish(out, 0.38)


# ------------------------------------------------------------------ S6 aftermath + cold flip
KID6 = dict(X=-0.95, Z=2.5)
RIV6 = dict(X=1.2, Z=10.0)
R6K = 118
R6R = 30


def S6(f):
    f = min(f, FREEZE_FROM)
    k_cold = smooth(seg(f, 244, 257))
    fall = seg(f, 236, 252)
    fall_ang = -88 * fall * fall  # accelerate (ease-in) into the dust, falls backwards
    shot_t = (f - 221) / 30.0

    def chars(layer, glows):
        sp = Pen(env.LW, env.LH, k=1)
        rfx, rfy = env.proj(RIV6['X'], 0, RIV6['Z'])
        kfx, kfy = env.proj(KID6['X'], 0, KID6['Z'])
        sh_a = int(lerp(120, 60, k_cold))
        shadow_poly(sp, kfx, kfy, 120, 700, alpha=sh_a)
        if fall < 1:
            shadow_poly(sp, rfx, rfy, 34, 260 * (1 - fall), alpha=sh_a)
        layer.alpha_composite(sp.image())
        # rival
        expr = 'hollow' if f >= 236 else 'flat'
        riv = rival_c(R6R, facing=-1, draw=0.85 if f < 236 else 0.0, expr=expr, amber=0.9, hat_on=f < 234)
        rimg = light_tint(riv['img'], sun_side=1, strength=0.25, dark=0.3, rim=(WARM_RIM, 0.8 * (1 - k_cold)), rim_px=3)
        rimg = cold_flip_chars(rimg, k_cold)
        bounce = math.sin(seg(f, 252, 258) * math.pi) * 6
        place_char(layer, riv, rfx + 10 * fall, rfy - bounce, glows if f < 236 else None, img=rimg, rotate=fall_ang)
        # flying hat
        if f >= 234:
            ht = seg(f, 234, 262)
            hx = rfx + 30 + 110 * ht
            hy = rfy - 4.6 * R6R - 70 * math.sin(ht * math.pi * 0.9) + (4.6 * R6R) * ht * ht
            hat = draw_rival_hat(R6R, angle=-560 * ht)
            hi = cold_flip_chars(light_tint(hat['img'], strength=0.2), k_cold)
            place(layer, hi, hx - hat['anchor'][0], hy - hat['anchor'][1])
        # dust puff where he lands
        if f >= 250:
            dt = seg(f, 250, 278)
            dp = Pen(env.LW, env.LH)
            for i, (ox, oy, rr) in enumerate([(-50, 0, 30), (0, -12, 40), (60, 0, 34), (110, 4, 26), (20, 8, 30)]):
                r = rr * (0.6 + 1.6 * dt)
                al = int(170 * (1 - dt))
                col = lerpc((214, 160, 120), (90, 96, 160), k_cold)
                dp.ellipse(rfx + 90 + ox * (1 + dt), rfy - 10 + oy - 20 * dt, r, r * 0.7, fill=col + (al,))
            layer.alpha_composite(dp.image().filter(ImageFilter.GaussianBlur(3)))
        # kid: deadpan half-lids, gun still raised, smoke
        kid = kid_c(R6K, facing=1, draw=1.0, expr='deadpan')
        kimg = light_tint(kid['img'], sun_side=1, strength=0.3, rim=(WARM_RIM, 0.9 * (1 - k_cold)), rim_px=6)
        kimg = cold_flip_chars(kimg, k_cold * 0.9)
        kp = place_char(layer, kid, kfx, kfy, None, img=kimg)
        if 'badge' in kp:
            glows.append((kp['badge'][0], kp['badge'][1], 0.5 * R6K, GOLD_HOT, 0.55 + 0.45 * k_cold))
        if 'muzzle' in kp:
            smp = Pen(env.LW, env.LH)
            smoke(smp, kp['muzzle'][0], kp['muzzle'][1], shot_t, 1.6,
                  col=lerpc((225, 210, 220), (150, 160, 210), k_cold))
            layer.alpha_composite(smp.image().filter(ImageFilter.GaussianBlur(4)))

    k = ease_cubic(seg(f, 229, FREEZE_FROM))
    cam = (700 - 60 * k, 1200 - 30 * k, 1.0 + 0.08 * k, 0.0)

    def extra(out):
        out = dust(out, f, n=50, seed=6, strength=0.4 * (1 - k_cold) + 0.12,
                   color=lerpc((255, 214, 160), (170, 190, 255), k_cold))
        if k_cold > 0:
            # faint diagonal window light shafts at the top (pack f2265-2334)
            yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
            band = np.zeros((H, W), np.float32)
            for off in (220, 520):
                d = np.abs((xx - off) - (yy * 0.55))
                band += np.clip(1 - d / 70.0, 0, 1) * np.clip(1 - yy / 900.0, 0, 1)
            out = screen(out, (band * 0.07 * k_cold)[..., None] * np.array([0.8, 0.88, 1.0], np.float32), 1.0)
        return out

    vig = lerp(0.36, 0.5, k_cold)
    out = render_street(f, cam, chars, k_cold, vig=vig, extra=extra)
    # gold blow-out decays (continuation of S5's peak)
    out = gold_blowout(out, 1 - smooth(seg(f, 229, 242)), W / 2, H * 0.5)
    return out


# ------------------------------------------------------------------ dispatcher
def frame(f):
    f = int(f)
    if f < 72:
        out = S1(f)
    elif f < 82:
        a = smooth(seg(f, 72, 81))
        out = S1(f) * (1 - a) + S2(f) * a
    elif f < 112:
        out = S2(f)
    elif f < 125:
        a = smooth(seg(f, 112, 124))
        out = S2(f) * (1 - a) + S3(f) * a
    elif f < 174:
        out = S3(f)
    elif f < 183:
        a = smooth(seg(f, 174, 182))
        out = S3(f) * (1 - a) + S45(f) * a
    elif f < 229:
        out = S45(f)
    else:
        out = S6(f)
    return to_img(out)
