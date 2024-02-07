/* eslint-disable react-hooks/rules-of-hooks */

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
import { ReactElement } from 'react';

import useChartProps from '@hooks/useChartProps';
import { BigNumber, Chart, Line } from '@rsc';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from 'test-utils/bindWithProps';

import { Icon } from '@adobe/react-spectrum';
import Amusementpark from '@spectrum-icons/workflow/Amusementpark';
import Calendar from '@spectrum-icons/workflow/Calendar';

import { simpleSparklineData as data } from '../../data/data';

export default {
	title: 'RSC/BigNumber',
	component: BigNumber,
};

const BigNumberStory: StoryFn<typeof BigNumber> = (args): ReactElement => {
	const chartProps = useChartProps({
		data: data,
		width: 600,
		height: 600,
	});
	return (
		<>
			<Chart {...chartProps}>
				<BigNumber {...args}/>
			</Chart>
		</>
	);
};

const BasicHorizontal = bindWithProps(BigNumberStory);
BasicHorizontal.args = {
	children: undefined,
	dataKey: 'x',
	orientation: 'horizontal',
	label: 'Visitors',
};

const BasicVertical = bindWithProps(BigNumberStory);
BasicVertical.args = {
	children: undefined,
	dataKey: 'x',
	orientation: 'vertical',
	label: 'Visitors',
};

const IconHorizontal = bindWithProps(BigNumberStory);
IconHorizontal.args = {
	dataKey: 'x',
	children: (
		<Icon key={'i'} data-testid="icon-calendar">
			<Calendar size="L" />
		</Icon>
	),
	orientation: 'horizontal',
	label: 'Visitors',
};

const IconVertical = bindWithProps(BigNumberStory);
IconVertical.args = {
	dataKey: 'x',
	children: (
		<Icon data-testid="icon-amusementpark">
			<Amusementpark size="L" />
		</Icon>
	),
	orientation: 'vertical',
	label: 'Visitors',
};

const SparklineHorizontal = bindWithProps(BigNumberStory);
SparklineHorizontal.args = {
	dataKey: 'x',
	children: <Line dimension="x" metric="y" scaleType="linear" />,
	orientation: 'horizontal',
	label: 'Visitors',
};

const SparklineVertical = bindWithProps(BigNumberStory);
SparklineVertical.args = {
	dataKey: 'x',
	children: <Line dimension="x" metric="y" scaleType="linear" />,
	orientation: 'vertical',
	label: 'Visitors',
};

const SparklineAndIconHorizontal = bindWithProps(BigNumberStory);
SparklineAndIconHorizontal.args = {
	dataKey: 'x',
	children: [
		<Icon key="icon" data-testid="icon-amusementpark">
			<Amusementpark size="L" />
		</Icon>,
		<Line key="line" dimension="x" metric="y" scaleType="linear" />,
	],
	orientation: 'horizontal',
	label: 'Visitors',
};

const SparklineAndIconVertical = bindWithProps(BigNumberStory);
SparklineAndIconVertical.args = {
	dataKey: 'x',
	children: [
		<Line key="line" dimension="x" metric="y" scaleType="linear" />,
		<Icon key="icon" data-testid="icon-amusementpark">
			<Amusementpark size="L" />
		</Icon>,
	],
	orientation: 'vertical',
	dataKey: 'value',
	label: 'Visitors',
};

const CurrencyFormat = bindWithProps(BigNumberStory);
CurrencyFormat.args = {
	children: undefined,
	dataKey: 'x',
	orientation: 'horizontal',
	label: 'Ad Spend',
	numberFormat: '$,.2f',
};

const PercentageFormat = bindWithProps(BigNumberStory);
PercentageFormat.args = {
	children: undefined,
	dataKey: 'x',
	orientation: 'horizontal',
	label: 'Capacity',
	numberType: 'percentage',
};

const CompactFormat = bindWithProps(BigNumberStory);
CompactFormat.args = {
	children: undefined,
	dataKey: 'x',
	orientation: 'horizontal',
	label: 'Requests',
};

// const NullData = bindWithProps(BigNumberStory);
// NullData.args = {
// 	data: null,
// 	orientation: 'horizontal',
// 	label: 'Visitors',
// };

// const UndefinedData = bindWithProps(BigNumberStory);
// UndefinedData.args = {
// 	data: undefined,
// 	orientation: 'horizontal',
// 	label: 'Visitors',
// };

export {
	BasicHorizontal,
	BasicVertical,
	IconHorizontal,
	IconVertical,
	SparklineHorizontal,
	SparklineVertical,
	SparklineAndIconHorizontal,
	SparklineAndIconVertical,
	CurrencyFormat,
	CompactFormat,
	PercentageFormat,
	// NullData,
	// UndefinedData
};
