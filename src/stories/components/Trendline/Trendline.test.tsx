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
import { Trendline } from '@prism';
import { findAllMarksByGroupName, findPrism, render, screen } from '@test-utils';
import React from 'react';

import { Basic } from './Trendline.story';

describe('Trendline', () => {
	// Trendline is not a real React component. This is test just provides test coverage for sonarqube
	test('Trendline pseudo element', () => {
		render(<Trendline />);
	});

	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		const trendlines = await findAllMarksByGroupName(prism, 'line0Trendline0');
		expect(trendlines).toHaveLength(4);
		expect(trendlines[0]).toHaveAttribute('stroke-dasharray', '7,4');
		expect(trendlines[0]).toHaveAttribute('stroke-width', '1.5');
	});
});
