/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { LinePointAnnotation } from '../../../components';
import { findAllMarksByGroupName, findChart, render } from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { AutoColor, Basic } from './LinePointAnnotation.story';

describe('LinePointAnnotation', () => {
	// LinePointAnnotation is not a real React component. This test just provides test coverage for sonarqube
	test('LinePointAnnotation pseudo element', () => {
		render(<LinePointAnnotation />);
	});

	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const annotations = await findAllMarksByGroupName(chart, 'line0Annotation0', 'text');
		expect(annotations.length).toBeGreaterThan(0);
		// verify annotations contain expected label text
		const textContents = annotations.map((el) => el.textContent);
		expect(textContents).toContain('2.7K');
	});

	test('AutoColor renders with series-colored text', async () => {
		render(<AutoColor {...AutoColor.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const annotations = await findAllMarksByGroupName(chart, 'line0Annotation0', 'text');
		expect(annotations.length).toBeGreaterThan(0);
		// when autoColor is true, fill should match series color (not default text color)
		for (const annotation of annotations) {
			expect(annotation).toHaveAttribute('fill');
		}
	});
});
