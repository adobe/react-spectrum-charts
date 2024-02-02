import { ReactElement } from 'react';

import useChartProps from '@hooks/useChartProps';
import { Axis, Chart, Legend, Scatter } from '@rsc';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

export default {
	title: 'RSC/Chart/Examples',
	component: Chart,
};

const basicData = [
	{
		event: 'Open-editor',
		segment: 'Day  1 Exporter',
		dauPercent: 0.1534,
		countAvg: 1.92,
	},
	{
		event: 'View-express-home',
		segment: 'Day  1 Exporter',
		dauPercent: 0.1327,
		countAvg: 1.66,
	},
	{
		event: 'View-quickaction-editor',
		segment: 'Day  1 Exporter',
		dauPercent: 0.0183,
		countAvg: 3.95,
	},
	{
		event: 'Generate-image',
		segment: 'Day  1 Exporter',
		dauPercent: 0.0915,
		countAvg: 1.84,
	},
	{
		event: 'Generate-text-effects',
		segment: 'Day  1 Exporter',
		dauPercent: 0.0277,
		countAvg: 4.25,
	},
	{
		event: 'Search-inspire',
		segment: 'Day  1 Exporter',
		dauPercent: 0.0763,
		countAvg: 6.28,
	},
];

const FeatureMatrixStory: StoryFn<typeof Chart> = (args): ReactElement => {
	const chartProps = useChartProps(args);

	return (
		<Chart {...chartProps} debug>
			<Axis position="bottom" ticks grid title="Percentage of daily users (DAU)" labelFormat="percentage" />
			<Axis position="left" ticks grid title="Average number of times per day" />
			<Scatter dimension="dauPercent" metric="countAvg" color="segment" />
			<Legend position="bottom" highlight />
		</Chart>
	);
};

const FeatureMatrix = bindWithProps(FeatureMatrixStory);
FeatureMatrix.args = {
	width: 'auto',
	maxWidth: 850,
	height: 500,
	data: basicData,
};

export { FeatureMatrix };
