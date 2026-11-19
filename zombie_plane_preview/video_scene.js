// 10-Second 2.5D Hybrid Video Engine: Zombie Apocalypse Inside Plane (1080x1920 @ 30 FPS)
// Supports:
//   - Single-frame debug mode: ?frame=85 (captures static screenshot)
//   - Fast single-Chromium raw-RGBA streaming mode: ?mode=stream&frames=300 (streams frames via POST /frame/:i)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import {
  makeCabinPanelTexture,
  makeBinDoorTexture,
  makeSeatBackTexture,
  makeCarpetTexture,
  makePortholeTexture,
  makeAnimatedPortholeRig,
  makeExitSignTexture,
  makeSeatbeltSignTexture,
  makeTrolleyMetalTexture,
  makeSafetyCardTexture,
  makeGalleyCurtainTexture,
} from './textures.js';

import {
  createHeroRig,
  createPeekingRig,
  createLeadZombieRig,
  createAttendantZombieRig,
  makeRearZombieTexture,
  makeOxygenMaskTexture,
} from './characters2d_rig.js';

import { evaluateFrame, TOTAL_FRAMES } from './timeline.js';

const W = 1080;
const H = 1920;
const GL_W = 720;
const GL_H = 1280;
const params = new URLSearchParams(window.location.search);
const MODE = params.get('mode') || 'single';
const SHOW_CAPTION = params.get('caption') !== '0';
const WORKER_ID = params.get('worker') || '0';
const START_FRAME = Number(params.get('start')) || 0;
const END_FRAME = params.has('end') ? Number(params.get('end')) : (Number(params.get('frames')) || TOTAL_FRAMES);
const SINGLE_FRAME = Number(params.get('frame')) || 85;

// ---------------------------------------------------------------------------
// 1. WebGL2 Renderer, Scene, Fog & Camera (720x1280 3D + Bloom -> 1080x1920 Master!)
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
});
renderer.setSize(GL_W, GL_H, false);
renderer.setPixelRatio(1);
renderer.domElement.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;display:block;';
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true; // Bake static fuselage & 40-seat shadow map ONCE!
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const gloomBg = new THREE.Color('#141640');
const coldBg = new THREE.Color('#0E133D');
scene.background = gloomBg.clone();
scene.fog = new THREE.FogExp2('#181B52', 0.028);

const camera = new THREE.PerspectiveCamera(74, W / H, 0.08, 80);

// ---------------------------------------------------------------------------
// 2. Dynamic 3D Lighting Rig (Gloom <-> Storm Flash <-> Emergency Strobe <-> Cold Cobalt)
// ---------------------------------------------------------------------------
const ambientLift = new THREE.AmbientLight('#283188', 0.72);
scene.add(ambientLift);

const hemi = new THREE.HemisphereLight('#6E7FE8', '#282E7C', 1.12);
scene.add(hemi);

const stormKey = new THREE.DirectionalLight('#738BF8', 0.88);
stormKey.position.set(-7.5, 5.5, 4.5);
stormKey.castShadow = true;
stormKey.shadow.mapSize.set(1024, 1024);
stormKey.shadow.camera.near = 0.5;
stormKey.shadow.camera.far = 32;
stormKey.shadow.camera.left = -8;
stormKey.shadow.camera.right = 8;
stormKey.shadow.camera.top = 8;
stormKey.shadow.camera.bottom = -4;
stormKey.shadow.bias = -0.0006;
scene.add(stormKey);

// Exterior storm flash light near Row-2 left porthole (Shot 1 lightning bounce!)
const portholeFlashLight = new THREE.PointLight('#9EC0FF', 0.0, 9.0, 1.5);
portholeFlashLight.position.set(-1.65, 1.48, 2.35);
scene.add(portholeFlashLight);

const heroReadingLight = new THREE.PointLight('#FFC97A', 6.4, 7.6, 1.6);
heroReadingLight.position.set(-0.42, 2.22, 2.85);
scene.add(heroReadingLight);

const trolleyWarm = new THREE.PointLight('#FFB466', 3.4, 5.8, 1.55);
trolleyWarm.position.set(0.35, 1.42, 4.15);
scene.add(trolleyWarm);

const indigoFgBoost = new THREE.PointLight('#365BFF', 4.2, 8.2, 1.6);
indigoFgBoost.position.set(-0.55, 1.35, 5.25);
scene.add(indigoFgBoost);

const indigoUpperFill = new THREE.PointLight('#3450E8', 1.4, 7.5, 1.6);
indigoUpperFill.position.set(0.55, 1.45, 4.4);
scene.add(indigoUpperFill);

// Cold cobalt rim light activated during Shot 5 twist close-up!
const coldRimLight = new THREE.PointLight('#5288FF', 0.0, 8.0, 1.5);
coldRimLight.position.set(0.35, 1.72, 3.65);
scene.add(coldRimLight);

