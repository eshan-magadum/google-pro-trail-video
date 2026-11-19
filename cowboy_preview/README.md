# Cowboy Duel Preview (10 s · 1080×1920 · 30 fps · Procedural)

A 10-second silent, caption-free vertical preview of a dusk quick-draw cowboy duel, rendered **100% procedurally in Python (Pillow + NumPy)** and finished with `ffmpeg` using the **`Every_Memory_Has_a_Price_STYLE_PACK_v2_FULL_FRAME_REVIEW.zip`** style pack.

## Style Pack Alignment
- **2.5D character/world split**: flat cel-coloured round-headed stick figures with thick black ink outlines (~1% of frame width), stick limbs, ball hands, and minimalist expressive faces inside layered gradient-lit dioramas.
- **Zero hard cuts**: every shot change is a camera swing, dissolve, shape match-cut, or gold blow-out.
- **Colour & lighting**: honey-gold sunset (`#F7D99F`) against royal-blue edges (`#3A448E`) and saturated lifted indigo shadows (`#0F0D25`), transitioning via a gold muzzle blow-out (`#FFE9A8`) into a cold-cobalt aftermath (`#20329B` → `#17183B`) with a frozen final second (frames 270–299).
- **Finishing grade**: uses `grade.sh` extracted directly from the style pack (`warm` for frames 0–227, `gloom` for frames 228–299, split invisibly at the blow-out peak).

## Shot List (300 frames @ 30 fps)
| Shot | Frames | Time | Description | Transition Out |
|---|---|---|---|---|
| **S1** | 0–74 | 0.0–2.5 s | Wide low-angle Main Street, slow push-in, tumbleweed, amber saloon windows | Swing-pitch down onto holster (T1) |
| **S2** | 75–119 | 2.5–4.0 s | Holster macro, ball-hand twitches, gold trim glint, rack focus | Face-position dissolve (T2) |
| **S3** | 120–179 | 4.0–6.0 s | Eyes duel (Kid with sweat drop → Rival with flaring amber pupils), Dutch tilt | Pupil-to-sun shape match-cut (T3) |
| **S4** | 180–209 | 6.0–7.0 s | Profile two-shot silhouette standoff, sky flushes deeper | Continuous camera |
| **S5** | 210–228 | 7.0–7.6 s | Fast eased whip-pan Rival → Kid, quick-draw, gold muzzle flash | Gold blow-out peak (f226–230) |
| **S6** | 229–299 | 7.6–10.0 s | Aftermath: Rival's hat spins off, he falls with hollow dot eyes; cold flip; warm light stays on Kid's badge; **frozen f270–299** | Frozen end frame |

## Build & Verify
```bash
cd cowboy_preview
./build.sh
```
This produces:
- `out/cowboy_duel_preview.mp4` — final graded 1080×1920 30 fps silent H.264 MP4
- `out/contact_sheet.jpg` — 30-tile contact sheet (every 10th frame)

To render a quick 12-frame preview sheet without encoding video:
```bash
python3 render.py --preview
```
To run automated checks on any rendered MP4:
```bash
python3 verify.py out/cowboy_duel_preview.mp4
```
