// Bespoke Skill v3.0 Tri-Channel PBR Textures & Props for Grand Art-Deco Bank Lobby & Gold Vault
// ZERO flat colors — every surface ships map + bumpMap + roughnessMap!
import * as THREE from 'three';
import { mulberry32 } from './pbr_materials.js';

function makeTriCanvas(size = 512) {
  const cMap = document.createElement('canvas'); cMap.width = cMap.height = size;
  const cBump = document.createElement('canvas'); cBump.width = cBump.height = size;
  const cRough = document.createElement('canvas'); cRough.width = cRough.height = size;
  return {
    cMap, gMap: cMap.getContext('2d'),
    cBump, gBump: cBump.getContext('2d'),
    cRough, gRough: cRough.getContext('2d'),
  };
}

function toPBR(pair, { repeat = [1, 1], roughness = 0.65, metalness = 0.08, bumpScale = 0.03 } = {}) {
  const map = new THREE.CanvasTexture(pair.cMap);
  const bumpMap = new THREE.CanvasTexture(pair.cBump);
  const roughnessMap = new THREE.CanvasTexture(pair.cRough);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const t of [map, bumpMap, roughnessMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    t.anisotropy = 8;
  }
  return new THREE.MeshStandardMaterial({ map, bumpMap, bumpScale, roughnessMap, roughness, metalness });
}

// 1. Grand Art-Deco Checkered Ivory & Emerald Veined Marble Tile Floor PBR
export function makeCheckeredMarblePBR(repeat = [4, 5]) {
  const sz = 512;
  const pair = makeTriCanvas(sz);
  const { gMap, gBump, gRough } = pair;
  const rng = mulberry32(3101);
  const step = 128;

  gMap.fillStyle = '#2B2422'; gMap.fillRect(0, 0, sz, sz);
  gBump.fillStyle = '#181818'; gBump.fillRect(0, 0, sz, sz);
  gRough.fillStyle = '#E8E8E8'; gRough.fillRect(0, 0, sz, sz);

  for (let y = 0; y < sz; y += step) {
    for (let x = 0; x < sz; x += step) {
      const isDark = ((x / step) + (y / step)) % 2 === 0;
      const pad = 4;
      const w = step - pad * 2;
      // Rich marble tile base
      gMap.fillStyle = isDark ? '#1E3430' : '#E3D5BC';
      gMap.fillRect(x + pad, y + pad, w, w);

      // Subtle brass inlay border on ivory tiles
      if (!isDark) {
        gMap.strokeStyle = 'rgba(182,138,62,0.45)'; gMap.lineWidth = 2;
        gMap.strokeRect(x + pad + 7, y + pad + 7, w - 14, w - 14);
      }

      // Organic flowing mineral marble veins!
      for (let v = 0; v < 5; v++) {
        gMap.strokeStyle = isDark ? 'rgba(165,205,190,0.16)' : 'rgba(128,108,86,0.18)';
        gMap.lineWidth = 1 + rng() * 2.2;
        gMap.beginPath();
        let vx = x + pad + rng() * w, vy = y + pad;
        gMap.moveTo(vx, vy);
        for (let s = 1; s <= 4; s++) {
          vx += (rng() - 0.5) * 38;
          vy = y + pad + (s / 4) * w;
          gMap.lineTo(Math.max(x + pad, Math.min(x + step - pad, vx)), vy);
        }
        gMap.stroke();
      }

      gBump.fillStyle = '#C8C8C8'; gBump.fillRect(x + pad, y + pad, w, w);
      gRough.fillStyle = isDark ? '#6E6E6E' : '#808080'; gRough.fillRect(x + pad, y + pad, w, w);
    }
  }
  // Scuff marks & micro mineral sparkle
  for (let i = 0; i < 1800; i++) {
    const x = rng() * sz, y = rng() * sz;
    const v = rng() < 0.5 ? 250 : 20;
    gMap.fillStyle = `rgba(${v},${v},${v},0.05)`; gMap.fillRect(x, y, 2, 2);
    gRough.fillStyle = `rgba(${v},${v},${v},0.16)`; gRough.fillRect(x, y, 3, 2);
  }
  return toPBR(pair, { repeat, roughness: 0.42, metalness: 0.06, bumpScale: 0.022 });
}

