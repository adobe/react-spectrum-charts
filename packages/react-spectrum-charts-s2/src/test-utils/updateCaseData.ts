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

/** Rows with a field for every prop the update class tests set. */
export const updateCaseData = [
  { id: 1, datetime: 1, x: 10, value: 3, value2: 30, valueLow: 2, valueHigh: 4, series: 'a', region: 'east', estimated: false, isStatic: true, displayValue: '3!', category: 'A' },
  { id: 2, datetime: 2, x: 20, value: 5, value2: 10, valueLow: 4, valueHigh: 6, series: 'a', region: 'west', estimated: true, isStatic: false, displayValue: '5!', category: 'B' },
  { id: 3, datetime: 3, x: 30, value: 4, value2: 20, valueLow: 3, valueHigh: 5, series: 'a', region: 'east', estimated: true, isStatic: false, displayValue: '4!', category: 'C' },
  { id: 4, datetime: 1, x: 10, value: 2, value2: 25, valueLow: 1, valueHigh: 3, series: 'b', region: 'west', estimated: false, isStatic: false, displayValue: '2!', category: 'A' },
  { id: 5, datetime: 2, x: 20, value: 4, value2: 15, valueLow: 3, valueHigh: 5, series: 'b', region: 'east', estimated: true, isStatic: true, displayValue: '4!', category: 'B' },
  { id: 6, datetime: 3, x: 30, value: 6, value2: 5, valueLow: 5, valueHigh: 7, series: 'b', region: 'west', estimated: true, isStatic: false, displayValue: '6!', category: 'C' },
];

/** Does nothing; stands in for a callback prop. */
export const noopCallback = () => undefined;
