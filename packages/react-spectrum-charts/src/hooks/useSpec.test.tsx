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
import { renderHook } from '@testing-library/react';
import { buildSpec } from '@spectrum-charts/vega-spec-builder';

import { chartHasChild } from '../utils';
import useSpec from './useSpec';

jest.mock('@spectrum-charts/vega-spec-builder', () => ({
	buildSpec: jest.fn(() => ({ $schema: 'mocked-spec' })),
	baseData: [],
}));

jest.mock('../rscToSbAdapter', () => ({
	rscPropsToSpecBuilderOptions: jest.fn(() => ({})),
}));

jest.mock('../utils', () => ({
	chartHasChild: jest.fn(() => false),
}));

jest.mock('../alpha', () => ({
	Venn: { displayName: 'Venn' },
}));

const mockBuildSpec = jest.mocked(buildSpec);

const baseProps = {
	backgroundColor: 'gray-50',
	children: [],
	colors: [],
	colorScheme: 'light',
	hiddenSeries: [],
	idKey: 'rscMarkId',
	lineTypes: [],
	lineWidths: [],
	s2: false,
	symbolShapes: [],
	symbolSizes: [],
	chartWidth: 400,
	chartHeight: 300,
} as unknown as Parameters<typeof useSpec>[0];

// AN-445759: regression tests for spec memoization — size changes must not trigger re-embed
describe('useSpec memoization', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockBuildSpec.mockReturnValue({} as ReturnType<typeof buildSpec>);
		(chartHasChild as jest.Mock).mockReturnValue(undefined);
	});

	test('does not rebuild spec when only chartWidth changes', () => {
		const { result, rerender } = renderHook(
			({ chartWidth }: { chartWidth: number }) => useSpec({ ...baseProps, chartWidth }),
			{ initialProps: { chartWidth: 400 } }
		);
		const initialSpec = result.current;

		rerender({ chartWidth: 800 });

		expect(result.current).toBe(initialSpec);
		expect(mockBuildSpec).toHaveBeenCalledTimes(1);
	});

	test('does not rebuild spec when only chartHeight changes', () => {
		const { result, rerender } = renderHook(
			({ chartHeight }: { chartHeight: number }) => useSpec({ ...baseProps, chartHeight }),
			{ initialProps: { chartHeight: 300 } }
		);
		const initialSpec = result.current;

		rerender({ chartHeight: 600 });

		expect(result.current).toBe(initialSpec);
		expect(mockBuildSpec).toHaveBeenCalledTimes(1);
	});

	test('rebuilds spec when a non-size prop changes', () => {
		const { rerender } = renderHook(
			({ description }: { description: string }) => useSpec({ ...baseProps, description }),
			{ initialProps: { description: 'initial' } }
		);

		rerender({ description: 'updated' });

		expect(mockBuildSpec).toHaveBeenCalledTimes(2);
	});
});

// Venn bakes dimensions into the spec, so it must rebuild on size changes
describe('useSpec Venn memoization', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockBuildSpec.mockReturnValue({} as ReturnType<typeof buildSpec>);
		(chartHasChild as jest.Mock).mockReturnValue({});
	});

	test('rebuilds spec when chartWidth changes', () => {
		const { rerender } = renderHook(
			({ chartWidth }: { chartWidth: number }) => useSpec({ ...baseProps, chartWidth }),
			{ initialProps: { chartWidth: 400 } }
		);

		rerender({ chartWidth: 800 });

		expect(mockBuildSpec).toHaveBeenCalledTimes(2);
	});

	test('rebuilds spec when chartHeight changes', () => {
		const { rerender } = renderHook(
			({ chartHeight }: { chartHeight: number }) => useSpec({ ...baseProps, chartHeight }),
			{ initialProps: { chartHeight: 300 } }
		);

		rerender({ chartHeight: 600 });

		expect(mockBuildSpec).toHaveBeenCalledTimes(2);
	});
});
