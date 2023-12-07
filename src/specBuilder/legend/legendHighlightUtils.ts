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
import { ANIMATION_COLOR_SIGNAL, HIGHLIGHT_CONTRAST_RATIO, SERIES_ID } from '@constants';
import { EncodeEntry, GroupMark, Mark, NumericValueRef, ProductionRule } from 'vega';

/**
 * Adds opacity tests for the fill and stroke of marks that use the color scale to set the fill or stroke value.
 */
export const setHoverOpacityForMarks = (marks: Mark[]) => {
	if (!marks.length) return;
	const flatMarks = flattenMarks(marks);
	const seriesMarks = flatMarks.filter(markUsesSeriesColorScale);
	seriesMarks.forEach((mark) => {
		// need to drill down to the prop we need to set and add missing properties if needed
		if (!mark.encode) {
			mark.encode = { update: {} };
		}
		if (!mark.encode.update) {
			mark.encode.update = {};
		}

		setFillStrokeOpacityForHoveredSeries(mark.encode as EncodeEntry, 'fillOpacity');
		setFillStrokeOpacityForHoveredSeries(mark.encode as EncodeEntry, 'strokeOpacity');
	});
};

const setFillStrokeOpacityForHoveredSeries = (entry: EncodeEntry, opacityType: string) => {
	const { update } = entry;
	if (!update || !(opacityType in update)) return;

	const opacity = update[opacityType];
	// the production rule that sets the opacity for this mark
	const opacityRule = getOpacityRule(opacity);

	// the new production rule for highlighting
	const highlightOpacityRules = getHighlightOpacityRules(opacityRule);
	if (!Array.isArray(update[opacityType])) {
		update[opacityType] = [];
	}

	// need to insert the new test in the second to last slot
	const ruleInsertIndex = Math.max(update[opacityType].length - 1, 0);
	update[opacityType].splice(ruleInsertIndex, 0, ...highlightOpacityRules);
};

// !! This function assumes that the final opacity rule is the one that should be used for fully opaque marks
export const getOpacityRule = (
	opacityRule: ProductionRule<NumericValueRef> | undefined
): ProductionRule<NumericValueRef> => {
	if (opacityRule) {
		// if it's an array and length > 0, get the last value
		if (Array.isArray(opacityRule)) {
			if (opacityRule.length > 0) {
				return opacityRule[opacityRule.length - 1];
			}
		} else {
			return opacityRule;
		}
	}
	return { value: 1 };
};

// This function is meant to augment the chart marks' opacity rules with a test for whether the series is highlighted,
// and is not for the legend entries. The legend entries are handled in the legend spec builder.
export const getHighlightOpacityRules = (
	opacityRule: ProductionRule<NumericValueRef>
): ({ test?: string } & NumericValueRef)[] => {
	const test1 = `highlightedSeries && highlightedSeries !== datum.${SERIES_ID}`;
	const test2 = `!highlightedSeries && highlightedSeries_prev && highlightedSeries_prev !== datum.${SERIES_ID}`;

	let opacityValue: string;

	if ('scale' in opacityRule && 'field' in opacityRule) {
		opacityValue = `scale('${opacityRule.scale}', datum.${opacityRule.field}) / ${HIGHLIGHT_CONTRAST_RATIO}`;
	} else if ('signal' in opacityRule) {
		// if the signal already includes the contrast ratio, don't add it again
		opacityValue = opacityRule.signal.includes(` / ${HIGHLIGHT_CONTRAST_RATIO}`)
			? opacityRule.signal
			: `${opacityRule.signal} / ${HIGHLIGHT_CONTRAST_RATIO}`;
	} else if ('value' in opacityRule && typeof opacityRule.value === 'number') {
		opacityValue = `${opacityRule.value / HIGHLIGHT_CONTRAST_RATIO}`;
	} else {
		opacityValue = `${1 / HIGHLIGHT_CONTRAST_RATIO}`;
	}

	const signal = `max(${ANIMATION_COLOR_SIGNAL}, ${opacityValue})`;

	return [
		{ test: test1, signal },
		{ test: test2, signal },
	];
};

/**
 * Determines if the supplied mark uses the color scale to set the fill or stroke value.
 * This is used to determine if we need to set the opacity for the mark when it is hovered
 * @param mark
 * @returns boolean
 */
export const markUsesSeriesColorScale = (mark: Mark): boolean => {
	const enter = mark.encode?.enter;
	if (!enter) return false;
	const { fill, stroke } = enter;
	if (fill && 'scale' in fill && fill.scale === 'color') {
		return true;
	}
	// some marks use a 2d color scale, these will use a signal expression to get the color for that series
	if (fill && 'signal' in fill && fill.signal.includes("scale('colors',")) {
		return true;
	}
	if (stroke && 'scale' in stroke && stroke.scale === 'color') {
		return true;
	}
	return false;
};

/**
 * Recursively flattens all nested marks into a flat array
 * @param marks
 * @returns
 */
export const flattenMarks = (marks: Mark[]): Mark[] => {
	let result = marks;
	for (const mark of marks) {
		if (isGroupMark(mark) && mark.marks) {
			result = [...result, ...flattenMarks(mark.marks)];
		}
	}
	return result;
};

const isGroupMark = (mark: Mark): mark is GroupMark => {
	return mark.type === 'group';
};
