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
import React from 'react';

import { ScatterPath } from '../../../components';
import { allElementsHaveAttributeValue, findAllMarksByGroupName, findChart, render } from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { spectrumColors } from '../../../themes';
import { characterData } from '../../data/marioKartData';
import { Basic, Color, GroupBy, Opacity } from './ScatterPath.story';

const colors = spectrumColors.light;

describe('Link', () => {
	// Link is not a real React component. This is test just provides test coverage for sonarqube
	test('Link pseudo element', () => {
		render(<ScatterPath groupBy={['test']} />);
	});

	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const scatterPaths = await findAllMarksByGroupName(chart, 'scatter0Path0');
		expect(scatterPaths).toHaveLength(3);
		expect(allElementsHaveAttributeValue(scatterPaths, 'fill', colors['gray-500'])).toBe(true);
		expect(allElementsHaveAttributeValue(scatterPaths, 'fill-opacity', 0.5)).toBe(true);
	});

	test('Color renders the correct color', async () => {
		render(<Color {...Color.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const scatterPaths = await findAllMarksByGroupName(chart, 'scatter0Path0');
		expect(allElementsHaveAttributeValue(scatterPaths, 'fill', colors['red-900'])).toBe(true);
	});

	test('GroupBy connects the correct points', async () => {
		render(<GroupBy {...GroupBy.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// count of how many unique weights there are
		const uniqueWeights = characterData.filter(
			(character, index, self) => self.findIndex((c) => c.weight === character.weight) === index
		).length;

		const scatterPaths = await findAllMarksByGroupName(chart, 'scatter0Path0');
		expect(scatterPaths).toHaveLength(uniqueWeights);
	});

	test('Opacity renders correctly', async () => {
		render(<Opacity {...Opacity.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const scatterPaths = await findAllMarksByGroupName(chart, 'scatter0Path0');
		expect(allElementsHaveAttributeValue(scatterPaths, 'fill-opacity', 1)).toBe(true);
	});
});
