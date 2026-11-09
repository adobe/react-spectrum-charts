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
// Sample datasets for the Axis page; playground code prints these by name.

const imageUrl = 'https://opensource.adobe.com/react-spectrum-charts';

// Downloads by browser, with a logo URL for axis thumbnails.
export const axisBrowserData = [
  { browser: 'Chrome', downloads: 27000, thumbnail: `${imageUrl}/chrome.png` },
  { browser: 'Firefox', downloads: 8000, thumbnail: `${imageUrl}/firefox.png` },
  { browser: 'Safari', downloads: 7750, thumbnail: `${imageUrl}/safari.png` },
  { browser: 'Edge', downloads: 7600, thumbnail: `${imageUrl}/edge.png` },
  { browser: 'Explorer', downloads: 1000, thumbnail: `${imageUrl}/explorer.png` },
];

// Revenue by sales region, with long region names.
export const axisRevenueData = [
  { region: 'North America', revenue: 1284500 },
  { region: 'Europe', revenue: 942300 },
  { region: 'Asia Pacific', revenue: 615800 },
  { region: 'Latin America', revenue: 238400 },
  { region: 'Middle East and Africa', revenue: 129900 },
];

// Weekly conversion rate as a fraction, with a numeric week.
export const axisConversionData = [
  { week: 1, rate: 0.021 },
  { week: 2, rate: 0.024 },
  { week: 3, rate: 0.023 },
  { week: 4, rate: 0.028 },
  { week: 5, rate: 0.031 },
  { week: 6, rate: 0.029 },
  { week: 7, rate: 0.034 },
  { week: 8, rate: 0.036 },
  { week: 9, rate: 0.033 },
  { week: 10, rate: 0.038 },
];

// Average time on page in seconds.
export const axisDurationData = [
  { page: 'Home', seconds: 95 },
  { page: 'Pricing', seconds: 210 },
  { page: 'Docs', seconds: 1260 },
  { page: 'Tutorials', seconds: 3020 },
  { page: 'Webinars', seconds: 4410 },
];

// Daily visits for three weeks.
export const axisVisitsData = [
  { datetime: 1741003200000, visits: 2300 },
  { datetime: 1741089600000, visits: 2490 },
  { datetime: 1741176000000, visits: 2400 },
  { datetime: 1741262400000, visits: 2580 },
  { datetime: 1741348800000, visits: 2490 },
  { datetime: 1741435200000, visits: 1780 },
  { datetime: 1741521600000, visits: 1690 },
  { datetime: 1741608000000, visits: 2500 },
  { datetime: 1741694400000, visits: 2680 },
  { datetime: 1741780800000, visits: 2590 },
  { datetime: 1741867200000, visits: 2780 },
  { datetime: 1741953600000, visits: 2690 },
  { datetime: 1742040000000, visits: 1980 },
  { datetime: 1742126400000, visits: 1880 },
  { datetime: 1742212800000, visits: 2690 },
  { datetime: 1742299200000, visits: 2880 },
  { datetime: 1742385600000, visits: 2790 },
  { datetime: 1742472000000, visits: 2980 },
  { datetime: 1742558400000, visits: 2880 },
  { datetime: 1742644800000, visits: 2170 },
  { datetime: 1742731200000, visits: 2080 },
];

// Visits per minute for half an hour.
export const axisMinuteData = [
  { datetime: 1741014000000, visits: 42 },
  { datetime: 1741014060000, visits: 50 },
  { datetime: 1741014120000, visits: 56 },
  { datetime: 1741014180000, visits: 51 },
  { datetime: 1741014240000, visits: 55 },
  { datetime: 1741014300000, visits: 57 },
  { datetime: 1741014360000, visits: 47 },
  { datetime: 1741014420000, visits: 48 },
  { datetime: 1741014480000, visits: 48 },
  { datetime: 1741014540000, visits: 38 },
  { datetime: 1741014600000, visits: 41 },
  { datetime: 1741014660000, visits: 34 },
  { datetime: 1741014720000, visits: 40 },
  { datetime: 1741014780000, visits: 47 },
  { datetime: 1741014840000, visits: 44 },
  { datetime: 1741014900000, visits: 51 },
  { datetime: 1741014960000, visits: 58 },
  { datetime: 1741015020000, visits: 52 },
  { datetime: 1741015080000, visits: 56 },
  { datetime: 1741015140000, visits: 58 },
  { datetime: 1741015200000, visits: 48 },
  { datetime: 1741015260000, visits: 48 },
  { datetime: 1741015320000, visits: 38 },
  { datetime: 1741015380000, visits: 39 },
  { datetime: 1741015440000, visits: 42 },
  { datetime: 1741015500000, visits: 36 },
  { datetime: 1741015560000, visits: 42 },
  { datetime: 1741015620000, visits: 49 },
  { datetime: 1741015680000, visits: 45 },
  { datetime: 1741015740000, visits: 53 },
  { datetime: 1741015800000, visits: 59 },
];

