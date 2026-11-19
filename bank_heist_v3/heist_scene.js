// 2.5D Hybrid WebGL2 + Canvas2D Bank Heist Renderer (Skill v3.0 — Tactile PBR + 3D Ink + Shadows + Paper Tooth!)
// Renders 720x1280 WebGL2 (PCFSoftShadowMap + 360x640 UnrealBloomPass) + atmospheric 2D finish (ZERO captions, silent).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { evalTimeline, FREEZE_START } from './timeline.js';
import { createThiefRig, createGuardRig } from './rigs/heist_rigs.js';
import { buildLobbyWorld } from './worlds/world_lobby.js';
import { buildVaultWorld } from './worlds/world_vault.js';
import { makePaperToothCanvas, mulberry32 } from './worlds/pbr_materials.js';

const W = 720;
const H = 1280;

const params = new URLSearchParams(window.location.search);
const MODE = params.get('mode') || 'preview';

function makeSoftShadowTex() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 14, 128, 128, 120);
  gr.addColorStop(0, 'rgba(12,8,18,0.72)');
  gr.addColorStop(0.55, 'rgba(12,8,18,0.34)');
  gr.addColorStop(1, 'rgba(12,8,18,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

// 1. Setup Three.js WebGL2 Renderer w/ Real-Time PCFSoftShadowMap & Half-Res UnrealBloomPass
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setSize(W, H, false);
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 120);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.30, 0.36, 0.90);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// 2. Dual Dramatic Lighting Rigs (Warm Art-Deco Chandelier + Cool Moonlight Lobby vs Golden Bullion Vault + Red Alarm!)
const lobbyLights = new THREE.Group();
scene.add(lobbyLights);
const lobHemi = new THREE.HemisphereLight('#FFE2B6', '#3A3248', 1.08);
const lobKey = new THREE.DirectionalLight('#FFC674', 1.55);
lobKey.position.set(2.8, 6.2, 3.8);
lobKey.castShadow = true;
lobKey.shadow.mapSize.set(1024, 1024);
lobKey.shadow.camera.near = 1; lobKey.shadow.camera.far = 20;
lobKey.shadow.camera.left = -6; lobKey.shadow.camera.right = 6;
lobKey.shadow.camera.top = 6; lobKey.shadow.camera.bottom = -6;
lobKey.shadow.bias = -0.0008;
const lobMoonFill = new THREE.DirectionalLight('#7EA8FF', 0.62); // Cool midnight street moonlight from arched windows!
lobMoonFill.position.set(-4.5, 3.2, 1.5);
const lobChandelier = new THREE.PointLight('#FFAE48', 8.2, 12.0, 1.35);
lobChandelier.position.set(0, 3.65, -0.2);
const lobDialSpot = new THREE.PointLight('#FFD288', 5.2, 7.5, 1.4);
lobDialSpot.position.set(-0.2, 2.2, -1.2);
lobbyLights.add(lobHemi, lobKey, lobMoonFill, lobChandelier, lobDialSpot);

const vaultLights = new THREE.Group();
scene.add(vaultLights);
const vltHemi = new THREE.HemisphereLight('#FFF0CC', '#6A5E7A', 1.62);
const vltKey = new THREE.DirectionalLight('#FFD67E', 1.95);
vltKey.position.set(1.8, 5.5, 3.2);
vltKey.castShadow = true;
vltKey.shadow.mapSize.set(1024, 1024);
vltKey.shadow.camera.near = 1; vltKey.shadow.camera.far = 18;
vltKey.shadow.camera.left = -5; vltKey.shadow.camera.right = 5;
vltKey.shadow.camera.top = 5; vltKey.shadow.camera.bottom = -5;
vltKey.shadow.bias = -0.0008;
const vltLamp = new THREE.PointLight('#FFBE52', 10.5, 12.5, 1.3);
vltLamp.position.set(0, 3.55, -0.9);
const vltSteelRim = new THREE.DirectionalLight('#94BCEE', 0.68);
vltSteelRim.position.set(-4.0, 2.8, -1.5);
vaultLights.add(vltHemi, vltKey, vltLamp, vltSteelRim);