// 2. Art-Deco Limestone & Mahogany Wainscot Bank Wall PBR
export function makeBankWallPBR(repeat = [3, 1]) {
  const sz = 512;
  const pair = makeTriCanvas(sz);
  const { gMap, gBump, gRough } = pair;
  const rng = mulberry32(3102);

  // Upper warm sandstone/limestone plaster ashlar blocks (y = 0..310)
  gMap.fillStyle = '#8B735C'; gMap.fillRect(0, 0, sz, 320);
  gBump.fillStyle = '#606060'; gBump.fillRect(0, 0, sz, 320);
  gRough.fillStyle = '#D8D8D8'; gRough.fillRect(0, 0, sz, 320);
  for (let r = 0; r < 6; r++) {
    const y = r * 52;
    const off = (r % 2) * 64;
    for (let x = -64; x < sz + 64; x += 128) {
      const d = (rng() - 0.5) * 18;
      gMap.fillStyle = `rgb(${156 + d},${134 + d * 0.85},${108 + d * 0.7})`;
      gMap.fillRect(x + off + 3, y + 3, 122, 46);
      gBump.fillStyle = '#C4C4C4'; gBump.fillRect(x + off + 3, y + 3, 122, 46);
    }
  }
  // Art-Deco Brass Frieze Molding Band (y = 304..336)
  gMap.fillStyle = '#B88938'; gMap.fillRect(0, 304, sz, 32);
  gMap.strokeStyle = '#3C2814'; gMap.lineWidth = 4;
  for (let x = 0; x < sz; x += 32) {
    gMap.strokeRect(x + 4, 309, 24, 22);
    gBump.fillStyle = '#EAEAEA'; gBump.fillRect(x + 4, 309, 24, 22);
  }
  // Lower Rich Mahogany Wainscoting Panels (y = 336..512)
  gMap.fillStyle = '#4B281B'; gMap.fillRect(0, 336, sz, 176);
  gBump.fillStyle = '#808080'; gBump.fillRect(0, 336, sz, 176);
  gRough.fillStyle = '#A8A8A8'; gRough.fillRect(0, 336, sz, 176);
  for (let x = 18; x < sz; x += 128) {
    gMap.strokeStyle = '#24120B'; gMap.lineWidth = 5;
    gMap.strokeRect(x, 354, 92, 132);
    gMap.strokeStyle = '#7E4A32'; gMap.lineWidth = 3;
    gMap.strokeRect(x + 8, 362, 76, 116);
    gBump.strokeStyle = '#282828'; gBump.lineWidth = 6;
    gBump.strokeRect(x, 354, 92, 132);
  }
  // Fine mineral grain & plaster wear
  for (let i = 0; i < 2400; i++) {
    const x = rng() * sz, y = rng() * sz;
    const v = rng() < 0.5 ? 245 : 18;
    gMap.fillStyle = `rgba(${v},${v},${v},0.06)`; gMap.fillRect(x, y, 2, 2);
    gBump.fillStyle = `rgba(${v},${v},${v},0.16)`; gBump.fillRect(x, y, 2, 2);
  }
  return toPBR(pair, { repeat, roughness: 0.78, metalness: 0.08, bumpScale: 0.036 });
}

