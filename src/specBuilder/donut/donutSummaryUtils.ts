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
import { DONUT_RADIUS, DONUT_SUMMARY_FONT_SIZE_RATIO, DONUT_SUMMARY_MIN_RADIUS, FILTERED_TABLE } from '@constants';
import { DonutSummary } from '@rsc/alpha';
import { getTextNumberFormat } from '@specBuilder/textUtils';
import {
	EncodeEntryName,
	GroupMark,
	Mark,
	NumericValueRef,
	ProductionRule,
	Signal,
	SourceData,
	TextBaselineValueRef,
	TextEncodeEntry,
	TextValueRef,
	ThresholdScale,
} from 'vega';

import { DonutSpecProps, DonutSummaryElement, DonutSummaryProps, DonutSummarySpecProps } from '../../types';

/**
 * Gets the DonutSummary component from the children if one exists
 * @param donutProps
 * @returns
 */
const getDonutSummary = (props: DonutSpecProps): DonutSummarySpecProps | undefined => {
	const donutSummary = props.children.find((child) => child.type === DonutSummary) as DonutSummaryElement;
	if (!donutSummary) {
		return;
	}
	return applyDonutSummaryPropDefaults(donutSummary.props, props);
};

/**
 * Applies all default props, converting DonutSummaryProps into DonutSummarySpecProps
 * @param donutSummaryProps
 * @param donutProps
 * @returns
 */
const applyDonutSummaryPropDefaults = (
	{ numberFormat = 'shortNumber', ...props }: DonutSummaryProps,
	donutProps: DonutSpecProps
): DonutSummarySpecProps => ({
	donutProps,
	numberFormat,
	...props,
});

/**
 * Gets the data for the donut summary
 * @param donutProps
 * @returns SourceData[]
 */
export const getDonutSummaryData = (donutProps: DonutSpecProps): SourceData[] => {
	const donutSummary = getDonutSummary(donutProps);
	if (!donutSummary || donutProps.isBoolean) {
		return [];
	}
	return [
		{
			name: `${donutProps.name}_summaryData`,
			source: FILTERED_TABLE,
			transform: [
				{
					type: 'aggregate',
					fields: [donutProps.metric],
					ops: ['sum'],
					as: ['sum'],
				},
			],
		},
	];
};

/**
 * Gets the required scales for the donut summary
 * @param donutProps
 * @returns ThresholdScale[]
 */
export const getDonutSummaryScales = (donutProps: DonutSpecProps): ThresholdScale[] => {
	const donutSummary = getDonutSummary(donutProps);
	if (!donutSummary) {
		return [];
	}
	return [
		// This scale will snap the fontsize to the spectrum font sizes L - XXXXL
		// 28 is the min, 60 is the max.
		{
			name: `${donutProps.name}_summaryFontSizeScale`,
			type: 'threshold',
			domain: [32, 36, 40, 45, 50, 60],
			range: [28, 32, 36, 40, 45, 50, 60],
		},
	];
};

/**
 * Gets the signals for the donut summary
 * @param donutProps
 * @returns Signal[]
 */
export const getDonutSummarySignals = (donutProps: DonutSpecProps): Signal[] => {
	const donutSummary = getDonutSummary(donutProps);
	if (!donutSummary) {
		return [];
	}
	const { name: donutName, holeRatio } = donutProps;
	return [
		{
			name: `${donutName}_summaryFontSize`,
			update: `scale('${donutName}_summaryFontSizeScale', ${DONUT_RADIUS} * ${holeRatio} * ${DONUT_SUMMARY_FONT_SIZE_RATIO})`,
		},
	];
};

/**
 * Gets all the marks for the donut summary
 * @param donutProps
 * @returns GroupMark[]
 */
export const getDonutSummaryMarks = (props: DonutSpecProps): GroupMark[] => {
	const donutSummary = getDonutSummary(props);
	if (!donutSummary) {
		return [];
	}
	const marks: GroupMark[] = [];
	if (props.isBoolean) {
		marks.push(getBooleanDonutSummaryGroupMark(donutSummary));
	} else {
		marks.push(getDonutSummaryGroupMark(donutSummary));
	}
	return marks;
};

/**
 * Gets the group mark for the donut summary
 * @param donutSummaryProps
 * @returns GorupMark
 */
export const getDonutSummaryGroupMark = (props: DonutSummarySpecProps): GroupMark => {
	const { donutProps, label } = props;
	const groupMark: Mark = {
		type: 'group',
		name: `${donutProps.name}_summaryGroup`,
		marks: [
			{
				type: 'text',
				name: `${donutProps.name}_summaryValue`,
				from: { data: `${donutProps.name}_summaryData` },
				encode: getSummaryValueEncode(props),
			},
		],
	};
	if (label) {
		groupMark.marks?.push({
			type: 'text',
			name: `${donutProps.name}_summaryLabel`,
			from: { data: `${donutProps.name}_summaryData` },
			encode: getSummaryLabelEncode({ ...props, label }),
		});
	}
	return groupMark;
};

