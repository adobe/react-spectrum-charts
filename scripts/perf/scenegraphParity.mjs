#!/usr/bin/env node

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
 * Headless S2 animation parity and dataflow timing check, for refactors that should not change what renders.
 * Runs each preset's animation in a headless Vega view (CSP-safe interpreter, fixed clock), hashes every mark's
 * scenegraph items at sampled frames, and times the dataflow per frame. Uses the built vega-spec-builder-s2 dist.
 *
 * Record on the base branch, then compare on the change branch (rebuild with `yarn build:s2` after each checkout):
 *   yarn perf:parity --out perf-results/parity-before.json
 *   yarn perf:parity --compare perf-results/parity-before.json
 * Other options:
 *   yarn perf:parity --preset donut-draw-in --reps 10
 *   yarn perf:parity --list
 *
 * Exits 1 when any sampled frame differs from the baseline. Timing is reported but never fails the run.
 * To cover a new mark, add a preset to PRESETS.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SPEC_BUILDER = resolve(ROOT, 'packages/vega-spec-builder-s2');

const FRAME_MS = 16;
const CLOCK_START = 1000;
const WIDTH = 600;
const HEIGHT = 400;
/** Draw-in plus the donut label fade, with slack. */
const DRAW_IN_FRAMES = 90;
const DRAW_IN_SAMPLE_EVERY = 5;
const HOVER_TARGETS = 6;
const HOVER_FRAMES = 20;
const HOVER_SAMPLE_EVERY = 4;
/** Rounds away float noise from reordered arithmetic; far below a visible difference. */
const DECIMALS = 6;

const timeSeries = (series, points) => {
  const rows = [];
  for (let s = 0; s < series; s++) {
    for (let p = 0; p < points; p++) {
      rows.push({
        series: `s${s}`,
        datetime: 1700000000000 + p * 864e5,
        value: 5 + ((s * 7 + p * 13) % 50),
        point: p === points - 1,
      });
    }
  }
  return rows;
};

const categories = (series, bars) => {
  const rows = [];
  for (let s = 0; s < series; s++) {
    for (let b = 0; b < bars; b++)
      rows.push({ series: `s${s}`, category: `c${b}`, value: 5 + ((s * 11 + b * 17) % 40) });
  }
  return rows;
};

const slices = (count) => Array.from({ length: count }, (_, i) => ({ series: `s${i}`, value: 10 + ((i * 37) % 50) }));

const LINE = { markType: 'line', color: 'series', dimension: 'datetime', metric: 'value', scaleType: 'time' };
const BAR = { markType: 'bar', color: 'series', dimension: 'category', metric: 'value' };
const DONUT = { markType: 'donut', color: 'series', metric: 'value' };

const PRESETS = {
  'line-hover': {
    scenario: 'hover',
    data: timeSeries(8, 12),
    variants: {
      default: { ...LINE, chartInspects: [{}] },
      staticPoints: { ...LINE, staticPoint: 'point', chartInspects: [{}] },
    },
  },
  'line-draw-in': {
    scenario: 'drawIn',
    data: timeSeries(6, 12),
    variants: {
      default: LINE,
      staticPoints: { ...LINE, staticPoint: 'point' },
      dashed: { ...LINE, lineType: 'series' },
    },
  },
  'bar-hover': {
    scenario: 'hover',
    data: categories(4, 8),
    variants: {
      stacked: { ...BAR, chartInspects: [{}] },
      dodged: { ...BAR, type: 'dodged', chartInspects: [{}] },
      horizontal: { ...BAR, orientation: 'horizontal', chartInspects: [{}] },
    },
  },
  'donut-draw-in': {
    scenario: 'drawIn',
    data: slices(10),
    variants: {
      default: DONUT,
      labels: { ...DONUT, segmentLabels: [{}] },
      pie: { ...DONUT, holeRatio: 0 },
      holeRatio: { ...DONUT, holeRatio: 0.6 },
      semicircle: { ...DONUT, variant: 'semicircle' },
    },
  },
  'donut-hover': {
    scenario: 'hover',
    data: slices(10),
    variants: {
      default: { ...DONUT, chartInspects: [{}] },
      labels: { ...DONUT, segmentLabels: [{}], chartInspects: [{}] },
    },
  },
};

const OPTIONS = {
  preset: { type: 'string' },
  out: { type: 'string' },
  compare: { type: 'string' },
  reps: { type: 'string', default: '5' },
  list: { type: 'boolean', default: false },
  help: { type: 'boolean', default: false },
};

let clockNow = CLOCK_START;

/** Deterministic text measurement and clock; must run before Vega loads since the interpreter captures `Date.now`. */
const installStubs = () => {
  globalThis.document = {
    createElement: () => ({ getContext: () => ({ measureText: (text) => ({ width: String(text).length * 7 }) }) }),
  };
  // hover animations compare `now()` against the animation timer, so both read the same fake clock
  Date.now = () => clockNow;
};

/** Advances the fake clock one frame and runs the dataflow. */
const tick = async (view, time) => {
  clockNow = time;
  view.signal('animationTimer', time);
  await view.runAsync();
};