const exitCrimsonFar = new THREE.PointLight('#FF362E', 17.5, 15.5, 1.3);
exitCrimsonFar.position.set(0.0, 2.25, -8.8);
scene.add(exitCrimsonFar);

const exitCrimsonMid = new THREE.PointLight('#FF4238', 8.2, 11.0, 1.45);
exitCrimsonMid.position.set(0.05, 2.1, -3.2);
scene.add(exitCrimsonMid);

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
// 3. 3D Curved Airplane Fuselage, Carpet, Floor LEDs, Overhead Bins & Portholes
// ---------------------------------------------------------------------------
const panelTex = makeCabinPanelTexture();
const wallMat = new THREE.MeshStandardMaterial({
  map: panelTex.map,
  bumpMap: panelTex.bumpMap,
  bumpScale: 0.03,
  roughness: 0.84,
  metalness: 0.05,
  side: THREE.BackSide,
});
const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(2.28, 2.28, 21.5, 28, 1, true), wallMat);
fuselage.rotation.x = Math.PI / 2;
fuselage.position.set(0, 1.18, -1.5);
fuselage.receiveShadow = true;
scene.add(fuselage);

const carpetMat = new THREE.MeshStandardMaterial({ map: makeCarpetTexture(), roughness: 0.94, metalness: 0.0 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 22.0), carpetMat);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, 0.0, -1.4);
floor.receiveShadow = true;
scene.add(floor);

// Converging warm-amber HDR floor-path LED strips
const ledStripMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.75, 2.38, 1.58) });
for (const sx of [-0.66, 0.66]) {
  for (let z = 5.6; z >= -10.0; z -= 0.52) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.28), ledStripMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(sx, 0.008, z);
    scene.add(dash);
  }
}

function addFloorDecal(x, z, w, d, inner, mid, outer) {
  const dc = document.createElement('canvas');
  dc.width = 512; dc.height = 512;
  const dg = dc.getContext('2d');
  const g = dg.createRadialGradient(256, 256, 16, 256, 256, 252);
  g.addColorStop(0.0, inner);
  g.addColorStop(0.48, mid);
  g.addColorStop(1.0, outer);
  dg.fillStyle = g;
  dg.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(dc);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.011, z);
  scene.add(mesh);
  return mesh;
}
const warmFloorDecal = addFloorDecal(-0.26, 2.75, 2.3, 3.8, 'rgba(255,204,132,0.34)', 'rgba(220,160,115,0.14)', 'rgba(80,75,140,0)');
const redFloorDecal = addFloorDecal(0.05, -2.6, 2.5, 7.6, 'rgba(255,68,58,0.44)', 'rgba(195,42,68,0.18)', 'rgba(40,20,75,0)');

const ribMat = new THREE.MeshStandardMaterial({ color: '#2C3372', roughness: 0.78 });
for (let z = 4.6; z >= -9.8; z -= 1.55) {
  const rib = new THREE.Mesh(new THREE.TorusGeometry(2.24, 0.045, 8, 28, Math.PI * 1.18), ribMat);
  rib.position.set(0, 1.18, z);
  rib.rotation.z = -Math.PI * 0.09;
  scene.add(rib);
}

// Overhead Luggage Bins (keep references to popped doors so they rattle on turbulence!)
const binMatClosed = new THREE.MeshStandardMaterial({ map: makeBinDoorTexture('12 - 14'), color: '#9BA4D8', roughness: 0.78 });
const binMatMid = new THREE.MeshStandardMaterial({ map: makeBinDoorTexture('09 - 11'), color: '#9BA4D8', roughness: 0.78 });
const binDarkInside = new THREE.MeshStandardMaterial({ color: '#222660', roughness: 0.88 });
const suitcaseMat = new THREE.MeshStandardMaterial({ color: '#7A3346', roughness: 0.8 });

const poppedDoors = [];
const binZs = [4.0, 2.0, 0.0, -2.0, -4.0, -6.0, -8.0, -9.8];
for (let i = 0; i < binZs.length; i++) {
  const bz = binZs[i];
  const bMat = i < 3 ? binMatClosed : binMatMid;
  for (const side of [-1, 1]) {
    addBox(1.15, 0.56, 1.92, binDarkInside, side * 1.38, 2.52, bz);
    const isPopped = (side === -1 && i === 2) || (side === 1 && i === 3);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.56, 1.86), bMat);
    if (isPopped) {
      door.position.set(side * 0.72, 2.26, bz);
      door.rotation.z = side * 0.72;
      poppedDoors.push({ mesh: door, baseRz: side * 0.72, side });
      addBox(0.55, 0.34, 0.72, suitcaseMat, side * 0.98, 2.38, bz + 0.12, { cast: true, rz: side * 0.25 });
    } else {
      door.position.set(side * 0.80, 2.48, bz);
      door.rotation.z = side * 0.28;
    }
    scene.add(door);
  }
}

