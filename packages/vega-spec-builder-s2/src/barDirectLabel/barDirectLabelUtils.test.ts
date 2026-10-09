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
import { BACKGROUND_COLOR, CHART_SIZE_FONT_SIZE, DIRECT_LABEL_BACKGROUND_STROKE_WIDTH } from '@spectrum-charts/core-s2/constants';
import { LabelTransform, Mark, TextMark } from 'vega';

import { defaultBarOptions } from '../bar/barTestUtils.js';
import { BarDirectLabelSpecOptions } from '../types/index.js';
import {
  getBarDirectLabelFitsTest,
  getBarDirectLabelLayoutSizeSignal,
  getBarDirectLabelMarkName,
  getBarDirectLabelMarks,
  getBarDirectLabelSpecOptions,
  getBarDirectLabelsMarks,
  getBarDirectLabelText,
  getInsideLabelGeometry,
  getOutsideLabelGeometry,
  hasCollisionDirectLabels,
  usesCollisionLayout,
} from './barDirectLabelUtils.js';

const specOptions = (overrides: Partial<BarDirectLabelSpecOptions> = {}): BarDirectLabelSpecOptions => ({
  ...getBarDirectLabelSpecOptions({}, 0, defaultBarOptions),
  ...overrides,
});

const names = (marks: Mark[]) => marks.map((mark) => mark.name);
const getLabelTransform = (mark: Mark) => (mark as TextMark).transform?.[0] as LabelTransform;

describe('getBarDirectLabelSpecOptions()', () => {
  it('inherits bar context and applies defaults', () => {
    expect(getBarDirectLabelSpecOptions({}, 2, defaultBarOptions)).toEqual({
      barName: defaultBarOptions.name,
      dataKey: undefined,
      format: '',
      index: 2,
      metric: defaultBarOptions.metric,
      orientation: defaultBarOptions.orientation,
      overflow: 'hide',
      position: 'end-outside',
    });
  });

  it('defaults overflow to spill for start position only', () => {
    expect(getBarDirectLabelSpecOptions({ position: 'start' }, 0, defaultBarOptions).overflow).toBe('spill');
    expect(getBarDirectLabelSpecOptions({ dataKey: 'callout', position: 'end' }, 0, defaultBarOptions).overflow).toBe('hide');
    expect(getBarDirectLabelSpecOptions({ position: 'middle' }, 0, defaultBarOptions).overflow).toBe('hide');
  });

  it('respects provided values', () => {
    const options = getBarDirectLabelSpecOptions(
      { dataKey: 'callout', format: '$,.0f', overflow: 'hide', position: 'middle' },
      0,
      defaultBarOptions
    );
    expect(options).toMatchObject({ dataKey: 'callout', format: '$,.0f', overflow: 'hide', position: 'middle' });
  });
});

describe('getBarDirectLabelText()', () => {
  it('formats the metric from the bar item datum', () => {
    expect(getBarDirectLabelText('datum', specOptions())).toContain(`datum.datum["${defaultBarOptions.metric}"]`);
  });

  it('uses the provided format', () => {
    expect(getBarDirectLabelText('datum', specOptions({ format: '$,.0f' }))).toContain('$,.0f');
  });
});

describe('getBarDirectLabelFitsTest()', () => {
  it('checks height for the font and width for the text on vertical bars', () => {
    const test = getBarDirectLabelFitsTest('datum', specOptions({ orientation: 'vertical' }));
    expect(test).toMatch(new RegExp(`^datum.height >= ${CHART_SIZE_FONT_SIZE} \\+ 16 && datum.width >= getLabelWidth`));
  });

  it('checks width for the text and height for the font on horizontal bars', () => {
    const test = getBarDirectLabelFitsTest('datum', specOptions({ orientation: 'horizontal' }));
    expect(test).toMatch(/^datum.width >= getLabelWidth/);
    expect(test).toContain(`datum.height >= ${CHART_SIZE_FONT_SIZE} + 4`);
  });
});

describe('getInsideLabelGeometry()', () => {
  it('centers middle labels', () => {
    for (const orientation of ['vertical', 'horizontal'] as const) {
      const geometry = getInsideLabelGeometry('datum', specOptions({ orientation, position: 'middle' }));
      expect(geometry).toEqual({
        x: '(datum.x + datum.width / 2)',
        y: '(datum.y + datum.height / 2)',
        align: "'center'",
        baseline: "'middle'",
      });
    }
  });

  it('places vertical end labels inside the tip', () => {
    const geometry = getInsideLabelGeometry('datum', specOptions({ orientation: 'vertical', position: 'end' }));
    expect(geometry.y).toContain('datum.y - -8');
    expect(geometry.baseline).toContain("'top'");
  });

  it('places horizontal start labels inside the base', () => {
    const geometry = getInsideLabelGeometry('datum', specOptions({ orientation: 'horizontal', position: 'start' }));
    expect(geometry.x).toContain('datum.x + 8');
    expect(geometry.align).toContain("'left'");
  });
});

describe('getOutsideLabelGeometry()', () => {
  it('places vertical labels above positive bars and below negative bars', () => {
    const geometry = getOutsideLabelGeometry('datum', specOptions({ orientation: 'vertical' }));
    expect(geometry.y).toContain('datum.y - 6');
    expect(geometry.y).toContain('(datum.y + datum.height) + 6');
    expect(geometry.baseline).toContain("'top' : 'bottom'");
  });

  it('places horizontal labels past the right of positive bars and the left of negative bars', () => {
    const geometry = getOutsideLabelGeometry('datum', specOptions({ orientation: 'horizontal' }));
    expect(geometry.x).toContain('(datum.x + datum.width) + 8');
    expect(geometry.x).toContain('datum.x - 8');
    expect(geometry.align).toContain("'right' : 'left'");
  });
});