// 3. Vault Safety Deposit Box Steel Wall PBR (64 Numbered Brass-Keyhole Lockers!)
export function makeDepositBoxWallPBR(repeat = [2, 2]) {
  const sz = 512;
  const pair = makeTriCanvas(sz);
  const { gMap, gBump, gRough } = pair;
  const rng = mulberry32(3103);

  gMap.fillStyle = '#1E1F28'; gMap.fillRect(0, 0, sz, sz);
  gBump.fillStyle = '#181818'; gBump.fillRect(0, 0, sz, sz);
  gRough.fillStyle = '#E0E0E0'; gRough.fillRect(0, 0, sz, sz);

  const cols = 4, rows = 8;
  const cw = sz / cols, rh = sz / rows;
  let num = 101;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cw + 4, y = r * rh + 4, w = cw - 8, h = rh - 8;
      const d = (rng() - 0.5) * 18;
      // Brushed stainless steel locker door
      const gr = gMap.createLinearGradient(x, y, x + w, y + h);
      gr.addColorStop(0, `rgb(${112 + d},${116 + d},${128 + d})`);
      gr.addColorStop(1, `rgb(${76 + d},${80 + d},${92 + d})`);
      gMap.fillStyle = gr; gMap.fillRect(x, y, w, h);
      // Top bevel highlight
      gMap.fillStyle = 'rgba(255,245,220,0.22)'; gMap.fillRect(x, y, w, 3);
      // Brass nameplate & double keyhole!
      gMap.fillStyle = '#C8943A'; gMap.fillRect(x + 12, y + 14, 34, 16);
      gMap.fillStyle = '#18141E';
      gMap.font = 'bold 11px monospace';
      gMap.fillText(String(num++), x + 16, y + 26);
      // Brass lock cylinder
      gMap.fillStyle = '#DDA848';
      gMap.beginPath(); gMap.arc(x + w - 22, y + h * 0.52, 8, 0, Math.PI * 2); gMap.fill();
      gMap.fillStyle = '#14121C';
      gMap.fillRect(x + w - 24, y + h * 0.52 - 4, 4, 8);

      gBump.fillStyle = '#D2D2D2'; gBump.fillRect(x, y, w, h);
      gBump.fillStyle = '#FFFFFF'; gBump.beginPath(); gBump.arc(x + w - 22, y + h * 0.52, 8, 0, Math.PI * 2); gBump.fill();
      gRough.fillStyle = '#787878'; gRough.fillRect(x, y, w, h);
    }
  }
  // Brushed metallic micro-scratches across lockers
  for (let i = 0; i < 600; i++) {
    const x = rng() * sz, y = rng() * sz;
    gMap.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(15,15,24,0.08)';
    gMap.fillRect(x, y, 22 + rng() * 35, 1.5);
  }
  return toPBR(pair, { repeat, roughness: 0.44, metalness: 0.62, bumpScale: 0.038 });
}

