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
 * Animation performance benchmark against a running S2 Storybook (`yarn storybook:s2`, packages built).
 * Requires the Playwright Chromium browser (`yarn playwright install chromium`).
 *
 * Scenarios:
 *   drawIn  records from the first chart mounting until the draw-in animation has finished
 *   hover   sweeps the mouse across every visible chart
 *   idle    records with no interaction (should be ~0 DOM updates/s)
 *
 * Measure:
 *   yarn perf:animation --preset line-hover --label before
 *   yarn perf:animation --preset line-draw-in --label after --cpu 1 --runs 5
 *   yarn perf:animation --story <storyId> --args "chartCount:5" --scenarios hover,idle --label custom
 * Compare saved results:
 *   yarn perf:animation --compare perf-results/line-hover-before.json perf-results/line-hover-after.json
 * List presets:
 *   yarn perf:animation --list
 *
 * To benchmark a new mark, add a performance story and a preset entry to PRESETS.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';

import { chromium } from 'playwright';

const PRESETS = {
  'line-hover': {
    story: 'react-spectrum-charts-2-line-features-hoveranimation-performance--dashboard',
    args: 'chartCount:20;seriesPerChart:30',
    scenarios: ['hover', 'idle'],
  },
  'line-draw-in': {
    story: 'react-spectrum-charts-2-line-features-drawinanimation-performance--dashboard',
    args: 'chartCount:20;seriesPerChart:10;pointsPerSeries:10',
    scenarios: ['drawIn', 'idle'],
  },
};

const SCENARIOS = ['drawIn', 'hover', 'idle'];
/** Draw-in animation length plus slack for the last charts to mount and finish. */
const DRAW_IN_WINDOW_MS = 1500;
const MOUSE_STEP_MS = 16;
const VIEWPORT = { width: 1500, height: 1100 };
const CHART_SELECTOR = 'svg.marks';

const OPTIONS = {
  preset: { type: 'string' },
  story: { type: 'string' },
  args: { type: 'string' },
  scenarios: { type: 'string' },
  label: { type: 'string' },
  url: { type: 'string', default: 'http://localhost:6010' },
  runs: { type: 'string', default: '3' },
  cpu: { type: 'string', default: '4' },
  duration: { type: 'string', default: '5000' },
  out: { type: 'string' },
  headed: { type: 'boolean', default: false },
  compare: { type: 'boolean', default: false },
  list: { type: 'boolean', default: false },
};

/** Merges CLI flags over the chosen preset into a validated config. */
const getConfig = () => {
  const { values, positionals } = parseArgs({ options: OPTIONS, allowPositionals: true });
  if (values.list || values.compare) return { ...values, files: positionals };

  const preset = values.preset ? PRESETS[values.preset] : {};
  if (!preset) throw new Error(`Unknown preset "${values.preset}". Run with --list to see presets.`);
  const story = values.story ?? preset.story;
  if (!story) throw new Error('Pass --preset or --story.');
  if (!values.label) throw new Error('--label is required (e.g. --label before) so results can be compared.');

  const scenarios = values.scenarios?.split(',') ?? preset.scenarios ?? ['hover', 'idle'];
  const unknown = scenarios.filter((s) => !SCENARIOS.includes(s));
  if (unknown.length) throw new Error(`Unknown scenario(s): ${unknown.join(', ')}. Use ${SCENARIOS.join(', ')}.`);

  const name = values.preset ?? 'custom';
  return {
    name,
    label: values.label,
    story,
    args: values.args ?? preset.args ?? '',
    scenarios,
    url: values.url,
    runs: Number(values.runs),
    cpu: Number(values.cpu),
    duration: Number(values.duration),
    headed: values.headed,
    out: values.out ?? `perf-results/${name}-${values.label}.json`,
  };
};

const percentile = (values, p) => {
  if (!values.length) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
};
const median = (values) => percentile(values, 50);