const lobbyBg = new THREE.Color('#1E1B28');
const lobbyFog = new THREE.FogExp2('#221E2A', 0.022);
const vaultBg = new THREE.Color('#241F22');
const vaultFog = new THREE.FogExp2('#282120', 0.020);

// 3. Build Painterly Multi-Angle Rigs & Both Tri-Channel PBR 3D Worlds!
const shadowTex = makeSoftShadowTex();
const thiefRig = createThiefRig();
const guardRig = createGuardRig();
const lobbyWorld = buildLobbyWorld(scene, thiefRig.texture, shadowTex);
const vaultWorld = buildVaultWorld(scene, thiefRig.texture, guardRig.texture, shadowTex);

// 4. Final Compositing Canvas (WebGL2 + Motes + Whip Ghost + Paper Tooth + Vignette + Golden Vault Bloom — ZERO Captions!)
const outCanvas = document.createElement('canvas');
outCanvas.width = W;
outCanvas.height = H;
outCanvas.style.width = '100vw';
outCanvas.style.height = '100vh';
outCanvas.style.objectFit = 'contain';
document.body.appendChild(outCanvas);
const ctx = outCanvas.getContext('2d', { willReadFrequently: true });

const paperTooth = makePaperToothCanvas(W, H, 7373);
const moteRng = mulberry32(4512);
const motes = Array.from({ length: 40 }, () => ({
  x: moteRng() * W,
  y: moteRng() * H,
  r: 1.4 + moteRng() * 2.6,
  vx: (moteRng() - 0.5) * 26,
  vy: -12 - moteRng() * 20,
  phase: moteRng() * Math.PI * 2,
}));

const vigCanvas = document.createElement('canvas');
vigCanvas.width = W; vigCanvas.height = H;
const vg = vigCanvas.getContext('2d');
const vgr = vg.createRadialGradient(W * 0.5, H * 0.48, W * 0.22, W * 0.5, H * 0.5, H * 0.62);
vgr.addColorStop(0, 'rgba(16,12,24,0)');
vgr.addColorStop(0.60, 'rgba(18,14,26,0.22)');
vgr.addColorStop(1, 'rgba(18,14,26,0.74)');
vg.fillStyle = vgr;
vg.fillRect(0, 0, W, H);

let prevFrameCanvas = null;
let prevFrameIdx = -999;

