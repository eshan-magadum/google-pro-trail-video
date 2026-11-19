// Procedural Canvas2D PBR Textures for all 4 Worlds of 'The Parachute With a Hole Cut in the Middle'.
// 100% code-generated — zero external image assets.
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
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
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

// ============================================================================
// WORLD 1: HANGAR PACKING BAY TEXTURES
// ============================================================================

export function makeHangarWallTexture() {
  const [c, g] = makeCanvas(512, 512);
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#232860');
  grad.addColorStop(0.5, '#2E3578');
  grad.addColorStop(1.0, '#1B1F4E');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 512);

  // Vertical corrugated steel hangar ribs
  for (let x = 0; x < 512; x += 32) {
    g.fillStyle = 'rgba(12,14,42,0.34)';
    g.fillRect(x, 0, 12, 512);
    g.fillStyle = 'rgba(128,144,235,0.12)';
    g.fillRect(x + 12, 0, 6, 512);
  }
  // Horizontal steel truss girder seam
  g.fillStyle = 'rgba(14,16,46,0.52)';
  g.fillRect(0, 240, 512, 18);
  g.fillStyle = 'rgba(148,165,248,0.16)';
  g.fillRect(0, 258, 512, 5);
  return toTex(c, { repeat: [4, 2] });
}

export function makeHangarFloorTexture() {
  const [c, g] = makeCanvas(512, 512);
  const rng = mulberry32(77);
  g.fillStyle = '#1E2252';
  g.fillRect(0, 0, 512, 512);

  // Subtle concrete slab joints + painted yellow hangar safety stripes
  g.strokeStyle = 'rgba(12,14,40,0.45)';
  g.lineWidth = 6;
  g.strokeRect(3, 3, 506, 506);
  g.beginPath();
  g.moveTo(256, 0); g.lineTo(256, 512);
  g.moveTo(0, 256); g.lineTo(512, 256);
  g.stroke();

  for (let i = 0; i < 120; i++) {
    g.fillStyle = rng() > 0.5 ? 'rgba(14,16,46,0.06)' : 'rgba(92,108,205,0.05)';
    g.beginPath();
    g.arc(rng() * 512, rng() * 512, 18 + rng() * 55, 0, Math.PI * 2);
    g.fill();
  }
  return toTex(c, { repeat: [5, 5] });
}

export function makeWoodTableTexture() {
  const [c, g] = makeCanvas(512, 512);
  const rng = mulberry32(412);
  g.fillStyle = '#6D473A';
  g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) {
    g.fillStyle = y % 128 === 0 ? 'rgba(32,18,24,0.18)' : 'rgba(255,205,155,0.07)';
    g.fillRect(0, y, 512, 62);
    g.fillStyle = 'rgba(18,12,26,0.48)';
    g.fillRect(0, y + 62, 512, 3);
  }
  for (let i = 0; i < 65; i++) {
    g.strokeStyle = 'rgba(28,16,24,0.14)';
    g.lineWidth = 2 + rng() * 3;
    const y = rng() * 512;
    g.beginPath(); g.moveTo(0, y); g.lineTo(512, y + (rng() - 0.5) * 10); g.stroke();
  }
  return toTex(c, { repeat: [2, 1] });
}

