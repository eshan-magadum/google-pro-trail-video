// 2.5D Hybrid WebGL2 + Canvas2D Renderer for Teleportation Preview v2.0 (Skill v2.0 Single-Frame Detail Standard)
// Renders 720x1280 WebGL2 (360x640 UnrealBloomPass) + atmospheric 2D finish (ZERO captions, ZERO audio).
// Modes via URL query params:
//   ?mode=gates&list=32,102,162,218,282  -> POSTs 5 full-res 720x1280 PNGs for Stage 4B audit
//   ?mode=stream&worker=0&start=0&end=135 -> POSTs raw RGBA frames to local HTTP server -> ffmpeg Lanczos 1080x1920!
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { evalTimeline, FREEZE_START } from './timeline.js';
import { createInventorRig } from './rigs/inventor_rig.js';
import { buildLabWorld } from './worlds/world_lab.js';
import { buildRooftopWorld } from './worlds/world_rooftop.js';
import { mulberry32 } from './worlds/env_helpers.js';

const W = 720;
const H = 1280;

const params = new URLSearchParams(window.location.search);
const MODE = params.get('mode') || 'preview';

function makeSoftShadowTex() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 14, 128, 128, 120);
  gr.addColorStop(0, 'rgba(12,8,18,0.68)');
  gr.addColorStop(0.55, 'rgba(12,8,18,0.34)');
  gr.addColorStop(1, 'rgba(12,8,18,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

// 1. Setup Three.js WebGL2 Renderer & Half-Res UnrealBloomPass
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setSize(W, H, false);
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(46, W / H, 0.1, 140);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.30, 0.36, 0.92);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// 2. Dual Lighting Rigs (Warm Honey-Amber Lab vs Moonlit Twilight Rooftop — High Color-Temperature Contrast!)
const labLights = new THREE.Group();
scene.add(labLights);
const labHemi = new THREE.HemisphereLight('#FFE2B4', '#522E20', 1.08);
const labKey = new THREE.DirectionalLight('#FFC678', 1.55);
labKey.position.set(3.2, 6.5, 4.2);
const labFill = new THREE.DirectionalLight('#E89A60', 0.60);
labFill.position.set(-4.0, 2.8, 2.5);
labLights.add(labHemi, labKey, labFill);
for (const [lx, ly, lz] of [[-2.15, 3.45, -0.8], [0.05, 3.9, -1.2], [2.35, 3.35, -0.5]]) {
  const pl = new THREE.PointLight('#FFAB4A', 6.4, 11.5, 1.35);
  pl.position.set(lx, ly, lz);
  labLights.add(pl);
}
const podLight = new THREE.PointLight('#5CEEFF', 1.6, 8.5, 1.5);
podLight.position.set(0.25, 1.65, -1.15);
labLights.add(podLight);

const roofLights = new THREE.Group();
scene.add(roofLights);
const roofHemi = new THREE.HemisphereLight('#869ED6', '#332C3E', 1.05);
const moonKey = new THREE.DirectionalLight('#C2D6FF', 1.18);
moonKey.position.set(-5.0, 12.0, -14.0);
const roofWarmBounce = new THREE.DirectionalLight('#FFA858', 0.52);
roofWarmBounce.position.set(-4.0, 3.5, 3.5);
roofLights.add(roofHemi, moonKey, roofWarmBounce);

const labBg = new THREE.Color('#2A1B19');
const labFog = new THREE.FogExp2('#2A1B19', 0.025);
const roofBg = new THREE.Color('#181F36');
const roofFog = new THREE.FogExp2('#1E2540', 0.013);

// 3. Build Multi-Angle Character Rigs & Both Richly Detailed 3D Worlds!
const shadowTex = makeSoftShadowTex();
const heroRig = createInventorRig();
const cloneRig = createInventorRig();
const labWorld = buildLabWorld(scene, heroRig.texture, shadowTex);
const rooftopWorld = buildRooftopWorld(scene, heroRig.texture, cloneRig.texture, shadowTex);

// 4. Final Compositing Canvas (WebGL2 + Subtle 2D Atmosphere, Motes, Whip-Blur, Vignette & Quantum Flash — ZERO Captions!)
const outCanvas = document.createElement('canvas');
outCanvas.width = W;
outCanvas.height = H;
outCanvas.style.width = '100vw';
outCanvas.style.height = '100vh';
outCanvas.style.objectFit = 'contain';
document.body.appendChild(outCanvas);
const ctx = outCanvas.getContext('2d', { willReadFrequently: true });

// Pre-seeded floating atmospheric dust / wind motes
const moteRng = mulberry32(8821);
const motes = Array.from({ length: 42 }, () => ({
  x: moteRng() * W,
  y: moteRng() * H,
  r: 1.4 + moteRng() * 2.8,
  vx: (moteRng() - 0.5) * 32,
  vy: -14 - moteRng() * 24,
  phase: moteRng() * Math.PI * 2,
}));

// Cached soft cinematic vignette overlay (frames corners cleanly around 0.48-0.80 while keeping lifted shadow floor!)
const vigCanvas = document.createElement('canvas');
vigCanvas.width = W; vigCanvas.height = H;
const vg = vigCanvas.getContext('2d');
const vgr = vg.createRadialGradient(W * 0.5, H * 0.48, W * 0.22, W * 0.5, H * 0.5, H * 0.60);
vgr.addColorStop(0, 'rgba(18,14,26,0)');
vgr.addColorStop(0.58, 'rgba(18,14,28,0.24)');
vgr.addColorStop(1, 'rgba(18,14,28,0.78)');
vg.fillStyle = vgr;
vg.fillRect(0, 0, W, H);

