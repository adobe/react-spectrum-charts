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
	IconHorizontal,
	IconVertical,
	NullData,
	PercentNumberHorizontal,
	PercentNumberVertical, UndefinedData
} from './BigNumber.story';

describe('BigNumber', () => {
	describe('BigNumber with icon prop passed in', () => {
		test('IconVertical renders with correct icon present', async () => {
			render(<IconVertical {...IconVertical.args}/>);
			const icon = await screen.findByTestId('icon-amusementpark');
			expect(icon).toBeInTheDocument();
			const value = await screen.findByText(IconVertical.args.value ? IconVertical.args.value : '');
			expect(value).toBeInTheDocument();
			const label = await screen.findByText(IconVertical.args.label);
			expect(label).toBeInTheDocument();
		});

		test('IconHorizontal renders with correct icon present', async () => {
			render(<IconHorizontal {...IconHorizontal.args}/>);
			const icon = await screen.findByTestId('icon-calendar');
			expect(icon).toBeInTheDocument();
			const value = await screen.findByText(IconHorizontal.args.value ? IconHorizontal.args.value : '');
			expect(value).toBeInTheDocument();
			const label = await screen.findByText(IconHorizontal.args.label);
			expect(label).toBeInTheDocument();
		});
	});
	describe('BigNumber error states', () => {
		test('NullData renders correct warning icon and text', async () => {
			render(<NullData {...NullData.args} />);
			const errorMessage = await screen.findByText('Unable to load. One or more values are null.');
			expect(errorMessage).toBeInTheDocument();
			const actionMessage = await screen.findByText('Please check incoming data');
			expect(actionMessage).toBeInTheDocument();
			const nullIcon = await screen.findByTestId('alert-circle');
			expect(nullIcon).toBeInTheDocument();
		});

		test('UndefinedData renders appropriate warning icon and text', async () => {
			render(<UndefinedData {...UndefinedData.args} />)
			const errorDescription = await screen.findByText('No data available.');
			const actionText = await screen.findByText('Please verify that data is defined');
			expect(errorDescription).toBeInTheDocument();
			expect(actionText).toBeInTheDocument();
			const undefinedIcon = await screen.findByTestId('vertical-graph');
			expect(undefinedIcon).toBeInTheDocument();
		});
	});
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
