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
import { SymbolMark, TextMark } from 'vega';

import {
  DONUT_ADVANCED_LABEL_DETAIL_FONT_SIZES,
  DONUT_ADVANCED_LABEL_NAME_FONT_SIZES,
  DONUT_ADVANCED_LABEL_SWATCH_GAP,
  DONUT_ADVANCED_LABEL_SWATCH_SIZE,
  DONUT_ADVANCED_LABEL_VALUE_FONT_SIZES,
  DONUT_SIZE_TIER_CUTPOINTS,
  ROUNDED_SQUARE_PATH,
} from '@spectrum-charts/constants';

import { AdvancedLabelSpecOptions, DonutSpecOptions } from '../types';
import { defaultDonutOptions } from './donutTestUtils';
import { getAdvancedLabelMarks, getAdvancedLabelScales, getAdvancedLabelSignals, getAdvancedLabelValueText } from './advancedLabelUtils';

const defaultDonutOptionsWithAdvancedLabel: DonutSpecOptions = {
  ...defaultDonutOptions,
  advancedLabels: [{}],
};

const defaultAdvancedLabelOptions: AdvancedLabelSpecOptions = {
  donutOptions: defaultDonutOptionsWithAdvancedLabel,
  percent: false,
  percentFormat: '.0%',
  value: false,
  valueFormat: 'standardNumber',
  detail: false,
};

describe('getAdvancedLabelMarks()', () => {
  test('should return empty array if isBoolean', () => {
    const marks = getAdvancedLabelMarks({ ...defaultDonutOptionsWithAdvancedLabel, isBoolean: true });
    expect(marks).toEqual([]);
  });

  test('should return empty array if there is no AdvancedLabel on the Donut', () => {
    expect(getAdvancedLabelMarks(defaultDonutOptions)).toEqual([]);
  });

  test('should return a group with a swatch and a name mark when value/percent/detail are all false', () => {
    const marks = getAdvancedLabelMarks(defaultDonutOptionsWithAdvancedLabel);
    expect(marks).toHaveLength(1);
    expect(marks[0].type).toEqual('group');
    expect(marks[0].marks).toHaveLength(2);
    expect(marks[0].marks?.[0].type).toEqual('symbol');
    expect(marks[0].marks?.[1].type).toEqual('text');
  });

  test('should add a value text mark when value is true', () => {
    const marks = getAdvancedLabelMarks({ ...defaultDonutOptionsWithAdvancedLabel, advancedLabels: [{ value: true }] });
    expect(marks[0].marks).toHaveLength(3);
    expect(marks[0].marks?.[2].type).toEqual('text');
  });

  test('should add a value text mark when percent is true', () => {
    const marks = getAdvancedLabelMarks({ ...defaultDonutOptionsWithAdvancedLabel, advancedLabels: [{ percent: true }] });
    expect(marks[0].marks).toHaveLength(3);
  });

  test('should add a detail text mark when detail is true, independent of value/percent', () => {
    const marks = getAdvancedLabelMarks({ ...defaultDonutOptionsWithAdvancedLabel, advancedLabels: [{ detail: true }] });
    expect(marks[0].marks).toHaveLength(3);
    expect(marks[0].marks?.[2].type).toEqual('text');
  });

  test('should add both value and detail text marks when both are true', () => {
    const marks = getAdvancedLabelMarks({
      ...defaultDonutOptionsWithAdvancedLabel,
      advancedLabels: [{ value: true, detail: true }],
    });
    expect(marks[0].marks).toHaveLength(4);
  });
});