let prevFrameCanvas = null;
let prevFrameIdx = -999;

function renderFrame(rawFrame) {
  const st = evalTimeline(rawFrame);

  // Toggle active world & lighting rig cleanly
  const isLab = st.world === 'lab';
  labWorld.group.visible = isLab;
  labLights.visible = isLab;
  rooftopWorld.group.visible = !isLab;
  roofLights.visible = !isLab;
  scene.background = isLab ? labBg : roofBg;
  scene.fog = isLab ? labFog : roofFog;

  // Dynamic camera
  camera.fov = st.fov;
  camera.updateProjectionMatrix();
  camera.position.set(...st.camPos);
  camera.lookAt(...st.camLook);

  // Update dynamic cel character rigs
  heroRig.update(st.heroRigOpts);
  if (!isLab && st.cloneAlpha > 0.02) {
    cloneRig.update(st.cloneRigOpts);
  }

  // Update active 3D world props, gauges, coils, rings, sparks, lantern, clone
  if (isLab) {
    podLight.intensity = 1.4 + st.surge * 4.4;
    bloomPass.strength = 0.28 + st.surge * 0.14;
    labWorld.update(st, camera);
  } else {
    bloomPass.strength = 0.28 + st.portalRingOpacity * 0.08;
    rooftopWorld.update(st, camera);
  }

  // Render WebGL2 + Half-Res Bloom
  composer.render();

  // Composite onto 2D final canvas
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(renderer.domElement, 0, 0, W, H);

  // Subtle horizontal whip-motion ghost during fast camera glides (S01->S02, S02->S03)
  if (st.whipGhost > 0.02 && prevFrameCanvas && prevFrameIdx === rawFrame - 1) {
    ctx.save();
    ctx.globalAlpha = st.whipGhost;
    ctx.drawImage(prevFrameCanvas, -14, 0, W, H);
    ctx.drawImage(prevFrameCanvas, 14, 0, W, H);
    ctx.restore();
  }

  // Atmospheric floating warm lab dust motes / twilight breeze specks
  ctx.save();
  for (const m of motes) {
    const mx = ((m.x + st.t * m.vx * (isLab ? 0.65 : 2.1)) % W + W) % W;
    const my = ((m.y + st.t * m.vy * (isLab ? 0.8 : 0.4)) % H + H) % H;
    const alpha = 0.20 + 0.18 * Math.sin(st.t * 3.2 + m.phase);
    ctx.fillStyle = isLab
      ? `rgba(255,214,142,${alpha.toFixed(3)})`
      : `rgba(170,224,255,${(alpha * 0.9).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(mx, my, m.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Subtle quantum chromatic glitch horizontal scan-ticks around Clone during reveal!
  if (!isLab && st.cloneAlpha > 0.12) {
    ctx.save();
    const gSeed = Math.floor(st.f * 1.5);
    const grng = mulberry32(9900 + gSeed);
    for (let i = 0; i < 6; i++) {
      const gy = H * 0.36 + grng() * (H * 0.36);
      const gx = W * 0.48 + grng() * (W * 0.24);
      const gw = 28 + grng() * 110;
      ctx.fillStyle = i % 2 === 0
        ? `rgba(115,245,255,${(0.32 * st.cloneAlpha).toFixed(3)})`
        : `rgba(255,225,130,${(0.24 * st.cloneAlpha).toFixed(3)})`;
      ctx.fillRect(gx, gy, gw, 3 + grng() * 3);
    }
    ctx.restore();
  }

  // Balanced natural vignette (preserves lifted shadow floor!)
  ctx.drawImage(vigCanvas, 0, 0);

  // Blinding Cyan-Gold Quantum Teleport Blow-Out Flash (T03: f176..199)
  if (st.flashAlpha > 0.005) {
    const a = st.flashAlpha;
    ctx.save();
    // Radial electric cyan-gold energy bloom
    const fg = ctx.createRadialGradient(W * 0.5, H * 0.48, 20, W * 0.5, H * 0.48, H * 0.72);
    fg.addColorStop(0, `rgba(255,255,255,${Math.min(1, a * 1.35).toFixed(4)})`);
    fg.addColorStop(0.45, `rgba(175,248,255,${Math.min(1, a * 1.15).toFixed(4)})`);
    fg.addColorStop(1, `rgba(255,226,155,${Math.min(1, a * 0.95).toFixed(4)})`);
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, W, H);
    // Pure white-cyan veil at peak (f187-190) so world swap has ~0 frame diff
    if (a > 0.65) {
      const veil = (a - 0.65) / 0.35;
      ctx.fillStyle = `rgba(242,253,255,${Math.min(1, veil).toFixed(4)})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  // Save prev frame snapshot for whip-ghost continuity
  if (!prevFrameCanvas) {
    prevFrameCanvas = document.createElement('canvas');
    prevFrameCanvas.width = W;
    prevFrameCanvas.height = H;
  }
  prevFrameCanvas.getContext('2d').drawImage(outCanvas, 0, 0);
  prevFrameIdx = rawFrame;
}

// 5. Execution Modes
async function runGates() {
  const list = (params.get('list') || '32,102,162,218,282').split(',').map(Number);
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
        // Exact 1.00 s freeze hold (f271..299 reuse f270 buffer directly — zero compute & pixel-perfect!)
        rawBuf = cachedFreezeBuf;
      } else {
        renderFrame(f);
        const imgData = ctx.getImageData(0, 0, W, H);
        rawBuf = imgData.data.buffer;
        if (f === FREEZE_START) {
          cachedFreezeBuf = rawBuf.slice(0);
        }
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
  renderFrame(Number(params.get('f') || 32));
}
