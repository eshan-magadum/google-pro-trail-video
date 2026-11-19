#!/usr/bin/env node
// Fast 2-Worker Parallel Headless Chromium WebGL2 Renderer -> ffmpeg Lanczos 1080x1920 30-FPS Silent MP4 + Contact Sheet.
// Usage:
//   Stage 4B Full-Res Scene Gate (5 PNGs): node render_heist.mjs --gates
//   Full 10.00s 30-FPS 1080x1920 MP4:      node render_heist.mjs [--workers=2]
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'out');
const gatesDir = path.join(outDir, '_gates');
fs.mkdirSync(outDir, { recursive: true });

const GATES_ONLY = process.argv.includes('--gates');
const workerArg = process.argv.find((a) => a.startsWith('--workers='));
const NUM_WORKERS = workerArg ? Math.max(1, Number(workerArg.split('=')[1])) : Math.min(2, Math.max(1, os.cpus().length));

const RENDER_W = 720;
const RENDER_H = 1280;
const OUT_W = 1080;
const OUT_H = 1920;
const FPS = 30;
const TOTAL_FRAMES = 300;

const GATE_FRAMES = [
  { f: 28, name: 's01_lobby.png' },
  { f: 102, name: 's02_dial.png' },
  { f: 150, name: 's03_door_open.png' },
  { f: 208, name: 's04_vault_gold.png' },
  { f: 274, name: 's05_guard_twist.png' },
];
const GATE_MAP = new Map(GATE_FRAMES.map((g) => [g.f, g.name]));

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

const finalMp4 = path.join(outDir, 'bank_heist_v3.mp4');
const contactSheet = path.join(outDir, 'contact_sheet.jpg');

const workers = new Map();
let totalStreamed = 0;
const tStart = Date.now();

