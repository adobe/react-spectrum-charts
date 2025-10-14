/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { RectEncodeEntry } from 'vega';

import {
  COLOR_SCALE,
  CORNER_RADIUS,
  DEFAULT_CATEGORICAL_DIMENSION,
  DEFAULT_COLOR,
  DEFAULT_METRIC,
  FILTERED_TABLE,
  MARK_ID,
  PADDING_RATIO,
  SELECTED_GROUP,
  SELECTED_ITEM,
  STACK_ID,
} from '@spectrum-charts/constants';

import { BarSpecOptions } from '../types';
import {
  defaultBarEnterEncodings,
  defaultBarOptions,
  defaultBarOptionsWithSecondayColor,
  defaultCornerRadiusEncodings,
  defaultDodgedCornerRadiusEncodings,
  defaultDodgedYEncodings,
  defaultStackedYEncodings,
} from './barTestUtils';
import {
  getBarPadding,
  getBaseBarEnterEncodings,
  getBaseScaleName,
  getCornerRadiusEncodings,
  getDimensionSelectionRing,
  getDodgedDimensionEncodings,
  getDodgedGroupMark,
  getMetricEncodings,
  getOrientationProperties,
  getStackedCornerRadiusEncodings,
  getStackedMetricEncodings,
  getStroke,
  getStrokeDash,
  getStrokeWidth,
} from './barUtils';

const defaultDodgedXEncodings: RectEncodeEntry = {
  x: { scale: 'bar0_position', field: 'bar0_dodgeGroup' },
  width: { scale: 'bar0_position', band: 1 },
};

