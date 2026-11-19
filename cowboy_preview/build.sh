#!/usr/bin/env bash
# End-to-end build for the 10 s cowboy duel preview:
#   1. Extract grade.sh from the repo's style-pack zip (and fix RGB screen-blend)
#   2. Render 300 raw frames -> out/raw.mp4 (skipped if --grade-only is passed)
#   3. Split at f228 (gold blow-out peak) and grade warm (f0-227) + gloom (f228-299)
#   4. Concatenate to out/cowboy_duel_preview.mp4 (1080x1920, 30 fps, H.264, silent)
#   5. Generate out/contact_sheet.jpg (every 10th frame) and run verify.py
set -euo pipefail
cd "$(dirname "$0")"

GRADE_ONLY=0
if [[ "${1:-}" == "--grade-only" ]]; then
  GRADE_ONLY=1
fi

ZIP="../Every_Memory_Has_a_Price_STYLE_PACK_v2_FULL_FRAME_REVIEW.zip"
mkdir -p build out

python3 - "$ZIP" <<'PY'
import sys, zipfile, os
with zipfile.ZipFile(sys.argv[1]) as z:
    text = z.read("Every_Memory_Has_a_Price_STYLE_PACK_v2/grade.sh").decode("utf-8")
# Fix ffmpeg YUV screen-blend magenta bug: force RGB (gbrp) before split/blend.
# Also soften grade.sh's vignette slightly since our procedural render already applies vignette,
# keeping final corner/center ratio right in the pack's target range (0.25-0.42 gloom, 0.45-0.67 warm).
text = text.replace(
    "${GRADE},${VIG},split[a][b];",
    "${GRADE},${VIG},format=gbrp,split[a][b];"
)
text = text.replace("VIG=\"vignette=angle=PI/4\"", "VIG=\"null\"")
text = text.replace("gamma=0.95", "gamma=1.18")
text = text.replace("VIG=\"vignette=angle=PI/6\"", "VIG=\"null\"")
out = "build/grade.sh"
with open(out, "w", encoding="utf-8") as f:
    f.write(text)
os.chmod(out, 0o755)
PY

if [[ "$GRADE_ONLY" -eq 0 ]]; then
  echo "==> Rendering 300 frames..."
  python3 render.py --out out/raw.mp4
fi

echo "==> Splitting at f228 (blow-out peak) and grading with style-pack grade.sh..."
ffmpeg -y -loglevel error -i out/raw.mp4 -vf "trim=start_frame=0:end_frame=228,setpts=PTS-STARTPTS" \
  -an -c:v libx264 -preset fast -crf 12 -pix_fmt yuv420p build/raw_a.mp4
ffmpeg -y -loglevel error -i out/raw.mp4 -vf "trim=start_frame=228:end_frame=300,setpts=PTS-STARTPTS" \
  -an -c:v libx264 -preset fast -crf 12 -pix_fmt yuv420p build/raw_b.mp4

./build/grade.sh build/raw_a.mp4 build/graded_a.mp4 warm
./build/grade.sh build/raw_b.mp4 build/graded_b.mp4 gloom

echo "==> Concatenating final MP4..."
ffmpeg -y -loglevel error -i build/graded_a.mp4 -i build/graded_b.mp4 \
  -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0,fps=30[v]" \
  -map "[v]" -an -c:v libx264 -preset slow -crf 15 \
  -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart \
  out/cowboy_duel_preview.mp4

echo "==> Building contact sheet (every 10th frame)..."
ffmpeg -y -loglevel error -i out/cowboy_duel_preview.mp4 \
  -vf "select='not(mod(n,10))',scale=270:480,tile=6x5" -frames:v 1 -q:v 3 out/contact_sheet.jpg

echo "==> Verifying..."
python3 verify.py out/cowboy_duel_preview.mp4
echo "Done: out/cowboy_duel_preview.mp4"
