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
import { expressionFunctions as s1 } from '../../../vega-spec-builder/src/expressionFunctions/expressionFunctions.js';
import { getLegendColumnLayout, getLegendColumnLayoutForPage, getLegendPages, wrapLabelText } from './legendLayout.js';

test.each([140, 200, 420, 800])('matches S1 page boundaries and rendered columns at %ipx', (width) => {
  const items = Array.from({ length: 25 }, (_, index) => {
    const displayLabel =
      index === 11 ? 'International marketing campaigns and paid search revenue' : `Category ${index}`;
    return {
      entryKey: String(index),
      legendIndex: index + 1,
      displayLabel,
      labelWidth: s1.getLabelWidth(displayLabel, 'normal', 14),
    };
  });
  const pages = getLegendPages(items, width, [5, 3], 2, 3);
  expect(pages).toEqual(s1.getLegendPages(items, width, [5, 3], 2, 3));
  expect(getLegendColumnLayout(items, width, [5, 3], 3)).toEqual(s1.getLegendColumnLayout(items, width, [5, 3], 3));
  for (const page of pages) {
    const visible = items.slice(page.start, page.end + 1);
    expect(getLegendColumnLayoutForPage(visible, items, pages, [5, 3], width, 3)).toEqual(
      s1.getLegendColumnLayoutForPage(visible, items, pages, [5, 3], width, 3)
    );
    expect(visible.length).toBeLessThanOrEqual(page.columns * 2);
  }
});

test.each(['Revenue from paid search and marketing campaigns', 'OneUnbrokenLabelThatExceedsTheColumnWidth'])(
  'matches S1 three-line wrapping and truncation for %s',
  (label) => {
    for (const width of [12, 30, 80])
      expect(wrapLabelText(label, width, 3)).toEqual(s1.wrapLabelText(label, width, 3, 'normal', 14));
  }
);