const loadVega = async () => {
  const require = createRequire(resolve(SPEC_BUILDER, 'package.json'));
  const distIndex = resolve(SPEC_BUILDER, 'dist/index.js');
  if (!existsSync(distIndex)) throw new Error(`Missing ${distIndex}. Run \`yarn build:s2\` first.`);
  const specBuilder = await import(pathToFileURL(distIndex).href);
  const vega = await import(pathToFileURL(require.resolve('vega')).href);
  const { expressionInterpreter } = await import(pathToFileURL(require.resolve('vega-interpreter')).href);
  for (const [name, fn] of Object.entries(specBuilder.getExpressionFunctions())) vega.expressionFunction(name, fn);
  vega.expressionFunction('rscContainerWidth', () => WIDTH);
  return { specBuilder, vega, expressionInterpreter };
};

const buildView = async ({ specBuilder, vega, expressionInterpreter }, preset, mark) => {
  const animationTypes = preset.scenario === 'drawIn' ? ['drawIn'] : ['hover'];
  const spec = specBuilder.buildSpec({ data: preset.data, animations: true, animationTypes, marks: [mark] });
  spec.width = WIDTH;
  spec.height = HEIGHT;
  // the clock is stepped manually so every run sees the same frame times
  const timer = spec.signals.find((signal) => signal.name === 'animationTimer');
  if (timer) delete timer.on;
  const view = new vega.View(vega.parse(spec, undefined, { ast: true }), {
    renderer: 'none',
    expr: expressionInterpreter,
  });
  view.data('table', structuredClone(preset.data));
  await view.runAsync();
  const hoverSignal = spec.signals.find((signal) => /_hoveredItem$/.test(signal.name))?.name;
  return { view, hoverSignal };
};

const round = (value) => (Object.is(value, -0) ? 0 : Number(value.toFixed(DECIMALS)));

