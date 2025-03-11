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
import { Axis, Data, Mark, ScaleType, Signal, SourceData, ValuesData } from 'vega';

import {
	ANNOTATION_RANGED_ICON_SVG,
	ANNOTATION_SINGLE_ICON_SVG,
	DEFAULT_AXIS_ANNOTATION_COLOR,
	DEFAULT_AXIS_ANNOTATION_OFFSET,
	FILTERED_TABLE,
} from '@spectrum-charts/constants';

import { getCursor } from '../marks/markUtils';
import { getColorValue } from '../specUtils';
import { AxisAnnotationOptions, AxisAnnotationSpecOptions, AxisSpecOptions, ColorScheme, Position } from '../types';

/**
 * Adds the required data for axis annotations.
 *
 * NOTE: this function should only be called from within a produce with data as the root state since it directly
 * mutates the data array
 * @param data
 * @param axisAnnotationOptions
 */
export const addAxisAnnotationData = (
	data: Data[],
	{ name, dataKey, color, colorScheme, options, format }: AxisAnnotationSpecOptions
) => {
	data.push(getAxisAnnotationDetailData(name, options, colorScheme));
	if (format === 'summary') {
		data.push(getAxisAnnotationSummaryData(name, dataKey, color, colorScheme));
	} else {
		data.push(getAxisAnnotationAggregateData(name, dataKey, color, colorScheme), getAxisAnnotationRangeData(name));
	}
};

const getAxisAnnotationDetailData = (name: string, options, colorScheme): ValuesData => {
	const newOptions = options.map((option) => ({ ...option, color: getColorValue(option.color, colorScheme) }));
	return { name: `${name}_details`, values: newOptions };
};

const getAxisAnnotationAggregateData = (name, dataKey, color, colorScheme): SourceData => {
	return {
		name: `${name}_aggregate`,
		source: FILTERED_TABLE,
		transform: [
			{ type: 'filter', expr: `datum.${dataKey}` },
			{
				type: 'flatten',
				fields: [dataKey],
				as: [`${name}_id`],
			},
			{
				type: 'aggregate',
				groupby: [`${name}_id`],
				fields: ['datetime', 'datetime'],
				ops: ['min', 'max'],
			},
			{
				type: 'formula',
				expr: 'datum.max_datetime - datum.min_datetime',
				as: 'width',
			},
			{
				type: 'formula',
				expr: 'datum.width / 2 + datum.min_datetime',
				as: 'center',
			},
			{
				type: 'aggregate',
				groupby: ['center'],
				fields: ['min_datetime', 'max_datetime', 'width', dataKey, dataKey],
				ops: ['min', 'max', 'max', 'count', 'values'],
				as: ['lower', 'upper', 'width', 'number', 'annotations'],
			},
			{
				type: 'formula',
				expr: `datum.annotations[0].${name}_id`,
				as: 'id',
			},
			{
				type: 'lookup',
				from: `${name}_details`,
				key: `id`,
				values: ['color'],
				fields: [`id`],
			},
			{
				type: 'formula',
				expr: `datum.number > 1 || datum.color == null ? '${getColorValue(color, colorScheme)}' : datum.color`,
				as: 'color',
			},
		],
	};
};

const getAxisAnnotationSummaryData = (name, dataKey, color, colorScheme): SourceData => {
	return {
		name: `${name}_summary`,
		source: FILTERED_TABLE,
		transform: [
			{ type: 'filter', expr: `datum.${dataKey}` },
			{
				type: 'flatten',
				fields: [dataKey],
				as: [`${name}_id`],
			},
			{
				type: 'aggregate',
				groupby: [`${name}_id`],
			},
			{
				type: 'aggregate',
				groupby: ['center'],
				fields: [dataKey, dataKey],
				ops: ['count', 'values'],
				as: ['number', 'annotations'],
			},
			{
				type: 'formula',
				expr: `datum.annotations[0].${name}_id`,
				as: 'id',
			},
			{
				type: 'lookup',
				from: `${name}_details`,
				key: `id`,
				values: ['color'],
				fields: [`id`],
			},
			{
				type: 'formula',
				expr: `datum.number > 1 || datum.color == null ? '${getColorValue(color, colorScheme)}' : datum.color`,
				as: 'color',
			},
		],
	};
};

