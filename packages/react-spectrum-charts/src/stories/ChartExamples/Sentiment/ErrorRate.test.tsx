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
import { spectrumColors } from '@spectrum-charts/themes';

import { findChart, findMarksByGroupName, render } from '../../../test-utils';
import { ErrorRate } from './ErrorRate.story';

const colors = spectrumColors.light;

describe('ErrorRate', () => {
	let chart: HTMLElement;

	beforeEach(async () => {
		render(<ErrorRate />);

		chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('should plot 3 reference lines', async () => {
		const negativeReferenceLine = await findMarksByGroupName(chart, 'axis0ReferenceLine0', 'line');
		expect(negativeReferenceLine).toBeInTheDocument();
		expect(negativeReferenceLine).toHaveAttribute('stroke', colors['red-800']);

		const neutralReferenceLine = await findMarksByGroupName(chart, 'axis0ReferenceLine1', 'line');
		expect(neutralReferenceLine).toBeInTheDocument();
		expect(neutralReferenceLine).toHaveAttribute('stroke', colors['blue-800']);

		const positiveReferenceLine = await findMarksByGroupName(chart, 'axis0ReferenceLine2', 'line');
		expect(positiveReferenceLine).toBeInTheDocument();
		expect(positiveReferenceLine).toHaveAttribute('stroke', colors['green-800']);
	});

	test('icons should be colored correctly', async () => {
		const negativeIcon = await findMarksByGroupName(chart, 'axis0ReferenceLine0_symbol');
		expect(negativeIcon).toBeInTheDocument();
		expect(negativeIcon).toHaveAttribute('fill', colors['red-800']);

		const neutralIcon = await findMarksByGroupName(chart, 'axis0ReferenceLine1_symbol');
		expect(neutralIcon).toBeInTheDocument();
		expect(neutralIcon).toHaveAttribute('fill', colors['blue-800']);

		const positiveIcon = await findMarksByGroupName(chart, 'axis0ReferenceLine2_symbol');
		expect(positiveIcon).toBeInTheDocument();
		expect(positiveIcon).toHaveAttribute('fill', colors['green-800']);
	});
	test('referenceLines should be drawn behind the line data', () => {
		const markGroups = chart.querySelectorAll('.role-frame.root > g > g > g');
		console.log(markGroups.length);

		const positiveReferenceLineIndex = Array.from(markGroups).findIndex((g) =>
			g.classList.contains('axis0ReferenceLine0')
		);
		const lineIndex = Array.from(markGroups).findIndex((g) => g.classList.contains('line0_group'));

		expect(positiveReferenceLineIndex).toBeLessThan(lineIndex);
	});
});
