// Skill v3.0 High-Detail Procedural PBR Textures, Skyboxes, Foliage, Coils & VFX Helpers
import * as THREE from 'three';
import { makeBrushedMetalPBR, makeTwistedCoilPBR, addInkOutlines } from './pbr_materials.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toTex(c, { repeat = [1, 1], srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

// 1. Warm Aged Brick & Dark Mahogany Wainscoting Lab Wall (rich surface grain & mortar!)
export function makeLabBrickWallTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  const rng = mulberry32(301);

  // Upper aged warm brick wall
  g.fillStyle = '#3A282B';
  g.fillRect(0, 0, 512, 340);
  const bh = 28, bw = 64;
  for (let row = 0; row < 13; row++) {
    const off = (row % 2) * (bw / 2);
    for (let col = -1; col < 9; col++) {
      const x = col * bw + off, y = row * bh;
      const v = Math.floor((rng() - 0.5) * 26);
      g.fillStyle = `rgb(${108 + v},${62 + Math.floor(v * 0.6)},${54 + Math.floor(v * 0.5)})`;
      g.fillRect(x + 3, y + 3, bw - 6, bh - 6);
      g.fillStyle = 'rgba(255,205,155,0.08)';
      g.fillRect(x + 3, y + 3, bw - 6, 4);
    }
  }
  // Dark mahogany paneled wainscoting along lower third
  g.fillStyle = '#3C231D';
  g.fillRect(0, 340, 512, 172);
  g.fillStyle = '#5B3629';
  g.fillRect(0, 336, 512, 12);
  for (let x = 16; x < 500; x += 124) {
    g.strokeStyle = '#241312'; g.lineWidth = 6;
    g.strokeRect(x, 362, 102, 130);
    g.strokeStyle = 'rgba(255,198,135,0.16)'; g.lineWidth = 2;
    g.strokeRect(x + 5, 367, 92, 120);
  }
  return toTex(c, { repeat: [3, 1] });
}

// 2. Warm Planked Oak Laboratory Floor
export function makeOakFloorTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  const rng = mulberry32(414);
  g.fillStyle = '#4B3026';
  g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) {
    const v = Math.floor((rng() - 0.5) * 22);
    g.fillStyle = `rgb(${84 + v},${54 + Math.floor(v * 0.7)},${40 + Math.floor(v * 0.5)})`;
    g.fillRect(0, y, 512, 30);
    g.fillStyle = 'rgba(20,12,14,0.55)';
    g.fillRect(0, y + 30, 512, 2);
    // Plank vertical end joints
    const jx = Math.floor(rng() * 440) + 32;
    g.fillRect(jx, y, 3, 30);
  }
  for (let i = 0; i < 90; i++) {
    g.strokeStyle = 'rgba(26,15,12,0.14)';
    g.lineWidth = 1.5;
    const y = rng() * 512;
    g.beginPath(); g.moveTo(0, y); g.lineTo(512, y + (rng() - 0.5) * 6); g.stroke();
  }
  return toTex(c, { repeat: [4, 4] });
}

