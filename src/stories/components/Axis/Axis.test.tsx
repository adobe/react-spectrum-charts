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
import React from 'react';

import '@matchMediaMock';
import { Axis } from '@rsc';
import { findChart, getAllAxisLabels, render, screen, within } from '@test-utils';

import { Basic, ControlledLabels, NonLinearAxis, SubLabels, TickMinStep, Time } from './Axis.story';

describe('Axis', () => {
	test('Renders component properly', async () => {
		render(<Basic {...Basic.args} />);
		const axes = await screen.findAllByRole('graphics-symbol');
		expect(axes[0]).toBeInTheDocument();
		expect(axes.length).toEqual(2);
	});

	// Axis is not a real React component. This is test just provides test coverage for sonarqube
	test('Render pseudo element', () => {
		render(<Axis position="left" />);
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
			expect(screen.getByText('11')).toBeInTheDocument();
			expect(screen.getByText('Sep')).toBeInTheDocument();
		});

		test('Month renders properly', async () => {
			render(<Time {...Time.args} granularity="month" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// make sure labels are visible
			expect(screen.getByText('Jan')).toBeInTheDocument();
			expect(screen.getByText('2022')).toBeInTheDocument();
		});

		test('Quarter renders properly', async () => {
			render(<Time {...Time.args} granularity="quarter" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// make sure labels are visible
			expect(screen.getAllByText('Q1')[0]).toBeInTheDocument();
			expect(screen.getByText('2020')).toBeInTheDocument();
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
});
