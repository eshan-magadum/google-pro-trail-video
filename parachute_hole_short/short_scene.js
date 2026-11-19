// 69-Second 2.5D Hybrid Cinema Engine: 'The Parachute With a Hole Cut in the Middle'
// 100% Code-Rendered (Three.js WebGL2 + Dynamic Canvas2D PBR & Cel Rigs).
// ZERO burned-in captions, ZERO sound effects, ZERO hard cuts across all 2,070 frames!
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import {
  makeHangarWallTexture,
  makeHangarFloorTexture,
  makeWoodTableTexture,
  makeDynamicSilkRig,
  makeCountdownClockTexture,
  makeBriefingBoardTexture,
  makeDonutBadgeTexture,
  makeCanopyTexture,
  makeCloudPuffTexture,
  makeBullseyeFieldTexture,
  makeCausticRayTexture,
  makeAirflowRibbonTexture,
} from './textures.js';

import {
  createHeroRig,
  createCommanderRig,
  createRivalRig,
} from './characters2d_rig.js';

import {
  evaluateWorldState,
  evaluateMasterFrame,
  TOTAL_FRAMES,
  FREEZE_START,
  lerp,
  clamp,
} from './timeline.js';

// Native 720x1280 WebGL2 + 2D finish (exact Every-Memory native res; Lanczos-upscaled to 1080x1920 in ffmpeg!)
const W = 720;
const H = 1280;
const params = new URLSearchParams(window.location.search);
const MODE = params.get('mode') || 'single';
const WORKER_ID = params.get('worker') || '0';
const START_FRAME = Number(params.get('start')) || 0;
const END_FRAME = params.has('end') ? Number(params.get('end')) : TOTAL_FRAMES;
const SINGLE_FRAME = Number(params.get('frame')) || 60;

// ---------------------------------------------------------------------------
// 1. WebGL2 Renderer, Shared Camera & High-Speed Post-Processing (360x640 Bloom!)
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
});
renderer.setSize(W, H, false);
renderer.setPixelRatio(1);
renderer.domElement.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;display:block;';
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, W / H, 0.08, 140);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(360, 640), 0.38, 0.56, 0.80);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// Shared dynamic lights (reconfigured cleanly per world)
const ambientLift = new THREE.AmbientLight('#2A348E', 0.78);
scene.add(ambientLift);
const hemi = new THREE.HemisphereLight('#788CF5', '#252B78', 1.15);
scene.add(hemi);
const keyDir = new THREE.DirectionalLight('#FFD28A', 1.25);
keyDir.position.set(4.5, 8.0, 5.5);
scene.add(keyDir);
const ptA = new THREE.PointLight('#FFC97A', 7.0, 14.0, 1.4);
scene.add(ptA);
const ptB = new THREE.PointLight('#4668FF', 4.5, 14.0, 1.5);
scene.add(ptB);

// Shared Helper: Contact shadow & Billboard Actor
function makeShadowTex() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 6, 64, 64, 60);
  gr.addColorStop(0, 'rgba(14,16,46,0.58)');
  gr.addColorStop(1, 'rgba(14,16,46,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const sharedShadowTex = makeShadowTex();

function makeBillboard(parent, tex, w, h, tint = '#E2DAEE', shadowW = 0) {
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    color: new THREE.Color(tint),
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  parent.add(mesh);
  let shadow = null;
  if (shadowW > 0) {
    shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(shadowW, shadowW * 0.5),
      new THREE.MeshBasicMaterial({ map: sharedShadowTex, transparent: true, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    parent.add(shadow);
  }
  return { mesh, mat, shadow };
}

function faceCamera(mesh) {
  mesh.rotation.y = Math.atan2(camera.position.x - mesh.position.x, camera.position.z - mesh.position.z);
}

// Shared Feathered Volumetric Lamp Shaft Texture
function makeShaftTex(rgbaCore = 'rgba(255,222,158,0.24)', rgbaEdge = 'rgba(255,212,140,0)') {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  for (let y = 0; y < 512; y++) {
    const v = y / 511;
    const hw = 18 + v * 108;
    const vf = Math.pow(1 - v, 1.3) * Math.min(1, v * 10);
    const gr = g.createLinearGradient(128 - hw, 0, 128 + hw, 0);
    gr.addColorStop(0, rgbaEdge);
    gr.addColorStop(0.5, rgbaCore.replace(/[\d.]+\)$/, `${(0.24 * vf).toFixed(4)})`));
    gr.addColorStop(1, rgbaEdge);
    g.fillStyle = gr;
    g.fillRect(0, y, 256, 1);
  }
  return new THREE.CanvasTexture(c);
}
const warmShaftTex = makeShaftTex();

// Shared Animated Character Rigs
const heroRig = createHeroRig();
const cmdRig = createCommanderRig();
const rivalRigs = [createRivalRig(0), createRivalRig(1), createRivalRig(2)];

// ===========================================================================
// WORLD 1: INDIGO HANGAR PACKING BAY (S01, S02, S03, S04)
// ===========================================================================
const hangarGroup = new THREE.Group();
scene.add(hangarGroup);

const hangarWallMat = new THREE.MeshStandardMaterial({ map: makeHangarWallTexture(), roughness: 0.84 });
const hangarFloorMat = new THREE.MeshStandardMaterial({ map: makeHangarFloorTexture(), roughness: 0.92 });
const woodMat = new THREE.MeshStandardMaterial({ map: makeWoodTableTexture(), roughness: 0.78 });
const steelDarkMat = new THREE.MeshStandardMaterial({ color: '#1F2456', roughness: 0.76 });

// Hangar floor, back wall, side walls, and grand curved steel ceiling ribs
{
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(22, 16), hangarFloorMat);
  fl.rotation.x = -Math.PI / 2;
  hangarGroup.add(fl);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(22, 9), hangarWallMat);
  backWall.position.set(0, 4.5, -3.2);
  hangarGroup.add(backWall);

  for (const sx of [-9.5, 9.5]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), hangarWallMat);
    sw.position.set(sx, 4.5, 2.5);
    sw.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2;
    hangarGroup.add(sw);
  }

  // Arched structural hangar ceiling ribs
  for (let x = -7.5; x <= 7.5; x += 2.5) {
    const arch = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 12.0), steelDarkMat);
    arch.position.set(x, 5.2, 0.8);
    hangarGroup.add(arch);
  }

  // 3 Hanging industrial shop lamps (Left Briefing, Center Packing Table, Right Crew Bay)
  const lampBulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.1, 2.75, 1.95) });
  for (const lx of [-4.6, 0.0, 4.6]) {
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.30, 18, 1, true), steelDarkMat);
    shade.position.set(lx, 3.85, -0.3);
    hangarGroup.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), lampBulbMat);
    bulb.position.set(lx, 3.70, -0.3);
    hangarGroup.add(bulb);
    const shaft = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 3.6),
      new THREE.MeshBasicMaterial({ map: warmShaftTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    shaft.position.set(lx, 1.95, -0.45);
    hangarGroup.add(shaft);
  }
}

