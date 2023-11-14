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
import { HIGHLIGHT_CONTRAST_RATIO, SERIES_ID } from '@constants';
import { GroupMark, Mark, NumericValueRef, ProductionRule } from 'vega';

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
		const { update } = mark.encode;
		const { fillOpacity, strokeOpacity } = update;

		if ('fillOpacity' in update) {
			// the production rule that sets the fill opacity for this mark
			const fillOpacityRule = getOpacityRule(fillOpacity);
			// the new production rule for highlighting
			const highlightFillOpacityRule = getHighlightOpacityRule(fillOpacityRule);

			if (!Array.isArray(update.fillOpacity)) {
				update.fillOpacity = [];
			}
			// // need to insert the new test in the second to last slot
			const fillRuleInsertIndex = Math.max(update.fillOpacity.length - 1, 0);
			update.fillOpacity.splice(fillRuleInsertIndex, 0, highlightFillOpacityRule);
		}

		if ('strokeOpacity' in update) {
			// the production rule that sets the stroke opacity for this mark
			const strokeOpacityRule = getOpacityRule(strokeOpacity);
			// the new production rule for highlighting
			const highlightStrokeOpacityRule = getHighlightOpacityRule(strokeOpacityRule);
			if (!Array.isArray(update.strokeOpacity)) {
				update.strokeOpacity = [];
			}
			// // need to insert the new test in the second to last slot
			const strokeRuleInsertIndex = Math.max(update.strokeOpacity.length - 1, 0);
			update.strokeOpacity.splice(strokeRuleInsertIndex, 0, highlightStrokeOpacityRule);
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
	opacityRule: ProductionRule<NumericValueRef>
): { test?: string } & NumericValueRef => {
	const test = `highlightedSeries && highlightedSeries !== datum.${SERIES_ID}`;
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
