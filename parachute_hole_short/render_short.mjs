#!/usr/bin/env node
// Resumable Chunked 2-Worker WebGL2 Stream Renderer for the 69-Second Parachute Hole Short.
// Streams native 720x1280 RGBA -> ffmpeg Lanczos 1080x1920 H.264 (silent, caption-free, 30.00 FPS).
//
// Usage:
//   Pre-render 16-keyframe audit:  node render_short.mjs --keyframes
//   Render single 10s chunk (0-6): node render_short.mjs --chunk=0 [--force]
//   Assemble final 69s MP4 + sheet:node render_short.mjs --assemble
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'out');
const chunksDir = path.join(outDir, '_chunks');
const kfDir = path.join(outDir, '_keyframes');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(chunksDir, { recursive: true });

const KEYFRAMES_ONLY = process.argv.includes('--keyframes');
const ASSEMBLE = process.argv.includes('--assemble');
const FORCE = process.argv.includes('--force');
const chunkArg = process.argv.find((a) => a.startsWith('--chunk='));
const CHUNK_IDX = chunkArg ? Number(chunkArg.split('=')[1]) : -1;

const SRC_W = 720;
const SRC_H = 1280;
const OUT_W = 1080;
const OUT_H = 1920;
const FPS = 30;
const TOTAL_FRAMES = 2070;

// 7 clean chunks (~300 frames each = ~10s per chunk -> ~2 min/chunk, zero timeout risk!)
const CHUNKS = [
  [0, 300],
  [300, 600],
  [600, 900],
  [900, 1200],
  [1200, 1500],
  [1500, 1800],
  [1800, 2070],
];

const KEYFRAME_LIST = [42, 105, 275, 495, 555, 685, 778, 940, 1175, 1275, 1391, 1525, 1610, 1765, 1995, 2055];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
};

function runCmd(bin, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { stdio: 'inherit', ...opts });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${bin} exited with ${code}`))));
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function launchChrome(url) {
  return spawn('/usr/bin/chromium', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu-sandbox',
    '--enable-webgl',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${SRC_W},${SRC_H}`,
    url,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
}

// ===========================================================================
// MODE A: ASSEMBLE ALL 7 CHUNKS INTO FINAL SILENT 1080x1920 MP4 + CONTACT SHEET
// ===========================================================================
if (ASSEMBLE) {
  const finalMp4 = path.join(outDir, 'parachute_hole_short.mp4');
  const contactSheet = path.join(outDir, 'contact_sheet.jpg');
  const lines = [];
  for (let i = 0; i < CHUNKS.length; i++) {
    const p = path.join(chunksDir, `chunk_${i}.mp4`);
    if (!fs.existsSync(p)) {
      console.error(`Missing chunk ${i}: ${p}`);
      process.exit(1);
    }
    lines.push(`file '${p}'`);
  }
  const concatTxt = path.join(chunksDir, 'concat_all.txt');
  fs.writeFileSync(concatTxt, lines.join('\n') + '\n');

  await runCmd('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', concatTxt,
    '-c', 'copy',
    '-an',
    '-movflags', '+faststart',
    finalMp4,
  ]);

  // 42-tile visual contact sheet (7x6 grid sampling every 49th frame across all 2,070 frames!)
  await runCmd('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', finalMp4,
    '-vf', "select='not(mod(n,49))',scale=270:480,tile=7x6:padding=6:margin=6:color=0x101230",
    '-frames:v', '1',
    '-q:v', '2',
    contactSheet,
  ]);

  const mb = (fs.statSync(finalMp4).size / (1024 * 1024)).toFixed(2);
  console.log(`ASSEMBLED FINAL SHORT: ${finalMp4} (${mb} MB, silent, caption-free)`);
  console.log(`42-TILE CONTACT SHEET: ${contactSheet}`);
  process.exit(0);
}

