/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { COLOR_SCALE, HIGHLIGHTED_ITEM, TABLE } from '@spectrum-charts/constants';

import { defaultSignals } from '../specTestUtils';
import { initializeSpec } from '../specUtils';
import { addData, addMarks, addScales, addSignals, addVenn } from './vennSpecBuilder';
import { defaultVennOptions, data as vennData } from './vennTestUtils';

describe('addData', () => {
  test('should add data correctly to tables circles, intersections and table', () => {
    const data = addData(initializeSpec({}, { data: vennData }).data ?? [], defaultVennOptions);

    expect(data).toHaveLength(4);
    expect(data[0].transform).toHaveLength(3);
    expect(data[0].transform?.[1]).toHaveProperty('type', 'formula');
    expect(data[0].transform?.[1]).toHaveProperty('as', 'set_id');
    expect(data[0].transform?.[2]).toHaveProperty('as', 'set_legend');

    expect(data[2].transform).toHaveLength(5);

    expect(data[2].transform?.[0]).toHaveProperty('type', 'lookup');
    expect(data[2].transform?.[0]).toHaveProperty('key', 'set_id');
    expect(data[2].transform?.[0]).toHaveProperty('from', TABLE);

    expect(data[2].transform?.[3]).toHaveProperty('type', 'formula');
    expect(data[2].transform?.[3]).toHaveProperty('as', 'strokeSize');

    expect(data[2].transform?.[4]).toHaveProperty('type', 'filter');

    expect(data[3].transform).toHaveLength(3);
    expect(data[3].transform?.[0]).toHaveProperty('type', 'lookup');
    expect(data[3].transform?.[0]).toHaveProperty('key', 'set_id');
    expect(data[3].transform?.[0]).toHaveProperty('from', TABLE);
  });
});

describe('addSignal', () => {
  test('should add hover events when tooltip is present', () => {
    const signals = addSignals(defaultSignals, {
      ...defaultVennOptions,
      chartTooltips: [{}],
    });

    expect(signals).toHaveLength(defaultSignals.length);
    expect(signals[0]).toHaveProperty('name', HIGHLIGHTED_ITEM);
    expect(signals[0].on).toHaveLength(4);
    expect(signals[0].on?.[0]).toHaveProperty('events', '@venn:mouseover');
    expect(signals[0].on?.[1]).toHaveProperty('events', '@venn:mouseout');
    expect(signals[0].on?.[2]).toHaveProperty('events', '@venn_intersections:mouseover');
    expect(signals[0].on?.[3]).toHaveProperty('events', '@venn_intersections:mouseout');
  });
});

describe('addScales', () => {
  test('should add scales', () => {
    const scales = addScales([]);
    expect(scales).toHaveLength(1);
    expect(scales[0]).toHaveProperty('name', COLOR_SCALE);
  });
});

describe('donuteSpecBuilder', () => {
  test('should add venn correctly', () => {
    const props = defaultVennOptions;
    const spec = { data: [{ name: TABLE }], usermeta: {} };
    const result = addVenn(spec, props);

    const expectedSpec = {
      data: addData(spec.data ?? [], props),
      scales: addScales([]),
      marks: addMarks([], props),
      signals: addSignals([], props),
      usermeta: {},
    };

    expect(result).toEqual(expectedSpec);
  });
});
