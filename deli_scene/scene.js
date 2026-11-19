// True 2.5D Hybrid Scene: Real 3D lit Three.js street diorama + 2D hand-drawn cel-shaded
// Canvas2D character billboards + UnrealBloomPass + crisp procedural diagonal rain overlay.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import {
  makeBrickTextures,
  makeStuccoTexture,
  makeUpperWindowTexture,
  makeAwningTexture,
  makeAwningValanceTexture,
  makeDeliInteriorTexture,
  makeSidewalkTextures,
  makeAlleyWallTexture,
  makeFenceTexture,
  makeConcreteTexture,
} from './textures.js';

import {
  makeManTexture,
  makeWomanTexture,
  makePasserbyTexture,
  makeBikeKidTexture,
} from './characters2d.js';

const W = window.innerWidth || 1156;
const H = window.innerHeight || 2032;

const params = new URLSearchParams(window.location.search);
const SHOW_CAPTION = params.get('caption') === '1';

// ---------------------------------------------------------------------------
// Renderer + Scene + Camera (Solved Wide-Angle ~18-20mm Vertical Camera)
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
});
renderer.setSize(W, H);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#131946');
scene.fog = new THREE.FogExp2('#161d4c', 0.014);

const camera = new THREE.PerspectiveCamera(76, W / H, 0.1, 100);
camera.position.set(-4.35, 2.45, 6.45);
camera.lookAt(3.35, 2.26, 0.35);
camera.updateMatrixWorld();

// ---------------------------------------------------------------------------
// 3D Lighting Rig (Dusty Periwinkle Night Fill + Warm Deli Spill + Alley Sconce)
// ---------------------------------------------------------------------------
const hemi = new THREE.HemisphereLight('#8594f5', '#1c2052', 1.65);
scene.add(hemi);

const moon = new THREE.DirectionalLight('#8699f8', 1.08);
moon.position.set(-8, 17, 13);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 45;
moon.shadow.camera.left = -14;
moon.shadow.camera.right = 20;
moon.shadow.camera.top = 18;
moon.shadow.camera.bottom = -6;
moon.shadow.bias = -0.0005;
scene.add(moon);

// Broad warm golden spill from the Deli Grocery window onto sidewalk & steps
for (const dl of [
  { pos: [2.2, 2.7, 1.5], color: '#ffd088', intensity: 4.8, dist: 12 },
  { pos: [6.0, 2.7, 1.5], color: '#ffd28c', intensity: 5.0, dist: 12 },
  { pos: [9.5, 2.6, 1.5], color: '#ffc880', intensity: 4.0, dist: 11 },
]) {
  const pl = new THREE.PointLight(dl.color, dl.intensity, dl.dist, 1.55);
  pl.position.set(...dl.pos);
  scene.add(pl);
}

// Warm golden-amber bounce across the concrete stoop treads
const stoopWarm = new THREE.PointLight('#ff9854', 4.6, 6.2, 1.45);
stoopWarm.position.set(0.35, 1.65, 2.95);
scene.add(stoopWarm);

// Saturated cobalt glow on the lower-right foreground sidewalk
const blueForeground = new THREE.PointLight('#305eff', 8.5, 13.0, 1.4);
blueForeground.position.set(1.5, 2.2, 7.4);
scene.add(blueForeground);

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function addBox(w, h, d, mat, x, y, z, { cast = false, receive = true, rx = 0, ry = 0, rz = 0 } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = cast;
  m.receiveShadow = receive;
  scene.add(m);
  return m;
}

// ---------------------------------------------------------------------------
// 1. Wet Reflective Concrete Sidewalk (Matte-Wet StandardMaterial: Zero Specular Balls!)
// ---------------------------------------------------------------------------
const swTex = makeSidewalkTextures();
const sidewalkMat = new THREE.MeshStandardMaterial({
  map: swTex.map,
  roughness: 0.94,
  metalness: 0.0,
});
const sidewalk = new THREE.Mesh(new THREE.PlaneGeometry(44, 30), sidewalkMat);
sidewalk.rotation.x = -Math.PI / 2;
sidewalk.position.set(9.0, 0, 8.5);
sidewalk.receiveShadow = true;
scene.add(sidewalk);

