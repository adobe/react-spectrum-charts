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
import { TextValueRef } from 'vega';

import { DONUT_DIRECT_LABEL_NAME_FONT_SIZES, DONUT_DIRECT_LABEL_VALUE_FONT_SIZES, DONUT_SIZE_TIER_CUTPOINTS } from '@spectrum-charts/constants';

import { DonutSpecOptions, SegmentLabelSpecOptions } from '../types';
import { defaultDonutOptions } from './donutTestUtils';
import { getDonutEmptyStateTest } from './donutUtils';
import {
  getSegmentLabelMarks,
  getSegmentLabelScales,
  getSegmentLabelSignals,
  getSegmentLabelTextMark,
  getSegmentLabelValueText,
  getSegmentLabelValueTextMark,
  getTextRuleExpr,
} from './segmentLabelUtils';

const defaultDonutOptionsWithSegmentLabel: DonutSpecOptions = {
  ...defaultDonutOptions,
  segmentLabels: [{}],
};

const defaultSegmentLabelOptions: SegmentLabelSpecOptions = {
  donutOptions: defaultDonutOptionsWithSegmentLabel,
  percent: false,
  percentFormat: '.0%',
  value: false,
  valueFormat: 'standardNumber',
};

describe('getSegmentLabelMarks()', () => {
  test('should return empty array if isBoolean', () => {
    const marks = getSegmentLabelMarks({
      ...defaultDonutOptionsWithSegmentLabel,
      isBoolean: true,
    });
    expect(marks).toEqual([]);
  });
  test('should return emptry array if there is not SegmentLabel on the Donut', () => {
    const marks = getSegmentLabelMarks({
      ...defaultDonutOptions,
    });
    expect(marks).toEqual([]);
  });
  test('should return segment label marks', () => {
    const marks = getSegmentLabelMarks({
      ...defaultDonutOptionsWithSegmentLabel,
    });
    expect(marks).toHaveLength(1);
    expect(marks[0].type).toEqual('group');
    expect(marks[0].marks).toHaveLength(1);
    expect(marks[0].marks?.[0].type).toEqual('text');
  });
});

describe('getSegmentLabelValueTextMark()', () => {
  test('should return empty array if value and percent are false', () => {
    expect(getSegmentLabelValueTextMark(defaultSegmentLabelOptions)).toEqual([]);
  });
  test('should return a text mark if value is true', () => {
    const marks = getSegmentLabelValueTextMark({ ...defaultSegmentLabelOptions, value: true });
    expect(marks).toHaveLength(1);
    expect(marks[0].type).toEqual('text');
  });
  test('should return a text mark if percent is true', () => {
    const marks = getSegmentLabelValueTextMark({ ...defaultSegmentLabelOptions, percent: true });
    expect(marks).toHaveLength(1);
    expect(marks[0].type).toEqual('text');
  });
  test('should return two text marks if value and percent are true', () => {
    const marks = getSegmentLabelValueTextMark({ ...defaultSegmentLabelOptions, value: true, percent: true });
    expect(marks).toHaveLength(1);
    expect(marks[0].type).toEqual('text');
  });
});