// Center Wooden Packing Table + Dynamic Slicing White Parachute Silk + Lifting Cutout Disc!
const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.12, 1.55), woodMat);
tableTop.position.set(0, 0.88, 0.0);
hangarGroup.add(tableTop);
for (const lx of [-1.15, 1.15]) {
  for (const lz of [-0.65, 0.65]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.88, 0.10), steelDarkMat);
    leg.position.set(lx, 0.44, lz);
    hangarGroup.add(leg);
  }
}

const silkRig = makeDynamicSilkRig();
const silkPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(1.58, 1.58),
  new THREE.MeshBasicMaterial({ map: silkRig.texture, color: '#D6D0E0', transparent: true, side: THREE.DoubleSide })
);
silkPlane.rotation.x = -Math.PI / 2;
silkPlane.position.set(0, 0.955, 0.0);
hangarGroup.add(silkPlane);

// Floating round silk cutout disc that lifts straight up once cut finishes!
const cutoutDisc = new THREE.Mesh(
  new THREE.CircleGeometry(0.23, 32),
  new THREE.MeshBasicMaterial({ color: '#EAE4DA', side: THREE.DoubleSide })
);
cutoutDisc.rotation.x = -Math.PI / 2;
cutoutDisc.position.set(0, 0.96, 0.0);
hangarGroup.add(cutoutDisc);

// High-contrast steel shears w/ bold crimson grips hovering over silk circle rim during S01 (f0-72)!
const shearsGroup = new THREE.Group();
const bladeMat = new THREE.MeshStandardMaterial({ color: '#3C4668', roughness: 0.35, metalness: 0.45 });
const handleMat = new THREE.MeshStandardMaterial({ color: '#D4363E', roughness: 0.55 });
const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.025, 0.052), bladeMat);
blade1.position.set(0.15, 0, 0.024);
blade1.rotation.y = 0.17;
const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.025, 0.052), bladeMat);
blade2.position.set(0.15, 0.018, -0.024);
blade2.rotation.y = -0.17;
const grip = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.022, 8, 16), handleMat);
grip.rotation.x = Math.PI / 2;
grip.position.set(-0.08, 0.015, 0.056);
const grip2 = grip.clone();
grip2.position.set(-0.08, 0.015, -0.056);
shearsGroup.add(blade1, blade2, grip, grip2);
hangarGroup.add(shearsGroup);

// Glowing Crimson 10:00 Hangar Countdown Clock high on back wall!
const clockFrontMat = new THREE.MeshBasicMaterial({
  map: makeCountdownClockTexture(),
  color: new THREE.Color(2.4, 1.4, 1.35),
});
const clockBox = new THREE.Mesh(
  new THREE.BoxGeometry(1.75, 0.76, 0.14),
  [steelDarkMat, steelDarkMat, steelDarkMat, steelDarkMat, clockFrontMat, steelDarkMat]
);
clockBox.position.set(0.0, 2.75, -3.05);
hangarGroup.add(clockBox);

// Left Hangar Bay (x = -4.6): Crisp Illuminated Tactical Briefing Board (zero bloom washout!)
const briefMat = new THREE.MeshBasicMaterial({
  map: makeBriefingBoardTexture(),
  color: new THREE.Color('#DAD6E6'),
});
const briefBoard = new THREE.Mesh(
  new THREE.BoxGeometry(3.2, 2.15, 0.12),
  [steelDarkMat, steelDarkMat, steelDarkMat, steelDarkMat, briefMat, steelDarkMat]
);
briefBoard.position.set(-4.6, 1.92, -2.25);
hangarGroup.add(briefBoard);

// Subtle golden accent glow over TARGET / CONTRACT on briefing board
const briefGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(0.95, 0.95),
  new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.4, 1.15, 0.7),
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
);
briefGlow.position.set(-4.05, 1.78, -2.14);
hangarGroup.add(briefGlow);

// Hangar Characters (Hero at center-left, Commander at center-right, 3 Laughing Rivals at right bay!)
const hangarHero = makeBillboard(hangarGroup, heroRig.texture, 1.32, 1.98, '#E4DCEF', 0.95);
hangarHero.mesh.position.set(-0.92, 0.99, -0.45);
hangarHero.shadow.position.set(-0.92, 0.015, -0.45);

const hangarCmd = makeBillboard(hangarGroup, cmdRig.texture, 1.46, 2.19, '#E4DCEF', 1.05);
hangarCmd.mesh.position.set(0.88, 1.10, -0.45);
hangarCmd.shadow.position.set(0.88, 0.015, -0.45);

const hangarRivals = [
  makeBillboard(hangarGroup, rivalRigs[0].texture, 1.28, 1.92, '#DCE0F2', 0.9),
  makeBillboard(hangarGroup, rivalRigs[1].texture, 1.32, 1.98, '#DCE0F2', 0.9),
  makeBillboard(hangarGroup, rivalRigs[2].texture, 1.26, 1.89, '#DCE0F2', 0.9),
];
const hrCoords = [[3.75, 0.96, -0.65], [4.65, 0.99, -0.42], [5.52, 0.95, -0.68]];
for (let i = 0; i < 3; i++) {
  hangarRivals[i].mesh.position.set(...hrCoords[i]);
  hangarRivals[i].shadow.position.set(hrCoords[i][0], 0.015, hrCoords[i][2]);
}

// Popping Pink-Frosted Donut Gag Badge above the laughing crew!
const donutMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1.25, 1.25),
  new THREE.MeshBasicMaterial({ map: makeDonutBadgeTexture(), transparent: true, alphaTest: 0.05 })
);
donutMesh.position.set(4.65, 2.38, -0.10);
hangarGroup.add(donutMesh);

// ===========================================================================
// WORLD 2: 10,000-FOOT SKY & PARACHUTE SHOWDOWN (S05, S06, S07)
// ===========================================================================
const skyGroup = new THREE.Group();
scene.add(skyGroup);

// Distant Golden Sun Disc & Soft Sky Halo
const sunDisc = new THREE.Mesh(
  new THREE.CircleGeometry(3.2, 32),
  new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.25, 1.55), transparent: true, opacity: 0.72 })
);
sunDisc.position.set(5.5, 9.5, -28);
skyGroup.add(sunDisc);

// Far-below miniature Airfield Bullseye visible 10,000 ft down!
const farField = new THREE.Mesh(
  new THREE.PlaneGeometry(24, 24),
  new THREE.MeshBasicMaterial({ map: makeBullseyeFieldTexture() })
);
farField.rotation.x = -Math.PI / 2;
farField.position.set(0, -18, -4);
skyGroup.add(farField);

