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

import { Annotation } from '@components/Annotation';
import { ChartPopover } from '@components/ChartPopover';
import { ChartTooltip } from '@components/ChartTooltip';
import {
	CORNER_RADIUS,
	DEFAULT_CATEGORICAL_DIMENSION,
	DEFAULT_COLOR,
	DEFAULT_METRIC,
	FILTERED_TABLE,
	HIGHLIGHT_CONTRAST_RATIO,
	MARK_ID,
	PADDING_RATIO,
	STACK_ID,
} from '@constants';
import { BarSpecProps } from 'types';
import { RectEncodeEntry } from 'vega';

import {
	defaultBarEnterEncodings,
	defaultBarPopoverFillOpacity,
	defaultBarProps,
	defaultBarPropsWithSecondayColor,
	defaultCornerRadiusEncodings,
	defaultDodgedCornerRadiusEncodings,
	defaultDodgedYEncodings,
	defaultStackedYEncodings,
	dodgedAnnotationMarks,
	dodgedAnnotationMarksWithStyles,
	dodgedGroupField,
	dodgedSubSeriesAnnotationMarks,
	dodgedXScale,
	stackedAnnotationMarks,
	stackedAnnotationMarksWithStyles,
	stackedXScale,
} from './barTestUtils';
import {
	getAnnotationMarks,
	getAnnotationMetricAxisPosition,
	getAnnotationPositionOffset,
	getBarPadding,
	getBaseBarEnterEncodings,
	getCornerRadiusEncodings,
	getDodgedDimensionEncodings,
	getDodgedGroupMark,
	getFillStrokeOpacity,
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

	describe('getFillStrokeOpacity()', () => {
		test('no children, should use provided opacity', () => {
			expect(getFillStrokeOpacity(defaultBarProps)).toStrictEqual([{ value: 1 }]);
		});
		test('no children, series key for opacity, should use scale and field for opacity', () => {
			expect(getFillStrokeOpacity({ ...defaultBarProps, opacity: DEFAULT_COLOR })).toStrictEqual([
				{ signal: "scale('opacity', datum.series)" },
			]);
		});
		test('Tooltip child, should return tests for hover and default to opacity', () => {
			const tooltip = createElement(ChartTooltip);
			expect(getFillStrokeOpacity({ ...defaultBarProps, children: [tooltip] })).toStrictEqual([
				{ test: `bar0_hoveredId && bar0_hoveredId !== datum.${MARK_ID}`, value: 1 / HIGHLIGHT_CONTRAST_RATIO },
				{ value: 1 },
			]);
		});
		test('Popover child, should return tests for hover and select and default to opacity', () => {
			const popover = createElement(ChartPopover);
			expect(getFillStrokeOpacity({ ...defaultBarProps, children: [popover] })).toStrictEqual(
				defaultBarPopoverFillOpacity
			);
		});
		test('isStrokeOpacity with popover, should set opacity to 1 when mark is selected', () => {
			const popover = createElement(ChartPopover);
			const rule = getFillStrokeOpacity({ ...defaultBarProps, children: [popover] }, true);
			expect(rule).toHaveLength(4);
			expect(rule[2]).toEqual({ test: `bar0_selectedId && bar0_selectedId === datum.${MARK_ID}`, value: 1 });
		});
	});

	describe('getStroke()', () => {
		test('should return production rule with one item in array if there is not a popover', () => {
			const strokeRule = getStroke(defaultBarProps);
			expect(strokeRule).toHaveLength(1);
			expect(strokeRule[0]).toStrictEqual({ scale: 'color', field: DEFAULT_COLOR });
		});
		test('should return rules for selected data if popover exists', () => {
			const popover = createElement(ChartPopover);
			const strokeRule = getStroke({ ...defaultBarProps, children: [popover] });
			expect(strokeRule).toHaveLength(2);
			expect(strokeRule[0]).toStrictEqual({
				test: `bar0_selectedId && bar0_selectedId === datum.${MARK_ID}`,
				value: 'rgb(20, 115, 230)',
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
				test: `bar0_selectedId && bar0_selectedId === datum.${MARK_ID}`,
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
		test('should return rules for selected data if popover exists', () => {
			const popover = createElement(ChartPopover);
			const strokeRule = getStrokeWidth({ ...defaultBarProps, children: [popover] });
			expect(strokeRule).toHaveLength(2);
			expect(strokeRule[0]).toStrictEqual({
				test: `bar0_selectedId && bar0_selectedId === datum.${MARK_ID}`,
				value: 2,
			});
		});
	});

	describe('getAnnotationPositionOffset()', () => {
		test('returns 13.5 for vertical orientation', () => {
			expect(getAnnotationPositionOffset(defaultBarProps, { value: 12345 })).toEqual('13.5');
		});

		test('returns provided value / 2 + 2.5 when value is set and orientation is not vertical', () => {
			expect(
				getAnnotationPositionOffset({ ...defaultBarProps, orientation: 'horizontal' }, { value: 50 })
			).toEqual('27.5');
		});

		test('returns the signal string wrapped with parens when signal is set and orientation is not vertical', () => {
			expect(
				getAnnotationPositionOffset({ ...defaultBarProps, orientation: 'horizontal' }, { signal: 'foo' })
			).toEqual('((foo) / 2 + 2.5)');
		});
	});

	describe('getAnnotationMetricAxisPosition()', () => {
		const defaultAnnotationWidth = { value: 22 };

		test("defaultBarProps, should return '${value}1' field", () => {
			expect(getAnnotationMetricAxisPosition(defaultBarProps, defaultAnnotationWidth)).toStrictEqual([
				{
					signal: `max(scale('yLinear', datum.${defaultBarProps.metric}1), scale('yLinear', 0) + 13.5)`,
					test: `datum.${defaultBarProps.metric}1 < 0`,
				},
				{ signal: `min(scale('yLinear', datum.${defaultBarProps.metric}1), scale('yLinear', 0) - 13.5)` },
			]);
		});
		test('horizontal orientation, should return with xLinear scale and min/max properties flipped', () => {
			expect(
				getAnnotationMetricAxisPosition(
					{ ...defaultBarProps, orientation: 'horizontal' },
					defaultAnnotationWidth
				)
			).toStrictEqual([
				{
					test: `datum.${defaultBarProps.metric}1 < 0`,
					signal: `min(scale('xLinear', datum.${defaultBarProps.metric}1), scale('xLinear', 0) - 13.5)`,
				},
				{ signal: `max(scale('xLinear', datum.${defaultBarProps.metric}1), scale('xLinear', 0) + 13.5)` },
			]);
		});
		test("stacked with seconday scale, should return '${value}1' field", () => {
			expect(
				getAnnotationMetricAxisPosition(defaultBarPropsWithSecondayColor, defaultAnnotationWidth)
			).toStrictEqual([
				{
					signal: `max(scale('yLinear', datum.${defaultBarProps.metric}1), scale('yLinear', 0) + 13.5)`,
					test: `datum.${defaultBarProps.metric}1 < 0`,
				},
				{ signal: `min(scale('yLinear', datum.${defaultBarProps.metric}1), scale('yLinear', 0) - 13.5)` },
			]);
		});
		test("dodged without secondary scale, should return 'value' field", () => {
			expect(
				getAnnotationMetricAxisPosition({ ...defaultBarProps, type: 'dodged' }, defaultAnnotationWidth)
			).toStrictEqual([
				{
					signal: `max(scale('yLinear', datum.${defaultBarProps.metric}), scale('yLinear', 0) + 13.5)`,
					test: `datum.${defaultBarProps.metric} < 0`,
				},
				{ signal: `min(scale('yLinear', datum.${defaultBarProps.metric}), scale('yLinear', 0) - 13.5)` },
			]);
		});
		test("dodged with secondary scale, should return '${value}1' field", () => {
			expect(
				getAnnotationMetricAxisPosition(defaultBarPropsWithSecondayColor, defaultAnnotationWidth)
			).toStrictEqual([
				{
					signal: `max(scale('yLinear', datum.${defaultBarProps.metric}1), scale('yLinear', 0) + 13.5)`,
					test: `datum.${defaultBarProps.metric}1 < 0`,
				},
				{ signal: `min(scale('yLinear', datum.${defaultBarProps.metric}1), scale('yLinear', 0) - 13.5)` },
			]);
		});
	});

	describe('getAnnotationMarks()', () => {
		const annotationElement = createElement(Annotation, { textKey: 'textLabel' });
		const annotationChildren = [...defaultBarProps.children, annotationElement];

		const annotationElementWithStyles = createElement(Annotation, { textKey: 'textLabel', style: { width: 48 } });
		const annotationChildrenWithStyles = [...defaultBarProps.children, annotationElementWithStyles];
		test('defaultBarProps should return text marks when passed with Annotation', () => {
			expect(
				getAnnotationMarks(
					{ ...defaultBarProps, children: annotationChildren },
					FILTERED_TABLE,
					stackedXScale,
					defaultBarProps.dimension
				)
			).toStrictEqual(stackedAnnotationMarks);
		});
		test('horizontal orientation should return xc and yc opposite of vertical orientation', () => {
			const annotationWidthSignal = `getLabelWidth(datum.textLabel, 'bold', 12) + 10`;
			const props: BarSpecProps = { ...defaultBarProps, orientation: 'horizontal', children: annotationChildren };
			const annotationMarks = getAnnotationMarks(props, FILTERED_TABLE, 'yBand', defaultBarProps.dimension);

			expect(annotationMarks[0].encode?.enter?.yc).toStrictEqual({
				scale: 'yBand',
				field: 'category',
				band: 0.5,
			});
			expect(annotationMarks[0].encode?.enter?.xc).toStrictEqual(
				getAnnotationMetricAxisPosition(props, { signal: annotationWidthSignal })
			);

			expect(annotationMarks[1].encode?.enter?.y).toStrictEqual({ scale: 'yBand', field: 'category', band: 0.5 });
			expect(annotationMarks[1].encode?.enter?.x).toStrictEqual(
				getAnnotationMetricAxisPosition(props, { signal: annotationWidthSignal })
			);
		});
		test('defaultBarProps with secondary scale should return text marks when passed with Annotation', () => {
			expect(
				getAnnotationMarks(
					{ ...defaultBarPropsWithSecondayColor, children: annotationChildren },
					FILTERED_TABLE,
					stackedXScale,
					defaultBarProps.dimension
				)
			).toStrictEqual(stackedAnnotationMarks);
		});
		test('dodged should return text marks when passed with Annotation', () => {
			expect(
				getAnnotationMarks(
					{ ...defaultBarProps, type: 'dodged', children: annotationChildren },
					`${defaultBarProps.name}_facet`,
					dodgedXScale,
					dodgedGroupField
				)
			).toStrictEqual(dodgedAnnotationMarks);
		});
		test('dodged with secondary series should return text marks when passed with Annotation', () => {
			expect(
				getAnnotationMarks(
					{
						...defaultBarPropsWithSecondayColor,
						type: 'dodged',
						children: annotationChildren,
					},
					`${defaultBarProps.name}_facet`,
					dodgedXScale,
					dodgedGroupField
				)
			).toStrictEqual(dodgedSubSeriesAnnotationMarks);
		});

		test('defaultBarProps returns fixed width annotation background when Annotation has style.width', () => {
			expect(
				getAnnotationMarks(
					{ ...defaultBarProps, children: annotationChildrenWithStyles },
					FILTERED_TABLE,
					stackedXScale,
					defaultBarProps.dimension
				)
			).toStrictEqual(stackedAnnotationMarksWithStyles);
		});
		test('defaultBarProps with secondary scale returns fixed width annotation background when Annotation has style.width', () => {
			expect(
				getAnnotationMarks(
					{ ...defaultBarPropsWithSecondayColor, children: annotationChildrenWithStyles },
					FILTERED_TABLE,
					stackedXScale,
					defaultBarProps.dimension
				)
			).toStrictEqual(stackedAnnotationMarksWithStyles);
		});
		test('dodged should returns fixed width annotation background when Annotation has style.width', () => {
			expect(
				getAnnotationMarks(
					{ ...defaultBarProps, type: 'dodged', children: annotationChildrenWithStyles },
					`${defaultBarProps.name}_facet`,
					dodgedXScale,
					`${defaultBarProps.name}_dodgeGroup`
				)
			).toStrictEqual(dodgedAnnotationMarksWithStyles);
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
