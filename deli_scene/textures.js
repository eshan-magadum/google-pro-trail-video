// Procedural Canvas2D textures for the 3D Deli Grocery street environment.
// Every surface (brick, stucco, awning, grocery shelves, wet sidewalk, alley wall, fence)
// is generated 100% from code — zero external images.
import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toTex(canvas, { srgb = true, repeat = [1, 1], anisotropy = 8 } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

// 1. Left townhouse brick wall (color + bump)
export function makeBrickTextures() {
  const [c, g] = makeCanvas(512, 1024);
  const [bc, bg] = makeCanvas(512, 1024);
  const rng = mulberry32(101);

  g.fillStyle = '#251a38';
  g.fillRect(0, 0, c.width, c.height);
  bg.fillStyle = '#303030';
  bg.fillRect(0, 0, bc.width, bc.height);

  const rows = 36, cols = 8;
  const bh = c.height / rows;
  const bw = c.width / cols;
  const mortar = 3;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (bw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const x = col * bw + offset;
      const y = r * bh;
      const v = rng();
      const red = Math.round(74 + v * 34);
      const grn = Math.round(48 + v * 22);
      const blu = Math.round(84 + v * 28);
      g.fillStyle = `rgb(${red},${grn},${blu})`;
      g.fillRect(x + mortar, y + mortar, bw - mortar * 2, bh - mortar * 2);

      // Subtle bevel highlight on brick top
      g.fillStyle = `rgba(170,130,180,${0.08 + rng() * 0.08})`;
      g.fillRect(x + mortar, y + mortar, bw - mortar * 2, 3);

      const bv = Math.round(165 + v * 65);
      bg.fillStyle = `rgb(${bv},${bv},${bv})`;
      bg.fillRect(x + mortar, y + mortar, bw - mortar * 2, bh - mortar * 2);
    }
  }
  return {
    map: toTex(c, { repeat: [1, 1.4] }),
    bumpMap: toTex(bc, { srgb: false, repeat: [1, 1.4] }),
  };
}

// 2. Main deli building stucco wall
export function makeStuccoTexture() {
  const [c, g] = makeCanvas(1024, 1024);
  const rng = mulberry32(202);
  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0.0, '#4652ad');
  grad.addColorStop(0.55, '#545eb8');
  grad.addColorStop(1.0, '#3c4390');
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);

  // Subtle horizontal concrete form seams & soft plaster blotches
  for (let i = 0; i < 450; i++) {
    const x = rng() * c.width;
    const y = rng() * c.height;
    const rad = 18 + rng() * 75;
    const dark = rng() > 0.5;
    g.fillStyle = dark ? 'rgba(24,28,74,0.035)' : 'rgba(130,145,230,0.03)';
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = 'rgba(20,22,60,0.12)';
  g.lineWidth = 2;
  for (let y = 128; y < c.height; y += 160) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(c.width, y); g.stroke();
  }
  return toTex(c, { repeat: [1, 1] });
}

