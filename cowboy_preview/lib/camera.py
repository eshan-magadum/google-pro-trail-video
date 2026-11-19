"""Virtual camera: affine (zoom / roll / pan) per layer with parallax.

A camera pose maps a point in *layer* coordinates (layer_pt) to a *screen* point (screen_pt),
with zoom and roll around that point. Parallax: each layer receives its own pose derived from a
base pose and a depth factor p (p<1 = far, moves less; p>1 = near, moves more).
"""
import math
from PIL import Image
from .util import W, H


def transform(img, layer_pt, screen_pt, zoom=1.0, roll=0.0, size=(W, H), resample=Image.BICUBIC):
    m = 1.0 / zoom
    a = math.radians(roll)
    ca, sa = math.cos(a), math.sin(a)
    # input = layer_pt + m * Rot(a) * (out - screen_pt)
    A, B = m * ca, -m * sa
    D, E = m * sa, m * ca
    C = layer_pt[0] - A * screen_pt[0] - B * screen_pt[1]
    F = layer_pt[1] - D * screen_pt[0] - E * screen_pt[1]
    fill = (0, 0, 0, 0) if img.mode == 'RGBA' else None
    kw = {'fillcolor': fill} if fill is not None else {}
    return img.transform(size, Image.AFFINE, (A, B, C, D, E, F), resample=resample, **kw)


class Pose:
    """Base camera pose for a scene: centre (layer coords at depth p=1) shown at screen centre."""

    def __init__(self, cx, cy, zoom=1.0, roll=0.0, anchor=(W / 2, H / 2)):
        self.cx, self.cy, self.zoom, self.roll, self.anchor = cx, cy, zoom, roll, anchor

    def for_depth(self, p, ref):
        """Return (layer_pt, screen_pt, zoom, roll) for a layer of depth p.
        ref = layer point the scene treats as 'neutral' (where parallax offsets are measured from)."""
        cx = ref[0] + (self.cx - ref[0]) * p
        cy = ref[1] + (self.cy - ref[1]) * p
        z = self.zoom ** p
        return (cx, cy), self.anchor, z, self.roll

    def apply(self, img, p=1.0, ref=None):
        ref = ref or (self.cx, self.cy)
        lp, sp, z, r = self.for_depth(p, ref)
        return transform(img, lp, sp, z, r)
