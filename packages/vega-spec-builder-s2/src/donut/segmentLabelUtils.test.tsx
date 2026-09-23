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

import {
  DONUT_ADVANCED_LABEL_DETAIL_FONT_SIZES,
  DONUT_ADVANCED_LABEL_NAME_FONT_SIZES,
  DONUT_ADVANCED_LABEL_VALUE_FONT_SIZES,
  DONUT_DIRECT_LABEL_NAME_FONT_SIZES,
  DONUT_DIRECT_LABEL_VALUE_FONT_SIZES,
  DONUT_SIZE_TIER_CUTPOINTS,
} from '@spectrum-charts/constants';

import { DonutSpecOptions, SegmentLabelSpecOptions } from '../types';
import { defaultDonutOptions } from './donutTestUtils';
import { getDonutEmptyStateTest } from './donutUtils';
import {
  getRichSegmentLabelData,
  getRichSegmentLabelMarks,
  getRichSegmentLabelScales,
  getRichSegmentLabelSignals,
  getRichSegmentLabelValueText,
  getSegmentLabelData,
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
  swatch: false,
  value: false,
  valueFormat: 'standardNumber',
  showValueRow: false,
  showTotal: false,
};

const richDonutOptions: DonutSpecOptions = {
  ...defaultDonutOptions,
  segmentLabels: [{ percent: true, showTotal: true, showValueRow: true, swatch: true, value: true }],
};

const richSegmentLabelOptions: SegmentLabelSpecOptions = {
  ...defaultSegmentLabelOptions,
  donutOptions: richDonutOptions,
  percent: true,
  showTotal: true,
  showValueRow: true,
  swatch: true,
  value: true,
};

const getOnlyRichLabelGroup = (options: DonutSpecOptions) => {
  const groups = getRichSegmentLabelMarks(options);
  expect(groups).toHaveLength(1);
  const [group] = groups;
  if (!group) throw new Error('Expected one rich SegmentLabel group');
  return group;
};