// ===========================================================================
// MODE B: FAST 16-KEYFRAME VISUAL AUDIT GRID
// ===========================================================================
if (KEYFRAMES_ONLY) {
  fs.mkdirSync(kfDir, { recursive: true });
  const t0 = Date.now();
  let resolveDone, rejectDone;
  const donePromise = new Promise((res, rej) => { resolveDone = res; rejectDone = rej; });

  const server = http.createServer(async (req, res) => {
    const urlPath = (req.url || '/').split('?')[0];
    if (req.method === 'POST' && urlPath.startsWith('/keyframe/')) {
      const fIdx = Number(urlPath.slice('/keyframe/'.length));
      const buf = await readBody(req);
      const outPng = path.join(kfDir, `f_${String(fIdx).padStart(4, '0')}.png`);
      fs.writeFileSync(outPng, buf);
      console.log(`  saved keyframe f=${fIdx} (${(buf.length / 1024).toFixed(0)} KB)`);
      res.writeHead(200); res.end('ok'); return;
    }
    if (req.method === 'POST' && urlPath === '/done') {
      res.writeHead(200); res.end('ok'); resolveDone(); return;
    }
    if (req.method === 'POST' && urlPath === '/error') {
      const msg = (await readBody(req)).toString('utf-8');
      res.writeHead(500); res.end('err'); rejectDone(new Error(msg)); return;
    }
    const filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
    if (!filePath.startsWith(__dirname) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404); res.end('Not found'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/index.html?mode=keyframes&list=${KEYFRAME_LIST.join(',')}`;
  console.log(`Rendering ${KEYFRAME_LIST.length} full-scene audit keyframes...`);
  const chrome = launchChrome(url);
  let errLog = '';
  chrome.stderr.on('data', (d) => { errLog += d.toString(); });
  chrome.on('exit', (c) => { if (c !== 0 && c !== null) rejectDone(new Error(`Chrome exited ${c}: ${errLog.slice(-400)}`)); });

  try {
    await donePromise;
  } finally {
    chrome.kill('SIGTERM');
    server.close();
  }

  // Stitch all 16 keyframes into a clean 4x4 visual audit grid!
  const listFile = path.join(kfDir, 'kf_concat.txt');
  fs.writeFileSync(listFile, KEYFRAME_LIST.map((f) => `file '${path.join(kfDir, `f_${String(f).padStart(4, '0')}.png`)}'`).join('\n') + '\n');
  const gridPath = path.join(kfDir, 'audit_grid.jpg');
  await runCmd('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-vf', 'scale=360:640,tile=4x4:padding=8:margin=8:color=0x101230',
    '-frames:v', '1', '-q:v', '2',
    gridPath,
  ]);
  console.log(`16-Keyframe Audit Grid ready: ${gridPath} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  process.exit(0);
}

// ===========================================================================
// MODE C: RENDER SINGLE RESUMABLE CHUNK (0..6) ACROSS 2 BALANCED WORKERS
// ===========================================================================
if (CHUNK_IDX < 0 || CHUNK_IDX >= CHUNKS.length) {
  console.error('Specify --keyframes, --chunk=0..6, or --assemble');
  process.exit(1);
}

const [cStart, cEnd] = CHUNKS[CHUNK_IDX];
const chunkOut = path.join(chunksDir, `chunk_${CHUNK_IDX}.mp4`);
if (!FORCE && fs.existsSync(chunkOut) && fs.statSync(chunkOut).size > 50000) {
  console.log(`Chunk ${CHUNK_IDX} already exists (${chunkOut}), skipping (use --force to overwrite).`);
  process.exit(0);
}

const mid = Math.floor((cStart + cEnd) / 2);
const ranges = [
  { id: '0', start: cStart, end: mid },
  { id: '1', start: mid, end: cEnd },
];

const workers = new Map();
let streamed = 0;
const chunkTotal = cEnd - cStart;
const tStart = Date.now();

for (const r of ranges) {
  const segPath = path.join(chunksDir, `_tmp_c${CHUNK_IDX}_w${r.id}.mp4`);
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'rawvideo', '-pix_fmt', 'rgba',
    '-s', `${SRC_W}x${SRC_H}`, '-r', String(FPS),
    '-i', 'pipe:0',
    '-vf', `scale=${OUT_W}:${OUT_H}:flags=lanczos`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '14',
    '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-an',
    segPath,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  let resolveDone, rejectDone;
  const donePromise = new Promise((res, rej) => { resolveDone = res; rejectDone = rej; });
  const ffDone = new Promise((res, rej) => {
    ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg c${CHUNK_IDX}_w${r.id} exited ${c}`))));
  });
  workers.set(r.id, { ...r, segPath, ff, ffDone, donePromise, resolveDone, rejectDone, proc: null });
}

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = (req.url || '/').split('?')[0];
    if (req.method === 'POST' && urlPath.startsWith('/frame/')) {
      const [, , wid, fStr] = urlPath.split('/');
      const w = workers.get(wid);
      if (!w) { res.writeHead(404); res.end('Unknown worker'); return; }
      const buf = await readBody(req);
      if (buf.length !== SRC_W * SRC_H * 4) {
        res.writeHead(400); res.end(`Bad size ${buf.length}`); return;
      }
      if (!w.ff.stdin.write(buf)) {
        await new Promise((r) => w.ff.stdin.once('drain', r));
      }
      streamed++;
      if (streamed % 50 === 0 || streamed === chunkTotal) {
        console.log(`  [chunk ${CHUNK_IDX}] ${streamed}/${chunkTotal} frames (${((Date.now() - tStart) / 1000).toFixed(1)}s, w${wid}:f${fStr})`);
      }
      res.writeHead(200); res.end('ok'); return;
    }
    if (req.method === 'POST' && urlPath.startsWith('/done/')) {
      const wid = urlPath.slice('/done/'.length);
      const w = workers.get(wid);
      res.writeHead(200); res.end('ok');
      if (w) w.resolveDone();
      return;
    }
    if (req.method === 'POST' && urlPath.startsWith('/error/')) {
      const wid = urlPath.slice('/error/'.length);
      const msg = (await readBody(req)).toString('utf-8');
      const w = workers.get(wid);
      res.writeHead(500); res.end('err');
      if (w) w.rejectDone(new Error(`Chunk ${CHUNK_IDX} w${wid}: ${msg}`));
      return;
    }
    const filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
    if (!filePath.startsWith(__dirname) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404); res.end('Not found'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error(err);
    res.writeHead(500); res.end('err');
  }
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address();

console.log(`Rendering Chunk ${CHUNK_IDX} (f${cStart}..f${cEnd - 1}, ${chunkTotal} frames) across 2 workers...`);
for (const w of workers.values()) {
  const url = `http://127.0.0.1:${port}/index.html?mode=stream&worker=${w.id}&start=${w.start}&end=${w.end}`;
  const proc = launchChrome(url);
  let stderr = '';
  proc.stderr.on('data', (d) => { stderr += d.toString(); });
  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) w.rejectDone(new Error(`Chrome w${w.id} exited ${code}: ${stderr.slice(-400)}`));
  });
  w.proc = proc;
}

try {
  await Promise.all(Array.from(workers.values()).map((w) => w.donePromise));
} finally {
  for (const w of workers.values()) if (w.proc) w.proc.kill('SIGTERM');
  server.close();
}

for (const w of workers.values()) w.ff.stdin.end();
await Promise.all(Array.from(workers.values()).map((w) => w.ffDone));

const cTxt = path.join(chunksDir, `_tmp_concat_c${CHUNK_IDX}.txt`);
fs.writeFileSync(cTxt, Array.from(workers.values()).map((w) => `file '${w.segPath}'`).join('\n') + '\n');
await runCmd('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'concat', '-safe', '0', '-i', cTxt,
  '-c', 'copy', '-an',
  chunkOut,
]);
for (const w of workers.values()) fs.rmSync(w.segPath, { force: true });
fs.rmSync(cTxt, { force: true });

console.log(`Chunk ${CHUNK_IDX} COMPLETE -> ${chunkOut} in ${((Date.now() - tStart) / 1000).toFixed(1)}s!`);
