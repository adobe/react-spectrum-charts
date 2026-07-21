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
import { AggregateTransform, Data, FormulaTransform, LookupTransform, Mark } from 'vega';

import {
  CHART_SIZE_HOVER_STROKE_WIDTH,
  CHART_SIZE_STROKE_WIDTH,
  CONTROLLED_HIGHLIGHTED_SERIES,
  DEFAULT_OPACITY_RULE,
  DEFAULT_STROKE_WIDTH_RULE,
  FADE_FACTOR,
  FILTERED_TABLE,
  GROUP_ID,
  HOVERED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/constants';

import {
  encodingUsesScale,
  getHighlightOpacityRule,
  getHighlightStrokeWidthRule,
  injectLegendHoverIntoData,
  setHoverOpacityForMarks,
  setHoverStrokeWidthForMarks,
} from './legendHighlightUtils';
import { defaultMark } from './legendTestUtils';

const defaultGroupMark: Mark = {
  type: 'group',
  marks: [defaultMark],
};

// Mirrors a metric range's own line mark with an overridden literal color — the only metric
// range sub-mark whose color is overridable, so it needs the same name-based fallback.
const metricRangeLineWithOverriddenColorMark: Mark = {
  name: 'line0MetricRange0_line',
  type: 'line',
  from: { data: 'line0MetricRange0_facet' },
  encode: {
    enter: {
      stroke: { value: '#ABC123' },
    },
    update: {
      opacity: [DEFAULT_OPACITY_RULE],
    },
  },
};

// Mirrors a trendline mark whose color has been overridden with a literal value rather than a
// color scale facet. It's still per-series (faceted by series regardless of its own color), so
// it should still receive the legend-hover rule based on its name, not its color encoding.
const trendlineWithOverriddenColorMark: Mark = {
  name: 'line0Trendline0',
  type: 'line',
  from: { data: 'line0Trendline0_facet' },
  encode: {
    enter: {
      stroke: { value: '#ABC123' },
    },
    update: {
      opacity: [DEFAULT_OPACITY_RULE],
    },
  },
};

const defaultOpacityEncoding = {
  opacity: [
    {
      test: `isValid(legend0_${HOVERED_SERIES})`,
      signal: `legend0_${HOVERED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
    },
  ],
};

const hoverTargetData: Data = {
  name: 'line0_hoverTargetData',
  source: FILTERED_TABLE,
  transform: [
    { type: 'aggregate', groupby: [SERIES_ID] },
    { type: 'formula', as: 'hoveredMatch', expr: `isValid(hoveredItem) ? 1 : null` },
    { type: 'formula', as: 'target', expr: `isValid(datum.hoveredMatch) ? datum.hoveredMatch : 0.5` },
  ],
};

const hoverFractionData: Data = {
  name: 'line0_hoverFractionData',
  source: 'line0_hoverAnimStateData',
  transform: [{ type: 'formula', as: 'fraction', expr: 'lerp(...)' }],
};

const getExpectedLegendHoverFormulas = (legendName: string, matchExpr: string): FormulaTransform[] => [
  {
    type: 'formula',
    as: 'legendHoverMatch',
    expr: `(isValid(${legendName}_${HOVERED_SERIES})) ? ((${matchExpr}) ? 1 : 0) : null`,
  },
  {
    type: 'formula',
    as: 'target',
    expr: `isValid(datum.hoveredMatch) ? datum.hoveredMatch : isValid(datum.legendHoverMatch) ? datum.legendHoverMatch : datum.conditions`,
  },
];

describe('injectLegendHoverIntoData()', () => {
  test('renames the existing target formula to conditions and appends the legendHoverMatch/target formulas', () => {
    const data = JSON.parse(JSON.stringify([hoverTargetData]));
    injectLegendHoverIntoData('legend0', data);

    const transform = data[0].transform as FormulaTransform[];
    expect(transform).toHaveLength(5);
    expect(transform[2]).toHaveProperty('as', 'conditions');
    expect(transform.slice(-2)).toEqual(
      getExpectedLegendHoverFormulas('legend0', `legend0_${HOVERED_SERIES} === datum.${SERIES_ID} ? 1 : 0`)
    );
  });

  test('uses the legend group match expression and extends the aggregate groupby when keys are provided', () => {
    const data = JSON.parse(JSON.stringify([hoverTargetData]));
    injectLegendHoverIntoData('legend0', data, ['category']);

    const transform = data[0].transform as (AggregateTransform | FormulaTransform)[];
    expect(transform[0]).toHaveProperty('groupby', [SERIES_ID, `legend0_${GROUP_ID}`]);
    expect(transform.slice(-2)).toEqual(
      getExpectedLegendHoverFormulas('legend0', `legend0_${HOVERED_SERIES} === datum.legend0_${GROUP_ID} ? 1 : 0`)
    );
  });

  test('adds a grouped fraction data source and lookup transform when keys are provided and a _hoverFractionData source exists', () => {
    const data = JSON.parse(JSON.stringify([hoverTargetData, hoverFractionData]));
    injectLegendHoverIntoData('legend0', data, ['category']);

    const fractionTransform = data[1].transform as LookupTransform[];
    expect(fractionTransform).toHaveLength(2);
    expect(fractionTransform[1]).toEqual({
      type: 'lookup',
      from: 'line0_hoverTargetData',
      key: SERIES_ID,
      fields: [SERIES_ID],
      values: [`legend0_${GROUP_ID}`],
      as: [`legend0_${GROUP_ID}`],
    });

    const groupFractionData = data.find((d: Data) => d.name === 'line0_hoverGroupFractionData');
    expect(groupFractionData).toEqual({
      name: 'line0_hoverGroupFractionData',
      source: 'line0_hoverFractionData',
      transform: [
        {
          type: 'aggregate',
          groupby: [`legend0_${GROUP_ID}`],
          fields: ['fraction'],
          ops: ['max'],
          as: ['fraction'],
        },
      ],
    });
  });

  test('does not touch _hoverFractionData when keys are not provided', () => {
    const data = JSON.parse(JSON.stringify([hoverTargetData, hoverFractionData]));
    injectLegendHoverIntoData('legend0', data);

    expect(data).toHaveLength(2);
    expect(data[1].transform).toEqual(hoverFractionData.transform);
  });

  test('leaves data sources that are not hover target/fraction data untouched', () => {
    const otherData: Data = { name: 'table', source: 'table', transform: [{ type: 'identifier', as: 'id' }] };
    const data = JSON.parse(JSON.stringify([otherData]));
    injectLegendHoverIntoData('legend0', data);

    expect(data).toEqual([otherData]);
  });
});

describe('getHighlightOpacityRule()', () => {
  test('should use HIGHLIGHTED_SERIES in test if there are not any keys', () => {
    const opacityRule = getHighlightOpacityRule('legend0', false);
    expect(opacityRule).toHaveProperty('test', `isValid(legend0_${HOVERED_SERIES})`);
  });
  test('should use keys in test if there are keys', () => {
    const opacityRule = getHighlightOpacityRule('legend0', false, ['key1']);
    expect(opacityRule).toHaveProperty('test', `isValid(legend0_${HOVERED_SERIES})`);
  });
});

describe('setHoverOpacityForMarks()', () => {
  describe('no initial state', () => {
    test('should not modify the marks', () => {
      const marks = [];
      setHoverOpacityForMarks('legend0', marks);
      expect(marks).toEqual([]);
    });
  });
  describe('bar mark initial state', () => {
    test('encoding should be added for opacity', () => {
      const marks = JSON.parse(JSON.stringify([defaultMark]));
      setHoverOpacityForMarks('legend0', marks);
      expect(marks).toStrictEqual([
        { ...defaultMark, encode: { ...defaultMark.encode, update: defaultOpacityEncoding } },
      ]);
    });
    test('opacity encoding already exists, rules should be added in the correct spot', () => {
      const marks = JSON.parse(
        JSON.stringify([
          {
            ...defaultMark,
            encode: { ...defaultMark.encode, update: { opacity: [DEFAULT_OPACITY_RULE] } },
          },
        ])
      );
      setHoverOpacityForMarks('legend0', marks);
      expect(marks).toStrictEqual([
        {
          ...defaultMark,
          encode: {
            ...defaultMark.encode,
            update: {
              ...defaultOpacityEncoding,
              opacity: [...defaultOpacityEncoding.opacity, DEFAULT_OPACITY_RULE],
            },
          },
        },
      ]);
    });
  });
  describe('group mark initial state', () => {
    test('encoding should be added for opacity', () => {
      const marks = JSON.parse(JSON.stringify([defaultGroupMark]));
      setHoverOpacityForMarks('legend0', marks);
      expect(marks).toStrictEqual([
        {
          ...defaultGroupMark,
          marks: [{ ...defaultMark, encode: { ...defaultMark.encode, update: defaultOpacityEncoding } }],
        },
      ]);
    });
  });
  describe('trendline mark with an overridden (non-scale) color', () => {
    test('still gets the legend-hover opacity rule spliced in, based on its name rather than its color encoding', () => {
      const marks = JSON.parse(JSON.stringify([trendlineWithOverriddenColorMark]));
      setHoverOpacityForMarks('legend0', marks);
      expect(marks[0].encode.update.opacity[0]).toEqual(getHighlightOpacityRule('legend0', false));
    });
  });
  describe('metric range line mark with an overridden (non-scale) color', () => {
    test('still gets the legend-hover opacity rule spliced in, based on its name rather than its color encoding', () => {
      const marks = JSON.parse(JSON.stringify([metricRangeLineWithOverriddenColorMark]));
      setHoverOpacityForMarks('legend0', marks);
      expect(marks[0].encode.update.opacity[0]).toEqual(getHighlightOpacityRule('legend0', false));
    });
  });
  describe('mark using the new hover animation system', () => {
    const animatedLineMark: Mark = {
      ...defaultMark,
      name: 'line0',
      encode: {
        ...defaultMark.encode,
        update: { opacity: { signal: `0.2 + (1 - 0.2) * clamp(0.5 / 0.5, 0, 1)` } },
      },
    };

    test('is left untouched when its name is in animatedMarks', () => {
      const marks = JSON.parse(JSON.stringify([animatedLineMark]));
      setHoverOpacityForMarks('legend0', marks, undefined, false, ['line0']);
      expect(marks[0].encode.update.opacity).toEqual(animatedLineMark.encode?.update?.opacity);
    });

    test('still gets the legend-hover opacity rule spliced in when its name is not in animatedMarks', () => {
      const marks = JSON.parse(JSON.stringify([animatedLineMark]));
      setHoverOpacityForMarks('legend0', marks, undefined, false, ['line1']);
      expect(marks[0].encode.update.opacity[0]).toEqual(getHighlightOpacityRule('legend0', false));
    });
  });

  describe('trendline hover-support mark sharing the trendline name prefix', () => {
    // Named like `<parent>Trendline_hoverRule` — shares the "Trendline" prefix with the
    // trendline's own line mark, but isn't the trendline mark itself. Its non-array opacity
    // rule is unrelated to series matching (it hides the guide line when something is selected)
    // and must not be clobbered by the legend-hover splice logic.
    const trendlineHoverRuleMark: Mark = {
      name: 'line0Trendline_hoverRule',
      type: 'rule',
      encode: {
        enter: {},
        update: {
          opacity: { signal: `length(data('line0Trendline_selectedData')) > 0 ? 0 : 1` },
        },
      },
    };

    test('is left untouched, preserving its non-array opacity rule', () => {
      const marks = JSON.parse(JSON.stringify([trendlineHoverRuleMark]));
      setHoverOpacityForMarks('legend0', marks);
      expect(marks[0].encode.update.opacity).toEqual(trendlineHoverRuleMark.encode?.update?.opacity);
    });
  });
});

describe('getHighlightStrokeWidthRule()', () => {
  test('should use hoveredSeries signal when no keys and not controlled', () => {
    const rule = getHighlightStrokeWidthRule('legend0', false);
    expect(rule).toHaveProperty('test', `isValid(legend0_${HOVERED_SERIES})`);
    expect(rule).toHaveProperty(
      'signal',
      `legend0_${HOVERED_SERIES} === datum.${SERIES_ID} ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`
    );
  });
  test('should use hoveredSeries signal when keys are provided', () => {
    const rule = getHighlightStrokeWidthRule('legend0', false, ['category']);
    expect(rule).toHaveProperty('test', `isValid(legend0_${HOVERED_SERIES})`);
  });
  test('should use CONTROLLED_HIGHLIGHTED_SERIES signal when controlled', () => {
    const rule = getHighlightStrokeWidthRule('legend0', true);
    expect(rule).toHaveProperty('test', `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`);
  });
});

describe('setHoverStrokeWidthForMarks()', () => {
  const markWithStrokeWidth = {
    ...defaultMark,
    encode: {
      ...defaultMark.encode,
      update: { strokeWidth: [DEFAULT_STROKE_WIDTH_RULE] },
    },
  };

  test('should not modify marks when marks array is empty', () => {
    const marks = [];
    setHoverStrokeWidthForMarks('legend0', marks);
    expect(marks).toEqual([]);
  });
  test('should not modify a mark that has no strokeWidth in update', () => {
    const marks = JSON.parse(JSON.stringify([defaultMark]));
    setHoverStrokeWidthForMarks('legend0', marks);
    expect(marks[0].encode.update).not.toHaveProperty('strokeWidth');
  });
  test('should inject highlight rule before the fallback strokeWidth rule', () => {
    const marks = JSON.parse(JSON.stringify([markWithStrokeWidth]));
    setHoverStrokeWidthForMarks('legend0', marks);
    expect(marks[0].encode.update.strokeWidth).toHaveLength(2);
    expect(marks[0].encode.update.strokeWidth[0]).toHaveProperty('test', `isValid(legend0_${HOVERED_SERIES})`);
    expect(marks[0].encode.update.strokeWidth[1]).toEqual(DEFAULT_STROKE_WIDTH_RULE);
  });
  test('should inject group rule when keys are provided', () => {
    const marks = JSON.parse(JSON.stringify([markWithStrokeWidth]));
    setHoverStrokeWidthForMarks('legend0', marks, ['category']);
    expect(marks[0].encode.update.strokeWidth[0]).toHaveProperty('test', `isValid(legend0_${HOVERED_SERIES})`);
  });
});

describe('encodingUsesScale()', () => {
  test('should return true if the encoding uses a scale', () => {
    expect(encodingUsesScale({ scale: 'color' })).toBe(true);
  });
  test('should return true if the encoding uses a signal that references a scale', () => {
    expect(encodingUsesScale({ signal: 'scale("color", datum.color)' })).toBe(true);
  });
  test('should return false if the encoding is not an object', () => {
    expect(encodingUsesScale(1)).toBe(false);
  });
  test('should return false if the encoding is undefined', () => {
    expect(encodingUsesScale(undefined)).toBe(false);
  });
  test('should return false if encoding is not related to a scale', () => {
    expect(encodingUsesScale({ value: 1 })).toBe(false);
  });
});