// Soft broad warm cream-peach wet reflection stretching across the sidewalk in front of Deli
{
  const rc = document.createElement('canvas');
  rc.width = 512; rc.height = 512;
  const rg = rc.getContext('2d');
  const g = rg.createRadialGradient(256, 120, 20, 256, 235, 255);
  g.addColorStop(0.0, 'rgba(255,222,175,0.52)');
  g.addColorStop(0.45, 'rgba(218,178,164,0.30)');
  g.addColorStop(0.78, 'rgba(130,118,175,0.12)');
  g.addColorStop(1.0, 'rgba(80,75,140,0)');
  rg.fillStyle = g;
  rg.fillRect(0, 0, 512, 512);
  const rTex = new THREE.CanvasTexture(rc);
  rTex.colorSpace = THREE.SRGBColorSpace;
  const rMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(14.0, 6.8),
    new THREE.MeshBasicMaterial({ map: rTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  rMesh.rotation.x = -Math.PI / 2;
  rMesh.position.set(6.2, 0.008, 2.85);
  scene.add(rMesh);
}

// ---------------------------------------------------------------------------
// 2. Left Foreground Brick Townhouse Wall
// ---------------------------------------------------------------------------
const brickTex = makeBrickTextures();
const brickMat = new THREE.MeshStandardMaterial({
  map: brickTex.map,
  bumpMap: brickTex.bumpMap,
  bumpScale: 0.05,
  roughness: 0.85,
});
// Stepped forward slightly to Z = 0.42 so left brick frames the edge cleanly
addBox(4.8, 14.5, 2.2, brickMat, -2.42, 7.25, -0.68, { cast: true, receive: true });
// Recessed pale-blue doorway jamb visible along far-left edge (matches ref x=0..0.06)
const jambMat = new THREE.MeshStandardMaterial({ color: '#5c68bc', roughness: 0.72 });
addBox(1.8, 9.2, 0.36, jambMat, -2.55, 5.4, 0.48);
// Dark shadow pilaster where brick townhouse meets Deli facade
const darkTrimMat = new THREE.MeshStandardMaterial({ color: '#141530', roughness: 0.7 });
addBox(0.18, 14.5, 0.22, darkTrimMat, -0.04, 7.25, 0.36);

// ---------------------------------------------------------------------------
// 3. Main Deli Grocery Building Facade & Glowing Storefront Interior
// ---------------------------------------------------------------------------
const DELI_W = 12.6;
const WIN_W = 11.4;
const WIN_BOT = 0.28;
const WIN_TOP = 4.68;
const WIN_H = WIN_TOP - WIN_BOT;
const WIN_CY = (WIN_BOT + WIN_TOP) / 2;

const stuccoMat = new THREE.MeshStandardMaterial({
  map: makeStuccoTexture(),
  emissive: new THREE.Color('#2b3478'),
  emissiveIntensity: 0.42,
  roughness: 0.85,
  metalness: 0.02,
});
addBox(DELI_W, 11.5, 1.2, stuccoMat, DELI_W / 2, WIN_TOP + 5.75, -0.6, { receive: true });
addBox(1.25, WIN_TOP + 0.2, 1.2, stuccoMat, 12.02, WIN_TOP / 2, -0.6);

const steelMat = new THREE.MeshStandardMaterial({ color: '#13152c', roughness: 0.45, metalness: 0.42 });
addBox(WIN_W + 0.2, WIN_BOT, 0.35, steelMat, WIN_W / 2, WIN_BOT / 2, -0.06);

// Glowing Deli Interior backplane recessed behind glass mullions
const deliTex = makeDeliInteriorTexture();
const deliInteriorMat = new THREE.MeshStandardMaterial({
  map: deliTex,
  emissive: new THREE.Color('#ffdb90'),
  emissiveMap: deliTex,
  emissiveIntensity: 0.86,
  roughness: 0.48,
});
const deliBack = new THREE.Mesh(new THREE.PlaneGeometry(WIN_W, WIN_H), deliInteriorMat);
deliBack.position.set(WIN_W / 2, WIN_CY, -0.45);
scene.add(deliBack);

// Warm recessed ceiling & side reveals inside deli bay
const deliGlowReveal = new THREE.MeshBasicMaterial({ color: '#f8dca0' });
addBox(WIN_W + 0.1, 0.14, 0.56, deliGlowReveal, WIN_W / 2, WIN_TOP - 0.04, -0.2);
addBox(0.12, WIN_H, 0.56, deliGlowReveal, 0.08, WIN_CY, -0.2);
addBox(0.12, WIN_H, 0.56, deliGlowReveal, WIN_W - 0.08, WIN_CY, -0.2);

// Dark steel window mullions dividing storefront into 4 vertical bays
addBox(WIN_W + 0.2, 0.16, 0.14, steelMat, WIN_W / 2, WIN_TOP, 0.04);
addBox(WIN_W + 0.2, 0.11, 0.14, steelMat, WIN_W / 2, WIN_BOT, 0.04);
for (let i = 0; i <= 4; i++) {
  const mx = 0.06 + (WIN_W - 0.12) * (i / 4);
  addBox(0.11, WIN_H + 0.06, 0.14, steelMat, mx, WIN_CY, 0.04);
}

const glassMat = new THREE.MeshPhysicalMaterial({
  color: '#fff1ce',
  transparent: true,
  opacity: 0.06,
  roughness: 0.12,
});
const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(WIN_W, WIN_H), glassMat);
frontGlass.position.set(WIN_W / 2, WIN_CY, 0.01);
scene.add(frontGlass);

// Warm-lit deli side door at far right of deli facade
const doorGlowMat = new THREE.MeshStandardMaterial({
  color: '#d49a66',
  emissive: '#e8964c',
  emissiveIntensity: 0.72,
  roughness: 0.5,
});
addBox(0.86, 2.75, 0.14, steelMat, 12.05, 1.40, -0.02);
addBox(0.66, 2.42, 0.16, doorGlowMat, 12.05, 1.46, -0.01);

// ---------------------------------------------------------------------------
// 4. Red Bodega Awning (Sloped Crimson Canopy + Upright "DELI GROCERY" Valance!)
// ---------------------------------------------------------------------------
{
  const awnW = 14.8;
  const awnX = awnW / 2 - 0.05;

  // Top sloped canopy: (Z=0, Y=6.05) -> (Z=1.18, Y=5.12)
  const roofMat = new THREE.MeshStandardMaterial({
    map: makeAwningTexture(),
    emissive: new THREE.Color('#2c0610'),
    emissiveIntensity: 0.38,
    roughness: 0.68,
    side: THREE.DoubleSide,
  });
  const roofLen = Math.hypot(1.18, 0.93);
  const roofAng = Math.atan2(1.18, 0.93);
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(awnW, roofLen), roofMat);
  roof.position.set(awnX, 5.585, 0.59);
  roof.rotation.x = -roofAng;
  roof.castShadow = true;
  roof.receiveShadow = true;
  scene.add(roof);

  // Upright slightly-angled front valance carrying bold "DELI GROCERY" lettering!
  // (Z=1.18, Y=5.12) -> (Z=1.34, Y=4.44)
  const valMat = new THREE.MeshStandardMaterial({
    map: makeAwningValanceTexture(),
    emissive: new THREE.Color('#380914'),
    emissiveIntensity: 0.48,
    roughness: 0.55,
    side: THREE.DoubleSide,
  });
  const valLen = Math.hypot(0.16, 0.68);
  const valAng = Math.atan2(0.16, 0.68);
  const valance = new THREE.Mesh(new THREE.PlaneGeometry(awnW, valLen), valMat);
  valance.position.set(awnX, 4.78, 1.26);
  valance.rotation.x = -valAng;
  scene.add(valance);

  // Dark triangular end gussets
  const awnUnderMat = new THREE.MeshStandardMaterial({ color: '#380a16', roughness: 0.85, side: THREE.DoubleSide });
  const sideShape = new THREE.Shape();
  sideShape.moveTo(0, 0);
  sideShape.lineTo(1.34, 0);
  sideShape.lineTo(1.18, 0.68);
  sideShape.lineTo(0, 1.61);
  sideShape.closePath();
  const sideGeo = new THREE.ShapeGeometry(sideShape);
  for (const sx of [-0.05, awnW - 0.05]) {
    const cap = new THREE.Mesh(sideGeo, awnUnderMat);
    cap.rotation.y = -Math.PI / 2;
    cap.position.set(sx, 4.44, 0.0);
    scene.add(cap);
  }
}

