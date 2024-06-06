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
import { DONUT_DIRECT_LABEL_MIN_ANGLE, DONUT_RADIUS, FILTERED_TABLE, MARK_ID, SELECTED_ITEM } from '@constants';
import { getColorProductionRule, getCursor, getMarkOpacity, getTooltip } from '@specBuilder/marks/markUtils';
import { getColorValue } from '@specBuilder/specUtils';
import { ArcMark, Mark, ProductionRule, TextEncodeEntry, TextValueRef } from 'vega';

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
				stroke: { value: getColorValue('static-blue', colorScheme) },
			},
			update: {
				startAngle: { field: 'startAngle' },
				endAngle: { field: 'endAngle' },
				padAngle: { value: 0.01 },
				innerRadius: { signal: `${holeRatio} * ${DONUT_RADIUS}` },
				outerRadius: { signal: DONUT_RADIUS },
				opacity: getMarkOpacity(props),
				cursor: getCursor(children),
				strokeWidth: [{ test: `${SELECTED_ITEM} === datum.${MARK_ID}`, value: 2 }, { value: 0 }],
			},
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
