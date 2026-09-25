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
import * as vega from 'vega';
import { ScaleType } from 'vega';

import { Granularity } from '../types';
import {
  MAJOR_TIME_TICK_SPACING,
  TimeAxisTickCount,
  getCombinedTimeLabelFormat,
  getTimeLabelFormats,
  parentGranularities,
  timeTickCandidates,
} from './timeAxisConfig';

export type TemporalScaleType = 'time' | 'utc';
export type TimeAxisLabelLevel = 'primary' | 'secondary' | 'combined';

type TimeInterval = {
  count: (start: Date, stop: Date) => number;
  every: (step: number) => TimeInterval | null;
};

type VegaTime = {
  timeInterval: (unit: string) => TimeInterval;
  utcInterval: (unit: string) => TimeInterval;
};

type TimeDomain = [Date | number, Date | number];

/**
 * Checks whether a scale type generates temporal ticks.
 * @param scaleType
 * @returns true if the scale is time or utc
 */
export const isTemporalScale = (scaleType: ScaleType): scaleType is TemporalScaleType => {
  return ['time', 'utc'].includes(scaleType);
};

const getTimeInterval = (interval: string, scaleType: TemporalScaleType): TimeInterval => {
  const vegaTime = vega as unknown as VegaTime;
  return scaleType === 'utc' ? vegaTime.utcInterval(interval) : vegaTime.timeInterval(interval);
};

const isValidTimeDomain = (domain: TimeDomain): boolean => {
  return domain.every((value) => Number.isFinite(Number(value)));
};

/**
 * Gets how many ticks a candidate interval produces over the domain.
 * @param domain
 * @param tickCount
 * @param scaleType
 * @param exactCountThreshold
 * @returns tick count
 */
const getCandidateTickCount = (
  domain: TimeDomain,
  tickCount: TimeAxisTickCount,
  scaleType: TemporalScaleType,
  exactCountThreshold?: number
): number => {
  const interval = getTimeInterval(tickCount.interval, scaleType);
  const estimatedCount =
    Math.floor(Math.abs(interval.count(new Date(domain[0]), new Date(domain[1]))) / tickCount.step) + 1;
  if (exactCountThreshold === undefined || estimatedCount > exactCountThreshold) return estimatedCount;

  const tickInterval = interval.every(tickCount.step);
  return tickInterval ? vega.scale(scaleType)().domain(domain).ticks(tickInterval).length : estimatedCount;
};

/**
 * Gets a Vega-native interval and step for responsive major ticks.
 * @param domain
 * @param range
 * @param granularity
 * @param scaleType
 * @returns Vega tick count
 */
export const getTimeAxisTickCount = (
  domain: TimeDomain,
  range: number,
  granularity: Granularity,
  scaleType: TemporalScaleType
): TimeAxisTickCount => {
  if (!isValidTimeDomain(domain) || !Number.isFinite(range)) return timeTickCandidates[granularity][0];

  const targetCount = Math.max(2, Math.floor(Math.abs(range) / MAJOR_TIME_TICK_SPACING) + 1);
  const candidates = timeTickCandidates[granularity];
  let previousCandidate: TimeAxisTickCount | undefined;
  for (const candidate of candidates) {
    const candidateCount = getCandidateTickCount(domain, candidate, scaleType, targetCount + 1);
    if (candidateCount <= targetCount) {
      return previousCandidate && candidateCount < Math.ceil(targetCount / 2) ? previousCandidate : candidate;
    }
    previousCandidate = candidate;
  }

  if (granularity === 'week') {
    const weekCount = getCandidateTickCount(domain, { interval: 'week', step: 1 }, scaleType);
    return { interval: 'week', step: Math.max(1, Math.ceil(weekCount / targetCount)) };
  }

  const yearCount = getCandidateTickCount(domain, { interval: 'year', step: 1 }, scaleType);
  return { interval: 'year', step: Math.max(1, Math.ceil(yearCount / targetCount)) };
};

/**
 * Gets the calendar unit that the selected tick interval actually labels.
 * @param granularity
 * @param tickCount
 * @returns granularity
 */
const getTickLabelGranularity = (granularity: Granularity, { interval }: TimeAxisTickCount): Granularity => {
  switch (interval) {
    case 'seconds':
      return 'second';
    case 'minutes':
      return 'minute';
    case 'hours':
      return 'hour';
    case 'day':
      return 'day';
    case 'week':
      return 'week';
    case 'month':
      return granularity === 'quarter' ? 'quarter' : 'month';
    default:
      return 'year';
  }
};

/**
 * Gets the label format for the requested label row.
 * @param domain
 * @param range
 * @param granularity
 * @param scaleType
 * @param level
 * @returns time label format
 */
