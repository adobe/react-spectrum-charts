/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { ActionButton, ActionGroup, Content, Divider, Flex, Item, Text, View } from '@adobe/react-spectrum';
import { Annotation } from '@components/Annotation';
import { ReferenceLine } from '@components/ReferenceLine';
import usePrismProps from '@hooks/usePrismProps';
import { Area, Axis, Bar, ChartPopover, ChartTooltip, Legend, Line, Prism, Trendline, categorical16 } from '@prism';
import Close from '@spectrum-icons/workflow/Close';
import Download from '@spectrum-icons/workflow/Download';
import GraphPathing from '@spectrum-icons/workflow/GraphPathing';
import UsersAdd from '@spectrum-icons/workflow/UsersAdd';
import ViewDetail from '@spectrum-icons/workflow/ViewDetail';
import { ComponentStory } from '@storybook/react';
import { bindWithProps } from '@test-utils';
import React, { ReactElement } from 'react';
import { Colors, Datum, LegendDescription, LegendLabel, SpectrumColor, SubLabel } from 'types';
import stackOverflowData from './data/stackOverflowTrends.json';

import {
	funnelConversionData,
	funnelConversionTimeComparisonData,
	releaseImpactData,
	userGrowthData,
	userGrowthTimeComparisonData,
} from './data/data';
import { trendsTimeComparisonData } from './data/trendsTimeComparisonData';

export default {
	title: 'Prism/Prism/Examples',
	component: Prism,
	argTypes: {},
	parameters: {
		docs: {
			description: {
				component: 'This is _markdown_ enabled description for Chart component doc page.',
			},
		},
	},
};

const userGrowthColors: SpectrumColor[] = [
	'divergent-orange-yellow-seafoam-1000',
	'divergent-orange-yellow-seafoam-1200',
	'divergent-orange-yellow-seafoam-1400',
	'divergent-orange-yellow-seafoam-600',
];

const userGrowthDescriptions: LegendDescription[] = [
	{
		seriesName: `New users`,
		description: `Users active in the current period, but not previously (within 6 months of the current period).`,
	},
	{ seriesName: `Current users`, description: `Users active in the current and previous period.` },
	{
		seriesName: `Resurrected users`,
		description: `Users active in the current period, after being dormant previously (within 6 months of the current period).`,
	},
	{
		seriesName: `Dormant users`,
		description: `Users not active in the current period, but were active in the previous period.`,
	},
];

const funnelSublabels: SubLabel[] = [
	{ value: '2. Click promo slide', subLabel: '90DF-0123 +2 more', fontWeight: 'normal' },
	{ value: '3. Start video', subLabel: '90 Day Fiance', fontWeight: 'normal' },
];

const funnelLegendLabels: LegendLabel[] = [
	{ seriesName: 'All users | retained', label: 'All users' },
	{ seriesName: 'US | retained', label: 'US' },
];

const funnelTimeCompareLegendLabels: LegendLabel[] = [
	{ seriesName: 'All users | Previous 4 weeks | retained', label: 'All users | Previous 4 weeks' },
	{ seriesName: 'All users | Last 4 weeks | retained', label: 'All users | Last 4 weeks' },
	{ seriesName: 'US | Previous 4 weeks | retained', label: 'US | Previous 4 weeks ' },
	{ seriesName: 'US | Last 4 weeks | retained', label: 'US | Last 4 weeks ' },
];

const UserGrowthBarStory: ComponentStory<typeof Prism> = (args): ReactElement => {
	const props = usePrismProps(args);
	return (
		<Prism {...props}>
			<Axis position="bottom" baseline />
			<Axis position="left" grid title="Users" />
			<Bar dimension="x" metric="y" color="series" order="order">
				<ChartTooltip>{dialogCallback}</ChartTooltip>
				<ChartPopover width={200}>{dialogCallback}</ChartPopover>
			</Bar>
			<Legend highlight descriptions={userGrowthDescriptions} />
		</Prism>
	);
};

const UserGrowthBarTimeComparisonStory: ComponentStory<typeof Prism> = (args): ReactElement => {
	const props = usePrismProps(args);
	return (
		<Prism {...props}>
			<Axis position="bottom" baseline />
			<Axis position="left" grid title="Users" />
			<Bar
				dimension="x"
				metric="y"
				order="order"
				color="series"
				opacity={['series', 'period']}
				lineType={['series', 'period']}
				lineWidth={1.5}
				paddingRatio={0.3}
				groupedPadding={0.12}
			>
				<ChartTooltip>{dialogCallback}</ChartTooltip>
				<ChartPopover width={200}>{dialogCallback}</ChartPopover>
			</Bar>
			<Legend highlight descriptions={userGrowthDescriptions} />
		</Prism>
	);
};

