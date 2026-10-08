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

// weekly website sessions by acquisition channel; stackOrder puts the spiky email channel on top
export const sessionsByChannelData = [
  { datetime: 1736121600000, sessions: 4200, channel: 'Organic search', stackOrder: 1 },
  { datetime: 1736726400000, sessions: 4350, channel: 'Organic search', stackOrder: 1 },
  { datetime: 1737331200000, sessions: 4480, channel: 'Organic search', stackOrder: 1 },
  { datetime: 1737936000000, sessions: 4400, channel: 'Organic search', stackOrder: 1 },
  { datetime: 1738540800000, sessions: 4620, channel: 'Organic search', stackOrder: 1 },
  { datetime: 1739145600000, sessions: 4810, channel: 'Organic search', stackOrder: 1 },
  { datetime: 1739750400000, sessions: 4760, channel: 'Organic search', stackOrder: 1 },
  { datetime: 1740355200000, sessions: 4950, channel: 'Organic search', stackOrder: 1 },
  { datetime: 1740960000000, sessions: 5120, channel: 'Organic search', stackOrder: 1 },
  { datetime: 1741564800000, sessions: 5080, channel: 'Organic search', stackOrder: 1 },
  { datetime: 1742169600000, sessions: 5310, channel: 'Organic search', stackOrder: 1 },
  { datetime: 1742774400000, sessions: 5460, channel: 'Organic search', stackOrder: 1 },
  { datetime: 1736121600000, sessions: 2600, channel: 'Paid search', stackOrder: 2 },
  { datetime: 1736726400000, sessions: 2750, channel: 'Paid search', stackOrder: 2 },
  { datetime: 1737331200000, sessions: 2900, channel: 'Paid search', stackOrder: 2 },
  { datetime: 1737936000000, sessions: 3400, channel: 'Paid search', stackOrder: 2 },
  { datetime: 1738540800000, sessions: 3650, channel: 'Paid search', stackOrder: 2 },
  { datetime: 1739145600000, sessions: 3300, channel: 'Paid search', stackOrder: 2 },
  { datetime: 1739750400000, sessions: 3100, channel: 'Paid search', stackOrder: 2 },
  { datetime: 1740355200000, sessions: 2950, channel: 'Paid search', stackOrder: 2 },
  { datetime: 1740960000000, sessions: 3050, channel: 'Paid search', stackOrder: 2 },
  { datetime: 1741564800000, sessions: 3200, channel: 'Paid search', stackOrder: 2 },
  { datetime: 1742169600000, sessions: 3350, channel: 'Paid search', stackOrder: 2 },
  { datetime: 1742774400000, sessions: 3500, channel: 'Paid search', stackOrder: 2 },
  { datetime: 1736121600000, sessions: 1200, channel: 'Email', stackOrder: 4 },
  { datetime: 1736726400000, sessions: 1850, channel: 'Email', stackOrder: 4 },
  { datetime: 1737331200000, sessions: 1150, channel: 'Email', stackOrder: 4 },
  { datetime: 1737936000000, sessions: 1250, channel: 'Email', stackOrder: 4 },
  { datetime: 1738540800000, sessions: 1900, channel: 'Email', stackOrder: 4 },
  { datetime: 1739145600000, sessions: 1180, channel: 'Email', stackOrder: 4 },
  { datetime: 1739750400000, sessions: 1300, channel: 'Email', stackOrder: 4 },
  { datetime: 1740355200000, sessions: 2050, channel: 'Email', stackOrder: 4 },
  { datetime: 1740960000000, sessions: 1250, channel: 'Email', stackOrder: 4 },
  { datetime: 1741564800000, sessions: 1350, channel: 'Email', stackOrder: 4 },
  { datetime: 1742169600000, sessions: 2100, channel: 'Email', stackOrder: 4 },
  { datetime: 1742774400000, sessions: 1400, channel: 'Email', stackOrder: 4 },
  { datetime: 1736121600000, sessions: 900, channel: 'Social', stackOrder: 3 },
  { datetime: 1736726400000, sessions: 950, channel: 'Social', stackOrder: 3 },
  { datetime: 1737331200000, sessions: 1020, channel: 'Social', stackOrder: 3 },
  { datetime: 1737936000000, sessions: 1100, channel: 'Social', stackOrder: 3 },
  { datetime: 1738540800000, sessions: 1080, channel: 'Social', stackOrder: 3 },
  { datetime: 1739145600000, sessions: 1150, channel: 'Social', stackOrder: 3 },
  { datetime: 1739750400000, sessions: 1240, channel: 'Social', stackOrder: 3 },
  { datetime: 1740355200000, sessions: 1300, channel: 'Social', stackOrder: 3 },
  { datetime: 1740960000000, sessions: 1280, channel: 'Social', stackOrder: 3 },
  { datetime: 1741564800000, sessions: 1360, channel: 'Social', stackOrder: 3 },
  { datetime: 1742169600000, sessions: 1420, channel: 'Social', stackOrder: 3 },
  { datetime: 1742774400000, sessions: 1500, channel: 'Social', stackOrder: 3 },
];

