// Parametric Animated 2D Cel Character Rigs for the 10s Zombie Plane Preview.
// Strictly follows Every_Memory_Has_a_Price_25D_Code_Skill.zip (06_Characters_Acting_and_Rig_Spec.md):
//   - Oversized round head, thick pure-black ink outline (#120E1E), ZERO fingers (round ball-hands)
//   - Flat cel fill + single lavender/cobalt shadow crescent + directional warm/crimson/cyan rim
//   - Live emotional state machine: wide_ring, wink_left, dash_closed, empty_dot (infection twist!)
import * as THREE from 'three';

const INK = '#120E1E';

function makeCharCanvas(w = 1024, h = 1536) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.lineCap = 'round';
  g.lineJoin = 'round';
  return [c, g];
}

function toCharTex(c) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function mixHex(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function drawCelHead(g, cx, cy, rx, ry, rot = 0, {
  baseColor = '#F0DFD6',
  shadowColor = '#A996C4',
  rimColor = 'rgba(255,216,158,0.52)',
  rimSide = 1,
  inkW = 19,
} = {}) {
  g.save();
  g.translate(cx, cy);
  g.rotate(rot);

  g.beginPath();
  g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = baseColor;
  g.fill();

  g.save();
  g.clip();
  const sh = g.createRadialGradient(
    rimSide * rx * 0.25, -ry * 0.16, rx * 0.34,
    -rimSide * rx * 0.12, ry * 0.15, rx * 1.16
  );
  sh.addColorStop(0.0, 'rgba(120,115,180,0)');
  sh.addColorStop(0.66, 'rgba(110,104,172,0.22)');
  sh.addColorStop(1.0, shadowColor);
  g.fillStyle = sh;
  g.fillRect(-rx * 1.25, -ry * 1.25, rx * 2.5, ry * 2.5);

  if (rimSide === 0) {
    const br = g.createRadialGradient(0, ry * 0.15, rx * 0.58, 0, 0, rx * 1.06);
    br.addColorStop(0.0, 'rgba(255,75,65,0)');
    br.addColorStop(0.75, 'rgba(255,75,65,0.18)');
    br.addColorStop(1.0, rimColor);
    g.fillStyle = br;
    g.fillRect(-rx * 1.25, -ry * 1.25, rx * 2.5, ry * 2.5);
  } else {
    const wr = g.createRadialGradient(
      rimSide * rx * 0.72, -ry * 0.25, rx * 0.05,
      rimSide * rx * 0.68, -ry * 0.20, rx * 0.78
    );
    wr.addColorStop(0.0, rimColor);
    wr.addColorStop(1.0, 'rgba(180,210,255,0)');
    g.fillStyle = wr;
    g.fillRect(-rx * 1.25, -ry * 1.25, rx * 2.5, ry * 2.5);
  }
  g.restore();

  g.beginPath();
  g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  g.strokeStyle = INK;
  g.lineWidth = inkW;
  g.stroke();
  g.restore();
}

// ============================================================================
// 1. ANIMATED HERO PASSENGER RIG (Supports alive panic -> hollow dot-eye twist!)
// ============================================================================
export function createHeroRig() {
  const [c, g] = makeCharCanvas(1024, 1536);
  const texture = toCharTex(c);
  const inkW = 19;

  function update({
    headRot = -0.09,
    breath = 0,          // -1..1 chest heave
    recoil = 0,          // 0..1 defensive flinch
    eyes = 'wide_ring',  // 'wide_ring' | 'wink_left' | 'dash_closed' | 'empty_dot'
    mouth = 'wavy_anxious', // 'wavy_anxious' | 'slack_hollow' | 'eerie_smile'
    pupilDx = 10,
    pupilDy = -12,
    sweatProgress = 0.2, // 0..1 drip down temple
    sweatAlpha = 1.0,
    tremorPhase = 0,
    infectionMix = 0.0,  // 0 = alive warm peach, 1 = turned pale sage-lavender!
    coldRim = false,
  } = {}) {
    g.clearRect(0, 0, c.width, c.height);
    const heaveY = breath * 10;

    // Crouched stick legs
    g.strokeStyle = INK;
    g.lineWidth = inkW;
    g.beginPath();
    g.moveTo(435, 1020 + heaveY * 0.4);
    g.quadraticCurveTo(355, 1185, 395, 1410);
    g.lineTo(318, 1422);
    g.moveTo(555, 1020 + heaveY * 0.4);
    g.quadraticCurveTo(645, 1165, 590, 1400);
    g.lineTo(668, 1412);
    g.stroke();

    // Right arm bracing on overturned trolley
    const armRx = 832 - recoil * 35;
    const armRy = 965 - recoil * 55 + heaveY;
    g.beginPath();
    g.moveTo(605, 790 + heaveY);
    g.quadraticCurveTo(735, 845 + heaveY, armRx, armRy);
    g.stroke();
    g.fillStyle = INK;
    g.beginPath(); g.arc(armRx + 6, armRy + 7, 24, 0, Math.PI * 2); g.fill();

    // Bean torso (mustard vest + white shirt + frog badge)
    g.save();
    g.translate(495, 845 + heaveY);
    g.rotate(-0.08 - recoil * 0.05);
    g.scale(1 + breath * 0.02, 1 - breath * 0.015);
    g.beginPath();
    g.moveTo(-105, -185);
    g.bezierCurveTo(-165, -95, -172, 105, -98, 178);
    g.bezierCurveTo(-32, 224, 48, 224, 105, 174);
    g.bezierCurveTo(175, 102, 165, -95, 102, -185);
    g.closePath();
    g.fillStyle = mixHex('#E0A230', '#968B56', infectionMix * 0.55);
    g.fill();

    g.save();
    g.clip();
    g.fillStyle = coldRim ? 'rgba(18,22,74,0.42)' : 'rgba(26,20,66,0.28)';
    g.fillRect(-185, -200, 105, 440);
    g.fillStyle = mixHex('#ECE6DC', '#B4C0D2', infectionMix * 0.55);
    g.fillRect(-36, -195, 72, 420);
    g.strokeStyle = INK;
    g.lineWidth = 9;
    g.strokeRect(-36, -195, 72, 420);
    g.fillStyle = '#4BAE50';
    g.beginPath(); g.arc(0, -68, 28, 0, Math.PI * 2); g.fill();
    g.lineWidth = 8; g.stroke();
    g.fillStyle = coldRim ? 'rgba(128,175,255,0.34)' : 'rgba(255,222,165,0.32)';
    g.fillRect(92, -195, 80, 420);
    g.restore();

    g.strokeStyle = INK;
    g.lineWidth = inkW;
    g.stroke();
    g.restore();

    // Left defensive arm (rises higher on recoil)
    const armLx = 224 + recoil * 36;
    const armLy = 678 - recoil * 68 + heaveY;
    g.strokeStyle = INK;
    g.lineWidth = inkW;
    g.beginPath();
    g.moveTo(372, 795 + heaveY);
    g.quadraticCurveTo(230, 825 + heaveY, armLx, armLy);
    g.stroke();
    g.fillStyle = INK;
    g.beginPath(); g.arc(armLx, armLy - 10, 24, 0, Math.PI * 2); g.fill();

    // Head colors morph subtly toward undead pale sage-lavender during Shot 5 twist!
    const headBase = mixHex('#EFE0D8', '#BACFC2', infectionMix);
    const headShadow = coldRim
      ? mixHex('#6A74B8', '#4B588C', infectionMix)
      : mixHex('#9E8AB8', '#6B749C', infectionMix);
    const headRim = coldRim
      ? 'rgba(130,185,255,0.58)'
      : 'rgba(255,214,150,0.58)';

    const hx = 482 - recoil * 14;
    const hy = 492 + heaveY * 1.15;
    drawCelHead(g, hx, hy, 206, 196, headRot, {
      baseColor: headBase,
      shadowColor: headShadow,
      rimColor: headRim,
      rimSide: 1,
      inkW,
    });

    // Hair & Facial Features
    g.save();
    g.translate(hx, hy);
    g.rotate(headRot);

    // Spiky orange hair droops slightly when infectionMix approaches 1.0 (skill rule: limp = sick/turned!)
    const droop = infectionMix * 42;
    g.beginPath();
    g.moveTo(-198, -46);
    g.quadraticCurveTo(-234, -182 + droop * 0.4, -124, -206 + droop * 0.7);
    g.lineTo(-152, -258 + droop * 1.1);
    g.lineTo(-54, -220 + droop * 0.8);
    g.lineTo(-16, -286 + droop * 1.25);
    g.lineTo(48, -218 + droop * 0.8);
    g.lineTo(126, -268 + droop * 1.15);
    g.lineTo(144, -196 + droop * 0.7);
    g.quadraticCurveTo(222, -168 + droop * 0.4, 198, -44);
    g.quadraticCurveTo(86, -110 + droop * 0.3, 0, -104 + droop * 0.3);
    g.quadraticCurveTo(-96, -112 + droop * 0.3, -198, -46);
    g.closePath();
    g.fillStyle = mixHex('#D85A26', '#A84828', infectionMix * 0.65);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = inkW * 0.9;
    g.stroke();

    // Dark zig-zag interior hair strokes
    g.strokeStyle = '#862E14';
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(-124, -134 + droop * 0.3); g.lineTo(-82, -184 + droop * 0.5); g.lineTo(-40, -134 + droop * 0.3);
    g.lineTo(10, -198 + droop * 0.6); g.lineTo(58, -138 + droop * 0.3); g.lineTo(110, -184 + droop * 0.5);
    g.stroke();
    g.strokeStyle = coldRim ? 'rgba(165,205,255,0.52)' : 'rgba(255,218,162,0.68)';
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(-68, -200 + droop * 0.6); g.lineTo(-18, -246 + droop * 0.9);
    g.moveTo(52, -196 + droop * 0.6); g.lineTo(104, -234 + droop * 0.9);
    g.stroke();

    // EYES (Exact Every-Memory Visual Emotion State Machine!)
    if (eyes === 'wide_ring') {
      for (const ex of [-54, 68]) {
        g.fillStyle = '#FFFFFF';
        g.beginPath(); g.arc(ex, -10, 40, 0, Math.PI * 2); g.fill();
        g.strokeStyle = INK; g.lineWidth = 10; g.stroke();
        g.fillStyle = INK;
        g.beginPath(); g.arc(ex + pupilDx, -10 + pupilDy, 11, 0, Math.PI * 2); g.fill();
      }
      g.strokeStyle = INK; g.lineWidth = 10;
      g.beginPath();
      g.moveTo(-92, -54); g.lineTo(-26, -84);
      g.moveTo(36, -84); g.lineTo(104, -54);
      g.stroke();
    } else if (eyes === 'wink_left') {
      // Left eye closed dash, right eye wide ring (startle / quick blink!)
      g.strokeStyle = INK; g.lineWidth = 11;
      g.beginPath(); g.moveTo(-88, -10); g.quadraticCurveTo(-54, 4, -20, -10); g.stroke();
      g.fillStyle = '#FFFFFF';
      g.beginPath(); g.arc(68, -10, 38, 0, Math.PI * 2); g.fill();
      g.lineWidth = 10; g.stroke();
      g.fillStyle = INK;
      g.beginPath(); g.arc(68 + pupilDx, -10 + pupilDy, 11, 0, Math.PI * 2); g.fill();
      g.lineWidth = 10;
      g.beginPath();
      g.moveTo(-90, -50); g.lineTo(-26, -74);
      g.moveTo(36, -82); g.lineTo(104, -54);
      g.stroke();
    } else if (eyes === 'dash_closed') {
      g.strokeStyle = INK; g.lineWidth = 11;
      g.beginPath();
      g.moveTo(-92, -8); g.quadraticCurveTo(-54, 8, -18, -8);
      g.moveTo(32, -8); g.quadraticCurveTo(68, 8, 104, -8);
      g.stroke();
      g.lineWidth = 9;
      g.beginPath();
      g.moveTo(-90, -48); g.lineTo(-28, -62);
      g.moveTo(38, -62); g.lineTo(100, -48);
      g.stroke();
    } else if (eyes === 'empty_dot') {
      // SIGNATURE S24 HOLLOW EMPTY DOT EYES (NO WHITE RING — SOUL/HUMANITY GONE!)
      g.fillStyle = INK;
      g.beginPath(); g.arc(-54, -8, 18, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(68, -6, 17, 0, Math.PI * 2); g.fill();
      // Subtle dark tired arcs beneath hollow eyes
      g.strokeStyle = 'rgba(20,18,46,0.65)';
      g.lineWidth = 6;
      g.beginPath(); g.arc(-54, 2, 32, Math.PI * 0.18, Math.PI * 0.82); g.stroke();
      g.beginPath(); g.arc(68, 4, 32, Math.PI * 0.18, Math.PI * 0.82); g.stroke();
      // Flat numb brows
      g.strokeStyle = INK; g.lineWidth = 9;
      g.beginPath();
      g.moveTo(-88, -48); g.lineTo(-24, -44);
      g.moveTo(36, -44); g.lineTo(100, -48);
      g.stroke();
    }

    // MOUTH
    g.strokeStyle = INK;
    g.lineWidth = 10;
    if (mouth === 'wavy_anxious') {
      g.beginPath();
      g.moveTo(-40, 74);
      g.quadraticCurveTo(-20, 52, 0, 74);
      g.quadraticCurveTo(20, 96, 40, 74);
      g.stroke();
    } else if (mouth === 'slack_hollow') {
      g.fillStyle = '#181028';
      g.beginPath(); g.ellipse(6, 80, 26, 20, 0.05, 0, Math.PI * 2); g.fill();
      g.stroke();
    } else if (mouth === 'eerie_smile') {
      // Crooked hollow undead grin w/ 2 tiny flat graphic teeth!
      g.fillStyle = '#181026';
      g.beginPath();
      g.moveTo(-54, 68);
      g.quadraticCurveTo(6, 56, 62, 74);
      g.quadraticCurveTo(48, 118, 2, 116);
      g.quadraticCurveTo(-48, 114, -54, 68);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = '#E6ECD8';
      g.fillRect(-26, 66, 20, 18);
      g.fillRect(14, 68, 20, 17);
      g.lineWidth = 5;
      g.strokeRect(-26, 66, 20, 18);
      g.strokeRect(14, 68, 20, 17);
    }

    // Sliding cyan sweat drop (only while panicked/alive!)
    if (sweatAlpha > 0.02) {
      const sy = -72 + sweatProgress * 58;
      g.save();
      g.globalAlpha = sweatAlpha;
      g.fillStyle = '#82D0FF';
      g.strokeStyle = INK;
      g.lineWidth = 7;
      g.beginPath();
      g.moveTo(-152, sy);
      g.quadraticCurveTo(-124, sy + 48, -152, sy + 62);
      g.quadraticCurveTo(-180, sy + 48, -152, sy);
      g.closePath();
      g.fill(); g.stroke();
      g.restore();
    }

    // Vibrating nervous tremor lines beside cheek
    if (tremorPhase > 0 && infectionMix < 0.5) {
      const j = Math.sin(tremorPhase * 12) * 5;
      g.strokeStyle = INK;
      g.lineWidth = 7;
      g.beginPath();
      g.moveTo(-232 + j, -26); g.quadraticCurveTo(-248 + j, 8, -232 + j, 42);
      g.moveTo(-252 - j, -12); g.quadraticCurveTo(-264 - j, 10, -252 - j, 30);
      g.stroke();
    }

    g.restore();
    texture.needsUpdate = true;
  }

  update();
  return { texture, update };
}

// ============================================================================
// 2. PEEKING TERRIFIED SURVIVOR RIG (Gripping top of 3D Row-3 seat headrest!)
// ============================================================================
export function createPeekingRig() {
  const [c, g] = makeCharCanvas(1024, 1024);
  const texture = toCharTex(c);
  const inkW = 20;

  function update({ blink = false, tremor = 0, sweatAlpha = 1.0 } = {}) {
    g.clearRect(0, 0, c.width, c.height);
    const j = Math.sin(tremor * 14) * 4;

    g.fillStyle = '#365878';
    g.beginPath();
    g.ellipse(512, 840, 210, 175, 0, Math.PI, Math.PI * 2);
    g.fill();
    g.strokeStyle = INK; g.lineWidth = inkW; g.stroke();

    drawCelHead(g, 512 + j * 0.5, 470, 212, 200, 0.06, {
      baseColor: '#EADCD8',
      shadowColor: '#9888B8',
      rimColor: 'rgba(255,140,120,0.35)',
      rimSide: -1,
      inkW,
    });

    g.save();
    g.translate(512 + j * 0.5, 470);
    g.rotate(0.06);

    g.fillStyle = '#2B254A';
    g.beginPath();
    g.arc(-155, -80, 68, 0, Math.PI * 2);
    g.arc(-80, -155, 76, 0, Math.PI * 2);
    g.arc(20, -172, 82, 0, Math.PI * 2);
    g.arc(125, -135, 74, 0, Math.PI * 2);
    g.arc(178, -58, 62, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = INK; g.lineWidth = inkW * 0.85; g.stroke();

    if (blink) {
      g.strokeStyle = INK; g.lineWidth = 10;
      g.beginPath();
      g.moveTo(-96, -8); g.lineTo(-32, -8);
      g.moveTo(26, -8); g.lineTo(90, -8);
      g.stroke();
    } else {
      for (const ex of [-64, 58]) {
        g.fillStyle = '#FFFFFF';
        g.beginPath(); g.arc(ex, -8, 38, 0, Math.PI * 2); g.fill();
        g.strokeStyle = INK; g.lineWidth = 10; g.stroke();
        g.fillStyle = INK;
        g.beginPath(); g.arc(ex - 12, -6, 10, 0, Math.PI * 2); g.fill();
      }
    }

    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(-98, -68); g.quadraticCurveTo(-64, -92, -32, -68);
    g.moveTo(26, -68); g.quadraticCurveTo(58, -92, 92, -68);
    g.stroke();

    g.fillStyle = INK;
    g.beginPath(); g.ellipse(-4, 72, 18, 24 + Math.abs(j) * 0.8, 0, 0, Math.PI * 2); g.fill();

    if (sweatAlpha > 0.05) {
      g.save();
      g.globalAlpha = sweatAlpha;
      g.fillStyle = '#82D0FF';
      g.lineWidth = 7;
      g.beginPath();
      g.moveTo(148, -40);
      g.quadraticCurveTo(172, 4, 148, 16);
      g.quadraticCurveTo(124, 4, 148, -40);
      g.closePath();
      g.fill(); g.stroke();
      g.restore();
    }
    g.restore();

    // Both gripping ball-hands visibly clutching top rim of Row-3 headrest!
    g.fillStyle = INK;
    g.beginPath(); g.arc(312, 646, 36, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(712, 646, 36, 0, Math.PI * 2); g.fill();

    texture.needsUpdate = true;
  }

  update();
  return { texture, update };
}

// ============================================================================
// 3. ANIMATED LEAD LUNGING ZOMBIE RIG (Shambling walk + reaching arms + jaw chomp)
// ============================================================================
export function createLeadZombieRig() {
  const [c, g] = makeCharCanvas(1024, 1536);
  const texture = toCharTex(c);
  const inkW = 19;

  function update({
    walkPhase = 0,
    lunge = 0,       // 0..1 forward aggressive lean & arm reach
    jawOpen = 0.5,   // 0..1 mouth open amount
    crimsonRim = 0.65,
  } = {}) {
    g.clearRect(0, 0, c.width, c.height);
    const step = Math.sin(walkPhase);
    const bob = Math.abs(Math.cos(walkPhase)) * 22;

    // Animated shambling stick legs
    g.strokeStyle = INK;
    g.lineWidth = inkW;
    g.beginPath();
    g.moveTo(455, 955 + bob);
    g.quadraticCurveTo(422 + step * 28, 1175, 385 + step * 52, 1412 - Math.max(0, step) * 28);
    g.lineTo(318 + step * 52, 1425 - Math.max(0, step) * 28);
    g.moveTo(568, 955 + bob);
    g.quadraticCurveTo(615 - step * 28, 1165, 650 - step * 52, 1405 - Math.max(0, -step) * 28);
    g.lineTo(725 - step * 52, 1422 - Math.max(0, -step) * 28);
    g.stroke();

    // Left reaching stick arm (sways + lifts higher during lunge!)
    const lHandX = 122 - lunge * 36 + step * 24;
    const lHandY = 768 - lunge * 115 + bob;
    g.beginPath();
    g.moveTo(395, 710 + bob);
    g.quadraticCurveTo(215, 675 - lunge * 60 + bob, lHandX, lHandY);
    g.stroke();
    g.fillStyle = INK;
    g.beginPath(); g.arc(lHandX - 4, lHandY + 4, 25 + lunge * 5, 0, Math.PI * 2); g.fill();

    // Hunched bean torso
    g.save();
    g.translate(512, 790 + bob);
    g.rotate(0.11 + step * 0.06 + lunge * 0.08);
    g.beginPath();
    g.moveTo(-104, -178);
    g.bezierCurveTo(-164, -92, -162, 102, -96, 175);
    g.bezierCurveTo(-30, 220, 48, 220, 104, 172);
    g.bezierCurveTo(166, 98, 162, -94, 102, -178);
    g.closePath();
    g.fillStyle = '#33385C';
    g.fill();

    g.save();
    g.clip();
    g.fillStyle = '#A8B6B4';
    g.beginPath();
    g.moveTo(-48, -182); g.lineTo(0, -18); g.lineTo(48, -182); g.closePath();
    g.fill();
    g.strokeStyle = INK; g.lineWidth = 8; g.stroke();
    g.fillStyle = '#8F2430';
    g.beginPath();
    g.moveTo(-16, -155); g.lineTo(14, -155); g.lineTo(32 + step * 10, -10); g.lineTo(6 + step * 12, 22); g.lineTo(-10, -14);
    g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#8EA69B';
    g.beginPath();
    g.moveTo(75, 20); g.lineTo(145, -10); g.lineTo(155, 68); g.lineTo(88, 52); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = `rgba(255,75,62,${(0.32 * crimsonRim).toFixed(3)})`;
    g.fillRect(-170, -195, 58, 410);
    g.fillRect(112, -195, 58, 410);
    g.restore();

    g.strokeStyle = INK; g.lineWidth = inkW; g.stroke();
    g.restore();

    // Right outstretched arm reaching straight toward camera/hero!
    const rHandX = 902 + lunge * 28 - step * 22;
    const rHandY = 804 - lunge * 135 + bob;
    g.strokeStyle = INK; g.lineWidth = inkW;
    g.beginPath();
    g.moveTo(618, 730 + bob);
    g.quadraticCurveTo(790, 685 - lunge * 70 + bob, rHandX, rHandY);
    g.stroke();
    g.fillStyle = INK;
    g.beginPath(); g.arc(rHandX + 5, rHandY + 4, 26 + lunge * 6, 0, Math.PI * 2); g.fill();

    // Head bob & eerie tilt
    const hRot = 0.22 + Math.sin(walkPhase * 0.5) * 0.08 - lunge * 0.06;
    const hx = 522 + step * 10;
    const hy = 442 + bob * 1.2 + lunge * 16;
    drawCelHead(g, hx, hy, 204, 194, hRot, {
      baseColor: '#B8CEBD',
      shadowColor: '#5B678C',
      rimColor: `rgba(255,72,58,${Math.min(0.95, 0.55 + crimsonRim * 0.35).toFixed(3)})`,
      rimSide: 0,
      inkW,
    });

    g.save();
    g.translate(hx, hy);
    g.rotate(hRot);

    g.fillStyle = '#252642';
    g.beginPath();
    g.moveTo(-194, -52);
    g.quadraticCurveTo(-185, -192, -32, -196);
    g.lineTo(-10, -148);
    g.lineTo(28, -198);
    g.quadraticCurveTo(182, -184, 196, -48);
    g.quadraticCurveTo(92, -104, 10, -86);
    g.quadraticCurveTo(-86, -112, -194, -52);
    g.closePath();
    g.fill();
    g.strokeStyle = INK; g.lineWidth = inkW * 0.85; g.stroke();

    // Mismatched hollow undead eyes
    g.fillStyle = '#E8EFE4';
    g.beginPath(); g.arc(-62, -14, 36, 0, Math.PI * 2); g.fill();
    g.strokeStyle = INK; g.lineWidth = 10; g.stroke();
    g.fillStyle = INK;
    g.beginPath(); g.arc(-58, -20, 9, 0, Math.PI * 2); g.fill();
    g.lineWidth = 6;
    g.beginPath(); g.arc(-62, -8, 44, Math.PI * 0.18, Math.PI * 0.82); g.stroke();

    g.fillStyle = '#E8EFE4';
    g.beginPath(); g.arc(64, -4, 24, 0, Math.PI * 2); g.fill();
    g.strokeStyle = INK; g.lineWidth = 9; g.stroke();
    g.fillStyle = INK;
    g.beginPath(); g.arc(64, -4, 13, 0, Math.PI * 2); g.fill();
    g.lineWidth = 6;
    g.beginPath(); g.arc(64, 0, 34, Math.PI * 0.18, Math.PI * 0.82); g.stroke();

    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(-98, -66); g.lineTo(-28, -50);
    g.moveTo(36, -42); g.lineTo(96, -68);
    g.stroke();

    // Animated jaw open/chomp
    const jawDrop = 106 + jawOpen * 38;
    g.fillStyle = '#191026';
    g.beginPath();
    g.moveTo(-64, 56);
    g.quadraticCurveTo(0, 42, 68, 64);
    g.quadraticCurveTo(56, jawDrop + 4, -4, jawDrop);
    g.quadraticCurveTo(-62, jawDrop - 4, -64, 56);
    g.closePath();
    g.fill();
    g.strokeStyle = INK; g.lineWidth = 9; g.stroke();

    g.fillStyle = '#E6EBD8';
    g.fillRect(-38, 54, 22, 22);
    g.fillRect(10, 56, 22, 20);
    g.fillRect(-16, jawDrop - 26, 22, 22);
    g.strokeStyle = INK; g.lineWidth = 5;
    g.strokeRect(-38, 54, 22, 22);
    g.strokeRect(10, 56, 22, 20);
    g.strokeRect(-16, jawDrop - 26, 22, 22);

    g.restore();
    texture.needsUpdate = true;
  }

  update();
  return { texture, update };
}

// ============================================================================
// 4. ANIMATED FLIGHT ATTENDANT ZOMBIE RIG
// ============================================================================
export function createAttendantZombieRig() {
  const [c, g] = makeCharCanvas(1024, 1536);
  const texture = toCharTex(c);
  const inkW = 20;

  function update({ walkPhase = 0 } = {}) {
    g.clearRect(0, 0, c.width, c.height);
    const step = Math.sin(walkPhase);
    const bob = Math.abs(Math.cos(walkPhase)) * 18;

    g.strokeStyle = INK; g.lineWidth = inkW;
    g.beginPath();
    g.moveTo(468, 955 + bob); g.lineTo(445 + step * 35, 1410); g.lineTo(395 + step * 35, 1420);
    g.moveTo(558, 955 + bob); g.lineTo(598 - step * 35, 1405); g.lineTo(658 - step * 35, 1416);
    g.moveTo(410, 725 + bob); g.quadraticCurveTo(265, 700 + bob, 175 + step * 25, 765 - step * 25 + bob);
    g.moveTo(615, 725 + bob); g.quadraticCurveTo(755, 690 + bob, 845 - step * 25, 745 + step * 25 + bob);
    g.stroke();
    g.fillStyle = INK;
    g.beginPath(); g.arc(170 + step * 25, 770 - step * 25 + bob, 24, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(850 - step * 25, 750 + step * 25 + bob, 24, 0, Math.PI * 2); g.fill();

    g.save();
    g.translate(512, 800 + bob);
    g.rotate(-0.08 + step * 0.05);
    g.beginPath();
    g.moveTo(-98, -172);
    g.bezierCurveTo(-152, -85, -155, 102, -94, 170);
    g.bezierCurveTo(-30, 212, 42, 212, 98, 168);
    g.bezierCurveTo(156, 98, 154, -85, 98, -172);
    g.closePath();
    g.fillStyle = '#253168';
    g.fill();
    g.strokeStyle = INK; g.lineWidth = inkW; g.stroke();

    g.fillStyle = '#C83B40';
    g.beginPath();
    g.moveTo(-48, -162); g.lineTo(52, -162); g.lineTo(75, -90); g.lineTo(28, -110); g.lineTo(-10, -45); g.lineTo(-42, -108);
    g.closePath();
    g.fill(); g.lineWidth = 10; g.stroke();
    g.restore();

    const hRot = -0.18 + Math.sin(walkPhase * 0.7) * 0.07;
    drawCelHead(g, 505, 455 + bob, 198, 190, hRot, {
      baseColor: '#AEC4B8',
      shadowColor: '#4E577D',
      rimColor: 'rgba(255,70,58,0.68)',
      rimSide: 0,
      inkW,
    });

    g.save();
    g.translate(505, 455 + bob);
    g.rotate(hRot);

    g.save();
    g.translate(22, -182);
    g.rotate(0.24);
    g.fillStyle = '#232F68';
    g.beginPath();
    g.roundRect(-105, -56, 210, 82, 22);
    g.fill();
    g.strokeStyle = INK; g.lineWidth = 14; g.stroke();
    g.fillStyle = '#E6B84C';
    g.beginPath();
    g.moveTo(-44, -14); g.lineTo(44, -14); g.lineTo(28, 4); g.lineTo(-28, 4); g.closePath();
    g.fill();
    g.restore();

    g.fillStyle = INK;
    g.beginPath(); g.arc(-56, -8, 16, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(58, -4, 15, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(4, 72, 26, 36, 0.1, 0, Math.PI * 2); g.fill();
    g.restore();

    texture.needsUpdate = true;
  }

  update();
  return { texture, update };
}

// ============================================================================
// 5. REAR AISLE SILHOUETTE ZOMBIE + DANGLING OXYGEN MASK
// ============================================================================
export function makeRearZombieTexture() {
  const [c, g] = makeCharCanvas(1024, 1536);
  const inkW = 22;

  g.strokeStyle = INK; g.lineWidth = inkW;
  g.beginPath();
  g.moveTo(465, 960); g.lineTo(440, 1410);
  g.moveTo(560, 960); g.lineTo(595, 1410);
  g.moveTo(415, 720); g.quadraticCurveTo(240, 620, 165, 530);
  g.moveTo(610, 720); g.quadraticCurveTo(775, 650, 865, 620);
  g.stroke();
  g.fillStyle = INK;
  g.beginPath(); g.arc(160, 522, 26, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(872, 620, 26, 0, Math.PI * 2); g.fill();

  g.beginPath();
  g.ellipse(512, 800, 128, 190, 0.05, 0, Math.PI * 2);
  g.fillStyle = '#231C3E';
  g.fill();
  g.strokeStyle = '#FF5248'; g.lineWidth = 10; g.stroke();
  g.strokeStyle = INK; g.lineWidth = inkW; g.stroke();

  drawCelHead(g, 512, 450, 195, 188, 0.12, {
    baseColor: '#7C7492',
    shadowColor: '#2B2246',
    rimColor: 'rgba(255,78,64,0.82)',
    rimSide: 0,
    inkW,
  });

  g.fillStyle = '#FFD4CE';
  g.beginPath(); g.arc(462, 444, 13, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(564, 456, 12, 0, Math.PI * 2); g.fill();
  g.fillStyle = INK;
  g.beginPath(); g.ellipse(514, 526, 26, 32, 0, 0, Math.PI * 2); g.fill();
  return toCharTex(c);
}

export function makeOxygenMaskTexture() {
  const [c, g] = makeCharCanvas(512, 1024);

  g.strokeStyle = INK; g.lineWidth = 14;
  g.beginPath();
  g.moveTo(256, 0);
  g.bezierCurveTo(295, 190, 215, 360, 260, 560);
  g.stroke();
  g.strokeStyle = 'rgba(130,148,225,0.45)'; g.lineWidth = 4;
  g.beginPath();
  g.moveTo(260, 0);
  g.bezierCurveTo(299, 190, 219, 360, 264, 560);
  g.stroke();

  g.fillStyle = 'rgba(218,226,255,0.52)';
  g.strokeStyle = INK; g.lineWidth = 12;
  g.beginPath();
  g.moveTo(212, 725);
  g.quadraticCurveTo(170, 880, 256, 945);
  g.quadraticCurveTo(342, 880, 300, 725);
  g.closePath();
  g.fill(); g.stroke();

  const mg = g.createLinearGradient(160, 550, 350, 730);
  mg.addColorStop(0.0, '#F6C84C');
  mg.addColorStop(0.6, '#E2A428');
  mg.addColorStop(1.0, '#A86E1E');
  g.fillStyle = mg;
  g.beginPath();
  g.moveTo(222, 558);
  g.lineTo(294, 558);
  g.quadraticCurveTo(348, 650, 316, 738);
  g.quadraticCurveTo(256, 766, 196, 738);
  g.quadraticCurveTo(164, 650, 222, 558);
  g.closePath();
  g.fill();
  g.strokeStyle = INK; g.lineWidth = 14; g.stroke();

  g.strokeStyle = '#DCE2F8'; g.lineWidth = 7;
  g.beginPath();
  g.moveTo(192, 650);
  g.quadraticCurveTo(118, 695, 164, 775);
  g.quadraticCurveTo(205, 810, 225, 745);
  g.stroke();

  return toCharTex(c);
}