// 3. Ornate Crimson & Gold Persian Lab Rug (exact Samurai Tent micro-detail benchmark!)
export function makeOrnamentalRugTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 768;
  const g = c.getContext('2d');
  g.fillStyle = '#8F212B';
  g.fillRect(0, 0, 512, 768);
  g.strokeStyle = '#1E2852'; g.lineWidth = 52; g.strokeRect(26, 26, 460, 716);
  g.strokeStyle = '#E8B64C'; g.lineWidth = 8; g.strokeRect(56, 56, 400, 656);
  g.strokeRect(10, 10, 492, 748);
  g.fillStyle = '#E8B64C';
  for (let x = 28; x <= 484; x += 28) {
    g.beginPath(); g.arc(x, 26, 6, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(x, 742, 6, 0, Math.PI * 2); g.fill();
  }
  for (let y = 54; y <= 714; y += 28) {
    g.beginPath(); g.arc(26, y, 6, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(486, y, 6, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = '#1E2852';
  g.beginPath(); g.ellipse(256, 384, 132, 182, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#E8B64C'; g.lineWidth = 7; g.stroke();
  g.fillStyle = '#8F212B';
  g.beginPath(); g.ellipse(256, 384, 74, 100, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = '#E8B64C';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.beginPath();
    g.ellipse(256 + Math.cos(a) * 32, 384 + Math.sin(a) * 32, 18, 8, a, 0, Math.PI * 2);
    g.fill();
  }
  return toTex(c);
}

// 4. Packed Vintage Bookshelf Texture (hundreds of colorful leather spines & gold lettering!)
export function makeBookshelfTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 768;
  const g = c.getContext('2d');
  const rng = mulberry32(515);
  const colors = ['#7E2A2B', '#2A4E58', '#8C5B2C', '#3E325C', '#5C6B3A', '#9A3D2E', '#4C362A', '#B27C34'];

  g.fillStyle = '#2A1816';
  g.fillRect(0, 0, 512, 768);

  for (let shelf = 0; shelf < 5; shelf++) {
    const sy = 20 + shelf * 148;
    let bx = 18;
    while (bx < 474) {
      const bw = 18 + Math.floor(rng() * 24);
      const bh = 95 + Math.floor(rng() * 34);
      const by = sy + 132 - bh;
      g.fillStyle = colors[Math.floor(rng() * colors.length)];
      g.fillRect(bx, by, bw - 2, bh);
      g.strokeStyle = '#140C10'; g.lineWidth = 2;
      g.strokeRect(bx, by, bw - 2, bh);
      // Gold spine bands
      g.fillStyle = '#E6BD62';
      g.fillRect(bx + 3, by + 16, bw - 8, 4);
      g.fillRect(bx + 3, by + bh - 22, bw - 8, 4);
      bx += bw;
    }
    // Thick oak shelf plank
    g.fillStyle = '#543326';
    g.fillRect(0, sy + 132, 512, 16);
    g.fillStyle = '#180E10';
    g.fillRect(0, sy + 145, 512, 4);
  }
  g.strokeStyle = '#4B2D22'; g.lineWidth = 20;
  g.strokeRect(10, 10, 492, 748);
  return toTex(c);
}

// 5. Slate Chalkboard Covered in Handwritten Teleportation Equations & Portal Sketches!
export function makeChalkboardTexture() {
  const c = document.createElement('canvas');
  c.width = 768; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#1D292B';
  g.fillRect(0, 0, 768, 512);
  // Dusty chalk smudges
  for (let i = 0; i < 30; i++) {
    g.fillStyle = 'rgba(215,232,226,0.03)';
    g.beginPath(); g.arc((i * 89) % 720 + 24, (i * 53) % 440 + 36, 55, 0, Math.PI * 2); g.fill();
  }
  // Wooden frame
  g.strokeStyle = '#5E3B28'; g.lineWidth = 22;
  g.strokeRect(11, 11, 746, 490);

  g.strokeStyle = 'rgba(235,244,238,0.82)';
  g.fillStyle = 'rgba(235,244,238,0.86)';
  g.lineWidth = 4;

  // Portal diagram: Circle A ===> Circle B with stick figure & wave equation!
  g.beginPath(); g.arc(165, 195, 76, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(165, 195, 58, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(585, 195, 76, 0, Math.PI * 2); g.stroke();
  g.setLineDash([12, 9]);
  g.beginPath(); g.moveTo(252, 195); g.quadraticCurveTo(375, 108, 498, 195); g.stroke();
  g.setLineDash([]);
  // Arrowhead
  g.beginPath(); g.moveTo(476, 178); g.lineTo(500, 196); g.lineTo(472, 206); g.stroke();

  // Mini chalk stick-figure teleporting A -> B
  for (const sx of [165, 585]) {
    g.beginPath(); g.arc(sx, 168, 16, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(sx, 184); g.lineTo(sx, 226); g.moveTo(sx - 16, 202); g.lineTo(sx + 16, 202); g.stroke();
  }

  g.font = '700 32px "DejaVu Serif", Georgia, serif';
  g.fillText('QUANTUM PHASE  Ψ(x,t) = A·e^(iωt)', 68, 72);
  g.font = '600 26px "DejaVu Sans Mono", monospace';
  g.fillText('ΔE · Δt ≥ ħ/2      COIL: 14.8 kV', 68, 345);
  g.fillText('ATOM REASSEMBLY: 99.98% ...?', 68, 405);

  // Red chalk warning circle around "99.98% ...?"
  g.strokeStyle = '#FF6A5C'; g.lineWidth = 5;
  g.beginPath(); g.ellipse(498, 396, 118, 32, -0.05, 0, Math.PI * 2); g.stroke();
  return toTex(c);
}

// 6. Dynamic Animated Weathered Brass & Glass Pressure/Voltage Gauge (Skill v3.0 Parchment & Glass DNA!)
export function makeDynamicGaugeRig() {
  const c = document.createElement('canvas');
  c.width = 384; c.height = 384;
  const g = c.getContext('2d');
  const tex = toTex(c);

  // Pre-bake static aged parchment paper texture & grime ring so per-frame updates stay ultra-fast!
  const bgC = document.createElement('canvas');
  bgC.width = 384; bgC.height = 384;
  const bg = bgC.getContext('2d');
  const rng = mulberry32(8421);

  // Brushed metallic brass bezel with warm directional gradient
  const bezG = bg.createLinearGradient(0, 0, 384, 384);
  bezG.addColorStop(0, '#E4B85A'); bezG.addColorStop(0.5, '#A9742A'); bezG.addColorStop(1, '#583612');
  bg.fillStyle = bezG;
  bg.beginPath(); bg.arc(192, 192, 186, 0, Math.PI * 2); bg.fill();
  bg.strokeStyle = '#181018'; bg.lineWidth = 10; bg.stroke();
  // Tiny brass bezel screws
  for (let s = 0; s < 4; s++) {
    const sa = s * Math.PI * 0.5 + Math.PI * 0.25;
    bg.fillStyle = '#4A2C12';
    bg.beginPath(); bg.arc(192 + Math.cos(sa) * 173, 192 + Math.sin(sa) * 173, 6, 0, Math.PI * 2); bg.fill();
  }

  // Aged yellowed cream parchment dial face
  bg.save();
  bg.beginPath(); bg.arc(192, 192, 162, 0, Math.PI * 2); bg.clip();
  const faceG = bg.createRadialGradient(178, 174, 24, 192, 192, 168);
  faceG.addColorStop(0, '#F5ECD4');
  faceG.addColorStop(0.68, '#E4D4B0');
  faceG.addColorStop(1, '#B89E74');
  bg.fillStyle = faceG; bg.fillRect(0, 0, 384, 384);

  // Subtle parchment age stains & paper fiber grain!
  for (let i = 0; i < 650; i++) {
    const px = 26 + rng() * 332, py = 26 + rng() * 332;
    bg.fillStyle = rng() < 0.5 ? 'rgba(92,66,38,0.08)' : 'rgba(255,250,235,0.09)';
    bg.fillRect(px, py, 2 + rng() * 3, 2 + rng() * 3);
  }
  // Inner bezel cast shadow ring (gives genuine recessed depth behind glass!)
  const rimSh = bg.createRadialGradient(192, 196, 134, 192, 192, 164);
  rimSh.addColorStop(0, 'rgba(22,14,18,0)');
  rimSh.addColorStop(0.75, 'rgba(22,14,18,0.22)');
  rimSh.addColorStop(1, 'rgba(22,14,18,0.68)');
  bg.fillStyle = rimSh; bg.fillRect(0, 0, 384, 384);
  bg.restore();

  bg.strokeStyle = '#181018'; bg.lineWidth = 8;
  bg.beginPath(); bg.arc(192, 192, 162, 0, Math.PI * 2); bg.stroke();

  // Red DANGER zone arc + sub-ticks + printed vintage serial number
  bg.strokeStyle = '#D4302C'; bg.lineWidth = 22;
  bg.beginPath(); bg.arc(192, 192, 126, -Math.PI * 0.28, Math.PI * 0.18); bg.stroke();
  bg.strokeStyle = '#1E1622'; bg.lineWidth = 4.5;
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI * 0.82 + (i / 24) * Math.PI * 1.36;
    const major = i % 2 === 0;
    bg.lineWidth = major ? 5 : 2.5;
    bg.beginPath();
    bg.moveTo(192 + Math.cos(a) * (major ? 112 : 124), 192 + Math.sin(a) * (major ? 112 : 124));
    bg.lineTo(192 + Math.cos(a) * 144, 192 + Math.sin(a) * 144);
    bg.stroke();
  }
  bg.fillStyle = '#241B1E';
  bg.font = '900 26px "DejaVu Sans", Arial, sans-serif';
  bg.textAlign = 'center';
  bg.fillText('FLUX kV', 192, 260);
  bg.font = '700 13px "DejaVu Sans", monospace';
  bg.fillStyle = 'rgba(42,32,26,0.72)';
  bg.fillText('MK-IV  NO. 0842-B', 192, 134);

  function update(level = 0.25) {
    g.clearRect(0, 0, 384, 384);
    g.drawImage(bgC, 0, 0);

    if (level > 0.72) {
      g.fillStyle = '#C82222';
      g.font = '900 28px "DejaVu Sans", Arial, sans-serif';
      g.textAlign = 'center';
      g.fillText('OVERLOAD', 192, 300);
    }

    // Animated needle w/ soft drop shadow on parchment face!
    const ang = Math.PI * 0.82 + Math.min(1.06, Math.max(0, level)) * Math.PI * 1.36;
    g.strokeStyle = 'rgba(20,12,18,0.34)'; g.lineWidth = 10; g.lineCap = 'round';
    g.beginPath(); g.moveTo(195, 197); g.lineTo(195 + Math.cos(ang) * 124, 197 + Math.sin(ang) * 124); g.stroke();
    g.strokeStyle = '#C62222'; g.lineWidth = 9;
    g.beginPath(); g.moveTo(192, 192); g.lineTo(192 + Math.cos(ang) * 124, 192 + Math.sin(ang) * 124); g.stroke();
    g.fillStyle = '#221A1E';
    g.beginPath(); g.arc(192, 192, 18, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#D4A44A';
    g.beginPath(); g.arc(192, 192, 8, 0, Math.PI * 2); g.fill();

    // Curved glass cover diagonal reflection sheen!
    g.save();
    g.beginPath(); g.arc(192, 192, 158, 0, Math.PI * 2); g.clip();
    const gl = g.createLinearGradient(60, 40, 290, 270);
    gl.addColorStop(0, 'rgba(255,255,255,0.28)');
    gl.addColorStop(0.28, 'rgba(255,255,255,0.08)');
    gl.addColorStop(0.32, 'rgba(255,255,255,0)');
    gl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gl;
    g.fillRect(0, 0, 384, 384);
    g.restore();

    tex.needsUpdate = true;
  }
  update(0.25);
  return { texture: tex, update };
}

// 7. Painted Wispy Cloud Twilight Sky Dome (exact Samurai twilight sky benchmark!)
export function makePaintedTwilightSkyDome(radius = 70) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const rng = mulberry32(707);

  const sky = g.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0.0, '#141B38');
  sky.addColorStop(0.38, '#28365E');
  sky.addColorStop(0.68, '#53648E');
  sky.addColorStop(0.84, '#8A899C');
  sky.addColorStop(0.92, '#C8987A');
  sky.addColorStop(1.0, '#2A2534');
  g.fillStyle = sky;
  g.fillRect(0, 0, 1024, 512);

  // Wispy horizontal twilight cloud strata
  for (let i = 0; i < 72; i++) {
    const cx = rng() * 1024;
    const cy = 55 + rng() * 310;
    const rx = 68 + rng() * 175;
    const ry = 10 + rng() * 26;
    const isLight = rng() > 0.44;
    g.save();
    g.translate(cx, cy);
    g.scale(1, ry / rx);
    const cg = g.createRadialGradient(0, 0, rx * 0.08, 0, 0, rx);
    cg.addColorStop(0, isLight ? 'rgba(195,205,232,0.22)' : 'rgba(18,24,48,0.38)');
    cg.addColorStop(1, 'rgba(30,36,68,0)');
    g.fillStyle = cg;
    g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  // Tiny subtle stars near zenith
  g.fillStyle = 'rgba(240,245,255,0.55)';
  for (let i = 0; i < 55; i++) {
    g.fillRect(rng() * 1024, rng() * 140, 2, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 18),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false })
  );
}

// 8. Mossy Carved Stone Rooftop / Battlement Slab Texture
export function makeStoneSlabTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  const rng = mulberry32(616);

  g.fillStyle = '#4B474E';
  g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) {
    const off = ((y / 64) % 2) * 48;
    for (let x = -64; x < 576; x += 96) {
      const v = Math.floor((rng() - 0.5) * 24);
      g.fillStyle = `rgb(${84 + v},${80 + v},${86 + v})`;
      g.fillRect(x + off + 3, y + 3, 90, 58);
      g.fillStyle = 'rgba(205,212,235,0.09)';
      g.fillRect(x + off + 3, y + 3, 90, 5);
    }
  }
  // Organic moss & weather patches
  for (let i = 0; i < 80; i++) {
    g.fillStyle = rng() > 0.65 ? 'rgba(58,86,54,0.22)' : 'rgba(26,24,34,0.16)';
    g.beginPath(); g.arc(rng() * 512, rng() * 512, 8 + rng() * 24, 0, Math.PI * 2); g.fill();
  }
  return toTex(c, { repeat: [3, 3] });
}

// 9. Jagged Scorched Energy Arrival Crater Texture (exact Samurai impact crack web benchmark!)
export function makeArrivalCraterTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  const rng = mulberry32(999);
  g.clearRect(0, 0, 512, 512);

  // Scorched dark ring + glowing cyan-gold center
  const bg = g.createRadialGradient(256, 256, 10, 256, 256, 230);
  bg.addColorStop(0.0, 'rgba(135,245,255,0.92)');
  bg.addColorStop(0.28, 'rgba(255,204,112,0.58)');
  bg.addColorStop(0.55, 'rgba(24,18,32,0.72)');
  bg.addColorStop(1.0, 'rgba(24,18,32,0)');
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 512);

  // 14 jagged radial fracture crack lines!
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + (rng() - 0.5) * 0.2;
    let cx = 256 + Math.cos(a) * 28, cy = 256 + Math.sin(a) * 28;
    g.strokeStyle = '#120E1C';
    g.lineWidth = 6;
    g.beginPath(); g.moveTo(cx, cy);
    for (let s = 1; s <= 5; s++) {
      const r = 28 + s * (34 + rng() * 14);
      const ja = a + (rng() - 0.5) * 0.25;
      cx = 256 + Math.cos(ja) * r;
      cy = 256 + Math.sin(ja) * r;
      g.lineTo(cx, cy);
    }
    g.stroke();
    // Bright cyan edge glow along inner cracks
    g.strokeStyle = 'rgba(155,245,255,0.75)';
    g.lineWidth = 2.5;
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 10. Instanced 3D Wind-Swept Dry Grass Tufts (450+ blades catching warm lantern & moon light!)
export function scatterInstancedGrassTufts(parent, {
  minX = -8, maxX = 8, minZ = -8, maxZ = 4,
  count = 460, excludeRadius = 1.9, baseColor = '#74644A', seed = 404,
} = {}) {
  const rng = mulberry32(seed);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    -0.026, 0.0, 0.0, 0.026, 0.0, 0.0, 0.012, 0.36, 0.05,
  ]), 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.88, side: THREE.DoubleSide });
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  let placed = 0, guard = 0;
  while (placed < count && guard < count * 8) {
    guard++;
    const x = minX + rng() * (maxX - minX);
    const z = minZ + rng() * (maxZ - minZ);
    if (Math.hypot(x, z) < excludeRadius && rng() < 0.92) continue;
    dummy.position.set(x, 0.0, z);
    dummy.rotation.set((rng() - 0.5) * 0.45, rng() * Math.PI * 2, (rng() - 0.5) * 0.45);
    const s = 0.7 + rng() * 1.25;
    dummy.scale.set(s, s * (0.85 + rng() * 0.8), s);
    dummy.updateMatrix();
    inst.setMatrixAt(placed++, dummy.matrix);
  }
  inst.count = placed;
  inst.instanceMatrix.needsUpdate = true;
  parent.add(inst);
  return inst;
}