function renderFrame(rawFrame) {
  const st = evalTimeline(rawFrame);

  const isLobby = st.world === 'lobby';
  lobbyWorld.group.visible = isLobby;
  lobbyLights.visible = isLobby;
  vaultWorld.group.visible = !isLobby;
  vaultLights.visible = !isLobby;
  scene.background = isLobby ? lobbyBg : vaultBg;
  scene.fog = isLobby ? lobbyFog : vaultFog;

  camera.fov = st.fov;
  camera.updateProjectionMatrix();
  camera.position.set(...st.camPos);
  camera.lookAt(...st.camLook);

  thiefRig.update(st.thiefRigOpts);
  if (!isLobby && st.guardVisible) {
    guardRig.update(st.guardRigOpts);
  }

  if (isLobby) {
    bloomPass.strength = 0.28 + st.doorOpenProgress * 0.14;
    lobbyWorld.update(st, camera);
  } else {
    const alarmPulse = st.alarmOn ? (0.5 + 0.5 * Math.sin(st.t * 14.0)) : 0;
    bloomPass.strength = 0.28 + alarmPulse * 0.10;
    vaultWorld.update(st, camera);
  }

  composer.render();

  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(renderer.domElement, 0, 0, W, H);

  if (st.whipGhost > 0.02 && prevFrameCanvas && prevFrameIdx === rawFrame - 1) {
    ctx.save();
    ctx.globalAlpha = st.whipGhost;
    ctx.drawImage(prevFrameCanvas, -12, 0, W, H);
    ctx.drawImage(prevFrameCanvas, 12, 0, W, H);
    ctx.restore();
  }

  // Warm floating dust motes catching chandelier / vault gold light!
  ctx.save();
  for (const m of motes) {
    const mx = ((m.x + st.t * m.vx) % W + W) % W;
    const my = ((m.y + st.t * m.vy) % H + H) % H;
    const alpha = 0.18 + 0.18 * Math.sin(st.t * 3.0 + m.phase);
    ctx.fillStyle = isLobby
      ? `rgba(255,216,144,${alpha.toFixed(3)})`
      : `rgba(255,224,132,${(alpha * 1.1).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(mx, my, m.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Subtle Crimson Alarm Edge Pulse when Vault Alarm triggers!
  if (!isLobby && st.alarmOn) {
    const pulse = (0.5 + 0.5 * Math.sin(st.t * 14.0)) * 0.22;
    const rg = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.30, W * 0.5, H * 0.5, H * 0.66);
    rg.addColorStop(0, 'rgba(255,30,24,0)');
    rg.addColorStop(1, `rgba(255,34,26,${pulse.toFixed(3)})`);
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  }

  // Unified Skill v3.0 organic paper tooth grain + cinematic vignette
  ctx.drawImage(paperTooth, 0, 0);
  ctx.drawImage(vigCanvas, 0, 0);

  // Warm Golden Treasure Doorway Light Bloom Transition (T02: f168..190)
  if (st.flashAlpha > 0.005) {
    const a = st.flashAlpha;
    ctx.save();
    const fg = ctx.createRadialGradient(W * 0.5, H * 0.48, 24, W * 0.5, H * 0.48, H * 0.72);
    fg.addColorStop(0, `rgba(255,252,226,${Math.min(1, a * 1.35).toFixed(4)})`);
    fg.addColorStop(0.5, `rgba(255,216,118,${Math.min(1, a * 1.15).toFixed(4)})`);
    fg.addColorStop(1, `rgba(245,168,62,${Math.min(1, a * 0.95).toFixed(4)})`);
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, W, H);
    if (a > 0.65) {
      const veil = (a - 0.65) / 0.35;
      ctx.fillStyle = `rgba(255,244,202,${Math.min(1, veil).toFixed(4)})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  if (!prevFrameCanvas) {
    prevFrameCanvas = document.createElement('canvas');
    prevFrameCanvas.width = W;
    prevFrameCanvas.height = H;
  }
  prevFrameCanvas.getContext('2d').drawImage(outCanvas, 0, 0);
  prevFrameIdx = rawFrame;
}

async function runGates() {
  const list = (params.get('list') || '28,96,152,208,274').split(',').map(Number);
  try {
    for (const fIdx of list) {
      renderFrame(fIdx);
      const blob = await new Promise((res) => outCanvas.toBlob(res, 'image/png'));
      const r = await fetch(`/gate/${fIdx}`, { method: 'POST', body: blob });
      if (!r.ok) throw new Error(`gate POST failed for f${fIdx}`);
    }
    await fetch('/done', { method: 'POST' });
  } catch (err) {
    await fetch('/error', { method: 'POST', body: String(err && err.stack || err) });
  }
}

async function runStream() {
  const wid = params.get('worker') || '0';
  const start = Number(params.get('start') || 0);
  const end = Number(params.get('end') || 300);
  let cachedFreezeBuf = null;
  try {
    for (let f = start; f < end; f++) {
      let rawBuf;
      if (f > FREEZE_START && cachedFreezeBuf) {
        rawBuf = cachedFreezeBuf;
      } else {
        renderFrame(f);
        const imgData = ctx.getImageData(0, 0, W, H);
        rawBuf = imgData.data.buffer;
        if (f === FREEZE_START) cachedFreezeBuf = rawBuf.slice(0);
      }
      const r = await fetch(`/frame/${wid}/${f}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: rawBuf,
      });
      if (!r.ok) throw new Error(`frame POST failed w${wid}:f${f} (${r.status})`);
    }
    await fetch(`/done/${wid}`, { method: 'POST' });
  } catch (err) {
    await fetch(`/error/${wid}`, { method: 'POST', body: String(err && err.stack || err) });
  }
}

if (MODE === 'gates') {
  runGates();
} else if (MODE === 'stream') {
  runStream();
} else {
  renderFrame(Number(params.get('f') || 28));
}
