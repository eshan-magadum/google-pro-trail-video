// Multi-Angle 2.5D Inventor Character Rig (Skill v2.0 Standard)
// Features:
//   - Intricate costume linework (stitched lab coat, burgundy waistcoat, leather belt, pocket pens, brass goggles)
//   - 5 distinct non-repetitive poses: 3/4 lever pull, inside-pod surge, one-knee crouch landing,
//     shocked turn-around, and shimmering cyan-glitch quantum clone!
import * as THREE from 'three';

const INK = '#120E1E';

function makeCanvas(w = 640, h = 960) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.lineCap = 'round'; g.lineJoin = 'round';
  return [c, g];
}

function drawCelHead(g, cx, cy, rx, ry, rot, {
  base = '#F2E0D4', shadow = '#9B8498', rim = 'rgba(255,212,145,0.62)', rimSide = 1, inkW = 13,
} = {}) {
  g.save();
  g.translate(cx, cy);
  g.rotate(rot);
  g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = base; g.fill();
  g.save();
  g.clip();
  const sh = g.createRadialGradient(rimSide * rx * 0.25, -ry * 0.16, rx * 0.32, -rimSide * rx * 0.14, ry * 0.16, rx * 1.15);
  sh.addColorStop(0, 'rgba(90,70,110,0)');
  sh.addColorStop(0.68, 'rgba(85,68,108,0.22)');
  sh.addColorStop(1, shadow);
  g.fillStyle = sh; g.fillRect(-rx * 1.3, -ry * 1.3, rx * 2.6, ry * 2.6);

  const wr = g.createRadialGradient(rimSide * rx * 0.72, -ry * 0.22, rx * 0.06, rimSide * rx * 0.68, -ry * 0.18, rx * 0.8);
  wr.addColorStop(0, rim); wr.addColorStop(1, 'rgba(255,220,175,0)');
  g.fillStyle = wr; g.fillRect(-rx * 1.3, -ry * 1.3, rx * 2.6, ry * 2.6);
  g.restore();

  g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  g.strokeStyle = INK; g.lineWidth = inkW; g.stroke();
  g.restore();
}

