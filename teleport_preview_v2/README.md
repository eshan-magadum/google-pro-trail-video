# 2.5D Teleportation Preview v2.0 (100% Code-Rendered — Skill ZIP v2.0 Showcase)

A **10.00-second (`300 frames @ 30.00 FPS`), `1080×1920` (9:16), silent (`0 audio streams`), caption-free** 2.5D animated preview video built 100% from code (Three.js WebGL2 + procedural Canvas2D PBR textures + multi-angle cel character rigs + `ffmpeg` Lanczos master) demonstrating every **Skill ZIP v2.0** upgrade:

- **Single-Frame Detail Density Throughout Full Video (`edge_pct >= 12.0%`):** 24+ bespoke 3D props in World 1 (Warm Vintage Brass-and-Wood Teleportation Lab) and 22+ bespoke 3D props in World 2 (Moonlit Twilight Mountain Rooftop Destination).
- **Warm-vs-Cool Lighting Contrast:** Warm honey-amber Edison-lit lab (`warmth R-B > +15`) contrasting cleanly against a cool moonlit twilight mountain rooftop with a swaying warm paper lantern.
- **5 Distinct Visual Beats (Zero Hard Cuts) + Exact 1.00 s Freeze Hold:**
  1. **S01 (`0.0–2.3 s`):** Warm lab establishing push-in past foreground cluttered workbench & stacked crates as Inventor throws the giant copper knife-switch.
  2. **S02 (`2.3–4.1 s`):** Smooth whip-glide macro onto the redlining brass `FLUX kV / OVERLOAD` gauge and sparking 3D helical copper Tesla coil.
  3. **S03 (`4.1–6.3 s`):** Sweep right onto the Inventor inside the glass Teleporter Chamber as 3 quantum containment rings spin up into a blinding cyan-gold teleport flash (`T03`).
  4. **S04 (`6.3–8.2 s`):** Emerges on a moonlit twilight mountain rooftop (painted wispy cloud sky dome, full moon, distant misty ridges & 42 glowing valley lights, crenellated stone battlement, 460 instanced 3D grass tufts, swaying warm lantern, waving observatory banner) as the Inventor drops on one knee inside a glowing arrival crater.
  5. **S05 (`8.2–10.0 s`):** Dramatic push-in twist — Inventor rises in shock as an identical shimmering cyan-glitch **Quantum Clone** materializes inside the pulsing portal ring, locking into an exact `1.00 s` freeze hold (`f270–299`).

## Usage

```bash
npm install
# Stage 4B mandatory full-res per-scene detail & visual audit (5 PNGs)
node render_preview.mjs --gates

# Render full 10.00 s 1080x1920 30-FPS silent MP4 + 30-tile contact sheet
node render_preview.mjs
```
