import { findChart, render } from '@test-utils';
import {
	AreaPopover,
	BarPopover,
	LineChart,
	ScatterPopover
} from '@stories/components/Animations/AnimationsOpacity.story';

describe('Opacity Animations', () => {
	test('Area Popover renders properly', async () => {
		render(<AreaPopover {...AreaPopover.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Bar Chart renders properly', async () => {
		render(<BarPopover {...BarPopover.args}/>);
		const chart = await  findChart();
		expect(chart).toBeInTheDocument();
	})

	test('Line Chart renders properly', async () => {
		render(<LineChart {...LineChart.args}/>);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Scatter renders properly', async () => {
		render(<ScatterPopover {...ScatterPopover.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

});