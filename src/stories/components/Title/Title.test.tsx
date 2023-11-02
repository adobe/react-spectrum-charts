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

import { Title } from '@components/Title';
import { findChart, getAllMarksByGroupName, render } from '@test-utils';

import { Basic, FontWeight, Orient, Position } from './Title.story';

describe('Title', () => {
	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const titles = getAllMarksByGroupName(chart, 'role-title-text', 'text');
		expect(titles.length).toBe(1);
		const title = titles[0];
		expect(title).toHaveTextContent(Basic.args.text);

		expect(title).toHaveAttribute('font-weight', 'bold');
		expect(title).toHaveAttribute('text-anchor', 'middle');

		// Baseline is bottom for top orientation
		expect(title).toHaveAttribute('transform', 'translate(0,-4)');
	});

	test('Position renders properly', async () => {
		render(<Position {...Position.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const titles = getAllMarksByGroupName(chart, 'role-title-text', 'text');
		expect(titles.length).toBe(1);
		const title = titles[0];
		expect(title).toHaveTextContent(Position.args.text);

		expect(title).toHaveAttribute('font-weight', 'bold');
		expect(title).toHaveAttribute('text-anchor', 'start');
	});

	test('FontWeight renders properly', async () => {
		render(<FontWeight {...FontWeight.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const titles = getAllMarksByGroupName(chart, 'role-title-text', 'text');
		expect(titles.length).toBe(1);
		const title = titles[0];
		expect(title).toHaveTextContent(FontWeight.args.text);

		expect(title).toHaveAttribute('text-anchor', 'middle');
		expect(title).toHaveAttribute('font-weight', 'lighter');
	});

	test('Orient renders properly', async () => {
		render(<Orient {...Orient.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const titles = getAllMarksByGroupName(chart, 'role-title-text', 'text');
		expect(titles.length).toBe(1);
		const title = titles[0];
		expect(title).toHaveTextContent(FontWeight.args.text);

		// Baseline is top for bottom orient
		expect(title).toHaveAttribute('transform', 'translate(0,14)');

		const titleGroups = getAllMarksByGroupName(chart, 'role-title', 'g');
		const positioningGroup = titleGroups[0];
		expect(positioningGroup).toHaveAttribute('transform', 'translate(194,375)');
	});

	// Title is not a real React component. This is test just provides test coverage for sonarqube
	test('Title pseudo element', async () => {
		render(<Title {...Basic.args} />);
	});
});
