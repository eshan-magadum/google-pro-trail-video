#!/usr/bin/env python3
"""
Automated QA Verifier for the 69-Second SRT-Synced 2.5D Parachute Hole Short.
Verifies:
  1. 1080x1920 (9:16), constant 30.00 fps, exact 2,070 frames (69.00 s)
  2. Strictly silent (0 audio streams)
  3. ZERO hard cuts across all 2,069 consecutive frame seams
  4. Lifted saturated indigo shadows & radial vignette in Hangar (S01/S03) & Stormy Sky (S06)
  5. T06 Cloud Blow-Out peak luminance (>= 210)
  6. Underwater Cup (S08) & Golden Vent Reveal (S09) color richness
  7. Final 1.00-second dead-still Freeze Hold (f2040-2069)
"""
import json
import subprocess
import sys
import numpy as np


def ffprobe_info(path):
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", path],
        text=True,
    )
    return json.loads(out)


def decode_frames(path, w=180, h=320):
    raw = subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", path,
        "-vf", f"scale={w}:{h}:flags=area",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
    ])
    arr = np.frombuffer(raw, dtype=np.uint8)
    n = arr.size // (h * w * 3)
    return arr[: n * h * w * 3].reshape(n, h, w, 3)


def frame_stats(rgb):
    arr = rgb.astype(np.float32)
    R, G, B = arr[..., 0], arr[..., 1], arr[..., 2]
    luma = 0.2126 * R + 0.7152 * G + 0.0722 * B
    cmax = np.maximum(np.maximum(R, G), B)
    cmin = np.minimum(np.minimum(R, G), B)
    sat = np.where(cmax > 1.0, (cmax - cmin) / np.maximum(cmax, 1.0), 0.0)
    H, W = luma.shape
    ch, cw = int(H * 0.15), int(W * 0.15)
    corners = np.concatenate([
        luma[:ch, :cw].ravel(), luma[:ch, -cw:].ravel(),
        luma[-ch:, :cw].ravel(), luma[-ch:, -cw:].ravel(),
    ])
    center = luma[int(H * 0.35):int(H * 0.65), int(W * 0.35):int(W * 0.65)]
    vig = float(corners.mean() / max(center.mean(), 1e-3))
    p05 = float(np.percentile(luma, 5))
    dark = arr[luma <= p05]
    dr, dg, db = float(dark[:, 0].mean()), float(dark[:, 1].mean()), float(dark[:, 2].mean())
    sh_mask = luma < 45.0
    sh_sat = float(sat[sh_mask].mean()) if np.any(sh_mask) else float(sat.mean())
    return {
        "luma": float(luma.mean()),
        "sat": float(sat.mean()),
        "sh_sat": sh_sat,
        "vig": vig,
        "p05_rgb": (dr, dg, db),
    }


def check(label, ok, detail):
    print(f"[{'PASS' if ok else 'FAIL'}] {label}: {detail}")
    return ok


def main():
    video = sys.argv[1] if len(sys.argv) > 1 else "out/parachute_hole_short.mp4"
    info = ffprobe_info(video)
    vs = next(s for s in info["streams"] if s["codec_type"] == "video")
    astreams = [s for s in info["streams"] if s["codec_type"] == "audio"]
    w, h = int(vs["width"]), int(vs["height"])
    num, den = map(int, vs["r_frame_rate"].split("/"))
    fps = num / den
    dur = float(info["format"]["duration"])

    frames = decode_frames(video)
    n = len(frames)

    ok = True
    ok &= check("Resolution 9:16 master", (w, h) == (1080, 1920), f"{w}x{h}")
    ok &= check("Constant 30 FPS & 69.0s (2070 frames)", abs(fps - 30.0) < 0.01 and n == 2070 and abs(dur - 69.0) < 0.15,
                f"{fps:.2f} fps, {n} frames, {dur:.2f} s")
    ok &= check("Silent master (0 audio streams)", len(astreams) == 0, f"{len(astreams)} audio streams")

    # Zero hard cuts across all 2,069 consecutive frame seams
    diffs = np.abs(frames[1:].astype(np.float32) - frames[:-1].astype(np.float32)).mean(axis=(1, 2, 3))
    hard_cuts = []
    for i in range(len(diffs)):
        lo, hi = max(0, i - 4), min(len(diffs), i + 5)
        med = float(np.median(diffs[lo:hi]))
        if diffs[i] > max(28.0, 4.0 * med):
            hard_cuts.append((i + 1, round(float(diffs[i]), 1), round(med, 1)))
    ok &= check("Zero hard cuts across all 2069 seams", len(hard_cuts) == 0, f"detected={hard_cuts[:5]}")

    # S01 Hangar gloom & lifted indigo shadows (f105)
    s1 = frame_stats(frames[105])
    dr, dg, db = s1["p05_rgb"]
    ok &= check("S01 Hangar lifted indigo shadows & vignette",
                db > dr and db > dg and db > 14.0 and 0.18 <= s1["vig"] <= 0.75,
                f"luma={s1['luma']:.1f}, P05 RGB=({dr:.1f},{dg:.1f},{db:.1f}), vig={s1['vig']:.3f}, sat={s1['sat']:.3f}")

    # S06 Stormy Pendulum Chaos (f1260)
    s6 = frame_stats(frames[1260])
    sr, sg, sb = s6["p05_rgb"]
    ok &= check("S06 Stormy Sky lifted cobalt shadows",
                sb > sr and sb > sg and sb > 14.0 and s6["sat"] >= 0.30,
                f"luma={s6['luma']:.1f}, P05 RGB=({sr:.1f},{sg:.1f},{sb:.1f}), sat={s6['sat']:.3f}")

    # T06 Cloud Blow-Out Peak (f1386-1398)
    peak_luma = max(frame_stats(frames[i])["luma"] for i in range(1386, 1399))
    ok &= check("T06 Cloud Blow-Out Flash Peak (f1386-1398)", peak_luma >= 210.0, f"peak_luma={peak_luma:.1f}")

    # S08 Underwater Cup Analogy (f1765) & S09 Golden Vent Reveal (f2000)
    s8 = frame_stats(frames[1765])
    s9 = frame_stats(frames[2000])
    ok &= check("S08 Underwater Cup & S09 Golden Vent richness",
                s8["sat"] >= 0.35 and s9["sat"] >= 0.30,
                f"S08 sat={s8['sat']:.3f} luma={s8['luma']:.1f} | S09 sat={s9['sat']:.3f} luma={s9['luma']:.1f}")

    # Final 1.00s Freeze Hold (f2040-2069)
    end_std = float(frames[2040:2070].astype(np.float32).std(axis=0).mean())
    ok &= check("Final 1.00s Freeze Hold (f2040-2069)", end_std < 0.5, f"pixel_std={end_std:.4f}")

    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
