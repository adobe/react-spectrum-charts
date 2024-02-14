import { ReactElement } from 'react';

import useChartProps from '@hooks/useChartProps';
import { Axis, Chart, Legend, Scatter, Trendline } from '@rsc';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { basicFeatureMatrixData, multipleSegmentFeatureMatrixData } from './data';

export default {
	title: 'RSC/Chart/Examples',
	component: Chart,
};

const FeatureMatrixStory: StoryFn<typeof Chart> = (args): ReactElement => {
	const chartProps = useChartProps(args);

	return (
		<Chart {...chartProps}>
			<Axis position="bottom" ticks grid title="Percentage of daily users (DAU)" labelFormat="percentage" />
			<Axis position="left" ticks grid title="Average number of times per day" />
			<Scatter dimension="dauPercent" metric="countAvg" color="segment">
				<Trendline
					method="median"
					lineWidth="XS"
					lineType="solid"
					color="gray-900"
					dimensionExtent={['domain', 'domain']}
				/>
			</Scatter>
			<Legend position="bottom" highlight />
		</Chart>
	);
};

const MultipleSegmentFeatureMatrixStory: StoryFn<typeof Chart> = (args): ReactElement => {
	const chartProps = useChartProps(args);

	return (
		<Chart {...chartProps}>
			<Axis position="bottom" ticks grid title="Percentage of daily users (DAU)" labelFormat="percentage" />
			<Axis position="left" ticks grid title="Average number of times per day" />
			<Scatter dimension="dauPercent" metric="countAvg" color="segment">
				<Trendline method="median" lineWidth="XS" lineType="solid" dimensionExtent={['domain', 'domain']} />
			</Scatter>
			<Legend position="bottom" highlight />
		</Chart>
	);
};

const FeatureMatrix = bindWithProps(FeatureMatrixStory);
FeatureMatrix.args = {
	width: 'auto',
	maxWidth: 850,
	height: 500,
	data: basicFeatureMatrixData,
};

const MultipleSegmentFeatureMatrix = bindWithProps(MultipleSegmentFeatureMatrixStory);
MultipleSegmentFeatureMatrix.args = {
	width: 'auto',
	maxWidth: 850,
	height: 500,
	data: multipleSegmentFeatureMatrixData,
};

export { FeatureMatrix, MultipleSegmentFeatureMatrix };