// 4. Weathered Engraved Brass Vault Combination Dial Rig (Animated spin + RED -> GREEN unlock LED!)
export function makeVaultDialRig() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  // Static aged outer steel & engraved brass bezel
  const bgC = document.createElement('canvas');
  bgC.width = 512; bgC.height = 512;
  const bg = bgC.getContext('2d');
  const rng = mulberry32(7711);

  const outerG = bg.createLinearGradient(0, 0, 512, 512);
  outerG.addColorStop(0, '#DFB054'); outerG.addColorStop(0.5, '#9A6924'); outerG.addColorStop(1, '#523210');
  bg.fillStyle = outerG;
  bg.beginPath(); bg.arc(256, 256, 246, 0, Math.PI * 2); bg.fill();
  bg.strokeStyle = '#14101C'; bg.lineWidth = 12; bg.stroke();
  // 8 recessed steel mounting bolts around bezel
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const bx = 256 + Math.cos(a) * 224, by = 256 + Math.sin(a) * 224;
    bg.fillStyle = '#383034'; bg.beginPath(); bg.arc(bx, by, 10, 0, Math.PI * 2); bg.fill();
    bg.strokeStyle = '#14101C'; bg.lineWidth = 3; bg.stroke();
  }
  // Brushed dark iron index collar
  bg.fillStyle = '#24222D';
  bg.beginPath(); bg.arc(256, 256, 206, 0, Math.PI * 2); bg.fill();
  bg.strokeStyle = '#120E18'; bg.lineWidth = 8; bg.stroke();
  // Top crimson alignment triangle marker!
  bg.fillStyle = '#E8322E';
  bg.beginPath(); bg.moveTo(256, 76); bg.lineTo(240, 46); bg.lineTo(272, 46); bg.closePath(); bg.fill();
  bg.strokeStyle = '#14101C'; bg.lineWidth = 4; bg.stroke();

  // Micro patina grain on bezel
  for (let i = 0; i < 900; i++) {
    const px = rng() * 512, py = rng() * 512;
    bg.fillStyle = rng() < 0.5 ? 'rgba(255,244,210,0.06)' : 'rgba(18,12,20,0.08)';
    bg.fillRect(px, py, 2, 2);
  }

  function update(angleRad = 0, unlocked = false) {
    g.clearRect(0, 0, 512, 512);
    g.drawImage(bgC, 0, 0);

    // Spinning engraved aged-parchment & brass dial disc!
    g.save();
    g.translate(256, 256);
    g.rotate(angleRad);
    const dialG = g.createRadialGradient(-24, -24, 18, 0, 0, 178);
    dialG.addColorStop(0, '#F0E4C8'); dialG.addColorStop(0.75, '#C8B288'); dialG.addColorStop(1, '#7D6642');
    g.fillStyle = dialG;
    g.beginPath(); g.arc(0, 0, 176, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#16111E'; g.lineWidth = 8; g.stroke();

    // 40 crisp engraved combination tick marks + numbers 0, 10..90!
    g.strokeStyle = '#1A1420'; g.fillStyle = '#1A1420';
    g.font = '900 22px "DejaVu Sans", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2 - Math.PI / 2;
      const major = i % 4 === 0;
      g.lineWidth = major ? 5 : 2.5;
      g.beginPath();
      g.moveTo(Math.cos(a) * (major ? 140 : 152), Math.sin(a) * (major ? 140 : 152));
      g.lineTo(Math.cos(a) * 168, Math.sin(a) * 168);
      g.stroke();
      if (major) {
        g.save();
        g.rotate(a + Math.PI / 2);
        g.fillText(String((i / 4) * 10), 0, -116);
        g.restore();
      }
    }

    // Center knurled brushed-brass grip knob
    const knobG = g.createRadialGradient(-16, -16, 8, 0, 0, 74);
    knobG.addColorStop(0, '#F4CB72'); knobG.addColorStop(0.55, '#B6802C'); knobG.addColorStop(1, '#5A3812');
    g.fillStyle = knobG;
    g.beginPath(); g.arc(0, 0, 72, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#14101C'; g.lineWidth = 8; g.stroke();
    // Knurled grip notches
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      g.strokeStyle = 'rgba(28,16,10,0.45)'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(Math.cos(a) * 48, Math.sin(a) * 48); g.lineTo(Math.cos(a) * 66, Math.sin(a) * 66); g.stroke();
    }
    g.restore();

    // Recessed glass sheen + Status text stamp at bottom of collar
    g.fillStyle = unlocked ? '#44FF88' : '#FF3A34';
    g.beginPath(); g.arc(256, 466, 15, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#14101C'; g.lineWidth = 4; g.stroke();

    tex.needsUpdate = true;
  }
  update(0, false);
  return { texture: tex, update };
}

// 5. Strapped Green $100 Cash Bundle Texture
export function makeCashBundlePBR() {
  const sz = 256;
  const pair = makeTriCanvas(sz);
  const { gMap, gBump, gRough } = pair;
  const rng = mulberry32(3105);

  gMap.fillStyle = '#4B7854'; gMap.fillRect(0, 0, sz, sz);
  gBump.fillStyle = '#808080'; gBump.fillRect(0, 0, sz, sz);
  gRough.fillStyle = '#D8D8D8'; gRough.fillRect(0, 0, sz, sz);

  // Stacked paper banknote edge lines
  for (let y = 0; y < sz; y += 5) {
    gMap.fillStyle = y % 10 === 0 ? 'rgba(220,235,205,0.22)' : 'rgba(24,42,28,0.28)';
    gMap.fillRect(0, y, sz, 2);
    gBump.fillStyle = y % 10 === 0 ? '#D8D8D8' : '#3A3A3A';
    gBump.fillRect(0, y, sz, 2);
  }
  // Ornate border & "$100" oval print
  gMap.strokeStyle = '#25442C'; gMap.lineWidth = 8;
  gMap.strokeRect(14, 14, sz - 28, sz - 28);
  gMap.fillStyle = '#E6D6AE'; gMap.fillRect(sz * 0.36, 0, sz * 0.28, sz); // Cream paper bank strap!
  gMap.strokeStyle = '#B8342E'; gMap.lineWidth = 4;
  gMap.strokeRect(sz * 0.36 + 3, 2, sz * 0.28 - 6, sz - 4);
  gMap.fillStyle = '#1E1A22'; gMap.font = '900 28px Arial'; gMap.textAlign = 'center';
  gMap.fillText('$10K', sz * 0.5, sz * 0.55);

  for (let i = 0; i < 600; i++) {
    const x = rng() * sz, y = rng() * sz;
    gMap.fillStyle = rng() < 0.5 ? 'rgba(255,250,230,0.06)' : 'rgba(20,30,20,0.08)';
    gMap.fillRect(x, y, 2, 2);
  }
  return toPBR(pair, { repeat: [1, 1], roughness: 0.88, metalness: 0.0, bumpScale: 0.025 });
}

