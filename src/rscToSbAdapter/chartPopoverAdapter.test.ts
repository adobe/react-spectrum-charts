/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { getChartPopoverOptions } from './chartPopoverAdapter';

describe('getChartPopoverOptions()', () => {
	it('should strip out children', () => {
		const options = getChartPopoverOptions({ children: () => null });
		expect(options).not.toHaveProperty('children');
	});
	it('should pass through included props', () => {
		const options = getChartPopoverOptions({ height: 200 });
		expect(options).toHaveProperty('height', 200);
	});
	it('should not add props that are not provided', () => {
		const options = getChartPopoverOptions({});
		expect(options).not.toHaveProperty('height');
	});
});