describe('getAdvancedLabelValueText()', () => {
  test('should return undefined if value and percent are false', () => {
    expect(getAdvancedLabelValueText(defaultAdvancedLabelOptions)).toBeUndefined();
  });

  test('should return a simple percentSignal if percent is true and value is false', () => {
    expect(getAdvancedLabelValueText({ ...defaultAdvancedLabelOptions, percent: true })).toHaveProperty(
      'signal',
      `format(datum['testName_arcPercent'], '.0%')`
    );
  });

  test('should use custom percentFormat when provided', () => {
    expect(
      getAdvancedLabelValueText({ ...defaultAdvancedLabelOptions, percent: true, percentFormat: '.1%' })
    ).toHaveProperty('signal', `format(datum['testName_arcPercent'], '.1%')`);
  });

  test('should return an array of rules if value is true', () => {
    const rules = getAdvancedLabelValueText({ ...defaultAdvancedLabelOptions, value: true });
    expect(rules).toHaveLength(1);
    expect(rules?.[0]).toHaveProperty('signal', "format(datum['testMetric'], ',')");
  });

  test('should have percentSignal combined with value signal if value and percent are true', () => {
    const rules = getAdvancedLabelValueText({ ...defaultAdvancedLabelOptions, value: true, percent: true });
    expect(rules).toHaveLength(1);
    expect(rules?.[0].signal).toContain('_arcPercent');
    expect(rules?.[0].signal).toContain('testMetric');
  });
});

describe('getAdvancedLabelScales()', () => {
  test('should return empty array if there is not an AdvancedLabel on the Donut', () => {
    expect(getAdvancedLabelScales(defaultDonutOptions)).toEqual([]);
  });

  test('should snap outer diameter to the nearest named tier for name/value/detail font sizes', () => {
    const scales = getAdvancedLabelScales(defaultDonutOptionsWithAdvancedLabel);
    expect(scales).toEqual([
      {
        name: 'testName_advancedLabelNameFontSizeScale',
        type: 'threshold',
        domain: DONUT_SIZE_TIER_CUTPOINTS,
        range: DONUT_ADVANCED_LABEL_NAME_FONT_SIZES,
      },
      {
        name: 'testName_advancedLabelValueFontSizeScale',
        type: 'threshold',
        domain: DONUT_SIZE_TIER_CUTPOINTS,
        range: DONUT_ADVANCED_LABEL_VALUE_FONT_SIZES,
      },
      {
        name: 'testName_advancedLabelDetailFontSizeScale',
        type: 'threshold',
        domain: DONUT_SIZE_TIER_CUTPOINTS,
        range: DONUT_ADVANCED_LABEL_DETAIL_FONT_SIZES,
      },
    ]);
  });
});

describe('getAdvancedLabelSignals()', () => {
  test('should return empty array if there is not an AdvancedLabel on the Donut', () => {
    expect(getAdvancedLabelSignals(defaultDonutOptions)).toEqual([]);
  });

  test('should resolve name/value/detail font sizes from the outer diameter', () => {
    const signals = getAdvancedLabelSignals(defaultDonutOptionsWithAdvancedLabel);
    const donutDiameter = '2 * (((min(width, height) / 2 - 2) - 20) / (1 + 0.6))';
    expect(signals).toEqual([
      {
        name: 'testName_advancedLabelNameFontSize',
        update: `scale('testName_advancedLabelNameFontSizeScale', ${donutDiameter})`,
      },
      {
        name: 'testName_advancedLabelValueFontSize',
        update: `scale('testName_advancedLabelValueFontSizeScale', ${donutDiameter})`,
      },
      {
        name: 'testName_advancedLabelDetailFontSize',
        update: `scale('testName_advancedLabelDetailFontSizeScale', ${donutDiameter})`,
      },
    ]);
  });
});

