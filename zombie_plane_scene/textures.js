// Procedural Canvas2D PBR textures for the 3D Airplane Cabin diorama.
// 100% generated from code — zero external image files.
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

// 1. Curved Cabin Interior Plastic Wall & Overhead Bin Panel Texture
export function makeCabinPanelTexture() {
  const [c, g] = makeCanvas(512, 1024);
  const [bc, bg] = makeCanvas(512, 1024);
  const rng = mulberry32(104);

  const grad = g.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0.0, '#363C7A');
  grad.addColorStop(0.5, '#4A5194');
  grad.addColorStop(1.0, '#31366E');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 1024);

  bg.fillStyle = '#808080';
  bg.fillRect(0, 0, 512, 1024);

  // Molded horizontal panel ribs & seam grooves
  for (let y = 0; y < 1024; y += 128) {
    g.fillStyle = 'rgba(15,16,44,0.45)';
    g.fillRect(0, y, 512, 6);
    g.fillStyle = 'rgba(145,160,240,0.16)';
    g.fillRect(0, y + 6, 512, 3);
    bg.fillStyle = '#252525';
    bg.fillRect(0, y, 512, 6);
  }
  // Vertical bulkhead seams & latch recesses
  for (let x = 0; x < 512; x += 256) {
    g.fillStyle = 'rgba(12,14,38,0.5)';
    g.fillRect(x, 0, 5, 1024);
    bg.fillStyle = '#222222';
    bg.fillRect(x, 0, 5, 1024);
  }
  // Soft wear blotches (clean painterly gradients, zero gritty grain)
  for (let i = 0; i < 120; i++) {
    const x = rng() * 512;
    const y = rng() * 1024;
    const r = 24 + rng() * 64;
    g.fillStyle = rng() > 0.5 ? 'rgba(20,22,64,0.05)' : 'rgba(130,148,238,0.04)';
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  return {
    map: toTex(c, { repeat: [1, 4] }),
    bumpMap: toTex(bc, { srgb: false, repeat: [1, 4] }),
  };
}

// 2. Overhead Luggage Bin Door Texture (with latch handles & row numbers)
export function makeBinDoorTexture(rowLabel = '12 - 14') {
  const [c, g] = makeCanvas(512, 256);
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, '#5860A8');
  grad.addColorStop(0.6, '#484E92');
  grad.addColorStop(1.0, '#30346A');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 256);

  // Outer panel trim
  g.strokeStyle = '#181A42';
  g.lineWidth = 10;
  g.strokeRect(8, 8, 496, 240);

  // Recessed dark latch handle
  g.fillStyle = '#191C44';
  g.beginPath();
  g.roundRect(190, 175, 132, 34, 8);
  g.fill();
  g.strokeStyle = '#8C9AF0';
  g.lineWidth = 3;
  g.stroke();

  // Subtle row indicator plaque
  g.fillStyle = '#222758';
  g.fillRect(28, 198, 92, 30);
  g.fillStyle = '#CFD9FF';
  g.font = '700 18px "DejaVu Sans", Arial, sans-serif';
  g.fillText(rowLabel, 40, 219);
  return toTex(c);
}

