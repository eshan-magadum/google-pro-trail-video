// Tactile Procedural Tri-Channel PBR Materials (map + bumpMap + roughnessMap),
// Blender-Freestyle 3D Ink Outlines, & Painterly Character Shading Helpers (Skill v3.0 Standard).
// RULE: NEVER leave any hero or midground 3D mesh with a flat solid-color MeshStandardMaterial({ color })!
import * as THREE from 'three';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbStr(r, g, b, a = 1) {
  const cr = Math.max(0, Math.min(255, Math.round(r)));
  const cg = Math.max(0, Math.min(255, Math.round(g)));
  const cb = Math.max(0, Math.min(255, Math.round(b)));
  return a >= 1 ? `rgb(${cr},${cg},${cb})` : `rgba(${cr},${cg},${cb},${a.toFixed(3)})`;
}

function makeCanvasPair(size = 512) {
  const cMap = document.createElement('canvas'); cMap.width = cMap.height = size;
  const cBump = document.createElement('canvas'); cBump.width = cBump.height = size;
  const cRough = document.createElement('canvas'); cRough.width = cRough.height = size;
  return {
    cMap, gMap: cMap.getContext('2d'),
    cBump, gBump: cBump.getContext('2d'),
    cRough, gRough: cRough.getContext('2d'),
  };
}

function finalizePBRTextures(pair, { repeat = [1, 1], wrap = true } = {}) {
  const map = new THREE.CanvasTexture(pair.cMap);
  const bumpMap = new THREE.CanvasTexture(pair.cBump);
  const roughnessMap = new THREE.CanvasTexture(pair.cRough);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const t of [map, bumpMap, roughnessMap]) {
    if (wrap) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
    }
    t.anisotropy = 8;
  }
  return { map, bumpMap, roughnessMap };
}

function paintEdgeAO(g, size, strength = 0.22, width = 34) {
  const grL = g.createLinearGradient(0, 0, width, 0);
  grL.addColorStop(0, `rgba(14,10,18,${strength})`); grL.addColorStop(1, 'rgba(14,10,18,0)');
  g.fillStyle = grL; g.fillRect(0, 0, width, size);
  const grR = g.createLinearGradient(size, 0, size - width, 0);
  grR.addColorStop(0, `rgba(14,10,18,${strength})`); grR.addColorStop(1, 'rgba(14,10,18,0)');
  g.fillStyle = grR; g.fillRect(size - width, 0, width, size);
  const grT = g.createLinearGradient(0, 0, 0, width);
  grT.addColorStop(0, `rgba(14,10,18,${strength})`); grT.addColorStop(1, 'rgba(14,10,18,0)');
  g.fillStyle = grT; g.fillRect(0, 0, size, width);
  const grB = g.createLinearGradient(0, size, 0, size - width);
  grB.addColorStop(0, `rgba(14,10,18,${strength})`); grB.addColorStop(1, 'rgba(14,10,18,0)');
  g.fillStyle = grB; g.fillRect(0, size - width, size, width);
}

