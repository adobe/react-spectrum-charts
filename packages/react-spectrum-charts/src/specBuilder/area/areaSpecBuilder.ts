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
import { produce } from 'immer';
import { Data, Mark, Scale, Signal, SourceData, Spec } from 'vega';

import {
	BACKGROUND_COLOR,
	COLOR_SCALE,
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_METRIC,
	DEFAULT_TIME_DIMENSION,
	FILTERED_TABLE,
	HIGHLIGHTED_ITEM,
	SELECTED_ITEM,
	SELECTED_SERIES,
} from '../../constants';
import { spectrumColors } from '../../themes';
import { toCamelCase } from '../../utils';
import {
	addTooltipData,
	addTooltipSignals,
	isHighlightedByDimension,
	isHighlightedByGroup,
} from '../chartTooltip/chartTooltipUtils';
import { addTimeTransform, getFilteredTableData, getTableData, getTransformSort } from '../data/dataUtils';
import { hasPopover, hasTooltip, isInteractive } from '../marks/markUtils';
import { addContinuousDimensionScale, addFieldToFacetScaleDomain, addMetricScale } from '../scale/scaleSpecBuilder';
import {
	addHighlightedSeriesSignalEvents,
	getControlledHoveredGroupSignal,
	getControlledHoveredIdSignal,
} from '../signal/signalSpecBuilder';
import { AreaOptions, AreaSpecOptions, ChartPopoverOptions, ColorScheme, HighlightedItem, ScaleType } from '../types';
import { getAreaMark, getX } from './areaUtils';

export const addArea = produce<
	Spec,
	[AreaOptions & { colorScheme?: ColorScheme; highlightedItem?: HighlightedItem; index?: number; idKey: string }]
>(
	(
		spec,
		{
			chartPopovers = [],
			chartTooltips = [],
			color = DEFAULT_COLOR,
			colorScheme = DEFAULT_COLOR_SCHEME,
			dimension = DEFAULT_TIME_DIMENSION,
			index = 0,
			metric = DEFAULT_METRIC,
			metricStart,
			metricEnd,
			name,
			opacity = 0.8,
			scaleType = 'time',
			...options
		}
	) => {
		// put options back together now that all defaults are set
		const areaOptions: AreaSpecOptions = {
			chartPopovers,
			chartTooltips,
			color,
			colorScheme,
			dimension,
			index,
			metric,
			name: toCamelCase(name || `area${index}`),
			scaleType,
			opacity,
			metricStart,
			metricEnd,
			...options,
		};

		// if either start or end is defined but not both, error to the console and default back to metric
		if ((metricStart || metricEnd) && !(metricStart && metricEnd)) {
			console.error(
				`${metricEnd ? 'metricEnd' : 'metricStart'} is defined but ${
					metricEnd ? 'metricStart' : 'metricEnd'
				} is not. Both must be defined in order to use the "start and end" method. Defaulting back to 'metric = ${metric}'`
			);
			areaOptions.metricEnd = undefined;
			areaOptions.metricStart = undefined;
		}

		spec.data = addData(spec.data ?? [], areaOptions);
		spec.signals = addSignals(spec.signals ?? [], areaOptions);
		spec.scales = setScales(spec.scales ?? [], areaOptions);
		spec.marks = addAreaMarks(spec.marks ?? [], areaOptions);

		return spec;
	}
);

export const addData = produce<Data[], [AreaSpecOptions]>((data, areaOptions) => {
	const { color, dimension, highlightedItem, metric, metricEnd, metricStart, name, order, scaleType } = areaOptions;
	if (scaleType === 'time') {
		const tableData = getTableData(data);
		tableData.transform = addTimeTransform(tableData.transform ?? [], dimension);
	}

	if (!metricEnd || !metricStart) {
		const filteredTableData = getFilteredTableData(data);
		// if metricEnd and metricStart don't exist, then we are using metric so we will support stacked
		filteredTableData.transform = [
			...(filteredTableData.transform ?? []),
			{
				type: 'stack',
				groupby: [dimension],
				field: metric,
				sort: getTransformSort(order),
				as: [`${metric}0`, `${metric}1`],
			},
		];
	}

	if (isInteractive(areaOptions) || highlightedItem !== undefined) {
		const areaHasPopover = hasPopover(areaOptions);
		const areaHasTooltip = hasTooltip(areaOptions);
		data.push(
			getAreaHighlightedData(
				name,
				areaOptions.idKey,
				areaHasTooltip,
				areaHasPopover,
				isHighlightedByGroup(areaOptions)
			)
		);
		if (areaHasPopover) {
			data.push({
				name: `${name}_selectedDataSeries`,
				source: FILTERED_TABLE,
				transform: [
					{
						type: 'filter',
						expr: `isValid(${SELECTED_SERIES}) && ${SELECTED_SERIES} === datum.${color}`,
					},
				],
			});
		}
	}
	addTooltipData(data, areaOptions, false);
});

