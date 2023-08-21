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

import { DEFAULT_COLOR_SCHEME, DEFAULT_GRANULARITY, DEFAULT_LABEL_ALIGN, DEFAULT_LABEL_FONT_WEIGHT } from '@constants';
import { getGenericSignal } from '@specBuilder/signal/signalSpecBuilder';
import produce from 'immer';
import {
	AxisProps,
	AxisSpecProps,
	ColorScheme,
	Granularity,
	Label,
	LabelAlign,
	LabelFormat,
	Position,
	SubLabel,
} from 'types';
import {
	Align,
	Axis,
	Baseline,
	EncodeEntry,
	FontWeight,
	GroupMark,
	GuideEncodeEntry,
	Mark,
	NumberValue,
	ProductionRule,
	Scale,
	ScaleType,
	ScaledValueRef,
	Signal,
	SignalRef,
	Spec,
	TextEncodeEntry,
	TextValueRef,
	TickCount,
} from 'vega';

import {
	getReferenceLineMarks,
	getReferenceLinesFromChildren,
	scaleTypeSupportsRefenceLines,
} from './axisReferenceLineUtils';

export const addAxis = produce<Spec, [AxisProps & { colorScheme?: ColorScheme }]>(
	(
		spec,
		{
			baseline = false,
			baselineOffset = 0,
			colorScheme = DEFAULT_COLOR_SCHEME,
			granularity = DEFAULT_GRANULARITY,
			grid = false,
			hideDefaultLabels = false,
			labelAlign = DEFAULT_LABEL_ALIGN,
			labelFontWeight = DEFAULT_LABEL_FONT_WEIGHT,
			range,
			ticks = false,
			...props
		},
	) => {
		// reconstruct props with defaults
		const axisProps: AxisSpecProps = {
			baseline,
			baselineOffset,
			colorScheme,
			granularity,
			grid,
			hideDefaultLabels,
			labelAlign,
			labelFontWeight,
			name: getAxisName(spec),
			range,
			ticks,
			...props,
		};

		spec.signals = addAxisSignals(spec.signals ?? [], axisProps);

		// get the scale that this axis will be associated with
		const scale = getScale(spec.scales ?? [], axisProps.position);
		const { name: scaleName, type: scaleType } = scale;
		// get the opposing scale
		const opposingScaleType = getOpposingScaleType(spec.scales ?? [], axisProps.position);

		// set custom range if applicable
		if (range && (scaleType === 'linear' || scaleType === 'time')) {
			scale.domain = range;
		}

		spec.axes = addAxes(spec.axes ?? [], {
			...axisProps,
			...getTrellisAxisProps(scale.name),
			scaleName,
			scaleType,
			opposingScaleType,

			// we don't want to show the grid on top level
			// axes for trellised charts
			grid: axisProps.grid && !isTrellisedChart(spec),
		});

		spec.marks = addAxesMarks(spec.marks ?? [], {
			...axisProps,
			scaleName,
			scaleType,
			opposingScaleType,
		});
	},
);

export const getAxisName = (spec: Spec): string => {
	const nAxes = spec.axes?.length ?? 0;
	return `axis${nAxes}`;
};

export const addAxisSignals = produce<Signal[], [AxisSpecProps]>((signals, { name, labels, position, subLabels }) => {
	if (labels?.length) {
		// add all the label properties to a signal so that the axis encoding can use it to style each label correctly
		signals.push(getGenericSignal(`${name}Labels`, getLabelSignalValue(labels, position)));
	}
	if (subLabels?.length) {
		// add all the sublabel properties to a signal so that the axis encoding can use it to style each sublabel correctly
		signals.push(
			getGenericSignal(
				`${name}SubLabels`,
				subLabels.map((label) => ({
					...label,
					// convert label align to vega align
					align: getLabelBaselineAlign(label.align, position),
				})),
			),
		);
	}
});

/**
 * Gets the labels that have style properties on them and gets the correct alignment value based on axis position
 * @param labels
 * @param position
 * @returns
 */
export const getLabelSignalValue = (labels: (Label | string | number)[], position: Position) =>
	labels
		.map((label) => {
			// if this label is a string or number, then it doesn't need to be a signal
			if (typeof label !== 'object') {
				return;
			}
			return {
				...label,
				align: getLabelBaselineAlign(label.align, position),
			};
		})
		.filter(Boolean);

