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
import { GroupMark, NumericValueRef, ProductionRule, TextEncodeEntry, TextMark, TextValueRef } from 'vega';

import { DONUT_RADIUS, DONUT_SEGMENT_LABEL_MIN_ANGLE, FILTERED_TABLE } from '@spectrum-charts/constants';

import { getTextNumberFormat } from '../textUtils';
import { DonutSpecOptions, SegmentLabelOptions, SegmentLabelSpecOptions } from '../types';

/**
 * Gets the SegmentLabel component from the children if one exists
 * @param donutOptions
 * @returns segmentLabelOptions
 */
const getSegmentLabel = (options: DonutSpecOptions): SegmentLabelSpecOptions | undefined => {
	if (!options.segmentLabels.length) {
		return;
	}
	return applySegmentLabelPropDefaults(options.segmentLabels[0], options);
};

/**
 * Applies all default options, converting SegmentLabelOptions into SegmentLabelSpecOptions
 * @param segmentLabelOptions
 * @param donutOptions
 * @returns SegmentLabelSpecOptions
 */
const applySegmentLabelPropDefaults = (
	{ percent = false, value = false, valueFormat = 'standardNumber', ...options }: SegmentLabelOptions,
	donutOptions: DonutSpecOptions
): SegmentLabelSpecOptions => ({
	donutOptions,
	percent,
	value,
	valueFormat,
	...options,
});

/**
 * Gets the marks for the segment label. If there isn't a segment label, an empty array is returned.
 * @param donutOptions
 * @returns GroupMark[]
 */
export const getSegmentLabelMarks = (donutOptions: DonutSpecOptions): GroupMark[] => {
	const { isBoolean, name } = donutOptions;
	// segment labels are not supported for boolean variants
	if (isBoolean) return [];

	const segmentLabel = getSegmentLabel(donutOptions);
	// if there isn't a segment label, we don't need to do anything
	if (!segmentLabel) return [];

	return [
		{
			name: `${name}_segmentLabelGroup`,
			type: 'group',
			marks: [getSegmentLabelTextMark(segmentLabel), ...getSegmentLabelValueTextMark(segmentLabel)],
		},
	];
};

/**
 * Gets the text mark for the segment label
 * @param segmentLabelOptions
 * @returns TextMark
 */
export const getSegmentLabelTextMark = ({
	labelKey,
	value,
	percent,
	donutOptions,
}: SegmentLabelSpecOptions): TextMark => {
	const { name, color } = donutOptions;
	return {
		type: 'text',
		name: `${name}_segmentLabel`,
		from: { data: FILTERED_TABLE },
		encode: {
			enter: {
				...getBaseSegmentLabelEnterEncode(name),
				text: { field: labelKey ?? color },
				fontWeight: { value: 'bold' },
				dy:
					value || percent
						? {
								signal: `datum['${name}_arcTheta'] <= 0.5 * PI || datum['${name}_arcTheta'] >= 1.5 * PI ? -16 : 0`,
						  }
						: undefined,
			},
			update: positionEncodings,
		},
	};
};

/**
 * Gets the text mark for the segment label values (percent and/or value)
 * @param segmentLabelOptions
 * @returns TextMark[]
 */
export const getSegmentLabelValueTextMark = (options: SegmentLabelSpecOptions): TextMark[] => {
	if (!options.value && !options.percent) return [];
	const { donutOptions } = options;

	return [
		{
			type: 'text',
			name: `${donutOptions.name}_segmentLabelValue`,
			from: { data: FILTERED_TABLE },
			encode: {
				enter: {
					...getBaseSegmentLabelEnterEncode(donutOptions.name),
					text: getSegmentLabelValueText(options),
					dy: {
						signal: `datum['${donutOptions.name}_arcTheta'] <= 0.5 * PI || datum['${donutOptions.name}_arcTheta'] >= 1.5 * PI ? 0 : 16`,
					},
				},
				update: positionEncodings,
			},
		},
	];
};

/**
 * Gets all the standard entry encodes for segment label text marks
 * @param name
 * @returns TextEncodeEntry
 */
const getBaseSegmentLabelEnterEncode = (name: string): TextEncodeEntry => ({
	radius: { signal: `${DONUT_RADIUS} + 6` },
	theta: { field: `${name}_arcTheta` },
	fontSize: getSegmentLabelFontSize(name),
	align: {
		signal: `datum['${name}_arcTheta'] <= PI ? 'left' : 'right'`,
	},
	baseline: {
		// if the center of the arc is in the top half of the donut, the text baseline should be bottom, else top
		signal: `datum['${name}_arcTheta'] <= 0.5 * PI || datum['${name}_arcTheta'] >= 1.5 * PI ? 'bottom' : 'top'`,
	},
});
/**
 * position encodings
 */
const positionEncodings: TextEncodeEntry = {
	x: { signal: 'width / 2' },
	y: { signal: 'height / 2' },
};

/**
 * Gets the text value ref for the segment label values (percent and/or value)
 * @param segmentLabelOptions
 * @returns TextValueRef
 */
export const getSegmentLabelValueText = ({
	donutOptions,
	percent,
	value,
	valueFormat,
}: SegmentLabelSpecOptions): ProductionRule<TextValueRef> | undefined => {
	const percentSignal = `format(datum['${donutOptions.name}_arcPercent'], '.0%')`;
	if (value) {
		// to support `shortNumber` and `shortCurrency` we need to use the consistent logic
		const rules = getTextNumberFormat(valueFormat, donutOptions.metric) as { test?: string; signal: string }[];
		if (percent) {
			// rules will be an array so we need to add the percent to each signal
			return rules.map((rule) => ({
				...rule,
				signal: `${percentSignal} + "\\u00a0\\u00a0" + ${rule.signal}`,
			}));
		}
		return rules;
	}

	if (percent) {
		return { signal: percentSignal };
	}
};

/**
 * Gets the font size for the segment label based on the arc length
 * If the arc length is less than 0.3 radians, the font size is 0
 * @param name
 * @returns NumericValueRef
 */
const getSegmentLabelFontSize = (name: string): ProductionRule<NumericValueRef> => {
	// need to use radians for this. 0.3 radians is about 17 degrees
	// if we used arc length, then showing a label could shrink the overall donut size which could make the arc to small
	// that would hide the label which would make the arc bigger which would show the label and so on
	return [{ test: `datum['${name}_arcLength'] < ${DONUT_SEGMENT_LABEL_MIN_ANGLE}`, value: 0 }, { value: 14 }];
};
