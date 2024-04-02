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
import { COLOR_SCALE, HIGHLIGHT_CONTRAST_RATIO, HIGHLIGHTED_SERIES, SERIES_ID } from '@constants';
import { GroupMark, Mark, NumericValueRef, ProductionRule } from 'vega';
import { getOpacityAnimationRules } from '@specBuilder/marks/markUtils';

/**
 * Adds opacity tests for the fill and stroke of marks that use the color scale to set the fill or stroke value.
 */
export const setHoverOpacityForMarks = (marks: Mark[], animations?: boolean, keys?: string[], name?: string) => {
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
		const { update } = mark.encode;
		const { opacity } = update;

		if (opacity !== undefined) {
			// the production rule that sets the fill opacity for this mark
			const opacityRule = getOpacityRule(opacity);
			// the new production rule for highlighting
			const highlightOpacityRule = getHighlightOpacityRule(opacityRule, keys, name);

			if (!Array.isArray(update.opacity)) {
				update.opacity = [];
			}
			//TODO: add comment/doc/etc
			if (animations !== false) {
				console.warn(animations?.valueOf())
				update.opacity = getOpacityAnimationRules();
			} else {
				// need to insert the new test in the second to last slot
				const opacityRuleInsertIndex = Math.max(update.opacity.length - 1, 0);
				update.opacity.splice(opacityRuleInsertIndex, 0, highlightOpacityRule);
			}
		}
	});
};

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

export const getHighlightOpacityRule = (
	opacityRule: ProductionRule<NumericValueRef>,
	keys?: string[],
	name?: string
): { test?: string } & NumericValueRef => {
	let test = `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`;
	if (keys) {
		test = `${name}_highlight && ${name}_highlight !== datum.${keys[0]}`;
	}
	if ('scale' in opacityRule && 'field' in opacityRule) {
		return {
			test,
			signal: `scale('${opacityRule.scale}', datum.${opacityRule.field}) / ${HIGHLIGHT_CONTRAST_RATIO}`,
		};
	}
	if ('signal' in opacityRule) {
		return { test, signal: `${opacityRule.signal} / ${HIGHLIGHT_CONTRAST_RATIO}` };
	}
	if ('value' in opacityRule && typeof opacityRule.value === 'number') {
		return { test, value: opacityRule.value / HIGHLIGHT_CONTRAST_RATIO };
	}
	return { test, value: 1 / HIGHLIGHT_CONTRAST_RATIO };
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
	if (fill && 'scale' in fill && fill.scale === COLOR_SCALE) {
		return true;
	}
	// some marks use a 2d color scale, these will use a signal expression to get the color for that series
	if (fill && 'signal' in fill && fill.signal.includes("scale('colors',")) {
		return true;
	}
	if (stroke && 'scale' in stroke && stroke.scale === COLOR_SCALE) {
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