describe('label anchor x/y (collision-aware positioning) and dx (hemisphere offset)', () => {
  const getNameMark = (donutOptions: DonutSpecOptions): TextMark =>
    getAdvancedLabelMarks(donutOptions)[0].marks?.[1] as TextMark;

  test('y should come from the collision-adjusted field, not a polar radius/theta anchor', () => {
    const nameMark = getNameMark(defaultDonutOptionsWithAdvancedLabel);
    expect(nameMark.encode?.update?.y).toEqual({ field: 'testName_advancedLabel_adjustedY' });
    expect(nameMark.encode?.update?.radius).toBeUndefined();
    expect(nameMark.encode?.update?.theta).toBeUndefined();
  });

  test('x should place the anchor at the collision-adjusted ring half-width, mirrored by hemisphere', () => {
    const nameMark = getNameMark(defaultDonutOptionsWithAdvancedLabel);
    expect(nameMark.encode?.update?.x).toEqual({
      signal:
        "datum['testName_advancedLabel_hemisphere'] === 'right' ? width / 2 + datum['testName_advancedLabel_collisionHalfWidth'] : width / 2 - datum['testName_advancedLabel_collisionHalfWidth']",
    });
  });

  test('right hemisphere should get no horizontal offset', () => {
    const nameMark = getNameMark(defaultDonutOptionsWithAdvancedLabel);
    const dxSignal = (nameMark.encode?.update?.dx as { signal: string }).signal;
    expect(dxSignal).toContain("datum['testName_advancedLabel_hemisphere'] === 'right' ? 0 : -(");
  });

  test('dx should account for the swatch+name width when no value/detail rows are shown', () => {
    const nameMark = getNameMark(defaultDonutOptionsWithAdvancedLabel);
    const dxSignal = (nameMark.encode?.update?.dx as { signal: string }).signal;
    expect(dxSignal).toContain(
      `${DONUT_ADVANCED_LABEL_SWATCH_SIZE} + ${DONUT_ADVANCED_LABEL_SWATCH_GAP} + getLabelWidth(datum['testColor'], 400, testName_advancedLabelNameFontSize)`
    );
  });

  test('dx should account for the value row width when value is shown', () => {
    const donutOptions = { ...defaultDonutOptionsWithAdvancedLabel, advancedLabels: [{ value: true }] };
    const nameMark = getNameMark(donutOptions);
    const dxSignal = (nameMark.encode?.update?.dx as { signal: string }).signal;
    expect(dxSignal).toContain("getLabelWidth(format(datum['testMetric'], ','), 800, testName_advancedLabelValueFontSize)");
  });

  test('dx should account for the detail row width when detail is shown', () => {
    const donutOptions = { ...defaultDonutOptionsWithAdvancedLabel, advancedLabels: [{ detail: true }] };
    const nameMark = getNameMark(donutOptions);
    const dxSignal = (nameMark.encode?.update?.dx as { signal: string }).signal;
    expect(dxSignal).toContain('out of');
    expect(dxSignal).toContain("testName_sumData')[0]['sum']");
    expect(dxSignal).toContain('testName_advancedLabelDetailFontSize');
  });

  test('the pull-back should be capped at however much room remains before the container edge', () => {
    const nameMark = getNameMark(defaultDonutOptionsWithAdvancedLabel);
    const dxSignal = (nameMark.encode?.update?.dx as { signal: string }).signal;
    expect(dxSignal).toContain('min(max(');
    // the cap is per-label (available radius minus this label's own ring half-width at its actual
    // Y), not a flat ratio of the ring's radius - see getAdvancedLabelWidthExprs
    expect(dxSignal).toContain("(min(width, height) / 2 - 2) - datum['testName_advancedLabel_collisionHalfWidth']");
  });

  test('should use the labelKey field instead of color when provided', () => {
    const donutOptions = { ...defaultDonutOptionsWithAdvancedLabel, advancedLabels: [{ labelKey: 'region' }] };
    const nameMark = getNameMark(donutOptions);
    const dxSignal = (nameMark.encode?.update?.dx as { signal: string }).signal;
    expect(dxSignal).toContain("datum['region']");
  });

  test('name row dx should include the extra swatch offset beyond the shared anchor dx', () => {
    const nameMark = getNameMark(defaultDonutOptionsWithAdvancedLabel);
    const dxSignal = (nameMark.encode?.update?.dx as { signal: string }).signal;
    expect(dxSignal.endsWith(`+ ${DONUT_ADVANCED_LABEL_SWATCH_SIZE} + ${DONUT_ADVANCED_LABEL_SWATCH_GAP}`)).toBe(true);
  });

  test('both hemispheres should use left alignment', () => {
    const nameMark = getNameMark(defaultDonutOptionsWithAdvancedLabel);
    expect(nameMark.encode?.update?.align).toEqual({ value: 'left' });
  });

  test('name and value marks should share the exact same x and y', () => {
    const donutOptions = { ...defaultDonutOptionsWithAdvancedLabel, advancedLabels: [{ value: true }] };
    const marks = getAdvancedLabelMarks(donutOptions)[0].marks as [SymbolMark, TextMark, TextMark];
    const [, nameMark, valueMark] = marks;
    expect(nameMark.encode?.update?.x).toEqual(valueMark.encode?.update?.x);
    expect(nameMark.encode?.update?.y).toEqual(valueMark.encode?.update?.y);
  });
});