export const addAxes = produce<
	Axis[],
	[AxisSpecProps & { scaleName: string; scaleType?: ScaleType; opposingScaleType?: string }]
>((axes, { scaleName, scaleType, opposingScaleType, ...axisProps }) => {
	const { baseline, labelAlign, labelFontWeight, labelFormat, name, position, subLabels } = axisProps;
	const newAxes: Axis[] = [];
	if (labelFormat === 'time') {
		// time axis actually needs two axes. A primary and secondary.
		newAxes.push(...getTimeAxes(scaleName, axisProps));
	} else {
		const axis = getDefaultAxis(axisProps, scaleName, scaleType);

		// if labels exist, add them to the axis
		if (axisProps.labels?.length) {
			const labels = axisProps.labels as Label[];
			const signalName = `${name}Labels`;
			axis.values = labels.map((label) => getLabelValue(label));
			axis.encode = {
				labels: getAxisLabelsEncoding(labelAlign, labelFontWeight, 'label', position, signalName),
			};
		}

		// if sublabels exist, create a new axis for the sub labels
		if (subLabels?.length) {
			axis.titlePadding = 24;

			// add sublabel axis
			newAxes.push(getSubLabelAxis(axisProps, scaleName, scaleType));
		}
		newAxes.unshift(axis);
	}

	// add baseline
	if (opposingScaleType !== 'linear') {
		newAxes[0] = setAxisBaseline(newAxes[0], baseline);
	}

	if (scaleTypeSupportsRefenceLines(scaleType)) {
		// encode axis to hide labels that overlap reference line icons
		const referenceLines = getReferenceLinesFromChildren(axisProps.children);
		referenceLines.forEach((referenceLineProps) => {
			const { icon, value } = referenceLineProps;
			const text = newAxes[0].encode?.labels?.update?.text;
			if (icon && text && Array.isArray(text)) {
				// if the label is within 30 pixels of the reference line icon, hide it
				text.unshift({
					test: `abs(scale('${scaleName}', ${value}) - scale('${scaleName}', datum.value)) < 30`,
					value: '',
				});
			}
		});
	}

	axes.push(...newAxes);
});

/**
 * Gets the display value of the label. If it's an object, it will return the value property, otherwise it will return the label.
 * @param label
 * @returns string | number
 */
export const getLabelValue = (label: Label | number | string): string | number => {
	if (typeof label === 'object') {
		return label.value;
	}
	return label;
};

/**
 * gets all the custom props for a trellis axis
 * if this axis is not a trellis axis, it will return an empty object
 * @param scaleName
 * @returns trellisAxisProps
 */
export const getTrellisAxisProps = (scaleName: string): Partial<AxisSpecProps> => {
	let trellisAxisProps: Partial<AxisSpecProps> = {};

	// if 'TrellisBand' is in the scale name then this is a trellis axis
	if (scaleName.includes('TrellisBand')) {
		// shift the labels up/left half the scale bandwidth
		const labelOffsetSignal = `bandwidth('${scaleName}') / -2`;
		const axisType = scaleName[0] === 'x' ? 'x' : 'y';
		trellisAxisProps = {
			position: axisType === 'x' ? 'top' : 'left',
			labelFontWeight: 'bold',
			labelAlign: undefined, // set this to undefined because we will manually control alignment
			vegaLabelAlign: 'left',
			vegaLabelBaseline: 'bottom',
			vegaLabelOffset: axisType === 'x' ? { signal: labelOffsetSignal } : { signal: `${labelOffsetSignal} - 8` }, // y axis needs an extra 8px as vertical padding
			vegaLabelPadding: axisType === 'x' ? 8 : 0, // add vertical padding
		};
	}
	return trellisAxisProps;
};

export const addAxesMarks = produce<
	Mark[],
	[AxisSpecProps & { scaleName: string; scaleType?: ScaleType; opposingScaleType?: string }]
