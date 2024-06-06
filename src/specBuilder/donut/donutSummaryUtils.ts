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

import { DonutSummary } from '@components/DonutSummary';
import { DONUT_RADIUS, DONUT_SUMMARY_MIN_RADIUS } from '@constants';
import { getTextNumberFormat } from '@specBuilder/textUtils';
import { EncodeEntryName, GroupMark, Mark, ProductionRule, TextEncodeEntry, TextValueRef } from 'vega';

import { DonutSpecProps, DonutSummaryElement, DonutSummaryProps, DonutSummarySpecProps } from '../../types';

export const getDonutSummary = (props: DonutSpecProps): DonutSummarySpecProps | undefined => {
	const donutSummary = props.children.find((child) => child.type === DonutSummary) as DonutSummaryElement;
	if (!donutSummary) {
		return;
	}
	return applyDonutSummaryPropDefaults(donutSummary.props, props);
};

const applyDonutSummaryPropDefaults = (
	{ numberFormat = 'shortNumber', ...props }: DonutSummaryProps,
	donutProps: DonutSpecProps
): DonutSummarySpecProps => ({
	donutProps,
	numberFormat,
	...props,
});

export const getMetricsSummaryMarks = (props: DonutSpecProps): GroupMark[] => {
	const donutSummary = getDonutSummary(props);
	if (!donutSummary) {
		return [];
	}
	const { donutProps } = donutSummary;
	const marks: GroupMark[] = [];
	if (donutProps.isBoolean) {
		marks.push(getPercentMetricMark(donutSummary));
	} else {
		marks.push(getAggregateMetricMark(donutSummary));
	}
	return marks;
};

export const getAggregateMetricMark = (props: DonutSummarySpecProps): GroupMark => {
	const { donutProps, label } = props;
	const groupMark: Mark = {
		type: 'group',
		name: `${donutProps.name}_aggregateMetricGroup`,
		marks: [
			{
				type: 'text',
				name: `${donutProps.name}_aggregateMetricNumber`,
				from: { data: `${donutProps.name}_aggregateData` },
				encode: getMetricNumberEncode(props),
			},
		],
	};
	if (label) {
		groupMark.marks!.push({
			type: 'text',
			name: `${donutProps.name}_aggregateMetricLabel`,
			from: { data: `${donutProps.name}_aggregateData` },
			encode: getMetricLabelEncode({ ...props, label }),
		});
	}
	return groupMark;
};

export const getPercentMetricMark = (props: DonutSummarySpecProps): GroupMark => {
	const { donutProps, label } = props;
	const groupMark: Mark = {
		type: 'group',
		name: `${donutProps.name}_percentText`,
		marks: [
			{
				type: 'text',
				name: `${donutProps.name}_percentMetricNumber`,
				from: { data: `${donutProps.name}_booleanData` },
				encode: getMetricNumberEncode(props),
			},
		],
	};
	if (label) {
		groupMark.marks!.push({
			type: 'text',
			name: `${donutProps.name}_percentMetricLabel`,
			from: { data: `${donutProps.name}_booleanData` },
			encode: getMetricLabelEncode({ ...props, label }),
		});
	}
	return groupMark;
};

export const getMetricNumberEncode = (
	props: DonutSummarySpecProps
): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
	const { donutProps } = props;
	return {
		update: {
			x: { signal: 'width / 2' },
			y: { signal: 'height / 2' },
			text: getMetricNumberText(props),
			fontSize: { signal: `${donutProps.name}_summaryFontSize` },
			align: { value: 'center' },
			baseline: { value: 'alphabetic' },
			fillOpacity: [
				{ test: `${DONUT_RADIUS} * ${donutProps.holeRatio} < ${DONUT_SUMMARY_MIN_RADIUS}`, value: 0 },
			],
			limit: {
				signal: `2 * sqrt(pow(${DONUT_RADIUS} * ${donutProps.holeRatio}, 2) - pow(${donutProps.name}_summaryFontSize, 2))`,
			},
		},
	};
};

export const getMetricNumberText = ({
	donutProps,
	numberFormat,
}: DonutSummarySpecProps): ProductionRule<TextValueRef> => {
	if (donutProps.isBoolean) {
		return { signal: `format(datum['${donutProps.metric}'], '.0%')` };
	}
	return [...getTextNumberFormat(numberFormat, 'sum'), { field: 'sum' }];
};

export const getMetricLabelEncode = ({
	donutProps,
	label,
}: DonutSummarySpecProps & { label: string }): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
	return {
		update: {
			x: { signal: 'width / 2' },
			y: { signal: 'height / 2' },
			dy: { signal: `ceil(${donutProps.name}_summaryFontSize * 0.25)` },
			text: { value: label },
			fontSize: { signal: `ceil(${donutProps.name}_summaryFontSize * 0.5)` },
			align: { value: 'center' },
			baseline: { value: 'top' },
			fillOpacity: [
				{ test: `${DONUT_RADIUS} * ${donutProps.holeRatio} < ${DONUT_SUMMARY_MIN_RADIUS}`, value: 0 },
			],
			limit: {
				signal: `2 * sqrt(pow(${DONUT_RADIUS} * ${donutProps.holeRatio}, 2) - pow(${donutProps.name}_summaryFontSize * 0.75, 2))`,
			},
		},
	};
};