// 3. Upper-floor recessed window with dark glass, blinds, and mullions
export function makeUpperWindowTexture(blueGlowBottom = false) {
  const [c, g] = makeCanvas(512, 768);
  // Deep indigo interior glass
  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, '#0a0d26');
  grad.addColorStop(0.65, '#121a42');
  grad.addColorStop(1, '#1c265a');
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);

  // Subtle diagonal sky reflection on glass
  const ref = g.createLinearGradient(0, 0, c.width, c.height * 0.7);
  ref.addColorStop(0, 'rgba(120,145,235,0.16)');
  ref.addColorStop(0.45, 'rgba(90,110,195,0.05)');
  ref.addColorStop(0.5, 'rgba(150,175,255,0.14)');
  ref.addColorStop(1, 'rgba(20,25,65,0)');
  g.fillStyle = ref;
  g.fillRect(0, 0, c.width, c.height);

  // Horizontal venetian blind slats in upper half
  g.strokeStyle = 'rgba(95,112,178,0.28)';
  g.lineWidth = 4;
  for (let y = 26; y < c.height * 0.52; y += 22) {
    g.beginPath(); g.moveTo(20, y); g.lineTo(c.width - 20, y); g.stroke();
  }

  // Optional glowing blue patch at lower-right window (matches ref behind fire escape)
  if (blueGlowBottom) {
    const bg = g.createRadialGradient(c.width * 0.65, c.height * 0.8, 10, c.width * 0.65, c.height * 0.8, 180);
    bg.addColorStop(0, 'rgba(95,165,255,0.95)');
    bg.addColorStop(0.5, 'rgba(50,105,230,0.55)');
    bg.addColorStop(1, 'rgba(20,40,120,0)');
    g.fillStyle = bg;
    g.fillRect(0, c.height * 0.5, c.width, c.height * 0.5);
  }

  // Sash mullions
  g.strokeStyle = '#6c77a8';
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(0, c.height * 0.52); g.lineTo(c.width, c.height * 0.52);
  g.stroke();
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(c.width * 0.5, 0); g.lineTo(c.width * 0.5, c.height);
  g.moveTo(0, c.height * 0.26); g.lineTo(c.width, c.height * 0.26);
  g.moveTo(0, c.height * 0.76); g.lineTo(c.width, c.height * 0.76);
  g.stroke();

  const tex = toTex(c, { repeat: [1, 1] });
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// 4a. Red sloped awning roof (crimson panels + subtle seam ribs)
export function makeAwningTexture() {
  const [c, g] = makeCanvas(2048, 512);
  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0.0, '#78192c');
  grad.addColorStop(0.55, '#992236');
  grad.addColorStop(1.0, '#7e1a2c');
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);

  for (let x = 0; x < c.width; x += 128) {
    g.fillStyle = 'rgba(20,4,12,0.24)';
    g.fillRect(x, 0, 5, c.height);
    g.fillStyle = 'rgba(255,155,155,0.10)';
    g.fillRect(x + 5, 0, 3, c.height);
  }
  const tex = toTex(c, { repeat: [1, 1] });
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// 4b. Upright front valance of awning with bold white "DELI GROCERY" typography
export function makeAwningValanceTexture() {
  const [c, g] = makeCanvas(2048, 256);
  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0.0, '#7a192a');
  grad.addColorStop(0.75, '#962235');
  grad.addColorStop(0.88, '#df5c62');
  grad.addColorStop(1.0, '#4e101c');
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);

  for (let x = 0; x < c.width; x += 128) {
    g.fillStyle = 'rgba(20,4,12,0.20)';
    g.fillRect(x, 0, 4, c.height);
  }

  g.save();
  g.fillStyle = '#fcf8f5';
  g.shadowColor = 'rgba(20,4,10,0.65)';
  g.shadowBlur = 4;
  g.shadowOffsetY = 2;
  g.font = '800 132px "Liberation Sans", "DejaVu Sans", Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.translate(c.width * 0.50, c.height * 0.48);
  g.scale(0.84, 1.0);
  g.fillText('DELI  GROCERY', 0, 0);
  g.restore();

  const tex = toTex(c, { repeat: [1, 1] });
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// 5. Glowing Deli Interior — shelves packed with colorful grocery products + warm fluorescent haze
export function makeDeliInteriorTexture() {
  const [c, g] = makeCanvas(2048, 1024);
  const rng = mulberry32(303);

  // Warm cream-gold fluorescent backdrop (brightest at top)
  const bg = g.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0.0, '#fff7d8');
  bg.addColorStop(0.28, '#ffe9b2');
  bg.addColorStop(0.65, '#f2d39c');
  bg.addColorStop(0.86, '#bfa082');
  bg.addColorStop(1.0, '#6a5258');
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);

  // Bright ceiling light tubes
  for (let i = 0; i < 4; i++) {
    const lx = 180 + i * 480;
    const lg = g.createRadialGradient(lx, 70, 10, lx, 120, 320);
    lg.addColorStop(0, 'rgba(255,255,245,0.95)');
    lg.addColorStop(0.5, 'rgba(255,235,175,0.45)');
    lg.addColorStop(1, 'rgba(255,220,145,0)');
    g.fillStyle = lg;
    g.fillRect(0, 0, c.width, 460);
  }

  // 4 horizontal grocery shelves packed with colorful boxes, bottles, cans
  const palette = [
    '#e85d4a', '#f2a641', '#5db868', '#4a92d8', '#e66e92',
    '#f5d952', '#ffffff', '#6ac4bd', '#c95e3a', '#8c6cd6',
  ];
  const shelfYs = [420, 565, 705, 835];

  for (let s = 0; s < shelfYs.length; s++) {
    const sy = shelfYs[s];
    // Shelf shadow under lip
    g.fillStyle = 'rgba(135,90,65,0.35)';
    g.fillRect(0, sy, c.width, 14);
    g.fillStyle = '#e5cfa4';
    g.fillRect(0, sy - 6, c.width, 8);

    // Populate items along shelf
    let x = 24;
    while (x < c.width - 30) {
      const col = palette[Math.floor(rng() * palette.length)];
      const kind = rng();
      const w = Math.round(22 + rng() * 36);
      const h = Math.round(48 + rng() * 68);
      const y = sy - 6 - h;

      g.fillStyle = col;
      if (kind < 0.35) {
        // Bottle with neck
        g.fillRect(x + 2, y + h * 0.25, w - 4, h * 0.75);
        g.fillRect(x + w * 0.28, y, w * 0.44, h * 0.3);
      } else if (kind < 0.75) {
        // Box / carton
        g.fillRect(x, y, w, h);
        // Label band
        g.fillStyle = 'rgba(255,250,235,0.65)';
        g.fillRect(x + 3, y + h * 0.25, w - 6, h * 0.26);
      } else {
        // Stack of cans
        g.fillRect(x, y + h * 0.45, w, h * 0.55);
        g.fillStyle = 'rgba(255,255,255,0.5)';
        g.fillRect(x, y + h * 0.45, w, 5);
      }
      x += w + Math.round(4 + rng() * 14);
    }
  }

  // Warm interior mist / backlight wash so products feel glowing & slightly soft
  const wash = g.createLinearGradient(0, 0, 0, c.height);
  wash.addColorStop(0.0, 'rgba(255,232,170,0.58)');
  wash.addColorStop(0.40, 'rgba(255,220,152,0.34)');
  wash.addColorStop(0.75, 'rgba(235,196,138,0.22)');
  wash.addColorStop(1.0, 'rgba(42,30,56,0.55)');
  g.fillStyle = wash;
  g.fillRect(0, 0, c.width, c.height);

  // Foreground produce baskets along the very bottom (oranges / apples / onions)
  for (let i = 0; i < 60; i++) {
    const px = 40 + i * 33 + (rng() - 0.5) * 10;
    const py = 925 + (rng() - 0.5) * 45;
    const r = 13 + rng() * 8;
    g.fillStyle = rng() > 0.4 ? '#c9884a' : '#8da34f';
    g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(28,18,32,0.65)';
    g.lineWidth = 3;
    g.stroke();
  }

  // Tiny white price cards taped near bottom window
  for (const cx of [380, 560, 1180]) {
    g.fillStyle = '#e8e4ee';
    g.fillRect(cx, 885, 62, 68);
    g.strokeStyle = '#1d1832';
    g.lineWidth = 4;
    g.strokeRect(cx, 885, 62, 68);
    g.fillStyle = '#1e1b35';
    g.font = 'bold 34px "DejaVu Sans", sans-serif';
    g.fillText('$3', cx + 10, 932);
  }

  const tex = toTex(c, { repeat: [1, 1] });
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// 6. Wet concrete sidewalk slabs (color + roughness map for glossy puddles)
export function makeSidewalkTextures() {
  const [c, g] = makeCanvas(1024, 1024);
  const [rc, rg] = makeCanvas(1024, 1024);
  const rng = mulberry32(404);

  // Cool blue-slate wet concrete base
  g.fillStyle = '#5a68aa';
  g.fillRect(0, 0, c.width, c.height);

  // Roughness: darker = smoother / wetter / glossier
  rg.fillStyle = '#585858';
  rg.fillRect(0, 0, rc.width, rc.height);

  // Subtle concrete blotches & wet puddle patches
  for (let i = 0; i < 90; i++) {
    const x = rng() * c.width;
    const y = rng() * c.height;
    const rx = 50 + rng() * 140;
    const ry = 35 + rng() * 110;
    const wet = rng() > 0.45;
    g.fillStyle = wet ? 'rgba(32,44,105,0.12)' : 'rgba(135,148,215,0.08)';
    g.beginPath(); g.ellipse(x, y, rx, ry, rng() * Math.PI, 0, Math.PI * 2); g.fill();

    rg.fillStyle = wet ? 'rgba(20,20,20,0.45)' : 'rgba(135,135,135,0.28)';
    rg.beginPath(); rg.ellipse(x, y, rx, ry, rng() * Math.PI, 0, Math.PI * 2); rg.fill();
  }

  // Expansion joint grid (2x2 slabs per tile)
  g.strokeStyle = '#161b42';
  g.lineWidth = 7;
  for (const pos of [0, 512]) {
    g.beginPath(); g.moveTo(pos, 0); g.lineTo(pos, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, pos); g.lineTo(1024, pos); g.stroke();
  }
  // Subtle highlight edge beside slab joints
  g.strokeStyle = 'rgba(155,175,245,0.28)';
  g.lineWidth = 3;
  for (const pos of [5, 517]) {
    g.beginPath(); g.moveTo(pos, 0); g.lineTo(pos, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, pos); g.lineTo(1024, pos); g.stroke();
  }

  // Organic concrete cracks
  g.strokeStyle = 'rgba(18,22,52,0.75)';
  g.lineWidth = 3.5;
  for (let k = 0; k < 7; k++) {
    let x = rng() * 1024, y = rng() * 1024;
    g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 7; s++) {
      x += (rng() - 0.5) * 90;
      y += (rng() - 0.5) * 90;
      g.lineTo(x, y);
    }
    g.stroke();
  }

  return {
    map: toTex(c, { repeat: [6, 4] }),
    roughnessMap: toTex(rc, { srgb: false, repeat: [6, 4] }),
  };
}

