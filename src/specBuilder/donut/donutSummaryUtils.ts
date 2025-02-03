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

import { DonutSpecOptions, DonutSummaryOptions, DonutSummarySpecOptions } from '../../types';

/**
 * Gets the DonutSummary component from the children if one exists
 * @param donutOptions
 * @returns
 */
const getDonutSummary = (options: DonutSpecOptions): DonutSummarySpecOptions | undefined => {
	if (!options.donutSummaries.length) {
		return;
	}
	return applyDonutSummaryPropDefaults(options.donutSummaries[0], options);
};

/**
 * Applies all default options, converting DonutSummaryOptions into DonutSummarySpecOptions
 * @param donutSummaryOptions
 * @param donutOptions
 * @returns
 */
const applyDonutSummaryPropDefaults = (
	{ numberFormat = 'shortNumber', ...options }: DonutSummaryOptions,
	donutOptions: DonutSpecOptions
): DonutSummarySpecOptions => ({
	donutOptions,
	numberFormat,
	...options,
});

/**
 * Gets the data for the donut summary
 * @param donutOptions
 * @returns SourceData[]
 */
export const getDonutSummaryData = (donutOptions: DonutSpecOptions): SourceData[] => {
	const donutSummary = getDonutSummary(donutOptions);
	if (!donutSummary || donutOptions.isBoolean) {
		return [];
	}
	return [
		{
			name: `${donutOptions.name}_summaryData`,
			source: FILTERED_TABLE,
			transform: [
				{
					type: 'aggregate',
					fields: [donutOptions.metric],
					ops: ['sum'],
					as: ['sum'],
				},
			],
		},
	];
};

/**
 * Gets the required scales for the donut summary
 * @param donutOptions
 * @returns ThresholdScale[]
 */
export const getDonutSummaryScales = (donutOptions: DonutSpecOptions): ThresholdScale[] => {
	const donutSummary = getDonutSummary(donutOptions);
	if (!donutSummary) {
		return [];
	}
	return [
		// This scale will snap the fontsize to the spectrum font sizes L - XXXXL
		// 28 is the min, 60 is the max.
		{
			name: `${donutOptions.name}_summaryFontSizeScale`,
			type: 'threshold',
			domain: [32, 36, 40, 45, 50, 60],
			range: [28, 32, 36, 40, 45, 50, 60],
		},
	];
};

/**
 * Gets the signals for the donut summary
 * @param donutOptions
 * @returns Signal[]
 */
export const getDonutSummarySignals = (donutOptions: DonutSpecOptions): Signal[] => {
	const donutSummary = getDonutSummary(donutOptions);
	if (!donutSummary) {
		return [];
	}
	const { name: donutName, holeRatio } = donutOptions;
	return [
		{
			name: `${donutName}_summaryFontSize`,
			update: `scale('${donutName}_summaryFontSizeScale', ${DONUT_RADIUS} * ${holeRatio} * ${DONUT_SUMMARY_FONT_SIZE_RATIO})`,
		},
	];
};

/**
 * Gets all the marks for the donut summary
 * @param donutOptions
 * @returns GroupMark[]
 */
export const getDonutSummaryMarks = (options: DonutSpecOptions): GroupMark[] => {
	const donutSummary = getDonutSummary(options);
	if (!donutSummary) {
		return [];
	}
	const marks: GroupMark[] = [];
	if (options.isBoolean) {
		marks.push(getBooleanDonutSummaryGroupMark(donutSummary));
	} else {
		marks.push(getDonutSummaryGroupMark(donutSummary));
	}
	return marks;
};

/**
 * Gets the group mark for the donut summary
 * @param donutSummaryOptions
 * @returns GorupMark
 */
