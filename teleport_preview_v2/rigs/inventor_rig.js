// Multi-Angle 2.5D Inventor Character Rig (Skill v3.0 Tactile Painterly Standard)
// Features:
//   - Woven linen/cotton cloth grain, drapery folds, lapel & belt cast shadows, stitched hems
//   - Multi-layered hand-inked hair locks (root shadows + internal ink strands + copper highlight curves!)
//   - Multi-stop spherical cel+airbrush head shading + subtle organic paper tooth
//   - 5 distinct non-repetitive poses: 3/4 lever pull, inside-pod surge, crouch landing, shock, quantum clone!
import * as THREE from 'three';
import { applyClothWeaveAndFolds, drawLayeredHairLocks, mulberry32 } from '../worlds/pbr_materials.js';

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
  // Rich multi-stop spherical cel+airbrush volume shading (exact EMHAP head shading!)
  const sh = g.createRadialGradient(rimSide * rx * 0.28, -ry * 0.18, rx * 0.25, -rimSide * rx * 0.18, ry * 0.18, rx * 1.18);
  sh.addColorStop(0, 'rgba(90,70,110,0)');
  sh.addColorStop(0.58, 'rgba(85,68,108,0.16)');
  sh.addColorStop(0.84, 'rgba(72,56,96,0.44)');
  sh.addColorStop(1, shadow);
  g.fillStyle = sh; g.fillRect(-rx * 1.3, -ry * 1.3, rx * 2.6, ry * 2.6);

  // Bright warm/cool directional rim crescent
  const wr = g.createRadialGradient(rimSide * rx * 0.72, -ry * 0.22, rx * 0.06, rimSide * rx * 0.68, -ry * 0.18, rx * 0.85);
  wr.addColorStop(0, rim); wr.addColorStop(1, 'rgba(255,220,175,0)');
  g.fillStyle = wr; g.fillRect(-rx * 1.3, -ry * 1.3, rx * 2.6, ry * 2.6);

  // Subtle hand-painted watercolor / paper tooth texture across face!
  const rng = mulberry32(4141);
  for (let i = 0; i < 240; i++) {
    const px = (rng() - 0.5) * rx * 2.1, py = (rng() - 0.5) * ry * 2.1;
    g.fillStyle = rng() < 0.5 ? 'rgba(255,248,236,0.065)' : 'rgba(42,28,52,0.055)';
    g.fillRect(px, py, 3, 3);
  }
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
      g.beginPath();
      g.moveTo(275, 695); g.lineTo(185, 765); g.lineTo(175, 882); g.lineTo(125, 886);
      g.moveTo(355, 695); g.lineTo(425, 825); g.lineTo(368, 884); g.lineTo(422, 886);
      g.stroke();
    } else if (is3Q) {
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
      g.beginPath(); g.moveTo(375, 495); g.quadraticCurveTo(475, 480, 545, 435); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(548, 432, 16, 0, Math.PI * 2); g.fill();
    } else if (isCrouch) {
      g.beginPath(); g.moveTo(370, 610); g.quadraticCurveTo(475, 725, 488, 875); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(488, 878, 17, 0, Math.PI * 2); g.fill();
    } else if (pose === 'inside_pod') {
      g.beginPath(); g.moveTo(250, 495); g.quadraticCurveTo(165, 455 - surge * 45, 138, 395 - surge * 55); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(135, 392 - surge * 55, 16, 0, Math.PI * 2); g.fill();
    } else {
      g.beginPath(); g.moveTo(250, 495); g.quadraticCurveTo(175, 530, 152, 468); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(150, 464, 16, 0, Math.PI * 2); g.fill();
    }

    // 3. TACTILE WOVEN & FOLDED INVENTOR TORSO (Skill v3.0: cloth weave + drapery folds + cast shadows + stitched seams!)
    g.save();
    g.translate(320 + (is3Q ? 18 : 0), 524 + bodyShiftY);
    g.rotate(bodyTilt);
    g.beginPath();
    g.moveTo(-68, -114);
    g.bezierCurveTo(-112, -55, -118 - surge * 18, 75, -72 - surge * 12, 120);
    g.bezierCurveTo(-22, 146, 28, 146, 74 + surge * 12, 118);
    g.bezierCurveTo(118 + surge * 18, 72, 110, -55, 68, -114);
    g.closePath();
    // Base lab coat gradient (warm weathered canvas, NOT flat beige!)
    const coatGrad = g.createLinearGradient(-115, -100, 115, 110);
    coatGrad.addColorStop(0, isClone ? '#78B4CC' : '#C8BCA2');
    coatGrad.addColorStop(0.45, isClone ? '#B4DAE8' : '#EAE0C9');
    coatGrad.addColorStop(1, isClone ? '#D8F6FF' : '#F6EEE0');
    g.fillStyle = coatGrad;
    g.fill();

    g.save();
    g.clip();
    // Tactile woven linen fabric grain + organic coat drapery folds!
    applyClothWeaveAndFolds(g, -130, -130, 260, 290, { weaveAlpha: 0.085, foldCount: 4, seed: 808 });

    // Deep cylindrical shadow gradient along left flank + bottom hem shadow
    const sideSh = g.createLinearGradient(-125, 0, -25, 0);
    sideSh.addColorStop(0, warmRim ? 'rgba(38,22,38,0.44)' : 'rgba(18,28,64,0.48)');
    sideSh.addColorStop(1, 'rgba(38,22,38,0)');
    g.fillStyle = sideSh;
    g.fillRect(-130, -130, 110, 290);

    // Textured burgundy vintage waistcoat center panel + subtle weave & stitched trim!
    const vestGrad = g.createLinearGradient(-34, -120, 34, 130);
    vestGrad.addColorStop(0, isClone ? '#245274' : '#5E1B26');
    vestGrad.addColorStop(0.55, isClone ? '#366E94' : '#8A2E3D');
    vestGrad.addColorStop(1, isClone ? '#4E8FB6' : '#A43D4C');
    g.fillStyle = vestGrad;
    g.fillRect(-36, -120, 72, 250);
    applyClothWeaveAndFolds(g, -36, -120, 72, 250, { weaveAlpha: 0.11, foldCount: 2, seed: 819 });
    // Decorative embroidered vertical gold piping & stitched hem along waistcoat!
    g.strokeStyle = isClone ? '#8CE8FF' : '#D8A24A'; g.lineWidth = 3;
    g.setLineDash([7, 5]);
    g.strokeRect(-29, -114, 58, 236);
    g.setLineDash([]);
    g.strokeStyle = INK; g.lineWidth = 6;
    g.strokeRect(-36, -120, 72, 250);

    // Cast shadow underneath coat lapels + crisp folded lapels
    g.fillStyle = 'rgba(20,12,26,0.34)';
    g.beginPath(); g.moveTo(-36, -114); g.lineTo(-70, -40); g.lineTo(-36, -6); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(36, -114); g.lineTo(70, -40); g.lineTo(36, -6); g.closePath(); g.fill();

    g.fillStyle = isClone ? '#CBEAF6' : '#F4ECE0';
    g.strokeStyle = INK; g.lineWidth = 5.5;
    g.beginPath(); g.moveTo(-36, -120); g.lineTo(-65, -45); g.lineTo(-36, -14); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(36, -120); g.lineTo(65, -45); g.lineTo(36, -14); g.closePath(); g.fill(); g.stroke();

    // Brushed gold waistcoat buttons with tiny cast shadows & specular glints
    for (const by of [-68, -32, 4, 40]) {
      g.fillStyle = 'rgba(18,10,20,0.45)';
      g.beginPath(); g.arc(2, by + 3, 7.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#E6B244';
      g.beginPath(); g.arc(0, by, 7.2, 0, Math.PI * 2); g.fill();
      g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
      g.fillStyle = 'rgba(255,250,225,0.75)';
      g.beginPath(); g.arc(-2, by - 2, 2.3, 0, Math.PI * 2); g.fill();
    }

    // Cast shadow directly beneath leather tool belt + distressed leather belt w/ stitched edges & brass buckle!
    g.fillStyle = 'rgba(18,10,22,0.42)';
    g.fillRect(-120, 70, 240, 12);
    const beltGrad = g.createLinearGradient(0, 48, 0, 72);
    beltGrad.addColorStop(0, '#6A3B28'); beltGrad.addColorStop(0.5, '#4A271B'); beltGrad.addColorStop(1, '#311810');
    g.fillStyle = beltGrad;
    g.fillRect(-120, 48, 240, 24);
    g.strokeStyle = '#9C6C48'; g.lineWidth = 2; g.setLineDash([6, 4]);
    g.beginPath(); g.moveTo(-115, 53); g.lineTo(115, 53); g.moveTo(-115, 67); g.lineTo(115, 67); g.stroke();
    g.setLineDash([]);
    g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(-120, 48, 240, 24);
    // Brushed brass belt buckle
    g.fillStyle = '#E8B648';
    g.fillRect(-17, 45, 34, 30); g.strokeRect(-17, 45, 34, 30);
    g.fillStyle = '#4A271B'; g.fillRect(-7, 52, 14, 16);

    // Stitched breast pocket w/ shadow & 2 detailed pens
    g.fillStyle = 'rgba(20,14,26,0.28)'; g.fillRect(45, -46, 34, 38);
    g.fillStyle = '#DFD5BE'; g.fillRect(42, -50, 34, 38); g.strokeRect(42, -50, 34, 38);
    g.fillStyle = '#D83838'; g.fillRect(49, -68, 7, 20); g.strokeRect(49, -68, 7, 20);
    g.fillStyle = '#387AD8'; g.fillRect(62, -66, 7, 18); g.strokeRect(62, -66, 7, 18);

    // Directional rim highlight on right coat edge
    g.fillStyle = warmRim ? 'rgba(255,212,140,0.36)' : 'rgba(130,225,255,0.44)';
    g.fillRect(68, -130, 58, 290);
    // Neck shadow cast by oversized round head!
    const neckSh = g.createRadialGradient(0, -112, 10, 0, -104, 72);
    neckSh.addColorStop(0, 'rgba(18,12,26,0.52)'); neckSh.addColorStop(1, 'rgba(18,12,26,0)');
    g.fillStyle = neckSh; g.fillRect(-85, -130, 170, 90);
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

    // 5. Oversized Round Cel Head (Multi-stop shading + paper tooth!)
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

    // MULTI-LAYERED HAND-INKED HAIR LOCKS (Exact Every Memory close-up hair DNA!)
    const lift = surge * 26;
    drawLayeredHairLocks(g, {
      baseColor: isClone ? '#3E7A9E' : '#BC4E24',
      shadowColor: isClone ? '#1E4664' : '#682412',
      highlightColor: isClone ? '#7CD8F8' : '#E88844',
      inkColor: INK,
      lift,
    });

    // Iconic Brushed-Brass Aviator Goggles w/ leather strap shadow & curved glass reflection!
    g.fillStyle = 'rgba(20,12,24,0.34)';
    g.fillRect(-124, -66, 248, 14);
    g.fillStyle = '#4E2C1E';
    g.fillRect(-124, -76, 248, 18);
    g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(-124, -76, 248, 18);
    for (const gx of [-42, 42]) {
      const brassG = g.createLinearGradient(gx - 32, -100, gx + 32, -36);
      brassG.addColorStop(0, '#F0C668'); brassG.addColorStop(0.5, '#C89238'); brassG.addColorStop(1, '#7C501A');
      g.fillStyle = brassG;
      g.beginPath(); g.arc(gx, -68, 34, 0, Math.PI * 2); g.fill(); g.stroke();
      const lensG = g.createRadialGradient(gx - 6, -74, 3, gx, -68, 24);
      lensG.addColorStop(0, isClone ? '#E0FEFF' : '#BEF2FF');
      lensG.addColorStop(0.65, isClone ? '#68CCE6' : '#58B6D0');
      lensG.addColorStop(1, '#265A74');
      g.fillStyle = lensG;
      g.beginPath(); g.arc(gx, -68, 22, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.72)'; g.lineWidth = 4;
      g.beginPath(); g.arc(gx, -68, 15, -Math.PI * 0.85, -Math.PI * 0.35); g.stroke();
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
