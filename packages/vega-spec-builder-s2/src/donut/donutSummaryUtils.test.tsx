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
import { Spec, View, expressionFunction, parse } from 'vega';

import {
  DONUT_SIZE_TIER_CUTPOINTS,
  DONUT_SUMMARY_LABEL_FONT_SIZES,
  DONUT_SUMMARY_VALUE_FONT_SIZES,
} from '@spectrum-charts/constants';
import { spectrum2Colors } from '@spectrum-charts/themes';

import { getExpressionFunctions } from '../expressionFunctions';
import { DonutSummarySpecOptions } from '../types';
import {
  getBooleanDonutSummaryGroupMark,
  getDonutSummaryData,
  getDonutSummaryGroupMark,
  getDonutSummaryScales,
  getDonutSummarySignals,
  getSummaryDeltaEncode,
  getSummaryDeltaFill,
  getSummaryDeltaText,
  getSummaryLabelEncode,
  getSummaryValueBaseline,
  getSummaryValueEncode,
  getSummaryValueLimit,
  getSummaryValueText,
} from './donutSummaryUtils';
import { defaultDonutOptions } from './donutTestUtils';
import { getRingWidthScale, getRingWidthSignal } from './donutUtils';

const defaultDonutSummaryOptions: DonutSummarySpecOptions = {
  donutOptions: defaultDonutOptions,
  hideValue: false,
  label: 'Visitors',
  numberFormat: 'shortNumber',
};

describe('getDonutSummaryData()', () => {
  test('should return empty array if there is not a DonutSummary on the Donut', () => {
    const data = getDonutSummaryData(defaultDonutOptions);
    expect(data).toHaveLength(0);
  });

  test('should return summary data if there is a DonutSummary on the Donut', () => {
    const data = getDonutSummaryData({
      ...defaultDonutOptions,
      donutSummaries: [{ label: 'Visitors' }],
    });
    expect(data).toHaveLength(1);
    expect(data[0].name).toEqual('testName_summaryData');
  });
});

describe('getDonutSummaryScales()', () => {
  test('should return empty array if there is not a DonutSummary on the Donut', () => {
    const scales = getDonutSummaryScales(defaultDonutOptions);
    expect(scales).toHaveLength(0);
  });

  test('should return value and label font size scales if there is a DonutSummary on the Donut', () => {
    const scales = getDonutSummaryScales({
      ...defaultDonutOptions,
      donutSummaries: [{ label: 'Visitors' }],
    });
    expect(scales).toHaveLength(2);
    expect(scales[0].name).toEqual('testName_summaryValueFontSizeScale');
    expect(scales[1].name).toEqual('testName_summaryLabelFontSizeScale');
  });

  test('should snap to the nearest named size tier via the shared cutpoints', () => {
    const scales = getDonutSummaryScales({
      ...defaultDonutOptions,
      donutSummaries: [{ label: 'Visitors' }],
    });
    expect(scales[0]).toHaveProperty('domain', DONUT_SIZE_TIER_CUTPOINTS);
    expect(scales[0]).toHaveProperty('range', DONUT_SUMMARY_VALUE_FONT_SIZES);
    expect(scales[1]).toHaveProperty('domain', DONUT_SIZE_TIER_CUTPOINTS);
    expect(scales[1]).toHaveProperty('range', DONUT_SUMMARY_LABEL_FONT_SIZES);
  });
});

