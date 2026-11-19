// Deterministic 300-Frame (10.00 s @ 30 FPS) Master Timeline for 2.5D Zombie Plane Preview.
// 5 Distinct Camera Angles + 4 Zero-Hard-Cut Transitions (Glass Pull-Through, Whip-Pitch w/ Ghost,
// Continuous Dutch Tilt-Up, Lightning Blow-Out + Cold-Cobalt Flip) + Exact 1.0s Freeze Hold (f270-299).

export const TOTAL_FRAMES = 300;
export const FPS = 30;
export const FREEZE_START = 270;

export function clamp(x, a = 0, b = 1) {
  return Math.max(a, Math.min(b, x));
}
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
export function lerp3(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
export function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / Math.max(1e-6, e1 - e0));
  return t * t * (3 - 2 * t);
}
export function easeInOutCubic(t) {
  t = clamp(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
export function easeInOutSine(t) {
  t = clamp(t);
  return -(Math.cos(Math.PI * t) - 1) / 2;
}
export function winU(f, a, b) {
  return clamp((f - a) / Math.max(1, b - a));
}

// Reference-matched 1-2 word Storyteller Caption Timeline (y = 70.5%)
const CAPTIONS = [
  { start: 4, end: 22, text: 'thirty thousand' },
  { start: 24, end: 44, text: 'feet up.' },
  { start: 54, end: 74, text: 'row twelve.' },
  { start: 80, end: 94, text: 'something' },
  { start: 96, end: 114, text: 'woke up.' },
  { start: 138, end: 154, text: 'no exits.' },
  { start: 158, end: 168, text: 'nowhere' },
  { start: 170, end: 180, text: 'to run.' },
  { start: 244, end: 268, text: 'seat 12A.' },
];

export function evaluateFrame(rawFrame) {
  // Exact 1.00-second freeze hold on f270-f299 (homage to Every Memory S24 ending!)
  const f = Math.min(rawFrame, FREEZE_START);
  const t = f / FPS;

  // -------------------------------------------------------------------------
  // 1. Camera Pose & Optics Across 5 Angles + 4 Zero-Hard-Cut Transitions
  // -------------------------------------------------------------------------
  let pos, target, fov, rollDeg;
  let whipGhostAlpha = 0;

  if (f <= 25) {
    // S1 Macro Hook: Rain-streaked left porthole window (Row 2) w/ lightning crack
    const u = easeInOutSine(winU(f, 0, 25));
    pos = lerp3([-1.44, 1.46, 2.38], [-1.18, 1.46, 2.40], u);
    target = [-2.13, 1.46, 2.35];
    fov = lerp(52, 56, u);
    rollDeg = lerp(-2.2, -1.2, u);
  } else if (f <= 52) {
    // T1 (Family E): Smooth Glass Pull-Through out of porthole & sweep into center aisle
    const u = easeInOutCubic(winU(f, 26, 52));
    pos = lerp3([-1.18, 1.46, 2.40], [0.16, 1.46, 6.20], u);
    // Gentle vertical arc to glide smoothly above Row 1-2 seatbacks
    pos[1] += Math.sin(u * Math.PI) * 0.28;
    target = lerp3([-2.13, 1.46, 2.35], [-0.04, 1.38, -8.5], u);
    fov = lerp(56, 74, u);
    rollDeg = lerp(-1.2, 3.6, u);
  } else if (f <= 118) {
    // S2 Iconic Wide Low-Angle Aisle Hero Reveal + creeping tension & turbulence roll
    const u = easeInOutSine(winU(f, 53, 118));
    pos = lerp3([0.16, 1.46, 6.20], [0.08, 1.40, 5.72], u);
    target = lerp3([-0.04, 1.38, -8.5], [-0.02, 1.36, -8.5], u);
    fov = 74;
    rollDeg = lerp(3.6, 6.4, u) + Math.sin(t * 2.8) * 0.45;
  } else if (f <= 134) {
    // T2 (Family A): Camera-Led Whip-Pitch Down onto Floor Debris w/ 3-frame Ghost Blend!
    const u = easeInOutCubic(winU(f, 119, 134));
    pos = lerp3([0.08, 1.40, 5.72], [-0.26, 0.46, 4.86], u);
    target = lerp3([-0.02, 1.36, -8.5], [-0.26, 0.03, 3.92], u);
    fov = lerp(74, 59, u);
    rollDeg = lerp(6.4, -4.5, u);
    whipGhostAlpha = Math.sin(u * Math.PI) * 0.36;
  } else if (f <= 155) {
    // S3 Carpet-Level Macro on EMERGENCY / FLIGHT 404 card & rolling red soda can
    const u = easeInOutSine(winU(f, 135, 155));
    pos = lerp3([-0.26, 0.46, 4.86], [-0.14, 0.50, 4.54], u);
    target = lerp3([-0.26, 0.03, 3.92], [-0.04, 0.22, 3.42], u);
    fov = lerp(59, 61, u);
    rollDeg = lerp(-4.5, -3.0, u);
  } else if (f <= 178) {
    // T3 (Family A): Continuous Dutch Tilt-Up Climb past overturned trolley into ceiling crane!
    const u = easeInOutCubic(winU(f, 156, 178));
    pos = lerp3([-0.14, 0.50, 4.54], [0.02, 2.48, 4.38], u);
    target = lerp3([-0.04, 0.22, 3.42], [0.06, 1.24, 0.20], u);
    fov = lerp(61, 72, u);
    rollDeg = lerp(-3.0, 14.5, u);
  } else if (f < 226) {
    // S4 High Overhead Bin Crane Dive + Emergency Strobe toward lunging Lead Zombie!
    const u = easeInOutSine(winU(f, 179, 225));
    pos = lerp3([0.02, 2.48, 4.38], [-0.16, 1.74, 3.02], u);
    target = lerp3([0.06, 1.24, 0.20], [0.14, 1.18, 0.72], u);
    fov = lerp(72, 58, u);
    rollDeg = lerp(14.5, 4.5, u) + Math.sin(t * 4.5) * 0.65;
  } else {
    // S5 Intimate Cold-Cobalt Portrait Close-Up on Hero (f226-f270 push-in, f270-299 FREEZE!)
    const u = easeInOutSine(winU(f, 226, 270));
    pos = lerp3([-0.44, 1.32, 4.40], [-0.45, 1.28, 4.18], u);
    target = lerp3([-0.47, 1.25, 2.78], [-0.47, 1.24, 2.78], u);
    fov = lerp(50, 47.5, u);
    rollDeg = lerp(1.5, 0.0, u);
  }

  // -------------------------------------------------------------------------
  // 2. Lighting Events, Strobe Cycle, Lightning & T4 Light Blow-Out Transition
  // -------------------------------------------------------------------------
  const isColdShot = f >= 226;

  // Shot 1 exterior lightning crack (double-bolt flicker across f10-21)
  let s1Lightning = 0;
  if (f >= 10 && f <= 21) {
    const p1 = Math.exp(-Math.pow((f - 13) / 2.2, 2));
    const p2 = Math.exp(-Math.pow((f - 18) / 1.8, 2)) * 0.75;
    s1Lightning = clamp(p1 + p2);
  }

  // Shot 2 subtle reading lamp electrical flicker (f91-99)
  let readingLampMult = 1.0;
  if (f >= 91 && f <= 99) {
    readingLampMult = (f % 3 === 0) ? 0.35 : 1.08;
  }

  // Shot 4 Emergency Strobe Cycle (warm amber <-> crimson/cobalt alternating pulse, S19 homage)
  let strobeWarm = 1.0;
  let strobeRed = 1.0;
  if (f >= 179 && f < 226) {
    const wave = Math.sin(((f - 179) / 15) * Math.PI * 2);
    const pulse = smoothstep(-0.35, 0.35, wave);
    strobeWarm = lerp(0.32, 1.35, pulse);
    strobeRed = lerp(1.75, 0.65, pulse);
  }

  // T4 (Family D): Lightning + Alarm Blow-Out Flash hiding instantaneous Cold-Cobalt Flip!
  // Smooth 10-frame ramp UP (f216-225), 2-frame pure peak (f226-227), 9-frame fade DOWN (f228-236)
  let blowOutAlpha = 0;
  if (f >= 216 && f <= 236) {
    if (f <= 225) {
      blowOutAlpha = Math.pow(winU(f, 215, 226), 1.65);
    } else if (f <= 227) {
      blowOutAlpha = 1.0;
    } else {
      blowOutAlpha = 1.0 - Math.pow(winU(f, 227, 236), 0.72);
    }
  }

  // -------------------------------------------------------------------------
  // 3. 3D Animated Props (Rolling Red Can, Rattling Overhead Bin, Oxygen Masks, Floor LEDs)
  // -------------------------------------------------------------------------
  const canRollU = easeInOutCubic(winU(f, 128, 162));
  const redCanPos = [lerp(-0.34, 0.14, canRollU), 0.036, lerp(3.76, 3.68, canRollU)];
  const redCanSpin = canRollU * Math.PI * 3.8;

  const binRattle = (f >= 175 && f < 226) ? Math.sin(t * 22) * 0.055 : Math.sin(t * 2.2) * 0.012;
  const ledPulse = 0.88 + 0.24 * Math.sin(t * 5.2);

  // -------------------------------------------------------------------------
  // 4. 2D Cel Character Positions & Emotional Acting States
  // -------------------------------------------------------------------------
  // (A) Hero Passenger (crouching behind trolley -> intimate close-up dot-eye twist!)
  let heroEyes = 'wide_ring';
  if (f >= 68 && f <= 70) heroEyes = 'wink_left';
  else if (f === 71) heroEyes = 'dash_closed';
  else if (f >= 104 && f <= 106) heroEyes = 'wink_left';
  else if (f >= 257 && f <= 260) heroEyes = 'dash_closed';
  else if (f >= 261) heroEyes = 'empty_dot'; // CHILLING S24 HOLLOW DOT-EYE TWIST!

  let heroMouth = 'wavy_anxious';
  if (f >= 257 && f <= 260) heroMouth = 'slack_hollow';
  else if (f >= 261) heroMouth = 'eerie_smile';

  const infectionMix = smoothstep(254, 265, f);
  const heroRecoil = (f >= 180 && f < 226) ? smoothstep(180, 218, f) * 0.85 : 0;
  const heroBreath = isColdShot
    ? Math.sin((f - 226) * 0.16) * (1 - infectionMix) * 0.65
    : Math.sin(t * 4.2) * 0.75;

  const heroState = {
    x: -0.44,
    y: 0.92,
    z: 2.78,
    headRot: isColdShot
      ? lerp(-0.04, 0.09, infectionMix)
      : -0.09 + Math.sin(t * 2.1) * 0.025,
    breath: heroBreath,
    recoil: heroRecoil,
    eyes: heroEyes,
    mouth: heroMouth,
    pupilDx: isColdShot ? 0 : lerp(10, 14, smoothstep(55, 110, f)),
    pupilDy: isColdShot ? 0 : -12,
    sweatProgress: clamp((f - 62) / 52, 0.1, 1.0),
    sweatAlpha: isColdShot ? (1 - smoothstep(245, 258, f)) * 0.75 : 1.0,
    tremorPhase: isColdShot ? (f < 257 ? t : 0) : t,
    infectionMix,
    coldRim: isColdShot,
  };

  // (B) Peeking Survivor (pops up slowly behind Row-3 right seatback at f54-76!)
  const peekU = easeInOutCubic(winU(f, 54, 76));
  const peekingState = {
    x: 1.08,
    y: lerp(1.06, 1.46, peekU),
    z: 1.68,
    blink: (f >= 96 && f <= 98),
    tremor: t,
    sweatAlpha: smoothstep(64, 80, f),
    visible: !isColdShot,
  };

  // (C) Lead Lunging Zombie (shambles forward down center aisle, then lunges in Shot 4!)
  const zAdvance = easeInOutSine(winU(f, 45, 178));
  const zLunge = easeInOutCubic(winU(f, 178, 224));
  const leadZombieZ = isColdShot ? -3.4 : lerp(-1.25, 0.15, zAdvance) + zLunge * 1.15;
  const leadWalkPhase = t * 4.4;
  const leadZombieState = {
    x: isColdShot ? 0.42 : 0.24 + Math.sin(leadWalkPhase) * 0.05,
    y: 1.06,
    z: leadZombieZ,
    walkPhase: leadWalkPhase,
    lunge: isColdShot ? 0.2 : zLunge,
    jawOpen: 0.42 + 0.35 * Math.sin(t * 5.6) + zLunge * 0.35,
    crimsonRim: strobeRed * 0.75,
    visible: !isColdShot, // Shot 5 isolates the Hero face against the dark cobalt cabin & aft EXIT bokeh
  };

  // (D) Flight Attendant Zombie
  const attWalkPhase = t * 3.6 + 1.4;
  const attendantState = {
    x: -0.32 + Math.sin(attWalkPhase) * 0.04,
    y: 1.04,
    z: lerp(-3.75, -2.35, easeInOutSine(winU(f, 45, 220))),
    walkPhase: attWalkPhase,
    visible: !isColdShot,
  };

  // (E) Rear Silhouette Zombie
  const rearState = {
    x: 0.26,
    y: 1.02,
    z: lerp(-6.45, -5.35, easeInOutSine(winU(f, 45, 220))),
    visible: true,
  };

  // Active Storyteller Caption
  let caption = '';
  for (const c of CAPTIONS) {
    if (f >= c.start && f <= c.end) {
      caption = c.text;
      break;
    }
  }

  return {
    frame: f,
    rawFrame,
    t,
    camera: { pos, target, fov, rollDeg },
    whipGhostAlpha,
    blowOutAlpha,
    isColdShot,
    s1Lightning,
    readingLampMult,
    strobeWarm,
    strobeRed,
    redCanPos,
    redCanSpin,
    binRattle,
    ledPulse,
    hero: heroState,
    peeking: peekingState,
    leadZombie: leadZombieState,
    attendant: attendantState,
    rearZombie: rearState,
    caption,
  };
}