// daily high/low temperatures for one city
export const dailyTemperatureData = [
  { datetime: 1740787200000, high: 58, low: 41, series: 'Daily range' },
  { datetime: 1740873600000, high: 61, low: 43, series: 'Daily range' },
  { datetime: 1740960000000, high: 64, low: 46, series: 'Daily range' },
  { datetime: 1741046400000, high: 60, low: 44, series: 'Daily range' },
  { datetime: 1741132800000, high: 55, low: 38, series: 'Daily range' },
  { datetime: 1741219200000, high: 52, low: 35, series: 'Daily range' },
  { datetime: 1741305600000, high: 57, low: 39, series: 'Daily range' },
  { datetime: 1741392000000, high: 63, low: 44, series: 'Daily range' },
  { datetime: 1741478400000, high: 68, low: 49, series: 'Daily range' },
  { datetime: 1741564800000, high: 71, low: 52, series: 'Daily range' },
  { datetime: 1741651200000, high: 69, low: 51, series: 'Daily range' },
  { datetime: 1741737600000, high: 66, low: 47, series: 'Daily range' },
  { datetime: 1741824000000, high: 62, low: 45, series: 'Daily range' },
  { datetime: 1741910400000, high: 65, low: 46, series: 'Daily range' },
];

// cumulative installs sampled at uneven intervals after launch
export const installsSinceLaunchData = [
  { daysSinceLaunch: 1, installs: 1200, platform: 'iOS' },
  { daysSinceLaunch: 2, installs: 1850, platform: 'iOS' },
  { daysSinceLaunch: 3, installs: 2300, platform: 'iOS' },
  { daysSinceLaunch: 7, installs: 3100, platform: 'iOS' },
  { daysSinceLaunch: 14, installs: 3900, platform: 'iOS' },
  { daysSinceLaunch: 30, installs: 4600, platform: 'iOS' },
  { daysSinceLaunch: 60, installs: 5200, platform: 'iOS' },
  { daysSinceLaunch: 90, installs: 5600, platform: 'iOS' },
  { daysSinceLaunch: 1, installs: 900, platform: 'Android' },
  { daysSinceLaunch: 2, installs: 1500, platform: 'Android' },
  { daysSinceLaunch: 3, installs: 2050, platform: 'Android' },
  { daysSinceLaunch: 7, installs: 2900, platform: 'Android' },
  { daysSinceLaunch: 14, installs: 3700, platform: 'Android' },
  { daysSinceLaunch: 30, installs: 4500, platform: 'Android' },
  { daysSinceLaunch: 60, installs: 5300, platform: 'Android' },
  { daysSinceLaunch: 90, installs: 5900, platform: 'Android' },
];
