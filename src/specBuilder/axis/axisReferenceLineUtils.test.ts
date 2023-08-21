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

import { ReferenceLine } from '@components/ReferenceLine';
import { DEFAULT_COLOR_SCHEME, DEFAULT_GRANULARITY, DEFAULT_LABEL_ALIGN, DEFAULT_LABEL_FONT_WEIGHT } from '@constants';
import { createElement } from 'react';
import { DATE_PATH } from 'svgPaths';
import { AxisSpecProps, ReferenceLineProps } from 'types';

import {
	getReferenceLineRuleMark,
	getReferenceLineSymbolMark,
	getReferenceLinesFromChildren,
	scaleTypeSupportsRefenceLines,
} from './axisReferenceLineUtils';

const defaultReferenceLineProps: ReferenceLineProps = {
	value: 10,
	icon: 'date',
};

const defaultAxisProps: AxisSpecProps = {
	name: 'axis0',
	baseline: false,
	baselineOffset: 0,
	children: createElement(ReferenceLine, defaultReferenceLineProps),
	colorScheme: DEFAULT_COLOR_SCHEME,
	granularity: DEFAULT_GRANULARITY,
	grid: false,
	hideDefaultLabels: false,
	labelAlign: DEFAULT_LABEL_ALIGN,
	labelFontWeight: DEFAULT_LABEL_FONT_WEIGHT,
	position: 'bottom',
	ticks: false,
};

describe('getReferenceLinesFromChildren()', () => {
	test('should return the props for all ReferenceLine elements', () => {
		const referenceLines = getReferenceLinesFromChildren([
			createElement(ReferenceLine, { value: 1 }),
			createElement(ReferenceLine, { value: 0, icon: 'date' }),
			createElement('div', { className: 'test' }),
		]);

		expect(referenceLines).toHaveLength(2);
		expect(referenceLines[0]).toHaveProperty('value', 1);
		expect(referenceLines[1]).toHaveProperty('value', 0);
		expect(referenceLines[1]).toHaveProperty('icon', 'date');
	});
});

describe('scaleTypeSupportsRefenceLines()', () => {
	test('should identify supported and unsupported scaleTypes', () => {
		expect(scaleTypeSupportsRefenceLines('linear')).toBe(true);
		expect(scaleTypeSupportsRefenceLines('point')).toBe(true);
		expect(scaleTypeSupportsRefenceLines('time')).toBe(true);
		expect(scaleTypeSupportsRefenceLines('utc')).toBe(true);
		expect(scaleTypeSupportsRefenceLines('band')).toBe(false);
	});
});

