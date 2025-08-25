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
import React from "react";

import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { AxisThumbnail } from '../../../components';
import {
	findChart,
	render,
} from '../../../test-utils';

import { Basic } from "./AxisThumbnail.story";

describe("AxisThumbnail", () => {
	// AxisThumbnail is not a real React component. This is test just provides test coverage for sonarqube
	test('AxisThumbnail pseudo element', () => {
		render(<AxisThumbnail />);
	});

	test("Basic renders properly", async () => {
		render(<Basic {...Basic.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});
});
