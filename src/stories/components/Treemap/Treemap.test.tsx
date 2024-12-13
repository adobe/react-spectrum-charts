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
import { Treemap } from '@rsc/alpha';
import { findChart, render } from '@test-utils';

import { Basic } from './Treemap.story';

describe('Donut', () => {
	// Donut is not a real React component. This is test just provides test coverage for sonarqube
	test('Donut pseudo element', () => {
		render(<Treemap />);
	});

	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// tree data has 7 segments??
		// const bars = await findAllMarksByGroupName(chart, 'treemap0');
		// expect(bars.length).toEqual(7);
	});
});
