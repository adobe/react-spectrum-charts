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
import {
  CHART_SIZE_HOVER_STROKE_WIDTH,
  CHART_SIZE_STROKE_WIDTH,
  COLOR_SCALE,
  CONTROLLED_HIGHLIGHTED_SERIES,
  CONTROLLED_HIGHLIGHTED_TABLE,
  DEFAULT_OPACITY_RULE,
  DEFAULT_STROKE_WIDTH_RULE,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  FADE_FACTOR,
  HOVERED_ITEM,
  LINE_TYPE_SCALE,
  OPACITY_SCALE,
  SELECTED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/constants';

import { getDeemphasisRamp, getHoverFractionSignal } from '../marks/hoverAnimationUtils';
import {
  getAlternateSegmentStrokeDash,
  getHighlightedSeriesOpacityRules,
  getLineDeemphasisOpacitySignal,
  getLineGradientMark,
  getLineHighlightOverlayGroup,
  getLineHoverMarks,
  getLineMark,
  getLineOpacity, getLineStrokeWidth,
} from './lineMarkUtils';
import { defaultLineMarkOptions } from './lineTestUtils';

describe('getLineMark()', () => {
  test('should return line mark', () => {
    const lineMark = getLineMark(defaultLineMarkOptions, 'line0_facet');
    expect(lineMark).toEqual({
      name: 'line0',
      description: 'line0',
      type: 'line',
      from: { data: 'line0_facet' },
      interactive: false,
      encode: {
        enter: {
          stroke: { field: 'series', scale: COLOR_SCALE },
          strokeCap: { value: 'round' },
          strokeDash: { value: [] },
          strokeOpacity: DEFAULT_OPACITY_RULE,
          y: [{ field: 'value', scale: 'yLinear' }],
        },
        update: {
          x: { field: DEFAULT_TRANSFORMED_TIME_DIMENSION, scale: 'xTime' },
          opacity: [DEFAULT_OPACITY_RULE],
          strokeWidth: [DEFAULT_STROKE_WIDTH_RULE],
        },
      },
    });
  });

  test('should have no opacity rule for dimension popover highlighting', () => {
    const lineMark = getLineMark(
      { ...defaultLineMarkOptions, chartPopovers: [{ UNSAFE_highlightBy: 'dimension' }] },
      'line0_facet'
    );
    expect(lineMark.encode?.update?.opacity).toBeUndefined();
  });

  test('always uses the chart size signal for strokeWidth regardless of lineWidth', () => {
    const lineMark = getLineMark({ ...defaultLineMarkOptions, lineWidth: undefined }, 'line0_facet');
    expect(lineMark.encode?.update?.strokeWidth).toEqual([DEFAULT_STROKE_WIDTH_RULE]);
  });

  test('adds metric range opacity rules if isMetricRange and displayOnHover', () => {
    const lineMark = getLineMark(
      { ...defaultLineMarkOptions, interactiveMarkName: 'line0', displayOnHover: true },
      'line0_facet'
    );
    expect(lineMark.encode?.update?.opacity).toEqual([DEFAULT_OPACITY_RULE]);
  });

  test('does not add metric range opacity rules if displayOnHover is false and isMetricRange', () => {
    const lineMark = getLineMark({ ...defaultLineMarkOptions, displayOnHover: false }, 'line0_facet');
    expect(lineMark.encode?.update?.opacity).toEqual([{ value: 1 }]);
  });

  test('uses round strokeCap by default', () => {
    const lineMark = getLineMark(defaultLineMarkOptions, 'line0_facet');
    expect(lineMark.encode?.enter).toHaveProperty('strokeCap', { value: 'round' });
  });

  test('uses round strokeCap when lineCap is undefined', () => {
    const lineMark = getLineMark({ ...defaultLineMarkOptions, lineCap: undefined }, 'line0_facet');
    expect(lineMark.encode?.enter).toHaveProperty('strokeCap', { value: 'round' });
  });

  test('uses square strokeCap when lineCap is square', () => {
    const lineMark = getLineMark({ ...defaultLineMarkOptions, lineCap: 'square' }, 'line0_facet');
    expect(lineMark.encode?.enter).toHaveProperty('strokeCap', { value: 'square' });
  });

  test('uses array stroke encoding with exact other-series expression when primarySeries is set', () => {
    const lineMark = getLineMark({ ...defaultLineMarkOptions, primarySeries: 2 }, 'line0_facet');
    const stroke = lineMark.encode?.enter?.stroke as { test: string; value: string }[];
    expect(Array.isArray(stroke)).toBe(true);
    expect(stroke).toHaveLength(2);
    expect(stroke[0].test).toBe(`indexof(slice(domain('color'), 0, 2), datum.${SERIES_ID}) < 0`);
    expect(stroke[1]).toEqual({ field: 'series', scale: COLOR_SCALE });
  });

  test('isAnimate: false forces the static instant-rule opacity even for an otherwise-interactive line', () => {
    // this is the override every renamed-mark reuse of getLineMark relies on (highlight overlay,
    // trendlines, metric-range boundary line) — they all spread an interactive parent's options under
    // a different mark name, so isAnimate must be forced false or the opacity would reference a
    // `_hoverFractionData` that only exists for the base line's name
    const animated = getLineMark(
      { ...defaultLineMarkOptions, interactiveMarkName: 'line0', isAnimate: true },
      'line0_facet'
    );
    const notAnimated = getLineMark(
      { ...defaultLineMarkOptions, interactiveMarkName: 'line0', isAnimate: false },
      'line0_facet'
    );
    expect(animated.encode?.update?.opacity).toStrictEqual({
      signal: expect.stringContaining("data('line0_hoverFractionData')"),
    });
    expect(Array.isArray(notAnimated.encode?.update?.opacity)).toBe(true);
  });
});

describe('getLineHoverMarks()', () => {
  test('should return 6 marks by default', () => {
    expect(
      getLineHoverMarks({ ...defaultLineMarkOptions, isHighlightedByDimension: true }, 'line0_facet')
    ).toHaveLength(6);
  });
  test('should return 5 marks if interactionMode is item', () => {
    expect(
      getLineHoverMarks(
        { ...defaultLineMarkOptions, isHighlightedByDimension: true, interactionMode: 'item' },
        'line0_facet'
      )
    ).toHaveLength(5);
  });
  test('should return 7 marks if a popover is present', () => {
    expect(
      getLineHoverMarks(
        {
          ...defaultLineMarkOptions,
          isHighlightedByDimension: true,
          chartPopovers: [{ UNSAFE_highlightBy: 'dimension' }],
        },
        'line0_facet'
      )
    ).toHaveLength(7);
  });
  test('should have opacity of 0 if a selected item exists', () => {
    const marks = getLineHoverMarks(
      { ...defaultLineMarkOptions, isHighlightedByDimension: true, chartPopovers: [{}] },
      'line0_facet'
    );
    expect(marks[0].encode?.update?.opacity).toEqual({ signal: "length(data('line0_selectedData')) > 0 ? 0 : 1" });
  });
});

describe('getLineOpacity()', () => {
  test('should return a basic opacity rule when using default line options', () => {
    const opacityRule = getLineOpacity(defaultLineMarkOptions);
    expect(opacityRule).toEqual([{ value: 1 }]);
  });

  test('should include hover rules if line has an inspect', () => {
    const opacityRule = getLineOpacity({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      chartInspects: [{}],
    });
    expect(opacityRule).toEqual([
      {
        test: `isValid(line0_${HOVERED_ITEM})`,
        signal: `line0_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
      },
      {
        test: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}'))`,
        signal: `indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? 1 : ${FADE_FACTOR}`,
      },
      {
        test: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`,
        signal: `${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
      },
      { value: 1 },
    ]);
  });

  test('should include select rules if line has a popover', () => {
    const opacityRule = getLineOpacity({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      popoverMarkName: 'line0',
      chartPopovers: [{}],
    });
    expect(opacityRule).toEqual([
      {
        test: 'isValid(line0_hoveredItem)',
        signal: `line0_hoveredItem.${SERIES_ID} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
      },
      {
        test: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}'))`,
        signal: `indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? 1 : ${FADE_FACTOR}`,
      },
      {
        test: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`,
        signal: `${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
      },
      { test: `isValid(${SELECTED_SERIES})`, signal: `${SELECTED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}` },
      { value: 1 },
    ]);
  });

  test('should include displayOnHover rules if displayOnHover is true', () => {
    const opacityRule = getLineOpacity({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      displayOnHover: true,
    });
    expect(opacityRule).toEqual([DEFAULT_OPACITY_RULE]);
  });

  test('should add highlightedData rule for multiple series if isHighlightedByGroup is true', () => {
    const opacityRule = getLineOpacity({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      chartInspects: [{}],
      isHighlightedByGroup: true,
    });
    expect(opacityRule).toHaveLength(4);
    expect(opacityRule[0]).toHaveProperty('test', `length(data('line0_highlightedData'))`);
  });

  test('should include comboSiblingNames fade rule when comboSiblingNames is set', () => {
    const opacityRule = getLineOpacity({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      comboSiblingNames: ['bar0', 'bar1'],
    }) as { test?: string; value: number }[];
    const comboRule = opacityRule.find((r) => r.test?.includes('bar0') && r.test?.includes('bar1'));
    expect(comboRule).toBeDefined();
    expect(comboRule?.value).toBe(FADE_FACTOR);
    expect(comboRule?.test).toBe(`isValid(bar0_${HOVERED_ITEM}) || isValid(bar1_${HOVERED_ITEM})`);
  });

  describe('when isAnimate is true', () => {
    test('returns the animated deemphasis-ramp signal instead of the instant production rules', () => {
      const opacityRule = getLineOpacity({
        ...defaultLineMarkOptions,
        interactiveMarkName: 'line0',
        isAnimate: true,
      });
      const ramp = getDeemphasisRamp(getHoverFractionSignal('line0'));
      expect(opacityRule).toStrictEqual({ signal: `${FADE_FACTOR} + (1 - ${FADE_FACTOR}) * ${ramp}` });
    });

    test('displayOnHover still short-circuits to the default opacity rule, even when animated', () => {
      const opacityRule = getLineOpacity({
        ...defaultLineMarkOptions,
        interactiveMarkName: 'line0',
        isAnimate: true,
        displayOnHover: true,
      });
      expect(opacityRule).toEqual([DEFAULT_OPACITY_RULE]);
    });
  });
});

describe('getLineDeemphasisOpacitySignal()', () => {
  test('returns the shared deemphasis-ramp opacity signal for the given mark name', () => {
    const ramp = getDeemphasisRamp(getHoverFractionSignal('line0'));
    expect(getLineDeemphasisOpacitySignal('line0')).toStrictEqual({
      signal: `${FADE_FACTOR} + (1 - ${FADE_FACTOR}) * ${ramp}`,
    });
  });

  test('uses the given mark name in the fraction lookup, not a hardcoded one', () => {
    const ramp = getDeemphasisRamp(getHoverFractionSignal('bar0'));
    expect(getLineDeemphasisOpacitySignal('bar0')).toStrictEqual({
      signal: `${FADE_FACTOR} + (1 - ${FADE_FACTOR}) * ${ramp}`,
    });
  });
});

describe('getLineStrokeWidth()', () => {
  test('should return the default stroke width rule when no interactivity', () => {
    expect(getLineStrokeWidth(defaultLineMarkOptions)).toEqual([DEFAULT_STROKE_WIDTH_RULE]);
  });

  test('should return the default stroke width rule when displayOnHover is true', () => {
    expect(
      getLineStrokeWidth({ ...defaultLineMarkOptions, interactiveMarkName: 'line0', displayOnHover: true })
    ).toEqual([DEFAULT_STROKE_WIDTH_RULE]);
  });

  test('should include hover rules if line has an inspect', () => {
    const result = getLineStrokeWidth({ ...defaultLineMarkOptions, interactiveMarkName: 'line0', chartInspects: [{}] });
    expect(result).toEqual([
      {
        test: `isValid(line0_${HOVERED_ITEM})`,
        signal: `line0_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
      },
      {
        test: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}'))`,
        signal: `indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
      },
      {
        test: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`,
        signal: `${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
      },
      DEFAULT_STROKE_WIDTH_RULE,
    ]);
  });

  test('should include select rules if line has a popover', () => {
    const result = getLineStrokeWidth({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      popoverMarkName: 'line0',
      chartPopovers: [{}],
    });
    expect(result).toEqual([
      {
        test: `isValid(line0_${HOVERED_ITEM})`,
        signal: `line0_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
      },
      {
        test: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}'))`,
        signal: `indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
      },
      {
        test: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`,
        signal: `${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
      },
      {
        test: `isValid(${SELECTED_SERIES})`,
        signal: `${SELECTED_SERIES} === datum.${SERIES_ID} ? ${CHART_SIZE_HOVER_STROKE_WIDTH} : ${CHART_SIZE_STROKE_WIDTH}`,
      },
      DEFAULT_STROKE_WIDTH_RULE,
    ]);
  });

  test('should use highlightedData rule when isHighlightedByGroup is true', () => {
    const result = getLineStrokeWidth({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      chartInspects: [{}],
      isHighlightedByGroup: true,
    });
    expect(result).toHaveLength(4);
    expect(result[0]).toHaveProperty('test', `length(data('line0_highlightedData'))`);
    expect((result[0] as { signal: string }).signal).toContain(CHART_SIZE_HOVER_STROKE_WIDTH);
    expect((result[0] as { signal: string }).signal).toContain(CHART_SIZE_STROKE_WIDTH);
  });

  test('should use base stroke width when a combo sibling is hovered', () => {
    const result = getLineStrokeWidth({
      ...defaultLineMarkOptions,
      interactiveMarkName: 'line0',
      chartInspects: [{}],
      comboSiblingNames: ['line1'],
    });
    expect(result).toContainEqual({
      test: `isValid(line1_${HOVERED_ITEM})`,
      signal: CHART_SIZE_STROKE_WIDTH,
    });
  });
});

describe('getLineGradientMark()', () => {
  test('should return an area mark with gradient fill', () => {
    const gradientMark = getLineGradientMark(defaultLineMarkOptions, 'line0_facet');
    expect(gradientMark).toHaveProperty('name', 'line0_gradient');
    expect(gradientMark).toHaveProperty('type', 'area');
    expect(gradientMark).toHaveProperty('interactive', false);
    expect(gradientMark.from).toEqual({ data: 'line0_facet' });
  });

  test('should have correct enter encoding with y, y2, fill, and fillOpacity', () => {
    const gradientMark = getLineGradientMark(defaultLineMarkOptions, 'line0_facet');
    const enter = gradientMark.encode?.enter;
    expect(enter).toHaveProperty('y');
    expect(enter).toHaveProperty('y2', { signal: 'height' });
    expect(enter).toHaveProperty('fill');
    expect(enter).toHaveProperty('fillOpacity');
  });

  test('should use a signal-based gradient fill with color from scale', () => {
    const gradientMark = getLineGradientMark(defaultLineMarkOptions, 'line0_facet');
    const fill = gradientMark.encode?.enter?.fill as { signal: string };
    expect(fill).toHaveProperty('signal');
    expect(fill.signal).toContain('gradient');
    expect(fill.signal).toContain('linear');
    expect(fill.signal).toContain('transparent');
    expect(fill.signal).toContain(COLOR_SCALE);
  });

  test('should have correct update encoding with x and opacity', () => {
    const gradientMark = getLineGradientMark(defaultLineMarkOptions, 'line0_facet');
    const update = gradientMark.encode?.update;
    expect(update).toHaveProperty('x', { field: DEFAULT_TRANSFORMED_TIME_DIMENSION, scale: 'xTime' });
    expect(update).toHaveProperty('opacity');
  });

  test('should hide gradient when multiple series exist via scale domains', () => {
    const gradientMark = getLineGradientMark(defaultLineMarkOptions, 'line0_facet');
    const opacity = gradientMark.encode?.update?.opacity as { test: string; value: number }[];
    expect(opacity[0]).toEqual({
      test: `length(domain('${COLOR_SCALE}')) > 1 || length(domain('${LINE_TYPE_SCALE}')) > 1 || length(domain('${OPACITY_SCALE}')) > 1`,
      value: 0,
    });
  });

  test('should scale fillOpacity with static opacity value', () => {
    const gradientMark = getLineGradientMark(
      { ...defaultLineMarkOptions, opacity: { value: 0.6 } },
      'line0_facet'
    );
    const fillOpacity = gradientMark.encode?.enter?.fillOpacity;
    expect(fillOpacity).toEqual({ value: 0.6 * 0.2 });
  });

  test('should scale fillOpacity with dynamic opacity facet', () => {
    const gradientMark = getLineGradientMark(
      { ...defaultLineMarkOptions, opacity: 'weight' },
      'line0_facet'
    );
    const fillOpacity = gradientMark.encode?.enter?.fillOpacity;
    expect(fillOpacity).toEqual({ signal: `scale('${OPACITY_SCALE}', datum.weight) * 0.2` });
  });

  test('should use signal-based fillOpacity for alternate segments with static opacity', () => {
    const gradientMark = getLineGradientMark(
      { ...defaultLineMarkOptions, alternateSegmentKey: 'line0_alternateFlag' },
      'line0_facet'
    );
    const fillOpacity = gradientMark.encode?.enter?.fillOpacity as { signal: string };
    expect(fillOpacity.signal).toContain('line0_alternateFlag');
    expect(fillOpacity.signal).toContain('0.08');
    expect(fillOpacity.signal).toContain('0.2');
  });

  test('should use signal-based fillOpacity for alternate segments with dynamic opacity facet', () => {
    const gradientMark = getLineGradientMark(
      { ...defaultLineMarkOptions, alternateSegmentKey: 'line0_alternateFlag', opacity: 'weight' },
      'line0_facet'
    );
    const fillOpacity = gradientMark.encode?.enter?.fillOpacity as { signal: string };
    expect(fillOpacity.signal).toContain('line0_alternateFlag');
    expect(fillOpacity.signal).toContain(`scale('${OPACITY_SCALE}', datum.weight) * 0.08`);
    expect(fillOpacity.signal).toContain(`scale('${OPACITY_SCALE}', datum.weight) * 0.2`);
  });

  test('should include hover opacity rules when interactive', () => {
    const gradientMark = getLineGradientMark(
      { ...defaultLineMarkOptions, interactiveMarkName: 'line0', chartInspects: [{}] },
      'line0_facet'
    );
    const opacity = gradientMark.encode?.update?.opacity as unknown[];
    expect(Array.isArray(opacity)).toBe(true);
    expect(opacity[0]).toEqual({
      test: `length(domain('${COLOR_SCALE}')) > 1 || length(domain('${LINE_TYPE_SCALE}')) > 1 || length(domain('${OPACITY_SCALE}')) > 1`,
      value: 0,
    });
    expect(opacity.length).toBeGreaterThan(2);
  });

  test('should support dual metric axis y encoding', () => {
    const gradientMark = getLineGradientMark(
      { ...defaultLineMarkOptions, dualMetricAxis: true },
      'line0_facet'
    );
    const y = gradientMark.encode?.enter?.y;
    expect(Array.isArray(y)).toBe(true);
    expect((y as unknown[]).length).toBe(2);
  });
});

describe('getAlternateSegmentStrokeDash()', () => {
  test('static lineType + static alternateSegmentLineType: returns signal without scale lookup', () => {
    const result = getAlternateSegmentStrokeDash('line0', { value: 'solid' }, 'dotted') as { signal: string };
    expect(result.signal).toContain('line0_alternateFlag');
    expect(result.signal).not.toContain(`scale('${LINE_TYPE_SCALE}'`);
  });

  test('data-driven lineType + static alternateSegmentLineType: base uses scale lookup, alt does not', () => {
    const result = getAlternateSegmentStrokeDash('line0', 'lineTypeField', 'dotted') as { signal: string };
    expect(result.signal).toContain(`scale('${LINE_TYPE_SCALE}', datum['lineTypeField'])`);
    expect(result.signal).not.toContain(`scale('${LINE_TYPE_SCALE}', datum['dotted'])`);
    expect(result.signal).toContain('line0_alternateFlag');
  });

  test('different alternateSegmentLineTypes produce different signals', () => {
    const dotted = getAlternateSegmentStrokeDash('line0', { value: 'solid' }, 'dotted') as { signal: string };
    const dashed = getAlternateSegmentStrokeDash('line0', { value: 'solid' }, 'dashed') as { signal: string };
    expect(dotted.signal).not.toBe(dashed.signal);
  });
});

describe('getHighlightedSeriesOpacityRules()', () => {
  test('without interactiveMarkName returns 3 rules: 2 show conditions + hide fallback', () => {
    const rules = getHighlightedSeriesOpacityRules({}) as { test?: string; value: number }[];
    expect(rules).toHaveLength(3);
    expect(rules.at(-1)).toEqual({ value: 0 });
    expect(rules[0].test).toContain(CONTROLLED_HIGHLIGHTED_SERIES);
    expect(rules[1].test).toContain(CONTROLLED_HIGHLIGHTED_TABLE);
  });

  test('with interactiveMarkName adds hover rule as first condition', () => {
    const rules = getHighlightedSeriesOpacityRules({ interactiveMarkName: 'line0' }) as { test?: string; value: number }[];
    expect(rules).toHaveLength(4);
    expect(rules[0].test).toContain(`line0_${HOVERED_ITEM}`);
    expect(rules[0].test).toContain(SERIES_ID);
  });

  test('with isHighlightedByGroup uses highlightedData condition instead of hover item', () => {
    const rules = getHighlightedSeriesOpacityRules({ interactiveMarkName: 'line0', isHighlightedByGroup: true }) as { test?: string; value: number }[];
    expect(rules[0].test).toContain(`line0_highlightedData`);
    expect(rules[0].test).not.toContain(HOVERED_ITEM);
  });

  test('all show rules have value 1 and fallback has value 0', () => {
    const rules = getHighlightedSeriesOpacityRules({ interactiveMarkName: 'line0' }) as { test?: string; value: number }[];
    rules.slice(0, -1).forEach(rule => expect(rule.value).toBe(1));
    expect(rules.at(-1)?.value).toBe(0);
  });

  test('with legendHighlightSignals adds signal-based show conditions before the fallback', () => {
    const rules = getHighlightedSeriesOpacityRules({
      legendHighlightSignals: ['legend_hoveredSeries'],
    }) as { test?: string; value: number }[];
    const legendRule = rules.find((r) => r.test?.includes('legend_hoveredSeries'));
    expect(legendRule).toBeDefined();
    expect(legendRule?.value).toBe(1);
    expect(legendRule?.test).toBe(`isValid(legend_hoveredSeries) && legend_hoveredSeries === datum.${SERIES_ID}`);
    expect(rules.at(-1)).toEqual({ value: 0 });
  });

  test('with multiple legendHighlightSignals adds one rule per signal', () => {
    const rules = getHighlightedSeriesOpacityRules({
      legendHighlightSignals: ['sig1', 'sig2'],
    }) as { test?: string; value: number }[];
    expect(rules.filter((r) => r.test?.includes('isValid(sig'))).toHaveLength(2);
  });
});


describe('getLineHighlightOverlayGroup()', () => {
  test('returns a group mark named <name>_highlightOverlay_group', () => {
    const group = getLineHighlightOverlayGroup(defaultLineMarkOptions, 'filteredTable', [SERIES_ID]);
    expect(group.name).toBe('line0_highlightOverlay_group');
    expect(group.type).toBe('group');
  });

  test('marks array contains only the overlay line', () => {
    const group = getLineHighlightOverlayGroup(defaultLineMarkOptions, 'filteredTable', [SERIES_ID]);
    const marks = (group as { marks: { name: string }[] }).marks;
    expect(marks).toHaveLength(1);
    expect(marks[0].name).toBe('line0_highlightOverlayLine');
  });

  test('overlay line opacity uses highlighted test as show condition', () => {
    const group = getLineHighlightOverlayGroup(
      { ...defaultLineMarkOptions, interactiveMarkName: 'line0' },
      'filteredTable',
      [SERIES_ID]
    );
    const marks = (group as { marks: { encode: { update: { opacity: unknown[] } } }[] }).marks;
    const opacity = marks[0].encode.update.opacity;
    expect(Array.isArray(opacity)).toBe(true);
    expect((opacity as { value: number }[]).at(-1)).toEqual({ value: 0 });
  });

  test('overlay opacity always comes from getHighlightedSeriesOpacityRules, even when the parent line is animated', () => {
    // opacity is always overwritten by opacityRules (below), regardless of isAnimate — the isAnimate:
    // false passed into the underlying getLineMark call only matters for encodings that AREN'T
    // subsequently overwritten here (see the getLineMark() tests for where that override is observable)
    const group = getLineHighlightOverlayGroup(
      { ...defaultLineMarkOptions, interactiveMarkName: 'line0', isAnimate: true },
      'filteredTable',
      [SERIES_ID]
    );
    const marks = (group as { marks: { encode: { update: { opacity: unknown } } }[] }).marks;
    expect(Array.isArray(marks[0].encode.update.opacity)).toBe(true);
  });
});
