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
import { BACKGROUND_COLOR, DIRECT_LABEL_BACKGROUND_STROKE_WIDTH, DIRECT_LABEL_FONT_WEIGHT, FILTERED_TABLE } from '@spectrum-charts/constants';
import { TextMark } from 'vega';

import { defaultBarOptions } from '../bar/barTestUtils';
import { BarDirectLabelSpecOptions } from '../types';
import { getBarDirectLabelMarks, getBarDirectLabelPositionEncodings, getBarDirectLabelSpecOptions } from './barDirectLabelUtils';

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

  it('defaults position to end-outside when not provided', () => {
    expect(defaultSpecOptions.position).toBe('end-outside');
  });

  it('respects a provided position', () => {
    const options = getBarDirectLabelSpecOptions({ position: 'middle' }, 0, defaultBarOptions);
    expect(options.position).toBe('middle');
  });
});


const mockSeriesFill = { scale: 'color', field: 'series' };

describe('getBarDirectLabelPositionEncodings()', () => {
  describe('end-outside', () => {
    it('vertical: offsets label away from bar tip, fill uses series color', () => {
      const { metricAxisEncoding, seriesFill } = getBarDirectLabelPositionEncodings('end-outside', true, 'value', 'y', mockSeriesFill);
      expect(Array.isArray(metricAxisEncoding)).toBe(true);
      const [neg, pos] = metricAxisEncoding as { offset: number }[];
      expect(neg.offset).toBeGreaterThan(0); // negative bar: label below
      expect(pos.offset).toBeLessThan(0);    // positive bar: label above
      expect(seriesFill).toBe(mockSeriesFill);
    });

    it('horizontal: offsets label away from bar tip, fill uses series color', () => {
      const { metricAxisEncoding, seriesFill } = getBarDirectLabelPositionEncodings('end-outside', false, 'value', 'x', mockSeriesFill);
      expect(Array.isArray(metricAxisEncoding)).toBe(true);
      const [neg, pos] = metricAxisEncoding as { offset: number }[];
      expect(neg.offset).toBeLessThan(0); // negative bar: label to the left
      expect(pos.offset).toBeGreaterThan(0); // positive bar: label to the right
      expect(seriesFill).toBe(mockSeriesFill);
    });

    it('baseline points away from bar (top for negative, bottom for positive)', () => {
      const { verticalBaseline } = getBarDirectLabelPositionEncodings('end-outside', true, 'value', 'y', mockSeriesFill);
      expect(Array.isArray(verticalBaseline)).toBe(true);
      const [neg, pos] = verticalBaseline as { value: string }[];
      expect(neg.value).toBe('top');
      expect(pos.value).toBe('bottom');
    });
  });

  describe('end', () => {
    it('vertical: offsets label inward from bar tip, fill uses background color', () => {
      const { metricAxisEncoding, seriesFill } = getBarDirectLabelPositionEncodings('end', true, 'value', 'y', mockSeriesFill);
      expect(Array.isArray(metricAxisEncoding)).toBe(true);
      const [neg, pos] = metricAxisEncoding as { offset: number }[];
      expect(neg.offset).toBeLessThan(0); // negative bar: label offset upward (inward)
      expect(pos.offset).toBeGreaterThan(0); // positive bar: label offset downward (inward)
      expect(seriesFill).toHaveProperty('signal', BACKGROUND_COLOR);
    });

    it('baseline points toward bar interior (bottom for negative, top for positive)', () => {
      const { verticalBaseline } = getBarDirectLabelPositionEncodings('end', true, 'value', 'y', mockSeriesFill);
      const [neg, pos] = verticalBaseline as { value: string }[];
      expect(neg.value).toBe('bottom');
      expect(pos.value).toBe('top');
    });

    it('anchors to the bar tip (field: metric)', () => {
      const { metricAxisEncoding } = getBarDirectLabelPositionEncodings('end', true, 'value', 'y', mockSeriesFill);
      const [, pos] = metricAxisEncoding as { field?: string }[];
      expect(pos.field).toBe('value');
    });
  });

  describe('start', () => {
    it('anchors to the bar baseline (value: 0), fill uses background color', () => {
      const { metricAxisEncoding, seriesFill } = getBarDirectLabelPositionEncodings('start', true, 'value', 'y', mockSeriesFill);
      expect(Array.isArray(metricAxisEncoding)).toBe(true);
      const [, pos] = metricAxisEncoding as { value?: number; field?: string }[];
      expect(pos.value).toBe(0);
      expect(pos.field).toBeUndefined();
      expect(seriesFill).toHaveProperty('signal', BACKGROUND_COLOR);
    });

    it('baseline points away from baseline edge (same as end-outside)', () => {
      const { verticalBaseline } = getBarDirectLabelPositionEncodings('start', true, 'value', 'y', mockSeriesFill);
      const [neg, pos] = verticalBaseline as { value: string }[];
      expect(neg.value).toBe('top');
      expect(pos.value).toBe('bottom');
    });
  });

  describe('middle', () => {
    it('returns a signal expression for the midpoint, fill uses background color', () => {
      const { metricAxisEncoding, seriesFill, verticalBaseline, horizontalAlign } = getBarDirectLabelPositionEncodings('middle', true, 'value', 'y', mockSeriesFill);
      expect(metricAxisEncoding).toHaveProperty('signal');
      expect((metricAxisEncoding as { signal: string }).signal).toContain("scale('y', 0)");
      expect((metricAxisEncoding as { signal: string }).signal).toContain("datum['value']");
      expect(seriesFill).toHaveProperty('signal', BACKGROUND_COLOR);
      expect(verticalBaseline).toHaveProperty('value', 'middle');
      expect(horizontalAlign).toHaveProperty('value', 'center');
    });
  });
});