export function createInventorRig() {
  const [c, g] = makeCanvas(640, 960);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const inkW = 13;

  function update({
    pose = 'lever_3q',   // 'lever_3q' | 'inside_pod' | 'crouch_land' | 'stand_shock' | 'clone_glitch'
    eyes = 'half_lid',   // 'half_lid' | 'wide_ring' | 'dash_closed' | 'empty_dot'
    mouth = 'smirk',     // 'smirk' | 'awe_open' | 'wavy' | 'shock_o'
    pupilDx = 0,
    pupilDy = 0,
    surge = 0,           // 0..1 hair & coat energy lift!
    headRot = 0,
    warmRim = true,
    glitchAlpha = 0,
    sweat = false,
  } = {}) {
    g.clearRect(0, 0, c.width, c.height);
    const isCrouch = pose === 'crouch_land';
    const is3Q = pose === 'lever_3q';
    const isClone = pose === 'clone_glitch';

    const bodyShiftY = isCrouch ? 125 : 0;
    const bodyTilt = is3Q ? 0.14 : (isCrouch ? 0.18 : 0.0);

    // 1. Stick Legs (dynamic stances — knee-down landing vs leaning forward vs braced!)
    g.strokeStyle = INK; g.lineWidth = inkW;
    if (isCrouch) {
      // Dynamic one-knee superhero landing crouch!
      g.beginPath();
      g.moveTo(275, 695); g.lineTo(185, 765); g.lineTo(175, 882); g.lineTo(125, 886);
      g.moveTo(355, 695); g.lineTo(425, 825); g.lineTo(368, 884); g.lineTo(422, 886);
      g.stroke();
    } else if (is3Q) {
      // Leaning forward at 3/4 stance bracing to throw master switch!
      g.beginPath();
      g.moveTo(275, 615); g.quadraticCurveTo(235, 755, 222, 882); g.lineTo(265, 886);
      g.moveTo(345, 615); g.quadraticCurveTo(395, 755, 425, 882); g.lineTo(472, 886);
      g.stroke();
    } else {
      g.beginPath();
      g.moveTo(286, 615); g.lineTo(270, 880); g.lineTo(228, 886);
      g.moveTo(354, 615); g.lineTo(370, 880); g.lineTo(414, 886);
      g.stroke();
    }

    // 2. Back Arm
    g.strokeStyle = INK; g.lineWidth = inkW;
    if (is3Q) {
      // Extended forward reaching onto the console lever!
      g.beginPath(); g.moveTo(375, 495); g.quadraticCurveTo(475, 480, 545, 435); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(548, 432, 16, 0, Math.PI * 2); g.fill();
    } else if (isCrouch) {
      // Bracing one ball-hand right onto the stone floor!
      g.beginPath(); g.moveTo(370, 610); g.quadraticCurveTo(475, 725, 488, 875); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(488, 878, 17, 0, Math.PI * 2); g.fill();
    } else if (pose === 'inside_pod') {
      g.beginPath(); g.moveTo(250, 495); g.quadraticCurveTo(165, 455 - surge * 45, 138, 395 - surge * 55); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(135, 392 - surge * 55, 16, 0, Math.PI * 2); g.fill();
    } else {
      g.beginPath(); g.moveTo(250, 495); g.quadraticCurveTo(175, 530, 152, 468); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(150, 464, 16, 0, Math.PI * 2); g.fill();
    }

    // 3. Detailed Layered Inventor Torso (Stitched cream lab coat + burgundy waistcoat + leather belt + pens!)
    g.save();
    g.translate(320 + (is3Q ? 18 : 0), 524 + bodyShiftY);
    g.rotate(bodyTilt);
    g.beginPath();
    g.moveTo(-68, -114);
    g.bezierCurveTo(-112, -55, -118 - surge * 18, 75, -72 - surge * 12, 120);
    g.bezierCurveTo(-22, 146, 28, 146, 74 + surge * 12, 118);
    g.bezierCurveTo(118 + surge * 18, 72, 110, -55, 68, -114);
    g.closePath();
    g.fillStyle = isClone ? '#B4DAE8' : '#E7DEC8'; // Stitched canvas lab coat
    g.fill();

    g.save();
    g.clip();
    // Side shadow inside coat
    g.fillStyle = warmRim ? 'rgba(46,28,44,0.28)' : 'rgba(20,30,68,0.34)';
    g.fillRect(-130, -130, 68, 290);
    // Burgundy vintage waistcoat center panel + gold buttons!
    g.fillStyle = isClone ? '#32688C' : '#7E2B38';
    g.fillRect(-34, -120, 68, 250);
    g.strokeStyle = INK; g.lineWidth = 6;
    g.strokeRect(-34, -120, 68, 250);
    // Crisp coat lapels
    g.fillStyle = isClone ? '#CBEAF6' : '#F3EBDC';
    g.beginPath(); g.moveTo(-34, -120); g.lineTo(-62, -45); g.lineTo(-34, -15); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(34, -120); g.lineTo(62, -45); g.lineTo(34, -15); g.closePath(); g.fill(); g.stroke();
    // Gold waistcoat buttons
    g.fillStyle = '#E8B84A';
    for (const by of [-68, -32, 4, 40]) {
      g.beginPath(); g.arc(0, by, 7, 0, Math.PI * 2); g.fill();
      g.lineWidth = 3; g.stroke();
    }
    // Leather tool belt & brass buckle across waist
    g.fillStyle = '#4B2A20';
    g.fillRect(-120, 48, 240, 24);
    g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(-120, 48, 240, 24);
    g.fillStyle = '#E8B84A';
    g.fillRect(-16, 46, 32, 28); g.strokeRect(-16, 46, 32, 28);
    // Breast pocket w/ 2 tiny colored pens & stitched seam!
    g.fillStyle = '#D8CEB8';
    g.fillRect(42, -50, 34, 38); g.strokeRect(42, -50, 34, 38);
    g.fillStyle = '#D83838'; g.fillRect(49, -68, 7, 20);
    g.fillStyle = '#387AD8'; g.fillRect(62, -66, 7, 18);
    // Rim highlight on right edge
    g.fillStyle = warmRim ? 'rgba(255,212,140,0.34)' : 'rgba(130,225,255,0.42)';
    g.fillRect(64, -130, 62, 290);
    g.restore();

    g.strokeStyle = INK; g.lineWidth = inkW; g.stroke();
    g.restore();

    // 4. Front Arm
    g.strokeStyle = INK; g.lineWidth = inkW;
    if (is3Q) {
      g.beginPath(); g.moveTo(275, 500); g.quadraticCurveTo(385, 520, 522, 458); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(525, 456, 16, 0, Math.PI * 2); g.fill();
    } else if (isCrouch) {
      g.beginPath(); g.moveTo(260, 610); g.quadraticCurveTo(185, 650, 242, 712); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(245, 715, 16, 0, Math.PI * 2); g.fill();
    } else if (pose === 'inside_pod') {
      g.beginPath(); g.moveTo(390, 495); g.quadraticCurveTo(475, 455 - surge * 45, 502, 395 - surge * 55); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(505, 392 - surge * 55, 16, 0, Math.PI * 2); g.fill();
    } else {
      g.beginPath(); g.moveTo(390, 495); g.quadraticCurveTo(465, 535, 492, 478); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(495, 475, 16, 0, Math.PI * 2); g.fill();
    }

    // 5. Oversized Round Cel Head (3/4 shifted during lever pull!)
    const hx = 320 + (is3Q ? 34 : 0);
    const hy = 294 + bodyShiftY;
    drawCelHead(g, hx, hy, 128, 122, headRot + (is3Q ? 0.08 : 0), {
      base: isClone ? '#CBEAF6' : '#F3E1D4',
      shadow: isClone ? '#4E7FA8' : (warmRim ? '#9E8292' : '#6A76A6'),
      rim: isClone ? 'rgba(135,245,255,0.75)' : (warmRim ? 'rgba(255,216,148,0.62)' : 'rgba(145,228,255,0.65)'),
      rimSide: 1,
      inkW,
    });

    g.save();
    g.translate(hx, hy);
    g.rotate(headRot + (is3Q ? 0.08 : 0));

    // Tousled Inventor Chestnut-Orange Hair (lifts dramatically during quantum surge!)
    const lift = surge * 26;
    g.fillStyle = isClone ? '#427A9C' : '#B84C24';
    g.beginPath();
    g.moveTo(-124, -28);
    g.quadraticCurveTo(-148, -112 - lift * 0.5, -82, -132 - lift);
    g.lineTo(-98, -168 - lift * 1.2);
    g.lineTo(-34, -142 - lift * 0.8);
    g.lineTo(-8, -184 - lift * 1.3);
    g.lineTo(36, -140 - lift * 0.8);
    g.lineTo(86, -172 - lift * 1.15);
    g.lineTo(94, -124 - lift * 0.7);
    g.quadraticCurveTo(140, -104 - lift * 0.4, 124, -26);
    g.quadraticCurveTo(52, -72, 0, -68);
    g.quadraticCurveTo(-60, -72, -124, -28);
    g.closePath();
    g.fill();
    g.strokeStyle = INK; g.lineWidth = 11; g.stroke();

    // Iconic Brass Aviator Goggles perched on forehead!
    g.fillStyle = '#4B2B20';
    g.fillRect(-124, -76, 248, 18);
    g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(-124, -76, 248, 18);
    for (const gx of [-42, 42]) {
      g.fillStyle = '#D4A042';
      g.beginPath(); g.arc(gx, -68, 34, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = isClone ? '#9CF4FF' : '#78D6E8';
      g.beginPath(); g.arc(gx, -68, 22, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.65)';
      g.beginPath(); g.arc(gx - 7, -75, 7, 0, Math.PI * 2); g.fill();
    }

    // Face features shifted right during 3/4 view for authentic dimensional turn!
    const fx = is3Q ? 26 : 0;
    if (eyes === 'half_lid') {
      for (const ex of [-36 + fx, 40 + fx]) {
        g.fillStyle = '#FFFFFF';
        g.beginPath(); g.arc(ex, 0, 24, 0, Math.PI * 2); g.fill();
        g.strokeStyle = INK; g.lineWidth = 7; g.stroke();
        g.fillStyle = INK;
        g.beginPath(); g.arc(ex + pupilDx, 2 + pupilDy, 7.5, 0, Math.PI * 2); g.fill();
        g.fillStyle = isClone ? '#CBEAF6' : '#F3E1D4';
        g.fillRect(ex - 26, -26, 52, 18);
        g.beginPath(); g.moveTo(ex - 25, -8); g.lineTo(ex + 25, -8); g.stroke();
      }
    } else if (eyes === 'empty_dot') {
      g.fillStyle = INK;
      g.beginPath(); g.arc(-36 + fx, 0, 12, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(40 + fx, 0, 12, 0, Math.PI * 2); g.fill();
    } else {
      for (const ex of [-38 + fx, 40 + fx]) {
        g.fillStyle = '#FFFFFF';
        g.beginPath(); g.arc(ex, -2, 27, 0, Math.PI * 2); g.fill();
        g.strokeStyle = INK; g.lineWidth = 8; g.stroke();
        g.fillStyle = INK;
        g.beginPath(); g.arc(ex + pupilDx, -2 + pupilDy, 7.5, 0, Math.PI * 2); g.fill();
      }
      // Expressive shocked brows
      g.strokeStyle = INK; g.lineWidth = 8;
      g.beginPath();
      g.moveTo(-64 + fx, -34); g.quadraticCurveTo(-38 + fx, -48, -14 + fx, -34);
      g.moveTo(16 + fx, -34); g.quadraticCurveTo(40 + fx, -48, 66 + fx, -34);
      g.stroke();
    }

    // Mouth
    g.strokeStyle = INK; g.lineWidth = 8;
    if (mouth === 'smirk') {
      g.beginPath(); g.moveTo(-20 + fx, 50); g.quadraticCurveTo(10 + fx, 62, 34 + fx, 40); g.stroke();
    } else if (mouth === 'awe_open') {
      g.fillStyle = '#1E1024';
      g.beginPath(); g.ellipse(fx, 56, 26, 22, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    } else if (mouth === 'shock_o') {
      g.fillStyle = '#1E1024';
      g.beginPath(); g.ellipse(fx, 58, 18, 28, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    } else {
      g.beginPath();
      g.moveTo(-28 + fx, 54); g.quadraticCurveTo(-14 + fx, 42, fx, 54); g.quadraticCurveTo(14 + fx, 66, 28 + fx, 54);
      g.stroke();
    }

    if (sweat) {
      g.fillStyle = '#82DCFF'; g.strokeStyle = INK; g.lineWidth = 5;
      g.beginPath();
      g.moveTo(-98, -22); g.quadraticCurveTo(-78, 10, -98, 22); g.quadraticCurveTo(-118, 10, -98, -22);
      g.closePath(); g.fill(); g.stroke();
    }
    g.restore();

    // Quantum hologram scanlines if clone_glitch!
    if (isClone || glitchAlpha > 0.05) {
      g.save();
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = `rgba(110,240,255,${(0.28 + glitchAlpha * 0.25).toFixed(3)})`;
      for (let y = 0; y < 960; y += 16) {
        g.fillRect(0, y, 640, 5);
      }
      g.restore();
    }

    texture.needsUpdate = true;
  }

  update();
  return { texture, update };
}