export const getTimeAxisLabelFormat = (
  domain: TimeDomain,
  range: number,
  granularity: Granularity,
  scaleType: TemporalScaleType,
  level: TimeAxisLabelLevel
): string => {
  const { primaryLabelFormat, secondaryLabelFormat } = getTimeLabelFormats(granularity);
  if (level === 'primary') return primaryLabelFormat;
  if (level === 'secondary') return secondaryLabelFormat;
  return getCombinedTimeLabelFormat(granularity);
};

const getMinimumTickSpacing = (ticks: Date[], timeScale: (value: Date) => number): number => {
  return ticks.reduce((minimum, tick, index) => {
    const nextTick = ticks[index + 1];
    return nextTick ? Math.min(minimum, Math.abs(timeScale(nextTick) - timeScale(tick))) : minimum;
  }, Number.POSITIVE_INFINITY);
};

/**
 * Gets the major ticks selected by Vega for the responsive interval.
 * @param domain
 * @param range
 * @param granularity
 * @param scaleType
 * @returns major ticks
 */
export const getTimeAxisMajorTicks = (
  domain: TimeDomain,
  range: number,
  granularity: Granularity,
  scaleType: TemporalScaleType
): Date[] => {
  if (range === 0 || !Number.isFinite(range) || !isValidTimeDomain(domain)) return [];

  const tickCount = getTimeAxisTickCount(domain, range, granularity, scaleType);
  const interval = getTimeInterval(tickCount.interval, scaleType);
  const steppedInterval = interval.every(tickCount.step);
  if (!steppedInterval) return [];

  const ticks = vega.scale(scaleType)().domain(domain).ticks(steppedInterval);
  return ticks.length ? ticks : [new Date(domain[0])];
};

/**
 * Gets calendar-boundary ticks for the independent primary label row.
 * @param domain
 * @param range
 * @param granularity
 * @param scaleType
 * @returns primary label ticks
 */
export const getTimeAxisPrimaryTicks = (
  domain: TimeDomain,
  range: number,
  granularity: Granularity,
  scaleType: TemporalScaleType
): Date[] => {
  const parentGranularity = parentGranularities[granularity];
  if (!parentGranularity || range === 0 || !Number.isFinite(range) || !isValidTimeDomain(domain)) return [];

  const primaryTicks = getTimeAxisMajorTicks(domain, range, parentGranularity, scaleType);
  const domainStart = new Date(domain[0]);
  if (Number(primaryTicks[0]) === Number(domainStart)) return primaryTicks;

  const childTicks = getTimeAxisMajorTicks(domain, range, granularity, scaleType);
  const contextValue = childTicks[0] ?? domainStart;
  if (primaryTicks.length && Number(primaryTicks[0]) <= Number(contextValue)) return primaryTicks;

  return [contextValue, ...primaryTicks];
};

/**
 * Gets the format for the independent primary label row.
 * @param domain
 * @param range
 * @param granularity
 * @param scaleType
 * @returns primary label format
 */
export const getTimeAxisPrimaryLabelFormat = (
  domain: TimeDomain,
  range: number,
  granularity: Granularity,
  scaleType: TemporalScaleType
): string => {
  const parentGranularity = parentGranularities[granularity];
  if (!parentGranularity) return '';

  const tickCount = getTimeAxisTickCount(domain, range, parentGranularity, scaleType);
  const effectiveGranularity = getTickLabelGranularity(parentGranularity, tickCount);
  const sameDateFamily = ['day', 'week'].includes(parentGranularity) && ['day', 'week'].includes(effectiveGranularity);
  if (effectiveGranularity === parentGranularity || sameDateFamily) {
    return getTimeLabelFormats(granularity).primaryLabelFormat;
  }
  return getTimeLabelFormats(effectiveGranularity).secondaryLabelFormat;
};

/**
 * Gets midpoint minor ticks when all major intervals can support them.
 * @param domain
 * @param range
 * @param granularity
 * @param scaleType
 * @returns minor tick dates
 */
export const getTimeAxisMinorTicks = (
  domain: TimeDomain,
  range: number,
  granularity: Granularity,
  scaleType: TemporalScaleType
): Date[] => {
  if (granularity === 'quarter') return [];

  const majorTicks = getTimeAxisMajorTicks(domain, range, granularity, scaleType);
  if (majorTicks.length < 2) return [];

  const timeScale = vega.scale(scaleType)().domain(domain).range([0, range]);
  if (getMinimumTickSpacing(majorTicks, timeScale) < MAJOR_TIME_TICK_SPACING) return [];

  return majorTicks.slice(0, -1).map((tick, index) => new Date((Number(tick) + Number(majorTicks[index + 1])) / 2));
};
