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

/** Daily sessions, orders, and conversion rate for one week, at noon UTC. */
export const comboTrafficData = [
  { datetime: 1772452800000, sessions: 4200, orders: 126, conversionRate: 0.03 },
  { datetime: 1772539200000, sessions: 4650, orders: 149, conversionRate: 0.032 },
  { datetime: 1772625600000, sessions: 5100, orders: 168, conversionRate: 0.033 },
  { datetime: 1772712000000, sessions: 4800, orders: 139, conversionRate: 0.029 },
  { datetime: 1772798400000, sessions: 5600, orders: 196, conversionRate: 0.035 },
  { datetime: 1772884800000, sessions: 3900, orders: 101, conversionRate: 0.026 },
  { datetime: 1772971200000, sessions: 3500, orders: 84, conversionRate: 0.024 },
];

/** Daily sessions and conversion rate by device for five days, at noon UTC. */
export const comboDeviceData = [
  { datetime: 1772452800000, device: 'Desktop', sessions: 2400, conversionRate: 0.034 },
  { datetime: 1772452800000, device: 'Mobile', sessions: 1500, conversionRate: 0.021 },
  { datetime: 1772452800000, device: 'Tablet', sessions: 300, conversionRate: 0.028 },
  { datetime: 1772539200000, device: 'Desktop', sessions: 2550, conversionRate: 0.036 },
  { datetime: 1772539200000, device: 'Mobile', sessions: 1700, conversionRate: 0.022 },
  { datetime: 1772539200000, device: 'Tablet', sessions: 400, conversionRate: 0.027 },
  { datetime: 1772625600000, device: 'Desktop', sessions: 2700, conversionRate: 0.037 },
  { datetime: 1772625600000, device: 'Mobile', sessions: 1900, conversionRate: 0.024 },
  { datetime: 1772625600000, device: 'Tablet', sessions: 500, conversionRate: 0.03 },
  { datetime: 1772712000000, device: 'Desktop', sessions: 2600, conversionRate: 0.033 },
  { datetime: 1772712000000, device: 'Mobile', sessions: 1800, conversionRate: 0.02 },
  { datetime: 1772712000000, device: 'Tablet', sessions: 400, conversionRate: 0.026 },
  { datetime: 1772798400000, device: 'Desktop', sessions: 2900, conversionRate: 0.039 },
  { datetime: 1772798400000, device: 'Mobile', sessions: 2200, conversionRate: 0.026 },
  { datetime: 1772798400000, device: 'Tablet', sessions: 500, conversionRate: 0.031 },
];
