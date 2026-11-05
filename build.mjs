import { build } from 'esbuild';
import { rmSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

rmSync('js/chunks', { recursive: true, force: true });
rmSync('js/worker.js', { force: true });
rmSync('sw.js', { force: true });

await build({
  entryPoints: ['src/worker.src.js'],
  bundle: true,
  format: 'esm',
  splitting: true,
  outdir: 'js',
  entryNames: 'worker',
  chunkNames: 'chunks/[name]-[hash]',
  minify: true,
  target: 'es2022',
  platform: 'browser',
  logLevel: 'info',
});

mkdirSync('wasm', { recursive: true });
copyFileSync('node_modules/@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm', 'wasm/mozjpeg_enc.wasm');
copyFileSync('node_modules/@jsquash/oxipng/codec/pkg/squoosh_oxipng_bg.wasm', 'wasm/squoosh_oxipng_bg.wasm');
copyFileSync('node_modules/@panda-ai/imagequant/imagequant_bg.wasm', 'wasm/imagequant_bg.wasm');
console.log('wasm copied');

// The app shell. Code-split chunks are left out on purpose: the HEIC decoder is
// ~2 MB and gets cached on first use instead.
const PRECACHE_FILES = [
  'index.html',
  'changelog.html',
  'offline.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/app.js',
  'js/theme.js',
  'js/share.js',
  'js/zip.js',
  'js/crc32.js',
  'js/worker.js',
  'wasm/mozjpeg_enc.wasm',
  'wasm/squoosh_oxipng_bg.wasm',
  'wasm/imagequant_bg.wasm',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'img/image-squeezer-vice-grip.png',
  'fonts/archivo-latin.woff2',
  'fonts/jetbrains-mono-latin.woff2',
];

const hash = createHash('sha256');
for (const file of PRECACHE_FILES) hash.update(readFileSync(file));
const version = hash.digest('hex').slice(0, 12);

const sw = readFileSync('src/sw.src.js', 'utf8')
  .replace('__VERSION__', version)
  .replace('__PRECACHE__', JSON.stringify(['./', ...PRECACHE_FILES], null, 2));
writeFileSync('sw.js', sw);
console.log(`sw.js written (version ${version})`);