describe('getDonutSummarySignals()', () => {
  test('should return empty array if there is not a DonutSummary on the Donut', () => {
    const signals = getDonutSummarySignals(defaultDonutOptions);
    expect(signals).toHaveLength(0);
  });

  test('should return value and label font size signals if there is a DonutSummary on the Donut', () => {
    const signals = getDonutSummarySignals({
      ...defaultDonutOptions,
      donutSummaries: [{ label: 'Visitors' }],
    });
    expect(signals).toHaveLength(2);
    expect(signals[0]).toEqual({
      name: 'testName_summaryValueFontSize',
      update: "scale('testName_summaryValueFontSizeScale', 2 * (min(width, height) / 2 - 2))",
    });
    expect(signals[1]).toEqual({
      name: 'testName_summaryLabelFontSize',
      update: "scale('testName_summaryLabelFontSizeScale', 2 * (min(width, height) / 2 - 2))",
    });
  });

  test('should reserve the delta row below a semicircle with summary content above it', () => {
    const signals = getDonutSummarySignals({
      ...defaultDonutOptions,
      variant: 'semicircle',
      donutSummaries: [{ delta: 0.025, label: 'Visitors' }],
    });
    expect(signals[2]).toEqual({
      name: 'testName_summaryBottomOffset',
      update: 'ceil(testName_summaryLabelFontSize * 0.25) + testName_summaryLabelFontSize',
    });
  });

  test.each([
    [{ delta: 0.025 }, 'value and delta'],
    [{ delta: 0.025, hideValue: true, label: 'Visitors' }, 'label and delta'],
  ])('should not reserve space below a semicircle with only %s', (summary, _description) => {
    const signals = getDonutSummarySignals({
      ...defaultDonutOptions,
      variant: 'semicircle',
      donutSummaries: [summary],
    });
    expect(signals[2]).toEqual({
      name: 'testName_summaryBottomOffset',
      update: '0',
    });
  });
});

describe('getDonutSummaryGroupMark()', () => {
  test('should return a single mark if label is undefined', () => {
    const groupMark = getDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, label: undefined });
    expect(groupMark.marks).toHaveLength(1);
    expect(groupMark.marks?.[0].name).toEqual('testName_summaryValue');
  });

  test('should return a metric label if label is defined', () => {
    const groupMark = getDonutSummaryGroupMark(defaultDonutSummaryOptions);
    expect(groupMark.marks).toHaveLength(2);
    expect(groupMark.marks?.[1].name).toEqual('testName_summaryLabel');
  });

  test('should not include value mark if hideValue is true', () => {
    const groupMark = getDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, hideValue: true });
    expect(groupMark.marks).toHaveLength(1);
    expect(groupMark.marks?.[0].name).toEqual('testName_summaryLabel');
  });

  test('should return no marks if hideValue is true and label is undefined', () => {
    const groupMark = getDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, hideValue: true, label: undefined });
    expect(groupMark.marks).toHaveLength(0);
  });
});

describe('getBooleanDonutSummaryGroupMark()', () => {
  test('should return a single mark if label is undefined', () => {
    const groupMark = getBooleanDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, label: undefined });
    expect(groupMark.marks).toHaveLength(1);
    expect(groupMark.marks?.[0].name).toEqual('testName_booleanSummaryValue');
  });

  test('should return a metric label if label is defined', () => {
    const groupMark = getBooleanDonutSummaryGroupMark(defaultDonutSummaryOptions);
    expect(groupMark.marks).toHaveLength(2);
    expect(groupMark.marks?.[1].name).toEqual('testName_booleanSummaryLabel');
  });

  test('should not include value mark if hideValue is true', () => {
    const groupMark = getBooleanDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, hideValue: true });
    expect(groupMark.marks).toHaveLength(1);
    expect(groupMark.marks?.[0].name).toEqual('testName_booleanSummaryLabel');
  });

  test('should return no marks if hideValue is true and label is undefined', () => {
    const groupMark = getBooleanDonutSummaryGroupMark({
      ...defaultDonutSummaryOptions,
      hideValue: true,
      label: undefined,
    });
    expect(groupMark.marks).toHaveLength(0);
  });
});

