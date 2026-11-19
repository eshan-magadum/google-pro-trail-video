// Procedural 2D hand-drawn cel-shaded characters rendered on crisp RGBA Canvas2D textures
// to be mounted as 2.5D billboards inside the lit 3D Three.js street diorama.
import * as THREE from 'three';

const INK = '#120e1e';

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

// Helper: draw round cel-shaded head with subtle cool-left / warm-right split tint
function drawHeadBase(g, cx, cy, rx, ry, rot = 0, {
  baseColor = '#e9dae8',
  shadowColor = '#b49ec4',
  warmRim = 'rgba(255,222,182,0.52)',
  inkWidth = 18,
} = {}) {
  g.save();
  g.translate(cx, cy);
  g.rotate(rot);

  // Fill base head
  g.beginPath();
  g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = baseColor;
  g.fill();

  // Clip interior for soft cel shading
  g.save();
  g.clip();

  // Lavender ambient shadow crescent on bottom-left
  const sh = g.createRadialGradient(rx * 0.25, -ry * 0.12, rx * 0.35, -rx * 0.1, ry * 0.1, rx * 1.15);
  sh.addColorStop(0.0, 'rgba(180,158,196,0)');
  sh.addColorStop(0.68, 'rgba(155,134,182,0.18)');
  sh.addColorStop(1.0, shadowColor);
  g.fillStyle = sh;
  g.fillRect(-rx * 1.2, -ry * 1.2, rx * 2.4, ry * 2.4);

  // Warm deli rim glow on right-upper edge
  const wr = g.createRadialGradient(rx * 0.72, -ry * 0.15, rx * 0.05, rx * 0.65, -ry * 0.1, rx * 0.72);
  wr.addColorStop(0.0, warmRim);
  wr.addColorStop(1.0, 'rgba(255,220,175,0)');
  g.fillStyle = wr;
  g.fillRect(-rx * 1.2, -ry * 1.2, rx * 2.4, ry * 2.4);

  g.restore();

  // Thick ink outline
  g.beginPath();
  g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  g.strokeStyle = INK;
  g.lineWidth = inkWidth;
  g.stroke();

  g.restore();
}

