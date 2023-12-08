import { Donut } from '@components/Donut';
import { findAllMarksByGroupName, findChart, render } from '@test-utils';

import { Basic } from './Donut.story';

describe('Donut', () => {
	// Donut is not a real React component. This is test just provides test coverage for sonarqube
	test('Donut pseudo element', () => {
		render(<Donut />);
	});

	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// donut data has 7 segments
		const bars = await findAllMarksByGroupName(chart, 'donut0');
		expect(bars.length).toEqual(7);
	});
});
