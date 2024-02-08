import { findAllMarksByGroupName, findChart, findMarksByGroupName, render } from '@test-utils';
import { spectrumColors } from '@themes';

import { FeatureMatrix } from './FeatureMatrix.story';

const colors = spectrumColors.light;

describe('FeatureMatrix', () => {
	test('Single series should render correctly', async () => {
		render(<FeatureMatrix {...FeatureMatrix.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'scatter0');
		expect(points).toHaveLength(6);

		// point styling
		const point = points[0];
		expect(point).toHaveAttribute('fill', colors['categorical-100']);
		expect(point).toHaveAttribute('fill-opacity', '1');
		expect(point).toHaveAttribute('stroke-width', '0');

		// trendline styling
		const trendline = await findMarksByGroupName(chart, 'scatter0Trendline0');
		expect(trendline).toBeInTheDocument();
		expect(trendline).toHaveAttribute('stroke', colors['categorical-100']);
		expect(trendline).toHaveAttribute('stroke-width', '1');
		expect(trendline).toHaveAttribute('stroke-dasharray', '');
	});
});
