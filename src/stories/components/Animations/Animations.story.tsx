import { ReactElement, useState } from 'react';

import { Area } from '@components/Area';
import { Line } from '@components/Line';
import useChartProps from '@hooks/useChartProps';
import {
	areaData,
	areaData2,
	areaData3,
	newDataArray1WithStaticPoints,
	newDataArray2WithStaticPoints,
	newDataArray3WithStaticPoints,
} from '@stories/data/data';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';
import { Chart } from 'Chart';
import { ChartData, ChartElement } from 'types';

import { Button } from '@adobe/react-spectrum';

export default {
	title: 'RSC/Animations',
};

interface ToggleableDataProps {
	initialData: ChartData[];
	secondaryData: ChartData[];
}

interface ChartWithToggleableDataProps extends ToggleableDataProps {
	ChartComponent: ChartElement;
}

const ChartWithToggleableData = ({ ChartComponent, initialData, secondaryData }: ChartWithToggleableDataProps) => {
	const [dataSource, setDataSource] = useState(true);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { data, ...remaingProps } = ChartComponent.props;

	const toggleDataSource = () => {
		setDataSource(!dataSource);
	};

	const currentData = dataSource ? initialData : secondaryData;

	return (
		<div>
			<Chart data={currentData} {...remaingProps} />
			<Button onPress={toggleDataSource} variant={'primary'}>
				Toggle Data
			</Button>
		</div>
	);
};

const AreaStory: StoryFn<ToggleableDataProps> = (args): ReactElement => {
	const chartProps = useChartProps({ data: areaData, minWidth: 400, maxWidth: 800, height: 400 });
	return (
		<ChartWithToggleableData
			ChartComponent={
				<Chart {...chartProps}>
					<Area metric="maxTemperature" />
				</Chart>
			}
			{...args}
		/>
	);
};

const SingleLineStory: StoryFn<ToggleableDataProps> = (args): ReactElement => {
	const chartProps = useChartProps({
		data: newDataArray1WithStaticPoints,
		minWidth: 400,
		maxWidth: 800,
		height: 400,
	});
	return (
		<ChartWithToggleableData
			ChartComponent={
				<Chart {...chartProps}>
					<Line metric="y" dimension="x" scaleType="linear" staticPoint="point" />
				</Chart>
			}
			{...args}
		/>
	);
};

const AreaZero = bindWithProps(AreaStory);
AreaZero.args = { initialData: areaData, secondaryData: areaData3 };

const AreaSwitch = bindWithProps(AreaStory);
AreaSwitch.args = { initialData: areaData, secondaryData: areaData2 };

const SingleLineZero = bindWithProps(SingleLineStory);
SingleLineZero.args = { initialData: newDataArray1WithStaticPoints, secondaryData: newDataArray3WithStaticPoints };

const SingleLineSwitch = bindWithProps(SingleLineStory);
SingleLineSwitch.args = { initialData: newDataArray1WithStaticPoints, secondaryData: newDataArray2WithStaticPoints };

// const BarStory: StoryFn<typeof Bar> = (args): ReactElement => {
// 	const chartProps = useChartProps({ data: barData, width: 600, height: 600 });
// 	return (
// 		<Chart {...chartProps} debug>
// 			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
// 			<Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
// 			<Bar {...args} />
// 		</Chart>
// 	);
// };

// const DodgedBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
// 	const { color } = args;
// 	const colors = Array.isArray(color)
// 		? [
// 				['#00a6a0', '#4bcec7'],
// 				['#575de8', '#8489fd'],
// 				['#d16100', '#fa8b1a'],
// 		  ]
// 		: categorical6;
// 	const data = Array.isArray(color) ? barSubSeriesData : barSeriesData;
// 	const chartProps = useChartProps({ data, width: 800, height: 600, colors });
// 	return (
// 		<Chart {...chartProps} debug>
// 			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
// 			<Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
// 			<Bar {...args} />
// 			<Legend title="Operating system" highlight />
// 		</Chart>
// 	);
// };

// const colors: SpectrumColor[] = [
// 	'divergent-orange-yellow-seafoam-1000',
// 	'divergent-orange-yellow-seafoam-1200',
// 	'divergent-orange-yellow-seafoam-1400',
// 	'divergent-orange-yellow-seafoam-600',
// ];

// const BarStory: StoryFn<typeof Bar> = (args): ReactElement => {
// 	const chartProps = useChartProps({ data: barSeriesData, colors, width: 800, height: 600 });
// 	return (
// 		<Chart {...chartProps}>
// 			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
// 			<Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
// 			<Bar {...args} />
// 			<Legend title="Operating system" />
// 		</Chart>
// 	);
// };

export { AreaZero, AreaSwitch, SingleLineSwitch, SingleLineZero };
