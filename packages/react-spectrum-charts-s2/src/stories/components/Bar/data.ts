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

export const barData = [
  { browser: 'Chrome', downloads: 27000, percentLabel: '53.1%' },
  { browser: 'Firefox', downloads: 8000, percentLabel: '15.7%' },
  { browser: 'Safari', downloads: 7750, percentLabel: '15.2%' },
  { browser: 'Edge', downloads: 7600, percentLabel: '14.9%' },
  { browser: 'Explorer', downloads: 500, percentLabel: '1.0%' },
];

export const barDataLongLabels = [
  { browser: 'Google Chrome', downloads: 27000 },
  { browser: 'Mozilla Firefox', downloads: 8000 },
  { browser: 'Mac Safari', downloads: 7750 },
  { browser: 'Microsoft Edge', downloads: 7600 },
  { browser: 'Microsoft Explorer', downloads: 500 },
];

export const barDataWithUTC = [
  {
    browser: '2024-01-01 00:00:00.0',
    downloads: 11,
    dataset_id: 'sent',
  },
  {
    browser: '2024-09-02 00:00:00.0',
    downloads: 2,
    dataset_id: 'sent',
  },
  {
    browser: '2025-01-03 00:00:00.0',
    downloads: 4,
    dataset_id: 'sent',
  },
  {
    browser: '2025-02-04 00:00:00.0',
    downloads: 7,
    dataset_id: 'sent',
  },
  {
    browser: '2025-03-05 00:00:00.0',
    downloads: 1,
    dataset_id: 'sent',
  },
  {
    browser: '2025-04-06 00:00:00.0',
    downloads: 9,
    dataset_id: 'sent',
  },
];

export const stackedBarDataWithUTC = [
  {
    browser: '2025-01-27 00:00:00.0',
    downloads: 27000,
    dataset_id: '6257b7b5436f7a1949f44d3b',
  },
  {
    browser: '2025-01-27 00:00:00.0',
    downloads: 8000,
    dataset_id: '6257b7b5b067f719492758b2',
  },
  {
    browser: '2025-01-25 00:00:00.0',
    downloads: 7750,
    dataset_id: '6257b7b5436f7a1949f44d3b',
  },
  {
    browser: '2025-01-25 00:00:00.0',
    downloads: 7600,
    dataset_id: '6257b7b5b067f719492758b2',
  },
  {
    browser: '2025-01-26 00:00:00.0',
    downloads: 500,
    dataset_id: '6257b7b5436f7a1949f44d3b',
  },
  {
    browser: '2025-01-26 00:00:00.0',
    downloads: 500,
    dataset_id: '6257b7b5b067f719492758b2',
  },
];

export const mixedBarData = [
  { browser: 'Chrome', downloads: 27000 },
  { browser: 'Firefox', downloads: 8000 },
  { browser: 'Safari', downloads: -7750 },
  { browser: 'Edge', downloads: -7600 },
  { browser: 'Explorer', downloads: -500 },
];

/**
 * Diverging conversion-rate-change data matching the AN-456581 Figma reference.
 * Note: the reference design shows "FB Stories" for both a positive and a negative row; renamed
 * the negative one to "FB Post" here since a band scale needs a unique dimension value per row.
 */
export const divergingConversionRateData = [
  { channel: 'IG Stories', changeRate: 0.131, barColor: '#2d7d46' },
  { channel: 'IG Reels', changeRate: 0.082, barColor: '#2d7d46' },
  { channel: 'FB Stories', changeRate: 0.013, barColor: '#2d7d46' },
  { channel: 'FB Video', changeRate: 0.008, barColor: '#2d7d46' },
  { channel: 'FB Post', changeRate: -0.01, barColor: '#d7373f' },
  { channel: 'FB Reels', changeRate: -0.029, barColor: '#d7373f' },
];