// 3. Aircraft Seatback Shell + Woven Upholstery + Folded Tray Table
export function makeSeatBackTexture() {
  const [c, g] = makeCanvas(512, 768);
  const [bc, bg] = makeCanvas(512, 768);
  const rng = mulberry32(209);

  // Deep indigo molded seat shell
  const grad = g.createLinearGradient(0, 0, 0, 768);
  grad.addColorStop(0.0, '#3D448A');
  grad.addColorStop(0.55, '#2E3474');
  grad.addColorStop(1.0, '#1D2152');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 768);

  bg.fillStyle = '#808080';
  bg.fillRect(0, 0, 512, 768);

  // Subtle woven fabric rib lines
  for (let y = 0; y < 768; y += 8) {
    g.fillStyle = y % 16 === 0 ? 'rgba(12,14,42,0.14)' : 'rgba(130,145,235,0.06)';
    g.fillRect(0, y, 512, 3);
    bg.fillStyle = y % 16 === 0 ? '#686868' : '#969696';
    bg.fillRect(0, y, 512, 3);
  }

  // Crisp white/lavender antimacassar headrest cloth draped over top
  const clothGrad = g.createLinearGradient(0, 14, 0, 178);
  clothGrad.addColorStop(0.0, '#C8CEEE');
  clothGrad.addColorStop(1.0, '#9DA4D8');
  g.fillStyle = clothGrad;
  g.beginPath();
  g.roundRect(78, 18, 356, 152, 16);
  g.fill();
  g.strokeStyle = '#181A40';
  g.lineWidth = 6;
  g.stroke();

  // Folded plastic tray table + twist latch in center of seatback
  g.fillStyle = '#333978';
  g.beginPath();
  g.roundRect(64, 232, 384, 248, 18);
  g.fill();
  g.strokeStyle = '#16173A';
  g.lineWidth = 7;
  g.stroke();

  // Tray latch knob at top center
  g.fillStyle = '#17193C';
  g.beginPath();
  g.roundRect(220, 214, 72, 26, 6);
  g.fill();
  g.strokeStyle = '#7582D4';
  g.lineWidth = 3;
  g.stroke();

  // Lower literature pocket with safety card corner peeking out
  g.fillStyle = '#242960';
  g.beginPath();
  g.roundRect(74, 514, 364, 185, 14);
  g.fill();
  g.strokeStyle = '#141536';
  g.lineWidth = 6;
  g.stroke();

  // Subtle yellow-orange emergency card corner tucked into pocket
  g.save();
  g.translate(160, 508);
  g.rotate(-0.08);
  g.fillStyle = '#D99B58';
  g.fillRect(0, -28, 128, 36);
  g.strokeStyle = '#141226';
  g.lineWidth = 5;
  g.strokeRect(0, -28, 128, 36);
  g.restore();

  // Soft painterly variation
  for (let i = 0; i < 60; i++) {
    g.fillStyle = 'rgba(15,16,48,0.04)';
    g.beginPath();
    g.arc(rng() * 512, rng() * 768, 22 + rng() * 45, 0, Math.PI * 2);
    g.fill();
  }

  return {
    map: toTex(c),
    bumpMap: toTex(bc, { srgb: false }),
  };
}

// 4. Ribbed Indigo Aisle Carpet Texture (Matte, zero clearcoat artifacts)
export function makeCarpetTexture() {
  const [c, g] = makeCanvas(512, 1024);
  const rng = mulberry32(317);

  g.fillStyle = '#1D2154';
  g.fillRect(0, 0, 512, 1024);

  // Subtle ribbed geometric airline carpet stripes
  for (let x = 0; x < 512; x += 24) {
    g.fillStyle = x % 48 === 0 ? 'rgba(65,78,162,0.22)' : 'rgba(12,14,44,0.25)';
    g.fillRect(x, 0, 12, 1024);
  }
  // Subtle geometric diamond weave accents
  g.strokeStyle = 'rgba(105,120,215,0.12)';
  g.lineWidth = 3;
  for (let y = 0; y < 1024; y += 64) {
    for (let x = 0; x < 512; x += 64) {
      g.beginPath();
      g.moveTo(x + 32, y + 10);
      g.lineTo(x + 54, y + 32);
      g.lineTo(x + 32, y + 54);
      g.lineTo(x + 10, y + 32);
      g.closePath();
      g.stroke();
    }
  }
  for (let i = 0; i < 200; i++) {
    g.fillStyle = rng() > 0.5 ? 'rgba(15,16,46,0.07)' : 'rgba(85,98,195,0.05)';
    g.beginPath();
    g.arc(rng() * 512, rng() * 1024, 16 + rng() * 48, 0, Math.PI * 2);
    g.fill();
  }
  return toTex(c, { repeat: [2, 8] });
}

