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
import React from "react";

import '@matchMediaMock';
import { Scatter } from '@rsc';
import {
	findChart,
	render,
	screen,
} from '@test-utils';

import { Basic } from "./Scatter.story";

describe("Scatter", () => {
	// Scatter is not a real React component. This is test just provides test coverage for sonarqube
	test('Scatter pseudo element', () => {
		render(<Scatter />);
	});

	test("Basic renders properly", async () => {
		render(<Basic {...Basic.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
		// TODO: add expect statements for the basic behavior of Scatter here
	});
		// TODO: add tests for each variation of Scatter here
});