// -----------------------------------------------------------------------------
// 1. WEATHERED WOOD PBR (map + bumpMap + roughnessMap)
// Use for: workbenches, crates, beams, lantern posts, barrels, stools, spools!
// -----------------------------------------------------------------------------
export function makeWoodPBR({
  baseHex = '#7B4C32',
  darkHex = '#462819',
  planks = 5,
  knots = 6,
  roughness = 0.80,
  bumpScale = 0.032,
  repeat = [1, 1],
  seed = 101,
  size = 512,
} = {}) {
  const rng = mulberry32(seed);
  const pair = makeCanvasPair(size);
  const { gMap, gBump, gRough } = pair;
  const [br, bg, bb] = hexToRgb(baseHex);
  const [dr, dg, db] = hexToRgb(darkHex);

  gMap.fillStyle = baseHex; gMap.fillRect(0, 0, size, size);
  gBump.fillStyle = '#808080'; gBump.fillRect(0, 0, size, size);
  gRough.fillStyle = '#C8C8C8'; gRough.fillRect(0, 0, size, size);

  const ph = size / planks;
  for (let p = 0; p < planks; p++) {
    const y0 = p * ph;
    const shade = (rng() - 0.5) * 28;
    gMap.fillStyle = rgbStr(br + shade, bg + shade * 0.75, bb + shade * 0.6);
    gMap.fillRect(0, y0, size, ph);

    // Rich organic wood grain fibers + matching bump grooves & specular sheen variation
    for (let s = 0; s < 36; s++) {
      const fy = y0 + rng() * ph;
      const amp = 1.5 + rng() * 3.8;
      const freq = 0.012 + rng() * 0.025;
      const phase = rng() * 6.28;
      const isDark = rng() < 0.65;
      gMap.strokeStyle = isDark ? rgbStr(dr, dg, db, 0.24 + rng() * 0.26) : rgbStr(br + 34, bg + 26, bb + 18, 0.18);
      gMap.lineWidth = 1 + rng() * 2.4;
      gBump.strokeStyle = isDark ? 'rgba(55,55,55,0.45)' : 'rgba(185,185,185,0.35)';
      gBump.lineWidth = gMap.lineWidth;
      gRough.strokeStyle = isDark ? 'rgba(235,235,235,0.45)' : 'rgba(155,155,155,0.35)';
      gRough.lineWidth = gMap.lineWidth;

      for (const gg of [gMap, gBump, gRough]) {
        gg.beginPath();
        for (let x = 0; x <= size; x += 24) {
          const yy = fy + Math.sin(x * freq + phase) * amp;
          if (x === 0) gg.moveTo(x, yy); else gg.lineTo(x, yy);
        }
        gg.stroke();
      }
    }

    // Plank bevel seam & AO
    gMap.fillStyle = rgbStr(dr * 0.5, dg * 0.5, db * 0.5, 0.85);
    gMap.fillRect(0, y0, size, 3.5);
    gBump.fillStyle = '#181818'; gBump.fillRect(0, y0, size, 4);
    gRough.fillStyle = '#F2F2F2'; gRough.fillRect(0, y0, size, 5);
  }

  // Concentric wood knots & subtle nail heads
  for (let k = 0; k < knots; k++) {
    const kx = 40 + rng() * (size - 80);
    const ky = 30 + rng() * (size - 60);
    const kr = 8 + rng() * 14;
    for (let r = kr; r > 2; r -= 3.5) {
      gMap.strokeStyle = rgbStr(dr, dg, db, 0.35); gMap.lineWidth = 2;
      gMap.beginPath(); gMap.ellipse(kx, ky, r * 1.4, r * 0.7, (rng() - 0.5) * 0.3, 0, Math.PI * 2); gMap.stroke();
      gBump.strokeStyle = 'rgba(40,40,40,0.45)'; gBump.lineWidth = 2;
      gBump.beginPath(); gBump.ellipse(kx, ky, r * 1.4, r * 0.7, 0, 0, Math.PI * 2); gBump.stroke();
    }
  }

  // Fine surface sawdust/pore speckle + subtle edge AO
  for (let i = 0; i < 1600; i++) {
    const x = rng() * size, y = rng() * size;
    const v = rng() < 0.5 ? 255 : 0;
    gMap.fillStyle = `rgba(${v},${v},${v},0.045)`; gMap.fillRect(x, y, 2, 2);
    gBump.fillStyle = `rgba(${v},${v},${v},0.12)`; gBump.fillRect(x, y, 2, 2);
  }
  paintEdgeAO(gMap, size, 0.20, 26);

  const tex = finalizePBRTextures(pair, { repeat });
  return new THREE.MeshStandardMaterial({
    map: tex.map,
    bumpMap: tex.bumpMap,
    bumpScale,
    roughnessMap: tex.roughnessMap,
    roughness,
    metalness: 0.04,
  });
}