// 22 Layered 3D Cloud Puffs scrolling upward to sell thrilling 10,000-ft descent!
const cloudWarmTex = makeCloudPuffTexture(true);
const cloudCoolTex = makeCloudPuffTexture(false);
const cloudMeshes = [];
for (let i = 0; i < 22; i++) {
  const isWarm = i % 3 === 0;
  const mat = new THREE.MeshBasicMaterial({
    map: isWarm ? cloudWarmTex : cloudCoolTex,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
  });
  const w = 6.5 + (i % 5) * 2.4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.5), mat);
  const bx = ((i * 7.3) % 24) - 12;
  const by = ((i * 4.9) % 26) - 13;
  const bz = -4.5 - (i % 6) * 3.8;
  m.position.set(bx, by, bz);
  skyGroup.add(m);
  cloudMeshes.push({ mesh: m, bx, by, bz, speed: 0.55 + (i % 4) * 0.22 });
}

// Open Circular Aircraft Cargo Hatch Wall (aligns cleanly with T04 circular hole match-cut!)
const hatchGroup = new THREE.Group();
const hatchShape = new THREE.Shape();
hatchShape.moveTo(-6, -6); hatchShape.lineTo(6, -6); hatchShape.lineTo(6, 6); hatchShape.lineTo(-6, 6);
hatchShape.closePath();
const hatchHole = new THREE.Path();
hatchHole.absarc(0, 0, 1.38, 0, Math.PI * 2, true);
hatchShape.holes.push(hatchHole);
const hatchWall = new THREE.Mesh(
  new THREE.ShapeGeometry(hatchShape, 36),
  new THREE.MeshStandardMaterial({ color: '#1B204A', roughness: 0.78 })
);
hatchGroup.add(hatchWall);
const hatchRim = new THREE.Mesh(
  new THREE.TorusGeometry(1.38, 0.11, 10, 36),
  new THREE.MeshStandardMaterial({ color: '#5A64A6', roughness: 0.6 })
);
hatchGroup.add(hatchRim);
hatchGroup.position.set(0, 1.85, 2.2);
skyGroup.add(hatchGroup);

// Helper: Build a Complete 3D Parachute Rig (Canopy Dome + 8 Shroud Lines + Jumper Billboard!)
const sealedCanopyMat = new THREE.MeshStandardMaterial({
  map: makeCanopyTexture(false),
  roughness: 0.74,
  side: THREE.DoubleSide,
});
const ventedCanopyMat = new THREE.MeshStandardMaterial({
  map: makeCanopyTexture(true),
  roughness: 0.72,
  side: THREE.DoubleSide,
});
const lineMat = new THREE.LineBasicMaterial({ color: '#151226' });

function buildParachuteUnit(parent, jumperTex, vented = false) {
  // Pivot right at canopy apex so pendulum swings rotate realistically!
  const pivot = new THREE.Group();
  const canopyGroup = new THREE.Group();
  pivot.add(canopyGroup);

  // Vented canopy has an ACTUAL REAL 3D CIRCULAR HOLE (thetaStart = 0.34 rad) through the crown!!
  const domeGeo = vented
    ? new THREE.SphereGeometry(1.68, 28, 14, 0, Math.PI * 2, 0.34, Math.PI * 0.44)
    : new THREE.SphereGeometry(1.68, 28, 14, 0, Math.PI * 2, 0.0, Math.PI * 0.46);
  const dome = new THREE.Mesh(domeGeo, vented ? ventedCanopyMat : sealedCanopyMat);
  dome.position.y = -0.05;
  canopyGroup.add(dome);

  if (vented) {
    // Crisp dark ink ring + subtle golden rim framing the open circular apex hole!
    const holeRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.68 * Math.sin(0.34), 0.045, 10, 28),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.95, 1.15) })
    );
    holeRing.rotation.x = Math.PI / 2;
    holeRing.position.y = 1.68 * Math.cos(0.34) - 0.05;
    canopyGroup.add(holeRing);
  }

  // 8 Taut Shroud Lines from Canopy Rim down to Jumper Harness
  const linePts = [];
  const rimR = 1.66;
  const rimY = 0.05;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    linePts.push(new THREE.Vector3(Math.cos(a) * rimR, rimY, Math.sin(a) * rimR));
    linePts.push(new THREE.Vector3(Math.cos(a) * 0.16, -2.05, Math.sin(a) * 0.10));
  }
  const shroudGeo = new THREE.BufferGeometry().setFromPoints(linePts);
  canopyGroup.add(new THREE.LineSegments(shroudGeo, lineMat));

  // 2D Cel Jumper hanging underneath the risers!
  const jumper = new THREE.Mesh(
    new THREE.PlaneGeometry(1.18, 1.77),
    new THREE.MeshBasicMaterial({ map: jumperTex, color: '#E8E2F4', transparent: true, alphaTest: 0.05, side: THREE.DoubleSide })
  );
  jumper.position.set(0, -2.55, 0);
  pivot.add(jumper);

  parent.add(pivot);
  return { pivot, canopyGroup, jumper };
}

const rivalChuteA = buildParachuteUnit(skyGroup, rivalRigs[0].texture, false);
const rivalChuteB = buildParachuteUnit(skyGroup, rivalRigs[1].texture, false);
const heroChute = buildParachuteUnit(skyGroup, heroRig.texture, true);

// Cyan Trapped-Air Burst Puffs escaping sides of Rival Chute A during S06 pendulum chaos!
const spillPuffs = [];
const puffMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(1.2, 1.95, 2.55),
  transparent: true,
  opacity: 0.0,
  depthWrite: false,
});
for (let i = 0; i < 6; i++) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.24 + (i % 3) * 0.10, 12, 10), puffMat.clone());
  skyGroup.add(m);
  spillPuffs.push(m);
}

// Radiant Golden Upward Airflow Ribbon streaming out Hero's circular Apex Hole in S07!
const heroVentRibbon = new THREE.Mesh(
  new THREE.PlaneGeometry(1.15, 2.65),
  new THREE.MeshBasicMaterial({
    map: makeAirflowRibbonTexture(true),
    color: new THREE.Color(1.9, 1.75, 1.35),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
);
heroVentRibbon.position.set(0, 2.45, 0);
heroChute.canopyGroup.add(heroVentRibbon);

// ===========================================================================
// WORLD 3A: UNDERWATER GLASS CUP ANALOGY (S08)
// ===========================================================================
const cupGroup = new THREE.Group();
scene.add(cupGroup);

// Deep sapphire water backdrop + top shimmering water surface + caustic light shafts
const waterSurface = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 12),
  new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 1.35, 1.95), transparent: true, opacity: 0.45, side: THREE.DoubleSide })
);
waterSurface.rotation.x = Math.PI / 2;
waterSurface.position.set(0, 2.35, 0);
cupGroup.add(waterSurface);

const causticPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 9),
  new THREE.MeshBasicMaterial({
    map: makeCausticRayTexture(),
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
);
causticPlane.position.set(0, 0.5, -2.2);
cupGroup.add(causticPlane);

// Translucent 3D Upside-Down Glass Cup + Trapped Glowing Air Pocket inside!
const cupPivot = new THREE.Group();
const glassCupMat = new THREE.MeshStandardMaterial({
  color: '#A8DCFF',
  roughness: 0.22,
  metalness: 0.15,
  transparent: true,
  opacity: 0.52,
  side: THREE.DoubleSide,
});
// Open-bottom cylinder + solid top cap = upside-down drinking glass!
const cupWall = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 1.02, 1.68, 32, 1, true), glassCupMat);
const cupTopCap = new THREE.Mesh(new THREE.CircleGeometry(0.88, 32), glassCupMat);
cupTopCap.rotation.x = -Math.PI / 2;
cupTopCap.position.y = 0.84;
const cupRimInk = new THREE.Mesh(
  new THREE.TorusGeometry(1.02, 0.042, 10, 32),
  new THREE.MeshBasicMaterial({ color: '#D8F4FF' })
);
cupRimInk.rotation.x = Math.PI / 2;
cupRimInk.position.y = -0.84;
const cupTopRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.88, 0.036, 10, 32),
  new THREE.MeshBasicMaterial({ color: '#E8FAFF' })
);
cupTopRing.rotation.x = Math.PI / 2;
cupTopRing.position.y = 0.84;

// Luminous trapped air pocket glowing inside the upper half of the inverted glass!
const trappedAir = new THREE.Mesh(
  new THREE.CylinderGeometry(0.82, 0.90, 0.95, 28),
  new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.45, 1.85, 2.15),
    transparent: true,
    opacity: 0.65,
  })
);
trappedAir.position.y = 0.30;
cupPivot.add(cupWall, cupTopCap, cupRimInk, cupTopRing, trappedAir);
cupGroup.add(cupPivot);

// 18 Luminous 3D Air Bubbles that burp violently out LEFT rim, then RIGHT rim!
const bubbleMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(1.55, 2.05, 2.35),
  transparent: true,
  opacity: 0.85,
});
const leftBubbles = [];
const rightBubbles = [];
for (let i = 0; i < 9; i++) {
  const bL = new THREE.Mesh(new THREE.SphereGeometry(0.08 + (i % 4) * 0.055, 14, 10), bubbleMat);
  const bR = new THREE.Mesh(new THREE.SphereGeometry(0.08 + (i % 4) * 0.055, 14, 10), bubbleMat);
  cupGroup.add(bL, bR);
  leftBubbles.push({ mesh: bL, idx: i });
  rightBubbles.push({ mesh: bR, idx: i });
}

// ===========================================================================
// WORLD 3B: CUTAWAY PARACHUTE APEX-VENT PHYSICS REVEAL (S09)
// ===========================================================================
const ventGroup = new THREE.Group();
scene.add(ventGroup);

const ventPivot = new THREE.Group();
ventGroup.add(ventPivot);

// Sealed cap plug that smoothly opens/fades away right at f1982 ("unless you give the air a way out")!
const cutawayBody = new THREE.Mesh(
  new THREE.SphereGeometry(1.52, 28, 14, 0, Math.PI * 2, 0.36, Math.PI * 0.44),
  ventedCanopyMat
);
const cutawayPlug = new THREE.Mesh(
  new THREE.SphereGeometry(1.52, 24, 10, 0, Math.PI * 2, 0.0, 0.37),
  sealedCanopyMat.clone()
);
cutawayPlug.material.transparent = true;
const ventGoldCollar = new THREE.Mesh(
  new THREE.TorusGeometry(1.52 * Math.sin(0.36), 0.055, 10, 32),
  new THREE.MeshBasicMaterial({ color: new THREE.Color(1.75, 1.42, 0.85) })
);
ventGoldCollar.rotation.x = Math.PI / 2;
ventGoldCollar.position.y = 1.52 * Math.cos(0.36);

// Cutaway shroud lines
{
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * 1.48, 0.14, Math.sin(a) * 1.48));
    pts.push(new THREE.Vector3(0, -1.65, 0));
  }
  ventPivot.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
}

// Chaotic trapped-air arrows bursting out left/right edges while sealed!
const chaoticTex = makeAirflowRibbonTexture(false);
const sideSpillL = new THREE.Mesh(
  new THREE.PlaneGeometry(0.85, 1.65),
  new THREE.MeshBasicMaterial({ map: chaoticTex, color: new THREE.Color(1.2, 1.75, 2.2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
);
sideSpillL.position.set(-1.62, 0.35, 0.1);
sideSpillL.rotation.z = 0.65;
const sideSpillR = sideSpillL.clone();
sideSpillR.position.set(1.62, 0.35, 0.1);
sideSpillR.rotation.z = -0.65;

// Crisp GOLDEN Laminar Exhaust Ribbon shooting straight UP through the open apex hole!
const goldenLaminar = new THREE.Mesh(
  new THREE.PlaneGeometry(1.18, 2.95),
  new THREE.MeshBasicMaterial({ map: makeAirflowRibbonTexture(true), color: new THREE.Color(1.55, 1.38, 0.92), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
);
goldenLaminar.position.set(0, 2.25, 0.05);

ventPivot.add(cutawayBody, cutawayPlug, ventGoldCollar, sideSpillL, sideSpillR, goldenLaminar);

// ===========================================================================
// WORLD 4: GOLDEN-HOUR AIRFIELD BULLSEYE TOUCHDOWN (S10 + 1.0s FREEZE)
// ===========================================================================
const runwayGroup = new THREE.Group();
scene.add(runwayGroup);

// Giant Painted Red-White-Gold TARGET Bullseye Field
const runwayField = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 18),
  new THREE.MeshStandardMaterial({ map: makeBullseyeFieldTexture(), roughness: 0.90 })
);
runwayField.rotation.x = -Math.PI / 2;
runwayGroup.add(runwayField);

// Warm Sunset Horizon Glow Backdrop & Distant Hangar Silhouettes
const sunsetBack = new THREE.Mesh(
  new THREE.PlaneGeometry(36, 16),
  new THREE.MeshBasicMaterial({
    map: (() => {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 512);
      gr.addColorStop(0.0, '#161B52');
      gr.addColorStop(0.45, '#3E4690');
      gr.addColorStop(0.78, '#D98E62');
      gr.addColorStop(1.0, '#FFD48C');
      g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
      return new THREE.CanvasTexture(c);
    })(),
  })
);
sunsetBack.position.set(0, 7.5, -12.5);
runwayGroup.add(sunsetBack);

// Distant Hangar Silhouette w/ warm doorway light + Red-White Airfield Windsock!
const distHangar = new THREE.Mesh(
  new THREE.BoxGeometry(4.8, 2.0, 2.0),
  new THREE.MeshStandardMaterial({ color: '#20255A', roughness: 0.85 })
);
distHangar.position.set(-4.6, 1.0, -8.5);
runwayGroup.add(distHangar);
const hangarGlowDoor = new THREE.Mesh(
  new THREE.PlaneGeometry(1.4, 1.0),
  new THREE.MeshBasicMaterial({ color: '#FFCF82' })
);
hangarGlowDoor.position.set(-4.2, 0.52, -7.48);
runwayGroup.add(hangarGlowDoor);

// Striped Airfield Windsock Pole on left edge
const wsPole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 2.4, 8), steelDarkMat);
wsPole.position.set(-2.05, 1.2, -3.2);
runwayGroup.add(wsPole);
const wsCone = new THREE.Mesh(
  new THREE.ConeGeometry(0.18, 0.95, 12, 1, true),
  new THREE.MeshStandardMaterial({ color: '#E8523A', roughness: 0.7, side: THREE.DoubleSide })
);
wsCone.rotation.z = -Math.PI / 2 - 0.15;
wsCone.position.set(-1.55, 2.28, -3.2);
runwayGroup.add(wsCone);

