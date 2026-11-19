// Painterly Multi-Angle 2.5D Heist Characters (Skill v3.0 Tactile Standard)
// 1. Master Thief: Woven charcoal trenchcoat, striped burglar shirt, leather harness, knitted ribbed ski-beanie,
//    layered inked hair tufts, brushed-brass night-vision goggles, canvas loot bag, gold bar, 4 dynamic poses!
// 2. Night Security Guard: Woven navy uniform, gold star badge, black tie, peaked officer cap, layered mustache,
//    heavy leather utility belt, glowing yellow flashlight & half-eaten pink sprinkled donut!
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

function drawPainterlyHead(g, cx, cy, rx, ry, rot, {
  base = '#F2E0D2', shadow = '#8A768C', rim = 'rgba(255,212,140,0.58)', rimSide = 1, inkW = 13, seed = 5151,
} = {}) {
  g.save();
  g.translate(cx, cy);
  g.rotate(rot);
  g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = base; g.fill();
  g.save();
  g.clip();
  const sh = g.createRadialGradient(rimSide * rx * 0.28, -ry * 0.18, rx * 0.24, -rimSide * rx * 0.18, ry * 0.18, rx * 1.18);
  sh.addColorStop(0, 'rgba(90,70,110,0)');
  sh.addColorStop(0.58, 'rgba(80,64,104,0.16)');
  sh.addColorStop(0.84, 'rgba(66,52,92,0.44)');
  sh.addColorStop(1, shadow);
  g.fillStyle = sh; g.fillRect(-rx * 1.3, -ry * 1.3, rx * 2.6, ry * 2.6);

  const wr = g.createRadialGradient(rimSide * rx * 0.72, -ry * 0.22, rx * 0.06, rimSide * rx * 0.68, -ry * 0.18, rx * 0.85);
  wr.addColorStop(0, rim); wr.addColorStop(1, 'rgba(255,220,175,0)');
  g.fillStyle = wr; g.fillRect(-rx * 1.3, -ry * 1.3, rx * 2.6, ry * 2.6);

  // Subtle paper/watercolor tooth grain across skin
  const rng = mulberry32(seed);
  for (let i = 0; i < 240; i++) {
    const px = (rng() - 0.5) * rx * 2.1, py = (rng() - 0.5) * ry * 2.1;
    g.fillStyle = rng() < 0.5 ? 'rgba(255,248,236,0.065)' : 'rgba(38,26,48,0.055)';
    g.fillRect(px, py, 3, 3);
  }
  g.restore();

  g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  g.strokeStyle = INK; g.lineWidth = inkW; g.stroke();
  g.restore();
}

function drawGoldBarProp(g, x, y, rot = -0.22) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  const gr = g.createLinearGradient(-44, -22, 44, 22);
  gr.addColorStop(0, '#FFF09E'); gr.addColorStop(0.45, '#E4AD38'); gr.addColorStop(1, '#9A6416');
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(-42, 16); g.lineTo(-32, -16); g.lineTo(32, -16); g.lineTo(42, 16); g.closePath();
  g.fill();
  g.strokeStyle = INK; g.lineWidth = 7; g.stroke();
  g.strokeStyle = 'rgba(255,250,220,0.75)'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(-26, -8); g.lineTo(26, -8); g.stroke();
  g.restore();
}

