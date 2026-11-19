// True 2.5D Hybrid Scene: Zombie Apocalypse Inside an Airplane (1080x1920 Vertical)
// Built strictly following Every_Memory_Has_a_Price_25D_Code_Skill.zip:
//   - Wide-angle 3D lit aircraft fuselage diorama (Three.js + UnrealBloomPass @ threshold 0.88)
//   - Saturated lifted indigo cabin gloom + warm amber reading lamps/floor LEDs + crimson aft EXIT bleed
//   - Depth-sorted 2D hand-drawn cel-shaded characters (Canvas2D RGBA billboards w/ contact shadows)
//   - True 3D foreground occluders (overturned drink trolley, seatbacks, near-lens oxygen mask)
//   - 2D atmospheric dust motes, saturated indigo radial vignette & optional 1-2 word caption
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
  makeExitSignTexture,
  makeSeatbeltSignTexture,
  makeTrolleyMetalTexture,
  makeSafetyCardTexture,
  makeGalleyCurtainTexture,
} from './textures.js';

import {
  makeHeroPassengerTexture,
  makePeekingSurvivorTexture,
  makeLeadZombieTexture,
  makeAttendantZombieTexture,
  makeRearZombieTexture,
  makeOxygenMaskTexture,
} from './characters2d.js';

const W = 1080;
const H = 1920;
const params = new URLSearchParams(window.location.search);
const SHOW_CAPTION = params.get('caption') === '1';

// ---------------------------------------------------------------------------
// 1. Renderer, Scene, Fog & Wide-Angle Vertical Camera (~20mm equiv, +4.0 deg Dutch Roll)
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
});
renderer.setSize(W, H, false);
renderer.setPixelRatio(1);
renderer.domElement.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;display:block;';
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#141640');
scene.fog = new THREE.FogExp2('#181B52', 0.028);

const camera = new THREE.PerspectiveCamera(74, W / H, 0.1, 80);
camera.position.set(0.16, 1.46, 6.15);
camera.lookAt(-0.04, 1.38, -8.5);
camera.rotateZ(THREE.MathUtils.degToRad(3.6)); // Subtle turbulence Dutch roll
camera.updateMatrixWorld();

// ---------------------------------------------------------------------------
// 2. 3D Lighting Rig (Lifted Saturated Indigo Gloom + Warm Reading Lamps + Crimson Aft EXIT)
// ---------------------------------------------------------------------------
const ambientLift = new THREE.AmbientLight('#283188', 0.72); // guarantees rich lifted indigo shadows (never #000000!)
scene.add(ambientLift);

const hemi = new THREE.HemisphereLight('#6E7FE8', '#282E7C', 1.12);
scene.add(hemi);

// Cool storm-window directional key casting soft 2048px shadows across cabin seats
const stormKey = new THREE.DirectionalLight('#738BF8', 0.88);
stormKey.position.set(-7.5, 5.5, 4.5);
stormKey.castShadow = true;
stormKey.shadow.mapSize.set(2048, 2048);
stormKey.shadow.camera.near = 0.5;
stormKey.shadow.camera.far = 32;
stormKey.shadow.camera.left = -8;
stormKey.shadow.camera.right = 8;
stormKey.shadow.camera.top = 8;
stormKey.shadow.camera.bottom = -4;
stormKey.shadow.bias = -0.0006;
scene.add(stormKey);

// Warm amber reading spotlight pool illuminating the crouching Hero & foreground aisle
const heroReadingLight = new THREE.PointLight('#FFC97A', 6.4, 7.6, 1.6);
heroReadingLight.position.set(-0.42, 2.22, 2.85);
scene.add(heroReadingLight);

// Secondary soft warm fill near foreground overturned trolley
const trolleyWarm = new THREE.PointLight('#FFB466', 3.4, 5.8, 1.55);
trolleyWarm.position.set(0.35, 1.42, 4.15);
scene.add(trolleyWarm);

// Saturated cobalt foreground boost to keep lower edges & seat bases richly indigo without over-lighting upper bins
const indigoFgBoost = new THREE.PointLight('#365BFF', 4.2, 8.2, 1.6);
indigoFgBoost.position.set(-0.55, 1.35, 5.25);
scene.add(indigoFgBoost);

