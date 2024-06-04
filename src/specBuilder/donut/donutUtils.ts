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
import { DONUT_DIRECT_LABEL_MIN_ANGLE, DONUT_RADIUS, DONUT_SUMMARY_MIN_RADIUS, FILTERED_TABLE } from '@constants';
import { getColorProductionRule, getCursor, getMarkOpacity, getTooltip } from '@specBuilder/marks/markUtils';
import {
	ArcMark,
	EncodeEntryName,
	GroupMark,
	Mark,
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
	const { name, metricLabel } = props;
	const groupMark: Mark = {
		type: 'group',
		name: `${name}_aggregateMetricGroup`,
		marks: [
			{
				type: 'text',
				name: `${name}_aggregateMetricNumber`,
				from: { data: `${name}_aggregateData` },
				encode: getMetricNumberEncode(props),
			},
		],
	};
	if (metricLabel) {
		groupMark.marks!.push({
			type: 'text',
			name: `${name}_aggregateMetricLabel`,
			from: { data: `${name}_aggregateData` },
			encode: getMetricLabelEncode({ ...props, metricLabel }),
		});
	}
	return groupMark;
};

export const getPercentMetricMark = (props: DonutSpecProps): GroupMark => {
	const { name, metricLabel } = props;
	const groupMark: Mark = {
		type: 'group',
		name: `${name}_percentText`,
		marks: [
			{
				type: 'text',
				name: `${name}_percentMetricNumber`,
				from: { data: `${name}_booleanData` },
				encode: getMetricNumberEncode(props),
			},
		],
	};
	if (metricLabel) {
		groupMark.marks!.push({
			type: 'text',
			name: `${name}_percentMetricLabel`,
			from: { data: `${name}_booleanData` },
			encode: getMetricLabelEncode({ ...props, metricLabel }),
		});
	}
	return groupMark;
};

export const getMetricNumberEncode = ({
	metric,
	holeRatio,
	isBoolean,
	name,
}: DonutSpecProps): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
	return {
		update: {
			x: { signal: 'width / 2' },
			y: { signal: 'height / 2' },
			text: getMetricNumberText(metric, isBoolean),
			fontSize: { signal: `${name}_summaryFontSize` },
			align: { value: 'center' },
			baseline: { value: 'alphabetic' },
			fillOpacity: [{ test: `${DONUT_RADIUS} * ${holeRatio} < ${DONUT_SUMMARY_MIN_RADIUS}`, value: 0 }],
			limit: {
				signal: `2 * sqrt(pow(${DONUT_RADIUS} * ${holeRatio}, 2) - pow(${name}_summaryFontSize, 2))`,
			},
		},
	};
};

export const getMetricNumberText = (metric: string, isBoolean: boolean): ProductionRule<TextValueRef> => {
	if (isBoolean) {
		return { signal: `format(datum['${metric}'], '.0%')` };
	}
	return { signal: "upper(replace(format(datum.sum, '.3~s'), 'G', 'B'))" };
};

export const getMetricLabelEncode = ({
	holeRatio,
	metricLabel,
	name,
}: DonutSpecProps & { metricLabel: string }): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
	return {
		update: {
			x: { signal: 'width / 2' },
			y: { signal: 'height / 2' },
			dy: { signal: `ceil(${name}_summaryFontSize * 0.25)` },
			text: { value: metricLabel },
			fontSize: { signal: `ceil(${name}_summaryFontSize * 0.5)` },
			align: { value: 'center' },
			baseline: { value: 'top' },
			fillOpacity: [{ test: `${DONUT_RADIUS} * ${holeRatio} < ${DONUT_SUMMARY_MIN_RADIUS}`, value: 0 }],
			limit: {
				signal: `2 * sqrt(pow(${DONUT_RADIUS} * ${holeRatio}, 2) - pow(${name}_summaryFontSize * 0.75, 2))`,
			},
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