// 7. Distant concrete alley building wall (horizontal concrete courses + subtle weathering)
export function makeAlleyWallTexture() {
  const [c, g] = makeCanvas(512, 1024);
  const rng = mulberry32(505);
  g.fillStyle = '#4f4e7c';
  g.fillRect(0, 0, c.width, c.height);

  for (let y = 0; y < c.height; y += 64) {
    const shade = 68 + Math.round(rng() * 18);
    g.fillStyle = `rgb(${shade},${shade},${shade + 36})`;
    g.fillRect(0, y, c.width, 62);
    g.fillStyle = 'rgba(18,16,42,0.55)';
    g.fillRect(0, y + 60, c.width, 4);
  }
  // Vertical panel seams
  g.strokeStyle = 'rgba(20,18,45,0.32)';
  g.lineWidth = 3;
  for (let x = 128; x < c.width; x += 128) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, c.height); g.stroke();
  }
  return toTex(c, { repeat: [1, 1.5] });
}

// 8. Chain-link fence with barbed-wire top triangles (transparent cutout)
export function makeFenceTexture() {
  const [c, g] = makeCanvas(512, 512);
  g.clearRect(0, 0, 512, 512);

  const topRailY = 82;
  // Barbed wire triangles along top
  g.strokeStyle = 'rgba(120,132,202,0.85)';
  g.lineWidth = 3;
  for (let x = 0; x < 512; x += 28) {
    g.beginPath();
    g.moveTo(x, topRailY);
    g.lineTo(x + 14, 24);
    g.lineTo(x + 28, topRailY);
    g.stroke();
  }

  // Top & bottom horizontal metal rails
  g.fillStyle = '#6874ba';
  g.fillRect(0, topRailY - 5, 512, 10);
  g.fillRect(0, 496, 512, 12);

  // Diamond chain-link mesh
  g.strokeStyle = 'rgba(130,145,215,0.62)';
  g.lineWidth = 2.4;
  const step = 22;
  for (let x = -512; x < 1024; x += step) {
    g.beginPath(); g.moveTo(x, topRailY); g.lineTo(x + 430, 512); g.stroke();
    g.beginPath(); g.moveTo(x, topRailY); g.lineTo(x - 430, 512); g.stroke();
  }

  // Vertical fence posts
  g.fillStyle = '#30386e';
  g.fillRect(0, 20, 12, 492);
  g.fillRect(250, 20, 10, 492);

  const tex = toTex(c, { repeat: [2.2, 1] });
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// 9. Concrete stoop steps texture (subtle stone grain + warm edge reflection readiness)
export function makeConcreteTexture() {
  const [c, g] = makeCanvas(512, 512);
  const rng = mulberry32(606);
  g.fillStyle = '#474c86';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 250; i++) {
    g.fillStyle = rng() > 0.5 ? 'rgba(18,22,58,0.08)' : 'rgba(155,165,225,0.06)';
    g.beginPath();
    g.arc(rng() * 512, rng() * 512, 8 + rng() * 34, 0, Math.PI * 2);
    g.fill();
  }
  return toTex(c, { repeat: [1, 1] });
}
