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
import React from 'react';

import { ReferenceLine } from '@components/ReferenceLine';
import { findChart, findMarksByGroupName, render } from '@test-utils';
import { spectrumColors } from '@themes';

import { Basic, Color, Icon } from './AxisReferenceLine.story';

describe('AxisReferenceLine', () => {
	// Axis is not a real React component. This is test just provides test coverage for sonarqube
	test('Render pseudo element', () => {
		render(<ReferenceLine value={0} />);
	});

	test('Reference line renders', async () => {
		render(<Basic {...Basic.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const axisReferenceLine = await findMarksByGroupName(chart, 'axis0ReferenceLine0', 'line');
		expect(axisReferenceLine).toBeInTheDocument();
	});

	test('Color renders', async () => {
		render(<Color {...Color.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const axisReferenceLine = await findMarksByGroupName(chart, 'axis0ReferenceLine0', 'line');
		expect(axisReferenceLine).toBeInTheDocument();
		expect(axisReferenceLine).toHaveAttribute('stroke', spectrumColors.light['blue-500']);
	});

	test('Icon renders', async () => {
		render(<Icon {...Icon.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const axisReferenceLineIcon = await findMarksByGroupName(chart, 'axis0ReferenceLine0_symbol');
		expect(axisReferenceLineIcon).toBeInTheDocument();
	});
});