const indigoUpperFill = new THREE.PointLight('#3450E8', 1.4, 7.5, 1.6);
indigoUpperFill.position.set(0.55, 1.45, 4.4);
scene.add(indigoUpperFill);

// Crimson aft EXIT spill backlighting the approaching zombie horde (S18 OPERATING homage!)
const exitCrimsonFar = new THREE.PointLight('#FF362E', 17.5, 15.5, 1.3);
exitCrimsonFar.position.set(0.0, 2.25, -8.8);
scene.add(exitCrimsonFar);

const exitCrimsonMid = new THREE.PointLight('#FF4238', 8.2, 11.0, 1.45);
exitCrimsonMid.position.set(0.05, 2.1, -3.2);
scene.add(exitCrimsonMid);

// Helper
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
// 3. Curved 3D Airplane Fuselage Shell, Floor Carpet, Overhead Bins & Portholes
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

// Main cylindrical fuselage tube (radius 2.28m, length 21m along Z)
const fuselage = new THREE.Mesh(
  new THREE.CylinderGeometry(2.28, 2.28, 21.5, 28, 1, true),
  wallMat
);
fuselage.rotation.x = Math.PI / 2;
fuselage.position.set(0, 1.18, -1.5);
fuselage.receiveShadow = true;
scene.add(fuselage);

// Ribbed dark indigo cabin floor & aisle carpet (matte roughness 0.94 — zero clearcoat dots!)
const carpetMat = new THREE.MeshStandardMaterial({
  map: makeCarpetTexture(),
  roughness: 0.94,
  metalness: 0.0,
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 22.0), carpetMat);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, 0.0, -1.4);
floor.receiveShadow = true;
scene.add(floor);

// Converging warm amber emergency floor-path guide LED strips down left & right aisle edges (HDR bloom!)
const ledStripMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.75, 2.38, 1.58) });
for (const sx of [-0.66, 0.66]) {
  for (let z = 5.6; z >= -10.0; z -= 0.52) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.28), ledStripMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(sx, 0.008, z);
    scene.add(dash);
  }
}

// Painterly additive floor sheen decals (warm foreground hero pool + crimson aft zombie pool)
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
}
addFloorDecal(-0.26, 2.75, 2.3, 3.8, 'rgba(255,204,132,0.34)', 'rgba(220,160,115,0.14)', 'rgba(80,75,140,0)');
addFloorDecal(0.05, -2.6, 2.5, 7.6, 'rgba(255,68,58,0.44)', 'rgba(195,42,68,0.18)', 'rgba(40,20,75,0)');

// Curved structural cabin rib arches every 1.55m for rich wide-angle perspective rhythm
const ribMat = new THREE.MeshStandardMaterial({ color: '#2C3372', roughness: 0.78 });
for (let z = 4.6; z >= -9.8; z -= 1.55) {
  const rib = new THREE.Mesh(new THREE.TorusGeometry(2.24, 0.045, 8, 28, Math.PI * 1.18), ribMat);
  rib.position.set(0, 1.18, z);
  rib.rotation.z = -Math.PI * 0.09;
  scene.add(rib);
}

// Overhead Luggage Bins (Left & Right continuous curved storage bays + 2 popped open!)
const binMatClosed = new THREE.MeshStandardMaterial({
  map: makeBinDoorTexture('12 - 14'),
  color: '#9BA4D8',
  roughness: 0.78,
});
const binMatMid = new THREE.MeshStandardMaterial({
  map: makeBinDoorTexture('09 - 11'),
  color: '#9BA4D8',
  roughness: 0.78,
});
const binDarkInside = new THREE.MeshStandardMaterial({ color: '#222660', roughness: 0.88 });
const suitcaseMat = new THREE.MeshStandardMaterial({ color: '#7A3346', roughness: 0.8 });

