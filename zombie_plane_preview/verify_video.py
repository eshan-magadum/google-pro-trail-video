#!/usr/bin/env python3
"""
Comprehensive Automated QA Verifier for the 10-Second 2.5D Zombie Plane Preview Video.
Verifies container spec, 30.00 FPS / 300 frames, zero hard cuts, Shot 2 lifted indigo shadows
& radial vignette, T4 lightning blow-out peak, Shot 5 cold-cobalt flip, 1.0s ending freeze hold,
and -14.0 LUFS audio mastering.
"""
import json
import re
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


def check_lufs(path):
    proc = subprocess.run(
        ["ffmpeg", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
        stderr=subprocess.PIPE, stdout=subprocess.DEVNULL, text=True,
    )
    m_i = re.findall(r"I:\s+(-?\d+\.\d+)\s+LUFS", proc.stderr)
    m_tp = re.findall(r"Peak:\s+(-?\d+\.\d+)\s+dBFS", proc.stderr)
    return (float(m_i[-1]) if m_i else None, float(m_tp[-1]) if m_tp else None)


def check(label, ok, detail):
    print(f"[{'PASS' if ok else 'FAIL'}] {label}: {detail}")
    return ok


def frame_stats(frame_rgb):
    arr = frame_rgb.astype(np.float32)
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
        "mean_luma": float(luma.mean()),
        "mean_sat": float(sat.mean()),
        "sh_sat": sh_sat,
        "vig": vig,
        "p05_rgb": (dr, dg, db),
    }


def main():
    video = sys.argv[1] if len(sys.argv) > 1 else "out/zombie_plane_preview.mp4"
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
    ok &= check("Constant 30 FPS & 10.0s (300 frames)", abs(fps - 30.0) < 0.01 and n == 300 and abs(dur - 10.0) < 0.15,
                f"{fps:.2f} fps, {n} frames, {dur:.2f} s")

    # Zero hard cuts check (no isolated 1-frame jump > max(28, 4x local median))
    diffs = np.abs(frames[1:].astype(np.float32) - frames[:-1].astype(np.float32)).mean(axis=(1, 2, 3))
    hard_cuts = []
    for i in range(len(diffs)):
        lo, hi = max(0, i - 4), min(len(diffs), i + 5)
        med = float(np.median(diffs[lo:hi]))
        if diffs[i] > max(28.0, 4.0 * med):
            hard_cuts.append((i + 1, round(float(diffs[i]), 1), round(med, 1)))
    ok &= check("Zero hard cuts across all 299 seams", len(hard_cuts) == 0, f"detected={hard_cuts[:5]}")

    # Shot 2 Wide Aisle Hero Reveal (f085) — Lifted Indigo Gloom + Radial Vignette
    s2 = frame_stats(frames[85])
    dr, dg, db = s2["p05_rgb"]
    ok &= check("Shot 2 (f085) Gloom luma & saturation",
                40.0 <= s2["mean_luma"] <= 95.0 and 0.30 <= s2["mean_sat"] <= 0.80,
                f"luma={s2['mean_luma']:.1f}, sat={s2['mean_sat']:.3f}")
    ok &= check("Shot 2 (f085) Lifted indigo shadows",
                db > dr and db > dg and db > 14.0 and s2["sh_sat"] >= 0.45,
                f"P05 RGB=({dr:.1f}, {dg:.1f}, {db:.1f}), sh_sat={s2['sh_sat']:.3f}")
    ok &= check("Shot 2 (f085) Radial indigo vignette",
                0.18 <= s2["vig"] <= 0.65,
                f"corner/center={s2['vig']:.3f}")

    # T4 Lightning Blow-Out Peak (f222-230)
    peak_luma = max(frame_stats(frames[i])["mean_luma"] for i in range(222, 231))
    ok &= check("T4 Blow-Out Flash Peak (f222-230)", peak_luma >= 210.0, f"peak_luma={peak_luma:.1f}")

    # Shot 5 Cold-Cobalt Twist Close-Up (f280)
    s5 = frame_stats(frames[280])
    cr, cg, cb = s5["p05_rgb"]
    ok &= check("Shot 5 (f280) Cold-cobalt shadows",
                cb > cr and cb > cg and cb > 14.0,
                f"luma={s5['mean_luma']:.1f}, P05 RGB=({cr:.1f}, {cg:.1f}, {cb:.1f}), vig={s5['vig']:.3f}")

    # Exact 1.0s Freeze Hold (f270-299)
    end_std = float(frames[270:300].astype(np.float32).std(axis=0).mean())
    ok &= check("Final 1.0s Freeze Hold (f270-299)", end_std < 0.5, f"pixel_std={end_std:.4f}")

    if astreams:
        lufs, tp = check_lufs(video)
        if lufs is not None:
            ok &= check("Audio Mastering (-14 LUFS +/-2.0)",
                        -16.0 <= lufs <= -12.0 and (tp is None or tp <= -0.8),
                        f"{lufs:.1f} LUFS, peak {tp:.1f} dBFS")

    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