const farRivalA = buildParachuteUnit(runwayGroup, rivalRigs[0].texture, false);
farRivalA.pivot.scale.setScalar(0.32);
farRivalA.pivot.position.set(-3.4, 5.2, -7.2);
farRivalA.pivot.rotation.z = -0.68;

const farRivalB = buildParachuteUnit(runwayGroup, rivalRigs[1].texture, false);
farRivalB.pivot.scale.setScalar(0.28);
farRivalB.pivot.position.set(3.8, 4.9, -8.0);
farRivalB.pivot.rotation.z = 0.72;

// Hero standing dead-center on the TARGET Bullseye + Settled Vented Canopy neatly to left-rear + Shocked Commander!
const runwayHero = makeBillboard(runwayGroup, heroRig.texture, 1.32, 1.98, '#EFE4DA', 0.95);
runwayHero.mesh.position.set(0.0, 0.94, 0.0);
runwayHero.shadow.position.set(0.0, 0.018, 0.0);

const runwayChute = new THREE.Mesh(
  new THREE.SphereGeometry(1.38, 24, 12, 0, Math.PI * 2, 0.34, Math.PI * 0.44),
  ventedCanopyMat
);
runwayChute.position.set(-1.42, 0.12, -2.05);
runwayChute.rotation.x = 0.38;
runwayChute.scale.set(1.0, 0.34, 1.0);
runwayGroup.add(runwayChute);

const runwayCmd = makeBillboard(runwayGroup, cmdRig.texture, 1.38, 2.07, '#E6DDEE', 0.95);
runwayCmd.mesh.position.set(1.42, 1.03, -0.55);
runwayCmd.shadow.position.set(1.42, 0.018, -0.55);

// ===========================================================================
// 2D COMPOSITOR & ZERO-HARD-CUT TRANSITION BUFFERS (ZERO CAPTIONS!)
// ===========================================================================
const overlay = document.createElement('canvas');
overlay.width = W; overlay.height = H;
overlay.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;';
document.body.appendChild(overlay);
const og = overlay.getContext('2d');

const bufA = document.createElement('canvas'); bufA.width = W; bufA.height = H;
const ctxA = bufA.getContext('2d');
const bufB = document.createElement('canvas'); bufB.width = W; bufB.height = H;
const ctxB = bufB.getContext('2d');
const prevBuf = document.createElement('canvas'); prevBuf.width = W; prevBuf.height = H;
const prevCtx = prevBuf.getContext('2d');
let hasPrev = false;

const compCanvas = document.createElement('canvas'); compCanvas.width = W; compCanvas.height = H;
const compCtx = compCanvas.getContext('2d', { willReadFrequently: true });