const UserGrowthAreaStory: ComponentStory<typeof Prism> = (args): ReactElement => {
	const props = usePrismProps(args);
	return (
		<Prism {...props}>
			<Axis position="bottom" baseline />
			<Axis position="left" grid title="Users" />
			<Area dimension="x" metric="y" order="order" scaleType="point">
				<ChartTooltip>{dialogCallback}</ChartTooltip>
				<ChartPopover width={200}>{dialogCallback}</ChartPopover>
			</Area>
			<Legend highlight descriptions={userGrowthDescriptions} />
		</Prism>
	);
};

const dialogCallback = (datum: Datum, close?: () => void) => {
	return (
		<Content UNSAFE_className="userGrowth-dialog">
			<Flex direction="column">
				<Flex direction="row" justifyContent="space-between">
					<div>
						<div>{datum.x}</div>
						<div>{datum.series}</div>
						<div>{Math.abs(datum.y as number).toLocaleString()} users</div>
					</div>
					{close !== undefined && (
						<ActionButton isQuiet onPress={close}>
							<Close />
						</ActionButton>
					)}
				</Flex>
				{close !== undefined && (
					<>
						<Divider />
						<ActionGroup isQuiet onAction={close} orientation="vertical" UNSAFE_className="dialog-actions">
							<Item key="create-segment">
								<UsersAdd />
								<Text>Create segment</Text>
							</Item>
							<Item key="user-paths">
								<GraphPathing />
								<Text>Show user paths</Text>
							</Item>
							<Item key="view-users">
								<ViewDetail />
								<Text>View users</Text>
							</Item>
							<Item key="download-users">
								<Download />
								<Text>Download users</Text>
							</Item>
						</ActionGroup>
					</>
				)}
			</Flex>
		</Content>
	);
};

const FunnelConversionStory: ComponentStory<typeof Prism> = (args): ReactElement => {
	const props = usePrismProps(args);
	return (
		<Prism {...props}>
			<Axis position="bottom" labelAlign="start" labelFontWeight="bold" subLabels={funnelSublabels} baseline />
			<Axis position="left" grid labelFormat="percentage" title="Conversion rate" />
			<Bar type="dodged" dimension="step" color={['series', 'subSeries']} paddingRatio={0.1}>
				<Annotation textKey="percentLabel" />
			</Bar>
			<Legend highlight hiddenEntries={['All users | lost', 'US | lost']} legendLabels={funnelLegendLabels} />
		</Prism>
	);
};

const FunnelTimeComparisonStory: ComponentStory<typeof Prism> = (args): ReactElement => {
	const props = usePrismProps(args);
	return (
		<Prism {...props}>
			<Axis position="bottom" labelAlign="start" labelFontWeight="bold" subLabels={funnelSublabels} baseline />
			<Axis position="left" grid labelFormat="percentage" title="Conversion rate" />
			<Bar
				type="dodged"
				dimension="step"
				color={['series', 'subSeries']}
				paddingRatio={0.1}
				opacity="period"
				lineType="period"
				lineWidth={1.5}
			>
				<Annotation textKey="percentLabel" />
				<ChartTooltip />
			</Bar>
			<Legend
				highlight
				hiddenEntries={[
					'All users | lost',
					'US | lost',
					'US | Previous 4 weeks | lost',
					'All users | Previous 4 weeks | lost',
					'All users | Last 4 weeks | lost',
					'US | Last 4 weeks | lost',
				]}
				legendLabels={funnelTimeCompareLegendLabels}
			/>
		</Prism>
	);
};