describe('getReferenceLineRuleMark()', () => {
	test('should generate rule mark', () => {
		const rule = getReferenceLineRuleMark(defaultAxisProps, defaultReferenceLineProps, 0, 'xLinear');
		expect(rule).toStrictEqual({
			encode: { update: { x: { scale: 'xLinear', value: 10 }, y: { value: 0 }, y2: { signal: 'height + 0' } } },
			interactive: false,
			name: 'axis0XReferenceLineRule0',
			type: 'rule',
		});
	});

	test('should apply the correct position encodings based on axis position', () => {
		const topAxisRule = getReferenceLineRuleMark(
			{ ...defaultAxisProps, position: 'top' },
			defaultReferenceLineProps,
			0,
			'xLinear',
		);
		expect(topAxisRule.encode?.update?.x).toStrictEqual({ scale: 'xLinear', value: 10 });
		expect(topAxisRule.encode?.update?.y).toStrictEqual({ value: -0 });
		expect(topAxisRule.encode?.update?.y2).toStrictEqual({ signal: 'height' });

		const bottomAxisRule = getReferenceLineRuleMark(defaultAxisProps, defaultReferenceLineProps, 0, 'xLinear');
		expect(bottomAxisRule.encode?.update?.x).toStrictEqual({ scale: 'xLinear', value: 10 });
		expect(bottomAxisRule.encode?.update?.y).toStrictEqual({ value: 0 });
		expect(bottomAxisRule.encode?.update?.y2).toStrictEqual({ signal: 'height + 0' });

		const leftAxisRule = getReferenceLineRuleMark(
			{ ...defaultAxisProps, position: 'left' },
			defaultReferenceLineProps,
			0,
			'yLinear',
		);
		expect(leftAxisRule.encode?.update?.x).toStrictEqual({ value: -0 });
		expect(leftAxisRule.encode?.update?.x2).toStrictEqual({ signal: 'width' });
		expect(leftAxisRule.encode?.update?.y).toStrictEqual({ scale: 'yLinear', value: 10 });

		const rightAxisRule = getReferenceLineRuleMark(
			{ ...defaultAxisProps, position: 'right' },
			defaultReferenceLineProps,
			0,
			'yLinear',
		);
		expect(rightAxisRule.encode?.update?.x).toStrictEqual({ value: 0 });
		expect(rightAxisRule.encode?.update?.x2).toStrictEqual({ signal: 'width + 0' });
		expect(rightAxisRule.encode?.update?.y).toStrictEqual({ scale: 'yLinear', value: 10 });
	});

	test('should offset start of rule by 9 pixels if ticks are present', () => {
		const bottomAxisRule = getReferenceLineRuleMark(
			{ ...defaultAxisProps, ticks: true },
			defaultReferenceLineProps,
			0,
			'xLinear',
		);
		expect(bottomAxisRule.encode?.update?.y2).toStrictEqual({ signal: 'height + 9' });

		const topAxisRule = getReferenceLineRuleMark(
			{ ...defaultAxisProps, position: 'top', ticks: true },
			defaultReferenceLineProps,
			0,
			'xLinear',
		);
		expect(topAxisRule.encode?.update?.y).toStrictEqual({ value: -9 });
	});
});

describe('getReferenceLineSymbolMark()', () => {
	test('should return empty array if the icon property is not set', () => {
		const symbols = getReferenceLineSymbolMark(
			defaultAxisProps,
			{ ...defaultReferenceLineProps, icon: undefined },
			0,
			'xLinear',
		);
		expect(symbols).toHaveLength(0);
	});
	test('should generate symbol mark if icon id defined', () => {
		const symbols = getReferenceLineSymbolMark(defaultAxisProps, defaultReferenceLineProps, 0, 'xLinear');
		expect(symbols).toStrictEqual([
			{
				encode: {
					enter: {
						fill: { value: 'rgb(0, 0, 0)' },
						shape: {
							value: DATE_PATH,
						},
						size: { value: 324 },
					},
					update: {
						x: { scale: 'xLinear', value: 10 },
						y: { signal: 'height + 24' },
					},
				},
				name: 'axis0XReferenceLineSymbol0',
				type: 'symbol',
			},
		]);
	});
	test('should apply the correct position encodings based on axis position', () => {
		const topAxisSymbol = getReferenceLineSymbolMark(
			{ ...defaultAxisProps, position: 'top' },
			defaultReferenceLineProps,
			0,
			'xLinear',
		)[0];
		expect(topAxisSymbol.encode?.update).toStrictEqual({ x: { scale: 'xLinear', value: 10 }, y: { value: -24 } });

		const bottomAxisSymbol = getReferenceLineSymbolMark(
			defaultAxisProps,
			defaultReferenceLineProps,
			0,
			'xLinear',
		)[0];
		expect(bottomAxisSymbol.encode?.update).toStrictEqual({
			x: { scale: 'xLinear', value: 10 },
			y: { signal: 'height + 24' },
		});

		const leftAxisSymbol = getReferenceLineSymbolMark(
			{ ...defaultAxisProps, position: 'left' },
			defaultReferenceLineProps,
			0,
			'yLinear',
		)[0];
		expect(leftAxisSymbol.encode?.update).toStrictEqual({ x: { value: -24 }, y: { scale: 'yLinear', value: 10 } });

		const rightAxisSymbol = getReferenceLineSymbolMark(
			{ ...defaultAxisProps, position: 'right' },
			defaultReferenceLineProps,
			0,
			'yLinear',
		)[0];
		expect(rightAxisSymbol.encode?.update).toStrictEqual({
			x: { signal: 'width + 24' },
			y: { scale: 'yLinear', value: 10 },
		});
	});
});