// -----------------------------------------------------------------------------
// 2. BRUSHED & RIVETED METAL PBR (Brass, Copper, Cast Iron — map + bump + rough)
// Use for: teleporter dome/pillars, console body/deck, gauge housing, pipes!
// -----------------------------------------------------------------------------
export function makeBrushedMetalPBR({
  baseHex = '#D29B42',
  darkHex = '#6C4518',
  patinaHex = '#3E5E52',
  patinaAmt = 0.14,
  rivets = false,
  panelSeams = false,
  metalness = 0.62,
  roughness = 0.42,
  bumpScale = 0.026,
  repeat = [1, 1],
  seed = 202,
  size = 512,
} = {}) {
  const rng = mulberry32(seed);
  const pair = makeCanvasPair(size);
  const { gMap, gBump, gRough } = pair;
  const [br, bg, bb] = hexToRgb(baseHex);
  const [dr, dg, db] = hexToRgb(darkHex);
  const [pr, pg, pb] = hexToRgb(patinaHex);

  gMap.fillStyle = baseHex; gMap.fillRect(0, 0, size, size);
  gBump.fillStyle = '#808080'; gBump.fillRect(0, 0, size, size);
  gRough.fillStyle = '#929292'; gRough.fillRect(0, 0, size, size);

  // Subtle hammered/mottled patina & oxidation clouds
  for (let i = 0; i < 48; i++) {
    const x = rng() * size, y = rng() * size, r = 28 + rng() * 90;
    const isPatina = rng() < patinaAmt;
    const gr = gMap.createRadialGradient(x, y, 4, x, y, r);
    gr.addColorStop(0, isPatina ? rgbStr(pr, pg, pb, 0.24) : rgbStr(dr, dg, db, 0.20));
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    gMap.fillStyle = gr; gMap.fillRect(x - r, y - r, r * 2, r * 2);

    const grR = gRough.createRadialGradient(x, y, 4, x, y, r);
    grR.addColorStop(0, isPatina ? 'rgba(235,235,235,0.45)' : 'rgba(195,195,195,0.32)');
    grR.addColorStop(1, 'rgba(145,145,145,0)');
    gRough.fillStyle = grR; gRough.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Horizontal spun/brushed lathe micro-scratches (exact EMHAP brass lamp DNA!)
  for (let i = 0; i < 420; i++) {
    const y = rng() * size;
    const x0 = rng() * size;
    const len = 45 + rng() * 240;
    const bright = rng() < 0.5;
    gMap.strokeStyle = bright ? rgbStr(br + 48, bg + 42, bb + 32, 0.16) : rgbStr(dr, dg, db, 0.18);
    gMap.lineWidth = 0.8 + rng() * 1.4;
    gMap.beginPath(); gMap.moveTo(x0, y); gMap.lineTo(x0 + len, y + (rng() - 0.5) * 2); gMap.stroke();

    gBump.strokeStyle = bright ? 'rgba(185,185,185,0.34)' : 'rgba(65,65,65,0.34)';
    gBump.lineWidth = gMap.lineWidth;
    gBump.beginPath(); gBump.moveTo(x0, y); gBump.lineTo(x0 + len, y); gBump.stroke();

    gRough.strokeStyle = bright ? 'rgba(95,95,95,0.32)' : 'rgba(190,190,190,0.32)';
    gRough.lineWidth = gMap.lineWidth;
    gRough.beginPath(); gRough.moveTo(x0, y); gRough.lineTo(x0 + len, y); gRough.stroke();
  }

  // Optional bolted industrial steel/iron panel seams & raised rivets!
  if (panelSeams) {
    gMap.strokeStyle = rgbStr(dr * 0.45, dg * 0.45, db * 0.45, 0.85);
    gMap.lineWidth = 5;
    gMap.strokeRect(18, 18, size - 36, size - 36);
    gMap.beginPath(); gMap.moveTo(18, size * 0.5); gMap.lineTo(size - 18, size * 0.5); gMap.stroke();
    gMap.strokeStyle = rgbStr(br + 44, bg + 40, bb + 36, 0.35);
    gMap.lineWidth = 2;
    gMap.strokeRect(23, 23, size - 46, size - 46);

    gBump.strokeStyle = '#181818'; gBump.lineWidth = 6;
    gBump.strokeRect(18, 18, size - 36, size - 36);
    gBump.beginPath(); gBump.moveTo(18, size * 0.5); gBump.lineTo(size - 18, size * 0.5); gBump.stroke();
  }

  if (rivets) {
    const pts = [];
    for (let x = 36; x <= size - 36; x += 64) {
      pts.push([x, 36], [x, size - 36], [x, size * 0.5 - 16], [x, size * 0.5 + 16]);
    }
    for (let y = 100; y <= size - 100; y += 64) {
      pts.push([36, y], [size - 36, y]);
    }
    for (const [rx, ry] of pts) {
      gMap.fillStyle = rgbStr(dr * 0.55, dg * 0.55, db * 0.55, 0.9);
      gMap.beginPath(); gMap.arc(rx + 2, ry + 3, 7, 0, Math.PI * 2); gMap.fill();
      gMap.fillStyle = rgbStr(br + 24, bg + 20, bb + 16, 0.95);
      gMap.beginPath(); gMap.arc(rx, ry, 6.2, 0, Math.PI * 2); gMap.fill();
      gMap.fillStyle = 'rgba(255,244,220,0.45)';
      gMap.beginPath(); gMap.arc(rx - 2, ry - 2, 2.2, 0, Math.PI * 2); gMap.fill();

      gBump.fillStyle = '#F2F2F2';
      gBump.beginPath(); gBump.arc(rx, ry, 6.5, 0, Math.PI * 2); gBump.fill();
      gRough.fillStyle = '#606060';
      gRough.beginPath(); gBump.arc(rx, ry, 6.5, 0, Math.PI * 2); gRough.fill();
    }
  }

  // Micro-speckle & edge-wear AO
  for (let i = 0; i < 1400; i++) {
    const x = rng() * size, y = rng() * size;
    const v = rng() < 0.5 ? 255 : 0;
    gMap.fillStyle = `rgba(${v},${v},${v},0.05)`; gMap.fillRect(x, y, 2, 2);
    gBump.fillStyle = `rgba(${v},${v},${v},0.14)`; gBump.fillRect(x, y, 2, 2);
  }
  paintEdgeAO(gMap, size, 0.24, 30);

  const tex = finalizePBRTextures(pair, { repeat });
  return new THREE.MeshStandardMaterial({
    map: tex.map,
    bumpMap: tex.bumpMap,
    bumpScale,
    roughnessMap: tex.roughnessMap,
    roughness,
    metalness,
  });
}

// -----------------------------------------------------------------------------
// 3. TWISTED COPPER WIRE / BRAIDED HEMP ROPE PBR (Exact Samurai Spool Macro DNA!)
// -----------------------------------------------------------------------------
export function makeTwistedCoilPBR({
  baseHex = '#D26E3C',
  darkHex = '#5A2410',
  metalness = 0.68,
  roughness = 0.36,
  bumpScale = 0.045,
  repeat = [12, 2],
  seed = 303,
  size = 256,
} = {}) {
  const rng = mulberry32(seed);
  const pair = makeCanvasPair(size);
  const { gMap, gBump, gRough } = pair;
  const [br, bg, bb] = hexToRgb(baseHex);
  const [dr, dg, db] = hexToRgb(darkHex);

  gMap.fillStyle = baseHex; gMap.fillRect(0, 0, size, size);
  gBump.fillStyle = '#707070'; gBump.fillRect(0, 0, size, size);
  gRough.fillStyle = '#909090'; gRough.fillRect(0, 0, size, size);

  // Diagonal twisted strand ridges
  const step = 28;
  for (let i = -size; i < size * 2; i += step) {
    // Crevice shadow
    gMap.strokeStyle = rgbStr(dr, dg, db, 0.72); gMap.lineWidth = 7;
    gMap.beginPath(); gMap.moveTo(i, 0); gMap.lineTo(i + size, size); gMap.stroke();
    // Bright copper/fiber crown
    gMap.strokeStyle = rgbStr(br + 48, bg + 34, bb + 20, 0.55); gMap.lineWidth = 5;
    gMap.beginPath(); gMap.moveTo(i + 9, 0); gMap.lineTo(i + 9 + size, size); gMap.stroke();

    gBump.strokeStyle = '#181818'; gBump.lineWidth = 8;
    gBump.beginPath(); gBump.moveTo(i, 0); gBump.lineTo(i + size, size); gBump.stroke();
    gBump.strokeStyle = '#F0F0F0'; gBump.lineWidth = 8;
    gBump.beginPath(); gBump.moveTo(i + 12, 0); gBump.lineTo(i + 12 + size, size); gBump.stroke();

    gRough.strokeStyle = '#E8E8E8'; gRough.lineWidth = 8;
    gRough.beginPath(); gRough.moveTo(i, 0); gRough.lineTo(i + size, size); gRough.stroke();
    gRough.strokeStyle = '#555555'; gRough.lineWidth = 8;
    gRough.beginPath(); gRough.moveTo(i + 12, 0); gRough.lineTo(i + 12 + size, size); gRough.stroke();
  }

  for (let i = 0; i < 650; i++) {
    const x = rng() * size, y = rng() * size;
    const v = rng() < 0.5 ? 255 : 0;
    gMap.fillStyle = `rgba(${v},${v},${v},0.06)`; gMap.fillRect(x, y, 2, 2);
  }

  const tex = finalizePBRTextures(pair, { repeat });
  return new THREE.MeshStandardMaterial({
    map: tex.map,
    bumpMap: tex.bumpMap,
    bumpScale,
    roughnessMap: tex.roughnessMap,
    roughness,
    metalness,
  });
}

// -----------------------------------------------------------------------------
// 4. WEATHERED CARVED STONE & MOSSY MASONRY PBR (map + bumpMap + roughnessMap)
// -----------------------------------------------------------------------------
export function makeWeatheredStonePBR({
  baseHex = '#5B5968',
  mortarHex = '#23222E',
  mossAmt = 0.25,
  rows = 6,
  cols = 4,
  roughness = 0.90,
  bumpScale = 0.048,
  repeat = [2, 2],
  seed = 404,
  size = 512,
} = {}) {
  const rng = mulberry32(seed);
  const pair = makeCanvasPair(size);
  const { gMap, gBump, gRough } = pair;
  const [br, bg, bb] = hexToRgb(baseHex);

  gMap.fillStyle = mortarHex; gMap.fillRect(0, 0, size, size);
  gBump.fillStyle = '#181818'; gBump.fillRect(0, 0, size, size);
  gRough.fillStyle = '#F0F0F0'; gRough.fillRect(0, 0, size, size);

  const rh = size / rows, cw = size / cols;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * cw + off + 4;
      const y = r * rh + 4;
      const w = cw - 8, h = rh - 8;
      const d = (rng() - 0.5) * 26;
      gMap.fillStyle = rgbStr(br + d, bg + d * 0.95, bb + d * 1.05);
      gMap.fillRect(x, y, w, h);

      // Stone chiseled top highlight & bottom shadow bevel
      gMap.fillStyle = 'rgba(220,225,245,0.14)'; gMap.fillRect(x, y, w, 4);
      gMap.fillStyle = 'rgba(12,10,20,0.32)'; gMap.fillRect(x, y + h - 5, w, 5);

      gBump.fillStyle = rgbStr(150 + d, 150 + d, 150 + d);
      gBump.fillRect(x, y, w, h);
      gRough.fillStyle = rgbStr(185 + d * 0.8, 185 + d * 0.8, 185 + d * 0.8);
      gRough.fillRect(x, y, w, h);

      // Mossy patches clinging to crevices
      if (rng() < mossAmt) {
        gMap.fillStyle = 'rgba(54,84,56,0.52)';
        gMap.beginPath(); gMap.ellipse(x + rng() * w, y + h - 4, 14 + rng() * 22, 6 + rng() * 10, 0, 0, Math.PI * 2); gMap.fill();
      }
      // Fine stone hairline cracks
      if (rng() < 0.45) {
        const cx = x + 10 + rng() * (w - 20), cy = y + 8 + rng() * (h - 16);
        gMap.strokeStyle = 'rgba(20,18,28,0.42)'; gMap.lineWidth = 1.6;
        gMap.beginPath(); gMap.moveTo(cx, cy); gMap.lineTo(cx + (rng() - 0.5) * 32, cy + (rng() - 0.5) * 22); gMap.stroke();
        gBump.strokeStyle = '#202020'; gBump.lineWidth = 2;
        gBump.beginPath(); gBump.moveTo(cx, cy); gBump.lineTo(cx + (rng() - 0.5) * 32, cy + (rng() - 0.5) * 22); gBump.stroke();
      }
    }
  }

  // Granite mineral grain & pitting
  for (let i = 0; i < 3200; i++) {
    const x = rng() * size, y = rng() * size;
    const v = rng() < 0.5 ? 245 : 18;
    const sz = 1.5 + rng() * 2.5;
    gMap.fillStyle = `rgba(${v},${v},${v},0.08)`; gMap.fillRect(x, y, sz, sz);
    gBump.fillStyle = `rgba(${v},${v},${v},0.22)`; gBump.fillRect(x, y, sz, sz);
  }

  const tex = finalizePBRTextures(pair, { repeat });
  return new THREE.MeshStandardMaterial({
    map: tex.map,
    bumpMap: tex.bumpMap,
    bumpScale,
    roughnessMap: tex.roughnessMap,
    roughness,
    metalness: 0.02,
  });
}