/** Same values as divergingConversionRateData, with long category names to check label truncation/collision. */
export const divergingConversionRateDataLongLabels = [
  { channel: 'Instagram Stories Advertisement Campaign', changeRate: 0.131, barColor: '#2d7d46' },
  { channel: 'Instagram Reels Sponsored Content', changeRate: 0.082, barColor: '#2d7d46' },
  { channel: 'Facebook Stories Organic Posts', changeRate: 0.013, barColor: '#2d7d46' },
  { channel: 'Facebook Video Advertisement Placement', changeRate: 0.008, barColor: '#2d7d46' },
  { channel: 'Facebook Post Boosted Content', changeRate: -0.01, barColor: '#d7373f' },
  { channel: 'Facebook Reels Sponsored Video Content', changeRate: -0.029, barColor: '#d7373f' },
];

/**
 * Regression-guard data: two dodged series per category ("New" and "Churned"), each category
 * diverging in opposite directions — the population-pyramid-style shape a single `<Bar>` mark
 * can't unambiguously assign a sign to. `getDivergingBarContext` detects the multiple rows per
 * category and safely declines to activate `diverging` here, rather than guessing.
 */
export const dualSeriesDivergingData = [
  { channel: 'IG Stories', series: 'New', changeRate: 0.131 },
  { channel: 'IG Stories', series: 'Churned', changeRate: -0.045 },
  { channel: 'IG Reels', series: 'New', changeRate: 0.082 },
  { channel: 'IG Reels', series: 'Churned', changeRate: -0.061 },
  { channel: 'FB Stories', series: 'New', changeRate: 0.013 },
  { channel: 'FB Stories', series: 'Churned', changeRate: -0.09 },
];

/**
 * Regression-guard data matching a real-world "monthly growth cohorts" chart: a stacked vertical
 * bar with New/Retained/Returned stacked above zero and Churned stacked below, per month. Every
 * month has multiple rows (one per series), so `getDivergingBarContext` declines here too — the
 * expected convention for this chart shape keeps the month axis at the bottom edge and only draws
 * a zero-gridline through the middle (via plain `baseline`), rather than moving the axis itself.
 */
export const stackedCohortData = [
  { month: 'Oct 2024', series: 'New', users: 1700 },
  { month: 'Oct 2024', series: 'Retained', users: 1000 },
  { month: 'Oct 2024', series: 'Returned', users: 500 },
  { month: 'Oct 2024', series: 'Churned', users: -1500 },
  { month: 'Nov', series: 'New', users: 1000 },
  { month: 'Nov', series: 'Retained', users: 800 },
  { month: 'Nov', series: 'Returned', users: 400 },
  { month: 'Nov', series: 'Churned', users: -2700 },
  { month: 'Dec', series: 'New', users: 1200 },
  { month: 'Dec', series: 'Retained', users: 900 },
  { month: 'Dec', series: 'Returned', users: 400 },
  { month: 'Dec', series: 'Churned', users: -1700 },
  { month: 'Jan 2025', series: 'New', users: 1400 },
  { month: 'Jan 2025', series: 'Retained', users: 1000 },
  { month: 'Jan 2025', series: 'Returned', users: 800 },
  { month: 'Jan 2025', series: 'Churned', users: -1500 },
  { month: 'Feb', series: 'New', users: 1500 },
  { month: 'Feb', series: 'Retained', users: 1100 },
  { month: 'Feb', series: 'Returned', users: 900 },
  { month: 'Feb', series: 'Churned', users: -1300 },
  { month: 'Mar', series: 'New', users: 1700 },
  { month: 'Mar', series: 'Retained', users: 1300 },
  { month: 'Mar', series: 'Returned', users: 1000 },
  { month: 'Mar', series: 'Churned', users: -1200 },
];

/**
 * Regression-guard data matching a Likert-scale survey chart: a horizontal stacked bar per
 * concept, with "Strongly Negative"/"Negative" stacked left of zero and "Neutral"/"Positive"/
 * "Strongly Positive" stacked right of it — the same mixed-sign-rows-per-category shape as
 * `stackedCohortData`, just horizontal and with two negative-going series instead of one.
 * `getDivergingBarContext` declines here too; the concept axis stays at the left edge.
 */
