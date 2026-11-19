// 10.00-second (300 frames @ 30.00 FPS) Visual Timeline for Teleportation Preview v2.0
// 5 crisp visual beats (every 2.0 s), ZERO hard cuts, ZERO captions, exact 1.00 s freeze hold (f270-299).
//
// Shot Arc:
//   S01 (f000-068) Warm Vintage Lab Establishing Push-In -> Inventor throws copper master switch
//   S02 (f069-124) Whip-Glide Macro onto brass FLUX kV / OVERLOAD gauge & sparking helical Tesla coil
//   S03 (f125-188) Sweep-Right into Glass Teleporter Pod surge -> Blinding Cyan-Gold Flash Blow-Out (f176-198)
//   S04 (f189-245) Moonlit Twilight Mountain Rooftop Arrival -> Hero drops on one knee in scorched crater
//   S05 (f246-299) The Teleportation Clone Twist -> Horrified Hero vs Shimmering Quantum Clone + 1.0 s Freeze!

export const TOTAL_FRAMES = 300;
export const FPS = 30;
export const FREEZE_START = 270;

export function clamp01(x) {
  return x <= 0 ? 0 : x >= 1 ? 1 : x;
}

export function smoothstep(a, b, x) {
  const u = clamp01((x - a) / Math.max(1e-6, b - a));
  return u * u * (3 - 2 * u);
}