export const getAreaHighlightedData = (
	name: string,
	idKey: string,
	hasTooltip: boolean,
	hasPopover: boolean,
	hasGroupId: boolean
): SourceData => {
	let expr = '';
	if (hasGroupId) {
		expr += `${name}_controlledHoveredGroup === datum.${name}_highlightGroupId`;
	} else {
		expr += `isArray(${HIGHLIGHTED_ITEM}) && indexof(${HIGHLIGHTED_ITEM}, datum.${idKey}) > -1  || ${HIGHLIGHTED_ITEM} === datum.${idKey}`;
		if (hasTooltip) {
			expr = `${name}_controlledHoveredId === datum.${idKey} || ${expr}`;
		}
	}
	if (hasPopover) {
		expr = `isValid(${SELECTED_ITEM}) && ${SELECTED_ITEM} === datum.${idKey} || !isValid(${SELECTED_ITEM}) && ${expr}`;
	}
	return {
		name: `${name}_highlightedData`,
		source: FILTERED_TABLE,
		transform: [
			{
				type: 'filter',
				expr,
			},
		],
	};
};

export const addSignals = produce<Signal[], [AreaSpecOptions]>((signals, areaOptions) => {
	const { chartTooltips, name } = areaOptions;
	if (!isInteractive(areaOptions)) return;
	addHighlightedSeriesSignalEvents(signals, name, 1, chartTooltips[0]?.excludeDataKeys);
	if (areaOptions.highlightedItem) {
		addHighlightedItemEvents(signals, name);
	}
	if (!isHighlightedByGroup(areaOptions)) {
		signals.push(getControlledHoveredIdSignal(name));
	} else {
		signals.push(getControlledHoveredGroupSignal(name));
	}
	addTooltipSignals(signals, areaOptions);
});

/**
 * Adds an on event that clears the controlled highlighted item signal value when the user mouses over the area.
 * @param signals
 * @param areaName
 */
export const addHighlightedItemEvents = (signals: Signal[], areaName: string) => {
	const highlightedItemSignal = signals.find((signal) => signal.name === HIGHLIGHTED_ITEM);
	if (highlightedItemSignal) {
		if (highlightedItemSignal.on === undefined) {
			highlightedItemSignal.on = [];
		}
		// as soon as the user mouses over the area, we want to null out the highlighted item
		highlightedItemSignal.on.push(...[{ events: `@${areaName}:mouseover`, update: 'null' }]);
	}
};

export const setScales = produce<Scale[], [AreaSpecOptions]>(
	(scales, { metric, metricEnd, metricStart, dimension, color, scaleType, padding }) => {
		// add dimension scale
		addContinuousDimensionScale(scales, { scaleType, dimension, padding });
		// add color to the color domain
		addFieldToFacetScaleDomain(scales, COLOR_SCALE, color);
		// find the linear scale and add our field to it
		if (!metricEnd || !metricStart) {
			metricStart = `${metric}0`;
			metricEnd = `${metric}1`;
		}
		addMetricScale(scales, [metricStart, metricEnd]);
		return scales;
	}
);