const ReleaseImpactStory: ComponentStory<typeof Prism> = (args): ReactElement => {
	const props = usePrismProps(args);

	const subLabels: SubLabel[] = [
		{ value: -14, subLabel: 'Days before', align: 'start', fontWeight: 'bold' },
		{ value: 0, subLabel: 'July 17, 2023', fontWeight: 'bold' },
		{ value: 14, subLabel: 'Days after', align: 'end', fontWeight: 'bold' },
	];

	const dialog = (item: Datum) => {
		return (
			<Content>
				<View>
					<Text>{item.prismTrendlineValue?.toFixed(2)}</Text>
				</View>
			</Content>
		);
	};

	return (
		<Prism {...props}>
			<Axis position="bottom" baseline ticks subLabels={subLabels}>
				<ReferenceLine value={0} icon="date" />
			</Axis>
			<Axis position="left" grid title="Events per user" />
			<Line color="series" dimension="day" metric="value" scaleType="linear" opacity={{ value: 0.4 }}>
				<Trendline method="average" lineType="solid" dimensionRange={[null, -1]} highlightRawPoint>
					<ChartTooltip>{dialog}</ChartTooltip>
					<ChartPopover>{dialog}</ChartPopover>
				</Trendline>
				<Trendline method="average" lineType="solid" dimensionRange={[1, null]}>
					<ChartTooltip>{dialog}</ChartTooltip>
					<ChartPopover>{dialog}</ChartPopover>
				</Trendline>
			</Line>
			<Legend highlight />
		</Prism>
	);
};

const TrendsTimeComparisonLineStory: ComponentStory<typeof Prism> = (args): ReactElement => {
	const props = usePrismProps(args);
	const legendLabels = [
		{ seriesName: 'add-freeform-table-0 | Previous 4 weeks', label: 'Add Freeform table | Previous 4 weeks' },
		{ seriesName: 'add-freeform-table-0 | Last 4 weeks', label: 'Add Freeform table | Last 4 weeks' },
		{ seriesName: 'add-line-viz-1 | Previous 4 weeks', label: 'Add Line Viz | Previous 4 weeks' },
		{ seriesName: 'add-line-viz-1 | Last 4 weeks', label: 'Add Line Viz | Last 4 weeks' },
	];
	return (
		<Prism {...props}>
			<Axis position="bottom" ticks baseline labelFormat="time" />
			<Axis position="left" grid title="Events" />
			<Line color="series" lineType="period" scaleType="time" />
			<Legend highlight legendLabels={legendLabels} opacity="period" />
		</Prism>
	);
};

const TrendsTimeComparisonBarStory: ComponentStory<typeof Prism> = (args): ReactElement => {
	const props = usePrismProps(args);
	const legendLabels = [
		{ seriesName: 'add-freeform-table-0 | Previous 4 weeks', label: 'Add Freeform table | Previous 4 weeks' },
		{ seriesName: 'add-freeform-table-0 | Last 4 weeks', label: 'Add Freeform table | Last 4 weeks' },
		{ seriesName: 'add-line-viz-1 | Previous 4 weeks', label: 'Add Line Viz | Previous 4 weeks' },
		{ seriesName: 'add-line-viz-1 | Last 4 weeks', label: 'Add Line Viz | Last 4 weeks' },
	];
	return (
		<Prism {...props}>
			<Axis position="bottom" ticks baseline labelFormat="time" />
			<Axis position="left" grid title="Events" />
			<Bar
				type="dodged"
				dimension="datetime"
				color="series"
				opacity="period"
				lineType="period"
				lineWidth={1.5}
				paddingRatio={0.2}
			/>
			<Legend highlight legendLabels={legendLabels} />
		</Prism>
	);
};

const TrendsTimeComparisonStackedBarStory: ComponentStory<typeof Prism> = (args): ReactElement => {
	const props = usePrismProps(args);
	const legendLabels = [
		{ seriesName: 'add-freeform-table-0 | Previous 4 weeks', label: 'Add Freeform table | Previous 4 weeks' },
		{ seriesName: 'add-freeform-table-0 | Last 4 weeks', label: 'Add Freeform table | Last 4 weeks' },
		{ seriesName: 'add-line-viz-1 | Previous 4 weeks', label: 'Add Line Viz | Previous 4 weeks' },
		{ seriesName: 'add-line-viz-1 | Last 4 weeks', label: 'Add Line Viz | Last 4 weeks' },
	];
	return (
		<Prism {...props} colors={categorical16} opacities={[[0.5, 1]]} lineTypes={[['shortDash', 'solid']]}>
			<Axis position="bottom" ticks baseline labelFormat="time" />
			<Axis position="left" grid title="Events" />
			<Bar
				type="stacked"
				dimension="datetime"
				color="series"
				opacity={['series', 'period']}
				lineType={['series', 'period']}
				lineWidth={1.5}
				paddingRatio={0.2}
			/>
			<Legend highlight legendLabels={legendLabels} />
		</Prism>
	);
};

