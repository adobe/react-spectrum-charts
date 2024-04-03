import React, { ReactElement, useState } from 'react';

import { MARK_ID } from '@constants';
import useChartProps from '@hooks/useChartProps';
import { Annotation, Area, Axis, Bar, Chart, ChartPopover, ChartProps, ChartTooltip, Legend, Line } from '@rsc';
import { areaData, browserData as data, newDataArray1WithStaticPoints } from '@stories/data/data';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';
import { ChartData, ChartElement, Datum, SpectrumColor } from 'types';

import { Button, Content, Text, View } from '@adobe/react-spectrum';

import { barData, barSubSeriesData, generateMockDataForTrellis } from '../Bar/data';

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

const defaultChartProps: ChartProps = { data: [], minWidth: 400, maxWidth: 800, height: 400 };

const dialogContent = (datum) => (
	<Content>
		<div>Operating system: {datum.series}</div>
		<div>Browser: {datum.category}</div>
		<div>Users: {datum.value}</div>
	</Content>
);

const areaStoryData = [
	{ browser: 'Chrome', value: 5, operatingSystem: 'Windows', order: 2 },
	{ browser: 'Chrome', value: 3, operatingSystem: 'Mac', order: 1 },
	{ browser: 'Chrome', value: 2, operatingSystem: 'Other', order: 0 },
	{ browser: 'Firefox', value: 3, operatingSystem: 'Windows', order: 2 },
	{ browser: 'Firefox', value: 3, operatingSystem: 'Mac', order: 1 },
	{ browser: 'Firefox', value: 1, operatingSystem: 'Other', order: 0 },
	{ browser: 'Safari', value: 3, operatingSystem: 'Windows', order: 2 },
	{ browser: 'Safari', value: 0, operatingSystem: 'Mac', order: 1 },
	{ browser: 'Safari', value: 1, operatingSystem: 'Other', order: 0 },
];

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
			<Chart data={currentData} {...remaingProps} debug />
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
	const chartProps = useChartProps( defaultChartProps );
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

const AreaPopoverStory: StoryFn<typeof Area> = (args): ReactElement => {
	const chartProps = useChartProps({ data: areaStoryData, minWidth: 400, maxWidth: 800, height: 400 });
	return (
		<Chart {...chartProps}>
			<Axis position="bottom" baseline />
			<Axis position="left" grid />
			<Area {...args}>
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover>{dialogContent}</ChartPopover>
			</Area>
			<Legend highlight />
		</Chart>
	);
};

const SingleLineStory: StoryFn<ToggleableDataProps> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
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

const LineStory: StoryFn<typeof ChartPopover> = (args): ReactElement => {
	const chartProps = useChartProps({ ...defaultChartProps, data });
	return (
		<Chart {...chartProps}>
			<Axis position="bottom" baseline />
			<Axis position="left" grid />
			<Line scaleType="point" dimension="category" color="series">
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover {...args} />
			</Line>
			<Legend highlight/>
		</Chart>
	);
};

const BarStory: StoryFn<ToggleableDataProps> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<ChartWithToggleableData
			ChartComponent={
				<Chart {...chartProps}>
					<Axis position={'bottom'} baseline title="Browser" />
					<Axis position={'left'} grid title="Downloads" />
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
	const chartProps = useChartProps({ ...defaultChartProps,  colors });
	return (
		<ChartWithToggleableData
			ChartComponent={
				<Chart {...chartProps}>
					<Axis position={'bottom'} baseline title="Browser" />
					<Axis position={'left'} grid title="Downloads" />
					<Bar
						type={'dodged'}
						dimension={'browser'}
						color={['operatingSystem', 'version']}
						paddingRatio={0.1}
					>
						<ChartPopover/>
						<Annotation textKey="percentLabel" />
					</Bar>
					<Legend title="Operating system" highlight />
				</Chart>
			}
			{...args}
		/>
	);
};

const TrellisHorizontalBarStory: StoryFn<ToggleableDataProps> = (args): ReactElement => {
	const colors: SpectrumColor[] = [
		'sequential-magma-200',
		'sequential-magma-400',
		'sequential-magma-600',
		'sequential-magma-800',
		'sequential-magma-1000',
		'sequential-magma-1200',
		'sequential-magma-1400',
	];

	const chartProps = useChartProps({ ...defaultChartProps, colors });

	const dialog = (item: Datum) => {
		return (
			<Content>
				<View>
					<Text>{item[MARK_ID]}</Text>
				</View>
			</Content>
		);
	};

	return (
		<ChartWithToggleableData
			ChartComponent={
				<Chart {...chartProps}>
					<Axis position={'bottom'} title="Users, Count" grid />
					<Axis position={'left'} title="Platform" baseline />
					<Bar
						type="stacked"
						trellis="event"
						dimension="segment"
						color="bucket"
						order="order"
						orientation="horizontal"
						trellisOrientation="horizontal"
					>
						<ChartTooltip>{dialog}</ChartTooltip>
						<ChartPopover>{dialog}</ChartPopover>
					</Bar>
					<Legend />
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

const AreaPopover = bindWithProps(AreaPopoverStory);
AreaPopover.args = {
	dimension: 'browser',
	color: 'operatingSystem',
	scaleType: 'point',
};

const LineChart = bindWithProps(LineStory);
LineChart.args = { children: dialogContent };

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

const trellisData = generateMockDataForTrellis({
	property1: ['All users', 'Roku', 'Chromecast', 'Amazon Fire', 'Apple TV'],
	property2: ['A. Sign up', 'B. Watch a video', 'C. Add to MyList'],
	property3: ['1-5 times', '6-10 times', '11-15 times', '16-20 times', '21-25 times', '26+ times'],
	propertyNames: ['segment', 'event', 'bucket'],
	randomizeSteps: false,
	orderBy: 'bucket',
});
const TrellisHorizontalBarSwitch = bindWithProps(TrellisHorizontalBarStory);
TrellisHorizontalBarSwitch.args = {
	initialData: trellisData,
	secondaryData: trellisData.map((data) => {
		return {
			value: manipulateData(data.value as number),
			...data,
		};
	}),
};

const TrellisHorizontalBarZero = bindWithProps(TrellisHorizontalBarStory);
TrellisHorizontalBarZero.args = {
	initialData: trellisData,
	secondaryData: generateMockDataForTrellis({
		property1: ['All users', 'Roku', 'Chromecast', 'Amazon Fire', 'Apple TV'],
		property2: ['A. Sign up', 'B. Watch a video', 'C. Add to MyList'],
		property3: ['1-5 times', '6-10 times', '11-15 times', '16-20 times', '21-25 times', '26+ times'],
		propertyNames: ['segment', 'event', 'bucket'],
		randomizeSteps: true,
		orderBy: 'bucket',
	}),
};

export {
	AreaPopover,
	AreaSwitch,
	AreaZero,
	BarSwitch,
	BarZero,
	DodgedBarSwitch,
	DodgedBarZero,
	LineChart,
	SingleLineSwitch,
	SingleLineZero,
	TrellisHorizontalBarSwitch,
	TrellisHorizontalBarZero,
};
