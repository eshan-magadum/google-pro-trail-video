#!/usr/bin/env python3
"""Render the 300-frame 1080x1920 30 fps duel to out/raw.mp4 (silent) via ffmpeg.

Usage:
  python3 render.py                 # full 300-frame render -> out/raw.mp4
  python3 render.py --preview       # render 12 key frames -> out/preview_sheet.jpg
  python3 render.py -j 2            # worker count (default: cpu_count)
"""
import argparse
import os
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor
from PIL import Image, ImageDraw, ImageFont

from lib.util import W, H, FPS
import timeline

TOTAL = 300
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def _render_one(f):
    return f, timeline.frame(f).tobytes()


def _render_thumb(args):
    f, tw, th = args
    im = timeline.frame(f).resize((tw, th), Image.LANCZOS)
    return f, im


def make_sheet(frames, out_path, cols=6, tw=270, th=480, workers=2):
    os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)
    rows = (len(frames) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * tw, rows * th), (15, 13, 37))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype(FONT, 20)
    except Exception:
        font = ImageFont.load_default()
    with ProcessPoolExecutor(max_workers=workers) as ex:
        results = list(ex.map(_render_thumb, [(f, tw, th) for f in frames]))
    for idx, (f, im) in enumerate(results):
        r, c = divmod(idx, cols)
        x, y = c * tw, r * th
        sheet.paste(im, (x, y))
        label = f"f{f:03d} ({f / FPS:.2f}s)"
        draw.rectangle([x + 4, y + 4, x + 150, y + 30], fill=(15, 13, 37))
        draw.text((x + 10, y + 7), label, fill=(247, 217, 159), font=font)
    sheet.save(out_path, quality=92)
    print(f"Saved {out_path} ({len(frames)} tiles)")


def render_video(out_path, workers=2):
    os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)
    cmd = [
        'ffmpeg', '-y', '-loglevel', 'error',
        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
        '-i', '-',
        '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14',
        '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
        out_path,
    ]
    t0 = time.time()
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    # Frames 0..269 are unique; 270..299 are frozen copies of 269.
    unique_frames = list(range(timeline.FREEZE_FROM + 1))
    frozen_bytes = None
    try:
        with ProcessPoolExecutor(max_workers=workers) as ex:
            for f, data in ex.map(_render_one, unique_frames, chunksize=4):
                proc.stdin.write(data)
                if f == timeline.FREEZE_FROM:
                    frozen_bytes = data
                if (f + 1) % 30 == 0 or f == timeline.FREEZE_FROM:
                    dt = time.time() - t0
                    print(f"Rendered {f + 1}/{len(unique_frames)} unique frames ({dt:.1f}s)", flush=True)
        for _ in range(timeline.FREEZE_FROM + 1, TOTAL):
            proc.stdin.write(frozen_bytes)
        proc.stdin.close()
        ret = proc.wait()
        if ret != 0:
            raise RuntimeError(f"ffmpeg exited with code {ret}")
    finally:
        if proc.poll() is None:
            proc.kill()
    print(f"Wrote {out_path} ({TOTAL} frames) in {time.time() - t0:.1f}s")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--preview', action='store_true', help='Render 12 key frames to out/preview_sheet.jpg')
    ap.add_argument('--out', default='out/raw.mp4')
    ap.add_argument('-j', '--workers', type=int, default=os.cpu_count() or 2)
    args = ap.parse_args()
    if args.preview:
        keys = [10, 68, 88, 118, 136, 164, 178, 195, 216, 222, 236, 269]
        make_sheet(keys, 'out/preview_sheet.jpg', cols=4, tw=270, th=480, workers=args.workers)
    else:
        render_video(args.out, workers=args.workers)


if __name__ == '__main__':
    main()