const StackOverflowStory: ComponentStory<typeof Prism> = (args): ReactElement => {
	const props = usePrismProps(args);
	return (
		<Prism {...props}>
			<Axis position="left" grid title="Page Views" />
			<Axis position="bottom" baseline ticks labelFormat="time" granularity="month" />
			<Line dimension="timestamp" metric="rollingAveragePageViews" />
		</Prism>
	);
};

const UserGrowthBarGrowth = bindWithProps(UserGrowthBarStory);
UserGrowthBarGrowth.args = {
	data: userGrowthData,
	colors: userGrowthColors,
	height: 500,
	minWidth: 600,
	maxWidth: 1600,
	width: 'auto',
};

const UserGrowthTimeComparisonBarGrowth = bindWithProps(UserGrowthBarTimeComparisonStory);
UserGrowthTimeComparisonBarGrowth.args = {
	data: userGrowthTimeComparisonData,
	colors: userGrowthColors,
	height: 500,
	minWidth: 600,
	maxWidth: 1600,
	width: 'auto',
	lineTypes: [['shortDash', 'solid']],
	opacities: [[0.5, 1]],
};

const UserGrowthAreaGrowth = bindWithProps(UserGrowthAreaStory);
UserGrowthAreaGrowth.args = {
	data: userGrowthData,
	colors: userGrowthColors,
	height: 500,
	minWidth: 600,
	maxWidth: 1600,
	width: 'auto',
};

const FunnelConversion = bindWithProps(FunnelConversionStory);
const funnelColors: Colors[] = categorical16.map((color) => [color, 'gray-300']);
FunnelConversion.args = {
	data: funnelConversionData,
	colors: funnelColors,
	height: 500,
	minWidth: 840,
	maxWidth: 1280,
	width: 'auto',
};

const FunnelTimeComparison = bindWithProps(FunnelTimeComparisonStory);
const funnelTimeComparisonColors: Colors[] = categorical16.map((color) => [color, 'gray-300']);
FunnelTimeComparison.args = {
	data: funnelConversionTimeComparisonData,
	colors: funnelTimeComparisonColors,
	height: 500,
	minWidth: 840,
	width: 'auto',
	lineTypes: ['shortDash', 'solid'],
	opacities: [0.5, 1],
};

const ReleaseImpact = bindWithProps(ReleaseImpactStory);
ReleaseImpact.args = {
	data: releaseImpactData,
	height: 500,
	minWidth: 840,
};

const TrendsTimeComparisonBar = bindWithProps(TrendsTimeComparisonBarStory);
TrendsTimeComparisonBar.args = {
	data: trendsTimeComparisonData,
	height: 500,
	minWidth: 840,
	width: 'auto',
	lineTypes: ['shortDash', 'solid'],
	opacities: [0.5, 1],
};

const TrendsTimeComparisonStackedBar = bindWithProps(TrendsTimeComparisonStackedBarStory);
TrendsTimeComparisonStackedBar.args = {
	data: trendsTimeComparisonData,
	height: 500,
	minWidth: 840,
	width: 'auto',
	lineTypes: ['shortDash', 'solid'],
	opacities: [0.5, 1],
};

const TrendsTimeComparisonLine = bindWithProps(TrendsTimeComparisonLineStory);
TrendsTimeComparisonLine.args = {
	data: trendsTimeComparisonData,
	height: 500,
	minWidth: 840,
	width: 'auto',
	lineTypes: ['shortDash', 'solid'],
	opacities: [0.5, 1],
};

const StackOverflowTrends = bindWithProps(StackOverflowStory);
StackOverflowTrends.args = {
	data: stackOverflowData,
	height: 500,
	minWidth: 840,
	width: 'auto',
	debug: true,
	renderer: 'canvas',
	title: 'The Fall of Stack Overflow',
};

export {
	FunnelConversion,
	FunnelTimeComparison,
	UserGrowthAreaGrowth,
	UserGrowthBarGrowth,
	ReleaseImpact,
	TrendsTimeComparisonBar,
	TrendsTimeComparisonStackedBar,
	TrendsTimeComparisonLine,
	StackOverflowTrends,
	UserGrowthTimeComparisonBarGrowth,
};