// -----------------------------------------------------------------------------
// 5. WOVEN CLOTH / LINEN BANNER / TENT FABRIC PBR (map + bump + roughness)
// -----------------------------------------------------------------------------
export function makeWovenClothPBR({
  baseHex = '#DFD5C3',
  stripeColor = '#1E2336',
  drawEmblem = null,
  roughness = 0.88,
  bumpScale = 0.028,
  seed = 505,
  size = 512,
} = {}) {
  const rng = mulberry32(seed);
  const pair = makeCanvasPair(size);
  const { gMap, gBump, gRough } = pair;

  gMap.fillStyle = baseHex; gMap.fillRect(0, 0, size, size);
  gBump.fillStyle = '#808080'; gBump.fillRect(0, 0, size, size);
  gRough.fillStyle = '#D8D8D8'; gRough.fillRect(0, 0, size, size);

  // Subtle woven linen warp & weft threads!
  for (let i = 0; i < size; i += 6) {
    const a = 0.06 + rng() * 0.05;
    gMap.fillStyle = `rgba(38,28,22,${a.toFixed(3)})`;
    gMap.fillRect(0, i, size, 2);
    gMap.fillRect(i, 0, 2, size);
    gBump.fillStyle = 'rgba(215,215,215,0.28)';
    gBump.fillRect(0, i, size, 2);
    gBump.fillStyle = 'rgba(45,45,45,0.28)';
    gBump.fillRect(i, 0, 2, size);
  }

  // Optional emblem callback (e.g. clan crest or observatory insignia)
  if (typeof drawEmblem === 'function') {
    drawEmblem(gMap, size, stripeColor);
  }

  // Vertical soft fabric drape fold shading (creates authentic billowing cloth volume!)
  for (let f = 0; f < 4; f++) {
    const fx = (f + 0.5) * (size / 4);
    const gr = gMap.createLinearGradient(fx - 48, 0, fx + 48, 0);
    gr.addColorStop(0, 'rgba(18,14,26,0)');
    gr.addColorStop(0.45, 'rgba(18,14,26,0.18)');
    gr.addColorStop(0.65, 'rgba(255,248,235,0.14)');
    gr.addColorStop(1, 'rgba(18,14,26,0)');
    gMap.fillStyle = gr; gMap.fillRect(fx - 48, 0, 96, size);

    const grB = gBump.createLinearGradient(fx - 48, 0, fx + 48, 0);
    grB.addColorStop(0, 'rgba(128,128,128,0)');
    grB.addColorStop(0.45, 'rgba(35,35,35,0.55)');
    grB.addColorStop(0.65, 'rgba(235,235,235,0.55)');
    grB.addColorStop(1, 'rgba(128,128,128,0)');
    gBump.fillStyle = grB; gBump.fillRect(fx - 48, 0, 96, size);
  }

  // Weathered bottom grime & stitched border
  paintEdgeAO(gMap, size, 0.22, 24);

  const tex = finalizePBRTextures(pair, { wrap: false });
  return new THREE.MeshStandardMaterial({
    map: tex.map,
    bumpMap: tex.bumpMap,
    bumpScale,
    roughnessMap: tex.roughnessMap,
    roughness,
    side: THREE.DoubleSide,
  });
}

