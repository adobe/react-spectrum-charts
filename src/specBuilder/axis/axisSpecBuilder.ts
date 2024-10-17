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
import {
	DEFAULT_COLOR_SCHEME,
	DEFAULT_GRANULARITY,
	DEFAULT_LABEL_ALIGN,
	DEFAULT_LABEL_FONT_WEIGHT,
	DEFAULT_LABEL_ORIENTATION,
} from '@constants';
import {
	addAxisAnnotationAxis,
	addAxisAnnotationData,
	addAxisAnnotationMarks,
	addAxisAnnotationSignals,
	getAxisAnnotationsFromChildren,
} from '@specBuilder/axisAnnotation/axisAnnotationUtils';
import { getGenericValueSignal } from '@specBuilder/signal/signalSpecBuilder';
import { sanitizeAxisChildren } from '@utils';
import { produce } from 'immer';
import { Axis, Data, GroupMark, Mark, ScaleType, Signal, Spec } from 'vega';

import { AxisProps, AxisSpecProps, ColorScheme, Label, Orientation, Position } from '../../types';
import { getAxisLabelsEncoding, getControlledLabelAnchorValues, getLabelValue } from './axisLabelUtils';
import { getReferenceLineMarks, getReferenceLines, scaleTypeSupportsReferenceLines } from './axisReferenceLineUtils';
import { encodeAxisTitle, getTrellisAxisProps, isTrellisedChart } from './axisTrellisUtils';
import {
	getBaselineRule,
	getDefaultAxis,
	getOpposingScaleType,
	getScale,
	getSubLabelAxis,
	getTimeAxes,
	hasSubLabels,
} from './axisUtils';

export const addAxis = produce<Spec, [AxisProps & { colorScheme?: ColorScheme; index?: number }]>(
	(
		spec,
		{
			name,
			baseline = false,
			baselineOffset = 0,
			children,
			colorScheme = DEFAULT_COLOR_SCHEME,
			granularity = DEFAULT_GRANULARITY,
			grid = false,
			hideDefaultLabels = false,
			index = 0,
			labelAlign = DEFAULT_LABEL_ALIGN,
			labelFontWeight = DEFAULT_LABEL_FONT_WEIGHT,
			labelOrientation = DEFAULT_LABEL_ORIENTATION,
			labels = [],
			numberFormat = 'shortNumber',
			position,
			range,
			subLabels = [],
			ticks = false,
			...props
		}
	) => {
		// get the scale that this axis will be associated with
		const scale = getScale(spec.scales ?? [], position);
		const scaleName = name || scale.name;
		const scaleType = scale.type;

		// get the opposing scale
		const opposingScaleType = getOpposingScaleType(spec.scales ?? [], position);

		// reconstruct props with defaults
		const axisProps: AxisSpecProps = {
			baseline,
			baselineOffset,
			children: sanitizeAxisChildren(children),
			colorScheme,
			granularity,
			grid,
			hideDefaultLabels,
			index,
			labelAlign,
			labelFontWeight,
			labelOrientation,
			labels,
			name: `axis${index}`,
			numberFormat,
			position,
			range,
			subLabels,
			ticks,
			scaleType: scaleType ?? 'linear',
			...props,
		};

		spec.data = addAxisData(spec.data ?? [], { ...axisProps, scaleType: scaleType ?? 'linear' });
		spec.signals = addAxisSignals(spec.signals ?? [], axisProps);

		// set custom range if applicable
		if (range && (scaleType === 'linear' || scaleType === 'time')) {
			scale.domain = range;
		}

		spec.axes = addAxes(spec.axes ?? [], {
			...axisProps,
			scaleName,
			opposingScaleType,

			// we don't want to show the grid on top level
			// axes for trellised charts
			grid: axisProps.grid && !isTrellisedChart(spec),
		});

		spec.marks = addAxesMarks(spec.marks ?? [], {
			...axisProps,
			scaleName,
			opposingScaleType,
		});

		return spec;
	}
);

export const addAxisData = produce<Data[], [AxisSpecProps & { scaleType: ScaleType }]>((data, props) => {
	const axisAnnotations = getAxisAnnotationsFromChildren(props);
	axisAnnotations.forEach((annotationProps) => {
		addAxisAnnotationData(data, annotationProps);
	});
});

export const addAxisSignals = produce<Signal[], [AxisSpecProps]>((signals, props) => {
	const { name, labels, position, subLabels, labelOrientation } = props;
	if (labels?.length) {
		// add all the label properties to a signal so that the axis encoding can use it to style each label correctly
		signals.push(getGenericValueSignal(`${name}_labels`, getLabelSignalValue(labels, position, labelOrientation)));
	}
	if (hasSubLabels(props)) {
		// add all the sublabel properties to a signal so that the axis encoding can use it to style each sublabel correctly
		signals.push(
			getGenericValueSignal(
				`${name}_subLabels`,
				subLabels.map((label) => ({
					...label,
					// convert label align to vega align
					...getControlledLabelAnchorValues(position, labelOrientation, label.align),
				}))
			)
		);
	}
	const axisAnnotations = getAxisAnnotationsFromChildren(props);
	axisAnnotations.forEach((annotationProps) => {
		addAxisAnnotationSignals(signals, annotationProps);
	});
});

/**
 * Gets the labels that have style properties on them and gets the correct alignment value based on axis position
 * @param labels
 * @param position
 * @returns
 */
