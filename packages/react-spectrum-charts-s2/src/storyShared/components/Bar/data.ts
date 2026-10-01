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
  { browser: 'Chrome', downloads: 27000, percentLabel: '53.1%', share: 0.531 },
  { browser: 'Firefox', downloads: 8000, percentLabel: '15.7%', share: 0.157 },
  { browser: 'Safari', downloads: 7750, percentLabel: '15.2%', share: 0.152 },
  { browser: 'Edge', downloads: 7600, percentLabel: '14.9%', share: 0.149 },
  { browser: 'Explorer', downloads: 500, percentLabel: '1.0%', share: 0.01 },
];

export const barDataWithSeries = barData.map((datum) => ({ ...datum, series: 'Downloads' }));

export const acquisitionChannelData = [
  { channel: 'Email', signups: 18200, series: 'Sign-ups' },
  { channel: 'Search', signups: 15100, series: 'Sign-ups' },
  { channel: 'Social', signups: 12400, series: 'Sign-ups' },
  { channel: 'Display', signups: 9800, series: 'Sign-ups' },
  { channel: 'Referral', signups: 7600, series: 'Sign-ups' },
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

export const barDataWithUTCSeries = barDataWithUTC.map((datum) => ({ ...datum, datasetName: 'Daily downloads' }));

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

export const stackedBarDataWithUTCSeries = stackedBarDataWithUTC.map((datum) => ({
  ...datum,
  datasetName: datum.dataset_id === '6257b7b5436f7a1949f44d3b' ? 'Desktop downloads' : 'Mobile downloads',
}));

export const mixedBarData = [
  { browser: 'Chrome', downloads: 27000 },
  { browser: 'Firefox', downloads: 8000 },
  { browser: 'Safari', downloads: -7750 },
  { browser: 'Edge', downloads: -7600 },
  { browser: 'Explorer', downloads: -500 },
];

export const mixedBarDataWithSeries = mixedBarData.map((datum) => ({ ...datum, series: 'Downloads' }));

export const mixedAcquisitionData = [
  { channel: 'Email', signups: 12600, series: 'Sign-ups' },
  { channel: 'Search', signups: 9400, series: 'Sign-ups' },
  { channel: 'Social', signups: 6200, series: 'Sign-ups' },
  { channel: 'Display', signups: -3300, series: 'Sign-ups' },
  { channel: 'Referral', signups: -2100, series: 'Sign-ups' },
];

/** Diverging conversion-rate-change data matching the Figma reference ("FB Stories" negative row renamed to "FB Post" for a unique band-scale value). */
export const divergingConversionRateData = [
  { channel: 'IG Stories', changeRate: 0.131, barColor: '#2d7d46' },
  { channel: 'IG Reels', changeRate: 0.082, barColor: '#2d7d46' },
  { channel: 'FB Stories', changeRate: 0.013, barColor: '#2d7d46' },
  { channel: 'FB Video', changeRate: 0.008, barColor: '#2d7d46' },
  { channel: 'FB Post', changeRate: -0.01, barColor: '#d7373f' },
  { channel: 'FB Reels', changeRate: -0.07, barColor: '#d7373f' },
];

export const divergingConversionRateDataWithDirection = divergingConversionRateData.map((datum) => ({
  ...datum,
  changeDirection: datum.changeRate >= 0 ? 'Increase' : 'Decrease',
}));

/** Same values as divergingConversionRateData, with long category names to check label truncation/collision. */
export const divergingConversionRateDataLongLabels = [
  { channel: 'Instagram Stories Advertisement Campaign', changeRate: 0.131, barColor: '#2d7d46' },
  { channel: 'Instagram Reels Sponsored Content', changeRate: 0.082, barColor: '#2d7d46' },
  { channel: 'Facebook Stories Organic Posts', changeRate: 0.013, barColor: '#2d7d46' },
  { channel: 'Facebook Video Advertisement Placement', changeRate: 0.008, barColor: '#2d7d46' },
  { channel: 'Facebook Post Boosted Content', changeRate: -0.01, barColor: '#d7373f' },
  { channel: 'Facebook Reels Sponsored Video Content', changeRate: -0.029, barColor: '#d7373f' },
];

export const divergingConversionRateDataLongLabelsWithDirection = divergingConversionRateDataLongLabels.map(
  (datum) => ({
    ...datum,
    changeDirection: datum.changeRate >= 0 ? 'Increase' : 'Decrease',
  })
);

/** Verifies `labelFormat="time"` + `diverging` (mixed sign, monthly granularity): primary/secondary time axes share the same offset and flip encode via a static `dy`, not `labelPadding`. */
export const timeAxisDivergingData = [
  { day: '2024-11-15 00:00:00.0', changeRate: 0.131 },
  { day: '2024-12-20 00:00:00.0', changeRate: 0.082 },
  { day: '2025-01-10 00:00:00.0', changeRate: -0.01 },
  { day: '2025-02-05 00:00:00.0', changeRate: -0.05 },
];

export const timeAxisDivergingDataWithDirection = timeAxisDivergingData.map((datum) => ({
  ...datum,
  changeDirection: datum.changeRate >= 0 ? 'Increase' : 'Decrease',
}));

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

// Order by whichever property matches orderBy
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

/** Sign-ups per channel with a goal status and a per-row CSS color supplied by the data. */
export const acquisitionGoalData = [
  { channel: 'Email', signups: 18200, status: 'Above goal', statusColor: '#0d7a55' },
  { channel: 'Search', signups: 15100, status: 'Above goal', statusColor: '#0d7a55' },
  { channel: 'Social', signups: 12400, status: 'Above goal', statusColor: '#0d7a55' },
  { channel: 'Display', signups: 9800, status: 'Below goal', statusColor: '#d7373f' },
  { channel: 'Referral', signups: 7600, status: 'Below goal', statusColor: '#d7373f' },
];

/** Monthly sign-ups keyed by the first day of each month. */
export const monthlySignupsData = [
  { month: '2025-01-01', signups: 11800, series: 'Sign-ups' },
  { month: '2025-02-01', signups: 12600, series: 'Sign-ups' },
  { month: '2025-03-01', signups: 14100, series: 'Sign-ups' },
  { month: '2025-04-01', signups: 13400, series: 'Sign-ups' },
  { month: '2025-05-01', signups: 15900, series: 'Sign-ups' },
  { month: '2025-06-01', signups: 17200, series: 'Sign-ups' },
];

/** Sign-ups per channel split by device. Higher `order` stacks higher, so `order` puts Desktop on top. */
export const channelDeviceData = [
  { channel: 'Email', device: 'Desktop', signups: 9800, order: 2 },
  { channel: 'Email', device: 'Mobile', signups: 6400, order: 1 },
  { channel: 'Email', device: 'Tablet', signups: 2000, order: 0 },
  { channel: 'Search', device: 'Desktop', signups: 7200, order: 2 },
  { channel: 'Search', device: 'Mobile', signups: 6100, order: 1 },
  { channel: 'Search', device: 'Tablet', signups: 1800, order: 0 },
  { channel: 'Social', device: 'Desktop', signups: 3100, order: 2 },
  { channel: 'Social', device: 'Mobile', signups: 8200, order: 1 },
  { channel: 'Social', device: 'Tablet', signups: 1100, order: 0 },
  { channel: 'Display', device: 'Desktop', signups: 4200, order: 2 },
  { channel: 'Display', device: 'Mobile', signups: 3900, order: 1 },
  { channel: 'Display', device: 'Tablet', signups: 1700, order: 0 },
];

/** Sessions per channel, dodged by device and stacked by new vs returning visitors. */
export const channelDeviceVisitorData = [
  { channel: 'Email', device: 'Desktop', visitor: 'New', sessions: 4200 },
  { channel: 'Email', device: 'Desktop', visitor: 'Returning', sessions: 6100 },
  { channel: 'Email', device: 'Mobile', visitor: 'New', sessions: 3100 },
  { channel: 'Email', device: 'Mobile', visitor: 'Returning', sessions: 3900 },
  { channel: 'Search', device: 'Desktop', visitor: 'New', sessions: 5600 },
  { channel: 'Search', device: 'Desktop', visitor: 'Returning', sessions: 2400 },
  { channel: 'Search', device: 'Mobile', visitor: 'New', sessions: 4800 },
  { channel: 'Search', device: 'Mobile', visitor: 'Returning', sessions: 2100 },
  { channel: 'Social', device: 'Desktop', visitor: 'New', sessions: 2300 },
  { channel: 'Social', device: 'Desktop', visitor: 'Returning', sessions: 1200 },
  { channel: 'Social', device: 'Mobile', visitor: 'New', sessions: 6900 },
  { channel: 'Social', device: 'Mobile', visitor: 'Returning', sessions: 3300 },
  { channel: 'Display', device: 'Desktop', visitor: 'New', sessions: 3000 },
  { channel: 'Display', device: 'Desktop', visitor: 'Returning', sessions: 1400 },
  { channel: 'Display', device: 'Mobile', visitor: 'New', sessions: 2700 },
  { channel: 'Display', device: 'Mobile', visitor: 'Returning', sessions: 1100 },
];

/** Sessions and orders per channel; orders are an order of magnitude smaller, so they get the secondary axis. */
export const sessionsAndOrdersData = [
  { channel: 'Email', series: 'Sessions', value: 18400, order: 0 },
  { channel: 'Email', series: 'Orders', value: 920, order: 1 },
  { channel: 'Search', series: 'Sessions', value: 22600, order: 0 },
  { channel: 'Search', series: 'Orders', value: 780, order: 1 },
  { channel: 'Social', series: 'Sessions', value: 15300, order: 0 },
  { channel: 'Social', series: 'Orders', value: 310, order: 1 },
  { channel: 'Display', series: 'Sessions', value: 9800, order: 0 },
  { channel: 'Display', series: 'Orders', value: 240, order: 1 },
];

/** New subscribers gained per acquisition channel last month. */
export const newSubscribersData = [
  { channel: 'Email', subscribers: 12600, series: 'New subscribers' },
  { channel: 'Search', subscribers: 9400, series: 'New subscribers' },
  { channel: 'Social', subscribers: 6200, series: 'New subscribers' },
  { channel: 'Display', subscribers: 3800, series: 'New subscribers' },
  { channel: 'Referral', subscribers: 2100, series: 'New subscribers' },
];

/** Monthly conversions per channel, compared against a shared target. */
export const channelConversionsData = [
  { channel: 'Email', conversions: 2100, series: 'Conversions' },
  { channel: 'Search', conversions: 3400, series: 'Conversions' },
  { channel: 'Display', conversions: 1800, series: 'Conversions' },
  { channel: 'Social', conversions: 2900, series: 'Conversions' },
  { channel: 'Affiliate', conversions: 1200, series: 'Conversions' },
];
