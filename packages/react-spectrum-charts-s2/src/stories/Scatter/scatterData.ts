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

const DAY = 24 * 60 * 60 * 1000;
const RELEASE_START = Date.UTC(2025, 0, 6);

const releaseSamples: [number, number, string][] = [
  [0, 42, 'iOS'],
  [9, 35, 'iOS'],
  [21, 51, 'iOS'],
  [34, 28, 'iOS'],
  [48, 22, 'iOS'],
  [63, 30, 'iOS'],
  [4, 58, 'Android'],
  [15, 64, 'Android'],
  [27, 47, 'Android'],
  [41, 55, 'Android'],
  [55, 39, 'Android'],
  [70, 33, 'Android'],
  [7, 18, 'Web'],
  [24, 25, 'Web'],
  [38, 14, 'Web'],
  [60, 20, 'Web'],
];

export const releaseBugReportsData = releaseSamples.map(([dayOffset, bugReports, platform]) => ({
  datetime: RELEASE_START + dayOffset * DAY,
  bugReports,
  platform,
}));

export const productTrajectoryData = [
  { product: 'Analytics', year: 2021, marketShare: 12, growth: 18 },
  { product: 'Analytics', year: 2022, marketShare: 15, growth: 22 },
  { product: 'Analytics', year: 2023, marketShare: 19, growth: 17 },
  { product: 'Analytics', year: 2024, marketShare: 21, growth: 11 },
  { product: 'Commerce', year: 2021, marketShare: 24, growth: 6 },
  { product: 'Commerce', year: 2022, marketShare: 23, growth: 3 },
  { product: 'Commerce', year: 2023, marketShare: 25, growth: 8 },
  { product: 'Commerce', year: 2024, marketShare: 27, growth: 9 },
  { product: 'Messaging', year: 2021, marketShare: 5, growth: 30 },
  { product: 'Messaging', year: 2022, marketShare: 8, growth: 26 },
  { product: 'Messaging', year: 2023, marketShare: 10, growth: 14 },
  { product: 'Messaging', year: 2024, marketShare: 11, growth: 7 },
  { product: 'Storage', year: 2021, marketShare: 17, growth: -2 },
  { product: 'Storage', year: 2022, marketShare: 16, growth: 1 },
  { product: 'Storage', year: 2023, marketShare: 14, growth: -4 },
  { product: 'Storage', year: 2024, marketShare: 13, growth: -6 },
];