>((marks, props) => {
	const { baseline, baselineOffset, children, opposingScaleType, position, scaleName, scaleType } = props;

	// only add reference lines to linear or time scales
	if (scaleTypeSupportsRefenceLines(scaleType)) {
		const referenceLines = getReferenceLinesFromChildren(children);
		referenceLines.forEach((referenceLineProps, referenceLineIndex) => {
			const referenceLineMarks = getReferenceLineMarks(props, referenceLineProps, referenceLineIndex, scaleName);
			marks.push(...referenceLineMarks);
		});
	}

	const trellisGroupMark = marks.find((mark) => mark.name?.includes('Trellis')) as GroupMark;
	const isTrellised = Boolean(trellisGroupMark);

	if (baseline && opposingScaleType === 'linear') {
		addBaseline(marks, baselineOffset, position, trellisGroupMark);
	}

	if (isTrellised) {
		addAxesToTrellisGroup(props, trellisGroupMark, scaleName, scaleType);
	}
});

function addBaseline(marks: Mark[], baselineOffset: number, position: Position, trellisGroupMark: GroupMark) {
	const baselineRule = getBaselineRule(baselineOffset, position);

	// if the chart is trellised, add the baseline to the trellis mark group
	if (trellisGroupMark && 'marks' in trellisGroupMark) {
		if (baselineOffset === 0) {
			trellisGroupMark.marks?.push(baselineRule);
		} else {
			trellisGroupMark.marks?.unshift(baselineRule);
		}
	} else {
		// if the baselineOffset is 0, draw the baseline on top of all other marks, otherwise draw it behind
		if (baselineOffset === 0) {
			marks.push(baselineRule);
		} else {
			marks.unshift(baselineRule);
		}
	}
}

function addAxesToTrellisGroup(
	props: AxisSpecProps,
	trellisGroupMark: GroupMark,
	scaleName: string,
	scaleType?: ScaleType,
) {
	const trellisOrientation = trellisGroupMark.name?.startsWith('x') ? 'horizontal' : 'vertical';
	const axisOrientation = props.position === 'bottom' || props.position === 'top' ? 'horizontal' : 'vertical';

	// hide labels if the axis is not in the same orientation as the trellis
	// for example, we don't want x-axis labels on a vertical trellis
	const hideDefaultLabels = props.hideDefaultLabels || trellisOrientation !== axisOrientation;

	// get the scale that this axis will be associated with
	if (trellisOrientation === axisOrientation) {
		const scale = getScale(trellisGroupMark.scales ?? [], props.position);
		scaleName = scale.name;
		scaleType = scale.type;
	}

	trellisGroupMark.axes = addAxes(trellisGroupMark.axes ?? [], {
		...props,
		hideDefaultLabels,
		scaleName,
		scaleType,
	});
}

function getScale(scales: Scale[], position: Position) {
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
		name: getScaleNameFromPosition(position),
		type: 'linear',
		range: getRange(position),
	};
	scales.push(scale);
	return scale;
}

function getRange(position: Position): 'width' | 'height' {
	if (position === 'left' || position === 'right') {
		return 'height';
	}
	return 'width';
}

function getOpposingScaleType(scales: Scale[], position: Position) {
	let scale = scales.find((s) => 'range' in s && s.range === getOpposingRange(position));
	if (scale) {
		return scale.type;
	}
	scale = {
		name: getOpposingScaleNameFromPosition(position),
		type: 'linear',
		range: getOpposingRange(position),
	};
	scales.push(scale);
	return scale.type;
}

function getOpposingRange(position: Position): 'width' | 'height' {
	if (position === 'left' || position === 'right') {
		return 'width';
	}
	return 'height';
}

function getTimeAxes(
	scaleName: string,
	{
		granularity,
		grid,
		labelAlign,
		labelFontWeight,
		position,
		ticks,
		title,
		vegaLabelAlign,
		vegaLabelBaseline,
	}: AxisSpecProps,
): Axis[] {
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
			labelAlign: getLabelAlign(labelAlign, position, vegaLabelAlign),
			labelBaseline: getLabelBaseline(labelAlign, position, vegaLabelBaseline),
		},
		{
			scale: scaleName,
			orient: position,
			format: primaryFormat,
			tickCount: scaleName.includes('Time') ? tickGranularity : undefined,
			formatType: 'time',
			labelOverlap: 'greedy',
			labelFontWeight,
			labelAlign: getLabelAlign(labelAlign, position, vegaLabelAlign),
			labelBaseline: getLabelBaseline(labelAlign, position, vegaLabelBaseline),
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
}

