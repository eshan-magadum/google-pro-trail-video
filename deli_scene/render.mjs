#!/usr/bin/env node
// Starts a temporary local static HTTP server for deli_scene/, renders index.html in
// headless Chromium with SwiftShader WebGL2 at exact 2x resolution (1156x2032),
// and captures out/deli_scene_remake.png.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });

const caption = process.argv.includes('--caption');
const outPath = path.join(outDir, caption ? 'deli_scene_remake_captioned.png' : 'deli_scene_remake.png');
const WIDTH = 1156;
const HEIGHT = 2032;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  const filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(__dirname) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const url = `http://127.0.0.1:${port}/index.html${caption ? '?caption=1' : ''}`;

const args = [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu-sandbox',
  '--enable-webgl',
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  `--window-size=${WIDTH},${HEIGHT}`,
  '--virtual-time-budget=4000',
  `--screenshot=${outPath}`,
  url,
];

const proc = spawn('/usr/bin/chromium', args, { stdio: ['ignore', 'pipe', 'pipe'] });
let stderr = '';
proc.stderr.on('data', (d) => { stderr += d.toString(); });

const code = await new Promise((resolve) => proc.on('close', resolve));
server.close();

if (code !== 0 || !fs.existsSync(outPath)) {
  console.error('Chromium failed:', code, stderr);
  process.exit(1);
}
console.log(`Rendered ${outPath} (${WIDTH}x${HEIGHT})`);
