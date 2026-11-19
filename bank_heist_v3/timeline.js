// 10.00-second (300 frames @ 30.00 FPS) Bank Robbery Mission Timeline (Skill v3.0 Standard)
// 5 distinct visual beats, ZERO hard cuts, ZERO captions, exact 1.00 s freeze hold (f270-299).
//
//   S01 (f000-062) Grand Marble Bank Lobby Establishing -> Master Thief crouches under RED security lasers
//   S02 (f063-118) Whip-Glide Macro on Engraved Brass Vault Combination Dial & Retracting Bolts (RED -> GREEN!)
//   S03 (f119-179) Massive Riveted Vault Door Swings Wide Open -> Golden Treasure Light Push-Through (T02)
//   S04 (f180-242) Inside Glittering Gold Bullion Vault -> Thief Hoists Gold Bar -> RED ALARM BEACON Triggers!
//   S05 (f243-299) Viral Guard Twist -> Panicked Thief vs Deadpan Donut-Eating Night Guard + 1.00 s Freeze!

export const TOTAL_FRAMES = 300;
export const FPS = 30;
export const FREEZE_START = 270;

export function clamp01(x) { return x <= 0 ? 0 : x >= 1 ? 1 : x; }
export function smoothstep(a, b, x) {
  const u = clamp01((x - a) / Math.max(1e-6, b - a));
  return u * u * (3 - 2 * u);
}
export function easeInOutCubic(u) {
  u = clamp01(u);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}
export function lerp(a, b, u) { return a + (b - a) * u; }
export function lerp3(a, b, u) { return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; }