// Ceiling Valance, HDR Reading Bulbs & Soft Feathered Light Shafts
const ceilingValanceMat = new THREE.MeshStandardMaterial({ color: '#2E3576', roughness: 0.84 });
addBox(1.18, 0.12, 20.0, ceilingValanceMat, 0, 3.06, -1.6);

const bulbOnMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.3, 2.95, 2.25) });
const bulbDimMat = new THREE.MeshBasicMaterial({ color: '#7684D6' });

const beamCanvas = document.createElement('canvas');
beamCanvas.width = 256; beamCanvas.height = 512;
const bg = beamCanvas.getContext('2d');
for (let y = 0; y < 512; y++) {
  const v = y / 511;
  const halfW = 14 + v * 112;
  const vFade = Math.pow(1 - v, 1.35) * Math.min(1, v * 12);
  const rowGrad = bg.createLinearGradient(128 - halfW, 0, 128 + halfW, 0);
  rowGrad.addColorStop(0.0, 'rgba(255,214,148,0)');
  rowGrad.addColorStop(0.32, `rgba(255,218,154,${(0.14 * vFade).toFixed(4)})`);
  rowGrad.addColorStop(0.5, `rgba(255,224,168,${(0.22 * vFade).toFixed(4)})`);
  rowGrad.addColorStop(0.68, `rgba(255,218,154,${(0.14 * vFade).toFixed(4)})`);
  rowGrad.addColorStop(1.0, 'rgba(255,214,148,0)');
  bg.fillStyle = rowGrad;
  bg.fillRect(0, y, 256, 1);
}
const beamTex = new THREE.CanvasTexture(beamCanvas);
const beamMat = new THREE.MeshBasicMaterial({
  map: beamTex,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
});

const lightShafts = [];
for (const lx of [-0.42, 0.42]) {
  for (const lz of [3.05, 0.85, -1.65, -4.45]) {
    const isLit = (lz === 3.05 && lx < 0) || (lz === 0.85 && lx > 0);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.105, 18), isLit ? bulbOnMat : bulbDimMat);
    disc.rotation.x = Math.PI / 2;
    disc.position.set(lx, 2.98, lz);
    scene.add(disc);
    if (isLit) {
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.85), beamMat);
      shaft.position.set(lx, 1.56, lz - 0.12);
      scene.add(shaft);
      lightShafts.push(shaft);
    }
  }
}

// Single Front Illuminated FASTEN SEAT BELT Bar (clean dark casing on underside!)
const sbFrontMat = new THREE.MeshBasicMaterial({
  map: makeSeatbeltSignTexture(),
  color: new THREE.Color(1.45, 1.35, 1.35),
});
const sbCaseMat = new THREE.MeshStandardMaterial({ color: '#1B1F42', roughness: 0.72 });
const sbBar = new THREE.Mesh(
  new THREE.BoxGeometry(0.84, 0.16, 0.08),
  [sbCaseMat, sbCaseMat, sbCaseMat, sbCaseMat, sbFrontMat, sbCaseMat]
);
sbBar.position.set(0, 2.92, 2.35);
scene.add(sbBar);

// Oval Porthole Windows (with Animated High-Res Hero Porthole on Left Row 2 for Shot 1!)
const heroPortholeRig = makeAnimatedPortholeRig();
const heroPortMat = new THREE.MeshBasicMaterial({
  map: heroPortholeRig.texture,
  color: new THREE.Color(1.25, 1.30, 1.42),
});
const portCalmMat = new THREE.MeshBasicMaterial({ map: makePortholeTexture(false) });
const portStormMat = new THREE.MeshBasicMaterial({
  map: makePortholeTexture(true),
  color: new THREE.Color(1.55, 1.65, 2.05),
});

const winZs = [3.9, 2.35, 0.8, -0.75, -2.3, -3.85, -5.4, -6.95, -8.5];
for (let i = 0; i < winZs.length; i++) {
  const wz = winZs[i];
  for (const side of [-1, 1]) {
    const isHeroWindow = (side === -1 && i === 1);
    const isFlash = (side === 1 && i === 3);
    const mat = isHeroWindow ? heroPortMat : (isFlash ? portStormMat : portCalmMat);
    const wMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(isHeroWindow ? 0.50 : 0.42, isHeroWindow ? 0.74 : 0.62),
      mat
    );
    wMesh.position.set(side * 2.13, 1.46, wz);
    wMesh.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
    scene.add(wMesh);
  }
}

// ---------------------------------------------------------------------------
// 4. Aft Bulkhead, Ripped Curtain & Unobstructed HDR Crimson EXIT Lightbox
// ---------------------------------------------------------------------------
const bulkheadMat = new THREE.MeshStandardMaterial({ color: '#2B2F68', roughness: 0.85 });
addBox(4.8, 3.6, 0.3, bulkheadMat, 0, 1.7, -10.65);