export const addAreaMarks = produce<Mark[], [AreaSpecOptions]>((marks, areaOptions) => {
	const {
		chartPopovers,
		chartTooltips,
		color,
		colorScheme,
		dimension,
		highlightedItem,
		metric,
		name,
		opacity,
		scaleType,
	} = areaOptions;
	let { metricStart, metricEnd } = areaOptions;
	let isStacked = false;
	if (!metricEnd || !metricStart) {
		isStacked = true;
		metricStart = `${metric}0`;
		metricEnd = `${metric}1`;
	}
	marks.push(
		{
			name: `${name}_group`,
			type: 'group',
			from: {
				facet: {
					name: `${name}_facet`,
					data: FILTERED_TABLE,
					groupby: color,
				},
			},
			marks: [
				getAreaMark({
					chartPopovers,
					chartTooltips,
					color,
					colorScheme,
					dimension,
					isHighlightedByGroup: isHighlightedByGroup(areaOptions),
					isStacked,
					highlightedItem,
					metricStart,
					metricEnd,
					name,
					opacity,
					scaleType,
				}),
				...getAnchorPointMark(areaOptions),
			],
		},
		...getSelectedAreaMarks({ chartPopovers, name, scaleType, color, dimension, metricEnd, metricStart }),
		...getHoverMarks(areaOptions)
	);
	return marks;
});

/**
 * returns a transparent point that gets used by the popover to anchor to
 */
const getAnchorPointMark = (areaOptions: AreaSpecOptions): Mark[] => {
	const { name, dimension, metric, scaleType } = areaOptions;
	if (!isInteractive(areaOptions)) return [];
	return [
		{
			name: `${name}_anchorPoint`,
			type: 'symbol',
			from: { data: `${name}_highlightedData` },
			interactive: false,
			encode: {
				enter: {
					y: { scale: 'yLinear', field: `${metric}1` },
					stroke: { value: 'transparent' },
					fill: { value: 'transparent' },
				},
				update: {
					x: getX(scaleType, dimension),
				},
			},
		},
	];
};

/**
 * returns a circle symbol and a rule on the hovered/selected point
 */
const getHoverMarks = (areaOptions: AreaSpecOptions): Mark[] => {
	const { name, dimension, highlightedItem, metric, scaleType, color } = areaOptions;
	if (!isInteractive(areaOptions) && highlightedItem === undefined) return [];
	const highlightMarks: Mark[] = [
		{
			name: `${name}_point`,
			type: 'symbol',
			from: { data: `${name}_highlightedData` },
			interactive: false,
			encode: {
				enter: {
					y: { scale: 'yLinear', field: `${metric}1` },
					stroke: { scale: COLOR_SCALE, field: color },
					fill: { signal: BACKGROUND_COLOR },
				},
				update: {
					x: getX(scaleType, dimension),
				},
			},
		},
	];
	if (isHighlightedByDimension(areaOptions) || highlightedItem) {
		highlightMarks.unshift({
			name: `${name}_rule`,
			type: 'rule',
			from: { data: `${name}_highlightedData` },
			interactive: false,
			encode: {
				enter: {
					y: { value: 0 },
					y2: { signal: 'height' },
					strokeWidth: { value: 1 },
				},
				update: {
					x: getX(scaleType, dimension),
				},
			},
		});
	}
	return highlightMarks;
};

/**
 * returns an area mark for the blue border around the selected area.
 */
const getSelectedAreaMarks = ({
	chartPopovers,
	name,
	scaleType,
	color,
	dimension,
	metricEnd,
	metricStart,
}: {
	chartPopovers: ChartPopoverOptions[];
	name: string;
	scaleType: ScaleType;
	color: string;
	dimension: string;
	metricEnd: string;
	metricStart: string;
}): Mark[] => {
	if (!chartPopovers.length) return [];
	return [
		{
			name: `${name}_selectBorder`,
			type: 'area',
			from: { data: `${name}_selectedDataSeries` },
			interactive: false,
			encode: {
				enter: {
					y: { scale: 'yLinear', field: metricStart },
					y2: { scale: 'yLinear', field: metricEnd },
					// need to fill this so the white border doesn't slightly bleed around the blue select border
					fill: { scale: COLOR_SCALE, field: color },
					stroke: { value: spectrumColors.light['static-blue'] },
					strokeWidth: { value: 2 },
					strokeJoin: { value: 'round' },
				},
				update: {
					// this has to be in update because when you resize the window that doesn't rebuild the spec
					// but it may change the x position if it causes the chart to resize
					x: getX(scaleType, dimension),
				},
			},
		},
	];
};
