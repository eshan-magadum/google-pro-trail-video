// Exact SRT-Synced 2,070-Frame (69.00 s @ 30.00 FPS) Master Timeline
// Synced millisecond-for-millisecond to ElevenLabs_2026-11-19T14_27_58_Jeremy SRT (00:00.190 -> 01:07.710)
// + 1.00 s signature Every-Memory freeze hold on f2040-f2069.
// ZERO captions, ZERO sound effects, ZERO hard cuts across all 10 scenes & 9 transitions.

export const TOTAL_FRAMES = 2070;
export const FPS = 30;
export const FREEZE_START = 2040;

export function clamp(x, a = 0, b = 1) { return Math.max(a, Math.min(b, x)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function lerp3(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
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
export function easeOutBack(t) {
  t = clamp(t);
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
export function winU(f, a, b) { return clamp((f - a) / Math.max(1, b - a)); }

// Compute camera & scene state for a specific World at frame f
export function evaluateWorldState(worldId, rawFrame) {
  const f = Math.min(rawFrame, FREEZE_START);
  const t = f / FPS;

  // =========================================================================
  // WORLD 1: INDIGO HANGAR PACKING BAY (S01, S02, S03, S04: f0000 - f0794)
  // =========================================================================
  if (worldId === 'hangar') {
    let pos, target, fov, rollDeg;
    let whipGhostAlpha = 0;

    if (f <= 75) {
      // S01A: Tight overhead macro on white parachute silk + silver shears cutting hole
      const u = easeInOutSine(winU(f, 0, 75));
      pos = lerp3([0.0, 2.38, 0.85], [-0.15, 2.25, 1.85], u);
      target = lerp3([0.0, 0.92, 0.0], [0.0, 1.05, -0.15], u);
      fov = lerp(52, 62, u);
      rollDeg = lerp(-1.5, 2.0, u);
    } else if (f <= 125) {
      // S01B: Pull back & tilt up revealing Hero cutting + glowing crimson 10:00 countdown wall clock!
      const u = easeInOutCubic(winU(f, 75, 125));
      pos = lerp3([-0.15, 2.25, 1.85], [-0.35, 1.85, 4.15], u);
      target = lerp3([0.0, 1.05, -0.15], [0.0, 1.65, -2.5], u);
      fov = lerp(62, 72, u);
      rollDeg = lerp(2.0, 3.0, u);
    } else if (f <= 148) {
      // T01 (Family A): Continuous crane pan left to illuminated Tactical Competition Briefing Board!
      const u = easeInOutCubic(winU(f, 125, 148));
      pos = lerp3([-0.35, 1.85, 4.15], [-4.4, 1.95, 2.65], u);
      target = lerp3([0.0, 1.65, -2.5], [-4.6, 1.85, -2.2], u);
      fov = lerp(72, 64, u);
      rollDeg = lerp(3.0, -1.5, u);
    } else if (f <= 335) {
      // S02 (4.89-11.13s): Briefing Wall (10,000 FT -> TARGET bullseye -> CONTRACT $ seal!)
      const u1 = easeInOutSine(winU(f, 148, 250));
      const u2 = easeInOutCubic(winU(f, 250, 335));
      const pMid = [-4.60, 1.92, 2.25];
      const tMid = [-4.60, 1.90, -2.25];
      if (f <= 250) {
        pos = lerp3([-4.45, 1.95, 2.95], pMid, u1);
        target = lerp3([-4.60, 1.88, -2.25], tMid, u1);
        fov = lerp(66, 60, u1);
        rollDeg = lerp(-1.5, 0.5, u1);
      } else {
        // Gentle zoom keeping TARGET & CONTRACT cleanly unclipped!
        pos = lerp3(pMid, [-4.38, 1.84, 1.48], u2);
        target = lerp3(tMid, [-4.35, 1.82, -2.25], u2);
        fov = lerp(60, 52, u2);
        rollDeg = lerp(0.5, 1.8, u2);
      }
    } else if (f <= 354) {
      // T02 (Family A): Whip-Pitch w/ 3-frame Ghost Double-Exposure back to Packing Table Confrontation!
      const u = easeInOutCubic(winU(f, 335, 354));
      pos = lerp3([-4.38, 1.84, 1.48], [0.25, 1.48, 3.65], u);
      target = lerp3([-4.35, 1.82, -2.25], [0.05, 1.45, -0.35], u);
      fov = lerp(52, 68, u);
      rollDeg = lerp(1.8, 3.2, u);
      whipGhostAlpha = Math.sin(u * Math.PI) * 0.36;
    } else if (f <= 515) {
      // S03A (11.61-16.97s): Commander inspects sliced hole & HIS FACE GOES PURPLE!
      const u = easeInOutSine(winU(f, 354, 515));
      pos = lerp3([0.25, 1.48, 3.65], [0.68, 1.62, 2.55], u);
      target = lerp3([0.05, 1.45, -0.35], [0.85, 1.68, -0.45], u);
      fov = lerp(68, 56, u);
      rollDeg = lerp(3.2, -3.5, u);
    } else if (f <= 585) {
      // S03B (17.53-19.39s): Tight intense push-in on purple Commander yelling "BROKEN UMBRELLA!"
      const u = easeInOutCubic(winU(f, 515, 585));
      pos = lerp3([0.68, 1.62, 2.55], [0.76, 1.74, 1.78], u);
      target = lerp3([0.85, 1.68, -0.45], [0.88, 1.72, -0.45], u);
      fov = lerp(56, 50, u);
      rollDeg = lerp(-3.5, -6.0, u) + Math.sin(t * 28) * 0.45;
    } else if (f <= 604) {
      // T03 (Family A): Continuous Hangar Pan-Right into Laughing Blue Crew!
      const u = easeInOutCubic(winU(f, 585, 604));
      pos = lerp3([0.76, 1.74, 1.78], [4.55, 1.55, 3.55], u);
      target = lerp3([0.88, 1.72, -0.45], [4.65, 1.42, -0.55], u);
      fov = lerp(50, 70, u);
      rollDeg = lerp(-6.0, 3.5, u);
    } else if (f <= 715) {
      // S04A (19.97-23.65s): Whole crew bursts out laughing + pink frosted DONUT gag pops up!
      const u = easeInOutSine(winU(f, 604, 715));
      pos = lerp3([4.55, 1.55, 3.55], [4.62, 1.52, 2.95], u);
      target = lerp3([4.65, 1.42, -0.55], [4.65, 1.48, -0.55], u);
      fov = lerp(70, 62, u);
      rollDeg = lerp(3.5, -2.5, u);
    } else {
      // S04B (24.05-26.00s): Smooth pan back to resolute Hero refusing to stitch hole -> centers circular hole for T04 match-cut!
      const u = easeInOutCubic(winU(f, 715, 775));
      pos = lerp3([4.62, 1.52, 2.95], [-0.88, 1.52, 1.88], u);
      target = lerp3([4.65, 1.48, -0.55], [-0.90, 1.48, -0.45], u);
      fov = lerp(62, 52, u);
      rollDeg = lerp(-2.5, 0.0, u);
    }

    // Silk cutting animation (0.3s - 2.4s = f9 - f72)
    const cutProgress = easeInOutSine(winU(f, 9, 72));
    const cutoutRemoved = f >= 74;
    const cutoutLift = easeInOutCubic(winU(f, 74, 102));

    // Commander live purple flush right on "his face goes purple" (14.95s - 16.97s = f448 - f509)!
    const purpleFlush = smoothstep(435, 505, f);
    const commanderPose = f >= 518 ? 'yell' : 'inspect';
    const shoutOpen = f >= 522 && f <= 586 ? (0.45 + 0.55 * Math.abs(Math.sin(t * 14))) : 0;

    // Donut gag badge pops up smoothly right on "calls it the donut chute" (22.0s - 23.8s = f660 - f714)!
    const donutScale = f >= 660 && f <= 725
      ? easeOutBack(winU(f, 660, 678)) * (1 - smoothstep(708, 724, f))
      : 0;

    // Hero pose & head shake on "But he won't stitch it closed" (24.05s - 25.73s = f721 - f772)
    let heroPose = 'cut';
    if (f >= 340 && f < 715) heroPose = 'hold_circle';
    else if (f >= 715) heroPose = 'pack';
    const heroHeadRot = (f >= 724 && f <= 768)
      ? Math.sin((f - 724) * 0.42) * 0.16
      : (f < 130 ? 0.14 : -0.05);

    return {
      camera: { pos, target, fov, rollDeg },
      whipGhostAlpha,
      cutProgress,
      cutoutRemoved,
      cutoutLift,
      hero: {
        pose: heroPose,
        eyes: 'half_lid',
        mouth: f >= 715 ? 'smirk' : 'focused',
        headRot: heroHeadRot,
        pupilDx: f >= 340 && f < 715 ? 5 : 0,
        pupilDy: f < 130 ? 4 : 0,
        breath: Math.sin(t * 2.4) * 0.6,
        armAnim: t,
        warmRim: true,
      },
      commander: {
        pose: commanderPose,
        purpleFlush,
        steamPhase: t,
        shoutOpen,
        headRot: f >= 518 ? Math.sin(t * 22) * 0.06 : -0.04,
      },
      rivalsAnim: t,
      donutScale,
      targetPulse: 0.85 + 0.35 * Math.sin(t * 5.0),
    };
  }

  // =========================================================================
  // WORLD 2: 10,000-FOOT SKY & PARACHUTE SHOWDOWN (S05, S06, S07: f0762 - f1624)
  // =========================================================================
  if (worldId === 'sky') {
    let pos, target, fov, rollDeg;
    const isHeroSegment = f >= 1392; // T06 cloud blow-out hides swap from chaotic rivals -> Hero leap!

    // Sky storm mood shifts from bright golden calm (S05) -> stormy cobalt (S06) -> golden breakthrough (S07)
    const stormMix = isHeroSegment
      ? (1 - smoothstep(1445, 1520, f)) * 0.45
      : smoothstep(1075, 1145, f);

    // Rival Parachute physics & EXACT SRT-SYNCED PENDULUM CHAOS!
    const leapU = easeInOutCubic(winU(f, 795, 890));
    const snapOpenU = easeOutBack(winU(f, 892, 955));

    // Exact pendulum swing angle (radians) synced to SRT:
    //   36.35-38.33s (f1090-1150): gentle ominous tilt -10 deg
    //   38.89s (f1167 "Left"): whips -30 deg LEFT!
    //   39.95s (f1198 "hard right"): snaps +42 deg RIGHT!
    //   41.07-45.83s (f1232-1375): violent +/- 58 deg pendulum whipping!
    let rivalSwingDeg = 0;
    if (f >= 1090 && f < 1160) {
      rivalSwingDeg = -11 * easeInOutSine(winU(f, 1090, 1155));
    } else if (f >= 1160 && f < 1194) {
      // "Left"
      rivalSwingDeg = lerp(-11, -32, easeInOutCubic(winU(f, 1160, 1188)));
    } else if (f >= 1194 && f < 1230) {
      // "then hard right."
      rivalSwingDeg = lerp(-32, 44, easeInOutCubic(winU(f, 1194, 1222)));
    } else if (f >= 1230) {
      // "whipping across the sky like giant pendulums, swinging nearly sideways!"
      const ramp = smoothstep(1230, 1275, f);
      const amp = lerp(44, 58, ramp);
      rivalSwingDeg = Math.cos((f - 1222) * 0.145) * amp;
    }

    // Hero Parachute physics (S07: f1392-f1624): ZERO WOBBLE!
    const heroLeapU = easeInOutCubic(winU(f, 1395, 1448));
    const heroSnapU = easeOutBack(winU(f, 1448, 1495));

    if (!isHeroSegment) {
      if (f <= 815) {
        // Emerging smoothly out of circular aircraft cargo hatch (matches T04 circle!)
        const u = easeInOutCubic(winU(f, 765, 815));
        pos = lerp3([0.0, 2.2, 5.2], [0.0, 1.9, 6.8], u);
        target = [0.0, 1.5, -2.0];
        fov = lerp(52, 72, u);
        rollDeg = lerp(0, 2.0, u);
      } else if (f <= 990) {
        // Rivals leap out & spotless sealed white canopies snap open wide overhead!
        const u = easeInOutCubic(winU(f, 815, 990));
        pos = lerp3([0.0, 1.9, 6.8], [0.15, -0.4, 7.2], u);
        target = lerp3([0.0, 1.5, -2.0], [0.0, 1.4, 0.0], u);
        fov = lerp(72, 74, u);
        rollDeg = lerp(2.0, -2.0, u);
      } else if (f <= 1085) {
        // "For three seconds, they look untouchable." — serene golden glide!
        const u = easeInOutSine(winU(f, 990, 1085));
        pos = lerp3([0.15, -0.4, 7.2], [-0.35, -0.2, 6.6], u);
        target = [0.0, 1.35, 0.0];
        fov = lerp(74, 70, u);
        rollDeg = lerp(-2.0, 1.0, u);
      } else {
        // S06 Pendulum Chaos — camera Dutch rolls dramatically WITH the violent swing!
        const u = easeInOutSine(winU(f, 1085, 1390));
        pos = lerp3([-0.35, -0.2, 6.6], [0.25, -0.65, 7.8], u);
        target = [Math.sin((rivalSwingDeg * Math.PI) / 180) * 0.9, 1.25, 0.0];
        fov = lerp(70, 76, u);
        rollDeg = rivalSwingDeg * 0.34;
      }
    } else {
      // S07: Hero leaps cleanly -> canopy snaps open -> soaring upward tilt into glowing APEX HOLE -> steady pull-back!
      if (f <= 1495) {
        const u = easeInOutCubic(winU(f, 1392, 1495));
        pos = lerp3([0.0, 0.6, 5.2], [0.0, -0.5, 6.0], u);
        target = lerp3([0.0, 0.8, 0.0], [0.0, 1.8, 0.0], u);
        fov = lerp(66, 72, u);
        rollDeg = 0.0;
      } else if (f <= 1550) {
        // Heroic upward look straight beneath canopy framing the GLOWING CIRCULAR APEX HOLE!
        const u = easeInOutCubic(winU(f, 1495, 1545));
        pos = lerp3([0.0, -0.5, 6.0], [0.0, -0.95, 2.35], u);
        target = lerp3([0.0, 1.8, 0.0], [0.0, 3.35, -0.15], u);
        fov = lerp(72, 64, u);
        rollDeg = 0.0;
      } else {
        // Pull back showing rock-steady dead-straight descent (0.0 deg wobble!) while rivals whip far behind!
        const u = easeInOutCubic(winU(f, 1550, 1618));
        pos = lerp3([0.0, -0.95, 2.35], [0.15, -0.15, 6.8], u);
        target = lerp3([0.0, 3.35, -0.15], [0.0, 1.15, 0.0], u);
        fov = lerp(64, 72, u);
        rollDeg = 0.0;
      }
    }

    const rivalPose = f < 1095 ? 'smug_harness' : 'panic_harness';

    return {
      camera: { pos, target, fov, rollDeg },
      isHeroSegment,
      stormMix,
      hatchVisible: f < 822,
      hatchZ: lerp(2.2, 6.2, easeInOutCubic(winU(f, 775, 822))),
      hatchAlpha: 1.0 - smoothstep(792, 820, f),
      leapU,
      snapOpenU,
      rivalSwingDeg,
      rivalPose,
      heroLeapU,
      heroSnapU,
      heroRigState: {
        pose: f < 1452 ? 'freefall' : 'harness',
        eyes: f >= 1495 && f < 1565 ? 'dash_closed' : 'half_lid',
        mouth: f >= 1490 ? 'calm_grin' : 'focused',
        headRot: 0,
        breath: Math.sin(t * 2.0) * 0.4,
        warmRim: true,
      },
      cloudScroll: (f - 760) * 0.055,
      t,
    };
  }

  // =========================================================================
  // WORLD 3: UNDERWATER GLASS CUP ANALOGY & CUTAWAY APEX VENT (S08 & S09: f1596 - f2036)
  // =========================================================================
  if (worldId === 'physics_cup' || worldId === 'physics_vent') {
    const isVent = worldId === 'physics_vent';

    if (!isVent) {
      // S08 (53.91 - 62.30s): Upside-down glass cup plunges into water & burps air LEFT then RIGHT!
      const plungeU = easeInOutCubic(winU(f, 1622, 1720));
      const cupY = lerp(2.45, 0.15, plungeU);

      // Synced to exact SRT words:
      //   58.03-59.87s (f1741-1796 "burps out one side"): tilts LEFT + huge left bubble burst!
      //   60.09-61.97s (f1803-1859 "then the other, rocking it wildly"): snaps RIGHT + right bubble burst + rapid rock!
      let cupTiltDeg = 0;
      let burpLeft = 0;
      let burpRight = 0;
      if (f >= 1735 && f < 1796) {
        const u = winU(f, 1735, 1796);
        cupTiltDeg = -24 * Math.sin(u * Math.PI);
        burpLeft = Math.sin(u * Math.PI);
      } else if (f >= 1796 && f < 1835) {
        const u = winU(f, 1796, 1835);
        cupTiltDeg = 28 * Math.sin(u * Math.PI);
        burpRight = Math.sin(u * Math.PI);
      } else if (f >= 1835) {
        // Rocking wildly!
        cupTiltDeg = Math.sin((f - 1835) * 0.28) * 32;
        burpLeft = Math.max(0, -Math.sin((f - 1835) * 0.28));
        burpRight = Math.max(0, Math.sin((f - 1835) * 0.28));
      }

      const camU = easeInOutSine(winU(f, 1610, 1875));
      return {
        camera: {
          pos: [0.0, lerp(0.85, 0.35, camU), lerp(5.6, 5.1, camU)],
          target: [0.0, 0.25, 0.0],
          fov: 56,
          rollDeg: cupTiltDeg * 0.14,
        },
        cupY,
        cupTiltDeg,
        burpLeft,
        burpRight,
        t,
      };
    } else {
      // S09 (62.30 - 67.75s): Sealed cutaway parachute rocks wildly -> AT f1982 ("unless you give the air a way out")
      // APEX HOLE OPENS & ROCKING INSTANTLY FREEZES DEAD-STILL AS GOLDEN AIRFLOW STREAMS UP!
      const ventOpen = easeInOutCubic(winU(f, 1978, 1998));
      const chaosRock = Math.sin((f - 1860) * 0.24) * 34 * (1 - ventOpen);

      // Gentle dramatic zoom-in during golden vent reveal, then pull-down start for T09
      const revealU = easeInOutSine(winU(f, 1870, 2010));
      const downU = easeInOutCubic(winU(f, 2008, 2036));
      const camPos = lerp3([0.0, 0.65, 6.45], [0.0, 1.05, 5.95], revealU);
      camPos[1] -= downU * 1.4;
      return {
        camera: {
          pos: camPos,
          target: [0.0, 0.92 - downU * 1.1, 0.0],
          fov: lerp(58, 56, revealU),
          rollDeg: chaosRock * 0.16,
        },
        domeTiltDeg: chaosRock,
        ventOpen,
        t,
      };
    }
  }

  // =========================================================================
  // WORLD 4: GOLDEN-HOUR AIRFIELD BULLSEYE TOUCHDOWN + 1.0s FREEZE (S10: f2008 - f2069)
  // =========================================================================
  const landU = easeInOutCubic(winU(f, 2008, 2040));
  return {
    camera: {
      pos: lerp3([0.15, 2.35, 5.65], [0.12, 1.52, 4.55], landU),
      target: lerp3([0.0, 1.35, 0.0], [0.0, 1.12, -0.5], landU),
      fov: lerp(68, 64, landU),
      rollDeg: lerp(2.0, 0.0, landU),
    },
    heroY: lerp(2.25, 0.94, landU),
    chuteCollapse: smoothstep(2028, 2040, f),
    hero: {
      pose: f >= 2034 ? 'victory' : 'harness',
      eyes: 'half_lid',
      mouth: 'smirk',
      headRot: -0.04,
      breath: 0,
      warmRim: true,
    },
    commander: {
      pose: 'shock',
      purpleFlush: 0.18,
      steamPhase: 0,
      shoutOpen: 0,
      headRot: 0.05,
    },
    t,
  };
}

// Master frame router returning active world(s) and zero-hard-cut transition blends!
export function evaluateMasterFrame(rawFrame) {
  const f = Math.min(rawFrame, FREEZE_START);

  // T06: Sunlit Cloud Blow-Out Flash hiding S06 Rivals -> S07 Hero Leap (f1376 - f1406, peak f1391-1392)
  let blowOutAlpha = 0;
  if (f >= 1376 && f <= 1406) {
    if (f <= 1390) blowOutAlpha = Math.pow(winU(f, 1375, 1391), 1.65);
    else if (f <= 1392) blowOutAlpha = 1.0;
    else blowOutAlpha = 1.0 - Math.pow(winU(f, 1392, 1406), 0.72);
  }

  // Dual-world seamless transitions:
  //   T04 (f762-794): Circular silk cutout -> Aircraft Hatch Match-Cut Dissolve
  //   T07 (f1596-1624): Downward Caustic Water Seam Wipe (Sky -> Underwater Tank)
  //   T08 (f1856-1886): Upside-Down Cup -> Cutaway Parachute Morph Dissolve
  //   T09 (f2008-2036): Golden Vent Glow -> Airfield Bullseye Touchdown Dissolve
  if (f >= 762 && f <= 794) {
    return {
      frame: f, rawFrame,
      primary: 'hangar', secondary: 'sky',
      blendMode: 'dissolve',
      blendAlpha: easeInOutCubic(winU(f, 762, 794)),
      blowOutAlpha,
      matchCircleAlpha: Math.sin(winU(f, 762, 794) * Math.PI) * 0.85,
    };
  }
  if (f >= 1596 && f <= 1624) {
    return {
      frame: f, rawFrame,
      primary: 'sky', secondary: 'physics_cup',
      blendMode: 'water_wipe',
      blendAlpha: easeInOutSine(winU(f, 1596, 1624)),
      blowOutAlpha,
      matchCircleAlpha: 0,
    };
  }
  if (f >= 1856 && f <= 1886) {
    return {
      frame: f, rawFrame,
      primary: 'physics_cup', secondary: 'physics_vent',
      blendMode: 'dissolve',
      blendAlpha: easeInOutCubic(winU(f, 1856, 1886)),
      blowOutAlpha,
      matchCircleAlpha: 0,
    };
  }
  if (f >= 2008 && f <= 2036) {
    return {
      frame: f, rawFrame,
      primary: 'physics_vent', secondary: 'runway',
      blendMode: 'dissolve',
      blendAlpha: easeInOutCubic(winU(f, 2008, 2036)),
      blowOutAlpha,
      matchCircleAlpha: 0,
    };
  }

  let primary = 'hangar';
  if (f > 794 && f < 1596) primary = 'sky';
  else if (f >= 1625 && f < 1856) primary = 'physics_cup';
  else if (f >= 1887 && f < 2008) primary = 'physics_vent';
  else if (f > 2036) primary = 'runway';

  return {
    frame: f, rawFrame,
    primary, secondary: null,
    blendMode: 'none',
    blendAlpha: 0,
    blowOutAlpha,
    matchCircleAlpha: 0,
  };
}
