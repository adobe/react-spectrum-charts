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

const DAY_MS = 24 * 60 * 60 * 1000;
// Saturday, Nov 2 2024 (local midnight) so the two weeks end on a Friday.
const START_DATE = new Date(2024, 10, 2).getTime();

const dailyVisitsByChannel: Record<string, number[]> = {
  'Organic search': [3180, 2950, 5200, 5480, 5390, 5610, 5020, 3300, 3050, 5350, 5620, 5540, 5790, 5210],
  'Paid search': [2100, 1980, 3100, 3350, 3280, 3420, 3150, 2600, 2450, 3600, 3920, 4100, 4250, 3880],
  Email: [650, 600, 1450, 4200, 1600, 1380, 1300, 700, 640, 1500, 4450, 1650, 1420, 1350],
  Social: [1420, 1500, 980, 1020, 1100, 1050, 1180, 1480, 1560, 1010, 1060, 1120, 1090, 1210],
};

const additionalDailyVisitsByChannel: Record<string, number[]> = {
  Direct: [2400, 2300, 2900, 3000, 2950, 3050, 2850, 2450, 2350, 2980, 3060, 3010, 3120, 2900],
  Referral: [420, 390, 610, 640, 620, 660, 600, 430, 400, 630, 650, 640, 680, 610],
};

// Marketing events keyed by `${channel}:${dayIndex}`.
const channelEvents: Record<string, string> = {
  'Email:3': 'Newsletter',
  'Email:10': 'Newsletter',
  'Paid search:9': 'Campaign launch',
};

const PRELIMINARY_DAYS = 2;

const toRows = (visitsByChannel: Record<string, number[]>) =>
  Object.entries(visitsByChannel).flatMap(([channel, values]) =>
    values.map((visits, dayIndex) => {
      const event = channelEvents[`${channel}:${dayIndex}`];
      return {
        datetime: START_DATE + dayIndex * DAY_MS,
        channel,
        visits,
        visitsLabel: `${(visits / 1000).toFixed(1)}K visits`,
        isPreliminary: dayIndex >= values.length - PRELIMINARY_DAYS,
        hasEvent: Boolean(event),
        event: event ?? '',
      };
    })
  );

/** Daily website visits for four marketing channels over two weeks. */
export const visitsByChannelData = toRows(dailyVisitsByChannel);

/** Daily website visits for six marketing channels over two weeks. */
export const visitsBySixChannelsData = toRows({ ...dailyVisitsByChannel, ...additionalDailyVisitsByChannel });

/** Daily website visits for the two search channels over two weeks. */
export const searchVisitsData = visitsByChannelData.filter((d) => d.channel.endsWith('search'));

/** Daily website visits for paid search only. */
export const paidSearchVisitsData = visitsByChannelData.filter((d) => d.channel === 'Paid search');

const MONTH_STARTS_2024 = Array.from({ length: 12 }, (_, month) => new Date(2024, month, 1).getTime());

/** First day of the month where the forecast begins (September 2024). */
export const FORECAST_START = MONTH_STARTS_2024[8];

const monthlyVisitsByDevice: Record<string, number[]> = {
  Mobile: [512000, 498000, 534000, 551000, 575000, 569000, 592000, 604000, 618000, 631000, 655000, 689000],
  Desktop: [421000, 409000, 428000, 416000, 402000, 395000, 388000, 391000, 384000, 379000, 386000, 402000],
};

/** Monthly visits by device for 2024; months from September on are forecast values. */
export const monthlyVisitsForecastData = Object.entries(monthlyVisitsByDevice).flatMap(([device, values]) =>
  values.map((value, month) => {
    const isForecast = MONTH_STARTS_2024[month] >= FORECAST_START;
    return {
      datetime: MONTH_STARTS_2024[month],
      device,
      visits: isForecast ? null : value,
      forecastVisits: isForecast ? value : null,
    };
  })
);

const weeklyActiveUsersByPlan: Record<string, number[]> = {
  Enterprise: [18200, 18650, 19100, 19400, 20150, 20600, 21300, 21050, 21900, 22400, 22950, 23600, 24100],
  Team: [12400, 12900, 12650, 13300, 13800, 13550, 14200, 14650, 14400, 15100, 15500, 15300, 15900],
  Free: [9600, 10400, 9900, 11200, 10800, 11900, 11400, 12600, 12100, 13200, 12800, 13900, 13500],
};

/** Weekly active users by plan for the 13 weeks of a quarter. */
export const weeklyActiveUsersData = Object.entries(weeklyActiveUsersByPlan).flatMap(([plan, values]) =>
  values.map((users, index) => ({ week: index + 1, plan, users }))
);

const dailyConversionRates = [
  2.4, 2.6, 2.5, 2.9, 3.1, 2.8, 2.7, 3.0, 3.3, 3.2, 3.5, 3.4, 3.1, 3.6, 3.8, 3.5, 3.7, 3.9, 4.1, 3.8, 4.0, 4.3, 4.2,
  4.4, 4.1, 4.5, 4.9, 4.6, 4.7, 4.5,
];
const peakConversionRate = Math.max(...dailyConversionRates);

/** Daily checkout conversion rate (%) for the last 30 days. */
export const conversionRateData = dailyConversionRates.map((rate, day) => ({
  day: day + 1,
  rate,
  metric: 'Checkout conversion rate',
  isPeak: rate === peakConversionRate,
}));

const dailyDownloads = [1840, 1920, 2310, 2480, 2390, 2150, 1980, 2060, 2540, 2720, 2610, 2380, 2210, 2290];
const dailyConversionPercent = [4.2, 4.1, 3.9, 3.8, 3.9, 3.7, 3.6, 3.5, 3.3, 3.2, 3.4, 3.1, 3.0, 2.9];

/** Two metrics with different units, one row per day per metric; the second series uses the right axis. */
export const downloadsAndConversionData = [
  ...dailyDownloads.map((value, i) => ({ datetime: START_DATE + i * DAY_MS, metric: 'Downloads', value })),
  ...dailyConversionPercent.map((value, i) => ({
    datetime: START_DATE + i * DAY_MS,
    metric: 'Conversion rate (%)',
    value,
  })),
];