// -----------------------------------------------------------------------------
// 6. LAYERED PINE / FOLIAGE PBR (Replaces smooth flat plastic tree cones!)
// -----------------------------------------------------------------------------
export function makeFoliagePBR({
  baseHex = '#1B2A30',
  tipHex = '#385258',
  roughness = 0.90,
  bumpScale = 0.045,
  seed = 606,
  size = 512,
} = {}) {
  const rng = mulberry32(seed);
  const pair = makeCanvasPair(size);
  const { gMap, gBump, gRough } = pair;
  const [br, bg, bb] = hexToRgb(baseHex);
  const [tr, tg, tb] = hexToRgb(tipHex);

  gMap.fillStyle = baseHex; gMap.fillRect(0, 0, size, size);
  gBump.fillStyle = '#404040'; gBump.fillRect(0, 0, size, size);
  gRough.fillStyle = '#E0E0E0'; gRough.fillRect(0, 0, size, size);

  // Overlapping downward-angled needle boughs
  for (let i = 0; i < 620; i++) {
    const x = rng() * size, y = rng() * size;
    const len = 18 + rng() * 34;
    const ang = Math.PI * 0.5 + (rng() - 0.5) * 0.95;
    const mix = rng();
    gMap.strokeStyle = rgbStr(br + (tr - br) * mix, bg + (tg - bg) * mix, bb + (tb - bb) * mix, 0.78);
    gMap.lineWidth = 3 + rng() * 4;
    gMap.beginPath(); gMap.moveTo(x, y); gMap.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); gMap.stroke();

    const bv = Math.round(90 + mix * 145);
    gBump.strokeStyle = `rgb(${bv},${bv},${bv})`; gBump.lineWidth = gMap.lineWidth;
    gBump.beginPath(); gBump.moveTo(x, y); gBump.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); gBump.stroke();
  }

  const tex = finalizePBRTextures(pair, { repeat: [2, 2] });
  return new THREE.MeshStandardMaterial({
    map: tex.map,
    bumpMap: tex.bumpMap,
    bumpScale,
    roughnessMap: tex.roughnessMap,
    roughness,
  });
}

