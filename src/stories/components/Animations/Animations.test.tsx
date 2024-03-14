import { findAllMarksByGroupName, findChart, render } from '@test-utils';

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
} from './Animations.story';

describe('Animations', () => {
	test('Area Switch renders properly', async () => {
		render(<AreaSwitch {...AreaSwitch.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
		const areas = await findAllMarksByGroupName(chart, 'area0');
		expect(areas[0]).toHaveAttribute('transform', 'translate(0,0)');
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
	});
});