describe('getSegmentLabelValueText()', () => {
  test('should return undefined if value and percent are false', () => {
    expect(getSegmentLabelValueText(defaultSegmentLabelOptions)).toBeUndefined();
  });
  test('should return a simple percentSignal if percent is true and value is false', () => {
    expect(getSegmentLabelValueText({ ...defaultSegmentLabelOptions, percent: true })).toHaveProperty(
      'signal',
      `format(datum['testName_arcPercent'], '.0%')`
    );
  });
  test('should use custom percentFormat when provided', () => {
    expect(
      getSegmentLabelValueText({ ...defaultSegmentLabelOptions, percent: true, percentFormat: '.1%' })
    ).toHaveProperty('signal', `format(datum['testName_arcPercent'], '.1%')`);
  });
  test('should use custom percentFormat in combined percent + value mode', () => {
    const rules = getSegmentLabelValueText({
      ...defaultSegmentLabelOptions,
      value: true,
      percent: true,
      percentFormat: '.1%',
    });
    expect(rules).toHaveLength(1);
    expect(rules?.[0].signal).toContain("'.1%'");
    expect(rules?.[0].signal).toContain('testMetric');
  });
  test('should return an array of rules if value is true', () => {
    const rules = getSegmentLabelValueText({ ...defaultSegmentLabelOptions, value: true });
    expect(rules).toHaveLength(1);
    expect(rules?.[0]).toHaveProperty('signal', "format(datum['testMetric'], ',')");
  });
  test('should have percentSignal combined with value signal if value and percent are true', () => {
    const rules = getSegmentLabelValueText({ ...defaultSegmentLabelOptions, value: true, percent: true });
    expect(rules).toHaveLength(1);
    expect(rules?.[0].signal).toContain('_arcPercent');
    expect(rules?.[0].signal).toContain('testMetric');
  });
});

describe('getTextRuleExpr()', () => {
  test('should return an empty string literal for an undefined rule', () => {
    expect(getTextRuleExpr(undefined)).toBe(`''`);
  });
  test('should resolve a signal rule to the signal itself', () => {
    expect(getTextRuleExpr({ signal: 'testSignal' })).toBe('testSignal');
  });
  test('should resolve a field rule to a datum field access', () => {
    expect(getTextRuleExpr({ field: 'testField' })).toBe(`datum['testField']`);
  });
  test('should resolve a value rule to a quoted literal', () => {
    expect(getTextRuleExpr({ value: 'testValue' })).toBe(`'testValue'`);
  });
  test('should fall back to an empty string literal for a rule with none of signal/field/value', () => {
    // TextValueRef's real shapes always have one of signal/field/value - this exercises the
    // defensive fallback for a malformed rule that shouldn't occur through valid typed input
    expect(getTextRuleExpr({} as TextValueRef)).toBe(`''`);
  });
  test('should combine conditional rules into a nested ternary, testing in reverse order', () => {
    const expr = getTextRuleExpr([
      { test: 'datum.a', signal: 'signalA' },
      { test: 'datum.b', field: 'fieldB' },
      { value: 'fallbackValue' },
    ]);
    expect(expr).toBe(`datum.a ? (signalA) : (datum.b ? (datum['fieldB']) : ('fallbackValue'))`);
  });
  test('should skip the ternary wrapper for a rule with no test condition', () => {
    const expr = getTextRuleExpr([
      { test: 'datum.a', signal: 'signalA' },
      { field: 'untestedField' },
      { value: 'fallbackValue' },
    ]);
    expect(expr).toBe(`datum.a ? (signalA) : (datum['untestedField'])`);
  });
  test('should throw on an empty production-rule array', () => {
    expect(() => getTextRuleExpr([])).toThrow('getTextRuleExpr: empty production rule array');
  });
});

describe('getSegmentLabelScales()', () => {
  test('should return empty array if there is not a SegmentLabel on the Donut', () => {
    expect(getSegmentLabelScales(defaultDonutOptions)).toEqual([]);
  });

  test('should snap outer diameter to the nearest named tier for name/value font sizes', () => {
    const scales = getSegmentLabelScales(defaultDonutOptionsWithSegmentLabel);
    expect(scales).toEqual([
      {
        name: 'testName_segmentLabelNameFontSizeScale',
        type: 'threshold',
        domain: DONUT_SIZE_TIER_CUTPOINTS,
        range: DONUT_DIRECT_LABEL_NAME_FONT_SIZES,
      },
      {
        name: 'testName_segmentLabelValueFontSizeScale',
        type: 'threshold',
        domain: DONUT_SIZE_TIER_CUTPOINTS,
        range: DONUT_DIRECT_LABEL_VALUE_FONT_SIZES,
      },
    ]);
  });
});