describe('vertical row-stacking cap (getAdvancedLabelRowDy)', () => {
  test('should not define dy on the name row when value/percent/detail are all false', () => {
    const nameMark = getAdvancedLabelMarks(defaultDonutOptionsWithAdvancedLabel)[0].marks?.[1] as TextMark;
    expect(nameMark.encode?.update?.dy).toEqual({
      signal: "datum['testName_advancedLabel_adjustedY'] <= height / 2 ? (0) : 0",
    });
  });

  test('the value row dy should scale down by the same ratio reserved horizontally, not grow unbounded', () => {
    const donutOptions = { ...defaultDonutOptionsWithAdvancedLabel, advancedLabels: [{ value: true }] };
    const [, , valueMark] = getAdvancedLabelMarks(donutOptions)[0].marks as [SymbolMark, TextMark, TextMark];
    const dySignal = (valueMark.encode?.update?.dy as { signal: string }).signal;
    // the scale-down factor caps the total block height against the exact same margin
    // getDonutOuterRadiusExpr reserves horizontally (DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO) - see
    // the "ring should not shrink" fix in advancedLabelUtils.ts
    expect(dySignal).toContain('min(1, (');
    expect(dySignal).toContain('(((min(width, height) / 2 - 2) - 20) / (1 + 0.6)) * 0.6');
    expect(dySignal).toContain('testName_advancedLabelNameFontSize + 4 + testName_advancedLabelValueFontSize');
  });

  test('the detail row dy should fold in the value row height when both are shown', () => {
    const donutOptions = { ...defaultDonutOptionsWithAdvancedLabel, advancedLabels: [{ value: true, detail: true }] };
    const marks = getAdvancedLabelMarks(donutOptions)[0].marks as [SymbolMark, TextMark, TextMark, TextMark];
    const [, , , detailMark] = marks;
    const dySignal = (detailMark.encode?.update?.dy as { signal: string }).signal;
    expect(dySignal).toContain('testName_advancedLabelNameFontSize');
    expect(dySignal).toContain('testName_advancedLabelValueFontSize');
    expect(dySignal).toContain('testName_advancedLabelDetailFontSize');
  });

  test('a hidden row is skipped - detail immediately follows name when value/percent are false', () => {
    const donutOptions = { ...defaultDonutOptionsWithAdvancedLabel, advancedLabels: [{ detail: true }] };
    const [, , detailMark] = getAdvancedLabelMarks(donutOptions)[0].marks as [SymbolMark, TextMark, TextMark];
    const dySignal = (detailMark.encode?.update?.dy as { signal: string }).signal;
    expect(dySignal).not.toContain('advancedLabelValueFontSize');
  });
});

describe('getAdvancedLabelSwatchMark()', () => {
  const getSwatchAndNameMarks = (donutOptions: DonutSpecOptions): [SymbolMark, TextMark] =>
    getAdvancedLabelMarks(donutOptions)[0].marks as [SymbolMark, TextMark];

  test('should be a symbol mark using the rounded-square shape', () => {
    const [swatchMark] = getSwatchAndNameMarks(defaultDonutOptionsWithAdvancedLabel);
    expect(swatchMark.type).toEqual('symbol');
    expect(swatchMark.encode?.enter?.shape).toEqual({ value: ROUNDED_SQUARE_PATH });
  });

  test('should size the swatch to the configured swatch size', () => {
    const [swatchMark] = getSwatchAndNameMarks(defaultDonutOptionsWithAdvancedLabel);
    expect(swatchMark.encode?.update?.size).toEqual([
      { test: expect.stringContaining('length'), value: 0 },
      { signal: `${DONUT_ADVANCED_LABEL_SWATCH_SIZE * DONUT_ADVANCED_LABEL_SWATCH_SIZE}` },
    ]);
  });

  test("x should shift right by half the swatch size so its left edge lines up with the text rows' left edge", () => {
    const [swatchMark] = getSwatchAndNameMarks(defaultDonutOptionsWithAdvancedLabel);
    const xSignal = (swatchMark.encode?.update?.x as { signal: string }).signal;
    expect(xSignal.endsWith(`+ ${DONUT_ADVANCED_LABEL_SWATCH_SIZE / 2}`)).toBe(true);
  });

  test('swatch and name row should share the exact same underlying hemisphere pull-back (dx) expression', () => {
    const [swatchMark, nameMark] = getSwatchAndNameMarks(defaultDonutOptionsWithAdvancedLabel);
    const swatchXSignal = (swatchMark.encode?.update?.x as { signal: string }).signal;
    const nameDxSignal = (nameMark.encode?.update?.dx as { signal: string }).signal;
    // the capped-width computation itself must be identical between the swatch's x and the name row's
    // dx, or the swatch/text would drift apart on the left hemisphere
    const cappedWidthExpr = `16 + 8 + getLabelWidth(datum['testColor'], 400, testName_advancedLabelNameFontSize)`;
    expect(swatchXSignal).toContain(cappedWidthExpr);
    expect(nameDxSignal).toContain(cappedWidthExpr);
  });
});