// 5. Recessed Oval Porthole Window — Stormy Night Clouds + Faint Lightning + Rain Streaks
export function makePortholeTexture(withLightning = false) {
  const [c, g] = makeCanvas(256, 384);
  const rng = mulberry32(withLightning ? 808 : 404);

  // Outer plastic bezel surround
  g.fillStyle = '#3B4284';
  g.fillRect(0, 0, 256, 384);

  // Clip oval porthole opening
  g.save();
  g.beginPath();
  g.roundRect(28, 28, 200, 328, 96);
  g.clip();

  // Deep stormy indigo night sky outside 30,000 ft
  const sky = g.createLinearGradient(0, 28, 0, 356);
  if (withLightning) {
    sky.addColorStop(0.0, '#12184E');
    sky.addColorStop(0.45, '#2E459E');
    sky.addColorStop(0.75, '#7294F5');
    sky.addColorStop(1.0, '#1B2262');
  } else {
    sky.addColorStop(0.0, '#0E123C');
    sky.addColorStop(0.55, '#1D296E');
    sky.addColorStop(0.85, '#34479C');
    sky.addColorStop(1.0, '#141A4E');
  }
  g.fillStyle = sky;
  g.fillRect(28, 28, 200, 328);

  // Soft storm cloud deck bands
  for (let i = 0; i < 10; i++) {
    const cx = 40 + rng() * 180;
    const cy = 190 + rng() * 140;
    const rad = 36 + rng() * 64;
    const cg = g.createRadialGradient(cx, cy, 4, cx, cy, rad);
    cg.addColorStop(0, withLightning ? 'rgba(180,206,255,0.42)' : 'rgba(92,115,215,0.28)');
    cg.addColorStop(1, 'rgba(20,26,80,0)');
    g.fillStyle = cg;
    g.beginPath();
    g.arc(cx, cy, rad, 0, Math.PI * 2);
    g.fill();
  }

  // Distant forked lightning bolt if enabled
  if (withLightning) {
    g.strokeStyle = '#DCE8FF';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(148, 60);
    g.lineTo(122, 138);
    g.lineTo(146, 152);
    g.lineTo(106, 240);
    g.stroke();
  }

  // Diagonal exterior rain streaks on glass
  g.strokeStyle = 'rgba(205,222,255,0.34)';
  g.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    const rx = 38 + rng() * 180;
    const ry = 40 + rng() * 290;
    g.beginPath();
    g.moveTo(rx, ry);
    g.lineTo(rx - 18, ry + 12);
    g.stroke();
  }

  // Interior oval rim reflection
  const ref = g.createLinearGradient(28, 28, 228, 356);
  ref.addColorStop(0.0, 'rgba(175,195,255,0.24)');
  ref.addColorStop(0.5, 'rgba(175,195,255,0)');
  ref.addColorStop(1.0, 'rgba(15,18,52,0.32)');
  g.fillStyle = ref;
  g.fillRect(28, 28, 200, 328);
  g.restore();

  // Recessed molded bezel rim shadow + highlight
  g.strokeStyle = '#15173D';
  g.lineWidth = 14;
  g.beginPath();
  g.roundRect(28, 28, 200, 328, 96);
  g.stroke();

  g.strokeStyle = 'rgba(148,164,245,0.35)';
  g.lineWidth = 4;
  g.beginPath();
  g.roundRect(21, 21, 214, 342, 102);
  g.stroke();

  return toTex(c);
}

// 6. Glowing Crimson Aft EXIT Lightbox (S18 OPERATING style plot signal!)
export function makeExitSignTexture() {
  const [c, g] = makeCanvas(512, 192);
  g.fillStyle = '#240B14';
  g.fillRect(0, 0, 512, 192);

  // Glowing crimson interior panel
  const grad = g.createRadialGradient(256, 96, 15, 256, 96, 250);
  grad.addColorStop(0.0, '#FF6858');
  grad.addColorStop(0.55, '#E82E28');
  grad.addColorStop(1.0, '#A6171A');
  g.fillStyle = grad;
  g.beginPath();
  g.roundRect(14, 14, 484, 164, 16);
  g.fill();

  g.strokeStyle = '#140812';
  g.lineWidth = 12;
  g.stroke();

  // High-luminance white EXIT typography (triggers clean UnrealBloomPass halation!)
  g.fillStyle = '#FFF7F4';
  g.font = '900 112px "Liberation Sans", "DejaVu Sans", Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('EXIT', 256, 100);

  return toTex(c);
}