// Deterministic floating atmospheric particles
function seeded(s) {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = seeded(1797);
const motes = Array.from({ length: 34 }, () => ({
  x: rng() * W, y: rng() * H,
  vx: (rng() - 0.5) * 22, vy: -14 - rng() * 24,
  r: 1.4 + rng() * 2.8, alpha: 0.14 + rng() * 0.22,
}));

// Render one single World cleanly into WebGL canvas
let lastRigKey = '';

function renderSingleWorld(worldId, f) {
  hangarGroup.visible = worldId === 'hangar';
  skyGroup.visible = worldId === 'sky';
  cupGroup.visible = worldId === 'physics_cup';
  ventGroup.visible = worldId === 'physics_vent';
  runwayGroup.visible = worldId === 'runway';

  const st = evaluateWorldState(worldId, f);
  camera.fov = st.camera.fov;
  camera.position.set(...st.camera.pos);
  camera.lookAt(...st.camera.target);
  camera.rotateZ(THREE.MathUtils.degToRad(st.camera.rollDeg));
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  // Throttle heavy 2D Canvas character redraws cleanly to authentic 15-FPS twos + key frames
  const rigStep = Math.floor(f / 2);
  const rigKey = `${worldId}:${rigStep}:${f === 448 || f === 509 || f === 526 || f === 1095 || f === 1452 || f === 1982 || f === 2034 || f === 2040 ? f : 0}`;
  const doRig = rigKey !== lastRigKey;

  if (worldId === 'hangar') {
    scene.background = new THREE.Color('#141744');
    scene.fog = new THREE.FogExp2('#171A4E', 0.025);
    ambientLift.color.set('#2A348E'); ambientLift.intensity = 0.82;
    hemi.color.set('#7A8DF8'); hemi.groundColor.set('#242974'); hemi.intensity = 1.10;
    keyDir.color.set('#FFCE88'); keyDir.intensity = 0.95;
    ptA.color.set('#FFC878'); ptA.intensity = 8.0; ptA.position.set(st.camera.target[0], 3.1, 0.8);
    ptB.color.set('#4464FF'); ptB.intensity = 4.2; ptB.position.set(st.camera.pos[0], 1.8, 2.8);
    bloom.strength = 0.40;

    if (f <= 115 || doRig) {
      silkRig.update(st.cutProgress, st.cutoutRemoved);
    }
    cutoutDisc.visible = st.cutoutRemoved && f < 340;
    cutoutDisc.position.set(0, 0.96 + st.cutoutLift * 0.42, 0.0);
    shearsGroup.visible = f <= 74;
    if (shearsGroup.visible) {
      const ang = -Math.PI * 0.5 + st.cutProgress * Math.PI * 2;
      const rad = 0.24;
      shearsGroup.position.set(Math.cos(ang) * rad, 0.99, Math.sin(ang) * rad);
      shearsGroup.rotation.y = -ang;
    }

    briefGlow.material.opacity = 0.14 * st.targetPulse;
    donutMesh.visible = st.donutScale > 0.01;
    donutMesh.scale.setScalar(Math.max(0.001, st.donutScale));
    donutMesh.rotation.z = Math.sin(f * 0.12) * 0.12;
    faceCamera(donutMesh);

    if (doRig) {
      heroRig.update(st.hero);
      cmdRig.update(st.commander);
      for (let i = 0; i < 3; i++) {
        rivalRigs[i].update({ pose: 'laugh', anim: st.rivalsAnim });
      }
    }
    hangarCmd.mesh.visible = f >= 335;
    hangarCmd.shadow.visible = f >= 335;
    faceCamera(hangarHero.mesh);
    faceCamera(hangarCmd.mesh);
    for (const r of hangarRivals) faceCamera(r.mesh);
  } else if (worldId === 'sky') {
    const bgCol = new THREE.Color('#283C8A').lerp(new THREE.Color('#13194C'), st.stormMix);
    scene.background = bgCol;
    scene.fog = new THREE.FogExp2(bgCol.getHex(), 0.012);
    ambientLift.color.set('#3A52B8'); ambientLift.intensity = lerp(1.05, 0.78, st.stormMix);
    hemi.color.set(st.stormMix > 0.5 ? '#6E90FF' : '#FFE0AE');
    hemi.groundColor.set('#222B78');
    hemi.intensity = 1.25;
    keyDir.color.set(st.stormMix > 0.5 ? '#88AEFF' : '#FFD898');
    keyDir.intensity = lerp(1.45, 0.85, st.stormMix);
    ptA.color.set('#FFD48E'); ptA.intensity = lerp(5.0, 1.2, st.stormMix); ptA.position.set(2.5, 4.5, 3.0);
    ptB.color.set('#4D7BFF'); ptB.intensity = 3.5; ptB.position.set(-3.0, 0.5, 4.0);
    bloom.strength = 0.42;

    sunDisc.material.opacity = lerp(0.75, 0.18, st.stormMix);
    for (const cm of cloudMeshes) {
      const y = ((cm.by + st.cloudScroll * cm.speed + 13) % 26) - 13;
      cm.mesh.position.set(cm.bx, y, cm.bz);
    }

    hatchGroup.visible = st.hatchVisible && st.hatchAlpha > 0.01;
    hatchGroup.position.z = st.hatchZ;
    hatchWall.material.opacity = st.hatchAlpha;
    hatchRim.material.opacity = st.hatchAlpha;

    if (!st.isHeroSegment) {
      heroChute.pivot.visible = false;
      rivalChuteA.pivot.visible = true;
      rivalChuteB.pivot.visible = true;

      const s = clamp(st.snapOpenU, 0.08, 1.08);
      const swingRad = THREE.MathUtils.degToRad(st.rivalSwingDeg);
      const dropY = lerp(3.4, 2.25, st.leapU);

      rivalChuteA.pivot.position.set(-0.55, dropY, -0.35);
      rivalChuteA.pivot.rotation.z = swingRad;
      rivalChuteA.canopyGroup.scale.set(s, s, s);

      rivalChuteB.pivot.position.set(1.55, dropY - 0.55, -2.6);
      rivalChuteB.pivot.rotation.z = swingRad * 0.88 + 0.14;
      rivalChuteB.canopyGroup.scale.set(s * 0.88, s * 0.88, s * 0.88);

      // Cyan trapped-air burst puffs exploding out alternating sides of Rival Chute A during S06!
      const showSpill = Math.abs(st.rivalSwingDeg) > 12;
      for (let i = 0; i < spillPuffs.length; i++) {
        const pm = spillPuffs[i];
        pm.visible = showSpill;
        if (showSpill) {
          const side = st.rivalSwingDeg < 0 ? 1 : -1;
          const phase = ((st.t * 3.8 + i * 0.22) % 1);
          pm.position.set(
            rivalChuteA.pivot.position.x + side * (1.35 + phase * 1.45),
            rivalChuteA.pivot.position.y + 0.15 + phase * 1.1,
            rivalChuteA.pivot.position.z + 0.2
          );
          pm.scale.setScalar(0.5 + phase * 1.15);
          pm.material.opacity = (1 - phase) * 0.55;
        }
      }

      if (doRig) {
        rivalRigs[0].update({ pose: st.rivalPose, anim: st.t, sweat: st.rivalPose === 'panic_harness' });
        rivalRigs[1].update({ pose: st.rivalPose, anim: st.t + 0.7, sweat: st.rivalPose === 'panic_harness' });
      }
      faceCamera(rivalChuteA.jumper);
      faceCamera(rivalChuteB.jumper);
    } else {
      // S07: Hero leaps & vented donut chute glides dead-straight (0.0 deg wobble!) while tiny rivals whip far behind!
      heroChute.pivot.visible = true;
      rivalChuteA.pivot.visible = true;
      rivalChuteB.pivot.visible = false;
      for (const pm of spillPuffs) pm.visible = false;

      const hs = clamp(st.heroSnapU, 0.001, 1.05);
      heroChute.pivot.position.set(0, lerp(3.0, 2.35, st.heroLeapU), 0.0);
      heroChute.pivot.rotation.z = 0.0; // ZERO WOBBLE!
      heroChute.canopyGroup.visible = f >= 1446;
      heroChute.canopyGroup.scale.set(hs, hs, hs);

      heroVentRibbon.visible = f >= 1465;
      heroVentRibbon.position.y = 2.35 + Math.sin(st.t * 6.0) * 0.18;
      faceCamera(heroVentRibbon);

      // Tiny far-off rival still whipping wildly in the background!
      rivalChuteA.pivot.position.set(-2.9, 1.8, -8.5);
      rivalChuteA.pivot.rotation.z = Math.sin(st.t * 4.5) * 0.92;
      rivalChuteA.canopyGroup.scale.setScalar(0.45);

      if (doRig) {
        heroRig.update(st.heroRigState);
        rivalRigs[0].update({ pose: 'panic_harness', anim: st.t, sweat: true });
      }
      faceCamera(heroChute.jumper);
      faceCamera(rivalChuteA.jumper);
    }
  } else if (worldId === 'physics_cup') {
    scene.background = new THREE.Color('#0E215C');
    scene.fog = new THREE.FogExp2('#0F2566', 0.032);
    ambientLift.color.set('#2854B8'); ambientLift.intensity = 0.95;
    hemi.color.set('#7CE2FF'); hemi.groundColor.set('#142468'); hemi.intensity = 1.25;
    keyDir.color.set('#9CEBFF'); keyDir.intensity = 1.35;
    ptA.color.set('#78E0FF'); ptA.intensity = 6.5; ptA.position.set(0, 3.2, 2.5);
    ptB.color.set('#2E56E8'); ptB.intensity = 4.0; ptB.position.set(0, -2.5, 2.5);
    bloom.strength = 0.44;

    cupPivot.position.set(0, st.cupY, 0);
    cupPivot.rotation.z = THREE.MathUtils.degToRad(st.cupTiltDeg);
    causticPlane.position.x = Math.sin(st.t * 1.4) * 0.45;

    // Animated glowing 3D air bubbles burping out LEFT then RIGHT rim!
    for (const b of leftBubbles) {
      const active = st.burpLeft > 0.05;
      b.mesh.visible = active;
      if (active) {
        const p = (st.t * 1.8 + b.idx * 0.14) % 1;
        b.mesh.position.set(
          -0.96 - p * 0.55 + Math.sin(p * 8 + b.idx) * 0.12,
          st.cupY - 0.78 + p * 3.1,
          (b.idx % 3 - 1) * 0.16
        );
        b.mesh.scale.setScalar((0.65 + p * 0.75) * clamp(st.burpLeft * 1.6, 0.2, 1));
      }
    }
    for (const b of rightBubbles) {
      const active = st.burpRight > 0.05;
      b.mesh.visible = active;
      if (active) {
        const p = (st.t * 1.8 + b.idx * 0.14) % 1;
        b.mesh.position.set(
          0.96 + p * 0.55 + Math.sin(p * 8 + b.idx) * 0.12,
          st.cupY - 0.78 + p * 3.1,
          (b.idx % 3 - 1) * 0.16
        );
        b.mesh.scale.setScalar((0.65 + p * 0.75) * clamp(st.burpRight * 1.6, 0.2, 1));
      }
    }
  } else if (worldId === 'physics_vent') {
    const bgCol = new THREE.Color('#13194C').lerp(new THREE.Color('#252058'), st.ventOpen * 0.65);
    scene.background = bgCol;
    scene.fog = new THREE.FogExp2(bgCol.getHex(), 0.024);
    ambientLift.color.set('#303E98'); ambientLift.intensity = 0.88;
    hemi.color.set(st.ventOpen > 0.4 ? '#FFE0A4' : '#7CA6FF');
    hemi.groundColor.set('#1E266E'); hemi.intensity = 1.2;
    keyDir.color.set(st.ventOpen > 0.4 ? '#FFD480' : '#80AEFF'); keyDir.intensity = 1.35;
    ptA.color.set('#FFD27A'); ptA.intensity = 2.0 + st.ventOpen * 4.2; ptA.position.set(0, 3.2, 2.2);
    ptB.color.set('#4A72FF'); ptB.intensity = 4.0 * (1 - st.ventOpen * 0.5); ptB.position.set(-2.5, -1.0, 2.5);
    bloom.strength = 0.34 + st.ventOpen * 0.12;

    ventPivot.position.set(0, 0.35, 0);
    ventPivot.rotation.z = THREE.MathUtils.degToRad(st.domeTiltDeg);

    // Plug dissolves cleanly as apex hole opens right on "unless you give the air a way out"!
    cutawayPlug.visible = st.ventOpen < 0.96;
    cutawayPlug.material.opacity = 1 - st.ventOpen;
    cutawayPlug.position.y = st.ventOpen * 0.45;
    ventGoldCollar.visible = st.ventOpen > 0.05;
    ventGoldCollar.scale.setScalar(clamp(st.ventOpen, 0.01, 1));

    // Chaotic alternating side spill ribbons vanish as soon as apex vent opens!
    sideSpillL.visible = st.ventOpen < 0.85 && st.domeTiltDeg < -4;
    sideSpillR.visible = st.ventOpen < 0.85 && st.domeTiltDeg > 4;
    sideSpillL.material.opacity = (1 - st.ventOpen) * 0.85;
    sideSpillR.material.opacity = (1 - st.ventOpen) * 0.85;

    // Radiant GOLDEN laminar exhaust ribbon shoots straight UP through the crown!
    goldenLaminar.visible = st.ventOpen > 0.08;
    goldenLaminar.scale.set(0.65 + st.ventOpen * 0.45, 0.35 + st.ventOpen * 0.85, 1);
    goldenLaminar.position.y = 1.65 + st.ventOpen * 0.65 + Math.sin(st.t * 8.0) * 0.14;
    goldenLaminar.material.opacity = st.ventOpen;
  } else if (worldId === 'runway') {
    scene.background = new THREE.Color('#222866');
    scene.fog = new THREE.FogExp2('#282C6C', 0.016);
    ambientLift.color.set('#3A3E8C'); ambientLift.intensity = 0.88;
    hemi.color.set('#FFD89E'); hemi.groundColor.set('#282E74'); hemi.intensity = 1.28;
    keyDir.color.set('#FFCA78'); keyDir.intensity = 1.45; keyDir.position.set(-4.0, 5.5, -5.0);
    ptA.color.set('#FFD082'); ptA.intensity = 7.5; ptA.position.set(0.0, 3.2, 2.2);
    ptB.color.set('#4460EE'); ptB.intensity = 3.5; ptB.position.set(2.5, 1.5, 3.5);
    bloom.strength = 0.40;

    runwayHero.mesh.position.set(0, st.heroY, 0);
    runwayChute.scale.set(1.0, lerp(0.95, 0.28, st.chuteCollapse), 1.0);

    if (doRig) {
      heroRig.update(st.hero);
      cmdRig.update(st.commander);
      rivalRigs[0].update({ pose: 'panic_harness', anim: st.t, sweat: true });
    }
    faceCamera(runwayHero.mesh);
    faceCamera(runwayCmd.mesh);
    faceCamera(farRivalA.jumper);
    faceCamera(farRivalB.jumper);
  }

  if (doRig) lastRigKey = rigKey;
  composer.render();
  return st;
}

// ---------------------------------------------------------------------------
// 2D Atmospheric Finish (Dust/Motes, Lifted Indigo Vignette, Whip Ghost,
// Caustic Water Wipe, Shape Match Circle, Blow-Out Flash — ZERO CAPTIONS!)
// ---------------------------------------------------------------------------
function drawFinishOverlay(mf, primarySt) {
  og.clearRect(0, 0, W, H);

  // 1. T02 3-frame Whip-Pitch Ghost Double-Exposure
  const ghostAlpha = primarySt && primarySt.whipGhostAlpha ? primarySt.whipGhostAlpha : 0;
  if (ghostAlpha > 0.01 && hasPrev) {
    og.save();
    og.globalAlpha = ghostAlpha;
    og.drawImage(prevBuf, 0, 0);
    og.restore();
  }

  // 2. Subtle floating atmospheric dust / cloud / water motes (frozen cleanly at f2040-2069)
  const t = mf.frame / 30.0;
  const isWater = mf.primary === 'physics_cup';
  for (const m of motes) {
    const x = ((m.x + t * m.vx) % W + W) % W;
    const y = ((m.y + t * m.vy) % H + H) % H;
    const g = og.createRadialGradient(x, y, 0.2, x, y, m.r * 2.4);
    if (isWater) {
      g.addColorStop(0, `rgba(170,240,255,${m.alpha})`);
      g.addColorStop(1, 'rgba(90,190,255,0)');
    } else {
      g.addColorStop(0, `rgba(255,228,175,${m.alpha})`);
      g.addColorStop(1, 'rgba(255,195,125,0)');
    }
    og.fillStyle = g;
    og.beginPath(); og.arc(x, y, m.r * 2.4, 0, Math.PI * 2); og.fill();
  }

  // 3. T04 Glowing Circular Match-Cut Rim Ring bridging Silk Hole -> Plane Hatch!
  if (mf.matchCircleAlpha > 0.02) {
    og.save();
    og.strokeStyle = `rgba(255,232,175,${mf.matchCircleAlpha.toFixed(3)})`;
    og.lineWidth = 7;
    og.shadowColor = '#FFE4A4';
    og.shadowBlur = 18;
    og.beginPath();
    og.arc(W * 0.5, H * 0.5, W * 0.23, 0, Math.PI * 2);
    og.stroke();
    og.restore();
  }

  // 4. Signature Lifted Saturated Indigo Radial Vignette (preserves lifted indigo P05 floor!)
  const vig = og.createRadialGradient(W * 0.5, H * 0.5, W * 0.24, W * 0.5, H * 0.5, H * 0.62);
  vig.addColorStop(0.0, 'rgba(15,16,54,0)');
  vig.addColorStop(0.58, 'rgba(15,16,54,0.18)');
  vig.addColorStop(0.86, 'rgba(14,15,54,0.62)');
  vig.addColorStop(1.0, 'rgba(14,15,56,0.82)');
  og.fillStyle = vig;
  og.fillRect(0, 0, W, H);

  // 5. T06 Sunlit Cloud Blow-Out Flash Overlay
  if (mf.blowOutAlpha > 0.005) {
    const fg = og.createRadialGradient(W * 0.5, H * 0.45, 20, W * 0.5, H * 0.45, H * 0.85);
    fg.addColorStop(0.0, `rgba(255,250,238,${Math.min(1, mf.blowOutAlpha * 1.08).toFixed(4)})`);
    fg.addColorStop(0.68, `rgba(240,244,255,${Math.min(1, mf.blowOutAlpha * 0.96).toFixed(4)})`);
    fg.addColorStop(1.0, `rgba(215,226,255,${(mf.blowOutAlpha * 0.92).toFixed(4)})`);
    og.fillStyle = fg;
    og.fillRect(0, 0, W, H);
  }
}

// ---------------------------------------------------------------------------
// Master Frame Renderer (Single-Pass Fast Path + Dual-Pass Zero-Hard-Cut Blends)
// ---------------------------------------------------------------------------
export function renderFrame(rawFrame) {
  const mf = evaluateMasterFrame(rawFrame);

  if (mf.blendMode === 'none' || !mf.secondary) {
    const st = renderSingleWorld(mf.primary, mf.frame);
    drawFinishOverlay(mf, st);
    compCtx.drawImage(renderer.domElement, 0, 0, W, H);
    compCtx.drawImage(overlay, 0, 0, W, H);

    if (!(st && st.whipGhostAlpha > 0.01)) {
      prevCtx.drawImage(renderer.domElement, 0, 0, W, H);
      hasPrev = true;
    }
  } else {
    // Dual-pass seamless transition (T04 dissolve, T07 water_wipe, T08 morph, T09 golden dissolve)
    const stA = renderSingleWorld(mf.primary, mf.frame);
    ctxA.drawImage(renderer.domElement, 0, 0, W, H);
    renderSingleWorld(mf.secondary, mf.frame);
    ctxB.drawImage(renderer.domElement, 0, 0, W, H);

    compCtx.clearRect(0, 0, W, H);
    if (mf.blendMode === 'water_wipe') {
      // T07: Downward Caustic Water Seam Wipe (Exact Every-Memory T07 homage!)
      const wy = mf.blendAlpha * H;
      compCtx.drawImage(bufA, 0, 0);
      compCtx.save();
      compCtx.beginPath();
      compCtx.rect(0, 0, W, wy);
      compCtx.clip();
      compCtx.drawImage(bufB, 0, 0);
      compCtx.restore();

      // Glowing cyan-white caustic wave crest right along the wipe seam!
      const bandH = 68;
      const wg = compCtx.createLinearGradient(0, wy - bandH, 0, wy + bandH);
      wg.addColorStop(0.0, 'rgba(130,235,255,0)');
      wg.addColorStop(0.45, 'rgba(195,248,255,0.88)');
      wg.addColorStop(0.52, 'rgba(255,255,255,0.96)');
      wg.addColorStop(0.65, 'rgba(110,220,255,0.62)');
      wg.addColorStop(1.0, 'rgba(80,185,255,0)');
      compCtx.fillStyle = wg;
      compCtx.fillRect(0, wy - bandH, W, bandH * 2);
    } else {
      // Smooth cross-dissolve / shape match-cut morph
      compCtx.drawImage(bufA, 0, 0);
      compCtx.save();
      compCtx.globalAlpha = mf.blendAlpha;
      compCtx.drawImage(bufB, 0, 0);
      compCtx.restore();
    }

    drawFinishOverlay(mf, stA);
    compCtx.drawImage(overlay, 0, 0, W, H);
    prevCtx.drawImage(compCanvas, 0, 0, W, H);
    hasPrev = true;
  }
}

window.renderFrame = renderFrame;

// ---------------------------------------------------------------------------
// Boot Modes: Single Debug Frame / 14-Keyframe Audit / Parallel Worker Stream
// ---------------------------------------------------------------------------
if (MODE === 'stream') {
  (async () => {
    try {
      if (START_FRAME > 0) renderFrame(START_FRAME - 1);
      let cachedFreezeBuf = null;
      for (let f = START_FRAME; f < END_FRAME; f++) {
        let rawBuf;
        if (f > FREEZE_START && cachedFreezeBuf) {
          rawBuf = cachedFreezeBuf;
        } else {
          renderFrame(f);
          const imgData = compCtx.getImageData(0, 0, W, H);
          rawBuf = imgData.data.buffer;
          if (f === FREEZE_START) cachedFreezeBuf = rawBuf.slice(0);
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
  const list = (params.get('list') || '42,105,275,495,555,685,778,940,1175,1275,1391,1525,1610,1765,1995,2055').split(',').map(Number);
  (async () => {
    try {
      for (const f of list) {
        if (f > 335 && f < 355) renderFrame(f - 3);
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
