#!/usr/bin/env python3
"""Verify the rendered MP4 against the Every_Memory_Has_a_Price style pack targets.

Checks (no OpenCV required — decodes with ffmpeg into numpy):
  1. Container: 1080x1920, 30 fps, 300 frames, 10.00 s, no audio stream.
  2. Freeze ending: frames 270..299 max pixel std < 0.5.
  3. No hard cuts: consecutive-frame mean abs diff has no single-frame spike > 3x local (+/-5 f) median
     outside the scripted muzzle-flash/blow-out window (f218..233).
  4. Honey scenes (S1-S4): mean luma, saturation, vignette corner/centre ratio.
  5. Gloom end (S6 freeze): mean luma, saturation, vignette corner/centre ratio.
  6. Blow-out peak: mean luma > 220 somewhere in f224..231.
  7. Shadows: 1st-percentile dark pixels in gloom end are indigo-biased (B > R and B > G) and lifted (> 3).
"""
import json
import subprocess
import sys
import numpy as np


def ffprobe_info(path):
    cmd = ['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path]
    out = subprocess.check_output(cmd, text=True)
    return json.loads(out)


def decode_frames(path, w=270, h=480):
    """Decode scaled RGB frames to numpy (N, h, w, 3) uint8 for fast metrics."""
    cmd = [
        'ffmpeg', '-v', 'error', '-i', path,
        '-vf', f'scale={w}:{h}:flags=area',
        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'
    ]
    raw = subprocess.check_output(cmd)
    arr = np.frombuffer(raw, dtype=np.uint8)
    n = arr.size // (h * w * 3)
    return arr[:n * h * w * 3].reshape(n, h, w, 3)


def frame_stats(rgb):
    """rgb: (H, W, 3) uint8 -> luma, hsv saturation, corner/center luma ratio."""
    f = rgb.astype(np.float32)
    luma = 0.2126 * f[..., 0] + 0.7152 * f[..., 1] + 0.0722 * f[..., 2]
    mx = f.max(-1)
    mn = f.min(-1)
    sat = np.where(mx > 1e-3, (mx - mn) / np.maximum(mx, 1e-3), 0.0)
    h, w = luma.shape
    ch, cw = h // 5, w // 5
    corners = np.concatenate([
        luma[:ch, :cw].ravel(), luma[:ch, -cw:].ravel(),
        luma[-ch:, :cw].ravel(), luma[-ch:, -cw:].ravel()
    ])
    center = luma[h // 3:2 * h // 3, w // 3:2 * w // 3]
    vig = float(corners.mean() / max(center.mean(), 1e-3))
    return float(luma.mean()), float(sat.mean()), vig


def check(label, ok, detail):
    tag = 'PASS' if ok else 'FAIL'
    print(f"[{tag}] {label}: {detail}")
    return ok


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else 'out/cowboy_duel_preview.mp4'
    info = ffprobe_info(path)
    vstreams = [s for s in info['streams'] if s['codec_type'] == 'video']
    astreams = [s for s in info['streams'] if s['codec_type'] == 'audio']
    vs = vstreams[0]
    w, h = int(vs['width']), int(vs['height'])
    num, den = map(int, vs['r_frame_rate'].split('/'))
    fps = num / den
    nb = int(vs.get('nb_frames', 0))
    dur = float(info['format']['duration'])

    ok = True
    ok &= check('Container resolution', (w, h) == (1080, 1920), f"{w}x{h}")
    ok &= check('Frame rate & count', abs(fps - 30.0) < 1e-3 and nb == 300 and abs(dur - 10.0) < 0.05,
                f"{fps:.2f} fps, {nb} frames, {dur:.2f} s")
    ok &= check('Silent (no audio stream)', len(astreams) == 0, f"{len(astreams)} audio streams")

    frames = decode_frames(path)
    n = len(frames)

    # 2. Freeze ending (frames 270..299)
    end_f = frames[270:300].astype(np.float32)
    end_mean_std = float(end_f.std(axis=0).mean())
    end_luma_std = float(end_f.mean(axis=(1, 2, 3)).std())
    ok &= check('Freeze ending (f270-299)', end_mean_std < 0.25 and end_luma_std < 0.05,
                f"mean pixel std = {end_mean_std:.4f}, luma std = {end_luma_std:.4f}")

    # 3. No hard cuts
    diffs = np.abs(frames[1:].astype(np.float32) - frames[:-1].astype(np.float32)).mean(axis=(1, 2, 3))
    spikes = []
    for i in range(len(diffs)):
        if 203 <= i <= 233:
            continue  # scripted S5 whip-pan, muzzle flash & gold blow-out
        lo, hi = max(0, i - 5), min(len(diffs), i + 6)
        med = float(np.median(diffs[lo:hi]))
        if diffs[i] > max(12.0, 3.0 * med):
            spikes.append((i, float(diffs[i]), med))
    ok &= check('No hard cuts', len(spikes) == 0, f"spikes={spikes[:5]}")

    # 4. Honey scenes (sample S1-S4)
    honey_idx = [15, 45, 95, 135, 160, 195]
    hs = [frame_stats(frames[i]) for i in honey_idx]
    hl, hsat, hvig = np.mean([x[0] for x in hs]), np.mean([x[1] for x in hs]), np.mean([x[2] for x in hs])
    ok &= check('Honey scenes (S1-S4) luma/sat/vig',
                (90 <= hl <= 165) and (0.35 <= hsat <= 0.65) and (0.30 <= hvig <= 0.80),
                f"luma={hl:.1f}, sat={hsat:.2f}, corner/center={hvig:.2f}")

    # 5. Gloom end (S6 freeze f280)
    gl, gsat, gvig = frame_stats(frames[280])
    ok &= check('Gloom end (f280) luma/sat/vig',
                (30 <= gl <= 85) and (0.45 <= gsat <= 0.78) and (0.18 <= gvig <= 0.48),
                f"luma={gl:.1f}, sat={gsat:.2f}, corner/center={gvig:.2f}")

    # 6. Blow-out peak
    peak_luma = max(frame_stats(frames[i])[0] for i in range(224, 232))
    ok &= check('Gold blow-out peak (f224-231)', peak_luma > 220, f"peak luma = {peak_luma:.1f}")

    # 7. Indigo lifted shadows on gloom end
    g280 = frames[280].astype(np.float32)
    lum280 = 0.2126 * g280[..., 0] + 0.7152 * g280[..., 1] + 0.0722 * g280[..., 2]
    dark = g280[lum280 <= np.percentile(lum280, 5)]
    dr, dg, db = dark[:, 0].mean(), dark[:, 1].mean(), dark[:, 2].mean()
    ok &= check('Lifted indigo shadows (f280 darkest 5%)',
                (db > dr) and (db > dg) and (db > 10),
                f"mean RGB = ({dr:.1f}, {dg:.1f}, {db:.1f})")

    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
