/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { DONUT_DIRECT_LABEL_MIN_ANGLE, DONUT_RADIUS, FILTERED_TABLE } from '@constants';
import { getColorProductionRule, getCursor, getMarkOpacity, getTooltip } from '@specBuilder/marks/markUtils';
import {
	ArcMark,
	EncodeEntryName,
	GroupMark,
	Mark,
	NumericValueRef,
	ProductionRule,
	TextBaselineValueRef,
	TextEncodeEntry,
	TextValueRef,
} from 'vega';

import { DonutSpecProps } from '../../types';

export const getArcMark = (props: DonutSpecProps): ArcMark => {
	const { color, colorScheme, name, holeRatio, children } = props;
	return {
		type: 'arc',
		name,
		from: { data: FILTERED_TABLE },
		encode: {
			enter: {
				fill: getColorProductionRule(color, colorScheme),
				x: { signal: 'width / 2' },
				y: { signal: 'height / 2' },
				tooltip: getTooltip(children, name),
			},
			update: {
				startAngle: { field: 'startAngle' },
				endAngle: { field: 'endAngle' },
				padAngle: { value: 0.01 },
				innerRadius: { signal: `${holeRatio} * ${DONUT_RADIUS}` },
				outerRadius: { signal: DONUT_RADIUS },
				opacity: getMarkOpacity(props),
				cursor: getCursor(children),
			},
		},
	};
};

export const getAggregateMetricMark = (props: DonutSpecProps): GroupMark => {
	const { name, holeRatio, metricLabel } = props;
	const groupMark: Mark = {
		type: 'group',
		name: `${name}_aggregateMetricGroup`,
		marks: [
			{
				type: 'text',
				name: `${name}_aggregateMetricNumber`,
				from: { data: `${name}_aggregateData` },
				encode: getMetricNumberEncodeEnter(props),
			},
		],
	};
	if (metricLabel) {
		groupMark.marks!.push({
			type: 'text',
			name: `${name}_aggregateMetricLabel`,
			from: { data: `${name}_aggregateData` },
			encode: getMetricLabelEncodeEnter(holeRatio, metricLabel),
		});
	}
	return groupMark;
};

export const getPercentMetricMark = (props: DonutSpecProps): GroupMark => {
	const { name, holeRatio, metricLabel } = props;
	const groupMark: Mark = {
		type: 'group',
		name: `${name}_percentText`,
		marks: [
			{
				type: 'text',
				name: `${name}_percentMetricNumber`,
				from: { data: `${name}_booleanData` },
				encode: getMetricNumberEncodeEnter(props),
			},
		],
	};
	if (metricLabel) {
		groupMark.marks!.push({
			type: 'text',
			name: `${name}_percentMetricLabel`,
			from: { data: `${name}_booleanData` },
			encode: getMetricLabelEncodeEnter(holeRatio, metricLabel),
		});
	}
	return groupMark;
};

export const getMetricNumberEncodeEnter = ({
	metric,
	holeRatio,
	metricLabel,
	isBoolean,
}: DonutSpecProps): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
	return {
		enter: {
			x: { signal: 'width / 2' },
			y: { signal: 'height / 2' },
			text: getMetricNumberText(metric, isBoolean),
			fontSize: getFontSize(DONUT_RADIUS, holeRatio, true),
			align: { value: 'center' },
			baseline: getAggregateMetricBaseline(DONUT_RADIUS, holeRatio, !!metricLabel),
		},
	};
};

export const getMetricNumberText = (metric: string, isBoolean: boolean): ProductionRule<TextValueRef> => {
	if (isBoolean) {
		return { signal: `format(datum['${metric}'], '.0%')` };
	}
	return { signal: "upper(replace(format(datum.sum, '.3~s'), 'G', 'B'))" };
};

export const getMetricLabelEncodeEnter = (
	holeRatio: number,
	metricLabel: string
): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
	return {
		enter: {
			x: { signal: 'width / 2' },
			y: getLabelYWithOffset(DONUT_RADIUS, holeRatio),
			text: { value: metricLabel },
			fontSize: getFontSize(DONUT_RADIUS, holeRatio, false),
			align: { value: 'center' },
			baseline: { value: 'top' },
		},
	};
};

export const fontBreakpoints = [76, 64, 52, 40];
export const metricNumberFontSizes = [72, 60, 48, 36];
export const metricLabelFontSizes = [24, 18, 12, 0];