function getTimeLabelFormats(granularity: Granularity): [string, string, TickCount] {
	switch (granularity) {
		case 'minute':
			return ['%-I:%M %p', '%b %-d', 'minute'];
		case 'hour':
			return ['%-I %p', '%b %-d', 'hour'];
		case 'day':
			return ['%-d', '%b', 'day'];
		case 'week':
			return ['%-d', '%b', 'week'];
		case 'month':
			return ['%b', '%Y', 'month'];
		case 'quarter':
			return ['Q%q', '%Y', { interval: 'month', step: 3 }];
		default:
			return ['%-d', '%b', 'day'];
	}
}

export const getDefaultAxis = (
	{
		grid,
		hideDefaultLabels,
		labelAlign,
		labelFontWeight,
		labelFormat,
		position,
		ticks,
		tickMinStep,
		title,
		vegaLabelAlign,
		vegaLabelBaseline,
		vegaLabelOffset,
		vegaLabelPadding,
	}: AxisSpecProps,
	scaleName: string,
	scaleType: ScaleType | undefined,
): Axis => ({
	scale: scaleName,
	orient: position,
	grid,
	ticks,
	tickCount: getTickCount(position, grid),
	tickMinStep: scaleType !== 'linear' ? undefined : tickMinStep, //only supported for linear scales
	title,
	labelAlign: getLabelAlign(labelAlign, position, vegaLabelAlign),
	labelBaseline: getLabelBaseline(labelAlign, position, vegaLabelBaseline),
	labelFontWeight,
	labelOffset: getLabelOffset(labelAlign, scaleName, vegaLabelOffset),
	labelPadding: vegaLabelPadding,
	labels: !hideDefaultLabels,
	encode: {
		labels: {
			update: {
				text: getLabelFormat(labelFormat),
			},
		},
	},
});

export const getSubLabelAxis = (
	axisProps: AxisSpecProps,
	scaleName: string,
	scaleType: ScaleType | undefined,
): Axis => {
	const { labelAlign, labelFontWeight, name, position, ticks } = axisProps;
	const subLabels = axisProps.subLabels as SubLabel[];
	const signalName = `${name}SubLabels`;
	const subLabelValues = subLabels.map((label) => label.value);

	let subLabelAxis = getDefaultAxis(axisProps, scaleName, scaleType);
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
				...getAxisLabelsEncoding(labelAlign, labelFontWeight, 'subLabel', position, signalName),
			},
		},
	};
	return subLabelAxis;
};

const getAxisLabelsEncoding = (
	labelAlign: LabelAlign,
	labelFontWeight: FontWeight,
	labelKey: 'label' | 'subLabel',
	position: Position,
	signalName: string,
): GuideEncodeEntry<TextEncodeEntry> => ({
	update: {
		text: [
			{
				test: `indexof(pluck(${signalName}, 'value'), datum.value) !== -1`,
				signal: `${signalName}[indexof(pluck(${signalName}, 'value'), datum.value)].${labelKey}`,
			},
			{ signal: 'datum.value' },
		],
		fontWeight: [
			{
				test: `indexof(pluck(${signalName}, 'value'), datum.value) !== -1 && ${signalName}[indexof(pluck(${signalName}, 'value'), datum.value)].fontWeight`,
				signal: `${signalName}[indexof(pluck(${signalName}, 'value'), datum.value)].fontWeight`,
			},
			// default to the primary label font weight
			{ value: labelFontWeight },
		],
		...getEncodedLabelBaselineAlign(position, signalName, labelAlign),
	},
});

/**
 * clamps the tick count to a min of 2 and max of 5 for linear scales
 * @param position
 * @param scaleType
 * @returns tickCount production rule
 */
export function getTickCount(position: Position, grid: boolean): SignalRef | undefined {
	if (!grid) return;
	const range = ['top', 'bottom'].includes(position) ? 'width' : 'height';
	// clamp axis tick count to a min of 2 and max of 5
	return { signal: `clamp(ceil(${range}/40), 2, 5)` };
}

/**
 * gets the baseline or alignment for the axis label based on the position
 * @param labelAlign
 * @param position
 * @returns
 */
export function getLabelBaselineAlign(
	labelAlign: LabelAlign | undefined,
	position: Position,
): Align | Baseline | undefined {
	switch (position) {
		case 'top':
		case 'bottom':
			return getLabelAlign(labelAlign, position);
		case 'left':
		case 'right':
			return getLabelBaseline(labelAlign, position);
	}
}

