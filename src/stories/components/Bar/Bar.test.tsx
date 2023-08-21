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

import '@matchMediaMock';
import { Bar, findAllMarksByGroupName, findPrism } from '@prism';
import { render } from '@testing-library/react';
import React from 'react';

import { Basic, Opacity, PaddingRatio, WithAnnotation } from './Bar.story';
import { Color, DodgedStacked } from './DodgedBar.story';
import { Basic as StackedBasic } from './StackedBar.story';

describe('Bar', () => {
	// Bar is not a real React component. This is test just provides test coverage for sonarqube
	test('Bar pseudo element', () => {
		render(<Bar />);
	});

	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		// get bars
		const bars = await findAllMarksByGroupName(prism, 'rect0');
		expect(bars.length).toEqual(5);
	});

	test('Opacity renders properly', async () => {
		render(<Opacity {...Opacity.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		// get bars
		const bars = await findAllMarksByGroupName(prism, 'rect0');
		expect(bars[0].getAttribute('fill-opacity')).toEqual('0.75');
	});

	test('Padding Ratio renders properly', async () => {
		render(<PaddingRatio {...PaddingRatio.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		// get bars
		const bars = await findAllMarksByGroupName(prism, 'rect0');
		expect(bars.length).toEqual(5);
	});

	test('With Annotation renders properly', async () => {
		render(<WithAnnotation {...WithAnnotation.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		// get bars
		const bars = await findAllMarksByGroupName(prism, 'rect0');
		expect(bars.length).toEqual(5);

		// get annotations
		const labels = await findAllMarksByGroupName(prism, 'rect0AnnotationText', 'text');
		expect(labels.length).toEqual(5);
	});

	test('Dodged Basic renders properly', async () => {
		render(<Color {...Color.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		// get bars
		const bars = await findAllMarksByGroupName(prism, 'rect0');
		expect(bars.length).toEqual(9);
	});

	test('Dodged Stacked renders properly', async () => {
		render(<DodgedStacked {...DodgedStacked.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		// get bars
		const bars = await findAllMarksByGroupName(prism, 'rect0');
		expect(bars.length).toEqual(18);
	});

	test('Stacked Basic renders properly', async () => {
		render(<StackedBasic {...StackedBasic.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		// get bars
		const bars = await findAllMarksByGroupName(prism, 'rect0');
		expect(bars.length).toEqual(9);
	});
});
