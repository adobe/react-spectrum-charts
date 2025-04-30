/*
 * Copyright 2025 Adobe. All rights reserved.
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

import { ChartPopOver } from '@'

import { defaultVennProps, data as vennData } from './vennTestUtils';
import {
	getCircleMark,
	getInterserctionMark,
	getCircleOverlays,
	getStrokeMark,
	getTextMark,
	getVennSolution,
	mapDataForVennHelper,
	mergeStylesWithDefaults,
} from './vennUtils';

describe('getVennSolution', () => {
	test('should return the correct object structure with defaultVennProps', () => {
		const vennSolution = getVennSolution(defaultVennProps);
		expect(vennSolution).toHaveProperty('circles');
		expect(vennSolution).toHaveProperty('intersections');
	});

	test('should return empty arrays when no data is provided', () => {
		const vennSolution = getVennSolution({ ...defaultVennProps, data: [] });
		expect(vennSolution.circles).toEqual([]);
		expect(vennSolution.intersections).toEqual([]);
	});

	test('should return correct data for one circle', () => {
		const vennSolution = getVennSolution({ ...defaultVennProps, data: [{ regions: ['A'], radius: 12 }] });
		// Checking for correct length of arrays
		expect(vennSolution.circles).toHaveLength(1);
		expect(vennSolution.intersections).toHaveLength(0);

		// Checking for correct properties cirles array for only circle
		expect(vennSolution.circles[0]).toHaveProperty('set_id', 'A');
		expect(vennSolution.circles[0]).toHaveProperty('size');
		expect(vennSolution.circles[0]).toHaveProperty('x');
		expect(vennSolution.circles[0]).toHaveProperty('y');
		expect(vennSolution.circles[0]).toHaveProperty('textX');
		expect(vennSolution.circles[0]).toHaveProperty('textY');
	});

	test('should return data for vennData with multiple circles and intersections', () => {
		const vennSolution = getVennSolution({ ...defaultVennProps, data: vennData ?? [] });
		// Checking for correct length of arrays

		expect(vennSolution.circles).toHaveLength(4);
		expect(vennSolution.intersections).toHaveLength(5);

		const firstCircle = vennSolution.circles[0];
		expect(firstCircle).toHaveProperty('set_id');
		expect(firstCircle).toHaveProperty('x');
		expect(firstCircle).toHaveProperty('y');
		expect(firstCircle).toHaveProperty('size');
		expect(firstCircle).toHaveProperty('textX');
		expect(firstCircle).toHaveProperty('textY');

		// Check intersection properties
		const firstIntersection = vennSolution.intersections[0];
		expect(firstIntersection).toHaveProperty('set_id');
		expect(firstIntersection).toHaveProperty('sets');
		expect(Array.isArray(firstIntersection.sets)).toBe(true);
		expect(firstIntersection.sets.length).toBeGreaterThan(1);
		expect(firstIntersection).toHaveProperty('path');
		expect(firstIntersection).toHaveProperty('textX');
		expect(firstIntersection).toHaveProperty('textY');
		expect(firstIntersection).toHaveProperty('size');

		// Check specific intersection for instagram and X
		const abIntersection = vennSolution.intersections.find(
			(i) => i.sets.includes('Instagram') && i.sets.includes('X') && i.sets.length === 2
		);
		expect(abIntersection).toBeDefined();
	});

	test('should still give solution with orienation undefined in props', () => {
		const vennSolution = getVennSolution({ ...defaultVennProps, data: vennData ?? [] });
		expect(vennSolution).toBeDefined();
	});

	test('should give correct data for two disjoint sets', () => {
		const vennSolution = getVennSolution({
			...defaultVennProps,
			data: [
				{ regions: ['A'], radius: 12 },
				{ regions: ['B'], radius: 10 },
			],
		});

		expect(vennSolution.circles).toHaveLength(2);
		expect(vennSolution.intersections).toHaveLength(0);
	});

	test('should correctly calculate circle size from radius', () => {
		const vennSolution = getVennSolution({ ...defaultVennProps, data: vennData ?? [] });

		vennSolution.circles.forEach((circle) => {
			expect(circle.size).toBeGreaterThan(0);
		});
	});
});

describe('mapDataForVennHelper', () => {
	test('should return the correct object structure without modifying metric or color props', () => {
		// Might always go into the if statement branches because of the defaultVennProps
		const parsedData = mapDataForVennHelper({ ...defaultVennProps, data: vennData ?? [] });

		expect(parsedData).toHaveLength(9);

		const firstItem = parsedData[0];
		expect(firstItem).toHaveProperty('size');
		expect(firstItem).toHaveProperty('sets');

		expect(typeof firstItem.size).toBe('number');
		expect(Array.isArray(firstItem.sets)).toBe(true);
	});

	test('should throw error when giving an undefined metric prop', () => {
		expect(() => {
			mapDataForVennHelper({ ...defaultVennProps, data: vennData ?? [], metric: 'fake' });
		}).toThrow();
	});

	test('should throw error when giving an undefined color prop', () => {
		expect(() => {
			mapDataForVennHelper({ ...defaultVennProps, data: vennData ?? [], color: 'fake' });
		}).toThrow();
	});
});

describe('mergeStylesWithDefaults', () => {
	test('should set default styling when calling with undefined style', () => {
		const defaultStyles = mergeStylesWithDefaults({ fontSize: 30, fontWeight: 'bolder' });

		expect(defaultStyles).toHaveProperty('fontSize', 30);
		expect(defaultStyles).toHaveProperty('padding');
		expect(defaultStyles).toHaveProperty('fontWeight', 'bolder');
		expect(defaultStyles).toHaveProperty('intersectionFill');
		expect(defaultStyles).toHaveProperty('color');
	});
});

describe('getSelectedCircleMark', () => {
	test('should return a full selected cirlce mark when given defaultVennProps', () => {
		const selectedCircleMark = getCircleOverlays(defaultVennProps);

		expect(selectedCircleMark).toBeDefined();
		expect(selectedCircleMark).toHaveProperty('type', 'symbol');
		expect(selectedCircleMark).toHaveProperty('name');
		expect(selectedCircleMark).toHaveProperty('from');
		expect(selectedCircleMark).toHaveProperty('interactive', false);
		expect(selectedCircleMark).toHaveProperty('encode');
	});
});

describe('getCircleMark', () => {
	test('should return full circle mark when given defaultVennProps', () => {
		const circleMark = getCircleMark(defaultVennProps);

		expect(circleMark).toBeDefined();
		expect(circleMark).toHaveProperty('type', 'symbol');
		expect(circleMark).toHaveProperty('name');
		expect(circleMark).toHaveProperty('from');
		expect(circleMark).toHaveProperty('encode');
	});

	test('should return mark with cursor value pointer if there is an interactive child component present', () => {
		const circleMark = getCircleMark({
			...defaultVennProps,
			children: [createElement(ChartPopover)],
		});

		expect(circleMark).toBeDefined();
		expect(circleMark).toHaveProperty('type', 'symbol');
		expect(circleMark).toHaveProperty('name');
		expect(circleMark).toHaveProperty('from');
		expect(circleMark).toHaveProperty('encode');
		expect(circleMark.encode?.update?.cursor).toHaveProperty('value', 'pointer');
	});
});

describe('getTextMark', () => {
	test('should return full text mark with data property being set to circles', () => {
		const textMark = getTextMark(defaultVennProps, 'circles');

		expect(textMark).toBeDefined();
		expect(textMark).toHaveProperty('type', 'text');
		expect(textMark).toHaveProperty('from');
		expect(textMark.from).toHaveProperty('data', 'circles');
		expect(textMark).toHaveProperty('interactive');
		expect(textMark).toHaveProperty('encode');
	});
});

describe('getInterserctionMark', () => {
	test('should return full intersection text mark with defaultVennProps and check for given name being in name prop', () => {
		const intersectionTextMark = getInterserctionMark(defaultVennProps);

		expect(intersectionTextMark).toBeDefined();
		expect(intersectionTextMark).toHaveProperty('type', 'path');
		expect(intersectionTextMark).toHaveProperty('from');
		expect(intersectionTextMark.from).toHaveProperty('data', 'intersections');
		expect(intersectionTextMark).toHaveProperty('name', 'venn_intersections');
		expect(intersectionTextMark).toHaveProperty('encode');
	});

	test('should return mark with cursor value pointer if there is an interactive child component present', () => {
		const intersectionTextMark = getInterserctionMark({
			...defaultVennProps,
			children: [createElement(ChartPopover)],
		});

		expect(intersectionTextMark).toBeDefined();
		expect(intersectionTextMark).toHaveProperty('type', 'path');
		expect(intersectionTextMark).toHaveProperty('from');
		expect(intersectionTextMark.from).toHaveProperty('data', 'intersections');
		expect(intersectionTextMark).toHaveProperty('name', 'venn_intersections');
		expect(intersectionTextMark).toHaveProperty('encode');
		expect(intersectionTextMark.encode?.update?.cursor).toHaveProperty('value', 'pointer');
	});
});

describe('getStrokeMark', () => {
	test('should return full text mark with data property being set to circles', () => {
		const textMark = getStrokeMark(defaultVennProps);

		expect(textMark).toBeDefined();
		expect(textMark).toHaveProperty('type', 'symbol');
		expect(textMark).toHaveProperty('from');
		expect(textMark.from).toHaveProperty('data', 'circles');
		expect(textMark).toHaveProperty('interactive');
		expect(textMark).toHaveProperty('encode');
	});
});