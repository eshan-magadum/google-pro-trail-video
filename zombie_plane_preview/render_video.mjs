#!/usr/bin/env node
// Fast 4-Worker Parallel Headless Chromium WebGL2 Stream Renderer -> ffmpeg H.264 30 FPS MP4 + Contact Sheet.
// Usage:
//   Keyframe audit (9 full-res PNGs): node render_video.mjs --keyframes
//   Full 10s 30-FPS 1080x1920 MP4:    node render_video.mjs [--no-caption] [--silent] [--workers=4]
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'out');
const kfDir = path.join(outDir, '_keyframes');
fs.mkdirSync(outDir, { recursive: true });

const KEYFRAMES_ONLY = process.argv.includes('--keyframes');
const NO_CAPTION = process.argv.includes('--no-caption');
const SILENT = process.argv.includes('--silent');
const workerArg = process.argv.find((a) => a.startsWith('--workers='));
const NUM_WORKERS = workerArg ? Math.max(1, Number(workerArg.split('=')[1])) : Math.min(4, Math.max(2, os.cpus().length));

const W = 1080;
const H = 1920;
const FPS = 30;
const TOTAL_FRAMES = 300;
const KEYFRAME_LIST = [14, 38, 85, 126, 148, 198, 226, 252, 285];

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

const rawMp4 = path.join(outDir, '_tmp_video_only.mp4');
const audioWav = path.join(outDir, '_tmp_audio_master.wav');
const finalMp4 = path.join(outDir, NO_CAPTION ? 'zombie_plane_preview_clean.mp4' : 'zombie_plane_preview.mp4');
const contactSheet = path.join(outDir, 'contact_sheet.jpg');

// Partition 300 frames across N workers (keep f270-299 freeze tail in last worker so it finishes ultra-fast!)
const workers = new Map();
let totalStreamed = 0;
const tStart = Date.now();

if (KEYFRAMES_ONLY) {
  fs.mkdirSync(kfDir, { recursive: true });
} else {
  // Balance live rendered frames across workers (f271..299 are instant cached freeze copies!)
  const ranges = NUM_WORKERS === 2
    ? [{ id: '0', start: 0, end: 135 }, { id: '1', start: 135, end: TOTAL_FRAMES }]
    : Array.from({ length: NUM_WORKERS }, (_, i) => {
        const step = Math.ceil(TOTAL_FRAMES / NUM_WORKERS);
        return { id: String(i), start: i * step, end: Math.min(TOTAL_FRAMES, (i + 1) * step) };
      }).filter((r) => r.start < r.end);
  for (const r of ranges) {
    const segPath = path.join(outDir, `_tmp_seg_${r.id}.mp4`);
    const ff = spawn('ffmpeg', [
      '-y', '-loglevel', 'error',
      '-f', 'rawvideo', '-pix_fmt', 'rgba',
      '-s', `${W}x${H}`, '-r', String(FPS),
      '-i', 'pipe:0',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '13',
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

let kfResolve, kfReject;
const kfDonePromise = new Promise((res, rej) => { kfResolve = res; kfReject = rej; });

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = (req.url || '/').split('?')[0];

    if (req.method === 'POST' && urlPath.startsWith('/frame/')) {
      const [, , wid, fStr] = urlPath.split('/');
      const w = workers.get(wid);
      if (!w) { res.writeHead(404); res.end('Unknown worker'); return; }
      const buf = await readBody(req);
      if (buf.length !== W * H * 4) {
        res.writeHead(400); res.end(`Expected ${W * H * 4}, got ${buf.length}`); return;
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

    if (req.method === 'POST' && urlPath.startsWith('/keyframe/')) {
      const fIdx = Number(urlPath.slice('/keyframe/'.length));
      const buf = await readBody(req);
      const outPng = path.join(kfDir, `f_${String(fIdx).padStart(3, '0')}.png`);
      fs.writeFileSync(outPng, buf);
      console.log(`  saved keyframe ${outPng} (${(buf.length / 1024).toFixed(0)} KB)`);
      res.writeHead(200); res.end('ok'); return;
    }

    if (req.method === 'POST' && urlPath === '/done') {
      res.writeHead(200); res.end('done');
      kfResolve();
      return;
    }

    if (req.method === 'POST' && urlPath === '/error') {
      const msg = (await readBody(req)).toString('utf-8');
      res.writeHead(500); res.end('err');
      kfReject(new Error(`Browser error: ${msg}`));
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
    `--window-size=${W},${H}`,
    '--autoplay-policy=no-user-gesture-required',
    url,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
}

if (KEYFRAMES_ONLY) {
  const url = `http://127.0.0.1:${port}/index.html?mode=keyframes&list=${KEYFRAME_LIST.join(',')}&caption=${NO_CAPTION ? 0 : 1}`;
  console.log(`Launching Chromium for ${KEYFRAME_LIST.length} audit keyframes...`);
  const chrome = launchChrome(url);
  try {
    await kfDonePromise;
  } finally {
    chrome.kill('SIGTERM');
    server.close();
  }
  console.log(`Keyframes done in ${((Date.now() - tStart) / 1000).toFixed(1)}s!`);
  process.exit(0);
}

console.log(`Launching ${workers.size} parallel Chromium WebGL2 workers for ${TOTAL_FRAMES} frames (${W}x${H} @ ${FPS} fps)...`);
for (const w of workers.values()) {
  const url = `http://127.0.0.1:${port}/index.html?mode=stream&worker=${w.id}&start=${w.start}&end=${w.end}&caption=${NO_CAPTION ? 0 : 1}`;
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

// Lossless concat of parallel segments into master video stream
const concatTxt = path.join(outDir, '_tmp_concat.txt');
const segList = Array.from(workers.values()).map((w) => `file '${w.segPath}'`).join('\n');
fs.writeFileSync(concatTxt, segList + '\n');
await runCmd('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'concat', '-safe', '0', '-i', concatTxt,
  '-c', 'copy',
  '-movflags', '+faststart',
  rawMp4,
]);
for (const w of workers.values()) fs.rmSync(w.segPath, { force: true });
fs.rmSync(concatTxt, { force: true });

console.log(`All 300 frames encoded in ${((Date.now() - tStart) / 1000).toFixed(1)}s!`);

if (SILENT) {
  fs.renameSync(rawMp4, finalMp4);
} else {
  await runCmd('python3', [path.join(__dirname, 'audio_gen.py'), audioWav], { cwd: __dirname });
  await runCmd('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', rawMp4,
    '-i', audioWav,
    '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '192k',
    '-shortest',
    '-movflags', '+faststart',
    finalMp4,
  ]);
  fs.rmSync(rawMp4, { force: true });
  fs.rmSync(audioWav, { force: true });
}

// Generate 30-tile visual contact sheet (every 10th frame f000..f290 in 6x5 grid!)
await runCmd('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-i', finalMp4,
  '-vf', "select='not(mod(n,10))',scale=270:480,tile=6x5:padding=6:margin=6:color=0x101230",
  '-frames:v', '1',
  '-q:v', '2',
  contactSheet,
]);

const sizeMB = (fs.statSync(finalMp4).size / (1024 * 1024)).toFixed(2);
console.log(`DONE! Final MP4: ${finalMp4} (${sizeMB} MB), Contact Sheet: ${contactSheet}`);
