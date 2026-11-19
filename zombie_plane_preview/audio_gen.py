#!/usr/bin/env python3
"""
100% Procedural Atmospheric Cinema Audio Generator for the 10s Zombie Plane Preview.
Synthesizes pressurized cabin rumble, storm lightning thunder, turbulence groans,
emergency strobe alarm pulses, rising horror tension drone, and a chilling cold-silence
hollow sting synchronized to f261 (t=8.70s) dot-eye twist.
Mastered via ffmpeg loudnorm to -14.0 LUFS, true peak <= -1.5 dBTP.
"""
import os
import subprocess
import sys
import wave
import numpy as np


SR = 44100
DUR = 10.00
N = int(SR * DUR)


def lowpass_1pole(x, cutoff_hz):
    dt = 1.0 / SR
    rc = 1.0 / (2.0 * np.pi * cutoff_hz)
    alpha = dt / (rc + dt)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += alpha * (x[i] - acc)
        y[i] = acc
    return y


def smooth_env(t, t0, t1, t2, t3):
    up = np.clip((t - t0) / max(1e-4, t1 - t0), 0.0, 1.0)
    down = np.clip((t3 - t) / max(1e-4, t3 - t2), 0.0, 1.0)
    return up * down


def main():
    out_wav = sys.argv[1] if len(sys.argv) > 1 else "out/_tmp_audio_master.wav"
    os.makedirs(os.path.dirname(os.path.abspath(out_wav)), exist_ok=True)
    raw_wav = out_wav.replace(".wav", "_raw.wav")

    rng = np.random.default_rng(404)
    t = np.arange(N, dtype=np.float64) / SR

    # 1. Pressurized Cabin Jet Engine Rumble (warm filtered low-mid noise + subtle turbine hum)
    white_l = rng.standard_normal(N)
    white_r = rng.standard_normal(N)
    rumble_l = lowpass_1pole(lowpass_1pole(white_l, 165.0), 120.0) * 1.4
    rumble_r = lowpass_1pole(lowpass_1pole(white_r, 165.0), 120.0) * 1.4
    turbine = 0.055 * np.sin(2 * np.pi * 78.0 * t) + 0.032 * np.sin(2 * np.pi * 156.0 * t)
    # Cabin hum drops sharply into cold eerie near-silence after the f226 (7.53s) blow-out!
    cabin_env = np.where(t < 7.53, 0.72, 0.22 * np.exp(-(t - 7.53) * 0.45) + 0.14)

    L = (rumble_l + turbine) * cabin_env
    R = (rumble_r + turbine) * cabin_env

    # 2. Shot 1 Storm Lightning Crack & Deep Rolling Thunder (synced to f13 = 0.43s)
    th1_t = np.maximum(0.0, t - 0.36)
    th1_env = (t >= 0.36) * (np.exp(-th1_t * 1.85) * (1.0 - np.exp(-th1_t * 55.0)))
    th1_noise = lowpass_1pole(rng.standard_normal(N), 240.0) * 2.4
    th1_crack = lowpass_1pole(rng.standard_normal(N), 1400.0) * np.exp(-th1_t * 14.0) * (t >= 0.36) * 0.75
    L += (th1_noise * th1_env + th1_crack) * 0.65
    R += (th1_noise * th1_env * 0.85 + th1_crack * 0.9) * 0.65

    # 3. Eerie Dissonant Sub-Bass & Minor-Second Horror Pad (builds S2 -> S4 climax, t=1.6..7.5s)
    pad_env = smooth_env(t, 1.5, 2.4, 7.25, 7.58)
    swell = 0.45 + 0.55 * np.clip((t - 1.6) / 5.6, 0.0, 1.0)
    # Dark cinematic minor-second cluster (D2 = 73.4Hz, Eb2 = 77.8Hz, A2 = 110Hz)
    drone_l = (
        0.22 * np.sin(2 * np.pi * 73.42 * t)
        + 0.16 * np.sin(2 * np.pi * 77.78 * t + 0.4)
        + 0.09 * np.sin(2 * np.pi * 146.83 * t + 0.2 * np.sin(2 * np.pi * 0.6 * t))
    )
    drone_r = (
        0.22 * np.sin(2 * np.pi * 73.42 * t + 0.3)
        + 0.16 * np.sin(2 * np.pi * 78.15 * t)
        + 0.09 * np.sin(2 * np.pi * 220.0 * t + 0.25 * np.sin(2 * np.pi * 0.5 * t))
    )
    L += drone_l * pad_env * swell * 0.75
    R += drone_r * pad_env * swell * 0.75

    # 4. T2 Whip-Pitch Air Whoosh (synced to f119-134 = t 3.97-4.47s)
    whip_env = np.exp(-((t - 4.20) / 0.14) ** 2)
    whip_air = lowpass_1pole(rng.standard_normal(N), 780.0) * 1.6
    L += whip_air * whip_env * 0.55
    R += whip_air * whip_env * 0.62

    # 5. Shot 4 Emergency Cabin Warning Pulses (synced to strobe f179-225 = t 5.97-7.50s)
    for pulse_t in np.arange(6.02, 7.45, 0.50):
        pt = t - pulse_t
        mask = (pt >= 0.0) & (pt < 0.22)
        env = np.where(mask, np.sin(np.pi * np.clip(pt / 0.22, 0, 1)), 0.0)
        # Dual-tone muted aircraft cockpit warning chime (880Hz + 660Hz)
        chime = (0.14 * np.sin(2 * np.pi * 880.0 * t) + 0.10 * np.sin(2 * np.pi * 659.2 * t)) * env
        L += chime * 0.55
        R += chime * 0.50

    # 6. T4 Blinding Lightning Blow-Out Impact & Sub Drop (synced to f226 = t 7.53s)
    imp_t = np.maximum(0.0, t - 7.46)
    imp_mask = t >= 7.46
    boom_freq = 115.0 * np.exp(-imp_t * 2.8) + 36.0
    boom_phase = np.cumsum(2 * np.pi * boom_freq / SR)
    sub_drop = np.sin(boom_phase) * np.exp(-imp_t * 2.2) * imp_mask * 0.78
    flash_crack = lowpass_1pole(rng.standard_normal(N), 2200.0) * np.exp(-imp_t * 9.5) * imp_mask * 0.85
    L += sub_drop + flash_crack * 0.65
    R += sub_drop + flash_crack * 0.65

    # 7. Shot 5 Chilling Cold-Cobalt Atmosphere + Hollow Dot-Eye Twist Sting (f261 = t 8.70s!)
    cold_env = smooth_env(t, 7.65, 8.10, 9.75, 10.0)
    # High glassy eerie fifth shimmer (D5 = 587.3Hz, Eb5 = 622.3Hz)
    shimmer = (
        0.045 * np.sin(2 * np.pi * 587.33 * t)
        + 0.035 * np.sin(2 * np.pi * 622.25 * t)
    ) * cold_env
    L += shimmer * 0.85
    R += shimmer * 0.95

    # Heartbeat thump right before blink (t=8.25s) and deep hollow sting on f261 (t=8.70s)!
    for beat_t, amp, f0 in [(8.22, 0.55, 58.0), (8.70, 0.85, 48.0)]:
        bt = np.maximum(0.0, t - beat_t)
        bm = t >= beat_t
        thump = np.sin(2 * np.pi * f0 * bt) * np.exp(-bt * 6.5) * bm * amp
        L += thump
        R += thump

    # Haunting dissonant metallic sting on f261 (t=8.70s) holding through the 1s freeze
    st_t = np.maximum(0.0, t - 8.70)
    st_m = t >= 8.70
    sting = (
        0.16 * np.sin(2 * np.pi * 293.66 * st_t)
        + 0.14 * np.sin(2 * np.pi * 311.13 * st_t)
        + 0.07 * np.sin(2 * np.pi * 932.33 * st_t)
    ) * np.exp(-st_t * 1.15) * (1.0 - np.exp(-st_t * 40.0)) * st_m
    L += sting * 0.72
    R += sting * 0.78

    # Gentle fade-in (0.12s) and tail safety fade (0.08s) + soft limiter
    fade_in = np.clip(t / 0.12, 0.0, 1.0)
    fade_out = np.clip((DUR - t) / 0.08, 0.0, 1.0)
    L = np.tanh(L * fade_in * fade_out * 1.15) * 0.88
    R = np.tanh(R * fade_in * fade_out * 1.15) * 0.88

    stereo = np.stack([L, R], axis=1)
    pcm = np.clip(stereo * 32767.0, -32768, 32767).astype(np.int16)

    with wave.open(raw_wav, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())

    # Master to exact -14.0 LUFS, TP <= -1.5 dBTP via ffmpeg loudnorm
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", raw_wav,
            "-af", "loudnorm=I=-14.0:TP=-1.5:LRA=4.0:linear=true",
            "-ar", str(SR), "-ac", "2",
            out_wav,
        ],
        check=True,
    )
    os.remove(raw_wav)
    print(f"Generated mastered -14 LUFS audio: {out_wav}")


if __name__ == "__main__":
    main()