// ============================================================================
// 1. ANGRY MAN ON STOOP STEPS (left foreground)
// ============================================================================
export function makeManTexture() {
  const [c, g] = makeCharCanvas(1024, 1536);

  // Stick legs (planted on two stoop steps: left leg lower, right leg slightly higher)
  g.strokeStyle = INK;
  g.lineWidth = 18;
  // Back/left leg (viewer left, lower step)
  g.beginPath();
  g.moveTo(465, 920);
  g.quadraticCurveTo(435, 1140, 345, 1385);
  g.stroke();
  // Foot
  g.beginPath();
  g.moveTo(345, 1385);
  g.lineTo(415, 1412);
  g.stroke();

  // Front/right leg (viewer right, upper-mid step)
  g.beginPath();
  g.moveTo(525, 920);
  g.quadraticCurveTo(548, 1130, 520, 1335);
  g.stroke();
  g.beginPath();
  g.moveTo(520, 1335);
  g.lineTo(598, 1358);
  g.stroke();

  // Right arm (viewer right — reaching/pointing toward the woman)
  g.strokeStyle = INK;
  g.lineWidth = 18;
  g.beginPath();
  g.moveTo(590, 690);
  g.quadraticCurveTo(705, 765, 845, 818);
  g.stroke();
  // Small pointing ball/hand
  g.fillStyle = '#d6c1dc';
  g.beginPath(); g.arc(855, 822, 22, 0, Math.PI * 2); g.fill();
  g.lineWidth = 12; g.stroke();

  // Bean torso (brownish-grey vest/jacket)
  g.save();
  g.beginPath();
  g.moveTo(395, 595);
  g.bezierCurveTo(320, 675, 295, 875, 395, 945);
  g.bezierCurveTo(470, 995, 585, 975, 620, 885);
  g.bezierCurveTo(652, 800, 635, 665, 575, 595);
  g.closePath();

  const vestGrad = g.createLinearGradient(320, 620, 635, 920);
  vestGrad.addColorStop(0.0, '#786882');
  vestGrad.addColorStop(0.5, '#594e72');
  vestGrad.addColorStop(1.0, '#362e54');
  g.fillStyle = vestGrad;
  g.fill();

  // Jacket lapel / shirt V & red necktie inside torso clip
  g.save();
  g.clip();
  // Pale shirt V
  g.fillStyle = '#b9acc4';
  g.beginPath();
  g.moveTo(455, 595);
  g.lineTo(520, 745);
  g.lineTo(585, 595);
  g.closePath();
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 10;
  g.stroke();

  // Dark crimson necktie
  g.fillStyle = '#6d1e2e';
  g.beginPath();
  g.moveTo(506, 615);
  g.lineTo(535, 615);
  g.lineTo(548, 765);
  g.lineTo(520, 795);
  g.lineTo(494, 765);
  g.closePath();
  g.fill();
  g.lineWidth = 8;
  g.stroke();

  // Jacket lapel crease lines
  g.beginPath();
  g.moveTo(435, 620); g.lineTo(492, 740);
  g.moveTo(600, 620); g.lineTo(550, 740);
  g.lineWidth = 9;
  g.stroke();

  // Subtle warm rim on right edge of jacket
  g.fillStyle = 'rgba(255,205,155,0.22)';
  g.fillRect(592, 600, 48, 350);
  g.restore();

  // Outer jacket ink stroke
  g.strokeStyle = INK;
  g.lineWidth = 18;
  g.stroke();
  g.restore();

  // Left arm (viewer left — bent down on his hip/waist)
  g.strokeStyle = INK;
  g.lineWidth = 18;
  g.beginPath();
  g.moveTo(395, 650);
  g.quadraticCurveTo(288, 735, 355, 845);
  g.stroke();

  // Black waist strap + Blue 4-cell memory/cartridge waist pouch
  g.strokeStyle = INK;
  g.lineWidth = 22;
  g.beginPath();
  g.moveTo(322, 825);
  g.quadraticCurveTo(475, 875, 626, 845);
  g.stroke();

  // Blue pouch body
  g.save();
  g.translate(490, 868);
  g.rotate(0.08);
  const pw = 178, ph = 86;
  const pgrad = g.createLinearGradient(0, -ph / 2, 0, ph / 2);
  pgrad.addColorStop(0, '#5a8dff');
  pgrad.addColorStop(0.55, '#3362e6');
  pgrad.addColorStop(1, '#1c3ea8');
  g.fillStyle = pgrad;
  g.beginPath();
  g.roundRect(-pw / 2, -ph / 2, pw, ph, 14);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 12;
  g.stroke();

  // 4 vertical cylinder/cartridge ribs + top caps
  g.lineWidth = 7;
  for (let i = 1; i < 4; i++) {
    const lx = -pw / 2 + (pw / 4) * i;
    g.beginPath(); g.moveTo(lx, -ph / 2 + 4); g.lineTo(lx, ph / 2 - 4); g.stroke();
  }
  // Specular highlights on cartridges
  g.fillStyle = 'rgba(180,220,255,0.45)';
  for (let i = 0; i < 4; i++) {
    const cx = -pw / 2 + (pw / 4) * (i + 0.35);
    g.fillRect(cx, -ph / 2 + 12, 10, ph - 24);
  }
  g.restore();

  // Round/egg head tilted slightly toward woman
  const hx = 528, hy = 415, rx = 212, ry = 198;
  drawHeadBase(g, hx, hy, rx, ry, 0.14, {
    baseColor: '#eee0ee',
    shadowColor: '#aa95bc',
    warmRim: 'rgba(255,222,180,0.62)',
    inkWidth: 20,
  });

  // Swept-back grey-brown hair cap on top of head
  g.save();
  g.translate(hx, hy);
  g.rotate(0.14);
  g.beginPath();
  g.moveTo(-195, -55);
  g.bezierCurveTo(-200, -188, -110, -238, 12, -228);
  g.bezierCurveTo(132, -218, 212, -162, 206, -42);
  g.bezierCurveTo(165, -92, 80, -125, -25, -124);
  g.bezierCurveTo(-112, -122, -165, -92, -195, -55);
  g.closePath();

  const hairGrad = g.createLinearGradient(-160, -220, 180, -60);
  hairGrad.addColorStop(0.0, '#9a8aa8');
  hairGrad.addColorStop(0.55, '#766684');
  hairGrad.addColorStop(1.0, '#504260');
  g.fillStyle = hairGrad;
  g.fill();

  // Comb lines across hair
  g.save();
  g.clip();
  g.strokeStyle = 'rgba(35,26,48,0.45)';
  g.lineWidth = 6;
  for (let i = 0; i < 5; i++) {
    const oy = -196 + i * 24;
    g.beginPath();
    g.moveTo(-195, oy + 12);
    g.quadraticCurveTo(0, oy - 12, 205, oy + 22);
    g.stroke();
  }
  g.restore();

  g.strokeStyle = INK;
  g.lineWidth = 14;
  g.stroke();

  // Face features (shifted slightly right/down for 3/4 look toward woman)
  const fx = 34, fy = 12;

  // Half-lidded angry eyes
  for (const [ex, ey] of [[fx - 52, fy - 12], [fx + 42, fy - 6]]) {
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.ellipse(ex, ey + 5, 22, 16, 0, 0, Math.PI * 2);
    g.fill();
    // Pupil looking slightly right/down
    g.fillStyle = INK;
    g.beginPath();
    g.arc(ex + 5, ey + 6, 8.5, 0, Math.PI * 2);
    g.fill();
    // Upper eyelid cover
    g.fillStyle = '#e7d7e9';
    g.beginPath();
    g.rect(ex - 28, ey - 22, 56, 22);
    g.fill();
    // Heavy straight upper lid line
    g.strokeStyle = INK;
    g.lineWidth = 10;
    g.beginPath();
    g.moveTo(ex - 26, ey - 2);
    g.lineTo(ex + 26, ey + 2);
    g.stroke();
    // Lower eye curve
    g.lineWidth = 7;
    g.beginPath();
    g.arc(ex, ey + 4, 20, 0.15, Math.PI - 0.15);
    g.stroke();
  }

  // Thick furrowed V-shaped angry eyebrows
  g.strokeStyle = INK;
  g.lineWidth = 15;
  g.beginPath();
  g.moveTo(fx - 86, fy - 52);
  g.lineTo(fx - 12, fy - 24);
  g.moveTo(fx + 86, fy - 42);
  g.lineTo(fx + 14, fy - 20);
  g.stroke();

  // Clenched-teeth grimace mouth (rounded rectangle with teeth grid)
  const mx = fx - 4, my = fy + 68, mw = 74, mh = 44;
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.roundRect(mx - mw / 2, my - mh / 2, mw, mh, 18);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 10;
  g.stroke();

  // Teeth grid lines
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(mx - mw / 2 + 4, my); g.lineTo(mx + mw / 2 - 4, my);
  for (const dx of [-18, 0, 18]) {
    g.moveTo(mx + dx, my - mh / 2 + 4); g.lineTo(mx + dx, my + mh / 2 - 4);
  }
  g.stroke();

  g.restore();

  return toCharTex(c);
}