export function easeInOutCubic(u) {
  u = clamp01(u);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

export function lerp(a, b, u) {
  return a + (b - a) * u;
}

export function lerp3(a, b, u) {
  return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
}

export function evalTimeline(rawFrame) {
  const isFrozen = rawFrame >= FREEZE_START;
  const f = Math.min(rawFrame, FREEZE_START);
  const t = f / FPS;

  // World swap happens cleanly at peak white-cyan flash blow-out (f188 -> f189)
  const world = f <= 188 ? 'lab' : 'rooftop';

  // Camera & Rig defaults
  let camPos = [0.55, 1.88, 4.45];
  let camLook = [-0.38, 1.56, -0.65];
  let fov = 47;
  let whipGhost = 0;

  let leverPull = 0;
  let gaugeLevel = 0.22;
  let surge = 0.08;
  let sparkIntensity = 0.14;
  let sparkAtPod = false;

  let heroPos = [-2.02, 1.04, 0.58];
  let heroRigOpts = {
    pose: 'lever_3q',
    eyes: 'half_lid',
    mouth: 'smirk',
    pupilDx: 8,
    pupilDy: -2,
    surge: 0,
    headRot: 0,
    warmRim: true,
    glitchAlpha: 0,
    sweat: false,
  };

  let portalRingOpacity = 0.92;
  let arrivalSparkIntensity = 0.9;
  let cloneAlpha = 0.0;
  let clonePos = [0.68, 1.02, -0.06];
  let cloneRigOpts = {
    pose: 'clone_glitch',
    eyes: 'empty_dot',
    mouth: 'smirk',
    pupilDx: -6,
    pupilDy: 0,
    surge: 0.18,
    headRot: -0.05,
    warmRim: false,
    glitchAlpha: 0.78,
    sweat: false,
  };

  if (world === 'lab') {
    // S01 (f000-064): Rich establishing glide framing FULL Inventor pulling lever, console, Teleporter Pod & foreground workbench!
    const s1CamA = [0.08, 1.90, 5.55];
    const s1CamB = [-0.46, 1.72, 4.35];
    const s1LookA = [-0.62, 1.52, -0.35];
    const s1LookB = [-0.74, 1.48, -0.25];

    // S02 (f078-118): Macro onto FULL brass FLUX kV / OVERLOAD gauge (left-lower) & sparking helical copper coil (right-upper) + chalk equations!
    const s2CamA = [-0.28, 1.56, 2.25];
    const s2CamB = [-0.38, 1.64, 1.98];
    const s2LookA = [-0.94, 1.48, -0.05];
    const s2LookB = [-1.02, 1.56, -0.42];

    // S03 (f134-188): Dramatic framing of FULL Teleporter Chamber, copper dome, flanking Tesla coils & warm lab walls around surging Hero!
    const s3CamA = [-0.25, 1.84, 3.85];
    const s3CamB = [0.08, 1.72, 3.05];
    const s3LookA = [0.20, 1.68, -1.25];
    const s3LookB = [0.24, 1.64, -1.25];

    if (f < 64) {
      const u = easeInOutCubic(f / 64);
      camPos = lerp3(s1CamA, s1CamB, u);
      camLook = lerp3(s1LookA, s1LookB, u);
      fov = lerp(56, 52, u);
    } else if (f < 78) {
      // Smooth whip-glide S01 -> S02 (ZERO hard cut!)
      const u = easeInOutCubic((f - 64) / 14);
      camPos = lerp3(s1CamB, s2CamA, u);
      camLook = lerp3(s1LookB, s2LookA, u);
      fov = lerp(52, 44, u);
      whipGhost = Math.sin(u * Math.PI) * 0.32;
    } else if (f < 118) {
      const u = easeInOutCubic((f - 78) / 40);
      camPos = lerp3(s2CamA, s2CamB, u);
      camLook = lerp3(s2LookA, s2LookB, u);
      fov = lerp(44, 41, u);
    } else if (f < 134) {
      // Smooth whip-sweep S02 -> S03 right onto Glass Teleporter Chamber!
      const u = easeInOutCubic((f - 118) / 16);
      camPos = lerp3(s2CamB, s3CamA, u);
      camLook = lerp3(s2LookB, s3LookA, u);
      fov = lerp(41, 52, u);
      whipGhost = Math.sin(u * Math.PI) * 0.34;
    } else {
      const u = easeInOutCubic((f - 134) / 54);
      camPos = lerp3(s3CamA, s3CamB, u);
      camLook = lerp3(s3LookA, s3LookB, u);
      fov = lerp(52, 48, u);
    }

    // Subtle organic energy rumble during overload (f144..188)
    if (f >= 144) {
      const sh = smoothstep(144, 184, f) * 0.036;
      camPos = [
        camPos[0] + Math.sin(f * 2.7) * sh,
        camPos[1] + Math.cos(f * 3.3) * sh * 0.8,
        camPos[2],
      ];
    }

    // Prop & Hero acting progression in World 1
    leverPull = smoothstep(12, 56, f);
    gaugeLevel = lerp(0.24, 0.72, smoothstep(10, 68, f)) + lerp(0, 0.34, smoothstep(70, 122, f));
    if (f > 96) gaugeLevel += Math.sin(f * 2.1) * 0.035;

    surge = lerp(0.08, 0.28, smoothstep(10, 68, f))
      + lerp(0.0, 0.24, smoothstep(70, 124, f))
      + lerp(0.0, 0.42, smoothstep(126, 182, f));

    sparkIntensity = lerp(0.14, 0.42, smoothstep(12, 68, f))
      + lerp(0.0, 0.58, smoothstep(72, 118, f));
    sparkAtPod = f >= 122;
    if (sparkAtPod) {
      sparkIntensity = lerp(0.65, 1.05, smoothstep(124, 182, f));
    }

    // Reposition Hero off-camera at f118 (when tight coil macro hides x = -1.62!) so S03 reveals him inside the Pod!
    if (f < 118) {
      heroPos = [-1.62, 1.04 + Math.sin(t * 2.8) * 0.015, 0.68];
      heroRigOpts = {
        pose: 'lever_3q',
        eyes: f > 50 ? 'wide_ring' : 'half_lid',
        mouth: f > 50 ? 'awe_open' : 'smirk',
        pupilDx: 9,
        pupilDy: -2,
        surge: surge * 0.32,
        headRot: lerp(-0.04, 0.06, leverPull),
        warmRim: true,
        glitchAlpha: 0,
        sweat: false,
      };
    } else {
      const podSurge = smoothstep(124, 180, f);
      heroPos = [0.25, 1.38 + Math.sin(t * 10) * podSurge * 0.03, -1.25];
      heroRigOpts = {
        pose: 'inside_pod',
        eyes: 'wide_ring',
        mouth: podSurge > 0.35 ? 'awe_open' : 'wavy',
        pupilDx: 0,
        pupilDy: -4,
        surge: podSurge,
        headRot: Math.sin(t * 9) * 0.035 * podSurge,
        warmRim: true,
        glitchAlpha: smoothstep(162, 185, f) * 0.65,
        sweat: false,
      };
    }
  } else {
    // WORLD 2: Moonlit Twilight Mountain Rooftop Destination (f189-299)
    // S04 (f189-244): Pull-back revealing swaying warm lantern, waving banner, pine silhouettes, 680 grass tufts, stone parapet & Hero landing!
    const s4CamA = [0.12, 1.56, 3.85];
    const s4CamB = [-0.14, 1.92, 5.15];
    const s4LookA = [-0.05, 1.38, -0.45];
    const s4LookB = [0.02, 1.54, -0.75];

    // S05 (f244-270): Crisp two-shot push-in framing BOTH full Hero (left) & Shimmering Quantum Clone (right) + lantern & banner behind!
    const s5CamEnd = [0.04, 1.50, 4.28];
    const s5LookEnd = [0.04, 1.32, -0.10];

    if (f < 244) {
      const u = easeInOutCubic((f - 189) / 55);
      camPos = lerp3(s4CamA, s4CamB, u);
      camLook = lerp3(s4LookA, s4LookB, u);
      fov = lerp(52, 55, u);
    } else {
      const u = easeInOutCubic((f - 244) / 26);
      camPos = lerp3(s4CamB, s5CamEnd, u);
      camLook = lerp3(s4LookB, s5LookEnd, u);
      fov = lerp(55, 49, u);
    }

    // Impact micro-settle right after rooftop landing (f190..204)
    if (f < 205) {
      const imp = (1 - smoothstep(189, 205, f)) * 0.045;
      camPos = [camPos[0] + Math.sin(f * 3.1) * imp, camPos[1] + Math.cos(f * 4.2) * imp, camPos[2]];
    }

    portalRingOpacity = lerp(0.92, 0.56, smoothstep(190, 268, f));
    arrivalSparkIntensity = lerp(0.95, 0.38, smoothstep(190, 255, f));

    // Hero crouch-land (f189-245) -> smooth stand-up shock looking right at Clone (f246-270)!
    const riseU = smoothstep(245, 256, f);
    if (f < 246) {
      heroPos = [-0.22, 0.99, 0.08];
      heroRigOpts = {
        pose: 'crouch_land',
        eyes: 'wide_ring',
        mouth: 'wavy',
        pupilDx: 2,
        pupilDy: 4,
        surge: lerp(0.50, 0.05, smoothstep(190, 224, f)),
        headRot: -0.05,
        warmRim: false,
        glitchAlpha: lerp(0.35, 0.0, smoothstep(190, 212, f)),
        sweat: false,
      };
    } else {
      heroPos = [lerp(-0.22, -0.54, riseU), 1.00, lerp(0.08, 0.14, riseU)];
      heroRigOpts = {
        pose: 'stand_shock',
        eyes: 'wide_ring',
        mouth: 'shock_o',
        pupilDx: 11,
        pupilDy: 0,
        surge: 0.04,
        headRot: lerp(-0.04, 0.08, riseU),
        warmRim: false,
        glitchAlpha: 0,
        sweat: f >= 252,
      };
    }

    // Quantum Clone materializes right beside him inside the glowing portal ring (f246-268)!
    cloneAlpha = smoothstep(246, 268, f) * 0.94;
    clonePos = [0.58, 1.00 + Math.sin(t * 7.5) * 0.015, -0.04];
    cloneRigOpts = {
      pose: 'clone_glitch',
      eyes: 'empty_dot',
      mouth: 'smirk',
      pupilDx: -8,
      pupilDy: 0,
      surge: 0.20,
      headRot: -0.06,
      warmRim: false,
      glitchAlpha: 0.65 + Math.sin(t * 18) * 0.18,
      sweat: false,
    };
  }

  // Blinding Cyan-Gold Quantum Teleport Blow-Out Flash across f176..199 (peaks 1.0 at f188-189)
  let flashAlpha = 0;
  if (f >= 176 && f <= 188) {
    const u = (f - 176) / 12;
    flashAlpha = u * u;
  } else if (f > 188 && f <= 199) {
    const u = 1 - (f - 189) / 10;
    flashAlpha = Math.max(0, u * u);
  }

  return {
    f,
    rawFrame,
    t,
    isFrozen,
    world,
    camPos,
    camLook,
    fov,
    whipGhost,
    flashAlpha,
    leverPull,
    gaugeLevel,
    surge,
    sparkIntensity,
    sparkAtPod,
    heroPos,
    heroRigOpts,
    portalRingOpacity,
    arrivalSparkIntensity,
    cloneAlpha,
    clonePos,
    cloneRigOpts,
  };
}
