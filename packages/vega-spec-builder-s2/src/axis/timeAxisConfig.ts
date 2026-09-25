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
import { Granularity } from '../types';

export type TimeLabelFormats = {
  secondaryLabelFormat: string;
  primaryLabelFormat: string;
};

/** Vega-native time interval and step used to generate major ticks. */
export type TimeAxisTickCount = {
  interval: string;
  step: number;
};

/** Target pixel distance between labeled major ticks. */
export const MAJOR_TIME_TICK_SPACING = 50;

/**
 * Gets the primary and secondary label formats for a time granularity.
 * @param granularity
 * @returns label formats
 */
export const getTimeLabelFormats = (granularity: Granularity): TimeLabelFormats => {
  switch (granularity) {
    case 'second':
      return { secondaryLabelFormat: ':%S', primaryLabelFormat: '%-I:%M %p' };
    case 'minute':
      return { secondaryLabelFormat: '%-I:%M %p', primaryLabelFormat: '%b %-d' };
    case 'hour':
      return { secondaryLabelFormat: '%-I %p', primaryLabelFormat: '%b %-d' };
    case 'day':
    case 'week':
      return { secondaryLabelFormat: '%-d', primaryLabelFormat: '%b' };
    case 'month':
      return { secondaryLabelFormat: '%b', primaryLabelFormat: '%Y' };
    case 'quarter':
      return { secondaryLabelFormat: 'Q%q', primaryLabelFormat: '%Y' };
    case 'year':
      return { secondaryLabelFormat: '%Y', primaryLabelFormat: '' };
  }
};

/**
 * Gets the combined primary and secondary label format used by vertical time axes.
 * @param granularity
 * @returns combined label format
 */
export const getCombinedTimeLabelFormat = (granularity: Granularity): string => {
  const { primaryLabelFormat, secondaryLabelFormat } = getTimeLabelFormats(granularity);
  return primaryLabelFormat ? `${primaryLabelFormat}\u2000${secondaryLabelFormat}` : secondaryLabelFormat;
};

const yearTickCandidates: TimeAxisTickCount[] = [{ interval: 'year', step: 1 }];
const monthTickCandidates: TimeAxisTickCount[] = [
  { interval: 'month', step: 1 },
  { interval: 'month', step: 2 },
  { interval: 'month', step: 3 },
  { interval: 'month', step: 4 },
  { interval: 'month', step: 6 },
  ...yearTickCandidates,
];
const weekTickCandidates: TimeAxisTickCount[] = [
  { interval: 'week', step: 1 },
  { interval: 'week', step: 2 },
  { interval: 'week', step: 4 },
];
const dayTickCandidates: TimeAxisTickCount[] = [
  { interval: 'day', step: 1 },
  { interval: 'day', step: 2 },
  ...weekTickCandidates,
  ...monthTickCandidates,
];
const hourTickCandidates: TimeAxisTickCount[] = [
  { interval: 'hours', step: 1 },
  { interval: 'hours', step: 3 },
  { interval: 'hours', step: 6 },
  { interval: 'hours', step: 12 },
  ...dayTickCandidates,
];
const minuteTickCandidates: TimeAxisTickCount[] = [
  { interval: 'minutes', step: 1 },
  { interval: 'minutes', step: 5 },
  { interval: 'minutes', step: 15 },
  { interval: 'minutes', step: 30 },
  ...hourTickCandidates,
];

/** Ordered fine-to-coarse tick candidates that a granularity is allowed to use. */
export const timeTickCandidates: Record<Granularity, TimeAxisTickCount[]> = {
  second: [
    { interval: 'seconds', step: 1 },
    { interval: 'seconds', step: 5 },
    { interval: 'seconds', step: 15 },
    { interval: 'seconds', step: 30 },
    ...minuteTickCandidates,
  ],
  minute: minuteTickCandidates,
  hour: hourTickCandidates,
  day: dayTickCandidates,
  week: weekTickCandidates,
  month: monthTickCandidates,
  quarter: [
    { interval: 'month', step: 3 },
    { interval: 'month', step: 6 },
    { interval: 'year', step: 1 },
  ],
  year: yearTickCandidates,
};

/** Calendar unit that labels the primary (parent) row for each granularity. */
export const parentGranularities: Partial<Record<Granularity, Granularity>> = {
  second: 'minute',
  minute: 'day',
  hour: 'day',
  day: 'month',
  week: 'month',
  month: 'year',
  quarter: 'year',
};