describe('truncation limit', () => {
  const getNameMark = (donutOptions: DonutSpecOptions): TextMark =>
    getAdvancedLabelMarks(donutOptions)[0].marks?.[1] as TextMark;

  test('right hemisphere should never be truncated (limit 0, unlimited) regardless of content width', () => {
    const nameMark = getNameMark(defaultDonutOptionsWithAdvancedLabel);
    const limitSignal = (nameMark.encode?.update?.limit as { signal: string }).signal;
    expect(limitSignal).toContain("datum['testName_advancedLabel_hemisphere'] === 'right' ||");
    expect(limitSignal).toMatch(/=== 'right'.*\? 0 :/);
  });

  test("left hemisphere should only apply a real limit when content exceeds the available reach, not the row's own natural width", () => {
    const nameMark = getNameMark(defaultDonutOptionsWithAdvancedLabel);
    const limitSignal = (nameMark.encode?.update?.limit as { signal: string }).signal;
    // guards against the razor's-edge case where limit equals the row's own exact width - see
    // getAdvancedLabelLimitExpr's doc comment
    expect(limitSignal).toContain('<= (');
    expect(limitSignal).toContain('? 0 :');
  });

  test("name row's limit reserves the swatch + gap, so only the text portion is constrained", () => {
    const nameMark = getNameMark(defaultDonutOptionsWithAdvancedLabel);
    const limitSignal = (nameMark.encode?.update?.limit as { signal: string }).signal;
    expect(limitSignal).toContain(`- (${DONUT_ADVANCED_LABEL_SWATCH_SIZE} + ${DONUT_ADVANCED_LABEL_SWATCH_GAP})`);
  });

  test('value row does not reserve any extra width in its limit (trailing subtraction is 0)', () => {
    const donutOptions = { ...defaultDonutOptionsWithAdvancedLabel, advancedLabels: [{ value: true }] };
    const [, , valueMark] = getAdvancedLabelMarks(donutOptions)[0].marks as [SymbolMark, TextMark, TextMark];
    const limitSignal = (valueMark.encode?.update?.limit as { signal: string }).signal;
    expect(limitSignal).toContain('? 0 :');
    // the trailing subtraction (extraReservedWidthExpr) must be 0 for the value row - unlike the
    // name row, which reserves the swatch + gap out of the shared cap
    expect(limitSignal.endsWith('- (0)')).toBe(true);
  });

  test('name and value rows should share the exact same underlying width comparisons in their limit', () => {
    const donutOptions = { ...defaultDonutOptionsWithAdvancedLabel, advancedLabels: [{ value: true }] };
    const marks = getAdvancedLabelMarks(donutOptions)[0].marks as [SymbolMark, TextMark, TextMark];
    const [, nameMark, valueMark] = marks;
    const nameLimit = (nameMark.encode?.update?.limit as { signal: string }).signal;
    const valueLimit = (valueMark.encode?.update?.limit as { signal: string }).signal;
    // both should gate on the identical widerWidth <= maxReach comparison, differing only in the
    // trailing subtraction (name reserves the swatch+gap, value reserves nothing)
    const [nameCondition] = nameLimit.split('? 0 :');
    const [valueCondition] = valueLimit.split('? 0 :');
    expect(nameCondition).toBe(valueCondition);
  });
});

