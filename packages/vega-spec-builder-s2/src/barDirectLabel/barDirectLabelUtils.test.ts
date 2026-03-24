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
import { DIRECT_LABEL_BACKGROUND_STROKE_WIDTH, DIRECT_LABEL_FONT_WEIGHT, FILTERED_TABLE } from '@spectrum-charts/constants';
import { TextMark } from 'vega';

import { defaultBarOptions } from '../bar/barTestUtils';
import { BarDirectLabelSpecOptions } from '../types';
import { getBarDirectLabelMarks, getBarDirectLabelSpecOptions } from './barDirectLabelUtils';

const defaultSpecOptions: BarDirectLabelSpecOptions = getBarDirectLabelSpecOptions({}, 0, defaultBarOptions);

describe('getBarDirectLabelSpecOptions()', () => {
  it('inherits color, dimension, metric, orientation from bar options', () => {
    expect(defaultSpecOptions.barName).toBe(defaultBarOptions.name);
    expect(defaultSpecOptions.color).toBe(defaultBarOptions.color);
    expect(defaultSpecOptions.colorScheme).toBe(defaultBarOptions.colorScheme);
    expect(defaultSpecOptions.dimension).toBe(defaultBarOptions.dimension);
    expect(defaultSpecOptions.metric).toBe(defaultBarOptions.metric);
    expect(defaultSpecOptions.orientation).toBe(defaultBarOptions.orientation);
    expect(defaultSpecOptions.index).toBe(0);
  });
});


describe('getBarDirectLabelMarks()', () => {
  it('returns two marks: background halo and main text', () => {
    const marks = getBarDirectLabelMarks(defaultSpecOptions, defaultBarOptions);
    expect(marks).toHaveLength(2);
    expect(marks[0].type).toBe('text');
    expect(marks[1].type).toBe('text');
  });

  it('background mark has stroke halo with transparent fill', () => {
    const [bg] = getBarDirectLabelMarks(defaultSpecOptions, defaultBarOptions);
    const enter = (bg as TextMark).encode?.enter;
    expect(enter?.fill?.value).toBe('transparent');
    expect(enter?.stroke?.value).toBeDefined();
    expect(enter?.strokeWidth?.value).toBe(DIRECT_LABEL_BACKGROUND_STROKE_WIDTH);
  });

  it('main mark has colored fill and correct font weight', () => {
    const [, main] = getBarDirectLabelMarks(defaultSpecOptions, defaultBarOptions);
    const enter = (main as TextMark).encode?.enter;
    expect(enter?.fill).toBeDefined();
    expect(enter?.fontWeight?.value).toBe(DIRECT_LABEL_FONT_WEIGHT);
  });

  it('vertical bar: x uses xBand centered on dimension, y is a production rule', () => {
    const [, main] = getBarDirectLabelMarks(defaultSpecOptions, defaultBarOptions);
    const enter = (main as TextMark).encode?.enter;
    expect(enter?.x?.scale).toBe('xBand');
    expect(enter?.x?.band).toBe(0.5);
    expect(enter?.align?.value).toBe('center');
    expect(Array.isArray(enter?.y)).toBe(true);
    expect(Array.isArray(enter?.baseline)).toBe(true);
  });

  it('horizontal bar: y uses yBand centered on dimension, x is a production rule', () => {
    const hBarOptions = { ...defaultBarOptions, orientation: 'horizontal' as const };
    const hOptions = getBarDirectLabelSpecOptions({}, 0, hBarOptions);
    const [, main] = getBarDirectLabelMarks(hOptions, hBarOptions);
    const enter = (main as TextMark).encode?.enter;
    expect(enter?.y?.scale).toBe('yBand');
    expect(enter?.y?.band).toBe(0.5);
    expect(enter?.baseline?.value).toBe('middle');
    expect(Array.isArray(enter?.x)).toBe(true);
    expect(Array.isArray(enter?.align)).toBe(true);
  });

  it('marks are non-interactive', () => {
    const marks = getBarDirectLabelMarks(defaultSpecOptions, defaultBarOptions);
    expect(marks[0].interactive).toBe(false);
    expect(marks[1].interactive).toBe(false);
  });

  it('main mark has update.opacity; background mark does not', () => {
    const [bg, main] = getBarDirectLabelMarks(defaultSpecOptions, defaultBarOptions);
    expect((main as TextMark).encode?.update?.opacity).toBeDefined();
    expect((bg as TextMark).encode?.update).toBeUndefined();
  });

  it('marks source directly from FILTERED_TABLE', () => {
    const marks = getBarDirectLabelMarks(defaultSpecOptions, defaultBarOptions);
    expect((marks[0] as TextMark).from?.data).toBe(FILTERED_TABLE);
    expect((marks[1] as TextMark).from?.data).toBe(FILTERED_TABLE);
  });
});