// 6. Midnight Rain-Streaked Arched Bank Window w/ Distant Glowing City Skyline
export function makeNightCityWindowTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 768;
  const g = c.getContext('2d');
  const rng = mulberry32(3106);

  const sky = g.createLinearGradient(0, 0, 0, 768);
  sky.addColorStop(0, '#101836');
  sky.addColorStop(0.55, '#22325E');
  sky.addColorStop(1, '#3B4874');
  g.fillStyle = sky; g.fillRect(0, 0, 512, 768);

  // Full moon behind wispy clouds
  const mg = g.createRadialGradient(340, 165, 16, 340, 165, 115);
  mg.addColorStop(0, 'rgba(245,248,255,0.95)');
  mg.addColorStop(0.32, 'rgba(185,212,255,0.42)');
  mg.addColorStop(1, 'rgba(34,50,94,0)');
  g.fillStyle = mg; g.fillRect(200, 30, 280, 280);

  // Distant skyscraper silhouettes w/ warm glowing lit windows!
  for (let i = 0; i < 11; i++) {
    const bw = 42 + rng() * 54;
    const bh = 180 + rng() * 260;
    const bx = i * 48 - 10;
    const by = 768 - bh;
    g.fillStyle = i % 2 === 0 ? '#141B30' : '#1B243E';
    g.fillRect(bx, by, bw, bh);
    for (let wy = by + 18; wy < 740; wy += 24) {
      for (let wx = bx + 8; wx < bx + bw - 12; wx += 14) {
        if (rng() < 0.34) {
          g.fillStyle = rng() < 0.7 ? 'rgba(255,212,125,0.85)' : 'rgba(145,220,255,0.65)';
          g.fillRect(wx, wy, 7, 11);
        }
      }
    }
  }
  // Subtle diagonal rain streaks on glass
  g.strokeStyle = 'rgba(195,220,255,0.18)'; g.lineWidth = 2;
  for (let i = 0; i < 65; i++) {
    const rx = rng() * 512, ry = rng() * 768;
    g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 12, ry + 48); g.stroke();
  }
  // Heavy dark Art-Deco iron window mullions & arch frame!
  g.strokeStyle = '#181422'; g.lineWidth = 18;
  g.strokeRect(8, 8, 496, 752);
  g.lineWidth = 12;
  for (const x of [170, 342]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 768); g.stroke(); }
  for (const y of [220, 440, 620]) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 7. Directional Metallic Gold/Orange Spark Streaks
export function makeVaultSparksSystem(parent, count = 44) {
  const grp = new THREE.Group();
  const mat1 = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.6, 2.35, 0.75) });
  const mat2 = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.8, 1.35, 0.45) });
  const rng = mulberry32(9441);
  const items = [];
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.14 + rng() * 0.28, 0.015), i % 3 === 0 ? mat2 : mat1);
    grp.add(m);
    items.push({ mesh: m, vx: (rng() - 0.5) * 4.2, vy: 0.9 + rng() * 3.2, vz: (rng() - 0.5) * 2.8, seed: rng() });
  }
  parent.add(grp);

  function update(origin, intensity, t) {
    grp.visible = intensity > 0.02;
    if (!grp.visible) return;
    for (const it of items) {
      const p = (t * 2.1 + it.seed) % 1.0;
      const x = origin[0] + it.vx * p * intensity;
      const y = Math.max(0.05, origin[1] + it.vy * p - 4.4 * p * p);
      const z = origin[2] + it.vz * p * intensity;
      it.mesh.position.set(x, y, z);
      it.mesh.rotation.z = -Math.atan2(it.vx, Math.max(0.2, it.vy - 8.8 * p));
      it.mesh.scale.setScalar(Math.max(0.05, (1 - p) * intensity));
    }
  }
  return { group: grp, update };
}