// 7. Overhead Illuminated FASTEN SEAT BELT Bar
export function makeSeatbeltSignTexture() {
  const [c, g] = makeCanvas(512, 128);
  g.fillStyle = '#171838';
  g.fillRect(0, 0, 512, 128);
  g.strokeStyle = '#0D0E26';
  g.lineWidth = 10;
  g.strokeRect(5, 5, 502, 118);

  // Red-amber glowing icon & text
  g.fillStyle = '#FF5542';
  g.font = '900 38px "Liberation Sans", "DejaVu Sans", Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('FASTEN SEAT BELT', 256, 66);

  // Left & right warning dots
  g.fillStyle = '#FFD27A';
  g.beginPath(); g.arc(46, 64, 14, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(466, 64, 14, 0, Math.PI * 2); g.fill();
  return toTex(c);
}

// 8. Brushed Aluminum Drink Trolley Texture
export function makeTrolleyMetalTexture() {
  const [c, g] = makeCanvas(512, 512);
  const grad = g.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0.0, '#6B74A8');
  grad.addColorStop(0.45, '#4F578A');
  grad.addColorStop(1.0, '#2F3464');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 512);

  // Ribbed aluminum corrugation lines
  for (let y = 24; y < 490; y += 22) {
    g.fillStyle = 'rgba(18,20,48,0.28)';
    g.fillRect(20, y, 472, 6);
    g.fillStyle = 'rgba(175,190,250,0.14)';
    g.fillRect(20, y + 6, 472, 3);
  }
  // Dark rubber corner frame & latch bar
  g.strokeStyle = '#141530';
  g.lineWidth = 22;
  g.strokeRect(11, 11, 490, 490);

  g.fillStyle = '#181A38';
  g.fillRect(216, 40, 80, 432);
  g.strokeStyle = '#8A96D8';
  g.lineWidth = 4;
  g.strokeRect(216, 40, 80, 432);

  // Airline galley stencil
  g.fillStyle = '#D5DCFF';
  g.font = '800 34px "DejaVu Sans", Arial, sans-serif';
  g.fillText('GALLEY 02', 42, 86);
  return toTex(c);
}

// 9. Dropped 2D Graphic Airline Safety Card on Aisle Floor
export function makeSafetyCardTexture() {
  const [c, g] = makeCanvas(512, 700);
  g.fillStyle = '#EADFC8';
  g.fillRect(0, 0, 512, 700);
  g.strokeStyle = '#120E1E';
  g.lineWidth = 18;
  g.strokeRect(9, 9, 494, 682);

  // Red emergency header band
  g.fillStyle = '#D13834';
  g.fillRect(18, 18, 476, 125);
  g.fillStyle = '#FFF9F0';
  g.font = '900 58px "Liberation Sans", "DejaVu Sans", Arial, sans-serif';
  g.textAlign = 'center';
  g.fillText('EMERGENCY', 256, 98);

  // Graphic stick-figure airplane evacuation diagram (2D ink style!)
  g.strokeStyle = '#120E1E';
  g.lineWidth = 12;
  g.strokeRect(52, 180, 408, 220);
  // Little airplane silhouette
  g.fillStyle = '#2B3166';
  g.beginPath();
  g.ellipse(256, 290, 140, 32, -0.1, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  // Brace-position mini stick icon (left column, clean margin from text)
  g.beginPath();
  g.arc(118, 515, 30, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.moveTo(118, 545); g.lineTo(118, 622);
  g.moveTo(118, 570); g.lineTo(166, 545);
  g.stroke();

  g.fillStyle = '#120E1E';
  g.font = '800 42px "DejaVu Sans", Arial, sans-serif';
  g.fillText('FLIGHT 404', 332, 548);
  g.font = '700 30px "DejaVu Sans", Arial, sans-serif';
  g.fillText('BRACE / EXIT', 332, 602);
  return toTex(c);
}

// 10. Ripped Galley Curtain Texture (for Aft Bulkhead)
export function makeGalleyCurtainTexture() {
  const [c, g] = makeCanvas(512, 1024);
  const grad = g.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0.0, '#1C1F52');
  grad.addColorStop(0.3, '#2D3476');
  grad.addColorStop(0.6, '#1B1D4A');
  grad.addColorStop(1.0, '#2C3170');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 1024);

  // Vertical fabric pleats
  for (let x = 24; x < 512; x += 52) {
    g.fillStyle = 'rgba(8,10,32,0.45)';
    g.fillRect(x, 0, 14, 1024);
  }
  return toTex(c);
}
