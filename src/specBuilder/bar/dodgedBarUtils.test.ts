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
import { ChartTooltip } from '@components/ChartTooltip';
import {
	BACKGROUND_COLOR,
	COLOR_SCALE,
	CORNER_RADIUS,
	DEFAULT_CATEGORICAL_DIMENSION,
	DEFAULT_COLOR,
	DEFAULT_METRIC,
	DEFAULT_OPACITY_RULE,
	DEFAULT_SECONDARY_COLOR,
	FILTERED_TABLE,
	HIGHLIGHTED_ITEM,
	HIGHLIGHT_CONTRAST_RATIO,
	MARK_ID,
} from '@constants';
import { BarSpecProps } from 'types';
import { Mark, RectEncodeEntry } from 'vega';

import {
	defaultBarProps,
	defaultBarStrokeEncodings,
	defaultCornerRadiusEncodings,
	defaultDodgedYEncodings,
	dodgedAnnotationMarks,
} from './barTestUtils';
import { getDodgedMark } from './dodgedBarUtils';

const defaultDodgedProps: BarSpecProps = { ...defaultBarProps, type: 'dodged' };

const defaultDodgedXEncodings: RectEncodeEntry = {
	x: { scale: 'bar0_position', field: 'bar0_dodgeGroup' },
	width: { scale: 'bar0_position', band: 1 },
};

const defaultDodgedCornerRadiusEncodings: RectEncodeEntry = {
	cornerRadiusTopLeft: [{ test: `datum.${DEFAULT_METRIC} > 0`, value: CORNER_RADIUS }, { value: 0 }],
	cornerRadiusTopRight: [{ test: `datum.${DEFAULT_METRIC} > 0`, value: CORNER_RADIUS }, { value: 0 }],
	cornerRadiusBottomLeft: [{ test: `datum.${DEFAULT_METRIC} < 0`, value: CORNER_RADIUS }, { value: 0 }],
	cornerRadiusBottomRight: [{ test: `datum.${DEFAULT_METRIC} < 0`, value: CORNER_RADIUS }, { value: 0 }],
};

const defaultDodgedStackedEnterEncodings: RectEncodeEntry = {
	y: [
		{ test: `datum.${DEFAULT_METRIC}0 === 0`, signal: `scale('yLinear', datum.${DEFAULT_METRIC}0)` },
		{
			test: `datum.${DEFAULT_METRIC}1 > 0`,
			signal: `max(scale('yLinear', datum.${DEFAULT_METRIC}0) - 1.5, scale('yLinear', datum.${DEFAULT_METRIC}1))`,
		},
		{ signal: `min(scale('yLinear', datum.${DEFAULT_METRIC}0) + 1.5, scale('yLinear', datum.${DEFAULT_METRIC}1))` },
	],
	y2: { scale: 'yLinear', field: `${DEFAULT_METRIC}1` },
	...defaultCornerRadiusEncodings,
};

const defaultBackgroundMark: Mark = {
	name: 'bar0_background',
	type: 'rect',
	from: { data: 'bar0_facet' },
	interactive: false,
	encode: {
		enter: {
			...defaultDodgedYEncodings,
			...defaultDodgedCornerRadiusEncodings,
			fill: { signal: BACKGROUND_COLOR },
		},
		update: { ...defaultDodgedXEncodings },
	},
};

const defaultMark: Mark = {
	name: 'bar0',
	type: 'rect',
	from: { data: 'bar0_facet' },
	interactive: false,
	encode: {
		enter: {
			...defaultDodgedYEncodings,
			...defaultDodgedCornerRadiusEncodings,
			fill: { field: DEFAULT_COLOR, scale: COLOR_SCALE },
			fillOpacity: DEFAULT_OPACITY_RULE,
			tooltip: undefined,
		},
		update: {
			...defaultDodgedXEncodings,
			...defaultBarStrokeEncodings,
			cursor: undefined,
			opacity: [DEFAULT_OPACITY_RULE],
		},
	},
};