// ---------------------------------------------------------------------------
// 5. Upper-Floor Recessed Windows
// ---------------------------------------------------------------------------
function addUpperWindow(x, y, w, h, blueGlow = false) {
  const frameMat = new THREE.MeshStandardMaterial({ color: '#c4cef0', roughness: 0.52 });
  const sillMat = new THREE.MeshStandardMaterial({ color: '#a0ace0', roughness: 0.56 });
  addBox(w + 0.22, h + 0.22, 0.16, frameMat, x, y, -0.02);
  addBox(w + 0.34, 0.16, 0.28, sillMat, x, y - h / 2 - 0.10, 0.06);
  const wTex = makeUpperWindowTexture(blueGlow);
  const wMat = new THREE.MeshStandardMaterial({
    map: wTex,
    emissive: blueGlow ? new THREE.Color('#5a9cff') : new THREE.Color('#162052'),
    emissiveMap: wTex,
    emissiveIntensity: blueGlow ? 1.05 : 0.36,
    roughness: 0.18,
    metalness: 0.2,
  });
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wMat);
  pane.position.set(x, y, 0.07);
  scene.add(pane);
}

addUpperWindow(2.1, 8.25, 2.05, 2.95, false);
addUpperWindow(6.9, 8.15, 1.85, 2.85, true);
addUpperWindow(11.1, 8.15, 1.40, 2.65, false);
addUpperWindow(11.1, 5.65, 1.10, 1.10, false);