// =============================================================================
// 1. MASTER HEIST THIEF RIG
// =============================================================================
export function createThiefRig() {
  const [c, g] = makeCanvas(640, 960);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const inkW = 13;

  function update({
    pose = 'stealth_crouch', // 'stealth_crouch' | 'dial_crack' | 'loot_grin' | 'busted_shock'
    eyes = 'focused',        // 'focused' | 'smirk_half' | 'wide_ring'
    mouth = 'smirk',         // 'smirk' | 'grin' | 'concentrate' | 'shock_o'
    pupilDx = 6,
    pupilDy = 0,
    headRot = 0,
    warmRim = true,
    sweat = false,
    dropOffset = 0,          // Gold bar dropping mid-air during busted_shock!
  } = {}) {
    g.clearRect(0, 0, c.width, c.height);
    const isCrouch = pose === 'stealth_crouch';
    const isDial = pose === 'dial_crack';
    const isLoot = pose === 'loot_grin';
    const isBusted = pose === 'busted_shock';

    const bodyShiftY = isCrouch ? 132 : 0;
    const bodyTilt = isCrouch ? 0.24 : (isDial ? 0.14 : (isBusted ? -0.06 : 0.0));

    // Optional stitched canvas LOOT SACK slung over Thief's back!
    if (isCrouch || isLoot) {
      g.save();
      g.translate(isCrouch ? 215 : 205, (isCrouch ? 585 : 535));
      g.rotate(isCrouch ? -0.35 : -0.18);
      const sackG = g.createLinearGradient(-55, -70, 55, 70);
      sackG.addColorStop(0, '#CBB896'); sackG.addColorStop(1, '#7D6A4C');
      g.fillStyle = sackG;
      g.beginPath(); g.ellipse(0, 0, 62, 78, 0, 0, Math.PI * 2); g.fill();
      g.save(); g.clip();
      applyClothWeaveAndFolds(g, -65, -80, 130, 160, { weaveAlpha: 0.12, foldCount: 3, seed: 511 });
      g.restore();
      g.strokeStyle = INK; g.lineWidth = 10; g.stroke();
      g.fillStyle = '#2B221E'; g.font = '900 54px Georgia, serif'; g.textAlign = 'center';
      g.fillText('$', 0, 20);
      g.restore();
    }

    // 1. Dynamic Rubber-Hose Stick Legs
    g.strokeStyle = INK; g.lineWidth = inkW;
    if (isCrouch) {
      // Agile low stealth limbo crouch beneath lasers!
      g.beginPath();
      g.moveTo(285, 700); g.lineTo(190, 770); g.lineTo(175, 882); g.lineTo(128, 886);
      g.moveTo(355, 700); g.lineTo(430, 775); g.lineTo(445, 882); g.lineTo(492, 886);
      g.stroke();
    } else if (isDial) {
      g.beginPath();
      g.moveTo(280, 615); g.quadraticCurveTo(245, 750, 232, 882); g.lineTo(275, 886);
      g.moveTo(352, 615); g.quadraticCurveTo(395, 750, 422, 882); g.lineTo(468, 886);
      g.stroke();
    } else {
      g.beginPath();
      g.moveTo(286, 615); g.lineTo(268, 880); g.lineTo(222, 886);
      g.moveTo(354, 615); g.lineTo(372, 880); g.lineTo(418, 886);
      g.stroke();
    }

    // 2. Back Arm
    g.strokeStyle = INK; g.lineWidth = inkW;
    if (isCrouch) {
      g.beginPath(); g.moveTo(370, 615); g.quadraticCurveTo(468, 635, 515, 578); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(518, 575, 16, 0, Math.PI * 2); g.fill();
    } else if (isDial) {
      g.beginPath(); g.moveTo(375, 495); g.quadraticCurveTo(475, 480, 548, 430); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(552, 426, 16, 0, Math.PI * 2); g.fill();
    } else if (isBusted) {
      // Both arms thrown straight up in surrender/panic!
      g.beginPath(); g.moveTo(255, 495); g.quadraticCurveTo(155, 445, 148, 345); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(148, 340, 16, 0, Math.PI * 2); g.fill();
    } else {
      g.beginPath(); g.moveTo(255, 495); g.quadraticCurveTo(175, 455, 158, 395); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(156, 390, 16, 0, Math.PI * 2); g.fill();
    }

    // 3. TACTILE WOVEN CHARCOAL HEIST TRENCHCOAT + STRIPED SHIRT + LEATHER HARNESS!
    g.save();
    g.translate(320 + (isCrouch || isDial ? 20 : 0), 524 + bodyShiftY);
    g.rotate(bodyTilt);
    g.beginPath();
    g.moveTo(-68, -114);
    g.bezierCurveTo(-114, -55, -118, 76, -72, 122);
    g.bezierCurveTo(-22, 148, 28, 148, 74, 120);
    g.bezierCurveTo(118, 74, 112, -55, 68, -114);
    g.closePath();

    const coatG = g.createLinearGradient(-115, -100, 115, 110);
    coatG.addColorStop(0, '#222432');
    coatG.addColorStop(0.5, '#34384A');
    coatG.addColorStop(1, '#4C5268');
    g.fillStyle = coatG; g.fill();

    g.save();
    g.clip();
    // Woven heavy twill fabric grain & coat folds!
    applyClothWeaveAndFolds(g, -130, -130, 260, 290, { weaveAlpha: 0.14, foldCount: 4, seed: 521 });

    // Classic horizontal striped knit burglar turtleneck visible inside coat V-opening!
    g.fillStyle = '#E5DCCB';
    g.fillRect(-34, -120, 68, 240);
    g.fillStyle = '#1E1D28';
    for (let sy = -112; sy < 120; sy += 22) {
      g.fillRect(-34, sy, 68, 10);
    }
    applyClothWeaveAndFolds(g, -34, -120, 68, 240, { weaveAlpha: 0.09, foldCount: 2, seed: 522 });
    g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(-34, -120, 68, 240);

    // Trenchcoat collar lapels w/ cast shadow underneath
    g.fillStyle = 'rgba(10,8,18,0.45)';
    g.beginPath(); g.moveTo(-34, -112); g.lineTo(-74, -36); g.lineTo(-34, 4); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(34, -112); g.lineTo(74, -36); g.lineTo(34, 4); g.closePath(); g.fill();

    g.fillStyle = '#3C4054'; g.strokeStyle = INK; g.lineWidth = 5.5;
    g.beginPath(); g.moveTo(-34, -120); g.lineTo(-68, -42); g.lineTo(-34, -8); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(34, -120); g.lineTo(68, -42); g.lineTo(34, -8); g.closePath(); g.fill(); g.stroke();

    // Diagonal leather utility shoulder strap + stitched brass-buckled heist belt!
    g.strokeStyle = '#5C3422'; g.lineWidth = 18;
    g.beginPath(); g.moveTo(-66, -114); g.lineTo(84, 58); g.stroke();
    g.strokeStyle = INK; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-74, -110); g.lineTo(76, 62); g.moveTo(-58, -118); g.lineTo(92, 54); g.stroke();

    // Belt cast shadow + stitched leather utility belt w/ pouches & brass buckle
    g.fillStyle = 'rgba(10,8,18,0.52)'; g.fillRect(-120, 72, 240, 12);
    const beltG = g.createLinearGradient(0, 48, 0, 74);
    beltG.addColorStop(0, '#6E3E2A'); beltG.addColorStop(1, '#361B12');
    g.fillStyle = beltG; g.fillRect(-120, 48, 240, 26);
    g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(-120, 48, 240, 26);
    g.fillStyle = '#E6B446'; g.fillRect(-17, 45, 34, 32); g.strokeRect(-17, 45, 34, 32);
    g.fillStyle = '#361B12'; g.fillRect(-7, 53, 14, 16);
    // Side utility pouch on belt
    g.fillStyle = '#522E20'; g.fillRect(42, 42, 34, 38); g.strokeRect(42, 42, 34, 38);

    // Warm golden or crimson rim light on right flank + neck cast shadow
    g.fillStyle = warmRim ? 'rgba(255,208,118,0.34)' : 'rgba(255,78,68,0.36)';
    g.fillRect(68, -130, 58, 290);
    const neckSh = g.createRadialGradient(0, -112, 10, 0, -104, 72);
    neckSh.addColorStop(0, 'rgba(12,8,20,0.58)'); neckSh.addColorStop(1, 'rgba(12,8,20,0)');
    g.fillStyle = neckSh; g.fillRect(-85, -130, 170, 90);
    g.restore();

    g.strokeStyle = INK; g.lineWidth = inkW; g.stroke();
    g.restore();

    // 4. Front Arm (+ Gleaming Gold Bar held in hand or tumbling mid-air!)
    g.strokeStyle = INK; g.lineWidth = inkW;
    if (isCrouch) {
      g.beginPath(); g.moveTo(275, 610); g.quadraticCurveTo(205, 660, 232, 725); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(235, 728, 16, 0, Math.PI * 2); g.fill();
    } else if (isDial) {
      g.beginPath(); g.moveTo(278, 502); g.quadraticCurveTo(385, 522, 520, 458); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(524, 455, 16, 0, Math.PI * 2); g.fill();
    } else if (isLoot) {
      g.beginPath(); g.moveTo(390, 495); g.quadraticCurveTo(475, 455, 505, 388); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(508, 384, 16, 0, Math.PI * 2); g.fill();
      drawGoldBarProp(g, 514, 366, -0.22);
    } else {
      // Surrender panic + tumbling dropped gold bar!
      g.beginPath(); g.moveTo(390, 495); g.quadraticCurveTo(478, 442, 492, 345); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(492, 340, 16, 0, Math.PI * 2); g.fill();
      drawGoldBarProp(g, 515, 440 + dropOffset * 120, 0.35 + dropOffset * 0.9);
    }

    // 5. Oversized Painterly Cel Head + Domino Bandit Mask + Knitted Ribbed Beanie + Layered Hair + NV Goggles!
    const hx = 320 + (isCrouch || isDial ? 36 : 0);
    const hy = 294 + bodyShiftY;
    drawPainterlyHead(g, hx, hy, 128, 122, headRot + (isCrouch ? 0.12 : 0), {
      base: '#F2E0D2',
      shadow: warmRim ? '#967B88' : '#7B6488',
      rim: warmRim ? 'rgba(255,212,135,0.62)' : 'rgba(255,105,95,0.58)',
      rimSide: 1,
      inkW,
      seed: 5301,
    });

    g.save();
    g.translate(hx, hy);
    g.rotate(headRot + (isCrouch ? 0.12 : 0));

    // Classic textured charcoal domino eye-mask band across eyes!
    const fx = isCrouch || isDial ? 24 : 0;
    g.fillStyle = '#1E1D2A';
    g.beginPath();
    g.roundRect(-108 + fx * 0.4, -36, 216, 66, 30);
    g.fill();
    g.strokeStyle = INK; g.lineWidth = 6; g.stroke();

    // Layered chestnut hair tufts peeking crisply under the knitted burglar beanie!
    drawLayeredHairLocks(g, {
      baseColor: '#8A3E24',
      shadowColor: '#481C10',
      highlightColor: '#C46C3C',
      inkColor: INK,
      lift: -10,
    });

    // Knitted ribbed dark charcoal burglar beanie cap perched snugly over hair!
    const capG = g.createLinearGradient(-120, -165, 110, -55);
    capG.addColorStop(0, '#1D1E2B'); capG.addColorStop(0.55, '#303244'); capG.addColorStop(1, '#44485E');
    g.fillStyle = capG;
    g.beginPath();
    g.moveTo(-124, -56);
    g.bezierCurveTo(-132, -162, -55, -192, 0, -192);
    g.bezierCurveTo(62, -192, 134, -158, 124, -56);
    g.quadraticCurveTo(0, -76, -124, -56);
    g.closePath();
    g.fill();
    g.save(); g.clip();
    // Vertical ribbed knit texture lines across beanie!
    g.strokeStyle = 'rgba(14,12,22,0.45)'; g.lineWidth = 4;
    for (let rx = -112; rx <= 112; rx += 16) {
      g.beginPath(); g.moveTo(rx, -195); g.quadraticCurveTo(rx * 0.9, -120, rx, -45); g.stroke();
    }
    // Folded ribbed cuff rim
    g.fillStyle = '#252736'; g.fillRect(-130, -90, 260, 40);
    for (let rx = -114; rx <= 114; rx += 12) {
      g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(rx, -90); g.lineTo(rx, -48); g.stroke();
    }
    g.restore();
    g.strokeStyle = INK; g.lineWidth = 10; g.stroke();

    // Brushed-Brass Night-Vision Emerald Goggles resting on beanie cuff!
    for (const gx of [-40, 40]) {
      const brassG = g.createLinearGradient(gx - 28, -110, gx + 28, -55);
      brassG.addColorStop(0, '#E8BE62'); brassG.addColorStop(1, '#6C4618');
      g.fillStyle = brassG;
      g.beginPath(); g.arc(gx, -84, 30, 0, Math.PI * 2); g.fill();
      g.strokeStyle = INK; g.lineWidth = 6; g.stroke();
      const nvG = g.createRadialGradient(gx - 5, -90, 2, gx, -84, 20);
      nvG.addColorStop(0, '#B2FFB8'); nvG.addColorStop(0.65, '#34B858'); nvG.addColorStop(1, '#124A24');
      g.fillStyle = nvG;
      g.beginPath(); g.arc(gx, -84, 19, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 3.5;
      g.beginPath(); g.arc(gx, -84, 13, -Math.PI * 0.85, -Math.PI * 0.35); g.stroke();
    }

    // Expressive Eyes over domino mask
    if (eyes === 'wide_ring') {
      for (const ex of [-38 + fx, 40 + fx]) {
        g.fillStyle = '#FFFFFF';
        g.beginPath(); g.arc(ex, -2, 26, 0, Math.PI * 2); g.fill();
        g.strokeStyle = INK; g.lineWidth = 7; g.stroke();
        g.fillStyle = INK;
        g.beginPath(); g.arc(ex + pupilDx, -2 + pupilDy, 7.5, 0, Math.PI * 2); g.fill();
      }
    } else {
      for (const ex of [-36 + fx, 40 + fx]) {
        g.fillStyle = '#FFFFFF';
        g.beginPath(); g.arc(ex, 0, 23, 0, Math.PI * 2); g.fill();
        g.strokeStyle = INK; g.lineWidth = 7; g.stroke();
        g.fillStyle = INK;
        g.beginPath(); g.arc(ex + pupilDx, 2 + pupilDy, 7, 0, Math.PI * 2); g.fill();
        // Confident sly eyelids
        g.fillStyle = '#1E1D2A';
        g.fillRect(ex - 25, -25, 50, 16);
        g.beginPath(); g.moveTo(ex - 24, -9); g.lineTo(ex + 24, -9); g.stroke();
      }
    }

    // Mouth
    g.strokeStyle = INK; g.lineWidth = 8;
    if (mouth === 'grin') {
      g.fillStyle = '#FFFFFF';
      g.beginPath(); g.moveTo(-36 + fx, 44); g.quadraticCurveTo(fx, 86, 40 + fx, 44); g.closePath(); g.fill(); g.stroke();
    } else if (mouth === 'shock_o') {
      g.fillStyle = '#1C1022';
      g.beginPath(); g.ellipse(fx, 62, 20, 28, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    } else if (mouth === 'concentrate') {
      g.beginPath(); g.moveTo(-22 + fx, 56); g.lineTo(24 + fx, 52); g.stroke();
    } else {
      g.beginPath(); g.moveTo(-22 + fx, 52); g.quadraticCurveTo(10 + fx, 66, 36 + fx, 42); g.stroke();
    }

    if (sweat) {
      g.fillStyle = '#88E0FF'; g.strokeStyle = INK; g.lineWidth = 5;
      g.beginPath();
      g.moveTo(-98, -14); g.quadraticCurveTo(-78, 18, -98, 30); g.quadraticCurveTo(-118, 18, -98, -14);
      g.closePath(); g.fill(); g.stroke();
    }
    g.restore();

    texture.needsUpdate = true;
  }

  update();
  return { texture, update };
}

// =============================================================================
// 2. DEADPAN DONUT-EATING NIGHT SECURITY GUARD RIG (THE VIRAL TWIST!)
// =============================================================================
export function createGuardRig() {
  const [c, g] = makeCanvas(640, 960);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const inkW = 13;

  function update({ blink = false, headRot = -0.04, pupilDx = -8 } = {}) {
    g.clearRect(0, 0, c.width, c.height);

    // 1. Sturdy Guard Legs
    g.strokeStyle = INK; g.lineWidth = inkW;
    g.beginPath();
    g.moveTo(284, 615); g.lineTo(274, 880); g.lineTo(226, 886);
    g.moveTo(356, 615); g.lineTo(366, 880); g.lineTo(414, 886);
    g.stroke();

    // 2. Left Arm (holding Glowing Heavy-Duty Yellow Flashlight pointed left at Thief!)
    g.beginPath(); g.moveTo(246, 505); g.quadraticCurveTo(155, 525, 118, 495); g.stroke();
    // 3D-shaded flashlight body
    g.save();
    g.translate(106, 490);
    g.rotate(-0.14);
    const flG = g.createLinearGradient(0, -18, 0, 18);
    flG.addColorStop(0, '#FFE068'); flG.addColorStop(0.5, '#D49E28'); flG.addColorStop(1, '#785010');
    g.fillStyle = flG;
    g.fillRect(-36, -15, 72, 30);
    g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(-36, -15, 72, 30);
    g.fillStyle = '#FFFCE0';
    g.fillRect(-48, -20, 16, 40); g.strokeRect(-48, -20, 16, 40);
    g.restore();
    g.fillStyle = INK; g.beginPath(); g.arc(118, 495, 16, 0, Math.PI * 2); g.fill();

    // 3. Tactile Woven Navy Security Guard Uniform Torso (Gold Star Badge, Tie, Utility Belt, Walkie-Talkie!)
    g.save();
    g.translate(320, 524);
    g.beginPath();
    g.moveTo(-72, -114);
    g.bezierCurveTo(-124, -55, -126, 76, -78, 122);
    g.bezierCurveTo(-24, 150, 28, 150, 78, 120);
    g.bezierCurveTo(126, 74, 122, -55, 72, -114);
    g.closePath();

    const uniG = g.createLinearGradient(-120, -100, 120, 110);
    uniG.addColorStop(0, '#1B2D4E'); uniG.addColorStop(0.5, '#2A4574'); uniG.addColorStop(1, '#3D5E96');
    g.fillStyle = uniG; g.fill();

    g.save();
    g.clip();
    applyClothWeaveAndFolds(g, -135, -130, 270, 290, { weaveAlpha: 0.11, foldCount: 4, seed: 622 });

    // Shirt collar + dark navy tie
    g.fillStyle = '#20365C'; g.strokeStyle = INK; g.lineWidth = 5;
    g.beginPath(); g.moveTo(-42, -120); g.lineTo(-14, -68); g.lineTo(0, -90); g.lineTo(14, -68); g.lineTo(42, -120); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#151824';
    g.beginPath(); g.moveTo(-10, -86); g.lineTo(10, -86); g.lineTo(16, 44); g.lineTo(0, 62); g.lineTo(-16, 44); g.closePath(); g.fill(); g.stroke();

    // Stitched breast pockets + shiny GOLD STAR SECURITY BADGE!
    g.fillStyle = '#243C66'; g.lineWidth = 4;
    g.fillRect(-74, -44, 42, 42); g.strokeRect(-74, -44, 42, 42);
    g.fillRect(32, -44, 42, 42); g.strokeRect(32, -44, 42, 42);
    // Gold shield badge on left chest (viewer right!)
    g.fillStyle = '#F2C248';
    g.beginPath();
    g.moveTo(52, -76); g.lineTo(72, -68); g.lineTo(68, -42); g.lineTo(52, -32); g.lineTo(36, -42); g.lineTo(32, -68); g.closePath();
    g.fill(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke();

    // Heavy black leather duty belt + cast shadow + brass buckle
    g.fillStyle = 'rgba(10,8,18,0.48)'; g.fillRect(-130, 74, 260, 12);
    g.fillStyle = '#221C1E'; g.fillRect(-130, 48, 260, 26);
    g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(-130, 48, 260, 26);
    g.fillStyle = '#E6B646'; g.fillRect(-18, 46, 36, 30); g.strokeRect(-18, 46, 36, 30);

    // Warm/red alarm rim highlight & neck cast shadow
    g.fillStyle = 'rgba(255,198,118,0.32)'; g.fillRect(-130, -130, 54, 290);
    const neckSh = g.createRadialGradient(0, -112, 10, 0, -104, 76);
    neckSh.addColorStop(0, 'rgba(12,8,20,0.52)'); neckSh.addColorStop(1, 'rgba(12,8,20,0)');
    g.fillStyle = neckSh; g.fillRect(-85, -130, 170, 90);
    g.restore();

    g.strokeStyle = INK; g.lineWidth = inkW; g.stroke();
    g.restore();

    // 4. Right Arm holding HALF-EATEN PINK SPRINKLED DONUT!
    g.strokeStyle = INK; g.lineWidth = inkW;
    g.beginPath(); g.moveTo(394, 500); g.quadraticCurveTo(482, 522, 498, 442); g.stroke();
    // Iconic Pink-Frosted Sprinkled Donut!
    g.save();
    g.translate(506, 422);
    g.rotate(0.18);
    g.fillStyle = '#D69A58'; // Fried dough ring
    g.beginPath(); g.arc(0, 0, 38, 0.35, Math.PI * 1.92); g.lineTo(0, 0); g.closePath(); g.fill();
    g.strokeStyle = INK; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#F682B4'; // Pink strawberry glaze
    g.beginPath(); g.arc(0, 0, 31, 0.42, Math.PI * 1.85); g.lineTo(0, 0); g.closePath(); g.fill();
    g.fillStyle = '#1E2438'; // Donut hole
    g.beginPath(); g.arc(0, 0, 12, 0, Math.PI * 2); g.fill();
    g.strokeStyle = INK; g.lineWidth = 4; g.stroke();
    // Colorful sprinkles!
    for (const [sx, sy, col] of [[-18, -12, '#FFF275'], [-6, -22, '#6CE8FF'], [14, -18, '#FFFFFF'], [-20, 8, '#88FF88'], [8, 18, '#FFF275']]) {
      g.fillStyle = col; g.fillRect(sx, sy, 8, 4);
    }
    g.restore();
    g.fillStyle = INK; g.beginPath(); g.arc(498, 442, 16, 0, Math.PI * 2); g.fill();

    // 5. Guard Head + Thick Walrus Mustache + Peaked Officer Cap w/ Gold Emblem!
    const hx = 320, hy = 292;
    drawPainterlyHead(g, hx, hy, 128, 122, headRot, {
      base: '#F0D8C8',
      shadow: '#8A7080',
      rim: 'rgba(255,198,118,0.52)',
      rimSide: -1,
      inkW,
      seed: 6301,
    });

    g.save();
    g.translate(hx, hy);
    g.rotate(headRot);

    // Peaked Navy Security Officer Cap w/ braided gold cord & shield badge!
    g.fillStyle = 'rgba(18,12,24,0.36)';
    g.beginPath(); g.ellipse(0, -48, 130, 26, 0, 0, Math.PI * 2); g.fill();
    const hatG = g.createLinearGradient(-120, -170, 120, -60);
    hatG.addColorStop(0, '#1A2C4E'); hatG.addColorStop(0.55, '#2C4678'); hatG.addColorStop(1, '#3D5E96');
    g.fillStyle = hatG;
    g.beginPath();
    g.moveTo(-116, -68); g.lineTo(-144, -138); g.quadraticCurveTo(0, -172, 144, -138); g.lineTo(116, -68); g.closePath();
    g.fill(); g.strokeStyle = INK; g.lineWidth = 10; g.stroke();
    // Gold cap band & shield emblem
    g.fillStyle = '#E6B646'; g.fillRect(-114, -84, 228, 18); g.strokeRect(-114, -84, 228, 18);
    g.beginPath(); g.arc(0, -122, 22, 0, Math.PI * 2); g.fill(); g.stroke();
    // Glossy black curved cap visor
    g.fillStyle = '#181822';
    g.beginPath(); g.ellipse(0, -60, 132, 22, 0, 0, Math.PI); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 4;
    g.beginPath(); g.arc(0, -66, 98, 0.25, 0.85); g.stroke();

    // Deadpan unimpressed half-lidded eyes staring left at the Thief!
    for (const ex of [-38, 38]) {
      if (blink) {
        g.strokeStyle = INK; g.lineWidth = 8;
        g.beginPath(); g.moveTo(ex - 22, 2); g.lineTo(ex + 22, 2); g.stroke();
      } else {
        g.fillStyle = '#FFFFFF';
        g.beginPath(); g.arc(ex, 0, 23, 0, Math.PI * 2); g.fill();
        g.strokeStyle = INK; g.lineWidth = 7; g.stroke();
        g.fillStyle = INK;
        g.beginPath(); g.arc(ex + pupilDx, 4, 7, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#F0D8C8';
        g.fillRect(ex - 25, -25, 50, 22);
        g.beginPath(); g.moveTo(ex - 25, -3); g.lineTo(ex + 25, -3); g.stroke();
      }
    }

    // Thick bushy graying walrus mustache + tiny deadpan mouth!
    g.fillStyle = '#5C4A42';
    g.beginPath();
    g.moveTo(0, 32);
    g.bezierCurveTo(-32, 24, -66, 40, -72, 62);
    g.quadraticCurveTo(-34, 68, 0, 54);
    g.quadraticCurveTo(34, 68, 72, 62);
    g.bezierCurveTo(66, 40, 32, 24, 0, 32);
    g.closePath();
    g.fill(); g.strokeStyle = INK; g.lineWidth = 7; g.stroke();
    g.restore();

    texture.needsUpdate = true;
  }

  update();
  return { texture, update };
}