export const getLabelSignalValue = (
	labels: (Label | string | number)[],
	position: Position,
	labelOrientation: Orientation
) =>
	labels
		.map((label) => {
			// if this label is a string or number, then it doesn't need to be a signal
			if (typeof label !== 'object') {
				return;
			}
			return {
				...label,
				...getControlledLabelAnchorValues(position, labelOrientation, label.align),
			};
		})
		.filter(Boolean);

export const addAxes = produce<Axis[], [AxisSpecProps & { scaleName: string; opposingScaleType?: string }]>(
	(axes, { scaleName, opposingScaleType, ...axisProps }) => {
		const newAxes: Axis[] = [];
		// adds all the trellis axis props if this is a trellis axis
		axisProps = { ...axisProps, ...getTrellisAxisProps(scaleName) };
		const { baseline, labelAlign, labelFontWeight, labelFormat, labelOrientation, name, position } = axisProps;
		if (labelFormat === 'time') {
			// time axis actually needs two axes. A primary and secondary.
			newAxes.push(...getTimeAxes(scaleName, axisProps));
		} else {
			const axis = getDefaultAxis(axisProps, scaleName);

			// if labels exist, add them to the axis
			if (axisProps.labels.length) {
				const labels = axisProps.labels;
				const signalName = `${name}_labels`;
				axis.values = labels.map((label) => getLabelValue(label));
				axis.encode = {
					labels: getAxisLabelsEncoding(
						labelAlign,
						labelFontWeight,
						'label',
						labelOrientation,
						position,
						signalName
					),
				};
			}

			// if sublabels exist, create a new axis for the sub labels
			if (hasSubLabels(axisProps)) {
				axis.titlePadding = 24;

				// add sublabel axis
				newAxes.push(getSubLabelAxis(axisProps, scaleName));
			}
			newAxes.unshift(axis);
		}

		// add baseline
		if (opposingScaleType !== 'linear') {
			newAxes[0] = setAxisBaseline(newAxes[0], baseline);
		}

		if (scaleTypeSupportsReferenceLines(axisProps.scaleType)) {
			// encode axis to hide labels that overlap reference line icons
			const referenceLines = getReferenceLines(axisProps);
			referenceLines.forEach((referenceLineProps) => {
				const { label: referenceLineLabel, icon, value, position: linePosition } = referenceLineProps;
				const text = newAxes[0].encode?.labels?.update?.text;
				if (
					(icon || referenceLineLabel) &&
					text &&
					Array.isArray(text) &&
					(!linePosition || linePosition === 'center')
				) {
					// if the label is within 30 pixels of the reference line icon, hide it
					text.unshift({
						test: `abs(scale('${scaleName}', ${value}) - scale('${scaleName}', datum.value)) < 30`,
						value: '',
					});
				}
			});
		}

		const axisAnnotations = getAxisAnnotationsFromChildren(axisProps);
		axisAnnotations.forEach((annotationProps) => {
			addAxisAnnotationAxis(newAxes, annotationProps, scaleName);
		});

		axes.push(...newAxes);
	}
);

export const addAxesMarks = produce<
	Mark[],
	[AxisSpecProps & { scaleName: string; scaleType?: ScaleType; opposingScaleType?: string }]
>((marks, props) => {
	const { baseline, baselineOffset, opposingScaleType, position, scaleName, scaleType } = props;

	// only add reference lines to linear or time scales
	if (scaleTypeSupportsReferenceLines(scaleType)) {
		marks.push(...getReferenceLineMarks(props, scaleName));
	}

	const trellisGroupMark = marks.find((mark) => mark.name?.includes('Trellis')) as GroupMark;
	const isTrellised = Boolean(trellisGroupMark);

	if (baseline && opposingScaleType === 'linear') {
		addBaseline(marks, baselineOffset, position, trellisGroupMark);
	}

	if (isTrellised) {
		addAxesToTrellisGroup(props, trellisGroupMark, scaleName);
	}

	const axisAnnotations = getAxisAnnotationsFromChildren(props);
	axisAnnotations.forEach((annotationProps) => {
		addAxisAnnotationMarks(marks, annotationProps, scaleName);
	});
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

function addAxesToTrellisGroup(props: AxisSpecProps, trellisGroupMark: GroupMark, scaleName: string) {
	const trellisOrientation = trellisGroupMark.name?.startsWith('x') ? 'horizontal' : 'vertical';
	const axisOrientation = props.position === 'bottom' || props.position === 'top' ? 'horizontal' : 'vertical';

	// hide labels if the axis is not in the same orientation as the trellis
	// for example, we don't want x-axis labels on a vertical trellis
	const hideDefaultLabels = props.hideDefaultLabels || trellisOrientation !== axisOrientation;

	let scaleType = props.scaleType;
	// get the scale that this axis will be associated with
	if (trellisOrientation === axisOrientation) {
		const scale = getScale(trellisGroupMark.scales ?? [], props.position);
		scaleName = scale.name;
		scaleType = scale.type ?? 'linear';
	} else {
		// if the axis is not the same orientation as the trellis, then we don't display the title
		// because it will be displayed on the root axis at the spec level
		props.title = undefined;
	}

	let newAxes = addAxes([], {
		...props,
		hideDefaultLabels,
		scaleName,
		scaleType,
	});

	// titles on axes within the trellis group have special encodings so that the title is only shown on the first axis
	newAxes = encodeAxisTitle(newAxes, trellisGroupMark);

	trellisGroupMark.axes = [...(trellisGroupMark.axes ?? []), ...newAxes];
}

export function setAxisBaseline(axis: Axis, baseline = false): Axis {
	// Vega's property is "domain" - we use "baseline"
	return { ...axis, domain: baseline, domainWidth: 2 };
}