const doorMat = new THREE.MeshStandardMaterial({ color: '#1B1D48', roughness: 0.72 });
addBox(1.18, 2.05, 0.12, doorMat, -0.10, 1.02, -10.46);

const curtainMat = new THREE.MeshStandardMaterial({ map: makeGalleyCurtainTexture(), roughness: 0.9, side: THREE.DoubleSide });
const curtain = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 2.25), curtainMat);
curtain.position.set(1.05, 1.15, -10.22);
curtain.rotation.z = -0.06;
scene.add(curtain);

const exitFrontMat = new THREE.MeshBasicMaterial({
  map: makeExitSignTexture(),
  color: new THREE.Color(3.1, 1.6, 1.55),
});
const exitCaseMat = new THREE.MeshStandardMaterial({ color: '#241838', roughness: 0.72 });
const exitSign = new THREE.Mesh(
  new THREE.BoxGeometry(1.22, 0.42, 0.14),
  [exitCaseMat, exitCaseMat, exitCaseMat, exitCaseMat, exitFrontMat, exitCaseMat]
);
exitSign.position.set(-0.02, 2.60, -9.90);
scene.add(exitSign);

{
  const hc = document.createElement('canvas');
  hc.width = 256; hc.height = 256;
  const hg = hc.getContext('2d');
  const g = hg.createRadialGradient(128, 128, 10, 128, 128, 125);
  g.addColorStop(0.0, 'rgba(255,74,60,0.72)');
  g.addColorStop(0.45, 'rgba(235,38,48,0.30)');
  g.addColorStop(1.0, 'rgba(180,20,40,0)');
  hg.fillStyle = g;
  hg.fillRect(0, 0, 256, 256);
  const hTex = new THREE.CanvasTexture(hc);
  const hMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 3.2),
    new THREE.MeshBasicMaterial({ map: hTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  hMesh.position.set(-0.02, 2.48, -9.76);
  scene.add(hMesh);
}

// ---------------------------------------------------------------------------
// 5. 10 Rows of 3D Airplane Seats (40 Seats)
// ---------------------------------------------------------------------------
const seatTex = makeSeatBackTexture();
const seatBackMat = new THREE.MeshStandardMaterial({ map: seatTex.map, bumpMap: seatTex.bumpMap, bumpScale: 0.025, roughness: 0.86 });
const seatSideMat = new THREE.MeshStandardMaterial({ color: '#292F6C', roughness: 0.88 });
const armMat = new THREE.MeshStandardMaterial({ color: '#1B1E48', roughness: 0.72 });
const seatMaterials = [seatSideMat, seatSideMat, seatSideMat, seatSideMat, seatBackMat, seatSideMat];

const rowZs = [4.95, 3.45, 1.95, 0.45, -1.05, -2.55, -4.05, -5.55, -7.05, -8.55];
const seatXs = [-1.66, -1.08, 1.08, 1.66];
for (const rz of rowZs) {
  for (const sx of seatXs) {
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.94, 0.14), seatMaterials);
    back.position.set(sx, 0.84, rz);
    back.rotation.x = -0.08;
    back.castShadow = true;
    back.receiveShadow = true;
    scene.add(back);
    addBox(0.52, 0.14, 0.48, seatSideMat, sx, 0.39, rz - 0.24, { cast: true, receive: true });
    addBox(0.05, 0.36, 0.05, armMat, sx - 0.18, 0.18, rz - 0.14);
    addBox(0.05, 0.36, 0.05, armMat, sx + 0.18, 0.18, rz - 0.14);
    if (Math.abs(sx) < 1.2) {
      const armX = sx < 0 ? sx + 0.28 : sx - 0.28;
      addBox(0.07, 0.08, 0.44, armMat, armX, 0.62, rz - 0.16, { cast: true });
    }
  }
}

// ---------------------------------------------------------------------------
// 6. 3D Foreground Occluder: Overturned GALLEY 02 Trolley + Rolling Cans + Safety Card
// ---------------------------------------------------------------------------
const trolleyGroup = new THREE.Group();
const trolleyMat = new THREE.MeshStandardMaterial({ map: makeTrolleyMetalTexture(), roughness: 0.62, metalness: 0.20 });
const wheelMat = new THREE.MeshStandardMaterial({ color: '#1B1D42', roughness: 0.85 });
const trolleyBody = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.98, 0.78), trolleyMat);
trolleyBody.castShadow = true;
trolleyBody.receiveShadow = true;
trolleyGroup.add(trolleyBody);
for (const wx of [-0.20, 0.20]) {
  for (const wz of [-0.28, 0.28]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 14), wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, -0.52, wz);
    trolleyGroup.add(w);
  }
}
trolleyGroup.position.set(0.46, 0.34, 3.65);
trolleyGroup.rotation.set(0.14, -0.44, 1.32);
scene.add(trolleyGroup);