describe('getSummaryValueText()', () => {
  test('should return the correct text for boolean metric', () => {
    const result = getSummaryValueText({
      ...defaultDonutSummaryOptions,
      donutOptions: { ...defaultDonutOptions, isBoolean: true },
    });
    expect(result).toEqual({ signal: `format(datum['testMetric'], '.0%')` });
  });

  describe('summary value truncation', () => {
    test.each([
      [false, '.0f', 123456789, '123456789', '1…'],
      [false, 'shortCurrency', 123456789, '$123M', '$…'],
      [true, 'shortNumber', 0.5, '50%', '5…'],
      [false, '.0f', 1, '1', '1'],
      [false, '.0f', 0, '0', '0'],
    ])(
      'hides ellipsis-only values and restores readable values (boolean=%s, format=%s)',
      async (isBoolean, numberFormat, value, fullText, partialText) => {
        Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
        const options: DonutSummarySpecOptions = {
          ...defaultDonutSummaryOptions,
          numberFormat,
          donutOptions: { ...defaultDonutOptions, isBoolean },
        };
        const spec: Spec = {
          width: 200,
          height: 200,
          signals: [
            { name: 'availableWidth', value: 1.5 },
            { name: 'testName_summaryValueFontSize', value: 40 },
            { name: 'testName_summaryLabelFontSize', value: 14 },
            {
              name: 'testName_ringWidth',
              update: '98 - sqrt(pow(testName_summaryValueFontSize, 2) + pow(availableWidth / 2, 2))',
            },
          ],
          data: [
            { name: 'testName_summaryData', values: [{ sum: value }] },
            { name: 'testName_booleanData', values: [{ testMetric: value }] },
          ],
          marks: [isBoolean ? getBooleanDonutSummaryGroupMark(options) : getDonutSummaryGroupMark(options)],
        };
        const view = new View(parse(spec), { renderer: 'none' });
        const getSvg = async (availableWidth: number) => {
          view.signal('availableWidth', availableWidth);
          await view.runAsync();
          return view.toSVG();
        };
        try {
          const hiddenSvg = await getSvg(1.5);
          const fontSize = fullText.length === 1 ? 40 : 0;
          expect(hiddenSvg).toContain(`font-size="${fontSize}px"`);
          expect(hiddenSvg).toContain('>Visitors</text>');

          const partialSvg = await getSvg(2.5);
          expect(partialSvg).toContain('font-size="40px"');
          expect(partialSvg).toContain(`>${partialText}</text>`);

          const fullSvg = await getSvg(30);
          expect(fullSvg).toContain('font-size="40px"');
          expect(fullSvg).toContain(`>${fullText}</text>`);

          expect(await getSvg(1.5)).toContain(`font-size="${fontSize}px"`);
        } finally {
          view.finalize();
        }
      }
    );
  });

  test('should return the correct text for non-boolean metric', () => {
    const result = getSummaryValueText(defaultDonutSummaryOptions);
    expect(result).toEqual([
      {
        signal: "formatShortNumber(datum['sum'])",
        test: "isNumber(datum['sum'])",
      },
      { field: 'sum' },
    ]);
  });
});

describe.each([false, true])('summary label and delta truncation (boolean=%s)', (isBoolean) => {
  test.each([
    { line: 'label', summary: { hideValue: true, label: 'Visitors' }, heightFromCenter: 40 },
    { line: 'label', summary: { label: 'Visitors' }, heightFromCenter: 90 },
    { line: 'label', summary: { hideValue: true, label: 'Visitors', delta: 0.025 }, heightFromCenter: 80 },
    { line: 'label', summary: { hideValue: true, label: 'Visitor\'s "total"' }, heightFromCenter: 40 },
    { line: 'delta', summary: { hideValue: true, delta: 0.025 }, heightFromCenter: 40 },
    { line: 'delta', summary: { delta: -0.025 }, heightFromCenter: 90 },
    { line: 'delta', summary: { hideValue: true, label: 'Visitors', delta: 0.025 }, heightFromCenter: 100 },
    { line: 'delta', summary: { label: 'Visitors', delta: 0.025 }, heightFromCenter: 190 },
  ])('hides and restores the $line independently for $summary', async ({ line, summary, heightFromCenter }) => {
    Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
    const options: DonutSummarySpecOptions = {
      ...defaultDonutSummaryOptions,
      label: undefined,
      ...summary,
      donutOptions: { ...defaultDonutOptions, isBoolean },
    };
    const spec: Spec = {
      width: 600,
      height: 600,
      signals: [
        { name: 'availableWidth', value: 1.5 },
        { name: 'testName_summaryValueFontSize', value: 40 },
        { name: 'testName_summaryLabelFontSize', value: 80 },
        {
          name: 'testName_ringWidth',
          update: `298 - sqrt(pow(${heightFromCenter}, 2) + pow(availableWidth / 2, 2))`,
        },
      ],
      data: [
        { name: 'testName_summaryData', values: [{ sum: 123456789 }] },
        { name: 'testName_booleanData', values: [{ testMetric: 0.5 }] },
      ],
      marks: [isBoolean ? getBooleanDonutSummaryGroupMark(options) : getDonutSummaryGroupMark(options)],
    };
    const view = new View(parse(spec), { renderer: 'none' });
    const markSuffix = line === 'label' ? 'Label' : 'Delta';
    const markPrefix = isBoolean ? 'booleanSummary' : 'summary';
    const sign = options.delta !== undefined && options.delta < 0 ? '\u2212' : '+';
    const getText = async (availableWidth: number) => {
      view.signal('availableWidth', availableWidth);
      await view.runAsync();
      const svg = new DOMParser().parseFromString(await view.toSVG(), 'image/svg+xml');
      const text = svg.querySelector(`.testName_${markPrefix}${markSuffix} text`);
      if (!text) throw new Error('Expected summary text mark');
      return text;
    };
    try {
      const hidden = await getText(1.5);
      expect(hidden.getAttribute('font-size')).toBe('0px');
      const partial = await getText(2.5);
      expect(partial.getAttribute('font-size')).toBe('80px');
      expect(partial.textContent).toBe(line === 'label' ? 'V…' : `${sign}…`);
      const position = partial.getAttribute('transform');

      const full = await getText(40);
      expect(full.getAttribute('font-size')).toBe('80px');
      expect(full.textContent).toBe(line === 'label' ? options.label : `${sign}2.5%`);
      expect(full.getAttribute('transform')).toBe(position);

      expect((await getText(1.5)).getAttribute('font-size')).toBe('0px');
    } finally {
      view.finalize();
    }
  });
});