describe('getSegmentLabelSignals()', () => {
  test('should return empty array if there is not a SegmentLabel on the Donut', () => {
    expect(getSegmentLabelSignals(defaultDonutOptions)).toEqual([]);
  });

  test('should resolve name/value font sizes from the outer diameter', () => {
    const signals = getSegmentLabelSignals(defaultDonutOptionsWithSegmentLabel);
    expect(signals).toEqual([
      {
        name: 'testName_segmentLabelNameFontSize',
        update:
          "scale('testName_segmentLabelNameFontSizeScale', 2 * (((min(width, height) / 2 - 2) - 20) / (1 + 0.6)))",
      },
      {
        name: 'testName_segmentLabelValueFontSize',
        update:
          "scale('testName_segmentLabelValueFontSizeScale', 2 * (((min(width, height) / 2 - 2) - 20) / (1 + 0.6)))",
      },
    ]);
  });
});

describe('label anchor radius/dx (hemisphere offset)', () => {
  test('radius should always be the constant ring-gap point, regardless of hemisphere', () => {
    const mark = getSegmentLabelTextMark(defaultSegmentLabelOptions);
    // radius must never depend on hemisphere/text width - only dx does, so a label's vertical
    // position never shifts based on label content (see the autosize-shrink regression this guards against)
    expect(mark.encode?.update?.radius).toEqual({
      signal: '(((min(width, height) / 2 - 2) - 20) / (1 + 0.6)) + 20',
    });
  });

  test('right hemisphere should get no horizontal offset', () => {
    const mark = getSegmentLabelTextMark(defaultSegmentLabelOptions);
    const dxSignal = (mark.encode?.update?.dx as { signal: string }).signal;
    expect(dxSignal).toBe(
      "(datum['testName_arcTheta'] <= PI ? 0 : -(min(max(getLabelWidth(datum['testColor'], 400, testName_segmentLabelNameFontSize), 0), (((min(width, height) / 2 - 2) - 20) / (1 + 0.6)) * 0.6)))"
    );
  });

  test('left hemisphere dx offset should account for the wider of name/value widths when value is shown', () => {
    const mark = getSegmentLabelTextMark({ ...defaultSegmentLabelOptions, value: true });
    const dxSignal = (mark.encode?.update?.dx as { signal: string }).signal;
    // the offset branch (used when arcTheta > PI) must compare name width against the real value text's measured width
    expect(dxSignal).toContain(
      "max(getLabelWidth(datum['testColor'], 400, testName_segmentLabelNameFontSize), getLabelWidth("
    );
    expect(dxSignal).toContain('testName_segmentLabelValueFontSize');
  });

  test('the pull-back should be capped at a fraction of the donut radius', () => {
    const mark = getSegmentLabelTextMark(defaultSegmentLabelOptions);
    const dxSignal = (mark.encode?.update?.dx as { signal: string }).signal;
    expect(dxSignal).toContain('min(max(getLabelWidth(');
    expect(dxSignal).toContain('(((min(width, height) / 2 - 2) - 20) / (1 + 0.6)) * 0.6');
  });

  test('name and value marks should share the exact same radius and dx expressions', () => {
    const nameMark = getSegmentLabelTextMark({ ...defaultSegmentLabelOptions, value: true });
    const [valueMark] = getSegmentLabelValueTextMark({ ...defaultSegmentLabelOptions, value: true });
    expect(nameMark.encode?.update?.radius).toEqual(valueMark.encode?.update?.radius);
    expect(nameMark.encode?.update?.dx).toEqual(valueMark.encode?.update?.dx);
  });

  test('both hemispheres should use left alignment (only dx differs, not align or radius)', () => {
    const mark = getSegmentLabelTextMark(defaultSegmentLabelOptions);
    expect(mark.encode?.update?.align).toEqual({ value: 'left' });
  });

  test('should use the labelKey field instead of color when provided', () => {
    const mark = getSegmentLabelTextMark({ ...defaultSegmentLabelOptions, labelKey: 'region' });
    const dxSignal = (mark.encode?.update?.dx as { signal: string }).signal;
    expect(dxSignal).toBe(
      "(datum['testName_arcTheta'] <= PI ? 0 : -(min(max(getLabelWidth(datum['region'], 400, testName_segmentLabelNameFontSize), 0), (((min(width, height) / 2 - 2) - 20) / (1 + 0.6)) * 0.6)))"
    );
  });
});