/**
 * Gets the group mark for a boolean donut summary
 * @param donutSummaryProps
 * @returns GroupMark
 */
export const getBooleanDonutSummaryGroupMark = (props: DonutSummarySpecProps): GroupMark => {
	const { donutProps, label } = props;
	const groupMark: Mark = {
		type: 'group',
		name: `${donutProps.name}_percentText`,
		marks: [
			{
				type: 'text',
				name: `${donutProps.name}_booleanSummaryValue`,
				from: { data: `${donutProps.name}_booleanData` },
				encode: getSummaryValueEncode(props),
			},
		],
	};
	if (label) {
		groupMark.marks?.push({
			type: 'text',
			name: `${donutProps.name}_booleanSummaryLabel`,
			from: { data: `${donutProps.name}_booleanData` },
			encode: getSummaryLabelEncode({ ...props, label }),
		});
	}
	return groupMark;
};

/**
 * Gets the encode for the summary value
 * @param donutSummaryProps
 * @returns encode
 */
const getSummaryValueEncode = (props: DonutSummarySpecProps): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
	const { donutProps, label } = props;
	return {
		update: {
			x: { signal: 'width / 2' },
			y: { signal: 'height / 2' },
			text: getSummaryValueText(props),
			fontSize: [
				{ test: `${DONUT_RADIUS} * ${donutProps.holeRatio} < ${DONUT_SUMMARY_MIN_RADIUS}`, value: 0 },
				{ signal: `${donutProps.name}_summaryFontSize` },
			],
			align: { value: 'center' },
			baseline: getSummaryValueBaseline(label),
			limit: getSummaryValueLimit(props),
		},
	};
};

/**
 * Gets the text value for the summary value
 * @param donutSummaryProps
 * @returns TextValueref
 */
export const getSummaryValueText = ({
	donutProps,
	numberFormat,
}: DonutSummarySpecProps): ProductionRule<TextValueRef> => {
	if (donutProps.isBoolean) {
		return { signal: `format(datum['${donutProps.metric}'], '.0%')` };
	}
	return [...getTextNumberFormat(numberFormat, 'sum'), { field: 'sum' }];
};

/**
 * Gets the baseline for the summary value
 * @param label
 * @returns TextBaselineValueRef
 */
export const getSummaryValueBaseline = (label?: string): TextBaselineValueRef => {
	if (label) {
		return { value: 'alphabetic' };
	}
	// If there isn't a label, the text should be vertically centered
	return { value: 'middle' };
};

/**
 * Gets the limit for the summary value
 * @param donutSummaryProps
 * @returns NumericValueRef
 */
export const getSummaryValueLimit = ({ donutProps, label }: DonutSummarySpecProps): NumericValueRef => {
	const { holeRatio, name } = donutProps;
	// if there isn't a label, the height of the font from the center of the donut is 1/2 the font size
	const fontHeight = label ? `${name}_summaryFontSize` : `${name}_summaryFontSize * 0.5`;
	const donutInnerRadius = `${DONUT_RADIUS} * ${holeRatio}`;

	return {
		// This is the max length of the text that can be displayed in the donut summary
		// If the text is longer than this, it will be truncated
		// It is calculated using the Pythagorean theorem
		signal: `2 * sqrt(pow(${donutInnerRadius}, 2) - pow(${fontHeight}, 2))`,
	};
};

/**
 * Gets the encode for the metric label
 * @param donutSummaryProps
 * @returns encode
 */
export const getSummaryLabelEncode = ({
	donutProps,
	label,
}: DonutSummarySpecProps & { label: string }): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
	return {
		update: {
			x: { signal: 'width / 2' },
			y: { signal: 'height / 2' },
			dy: { signal: `ceil(${donutProps.name}_summaryFontSize * 0.25)` },
			text: { value: label },
			fontSize: [
				{ test: `${DONUT_RADIUS} * ${donutProps.holeRatio} < ${DONUT_SUMMARY_MIN_RADIUS}`, value: 0 },
				{ signal: `ceil(${donutProps.name}_summaryFontSize * 0.5)` },
			],
			align: { value: 'center' },
			baseline: { value: 'top' },
			limit: {
				signal: `2 * sqrt(pow(${DONUT_RADIUS} * ${donutProps.holeRatio}, 2) - pow(${donutProps.name}_summaryFontSize * 0.75, 2))`,
			},
		},
	};
};
