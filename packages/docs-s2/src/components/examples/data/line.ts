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

// Sample datasets; playground code prints these by name. Dates are daily from March 2, 2026, at
// local midnight, so points land on the day ticks of a time axis, which uses the viewer's time zone.

/**
 * Gets local midnight for a day after March 2, 2026.
 * @param offset days after March 2
 * @returns timestamp in milliseconds
 */
export const lineDate = (offset: number) => new Date(2026, 2, 2 + offset).getTime();

export const lineTrafficData = [
  { datetime: lineDate(0), series: 'Organic search', value: 4210 },
  { datetime: lineDate(1), series: 'Organic search', value: 4580 },
  { datetime: lineDate(2), series: 'Organic search', value: 4390 },
  { datetime: lineDate(3), series: 'Organic search', value: 4820 },
  { datetime: lineDate(4), series: 'Organic search', value: 5160 },
  { datetime: lineDate(5), series: 'Organic search', value: 4970 },
  { datetime: lineDate(6), series: 'Organic search', value: 5340 },
  { datetime: lineDate(7), series: 'Organic search', value: 5610 },
  { datetime: lineDate(8), series: 'Organic search', value: 5480 },
  { datetime: lineDate(9), series: 'Organic search', value: 5890 },
  { datetime: lineDate(0), series: 'Paid search', value: 2840 },
  { datetime: lineDate(1), series: 'Paid search', value: 3120 },
  { datetime: lineDate(2), series: 'Paid search', value: 3460 },
  { datetime: lineDate(3), series: 'Paid search', value: 3210 },
  { datetime: lineDate(4), series: 'Paid search', value: 3580 },
  { datetime: lineDate(5), series: 'Paid search', value: 3920 },
  { datetime: lineDate(6), series: 'Paid search', value: 3740 },
  { datetime: lineDate(7), series: 'Paid search', value: 3410 },
  { datetime: lineDate(8), series: 'Paid search', value: 3650 },
  { datetime: lineDate(9), series: 'Paid search', value: 3880 },
  { datetime: lineDate(0), series: 'Email', value: 1620 },
  { datetime: lineDate(1), series: 'Email', value: 1480 },
  { datetime: lineDate(2), series: 'Email', value: 2390 },
  { datetime: lineDate(3), series: 'Email', value: 1710 },
  { datetime: lineDate(4), series: 'Email', value: 1560 },
  { datetime: lineDate(5), series: 'Email', value: 1830 },
  { datetime: lineDate(6), series: 'Email', value: 2610 },
  { datetime: lineDate(7), series: 'Email', value: 1790 },
  { datetime: lineDate(8), series: 'Email', value: 1680 },
  { datetime: lineDate(9), series: 'Email', value: 1940 },
];

export const lineVisitsData = [
  { datetime: lineDate(0), value: 4210 },
  { datetime: lineDate(1), value: 4580 },
  { datetime: lineDate(2), value: 4390 },
  { datetime: lineDate(3), value: 4820 },
  { datetime: lineDate(4), value: 5160 },
  { datetime: lineDate(5), value: 4970 },
  { datetime: lineDate(6), value: 5340 },
  { datetime: lineDate(7), value: 5610 },
  { datetime: lineDate(8), value: 5480 },
  { datetime: lineDate(9), value: 5890 },
];

export const lineMilestoneData = [
  { datetime: lineDate(0), value: 4210 },
  { datetime: lineDate(1), value: 4580 },
  { datetime: lineDate(2), value: 4390 },
  { datetime: lineDate(3), value: 4820, isMilestone: true, annotation: 'Launch' },
  { datetime: lineDate(4), value: 5160 },
  { datetime: lineDate(5), value: 4970 },
  { datetime: lineDate(6), value: 5340 },
  { datetime: lineDate(7), value: 5960, isMilestone: true, annotation: 'Record high' },
  { datetime: lineDate(8), value: 5480 },
  { datetime: lineDate(9), value: 5710 },
];

export const lineRangeData = [
  { datetime: lineDate(0), value: 4210, forecast: 4210 },
  { datetime: lineDate(1), value: 4580, forecast: 4580 },
  { datetime: lineDate(2), value: 4390, forecast: 4390 },
  { datetime: lineDate(3), value: 4820, forecast: 4820 },
  { datetime: lineDate(4), value: 5160, forecast: 5160 },
  { datetime: lineDate(5), value: 4970, forecast: 4970 },
  { datetime: lineDate(6), value: 5340, forecast: 5340 },
  { datetime: lineDate(7), value: 5610, forecast: 5610 },
  { datetime: lineDate(8), value: 5480, forecast: 5480 },
  { datetime: lineDate(9), value: 5890, forecast: 5890, low: 5890, high: 5890 },
  { datetime: lineDate(10), value: null, forecast: 6020, low: 5780, high: 6260 },
  { datetime: lineDate(11), value: null, forecast: 6150, low: 5760, high: 6540 },
  { datetime: lineDate(12), value: null, forecast: 6240, low: 5700, high: 6780 },
  { datetime: lineDate(13), value: null, forecast: 6380, low: 5660, high: 7100 },
];

export const lineForecastData = [
  { datetime: lineDate(0), value: 4210 },
  { datetime: lineDate(1), value: 4580 },
  { datetime: lineDate(2), value: 4390 },
  { datetime: lineDate(3), value: 4820 },
  { datetime: lineDate(4), value: 5160 },
  { datetime: lineDate(5), value: 4970 },
  { datetime: lineDate(6), value: 5340 },
  { datetime: lineDate(7), value: 5610 },
  { datetime: lineDate(8), value: 5480 },
  { datetime: lineDate(9), value: 5890 },
  { datetime: lineDate(10), value: null, forecast: 6020 },
  { datetime: lineDate(11), value: null, forecast: 6150 },
  { datetime: lineDate(12), value: null, forecast: 6240 },
];

