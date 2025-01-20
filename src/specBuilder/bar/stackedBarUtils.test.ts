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
import {
	ANIMATION_FUNCTION,
	BACKGROUND_COLOR,
	COLOR_SCALE,
	DEFAULT_CATEGORICAL_DIMENSION,
	DEFAULT_COLOR,
	DEFAULT_OPACITY_RULE,
	DEFAULT_SECONDARY_COLOR,
	FILTERED_TABLE,
} from '@constants';
import { GroupMark, Mark, RectEncodeEntry } from 'vega';

import { defaultBarEnterEncodings, defaultBarProps, defaultBarStrokeEncodings } from './barTestUtils';
import { getDodgedAndStackedBarMark, getStackedBarMarks, getStackedDimensionEncodings } from './stackedBarUtils';

const defaultStackedBarXEncodings: RectEncodeEntry = {
	x: { scale: 'xBand', field: DEFAULT_CATEGORICAL_DIMENSION },
	width: { scale: 'xBand', band: 1 },
};

const defaultBackgroundMark: Mark = {
	encode: {
		enter: {
			...defaultBarEnterEncodings,
			fill: { signal: BACKGROUND_COLOR },
		},
		update: defaultStackedBarXEncodings,
	},
	from: { data: FILTERED_TABLE },
	interactive: false,
	name: 'bar0_background',
	description: 'bar0_background',
	type: 'rect',
};

const defaultMark = {
	encode: {
		enter: {
			...defaultBarEnterEncodings,
			fill: { field: DEFAULT_COLOR, scale: COLOR_SCALE },
			fillOpacity: DEFAULT_OPACITY_RULE,
			tooltip: undefined,
		},
		update: {
			cursor: undefined,
			opacity: [DEFAULT_OPACITY_RULE],
			...defaultStackedBarXEncodings,
			...defaultBarStrokeEncodings,
		},
	},
	from: { data: FILTERED_TABLE },
	interactive: false,
	name: 'bar0',
	description: 'bar0',
	type: 'rect',
};

describe('stackedBarUtils', () => {
	describe('getStackedBarMarks()', () => {
		test('default props', () => {
			expect(getStackedBarMarks(defaultBarProps)).toStrictEqual([defaultBackgroundMark, defaultMark]);
		});
		test('with annotation', () => {
			const annotationElement = createElement(Annotation, { textKey: 'textLabel' });
			const marks = getStackedBarMarks({
				...defaultBarProps,
				children: [...defaultBarProps.children, annotationElement],
			});

			expect(marks).toHaveLength(3);
			expect(marks[0].name).toEqual('bar0_background');
			expect(marks[1].name).toEqual('bar0');
			const annotationGroup = marks[2] as GroupMark;
			expect(annotationGroup.name).toEqual('bar0_annotationGroup');
			expect(annotationGroup.marks).toHaveLength(2);
			expect(annotationGroup.marks?.[0].name).toEqual('bar0_annotationText');
			expect(annotationGroup.marks?.[1].name).toEqual('bar0_annotationBackground');
		});
	});

	describe('getDodgedAndStackedBarMark()', () => {
		test('should return mark with dodged and stacked marks', () => {
			const mark = getDodgedAndStackedBarMark(defaultBarProps);

			expect(mark.name).toEqual('bar0_group');
			expect(mark.scales?.[0].name).toEqual('bar0_position');

			expect(mark.marks).toHaveLength(2);
			expect(mark.marks?.[0].name).toEqual('bar0_background');
			expect(mark.marks?.[1].name).toEqual('bar0');
		});

		test('should return mark with dodged and stacked marks, with annotation', () => {
			const mark = getDodgedAndStackedBarMark({
				...defaultBarProps,
				children: [...defaultBarProps.children, createElement(Annotation, { textKey: 'textLabel' })],
			});

			expect(mark.name).toEqual('bar0_group');
			expect(mark.scales?.[0].name).toEqual('bar0_position');

			expect(mark.marks).toHaveLength(3);
			expect(mark.marks?.[0].name).toEqual('bar0_background');
			expect(mark.marks?.[1].name).toEqual('bar0');
			const annotationGroup = mark.marks?.[2] as GroupMark;
			expect(annotationGroup.name).toEqual('bar0_annotationGroup');
			expect(annotationGroup.marks).toHaveLength(2);
			expect(annotationGroup.marks?.[0].name).toEqual('bar0_annotationText');
			expect(annotationGroup.marks?.[1].name).toEqual('bar0_annotationBackground');
		});

		test('should return mark with dodged and stacked marks, with annotation, horizontal', () => {
			const mark = getDodgedAndStackedBarMark({
				...defaultBarProps,
				orientation: 'horizontal',
				children: [...defaultBarProps.children, createElement(Annotation, { textKey: 'textLabel' })],
			});

			expect(mark.name).toEqual('bar0_group');
			expect(mark.scales?.[0].name).toEqual('bar0_position');

			expect(mark.marks).toHaveLength(3);
			expect(mark.marks?.[0].name).toEqual('bar0_background');
			expect(mark.marks?.[1].name).toEqual('bar0');
			const annotationGroup = mark.marks?.[2] as GroupMark;
			expect(annotationGroup.name).toEqual('bar0_annotationGroup');
			expect(annotationGroup.marks).toHaveLength(2);
			expect(annotationGroup.marks?.[0].name).toEqual('bar0_annotationText');
			expect(annotationGroup.marks?.[1].name).toEqual('bar0_annotationBackground');
		});
	});

	describe('getStackedDimensionEncodings()', () => {
		test('should return x and width encodings', () => {
			expect(getStackedDimensionEncodings(defaultBarProps)).toStrictEqual(defaultStackedBarXEncodings);
		});

		test('should get dodged x encoding if stacked/dodged', () => {
			expect(
				getStackedDimensionEncodings({
					...defaultBarProps,
					color: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR],
				})
			).toStrictEqual({
				width: { band: 1, scale: 'bar0_position' },
				x: { field: 'bar0_dodgeGroup', scale: 'bar0_position' },
			});
		});

		test('should return x and width encodings with animations', () => {
			expect(
				getStackedDimensionEncodings({ ...defaultBarProps, animations: true, animateFromZero: true })
			).toStrictEqual({
				...defaultStackedBarXEncodings,
				y: {
					scale: 'yLinear',
					signal: `datum.value0 * ${ANIMATION_FUNCTION}`,
				},
				y2: {
					scale: 'yLinear',
					signal: `datum.value1 * ${ANIMATION_FUNCTION}`,
				},
			});
		});

		test('should get dodged x encoding if stacked/dodged with animations', () => {
			expect(
				getStackedDimensionEncodings({
					...defaultBarProps,
					color: [DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR],
					animations: true,
					animateFromZero: true,
				})
			).toStrictEqual({
				width: { band: 1, scale: 'bar0_position' },
				x: { field: 'bar0_dodgeGroup', scale: 'bar0_position' },
				y: {
					scale: 'yLinear',
					signal: `datum.value0 * ${ANIMATION_FUNCTION}`,
				},
				y2: {
					scale: 'yLinear',
					signal: `datum.value1 * ${ANIMATION_FUNCTION}`,
				},
			});
		});
	});
});