export const likertSurveyData = [
  { concept: 'Concept 1', response: 'Strongly Negative', order: 0, value: -10, barColor: '#7a2e0e' },
  { concept: 'Concept 1', response: 'Negative', order: 1, value: -25, barColor: '#e2711d' },
  { concept: 'Concept 1', response: 'Neutral', order: 2, value: 20, barColor: '#ffc93c' },
  { concept: 'Concept 1', response: 'Positive', order: 3, value: 15, barColor: '#1f9c8a' },
  { concept: 'Concept 1', response: 'Strongly Positive', order: 4, value: 10, barColor: '#0b4f4a' },
  { concept: 'Concept 2', response: 'Strongly Negative', order: 0, value: -8, barColor: '#7a2e0e' },
  { concept: 'Concept 2', response: 'Negative', order: 1, value: -7, barColor: '#e2711d' },
  { concept: 'Concept 2', response: 'Neutral', order: 2, value: 45, barColor: '#ffc93c' },
  { concept: 'Concept 2', response: 'Positive', order: 3, value: 25, barColor: '#1f9c8a' },
  { concept: 'Concept 2', response: 'Strongly Positive', order: 4, value: 5, barColor: '#0b4f4a' },
  { concept: 'Concept 3', response: 'Strongly Negative', order: 0, value: -2, barColor: '#7a2e0e' },
  { concept: 'Concept 3', response: 'Negative', order: 1, value: -3, barColor: '#e2711d' },
  { concept: 'Concept 3', response: 'Neutral', order: 2, value: 15, barColor: '#ffc93c' },
  { concept: 'Concept 3', response: 'Positive', order: 3, value: 45, barColor: '#1f9c8a' },
  { concept: 'Concept 3', response: 'Strongly Positive', order: 4, value: 30, barColor: '#0b4f4a' },
];

/**
 * Open-question demo data: a year-over-year revenue-change comparison, dodged by "This Year" vs
 * "Last Year." Two rows per category (like `dualSeriesDivergingData`), but here every category's
 * rows *agree* in sign — Product A/B are positive both years (growing), Product C/D are negative
 * both years (declining). Unlike the population-pyramid case, there's no real ambiguity here: the
 * empty side of zero for each category is genuinely empty regardless of which row the lookup
 * happens to find first. The current rows-per-category guard still declines `diverging` for this
 * chart, which is the "too conservative" question — see #2 in the diverging open-questions list.
 */
export const sameSignDodgedData = [
  { product: 'Product A', period: 'This Year', changeRate: 0.15 },
  { product: 'Product A', period: 'Last Year', changeRate: 0.08 },
  { product: 'Product B', period: 'This Year', changeRate: 0.05 },
  { product: 'Product B', period: 'Last Year', changeRate: 0.03 },
  { product: 'Product C', period: 'This Year', changeRate: -0.12 },
  { product: 'Product C', period: 'Last Year', changeRate: -0.18 },
  { product: 'Product D', period: 'This Year', changeRate: -0.03 },
  { product: 'Product D', period: 'Last Year', changeRate: -0.01 },
];

/**
 * Verification data for `labelFormat="time"` + `diverging` (single series, mixed sign, monthly
 * granularity) — checked safe via buildSpec/vega.parse before adding this story: no crash, and
 * (for the vertical-bar/bottom-axis case) the primary+secondary time axis pair both get the same
 * offset and an identical flip encode, since their row separation is a static `dy`, not
 * `labelPadding`-based like sub-labels.
 */
export const timeAxisDivergingData = [
  { day: '2024-11-15 00:00:00.0', changeRate: 0.131 },
  { day: '2024-12-20 00:00:00.0', changeRate: 0.082 },
  { day: '2025-01-10 00:00:00.0', changeRate: -0.01 },
  { day: '2025-02-05 00:00:00.0', changeRate: -0.05 },
];

/**
 * Trellis demo data: single series per category, sign consistent for a given channel across both
 * panels (IG Stories always positive, FB Post/FB Reels always negative) — isolates the confirmed
 * plumbing gap (`divergingContext` never reaches `addAxesToTrellisGroup`'s per-panel axes) from the
 * separate global-vs-per-panel sign-scoping question.
 */
export const trellisDivergingData = [
  { region: 'Region A', channel: 'IG Stories', changeRate: 0.131 },
  { region: 'Region A', channel: 'IG Reels', changeRate: 0.082 },
  { region: 'Region A', channel: 'FB Post', changeRate: -0.01 },
  { region: 'Region A', channel: 'FB Reels', changeRate: -0.029 },
  { region: 'Region B', channel: 'IG Stories', changeRate: 0.05 },
  { region: 'Region B', channel: 'IG Reels', changeRate: 0.03 },
  { region: 'Region B', channel: 'FB Post', changeRate: -0.02 },
  { region: 'Region B', channel: 'FB Reels', changeRate: -0.04 },
];

