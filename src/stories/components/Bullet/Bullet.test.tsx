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
import { findAllMarksByGroupName, findChart, render } from '@test-utils';
import { Bullet } from 'alpha/components/Bullet';

import { Basic } from './Bullet.story';

describe('Bullet', () => {
	// Bullet is not a real React component. This is test just provides test coverage for sonarqube
	test('Bullet pseudo element', () => {
		render(<Bullet />);
	});

	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// bullet` data has 7 segments
		const rects = await findAllMarksByGroupName(chart, 'mark-rect');
		expect(rects.length).toEqual(6);

		// const rules = await findAllMarksByGroupName(chart, 'mark-rule');
		// expect(rules.length).toEqual(7);

		// const bars = await findAllMarksByGroupName(chart, 'mark-rect');
		// expect(bars.length).toEqual(6);
	});
});