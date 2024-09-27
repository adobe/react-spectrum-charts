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
import { createElement } from 'react';

import { ChartPopover } from '@components/ChartPopover';
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
} from '@constants';
import { RectEncodeEntry } from 'vega';

import { BarSpecProps } from '../../types';
import {
	defaultBarEnterEncodings,
	defaultBarProps,
	defaultBarPropsWithSecondayColor,
	defaultCornerRadiusEncodings,
	defaultDodgedCornerRadiusEncodings,
	defaultDodgedYEncodings,
	defaultStackedYEncodings,
} from './barTestUtils';
import {
	getBarPadding,
	getBaseBarEnterEncodings,
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
			test('defaultBarProps, should return stacked encodings', () => {
				expect(getMetricEncodings(defaultBarProps)).toStrictEqual(defaultStackedYEncodings);
			});
			test('dodged, should return dodged encodings', () => {
				expect(getMetricEncodings({ ...defaultBarProps, type: 'dodged' })).toStrictEqual(
					defaultDodgedYEncodings
				);
			});
			test('dodged with secdondary color series, should return stacked encodings', () => {
				expect(getMetricEncodings({ ...defaultBarPropsWithSecondayColor, type: 'dodged' })).toStrictEqual(
					defaultStackedYEncodings
				);
			});
		});

		describe('horizontal orientation', () => {
			test('defaultBarProps should return encodings on x axis', () => {
				const domainEncodings = getMetricEncodings({ ...defaultBarProps, orientation: 'horizontal' });
				const defaultStackedEncodingStartLength = (defaultStackedYEncodings.y as unknown[]).length;

				expect(domainEncodings.x).toHaveLength(defaultStackedEncodingStartLength);
				expect(domainEncodings.x2).toEqual({ scale: 'xLinear', field: `${DEFAULT_METRIC}1` });
			});
			test('dodged, should return dodged encodings on x axis', () => {
				const domainEncodings = getMetricEncodings({
					...defaultBarProps,
					type: 'dodged',
					orientation: 'horizontal',
				});

				expect(domainEncodings.x).toEqual({ scale: 'xLinear', value: 0 });
				expect(domainEncodings.x2).toEqual({ scale: 'xLinear', field: DEFAULT_METRIC });
			});
			test('dodged with secdondary color series, should return stacked encodings on x axis', () => {
				const domainEncodings = getMetricEncodings({
					...defaultBarPropsWithSecondayColor,
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
			test('defaultBarProps, should return with keys "y" and "y2"', () => {
				const encodings = getStackedMetricEncodings(defaultBarProps);
				expect(Object.keys(encodings)).toEqual(['y', 'y2']);
			});

			test('first should test for starting at 0', () => {
				const encodings = getStackedMetricEncodings(defaultBarProps);
				expect(encodings.y?.[0]?.test).toEqual(`${startValue} === 0`);
				expect(encodings.y?.[0]?.signal).toEqual(`scale('yLinear', ${startValue})`);
			});

			test('should second test for ending positive value', () => {
				const encodings = getStackedMetricEncodings(defaultBarProps);
				expect(encodings.y?.[1]?.test).toEqual(`${endValue} > 0`);
				expect(encodings.y?.[1]?.signal).toEqual(
					`max(scale('yLinear', ${startValue}) - 1.5, scale('yLinear', datum.${DEFAULT_METRIC}1))`
				);
			});

			test('should third assume ending negative value', () => {
				const encodings = getStackedMetricEncodings(defaultBarProps);
				expect(encodings.y?.[2]?.test).toBeUndefined();
				expect(encodings.y?.[2]?.signal).toEqual(
					`min(scale('yLinear', ${startValue}) + 1.5, scale('yLinear', datum.${DEFAULT_METRIC}1))`
				);
			});

			test('should end on datum.metric1', () => {
				const encodings = getStackedMetricEncodings(defaultBarProps);
				expect(encodings.y2).toEqual({ scale: 'yLinear', field: `${DEFAULT_METRIC}1` });
			});
		});

		describe('horizontal orientation', () => {
			const horizontalProps: BarSpecProps = { ...defaultBarProps, orientation: 'horizontal' };

			test('defaultBarProps, should return with keys "x" and "x2"', () => {
				const encodings = getStackedMetricEncodings(horizontalProps);
				expect(Object.keys(encodings)).toEqual(['x', 'x2']);
			});

			test('first should test for starting at 0', () => {
				const encodings = getStackedMetricEncodings(horizontalProps);
				expect(encodings.x?.[0]?.test).toEqual(`${startValue} === 0`);
				expect(encodings.x?.[0]?.signal).toEqual(`scale('xLinear', ${startValue})`);
			});

			test('should second test for ending positive value', () => {
				const encodings = getStackedMetricEncodings(horizontalProps);
				expect(encodings.x?.[1]?.test).toEqual(`${endValue} > 0`);
				expect(encodings.x?.[1]?.signal).toEqual(
					`min(scale('xLinear', ${startValue}) + 1.5, scale('xLinear', datum.${DEFAULT_METRIC}1))`
				);
			});

			test('should third assume ending negative value', () => {
				const encodings = getStackedMetricEncodings(horizontalProps);
				expect(encodings.x?.[2]?.test).toBeUndefined();
				expect(encodings.x?.[2]?.signal).toEqual(
					`max(scale('xLinear', ${startValue}) - 1.5, scale('xLinear', datum.${DEFAULT_METRIC}1))`
				);
			});

			test('should end on datum.metric1', () => {
				const encodings = getStackedMetricEncodings(horizontalProps);
				expect(encodings.x2).toEqual({ scale: 'xLinear', field: `${DEFAULT_METRIC}1` });
			});
		});
	});

	describe('getCornerRadiusEncodings()', () => {
		test('defaultBarProps, should return stacked radius encodings', () => {
			expect(getCornerRadiusEncodings(defaultBarProps)).toStrictEqual(defaultCornerRadiusEncodings);
		});
		test('dodged, return simple radius encodings', () => {
			expect(getCornerRadiusEncodings({ ...defaultBarProps, type: 'dodged' })).toStrictEqual(
				defaultDodgedCornerRadiusEncodings
			);
		});
		test('horizontal, should return stacked radius encodings rotated clockwise', () => {
			const vertical = getCornerRadiusEncodings(defaultBarProps);
			const horizontal = getCornerRadiusEncodings({ ...defaultBarProps, orientation: 'horizontal' });

			expect(horizontal?.cornerRadiusTopLeft).toEqual(vertical?.cornerRadiusBottomLeft);
			expect(horizontal?.cornerRadiusTopRight).toEqual(vertical?.cornerRadiusTopLeft);
			expect(horizontal?.cornerRadiusBottomRight).toEqual(vertical?.cornerRadiusTopRight);
			expect(horizontal?.cornerRadiusBottomLeft).toEqual(vertical?.cornerRadiusBottomRight);
		});
		test('horizontal dodged, should return stacked radius encodings rotated clockwise', () => {
			const vertical = getCornerRadiusEncodings({ ...defaultBarProps, type: 'dodged' });
			const horizontal = getCornerRadiusEncodings({
				...defaultBarProps,
				type: 'dodged',
				orientation: 'horizontal',
			});

			expect(horizontal?.cornerRadiusTopLeft).toEqual(vertical?.cornerRadiusBottomLeft);
			expect(horizontal?.cornerRadiusTopRight).toEqual(vertical?.cornerRadiusTopLeft);
			expect(horizontal?.cornerRadiusBottomRight).toEqual(vertical?.cornerRadiusTopRight);
			expect(horizontal?.cornerRadiusBottomLeft).toEqual(vertical?.cornerRadiusBottomRight);
		});
		test('corner radius should be 0 when the hasSquareCorners prop is true', () => {
			const squareRadius = getCornerRadiusEncodings({ ...defaultBarProps, hasSquareCorners: true });

			// Square radius should have values of 0
			expect(squareRadius).toEqual(
				expect.objectContaining({
					cornerRadiusTopLeft: expect.arrayContaining([expect.objectContaining({ value: 0 })]),
					cornerRadiusTopRight: expect.arrayContaining([expect.objectContaining({ value: 0 })]),
				})
			);

			const roundRadius = getCornerRadiusEncodings({ ...defaultBarProps });

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
		test('defaultBarProps, should return default encodings', () => {
			expect(getStackedCornerRadiusEncodings(defaultBarProps)).toStrictEqual(defaultCornerRadiusEncodings);
		});
		test('defaultBarProps with secondary color, should include secondaryColor in singal path', () => {
			expect(getStackedCornerRadiusEncodings(defaultBarPropsWithSecondayColor).cornerRadiusTopLeft).toStrictEqual(
				[
					{
						test: `datum.${DEFAULT_METRIC}1 > 0 && data('bar0_stacks')[indexof(pluck(data('bar0_stacks'), '${STACK_ID}'), datum.${STACK_ID})].max_${DEFAULT_METRIC}1 === datum.${DEFAULT_METRIC}1`,
						value: CORNER_RADIUS,
					},
					{ value: 0 },
				]
			);
		});
		test('dodged with secondary color, should include secondaryColor in singal path', () => {
			expect(
				getStackedCornerRadiusEncodings({
					...defaultBarPropsWithSecondayColor,
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
			const squareRadius = getStackedCornerRadiusEncodings({ ...defaultBarProps, hasSquareCorners: true });

			// Square radius should have values of 0
			expect(squareRadius).toEqual(
				expect.objectContaining({
					cornerRadiusTopLeft: expect.arrayContaining([expect.objectContaining({ value: 0 })]),
					cornerRadiusTopRight: expect.arrayContaining([expect.objectContaining({ value: 0 })]),
				})
			);

			const roundRadius = getStackedCornerRadiusEncodings({ ...defaultBarProps });

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
				rangeScale: 'width',
			});
		});
		test('returns correct properties for horizontal orientation', () => {
			expect(getOrientationProperties('horizontal')).toEqual({
				metricAxis: 'x',
				dimensionAxis: 'y',
				metricScaleKey: 'xLinear',
				dimensionScaleKey: 'yBand',
				rangeScale: 'height',
			});
		});
	});

	describe('getStroke()', () => {
		test('should return production rule with one item in array if there is not a popover', () => {
			const strokeRule = getStroke(defaultBarProps);
			expect(strokeRule).toHaveLength(1);
			expect(strokeRule[0]).toStrictEqual({ scale: COLOR_SCALE, field: DEFAULT_COLOR });
		});
		test('should return rules for selected data if popover exists', () => {
			const popover = createElement(ChartPopover);
			const strokeRule = getStroke({ ...defaultBarProps, children: [popover] });
			expect(strokeRule).toHaveLength(2);
			expect(strokeRule[0]).toStrictEqual({
				test: `(${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${MARK_ID}) || (${SELECTED_GROUP} && ${SELECTED_GROUP} === datum.bar0_selectedGroupId)`,
				value: 'rgb(20, 115, 230)',
			});
		});
	});

	describe('getDimensionSelectionRing()', () => {
		const barProps: Partial<BarSpecProps> = {
			name: 'bar0',
			colorScheme: 'light',
			orientation: 'vertical',
			paddingRatio: 0.3,
		};

		test('should return vertical selection ring', () => {
			const selectionRing = getDimensionSelectionRing(barProps as BarSpecProps);
			expect(selectionRing).toStrictEqual({
				encode: {
					enter: {
						cornerRadius: { value: 6 },
						fill: { value: 'transparent' },
						padding: { value: 5 },
						stroke: { value: 'rgb(20, 115, 230)' },
						strokeWidth: { value: 2 },
					},
					update: {
						width: { signal: "bandwidth('xBand')/(1 - 0.3 / 2)" },
						xc: { signal: "scale('xBand', datum.bar0_selectedGroupId) + bandwidth('xBand')/2" },
						y: { value: -5 },
						y2: { signal: 'height + 5' },
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
			const selectionRing = getDimensionSelectionRing({ ...barProps, orientation: 'horizontal' } as BarSpecProps);
			expect(selectionRing).toStrictEqual({
				encode: {
					enter: {
						cornerRadius: { value: 6 },
						fill: { value: 'transparent' },
						padding: { value: 5 },
						stroke: { value: 'rgb(20, 115, 230)' },
						strokeWidth: { value: 2 },
					},
					update: {
						x: { value: -5 },
						x2: { signal: 'width + 5' },
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
			const strokeRule = getStrokeDash(defaultBarProps);
			expect(strokeRule).toHaveLength(1);
			expect(strokeRule[0]).toStrictEqual({ value: [] });
		});
		test('should return rules for selected data if popover exists', () => {
			const popover = createElement(ChartPopover);
			const strokeRule = getStrokeDash({ ...defaultBarProps, children: [popover] });
			expect(strokeRule).toHaveLength(2);
			expect(strokeRule[0]).toStrictEqual({
				test: `${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${MARK_ID}`,
				value: [],
			});
		});
	});

	describe('getStrokeWidth()', () => {
		test('should return production rule with one item in array if there is not a popover', () => {
			const strokeRule = getStrokeWidth(defaultBarProps);
			expect(strokeRule).toHaveLength(1);
			expect(strokeRule[0]).toStrictEqual({ value: 0 });
		});
		test('should return production rule with one item in array if there is a popover that highlights by dimension', () => {
			const strokeRule = getStrokeWidth({
				...defaultBarProps,
				children: [createElement(ChartPopover, { UNSAFE_highlightBy: 'dimension' })],
			});
			expect(strokeRule).toHaveLength(1);
			expect(strokeRule[0]).toStrictEqual({ value: 0 });
		});
		test('should return rules for selected data if popover exists', () => {
			const popover = createElement(ChartPopover);
			const strokeRule = getStrokeWidth({ ...defaultBarProps, children: [popover] });
			expect(strokeRule).toHaveLength(2);
			expect(strokeRule[0]).toStrictEqual({
				test: `(${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${MARK_ID}) || (${SELECTED_GROUP} && ${SELECTED_GROUP} === datum.bar0_selectedGroupId)`,
				value: 2,
			});
		});
	});

	describe('getBaseBarEnterEncodings()', () => {
		test('default props', () => {
			expect(getBaseBarEnterEncodings(defaultBarProps)).toStrictEqual(defaultBarEnterEncodings);
		});
	});

	describe('getDodgedGroupMark()', () => {
		test('should retrun group mark', () => {
			expect(getDodgedGroupMark(defaultBarProps)).toStrictEqual({
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
			expect(getDodgedGroupMark({ ...defaultBarProps, groupedPadding })).toStrictEqual({
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
			expect(getDodgedDimensionEncodings(defaultBarProps)).toStrictEqual(defaultDodgedXEncodings);
		});
	});

	describe('getBarPadding()', () => {
		test('should return correct inner and outer padding', () => {
			expect(getBarPadding(0.5)).toEqual({ paddingInner: 0.5, paddingOuter: 0.25 });
			expect(getBarPadding(0.5, 0.5)).toEqual({ paddingInner: 0.5, paddingOuter: 0.5 });
		});
	});
});