describe('getSegmentLabelTextMark()', () => {
  test('should define dy if value or percent are true', () => {
    const mark = getSegmentLabelTextMark({ ...defaultSegmentLabelOptions, value: true });
    expect(mark.encode?.update).toHaveProperty('dy');
  });
  test('should not define dy if value and percent are false', () => {
    const mark = getSegmentLabelTextMark(defaultSegmentLabelOptions);
    expect(mark.encode?.update?.dy).toBeUndefined();
  });
  test('name dy should shift by the value line font size, not a fixed px amount, so the gap stays 0px at every tier', () => {
    const mark = getSegmentLabelTextMark({ ...defaultSegmentLabelOptions, value: true });
    expect(mark.encode?.update?.dy).toEqual({
      signal:
        "datum['testName_arcTheta'] <= 0.5 * PI || datum['testName_arcTheta'] >= 1.5 * PI ? -testName_segmentLabelValueFontSize : 0",
    });
  });
  test('should hide labels when the donut is in the empty state', () => {
    const mark = getSegmentLabelTextMark(defaultSegmentLabelOptions);
    expect(mark.encode?.update?.fontSize).toEqual([
      { test: getDonutEmptyStateTest('testName'), value: 0 },
      { test: `datum['testName_arcLength'] < 0.3`, value: 0 },
      { signal: 'testName_segmentLabelNameFontSize' },
    ]);
  });
});

describe('s2 styles', () => {
  describe('getSegmentLabelTextMark()', () => {
    test('should always use S2 styles (no bold, gray-700 fill)', () => {
      const mark = getSegmentLabelTextMark(defaultSegmentLabelOptions);

      expect(mark.encode?.enter?.fontWeight).toBeUndefined();
      expect(mark.encode?.enter?.fill).toEqual({ value: '#505050' });
    });
  });

  describe('getSegmentLabelValueTextMark()', () => {
    test('should always add bold fontWeight, and default to gray-700 fill for S2', () => {
      const marks = getSegmentLabelValueTextMark({
        ...defaultSegmentLabelOptions,
        value: true,
      });

      expect(marks).toHaveLength(1);
      expect(marks[0].encode?.enter?.fontWeight).toEqual({ value: 'bold' });
      // fill lives in `update` (not `enter`) since it must react to hover state - see 'hover behavior' below
      expect(marks[0].encode?.update?.fill).toEqual([
        {
          test: "isValid(testName_hoveredItem) && testName_hoveredItem.rscMarkId === datum.rscMarkId",
          scale: 'color',
          field: 'testColor',
        },
        { value: '#505050' },
      ]);
    });

    test('value dy should shift by the name line font size, not a fixed px amount, so the gap stays 0px at every tier', () => {
      const [mark] = getSegmentLabelValueTextMark({ ...defaultSegmentLabelOptions, value: true });
      expect(mark.encode?.update?.dy).toEqual({
        signal:
          "datum['testName_arcTheta'] <= 0.5 * PI || datum['testName_arcTheta'] >= 1.5 * PI ? 0 : testName_segmentLabelNameFontSize",
      });
    });
  });
});