const getAxisAnnotationRangeData = (name: string): SourceData => {
	return {
		name: `${name}_range`,
		source: `${name}_aggregate`,
		transform: [
			{
				type: 'filter',
				expr: `${name}_highlighted && datum.center == ${name}_highlighted.center && ${name}_highlighted.width > 0`,
			},
		],
	};
};

/**
 * Adds the required signals for axis annotations.
 *
 * NOTE: this function should only be called from within a produce with signals as the root state since it directly
 * mutates the signals array
 * @param signals
 * @param param1
 */
export const addAxisAnnotationSignals = (signals: Signal[], { name, format }: AxisAnnotationSpecOptions) => {
	if (format === 'span') {
		signals.push(
			getHighlightAxisAnnotationSignal(name),
			getClickAxisAnnotationSignal(name),
			getSelectAxisAnnotationSignal(name)
		);
	}
};

/**
 * Returns the highlighted axis annotation signal
 */
const getHighlightAxisAnnotationSignal = (name: string): Signal => {
	return {
		name: `${name}_highlighted`,
		value: null,
		on: [
			{ events: `@${name}_icon:mouseover`, update: `datum` },
			{ events: `@${name}_icon:mouseout`, update: `${name}_clicked` },
		],
	};
};

/**
 * Returns the selected axis annotation signal
 */
const getClickAxisAnnotationSignal = (name: string): Signal => {
	return {
		name: `${name}_clicked`,
		value: {},
		on: [
			{
				events: {
					markname: `${name}_icon`,
					type: 'mousedown',
					between: [{ type: 'mousedown' }, { type: 'mouseup' }],
				},
				update: 'datum',
			},
			{ events: 'window:mouseup', update: '{}' },
		],
	};
};

/**
 * Returns the selected axis annotation static signal
 */
const getSelectAxisAnnotationSignal = (name: string): Signal => {
	return {
		name: `${name}_selected`,
		update: `${name}_clicked.center`,
	};
};

/**
 * Adds the required marks for axis annotations.
 *
 * NOTE: this function should only be called from within a produce with marks as the root state since it directly
 * mutates the marks array
 * @param marks
 * @param param1
 */
export const addAxisAnnotationMarks = (
	marks: Mark[],
	axisAnnotationOptions: AxisAnnotationSpecOptions,
	scaleName: string
) => {
	const { format } = axisAnnotationOptions;
	if (format === 'summary') {
		marks.push(getAxisAnnotationSummaryMarks(axisAnnotationOptions));
	} else {
		marks.push(getAxisAnnotationSpanMarks(axisAnnotationOptions, scaleName));
	}
};

/**
 * NOTE: this function should only be called from within a produce with marks as the root state since it directly
 * mutates the marks array
 * @param marks
 * @param param1
 */
export const getAxisAnnotationSummaryMarks = ({ chartPopovers, name, offset }: AxisAnnotationSpecOptions): Mark => {
	return {
		name: `${name}_group`,
		type: 'group',
		from: {
			data: `${name}_summary`,
		},
		marks: [
			{
				name: `${name}_icon`,
				type: 'path',
				from: {
					data: `${name}_summary`,
				},
				zindex: 2,
				encode: {
					enter: {
						// adding a 2px transparent border increases the area of the icon so it's easier to hover
						stroke: { value: 'transparent' },
						strokeWidth: { value: 2 },
						cursor: getCursor(chartPopovers),
					},
					update: {
						path: {
							signal: `'${ANNOTATION_SINGLE_ICON_SVG}'`,
						},
						fill: {
							field: 'color',
						},
						xc: {
							signal: `width - 12`,
						},
						yc: {
							signal: `height + ${offset}`,
						},
					},
				},
			},
		],
	};
};

/**
 * Adds the required marks for axis annotations that support time series axis.
 * @param marks
 * @param param1
 */