// ---------------------------------------------------------------------------
// 6. 3D Dark-Teal Metal Fire Escape (2 Tiers + Diagonal Stairs + Drop Ladder)
// ---------------------------------------------------------------------------
{
  const feDeckMat = new THREE.MeshStandardMaterial({
    color: '#11415e',
    emissive: '#0a2b42',
    emissiveIntensity: 0.65,
    roughness: 0.5,
    metalness: 0.38,
  });
  const feBarMat = new THREE.MeshStandardMaterial({
    color: '#0b253c',
    emissive: '#06182a',
    emissiveIntensity: 0.35,
    roughness: 0.45,
    metalness: 0.58,
  });

  function addBalcony(y) {
    const x0 = 6.2, x1 = 12.2, d = 1.85, rh = 1.38;
    const cx = (x0 + x1) / 2, w = x1 - x0;
    addBox(w, 0.11, d, feDeckMat, cx, y, d / 2, { cast: true });
    for (const bx of [x0 + 0.35, cx, x1 - 0.35]) {
      const br = addBox(0.07, 0.07, 1.65, feBarMat, bx, y - 0.45, d * 0.38);
      br.rotation.x = 0.55;
    }
    for (const ry of [y + rh, y + rh * 0.52]) {
      addBox(w, 0.05, 0.05, feBarMat, cx, ry, d);
      addBox(0.05, 0.05, d, feBarMat, x0, ry, d / 2);
      addBox(0.05, 0.05, d, feBarMat, x1, ry, d / 2);
    }
    for (let x = x0; x <= x1 + 0.01; x += 0.28) {
      addBox(0.032, rh, 0.032, feBarMat, x, y + rh / 2, d);
    }
    for (let z = 0.20; z <= d; z += 0.28) {
      addBox(0.032, rh, 0.032, feBarMat, x0, y + rh / 2, z);
      addBox(0.032, rh, 0.032, feBarMat, x1, y + rh / 2, z);
    }
  }

  addBalcony(6.45);
  addBalcony(10.05);

  const stLen = Math.hypot(2.8, 3.6);
  const stAng = Math.atan2(3.6, 2.8);
  for (const sz of [0.65, 1.25]) {
    const rail = addBox(stLen, 0.06, 0.05, feBarMat, 8.9, 8.25, sz);
    rail.rotation.z = -stAng;
  }
  for (let i = 0; i <= 11; i++) {
    const t = i / 11;
    addBox(0.28, 0.04, 0.62, feDeckMat, 7.5 + t * 2.8, 9.95 - t * 3.45, 0.95);
  }

  for (const lx of [9.65, 10.18]) {
    addBox(0.042, 2.9, 0.042, feBarMat, lx, 5.15, 1.78);
  }
  for (let ly = 3.95; ly <= 6.45; ly += 0.36) {
    addBox(0.55, 0.034, 0.034, feBarMat, 9.915, ly, 1.78);
  }
}

