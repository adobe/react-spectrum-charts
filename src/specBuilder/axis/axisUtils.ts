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
import { AxisSpecProps, Position, SubLabel } from 'types';
import { Axis, Mark, Scale, SignalRef } from 'vega';

import {
	getAxisLabelsEncoding,
	getLabelAnchorValues,
	getLabelAngle,
	getLabelFormat,
	getLabelOffset,
	getTimeLabelFormats,
} from './axisLabelUtils';

/**
 * Generates a default vega axis from the axis props
 * @param axisProps
 * @param scaleName
 * @returns axis
 */
export const getDefaultAxis = (
	{
		grid,
		hideDefaultLabels,
		labelAlign,
		labelFontWeight,
		labelFormat,
		labelOrientation,
		position,
		scaleType,
		ticks,
		tickMinStep,
		title,
		vegaLabelAlign,
		vegaLabelBaseline,
		vegaLabelOffset,
		vegaLabelPadding,
	}: AxisSpecProps,
	scaleName: string
): Axis => ({
	scale: scaleName,
	orient: position,
	grid,
	ticks,
	tickCount: getTickCount(position, grid),
	tickMinStep: scaleType !== 'linear' ? undefined : tickMinStep, //only supported for linear scales
	title,
	labelAngle: getLabelAngle(labelOrientation),
	labelFontWeight,
	labelOffset: getLabelOffset(labelAlign, scaleName, vegaLabelOffset),
	labelPadding: vegaLabelPadding,
	labels: !hideDefaultLabels,
	...getLabelAnchorValues(position, labelOrientation, labelAlign, vegaLabelAlign, vegaLabelBaseline),
	encode: {
		labels: {
			update: {
				text: getLabelFormat(labelFormat),
			},
		},
	},
});

/**
 * Generates the time axes for a time scale from the axis props
 * @param scaleName
 * @param axisProps
 * @returns axes
 */
export const getTimeAxes = (
	scaleName: string,
	{
		granularity,
		grid,
		labelAlign,
		labelFontWeight,
		labelOrientation,
		position,
		ticks,
		title,
		vegaLabelAlign,
		vegaLabelBaseline,
	}: AxisSpecProps
): Axis[] => {
	const [secondaryFormat, primaryFormat, tickGranularity] = getTimeLabelFormats(granularity);
	return [
		{
			scale: scaleName,
			orient: position,
			grid,
			ticks,
			tickCount: scaleName.includes('Time') ? tickGranularity : undefined,
			title,
			format: secondaryFormat,
			formatType: 'time',
			labelAngle: getLabelAngle(labelOrientation),
			...getLabelAnchorValues(position, labelOrientation, labelAlign, vegaLabelAlign, vegaLabelBaseline),
		},
		{
			scale: scaleName,
			orient: position,
			format: primaryFormat,
			tickCount: scaleName.includes('Time') ? tickGranularity : undefined,
			formatType: 'time',
			labelOverlap: 'greedy',
			labelFontWeight,
			labelAngle: getLabelAngle(labelOrientation),
			...getLabelAnchorValues(position, labelOrientation, labelAlign, vegaLabelAlign, vegaLabelBaseline),
			encode: {
				labels: {
					enter: {
						dy: { value: (ticks ? 28 : 20) * (position === 'top' ? -1 : 1) }, // account for tick height
					},
					update: {
						text: { signal: 'formatPrimaryTimeLabels(datum)' },
					},
				},
			},
		},
	];
};

/**
 * Generates an axis for sub labels from the axis props
 * @param axisProps
 * @param scaleName
 * @returns axis
 */
export const getSubLabelAxis = (axisProps: AxisSpecProps, scaleName: string): Axis => {
	const { labelAlign, labelFontWeight, labelOrientation, name, position, ticks } = axisProps;
	const subLabels = axisProps.subLabels as SubLabel[];
	const signalName = `${name}_subLabels`;
	const subLabelValues = subLabels.map((label) => label.value);

	let subLabelAxis = getDefaultAxis(axisProps, scaleName);
	subLabelAxis = {
		...subLabelAxis,
		domain: false,
		domainWidth: undefined,
		grid: false,
		labelPadding: ticks ? 32 : 24,
		ticks: false,
		title: undefined,
		values: subLabelValues.length ? subLabelValues : undefined,
		encode: {
			labels: {
				...getAxisLabelsEncoding(
					labelAlign,
					labelFontWeight,
					'subLabel',
					labelOrientation,
					position,
					signalName
				),
			},
		},
	};
	return subLabelAxis;
};

