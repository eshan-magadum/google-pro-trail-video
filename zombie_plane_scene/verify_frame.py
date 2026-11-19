#!/usr/bin/env python3
"""
Photometric & Style-Compliance Verifier for the 2.5D Zombie Plane Frame.
Checks the rendered PNG against the measured targets from Every_Memory_Has_a_Price_25D_Code_Skill.zip.
"""
import sys
import numpy as np
from PIL import Image


def laplacian_var(gray):
    lap = (
        -4.0 * gray[1:-1, 1:-1]
        + gray[:-2, 1:-1]
        + gray[2:, 1:-1]
        + gray[1:-1, :-2]
        + gray[1:-1, 2:]
    )
    return float(np.var(lap))


def check(label, ok, detail):
    print(f"[{'PASS' if ok else 'FAIL'}] {label}: {detail}")
    return ok


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "out/zombie_plane_frame.png"
    im = Image.open(path).convert("RGB")
    w, h = im.size

    # Half-res for consistent Laplacian comparison with 360x640 reference analysis
    arr = np.asarray(im.resize((360, 640), Image.BILINEAR), dtype=np.float32)
    R, G, B = arr[..., 0], arr[..., 1], arr[..., 2]
    luma = 0.2126 * R + 0.7152 * G + 0.0722 * B

    cmax = np.maximum(np.maximum(R, G), B)
    cmin = np.minimum(np.minimum(R, G), B)
    sat = np.where(cmax > 1.0, (cmax - cmin) / (cmax + 1e-6), 0.0)

    mean_luma = float(np.mean(luma))
    p05, p95 = [float(x) for x in np.percentile(luma, [5, 95])]
    mean_sat = float(np.mean(sat))
    sh_mask = luma < 45.0
    sh_sat = float(np.mean(sat[sh_mask])) if np.any(sh_mask) else mean_sat
    pct_bloom = float(np.mean(luma > 235.0) * 100.0)

    dark = arr[luma <= p05]
    dr, dg, db = float(dark[:, 0].mean()), float(dark[:, 1].mean()), float(dark[:, 2].mean())

    H, W = luma.shape
    ch, cw = int(H * 0.15), int(W * 0.15)
    corners = np.concatenate([
        luma[:ch, :cw].ravel(), luma[:ch, -cw:].ravel(),
        luma[-ch:, :cw].ravel(), luma[-ch:, -cw:].ravel(),
    ])
    center = luma[int(H * 0.35):int(H * 0.65), int(W * 0.35):int(W * 0.65)]
    vig = float(np.mean(corners) / (np.mean(center) + 1e-4))

    sh_ctr = laplacian_var(luma[int(H * 0.25):int(H * 0.75), int(W * 0.20):int(W * 0.80)])
    sh_brd = float(np.mean([
        laplacian_var(luma[:int(H * 0.20), :]),
        laplacian_var(luma[int(H * 0.80):, :]),
        laplacian_var(luma[:, :int(W * 0.18)]),
        laplacian_var(luma[:, int(W * 0.82):]),
    ]))
    dof_ratio = sh_ctr / (sh_brd + 1.0)

    ok = True
    ok &= check("Resolution 9:16 master", (w, h) == (1080, 1920), f"{w}x{h}")
    ok &= check("Gloom mean luma (40-95)", 40.0 <= mean_luma <= 95.0, f"mean={mean_luma:.1f}, P05={p05:.1f}, P95={p95:.1f}")
    ok &= check("Lifted saturated indigo shadows", db > dr and db > dg and db > 14 and sh_sat >= 0.48,
                f"P05 RGB=({dr:.1f}, {dg:.1f}, {db:.1f}), shadow_sat={sh_sat:.3f}, mean_sat={mean_sat:.3f}")
    ok &= check("Radial indigo vignette (0.18-0.55)", 0.18 <= vig <= 0.55, f"corner/center={vig:.3f}")
    ok &= check("Restrained practical bloom (0.1%-12%)", 0.1 <= pct_bloom <= 12.0, f"bloom(>235)={pct_bloom:.2f}%")
    ok &= check("Focal center sharpness > borders", sh_ctr > sh_brd,
                f"sharp_ctr={sh_ctr:.1f}, sharp_brd={sh_brd:.1f}, ratio={dof_ratio:.2f}x")

    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