const getRequiredGroupMarks = (group: ReturnType<typeof getOnlyRichLabelGroup>) => {
  expect(group.marks).toBeDefined();
  if (!group.marks) throw new Error('Expected the rich SegmentLabel group to contain marks');
  return group.marks;
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
    expect(marks[0].marks).toHaveLength(2);
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

  test('should create separate direct and rich labels for emphasized and de-emphasized segments', () => {
    const donutOptions = {
      ...defaultDonutOptions,
      emphasizedItems: ['Chrome'],
      segmentLabels: [
        { labelMode: 'emphasized' as const, swatch: true },
        { labelMode: 'deemphasized' as const, value: true },
      ],
    };
    const data = [...getSegmentLabelData(donutOptions), ...getRichSegmentLabelData(donutOptions)];
    expect(data.map(({ name }) => name)).toEqual([
      'testName_deemphasizedSegmentLabelCandidates',
      'testName_deemphasizedSegmentLabelData',
      'testName_emphasizedRichSegmentLabelCandidates',
      'testName_emphasizedRichSegmentLabelData',
    ]);
    expect(data[0].transform?.[1]).toHaveProperty('expr', 'indexof(["Chrome"], datum.testColor) < 0');
    expect(data[2].transform?.[1]).toHaveProperty('expr', 'indexof(["Chrome"], datum.testColor) >= 0');
  });

  test('should omit de-emphasized labels when hideDeemphasizedLabels is true', () => {
    const data = [
      ...getSegmentLabelData({
        ...defaultDonutOptions,
        emphasizedItems: ['Chrome'],
        hideDeemphasizedLabels: true,
        segmentLabels: [
          { labelMode: 'emphasized' as const, swatch: true },
          { labelMode: 'deemphasized' as const, value: true },
        ],
      }),
      ...getRichSegmentLabelData({
        ...defaultDonutOptions,
        emphasizedItems: ['Chrome'],
        hideDeemphasizedLabels: true,
        segmentLabels: [
          { labelMode: 'emphasized' as const, swatch: true },
          { labelMode: 'deemphasized' as const, value: true },
        ],
      }),
    ];
    expect(data.map(({ name }) => name)).toEqual([
      'testName_emphasizedRichSegmentLabelCandidates',
      'testName_emphasizedRichSegmentLabelData',
    ]);
  });

  test('labelMode and hideDeemphasizedLabels should have no effect when emphasizedItems is not set', () => {
    const donutOptions = {
      ...defaultDonutOptions,
      hideDeemphasizedLabels: true,
      segmentLabels: [
        { labelMode: 'emphasized' as const, swatch: true },
        { labelMode: 'deemphasized' as const, value: true },
      ],
    };
    const data = [...getSegmentLabelData(donutOptions), ...getRichSegmentLabelData(donutOptions)];
    // falls back to the legacy single-label behavior: only the first SegmentLabel is used, unfiltered
    expect(data.map(({ name }) => name)).toEqual([
      'testName_emphasizedRichSegmentLabelCandidates',
      'testName_emphasizedRichSegmentLabelData',
    ]);
    expect(data[0].transform?.some((t) => t.type === 'filter' && 'expr' in t && t.expr.includes('indexof'))).toBe(
      false
    );
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

describe('rich SegmentLabel', () => {
  test('should create font scales and signals for each rich label row', () => {
    expect(getRichSegmentLabelScales(richDonutOptions)).toEqual([
      {
        name: 'testName_richSegmentLabelNameFontSizeScale',
        type: 'threshold',
        domain: DONUT_SIZE_TIER_CUTPOINTS,
        range: DONUT_ADVANCED_LABEL_NAME_FONT_SIZES,
      },
      {
        name: 'testName_richSegmentLabelValueFontSizeScale',
        type: 'threshold',
        domain: DONUT_SIZE_TIER_CUTPOINTS,
        range: DONUT_ADVANCED_LABEL_VALUE_FONT_SIZES,
      },
      {
        name: 'testName_richSegmentLabelDetailFontSizeScale',
        type: 'threshold',
        domain: DONUT_SIZE_TIER_CUTPOINTS,
        range: DONUT_ADVANCED_LABEL_DETAIL_FONT_SIZES,
      },
    ]);
    const donutDiameter = `2 * (((min(width, height) / 2 - 2) - 20) / (1 + 0.6))`;
    expect(getRichSegmentLabelSignals(richDonutOptions)).toEqual([
      {
        name: 'testName_richSegmentLabelNameFontSize',
        update: `scale('testName_richSegmentLabelNameFontSizeScale', ${donutDiameter})`,
      },
      {
        name: 'testName_richSegmentLabelValueFontSize',
        update: `scale('testName_richSegmentLabelValueFontSizeScale', ${donutDiameter})`,
      },
      {
        name: 'testName_richSegmentLabelDetailFontSize',
        update: `scale('testName_richSegmentLabelDetailFontSizeScale', ${donutDiameter})`,
      },
    ]);
  });

  test('should create position data for rich labels', () => {
    const dataSources = getRichSegmentLabelData(richDonutOptions);
    expect(dataSources).toHaveLength(2);
    const [candidates, visible] = dataSources;
    if (!candidates || !visible) throw new Error('Expected candidate and visible rich SegmentLabel data sources');
    expect(candidates).toMatchObject({
      name: 'testName_richSegmentLabelCandidates',
      source: 'filteredTable',
    });
    expect(candidates.transform).toHaveLength(14);
    expect(candidates.transform?.[1]).toHaveProperty('as', 'testName_richSegmentLabel_hemisphere');
    expect(candidates.transform?.[2]).toHaveProperty('as', 'testName_richSegmentLabel_radius');
    expect(candidates.transform?.[3]).toHaveProperty('as', 'testName_richSegmentLabel_idealY');
    expect(candidates.transform?.[4]).toHaveProperty('as', 'testName_richSegmentLabel_labelY');
    expect(candidates.transform?.[5]).toHaveProperty('as', 'testName_richSegmentLabel_centerY');
    expect(candidates.transform?.[6]).toHaveProperty('as', 'testName_richSegmentLabel_topY');
    expect(candidates.transform?.[7]).toHaveProperty('as', 'testName_richSegmentLabel_bottomY');
    expect(candidates.transform?.[8]).toHaveProperty('as', 'testName_richSegmentLabel_labelHalfWidth');
    expect(candidates.transform?.[9]).toHaveProperty('expr', expect.stringContaining('NameFontSize / 2'));
    expect(candidates.transform?.[10]).toHaveProperty('expr', expect.stringContaining('DetailFontSize / 2'));
    expect(candidates.transform?.[11]).toHaveProperty('as', 'testName_richSegmentLabel_leftX');
    expect(candidates.transform?.[12]).toHaveProperty('as', 'testName_richSegmentLabel_rightX');
    expect(candidates.transform?.[13]).toHaveProperty('as', 'testName_richSegmentLabel_collisionBoxes');
    expect(visible).toMatchObject({
      name: 'testName_richSegmentLabelData',
      source: 'testName_richSegmentLabelCandidates',
    });
    expect(visible.transform?.[0]).toHaveProperty('expr', expect.stringContaining('isDonutLabelVisible'));
  });

  test('should create swatch, name, value, detail value, and total suffix marks', () => {
    const group = getOnlyRichLabelGroup(richDonutOptions);
    expect(group.name).toBe('testName_richSegmentLabelGroup');
    const marks = getRequiredGroupMarks(group);
    expect(marks.map(({ name }) => name)).toEqual([
      'testName_richSegmentLabelSwatch',
      'testName_richSegmentLabelName',
      'testName_richSegmentLabelValue',
      'testName_richSegmentLabelDetailValue',
      'testName_richSegmentLabelDetailSuffix',
    ]);

    const [swatch, name, value, detail, suffix] = marks;
    if (!swatch || !name || !value || !detail || !suffix) {
      throw new Error('Expected all five rich SegmentLabel marks');
    }
    expect(swatch.encode?.update?.size).toEqual([
      {
        test: "length(data('filteredTable')) === 0 || !data('testName_sumData')[0]['sum'] || 2 * (((min(width, height) / 2 - 2) - 20) / (1 + 0.6)) < 160",
        value: 0,
      },
      { signal: '256' },
    ]);
    expect(swatch.encode?.update?.y).toEqual({
      signal: "datum['testName_richSegmentLabel_labelY']",
    });
    expect(name.encode?.update?.dx).toEqual({
      signal:
        "(datum['testName_richSegmentLabel_hemisphere'] === 'right' ? 1 : -1) * (2 * (((min(width, height) / 2 - 2) - 20) / (1 + 0.6)) >= 160 ? 24 : 0)",
    });
    expect(name.encode?.update?.dy).toEqual({ signal: '0' });
    expect(value.encode?.update?.dy).not.toHaveProperty(
      'signal',
      expect.stringContaining("cos(datum['testName_arcTheta'])")
    );
    expect(detail.encode?.enter?.text).toEqual([
      { test: "length(data('filteredTable')) === 0 || !data('testName_sumData')[0]['sum']", value: '' },
      { test: "isNumber(datum['testMetric'])", signal: "format(datum['testMetric'], ',')" },
    ]);
    expect(suffix.encode?.enter?.text).toEqual([
      { test: "length(data('filteredTable')) === 0 || !data('testName_sumData')[0]['sum']", value: '' },
      {
        signal: `" / " + format(data('testName_sumData')[0]['sum'], ',')`,
      },
    ]);
  });

  test('should omit optional rich rows and offsets when they are disabled', () => {
    const swatchOnlyOptions: DonutSpecOptions = {
      ...defaultDonutOptions,
      segmentLabels: [{ swatch: true, value: false }],
    };
    const marks = getRequiredGroupMarks(getOnlyRichLabelGroup(swatchOnlyOptions));
    expect(marks.map(({ name }) => name)).toEqual(['testName_richSegmentLabelSwatch', 'testName_richSegmentLabelName']);
    expect(marks[1]?.encode?.update?.dy).toEqual({ signal: '0' });
  });

  test('should create a detail value without a total suffix or primary value row', () => {
    const detailOnlyOptions: DonutSpecOptions = {
      ...defaultDonutOptions,
      segmentLabels: [{ showValueRow: true, value: false }],
    };
    const marks = getRequiredGroupMarks(getOnlyRichLabelGroup(detailOnlyOptions));
    expect(marks.map(({ name }) => name)).toEqual([
      'testName_richSegmentLabelName',
      'testName_richSegmentLabelDetailValue',
    ]);
    expect(marks[1]?.encode?.update?.dy).not.toHaveProperty(
      'signal',
      expect.stringContaining("cos(datum['testName_arcTheta'])")
    );
    const [candidates] = getRichSegmentLabelData(detailOnlyOptions);
    expect(candidates?.transform?.[13]).toHaveProperty(
      'expr',
      expect.stringContaining('testName_richSegmentLabelDetailFontSize')
    );
    expect(candidates?.transform?.[13]).not.toHaveProperty(
      'expr',
      expect.stringContaining('testName_richSegmentLabelValueFontSize')
    );
  });

  test('should reuse the standard value and percent formatting rules', () => {
    expect(getRichSegmentLabelValueText(richSegmentLabelOptions)).toEqual([
      {
        test: "isNumber(datum['testMetric'])",
        signal: `format(datum['testName_arcPercent'], '.0%') + "\\u00a0\\u00a0" + format(datum['testMetric'], ',')`,
      },
    ]);
    expect(getRichSegmentLabelValueText({ ...richSegmentLabelOptions, percent: false, value: false })).toBeUndefined();
  });

  test('should not create rich content for direct labels or boolean donuts', () => {
    expect(getRichSegmentLabelScales(defaultDonutOptionsWithSegmentLabel)).toEqual([]);
    expect(getRichSegmentLabelSignals(defaultDonutOptionsWithSegmentLabel)).toEqual([]);
    expect(getRichSegmentLabelData(defaultDonutOptionsWithSegmentLabel)).toEqual([]);
    expect(getRichSegmentLabelMarks({ ...richDonutOptions, isBoolean: true })).toEqual([]);
  });
});

describe('label anchor x/y and dx (hemisphere offset)', () => {
  test('normalizes rotated arc angles for both direct and rich label hemisphere fields', () => {
    const directData = getSegmentLabelData({
      ...defaultDonutOptions,
      startAngle: Math.PI / 2,
      segmentLabels: [{}],
    });
    const richData = getRichSegmentLabelData({
      ...defaultDonutOptions,
      startAngle: Math.PI / 2,
      segmentLabels: [{ swatch: true }],
    });
    const expected =
      "(((datum['testName_arcTheta']) % (2 * PI)) + 2 * PI) % (2 * PI) <= PI ? 'right' : 'left'";

    expect(directData[0]?.transform?.[1]).toHaveProperty('expr', expected);
    expect(richData[0]?.transform?.[1]).toHaveProperty('expr', expected);
  });

  test('y should come from the slice-derived label field', () => {
    const mark = getSegmentLabelTextMark(defaultSegmentLabelOptions);
    expect(mark.encode?.update?.y).toEqual({ field: 'testName_segmentLabel_labelY' });
    expect(mark.encode?.update?.baseline).toEqual({ value: 'middle' });
    expect(mark.encode?.update?.radius).toBeUndefined();
    expect(mark.encode?.update?.theta).toBeUndefined();
  });

  test('rich label rows should be centered on the slice-derived label field', () => {
    const marks = getRequiredGroupMarks(getOnlyRichLabelGroup(richDonutOptions));
    const nameMark = marks.find(({ name }) => name === 'testName_richSegmentLabelName');
    expect(nameMark?.encode?.update?.y).toEqual({ field: 'testName_richSegmentLabel_labelY' });
    expect(nameMark?.encode?.update?.baseline).toEqual({ value: 'middle' });
  });

  test('x should place the anchor at the radial half-width, mirrored by hemisphere', () => {
    const mark = getSegmentLabelTextMark(defaultSegmentLabelOptions);
    expect(mark.encode?.update?.x).toEqual({
      signal:
        "datum['testName_segmentLabel_hemisphere'] === 'right' ? width / 2 + datum['testName_segmentLabel_labelHalfWidth'] : width / 2 - datum['testName_segmentLabel_labelHalfWidth']",
    });
  });

  test('name and value marks should share the exact same x and y expressions', () => {
    const nameMark = getSegmentLabelTextMark({ ...defaultSegmentLabelOptions, value: true });
    const [valueMark] = getSegmentLabelValueTextMark({ ...defaultSegmentLabelOptions, value: true });
    expect(nameMark.encode?.update?.x).toEqual(valueMark.encode?.update?.x);
    expect(nameMark.encode?.update?.y).toEqual(valueMark.encode?.update?.y);
    expect(nameMark.encode?.update?.align).toEqual(valueMark.encode?.update?.align);
  });

  test('should align labels toward the donut center', () => {
    const mark = getSegmentLabelTextMark(defaultSegmentLabelOptions);
    expect(mark.encode?.update?.align).toEqual({
      signal: "datum['testName_segmentLabel_hemisphere'] === 'right' ? 'left' : 'right'",
    });
  });

  test('should use the labelKey field for width calculations when provided', () => {
    const mark = getSegmentLabelTextMark({ ...defaultSegmentLabelOptions, labelKey: 'region' });
    const limitSignal = (mark.encode?.update?.limit as { signal: string }).signal;
    expect(limitSignal).toContain("getLabelWidth(datum['region']");
  });
});

describe('truncation limit', () => {
  test('should constrain both hemispheres when content exceeds the available reach', () => {
    const mark = getSegmentLabelTextMark(defaultSegmentLabelOptions);
    const limitSignal = (mark.encode?.update?.limit as { signal: string }).signal;
    expect(limitSignal).not.toContain('hemisphere');
    expect(limitSignal).toContain('? 0 : max(1,');
  });

  test("should only apply a real limit when content exceeds the available reach, not the line's own natural width", () => {
    const mark = getSegmentLabelTextMark(defaultSegmentLabelOptions);
    const limitSignal = (mark.encode?.update?.limit as { signal: string }).signal;
    // guards against the razor's-edge case where limit equals the line's own exact width - see
    // getLimitExpr's doc comment. The comparison must be present so a line that already fits isn't
    // handed a limit that's numerically identical to its own measured width.
    expect(limitSignal).toContain('<= (');
    expect(limitSignal).toContain('? 0 :');
  });

  test('name and value marks should share the exact same limit expression', () => {
    const nameMark = getSegmentLabelTextMark({ ...defaultSegmentLabelOptions, value: true });
    const [valueMark] = getSegmentLabelValueTextMark({ ...defaultSegmentLabelOptions, value: true });
    expect(nameMark.encode?.update?.limit).toEqual(valueMark.encode?.update?.limit);
  });

  test('should constrain every rich label row on both hemispheres', () => {
    const marks = getRequiredGroupMarks(getOnlyRichLabelGroup(richDonutOptions));
    const textMarks = marks.filter(({ type }) => type === 'text');

    textMarks.forEach((mark) => {
      const limitSignal = (mark.encode?.update?.limit as { signal: string }).signal;
      expect(limitSignal).not.toMatch(/hemisphere.*\|\|/);
      expect(limitSignal).toContain('? 0 : max(1,');
    });
  });

  test('should reserve preceding detail-row content before limiting the remaining text', () => {
    const marks = getRequiredGroupMarks(getOnlyRichLabelGroup(richDonutOptions));
    const detail = marks.find(({ name }) => name === 'testName_richSegmentLabelDetailValue');
    const suffix = marks.find(({ name }) => name === 'testName_richSegmentLabelDetailSuffix');
    const detailLimit = (detail?.encode?.update?.limit as { signal: string }).signal;
    const suffixLimit = (suffix?.encode?.update?.limit as { signal: string }).signal;

    expect(detailLimit).toContain("datum['testName_richSegmentLabel_hemisphere'] === 'left'");
    expect(suffixLimit).toContain("datum['testName_richSegmentLabel_hemisphere'] === 'right'");
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
  test('name dy should center the name/value block on the slice', () => {
    const mark = getSegmentLabelTextMark({ ...defaultSegmentLabelOptions, value: true });
    expect(mark.encode?.update?.dy).toEqual({
      signal: '-testName_segmentLabelValueFontSize / 2',
    });
  });
  test('should hide labels when the donut is in the empty state', () => {
    const mark = getSegmentLabelTextMark(defaultSegmentLabelOptions);
    expect(mark.encode?.update?.fontSize).toEqual([
      {
        test: `${getDonutEmptyStateTest('testName')} || 2 * (((min(width, height) / 2 - 2) - 20) / (1 + 0.6)) < 120`,
        value: 0,
      },
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
          test: 'isValid(testName_hoveredItem) && testName_hoveredItem.rscMarkId === datum.rscMarkId',
          scale: 'color',
          field: 'testColor',
        },
        { value: '#505050' },
      ]);
    });

    test('value dy should center the name/value block on the slice', () => {
      const [mark] = getSegmentLabelValueTextMark({ ...defaultSegmentLabelOptions, value: true });
      expect(mark.encode?.update?.dy).toEqual({
        signal: 'testName_segmentLabelNameFontSize / 2',
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
        test: 'isValid(testName_hoveredItem) && testName_hoveredItem.rscMarkId === datum.rscMarkId',
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
        test: 'isValid(testName_hoveredItem) && testName_hoveredItem.rscMarkId === datum.rscMarkId',
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
