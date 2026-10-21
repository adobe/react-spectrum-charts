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

export const browserData = [
  { count: 10390, browser: 'Chrome' },
  { count: 8281, browser: 'Firefox' },
  { count: 7045, browser: 'Safari' },
  { count: 6166, browser: 'Opera' },
  { count: 4201, browser: 'Other' },
];

export const browserLongTailData = [
  { count: 10390, browser: 'Chrome' },
  { count: 8281, browser: 'Firefox' },
  { count: 7045, browser: 'Safari' },
  { count: 6166, browser: 'Opera' },
  { count: 4201, browser: 'Other' },
  { count: 3261, browser: 'Brave' },
  { count: 1021, browser: 'Unknown' },
];

export const booleanData = [
  { id: 'Success', value: 0.68 },
  { id: 'Failure', value: 0.32 },
];

export const surveyData = [
  { response: 'Strongly agree', count: 18 },
  { response: 'Agree', count: 32 },
  { response: 'Neutral', count: 24 },
  { response: 'Disagree', count: 16 },
  { response: 'Strongly disagree', count: 10 },
];

export const browserLabelData = [
  { count: 10390, browser: 'Chrome', label: 'Chrome' },
  { count: 8281, browser: 'Firefox', label: 'Mozilla Firefox' },
  { count: 7045, browser: 'Safari', label: 'Apple Safari' },
  { count: 6166, browser: 'Opera', label: 'Opera' },
  { count: 4201, browser: 'Other', label: 'Other browsers' },
];

export const zeroData = [
  { count: 0, browser: 'Chrome' },
  { count: 0, browser: 'Firefox' },
  { count: 0, browser: 'Safari' },
];

export const emptyData: Record<string, unknown>[] = [];
