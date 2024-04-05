import { findChart, render } from '@test-utils';

import {
	AreaSwitch,
	AreaZero,
	BarSwitch,
	BarZero,
	DodgedBarSwitch,
	DodgedBarZero,
	SingleLineSwitch,
	SingleLineZero,
	TrellisHorizontalBarSwitch,
	TrellisHorizontalBarZero,
	TrendlineSwitch,
	TrendlineZero,
} from './Animations.story';

describe('Animations', () => {
	test('Area Switch renders properly', async () => {
		render(<AreaSwitch {...AreaSwitch.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Area Zero renders properly', async () => {
		render(<AreaZero {...AreaZero.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Single Line Switch renders properly', async () => {
		render(<SingleLineSwitch {...SingleLineSwitch.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Single Line Zero renders properly', async () => {
		render(<SingleLineZero {...SingleLineZero.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Trendline Switch renders properly', async () => {
		render(<TrendlineSwitch {...TrendlineSwitch.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Tendline Zero renders properly', async () => {
		render(<TrendlineZero {...TrendlineZero.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Bar Switch renders properly', async () => {
		render(<BarSwitch {...BarSwitch.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Bar Zero renders properly', async () => {
		render(<BarZero {...BarZero.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Dodged Bar Switch renders properly', async () => {
		render(<DodgedBarSwitch {...DodgedBarSwitch.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Dodged Bar Zero renders properly', async () => {
		render(<DodgedBarZero {...DodgedBarZero.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Trellis Horizontal Bar Switch renders properly', async () => {
		render(<TrellisHorizontalBarSwitch {...TrellisHorizontalBarSwitch.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Trellis Horizontal Zero renders properly', async () => {
		render(<TrellisHorizontalBarZero {...TrellisHorizontalBarZero.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// const bars = await findAllMarksByGroupName(chart, 'bar0');
		// expect(bars.length).toEqual(90);
		// click on bar and check where it rendered
		// await clickNthElement(bars, 45);
		// let popoverAnchor = await screen.findByTestId('rsc-popover-anchor');
		// expect(popoverAnchor).toHaveStyle('position: absolute');
		// expect(popoverAnchor).not.toHaveStyle('width: 85.60000000000002px');
		// expect(popoverAnchor).not.toHaveStyle('height: 8.421428571428521px');
		// expect(popoverAnchor).not.toHaveStyle('left: 316.5px');
		// expect(popoverAnchor).not.toHaveStyle('top: 352.30714285714294px');
		// await clickNthElement(bars, 45);
		// await new Promise((r) => setTimeout(r, 3000));
		// await clickNthElement(bars, 45);
		// const popoverAnchor = await screen.findByTestId('rsc-popover-anchor');
		// expect(popoverAnchor).toHaveStyle('width: 85.60000000000002px');
		// expect(popoverAnchor).toHaveStyle('height: 8.421428571428521px');
		// expect(popoverAnchor).toHaveStyle('left: 316.5px');
		// expect(popoverAnchor).toHaveStyle('top: 352.30714285714294px');
	});
});
