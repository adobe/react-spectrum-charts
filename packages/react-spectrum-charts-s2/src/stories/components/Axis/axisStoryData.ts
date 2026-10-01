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
import { Granularity } from '@spectrum-charts/vega-spec-builder-s2';

const MONTHS_2025 = Array.from({ length: 12 }, (_, month) => new Date(2025, month, 1).getTime());

const CHANNELS = ['Organic search', 'Paid search', 'Email'] as const;

const monthlySessions: Record<(typeof CHANNELS)[number], number[]> = {
  'Organic search': [182, 176, 194, 203, 215, 221, 208, 212, 236, 248, 262, 281],
  'Paid search': [96, 102, 110, 118, 121, 134, 129, 126, 142, 151, 166, 188],
  Email: [48, 52, 55, 51, 58, 61, 57, 54, 63, 67, 74, 86],
};

const monthlyConversionRate: Record<(typeof CHANNELS)[number], number[]> = {
  'Organic search': [3.1, 3.0, 3.3, 3.4, 3.6, 3.5, 3.4, 3.5, 3.8, 3.9, 4.1, 4.4],
  'Paid search': [2.2, 2.3, 2.4, 2.6, 2.5, 2.7, 2.6, 2.6, 2.9, 3.0, 3.2, 3.5],
  Email: [4.6, 4.8, 4.7, 5.0, 5.2, 5.1, 4.9, 5.0, 5.4, 5.6, 5.9, 6.3],
};

const averageOrderValue: Record<(typeof CHANNELS)[number], number> = {
  'Organic search': 82,
  'Paid search': 95,
  Email: 70,
};

const monthlySessionSeconds: Record<(typeof CHANNELS)[number], number[]> = {
  'Organic search': [184, 179, 192, 198, 205, 211, 203, 207, 219, 226, 238, 251],
  'Paid search': [112, 118, 121, 127, 124, 133, 129, 131, 140, 146, 152, 164],
  Email: [236, 241, 248, 244, 259, 266, 258, 262, 279, 288, 301, 318],
};

/** Monthly website traffic, conversion, revenue and engagement by acquisition channel for 2025. */
export const channelPerformanceData = CHANNELS.flatMap((channel) =>
  MONTHS_2025.map((datetime, month) => {
    const sessions = monthlySessions[channel][month] * 1000;
    const conversionRate = monthlyConversionRate[channel][month] / 100;
    return {
      datetime,
      channel,
      sessions,
      conversionRate,
      revenue: Math.round(sessions * conversionRate * averageOrderValue[channel]),
      avgSessionSeconds: monthlySessionSeconds[channel][month],
    };
  })
);

/** Brand health index (100 = category benchmark) for 2025. */
export const brandHealthData = [
  { brand: 'Our brand', values: [96, 94, 98, 101, 104, 103, 99, 97, 102, 108, 112, 115] },
  { brand: 'Category average', values: [100, 99, 100, 101, 100, 99, 98, 99, 100, 101, 101, 102] },
].flatMap(({ brand, values }) => MONTHS_2025.map((datetime, month) => ({ datetime, brand, index: values[month] })));

/** Monthly downloads by browser and operating system. */
export const downloadsByBrowserData = [
  { browser: 'Chrome', os: 'Windows', downloads: 142000 },
  { browser: 'Chrome', os: 'macOS', downloads: 61000 },
  { browser: 'Chrome', os: 'Linux', downloads: 18000 },
  { browser: 'Safari', os: 'Windows', downloads: 0 },
  { browser: 'Safari', os: 'macOS', downloads: 88000 },
  { browser: 'Safari', os: 'Linux', downloads: 0 },
  { browser: 'Edge', os: 'Windows', downloads: 64000 },
  { browser: 'Edge', os: 'macOS', downloads: 18000 },
  { browser: 'Edge', os: 'Linux', downloads: 0 },
  { browser: 'Firefox', os: 'Windows', downloads: 31000 },
  { browser: 'Firefox', os: 'macOS', downloads: 12000 },
  { browser: 'Firefox', os: 'Linux', downloads: 14000 },
  { browser: 'Opera', os: 'Windows', downloads: 26000 },
  { browser: 'Opera', os: 'macOS', downloads: 14000 },
  { browser: 'Opera', os: 'Linux', downloads: 11000 },
];

/** Conversions per marketing campaign, split by new vs returning customers. Campaign names are intentionally long. */
export const campaignConversionsData = [
  { campaign: 'Spring sale email retargeting', customer: 'New customers', conversions: 1840 },
  { campaign: 'Spring sale email retargeting', customer: 'Returning customers', conversions: 2960 },
  { campaign: 'Back to school paid social', customer: 'New customers', conversions: 3120 },
  { campaign: 'Back to school paid social', customer: 'Returning customers', conversions: 1410 },
  { campaign: 'Holiday gift guide search ads', customer: 'New customers', conversions: 4280 },
  { campaign: 'Holiday gift guide search ads', customer: 'Returning customers', conversions: 2650 },
  { campaign: 'Loyalty program launch', customer: 'New customers', conversions: 620 },
  { campaign: 'Loyalty program launch', customer: 'Returning customers', conversions: 3890 },
  { campaign: 'Summer clearance display', customer: 'New customers', conversions: 2210 },
  { campaign: 'Summer clearance display', customer: 'Returning customers', conversions: 1180 },
];

/** Monthly downloads for the three most-used browsers, by operating system. */
export const topBrowserDownloadsData = downloadsByBrowserData.filter(({ browser }) =>
  ['Chrome', 'Safari', 'Edge'].includes(browser)
);

const GRANULARITY_SETTINGS: Record<Granularity, { start: Date; count: number; step: (date: Date, i: number) => Date }> =
  {
    second: { start: new Date(2025, 5, 2, 9, 0, 0), count: 30, step: (d, i) => new Date(d.getTime() + i * 1000) },
    minute: { start: new Date(2025, 5, 2, 9, 0), count: 30, step: (d, i) => new Date(d.getTime() + i * 60000) },
    hour: { start: new Date(2025, 5, 2, 0), count: 24, step: (d, i) => new Date(d.getTime() + i * 3600000) },
    day: { start: new Date(2025, 5, 1), count: 30, step: (d, i) => new Date(2025, 5, 1 + i) },
    week: { start: new Date(2025, 5, 2), count: 12, step: (d, i) => new Date(2025, 5, 2 + i * 7) },
    month: { start: new Date(2025, 0, 1), count: 12, step: (d, i) => new Date(2025, i, 1) },
    quarter: { start: new Date(2023, 0, 1), count: 12, step: (d, i) => new Date(2023, i * 3, 1) },
    year: { start: new Date(2018, 0, 1), count: 8, step: (d, i) => new Date(2018 + i, 0, 1) },
  };

/**
 * App downloads by platform at the requested time granularity.
 * @param granularity
 * @returns data
 */
export const getDownloadsByGranularity = (granularity: Granularity = 'day') => {
  const { start, count, step } = GRANULARITY_SETTINGS[granularity];
  return [
    { platform: 'Desktop', base: 4200, growth: 60 },
    { platform: 'Mobile', base: 2600, growth: 85 },
  ].flatMap(({ platform, base, growth }) =>
    Array.from({ length: count }, (_, i) => ({
      datetime: step(start, i).getTime(),
      platform,
      downloads: Math.round(base + growth * i + 380 * Math.sin(i / 2)),
    }))
  );
};