// -----------------------------------------------------------------------------
// 7. BLENDER GREASE-PENCIL / FREESTYLE 3D INK OUTLINES (EdgesGeometry helper!)
// Unifies 3D props with bold 2D inked characters (exact EMHAP / Samurai DNA!)
// -----------------------------------------------------------------------------
export function addInkOutlines(mesh, { thresholdDeg = 24, color = '#161122', opacity = 0.72 } = {}) {
  if (!mesh || !mesh.geometry) return null;
  const edges = new THREE.EdgesGeometry(mesh.geometry, thresholdDeg);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthTest: true,
  });
  const lines = new THREE.LineSegments(edges, mat);
  mesh.add(lines);
  return lines;
}

// -----------------------------------------------------------------------------
// 8. PAINTERLY CHARACTER TEXTURE & SHADING HELPERS (Clothes, Layered Hair, Skin, Grain!)
// -----------------------------------------------------------------------------

// Applies tactile woven cloth texture + diagonal crease folds + watercolor/paper tooth inside current clip!
export function applyClothWeaveAndFolds(g, x, y, w, h, {
  weaveAlpha = 0.085,
  foldCount = 3,
  seed = 707,
} = {}) {
  const rng = mulberry32(seed);
  g.save();
  // Diagonal crosshatch linen/cotton weave
  g.strokeStyle = `rgba(22,16,32,${weaveAlpha})`;
  g.lineWidth = 1.6;
  for (let i = -h; i < w + h; i += 9) {
    g.beginPath(); g.moveTo(x + i, y); g.lineTo(x + i + h * 0.45, y + h); g.stroke();
  }
  for (let j = y; j < y + h; j += 9) {
    g.beginPath(); g.moveTo(x, j); g.lineTo(x + w, j); g.stroke();
  }

  // Organic drapery fold troughs & soft highlight ridges
  for (let f = 0; f < foldCount; f++) {
    const fx = x + w * (0.20 + (f / Math.max(1, foldCount)) * 0.65);
    const fy = y + h * (0.28 + rng() * 0.35);
    g.strokeStyle = 'rgba(24,14,34,0.22)'; g.lineWidth = 5;
    g.beginPath();
    g.moveTo(fx, fy);
    g.quadraticCurveTo(fx + (rng() - 0.5) * 26, fy + 38, fx + (rng() - 0.5) * 18, fy + 76);
    g.stroke();
    g.strokeStyle = 'rgba(255,245,228,0.18)'; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(fx + 5, fy + 2);
    g.quadraticCurveTo(fx + 5 + (rng() - 0.5) * 26, fy + 40, fx + 5 + (rng() - 0.5) * 18, fy + 76);
    g.stroke();
  }

  // Watercolor / hand-drawn paper tooth mottling!
  for (let i = 0; i < 420; i++) {
    const px = x + rng() * w, py = y + rng() * h;
    g.fillStyle = rng() < 0.5 ? 'rgba(255,248,236,0.08)' : 'rgba(24,16,34,0.08)';
    g.fillRect(px, py, 3, 3);
  }
  g.restore();
}

