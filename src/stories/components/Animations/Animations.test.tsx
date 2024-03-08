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
});
