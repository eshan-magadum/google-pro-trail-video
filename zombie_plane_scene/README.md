# 2.5D Zombie Apocalypse Airplane Scene (`1080×1920`)

A single vertical (`9:16`) cinema-grade frame rendered **100% from code** (Three.js WebGL2 + procedural Canvas2D PBR textures + hand-coded 2D cel character sprites — zero image generation, zero external image assets), built strictly following `Every_Memory_Has_a_Price_25D_Code_Skill.zip`.

## Architecture (6-Layer 2.5D Pipeline)
- **3D Lit Aircraft Fuselage Diorama ([scene.js](scene.js), [textures.js](textures.js)):** Curved fuselage shell with structural ribs, 10 rows of 3D airplane seats (40 seats with antimacassar headrests, folded tray tables, and peeking safety cards), continuous overhead luggage bins (2 popped open with spilling luggage), stormy oval portholes with lightning bolts, converging HDR warm-amber floor-path LED strips, single front `FASTEN SEAT BELT` sign, aft bulkhead with ripped galley curtain, and an unobstructed HDR crimson `EXIT` lightbox.
- **Depth-Sorted 2D Cel Characters ([characters2d.js](characters2d.js)):** High-resolution (`1024×1536`) Canvas2D billboards featuring thick `#120F1C` outlines, oversized heads, stick limbs with ball-hands (zero fingers), flat two-tone cel shading, and directional rim highlights — crouching panicked Hero Passenger, Peeking Terrified Survivor gripping Row-3 seatback, Lead Lunging Zombie, Flight Attendant Zombie, Deep Aft Silhouette Zombie, and 4 depth layers of dangling yellow oxygen masks.
- **3D Foreground Occluders:** Overturned brushed-aluminum `GALLEY 02` drink trolley, rolling aluminum soda cans, and a dropped `EMERGENCY / FLIGHT 404` airline safety card on the carpet.
- **Post-Processing & 2D Finish:** High-threshold `UnrealBloomPass` (`threshold=0.80`) that blooms only HDR practical lights while preserving razor-sharp 2D ink outlines, plus floating cabin dust motes, a lifted saturated-indigo radial vignette, and an optional caption variant (`"row twelve."`).

## Usage
```bash
npm install
node render.mjs                  # renders out/zombie_plane_frame.png (1080x1920)
node render.mjs --caption        # renders out/zombie_plane_frame_captioned.png (1080x1920)
python3 verify_frame.py out/zombie_plane_frame.png
```