const binZs = [4.0, 2.0, 0.0, -2.0, -4.0, -6.0, -8.0, -9.8];
for (let i = 0; i < binZs.length; i++) {
  const bz = binZs[i];
  const bMat = i < 3 ? binMatClosed : binMatMid;
  for (const side of [-1, 1]) {
    addBox(1.15, 0.56, 1.92, binDarkInside, side * 1.38, 2.52, bz, { cast: false, receive: true });
    const isPopped = (side === -1 && i === 2) || (side === 1 && i === 3);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.56, 1.86), bMat);
    if (isPopped) {
      door.position.set(side * 0.72, 2.26, bz);
      door.rotation.z = side * 0.72;
      addBox(0.55, 0.34, 0.72, suitcaseMat, side * 0.98, 2.38, bz + 0.12, { cast: true, rz: side * 0.25 });
    } else {
      door.position.set(side * 0.80, 2.48, bz);
      door.rotation.z = side * 0.28;
    }
    scene.add(door);
  }
}

// Overhead ceiling center valance & HDR glowing reading lamp bulbs + SOFT feathered light beams!
const ceilingValanceMat = new THREE.MeshStandardMaterial({ color: '#2E3576', roughness: 0.84 });
addBox(1.18, 0.12, 20.0, ceilingValanceMat, 0, 3.06, -1.6);

// HDR emissive bulbs (linear > 2.5 punches past ACESFilmic into true filmic bloom >235!)
const bulbOnMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.3, 2.95, 2.25) });
const bulbDimMat = new THREE.MeshBasicMaterial({ color: '#7684D6' });

// Soft feathered Gaussian volumetric shaft texture (ZERO hard geometric triangle edges!)
const beamCanvas = document.createElement('canvas');
beamCanvas.width = 256; beamCanvas.height = 512;
const bg = beamCanvas.getContext('2d');
for (let y = 0; y < 512; y++) {
  const v = y / 511; // 0 top -> 1 bottom
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

for (const lx of [-0.42, 0.42]) {
  for (const lz of [3.05, 0.85, -1.65, -4.45]) {
    const isLit = (lz === 3.05 && lx < 0) || (lz === 0.85 && lx > 0);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.105, 18), isLit ? bulbOnMat : bulbDimMat);
    disc.rotation.x = Math.PI / 2;
    disc.position.set(lx, 2.98, lz);
    scene.add(disc);

    if (isLit) {
      // Soft feathered volumetric plane placed slightly behind hero/zombie depth so ink lines never wash out!
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.85), beamMat);
      shaft.position.set(lx, 1.56, lz - 0.12);
      scene.add(shaft);
    }
  }
}

// Single front illuminated FASTEN SEAT BELT bar (front face only — clean dark housing on underside!)
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

// Recessed Oval Porthole Windows along Left & Right Curved Walls
const portCalmMat = new THREE.MeshBasicMaterial({ map: makePortholeTexture(false) });
const portStormMat = new THREE.MeshBasicMaterial({
  map: makePortholeTexture(true),
  color: new THREE.Color(1.55, 1.65, 2.05), // subtle lightning window bloom!
});
const winZs = [3.9, 2.35, 0.8, -0.75, -2.3, -3.85, -5.4, -6.95, -8.5];
for (let i = 0; i < winZs.length; i++) {
  const wz = winZs[i];
  for (const side of [-1, 1]) {
    const isFlash = (side === -1 && i === 1) || (side === 1 && i === 3);
    const wMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.62), isFlash ? portStormMat : portCalmMat);
    wMesh.position.set(side * 2.13, 1.46, wz);
    wMesh.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
    scene.add(wMesh);
  }
}

// ---------------------------------------------------------------------------
// 4. Aft Bulkhead Wall, Exit Door, Ripped Galley Curtain & UNOBSTRUCTED Glowing Crimson EXIT Sign
// ---------------------------------------------------------------------------
const bulkheadMat = new THREE.MeshStandardMaterial({ color: '#2B2F68', roughness: 0.85 });
addBox(4.8, 3.6, 0.3, bulkheadMat, 0, 1.7, -10.65);

// Dark rear exit doorway frame
const doorMat = new THREE.MeshStandardMaterial({ color: '#1B1D48', roughness: 0.72 });
addBox(1.18, 2.05, 0.12, doorMat, -0.10, 1.02, -10.46);

