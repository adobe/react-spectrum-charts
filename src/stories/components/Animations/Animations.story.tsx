import { ReactElement, useState } from 'react';

import useChartProps from '@hooks/useChartProps';
import { Annotation, Area, Axis, Bar, Chart, Legend, Line } from '@rsc';
import { areaData, newDataArray1WithStaticPoints } from '@stories/data/data';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';
import { ChartData, ChartElement } from 'types';

import { Button } from '@adobe/react-spectrum';

import { barData, barSubSeriesData } from '../Bar/data';

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

const manipulateData = (data: number): number => {
	const randomFactor = Math.random() * (1.15 - 0.85) + 0.85;
	const result = data * randomFactor;
	return Math.round(result);
};

const AreaStory: StoryFn<ToggleableDataProps> = (args): ReactElement => {
	const chartProps = useChartProps({ data: [], minWidth: 400, maxWidth: 800, height: 400 });
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
	const chartProps = useChartProps({ data: [], minWidth: 400, maxWidth: 800, height: 400 });
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

const BarStory: StoryFn<ToggleableDataProps> = (args): ReactElement => {
	const chartProps = useChartProps({ data: [], minWidth: 400, maxWidth: 800, height: 400 });
	return (
		<ChartWithToggleableData
			ChartComponent={
				<Chart {...chartProps}>
					<Axis position={'left'} baseline title="Browser" />
					<Axis position={'bottom'} grid title="Downloads" />
					<Bar dimension={'browser'} metric={'downloads'} />
				</Chart>
			}
			{...args}
		/>
	);
};

const DodgedBarStory: StoryFn<ToggleableDataProps> = (args): ReactElement => {
	const colors = [
		['#00a6a0', '#4bcec7'],
		['#575de8', '#8489fd'],
		['#d16100', '#fa8b1a'],
	];
	const chartProps = useChartProps({ data: [], minWidth: 400, maxWidth: 800, height: 400, colors });
	return (
		<ChartWithToggleableData
			ChartComponent={
				<Chart {...chartProps} debug>
					<Axis position={'left'} baseline title="Browser" />
					<Axis position={'bottom'} grid title="Downloads" />
					<Bar
						type={'dodged'}
						dimension={'browser'}
						color={['operatingSystem', 'version']}
						paddingRatio={0.1}
					>
						<Annotation textKey="percentLabel" />
					</Bar>
					<Legend title="Operating system" highlight />
				</Chart>
			}
			{...args}
		/>
	);
};

const AreaSwitch = bindWithProps(AreaStory);
AreaSwitch.args = {
	initialData: areaData,
	secondaryData: areaData.map((data) => {
		return {
			...data,
			minTemperature: manipulateData(data.minTemperature),
			maxTemperature: manipulateData(data.maxTemperature),
		};
	}),
};

const AreaZero = bindWithProps(AreaStory);
AreaZero.args = {
	initialData: areaData,
	secondaryData: areaData.concat({
		datetime: 1668509200000,
		minTemperature: 5,
		maxTemperature: 32,
		series: 'Add Fallout',
	}),
};

const SingleLineSwitch = bindWithProps(SingleLineStory);
SingleLineSwitch.args = {
	initialData: newDataArray1WithStaticPoints,
	secondaryData: newDataArray1WithStaticPoints.map((data) => {
		return {
			...data,
			y: manipulateData(data.y),
		};
	}),
};

const SingleLineZero = bindWithProps(SingleLineStory);
SingleLineZero.args = {
	initialData: newDataArray1WithStaticPoints,
	secondaryData: newDataArray1WithStaticPoints.concat({ x: 16, y: 55, point: true }),
};

const BarSwitch = bindWithProps(BarStory);
BarSwitch.args = {
	initialData: barData,
	secondaryData: barData.map((data) => {
		return {
			...data,
			downloads: manipulateData(data.downloads),
		};
	}),
};

const BarZero = bindWithProps(BarStory);
BarZero.args = {
	initialData: barData,
	secondaryData: barData.concat({ browser: 'Opera', downloads: 10, percentLabel: '.01%' }),
};

const DodgedBarSwitch = bindWithProps(DodgedBarStory);
DodgedBarSwitch.args = {
	initialData: barSubSeriesData,
	secondaryData: barSubSeriesData.map((data) => {
		return {
			...data,
			value: manipulateData(data.value),
		};
	}),
};

const DodgedBarZero = bindWithProps(DodgedBarStory);
DodgedBarZero.args = {
	initialData: barSubSeriesData,
	secondaryData: barSubSeriesData.concat([
		{
			browser: 'Opera',
			value: 5,
			operatingSystem: 'Windows',
			version: 'Current',
			order: 2,
			percentLabel: '71.4%',
		},
		{ browser: 'Opera', value: 3, operatingSystem: 'Mac', version: 'Current', order: 1, percentLabel: '42.9%' },
		{ browser: 'Opera', value: 2, operatingSystem: 'Linux', version: 'Current', order: 0, percentLabel: '28.6%' },
		{
			browser: 'Opera',
			value: 2,
			operatingSystem: 'Windows',
			version: 'Previous',
			order: 2,
			percentLabel: '28.6%',
		},
		{ browser: 'Opera', value: 4, operatingSystem: 'Mac', version: 'Previous', order: 1, percentLabel: '57.1%' },
		{ browser: 'Opera', value: 5, operatingSystem: 'Linux', version: 'Previous', order: 0, percentLabel: '71.4%' },
	]),
};

export { AreaSwitch, AreaZero, SingleLineSwitch, SingleLineZero, BarSwitch, BarZero, DodgedBarSwitch, DodgedBarZero };