export const lineEstimatedData = [
  { datetime: lineDate(0), series: 'Organic search', value: 4210, isEstimated: false },
  { datetime: lineDate(1), series: 'Organic search', value: 4580, isEstimated: false },
  { datetime: lineDate(2), series: 'Organic search', value: 4390, isEstimated: false },
  { datetime: lineDate(3), series: 'Organic search', value: 4820, isEstimated: false },
  { datetime: lineDate(4), series: 'Organic search', value: 5160, isEstimated: false },
  { datetime: lineDate(5), series: 'Organic search', value: 4970, isEstimated: false },
  { datetime: lineDate(6), series: 'Organic search', value: 5340, isEstimated: false },
  { datetime: lineDate(7), series: 'Organic search', value: 5610, isEstimated: true },
  { datetime: lineDate(8), series: 'Organic search', value: 5480, isEstimated: true },
  { datetime: lineDate(9), series: 'Organic search', value: 5890, isEstimated: true },
  { datetime: lineDate(0), series: 'Paid search', value: 2840, isEstimated: false },
  { datetime: lineDate(1), series: 'Paid search', value: 3120, isEstimated: false },
  { datetime: lineDate(2), series: 'Paid search', value: 3460, isEstimated: false },
  { datetime: lineDate(3), series: 'Paid search', value: 3210, isEstimated: false },
  { datetime: lineDate(4), series: 'Paid search', value: 3580, isEstimated: false },
  { datetime: lineDate(5), series: 'Paid search', value: 3920, isEstimated: false },
  { datetime: lineDate(6), series: 'Paid search', value: 3740, isEstimated: false },
  { datetime: lineDate(7), series: 'Paid search', value: 3410, isEstimated: true },
  { datetime: lineDate(8), series: 'Paid search', value: 3650, isEstimated: true },
  { datetime: lineDate(9), series: 'Paid search', value: 3880, isEstimated: true },
];

export const lineDualAxisData = [
  { datetime: lineDate(0), series: 'Visits', value: 4210 },
  { datetime: lineDate(1), series: 'Visits', value: 4580 },
  { datetime: lineDate(2), series: 'Visits', value: 4390 },
  { datetime: lineDate(3), series: 'Visits', value: 4820 },
  { datetime: lineDate(4), series: 'Visits', value: 5160 },
  { datetime: lineDate(5), series: 'Visits', value: 4970 },
  { datetime: lineDate(6), series: 'Visits', value: 5340 },
  { datetime: lineDate(7), series: 'Visits', value: 5610 },
  { datetime: lineDate(8), series: 'Visits', value: 5480 },
  { datetime: lineDate(9), series: 'Visits', value: 5890 },
  { datetime: lineDate(0), series: 'Purchases', value: 142 },
  { datetime: lineDate(1), series: 'Purchases', value: 138 },
  { datetime: lineDate(2), series: 'Purchases', value: 131 },
  { datetime: lineDate(3), series: 'Purchases', value: 127 },
  { datetime: lineDate(4), series: 'Purchases', value: 119 },
  { datetime: lineDate(5), series: 'Purchases', value: 114 },
  { datetime: lineDate(6), series: 'Purchases', value: 106 },
  { datetime: lineDate(7), series: 'Purchases', value: 101 },
  { datetime: lineDate(8), series: 'Purchases', value: 94 },
  { datetime: lineDate(9), series: 'Purchases', value: 88 },
];

export const lineWeekdayData = [
  { weekday: 'Mon', series: 'This week', value: 4820 },
  { weekday: 'Tue', series: 'This week', value: 5160 },
  { weekday: 'Wed', series: 'This week', value: 4970 },
  { weekday: 'Thu', series: 'This week', value: 5340 },
  { weekday: 'Fri', series: 'This week', value: 5610 },
  { weekday: 'Sat', series: 'This week', value: 3480 },
  { weekday: 'Sun', series: 'This week', value: 3190 },
  { weekday: 'Mon', series: 'Last week', value: 4410 },
  { weekday: 'Tue', series: 'Last week', value: 4690 },
  { weekday: 'Wed', series: 'Last week', value: 4820 },
  { weekday: 'Thu', series: 'Last week', value: 4750 },
  { weekday: 'Fri', series: 'Last week', value: 5020 },
  { weekday: 'Sat', series: 'Last week', value: 3260 },
  { weekday: 'Sun', series: 'Last week', value: 2980 },
];

export const lineSessionLengthData = [
  { minutes: 1, series: 'Desktop', value: 9200 },
  { minutes: 2, series: 'Desktop', value: 7400 },
  { minutes: 5, series: 'Desktop', value: 5100 },
  { minutes: 10, series: 'Desktop', value: 3300 },
  { minutes: 20, series: 'Desktop', value: 1800 },
  { minutes: 30, series: 'Desktop', value: 1100 },
  { minutes: 1, series: 'Mobile', value: 8100 },
  { minutes: 2, series: 'Mobile', value: 5900 },
  { minutes: 5, series: 'Mobile', value: 3400 },
  { minutes: 10, series: 'Mobile', value: 1900 },
  { minutes: 20, series: 'Mobile', value: 900 },
  { minutes: 30, series: 'Mobile', value: 500 },
];