describe('barUtils', () => {
  describe('getMetricEncodings()', () => {
    describe('vertical orientation', () => {
      test('defaultBarOptions, should return stacked encodings', () => {
        expect(getMetricEncodings(defaultBarOptions)).toStrictEqual(defaultStackedYEncodings);
      });
      test('dodged, should return dodged encodings', () => {
        expect(getMetricEncodings({ ...defaultBarOptions, type: 'dodged' })).toStrictEqual(defaultDodgedYEncodings);
      });
      test('dodged with secdondary color series, should return stacked encodings', () => {
        expect(getMetricEncodings({ ...defaultBarOptionsWithSecondayColor, type: 'dodged' })).toStrictEqual(
          defaultStackedYEncodings
        );
      });
    });

    describe('horizontal orientation', () => {
      test('defaultBarOptions should return encodings on x axis', () => {
        const domainEncodings = getMetricEncodings({ ...defaultBarOptions, orientation: 'horizontal' });
        const defaultStackedEncodingStartLength = (defaultStackedYEncodings.y as unknown[]).length;

        expect(domainEncodings.x).toHaveLength(defaultStackedEncodingStartLength);
        expect(domainEncodings.x2).toEqual({ scale: 'xLinear', field: `${DEFAULT_METRIC}1` });
      });
      test('dodged, should return dodged encodings on x axis', () => {
        const domainEncodings = getMetricEncodings({
          ...defaultBarOptions,
          type: 'dodged',
          orientation: 'horizontal',
        });

        expect(domainEncodings.x).toEqual({ scale: 'xLinear', value: 0 });
        expect(domainEncodings.x2).toEqual({ scale: 'xLinear', field: DEFAULT_METRIC });
      });
      test('dodged with secdondary color series, should return stacked encodings on x axis', () => {
        const domainEncodings = getMetricEncodings({
          ...defaultBarOptionsWithSecondayColor,
          type: 'dodged',
          orientation: 'horizontal',
        });
        const defaultStackedEncodingStartLength = (defaultStackedYEncodings.y as unknown[]).length;

        expect(domainEncodings.x).toHaveLength(defaultStackedEncodingStartLength);
        expect(domainEncodings.x2).toEqual({ scale: 'xLinear', field: `${DEFAULT_METRIC}1` });
      });
    });
  });

  describe('getStackedMetricEncodings()', () => {
    const startValue = `datum.${DEFAULT_METRIC}0`;
    const endValue = `datum.${DEFAULT_METRIC}1`;

    describe('vertical orientation', () => {
      test('defaultBarOptions, should return with keys "y" and "y2"', () => {
        const encodings = getStackedMetricEncodings(defaultBarOptions);
        expect(Object.keys(encodings)).toEqual(['y', 'y2']);
      });

      test('first should test for starting at 0', () => {
        const encodings = getStackedMetricEncodings(defaultBarOptions);
        expect(encodings.y?.[0]?.test).toEqual(`${startValue} === 0`);
        expect(encodings.y?.[0]?.signal).toEqual(`scale('yLinear', ${startValue})`);
      });

      test('should second test for ending positive value', () => {
        const encodings = getStackedMetricEncodings(defaultBarOptions);
        expect(encodings.y?.[1]?.test).toEqual(`${endValue} > 0`);
        expect(encodings.y?.[1]?.signal).toEqual(
          `max(scale('yLinear', ${startValue}) - 1.5, scale('yLinear', datum.${DEFAULT_METRIC}1))`
        );
      });

      test('should third assume ending negative value', () => {
        const encodings = getStackedMetricEncodings(defaultBarOptions);
        expect(encodings.y?.[2]?.test).toBeUndefined();
        expect(encodings.y?.[2]?.signal).toEqual(
          `min(scale('yLinear', ${startValue}) + 1.5, scale('yLinear', datum.${DEFAULT_METRIC}1))`
        );
      });

      test('should end on datum.metric1', () => {
        const encodings = getStackedMetricEncodings(defaultBarOptions);
        expect(encodings.y2).toEqual({ scale: 'yLinear', field: `${DEFAULT_METRIC}1` });
      });
    });

    describe('horizontal orientation', () => {
      const horizontalOptions: BarSpecOptions = { ...defaultBarOptions, orientation: 'horizontal' };

      test('defaultBarOptions, should return with keys "x" and "x2"', () => {
        const encodings = getStackedMetricEncodings(horizontalOptions);
        expect(Object.keys(encodings)).toEqual(['x', 'x2']);
      });

      test('first should test for starting at 0', () => {
        const encodings = getStackedMetricEncodings(horizontalOptions);
        expect(encodings.x?.[0]?.test).toEqual(`${startValue} === 0`);
        expect(encodings.x?.[0]?.signal).toEqual(`scale('xLinear', ${startValue})`);
      });

      test('should second test for ending positive value', () => {
        const encodings = getStackedMetricEncodings(horizontalOptions);
        expect(encodings.x?.[1]?.test).toEqual(`${endValue} > 0`);
        expect(encodings.x?.[1]?.signal).toEqual(
          `min(scale('xLinear', ${startValue}) + 1.5, scale('xLinear', datum.${DEFAULT_METRIC}1))`
        );
      });

      test('should third assume ending negative value', () => {
        const encodings = getStackedMetricEncodings(horizontalOptions);
        expect(encodings.x?.[2]?.test).toBeUndefined();
        expect(encodings.x?.[2]?.signal).toEqual(
          `max(scale('xLinear', ${startValue}) - 1.5, scale('xLinear', datum.${DEFAULT_METRIC}1))`
        );
      });

      test('should end on datum.metric1', () => {
        const encodings = getStackedMetricEncodings(horizontalOptions);
        expect(encodings.x2).toEqual({ scale: 'xLinear', field: `${DEFAULT_METRIC}1` });
      });
    });
  });

  describe('getCornerRadiusEncodings()', () => {
    test('defaultBarOptions, should return stacked radius encodings', () => {
      expect(getCornerRadiusEncodings(defaultBarOptions)).toStrictEqual(defaultCornerRadiusEncodings);
    });
    test('dodged, return simple radius encodings', () => {
      expect(getCornerRadiusEncodings({ ...defaultBarOptions, type: 'dodged' })).toStrictEqual(
        defaultDodgedCornerRadiusEncodings
      );
    });
    test('horizontal, should return stacked radius encodings rotated clockwise', () => {
      const vertical = getCornerRadiusEncodings(defaultBarOptions);
      const horizontal = getCornerRadiusEncodings({ ...defaultBarOptions, orientation: 'horizontal' });

      expect(horizontal?.cornerRadiusTopLeft).toEqual(vertical?.cornerRadiusBottomLeft);
      expect(horizontal?.cornerRadiusTopRight).toEqual(vertical?.cornerRadiusTopLeft);
      expect(horizontal?.cornerRadiusBottomRight).toEqual(vertical?.cornerRadiusTopRight);
      expect(horizontal?.cornerRadiusBottomLeft).toEqual(vertical?.cornerRadiusBottomRight);
    });
    test('horizontal dodged, should return stacked radius encodings rotated clockwise', () => {
      const vertical = getCornerRadiusEncodings({ ...defaultBarOptions, type: 'dodged' });
      const horizontal = getCornerRadiusEncodings({
        ...defaultBarOptions,
        type: 'dodged',
        orientation: 'horizontal',
      });

      expect(horizontal?.cornerRadiusTopLeft).toEqual(vertical?.cornerRadiusBottomLeft);
      expect(horizontal?.cornerRadiusTopRight).toEqual(vertical?.cornerRadiusTopLeft);
      expect(horizontal?.cornerRadiusBottomRight).toEqual(vertical?.cornerRadiusTopRight);
      expect(horizontal?.cornerRadiusBottomLeft).toEqual(vertical?.cornerRadiusBottomRight);
    });
    test('corner radius should be 0 when the hasSquareCorners prop is true', () => {
      const squareRadius = getCornerRadiusEncodings({ ...defaultBarOptions, hasSquareCorners: true });

      // Square radius should have values of 0
      expect(squareRadius).toEqual(
        expect.objectContaining({
          cornerRadiusTopLeft: expect.arrayContaining([expect.objectContaining({ value: 0 })]),
          cornerRadiusTopRight: expect.arrayContaining([expect.objectContaining({ value: 0 })]),
        })
      );

      const roundRadius = getCornerRadiusEncodings({ ...defaultBarOptions });

      // Round radius should have values of 6
      expect(roundRadius).toEqual(
        expect.objectContaining({
          cornerRadiusTopLeft: expect.arrayContaining([expect.objectContaining({ value: CORNER_RADIUS })]),
          cornerRadiusTopRight: expect.arrayContaining([expect.objectContaining({ value: CORNER_RADIUS })]),
        })
      );
    });
  });

  describe('getStackedCorderRadiusEncodings()', () => {
    test('defaultBarOptions, should return default encodings', () => {
      expect(getStackedCornerRadiusEncodings(defaultBarOptions)).toStrictEqual(defaultCornerRadiusEncodings);
    });
    test('defaultBarOptions with secondary color, should include secondaryColor in singal path', () => {
      expect(getStackedCornerRadiusEncodings(defaultBarOptionsWithSecondayColor).cornerRadiusTopLeft).toStrictEqual([
        {
          test: `datum.${DEFAULT_METRIC}1 > 0 && data('bar0_stacks')[indexof(pluck(data('bar0_stacks'), '${STACK_ID}'), datum.${STACK_ID})].max_${DEFAULT_METRIC}1 === datum.${DEFAULT_METRIC}1`,
          value: CORNER_RADIUS,
        },
        { value: 0 },
      ]);
    });
    test('dodged with secondary color, should include secondaryColor in singal path', () => {
      expect(
        getStackedCornerRadiusEncodings({
          ...defaultBarOptionsWithSecondayColor,
          type: 'dodged',
        }).cornerRadiusTopLeft
      ).toStrictEqual([
        {
          test: `datum.${DEFAULT_METRIC}1 > 0 && data('bar0_stacks')[indexof(pluck(data('bar0_stacks'), '${STACK_ID}'), datum.${STACK_ID})].max_${DEFAULT_METRIC}1 === datum.${DEFAULT_METRIC}1`,
          value: CORNER_RADIUS,
        },
        { value: 0 },
      ]);
    });

    test('corner radius should be 0 when the hasSquareCorners prop is true', () => {
      const squareRadius = getStackedCornerRadiusEncodings({ ...defaultBarOptions, hasSquareCorners: true });

      // Square radius should have values of 0
      expect(squareRadius).toEqual(
        expect.objectContaining({
          cornerRadiusTopLeft: expect.arrayContaining([expect.objectContaining({ value: 0 })]),
          cornerRadiusTopRight: expect.arrayContaining([expect.objectContaining({ value: 0 })]),
        })
      );

      const roundRadius = getStackedCornerRadiusEncodings({ ...defaultBarOptions });

      // Round radius should have values of 6
      expect(roundRadius).toEqual(
        expect.objectContaining({
          cornerRadiusTopLeft: expect.arrayContaining([expect.objectContaining({ value: CORNER_RADIUS })]),
          cornerRadiusTopRight: expect.arrayContaining([expect.objectContaining({ value: CORNER_RADIUS })]),
        })
      );
    });
  });

  describe('getOrientationProperties()', () => {
    test('returns correct properties for vertical orientation', () => {
      expect(getOrientationProperties('vertical')).toEqual({
        metricAxis: 'y',
        dimensionAxis: 'x',
        metricScaleKey: 'yLinear',
        dimensionScaleKey: 'xBand',
        dimensionSizeSignal: 'width',
        metricSizeSignal: 'height',
      });
      expect(getOrientationProperties('vertical', 'scale1')).toEqual({
        metricAxis: 'y',
        dimensionAxis: 'x',
        metricScaleKey: 'scale1',
        dimensionScaleKey: 'xBand',
        dimensionSizeSignal: 'width',
        metricSizeSignal: 'height',
      });
    });
    test('returns correct properties for horizontal orientation', () => {
      expect(getOrientationProperties('horizontal')).toEqual({
        metricAxis: 'x',
        dimensionAxis: 'y',
        metricScaleKey: 'xLinear',
        dimensionScaleKey: 'yBand',
        dimensionSizeSignal: 'height',
        metricSizeSignal: 'width',
      });
      expect(getOrientationProperties('horizontal', 'scale2')).toEqual({
        metricAxis: 'x',
        dimensionAxis: 'y',
        metricScaleKey: 'scale2',
        dimensionScaleKey: 'yBand',
        dimensionSizeSignal: 'height',
        metricSizeSignal: 'width',
      });
    });
  });

  describe('getStroke()', () => {
    test('should return production rule with one item in array if there is not a popover', () => {
      const strokeRule = getStroke(defaultBarOptions);
      expect(strokeRule).toHaveLength(1);
      expect(strokeRule[0]).toStrictEqual({ scale: COLOR_SCALE, field: DEFAULT_COLOR });
    });
    test('should return rules for selected data if popover exists', () => {
      const strokeRule = getStroke({ ...defaultBarOptions, chartPopovers: [{}] });
      expect(strokeRule).toHaveLength(2);
      expect(strokeRule[0]).toStrictEqual({
        test: `(${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${MARK_ID}) || (${SELECTED_GROUP} && ${SELECTED_GROUP} === datum.bar0_selectedGroupId)`,
        value: 'rgb(20, 115, 230)',
      });
    });
  });

  describe('getDimensionSelectionRing()', () => {
    const barOptions: Partial<BarSpecOptions> = {
      name: 'bar0',
      colorScheme: 'light',
      orientation: 'vertical',
      paddingRatio: 0.3,
    };

    test('should return vertical selection ring', () => {
      const selectionRing = getDimensionSelectionRing(barOptions as BarSpecOptions);
      expect(selectionRing).toStrictEqual({
        encode: {
          enter: {
            cornerRadius: { value: 6 },
            fill: { value: 'transparent' },
            stroke: { value: 'rgb(20, 115, 230)' },
            strokeWidth: { value: 2 },
          },
          update: {
            width: { signal: "bandwidth('xBand')/(1 - 0.3 / 2)" },
            xc: { signal: "scale('xBand', datum.bar0_selectedGroupId) + bandwidth('xBand')/2" },
            y: { value: 0 },
            y2: { signal: 'height' },
          },
        },
        from: {
          data: 'bar0_selectedData',
        },
        interactive: false,
        name: 'bar0_selectionRing',
        type: 'rect',
      });
    });
    test('should return horizontal selection ring', () => {
      const selectionRing = getDimensionSelectionRing({
        ...barOptions,
        orientation: 'horizontal',
      } as BarSpecOptions);
      expect(selectionRing).toStrictEqual({
        encode: {
          enter: {
            cornerRadius: { value: 6 },
            fill: { value: 'transparent' },
            stroke: { value: 'rgb(20, 115, 230)' },
            strokeWidth: { value: 2 },
          },
          update: {
            x: { value: 0 },
            x2: { signal: 'width' },
            yc: { signal: `scale('yBand', datum.bar0_selectedGroupId) + bandwidth('yBand')/2` },
            height: { signal: `bandwidth('yBand')/(1 - 0.3 / 2)` },
          },
        },
        from: {
          data: 'bar0_selectedData',
        },
        interactive: false,
        name: 'bar0_selectionRing',
        type: 'rect',
      });
    });
  });

  describe('getStrokeDash()', () => {
    test('should return production rule with one item in array if there is not a popover', () => {
      const strokeRule = getStrokeDash(defaultBarOptions);
      expect(strokeRule).toHaveLength(1);
      expect(strokeRule[0]).toStrictEqual({ value: [] });
    });
    test('should return rules for selected data if popover exists', () => {
      const strokeRule = getStrokeDash({ ...defaultBarOptions, chartPopovers: [{}] });
      expect(strokeRule).toHaveLength(2);
      expect(strokeRule[0]).toStrictEqual({
        test: `isValid(${SELECTED_ITEM}) && ${SELECTED_ITEM} === datum.${MARK_ID}`,
        value: [],
      });
    });
  });

  describe('getStrokeWidth()', () => {
    test('should return production rule with one item in array if there is not a popover', () => {
      const strokeRule = getStrokeWidth(defaultBarOptions);
      expect(strokeRule).toHaveLength(1);
      expect(strokeRule[0]).toStrictEqual({ value: 0 });
    });
    test('should return production rule with one item in array if there is a popover that highlights by dimension', () => {
      const strokeRule = getStrokeWidth({
        ...defaultBarOptions,
        chartPopovers: [{ UNSAFE_highlightBy: 'dimension' }],
      });
      expect(strokeRule).toHaveLength(1);
      expect(strokeRule[0]).toStrictEqual({ value: 0 });
    });
    test('should return rules for selected data if popover exists', () => {
      const strokeRule = getStrokeWidth({ ...defaultBarOptions, chartPopovers: [{}] });
      expect(strokeRule).toHaveLength(2);
      expect(strokeRule[0]).toStrictEqual({
        test: `(isValid(${SELECTED_ITEM}) && ${SELECTED_ITEM} === datum.${MARK_ID}) || (isValid(${SELECTED_GROUP}) && ${SELECTED_GROUP} === datum.bar0_selectedGroupId)`,
        value: 2,
      });
    });
  });

  describe('getBaseBarEnterEncodings()', () => {
    test('default options', () => {
      expect(getBaseBarEnterEncodings(defaultBarOptions)).toStrictEqual(defaultBarEnterEncodings);
    });
  });

  describe('getDodgedGroupMark()', () => {
    test('should retrun group mark', () => {
      expect(getDodgedGroupMark(defaultBarOptions)).toStrictEqual({
        encode: { enter: { x: { field: DEFAULT_CATEGORICAL_DIMENSION, scale: 'xBand' } } },
        from: { facet: { data: FILTERED_TABLE, groupby: DEFAULT_CATEGORICAL_DIMENSION, name: 'bar0_facet' } },
        name: 'bar0_group',
        scales: [
          {
            domain: { data: FILTERED_TABLE, field: 'bar0_dodgeGroup' },
            name: 'bar0_position',
            paddingInner: PADDING_RATIO,
            range: 'width',
            type: 'band',
          },
        ],
        signals: [{ name: 'width', update: 'bandwidth("xBand")' }],
        type: 'group',
      });
    });
    test('uses groupedPadding for paddingInner if it exists', () => {
      const groupedPadding = PADDING_RATIO + 0.1;
      expect(getDodgedGroupMark({ ...defaultBarOptions, groupedPadding })).toStrictEqual({
        encode: { enter: { x: { field: DEFAULT_CATEGORICAL_DIMENSION, scale: 'xBand' } } },
        from: { facet: { data: FILTERED_TABLE, groupby: DEFAULT_CATEGORICAL_DIMENSION, name: 'bar0_facet' } },
        name: 'bar0_group',
        scales: [
          {
            domain: { data: FILTERED_TABLE, field: 'bar0_dodgeGroup' },
            name: 'bar0_position',
            paddingInner: groupedPadding,
            range: 'width',
            type: 'band',
          },
        ],
        signals: [{ name: 'width', update: 'bandwidth("xBand")' }],
        type: 'group',
      });
    });
  });

  describe('getDodgedDimensionEncodings()', () => {
    test('should return x and width', () => {
      expect(getDodgedDimensionEncodings(defaultBarOptions)).toStrictEqual(defaultDodgedXEncodings);
    });
  });

  describe('getBarPadding()', () => {
    test('should return correct inner and outer padding', () => {
      expect(getBarPadding(0.5)).toEqual({ paddingInner: 0.5, paddingOuter: 0.25 });
      expect(getBarPadding(0.5, 0.5)).toEqual({ paddingInner: 0.5, paddingOuter: 0.5 });
    });
  });

  describe('getBaseScaleName()', () => {
    test('should return metricAxis if provided', () => {
      const options: BarSpecOptions = {
        ...defaultBarOptions,
        metricAxis: 'customScaleName',
        orientation: 'vertical',
      };
      expect(getBaseScaleName(options)).toEqual('customScaleName');
    });

    test('should return metricScaleKey from orientation properties if metricAxis is not provided (vertical)', () => {
      const options: BarSpecOptions = {
        ...defaultBarOptions,
        orientation: 'vertical',
      };
      expect(getBaseScaleName(options)).toEqual('yLinear');
    });

    test('should return metricScaleKey from orientation properties if metricAxis is not provided (horizontal)', () => {
      const options: BarSpecOptions = {
        ...defaultBarOptions,
        orientation: 'horizontal',
      };
      expect(getBaseScaleName(options)).toEqual('xLinear');
    });

    test('should handle undefined metricAxis', () => {
      const options: BarSpecOptions = {
        ...defaultBarOptions,
        metricAxis: undefined,
        orientation: 'vertical',
      };
      expect(getBaseScaleName(options)).toEqual('yLinear');
    });

    test('should handle empty string metricAxis (fallback to orientation properties)', () => {
      const options: BarSpecOptions = {
        ...defaultBarOptions,
        metricAxis: '',
        orientation: 'horizontal',
      };
      expect(getBaseScaleName(options)).toEqual('xLinear');
    });
  });
});
