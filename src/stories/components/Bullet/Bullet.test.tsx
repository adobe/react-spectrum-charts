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
import { findAllMarksByGroupName, findChart, render, allElementsHaveAttributeValue } from '@test-utils';
import { Bullet } from 'alpha/components/Bullet';

import { Basic } from './Bullet.story';

describe('Bullet', () => {
	// Bullet is not a real React component. This is test just provides test coverage for sonarqube
	test('Bullet pseudo element', () => {
		render(<Bullet />);
	});

	test('Basic bullet renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const rects = await findAllMarksByGroupName(chart, 'bullet0rect');
		expect(rects.length).toEqual(1);

		rects.forEach(rect => {
			// Expect red-500 color
			expect(rect).toHaveAttribute('fill', 'rgb(255, 155, 136)');
		});

		const barLabels = await findAllMarksByGroupName(chart, 'bullet0barlabel', 'text');
		expect(barLabels.length).toEqual(1);

		const amountLabels = await findAllMarksByGroupName(chart, 'bullet0amountlabel', 'text');
		expect(amountLabels.length).toEqual(1);

		const rules = await findAllMarksByGroupName(chart, 'bullet0rule', 'line');
		expect(rules.length).toEqual(1);
	});
});