describe('usesCollisionLayout()', () => {
  it('uses collision layout for end-outside and spill labels', () => {
    expect(usesCollisionLayout(specOptions({ position: 'end-outside' }))).toBe(true);
    expect(usesCollisionLayout(specOptions({ position: 'end', overflow: 'spill' }))).toBe(true);
    expect(usesCollisionLayout(specOptions({ position: 'end', overflow: 'hide' }))).toBe(false);
    expect(usesCollisionLayout(specOptions({ position: 'end-outside', dataKey: 'callout' }))).toBe(true);
  });
});

describe('getBarDirectLabelMarks()', () => {
  it('hides inside labels that do not fit when overflow is hide', () => {
    const marks = getBarDirectLabelMarks(specOptions({ position: 'end', overflow: 'hide' }), ['bar0']);
    expect(names(marks)).toEqual(['bar0DirectLabel0']);
    const update = (marks[0] as TextMark).encode?.update;
    expect(marks[0]).toHaveProperty('from', { data: 'bar0' });
    expect(update).toHaveProperty('fill', { signal: BACKGROUND_COLOR });
    expect(update?.fontSize).toHaveProperty('signal', expect.stringMatching(/\? .* : 0$/));
  });

  it('builds collision layout marks for end-outside labels', () => {
    const marks = getBarDirectLabelMarks(specOptions(), ['bar0']);
    expect(names(marks)).toEqual([
      'bar0DirectLabel0_anchor',
      'bar0DirectLabel0_placement',
      'bar0DirectLabel0_bg',
      'bar0DirectLabel0',
    ]);
    expect(marks[1]).toHaveProperty('from', { data: 'bar0DirectLabel0_anchor' });
    expect(getLabelTransform(marks[1])).toMatchObject({
      type: 'label',
      size: { signal: 'bar0_directLabelLayoutSize' },
      anchor: ['top'],
      avoidBaseMark: false,
      avoidMarks: ['bar0'],
    });
    expect(marks[2]).toHaveProperty('from', { data: 'bar0DirectLabel0_placement' });
    expect((marks[2] as TextMark).encode?.update).toHaveProperty('strokeWidth', {
      value: DIRECT_LABEL_BACKGROUND_STROKE_WIDTH,
    });
    expect((marks[3] as TextMark).encode?.update).toHaveProperty('fill', { signal: 'datum.datum.datum.fill' });
  });

  it('adds an inside mark for spill labels, and only places labels that do not fit', () => {
    const marks = getBarDirectLabelMarks(specOptions({ position: 'end', overflow: 'spill' }), ['bar0']);
    expect(names(marks)[0]).toBe('bar0DirectLabel0_inside');
    const placementUpdate = (marks[2] as TextMark).encode?.update;
    expect(placementUpdate?.fontSize).toHaveProperty('signal', expect.stringContaining('!(datum.datum.height'));
  });

  it('limits dataKey labels to matching rows and still hides them when they do not fit', () => {
    const marks = getBarDirectLabelMarks(specOptions({ dataKey: 'callout', overflow: 'hide', position: 'end' }), ['bar0']);
    const fontSize = (marks[0] as TextMark).encode?.update?.fontSize;
    expect(fontSize).toHaveProperty('signal', expect.stringMatching(/^\(datum\.datum\["callout"\]\) && \(datum\.height/));
  });

  it('limits dataKey labels to matching rows in collision layout', () => {
    const marks = getBarDirectLabelMarks(specOptions({ dataKey: 'callout', overflow: 'spill', position: 'end' }), ['bar0']);
    const insideFontSize = (marks[0] as TextMark).encode?.update?.fontSize;
    const placementFontSize = (marks[2] as TextMark).encode?.update?.fontSize;
    expect(insideFontSize).toHaveProperty('signal', expect.stringContaining('(datum.datum["callout"]) && '));
    expect(placementFontSize).toHaveProperty('signal', expect.stringContaining('(datum.datum.datum["callout"]) && '));
    expect(getLabelTransform(marks[2])).toHaveProperty('type', 'label');
  });
});

describe('getBarDirectLabelsMarks()', () => {
  it('has later labels avoid earlier ones', () => {
    const marks = getBarDirectLabelsMarks({
      ...defaultBarOptions,
      barDirectLabels: [{ dataKey: 'callout', position: 'end' }, {}],
    });
    const placement = marks.find((mark) => mark.name === 'bar0DirectLabel1_placement') as Mark;
    expect(getLabelTransform(placement).avoidMarks).toEqual(['bar0', 'bar0DirectLabel0']);
  });

  it('returns no marks without direct labels', () => {
    expect(getBarDirectLabelsMarks({ ...defaultBarOptions, barDirectLabels: [] })).toEqual([]);
  });
});

describe('getBarDirectLabelMarkName()', () => {
  it('combines the bar name and index', () => {
    expect(getBarDirectLabelMarkName(specOptions({ index: 3 }))).toBe('bar0DirectLabel3');
  });
});

describe('layout size signal', () => {
  it('captures the top-level chart size', () => {
    expect(getBarDirectLabelLayoutSizeSignal('bar0')).toEqual({
      name: 'bar0_directLabelLayoutSize',
      update: '[width, height]',
    });
  });

  it('is only needed when a label uses collision layout', () => {
    expect(hasCollisionDirectLabels({ ...defaultBarOptions, barDirectLabels: [{}] })).toBe(true);
    expect(hasCollisionDirectLabels({ ...defaultBarOptions, barDirectLabels: [{ position: 'middle' }] })).toBe(false);
    expect(hasCollisionDirectLabels({ ...defaultBarOptions, barDirectLabels: [] })).toBe(false);
  });
});