// ---------------------------------------------------------------------------
// 7. Concrete Stoop Steps & Open Black Wrought-Iron Railings (No Solid Side Blocker!)
// ---------------------------------------------------------------------------
{
  const treadMat = new THREE.MeshStandardMaterial({
    map: makeConcreteTexture(),
    color: '#766b96',
    roughness: 0.58,
    metalness: 0.08,
  });
  const riserMat = new THREE.MeshStandardMaterial({
    color: '#1b1a44',
    roughness: 0.78,
  });
  const ironMat = new THREE.MeshStandardMaterial({ color: '#0b0d1f', roughness: 0.36, metalness: 0.55 });

  // Top landing (X = -4.2..0.16, Z = 0.42..1.48, Y = 1.62)
  const LAND_Y = 1.62;
  addBox(4.36, LAND_Y, 1.06, treadMat, -2.02, LAND_Y / 2, 0.95, { cast: true, receive: true });

  // 6 wide concrete steps descending toward +Z (each step has dark indigo riser + warm-catching tread!)
  const nSteps = 6;
  const stepH = LAND_Y / nSteps;
  const stepD = 0.38;
  for (let i = 0; i < nSteps; i++) {
    const h = LAND_Y - (i + 1) * stepH;
    if (h <= 0.01) continue;
    const zStart = 1.48 + i * stepD;
    // Step core with dark riser face
    addBox(4.36, h, stepD + 0.01, riserMat, -2.02, h / 2, zStart + stepD / 2, { cast: true, receive: true });
    // Thin top tread cap catching warm Deli amber reflection
    addBox(4.36, 0.045, stepD + 0.02, treadMat, -2.02, h - 0.02, zStart + stepD / 2, { receive: true });
  }

  // Thin diagonal stair stringer hugging the steps closely (leaving balusters completely open!)
  const totalD = nSteps * stepD;
  const stringerLen = Math.hypot(totalD, LAND_Y);
  const stringerSlope = Math.atan2(LAND_Y, totalD);
  const cheek = addBox(0.14, 0.22, stringerLen, riserMat, 0.16, LAND_Y / 2 - 0.08, 1.48 + totalD / 2);
  cheek.rotation.x = stringerSlope;

  // Horizontal wrought-iron railing along the top landing (behind/left of Man)
  const rTopY = LAND_Y + 1.15;
  addBox(3.0, 0.065, 0.065, ironMat, -1.34, rTopY, 1.46);
  addBox(3.0, 0.045, 0.045, ironMat, -1.34, LAND_Y + 0.08, 1.46);
  for (let rx = -2.75; rx <= 0.16; rx += 0.26) {
    addBox(0.04, 1.14, 0.04, ironMat, rx, LAND_Y + 0.58, 1.46);
  }

  // Open descending wrought-iron handrail along X = 0.16 (Man stands right behind these balusters!)
  const zTop = 1.46, yTop = rTopY;
  const zBot = 3.80, yBot = 1.24;
  const hrLen = Math.hypot(zBot - zTop, yTop - yBot);
  const hrAng = Math.atan2(yTop - yBot, zBot - zTop);
  const handrail = addBox(0.068, 0.068, hrLen, ironMat, 0.16, (yTop + yBot) / 2, (zTop + zBot) / 2);
  handrail.rotation.x = hrAng;

  const nBal = 6;
  for (let i = 0; i <= nBal; i++) {
    const t = i / nBal;
    const bz = zTop + (zBot - zTop) * t;
    const byTop = yTop + (yBot - yTop) * t;
    const byBot = LAND_Y * (1 - t);
    const bh = byTop - byBot;
    addBox(0.042, bh, 0.042, ironMat, 0.16, byBot + bh / 2, bz);
  }

  // Sturdy square dark newel post at the bottom right corner of the stoop
  addBox(0.18, 1.32, 0.18, ironMat, 0.16, 0.66, zBot);
}