export const getAggregateMetricBaseline = (
	radius: string,
	holeRatio: number,
	showingLabel: boolean
): ProductionRule<TextBaselineValueRef> => {
	// whenever we aren't showing the label, the metric number should be in the middle
	// we check if the radius * holeRatio is greater than the second breakpoint because after that point the label dissapears
	return {
		signal: showingLabel ? `${radius} * ${holeRatio} > ${fontBreakpoints[2]} ? 'alphabetic' : 'middle'` : 'middle',
	};
};

export const getFontSize = (
	radius: string,
	holeRatio: number,
	isPrimaryText: boolean
): ProductionRule<NumericValueRef> => {
	return [
		{
			test: `${radius} * ${holeRatio} > ${fontBreakpoints[0]}`,
			value: isPrimaryText ? metricNumberFontSizes[0] : metricLabelFontSizes[0],
		},
		{
			test: `${radius} * ${holeRatio} > ${fontBreakpoints[1]}`,
			value: isPrimaryText ? metricNumberFontSizes[1] : metricLabelFontSizes[1],
		},
		{
			test: `${radius} * ${holeRatio} > ${fontBreakpoints[2]}`,
			value: isPrimaryText ? metricNumberFontSizes[2] : metricLabelFontSizes[2],
		},
		{
			test: `${radius} * ${holeRatio} > ${fontBreakpoints[3]}`,
			value: isPrimaryText ? metricNumberFontSizes[3] : metricLabelFontSizes[3],
		},
		{ value: 0 },
	];
};

// The offset is based off the font size of the metric label. However, we can't use tests here, so the signal is nested ternary statements
export const getLabelYWithOffset = (radius: string, holeRatio: number): ProductionRule<NumericValueRef> => {
	const openSpace = `${radius} * ${holeRatio}`;
	return {
		signal: `height / 2`,
		offset: {
			// if open space is greater than first breakpoint, return first size. Otherwise, check second breakpoint for second size, etc.
			signal: `${openSpace} > ${fontBreakpoints[0]} ? ${metricLabelFontSizes[0]} : ${openSpace} > ${fontBreakpoints[1]} ? ${metricLabelFontSizes[1]} : ${openSpace} > ${fontBreakpoints[2]} ? ${metricLabelFontSizes[2]} : 0`,
		},
	};
};

export const getDirectLabelMark = ({ name, metric, segment }: DonutSpecProps & { segment: string }): Mark => {
	return {
		name: `${name}_directLabels`,
		type: 'group',
		marks: [
			{
				type: 'text',
				name: `${name}_directLabelSegment`,
				from: { data: FILTERED_TABLE },
				encode: {
					enter: getDirectLabelTextEntry(segment, 'bottom'),
				},
			},
			{
				type: 'text',
				name: `${name}_directLabelMetric`,
				from: { data: FILTERED_TABLE },
				encode: {
					enter: getDirectLabelTextEntry(metric, 'top', true),
				},
			},
		],
	};
};

export const getDirectLabelTextEntry = (
	datumProperty: string,
	baselinePosition: 'top' | 'bottom',
	format: boolean = false
): TextEncodeEntry => {
	return {
		text: getDisplayTextForLargeSlice(datumProperty, format),
		x: { signal: 'width / 2' },
		y: { signal: 'height / 2' },
		radius: { signal: `${DONUT_RADIUS} + 15` },
		theta: { signal: '(datum.startAngle + datum.endAngle) / 2' },
		fontSize: { value: 14 },
		width: { signal: `getLabelWidth(datum['${datumProperty}'], 'bold', '14') + 10` },
		align: {
			signal: "(datum.startAngle + datum.endAngle) / 2 <= PI ? 'left' : 'right'",
		},
		baseline: { value: baselinePosition },
	};
};

export const getDisplayTextForLargeSlice = (datumProperty: string, format: boolean): ProductionRule<TextValueRef> => {
	// need to use radians for this. 0.3 radians is about 17 degrees
	// if we used arc length, then showing a label could shrink the overall donut size which could make the arc to small
	// that would hide the label which would make the arc bigger which would show the label and so on
	return [
		{ test: `datum.endAngle - datum.startAngle < ${DONUT_DIRECT_LABEL_MIN_ANGLE}`, value: null },
		{ signal: format ? `format(datum['${datumProperty}'], ',')` : `datum['${datumProperty}']` },
	];
};