export const barDataTwoSeries = [
  { browser: 'Chrome', value: 5, operatingSystem: 'Windows', order: 2, percentLabel: '50%' },
  { browser: 'Chrome', value: 3, operatingSystem: 'Mac', order: 1, percentLabel: '30%' },
  { browser: 'Firefox', value: 3, operatingSystem: 'Windows', order: 2, percentLabel: '42.6%' },
  { browser: 'Firefox', value: 3, operatingSystem: 'Mac', order: 1, percentLabel: '42.6%' },
  { browser: 'Safari', value: 3, operatingSystem: 'Windows', order: 2, percentLabel: '75%' },
  { browser: 'Safari', value: 0, operatingSystem: 'Mac', order: 1 },
];

export const barSeriesData = [
  ...barDataTwoSeries,
  { browser: 'Chrome', value: 2, operatingSystem: 'Other', order: 0, percentLabel: '20%' },
  { browser: 'Firefox', value: 1, operatingSystem: 'Other', order: 0, percentLabel: '14.3%' },
  { browser: 'Safari', value: 1, operatingSystem: 'Other', order: 0, percentLabel: '25%' },
];

export const negativeBarSeriesData = [
  { browser: 'Chrome', value: -5, operatingSystem: 'Windows', order: 2, percentLabel: '50%' },
  { browser: 'Chrome', value: -3, operatingSystem: 'Mac', order: 1, percentLabel: '30%' },
  { browser: 'Chrome', value: -2, operatingSystem: 'Other', order: 0, percentLabel: '20%' },
  { browser: 'Firefox', value: -3, operatingSystem: 'Windows', order: 2, percentLabel: '42.6%' },
  { browser: 'Firefox', value: -3, operatingSystem: 'Mac', order: 1, percentLabel: '42.6%' },
  { browser: 'Firefox', value: -1, operatingSystem: 'Other', order: 0, percentLabel: '14.3%' },
  { browser: 'Safari', value: -3, operatingSystem: 'Windows', order: 2, percentLabel: '75%' },
  { browser: 'Safari', value: 0, operatingSystem: 'Mac', order: 1 },
  { browser: 'Safari', value: -1, operatingSystem: 'Other', order: 0, percentLabel: '25%' },
];

export const barSubSeriesData = [
  { browser: 'Chrome', value: 5, operatingSystem: 'Windows', version: 'Current', order: 2, percentLabel: '71.4%' },
  { browser: 'Chrome', value: 3, operatingSystem: 'Mac', version: 'Current', order: 1, percentLabel: '42.9%' },
  { browser: 'Chrome', value: 2, operatingSystem: 'Linux', version: 'Current', order: 0, percentLabel: '28.6%' },
  { browser: 'Firefox', value: 3, operatingSystem: 'Windows', version: 'Current', order: 2, percentLabel: '30%' },
  { browser: 'Firefox', value: 3, operatingSystem: 'Mac', version: 'Current', order: 1, percentLabel: '75%' },
  { browser: 'Firefox', value: 1, operatingSystem: 'Linux', version: 'Current', order: 0, percentLabel: '25%' },
  { browser: 'Safari', value: 3, operatingSystem: 'Windows', version: 'Current', order: 2, percentLabel: '27.3%' },
  { browser: 'Safari', value: 1, operatingSystem: 'Mac', version: 'Current', order: 1, percentLabel: '50%' },
  { browser: 'Safari', value: 1, operatingSystem: 'Linux', version: 'Current', order: 0, percentLabel: '25%' },
  { browser: 'Chrome', value: 2, operatingSystem: 'Windows', version: 'Previous', order: 2, percentLabel: '28.6%' },
  { browser: 'Chrome', value: 4, operatingSystem: 'Mac', version: 'Previous', order: 1, percentLabel: '57.1%' },
  { browser: 'Chrome', value: 5, operatingSystem: 'Linux', version: 'Previous', order: 0, percentLabel: '71.4%' },
  { browser: 'Firefox', value: 7, operatingSystem: 'Windows', version: 'Previous', order: 2, percentLabel: '70%' },
  { browser: 'Firefox', value: 1, operatingSystem: 'Mac', version: 'Previous', order: 1, percentLabel: '25%' },
  { browser: 'Firefox', value: 3, operatingSystem: 'Linux', version: 'Previous', order: 0, percentLabel: '75%' },
  { browser: 'Safari', value: 8, operatingSystem: 'Windows', version: 'Previous', order: 2, percentLabel: '72.7%' },
  { browser: 'Safari', value: 1, operatingSystem: 'Mac', version: 'Previous', order: 1, percentLabel: '50%' },
  { browser: 'Safari', value: 3, operatingSystem: 'Linux', version: 'Previous', order: 0, percentLabel: '75%' },
];

