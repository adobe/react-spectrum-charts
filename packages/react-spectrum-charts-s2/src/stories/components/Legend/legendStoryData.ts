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

const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(2025, i, 1).getTime());

// Monthly sessions (thousands) per traffic source, Jan–Dec 2025.
const SESSIONS_BY_SOURCE: Record<string, number[]> = {
  'Organic search': [182, 176, 191, 198, 205, 199, 188, 194, 212, 226, 248, 271],
  'Paid search': [121, 118, 134, 129, 142, 151, 147, 139, 156, 168, 189, 214],
  Social: [64, 71, 69, 78, 84, 92, 97, 94, 88, 91, 103, 118],
  Email: [48, 52, 57, 51, 55, 49, 44, 47, 61, 66, 82, 97],
  Referral: [22, 24, 23, 27, 26, 29, 31, 30, 28, 33, 36, 41],
};

export const trafficSources = Object.keys(SESSIONS_BY_SOURCE);

export const trafficBySourceData = trafficSources.flatMap((source) =>
  SESSIONS_BY_SOURCE[source].map((sessions, i) => ({ datetime: MONTHS[i], source, sessions: sessions * 1000 }))
);

// Monthly revenue ($K) per region for this year and last year.
const REVENUE_BY_REGION: Record<string, Record<string, number[]>> = {
  Americas: {
    'This year': [412, 398, 436, 451, 468, 472, 459, 481, 503, 522, 574, 611],
    'Last year': [371, 366, 389, 402, 414, 421, 409, 428, 446, 461, 502, 538],
  },
  EMEA: {
    'This year': [286, 279, 301, 309, 322, 318, 297, 289, 331, 347, 372, 398],
    'Last year': [262, 255, 271, 283, 291, 288, 271, 266, 298, 309, 331, 352],
  },
  APAC: {
    'This year': [174, 181, 192, 199, 208, 216, 221, 229, 238, 246, 263, 279],
    'Last year': [151, 156, 162, 171, 176, 182, 189, 193, 201, 207, 219, 231],
  },
};

export const revenueByRegionAndPeriodData = Object.entries(REVENUE_BY_REGION).flatMap(([region, periods]) =>
  Object.entries(periods).flatMap(([period, values]) =>
    values.map((revenue, i) => ({ datetime: MONTHS[i], region, period, revenue: revenue * 1000 }))
  )
);