// 11. True 3D Helical Copper Tesla Coil (Skill v3.0 Twisted Copper Strand PBR + Brushed Brass Caps!)
export function makeHelicalCopperCoil({ radius = 0.22, height = 1.65, turns = 16 } = {}) {
  const grp = new THREE.Group();
  const coreMat = makeBrushedMetalPBR({ baseHex: '#2E2733', darkHex: '#15111A', patinaAmt: 0.22, metalness: 0.42, roughness: 0.62, seed: 311 });
  const brassMat = makeBrushedMetalPBR({ baseHex: '#D4A048', darkHex: '#6A4416', patinaAmt: 0.18, metalness: 0.66, roughness: 0.36, seed: 312 });
  const copperMat = makeTwistedCoilPBR({ baseHex: '#D8723E', darkHex: '#54200E', repeat: [26, 2], seed: 313 });

  const core = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.76, radius * 0.76, height, 20), coreMat);
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.22, radius * 1.22, 0.10, 20), brassMat);
  capTop.position.y = height * 0.5;
  addInkOutlines(capTop, { thresholdDeg: 32, opacity: 0.65 });
  const capBot = capTop.clone();
  capBot.position.y = -height * 0.5;
  const finial = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.95, 0.055, 10, 24), brassMat);
  finial.rotation.x = Math.PI / 2;
  finial.position.y = height * 0.5 + 0.12;
  grp.add(core, capTop, capBot, finial);

  const pts = [];
  const segs = turns * 14;
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const ang = u * turns * Math.PI * 2;
    const y = -height * 0.44 + u * height * 0.88;
    pts.push(new THREE.Vector3(Math.cos(ang) * radius, y, Math.sin(ang) * radius));
  }
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segs, 0.022, 7, false), copperMat);
  grp.add(tube);
  return grp;
}

