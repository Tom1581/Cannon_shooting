// Regenerate Android launcher PNGs from the three SVG masters in this folder.
// Run: npm run gen-icons   (uses devDependency `sharp`)
//
// Replaces every PNG under android/app/src/main/res/mipmap-*.
// Adaptive icon foreground/background SVGs are also copied next to them.

import sharp from 'sharp';
import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const RES = join(ROOT, 'android/app/src/main/res');

// Density buckets and target icon size (px) for ic_launcher.
// Android adaptive icons are 108x108dp; we follow the official densities.
const DENSITIES = [
  { dir: 'mipmap-mdpi',    size: 48 },
  { dir: 'mipmap-hdpi',    size: 72 },
  { dir: 'mipmap-xhdpi',   size: 96 },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];
// Adaptive foreground/background canvases are 108dp = 432px @ xxxhdpi.
const ADAPTIVE = [
  { dir: 'mipmap-mdpi',    size: 108 },
  { dir: 'mipmap-hdpi',    size: 162 },
  { dir: 'mipmap-xhdpi',   size: 216 },
  { dir: 'mipmap-xxhdpi',  size: 324 },
  { dir: 'mipmap-xxxhdpi', size: 432 },
];

const fullSvg = await readFile(join(__dirname, 'icon-full.svg'));
const foregroundSvg = await readFile(join(__dirname, 'icon-foreground.svg'));
const backgroundSvg = await readFile(join(__dirname, 'icon-background.svg'));
const splashSvg = await readFile(join(__dirname, 'splash.svg'));

async function ensure(dir) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

async function renderTo(svg, outPath, size) {
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log('✓', outPath.replace(ROOT + '/', ''));
}

// Legacy square icons (used pre-Android 8 and as fallback).
for (const d of DENSITIES) {
  const dir = join(RES, d.dir);
  await ensure(dir);
  await renderTo(fullSvg, join(dir, 'ic_launcher.png'), d.size);
  await renderTo(fullSvg, join(dir, 'ic_launcher_round.png'), d.size);
}
// Adaptive icon layers (Android 8+).
for (const d of ADAPTIVE) {
  const dir = join(RES, d.dir);
  await ensure(dir);
  await renderTo(foregroundSvg, join(dir, 'ic_launcher_foreground.png'), d.size);
  await renderTo(backgroundSvg, join(dir, 'ic_launcher_background.png'), d.size);
}

// Splash images — Capacitor templates these as drawable-port-* / drawable-land-* PNGs.
const PORT = [
  { dir: 'drawable',              w: 480,  h: 800  },
  { dir: 'drawable-port-mdpi',    w: 320,  h: 480  },
  { dir: 'drawable-port-hdpi',    w: 480,  h: 800  },
  { dir: 'drawable-port-xhdpi',   w: 720,  h: 1280 },
  { dir: 'drawable-port-xxhdpi',  w: 960,  h: 1600 },
  { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
];
const LAND = [
  { dir: 'drawable-land-mdpi',    w: 480,  h: 320  },
  { dir: 'drawable-land-hdpi',    w: 800,  h: 480  },
  { dir: 'drawable-land-xhdpi',   w: 1280, h: 720  },
  { dir: 'drawable-land-xxhdpi',  w: 1600, h: 960  },
  { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
];
async function renderSplash(outPath, w, h) {
  await sharp(splashSvg, { density: 384 })
    .resize(w, h, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log('✓', outPath.replace(ROOT + '/', ''));
}
for (const s of [...PORT, ...LAND]) {
  const dir = join(RES, s.dir);
  await ensure(dir);
  await renderSplash(join(dir, 'splash.png'), s.w, s.h);
}

console.log('\nAll icons + splashes regenerated.');
