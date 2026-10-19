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

// Sample datasets; playground code prints these by name.

export const bulletScoreData = [
  { kpi: 'Satisfaction', score: 82, goal: 90 },
  { kpi: 'Retention', score: 74, goal: 70 },
  { kpi: 'Task success', score: 58, goal: 75 },
];

export const bulletScoreThresholds = [
  { thresholdMax: 60, fill: 'rgb(234, 56, 41)' },
  { thresholdMin: 60, thresholdMax: 80, fill: 'rgb(249, 137, 23)' },
  { thresholdMin: 80, fill: 'rgb(21, 164, 110)' },
];

export const bulletRevenueData = [
  { region: 'Americas', revenue: 4215000, target: 4000000 },
  { region: 'EMEA', revenue: 2930000, target: 3500000 },
  { region: 'APAC', revenue: 1785000, target: 2200000 },
];

export const bulletStorageData = [
  { volume: 'Primary', used: 750, usedLabel: '750 GB', quota: 1000, quotaLabel: '1 TB' },
  { volume: 'Backups', used: 420, usedLabel: '420 GB', quota: 500, quotaLabel: '500 GB' },
  { volume: 'Archive', used: 1200, usedLabel: '1.2 TB', quota: 1500, quotaLabel: '1.5 TB' },
];