describe('getBarDirectLabelMarks()', () => {
  it('end-outside returns two marks: background halo and main text', () => {
    const marks = getBarDirectLabelMarks(defaultSpecOptions, defaultBarOptions);
    expect(marks).toHaveLength(2);
    expect(marks[0].type).toBe('text');
    expect(marks[1].type).toBe('text');
  });

  it('inside positions return one mark (no background halo)', () => {
    for (const position of ['end', 'middle', 'start'] as const) {
      const options = getBarDirectLabelSpecOptions({ position }, 0, defaultBarOptions);
      const marks = getBarDirectLabelMarks(options, defaultBarOptions);
      expect(marks).toHaveLength(1);
    }
  });

  it('inside positions use background color for fill', () => {
    for (const position of ['end', 'middle', 'start'] as const) {
      const options = getBarDirectLabelSpecOptions({ position }, 0, defaultBarOptions);
      const [main] = getBarDirectLabelMarks(options, defaultBarOptions);
      expect((main as TextMark).encode?.enter?.fill).toHaveProperty('signal', BACKGROUND_COLOR);
    }
  });

  it('background mark has stroke halo with transparent fill', () => {
    const [bg] = getBarDirectLabelMarks(defaultSpecOptions, defaultBarOptions);
    const enter = (bg as TextMark).encode?.enter;
    expect(enter?.fill).toHaveProperty('value', 'transparent');
    expect(enter?.stroke).toHaveProperty('signal', BACKGROUND_COLOR);
    expect(enter?.strokeWidth).toHaveProperty('value', DIRECT_LABEL_BACKGROUND_STROKE_WIDTH);
  });

  it('main mark has colored fill and correct font weight', () => {
    const [, main] = getBarDirectLabelMarks(defaultSpecOptions, defaultBarOptions);
    const enter = (main as TextMark).encode?.enter;
    expect(enter?.fill).toBeDefined();
    expect(enter?.fontWeight).toHaveProperty('value', DIRECT_LABEL_FONT_WEIGHT);
  });

  it('vertical bar: x uses xBand centered on dimension, y is a production rule', () => {
    const [, main] = getBarDirectLabelMarks(defaultSpecOptions, defaultBarOptions);
    const enter = (main as TextMark).encode?.enter;
    expect(enter?.x).toHaveProperty('scale', 'xBand');
    expect(enter?.x).toHaveProperty('band', 0.5);
    expect(enter?.align).toHaveProperty('value', 'center');
    expect(Array.isArray(enter?.y)).toBe(true);
    expect(Array.isArray(enter?.baseline)).toBe(true);
  });

  it('horizontal bar: y uses yBand centered on dimension, x is a production rule', () => {
    const hBarOptions = { ...defaultBarOptions, orientation: 'horizontal' as const };
    const hOptions = getBarDirectLabelSpecOptions({}, 0, hBarOptions);
    const [, main] = getBarDirectLabelMarks(hOptions, hBarOptions);
    const enter = (main as TextMark).encode?.enter;
    expect(enter?.y).toHaveProperty('scale', 'yBand');
    expect(enter?.y).toHaveProperty('band', 0.5);
    expect(enter?.baseline).toHaveProperty('value', 'middle');
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
    marks.forEach(mark => expect((mark as TextMark).from?.data).toBe(FILTERED_TABLE));
  });
});