export const frequencyOfUseData = [
  { segment: 'All users', bucket: '1-5 times', event: 'A. Sign up', value: 12000, order: 0 },
  { segment: 'Roku', bucket: '1-5 times', event: 'A. Sign up', value: 11200, order: 0 },
  { segment: 'Chromecast', bucket: '1-5 times', event: 'A. Sign up', value: 11500, order: 0 },
  { segment: 'Apple TV', bucket: '1-5 times', event: 'A. Sign up', value: 10930, order: 0 },
  { segment: 'Amazon Fire', bucket: '1-5 times', event: 'A. Sign up', value: 10000, order: 0 },
  { segment: 'All users', bucket: '6-10 times', event: 'A. Sign up', value: 3200, order: 1 },
  { segment: 'Roku', bucket: '6-10 times', event: 'A. Sign up', value: 3000, order: 1 },
  { segment: 'Chromecast', bucket: '6-10 times', event: 'A. Sign up', value: 3100, order: 1 },
  { segment: 'Apple TV', bucket: '6-10 times', event: 'A. Sign up', value: 2900, order: 1 },
  { segment: 'Amazon Fire', bucket: '6-10 times', event: 'A. Sign up', value: 2700, order: 1 },
  { segment: 'All users', bucket: '11-15 times', event: 'A. Sign up', value: 1200, order: 2 },
  { segment: 'Roku', bucket: '11-15 times', event: 'A. Sign up', value: 1090, order: 2 },
  { segment: 'Chromecast', bucket: '11-15 times', event: 'A. Sign up', value: 1150, order: 2 },
  { segment: 'Apple TV', bucket: '11-15 times', event: 'A. Sign up', value: 1000, order: 2 },
  { segment: 'Amazon Fire', bucket: '11-15 times', event: 'A. Sign up', value: 900, order: 2 },

  { segment: 'All users', bucket: '1-5 times', event: 'B. Watch a video', value: 7600, order: 0 },
  { segment: 'Roku', bucket: '1-5 times', event: 'B. Watch a video', value: 7100, order: 0 },
  { segment: 'Chromecast', bucket: '1-5 times', event: 'B. Watch a video', value: 7300, order: 0 },
  { segment: 'Apple TV', bucket: '1-5 times', event: 'B. Watch a video', value: 6900, order: 0 },
  { segment: 'Amazon Fire', bucket: '1-5 times', event: 'B. Watch a video', value: 6300, order: 0 },
  { segment: 'All users', bucket: '6-10 times', event: 'B. Watch a video', value: 2100, order: 1 },
  { segment: 'Roku', bucket: '6-10 times', event: 'B. Watch a video', value: 2000, order: 1 },
  { segment: 'Chromecast', bucket: '6-10 times', event: 'B. Watch a video', value: 2100, order: 1 },
  { segment: 'Apple TV', bucket: '6-10 times', event: 'B. Watch a video', value: 1900, order: 1 },
  { segment: 'Amazon Fire', bucket: '6-10 times', event: 'B. Watch a video', value: 1700, order: 1 },
  { segment: 'All users', bucket: '11-15 times', event: 'B. Watch a video', value: 700, order: 2 },
  { segment: 'Roku', bucket: '11-15 times', event: 'B. Watch a video', value: 640, order: 2 },
  { segment: 'Chromecast', bucket: '11-15 times', event: 'B. Watch a video', value: 670, order: 2 },
  { segment: 'Apple TV', bucket: '11-15 times', event: 'B. Watch a video', value: 600, order: 2 },
  { segment: 'Amazon Fire', bucket: '11-15 times', event: 'B. Watch a video', value: 540, order: 2 },

  { segment: 'All users', bucket: '1-5 times', event: 'C. Add to My List', value: 4100, order: 0 },
  { segment: 'Roku', bucket: '1-5 times', event: 'C. Add to My List', value: 3800, order: 0 },
  { segment: 'Chromecast', bucket: '1-5 times', event: 'C. Add to My List', value: 3900, order: 0 },
  { segment: 'Apple TV', bucket: '1-5 times', event: 'C. Add to My List', value: 3700, order: 0 },
  { segment: 'Amazon Fire', bucket: '1-5 times', event: 'C. Add to My List', value: 3400, order: 0 },
  { segment: 'All users', bucket: '6-10 times', event: 'C. Add to My List', value: 1100, order: 1 },
  { segment: 'Roku', bucket: '6-10 times', event: 'C. Add to My List', value: 1000, order: 1 },
  { segment: 'Chromecast', bucket: '6-10 times', event: 'C. Add to My List', value: 800, order: 1 },
  { segment: 'Apple TV', bucket: '6-10 times', event: 'C. Add to My List', value: 1000, order: 1 },
  { segment: 'Amazon Fire', bucket: '6-10 times', event: 'C. Add to My List', value: 900, order: 1 },
  { segment: 'All users', bucket: '11-15 times', event: 'C. Add to My List', value: 400, order: 2 },
  { segment: 'Roku', bucket: '11-15 times', event: 'C. Add to My List', value: 220, order: 2 },
  { segment: 'Chromecast', bucket: '11-15 times', event: 'C. Add to My List', value: 300, order: 2 },
  { segment: 'Apple TV', bucket: '11-15 times', event: 'C. Add to My List', value: 200, order: 2 },
  { segment: 'Amazon Fire', bucket: '11-15 times', event: 'C. Add to My List', value: 100, order: 2 },
];