// ---------------------------------------------------------------------------
// 8. Distant Alley Wall, Chain-Link Fence & High Warm Orange Wall Sconce
// ---------------------------------------------------------------------------
{
  const alleyMat = new THREE.MeshStandardMaterial({
    map: makeAlleyWallTexture(),
    roughness: 0.85,
  });
  const alleyWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), alleyMat);
  alleyWall.rotation.y = -Math.PI / 2;
  alleyWall.position.set(16.2, 9.5, 1.2);
  alleyWall.receiveShadow = true;
  scene.add(alleyWall);

  // Chain-link fence + concrete curb spanning across the alley gap
  addBox(4.0, 0.62, 0.28, darkTrimMat, 14.4, 0.31, 0.45);
  const fenceMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.9, 2.45),
    new THREE.MeshStandardMaterial({
      map: makeFenceTexture(),
      transparent: true,
      alphaTest: 0.12,
      roughness: 0.5,
      side: THREE.DoubleSide,
    })
  );
  fenceMesh.position.set(14.4, 1.82, 0.45);
  scene.add(fenceMesh);

  // Small wall-sconce lamp positioned higher in the upper-right alley sky
  const sconceX = 16.05, sconceY = 12.6, sconceZ = 0.85;
  addBox(0.30, 0.14, 0.42, darkTrimMat, sconceX, sconceY + 0.10, sconceZ);
  const bulb = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.10, 0.30),
    new THREE.MeshBasicMaterial({ color: '#fff3c4' })
  );
  bulb.position.set(sconceX - 0.06, sconceY - 0.02, sconceZ);
  scene.add(bulb);

  const alleySpot = new THREE.SpotLight('#ff9844', 120, 22, Math.PI * 0.34, 0.72, 1.25);
  alleySpot.position.set(sconceX - 0.8, sconceY - 0.1, sconceZ);
  alleySpot.target.position.set(16.15, 6.2, sconceZ + 0.2);
  scene.add(alleySpot);
  scene.add(alleySpot.target);

  // Soft additive warm conical spotlight beam washing down the alley wall
  const vc = document.createElement('canvas');
  vc.width = 256; vc.height = 512;
  const vg = vc.getContext('2d');
  const coneGrad = vg.createRadialGradient(128, 22, 6, 128, 175, 220);
  coneGrad.addColorStop(0.0, 'rgba(255,215,138,0.74)');
  coneGrad.addColorStop(0.35, 'rgba(225,134,72,0.36)');
  coneGrad.addColorStop(0.75, 'rgba(170,84,58,0.12)');
  coneGrad.addColorStop(1.0, 'rgba(120,60,60,0)');
  vg.fillStyle = coneGrad;
  vg.beginPath();
  vg.moveTo(112, 6); vg.lineTo(144, 6);
  vg.lineTo(250, 495); vg.lineTo(6, 495);
  vg.closePath();
  vg.fill();
  const coneTex = new THREE.CanvasTexture(vc);
  coneTex.colorSpace = THREE.SRGBColorSpace;
  const coneMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 7.6),
    new THREE.MeshBasicMaterial({
      map: coneTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  );
  coneMesh.rotation.y = -Math.PI / 2;
  coneMesh.position.set(16.06, 8.85, sconceZ);
  scene.add(coneMesh);
}

// ---------------------------------------------------------------------------
// 9. Mount 2D Hand-Drawn Cel-Shaded Characters in 3D Space (2.5D Hybrid!)
// ---------------------------------------------------------------------------
function addCharacterBillboard(tex, { x, y, z, width, height, tint = '#e2daee', shadowW = 1.0, shadowY = 0.015 }) {
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    color: new THREE.Color(tint),
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  mesh.position.set(x, y, z);
  const dx = camera.position.x - x;
  const dz = camera.position.z - z;
  mesh.rotation.y = Math.atan2(dx, dz);
  scene.add(mesh);

  if (shadowW > 0) {
    const sc = document.createElement('canvas');
    sc.width = 128; sc.height = 128;
    const sg = sc.getContext('2d');
    const g = sg.createRadialGradient(64, 64, 8, 64, 64, 60);
    g.addColorStop(0, 'rgba(10,12,34,0.58)');
    g.addColorStop(1, 'rgba(10,12,34,0)');
    sg.fillStyle = g;
    sg.fillRect(0, 0, 128, 128);
    const sTex = new THREE.CanvasTexture(sc);
    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(shadowW, shadowW * 0.55),
      new THREE.MeshBasicMaterial({ map: sTex, transparent: true, depthWrite: false })
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.set(x, shadowY, z);
    scene.add(sh);
  }
  return mesh;
}