describe('getSummaryValueBaseline()', () => {
  test('should return alphabetic if label is truthy', () => {
    const baseline = getSummaryValueBaseline('Visitors');
    expect(baseline).toHaveProperty('value', 'alphabetic');
  });

  test('should return middle if label is falsey', () => {
    const baseline = getSummaryValueBaseline(undefined);
    expect(baseline).toHaveProperty('value', 'middle');
  });
});

describe('getSummaryValueLimit()', () => {
  test('should use full font size in signal if label is truthy', () => {
    expect(getSummaryValueLimit({ ...defaultDonutSummaryOptions, label: 'Visitors' })).toEqual({
      signal:
        '2 * sqrt(pow(((min(width, height) / 2 - 2) - testName_ringWidth), 2) - pow((testName_summaryValueFontSize) + (0), 2))',
    });
  });

  test('should use 1/2 font size in signal if label is falsey', () => {
    expect(getSummaryValueLimit({ ...defaultDonutSummaryOptions, label: '' })).toEqual({
      signal:
        '2 * sqrt(pow(((min(width, height) / 2 - 2) - testName_ringWidth), 2) - pow((testName_summaryValueFontSize * 0.5) + (0), 2))',
    });
  });
});

describe('getSummaryLabelEncode() with hideValue', () => {
  test('should center label vertically when hideValue is true', () => {
    const encode = getSummaryLabelEncode({
      ...defaultDonutSummaryOptions,
      hideValue: true,
      label: 'Visitors',
    });
    expect(encode.update?.baseline).toEqual({ value: 'middle' });
    expect(encode.update?.dy).toEqual({ signal: '0' });
  });

  test('should position label below value when hideValue is false', () => {
    const encode = getSummaryLabelEncode({
      ...defaultDonutSummaryOptions,
      hideValue: false,
      label: 'Visitors',
    });
    expect(encode.update?.baseline).toEqual({ value: 'top' });
    expect(encode.update?.dy).toEqual({ signal: 'ceil(testName_summaryValueFontSize * 0.25)' });
  });

  test('should use the label font size signal directly, not derived from the value font size', () => {
    const encode = getSummaryLabelEncode({
      ...defaultDonutSummaryOptions,
      hideValue: false,
      label: 'Visitors',
    });
    expect(encode).toHaveProperty('update.fontSize.0', {
      test: '((min(width, height) / 2 - 2) - testName_ringWidth) < 40',
      value: 0,
    });
    expect(encode).toHaveProperty('update.fontSize.2', { signal: 'testName_summaryLabelFontSize' });
  });

  test('should compute the limit from label height alone when hideValue is true', () => {
    const encode = getSummaryLabelEncode({ ...defaultDonutSummaryOptions, hideValue: true, label: 'Visitors' });
    expect(encode.update?.limit).toEqual({
      signal:
        '2 * sqrt(pow(((min(width, height) / 2 - 2) - testName_ringWidth), 2) - pow((testName_summaryLabelFontSize * 0.5) + (0), 2))',
    });
  });

  test('should compute the limit from the value dy offset plus label height when hideValue is false', () => {
    const encode = getSummaryLabelEncode({ ...defaultDonutSummaryOptions, hideValue: false, label: 'Visitors' });
    expect(encode.update?.limit).toEqual({
      signal:
        '2 * sqrt(pow(((min(width, height) / 2 - 2) - testName_ringWidth), 2) - pow((ceil(testName_summaryValueFontSize * 0.25) + testName_summaryLabelFontSize) + (0), 2))',
    });
  });
});

