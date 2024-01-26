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
import { render, screen } from '@test-utils';

import {
	CompactNumberHorizontal,
	CompactNumberVertical,
	CurrencyNumberHorizontal,
	CurrencyNumberVertical,
	GroupedNumberHorizontal,
	GroupedNumberVertical,
	PercentNumberHorizontal,
	PercentNumberVertical,
} from './BigNumber.story';

describe('BigNumber', () => {
	describe('BigNumber using numberFormat', () => {
		test('CompactNumberHorizontal renders with formatted value', async () => {
			render(<CompactNumberHorizontal {...CompactNumberHorizontal.args} />);
			const formattedValue = await screen.findByText('2.6K');
			expect(formattedValue).toBeInTheDocument();
		});

		test('CompactNumberVertical renders with formatted value', async () => {
			render(<CompactNumberVertical {...CompactNumberVertical.args} />);
			const formattedValue = await screen.findByText('2.6K');
			expect(formattedValue).toBeInTheDocument();
		});

		test('CurrencyNumberHorizontal renders with formatted value', async () => {
			render(<CurrencyNumberHorizontal {...CurrencyNumberHorizontal.args} />);
			const formattedValue = await screen.findByText('$25.55');
			expect(formattedValue).toBeInTheDocument();
		});

		test('CurrencyNumberVertical renders with formatted value', async () => {
			render(<CurrencyNumberVertical {...CurrencyNumberVertical.args} />);
			const formattedValue = await screen.findByText('$25.55');
			expect(formattedValue).toBeInTheDocument();
		});

		test('GroupedNumberHorizontal renders with formatted value', async () => {
			render(<GroupedNumberHorizontal {...GroupedNumberHorizontal.args} />);
			const formattedValue = await screen.findByText('2,555');
			expect(formattedValue).toBeInTheDocument();
		});

		test('GroupedNumberVertical renders with formatted value', async () => {
			render(<GroupedNumberVertical {...GroupedNumberVertical.args} />);
			const formattedValue = await screen.findByText('2,555');
			expect(formattedValue).toBeInTheDocument();
		});

		test('PercentNumberHorizontal renders with formatted value', async () => {
			render(<PercentNumberHorizontal {...PercentNumberHorizontal.args} />);
			const formattedValue = await screen.findByText('26%');
			expect(formattedValue).toBeInTheDocument();
		});

		test('PercentNumberVertical renders with formatted value', async () => {
			render(<PercentNumberVertical {...PercentNumberVertical.args} />);
			const formattedValue = await screen.findByText('26%');
			expect(formattedValue).toBeInTheDocument();
		});
	});
});