// Hourly visits for a day and a half.
export const axisHourData = [
  { datetime: 1740981600000, visits: 40 },
  { datetime: 1740985200000, visits: 47 },
  { datetime: 1740988800000, visits: 41 },
  { datetime: 1740992400000, visits: 48 },
  { datetime: 1740996000000, visits: 42 },
  { datetime: 1740999600000, visits: 49 },
  { datetime: 1741003200000, visits: 43 },
  { datetime: 1741006800000, visits: 81 },
  { datetime: 1741010400000, visits: 104 },
  { datetime: 1741014000000, visits: 136 },
  { datetime: 1741017600000, visits: 149 },
  { datetime: 1741021200000, visits: 168 },
  { datetime: 1741024800000, visits: 166 },
  { datetime: 1741028400000, visits: 156 },
  { datetime: 1741032000000, visits: 151 },
  { datetime: 1741035600000, visits: 126 },
  { datetime: 1741039200000, visits: 108 },
  { datetime: 1741042800000, visits: 73 },
  { datetime: 1741046400000, visits: 49 },
  { datetime: 1741050000000, visits: 43 },
  { datetime: 1741053600000, visits: 50 },
  { datetime: 1741057200000, visits: 44 },
  { datetime: 1741060800000, visits: 51 },
  { datetime: 1741064400000, visits: 45 },
  { datetime: 1741068000000, visits: 52 },
  { datetime: 1741071600000, visits: 46 },
  { datetime: 1741075200000, visits: 40 },
  { datetime: 1741078800000, visits: 47 },
  { datetime: 1741082400000, visits: 41 },
  { datetime: 1741086000000, visits: 48 },
  { datetime: 1741089600000, visits: 42 },
  { datetime: 1741093200000, visits: 80 },
  { datetime: 1741096800000, visits: 103 },
  { datetime: 1741100400000, visits: 135 },
  { datetime: 1741104000000, visits: 148 },
  { datetime: 1741107600000, visits: 167 },
  { datetime: 1741111200000, visits: 165 },
];

// Weekly visits for a quarter.
export const axisWeekData = [
  { datetime: 1736164800000, visits: 15200 },
  { datetime: 1736769600000, visits: 16590 },
  { datetime: 1737374400000, visits: 17820 },
  { datetime: 1737979200000, visits: 17110 },
  { datetime: 1738584000000, visits: 17700 },
  { datetime: 1739188800000, visits: 17920 },
  { datetime: 1739793600000, visits: 16220 },
  { datetime: 1740398400000, visits: 16030 },
  { datetime: 1741003200000, visits: 15850 },
  { datetime: 1741608000000, visits: 14190 },
  { datetime: 1742212800000, visits: 14480 },
  { datetime: 1742817600000, visits: 13470 },
  { datetime: 1743422400000, visits: 14470 },
];

// Monthly visits for 18 months.
export const axisMonthData = [
  { datetime: 1704110400000, visits: 64000 },
  { datetime: 1706788800000, visits: 70310 },
  { datetime: 1709294400000, visits: 75990 },
  { datetime: 1711972800000, visits: 74130 },
  { datetime: 1714564800000, visits: 77300 },
  { datetime: 1717243200000, visits: 79100 },
  { datetime: 1719835200000, visits: 73380 },
  { datetime: 1722513600000, visits: 73520 },
  { datetime: 1725192000000, visits: 73710 },
  { datetime: 1727784000000, visits: 68160 },
  { datetime: 1730462400000, visits: 70180 },
  { datetime: 1733054400000, visits: 67190 },
  { datetime: 1735732800000, visits: 71970 },
  { datetime: 1738411200000, visits: 77810 },
  { datetime: 1740830400000, visits: 77750 },
  { datetime: 1743508800000, visits: 83990 },
  { datetime: 1746100800000, visits: 89500 },
  { datetime: 1748779200000, visits: 87410 },
];

// Quarterly visits for three years.
export const axisQuarterData = [
  { datetime: 1672574400000, visits: 190000 },
  { datetime: 1680350400000, visits: 206360 },
  { datetime: 1688212800000, visits: 221290 },
  { datetime: 1696161600000, visits: 218990 },
  { datetime: 1704110400000, visits: 228180 },
  { datetime: 1711972800000, visits: 234220 },
  { datetime: 1719835200000, visits: 223110 },
  { datetime: 1727784000000, visits: 225360 },
  { datetime: 1735732800000, visits: 227740 },
  { datetime: 1743508800000, visits: 216990 },
  { datetime: 1751371200000, visits: 223560 },
  { datetime: 1759320000000, visits: 218660 },
];

// Yearly visits.
export const axisYearData = [
  { datetime: 1546344000000, visits: 520000 },
  { datetime: 1577880000000, visits: 655000 },
  { datetime: 1609502400000, visits: 790000 },
  { datetime: 1641038400000, visits: 825000 },
  { datetime: 1672574400000, visits: 960000 },
  { datetime: 1704110400000, visits: 995000 },
  { datetime: 1735732800000, visits: 1130000 },
];
