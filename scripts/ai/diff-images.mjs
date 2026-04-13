/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/**
 * Pixel-level diff between two PNG images.
 *
 * Usage:
 *   node scripts/ai/diff-images.mjs <image-a.png> <image-b.png> [options]
 *
 * Options:
 *   --out <path>           Where to write the diff PNG. Defaults to <dir-of-a>/diff.png
 *   --threshold <0-1>      Fraction of pixels allowed to differ before reporting failure.
 *                          Defaults to 0.05 (5%).
 *   --sensitivity <0-1>    Per-pixel color sensitivity. Lower = stricter. Defaults to 0.1.
 *   --crop-a <x,y,w,h>    Crop image A to this region before diffing.
 *   --crop-b <x,y,w,h>    Crop image B to this region before diffing.
 *                          When both crops are given, the smaller dimension is used so both
 *                          regions are the same size regardless of source image scale.
 *
 * Outputs:
 *   <out>               — red highlights where pixels differ
 *   <dir>/a-prepared.png / b-prepared.png — the actual regions being compared (after crop/resize)
 *
 * Exits 0 if within threshold, 1 if exceeds threshold or on error.
 *
 * Examples:
 *   # Basic comparison
 *   node diff-images.mjs figma.png result.png
 *
 *   # Compare only specific regions (e.g. inner plot area)
 *   node diff-images.mjs figma.png result.png --crop-a 80,106,514,229 --crop-b 64,88,480,210
 *
 *   # Stricter threshold
 *   node diff-images.mjs figma.png result.png --threshold 0.02
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Parse args ---

function parseArg(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : null;
}

function parseCrop(value) {
  if (!value) return null;
  const parts = value.split(',').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    console.error(`${value} must be four numbers: x,y,width,height`);
    process.exit(1);
  }
  return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
}

const positional = [];
for (let _i = 2; _i < process.argv.length; _i++) {
  if (process.argv[_i].startsWith('--')) { _i++; continue; } // skip flag + its value
  positional.push(process.argv[_i]);
}
const [imageAArg, imageBArg] = positional;

if (!imageAArg || !imageBArg) {
  console.error('Usage: node diff-images.mjs <image-a.png> <image-b.png> [options]');
  console.error('');
  console.error('Options:');
  console.error('  --out <path>         Output diff PNG path');
  console.error('  --threshold <0-1>    Max fraction of differing pixels (default 0.05)');
  console.error('  --sensitivity <0-1>  Per-pixel color threshold (default 0.1)');
  console.error('  --crop-a <x,y,w,h>  Crop image A before diffing');
  console.error('  --crop-b <x,y,w,h>  Crop image B before diffing');
  process.exit(1);
}

const imageAPath   = resolve(process.cwd(), imageAArg);
const imageBPath   = resolve(process.cwd(), imageBArg);
const outDir       = dirname(imageAPath);
const defaultOut   = resolve(outDir, 'diff.png');
const outPath      = parseArg('--out') ? resolve(process.cwd(), parseArg('--out')) : defaultOut;
const threshold    = parseArg('--threshold')   ? parseFloat(parseArg('--threshold'))   : 0.05;
const sensitivity  = parseArg('--sensitivity') ? parseFloat(parseArg('--sensitivity')) : 0.1;
const cropA        = parseCrop(parseArg('--crop-a'));
const cropB        = parseCrop(parseArg('--crop-b'));

mkdirSync(dirname(outPath), { recursive: true });

// --- Image helpers ---

function loadPng(path) {
  try {
    return PNG.sync.read(readFileSync(path));
  } catch (e) {
    console.error(`Could not read ${path}: ${e.message}`);
    process.exit(1);
  }
}

function cropPng(png, { x, y, width, height }) {
  const out = new PNG({ width, height });
  PNG.bitblt(png, out, x, y, width, height, 0, 0);
  return out;
}

// Resize src to targetWidth × targetHeight using sips (macOS), falls back to crop.
function resizePng(png, targetWidth, targetHeight) {
  if (png.width === targetWidth && png.height === targetHeight) return png;
  const tmpIn  = resolve(outDir, '_resize_in.png');
  const tmpOut = resolve(outDir, '_resize_out.png');
  writeFileSync(tmpIn, PNG.sync.write(png));
  try {
    execSync(`sips -z ${targetHeight} ${targetWidth} "${tmpIn}" --out "${tmpOut}" 2>/dev/null`);
    return loadPng(tmpOut);
  } catch {
    const cropped = new PNG({ width: targetWidth, height: targetHeight });
    PNG.bitblt(png, cropped, 0, 0, Math.min(png.width, targetWidth), Math.min(png.height, targetHeight), 0, 0);
    return cropped;
  }
}

// --- Load and prepare images ---

let imgA = loadPng(imageAPath);
let imgB = loadPng(imageBPath);

if (cropA) {
  console.log(`Crop A: x=${cropA.x} y=${cropA.y} w=${cropA.width} h=${cropA.height}`);
  imgA = cropPng(imgA, cropA);
}
if (cropB) {
  console.log(`Crop B: x=${cropB.x} y=${cropB.y} w=${cropB.width} h=${cropB.height}`);
  imgB = cropPng(imgB, cropB);
}

// When both crops are given, resize A to match B's dimensions so the same data scale is compared.
// When only one image needs resizing, resize to match the other.
if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
  const targetW = imgB.width;
  const targetH = imgB.height;
  console.log(`Resizing A from ${imgA.width}×${imgA.height} → ${targetW}×${targetH}`);
  imgA = resizePng(imgA, targetW, targetH);
}

// Save prepared images for visual inspection
const aPrepPath = resolve(dirname(outPath), 'a-prepared.png');
const bPrepPath = resolve(dirname(outPath), 'b-prepared.png');
writeFileSync(aPrepPath, PNG.sync.write(imgA));
writeFileSync(bPrepPath, PNG.sync.write(imgB));

// --- Diff ---

const { width: w, height: h } = imgA;
const diff = new PNG({ width: w, height: h });

const diffPixels = pixelmatch(imgA.data, imgB.data, diff.data, w, h, {
  threshold: sensitivity,
  includeAA: false,
});

writeFileSync(outPath, PNG.sync.write(diff));

const totalPixels = w * h;
const diffPct     = diffPixels / totalPixels;
const diffPctStr  = (diffPct * 100).toFixed(1);
const passed      = diffPct <= threshold;

console.log(`\nDiff summary`);
console.log(`  Images     : ${imageAArg}  vs  ${imageBArg}`);
console.log(`  Dimensions : ${w} × ${h}`);
console.log(`  Diff pixels: ${diffPixels.toLocaleString()} / ${totalPixels.toLocaleString()} (${diffPctStr}%)`);
console.log(`  Threshold  : ${(threshold * 100).toFixed(0)}%`);
console.log(`  Result     : ${passed ? 'PASS ✓' : 'FAIL ✗ — review diff.png'}`);
console.log(`  Diff image : ${outPath}`);
console.log(`  Prepared   : ${aPrepPath} / ${bPrepPath}`);

if (!passed) {
  console.log('\nRed pixels in diff.png show where the images differ.');
  console.log('Common causes:');
  console.log('  - Curve shapes don\'t match — check data values or interpolation');
  console.log('  - Axis tick spacing differs — check tickMinStep');
  console.log('  - Legend/title layout differs — check sizing props');
  console.log('  - Color differences only — may be acceptable (S2 palette vs Figma brand)');
}

process.exit(passed ? 0 : 1);