// 12. Directional Metallic & Quantum Streak Sparks System (Samurai f1200 benchmark!)
export function makeStreakSparksSystem(parent, count = 48, warmColor = [3.4, 2.3, 0.85], cyanColor = [1.4, 3.2, 3.8]) {
  const grp = new THREE.Group();
  const warmMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(...warmColor) });
  const cyanMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(...cyanColor) });
  const rng = mulberry32(1200);
  const items = [];
  for (let i = 0; i < count; i++) {
    const len = 0.16 + rng() * 0.34;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.016, len, 0.016), i % 3 === 0 ? cyanMat : warmMat);
    grp.add(m);
    items.push({
      mesh: m,
      vx: (rng() - 0.5) * 4.6,
      vy: 0.8 + rng() * 3.8,
      vz: (rng() - 0.5) * 3.2,
      seed: rng(),
    });
  }
  parent.add(grp);

  function update(origin, intensity, t) {
    grp.visible = intensity > 0.02;
    if (!grp.visible) return;
    for (const it of items) {
      const p = ((t * 1.9 + it.seed) % 1.0);
      const x = origin[0] + it.vx * p * intensity;
      const y = Math.max(0.04, origin[1] + it.vy * p - 4.0 * p * p);
      const z = origin[2] + it.vz * p * intensity;
      it.mesh.position.set(x, y, z);
      it.mesh.rotation.z = Math.atan2(-it.vx, it.vy - 8.0 * p);
      it.mesh.scale.setScalar(Math.max(0.02, (1 - p) * intensity));
    }
  }
  return { group: grp, update };
}