// Ripped dark-indigo galley curtain on right side of bulkhead
const curtainMat = new THREE.MeshStandardMaterial({ map: makeGalleyCurtainTexture(), roughness: 0.9, side: THREE.DoubleSide });
const curtain = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 2.25), curtainMat);
curtain.position.set(1.05, 1.15, -10.22);
curtain.rotation.z = -0.06;
scene.add(curtain);

// UNOBSTRUCTED HDR Glowing Crimson EXIT Lightbox raised cleanly above zombie heads!
const exitFrontMat = new THREE.MeshBasicMaterial({
  map: makeExitSignTexture(),
  color: new THREE.Color(3.1, 1.6, 1.55), // HDR boost triggers true crimson-white bloom!
});
const exitCaseMat = new THREE.MeshStandardMaterial({ color: '#241838', roughness: 0.72 });
const exitSign = new THREE.Mesh(
  new THREE.BoxGeometry(1.22, 0.42, 0.14),
  [exitCaseMat, exitCaseMat, exitCaseMat, exitCaseMat, exitFrontMat, exitCaseMat]
);
exitSign.position.set(-0.02, 2.60, -9.90);
scene.add(exitSign);

// Soft crimson halo plane behind EXIT sign for rich atmospheric glow
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
// 5. 10 Rows of 3D Airplane Seats (2 Left + 2 Right of Center Aisle)
// ---------------------------------------------------------------------------
const seatTex = makeSeatBackTexture();
const seatBackMat = new THREE.MeshStandardMaterial({
  map: seatTex.map,
  bumpMap: seatTex.bumpMap,
  bumpScale: 0.025,
  roughness: 0.86,
});
const seatSideMat = new THREE.MeshStandardMaterial({ color: '#292F6C', roughness: 0.88 });
const armMat = new THREE.MeshStandardMaterial({ color: '#1B1E48', roughness: 0.72 });

const seatMaterials = [seatSideMat, seatSideMat, seatSideMat, seatSideMat, seatBackMat, seatSideMat];
const rowZs = [4.95, 3.45, 1.95, 0.45, -1.05, -2.55, -4.05, -5.55, -7.05, -8.55];
const seatXs = [-1.66, -1.08, 1.08, 1.66];

for (let r = 0; r < rowZs.length; r++) {
  const rz = rowZs[r];
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
// 6. 3D FOREGROUND OCCLUDER: Overturned Aluminum Drink Trolley + Soda Cans + Safety Card
// ---------------------------------------------------------------------------
const trolleyGroup = new THREE.Group();
const trolleyMat = new THREE.MeshStandardMaterial({
  map: makeTrolleyMetalTexture(),
  roughness: 0.62,
  metalness: 0.20,
});
const wheelMat = new THREE.MeshStandardMaterial({ color: '#1B1D42', roughness: 0.85 });

const trolleyBody = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.98, 0.78), trolleyMat);
trolleyBody.castShadow = true;
trolleyBody.receiveShadow = true;
trolleyGroup.add(trolleyBody);

for (const wy of [-0.52]) {
  for (const wx of [-0.20, 0.20]) {
    for (const wz of [-0.28, 0.28]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 14), wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, wy, wz);
      trolleyGroup.add(w);
    }
  }
}
trolleyGroup.position.set(0.46, 0.34, 3.65);
trolleyGroup.rotation.set(0.14, -0.44, 1.32);
scene.add(trolleyGroup);

// Scattered aluminum soda cans on aisle carpet near trolley
const canRedMat = new THREE.MeshStandardMaterial({ color: '#D1424A', roughness: 0.45, metalness: 0.25 });
const canBlueMat = new THREE.MeshStandardMaterial({ color: '#467CD4', roughness: 0.45, metalness: 0.25 });
const can1 = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.125, 14), canRedMat);
can1.position.set(-0.08, 0.036, 3.72);
can1.rotation.set(Math.PI / 2, 0.3, 0.65);
scene.add(can1);

