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
import { View } from 'vega';

import { resizeView } from './VegaChart';

const mockRunAsync = jest.fn().mockResolvedValue(undefined);
const mockResize = jest.fn().mockReturnThis();
const mockHeight = jest.fn().mockReturnThis();
const mockWidth = jest.fn().mockReturnThis();

const createMockView = (): View =>
	({
		runAsync: mockRunAsync,
		resize: mockResize,
		height: mockHeight,
		width: mockWidth,
	}) as unknown as View;

describe('resizeView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('calls width, height, resize, and runAsync when view exists and dimensions are valid', () => {
		const mockView = createMockView();

		resizeView(mockView, 800, 600);

		expect(mockWidth).toHaveBeenCalledWith(800);
		expect(mockHeight).toHaveBeenCalledWith(600);
		expect(mockResize).toHaveBeenCalled();
		expect(mockRunAsync).toHaveBeenCalled();
	});

	test('does not call view methods when view is undefined', () => {
		resizeView(undefined, 800, 600);

		expect(mockWidth).not.toHaveBeenCalled();
		expect(mockHeight).not.toHaveBeenCalled();
		expect(mockResize).not.toHaveBeenCalled();
		expect(mockRunAsync).not.toHaveBeenCalled();
	});

	test('does not call view methods when width is 0', () => {
		const mockView = createMockView();

		resizeView(mockView, 0, 600);

		expect(mockWidth).not.toHaveBeenCalled();
	});

	test('does not call view methods when height is 0', () => {
		const mockView = createMockView();

		resizeView(mockView, 800, 0);

		expect(mockWidth).not.toHaveBeenCalled();
	});
});