describe('s2 styles', () => {
  test('name row should always use S2 styles (no bold, gray-700 fill)', () => {
    const nameMark = getAdvancedLabelMarks(defaultDonutOptionsWithAdvancedLabel)[0].marks?.[1] as TextMark;
    expect(nameMark.encode?.enter?.fontWeight).toBeUndefined();
    expect(nameMark.encode?.enter?.fill).toEqual({ value: '#505050' });
  });

  test('value row should always add bold fontWeight, and default to gray-800 fill for S2', () => {
    const donutOptions = { ...defaultDonutOptionsWithAdvancedLabel, advancedLabels: [{ value: true }] };
    const [, , valueMark] = getAdvancedLabelMarks(donutOptions)[0].marks as [SymbolMark, TextMark, TextMark];
    expect(valueMark.encode?.enter?.fontWeight).toEqual({ value: 800 });
    expect(valueMark.encode?.update?.fill).toEqual([
      {
        test: 'isValid(testName_hoveredItem) && testName_hoveredItem.rscMarkId === datum.rscMarkId',
        scale: 'color',
        field: 'testColor',
      },
      { value: '#292929' },
    ]);
  });

  test('detail row should use gray-700 fill, unaffected by hover', () => {
    const donutOptions = { ...defaultDonutOptionsWithAdvancedLabel, advancedLabels: [{ detail: true }] };
    const [, , detailMark] = getAdvancedLabelMarks(donutOptions)[0].marks as [SymbolMark, TextMark, TextMark];
    expect(detailMark.encode?.enter?.fill).toEqual({ value: '#505050' });
  });
});

describe('hover behavior', () => {
  // an AdvancedLabel showing a value is what makes isInteractive() (and therefore getMarkOpacity()) treat
  // this donut as interactive - see markUtils.test.ts for the isInteractive() coverage itself
  const interactiveDonutOptions: DonutSpecOptions = {
    ...defaultDonutOptionsWithAdvancedLabel,
    advancedLabels: [{ value: true }],
  };

  test('name mark opacity fades with the arc, reusing getMarkOpacity - matches the arc mark exactly', () => {
    const nameMark = getAdvancedLabelMarks(interactiveDonutOptions)[0].marks?.[1] as TextMark;
    const opacity = nameMark.encode?.update?.opacity as { test?: string }[];
    expect(opacity.some((rule) => rule.test?.includes('hoveredItem'))).toBe(true);
  });

  test('name mark fill never changes with hover - only the value mark does', () => {
    const nameMark = getAdvancedLabelMarks(interactiveDonutOptions)[0].marks?.[1] as TextMark;
    expect(nameMark.encode?.enter?.fill).toEqual({ value: '#505050' });
    expect(nameMark.encode?.update?.fill).toBeUndefined();
  });

  test("value mark fill switches to the segment's own categorical color when that segment is hovered", () => {
    const [, , valueMark] = getAdvancedLabelMarks(interactiveDonutOptions)[0].marks as [SymbolMark, TextMark, TextMark];
    expect(valueMark.encode?.update?.fill).toEqual([
      {
        test: 'isValid(testName_hoveredItem) && testName_hoveredItem.rscMarkId === datum.rscMarkId',
        scale: 'color',
        field: 'testColor',
      },
      { value: '#292929' },
    ]);
  });
});

describe('empty state', () => {
  test('name, value, and detail marks should all hide text and fontSize in the empty state', () => {
    const donutOptions = { ...defaultDonutOptionsWithAdvancedLabel, advancedLabels: [{ value: true, detail: true }] };
    const marks = getAdvancedLabelMarks(donutOptions)[0].marks as [SymbolMark, TextMark, TextMark, TextMark];
    const [, nameMark, valueMark, detailMark] = marks;
    for (const mark of [nameMark, valueMark, detailMark]) {
      const textRules = mark.encode?.enter?.text as { test?: string; value?: string }[];
      expect(textRules[0]).toHaveProperty('value', '');
      const fontSizeRules = mark.encode?.update?.fontSize as { test?: string }[];
      expect(fontSizeRules[0].test).toContain("length(data('filteredTable'))");
    }
  });
});
