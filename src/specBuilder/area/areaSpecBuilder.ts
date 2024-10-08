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
import { ChartPopover } from '@components/ChartPopover';
import {
	BACKGROUND_COLOR,
	COLOR_SCALE,
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_METRIC,
	DEFAULT_TIME_DIMENSION,
	FILTERED_TABLE,
	MARK_ID,
	SELECTED_ITEM,
	SELECTED_SERIES,
} from '@constants';
import {
	addTooltipData,
	addTooltipSignals,
	isHighlightedByDimension,
	isHighlightedByGroup,
} from '@specBuilder/chartTooltip/chartTooltipUtils';
import { getTooltipProps, hasPopover } from '@specBuilder/marks/markUtils';
import {
	addHighlightedSeriesSignalEvents,
	getControlledHoveredGroupSignal,
	getControlledHoveredIdSignal,
} from '@specBuilder/signal/signalSpecBuilder';
import { spectrumColors } from '@themes';
import { sanitizeMarkChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { Data, Mark, Scale, Signal, SourceData, Spec } from 'vega';

import { AreaProps, AreaSpecProps, ColorScheme, MarkChildElement, ScaleType } from '../../types';
import { addTimeTransform, getFilteredTableData, getTableData, getTransformSort } from '../data/dataUtils';
import { addContinuousDimensionScale, addFieldToFacetScaleDomain, addMetricScale } from '../scale/scaleSpecBuilder';
import { getAreaMark, getX } from './areaUtils';

export const addArea = produce<Spec, [AreaProps & { colorScheme?: ColorScheme; index?: number }]>(
	(
		spec,
		{
			children,
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
			...props
		}
	) => {
		// put props back together now that all defaults are set
		const areaProps: AreaSpecProps = {
			children: sanitizeMarkChildren(children),
			color,
			colorScheme,
			dimension,
			index,
			markType: 'area',
			metric,
			name: toCamelCase(name || `area${index}`),
			scaleType,
			opacity,
			metricStart,
			metricEnd,
			...props,
		};

		// if either start or end is defined but not both, error to the console and default back to metric
		if ((metricStart || metricEnd) && !(metricStart && metricEnd)) {
			console.error(
				`${metricEnd ? 'metricEnd' : 'metricStart'} is defined but ${
					metricEnd ? 'metricStart' : 'metricEnd'
				} is not. Both must be defined in order to use the "start and end" method. Defaulting back to 'metric = ${metric}'`
			);
			areaProps.metricEnd = undefined;
			areaProps.metricStart = undefined;
		}

		spec.data = addData(spec.data ?? [], areaProps);
		spec.signals = addSignals(spec.signals ?? [], areaProps);
		spec.scales = setScales(spec.scales ?? [], areaProps);
		spec.marks = addAreaMarks(spec.marks ?? [], areaProps);

		return spec;
	}
);

export const addData = produce<Data[], [AreaSpecProps]>((data, props) => {
	const { children, color, dimension, metric, metricEnd, metricStart, name, order, scaleType } = props;
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

	if (children.length) {
		const areaHasPopover = hasPopover(children);
		data.push(getAreaHighlightedData(name, areaHasPopover, isHighlightedByGroup(props)));
		if (areaHasPopover) {
			data.push({
				name: `${name}_selectedDataSeries`,
				source: FILTERED_TABLE,
				transform: [
					{
						type: 'filter',
						expr: `${SELECTED_SERIES} && ${SELECTED_SERIES} === datum.${color}`,
					},
				],
			});
		}
	}
	addTooltipData(data, props, false);
});

export const getAreaHighlightedData = (name: string, hasPopover: boolean, hasGroupId: boolean): SourceData => {
	const highlightedExpr = hasGroupId
		? `${name}_controlledHoveredGroup === datum.${name}_highlightGroupId`
		: `${name}_controlledHoveredId === datum.${MARK_ID}`;
	const expr = hasPopover
		? `${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${MARK_ID} || !${SELECTED_ITEM} && ${highlightedExpr}`
		: highlightedExpr;
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

export const addSignals = produce<Signal[], [AreaSpecProps]>((signals, props) => {
	const { children, name } = props;
	if (!children.length) return;
	addHighlightedSeriesSignalEvents(signals, name, 1, getTooltipProps(children)?.excludeDataKeys);
	if (!isHighlightedByGroup(props)) {
		signals.push(getControlledHoveredIdSignal(name));
	} else {
		signals.push(getControlledHoveredGroupSignal(name));
	}
	addTooltipSignals(signals, props);
});

export const setScales = produce<Scale[], [AreaSpecProps]>(
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

export const addAreaMarks = produce<Mark[], [AreaSpecProps]>((marks, props) => {
	const { name, color, colorScheme, metric, dimension, scaleType, opacity, children } = props;
	let { metricStart, metricEnd } = props;
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
					color,
					colorScheme,
					children,
					dimension,
					isHighlightedByGroup: isHighlightedByGroup(props),
					isStacked,
					metricStart,
					metricEnd,
					name,
					opacity,
					scaleType,
				}),
				...getAnchorPointMark(props),
			],
		},
		...getSelectedAreaMarks({ children, name, scaleType, color, dimension, metricEnd, metricStart }),
		...getHoverMarks(props)
	);
	return marks;
});

/**
 * returns a transparent point that gets used by the popover to anchor to
 */
const getAnchorPointMark = ({ children, name, dimension, metric, scaleType }: AreaSpecProps): Mark[] => {
	if (!children.length) return [];
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
const getHoverMarks = (props: AreaSpecProps): Mark[] => {
	const { children, name, dimension, metric, scaleType, color } = props;
	if (!children.length) return [];
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
	if (isHighlightedByDimension(props)) {
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
	children,
	name,
	scaleType,
	color,
	dimension,
	metricEnd,
	metricStart,
}: {
	children: MarkChildElement[];
	name: string;
	scaleType: ScaleType;
	color: string;
	dimension: string;
	metricEnd: string;
	metricStart: string;
}): Mark[] => {
	if (!children.some((child) => child.type === ChartPopover)) return [];
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