const can2 = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.125, 14), canBlueMat);
can2.position.set(0.24, 0.036, 4.25);
can2.rotation.set(Math.PI / 2, -0.2, -0.5);
scene.add(can2);

// Dropped 2D Graphic Airline Safety Card lying flat on aisle carpet
const safetyCard = new THREE.Mesh(
  new THREE.PlaneGeometry(0.28, 0.38),
  new THREE.MeshBasicMaterial({ map: makeSafetyCardTexture(), color: '#D8CEE4' })
);
safetyCard.rotation.x = -Math.PI / 2;
safetyCard.rotation.z = 0.42;
safetyCard.position.set(-0.28, 0.015, 3.98);
scene.add(safetyCard);

// ---------------------------------------------------------------------------
// 7. 2D CEL-SHADED CHARACTER BILLBOARDS (Depth-Sorted Inside 3D Scene + Contact Shadows!)
// ---------------------------------------------------------------------------
function addCharacterBillboard(tex, {
  x, y, z, width, height, tint = '#DED6EC', shadowW = 0.9, shadowY = 0.016,
}) {
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
    const g = sg.createRadialGradient(64, 64, 6, 64, 64, 60);
    g.addColorStop(0, 'rgba(14,16,46,0.62)');
    g.addColorStop(1, 'rgba(14,16,46,0)');
    sg.fillStyle = g;
    sg.fillRect(0, 0, 128, 128);
    const sTex = new THREE.CanvasTexture(sc);
    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(shadowW, shadowW * 0.52),
      new THREE.MeshBasicMaterial({ map: sTex, transparent: true, depthWrite: false })
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.set(x, shadowY, z);
    scene.add(sh);
  }
  return mesh;
}

// (A) Hero Passenger crouching beside overturned drink trolley (left-foreground, warm lamp key)
addCharacterBillboard(makeHeroPassengerTexture(), {
  x: -0.44, y: 0.92, z: 2.78,
  width: 1.32, height: 1.98,
  tint: '#E2D8EC', // stays cleanly below 0.88 bloom threshold!
  shadowW: 0.95,
});

// (B) Peeking Terrified Survivor BEHIND Row-3 Right 3D Seatback (gripping top headrest cloth!)
addCharacterBillboard(makePeekingSurvivorTexture(), {
  x: 1.08, y: 1.46, z: 1.68,
  width: 0.92, height: 0.92,
  tint: '#D8D0E8',
  shadowW: 0,
});

// (C) Lead Lunging Zombie in center-right aisle (clean silhouette separated from Hero!)
addCharacterBillboard(makeLeadZombieTexture(), {
  x: 0.24, y: 1.06, z: -0.35,
  width: 1.48, height: 2.22,
  tint: '#DFBCC8', // catches crimson aft wash while keeping 2D ink razor-sharp!
  shadowW: 1.08,
});

// (D) Flight Attendant Zombie shambling from left seats into crimson mid-aft aisle
addCharacterBillboard(makeAttendantZombieTexture(), {
  x: -0.32, y: 1.04, z: -3.25,
  width: 1.44, height: 2.16,
  tint: '#D4A4B0',
  shadowW: 0.98,
});

// (E) Deep Aft Silhouette Zombie emerging out of the crimson EXIT haze
addCharacterBillboard(makeRearZombieTexture(), {
  x: 0.26, y: 1.02, z: -6.15,
  width: 1.42, height: 2.13,
  tint: '#CE8A98',
  shadowW: 0.90,
});

// ---------------------------------------------------------------------------
// 8. Dangling 2D Yellow Oxygen Masks (4 Depth Layers Including Near-Lens Occluder!)
// ---------------------------------------------------------------------------
const oxyTex = makeOxygenMaskTexture();
for (const m of [
  { x: 0.68, y: 2.38, z: 4.35, w: 0.44, h: 0.88, rz: -0.10, tint: '#DCD4E8' },
  { x: -0.62, y: 2.48, z: 2.15, w: 0.42, h: 0.84, rz: 0.12, tint: '#DDD6EA' },
  { x: 0.56, y: 2.52, z: 0.35, w: 0.42, h: 0.84, rz: -0.07, tint: '#D4C8E2' },
  { x: -0.42, y: 2.55, z: -2.45, w: 0.42, h: 0.84, rz: 0.08, tint: '#D4A8B8' },
]) {
  const maskMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(m.w, m.h),
    new THREE.MeshBasicMaterial({
      map: oxyTex,
      color: new THREE.Color(m.tint),
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
    })
  );
  maskMesh.position.set(m.x, m.y, m.z);
  maskMesh.rotation.z = m.rz;
  scene.add(maskMesh);
}

