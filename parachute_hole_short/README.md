# 69-Second 2.5D Animated YouTube Short: *"The Parachute With a Hole Cut in the Middle"*

A **69.00-second (`2,070 frames @ 30.00 FPS`), `1080×1920` (9:16), silent (`0 audio streams`), caption-free** vertical animated Short rendered **100% from code** (Three.js WebGL2 + dynamic procedural Canvas2D PBR textures & animated 2D cel character rigs + `ffmpeg` Lanczos master), synchronized millisecond-for-millisecond to the ElevenLabs Jeremy voiceover SRT (`00:00.190 → 01:07.710`) plus a `1.00 s` frozen bullseye victory hold (`f2040–2069`).

Built strictly following `Every_Memory_Has_a_Price_25D_Code_Skill.zip`.

## 10-Scene, Zero-Hard-Cut Breakdown (Synced to SRT)
1. **S01 (`00:00.00–04.50`) — The Cut:** Overhead macro on white parachute silk as shears slice a dinner-plate circle; camera pulls back to reveal the glowing crimson `10:00` countdown clock.
2. **S02 (`00:04.50–11.30`) — The 10,000-ft Contract:** Crane sweep to the illuminated `AIRDROP TRIALS • 10,000 FT` briefing board with pulsing `TARGET` bullseye & golden `CONTRACT $` seal.
3. **S03 (`00:11.30–19.60`) — Purple-Faced Commander:** Whip-pitch w/ 3-frame ghost blend back to the packing table; Commander inspects the hole, flushes deep comic purple with ear steam, and yells *"broken umbrella!"*.
4. **S04 (`00:19.60–26.00`) — "The Donut Chute":** Hangar pan-right to 3 laughing blue crew members & popping frosted pink donut badge; pan back to resolute Hero refusing to stitch the hole closed.
5. **S05 (`00:26.00–36.00`) — 10,000 ft: Rivals Leap:** Circular silk hole match-cuts into the open circular aircraft hatch; two rivals leap and spotless sealed 3D canopies snap wide open in golden calm.
6. **S06 (`00:36.00–46.30`) — Violent Pendulum Chaos:** Sky chills to cobalt storm; domes tilt, whip **left (`38.89s`)**, snap **hard right (`39.95s`)**, and swing violently `±58°` with bursting trapped-air puffs and panicking rivals.
7. **S07 (`00:46.30–53.60`) — The Donut Chute Glides Dead-Still:** Sunlit cloud blow-out transitions into Hero's jump; camera tilts straight underneath the open circular 3D apex hole glowing gold with zero wobble (`0.0°`).
8. **S08 (`00:53.60–62.30`) — Upside-Down Cup Analogy:** Downward glowing caustic water seam wipe into a luminous underwater glass tank; upside-down glass cup plunges and burps air bubbles **left (`58.03s`)**, then **right (`60.09s`)**, rocking wildly.
9. **S09 (`01:02.30–67.75`) — Apex Vent Airflow Reveal:** Cup morphs into a rocking 3D cutaway parachute dome; right at `66.07s` (*"unless you give the air a way out"*), the crown opens, rocking freezes to `0.0°`, and a golden laminar airflow ribbon streams straight upward.
10. **S10 (`01:07.75–69.00`) — Bullseye Touchdown + 1.0 s Freeze:** Golden-hour runway touchdown dead-center on the painted `TARGET` bullseye while off-course rivals blow away and the shocked Commander stares; holds an exact `1.00 s` dead-still freeze (`f2040–2069`).

## Usage
```bash
npm install
node render_short.mjs --keyframes          # Fast 16-keyframe visual audit grid
for i in 0 1 2 3 4 5 6; do node render_short.mjs --chunk=$i; done
node render_short.mjs --assemble           # Lossless concat -> out/parachute_hole_short.mp4 + 42-tile sheet
python3 verify_short.py out/parachute_hole_short.mp4
```