// ============================================================================
// 2. WORRIED WOMAN BY THE STOOP RAILING (center-right)
// ============================================================================
export function makeWomanTexture() {
  const [c, g] = makeCharCanvas(1024, 1536);

  // Stick legs standing on wet sidewalk
  g.strokeStyle = INK;
  g.lineWidth = 18;
  // Left leg
  g.beginPath();
  g.moveTo(478, 1020);
  g.quadraticCurveTo(468, 1215, 488, 1390);
  g.stroke();
  g.beginPath(); g.moveTo(488, 1390); g.lineTo(445, 1412); g.stroke();
  // Right leg
  g.beginPath();
  g.moveTo(522, 1020);
  g.quadraticCurveTo(518, 1225, 535, 1435);
  g.stroke();
  g.beginPath(); g.moveTo(535, 1435); g.lineTo(486, 1455); g.stroke();

  // Bean torso (quilted teal-blue open puffer jacket over cream inner shirt)
  g.save();
  g.beginPath();
  g.moveTo(418, 665);
  g.bezierCurveTo(368, 760, 368, 965, 430, 1045);
  g.bezierCurveTo(475, 1098, 590, 1092, 635, 1020);
  g.bezierCurveTo(682, 945, 675, 760, 610, 665);
  g.closePath();

  const jGrad = g.createLinearGradient(375, 700, 665, 1040);
  jGrad.addColorStop(0.0, '#1e6e94');
  jGrad.addColorStop(0.55, '#134e74');
  jGrad.addColorStop(1.0, '#0a2d4c');
  g.fillStyle = jGrad;
  g.fill();

  g.save();
  g.clip();
  // Cream inner shirt strip (left-of-center for 3/4 pose)
  const shirtGrad = g.createLinearGradient(420, 665, 505, 1070);
  shirtGrad.addColorStop(0, '#eee0ce');
  shirtGrad.addColorStop(1, '#baa798');
  g.fillStyle = shirtGrad;
  g.fillRect(428, 660, 74, 430);
  g.strokeStyle = INK;
  g.lineWidth = 10;
  g.strokeRect(428, 660, 74, 430);

  // Quilted horizontal puffy ribs + tiny white stitching highlights on teal jacket
  g.strokeStyle = 'rgba(7,24,42,0.55)';
  g.lineWidth = 6;
  for (let y = 720; y <= 1025; y += 52) {
    g.beginPath();
    g.moveTo(360, y); g.lineTo(428, y);
    g.moveTo(502, y); g.lineTo(680, y);
    g.stroke();
    // Subtle pale cyan-white stitch dots along right jacket front
    g.fillStyle = 'rgba(185,235,245,0.45)';
    for (let x = 518; x <= 638; x += 30) {
      g.beginPath(); g.arc(x, y - 16, 4.5, 0, Math.PI * 2); g.fill();
    }
  }
  g.restore();

  g.strokeStyle = INK;
  g.lineWidth = 18;
  g.stroke();
  g.restore();

  // Stick arms (tucked nervously toward front / left railing)
  g.strokeStyle = INK;
  g.lineWidth = 17;
  // Back arm reaching slightly left
  g.beginPath();
  g.moveTo(418, 725);
  g.quadraticCurveTo(320, 710, 260, 650);
  g.stroke();
  // Front arm resting across her waist
  g.beginPath();
  g.moveTo(622, 745);
  g.quadraticCurveTo(672, 865, 565, 922);
  g.stroke();

  // Top hair bun (drawn behind/on top of head)
  const hx = 516, hy = 510, rx = 186, ry = 170;
  g.save();
  g.translate(hx + 34, hy - 188);
  g.rotate(-0.12);
  g.beginPath();
  g.ellipse(0, 0, 76, 56, 0, 0, Math.PI * 2);
  const bunGrad = g.createLinearGradient(-60, -50, 60, 50);
  bunGrad.addColorStop(0, '#825849');
  bunGrad.addColorStop(0.6, '#5c3c34');
  bunGrad.addColorStop(1, '#3b2422');
  g.fillStyle = bunGrad;
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 15;
  g.stroke();

  // Golden hairpin / chopstick piercing diagonally through the bun
  g.strokeStyle = INK;
  g.lineWidth = 18;
  g.beginPath(); g.moveTo(-115, 22); g.lineTo(128, -28); g.stroke();
  g.strokeStyle = '#e5b85c';
  g.lineWidth = 10;
  g.beginPath(); g.moveTo(-112, 21); g.lineTo(125, -27); g.stroke();
  g.restore();

  // Round pale head
  drawHeadBase(g, hx, hy, rx, ry, -0.04, {
    baseColor: '#f1dfea',
    shadowColor: '#ae96ba',
    warmRim: 'rgba(255,225,185,0.58)',
    inkWidth: 19,
  });

  // Dark warm-brown sweeping bangs + side hair wrapping around right side of head
  g.save();
  g.translate(hx, hy);
  g.beginPath();
  g.moveTo(-185, -35);
  g.bezierCurveTo(-190, -158, -80, -198, 25, -186);
  g.bezierCurveTo(150, -172, 215, -80, 198, 55);
  g.bezierCurveTo(188, 95, 165, 120, 145, 128);
  g.bezierCurveTo(155, 55, 130, -30, 52, -78);
  g.bezierCurveTo(-18, -118, -118, -95, -185, -35);
  g.closePath();

  const bhGrad = g.createLinearGradient(-150, -180, 180, 60);
  bhGrad.addColorStop(0.0, '#7c5548');
  bhGrad.addColorStop(0.55, '#593b34');
  bhGrad.addColorStop(1.0, '#362122');
  g.fillStyle = bhGrad;
  g.fill();

  // Warm rim highlight streak along top bangs
  g.strokeStyle = 'rgba(255,205,150,0.45)';
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(-140, -112);
  g.quadraticCurveTo(-15, -162, 118, -125);
  g.stroke();

  g.strokeStyle = INK;
  g.lineWidth = 14;
  g.stroke();

  // Worried face (slightly left-of-center, facing camera/man)
  const fx = -28, fy = 6;

  // Touching double-ring eyes (classic style-pack alive/worried eyes)
  for (const ex of [fx - 34, fx + 34]) {
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.ellipse(ex, fy, 33, 35, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 11;
    g.stroke();
    // Centered tiny dot pupil
    g.fillStyle = INK;
    g.beginPath();
    g.arc(ex, fy + 2, 8.5, 0, Math.PI * 2);
    g.fill();
  }

  // Sad arched eyebrows (tilted up in the middle)
  g.strokeStyle = INK;
  g.lineWidth = 11;
  g.beginPath();
  g.moveTo(fx - 72, fy - 42);
  g.quadraticCurveTo(fx - 34, fy - 62, fx - 8, fy - 68);
  g.moveTo(fx + 72, fy - 42);
  g.quadraticCurveTo(fx + 34, fy - 62, fx + 8, fy - 68);
  g.stroke();

  // Tiny sad downturned frown
  g.lineWidth = 10;
  g.beginPath();
  g.arc(fx, fy + 76, 18, Math.PI * 1.18, Math.PI * 1.82);
  g.stroke();

  g.restore();

  return toCharTex(c);
}

// ============================================================================
// 3. BACKGROUND PASSERBY (partially behind the woman)
// ============================================================================
export function makePasserbyTexture() {
  const [c, g] = makeCharCanvas(768, 1280);

  // Stick legs walking
  g.strokeStyle = INK;
  g.lineWidth = 16;
  g.beginPath();
  g.moveTo(350, 820); g.lineTo(310, 1140); g.lineTo(355, 1152);
  g.moveTo(410, 820); g.lineTo(455, 1110); g.lineTo(500, 1118);
  g.stroke();

  // Dark charcoal-navy jacket torso
  g.beginPath();
  g.ellipse(385, 680, 115, 175, 0.05, 0, Math.PI * 2);
  g.fillStyle = '#25263d';
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 16;
  g.stroke();

  // Round head looking slightly right
  drawHeadBase(g, 392, 388, 155, 148, 0.08, {
    baseColor: '#d8c8de',
    shadowColor: '#8d7da6',
    warmRim: 'rgba(255,220,175,0.45)',
    inkWidth: 16,
  });

  // Dark cap/hair silhouette across top-back
  g.save();
  g.translate(392, 388);
  g.beginPath();
  g.arc(0, -10, 152, Math.PI * 0.95, Math.PI * 1.98);
  g.quadraticCurveTo(20, -60, -150, -10);
  g.closePath();
  g.fillStyle = '#3f3448';
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 12;
  g.stroke();
  g.restore();

  return toCharTex(c);
}

// ============================================================================
// 4. KID ON BICYCLE (3/4 rear view, right sidewalk)
// ============================================================================
export function makeBikeKidTexture() {
  const [c, g] = makeCharCanvas(1024, 1536);

  // ---- Bicycle (3/4 rear perspective) ----
  // Front wheel (slightly further right & higher)
  const drawWheel = (cx, cy, rx, ry, rot) => {
    g.save();
    g.translate(cx, cy);
    g.rotate(rot);
    // Spokes
    g.strokeStyle = '#38466e';
    g.lineWidth = 4;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a) * rx, Math.sin(a) * ry);
      g.stroke();
    }
    // Metallic rim
    g.strokeStyle = '#8b9ec4';
    g.lineWidth = 12;
    g.beginPath(); g.ellipse(0, 0, rx - 8, ry - 8, 0, 0, Math.PI * 2); g.stroke();
    // Dark rubber tire
    g.strokeStyle = INK;
    g.lineWidth = 22;
    g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.stroke();
    // Hub
    g.fillStyle = INK;
    g.beginPath(); g.arc(0, 0, 12, 0, Math.PI * 2); g.fill();
    g.restore();
  };

  // Front wheel
  drawWheel(645, 1145, 58, 175, 0.06);

  // Bike frame & front wire basket (behind rear wheel)
  g.strokeStyle = '#25608a';
  g.lineWidth = 18;
  g.beginPath();
  g.moveTo(470, 1215); g.lineTo(625, 1085); // lower tube
  g.moveTo(470, 1020); g.lineTo(638, 910);  // top tube
  g.moveTo(645, 1145); g.lineTo(630, 815);  // front fork
  g.stroke();
  g.strokeStyle = INK;
  g.lineWidth = 7;
  g.stroke();

  // Handlebars
  g.strokeStyle = INK;
  g.lineWidth = 14;
  g.beginPath();
  g.moveTo(575, 815); g.quadraticCurveTo(645, 795, 745, 825);
  g.stroke();

  // Front wire basket on right of handlebars
  g.save();
  g.strokeStyle = '#5a3c36';
  g.lineWidth = 7;
  g.fillStyle = 'rgba(130,88,68,0.28)';
  g.beginPath();
  g.moveTo(670, 830); g.lineTo(790, 835); g.lineTo(772, 915); g.lineTo(682, 912); g.closePath();
  g.fill(); g.stroke();
  g.lineWidth = 4;
  for (const x of [705, 735, 762]) {
    g.beginPath(); g.moveTo(x, 832); g.lineTo(x - 4, 913); g.stroke();
  }
  g.beginPath(); g.moveTo(676, 872); g.lineTo(780, 875); g.stroke();
  g.restore();

  // Kickstand / pedal leg
  g.strokeStyle = INK;
  g.lineWidth = 13;
  g.beginPath();
  g.moveTo(615, 1205); g.lineTo(695, 1365);
  g.moveTo(395, 1225); g.lineTo(328, 1345);
  g.stroke();

  // Rear wheel (closer to viewer, left-center)
  drawWheel(462, 1220, 68, 198, 0.14);

  // Rear fender + teal frame stays
  g.strokeStyle = '#2d7aa6';
  g.lineWidth = 16;
  g.beginPath();
  g.moveTo(462, 1220); g.lineTo(488, 995);
  g.moveTo(462, 1220); g.lineTo(548, 1020);
  g.stroke();

  // Saddle
  g.fillStyle = '#241b2e';
  g.beginPath(); g.ellipse(498, 995, 58, 22, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = INK; g.lineWidth = 10; g.stroke();

  // Kid's stick legs on pedals
  g.strokeStyle = INK;
  g.lineWidth = 16;
  g.beginPath();
  g.moveTo(455, 955); g.lineTo(415, 1145);
  g.moveTo(545, 955); g.lineTo(598, 1135);
  g.stroke();

  // Kid's arms reaching forward to handlebars
  g.beginPath();
  g.moveTo(610, 745); g.quadraticCurveTo(695, 785, 738, 822);
  g.stroke();

  // Kid's bean torso (back view — teal jacket with horizontal burgundy + ochre stripes)
  g.save();
  g.beginPath();
  g.moveTo(410, 655);
  g.bezierCurveTo(368, 745, 372, 910, 428, 965);
  g.bezierCurveTo(478, 1008, 578, 1002, 620, 945);
  g.bezierCurveTo(658, 888, 652, 740, 602, 655);
  g.closePath();

  const ktGrad = g.createLinearGradient(375, 670, 645, 975);
  ktGrad.addColorStop(0.0, '#186a9e');
  ktGrad.addColorStop(0.55, '#105082');
  ktGrad.addColorStop(1.0, '#0a335c');
  g.fillStyle = ktGrad;
  g.fill();

  g.save();
  g.clip();
  // Burgundy stripe + ochre gold stripe across upper back
  g.fillStyle = '#6c2b48';
  g.fillRect(360, 725, 310, 42);
  g.fillStyle = '#b9883b';
  g.fillRect(360, 767, 310, 22);
  g.strokeStyle = INK;
  g.lineWidth = 8;
  g.beginPath();
  g.moveTo(360, 725); g.lineTo(670, 725);
  g.moveTo(360, 767); g.lineTo(670, 767);
  g.moveTo(360, 789); g.lineTo(670, 789);
  g.stroke();
  g.restore();

  g.strokeStyle = INK;
  g.lineWidth = 18;
  g.stroke();
  g.restore();

  // Kid's round back-of-head
  const hx = 515, hy = 512, rx = 182, ry = 168;
  drawHeadBase(g, hx, hy, rx, ry, 0, {
    baseColor: '#dfd3e8',
    shadowColor: '#9c8db8',
    warmRim: 'rgba(255,220,175,0.45)',
    inkWidth: 18,
  });

  // Ochre-yellow knit beanie cap with small top pom-pom & folded brim
  g.save();
  g.translate(hx, hy);
  // Pom-pom
  g.fillStyle = '#b88635';
  g.beginPath(); g.arc(4, -198, 28, 0, Math.PI * 2); g.fill();
  g.strokeStyle = INK; g.lineWidth = 12; g.stroke();

  // Beanie dome
  g.beginPath();
  g.moveTo(-188, -32);
  g.bezierCurveTo(-190, -155, -102, -196, 2, -196);
  g.bezierCurveTo(106, -196, 192, -155, 190, -32);
  g.quadraticCurveTo(0, -12, -188, -32);
  g.closePath();

  const bGrad = g.createLinearGradient(-150, -190, 150, -20);
  bGrad.addColorStop(0.0, '#cc9a42');
  bGrad.addColorStop(0.6, '#a4752c');
  bGrad.addColorStop(1.0, '#78521e');
  g.fillStyle = bGrad;
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 15;
  g.stroke();

  // Folded beanie cuff / dark stripe
  g.fillStyle = '#8b5f24';
  g.beginPath();
  g.moveTo(-194, -56);
  g.quadraticCurveTo(0, -40, 194, -56);
  g.lineTo(192, -24);
  g.quadraticCurveTo(0, -6, -192, -24);
  g.closePath();
  g.fill();
  g.lineWidth = 12;
  g.stroke();
  g.restore();

  return toCharTex(c);
}