export function evalTimeline(rawFrame) {
  const isFrozen = rawFrame >= FREEZE_START;
  const f = Math.min(rawFrame, FREEZE_START);
  const t = f / FPS;

  // Seamless world swap inside golden vault light bloom peak (f179 -> f180)
  const world = f <= 179 ? 'lobby' : 'vault';

  let camPos = [0.22, 1.88, 4.95];
  let camLook = [0.0, 1.48, -1.65];
  let fov = 55;
  let whipGhost = 0;

  let dialAngle = 0;
  let vaultUnlocked = false;
  let wheelSpin = 0;
  let boltRetract = 0;
  let doorOpenProgress = 0;
  let doorOpenAngle = 0;
  let lasersOn = true;
  let unlockSparkIntensity = 0;
  let thiefVisibleInLobby = true;

  let alarmOn = false;
  let alarmSparkIntensity = 0;
  let guardVisible = false;
  let guardPos = [1.55, 1.02, 0.14];
  let flashlightAlpha = 0;

  let thiefPos = [-0.36, 1.00, 0.72];
  let thiefRigOpts = {
    pose: 'stealth_crouch',
    eyes: 'focused',
    mouth: 'smirk',
    pupilDx: 8,
    pupilDy: -2,
    headRot: 0,
    warmRim: true,
    sweat: false,
    dropOffset: 0,
  };
  let guardRigOpts = { blink: false, headRot: -0.05, pupilDx: -9 };

  if (world === 'lobby') {
    const s1CamA = [0.24, 1.88, 4.95];
    const s1CamB = [-0.08, 1.60, 3.25];
    const s1LookA = [0.0, 1.48, -1.65];
    const s1LookB = [-0.05, 1.44, -2.25];

    const s2CamA = [-0.36, 1.58, -0.30];
    const s2CamB = [-0.26, 1.56, -0.44];
    const s2LookA = [-0.30, 1.56, -2.35];
    const s2LookB = [-0.20, 1.54, -2.35];

    const s3CamA = [-0.24, 1.68, 2.45];
    const s3CamB = [0.0, 1.52, -1.65];
    const s3LookA = [0.04, 1.52, -2.65];
    const s3LookB = [0.0, 1.48, -3.65];

    if (f < 60) {
      const u = easeInOutCubic(f / 60);
      camPos = lerp3(s1CamA, s1CamB, u);
      camLook = lerp3(s1LookA, s1LookB, u);
      fov = lerp(55, 51, u);
    } else if (f < 74) {
      // Smooth whip-glide S01 -> S02 onto Brass Vault Dial (ZERO hard cut!)
      const u = easeInOutCubic((f - 60) / 14);
      camPos = lerp3(s1CamB, s2CamA, u);
      camLook = lerp3(s1LookB, s2LookA, u);
      fov = lerp(51, 44, u);
      whipGhost = Math.sin(u * Math.PI) * 0.30;
    } else if (f < 116) {
      const u = easeInOutCubic((f - 74) / 42);
      camPos = lerp3(s2CamA, s2CamB, u);
      camLook = lerp3(s2LookA, s2LookB, u);
      fov = lerp(44, 42, u);
    } else if (f < 130) {
      // Smooth pull-back S02 -> S03 to watch colossal Vault Door swing wide open!
      const u = easeInOutCubic((f - 116) / 14);
      camPos = lerp3(s2CamB, s3CamA, u);
      camLook = lerp3(s2LookB, s3LookA, u);
      fov = lerp(42, 52, u);
      whipGhost = Math.sin(u * Math.PI) * 0.28;
    } else {
      // Hold wide while door swings open (f130..158), then push straight into golden Vault doorway (f158..179)!
      const pushU = easeInOutCubic((f - 156) / 23);
      camPos = lerp3(s3CamA, s3CamB, pushU);
      camLook = lerp3(s3LookA, s3LookB, pushU);
      fov = lerp(52, 48, pushU);
    }

    // Dial spin, unlock click (f100), bolt retraction & heavy Vault Door swing!
    const spinU = smoothstep(66, 100, f);
    dialAngle = spinU * Math.PI * 3.1 - smoothstep(82, 92, f) * 1.4;
    vaultUnlocked = f >= 100;
    wheelSpin = smoothstep(100, 122, f) * Math.PI * 1.35;
    boltRetract = smoothstep(102, 118, f);
    doorOpenProgress = easeInOutCubic((f - 122) / 40);
    doorOpenAngle = doorOpenProgress * 1.34;
    lasersOn = f < 72;
    unlockSparkIntensity = (f >= 98 && f <= 120) ? Math.sin(clamp01((f - 98) / 22) * Math.PI) * 0.95 : 0;

    // Thief acting in Lobby: agile stealth crouch -> off-camera during macro -> triumphant beside open door!
    if (f < 68) {
      const u = easeInOutCubic(f / 68);
      thiefPos = [lerp(-0.36, -0.08, u), 0.98 + Math.sin(t * 7) * 0.02, lerp(0.72, -0.45, u)];
      thiefRigOpts = {
        pose: 'stealth_crouch',
        eyes: 'focused',
        mouth: 'smirk',
        pupilDx: 8,
        pupilDy: -2,
        headRot: 0.06,
        warmRim: true,
        sweat: false,
        dropOffset: 0,
      };
    } else if (f < 120) {
      thiefVisibleInLobby = false;
    } else {
      thiefVisibleInLobby = true;
      const u = smoothstep(126, 152, f);
      thiefPos = [lerp(-0.92, -0.78, u), 1.01, lerp(-1.15, -1.35, u)];
      thiefRigOpts = {
        pose: f < 142 ? 'dial_crack' : 'loot_grin',
        eyes: 'focused',
        mouth: f < 142 ? 'smirk' : 'grin',
        pupilDx: 8,
        pupilDy: -2,
        headRot: 0.04,
        warmRim: true,
        sweat: false,
        dropOffset: 0,
      };
    }
  } else {
    // WORLD 2: Inside Glittering Gold-Bullion Vault (f180-299)
    const s4CamA = [0.06, 1.56, 2.35];
    const s4CamB = [-0.12, 1.72, 3.72];
    const s4LookA = [0.0, 1.44, -1.25];
    const s4LookB = [0.0, 1.46, -1.15];

    // S05 frames BOTH panicked Thief AND full Donut-Eating Guard (including entire pink sprinkled donut!)
    const s5CamEnd = [0.06, 1.48, 4.38];
    const s5LookEnd = [0.04, 1.28, -0.15];

    if (f < 238) {
      const u = easeInOutCubic((f - 180) / 58);
      camPos = lerp3(s4CamA, s4CamB, u);
      camLook = lerp3(s4LookA, s4LookB, u);
      fov = lerp(50, 54, u);
    } else {
      const u = easeInOutCubic((f - 238) / 31);
      camPos = lerp3(s4CamB, s5CamEnd, u);
      camLook = lerp3(s4LookB, s5LookEnd, u);
      fov = lerp(54, 51, u);
    }

    // Red Alarm triggers at f216!
    alarmOn = f >= 216;
    alarmSparkIntensity = alarmOn ? lerp(0.85, 0.35, smoothstep(216, 268, f)) : 0;

    if (f >= 238 && f <= 254) {
      const sh = Math.sin(((f - 238) / 16) * Math.PI) * 0.032;
      camPos = [camPos[0] + Math.sin(f * 3.1) * sh, camPos[1] + Math.cos(f * 2.9) * sh, camPos[2]];
    }

    const bustU = smoothstep(238, 256, f);
    if (f < 238) {
      thiefPos = [-0.18, 1.01 + Math.sin(t * 5) * 0.015, -0.25];
      thiefRigOpts = {
        pose: 'loot_grin',
        eyes: f >= 220 ? 'wide_ring' : 'focused',
        mouth: f >= 220 ? 'shock_o' : 'grin',
        pupilDx: f >= 220 ? 10 : 2,
        pupilDy: f >= 220 ? -4 : 0,
        headRot: f >= 220 ? 0.06 : -0.03,
        warmRim: !alarmOn,
        sweat: f >= 224,
        dropOffset: 0,
      };
    } else {
      thiefPos = [lerp(-0.18, -0.58, bustU), 1.01, lerp(-0.25, 0.08, bustU)];
      thiefRigOpts = {
        pose: 'busted_shock',
        eyes: 'wide_ring',
        mouth: 'shock_o',
        pupilDx: 11,
        pupilDy: 0,
        headRot: 0.08,
        warmRim: false,
        sweat: true,
        dropOffset: smoothstep(240, 268, f),
      };
    }

    // Donut-Eating Night Security Guard walks calmly into right third (donut 100% visible inside 9:16!)
    guardVisible = f >= 234;
    const gWalk = easeInOutCubic((f - 234) / 32);
    guardPos = [lerp(1.55, 0.48, gWalk), 1.02 + Math.abs(Math.sin(gWalk * Math.PI * 2)) * 0.03, 0.14];
    flashlightAlpha = smoothstep(242, 260, f);
    guardRigOpts = {
      blink: f >= 255 && f <= 258,
      headRot: -0.05,
      pupilDx: -9,
    };
  }

  // Warm Golden Vault Doorway Light Bloom Transition across f168..190 (peaks 1.0 at f179-180 -> ZERO hard cut!)
  let flashAlpha = 0;
  if (f >= 168 && f <= 179) {
    const u = (f - 168) / 11;
    flashAlpha = u * u;
  } else if (f > 179 && f <= 190) {
    const u = 1 - (f - 180) / 10;
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
    dialAngle,
    vaultUnlocked,
    wheelSpin,
    boltRetract,
    doorOpenProgress,
    doorOpenAngle,
    lasersOn,
    unlockSparkIntensity,
    thiefVisibleInLobby,
    alarmOn,
    alarmSparkIntensity,
    guardVisible,
    guardPos,
    flashlightAlpha,
    thiefPos,
    thiefRigOpts,
    guardRigOpts,
  };
}