const defaultMarkWithTooltip: Mark = {
	name: 'bar0',
	type: 'rect',
	from: { data: 'bar0_facet' },
	interactive: true,
	encode: {
		enter: {
			...defaultDodgedYEncodings,
			...defaultDodgedCornerRadiusEncodings,
			fill: { field: DEFAULT_COLOR, scale: COLOR_SCALE },
			fillOpacity: DEFAULT_OPACITY_RULE,
			tooltip: { signal: "merge(datum, {'rscComponentName': 'bar0'})" },
		},
		update: {
			...defaultDodgedXEncodings,
			...defaultBarStrokeEncodings,
			opacity: [
				{
					test: `${HIGHLIGHTED_ITEM} && ${HIGHLIGHTED_ITEM} !== datum.${MARK_ID}`,
					value: 1 / HIGHLIGHT_CONTRAST_RATIO,
				},
				DEFAULT_OPACITY_RULE,
			],
			cursor: undefined,
		},
	},
};

const defaultDodgedStackedBackgroundMark: Mark = {
	name: 'bar0_background',
	type: 'rect',
	from: { data: 'bar0_facet' },
	interactive: false,
	encode: {
		enter: {
			...defaultDodgedStackedEnterEncodings,
			fill: { signal: BACKGROUND_COLOR },
		},
		update: { ...defaultDodgedXEncodings },
	},
};

const defaultDodgedStackedMark: Mark = {
	name: 'bar0',
	type: 'rect',
	from: { data: 'bar0_facet' },
	interactive: false,
	encode: {
		enter: {
			...defaultDodgedStackedEnterEncodings,
			fill: {
				signal: `scale('colors', datum.${DEFAULT_COLOR})[indexof(domain('secondaryColor'), datum.${DEFAULT_SECONDARY_COLOR})% length(scale('colors', datum.${DEFAULT_COLOR}))]`,
			},
			fillOpacity: DEFAULT_OPACITY_RULE,
			tooltip: undefined,
		},
		update: {
			...defaultDodgedXEncodings,
			cursor: undefined,
			opacity: [DEFAULT_OPACITY_RULE],
			stroke: [
				{
					signal: `scale('colors', datum.${DEFAULT_COLOR})[indexof(domain('secondaryColor'), datum.${DEFAULT_SECONDARY_COLOR})% length(scale('colors', datum.${DEFAULT_COLOR}))]`,
				},
			],
			strokeDash: [{ value: [] }],
			strokeWidth: [{ value: 0 }],
		},
	},
};

export const defaultDodgedMark = {
	name: 'bar0_group',
	type: 'group',
	from: { facet: { data: FILTERED_TABLE, groupby: DEFAULT_CATEGORICAL_DIMENSION, name: 'bar0_facet' } },
	signals: [{ name: 'width', update: 'bandwidth("xBand")' }],
	scales: [
		{
			domain: { data: FILTERED_TABLE, field: `bar0_dodgeGroup` },
			name: 'bar0_position',
			paddingInner: 0.4,
			range: 'width',
			type: 'band',
		},
	],
	encode: {
		enter: { x: { field: DEFAULT_CATEGORICAL_DIMENSION, scale: 'xBand' } } },
	marks: [defaultBackgroundMark, defaultMark],
};

export const annotationDodgedMarks = {
	...defaultDodgedMark,
	marks: [...defaultDodgedMark.marks, ...dodgedAnnotationMarks],
};

describe('dodgedBarUtils', () => {
	describe('getDodgedMark()', () => {
		test('default props,', () => {
			expect(getDodgedMark(defaultDodgedProps)).toStrictEqual(defaultDodgedMark);
		});
		test('with annotation', () => {
			const annotationElement = createElement(Annotation, { textKey: 'textLabel' });
			expect(
				getDodgedMark({ animations: false,
					...defaultDodgedProps,
					children: [...defaultDodgedProps.children, annotationElement],
				})
			).toStrictEqual(annotationDodgedMarks);
		});
		test('should add tooltip keys if ChartTooltip exists as child', () => {
			expect(getDodgedMark({ ...defaultDodgedProps, children: [createElement(ChartTooltip)] })).toStrictEqual({
				...defaultDodgedMark,
				marks: [defaultBackgroundMark, defaultMarkWithTooltip],
			});
		});
	});
	describe('getDodgedMark()', () => {
		test('subseries, should include advanced fill, advanced corner radius, and border strokes,', () => {
			expect(
				getDodgedMark({ ...defaultDodgedProps, color: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR] })
			).toStrictEqual({
				...defaultDodgedMark,
				marks: [defaultDodgedStackedBackgroundMark, defaultDodgedStackedMark],
			});
		});
	});
});