export const getEncodedLabelBaselineAlign = (
	position: Position,
	signalName: string,
	defaultLabelAlign: LabelAlign,
): EncodeEntry => {
	const productionRule: ProductionRule<ScaledValueRef<Baseline>> = [
		{
			test: `indexof(pluck(${signalName}, 'value'), datum.value) !== -1 && ${signalName}[indexof(pluck(${signalName}, 'value'), datum.value)].align`,
			signal: `${signalName}[indexof(pluck(${signalName}, 'value'), datum.value)].align`,
		},
	];
	switch (position) {
		case 'top':
		case 'bottom':
			return {
				align: [...productionRule, { value: getLabelAlign(defaultLabelAlign, position) }],
			};
		case 'left':
		case 'right':
			return {
				baseline: [...productionRule, { value: getLabelBaseline(defaultLabelAlign, position) }],
			};
	}
};

/**
 * gets the vega labelAlign value based on the prism labelAlign value
 * @param labelAlign
 * @returns
 */
export function getLabelAlign(
	labelAlign: LabelAlign | undefined,
	position: Position,
	vegaLabelAlign?: Align,
): Align | undefined {
	if (vegaLabelAlign) return vegaLabelAlign;
	if (!labelAlign) return;
	if (['top', 'bottom'].includes(position)) {
		switch (labelAlign) {
			case 'start':
				return 'left';
			case 'end':
				return 'right';
			case 'center':
			default:
				return 'center';
		}
	}
}

/**
 * gets the vega baseline value based on the prism labelAlign value
 * @param labelAlign
 * @returns
 */
export function getLabelBaseline(
	labelAlign: LabelAlign | undefined,
	position: Position,
	vegaLabelBaseline?: Baseline,
): Baseline | undefined {
	if (vegaLabelBaseline) return vegaLabelBaseline;
	if (!labelAlign) return;
	if (['left', 'right'].includes(position)) {
		switch (labelAlign) {
			case 'start':
				return 'top';
			case 'end':
				return 'bottom';
			case 'center':
			default:
				return 'middle';
		}
	}
}

/**
 * calculates the label offset for a band scale based on the labelAlign
 * @param labelAlign
 * @param scaleName
 * @returns
 */
export function getLabelOffset(
	labelAlign: LabelAlign,
	scaleName: string,
	vegaLabelOffset?: NumberValue,
): NumberValue | undefined {
	if (vegaLabelOffset !== undefined) return vegaLabelOffset;
	switch (labelAlign) {
		case 'start':
			return { signal: `bandwidth('${scaleName}') / -2` };
		case 'end':
			return { signal: `bandwidth('${scaleName}') / 2` };
		default:
			return undefined;
	}
}

/**
 * gets the vega label format based on the prism labelFormat
 * @param type
 * @returns
 */
function getLabelFormat(type?: LabelFormat): ProductionRule<TextValueRef> {
	if (type === 'percentage') {
		return [{ test: 'isNumber(datum.value)', signal: "format(datum.value, '~%')" }, { signal: 'datum.value' }];
	}

	// if it's a number and greater than or equal to 1000, we want to format it in scientific notation (but with B instead of G) ex. 1K, 20M, 1.3B
	return [
		{
			test: 'isNumber(datum.value) && abs(datum.value) >= 1000',
			signal: "upper(replace(format(datum.value, '.3~s'), 'G', 'B'))",
		},
		{ signal: 'datum.value' },
	];
}

export function setAxisBaseline(axis: Axis, baseline = false): Axis {
	// Vega's property is "domain" - we use "baseline"
	return { ...axis, domain: baseline, domainWidth: 2 };
}

export function getBaselineRule(baselineOffset: number, position: Position): Mark {
	const orientation = ['left', 'right'].includes(position) ? 'y' : 'x';

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
}

function getScaleNameFromPosition(position: Position) {
	return ['left', 'right'].includes(position) ? 'yLinear' : 'xLinear';
}

function getOpposingScaleNameFromPosition(position: Position) {
	return ['left', 'right'].includes(position) ? 'xLinear' : 'yLinear';
}

function isTrellisedChart(spec: Spec): boolean {
	return /[xy]TrellisGroup/g.test(JSON.stringify(spec));
}