// Dynamic Silk Parachute Packing Cloth (animates shears slicing a glowing dinner-plate circle!)
export function makeDynamicSilkRig() {
  const [c, g] = makeCanvas(768, 768);
  const tex = toTex(c);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;

  function update(cutProgress = 0, cutoutRemoved = false) {
    g.clearRect(0, 0, 768, 768);

    // Cream-white silk canopy spread on wooden table
    const grad = g.createRadialGradient(384, 384, 40, 384, 384, 370);
    grad.addColorStop(0.0, '#FAF5EC');
    grad.addColorStop(0.65, '#E4DDF0');
    grad.addColorStop(1.0, '#B5B0D6');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(384, 384, 358, 0, Math.PI * 2);
    g.fill();

    // Radial stitched silk gore lines (12 panels)
    g.strokeStyle = 'rgba(36,34,74,0.34)';
    g.lineWidth = 5;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.beginPath();
      g.moveTo(384, 384);
      g.lineTo(384 + Math.cos(a) * 356, 384 + Math.sin(a) * 356);
      g.stroke();
    }
    // Outer ink hem
    g.strokeStyle = '#141024';
    g.lineWidth = 10;
    g.beginPath();
    g.arc(384, 384, 356, 0, Math.PI * 2);
    g.stroke();

    // Subtle chalk guide circle before cut completes
    const holeR = 112;
    g.save();
    g.setLineDash([12, 10]);
    g.strokeStyle = 'rgba(218,74,64,0.55)';
    g.lineWidth = 5;
    g.beginPath();
    g.arc(384, 384, holeR, 0, Math.PI * 2);
    g.stroke();
    g.restore();

    // Animated shear slice arc!
    if (cutProgress > 0.01) {
      const endAng = -Math.PI * 0.5 + Math.min(1, cutProgress) * Math.PI * 2;
      if (cutoutRemoved) {
        // Punch clean transparent hole straight through the silk!
        g.save();
        g.globalCompositeOperation = 'destination-out';
        g.beginPath();
        g.arc(384, 384, holeR, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
      // Crisp dark cut seam + subtle amber edge rim
      g.strokeStyle = '#120E1E';
      g.lineWidth = 11;
      g.beginPath();
      g.arc(384, 384, holeR, -Math.PI * 0.5, endAng);
      g.stroke();
      g.strokeStyle = '#FFCF7A';
      g.lineWidth = 4;
      g.beginPath();
      g.arc(384, 384, holeR + 6, -Math.PI * 0.5, endAng);
      g.stroke();
    }

    tex.needsUpdate = true;
  }

  update(0, false);
  return { texture: tex, update };
}

// Glowing Crimson 10:00 Hangar Countdown Wall Clock
export function makeCountdownClockTexture() {
  const [c, g] = makeCanvas(512, 224);
  g.fillStyle = '#141534';
  g.fillRect(0, 0, 512, 224);
  g.strokeStyle = '#384086';
  g.lineWidth = 14;
  g.strokeRect(7, 7, 498, 210);

  // Subtle top label
  g.fillStyle = '#A8B6F0';
  g.font = '800 26px "Liberation Sans", Arial, sans-serif';
  g.textAlign = 'center';
  g.fillText('JUMP COUNTDOWN', 256, 48);

  // Bright crimson-orange LED digits
  g.fillStyle = '#FF5B4A';
  g.font = '900 124px "DejaVu Sans Mono", monospace';
  g.textBaseline = 'middle';
  g.fillText('10:00', 256, 138);
  return toTex(c);
}

// Tactical Competition Briefing Board (10,000 FT + TARGET + CONTRACT $)
export function makeBriefingBoardTexture() {
  const [c, g] = makeCanvas(768, 512);
  g.fillStyle = '#1A204E';
  g.fillRect(0, 0, 768, 512);
  g.strokeStyle = '#0F112E';
  g.lineWidth = 18;
  g.strokeRect(9, 9, 750, 494);

  // Grid lines
  g.strokeStyle = 'rgba(110,140,245,0.18)';
  g.lineWidth = 2;
  for (let x = 48; x < 768; x += 48) { g.beginPath(); g.moveTo(x, 18); g.lineTo(x, 494); g.stroke(); }
  for (let y = 48; y < 512; y += 48) { g.beginPath(); g.moveTo(18, y); g.lineTo(750, y); g.stroke(); }

  // Header bar
  g.fillStyle = '#E6A83A';
  g.fillRect(28, 28, 712, 68);
  g.fillStyle = '#120E1E';
  g.font = '900 36px "Liberation Sans", Arial, sans-serif';
  g.textAlign = 'center';
  g.fillText('AIRDROP TRIALS  •  10,000 FT', 384, 74);

  // Left: Altitude drop diagram
  g.strokeStyle = '#8AA8FF';
  g.lineWidth = 5;
  g.setLineDash([12, 10]);
  g.beginPath(); g.moveTo(165, 135); g.lineTo(165, 420); g.stroke();
  g.setLineDash([]);
  // Tiny plane icon at top
  g.fillStyle = '#F2ECE4';
  g.beginPath(); g.ellipse(165, 132, 54, 14, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#FFD27A';
  g.font = '800 30px "Liberation Sans", Arial, sans-serif';
  g.fillText('10,000 FT', 165, 290);

  // Center: Red-White Bullseye Target
  const tx = 415, ty = 290;
  for (const [r, col] of [[112, '#E8423C'], [82, '#F7F3EA'], [52, '#E8423C'], [24, '#FFD55C']]) {
    g.fillStyle = col;
    g.beginPath(); g.arc(tx, ty, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#120E1E'; g.lineWidth = 4; g.stroke();
  }
  g.fillStyle = '#F7F3EA';
  g.font = '900 28px "Liberation Sans", Arial, sans-serif';
  g.fillText('TARGET', tx, 438);

  // Right: Golden CONTRACT seal
  g.fillStyle = '#F3E3BE';
  g.beginPath(); g.roundRect(566, 154, 152, 224, 12); g.fill();
  g.strokeStyle = '#120E1E'; g.lineWidth = 8; g.stroke();
  g.fillStyle = '#120E1E';
  g.font = '900 24px "Liberation Sans", Arial, sans-serif';
  g.fillText('CONTRACT', 642, 198);
  for (let ly = 228; ly <= 290; ly += 20) {
    g.fillStyle = '#5C5A78';
    g.fillRect(588, ly, 108, 7);
  }
  // Gold wax stamp
  g.fillStyle = '#F4B83A';
  g.beginPath(); g.arc(642, 336, 28, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#120E1E'; g.lineWidth = 5; g.stroke();
  g.fillStyle = '#120E1E';
  g.font = '900 32px "Liberation Sans", Arial, sans-serif';
  g.fillText('$', 642, 347);

  return toTex(c);
}

// Neon Pink-Frosted Donut Gag Sign/Badge ("THE DONUT CHUTE!")
export function makeDonutBadgeTexture() {
  const [c, g] = makeCanvas(512, 512);
  g.clearRect(0, 0, 512, 512);

  // Golden dough ring
  g.fillStyle = '#E6A448';
  g.beginPath(); g.arc(256, 256, 196, 0, Math.PI * 2); g.fill();
  // Pink frosting wavy top
  g.fillStyle = '#FF74B2';
  g.beginPath(); g.arc(256, 246, 178, 0, Math.PI * 2); g.fill();
  // Punch center donut hole!
  g.save();
  g.globalCompositeOperation = 'destination-out';
  g.beginPath(); g.arc(256, 256, 74, 0, Math.PI * 2); g.fill();
  g.restore();

  // Crisp ink rings
  g.strokeStyle = '#120E1E';
  g.lineWidth = 16;
  g.beginPath(); g.arc(256, 256, 196, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(256, 256, 74, 0, Math.PI * 2); g.stroke();

  // Colorful graphic sprinkles
  const colors = ['#FFE86E', '#6BE5FF', '#FFF7F2', '#7BFF94'];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + 0.15;
    const rad = 116 + (i % 3) * 24;
    const sx = 256 + Math.cos(a) * rad;
    const sy = 248 + Math.sin(a) * rad;
    g.save();
    g.translate(sx, sy);
    g.rotate(a + 0.6);
    g.fillStyle = colors[i % colors.length];
    g.fillRect(-12, -5, 24, 10);
    g.strokeStyle = '#120E1E'; g.lineWidth = 3;
    g.strokeRect(-12, -5, 24, 10);
    g.restore();
  }
  return toTex(c);
}

// ============================================================================
// WORLD 2 & 4: PARACHUTE CANOPY, CLOUDS, AIRCRAFT HATCH & BULLSEYE RUNWAY
// ============================================================================

export function makeCanopyTexture(vented = false) {
  const [c, g] = makeCanvas(512, 512);
  // Radial gore stripes mapped across hemisphere UVs (u = around, v = crown->skirt)
  for (let x = 0; x < 512; x += 64) {
    g.fillStyle = (x / 64) % 2 === 0
      ? (vented ? '#FFF7E8' : '#F6F4FA')
      : (vented ? '#F4D8A6' : '#DCE2F6');
    g.fillRect(x, 0, 64, 512);
    g.fillStyle = '#191836';
    g.fillRect(x, 0, 5, 512);
  }
  // Bold graphic accent band near skirt
  g.fillStyle = vented ? '#E58E2C' : '#3E60C8';
  g.fillRect(0, 390, 512, 62);
  g.fillStyle = '#14122A';
  g.fillRect(0, 386, 512, 8);
  g.fillRect(0, 450, 512, 8);

  if (vented) {
    // Glowing golden-rimmed apex collar near top of UV
    g.fillStyle = '#FFD374';
    g.fillRect(0, 0, 512, 36);
    g.fillStyle = '#14122A';
    g.fillRect(0, 36, 512, 10);
  }
  return toTex(c);
}

export function makeCloudPuffTexture(warm = false) {
  const [c, g] = makeCanvas(512, 256);
  g.clearRect(0, 0, 512, 256);
  const puffs = [
    [130, 150, 95], [220, 118, 115], [315, 130, 105], [390, 160, 82], [256, 168, 120],
  ];
  for (const [x, y, r] of puffs) {
    const gr = g.createRadialGradient(x, y - r * 0.25, r * 0.1, x, y, r);
    if (warm) {
      gr.addColorStop(0.0, 'rgba(255,238,205,0.92)');
      gr.addColorStop(0.55, 'rgba(218,195,222,0.58)');
      gr.addColorStop(1.0, 'rgba(110,120,195,0)');
    } else {
      gr.addColorStop(0.0, 'rgba(195,212,255,0.84)');
      gr.addColorStop(0.55, 'rgba(108,128,208,0.48)');
      gr.addColorStop(1.0, 'rgba(35,44,112,0)');
    }
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  return toTex(c);
}

// Bullseye Target Field Texture (used both far below in World 2 and full-scale in World 4!)
export function makeBullseyeFieldTexture() {
  const [c, g] = makeCanvas(1024, 1024);
  const rng = mulberry32(909);

  // Dusk indigo-slate airfield tarmac & grass surround
  g.fillStyle = '#252B5C';
  g.fillRect(0, 0, 1024, 1024);

  // Subtle runway tarmac strip down the center
  g.fillStyle = '#2F356B';
  g.fillRect(190, 0, 644, 1024);
  g.fillStyle = 'rgba(235,220,185,0.35)';
  for (let y = 24; y < 1024; y += 96) {
    g.fillRect(208, y, 14, 52);
    g.fillRect(802, y, 14, 52);
  }
  for (let i = 0; i < 180; i++) {
    g.fillStyle = rng() > 0.5 ? 'rgba(14,16,44,0.08)' : 'rgba(118,132,225,0.06)';
    g.beginPath(); g.arc(rng() * 1024, rng() * 1024, 16 + rng() * 54, 0, Math.PI * 2); g.fill();
  }

  // Giant iconic painted Red-White-Gold TARGET Bullseye dead-center!
  const cx = 512, cy = 512;
  for (const [r, col] of [[285, '#D83B38'], [212, '#F4EEE2'], [142, '#D83B38'], [72, '#FFD25A']]) {
    g.fillStyle = col;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#141228';
    g.lineWidth = 10;
    g.stroke();
  }
  // Crisp center crosshairs
  g.strokeStyle = '#141228';
  g.lineWidth = 8;
  g.beginPath();
  g.moveTo(cx - 38, cy); g.lineTo(cx + 38, cy);
  g.moveTo(cx, cy - 38); g.lineTo(cx, cy + 38);
  g.stroke();

  return toTex(c);
}

// ============================================================================
// WORLD 3: UNDERWATER GLASS TANK & AIRFLOW RIBBON TEXTURES
// ============================================================================

export function makeCausticRayTexture() {
  const [c, g] = makeCanvas(512, 512);
  g.clearRect(0, 0, 512, 512);
  for (let i = 0; i < 7; i++) {
    const x = 45 + i * 72;
    const gr = g.createLinearGradient(x, 0, x + 55, 512);
    gr.addColorStop(0.0, 'rgba(130,235,255,0.34)');
    gr.addColorStop(0.6, 'rgba(85,185,255,0.14)');
    gr.addColorStop(1.0, 'rgba(30,80,180,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(x - 18, 0);
    g.lineTo(x + 22, 0);
    g.lineTo(x + 78, 512);
    g.lineTo(x + 8, 512);
    g.closePath();
    g.fill();
  }
  return toTex(c);
}

export function makeAirflowRibbonTexture(golden = true) {
  const [c, g] = makeCanvas(256, 512);
  g.clearRect(0, 0, 256, 512);

  // Flowing upward luminous arrow stream
  const gr = g.createLinearGradient(0, 512, 0, 0);
  if (golden) {
    gr.addColorStop(0.0, 'rgba(255,212,115,0)');
    gr.addColorStop(0.3, 'rgba(255,222,135,0.75)');
    gr.addColorStop(0.75, 'rgba(255,244,200,0.95)');
    gr.addColorStop(1.0, 'rgba(255,248,225,0)');
  } else {
    gr.addColorStop(0.0, 'rgba(95,215,255,0)');
    gr.addColorStop(0.35, 'rgba(120,230,255,0.72)');
    gr.addColorStop(0.8, 'rgba(215,248,255,0.90)');
    gr.addColorStop(1.0, 'rgba(180,235,255,0)');
  }
  g.fillStyle = gr;
  g.fillRect(88, 40, 80, 440);

  // Crisp upward chevrons inside ribbon
  g.strokeStyle = golden ? '#FFFDF2' : '#E8FAFF';
  g.lineWidth = 14;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const cy of [120, 235, 350]) {
    g.beginPath();
    g.moveTo(74, cy + 44);
    g.lineTo(128, cy);
    g.lineTo(182, cy + 44);
    g.stroke();
  }
  return toTex(c);
}