export const getDonutSummaryGroupMark = (options: DonutSummarySpecOptions): GroupMark => {
	const { donutOptions, label } = options;
	const groupMark: Mark = {
		type: 'group',
		name: `${donutOptions.name}_summaryGroup`,
		marks: [
			{
				type: 'text',
				name: `${donutOptions.name}_summaryValue`,
				from: { data: `${donutOptions.name}_summaryData` },
				encode: getSummaryValueEncode(options),
			},
		],
	};
	if (label) {
		groupMark.marks?.push({
			type: 'text',
			name: `${donutOptions.name}_summaryLabel`,
			from: { data: `${donutOptions.name}_summaryData` },
			encode: getSummaryLabelEncode({ ...options, label }),
		});
	}
	return groupMark;
};

/**
 * Gets the group mark for a boolean donut summary
 * @param donutSummaryOptions
 * @returns GroupMark
 */
export const getBooleanDonutSummaryGroupMark = (options: DonutSummarySpecOptions): GroupMark => {
	const { donutOptions, label } = options;
	const groupMark: Mark = {
		type: 'group',
		name: `${donutOptions.name}_percentText`,
		marks: [
			{
				type: 'text',
				name: `${donutOptions.name}_booleanSummaryValue`,
				from: { data: `${donutOptions.name}_booleanData` },
				encode: getSummaryValueEncode(options),
			},
		],
	};
	if (label) {
		groupMark.marks?.push({
			type: 'text',
			name: `${donutOptions.name}_booleanSummaryLabel`,
			from: { data: `${donutOptions.name}_booleanData` },
			encode: getSummaryLabelEncode({ ...options, label }),
		});
	}
	return groupMark;
};

/**
 * Gets the encode for the summary value
 * @param donutSummaryOptions
 * @returns encode
 */
const getSummaryValueEncode = (options: DonutSummarySpecOptions): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
	const { donutOptions, label } = options;
	return {
		update: {
			x: { signal: 'width / 2' },
			y: { signal: 'height / 2' },
			text: getSummaryValueText(options),
			fontSize: [
				{ test: `${DONUT_RADIUS} * ${donutOptions.holeRatio} < ${DONUT_SUMMARY_MIN_RADIUS}`, value: 0 },
				{ signal: `${donutOptions.name}_summaryFontSize` },
			],
			align: { value: 'center' },
			baseline: getSummaryValueBaseline(label),
			limit: getSummaryValueLimit(options),
		},
	};
};

/**
 * Gets the text value for the summary value
 * @param donutSummaryOptions
 * @returns TextValueref
 */
export const getSummaryValueText = ({
	donutOptions,
	numberFormat,
}: DonutSummarySpecOptions): ProductionRule<TextValueRef> => {
	if (donutOptions.isBoolean) {
		return { signal: `format(datum['${donutOptions.metric}'], '.0%')` };
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
 * @param donutSummaryOptions
 * @returns NumericValueRef
 */
export const getSummaryValueLimit = ({ donutOptions, label }: DonutSummarySpecOptions): NumericValueRef => {
	const { holeRatio, name } = donutOptions;
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
 * @param donutSummaryOptions
 * @returns encode
 */
export const getSummaryLabelEncode = ({
	donutOptions,
	label,
}: DonutSummarySpecOptions & { label: string }): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
	return {
		update: {
			x: { signal: 'width / 2' },
			y: { signal: 'height / 2' },
			dy: { signal: `ceil(${donutOptions.name}_summaryFontSize * 0.25)` },
			text: { value: label },
			fontSize: [
				{ test: `${DONUT_RADIUS} * ${donutOptions.holeRatio} < ${DONUT_SUMMARY_MIN_RADIUS}`, value: 0 },
				{ signal: `ceil(${donutOptions.name}_summaryFontSize * 0.5)` },
			],
			align: { value: 'center' },
			baseline: { value: 'top' },
			limit: {
				signal: `2 * sqrt(pow(${DONUT_RADIUS} * ${donutOptions.holeRatio}, 2) - pow(${donutOptions.name}_summaryFontSize * 0.75, 2))`,
			},
		},
	};
};
