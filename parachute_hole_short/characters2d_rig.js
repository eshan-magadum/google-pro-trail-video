// Parametric Animated 2D Cel Character Rigs for 'The Parachute With a Hole Cut in the Middle'.
// Strictly obeys Every_Memory_Has_a_Price_25D_Code_Skill.zip (06_Characters_Acting_and_Rig_Spec.md):
//   - Oversized round head, thick #120E1E ink outline, bean torso, stick limbs, round ball-hands (ZERO fingers)
//   - Flat cel fills + soft lavender/indigo shadow crescent + directional warm/cold rim
//   - Full emotion state machine: half_lid, wide_ring, dash_closed, squeezed_x, purpleFlush, comic steam, sweat drops
import * as THREE from 'three';

const INK = '#120E1E';

function makeCharCanvas(w = 640, h = 960) {
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
  t = Math.max(0, Math.min(1, t));
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const r = Math.round(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t);
  const g = Math.round(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t);
  const bl = Math.round((a & 255) + ((b & 255) - (a & 255)) * t);
  return `rgb(${r},${g},${bl})`;
}

function drawCelHead(g, cx, cy, rx, ry, rot = 0, {
  baseColor = '#F0DFD6',
  shadowColor = '#A492C2',
  rimColor = 'rgba(255,218,158,0.55)',
  rimSide = 1,
  inkW = 13,
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
  sh.addColorStop(0.0, 'rgba(120,112,180,0)');
  sh.addColorStop(0.66, 'rgba(112,102,175,0.22)');
  sh.addColorStop(1.0, shadowColor);
  g.fillStyle = sh;
  g.fillRect(-rx * 1.25, -ry * 1.25, rx * 2.5, ry * 2.5);

  const wr = g.createRadialGradient(
    rimSide * rx * 0.72, -ry * 0.25, rx * 0.05,
    rimSide * rx * 0.68, -ry * 0.20, rx * 0.78
  );
  wr.addColorStop(0.0, rimColor);
  wr.addColorStop(1.0, 'rgba(255,220,175,0)');
  g.fillStyle = wr;
  g.fillRect(-rx * 1.25, -ry * 1.25, rx * 2.5, ry * 2.5);
  g.restore();

  g.beginPath();
  g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  g.strokeStyle = INK;
  g.lineWidth = inkW;
  g.stroke();
  g.restore();
}

// ============================================================================
// 1. HERO ENGINEER RIG (Spiky orange hair, mustard flight jacket, frog badge!)
// ============================================================================
export function createHeroRig() {
  const [c, g] = makeCharCanvas(640, 960);
  const texture = toCharTex(c);
  const inkW = 13;

  function update({
    pose = 'stand',      // 'cut' | 'hold_circle' | 'pack' | 'freefall' | 'harness' | 'victory'
    eyes = 'half_lid',   // 'half_lid' | 'dash_closed' | 'wide_ring' | 'ring'
    mouth = 'focused',   // 'focused' | 'smirk' | 'calm_grin'
    headRot = 0.0,
    pupilDx = 0,
    pupilDy = 0,
    breath = 0,
    armAnim = 0,
    warmRim = true,
  } = {}) {
    g.clearRect(0, 0, c.width, c.height);
    const by = breath * 6;

    // Stick legs
    g.strokeStyle = INK;
    g.lineWidth = inkW;
    if (pose === 'freefall') {
      g.beginPath();
      g.moveTo(285, 610); g.quadraticCurveTo(230, 740, 210, 845);
      g.moveTo(355, 610); g.quadraticCurveTo(415, 735, 445, 835);
      g.stroke();
    } else if (pose === 'harness') {
      g.beginPath();
      g.moveTo(288, 615 + by); g.quadraticCurveTo(270, 745, 282, 875); g.lineTo(245, 882);
      g.moveTo(352, 615 + by); g.quadraticCurveTo(372, 745, 360, 875); g.lineTo(398, 882);
      g.stroke();
    } else {
      g.beginPath();
      g.moveTo(286, 615 + by * 0.4); g.lineTo(272, 878); g.lineTo(232, 885);
      g.moveTo(354, 615 + by * 0.4); g.lineTo(368, 878); g.lineTo(410, 885);
      g.stroke();
    }

    // Back / Left arm
    g.strokeStyle = INK; g.lineWidth = inkW;
    if (pose === 'cut') {
      g.beginPath(); g.moveTo(250, 495 + by); g.quadraticCurveTo(175, 535, 196, 608); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(196, 612, 16, 0, Math.PI * 2); g.fill();
    } else if (pose === 'hold_circle') {
      g.beginPath(); g.moveTo(250, 495 + by); g.quadraticCurveTo(160, 500, 142, 415); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(140, 410, 16, 0, Math.PI * 2); g.fill();
      // Holding the sliced dinner-plate white silk circle up calmly!
      g.fillStyle = '#F8F2E8';
      g.beginPath(); g.arc(118, 355, 58, 0, Math.PI * 2); g.fill();
      g.strokeStyle = INK; g.lineWidth = 8; g.stroke();
    } else if (pose === 'harness') {
      // Both arms holding parachute risers cleanly up!
      g.beginPath(); g.moveTo(250, 490 + by); g.quadraticCurveTo(185, 440, 210, 325); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(210, 320, 16, 0, Math.PI * 2); g.fill();
    } else if (pose === 'victory') {
      // Confident hands-on-hips!
      g.beginPath(); g.moveTo(252, 495 + by); g.quadraticCurveTo(165, 545, 240, 585); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(244, 585, 15, 0, Math.PI * 2); g.fill();
    } else if (pose === 'freefall') {
      g.beginPath(); g.moveTo(250, 490); g.quadraticCurveTo(150, 430, 110, 350); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(106, 345, 16, 0, Math.PI * 2); g.fill();
    } else {
      g.beginPath(); g.moveTo(250, 495 + by); g.quadraticCurveTo(180, 555, 205, 620); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(206, 624, 15, 0, Math.PI * 2); g.fill();
    }

    // Bean torso (Mustard flight jacket + white center stripe + green frog badge + harness straps)
    g.save();
    g.translate(320, 522 + by);
    g.beginPath();
    g.moveTo(-66, -112);
    g.bezierCurveTo(-105, -58, -108, 68, -62, 112);
    g.bezierCurveTo(-20, 140, 30, 140, 66, 110);
    g.bezierCurveTo(110, 66, 104, -58, 65, -112);
    g.closePath();
    g.fillStyle = '#E0A230';
    g.fill();

    g.save();
    g.clip();
    g.fillStyle = 'rgba(26,20,66,0.28)';
    g.fillRect(-118, -125, 66, 275);
    g.fillStyle = '#ECE6DC';
    g.fillRect(-23, -122, 46, 265);
    g.strokeStyle = INK; g.lineWidth = 6;
    g.strokeRect(-23, -122, 46, 265);
    // Green frog chest patch
    g.fillStyle = '#4BAE50';
    g.beginPath(); g.arc(0, -40, 18, 0, Math.PI * 2); g.fill();
    g.lineWidth = 5; g.stroke();
    // Parachute harness straps when airborne/packing
    if (pose === 'harness' || pose === 'freefall' || pose === 'pack' || pose === 'victory') {
      g.fillStyle = '#2B3058';
      g.fillRect(-56, -120, 18, 250);
      g.fillRect(38, -120, 18, 250);
      g.fillRect(-66, -12, 132, 18);
      g.strokeStyle = INK; g.lineWidth = 4;
      g.strokeRect(-66, -12, 132, 18);
    }
    g.fillStyle = warmRim ? 'rgba(255,222,165,0.34)' : 'rgba(135,185,255,0.34)';
    g.fillRect(58, -122, 52, 265);
    g.restore();

    g.strokeStyle = INK; g.lineWidth = inkW; g.stroke();
    g.restore();

    // Front / Right arm
    g.strokeStyle = INK; g.lineWidth = inkW;
    if (pose === 'cut') {
      const sx = 468 + Math.sin(armAnim * 4) * 18;
      const sy = 578 + Math.cos(armAnim * 4) * 14;
      g.beginPath(); g.moveTo(390, 495 + by); g.quadraticCurveTo(458, 525, sx, sy); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(sx, sy, 16, 0, Math.PI * 2); g.fill();
      // Gleaming silver shears in ball-hand!
      g.save();
      g.translate(sx + 10, sy - 6);
      g.rotate(0.45 + Math.sin(armAnim * 12) * 0.14);
      g.fillStyle = '#DCE4F8'; g.strokeStyle = INK; g.lineWidth = 6;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(72, -16); g.lineTo(14, 12); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(0, 0); g.lineTo(70, 22); g.lineTo(12, -8); g.closePath(); g.fill(); g.stroke();
      g.restore();
    } else if (pose === 'harness') {
      g.beginPath(); g.moveTo(390, 490 + by); g.quadraticCurveTo(455, 440, 430, 325); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(430, 320, 16, 0, Math.PI * 2); g.fill();
    } else if (pose === 'victory') {
      g.beginPath(); g.moveTo(388, 495 + by); g.quadraticCurveTo(475, 545, 400, 585); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(396, 585, 15, 0, Math.PI * 2); g.fill();
    } else if (pose === 'freefall') {
      g.beginPath(); g.moveTo(390, 490); g.quadraticCurveTo(490, 430, 530, 350); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(534, 345, 16, 0, Math.PI * 2); g.fill();
    } else {
      g.beginPath(); g.moveTo(390, 495 + by); g.quadraticCurveTo(465, 545, 440, 618); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(438, 622, 15, 0, Math.PI * 2); g.fill();
    }

    // Oversized Round Cel Head
    const hx = 320, hy = 298 + by * 1.1;
    drawCelHead(g, hx, hy, 128, 122, headRot, {
      baseColor: '#EFE0D8',
      shadowColor: '#9E8AB8',
      rimColor: warmRim ? 'rgba(255,218,158,0.58)' : 'rgba(135,190,255,0.55)',
      rimSide: 1,
      inkW,
    });

    g.save();
    g.translate(hx, hy);
    g.rotate(headRot);

    // Signature spiky orange hair w/ dark zig-zag interior shading
    g.beginPath();
    g.moveTo(-124, -28);
    g.quadraticCurveTo(-146, -112, -78, -128);
    g.lineTo(-96, -162);
    g.lineTo(-34, -138);
    g.lineTo(-10, -178);
    g.lineTo(30, -136);
    g.lineTo(80, -168);
    g.lineTo(90, -122);
    g.quadraticCurveTo(138, -104, 124, -28);
    g.quadraticCurveTo(54, -68, 0, -64);
    g.quadraticCurveTo(-60, -70, -124, -28);
    g.closePath();
    g.fillStyle = '#D85A26';
    g.fill();
    g.strokeStyle = INK; g.lineWidth = inkW * 0.88; g.stroke();

    g.strokeStyle = '#862E14'; g.lineWidth = 6;
    g.beginPath();
    g.moveTo(-78, -84); g.lineTo(-52, -115); g.lineTo(-26, -84);
    g.lineTo(6, -124); g.lineTo(36, -86); g.lineTo(70, -115);
    g.stroke();

    // Eyes
    if (eyes === 'half_lid') {
      for (const ex of [-36, 40]) {
        g.fillStyle = '#FFFFFF';
        g.beginPath(); g.arc(ex, -4, 24, 0, Math.PI * 2); g.fill();
        g.strokeStyle = INK; g.lineWidth = 7; g.stroke();
        g.fillStyle = INK;
        g.beginPath(); g.arc(ex + pupilDx, -2 + pupilDy, 7.5, 0, Math.PI * 2); g.fill();
        // Cool confident horizontal half-lid cutting top of eye!
        g.fillStyle = '#EFE0D8';
        g.fillRect(ex - 27, -30, 54, 19);
        g.strokeStyle = INK; g.lineWidth = 7;
        g.beginPath(); g.moveTo(ex - 26, -11); g.lineTo(ex + 26, -11); g.stroke();
      }
    } else if (eyes === 'dash_closed') {
      g.strokeStyle = INK; g.lineWidth = 8;
      g.beginPath();
      g.moveTo(-58, -4); g.quadraticCurveTo(-36, -16, -14, -4);
      g.moveTo(18, -4); g.quadraticCurveTo(40, -16, 62, -4);
      g.stroke();
    } else {
      for (const ex of [-36, 40]) {
        g.fillStyle = '#FFFFFF';
        g.beginPath(); g.arc(ex, -6, 25, 0, Math.PI * 2); g.fill();
        g.strokeStyle = INK; g.lineWidth = 7; g.stroke();
        g.fillStyle = INK;
        g.beginPath(); g.arc(ex + pupilDx, -6 + pupilDy, 7.5, 0, Math.PI * 2); g.fill();
      }
    }

    // Mouth
    g.strokeStyle = INK; g.lineWidth = 7;
    if (mouth === 'focused') {
      g.beginPath(); g.moveTo(-20, 48); g.lineTo(24, 46); g.stroke();
    } else if (mouth === 'smirk') {
      g.beginPath(); g.moveTo(-18, 48); g.quadraticCurveTo(10, 56, 30, 38); g.stroke();
    } else {
      g.beginPath(); g.moveTo(-30, 42); g.quadraticCurveTo(2, 68, 34, 42); g.stroke();
    }
    g.restore();

    texture.needsUpdate = true;
  }

  update();
  return { texture, update };
}

// ============================================================================
// 2. COMMANDER RIG (Peaked cap, gold epaulettes, LIVE PURPLE FACE FLUSH + STEAM!)
// ============================================================================
export function createCommanderRig() {
  const [c, g] = makeCharCanvas(640, 960);
  const texture = toCharTex(c);
  const inkW = 13;

  function update({
    pose = 'inspect',    // 'inspect' | 'yell' | 'shock'
    purpleFlush = 0.0,   // 0 = normal peach -> 1 = vibrant comic ANGRY PURPLE!
    steamPhase = 0.0,
    shoutOpen = 0.0,     // 0..1 shouting jaw oscillation
    headRot = 0.0,
  } = {}) {
    g.clearRect(0, 0, c.width, c.height);

    // Legs
    g.strokeStyle = INK; g.lineWidth = inkW;
    g.beginPath();
    g.moveTo(280, 625); g.lineTo(266, 882); g.lineTo(222, 888);
    g.moveTo(360, 625); g.lineTo(374, 882); g.lineTo(420, 888);
    g.stroke();

    // Left arm
    if (pose === 'yell') {
      // Jabbing finger/ball-hand aggressively toward the Hero/umbrella!
      const j = Math.sin(steamPhase * 12) * 14;
      g.beginPath(); g.moveTo(232, 488); g.quadraticCurveTo(125, 455, 86 + j, 512 - j); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(82 + j, 514 - j, 18, 0, Math.PI * 2); g.fill();
    } else if (pose === 'shock') {
      // Clutching head/hat in disbelief!
      g.beginPath(); g.moveTo(232, 495); g.quadraticCurveTo(148, 420, 198, 245); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(200, 240, 17, 0, Math.PI * 2); g.fill();
    } else {
      g.beginPath(); g.moveTo(234, 495); g.quadraticCurveTo(160, 545, 224, 595); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(228, 595, 16, 0, Math.PI * 2); g.fill();
    }

    // Broad dark-olive military coat torso w/ gold epaulettes & medals
    g.save();
    g.translate(320, 526);
    g.beginPath();
    g.moveTo(-82, -118);
    g.bezierCurveTo(-124, -55, -124, 72, -74, 118);
    g.bezierCurveTo(-24, 146, 30, 146, 78, 116);
    g.bezierCurveTo(126, 70, 122, -55, 82, -118);
    g.closePath();
    g.fillStyle = '#2B3A4C';
    g.fill();

    g.save();
    g.clip();
    g.fillStyle = 'rgba(14,16,44,0.34)';
    g.fillRect(-130, -130, 74, 290);
    // Tie + gold uniform buttons
    g.fillStyle = '#D9D3C8';
    g.beginPath(); g.moveTo(-26, -120); g.lineTo(0, -45); g.lineTo(26, -120); g.closePath(); g.fill();
    g.fillStyle = '#8F2432';
    g.beginPath(); g.moveTo(-9, -108); g.lineTo(9, -108); g.lineTo(14, -18); g.lineTo(0, 4); g.lineTo(-14, -18); g.closePath(); g.fill();
    g.fillStyle = '#E8B848';
    g.fillRect(-72, -118, 42, 22);
    g.fillRect(30, -118, 42, 22);
    // Ribbon medals
    g.fillStyle = '#E04444'; g.fillRect(28, -56, 36, 12);
    g.fillStyle = '#F2C14E'; g.fillRect(28, -42, 36, 10);
    g.restore();

    g.strokeStyle = INK; g.lineWidth = inkW; g.stroke();
    g.restore();

    // Right arm
    if (pose === 'yell') {
      g.beginPath(); g.moveTo(408, 492); g.quadraticCurveTo(500, 450, 524, 378); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(526, 372, 18, 0, Math.PI * 2); g.fill();
    } else if (pose === 'shock') {
      g.beginPath(); g.moveTo(408, 495); g.quadraticCurveTo(492, 420, 442, 245); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(440, 240, 17, 0, Math.PI * 2); g.fill();
    } else {
      g.beginPath(); g.moveTo(406, 495); g.quadraticCurveTo(480, 545, 416, 595); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(412, 595, 16, 0, Math.PI * 2); g.fill();
    }

    // Comic white steam puffs shooting from ears when purpleFlush > 0.55!
    if (purpleFlush > 0.55) {
      const sp = (steamPhase * 2.2) % 1;
      const a = Math.min(1, (purpleFlush - 0.55) * 2.4) * (1 - sp * 0.7);
      g.save();
      g.globalAlpha = a;
      g.fillStyle = '#F2EDFF';
      g.strokeStyle = INK; g.lineWidth = 6;
      for (const side of [-1, 1]) {
        const px = 320 + side * (155 + sp * 68);
        const py = 270 - sp * 52;
        g.beginPath(); g.arc(px, py, 20 + sp * 14, 0, Math.PI * 2); g.fill(); g.stroke();
        g.beginPath(); g.arc(px + side * 24, py - 24, 14 + sp * 10, 0, Math.PI * 2); g.fill(); g.stroke();
      }
      g.restore();
    }

    // Head — LIVE PURPLE FLUSH MORPH (#EED8CE -> #A458E6)!
    const hx = 320, hy = 290;
    const faceBase = mixHex('#EED8CE', '#A65AE8', purpleFlush);
    const faceShadow = mixHex('#9E8AB8', '#52228A', purpleFlush);
    drawCelHead(g, hx, hy, 134, 128, headRot, {
      baseColor: faceBase,
      shadowColor: faceShadow,
      rimColor: purpleFlush > 0.4 ? 'rgba(235,145,255,0.62)' : 'rgba(255,214,154,0.52)',
      rimSide: -1,
      inkW,
    });

    g.save();
    g.translate(hx, hy);
    g.rotate(headRot);

    // Peaked Military Visor Cap
    g.fillStyle = '#25324A';
    g.beginPath();
    g.moveTo(-132, -52);
    g.quadraticCurveTo(-120, -162, 0, -168);
    g.quadraticCurveTo(120, -162, 132, -52);
    g.closePath();
    g.fill();
    g.strokeStyle = INK; g.lineWidth = 12; g.stroke();
    // Dark shiny visor brim
    g.fillStyle = '#14172E';
    g.beginPath(); g.ellipse(0, -52, 138, 22, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    // Gold emblem on cap
    g.fillStyle = '#F2C14E';
    g.beginPath(); g.arc(0, -108, 19, 0, Math.PI * 2); g.fill();
    g.lineWidth = 5; g.stroke();

    // Eyes & furious brows / shock wide eyes
    if (pose === 'shock') {
      for (const ex of [-44, 44]) {
        g.fillStyle = '#FFFFFF';
        g.beginPath(); g.arc(ex, -2, 31, 0, Math.PI * 2); g.fill();
        g.strokeStyle = INK; g.lineWidth = 8; g.stroke();
        g.fillStyle = INK;
        g.beginPath(); g.arc(ex, -2, 7, 0, Math.PI * 2); g.fill();
      }
      g.lineWidth = 9;
      g.beginPath();
      g.moveTo(-74, -44); g.quadraticCurveTo(-44, -62, -16, -44);
      g.moveTo(16, -44); g.quadraticCurveTo(44, -62, 74, -44);
      g.stroke();
    } else {
      for (const ex of [-42, 42]) {
        g.fillStyle = '#FFFFFF';
        g.beginPath(); g.arc(ex, -4, 24, 0, Math.PI * 2); g.fill();
        g.strokeStyle = INK; g.lineWidth = 8; g.stroke();
        g.fillStyle = INK;
        g.beginPath(); g.arc(ex - 4, -2, 7.5, 0, Math.PI * 2); g.fill();
      }
      // Steep furious V-brows!
      const angerDrop = 16 + purpleFlush * 18;
      g.strokeStyle = INK; g.lineWidth = 11;
      g.beginPath();
      g.moveTo(-76, -34); g.lineTo(-14, -34 + angerDrop);
      g.moveTo(76, -34); g.lineTo(14, -34 + angerDrop);
      g.stroke();
    }

    // Comic anger vein pop on temple when purpleFlush > 0.45!
    if (purpleFlush > 0.45) {
      g.strokeStyle = '#FF3852'; g.lineWidth = 6;
      g.beginPath();
      g.moveTo(76, -34); g.quadraticCurveTo(86, -24, 76, -14);
      g.moveTo(96, -34); g.quadraticCurveTo(86, -24, 96, -14);
      g.stroke();
    }

    // Bristling handlebar mustache
    g.fillStyle = '#3B3654';
    g.beginPath();
    g.moveTo(0, 32);
    g.quadraticCurveTo(-48, 22, -74, 52);
    g.quadraticCurveTo(-36, 56, 0, 44);
    g.quadraticCurveTo(36, 56, 74, 52);
    g.quadraticCurveTo(48, 22, 0, 32);
    g.closePath();
    g.fill(); g.strokeStyle = INK; g.lineWidth = 7; g.stroke();

    // Mouth (shouting wide / jaw-dropped shock / stern frown)
    if (pose === 'yell' || shoutOpen > 0.15) {
      const mh = 22 + shoutOpen * 30;
      g.fillStyle = '#1E0D26';
      g.beginPath(); g.ellipse(0, 68, 42, mh, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = INK; g.lineWidth = 8; g.stroke();
      g.fillStyle = '#FAF5EE';
      g.fillRect(-26, 68 - mh + 3, 52, 11);
    } else if (pose === 'shock') {
      g.fillStyle = '#1E0D26';
      g.beginPath(); g.ellipse(0, 74, 24, 34, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = INK; g.lineWidth = 8; g.stroke();
    }

    g.restore();
    texture.needsUpdate = true;
  }

  update();
  return { texture, update };
}

// ============================================================================
// 3. RIVAL JUMPER RIG (Blue flight suit — smug, laughing crew, or mid-air PANIC!)
// ============================================================================
export function createRivalRig(variant = 0) {
  const [c, g] = makeCharCanvas(640, 960);
  const texture = toCharTex(c);
  const inkW = 13;
  const hairColors = ['#2A2546', '#664334', '#3D4862'];
  const hairCol = hairColors[variant % hairColors.length];

  function update({
    pose = 'laugh',      // 'briefing' | 'laugh' | 'smug_harness' | 'panic_harness'
    anim = 0,
    sweat = false,
    headRot = 0,
  } = {}) {
    g.clearRect(0, 0, c.width, c.height);
    const bounce = pose === 'laugh' ? Math.abs(Math.sin(anim * 10 + variant * 1.4)) * 22 : 0;
    const flail = pose === 'panic_harness' ? Math.sin(anim * 18 + variant * 2.1) : 0;

    // Legs
    g.strokeStyle = INK; g.lineWidth = inkW;
    if (pose === 'panic_harness') {
      g.beginPath();
      g.moveTo(286, 615); g.quadraticCurveTo(235 + flail * 45, 745, 255 + flail * 70, 868);
      g.moveTo(354, 615); g.quadraticCurveTo(405 - flail * 45, 745, 385 - flail * 70, 868);
      g.stroke();
    } else {
      g.beginPath();
      g.moveTo(286, 615 - bounce * 0.4); g.lineTo(272, 878); g.lineTo(232, 885);
      g.moveTo(354, 615 - bounce * 0.4); g.lineTo(368, 878); g.lineTo(410, 885);
      g.stroke();
    }

    // Arms
    g.strokeStyle = INK; g.lineWidth = inkW;
    if (pose === 'laugh') {
      // Pointing & slapping knee laughing!
      g.beginPath();
      g.moveTo(250, 495 - bounce); g.quadraticCurveTo(155, 470 - bounce, 112, 425 - bounce);
      g.moveTo(390, 495 - bounce); g.quadraticCurveTo(455, 565 - bounce, 392, 615 - bounce);
      g.stroke();
      g.fillStyle = INK;
      g.beginPath(); g.arc(108, 422 - bounce, 16, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(390, 618 - bounce, 16, 0, Math.PI * 2); g.fill();
    } else if (pose === 'panic_harness') {
      // Flailing wildly in mid-air!
      g.beginPath();
      g.moveTo(250, 495); g.quadraticCurveTo(140, 420 + flail * 65, 108, 330 + flail * 85);
      g.moveTo(390, 495); g.quadraticCurveTo(500, 420 - flail * 65, 532, 330 - flail * 85);
      g.stroke();
      g.fillStyle = INK;
      g.beginPath(); g.arc(104, 326 + flail * 85, 16, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(536, 326 - flail * 85, 16, 0, Math.PI * 2); g.fill();
    } else {
      // Smug arms-crossed / steady risers
      g.beginPath();
      g.moveTo(250, 495); g.quadraticCurveTo(190, 525, 295, 532);
      g.moveTo(390, 495); g.quadraticCurveTo(450, 525, 345, 532);
      g.stroke();
    }

    // Blue rival flight suit bean torso
    g.save();
    g.translate(320, 522 - bounce);
    g.beginPath();
    g.moveTo(-66, -112);
    g.bezierCurveTo(-105, -58, -108, 68, -62, 112);
    g.bezierCurveTo(-20, 140, 30, 140, 66, 110);
    g.bezierCurveTo(110, 66, 104, -58, 65, -112);
    g.closePath();
    g.fillStyle = '#3B62C4';
    g.fill();

    g.save();
    g.clip();
    g.fillStyle = 'rgba(14,18,56,0.32)';
    g.fillRect(-118, -125, 66, 275);
    g.fillStyle = '#DCE4F8';
    g.fillRect(-12, -122, 24, 265);
    g.fillStyle = '#252B54';
    g.fillRect(-54, -120, 16, 250);
    g.fillRect(38, -120, 16, 250);
    g.restore();

    g.strokeStyle = INK; g.lineWidth = inkW; g.stroke();
    g.restore();

    // Head
    const hx = 320, hy = 298 - bounce * 1.15;
    drawCelHead(g, hx, hy, 126, 120, headRot + (pose === 'laugh' ? -0.14 : 0), {
      baseColor: '#EEDFD6',
      shadowColor: '#8E84B8',
      rimColor: pose === 'panic_harness' ? 'rgba(135,190,255,0.58)' : 'rgba(255,218,158,0.52)',
      rimSide: 1,
      inkW,
    });

    g.save();
    g.translate(hx, hy);
    g.rotate(headRot + (pose === 'laugh' ? -0.14 : 0));

    // Hair / Aviator Goggles Cap
    g.fillStyle = hairCol;
    g.beginPath();
    g.arc(0, -34, 124, Math.PI * 1.05, Math.PI * 1.95);
    g.closePath();
    g.fill();
    g.strokeStyle = INK; g.lineWidth = 11; g.stroke();

    // Eyes & Mouth per emotional state
    if (pose === 'laugh') {
      // Squeezed-X / pinched laughing arcs!
      g.strokeStyle = INK; g.lineWidth = 9;
      g.beginPath();
      g.moveTo(-62, -16); g.lineTo(-26, -2); g.lineTo(-62, 12);
      g.moveTo(62, -16); g.lineTo(26, -2); g.lineTo(62, 12);
      g.stroke();
      // Wide laughing mouth
      g.fillStyle = '#1E1028';
      g.beginPath();
      g.moveTo(-48, 38); g.lineTo(48, 38); g.quadraticCurveTo(38, 92, 0, 92); g.quadraticCurveTo(-38, 92, -48, 38);
      g.closePath(); g.fill(); g.stroke();
    } else if (pose === 'panic_harness') {
      // Wide alarmed double-ring eyes + tiny panic pupils!
      for (const ex of [-40, 40]) {
        g.fillStyle = '#FFFFFF';
        g.beginPath(); g.arc(ex, -8, 28, 0, Math.PI * 2); g.fill();
        g.strokeStyle = INK; g.lineWidth = 8; g.stroke();
        g.fillStyle = INK;
        g.beginPath(); g.arc(ex + flail * 6, -6, 6.5, 0, Math.PI * 2); g.fill();
      }
      // Screaming 'O' mouth
      g.fillStyle = '#1C0E26';
      g.beginPath(); g.ellipse(0, 62, 26, 36, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = INK; g.lineWidth = 8; g.stroke();
    } else {
      // Smug half-lid eyes + cocky smirk
      for (const ex of [-38, 38]) {
        g.fillStyle = '#FFFFFF';
        g.beginPath(); g.arc(ex, -4, 23, 0, Math.PI * 2); g.fill();
        g.strokeStyle = INK; g.lineWidth = 7; g.stroke();
        g.fillStyle = INK;
        g.beginPath(); g.arc(ex, -2, 7, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#EEDFD6'; g.fillRect(ex - 25, -29, 50, 18);
        g.beginPath(); g.moveTo(ex - 24, -11); g.lineTo(ex + 24, -11); g.stroke();
      }
      g.strokeStyle = INK; g.lineWidth = 8;
      g.beginPath(); g.moveTo(-22, 46); g.quadraticCurveTo(10, 58, 34, 36); g.stroke();
    }

    // Flying cyan sweat drop during mid-air panic!
    if (sweat) {
      g.fillStyle = '#82D4FF'; g.strokeStyle = INK; g.lineWidth = 5;
      g.beginPath();
      g.moveTo(96, -42); g.quadraticCurveTo(116, -10, 96, 2); g.quadraticCurveTo(76, -10, 96, -42);
      g.closePath(); g.fill(); g.stroke();
    }
    g.restore();

    texture.needsUpdate = true;
  }

  update();
  return { texture, update };
}
