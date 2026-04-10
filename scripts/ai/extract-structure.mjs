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
 * Generic SVG structural extractor.
 * Works on any SVG — Vega output, Figma exports, or anything else.
 * Produces a normalized schema so two SVGs can be diffed directly.
 *
 * Usage: node scripts/ai/extract-structure.mjs <path-to-svg>
 * Output: JSON to stdout, also written to <input>.structure.json
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const [, , svgArg] = process.argv;
if (!svgArg) {
  console.error('Usage: node extract-structure.mjs <path-to-svg>');
  process.exit(1);
}

const svgPath = resolve(process.cwd(), svgArg);
const svg = readFileSync(svgPath, 'utf-8');

const structure = extractStructure(svg);
const outPath = svgPath.replace(/\.svg$/, '.structure.json');
writeFileSync(outPath, JSON.stringify(structure, null, 2), 'utf-8');
console.log(JSON.stringify(structure, null, 2));

function extractStructure(svgText) {
  // ---- Dimensions ----
  const viewBox = svgText.match(/viewBox="([^"]+)"/)?.[1] ?? null;
  const width = svgText.match(/<svg[^>]*\swidth="([^"]+)"/)?.[1] ?? null;
  const height = svgText.match(/<svg[^>]*\sheight="([^"]+)"/)?.[1] ?? null;

  // ---- Text content (present in semantic SVGs like Vega, absent in Figma exports) ----
  const text = [...svgText.matchAll(/<text[^>]*>([^<]+)<\/text>/g)]
    .map(m => m[1].trim())
    .filter(Boolean);

  // ---- All paths, categorized by geometry ----
  const allPaths = [...svgText.matchAll(/<path[^>]*\bd="([^"]+)"[^>]*/g)].map(([fullTag, d]) => {
    const fill   = fullTag.match(/\bfill="([^"]+)"/)?.[1] ?? null;
    const stroke = fullTag.match(/\bstroke="([^"]+)"/)?.[1] ?? null;
    const cmds   = (d.match(/[MLCQSATZHV]/gi) ?? []).map(c => c.toUpperCase());
    const cmdCounts = cmds.reduce((a, c) => ({ ...a, [c]: (a[c] ?? 0) + 1 }), {});
    const isClosed   = cmds.includes('Z');
    const hasCurves  = cmds.some(c => 'CQS'.includes(c));
    const isHLine    = /^M[\d.\s-]+L[\d.\s-]+$/.test(d.trim()) && isHorizontal(d);
    const isVLine    = /^M[\d.\s-]+L[\d.\s-]+$/.test(d.trim()) && isVertical(d);

    return {
      d: d.length > 100 ? d.slice(0, 100) + '…' : d,
      commands: cmdCounts,
      fill,
      stroke,
      category: categorize(isClosed, hasCurves, isHLine, isVLine),
      start: parseFirstPoint(d),
      end: parseLastPoint(d),
    };
  });

  // Group paths by category for easier comparison
  const pathsByCategory = {};
  for (const p of allPaths) {
    pathsByCategory[p.category] ??= [];
    pathsByCategory[p.category].push(p);
  }

  // ---- Lines (non-path) ----
  const lines = [...svgText.matchAll(/<line[^>]*>/g)].map(tag => ({
    x1: parseFloat(tag[0].match(/\bx1="([^"]+)"/)?.[1] ?? '0'),
    y1: parseFloat(tag[0].match(/\by1="([^"]+)"/)?.[1] ?? '0'),
    x2: parseFloat(tag[0].match(/\bx2="([^"]+)"/)?.[1] ?? '0'),
    y2: parseFloat(tag[0].match(/\by2="([^"]+)"/)?.[1] ?? '0'),
    stroke: tag[0].match(/\bstroke="([^"]+)"/)?.[1] ?? null,
  }));

  // ---- Colors ----
  const fills   = [...new Set([...svgText.matchAll(/\bfill="([^"]+)"/g)].map(m => m[1]))].filter(c => c !== 'none');
  const strokes = [...new Set([...svgText.matchAll(/\bstroke="([^"]+)"/g)].map(m => m[1]))].filter(c => c !== 'none');

  // ---- Semantic roles (Vega output only — empty for Figma) ----
  const roles = [...new Set([...svgText.matchAll(/class="([^"]+)"/g)].map(m => m[1]))];

  return {
    dimensions: { width, height, viewBox },
    text,
    colors: { fills, strokes },
    roles,          // non-empty for Vega SVGs, empty for Figma
    pathsByCategory,
    lines: {
      total: lines.length,
      horizontal: lines.filter(l => Math.abs(l.y2 - l.y1) < 1).length,
      vertical:   lines.filter(l => Math.abs(l.x2 - l.x1) < 1).length,
      sample: lines.slice(0, 10),
    },
    summary: {
      totalPaths: allPaths.length,
      byCategory: Object.fromEntries(
        Object.entries(pathsByCategory).map(([k, v]) => [k, v.length])
      ),
    },
  };
}

function categorize(closed, curves, hLine, vLine) {
  if (hLine) return 'line-horizontal';
  if (vLine) return 'line-vertical';
  if (!closed && curves) return 'curve-open';       // data series lines
  if (!closed && !curves) return 'line-open';        // straight open paths
  if (closed && !curves) return 'shape-rect';        // rectangles / backgrounds
  if (closed && curves) return 'shape-curved';       // rounded shapes, glyphs
  return 'other';
}

function isHorizontal(d) {
  const pts = parsePoints(d);
  if (pts.length < 2) return false;
  return Math.abs(pts[0][1] - pts[pts.length - 1][1]) < 2;
}

function isVertical(d) {
  const pts = parsePoints(d);
  if (pts.length < 2) return false;
  return Math.abs(pts[0][0] - pts[pts.length - 1][0]) < 2;
}

function parsePoints(d) {
  return [...d.matchAll(/[ML]\s*([\d.-]+)[,\s]+([\d.-]+)/g)].map(m => [parseFloat(m[1]), parseFloat(m[2])]);
}

function parseFirstPoint(d) {
  const m = d.match(/M\s*([\d.-]+)[,\s]+([\d.-]+)/);
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
}

function parseLastPoint(d) {
  const nums = [...d.matchAll(/([\d.-]+)[,\s]+([\d.-]+)/g)];
  if (!nums.length) return null;
  const last = nums[nums.length - 1];
  return [parseFloat(last[1]), parseFloat(last[2])];
}
