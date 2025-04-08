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
import { FilterTransform } from 'vega';

import { FILTERED_TABLE, HIGHLIGHTED_GROUP, MARK_ID, SELECTED_ITEM } from '@spectrum-charts/constants';

import { getLineHighlightedData } from './lineDataUtils';

describe('getLineHighlightedData()', () => {
	test('should include select signal if hasPopover', () => {
		const expr = (
			getLineHighlightedData('line0', MARK_ID, FILTERED_TABLE, true, false).transform?.[0] as FilterTransform
		).expr;
		expect(expr.includes(SELECTED_ITEM)).toBeTruthy();
	});
	test('should not include select signal if does not hasPopover', () => {
		const expr = (
			getLineHighlightedData('line0', MARK_ID, FILTERED_TABLE, false, false).transform?.[0] as FilterTransform
		).expr;
		expect(expr.includes(SELECTED_ITEM)).toBeFalsy();
	});
	test('should use groupId if hadGroupId', () => {
		const expr = (
			getLineHighlightedData('line0', MARK_ID, FILTERED_TABLE, true, true).transform?.[0] as FilterTransform
		).expr;
		expect(expr.includes(HIGHLIGHTED_GROUP)).toBeTruthy();
	});
});
