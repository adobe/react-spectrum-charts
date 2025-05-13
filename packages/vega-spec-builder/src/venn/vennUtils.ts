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
import { NumericValueRef, PathMark, SymbolMark, TextMark } from 'vega';
import { vennSolution } from 'venn-helper';

import {
	DEFAULT_OPACITY_RULE,
	DEFAULT_VENN_COLOR,
	DEFAULT_VENN_METRIC,
	HIGHLIGHT_CONTRAST_RATIO,
	SELECTED_GROUP,
	SELECTED_ITEM,
} from '@spectrum-charts/constants';
import { getColorValue } from '@spectrum-charts/themes';

import {
	getColorProductionRule,
	getCursor,
	getMarkOpacity,
	getTooltip,
	hasPopover,
	isInteractive,
} from '../marks/markUtils';
import { VennDegreeOptions, VennSpecOptions } from '../types';

type VennHelperProps = {
	sets: string[];
	size: number;
};

/** Default delimiter for set ids */
export const SET_ID_DELIMITER = '∩';

export const getVennSolution = (options: VennSpecOptions) => {
	const { orientation, chartWidth, chartHeight } = options;

	const safeData = mapDataForVennHelper(options);

	// safe to do casting since types in map and options are the same
	const orientationInRadians = degreesToRadians.get(orientation) as number;

	return vennSolution(safeData, {
		orientation: orientationInRadians,
		layout: 'greedy',
		width: chartWidth,
		height: chartHeight,
		set_id_delimiter: SET_ID_DELIMITER,
		padding: 0,
	});
};

export const mapDataForVennHelper = (options: VennSpecOptions): VennHelperProps[] => {
	const { data, metric, color } = options;
	const unsafeData = data as unknown as Record<string, unknown>[];

	const parsed = unsafeData
		.map((datum) => {
			const res = { ...datum };

			if (res[metric] === undefined) {
				throw new Error("set the metric prop to the default 'size' or set your own");
			}

			if (metric !== DEFAULT_VENN_METRIC && typeof res[metric] === 'number') {
				res.size = datum[metric] as string;
			}

			if (res[color] === undefined) {
				throw new Error("set the color prop to the default 'sets' or set your own");
			}

			if (color !== DEFAULT_VENN_COLOR && Array.isArray(res[color])) {
				res.sets = structuredClone(datum[color]) as string[];
			}

			return {
				size: res.size as number,
				sets: res.sets as string[],
			} satisfies VennHelperProps;
		})
		.filter((datum) => datum.sets.length > 0);

	return parsed;
};

export const getCircleOverlays = (options: VennSpecOptions): SymbolMark => {
	const { name, colorScheme } = options;

	return {
		type: 'symbol',
		name: `${name}_selected_circle`,
		from: { data: 'circles' },
		interactive: false,
		encode: {
			enter: {
				x: { field: 'x' },
				y: { field: 'y' },
				size: { field: 'size' },
				shape: { value: 'circle' },
				fill: getColorProductionRule('set_id', colorScheme),
				fillOpacity: { value: 0.2 },
			},
		},
	};
};

export const getCircleMark = (options: VennSpecOptions): SymbolMark => {
	const { name, colorScheme, chartTooltips, chartPopovers } = options;

	return {
		type: 'symbol',
		name: name,
		from: { data: 'circles' },
		encode: {
			enter: {
				x: { field: 'x' },
				y: { field: 'y' },
				tooltip: getTooltip(chartTooltips, name),
				size: { field: 'size' },
				shape: { value: 'circle' },
				fill: getColorProductionRule('set_id', colorScheme),
				stroke: { signal: 'chartBackgroundColor' },
				strokeWidth: { value: 2 },
			},
			update: {
				opacity: getMarkOpacity(options, 1),
				cursor: getCursor(chartPopovers),
			},
		},
	};
};

export const getTextMark = (options: VennSpecOptions, dataSource: 'circles' | 'intersections'): TextMark => {
	const { label } = options;

	return {
		type: 'text',
		from: { data: dataSource },
		interactive: false,
		encode: {
			enter: {
				x: { field: 'textX' },
				y: { field: 'textY' },
				text: { field: `table_data.${label}` },
				opacity: getMarkOpacity(options),
				align: { value: 'center' },
				baseline: { value: 'middle' },
			},
		},
	};
};

