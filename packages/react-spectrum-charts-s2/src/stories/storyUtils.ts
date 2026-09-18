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
 * converts a timestamp to a MMM D format
 * @param timestamp
 * @returns
 */
export const formatTimestamp = (timestamp: number): string => {
  // Create a Date object from the timestamp (assuming the timestamp is in milliseconds)
  const date = new Date(timestamp);

  // Define an array of month abbreviations
  const monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Get the month and day from the Date object
  const month = monthAbbreviations[date.getMonth()];
  const day = date.getDate();

  // Format the date in 'MMM D' format
  return `${month} ${day}`;
};

export type GeneratedTimeSeriesDatum = { datetime: number; value: number; series: string };

/**
 * Deterministic PRNG (mulberry32) — used instead of Math.random() so stress-test data is
 * reproducible across story reloads and doesn't trip "insecure randomness" lint rules that
 * assume Math.random() output could be used for something security-sensitive.
 */
const createSeededRandom = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state = Math.trunc(state + 0x6d2b79f5);
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Generates a large dataset for performance stress testing. Adjustable series count and points per series.
 * @param seriesCount - The number of series to generate.
 * @param pointsPerSeries - The number of points per series.
 * @returns A large dataset for performance stress testing.
 */
export const generateLargeData = (
  seriesCount = 20,
  pointsPerSeries = 10,
  seed = 42
): GeneratedTimeSeriesDatum[] => {
  const START = new Date('2023-01-01T00:00:00Z').getTime();
  const STEP_MS = 60 * 60 * 1000; // one point per hour
  const random = createSeededRandom(seed);
  const data: GeneratedTimeSeriesDatum[] = [];
  const sin_cycles = 4;
  const sinPeriod = pointsPerSeries / sin_cycles;
  for (let s = 0; s < seriesCount; s++) {
    const series = `Series ${String(s + 1).padStart(2, '0')}`;
    const base = 1_000 + s * 250;
    for (let p = 0; p < pointsPerSeries; p++) {
      data.push({
        datetime: START + p * STEP_MS,
        value: Math.max(0, base + Math.sin(p / sinPeriod + s) * 400 + (random() - 0.5) * 200),
        series,
      });
    }
  }
  return data;
};
