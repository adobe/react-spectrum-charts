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
import { View, expressionFunction, parse } from 'vega';

import { buildSpec } from '../chartSpecBuilder.js';
import { getExpressionFunctions } from '../expressionFunctions/index.js';

test('sorts forecast flags by a custom temporal dimension', async () => {
  Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
  expressionFunction('rscContainerWidth', () => 400);
  const rows = [0, 1, 2, 3].map((index) => ({
    timestamp: 1000 + index * 1000,
    value: index < 2 ? index + 10 : null,
    forecast: index >= 2 ? index + 10 : null,
  }));
  const spec = buildSpec({
    data: rows,
    animations: false,
    marks: [{ markType: 'line', dimension: 'timestamp', forecasts: [{ metric: 'forecast', start: 3000 }] }],
  });
  const view = new View(parse(spec), { renderer: 'none' }).insert('table', rows);
  try {
    await view.width(400).height(240).runAsync();
    expect(view.data('table').map((row) => row.line0_alternateFlag)).toEqual([false, false, true, true]);
    expect(view.data('line0_segmented').map((row) => row.line0_segmentId)).toEqual([0, 0, 1, 1]);
    const markup = await view.toSVG();
    expect(markup).not.toMatch(/NaN|undefined/);
    const svg = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const paths = [...svg.querySelectorAll('.mark-line.line0 path')];
    expect(paths).toHaveLength(2);
    expect(paths[1].getAttribute('stroke-dasharray')).toBeTruthy();
  } finally {
    view.finalize();
  }
});
