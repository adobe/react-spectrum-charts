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

import { getTrellisAxisProps } from './axisTrellisUtils';

describe('getTrellisAxisProps()', () => {
	test('should generate trellis axis props for x axis', () => {
		const trellisAxisProps = getTrellisAxisProps('xTrellisBand');
		expect(trellisAxisProps).toHaveProperty('position', 'top');
		expect(trellisAxisProps).toHaveProperty('vegaLabelOffset', { signal: "bandwidth('xTrellisBand') / -2" });
		expect(trellisAxisProps).toHaveProperty('vegaLabelPadding', 8);
	});
	test('should generate trellis axis props for y axis', () => {
		const trellisAxisProps = getTrellisAxisProps('yTrellisBand');
		expect(trellisAxisProps).toHaveProperty('position', 'left');
		expect(trellisAxisProps).toHaveProperty('vegaLabelOffset', {
			signal: "bandwidth('yTrellisBand') / -2 - 8",
		});
		expect(trellisAxisProps).toHaveProperty('vegaLabelPadding', 0);
	});
	test('should retrun empty object if not for a trellis axis', () => {
		expect(getTrellisAxisProps('xLinear')).toEqual({});
	});
});