describe('s2 styles', () => {
  describe('getSummaryValueEncode()', () => {
    test('should always add fontWeight 800 for S2', () => {
      const encode = getSummaryValueEncode(defaultDonutSummaryOptions);

      expect(encode.update?.fontWeight).toEqual({ value: 800 });
    });
  });

  describe('getSummaryLabelEncode()', () => {
    test('should always add fontWeight 700 for S2', () => {
      const encode = getSummaryLabelEncode({
        ...defaultDonutSummaryOptions,
        label: 'Visitors',
      });

      expect(encode.update?.fontWeight).toEqual({ value: 700 });
    });
  });
});

describe('semicircle summary anchoring', () => {
  const semicircleDonutOptions = { ...defaultDonutOptions, variant: 'semicircle' as const };
  const semicircleSummaryOptions: DonutSummarySpecOptions = {
    ...defaultDonutSummaryOptions,
    donutOptions: semicircleDonutOptions,
  };
  test('getSummaryValueEncode bottom-aligns the value and label stack', () => {
    const encode = getSummaryValueEncode(semicircleSummaryOptions);
    expect(encode.update?.y).toEqual({
      signal: 'height - (3 + ceil(testName_summaryValueFontSize * 0.25) + testName_summaryLabelFontSize)',
    });
  });

  test('getSummaryLabelEncode uses the same bottom-aligned anchor', () => {
    const encode = getSummaryLabelEncode({ ...semicircleSummaryOptions, label: 'Visitors' });
    expect(encode.update?.y).toEqual({
      signal: 'height - (3 + ceil(testName_summaryValueFontSize * 0.25) + testName_summaryLabelFontSize)',
    });
  });

  test('hideValue removes the value and bottom-aligns the remaining label', () => {
    const groupMark = getDonutSummaryGroupMark({ ...semicircleSummaryOptions, hideValue: true });
    expect(groupMark.marks).toHaveLength(1);
    expect(groupMark.marks?.[0]).toHaveProperty('name', 'testName_summaryLabel');
    expect(groupMark.marks?.[0]).toHaveProperty(
      'encode.update.y.signal',
      'height - (3 + testName_summaryLabelFontSize * 0.5)'
    );
  });

  test('getSummaryDeltaEncode aligns the complete three-line stack to the flat edge', () => {
    const encode = getSummaryDeltaEncode({ ...semicircleSummaryOptions, delta: 0.025 });
    expect(encode.update?.y).toEqual({
      signal:
        'height - (ceil(testName_summaryLabelFontSize * 0.25) + testName_summaryLabelFontSize) - (3 + (ceil(testName_summaryValueFontSize * 0.25) + testName_summaryLabelFontSize + ceil(testName_summaryLabelFontSize * 0.25) + testName_summaryLabelFontSize) - (ceil(testName_summaryLabelFontSize * 0.25) + testName_summaryLabelFontSize))',
    });
    expect(encode).toHaveProperty('update.limit.signal', 'width');
  });

  test.each([
    [false, 0.025, '+2.5%'],
    [false, -0.074, '\u22127.4%'],
    [true, 0.025, '+2.5%'],
    [true, -0.074, '\u22127.4%'],
  ])(
    'uses the container width for the delta below a 180px semicircle (boolean=%s, delta=%s)',
    async (isBoolean, delta, text) => {
      Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
      const donutOptions = {
        ...semicircleDonutOptions,
        isBoolean,
        donutSummaries: [{ label: 'Visitors', delta }],
      };
      const options = { ...semicircleSummaryOptions, donutOptions, delta };
      const encode = getSummaryDeltaEncode(options);
      expect(encode).toHaveProperty('update.limit.signal', 'width');
      const limit = encode.update?.limit;
      if (!limit || Array.isArray(limit) || !('signal' in limit)) {
        throw new Error('Expected a delta width limit signal');
      }
      const spec: Spec = {
        width: 184,
        height: 184,
        signals: [
          ...getDonutSummarySignals(donutOptions),
          getRingWidthSignal(donutOptions),
          { name: 'outerDiameter', update: '2 * (min(width / 2, height) - 2)' },
          { name: 'deltaWidth', update: limit.signal },
        ],
        scales: [...getDonutSummaryScales(donutOptions), getRingWidthScale(donutOptions)],
        data: [
          { name: 'testName_summaryData', values: [{ sum: 123456789 }] },
          { name: 'testName_booleanData', values: [{ testMetric: 0.5 }] },
        ],
        marks: [isBoolean ? getBooleanDonutSummaryGroupMark(options) : getDonutSummaryGroupMark(options)],
      };
      const view = new View(parse(spec), { renderer: 'none' });
      const markPrefix = isBoolean ? 'booleanSummary' : 'summary';
      try {
        for (const size of [184, 124, 184]) {
          await view.width(size).height(size).runAsync();
          expect(view.signal('outerDiameter')).toBe(size - 4);
          expect(view.signal('deltaWidth')).toBe(size);
          const svg = new DOMParser().parseFromString(await view.toSVG(), 'image/svg+xml');
          const deltaText = svg.querySelector(`.testName_${markPrefix}Delta text`);
          expect(deltaText?.textContent).toBe(text);
          expect(deltaText?.getAttribute('font-size')).toBe(size === 184 ? '16px' : '14px');
        }
      } finally {
        view.finalize();
      }
    }
  );

  test.each([
    { label: undefined, hideValue: false },
    { label: 'Visitors', hideValue: true },
    { label: undefined, hideValue: true },
  ])('keeps hole-based limits for delta rows inside the semicircle: %s', (summary) => {
    const encode = getSummaryDeltaEncode({ ...semicircleSummaryOptions, ...summary, delta: 0.025 });
    expect(encode).toHaveProperty(
      'update.limit.signal',
      expect.stringContaining('2 * sqrt(pow(((min(width / 2, height) - 2) - testName_ringWidth), 2)')
    );
  });

  test('a full circle still anchors directly at the arc center (no offset)', () => {
    const encode = getSummaryValueEncode(defaultDonutSummaryOptions);
    expect(encode.update?.y).toEqual({ signal: 'height / 2' });
  });

  test('getSummaryValueLimit adds the anchor offset to the Pythagorean width-limit math', () => {
    const limit = getSummaryValueLimit({ ...semicircleSummaryOptions, label: 'Visitors' });
    expect(limit).toEqual({
      signal:
        '2 * sqrt(pow(((min(width / 2, height) - 2) - testName_ringWidth), 2) - pow((testName_summaryValueFontSize) + (3 + ceil(testName_summaryValueFontSize * 0.25) + testName_summaryLabelFontSize), 2))',
    });
  });
});