export const getAxisAnnotationSpanMarks = (
	{ chartPopovers, name, offset }: AxisAnnotationSpecOptions,
	scaleName: string
): Mark => {
	return {
		name: `${name}_group`,
		type: 'group',
		marks: [
			{
				name: `${name}_range`,
				type: 'group',
				marks: [
					{
						type: 'rect',
						from: {
							data: `${name}_range`,
						},
						encode: {
							update: {
								x: {
									scale: scaleName,
									field: 'lower',
									band: 0.5,
								},
								y: { signal: `height + ${offset}` },
								width: { value: 2 },
								height: { value: -4 },
								fill: { field: 'color' },
								fillOpacity: {
									signal: `${name}_selected ? 1.0 : 0.2`,
								},
							},
						},
					},
					{
						type: 'rect',
						from: {
							data: `${name}_range`,
						},
						encode: {
							update: {
								x: {
									scale: scaleName,
									field: 'lower',
									band: 0.5,
								},
								y: { signal: `height + ${offset}` },
								x2: {
									scale: scaleName,
									field: 'upper',
									band: 0.5,
								},
								height: { value: 2 },
								fill: { field: 'color' },
								fillOpacity: {
									signal: `${name}_selected ? 1.0 : 0.2`,
								},
							},
						},
					},
					{
						type: 'rect',
						from: {
							data: `${name}_range`,
						},
						encode: {
							update: {
								x: {
									scale: scaleName,
									field: 'upper',
									band: 0.5,
								},
								y: { signal: `height + ${offset} + 2` },
								width: { value: 2 },
								height: { value: -6 },
								fill: { field: 'color' },
								fillOpacity: {
									signal: `${name}_selected ? 1.0 : 0.2`,
								},
							},
						},
					},
				],
			},
			{
				name: `${name}_icon`,
				type: 'path',
				from: {
					data: `${name}_aggregate`,
				},
				encode: {
					enter: {
						// adding a 2px transparent border increases the area of the icon so it's easier to hover
						stroke: { value: 'transparent' },
						strokeWidth: { value: 2 },
						cursor: getCursor(chartPopovers),
					},
					update: {
						path: {
							signal: `datum.width > 0 ? '${ANNOTATION_RANGED_ICON_SVG}' : '${ANNOTATION_SINGLE_ICON_SVG}'`,
						},
						fill: {
							field: 'color',
						},
						xc: {
							scale: scaleName,
							field: 'center',
							band: 0.5,
						},
						yc: {
							signal: `height + ${offset}`,
						},
						fillOpacity: {
							signal: `(${name}_selected && ${name}_selected != datum.center) ? 0.0 : 1.0`,
						},
					},
				},
			},
		],
	};
};

/**
 * Adds the required axis for axis annotations.
 *
 * NOTE: this function should only be called from within a produce with axes as the root state since it directly
 * mutates the axes array
 * @param axes
 * @param param1
 */
export const addAxisAnnotationAxis = (axes: Axis[], { offset }: AxisAnnotationSpecOptions, scaleName) => {
	axes.push({
		scale: scaleName,
		orient: 'bottom',
		values: [],
		offset: offset,
	});
};

export const getAxisAnnotationsFromChildren = ({
	axisAnnotations,
	colorScheme,
	name: axisName,
	position,
	scaleType,
}: AxisSpecOptions & { scaleType: ScaleType }): AxisAnnotationSpecOptions[] => {
	if (position !== 'bottom') return [];
	return axisAnnotations.map((annotation, annotationIndex) => {
		return applyDefaultAxisAnnotationOptions(annotation, annotationIndex, axisName, colorScheme, scaleType);
	});
};

export const applyDefaultAxisAnnotationOptions = (
	{
		chartPopovers = [],
		chartTooltips = [],
		name,
		format,
		offset = DEFAULT_AXIS_ANNOTATION_OFFSET,
		color = DEFAULT_AXIS_ANNOTATION_COLOR,
		dataKey = 'annotations',
		options = [],
	}: AxisAnnotationOptions,
	annotationIndex: number,
	axisName: string,
	colorScheme: ColorScheme,
	scaleType: ScaleType
): AxisAnnotationSpecOptions => {
	return {
		chartPopovers,
		chartTooltips,
		color,
		colorScheme,
		dataKey,
		name: name ?? `${axisName}Annotation${annotationIndex}`,
		offset,
		options,
		axisName,
		format: format ?? (scaleType === 'time' ? 'span' : 'summary'),
	};
};

export const axisTypeSupportsAxisAnnotations = (position: Position | undefined): boolean => {
	const supportedAxisPositions: Position[] = ['bottom'];
	return Boolean(position && supportedAxisPositions.includes(position));
};