// Draws EMHAP-grade multi-layered hand-inked hair locks with root shadows, internal strands & copper highlights!
export function drawLayeredHairLocks(g, {
  baseColor = '#B84A24',
  shadowColor = '#662414',
  highlightColor = '#E68442',
  inkColor = '#120E1E',
  lift = 0,
} = {}) {
  g.save();
  // Base sculpted hair crown silhouette
  g.fillStyle = baseColor;
  g.beginPath();
  g.moveTo(-126, -24);
  g.quadraticCurveTo(-152, -112 - lift * 0.5, -86, -134 - lift);
  g.lineTo(-102, -172 - lift * 1.2);
  g.lineTo(-36, -142 - lift * 0.8);
  g.lineTo(-6, -188 - lift * 1.3);
  g.lineTo(38, -142 - lift * 0.8);
  g.lineTo(90, -174 - lift * 1.15);
  g.lineTo(96, -124 - lift * 0.7);
  g.quadraticCurveTo(144, -104 - lift * 0.4, 126, -22);
  g.quadraticCurveTo(52, -70, 0, -64);
  g.quadraticCurveTo(-60, -70, -126, -24);
  g.closePath();
  g.fill();

  // Clip inside hair silhouette for rich layered locks, dark root troughs & warm highlight curves!
  g.save();
  g.clip();
  // Deep shadow gradient along lower roots & left shadow side
  const sg = g.createLinearGradient(-120, -160, 80, -40);
  sg.addColorStop(0, shadowColor);
  sg.addColorStop(0.45, 'rgba(102,36,20,0)');
  sg.addColorStop(1, 'rgba(42,14,18,0.42)');
  g.fillStyle = sg;
  g.fillRect(-160, -240, 320, 240);

  // Overlapping hand-inked layered locks (exact Every Memory close-up hair texture!)
  const locks = [
    [-112, -46, -86, -128 - lift * 0.9, -46, -72],
    [-68, -62, -22, -162 - lift * 1.1, 14, -76],
    [-10, -68, 44, -148 - lift * 0.9, 68, -68],
    [42, -62, 92, -132 - lift * 0.8, 114, -46],
  ];
  for (const [x0, y0, cx, cy, x1, y1] of locks) {
    // Highlight curved ribbon along upper crest of each lock
    g.strokeStyle = highlightColor; g.lineWidth = 14;
    g.beginPath(); g.moveTo(x0 + 8, y0 - 12); g.quadraticCurveTo(cx + 6, cy + 16, x1 - 4, y1 - 12); g.stroke();
    // Deep shadow underside of lock
    g.strokeStyle = shadowColor; g.lineWidth = 10;
    g.beginPath(); g.moveTo(x0, y0 + 2); g.quadraticCurveTo(cx - 8, cy + 28, x1, y1 + 4); g.stroke();
    // Crisp internal hand-drawn ink strand crease!
    g.strokeStyle = inkColor; g.lineWidth = 5.5;
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy + 22, x1, y1); g.stroke();
  }
  g.restore();

  // Outer bold ink outline
  g.strokeStyle = inkColor; g.lineWidth = 11; g.stroke();
  g.restore();
}

// Creates a reusable subtle screen-space paper/film tooth grain overlay (unifies 3D + 2D!)
export function makePaperToothCanvas(w, h, seed = 9191) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const img = g.createImageData(w, h);
  const d = img.data;
  const rng = mulberry32(seed);
  for (let i = 0; i < d.length; i += 4) {
    const v = rng() < 0.5 ? 245 : 22;
    d[i] = v; d[i + 1] = v - 4; d[i + 2] = v - 8;
    d[i + 3] = Math.floor(rng() * 14); // ultra-subtle 2.5% paper tooth!
  }
  g.putImageData(img, 0, 0);
  return c;
}
