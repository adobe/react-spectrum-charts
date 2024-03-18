/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { ReactElement } from 'react';

import useChartProps from '@hooks/useChartProps';
import { Axis, Chart, Legend, Scatter, Trendline, TrendlineAnnotation, TrendlineProps } from '@rsc';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { basicFeatureMatrixData, multipleSegmentFeatureMatrixData } from './data';

export default {
	title: 'RSC/Chart/Examples',
	component: Chart,
};

const trendlineProps: TrendlineProps = {
	method: 'median',
	lineWidth: 'XS',
	lineType: 'solid',
	dimensionExtent: ['domain', 'domain'],
};

const FeatureMatrixStory: StoryFn<typeof Chart> = (args): ReactElement => {
	const chartProps = useChartProps(args);

	return (
		<Chart {...chartProps}>
			<Axis position="bottom" ticks grid title="Percentage of daily users (DAU)" labelFormat="percentage" />
			<Axis position="left" ticks grid title="Average number of times per day" />
			<Scatter dimension="dauPercent" metric="countAvg" color="segment">
				<Trendline {...trendlineProps} color="gray-900" orientation="horizontal">
					<TrendlineAnnotation prefix="Median times" numberFormat=".3" />
				</Trendline>
				<Trendline {...trendlineProps} color="gray-900" orientation="vertical">
					<TrendlineAnnotation prefix="Median %DAU" numberFormat=".2%" />
				</Trendline>
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
				<Trendline {...trendlineProps} displayOnHover orientation="horizontal">
					<TrendlineAnnotation badge prefix="Median times" numberFormat=".3" />
				</Trendline>
				<Trendline {...trendlineProps} displayOnHover orientation="vertical">
					<TrendlineAnnotation badge prefix="Median %DAU" numberFormat=".2%" />
				</Trendline>
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