/** Runs in the page before any app code: collects rAF frame deltas and DOM mutation counts while recording. */
const instrumentPage = () => {
  const perf = { recording: false, frames: [], updates: 0 };
  window.__perf = perf;
  let last = performance.now();
  const onFrame = (now) => {
    if (perf.recording) perf.frames.push(now - last);
    last = now;
    requestAnimationFrame(onFrame);
  };
  requestAnimationFrame(onFrame);
  new MutationObserver(() => {
    if (perf.recording) perf.updates++;
  }).observe(document, { subtree: true, attributes: true, childList: true });
};

const getCpuTime = async (cdp) => {
  const { metrics } = await cdp.send('Performance.getMetrics');
  const get = (name) => metrics.find((m) => m.name === name)?.value ?? 0;
  return { script: get('ScriptDuration'), task: get('TaskDuration') };
};

/** Stops recording and converts the raw page data and CPU deltas into per-second stats. */
const finishRecording = async (page, cdp, cpuBefore, refreshIntervalMs) => {
  const cpuAfter = await getCpuTime(cdp);
  const { frames, updates, elapsedMs } = await page.evaluate(() => {
    const perf = window.__perf;
    perf.recording = false;
    return { frames: perf.frames, updates: perf.updates, elapsedMs: performance.now() - perf.startedAt };
  });
  const seconds = elapsedMs / 1000;
  return {
    fps: frames.length / seconds,
    frameP95: percentile(frames, 95),
    jankPct: (frames.filter((f) => f > refreshIntervalMs * 1.5).length / Math.max(frames.length, 1)) * 100,
    scriptMsPerSec: ((cpuAfter.script - cpuBefore.script) * 1000) / seconds,
    taskMsPerSec: ((cpuAfter.task - cpuBefore.task) * 1000) / seconds,
    domUpdatesPerSec: updates / seconds,
  };
};

const startRecording = (page) =>
  page.evaluate(() => Object.assign(window.__perf, { recording: true, frames: [], updates: 0, startedAt: performance.now() }));

/** Moves the mouse across each fully visible chart in horizontal passes until `durationMs` elapses. */
const sweepCharts = async (page, durationMs) => {
  const boxes = (
    await page.locator(CHART_SELECTOR).evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))
  ).filter((b) => b.width > 0 && b.top >= 0 && b.bottom <= VIEWPORT.height && b.right <= VIEWPORT.width);
  if (!boxes.length) throw new Error('No fully visible charts found to hover.');

  const end = Date.now() + durationMs;
  const stepsPerPass = 40;
  for (let pass = 0; Date.now() < end; pass++) {
    const box = boxes[pass % boxes.length];
    const y = box.top + box.height * (0.3 + 0.2 * (pass % 3));
    for (let step = 0; step <= stepsPerPass && Date.now() < end; step++) {
      await page.mouse.move(box.left + box.width * (0.1 + (0.8 * step) / stepsPerPass), y);
      await page.waitForTimeout(MOUSE_STEP_MS);
    }
  }
  await page.mouse.move(2, 2);
};