describe('getSummaryDeltaText()', () => {
  test('should render an explicit-sign one-decimal percent for a positive delta', () => {
    expect(getSummaryDeltaText(0.025)).toEqual({ signal: `format(0.025, '+.1%')` });
  });
  test('should render an explicit-sign one-decimal percent for a negative delta', () => {
    expect(getSummaryDeltaText(-0.074)).toEqual({ signal: `format(-0.074, '+.1%')` });
  });
});

describe('getSummaryDeltaFill()', () => {
  test('should use sentiment-positive (green-800) for a positive delta', () => {
    expect(getSummaryDeltaFill(0.025, 'light')).toEqual({ value: spectrum2Colors.light['green-800'] });
  });
  test('should use sentiment-negative (red-800) for a negative delta', () => {
    expect(getSummaryDeltaFill(-0.074, 'light')).toEqual({ value: spectrum2Colors.light['red-800'] });
  });
  test('should default a zero delta to sentiment-positive', () => {
    expect(getSummaryDeltaFill(0, 'light')).toEqual({ value: spectrum2Colors.light['green-800'] });
  });
});

describe('getDonutSummaryGroupMark() with delta', () => {
  test('should add a third mark when delta is defined', () => {
    const groupMark = getDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, delta: 0.025 });
    expect(groupMark.marks).toHaveLength(3);
    expect(groupMark.marks?.[2].name).toEqual('testName_summaryDelta');
  });

  test('should not add a delta mark when delta is undefined', () => {
    const groupMark = getDonutSummaryGroupMark(defaultDonutSummaryOptions);
    expect(groupMark.marks).toHaveLength(2);
  });
});