describe('hover behavior', () => {
  // a SegmentLabel showing a value is what makes isInteractive() (and therefore getMarkOpacity()) treat
  // this donut as interactive - see markUtils.test.ts for the isInteractive() coverage itself
  const interactiveDonutOptions: DonutSpecOptions = {
    ...defaultDonutOptionsWithSegmentLabel,
    segmentLabels: [{ value: true }],
  };
  const interactiveSegmentLabelOptions: SegmentLabelSpecOptions = {
    ...defaultSegmentLabelOptions,
    donutOptions: interactiveDonutOptions,
    value: true,
  };

  test('name line opacity fades with the arc, reusing getMarkOpacity - matches the arc mark exactly', () => {
    const mark = getSegmentLabelTextMark(interactiveSegmentLabelOptions);
    const opacity = mark.encode?.update?.opacity as { test?: string }[];
    expect(opacity.some((rule) => rule.test?.includes('hoveredItem'))).toBe(true);
  });

  test('name line fill never changes with hover - only the value line does', () => {
    const mark = getSegmentLabelTextMark(interactiveSegmentLabelOptions);
    expect(mark.encode?.enter?.fill).toEqual({ value: '#505050' });
    expect(mark.encode?.update?.fill).toBeUndefined();
  });

  test('value line opacity fades with the arc, reusing getMarkOpacity', () => {
    const [mark] = getSegmentLabelValueTextMark(interactiveSegmentLabelOptions);
    const opacity = mark.encode?.update?.opacity as { test?: string }[];
    expect(opacity.some((rule) => rule.test?.includes('hoveredItem'))).toBe(true);
  });

  test("value line fill switches to the segment's own categorical color when that segment is hovered", () => {
    const [mark] = getSegmentLabelValueTextMark(interactiveSegmentLabelOptions);
    expect(mark.encode?.update?.fill).toEqual([
      {
        test: "isValid(testName_hoveredItem) && testName_hoveredItem.rscMarkId === datum.rscMarkId",
        scale: 'color',
        field: 'testColor',
      },
      { value: '#505050' },
    ]);
  });

  test("value line fill also switches to the segment's own categorical color when a paired Legend's hovered entry matches it", () => {
    const [mark] = getSegmentLabelValueTextMark({
      ...interactiveSegmentLabelOptions,
      donutOptions: { ...interactiveDonutOptions, legendHighlightSignals: ['legend0_hoveredSeries'] },
    });
    expect(mark.encode?.update?.fill).toEqual([
      {
        test: "isValid(testName_hoveredItem) && testName_hoveredItem.rscMarkId === datum.rscMarkId",
        scale: 'color',
        field: 'testColor',
      },
      {
        test: 'isValid(legend0_hoveredSeries) && legend0_hoveredSeries === datum.rscSeriesId',
        scale: 'color',
        field: 'testColor',
      },
      { value: '#505050' },
    ]);
  });
});

describe('emphasize interaction', () => {
  // donut-emphasize only touches the arc mark's `fill` (donutUtils.ts) - a non-emphasized segment's
  // labels must stay fully visible and normally colored, unlike Line's primarySeries which suppresses
  // non-primary direct labels entirely
  const emphasizedDonutOptions: DonutSpecOptions = {
    ...defaultDonutOptionsWithSegmentLabel,
    segmentLabels: [{ value: true }],
    emphasizedItems: ['SomeOtherSegment'],
  };
  const emphasizedSegmentLabelOptions: SegmentLabelSpecOptions = {
    ...defaultSegmentLabelOptions,
    donutOptions: emphasizedDonutOptions,
    value: true,
  };
  const ordinaryDonutOptions: DonutSpecOptions = {
    ...defaultDonutOptionsWithSegmentLabel,
    segmentLabels: [{ value: true }],
  };
  const unemphasizedSegmentLabelOptions: SegmentLabelSpecOptions = {
    ...defaultSegmentLabelOptions,
    donutOptions: ordinaryDonutOptions,
    value: true,
  };

  test('a non-emphasized segment renders identical label encodes to an ordinary interactive donut', () => {
    const emphasizedMark = getSegmentLabelTextMark(emphasizedSegmentLabelOptions);
    const ordinaryMark = getSegmentLabelTextMark(unemphasizedSegmentLabelOptions);
    expect(emphasizedMark.encode).toEqual(ordinaryMark.encode);

    const [emphasizedValueMark] = getSegmentLabelValueTextMark(emphasizedSegmentLabelOptions);
    const [ordinaryValueMark] = getSegmentLabelValueTextMark(unemphasizedSegmentLabelOptions);
    expect(emphasizedValueMark.encode).toEqual(ordinaryValueMark.encode);
  });
});
