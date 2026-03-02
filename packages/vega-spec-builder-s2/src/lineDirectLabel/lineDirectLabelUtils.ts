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
import { Data, Mark, TextMark, Transforms } from 'vega';

import { FILTERED_TABLE, SERIES_ID } from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { getLineOpacity } from '../line/lineMarkUtils';
import { getColorProductionRule } from '../marks/markUtils';
import { getScaleName } from '../scale/scaleSpecBuilder';
import { getDimensionField, getFacetsFromOptions } from '../specUtils';
import { LineDirectLabelOptions, LineDirectLabelSpecOptions, LineSpecOptions, LabelValue } from '../types';

/**
 * Derived dataset: one row per series at the last (max-dimension) data point.
 */
export const getLineDirectLabelData = (
	lineName: string,
	labelOptions: LineDirectLabelSpecOptions,
	lineOptions: LineSpecOptions
): Data => {
	const { color, dimension, excludeSeries, metric, position, scaleType, value } = labelOptions;
	const dimField = getDimensionField(dimension, scaleType);
	const isStart = position === 'start';

	const { facets } = getFacetsFromOptions({
		color: lineOptions.color,
		lineType: lineOptions.lineType,
		opacity: lineOptions.opacity,
	});
	const colorField = typeof color === 'string' ? color : undefined;

	const formatSpec = labelOptions.format || '';
	const valueExpr = getLabelValueExpr(value, metric, colorField, formatSpec);

	const usesMin = isStart || value === 'first';
	const transforms: Transforms[] = [
		...(value === 'average'
			? [
					{
						type: 'joinaggregate' as const,
						groupby: facets,
						fields: [metric],
						ops: ['mean' as const],
						as: ['directLabel_avg'],
					},
				]
			: []),
		{
			type: 'joinaggregate' as const,
			groupby: facets,
			fields: [dimField],
			ops: [usesMin ? ('min' as const) : ('max' as const)],
			as: ['_extremeDim'],
		},
		{ type: 'filter' as const, expr: `datum["${dimField}"] === datum._extremeDim` },
		{ type: 'formula' as const, as: 'directLabel_text', expr: valueExpr },
		...(excludeSeries.length
			? [
					{
						type: 'filter' as const,
						expr: `indexof(${JSON.stringify(excludeSeries)}, datum.${SERIES_ID}) === -1`,
					},
				]
			: []),
		{
			type: 'joinaggregate' as const,
			fields: [metric],
			ops: ['count' as const],
			as: ['_seriesCount'],
		},
		{
			type: 'window' as const,
			sort: { field: [metric], order: ['descending' as const] },
			ops: ['rank' as const],
			as: ['_metricRank'],
		},
	];

	return {
		name: `${lineName}DirectLabel${labelOptions.index}_data`,
		source: FILTERED_TABLE,
		transform: transforms,
	};
};

const DEFAULT_NUMBER_FORMAT = ',.2~f';

function getLabelValueExpr(value: LabelValue, metric: string, colorField?: string, formatSpec?: string): string {
	const resolvedFormat = formatSpec || DEFAULT_NUMBER_FORMAT;
	const fmt = `"${resolvedFormat.replaceAll('"', String.raw`\"`)}"`;
	switch (value) {
		case 'last':
		case 'first':
			return `format(datum["${metric}"], ${fmt})`;
		case 'average':
			return `format(datum.directLabel_avg, ${fmt})`;
		case 'series':
			return colorField ? `datum["${colorField}"]` : "''";
	}
}

/**
 * Text marks: background stroke halo + foreground fill, placed at the end of each line series.
 */
export const getLineDirectLabelMarks = (
	lineName: string,
	labelOptions: LineDirectLabelSpecOptions,
	lineOptions: LineSpecOptions,
	backgroundColor: string | undefined,
	colorScheme: 'light' | 'dark'
): Mark[] => {
	const resolvedBg = getS2ColorValue(
		backgroundColor === 'transparent' || !backgroundColor ? 'gray-50' : backgroundColor,
		colorScheme
	);
	const dataName = `${lineName}DirectLabel${labelOptions.index}_data`;
	const { prefix = '' } = labelOptions;
	const textPrefix = prefix ? `'${prefix.replaceAll("'", String.raw`\'`)} ' + ` : '';
	const textExpr = `${textPrefix}datum.directLabel_text`;

	const { dimension, metric, position, scaleType } = labelOptions;
	const isStart = position === 'start';
	const dimField = getDimensionField(dimension, scaleType);
	const xScaleName = getScaleName('x', scaleType);
	const yScaleName = lineOptions.metricAxis || 'yLinear';

	const opacityRules = getLineOpacity(lineOptions);

	const baseEnter = {
		text: { signal: textExpr },
		align: { value: isStart ? ('left' as const) : ('right' as const) },
		limit: {
			signal: isStart
				? `scale('${xScaleName}', datum["${dimField}"])`
				: `width - scale('${xScaleName}', datum["${dimField}"])`,
		},
		x: isStart ? ({ value: 0 } as const) : { signal: 'width' },
		y: {
			scale: yScaleName,
			field: metric,
			offset: { signal: 'datum._seriesCount === 2 && datum._metricRank === 2 ? 22 : -12' },
		},
	};

	const backgroundTextMark: TextMark = {
		name: `${lineName}DirectLabel${labelOptions.index}_bg`,
		type: 'text',
		from: { data: dataName },
		interactive: false,
		encode: {
			enter: {
				...baseEnter,
				stroke: { value: resolvedBg },
				strokeWidth: { value: 4 },
				fill: { value: 'transparent' },
			},
			update: { fontWeight: { value: 700 }, opacity: opacityRules },
		},
	};

	const mainTextMark: TextMark = {
		name: `${lineName}DirectLabel${labelOptions.index}`,
		type: 'text',
		from: { data: dataName },
		interactive: false,
		encode: {
			enter: {
				...baseEnter,
				fill: getColorProductionRule(labelOptions.color, labelOptions.colorScheme),
			},
			update: { fontWeight: { value: 700 }, opacity: opacityRules },
		},
	};

	return [backgroundTextMark, mainTextMark];
};

/**
 * Applies defaults to direct label options, inheriting context from the parent line.
 */
export const getLineDirectLabelSpecOptions = (
	labelOptions: LineDirectLabelOptions,
	index: number,
	lineOptions: LineSpecOptions
): LineDirectLabelSpecOptions => ({
	color: lineOptions.color,
	colorScheme: lineOptions.colorScheme,
	dimension: lineOptions.dimension,
	excludeSeries: labelOptions.excludeSeries ?? [],
	format: labelOptions.format ?? '',
	index,
	lineName: lineOptions.name,
	metric: lineOptions.metric,
	position: labelOptions.position ?? 'end',
	prefix: labelOptions.prefix ?? '',
	scaleType: lineOptions.scaleType,
	value: labelOptions.value ?? 'last',
});