/** One fresh page load; returns stats for each requested scenario. */
const runOnce = async (browser, config) => {
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  const measureDrawIn = config.scenarios.includes('drawIn');
  await page.addInitScript(instrumentPage);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: config.cpu });

  // Storybook's HMR socket never goes network-idle, so wait for a rendered chart instead
  const url = `${config.url}/iframe.html?id=${config.story}&viewMode=story&args=${encodeURIComponent(config.args)}`;
  await page.goto(url, { waitUntil: 'load', timeout: 120_000 });
  await page.locator(CHART_SELECTOR).first().waitFor({ timeout: 60_000 });

  // Draw-in starts on mount, so record immediately; assume 60Hz for its jank threshold
  const results = {};
  if (measureDrawIn) {
    const cpuBefore = await getCpuTime(cdp);
    await startRecording(page);
    await page.waitForTimeout(DRAW_IN_WINDOW_MS);
    results.drawIn = await finishRecording(page, cdp, cpuBefore, 1000 / 60);
  }
  await page.waitForTimeout(2000);
  const refreshIntervalMs = await page.evaluate(
    () => new Promise((resolve) => {
      const deltas = [];
      let last = performance.now();
      const onFrame = (now) => {
        deltas.push(now - last);
        last = now;
        if (deltas.length < 30) requestAnimationFrame(onFrame);
        else resolve(deltas.sort((a, b) => a - b)[15]);
      };
      requestAnimationFrame(onFrame);
    })
  );

  for (const scenario of config.scenarios.filter((s) => s !== 'drawIn')) {
    const cpuBefore = await getCpuTime(cdp);
    await startRecording(page);
    if (scenario === 'hover') await sweepCharts(page, config.duration);
    else await page.waitForTimeout(config.duration);
    results[scenario] = await finishRecording(page, cdp, cpuBefore, refreshIntervalMs);
    await page.waitForTimeout(1000);
  }

  await context.close();
  return results;
};

const fmt = (value, digits = 1) => (Number.isFinite(value) ? value.toFixed(digits) : '-');

const medianOfRuns = (runs, scenario) =>
  Object.fromEntries(Object.keys(runs[0][scenario]).map((key) => [key, median(runs.map((r) => r[scenario][key]))]));

const printTables = (results) => {
  const scenarios = SCENARIOS.filter((s) => results.some((r) => r.runs[0][s]));
  for (const scenario of scenarios) {
    console.log(`\n${scenario} (median of runs)`);
    console.table(
      results
        .filter((r) => r.runs[0][scenario])
        .map(({ label, runs }) => {
          const stats = medianOfRuns(runs, scenario);
          return {
            label,
            fps: fmt(stats.fps),
            'frame p95 ms': fmt(stats.frameP95),
            'jank %': fmt(stats.jankPct),
            'script ms/s': fmt(stats.scriptMsPerSec, 0),
            'task ms/s': fmt(stats.taskMsPerSec, 0),
            'DOM updates/s': fmt(stats.domUpdatesPerSec, 0),
          };
        })
    );
  }
  console.log('script/task ms/s = main-thread time per second (1000 = saturated). jank = frames > 1.5x refresh.');
};

const compare = (files) => {
  if (files.length < 2) throw new Error('--compare needs at least two result files.');
  const results = files.map((file) => JSON.parse(readFileSync(file, 'utf8')));
  const settings = new Set(results.map(({ config: c }) => `${c.story}|${c.args}|${c.cpu}|${c.duration}`));
  if (settings.size > 1) console.warn('Warning: results were recorded with different story/args/cpu/duration.');
  printTables(results);
};

const measure = async (config) => {
  console.log(`[${config.label}] ${config.story}`);
  console.log(`args: ${config.args || '-'} | ${config.scenarios.join(', ')} | CPU ${config.cpu}x | ${config.runs} run(s)`);

  const browser = await chromium.launch({ headless: !config.headed, channel: 'chromium' });
  const runs = [];
  try {
    for (let run = 1; run <= config.runs; run++) {
      process.stdout.write(`run ${run}/${config.runs}... `);
      runs.push(await runOnce(browser, config));
      console.log('done');
    }
  } finally {
    await browser.close();
  }

  printTables([{ label: config.label, runs }]);
  mkdirSync(dirname(config.out), { recursive: true });
  writeFileSync(config.out, JSON.stringify({ label: config.label, config, runs }, null, 2));
  console.log(`\nResults written to ${config.out}`);
};

const main = async () => {
  const config = getConfig();
  if (config.list) {
    for (const [name, preset] of Object.entries(PRESETS)) console.log(`${name}: ${preset.scenarios.join(', ')} — ${preset.story}`);
  } else if (config.compare) compare(config.files);
  else await measure(config);
};

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