if (GATES_ONLY) {
  fs.mkdirSync(gatesDir, { recursive: true });
} else {
  const ranges = NUM_WORKERS === 2
    ? [{ id: '0', start: 0, end: 135 }, { id: '1', start: 135, end: TOTAL_FRAMES }]
    : [{ id: '0', start: 0, end: TOTAL_FRAMES }];

  for (const r of ranges) {
    const segPath = path.join(outDir, `_tmp_seg_${r.id}.mp4`);
    const ff = spawn('ffmpeg', [
      '-y', '-loglevel', 'error',
      '-f', 'rawvideo', '-pix_fmt', 'rgba',
      '-s', `${RENDER_W}x${RENDER_H}`, '-r', String(FPS),
      '-i', 'pipe:0',
      '-vf', `scale=${OUT_W}:${OUT_H}:flags=lanczos`,
      '-an',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
      segPath,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });

    let resolveDone, rejectDone;
    const donePromise = new Promise((res, rej) => { resolveDone = res; rejectDone = rej; });
    const ffDone = new Promise((res, rej) => {
      ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg seg ${r.id} exited ${c}`))));
    });
    workers.set(r.id, { ...r, segPath, ff, ffDone, donePromise, resolveDone, rejectDone, count: 0, proc: null });
  }
}

let gateResolve, gateReject;
const gateDonePromise = new Promise((res, rej) => { gateResolve = res; gateReject = rej; });

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = (req.url || '/').split('?')[0];

    if (req.method === 'POST' && urlPath.startsWith('/frame/')) {
      const [, , wid, fStr] = urlPath.split('/');
      const w = workers.get(wid);
      if (!w) { res.writeHead(404); res.end('Unknown worker'); return; }
      const buf = await readBody(req);
      if (buf.length !== RENDER_W * RENDER_H * 4) {
        res.writeHead(400); res.end(`Expected ${RENDER_W * RENDER_H * 4}, got ${buf.length}`); return;
      }
      if (!w.ff.stdin.write(buf)) {
        await new Promise((r) => w.ff.stdin.once('drain', r));
      }
      w.count++;
      totalStreamed++;
      if (totalStreamed % 30 === 0 || totalStreamed === TOTAL_FRAMES) {
        const el = ((Date.now() - tStart) / 1000).toFixed(1);
        console.log(`  rendered ${totalStreamed}/${TOTAL_FRAMES} frames (${el}s elapsed, latest w${wid}:f${fStr})`);
      }
      res.writeHead(200); res.end('ok'); return;
    }

    if (req.method === 'POST' && urlPath.startsWith('/done/')) {
      const wid = urlPath.slice('/done/'.length);
      const w = workers.get(wid);
      res.writeHead(200); res.end('done');
      if (w) w.resolveDone();
      return;
    }

    if (req.method === 'POST' && urlPath.startsWith('/error/')) {
      const wid = urlPath.slice('/error/'.length);
      const msg = (await readBody(req)).toString('utf-8');
      const w = workers.get(wid);
      res.writeHead(500); res.end('err');
      if (w) w.rejectDone(new Error(`Worker ${wid} error: ${msg}`));
      return;
    }

    if (req.method === 'POST' && urlPath.startsWith('/gate/')) {
      const fIdx = Number(urlPath.slice('/gate/'.length));
      const buf = await readBody(req);
      const fname = GATE_MAP.get(fIdx) || `f_${String(fIdx).padStart(3, '0')}.png`;
      const outPng = path.join(gatesDir, fname);
      fs.writeFileSync(outPng, buf);
      console.log(`  saved gate PNG ${outPng} (${(buf.length / 1024).toFixed(0)} KB)`);
      res.writeHead(200); res.end('ok'); return;
    }

    if (req.method === 'POST' && urlPath === '/done') {
      res.writeHead(200); res.end('done');
      gateResolve();
      return;
    }

    if (req.method === 'POST' && urlPath === '/error') {
      const msg = (await readBody(req)).toString('utf-8');
      res.writeHead(500); res.end('err');
      gateReject(new Error(`Browser error: ${msg}`));
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
    res.writeHead(500); res.end('Server error');
  }
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address();

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
    `--window-size=${RENDER_W},${RENDER_H}`,
    '--autoplay-policy=no-user-gesture-required',
    url,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
}

if (GATES_ONLY) {
  const list = GATE_FRAMES.map((g) => g.f).join(',');
  const url = `http://127.0.0.1:${port}/index.html?mode=gates&list=${list}`;
  console.log(`Launching Chromium for Stage 4B audit (${GATE_FRAMES.length} full-res 720x1280 PNGs)...`);
  const chrome = launchChrome(url);
  let stderr = '';
  chrome.stderr.on('data', (d) => { stderr += d.toString(); });
  chrome.on('exit', (code) => {
    if (code !== 0 && code !== null) gateReject(new Error(`Chrome exited ${code}: ${stderr.slice(-400)}`));
  });
  try {
    await gateDonePromise;
  } finally {
    chrome.kill('SIGTERM');
    server.close();
  }
  console.log(`Stage 4B gate PNGs done in ${((Date.now() - tStart) / 1000).toFixed(1)}s!`);
  process.exit(0);
}

console.log(`Launching ${workers.size} parallel Chromium WebGL2 workers (${RENDER_W}x${RENDER_H} -> Lanczos ${OUT_W}x${OUT_H} @ ${FPS} fps, silent)...`);
for (const w of workers.values()) {
  const url = `http://127.0.0.1:${port}/index.html?mode=stream&worker=${w.id}&start=${w.start}&end=${w.end}`;
  const proc = launchChrome(url);
  let stderr = '';
  proc.stderr.on('data', (d) => { stderr += d.toString(); });
  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) w.rejectDone(new Error(`Worker ${w.id} Chrome exited ${code}: ${stderr.slice(-400)}`));
  });
  w.proc = proc;
}

try {
  await Promise.all(Array.from(workers.values()).map((w) => w.donePromise));
} finally {
  for (const w of workers.values()) {
    if (w.proc) w.proc.kill('SIGTERM');
  }
  server.close();
}

for (const w of workers.values()) w.ff.stdin.end();
await Promise.all(Array.from(workers.values()).map((w) => w.ffDone));

const concatTxt = path.join(outDir, '_tmp_concat.txt');
const segList = Array.from(workers.values()).map((w) => `file '${w.segPath}'`).join('\n');
fs.writeFileSync(concatTxt, segList + '\n');
await runCmd('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'concat', '-safe', '0', '-i', concatTxt,
  '-c', 'copy',
  '-movflags', '+faststart',
  finalMp4,
]);
for (const w of workers.values()) fs.rmSync(w.segPath, { force: true });
fs.rmSync(concatTxt, { force: true });

// Generate 30-tile visual contact sheet (every 10th frame f000..f290 in 6x5 grid!)
await runCmd('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-i', finalMp4,
  '-vf', "select='not(mod(n,10))',scale=270:480,tile=6x5:padding=6:margin=6:color=0x141224",
  '-frames:v', '1',
  '-q:v', '2',
  contactSheet,
]);

const sizeMB = (fs.statSync(finalMp4).size / (1024 * 1024)).toFixed(2);
console.log(`DONE in ${((Date.now() - tStart) / 1000).toFixed(1)}s! MP4: ${finalMp4} (${sizeMB} MB), Contact Sheet: ${contactSheet}`);