// 1) Angry Man standing 2 steps down on the stoop — full legs visible on treads, arm behind handrail!
addCharacterBillboard(makeManTexture(), {
  x: -0.92,
  y: 1.98,
  z: 2.75,
  width: 2.38,
  height: 3.57,
  tint: '#ddd4ea',
  shadowW: 0.95,
  shadowY: 0.56,
});

// 2) Worried Woman standing unobstructed right beside the bottom stoop newel post
addCharacterBillboard(makeWomanTexture(), {
  x: 0.84,
  y: 1.60,
  z: 4.18,
  width: 2.28,
  height: 3.42,
  tint: '#e4dced',
  shadowW: 0.98,
  shadowY: 0.015,
});

// 3) Background passerby peeking right behind the woman's right shoulder
addCharacterBillboard(makePasserbyTexture(), {
  x: 2.55,
  y: 1.48,
  z: 2.65,
  width: 1.72,
  height: 2.86,
  tint: '#cec4e0',
  shadowW: 0.75,
  shadowY: 0.014,
});

// 4) Kid on bicycle (3/4 rear view) on the wet sidewalk heading toward the alley fence
addCharacterBillboard(makeBikeKidTexture(), {
  x: 5.10,
  y: 1.38,
  z: 3.22,
  width: 2.24,
  height: 3.36,
  tint: '#dad4ea',
  shadowW: 1.45,
  shadowY: 0.015,
});

// ---------------------------------------------------------------------------
// 10. Post-Processing Pipeline (Restrained Golden Halation Only on Bright Lights)
// ---------------------------------------------------------------------------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(W, H),
  0.20, // gentle warm halation around Deli glass & alley bulb
  0.52,
  0.90  // keeps characters & man's hair 100% crisp
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

composer.render();

// ---------------------------------------------------------------------------
// 11. 2D Atmospheric Finish Overlay (Diagonal Rain + Indigo Vignette + Optional Caption)
// ---------------------------------------------------------------------------
const overlay = document.createElement('canvas');
overlay.width = W;
overlay.height = H;
overlay.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;';
document.body.appendChild(overlay);
const og = overlay.getContext('2d');

const vig = og.createRadialGradient(W * 0.5, H * 0.45, W * 0.30, W * 0.5, H * 0.5, H * 0.72);
vig.addColorStop(0.0, 'rgba(15,13,37,0)');
vig.addColorStop(0.70, 'rgba(15,13,37,0.08)');
vig.addColorStop(1.0, 'rgba(12,11,34,0.36)');
og.fillStyle = vig;
og.fillRect(0, 0, W, H);

function seeded(s) {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rrng = seeded(777);
og.lineCap = 'round';
for (let i = 0; i < 42; i++) {
  const x = rrng() * W;
  const y = rrng() * H;
  const len = 52 + rrng() * 115;
  const tilt = 0.12 + rrng() * 0.04;
  const dx = len * tilt;
  const dy = len;
  const alpha = 0.22 + rrng() * 0.36;
  const grad = og.createLinearGradient(x, y, x + dx, y + dy);
  grad.addColorStop(0, 'rgba(210,224,255,0)');
  grad.addColorStop(0.35, `rgba(224,235,255,${alpha})`);
  grad.addColorStop(1, `rgba(235,242,255,${alpha * 0.25})`);
  og.strokeStyle = grad;
  og.lineWidth = 1.6 + rrng() * 1.4;
  og.beginPath();
  og.moveTo(x, y);
  og.lineTo(x + dx, y + dy);
  og.stroke();
}

if (SHOW_CAPTION) {
  og.save();
  og.font = '900 84px "Liberation Sans", "DejaVu Sans", Arial, sans-serif';
  og.textAlign = 'center';
  og.textBaseline = 'middle';
  og.lineJoin = 'round';
  og.strokeStyle = '#07060d';
  og.lineWidth = 16;
  og.strokeText('birthdays', W * 0.5, H * 0.715);
  og.fillStyle = '#fcfdfd';
  og.fillText('birthdays', W * 0.5, H * 0.715);
  og.restore();
}

window.__SCENE_READY__ = true;