/**
 * Finds and returns the scale that this axis is for
 * If the scale does not exist, it will create a new one
 * @param scales
 * @param position
 * @returns scale
 */
export const getScale = (scales: Scale[], position: Position) => {
	const applicableScales = scales.filter((s) => 'range' in s && s.range === getRange(position));
	let scale: Scale | undefined;

	if (applicableScales.length > 1) {
		// Is there a better way to find the trellis scale?
		scale = scales.find((s) => s.name.includes('Trellis')) ?? applicableScales[0];
	} else {
		scale = applicableScales[0];
	}

	if (scale) {
		return scale;
	}

	scale = {
		name: getDefaultScaleNameFromPosition(position),
		type: 'linear',
		range: getRange(position),
	};
	scales.push(scale);
	return scale;
};

/**
 * Gets the scale range from the position
 * @param position
 * @returns range
 */
export const getRange = (position: Position): 'width' | 'height' => {
	if (position === 'left' || position === 'right') {
		return 'height';
	}
	return 'width';
};

/**
 * Gets the scale type of the opposing scale.
 * For example, if this is an x-axis, it will return the y-scale type
 * @param scales
 * @param position
 * @returns scaleType
 */
export const getOpposingScaleType = (scales: Scale[], position: Position) => {
	let scale = scales.find((s) => 'range' in s && s.range === getOpposingRange(position));
	if (scale) {
		return scale.type;
	}
	scale = {
		name: getDefaultOpposingScaleNameFromPosition(position),
		type: 'linear',
		range: getOpposingRange(position),
	};
	scales.push(scale);
	return scale.type;
};

/**
 * Gets the scale range for the opposing scale
 * @param position
 * @returns
 */
export const getOpposingRange = (position: Position): 'width' | 'height' => {
	if (position === 'left' || position === 'right') {
		return 'width';
	}
	return 'height';
};

/**
 * Returns whether the axis is vertical.
 * @param position
 * @returns boolean
 */
export const isVerticalAxis = (position: Position): boolean => {
	return ['left', 'right'].includes(position);
};

/**
 * Gets the default scale name based on the position
 * @param position
 * @returns scaleName
 */
const getDefaultScaleNameFromPosition = (position: Position) => {
	return isVerticalAxis(position) ? 'yLinear' : 'xLinear';
};

/**
 * Gets the default opposing scale name based on the position
 * @param position
 * @returns scaleName
 */
const getDefaultOpposingScaleNameFromPosition = (position: Position) => {
	return isVerticalAxis(position) ? 'xLinear' : 'yLinear';
};

/**
 * clamps the tick count to a min of 2 and max of 5 for linear scales
 * @param position
 * @param grid
 * @returns tickCount production rule
 */
export const getTickCount = (position: Position, grid: boolean): SignalRef | undefined => {
	if (!grid) return;
	const range = ['top', 'bottom'].includes(position) ? 'width' : 'height';
	// clamp axis tick count to a min of 2 and max of 5
	return { signal: `clamp(ceil(${range}/40), 2, 5)` };
};

/**
 * Gets the baseline rule mark
 * @param baselineOffset
 * @param position
 * @returns baselineMark
 */
export const getBaselineRule = (baselineOffset: number, position: Position): Mark => {
	const orientation = isVerticalAxis(position) ? 'y' : 'x';

	const positionProps = {
		x: {
			x: { value: 0 },
			x2: { signal: 'width' },
			y: { scale: 'yLinear', value: baselineOffset },
		},
		y: {
			x: { scale: 'xLinear', value: baselineOffset },
			y: { value: 0 },
			y2: { signal: 'height' },
		},
	};

	return {
		name: `${orientation}Baseline`,
		type: 'rule',
		interactive: false,
		encode: {
			update: {
				...positionProps[orientation],
			},
		},
	};
};

export const hasSubLabels = ({ subLabels, labelOrientation }: AxisSpecProps) => {
	// subLabels are only supported for horizontal axis labels
	return Boolean(subLabels.length && labelOrientation === 'horizontal');
};