// ---------------------------------------------------------------------------
// 9. Post-Processing Pipeline (High-Threshold UnrealBloomPass Protects 2D Ink Lines!)
// ---------------------------------------------------------------------------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(W, H),
  0.42, // lush filmic halation on HDR EXIT sign, reading bulbs & floor LED strips
  0.58,
  0.80  // cleanly above all 2D character RGB values so black ink outlines stay 100% razor-sharp!
);
composer.addPass(bloom);
composer.addPass(new OutputPass());
composer.render();

// ---------------------------------------------------------------------------
// 10. 2D Atmospheric Finish Overlay (Floating Dust Motes, Lifted Indigo Vignette & Caption)
// ---------------------------------------------------------------------------
const overlay = document.createElement('canvas');
overlay.width = W;
overlay.height = H;
overlay.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;';
document.body.appendChild(overlay);
const og = overlay.getContext('2d');

function seeded(s) {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Subtle floating cabin dust motes catching amber foreground light & crimson aft glow
const rng = seeded(404);
for (let i = 0; i < 38; i++) {
  const x = rng() * W;
  const y = rng() * H;
  const r = 1.6 + rng() * 3.4;
  const isWarm = y > H * 0.42 || x < W * 0.45;
  const alpha = 0.14 + rng() * 0.26;
  const g = og.createRadialGradient(x, y, 0.2, x, y, r * 2.4);
  if (isWarm) {
    g.addColorStop(0, `rgba(255,226,175,${alpha})`);
    g.addColorStop(1, 'rgba(255,200,130,0)');
  } else {
    g.addColorStop(0, `rgba(255,130,122,${alpha})`);
    g.addColorStop(1, 'rgba(255,80,75,0)');
  }
  og.fillStyle = g;
  og.beginPath();
  og.arc(x, y, r * 2.4, 0, Math.PI * 2);
  og.fill();
}

// Signature Lifted Saturated Indigo Radial Vignette (frames 4 corners in deep indigo while preserving P05 B > 18!)
const vig = og.createRadialGradient(W * 0.49, H * 0.50, W * 0.22, W * 0.50, H * 0.50, H * 0.60);
vig.addColorStop(0.0, 'rgba(15,16,54,0)');
vig.addColorStop(0.55, 'rgba(15,16,54,0.22)');
vig.addColorStop(0.84, 'rgba(14,15,54,0.68)');
vig.addColorStop(1.0, 'rgba(14,15,56,0.86)');
og.fillStyle = vig;
og.fillRect(0, 0, W, H);

// Optional Reference-Accurate 1-2 Word Storyteller Caption (y = 70.5%)
if (SHOW_CAPTION) {
  const fontSize = Math.round(W * 0.076); // 82px at 1080w
  const strokeW = Math.round(fontSize * 0.16);
  og.save();
  og.font = `900 ${fontSize}px "Liberation Sans", "DejaVu Sans", Arial, sans-serif`;
  og.textAlign = 'center';
  og.textBaseline = 'middle';
  og.lineJoin = 'round';
  og.shadowColor = 'rgba(0,0,0,0.48)';
  og.shadowBlur = 14;
  og.shadowOffsetY = 5;
  og.strokeStyle = '#07060D';
  og.lineWidth = strokeW;
  og.strokeText('row twelve.', W * 0.5, H * 0.705);
  og.shadowColor = 'transparent';
  og.fillStyle = '#FCFDFD';
  og.fillText('row twelve.', W * 0.5, H * 0.705);
  og.restore();
}

window.__SCENE_READY__ = true;