const canRedMat = new THREE.MeshStandardMaterial({ color: '#D1424A', roughness: 0.45, metalness: 0.25 });
const canBlueMat = new THREE.MeshStandardMaterial({ color: '#467CD4', roughness: 0.45, metalness: 0.25 });
const canRed = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.125, 14), canRedMat);
canRed.rotation.set(Math.PI / 2, 0.2, 0.6);
scene.add(canRed);

const canBlue = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.125, 14), canBlueMat);
canBlue.position.set(0.24, 0.036, 4.25);
canBlue.rotation.set(Math.PI / 2, -0.2, -0.5);
scene.add(canBlue);

const safetyCard = new THREE.Mesh(
  new THREE.PlaneGeometry(0.28, 0.38),
  new THREE.MeshBasicMaterial({ map: makeSafetyCardTexture(), color: '#D8CEE4' })
);
safetyCard.rotation.x = -Math.PI / 2;
safetyCard.rotation.z = 0.42;
safetyCard.position.set(-0.28, 0.015, 3.98);
scene.add(safetyCard);

// ---------------------------------------------------------------------------
// 7. Animated 2D Cel Character Billboards + Contact Shadows
// ---------------------------------------------------------------------------
function makeContactShadowTex() {
  const sc = document.createElement('canvas');
  sc.width = 128; sc.height = 128;
  const sg = sc.getContext('2d');
  const g = sg.createRadialGradient(64, 64, 6, 64, 64, 60);
  g.addColorStop(0, 'rgba(14,16,46,0.62)');
  g.addColorStop(1, 'rgba(14,16,46,0)');
  sg.fillStyle = g;
  sg.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(sc);
}
const shadowTex = makeContactShadowTex();

function createBillboardActor(tex, width, height, tint, shadowW = 0.95) {
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    color: new THREE.Color(tint),
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  scene.add(mesh);

  let shadow = null;
  if (shadowW > 0) {
    shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(shadowW, shadowW * 0.52),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    scene.add(shadow);
  }
  return { mesh, mat, shadow };
}

const heroRig = createHeroRig();
const heroActor = createBillboardActor(heroRig.texture, 1.32, 1.98, '#E2D8EC', 0.95);

const peekingRig = createPeekingRig();
const peekingActor = createBillboardActor(peekingRig.texture, 0.92, 0.92, '#D8D0E8', 0);

const leadZombieRig = createLeadZombieRig();
const leadZombieActor = createBillboardActor(leadZombieRig.texture, 1.48, 2.22, '#DFBCC8', 1.08);

const attendantRig = createAttendantZombieRig();
const attendantActor = createBillboardActor(attendantRig.texture, 1.44, 2.16, '#D4A4B0', 0.98);

const rearActor = createBillboardActor(makeRearZombieTexture(), 1.42, 2.13, '#CE8A98', 0.90);

function orientBillboard(actor, x, y, z, visible = true) {
  actor.mesh.visible = visible;
  if (actor.shadow) actor.shadow.visible = visible;
  if (!visible) return;
  actor.mesh.position.set(x, y, z);
  actor.mesh.rotation.y = Math.atan2(camera.position.x - x, camera.position.z - z);
  if (actor.shadow) actor.shadow.position.set(x, 0.016, z);
}

// ---------------------------------------------------------------------------
// 8. Pendulum-Swinging Dangling 2D Yellow Oxygen Masks (Pivot at Top Ceiling!)
// ---------------------------------------------------------------------------
const oxyTex = makeOxygenMaskTexture();
const maskPivots = [];
for (const m of [
  { x: 0.68, y: 2.82, z: 4.35, w: 0.44, h: 0.88, baseRz: -0.09, phase: 0.0, amp: 0.14, tint: '#DCD4E8' },
  { x: -0.62, y: 2.90, z: 2.15, w: 0.42, h: 0.84, baseRz: 0.11, phase: 1.7, amp: 0.12, tint: '#DDD6EA' },
  { x: 0.56, y: 2.94, z: 0.35, w: 0.42, h: 0.84, baseRz: -0.07, phase: 3.1, amp: 0.11, tint: '#D4C8E2' },
  { x: -0.42, y: 2.97, z: -2.45, w: 0.42, h: 0.84, baseRz: 0.08, phase: 4.5, amp: 0.10, tint: '#D4A8B8' },
]) {
  const pivot = new THREE.Group();
  pivot.position.set(m.x, m.y, m.z);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(m.w, m.h),
    new THREE.MeshBasicMaterial({
      map: oxyTex,
      color: new THREE.Color(m.tint),
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
    })
  );
  mesh.position.y = -m.h * 0.5;
  pivot.add(mesh);
  scene.add(pivot);
  maskPivots.push({ pivot, ...m });
}

