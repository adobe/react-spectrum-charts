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
import { Axis } from '../../../components';
import { findChart, getAllAxisLabels, render, screen, within } from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import {
	Basic,
	ControlledLabels,
	DurationLabelFormat,
	MultilineTitle,
	NonLinearAxis,
	NumberFormat,
	SubLabels,
	TickMinStep,
	Time,
	VerticalTimeAxis,
} from './Axis.story';

describe('Axis', () => {
	// Axis is not a real React component. This is test just provides test coverage for sonarqube
	test('Render pseudo element', () => {
		render(<Axis position="left" />);
	});

	test('Renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const axes = await screen.findAllByRole('graphics-symbol');
		expect(axes[0]).toBeInTheDocument();
		expect(axes.length).toEqual(2);
	});

	describe('MultilineTitle', () => {
		test('should render title on two lines', async () => {
			render(<MultilineTitle {...MultilineTitle.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();
			// first line
			expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
			// second line
			expect(screen.getByText('(converted users / total active users)')).toBeInTheDocument();
		});
	});

	describe('percentage', () => {
		test('true: labels are displayed in %', async () => {
			render(<Basic position="left" labelFormat="percentage" />);
			const axis = await screen.findByRole('graphics-symbol');
			expect(within(axis).getByText('100%')).toBeInTheDocument();
		});

		test('false: labels are displayed as normal numbers', async () => {
			render(<Basic position="left" />);
			const axis = await screen.findByRole('graphics-symbol');
			expect(within(axis).getByText('1')).toBeInTheDocument();
		});
	});

	describe('Time axis', () => {
		test('Minute renders properly', async () => {
			render(<Time {...Time.args} granularity="minute" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// make sure labels are visible
			expect(screen.getByText('Dec 2')).toBeInTheDocument();
		});

		test('Hour renders properly', async () => {
			render(<Time {...Time.args} granularity="hour" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// make sure labels are visible
			expect(screen.getByText('Dec 1')).toBeInTheDocument();
		});

		test('Day renders properly', async () => {
			render(<Time {...Time.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// make sure labels are visible
			expect(screen.getByText('30')).toBeInTheDocument();
			expect(screen.getByText('Nov')).toBeInTheDocument();
		});

		test('Week renders properly', async () => {
			render(<Time {...Time.args} granularity="week" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// make sure labels are visible
			expect(await screen.findByText('18')).toBeInTheDocument();
			expect(await screen.findByText('Sep')).toBeInTheDocument();
		});

		test('Month renders properly', async () => {
			render(<Time {...Time.args} granularity="month" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// make sure labels are visible
			expect(await screen.findByText('Feb')).toBeInTheDocument();
			expect(await screen.findByText('2022')).toBeInTheDocument();
		});

		test('Quarter renders properly', async () => {
			render(<Time {...Time.args} granularity="quarter" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// make sure labels are visible
			expect(screen.getAllByText('Q1')[0]).toBeInTheDocument();
			expect(screen.getByText('2020')).toBeInTheDocument();
		});

		test('Year renders properly', async () => {
			render(<Time {...Time.args} granularity="year" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// make sure the year labels are visible
			expect(screen.getByText('2016')).toBeInTheDocument();
		});
	});

	describe('Vertical time axis', () => {
		test('Minute renders properly', async () => {
			render(<VerticalTimeAxis {...VerticalTimeAxis.args} granularity="minute" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// make sure labels are visible and Dec 2 is not repeated
			expect(screen.getByText(/Dec 2.+6:31 PM/)).toBeInTheDocument();
			expect(screen.getByText('6:32 PM')).toBeInTheDocument();
		});

		test('Hour renders properly', async () => {
			render(<VerticalTimeAxis {...VerticalTimeAxis.args} granularity="hour" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// make sure labels are visible
			expect(screen.getByText(/Dec 1.+8 PM/)).toBeInTheDocument();
			expect(screen.getByText('9 PM')).toBeInTheDocument();
		});

		test('Day renders properly', async () => {
			render(<VerticalTimeAxis {...VerticalTimeAxis.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// make sure labels are visible
			expect(screen.getByText(/Nov.+3/)).toBeInTheDocument();
			expect(screen.getByText('4')).toBeInTheDocument();
		});

		test('Week renders properly', async () => {
			render(<VerticalTimeAxis {...VerticalTimeAxis.args} granularity="week" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// make sure labels are visible
			expect(await screen.findByText(/Sep.+11/)).toBeInTheDocument();
			expect(await screen.findByText('18')).toBeInTheDocument();
		});

		test('Month renders properly', async () => {
			render(<VerticalTimeAxis {...VerticalTimeAxis.args} granularity="month" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// make sure labels are visible
			expect(await screen.findByText(/2022.+Jan/)).toBeInTheDocument();
			expect(await screen.findByText('Feb')).toBeInTheDocument();
		});

		test('Quarter renders properly', async () => {
			render(<VerticalTimeAxis {...VerticalTimeAxis.args} granularity="quarter" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// make sure labels are visible
			expect(screen.getByText(/2020.+Q1/)).toBeInTheDocument();
			expect(screen.getAllByText('Q2')[0]).toBeInTheDocument();
		});

		test('Year renders properly', async () => {
			render(<VerticalTimeAxis {...VerticalTimeAxis.args} granularity="year" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			expect(await screen.findByText('2016')).toBeInTheDocument();
		});
	});

	describe('SubLabels', () => {
		test('Sub labels render properly', async () => {
			render(<SubLabels {...SubLabels.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// make sure labels are visible
			expect(screen.getByText('Chrome')).toBeInTheDocument();
			expect(screen.getByText('80.1+')).toBeInTheDocument();
		});
	});

	describe('TickMinStep', () => {
		test('tickMinStep prop is respected in linear axis', async () => {
			render(<TickMinStep {...TickMinStep.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			expect(screen.getByText('5')).toBeInTheDocument();
			expect(screen.queryByText('3')).not.toBeInTheDocument();
		});
		test('when tickMinStep is undefined, it goes to default tick step', async () => {
			const argsWithUndefinedTickMinStep = { ...TickMinStep.args, tickMinStep: undefined };

			render(<TickMinStep {...argsWithUndefinedTickMinStep} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			expect(screen.getByText('2')).toBeInTheDocument();
			expect(screen.queryByText('5')).not.toBeInTheDocument();
		});
		test('tickMinStep is ignored and renders properly with non-linear scale', async () => {
			render(<NonLinearAxis {...NonLinearAxis.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const axes = await screen.findAllByRole('graphics-symbol');
			expect(axes[0]).toBeInTheDocument();
		});
	});

	describe('ControlledLabels', () => {
		test('Axis labels match what is passed in as the labels prop', async () => {
			render(<ControlledLabels {...ControlledLabels.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const axisLabels = getAllAxisLabels(chart);
			expect(axisLabels).toHaveLength(2);

			expect(screen.getByText('Jun 1')).toBeInTheDocument();
			expect(screen.getByText('Jun 29')).toBeInTheDocument();
		});
	});

	describe('NumberFormat', () => {
		test('Should render the number format provided', async () => {
			render(<NumberFormat {...NumberFormat.args} numberFormat=",.2f" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			expect(screen.getByText('2,000,000.00')).toBeInTheDocument();
			expect(screen.getByText('0.00')).toBeInTheDocument();
		});
		test('currency', async () => {
			render(<NumberFormat {...NumberFormat.args} numberFormat="currency" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			expect(screen.getByText('$2,000,000.00')).toBeInTheDocument();
			expect(screen.getByText('$0.00')).toBeInTheDocument();
		});
		test('shortCurrency', async () => {
			render(<NumberFormat {...NumberFormat.args} numberFormat="shortCurrency" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			expect(screen.getByText('$2M')).toBeInTheDocument();
			expect(screen.getByText('$500K')).toBeInTheDocument();
		});
		test('shortCurrency with small range', async () => {
			render(<NumberFormat {...NumberFormat.args} numberFormat="shortCurrency" range={[0, 0.1]} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			expect(screen.getByText('$0.1')).toBeInTheDocument();
			expect(screen.getByText('$0')).toBeInTheDocument();
		});
		test('shortNumber', async () => {
			render(<NumberFormat {...NumberFormat.args} numberFormat="shortNumber" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			expect(screen.getByText('2M')).toBeInTheDocument();
			expect(screen.getByText('500K')).toBeInTheDocument();
		});
		test('standardNumber', async () => {
			render(<NumberFormat {...NumberFormat.args} numberFormat="standardNumber" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			expect(screen.getByText('2,000,000')).toBeInTheDocument();
			expect(screen.getByText('500,000')).toBeInTheDocument();
		});
	});

	describe('DurationLabelFormat', () => {
		test('should render duration labels in HH:mm:ss', async () => {
			render(<DurationLabelFormat {...DurationLabelFormat.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			expect(screen.getByText('0:00')).toBeInTheDocument();
			expect(screen.getByText('1:23:20')).toBeInTheDocument();
			expect(screen.getByText('2:46:40')).toBeInTheDocument();
		});
	});
});
