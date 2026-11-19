# 10-Second 2.5D Zombie Apocalypse Airplane Preview (`1080×1920`, `30 FPS`)

A **10.00-second (`300 frames @ 30 FPS`), `1080×1920` (9:16)** vertical cinema preview of a zombie apocalypse inside an airplane, rendered **100% from code** (Three.js WebGL2 + dynamic procedural Canvas2D PBR textures & animated 2D cel character rigs + Python/NumPy `-14 LUFS` cinema audio + `ffmpeg` — zero image/video generation, zero external media assets), built strictly following `Every_Memory_Has_a_Price_25D_Code_Skill.zip`.

## 5-Angle, 4-Transition Zero-Hard-Cut Shot List
1. **S1 (`f000–048`, `0.00–1.60 s`) — Storm Porthole Macro → T1 Glass Pull-Through:** Rain-streaked `FLIGHT 404` oval porthole with forked lightning flash (`f10–21`) and red wingtip strobe, pulling smoothly back through the cabin into the dark indigo aisle.
2. **S2 (`f049–118`, `1.63–3.93 s`) — Wide Low-Angle Aisle Reveal:** Crouching Hero Passenger (breathing, blinking, darting pupils, sliding sweat drop), Peeking Survivor rising behind the 3D Row-3 seatback clutching the headrest, shambling Lead & Flight Attendant Zombies emerging from the crimson `EXIT` glow, flickering overhead reading lamp, and pulsing floor LED strips.
3. **T2 (`f119–134`) → S3 (`f135–178`, `4.50–5.93 s`) — Whip-Pitch w/ 3-Frame Ghost Blend → Carpet Macro → T3 Dutch Tilt-Up:** Rapid camera whip-pitch down onto the dropped `EMERGENCY / FLIGHT 404` card and rolling red soda can, then a continuous `+14.5°` Dutch tilt-up climbing past the overturned `GALLEY 02` trolley.
4. **S4 (`f179–225`, `5.97–7.50 s`) — High Overhead Bin Crane Dive + Emergency Strobe:** High ceiling crane gliding past `FASTEN SEAT BELT` and pendulum oxygen masks during warm↔crimson strobe pulses as the Lead Zombie lunges forward.
5. **T4 (`f216–236`, Peak `f226`) → S5 (`f226–299`, `7.53–10.00 s`) — Lightning Blow-Out + Cold-Cobalt Close-Up Twist & 1.0 s Freeze:** Blinding flash seamlessly flips into an intimate cold-cobalt Hero close-up; Hero blinks (`f257–260`) and reopens with **hollow empty black dot eyes (`f261`)** and pale sage skin, holding a dead-still **1.00-second freeze (`f270–299`)**.

## Usage
```bash
npm install
node render_video.mjs --keyframes        # Fast 9-keyframe full-res audit PNGs
node render_video.mjs                    # Full 10s 30-FPS 1080x1920 MP4 + audio + contact sheet
node render_video.mjs --no-caption       # Caption-free variant
python3 verify_video.py out/zombie_plane_preview.mp4
```
