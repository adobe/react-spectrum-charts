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
import {
  getTimeAxisLabelFormat,
  getTimeAxisMajorTicks,
  getTimeAxisMinorTicks,
  getTimeAxisPrimaryLabelFormat,
  getTimeAxisPrimaryTicks,
  getTimeAxisTickCount,
  isTemporalScale,
} from './timeAxisTickUtils';

describe('isTemporalScale()', () => {
  test('only accepts time and utc scales', () => {
    expect(isTemporalScale('time')).toBe(true);
    expect(isTemporalScale('utc')).toBe(true);
    expect(isTemporalScale('linear')).toBe(false);
  });
});

describe('responsive time-axis ticks', () => {
  const domain: [number, number] = [Date.UTC(2024, 0, 1), Date.UTC(2026, 0, 1)];

  test('selects progressively coarser Vega intervals as width shrinks', () => {
    expect(getTimeAxisTickCount(domain, 500, 'quarter', 'time')).toEqual({ interval: 'month', step: 3 });
    expect(getTimeAxisTickCount(domain, 300, 'quarter', 'time')).toEqual({ interval: 'month', step: 6 });
    expect(getTimeAxisTickCount(domain, 150, 'quarter', 'time')).toEqual({ interval: 'year', step: 1 });
  });

  test('uses Vega to keep major ticks aligned to the selected granularity', () => {
    const ticks = getTimeAxisMajorTicks(domain, 300, 'quarter', 'time');
    expect(ticks.every((tick) => tick.getMonth() % 3 === 0 && tick.getDate() === 1)).toBe(true);
  });

  test.each([
    ['second', { interval: 'year', step: 1 }],
    ['minute', { interval: 'year', step: 1 }],
    ['hour', { interval: 'year', step: 1 }],
    ['day', { interval: 'year', step: 1 }],
    ['week', { interval: 'week', step: 35 }],
    ['month', { interval: 'year', step: 1 }],
    ['quarter', { interval: 'year', step: 1 }],
    ['year', { interval: 'year', step: 1 }],
  ] as const)('never selects a tick interval finer than %s granularity', (granularity, expected) => {
    expect(getTimeAxisTickCount(domain, 100, granularity, 'time')).toEqual(expected);
  });

  test('uses a uniform multi-year step for very long domains', () => {
    const longDomain: [number, number] = [Date.UTC(1900, 0, 1), Date.UTC(2026, 0, 1)];
    expect(getTimeAxisTickCount(longDomain, 500, 'year', 'utc')).toEqual({ interval: 'year', step: 12 });
  });

  test('uses Vega tick counts at calendar boundaries before advancing the interval', () => {
    const partialYearDomain: [number, number] = [Date.UTC(2024, 1, 15), Date.UTC(2024, 11, 15)];
    expect(getTimeAxisTickCount(partialYearDomain, 100, 'month', 'utc')).toEqual({
      interval: 'month',
      step: 3,
    });
  });

  test('avoids collapsing a narrow hourly axis from daily ticks to one weekly tick', () => {
    const hourlyDomain: [number, number] = [Date.UTC(2025, 0, 1), Date.UTC(2025, 0, 8)];
    expect(getTimeAxisTickCount(hourlyDomain, 130, 'hour', 'utc')).toEqual({ interval: 'day', step: 2 });
    expect(getTimeAxisMajorTicks(hourlyDomain, 130, 'hour', 'utc')).toHaveLength(4);
  });

  test('keeps weekly cadence on weekly boundaries as width shrinks', () => {
    const weeklyDomain: [number, number] = [Date.UTC(2024, 0, 1), Date.UTC(2025, 0, 1)];
    const tickCount = getTimeAxisTickCount(weeklyDomain, 200, 'week', 'utc');
    const ticks = getTimeAxisMajorTicks(weeklyDomain, 200, 'week', 'utc');
    expect(tickCount.interval).toBe('week');
    expect(ticks.every((tick) => tick.getUTCDay() === 0)).toBe(true);
  });

  test('uses formats that match the Vega interval selected for the available width', () => {
    expect(getTimeAxisLabelFormat(domain, 500, 'hour', 'time', 'secondary')).toBe('%-I %p');
    expect(getTimeAxisLabelFormat(domain, 500, 'hour', 'time', 'primary')).toBe('%b %-d');
    expect(getTimeAxisLabelFormat(domain, 300, 'quarter', 'time', 'secondary')).toBe('Q%q');
    expect(getTimeAxisLabelFormat(domain, 150, 'quarter', 'time', 'secondary')).toBe('Q%q');
    expect(getTimeAxisLabelFormat(domain, 150, 'quarter', 'time', 'primary')).toBe('%Y');
  });

  test('keeps major ticks on Vega calendar boundaries instead of observation endpoints', () => {
    const partialYearDomain: [number, number] = [Date.UTC(2024, 1, 15), Date.UTC(2025, 11, 15)];
    const monthTicks = getTimeAxisMajorTicks(partialYearDomain, 300, 'month', 'utc');
    const yearTicks = getTimeAxisMajorTicks(partialYearDomain, 50, 'year', 'utc');
    expect(monthTicks.every((tick) => tick.getUTCDate() === 1)).toBe(true);
    expect(yearTicks.every((tick) => tick.getUTCMonth() === 0 && tick.getUTCDate() === 1)).toBe(true);
    expect(monthTicks.map(Number)).not.toContain(partialYearDomain[1]);
    expect(yearTicks.map(Number)).not.toContain(partialYearDomain[1]);
  });

  test('uses independent parent-calendar boundaries for primary labels', () => {
    const dailyDomain: [number, number] = [Date.UTC(2025, 0, 1), Date.UTC(2025, 3, 1)];
    const primaryTicks = getTimeAxisPrimaryTicks(dailyDomain, 500, 'day', 'utc');
    expect(primaryTicks.map((tick) => tick.getUTCDate())).toEqual([1, 1, 1, 1]);
    expect(primaryTicks.map((tick) => tick.getUTCMonth())).toEqual([0, 1, 2, 3]);
    expect(getTimeAxisPrimaryLabelFormat(dailyDomain, 500, 'day', 'utc')).toBe('%b');
  });

  test('includes parent context when the domain starts after the parent boundary', () => {
    const partialMonthDomain: [number, number] = [Date.UTC(2025, 0, 8), Date.UTC(2025, 1, 8)];
    expect(getTimeAxisPrimaryTicks(partialMonthDomain, 500, 'day', 'utc').map(Number)).toEqual([
      Date.UTC(2025, 0, 9),
      Date.UTC(2025, 1, 1),
    ]);
  });

  test('keeps hourly child labels while independently labeling parent dates', () => {
    const hourlyDomain: [number, number] = [Date.UTC(2025, 0, 1), Date.UTC(2025, 0, 8)];
    expect(getTimeAxisLabelFormat(hourlyDomain, 500, 'hour', 'utc', 'secondary')).toBe('%-I %p');
    expect(getTimeAxisPrimaryLabelFormat(hourlyDomain, 500, 'hour', 'utc')).toBe('%b %-d');
    expect(getTimeAxisPrimaryTicks(hourlyDomain, 500, 'hour', 'utc').every((tick) => tick.getUTCHours() === 0)).toBe(
      true
    );
  });

  test('returns temporal midpoint minors between major ticks', () => {
    const majorTicks = getTimeAxisMajorTicks(domain, 500, 'month', 'time');
    const minorTicks = getTimeAxisMinorTicks(domain, 500, 'month', 'time');
    expect(minorTicks).toHaveLength(majorTicks.length - 1);
    minorTicks.forEach((minorTick, index) => {
      expect(Number(minorTick)).toBe((Number(majorTicks[index]) + Number(majorTicks[index + 1])) / 2);
    });
  });

  test('drops minor ticks when two majors cannot be 50px apart', () => {
    expect(getTimeAxisMinorTicks(domain, 40, 'month', 'time')).toEqual([]);
  });

  test('does not add midpoint ticks for quarter granularity', () => {
    expect(getTimeAxisMinorTicks(domain, 500, 'quarter', 'time')).toEqual([]);
  });

  test('returns no values for invalid or zero-size axes', () => {
    expect(getTimeAxisMajorTicks(domain, 0, 'day', 'time')).toEqual([]);
    expect(getTimeAxisMinorTicks([Number.NaN, domain[1]], 500, 'day', 'time')).toEqual([]);
  });
});