// ---------------------------------------------------------------------------
// 9. Post-Processing Pipeline (High-Threshold UnrealBloomPass Protects 2D Ink!)
// ---------------------------------------------------------------------------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(new THREE.Vector2(GL_W, GL_H), 0.42, 0.58, 0.80);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------------------------------------------------------------------------
// 10. 2D Finish Overlay + Offscreen Ghost & Composite Canvases
// ---------------------------------------------------------------------------
const overlay = document.createElement('canvas');
overlay.width = W;
overlay.height = H;
overlay.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;';
document.body.appendChild(overlay);
const og = overlay.getContext('2d');

// Previous-frame buffer for authentic T2 3-frame Whip-Pitch ghost double-exposure!
const prevCanvas = document.createElement('canvas');
prevCanvas.width = W;
prevCanvas.height = H;
const prevCtx = prevCanvas.getContext('2d');
prevCtx.imageSmoothingEnabled = true;
prevCtx.imageSmoothingQuality = 'high';
let hasPrev = false;

// Composite export canvas (720x1280 WebGL upscaled high-quality + native 1080x1920 2D overlay!)
const compCanvas = document.createElement('canvas');
compCanvas.width = W;
compCanvas.height = H;
const compCtx = compCanvas.getContext('2d', { willReadFrequently: true });
compCtx.imageSmoothingEnabled = true;
compCtx.imageSmoothingQuality = 'high';