const serializeValue = (value) => {
  if (typeof value === 'number') return round(value);
  if (value === null || ['string', 'boolean', 'undefined'].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.map(serializeValue);
  return String(value);
};

/** Visual item properties; anything else (datum, bounds, internal state) is ignored. */
const ITEM_PROPS = [
  'x',
  'y',
  'x2',
  'y2',
  'xc',
  'yc',
  'width',
  'height',
  'opacity',
  'fill',
  'fillOpacity',
  'stroke',
  'strokeOpacity',
  'strokeWidth',
  'strokeDash',
  'strokeCap',
  'size',
  'shape',
  'angle',
  'innerRadius',
  'outerRadius',
  'startAngle',
  'endAngle',
  'cornerRadius',
  'padAngle',
  'path',
  'text',
  'font',
  'fontSize',
  'fontWeight',
  'align',
  'baseline',
  'dx',
  'dy',
  'radius',
  'theta',
  'limit',
  'defined',
  'interpolate',
  'zindex',
  'clip',
  'cursor',
];

const serializeItem = (item) => ITEM_PROPS.map((prop) => serializeValue(item[prop]));

/** Hashes each mark's items, keyed by its path in the scenegraph. */
const snapshot = (view) => {
  const marks = {};
  const visit = (mark, path) => {
    const key = `${path}/${mark.name ?? mark.role ?? mark.marktype}`;
    const items = mark.items ?? [];
    // a path clip is a function that returns its path string when called without a context
    const clip = typeof mark.clip === 'function' ? mark.clip() : mark.clip;
    const payload = JSON.stringify([mark.marktype, serializeValue(clip), items.map(serializeItem)]);
    marks[key] = createHash('md5').update(payload).digest('hex').slice(0, 12);
    items.forEach((item, index) => (item.items ?? []).forEach((child) => visit(child, `${key}[${index}]`)));
  };
  visit(view.scenegraph().root, '');
  return marks;
};

const runDrawIn = async (view, sample) => {
  const frames = [];
  view.signal('drawInStart', 0);
  for (let frame = 0; frame < DRAW_IN_FRAMES; frame++) {
    await tick(view, CLOCK_START + frame * FRAME_MS);
    if (sample && frame % DRAW_IN_SAMPLE_EVERY === 0) frames.push({ frame, marks: snapshot(view) });
  }
  return { frames, frameCount: DRAW_IN_FRAMES };
};

const runHover = async (view, sample, hoverSignal) => {
  if (!hoverSignal) throw new Error('No *_hoveredItem signal; is the mark interactive?');
  const rows = view.data('filteredTable');
  const targets = [...new Map(rows.map((row) => [row.rscSeriesId, row])).values()];
  const frames = [];
  let clock = CLOCK_START;
  for (let hover = 0; hover < HOVER_TARGETS; hover++) {
    // every third hover clears so the fade back to neutral is covered too
    const target = hover % 3 === 2 ? null : targets[(hover * 5) % targets.length];
    for (let frame = 0; frame < HOVER_FRAMES; frame++) {
      clock += FRAME_MS;
      clockNow = clock;
      if (frame === 0) view.signal(hoverSignal, target);
      await tick(view, clock);
      if (sample && frame % HOVER_SAMPLE_EVERY === 0) {
        frames.push({ frame: hover * HOVER_FRAMES + frame, marks: snapshot(view) });
      }
    }
  }
  return { frames, frameCount: HOVER_TARGETS * HOVER_FRAMES };
};

const runScenario = (preset, view, sample, hoverSignal) =>
  preset.scenario === 'drawIn' ? runDrawIn(view, sample) : runHover(view, sample, hoverSignal);

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

const runVariant = async (vegaEnv, preset, mark, reps) => {
  const parity = await buildView(vegaEnv, preset, mark);
  const { frames } = await runScenario(preset, parity.view, true, parity.hoverSignal);
  parity.view.finalize();

  // a fresh view for timing, so the sampled run's snapshots don't skew it
  const timing = await buildView(vegaEnv, preset, mark);
  await runScenario(preset, timing.view, false, timing.hoverSignal);
  const perFrameUs = [];
  for (let rep = 0; rep < reps; rep++) {
    const start = performance.now();
    const { frameCount } = await runScenario(preset, timing.view, false, timing.hoverSignal);
    perFrameUs.push(((performance.now() - start) / frameCount) * 1000);
  }
  timing.view.finalize();
  return { usPerFrame: Math.round(median(perFrameUs)), frames };
};

const gitRef = () => {
  try {
    const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
    const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' }).trim();
    return dirty ? `${sha}+dirty` : sha;
  } catch {
    return 'unknown';
  }
};

const diffFrames = (baseFrames, currentFrames) => {
  for (let i = 0; i < Math.max(baseFrames.length, currentFrames.length); i++) {
    const base = baseFrames[i];
    const current = currentFrames[i];
    if (!base || !current) return { frame: (base ?? current).frame, marks: ['(frame count differs)'] };
    const keys = new Set([...Object.keys(base.marks), ...Object.keys(current.marks)]);
    const marks = [...keys].filter((key) => base.marks[key] !== current.marks[key]);
    if (marks.length) return { frame: current.frame, marks };
  }
  return null;
};

const formatDelta = (base, current) => {
  if (!base) return '';
  const pct = ((current - base) / base) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
};

const compareResults = (baseline, results) => {
  console.log(`\nComparing ${baseline.ref} (baseline) → ${gitRef()} (current)\n`);
  const rows = [];
  let failed = false;
  for (const [key, current] of Object.entries(results)) {
    const base = baseline.results[key];
    if (!base) {
      rows.push([key, 'NEW', '', `${current.usPerFrame}`, '']);
      continue;
    }
    const diff = diffFrames(base.frames, current.frames);
    if (diff) failed = true;
    rows.push([
      key,
      diff ? 'DIFF' : 'same',
      `${base.usPerFrame}`,
      `${current.usPerFrame}`,
      formatDelta(base.usPerFrame, current.usPerFrame),
    ]);
    if (diff) {
      const shown = diff.marks.slice(0, 5).join(', ');
      const more = diff.marks.length > 5 ? ` (+${diff.marks.length - 5} more)` : '';
      rows.push(['', `  first diff at frame ${diff.frame}: ${shown}${more}`, '', '', '']);
    }
  }
  console.table(
    rows.map(([variant, parity, base, current, delta]) => ({
      variant,
      parity,
      'base µs/frame': base,
      'µs/frame': current,
      delta,
    }))
  );
  return failed;
};

const main = async () => {
  const { values } = parseArgs({ options: OPTIONS });
  if (values.help) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').match(/\/\*\*[\s\S]*?\*\//)[0]);
    return;
  }
  if (values.list) {
    for (const [name, preset] of Object.entries(PRESETS)) {
      console.log(`${name} (${preset.scenario}): ${Object.keys(preset.variants).join(', ')}`);
    }
    return;
  }
  const presetNames = values.preset ? values.preset.split(',') : Object.keys(PRESETS);
  const unknown = presetNames.filter((name) => !PRESETS[name]);
  if (unknown.length) throw new Error(`Unknown preset(s): ${unknown.join(', ')}. Use --list.`);

  installStubs();
  const vegaEnv = await loadVega();
  const reps = Number(values.reps);
  const results = {};
  for (const presetName of presetNames) {
    const preset = PRESETS[presetName];
    for (const [variantName, mark] of Object.entries(preset.variants)) {
      const key = `${presetName}/${variantName}`;
      results[key] = await runVariant(vegaEnv, preset, mark, reps);
      console.log(`${key}: ${results[key].usPerFrame} µs/frame, ${results[key].frames.length} sampled frames`);
    }
  }

  if (values.out) {
    mkdirSync(dirname(resolve(values.out)), { recursive: true });
    writeFileSync(values.out, JSON.stringify({ ref: gitRef(), results }, null, 2));
    console.log(`\nSaved ${values.out}`);
  }
  if (values.compare) {
    const failed = compareResults(JSON.parse(readFileSync(values.compare, 'utf8')), results);
    if (failed) {
      console.error('\nScenegraph differs from the baseline at the frames listed above.');
      process.exitCode = 1;
    } else {
      console.log('\nScenegraph matches the baseline for every sampled frame.');
    }
  }
};

await main();
