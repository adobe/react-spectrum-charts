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
// Sample datasets for the Area page; playground code prints these by name.

export const channelSessionsData = [
  { datetime: 1736164800000, channel: 'Organic search', sessions: 4200, stackOrder: 3 },
  { datetime: 1736769600000, channel: 'Organic search', sessions: 4350, stackOrder: 3 },
  { datetime: 1737374400000, channel: 'Organic search', sessions: 4480, stackOrder: 3 },
  { datetime: 1737979200000, channel: 'Organic search', sessions: 4400, stackOrder: 3 },
  { datetime: 1738584000000, channel: 'Organic search', sessions: 4620, stackOrder: 3 },
  { datetime: 1739188800000, channel: 'Organic search', sessions: 4810, stackOrder: 3 },
  { datetime: 1739793600000, channel: 'Organic search', sessions: 4760, stackOrder: 3 },
  { datetime: 1740398400000, channel: 'Organic search', sessions: 4950, stackOrder: 3 },
  { datetime: 1736164800000, channel: 'Paid search', sessions: 2600, stackOrder: 2 },
  { datetime: 1736769600000, channel: 'Paid search', sessions: 2750, stackOrder: 2 },
  { datetime: 1737374400000, channel: 'Paid search', sessions: 2900, stackOrder: 2 },
  { datetime: 1737979200000, channel: 'Paid search', sessions: 3400, stackOrder: 2 },
  { datetime: 1738584000000, channel: 'Paid search', sessions: 3650, stackOrder: 2 },
  { datetime: 1739188800000, channel: 'Paid search', sessions: 3300, stackOrder: 2 },
  { datetime: 1739793600000, channel: 'Paid search', sessions: 3100, stackOrder: 2 },
  { datetime: 1740398400000, channel: 'Paid search', sessions: 2950, stackOrder: 2 },
  { datetime: 1736164800000, channel: 'Email', sessions: 1200, stackOrder: 1 },
  { datetime: 1736769600000, channel: 'Email', sessions: 1850, stackOrder: 1 },
  { datetime: 1737374400000, channel: 'Email', sessions: 1150, stackOrder: 1 },
  { datetime: 1737979200000, channel: 'Email', sessions: 1250, stackOrder: 1 },
  { datetime: 1738584000000, channel: 'Email', sessions: 1900, stackOrder: 1 },
  { datetime: 1739188800000, channel: 'Email', sessions: 1180, stackOrder: 1 },
  { datetime: 1739793600000, channel: 'Email', sessions: 1300, stackOrder: 1 },
  { datetime: 1740398400000, channel: 'Email', sessions: 2050, stackOrder: 1 },
];

export const temperatureData = [
  { datetime: 1740830400000, city: 'Seattle', low: 41, high: 52 },
  { datetime: 1740916800000, city: 'Seattle', low: 43, high: 55 },
  { datetime: 1741003200000, city: 'Seattle', low: 44, high: 57 },
  { datetime: 1741089600000, city: 'Seattle', low: 42, high: 53 },
  { datetime: 1741176000000, city: 'Seattle', low: 40, high: 50 },
  { datetime: 1741262400000, city: 'Seattle', low: 39, high: 51 },
  { datetime: 1741348800000, city: 'Seattle', low: 42, high: 56 },
  { datetime: 1740830400000, city: 'Denver', low: 28, high: 54 },
  { datetime: 1740916800000, city: 'Denver', low: 31, high: 60 },
  { datetime: 1741003200000, city: 'Denver', low: 35, high: 64 },
  { datetime: 1741089600000, city: 'Denver', low: 30, high: 49 },
  { datetime: 1741176000000, city: 'Denver', low: 24, high: 41 },
  { datetime: 1741262400000, city: 'Denver', low: 27, high: 52 },
  { datetime: 1741348800000, city: 'Denver', low: 33, high: 61 },
];

export const temperatureGapData = [
  { datetime: 1740830400000, low: 41, high: 52 },
  { datetime: 1740916800000, low: 43, high: 55 },
  { datetime: 1741003200000, low: undefined, high: undefined },
  { datetime: 1741089600000, low: 42, high: 53 },
  { datetime: 1741176000000, low: 40, high: 50 },
  { datetime: 1741262400000, low: undefined, high: undefined },
  { datetime: 1741348800000, low: 42, high: 56 },
  { datetime: 1741435200000, low: 44, high: 58 },
];

export const forecastData = [
  { datetime: 1736164800000, visits: 8000, low: 7040, high: 8960 },
  { datetime: 1736769600000, visits: 8950, low: 7880, high: 10020 },
  { datetime: 1737374400000, visits: 8530, low: 7510, high: 9550 },
  { datetime: 1737979200000, visits: 9050, low: 7960, high: 10140 },
  { datetime: 1738584000000, visits: 10170, low: 8950, high: 11390 },
  { datetime: 1739188800000, visits: 9290, low: 8180, high: 10400 },
  { datetime: 1739793600000, visits: 9160, low: 8060, high: 10260 },
  { datetime: 1740398400000, visits: 9950, low: 8760, high: 11140 },
  { datetime: 1741003200000, visits: 9420, low: 8290, high: 10550 },
  { datetime: 1741608000000, visits: 9630, low: 8470, high: 10790 },
];

export const installsData = [
  { day: 1, platform: 'iOS', installs: 1200 },
  { day: 2, platform: 'iOS', installs: 1850 },
  { day: 3, platform: 'iOS', installs: 2300 },
  { day: 7, platform: 'iOS', installs: 3100 },
  { day: 14, platform: 'iOS', installs: 3900 },
  { day: 30, platform: 'iOS', installs: 4600 },
  { day: 1, platform: 'Android', installs: 900 },
  { day: 2, platform: 'Android', installs: 1500 },
  { day: 3, platform: 'Android', installs: 2100 },
  { day: 7, platform: 'Android', installs: 2900 },
  { day: 14, platform: 'Android', installs: 3500 },
  { day: 30, platform: 'Android', installs: 4300 },
];

export const weekdayVisitsData = [
  { day: 'Mon', device: 'Desktop', visits: 5200 },
  { day: 'Tue', device: 'Desktop', visits: 5600 },
  { day: 'Wed', device: 'Desktop', visits: 5400 },
  { day: 'Thu', device: 'Desktop', visits: 5800 },
  { day: 'Fri', device: 'Desktop', visits: 5100 },
  { day: 'Sat', device: 'Desktop', visits: 2300 },
  { day: 'Sun', device: 'Desktop', visits: 2100 },
  { day: 'Mon', device: 'Mobile', visits: 3100 },
  { day: 'Tue', device: 'Mobile', visits: 3300 },
  { day: 'Wed', device: 'Mobile', visits: 3200 },
  { day: 'Thu', device: 'Mobile', visits: 3500 },
  { day: 'Fri', device: 'Mobile', visits: 3900 },
  { day: 'Sat', device: 'Mobile', visits: 4800 },
  { day: 'Sun', device: 'Mobile', visits: 4600 },
];