export const getIntersectionOutlineMark = (options: VennSpecOptions): PathMark => {
	const { name, idKey, colorScheme } = options;

	return {
		type: 'path',
		from: { data: 'intersections' },
		name: `${name}_intersections_outline`,
		interactive: false,
		encode: {
			enter: {
				path: { field: 'path' },
				strokeWidth: { value: 6 },
				strokeCap: { value: 'round' },
				stroke: { value: getColorValue('static-blue', colorScheme) },
			},

			update: {
				strokeOpacity: [{ test: `${SELECTED_ITEM} === datum.${idKey}`, value: 1 }, { value: 0 }],
			},
		},
	};
};

export const getInterserctionMark = (options: VennSpecOptions): PathMark => {
	const { name, chartTooltips, colorScheme, chartPopovers } = options;

	return {
		type: 'path',
		from: { data: 'intersections' },
		name: `${name}_intersections`,
		encode: {
			enter: {
				path: { field: 'path' },
				fill: getColorProductionRule('set_id', colorScheme),
				strokeWidth: { value: 2 },
				stroke: { signal: 'chartBackgroundColor' },
        strokeCap: { value: 'square'},
				tooltip: getTooltip(chartTooltips, `${name}`),
			},

			update: {
				opacity: getInterserctionMarkOpacity(options),
				cursor: getCursor(chartPopovers),
			},
		},
	};
};

export const getStrokeMark = (options: VennSpecOptions): SymbolMark => {
	const { colorScheme, idKey } = options;
	return {
		type: 'symbol',
		name: `${options.name}_stroke`,
		from: { data: 'circles' },
		interactive: false,
		encode: {
			enter: {
				x: { field: 'x' },
				y: { field: 'y' },
				size: { field: 'size' },
				shape: { value: 'circle' },
				stroke: { value: getColorValue('static-blue', colorScheme) },
				strokeWidth: { value: 6 },
			},
			update: {
				strokeOpacity: [{ test: `${SELECTED_ITEM} === datum.${idKey}`, value: 1 }, { value: 0 }],
			},
		},
	};
};
// the convertion here does not match to real math
// however its the orientations that work for venn-helper
export const degreesToRadians = new Map<VennDegreeOptions, number>([
	['0deg', Math.PI / 2],
	['90deg', 0],
	['180deg', -Math.PI / 2],
	['270deg', -Math.PI],
]);

const getInterserctionMarkOpacity = (options: VennSpecOptions) => {
	const rules = [DEFAULT_OPACITY_RULE];
	const { idKey, name: markName } = options;

	if (isInteractive(options)) {
		addIntersectionHighlightRules(rules, options);
	}

	if (hasPopover(options)) {
		[
			{
				test: `!isValid(${SELECTED_GROUP}) && ${SELECTED_ITEM} && ${SELECTED_ITEM} !== datum.${idKey}`,
				value: 1 / HIGHLIGHT_CONTRAST_RATIO,
			},
			{
				test: `isValid(${SELECTED_ITEM}) && indexof(datum.${idKey}, ${SELECTED_ITEM}) !== -1`,
				...DEFAULT_OPACITY_RULE,
			},
			{
				test: `isValid(${SELECTED_GROUP}) && ${SELECTED_GROUP} === datum.${markName}_selectedGroupId`,
				value: 1,
			},
			{
				test: `isValid(${SELECTED_GROUP}) && ${SELECTED_GROUP} !== datum.${markName}_selectedGroupId`,
				value: 1 / HIGHLIGHT_CONTRAST_RATIO,
			},
			...rules,
		];
	}

	return rules;
};

const addIntersectionHighlightRules = (rules: ({ test?: string } & NumericValueRef)[], options: VennSpecOptions) => {
	const { idKey } = options;
	rules.unshift(
		{
			test: `isValid(${SELECTED_ITEM}) && indexof(datum.${idKey}, ${SELECTED_ITEM}) === -1`,
			value: 1 / HIGHLIGHT_CONTRAST_RATIO,
		},
		{
			test: `isArray(highlightedItem) && length(highlightedItem) > 0 && indexof(highlightedItem, datum.${idKey}) === -1`,
			value: 1 / HIGHLIGHT_CONTRAST_RATIO,
		},
		{
			test: `!isArray(highlightedItem) && isValid(highlightedItem) && indexof(datum.${idKey}, highlightedItem) === -1`,
			value: 1 / HIGHLIGHT_CONTRAST_RATIO,
		},
		{
			test: `isValid(highlightedSeries) && indexof(datum.${idKey}, highlightedSeries) === -1`,
			value: 1 / HIGHLIGHT_CONTRAST_RATIO,
		}
	);
};