// Precomputed floating dust motes (deterministic smooth drift!)
function seeded(s) {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = seeded(404);
const dustMotes = Array.from({ length: 42 }, () => ({
  x: rng() * W,
  y: rng() * H,
  vx: (rng() - 0.5) * 28,
  vy: -12 - rng() * 24,
  r: 1.6 + rng() * 3.4,
  isWarm: rng() > 0.42,
  alpha: 0.14 + rng() * 0.25,
}));

function drawOverlay(st) {
  og.clearRect(0, 0, W, H);

  // 1. Authentic T2 3-frame whip-pitch ghost double-exposure (Reference T01 f28-30!)
  if (st.whipGhostAlpha > 0.01 && hasPrev) {
    og.save();
    og.globalAlpha = st.whipGhostAlpha;
    og.drawImage(prevCanvas, 0, 0);
    og.restore();
  }

  // 2. Drifting cabin dust motes (frozen cleanly at f270-299!)
  for (const d of dustMotes) {
    const x = ((d.x + st.t * d.vx) % W + W) % W;
    const y = ((d.y + st.t * d.vy) % H + H) % H;
    const g = og.createRadialGradient(x, y, 0.2, x, y, d.r * 2.4);
    if (st.isColdShot) {
      g.addColorStop(0, `rgba(150,192,255,${d.alpha})`);
      g.addColorStop(1, 'rgba(90,130,255,0)');
    } else if (d.isWarm) {
      g.addColorStop(0, `rgba(255,226,175,${d.alpha})`);
      g.addColorStop(1, 'rgba(255,200,130,0)');
    } else {
      g.addColorStop(0, `rgba(255,130,122,${d.alpha})`);
      g.addColorStop(1, 'rgba(255,80,75,0)');
    }
    og.fillStyle = g;
    og.beginPath();
    og.arc(x, y, d.r * 2.4, 0, Math.PI * 2);
    og.fill();
  }

  // 3. Signature Lifted Saturated Indigo / Cold-Cobalt Radial Vignette
  const vig = og.createRadialGradient(W * 0.49, H * 0.50, W * 0.22, W * 0.50, H * 0.50, H * 0.60);
  if (st.isColdShot) {
    vig.addColorStop(0.0, 'rgba(12,18,62,0)');
    vig.addColorStop(0.55, 'rgba(12,18,62,0.26)');
    vig.addColorStop(0.84, 'rgba(12,18,66,0.72)');
    vig.addColorStop(1.0, 'rgba(12,18,68,0.88)');
  } else {
    vig.addColorStop(0.0, 'rgba(15,16,54,0)');
    vig.addColorStop(0.55, 'rgba(15,16,54,0.22)');
    vig.addColorStop(0.84, 'rgba(14,15,54,0.68)');
    vig.addColorStop(1.0, 'rgba(14,15,56,0.86)');
  }
  og.fillStyle = vig;
  og.fillRect(0, 0, W, H);

  // 4. T4 (Family D): Blinding Storm-Lightning / Alarm Blow-Out Flash Overlay
  if (st.blowOutAlpha > 0.005) {
    const fg = og.createRadialGradient(W * 0.5, H * 0.45, 30, W * 0.5, H * 0.45, H * 0.82);
    const a1 = Math.min(1, st.blowOutAlpha * 1.08);
    const a2 = Math.min(1, st.blowOutAlpha * 0.96);
    fg.addColorStop(0.0, `rgba(255,250,244,${a1.toFixed(4)})`);
    fg.addColorStop(0.65, `rgba(224,234,255,${a2.toFixed(4)})`);
    fg.addColorStop(1.0, `rgba(195,212,255,${(st.blowOutAlpha * 0.92).toFixed(4)})`);
    og.fillStyle = fg;
    og.fillRect(0, 0, W, H);
  }

  // 5. Reference-Accurate 1-2 Word Storyteller Captions (y = 70.5%, thick black stroke, dead-still)
  if (SHOW_CAPTION && st.caption && st.blowOutAlpha < 0.72) {
    const fontSize = Math.round(W * 0.076); // 82px
    const strokeW = Math.round(fontSize * 0.16);
    og.save();
    og.font = `900 ${fontSize}px "Liberation Sans", "DejaVu Sans", Arial, sans-serif`;
    og.textAlign = 'center';
    og.textBaseline = 'middle';
    og.lineJoin = 'round';
    og.shadowColor = 'rgba(0,0,0,0.50)';
    og.shadowBlur = 14;
    og.shadowOffsetY = 5;
    og.strokeStyle = '#07060D';
    og.lineWidth = strokeW;
    og.strokeText(st.caption, W * 0.5, H * 0.705);
    og.shadowColor = 'transparent';
    og.fillStyle = '#FCFDFD';
    og.fillText(st.caption, W * 0.5, H * 0.705);
    og.restore();
  }
}

// ---------------------------------------------------------------------------
// 11. Master Per-Frame Render Function (Deterministic for any frame 0..299)
// ---------------------------------------------------------------------------
export function renderFrame(frameIdx) {
  const st = evaluateFrame(frameIdx);

  // Camera pose & optics
  camera.fov = st.camera.fov;
  camera.position.set(...st.camera.pos);
  camera.lookAt(...st.camera.target);
  camera.rotateZ(THREE.MathUtils.degToRad(st.camera.rollDeg));
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  // Palette & Lighting Mode (Gloom vs Cold-Cobalt Shot 5!)
  if (st.isColdShot) {
    scene.background.copy(coldBg);
    scene.fog.color.set('#11184C');
    scene.fog.density = 0.036;
    ambientLift.color.set('#223494');
    ambientLift.intensity = 0.85;
    hemi.color.set('#5C84FF');
    hemi.groundColor.set('#1C2678');
    hemi.intensity = 1.05;
    heroReadingLight.intensity = 0.4;
    trolleyWarm.intensity = 0.0;
    coldRimLight.intensity = 7.2;
    exitCrimsonFar.intensity = 14.0;
    exitCrimsonMid.intensity = 2.8;
    warmFloorDecal.visible = false;
    redFloorDecal.visible = true;
    for (const s of lightShafts) s.visible = false;
    trolleyGroup.visible = false; // clean intimate close-up unobstructed by trolley corners
    heroActor.mat.color.set('#C8D6F5');
    bloom.strength = 0.38;
  } else {
    scene.background.copy(gloomBg);
    scene.fog.color.set('#181B52');
    scene.fog.density = 0.028;
    ambientLift.color.set('#283188');
    ambientLift.intensity = 0.72 + st.s1Lightning * 0.35;
    hemi.color.set('#6E7FE8');
    hemi.groundColor.set('#282E7C');
    hemi.intensity = 1.12 + st.s1Lightning * 0.55;
    portholeFlashLight.intensity = st.s1Lightning * 14.0;
    heroReadingLight.intensity = 6.4 * st.readingLampMult * st.strobeWarm;
    trolleyWarm.intensity = 3.4 * st.strobeWarm;
    coldRimLight.intensity = 0.0;
    exitCrimsonFar.intensity = 17.5 * st.strobeRed;
    exitCrimsonMid.intensity = 8.2 * st.strobeRed;
    warmFloorDecal.visible = true;
    redFloorDecal.visible = true;
    for (const s of lightShafts) s.visible = st.readingLampMult > 0.5 && st.strobeWarm > 0.6;
    trolleyGroup.visible = true;
    heroActor.mat.color.set('#E2D8EC');
    bloom.strength = 0.42 + st.s1Lightning * 0.18;
  }

  // Dynamic HDR emissives (pulsing floor LEDs, active reading bulb flicker, animated storm porthole)
  ledStripMat.color.setRGB(2.75 * st.ledPulse, 2.38 * st.ledPulse, 1.58 * st.ledPulse);
  bulbOnMat.color.setRGB(
    3.3 * st.readingLampMult * st.strobeWarm,
    2.95 * st.readingLampMult * st.strobeWarm,
    2.25 * st.readingLampMult * st.strobeWarm
  );
  if (st.frame <= 54 || lastRigFrame < 0) {
    heroPortholeRig.update(st.frame, st.s1Lightning);
  }
  heroPortMat.color.setRGB(
    1.15 + st.s1Lightning * 0.85,
    1.20 + st.s1Lightning * 0.90,
    1.32 + st.s1Lightning * 1.05
  );

  // Animated 3D props (rolling red can, rattling popped overhead bin doors, pendulum oxygen masks)
  canRed.position.set(...st.redCanPos);
  canRed.rotation.y = 0.2 + st.redCanSpin;
  for (const d of poppedDoors) {
    d.mesh.rotation.z = d.baseRz + d.side * st.binRattle;
  }
  for (const mp of maskPivots) {
    mp.pivot.visible = !st.isColdShot;
    mp.pivot.rotation.z = mp.baseRz + Math.sin(st.t * 2.6 + mp.phase) * mp.amp;
  }

  // Update animated 2D cel character rigs on authentic 15-FPS twos + exact expression key frames
  const forceRig = lastRigFrame < 0 || Math.abs(st.frame - lastRigFrame) >= 2 ||
    st.frame === 68 || st.frame === 71 || st.frame === 72 ||
    st.frame === 104 || st.frame === 107 ||
    st.frame === 226 || st.frame === 257 || st.frame === 261 || st.frame === 270;

  if (forceRig) {
    heroRig.update(st.hero);
    if (st.peeking.visible) peekingRig.update(st.peeking);
    if (st.leadZombie.visible) leadZombieRig.update(st.leadZombie);
    if (st.attendant.visible) attendantRig.update(st.attendant);
    lastRigFrame = st.frame;
  }

  orientBillboard(heroActor, st.hero.x, st.hero.y, st.hero.z, true);
  orientBillboard(peekingActor, st.peeking.x, st.peeking.y, st.peeking.z, st.peeking.visible);
  orientBillboard(leadZombieActor, st.leadZombie.x, st.leadZombie.y, st.leadZombie.z, st.leadZombie.visible);
  orientBillboard(attendantActor, st.attendant.x, st.attendant.y, st.attendant.z, st.attendant.visible);
  orientBillboard(rearActor, st.rearZombie.x, st.rearZombie.y, st.rearZombie.z, st.rearZombie.visible);

  // Render 3D WebGL2 + UnrealBloomPass, then 2D atmospheric finish overlay
  composer.render();
  drawOverlay(st);

  // Composite both layers onto compCanvas and stash clean previous frame for T2 whip-ghost
  compCtx.drawImage(renderer.domElement, 0, 0, W, H);
  compCtx.drawImage(overlay, 0, 0, W, H);

  if (st.whipGhostAlpha <= 0.01) {
    prevCtx.drawImage(renderer.domElement, 0, 0, W, H);
    hasPrev = true;
  }
}

let lastRigFrame = -1;
window.renderFrame = renderFrame;

// ---------------------------------------------------------------------------
// 12. Boot Mode: Single Debug Frame vs Parallel Worker Stream to Node/ffmpeg
// ---------------------------------------------------------------------------
if (MODE === 'stream') {
  (async () => {
    try {
      // Warm up prevCanvas if starting mid-video
      if (START_FRAME > 0) renderFrame(START_FRAME - 1);
      let cachedFreezeBuf = null;
      for (let f = START_FRAME; f < END_FRAME; f++) {
        let rawBuf;
        if (f > 270 && cachedFreezeBuf) {
          // Exact 1.00s freeze hold (f270-299): bit-identical cached RGBA buffer!
          rawBuf = cachedFreezeBuf;
        } else {
          renderFrame(f);
          const imgData = compCtx.getImageData(0, 0, W, H);
          rawBuf = imgData.data.buffer;
          if (f === 270) cachedFreezeBuf = rawBuf.slice(0);
        }
        const res = await fetch(`/frame/${WORKER_ID}/${f}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: rawBuf,
        });
        if (!res.ok) throw new Error(`POST /frame/${WORKER_ID}/${f} failed: ${res.status}`);
      }
      await fetch(`/done/${WORKER_ID}`, { method: 'POST' });
    } catch (err) {
      await fetch(`/error/${WORKER_ID}`, { method: 'POST', body: String(err && err.stack || err) }).catch(() => {});
    }
  })();
} else if (MODE === 'keyframes') {
  // Fast multi-keyframe PNG dump in a single Chromium session!
  const list = (params.get('list') || '14,85,126,148,198,226,252,285').split(',').map(Number);
  (async () => {
    try {
      for (const f of list) {
        // Warm up prev frame right before whip frame so ghost blend renders accurately!
        if (f > 118 && f < 136) renderFrame(f - 3);
        renderFrame(f);
        const blob = await new Promise((resolve) => compCanvas.toBlob(resolve, 'image/png'));
        const res = await fetch(`/keyframe/${f}`, {
          method: 'POST',
          headers: { 'Content-Type': 'image/png' },
          body: blob,
        });
        if (!res.ok) throw new Error(`POST /keyframe/${f} failed: ${res.status}`);
      }
      await fetch('/done', { method: 'POST' });
    } catch (err) {
      await fetch('/error', { method: 'POST', body: String(err && err.stack || err) }).catch(() => {});
    }
  })();
} else {
  renderFrame(SINGLE_FRAME);
  window.__SCENE_READY__ = true;
}
