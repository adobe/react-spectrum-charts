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
	DEFAULT_COLOR,
	DEFAULT_CONTINUOUS_DIMENSION,
	DEFAULT_METRIC,
	HIGHLIGHT_CONTRAST_RATIO,
	TABLE,
} from '@constants';
import { getBorderStrokeEncodings, getCursor, getInteractive, getTooltip } from '@specBuilder/marks/markUtils';
import {
	getControlledHoverSignal,
	getGenericSignal,
	getSeriesHoveredSignal,
	hasSignalByName,
} from '@specBuilder/signal/signalSpecBuilder';
import { spectrumColors } from '@themes';
import { getDefaultMarkName, sanitizeMarkChildren, toCamelCase } from '@utils';
import produce from 'immer';
import { AreaProps, AreaSpecProps, MarkChildElement, ScaleType } from 'types';
import { Data, Mark, NumericValueRef, ProductionRule, Scale, Signal, Spec } from 'vega';

import { addTimeTransform, getTransformSort, isValuesData } from '../data/dataUtils';
import { addContinuousDimensionScale, addFieldToFacetScaleDomain, addMetricScale } from '../scale/scaleSpecBuilder';

export const addArea = produce<Spec, [AreaProps]>(
	(
		spec,
		{
			name = getDefaultMarkName(spec, 'area'),
			color = DEFAULT_COLOR,
			dimension = DEFAULT_CONTINUOUS_DIMENSION,
			metric = DEFAULT_METRIC,
			scaleType = 'time',
			opacity = 0.8,
			metricStart,
			metricEnd,
			...props
		}
	) => {
		const children: MarkChildElement[] = sanitizeMarkChildren(props.children);
		// put props back together now that all defaults are set
		const areaProps: AreaSpecProps = {
			name: toCamelCase(name),
			color,
			dimension,
			metric,
			scaleType,
			opacity,
			metricStart,
			metricEnd,
			...props,
			children,
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

export const addData = produce<Data[], [AreaSpecProps]>(
	(data, { name, dimension, scaleType, color, metric, metricEnd, metricStart, order, children }) => {
		const tableData = data.find((d) => d.name === TABLE);
		if (isValuesData(tableData)) {
			if (scaleType === 'time') {
				tableData.transform = addTimeTransform(tableData.transform ?? [], dimension);
			}
			// if metricEnd and metricStart don't exist, then we are using metric so we will support stacked
			if (!metricEnd || !metricStart) {
				tableData.transform?.push({
					type: 'stack',
					groupby: [dimension],
					field: metric,
					sort: getTransformSort(order),
					as: [`${metric}0`, `${metric}1`],
				});
			}
		} else {
			console.error('Something went wrong, the table data was not found');
		}
		if (children.length) {
			const selectSignal = `${name}SelectedId`;
			const hoverSignal = `${name}ControlledHoveredId`;
			data.push({
				name: `${name}HighlightedDataPoint`,
				source: TABLE,
				transform: [
					{
						type: 'filter',
						expr: `${selectSignal} && ${selectSignal} === datum.prismMarkId || !${selectSignal} && ${hoverSignal} && ${hoverSignal} === datum.prismMarkId`,
					},
				],
			});
			if (children.some((child) => child.type === ChartPopover)) {
				const selectSeriesSignal = `${name}SelectedSeries`;
				data.push({
					name: `${name}SelectedDataSeries`,
					source: TABLE,
					transform: [
						{
							type: 'filter',
							expr: `${selectSeriesSignal} && ${selectSeriesSignal} === datum.${color}`,
						},
					],
				});
			}
		}
	}
);

export const addSignals = produce<Signal[], [AreaSpecProps]>((signals, { children, name, color }) => {
	if (!children.length) return;
	if (!hasSignalByName(signals, `${name}ControlledHoveredId`)) {
		signals.push(getControlledHoverSignal(name));
	}
	if (!hasSignalByName(signals, `${name}HoveredSeries`)) {
		signals.push(getSeriesHoveredSignal(name, color));
	}
	if (!hasSignalByName(signals, `${name}SelectedId`)) {
		signals.push(getGenericSignal(`${name}SelectedId`));
	}
	if (!hasSignalByName(signals, `${name}SelectedSeries`)) {
		signals.push(getGenericSignal(`${name}SelectedSeries`));
	}
});

export const setScales = produce<Scale[], [AreaSpecProps]>(
	(scales, { metric, metricEnd, metricStart, dimension, color, scaleType, padding }) => {
		// add dimension scale
		addContinuousDimensionScale(scales, { scaleType, dimension, padding });
		// add color to the color domain
		addFieldToFacetScaleDomain(scales, 'color', color);
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
	const { name, color, metric, dimension, scaleType, opacity, children } = props;
	let { metricStart, metricEnd } = props;
	let isStacked = false;
	if (!metricEnd || !metricStart) {
		isStacked = true;
		metricStart = `${metric}0`;
		metricEnd = `${metric}1`;
	}
	marks.push(
		{
			name: `${name}Group`,
			type: 'group',
			from: {
				facet: {
					name: `${name}Facet`,
					data: TABLE,
					groupby: color,
				},
			},
			marks: [
				{
					name,
					type: 'area',
					from: { data: `${name}Facet` },
					interactive: getInteractive(children),
					encode: {
						enter: {
							y: { scale: 'yLinear', field: metricStart },
							y2: { scale: 'yLinear', field: metricEnd },
							fill: { scale: 'color', field: color },
							tooltip: getTooltip(children),
							...getBorderStrokeEncodings(isStacked, true),
						},
						update: {
							// this has to be in update because when you resize the window that doesn't rebuild the spec
							// but it may change the x position if it causes the chart to resize
							x: getX(scaleType, dimension),
							cursor: getCursor(children),
							fillOpacity: getFillOpacity(name, color, opacity, children),
						},
					},
				},
				...getAnchorPointMark(props),
			],
		},
		...getSelectedAreaMarks({ children, name, scaleType, color, dimension, metricEnd, metricStart }),
		...getHoverMarks(props)
	);
	return marks;
});

const getX = (scaleType: ScaleType, dimension: string): ProductionRule<NumericValueRef> => {
	if (scaleType === 'time') {
		return { scale: 'xTime', field: 'datetime0' };
	} else if (scaleType === 'linear') {
		return { scale: 'xLinear', field: dimension };
	}
	return { scale: 'xPoint', field: dimension };
};

function getFillOpacity(
	name: string,
	color: string,
	opacity: number,
	children: MarkChildElement[]
): ProductionRule<NumericValueRef> | undefined {
	// no children means no interactive elements
	if (!children.length) {
		return [{ value: opacity }];
	}
	// if an area is hovered or selected, all other areas should have half opacity
	const hoverSignal = `${name}HoveredSeries`;
	if (children.some((child) => child.type === ChartPopover)) {
		const selectSignal = `${name}SelectedSeries`;
		return [
			{
				test: `!${selectSignal} && ${hoverSignal} && ${hoverSignal} !== datum.${color}`,
				value: opacity / HIGHLIGHT_CONTRAST_RATIO,
			},
			{
				test: `${selectSignal} && ${selectSignal} !== datum.${color}`,
				value: opacity / HIGHLIGHT_CONTRAST_RATIO,
			},
			{ test: `${selectSignal} && ${selectSignal} === datum.${color}`, value: opacity },
			{ value: opacity },
		];
	}
	return [
		{ test: `${hoverSignal} && ${hoverSignal} !== datum.${color}`, value: opacity / HIGHLIGHT_CONTRAST_RATIO },
		{ value: opacity },
	];
}

/**
 * returns a transparent point that gets used by the popover to anchor to
 */
const getAnchorPointMark = ({ children, name, dimension, metric, scaleType }: AreaSpecProps): Mark[] => {
	if (!children.length) return [];
	return [
		{
			name: `${name}AnchorPoint`,
			type: 'symbol',
			from: { data: `${name}HighlightedDataPoint` },
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
const getHoverMarks = ({ children, name, dimension, metric, color, scaleType }: AreaSpecProps): Mark[] => {
	if (!children.length) return [];
	return [
		{
			name: `${name}Rule`,
			type: 'rule',
			from: { data: `${name}HighlightedDataPoint` },
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
		},
		{
			name: `${name}Point`,
			type: 'symbol',
			from: { data: `${name}HighlightedDataPoint` },
			interactive: false,
			encode: {
				enter: {
					y: { scale: 'yLinear', field: `${metric}1` },
					stroke: { scale: 'color', field: color },
					fill: { signal: 'backgroundColor' },
				},
				update: {
					x: getX(scaleType, dimension),
				},
			},
		},
	];
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
			name: `${name}SelectBorder`,
			type: 'area',
			from: { data: `${name}SelectedDataSeries` },
			interactive: false,
			encode: {
				enter: {
					y: { scale: 'yLinear', field: metricStart },
					y2: { scale: 'yLinear', field: metricEnd },
					// need to fill this so the white border doesn't slightly bleed around the blue select border
					fill: { scale: 'color', field: color },
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