interface GenerateMockDataForTrellisArgs {
  property1: string[];
  property2: string[];
  property3: string[];
  propertyNames: [string, string, string];
  orderBy: string;
  maxValue?: number;
  randomizeSteps?: boolean;
}

// Helper to calculate order based on the orderBy parameter
const getOrder = (
  p1i: number,
  p2i: number,
  p3i: number,
  orderBy: string,
  propertyNames: [string, string, string]
): number => {
  const [property1Name, property2Name, property3Name] = propertyNames;
  if (orderBy === property1Name) return p1i;
  if (orderBy === property2Name) return p2i;
  if (orderBy === property3Name) return p3i;
  return -1; // Default order if orderBy doesn't match
};

// Helper to calculate the value based on indices and randomization flag
const getValue = (p1i: number, p2i: number, p3i: number, maxValue: number, randomizeSteps: boolean): number => {
  if (randomizeSteps) {
    return Math.max(0, Math.floor(Math.random() * maxValue));
  }
  return Math.max(0, maxValue - (p1i + p2i + p3i) * (maxValue / 10));
};

export const generateMockDataForTrellis = ({
  property1,
  property2,
  property3,
  propertyNames,
  orderBy,
  maxValue = 10000,
  randomizeSteps = true,
}: GenerateMockDataForTrellisArgs): Record<string, string | number>[] => {
  const [property1Name, property2Name, property3Name] = propertyNames;
  const data: Record<string, string | number>[] = [];

  for (let p1i = 0; p1i < property1.length; p1i++) {
    const p1 = property1[p1i];
    for (let p2i = 0; p2i < property2.length; p2i++) {
      const p2 = property2[p2i];
      for (let p3i = 0; p3i < property3.length; p3i++) {
        const p3 = property3[p3i];

        const order = getOrder(p1i, p2i, p3i, orderBy, propertyNames);
        const value = getValue(p1i, p2i, p3i, maxValue, randomizeSteps);

        data.push({
          order,
          value,
          [property1Name]: p1,
          [property2Name]: p2,
          [property3Name]: p3,
        });
      }
    }
  }

  return data;
};