describe('getBooleanDonutSummaryGroupMark() with delta', () => {
  test('should add a third mark when delta is defined', () => {
    const groupMark = getBooleanDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, delta: 0.025 });
    expect(groupMark.marks).toHaveLength(3);
    expect(groupMark.marks?.[2].name).toEqual('testName_booleanSummaryDelta');
  });
});

describe('getSummaryDeltaEncode() stacking', () => {
  test('value + label + delta: delta stacks below the label, past the value-to-label gap', () => {
    const encode = getSummaryDeltaEncode({ ...defaultDonutSummaryOptions, label: 'Visitors', delta: 0.025 });
    expect(encode.update?.dy).toEqual({
      signal:
        'ceil(testName_summaryValueFontSize * 0.25) + testName_summaryLabelFontSize + ceil(testName_summaryLabelFontSize * 0.25)',
    });
    expect(encode.update?.baseline).toEqual({ value: 'top' });
  });

  test("value + delta, no label: delta takes over the label's usual gap below the value", () => {
    const encode = getSummaryDeltaEncode({
      ...defaultDonutSummaryOptions,
      label: undefined,
      delta: 0.025,
    });
    expect(encode.update?.dy).toEqual({ signal: 'ceil(testName_summaryValueFontSize * 0.25)' });
    expect(encode.update?.baseline).toEqual({ value: 'top' });
  });

  test('label + delta, hideValue: delta sits a quarter-gap below the label acting as the anchor line', () => {
    const encode = getSummaryDeltaEncode({
      ...defaultDonutSummaryOptions,
      hideValue: true,
      label: 'Visitors',
      delta: 0.025,
    });
    expect(encode.update?.dy).toEqual({
      signal: 'ceil(testName_summaryLabelFontSize * 0.25)',
    });
  });

  test('delta alone (hideValue, no label): centered with no dy offset', () => {
    const encode = getSummaryDeltaEncode({
      ...defaultDonutSummaryOptions,
      hideValue: true,
      label: undefined,
      delta: 0.025,
    });
    expect(encode.update?.dy).toEqual({ signal: '0' });
    expect(encode.update?.baseline).toEqual({ value: 'middle' });
  });

  test('reuses the label font-size signal directly rather than a separate delta signal', () => {
    const encode = getSummaryDeltaEncode({ ...defaultDonutSummaryOptions, label: 'Visitors', delta: 0.025 });
    expect(encode).toHaveProperty('update.fontSize.0', {
      test: '((min(width, height) / 2 - 2) - testName_ringWidth) < 40',
      value: 0,
    });
    expect(encode).toHaveProperty('update.fontSize.2', { signal: 'testName_summaryLabelFontSize' });
  });

  test('should always use fontWeight 800', () => {
    const encode = getSummaryDeltaEncode({ ...defaultDonutSummaryOptions, label: 'Visitors', delta: 0.025 });
    expect(encode.update?.fontWeight).toEqual({ value: 800 });
  });
});

describe('interaction: value/label baseline when delta is present without a label', () => {
  test('value becomes alphabetic (not middle) when only a delta follows, with no label', () => {
    const encode = getSummaryValueEncode({ ...defaultDonutSummaryOptions, label: undefined, delta: 0.025 });
    expect(encode.update?.baseline).toEqual({ value: 'alphabetic' });
  });

  test('value limit uses full font height when only a delta follows, with no label', () => {
    const limit = getSummaryValueLimit({ ...defaultDonutSummaryOptions, label: undefined, delta: 0.025 });
    expect(limit).toEqual({
      signal:
        '2 * sqrt(pow(((min(width, height) / 2 - 2) - testName_ringWidth), 2) - pow((testName_summaryValueFontSize) + (0), 2))',
    });
  });

  test('label becomes the anchor line (alphabetic) when hideValue and a delta follows it', () => {
    const encode = getSummaryLabelEncode({
      ...defaultDonutSummaryOptions,
      hideValue: true,
      label: 'Visitors',
      delta: 0.025,
    });
    expect(encode.update?.baseline).toEqual({ value: 'alphabetic' });
    expect(encode.update?.dy).toEqual({ signal: '0' });
  });
});
