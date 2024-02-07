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

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { ReactElement } from 'react';

import useChartProps from '@hooks/useChartProps';
import { BigNumber, Chart, Line } from '@rsc';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from 'test-utils/bindWithProps';

import { Icon } from '@adobe/react-spectrum';
import Amusementpark from '@spectrum-icons/workflow/Amusementpark';
import Calendar from '@spectrum-icons/workflow/Calendar';

export default {
	title: 'RSC/BigNumber',
	component: BigNumber,
};

const BigNumberStory: StoryFn<typeof BigNumber> = (args): ReactElement => {
	// const chartProps = useChartProps({ data: [{ value: 2555 }], width: 600, height: 600 });
	return (
		// <Chart {...chartProps}>
		<BigNumber {...args}/>
		// </Chart>
	);
};

const BasicHorizontal = bindWithProps(BigNumberStory);
BasicHorizontal.args = {
	orientation: 'horizontal',
	data: [{ value: 255 }],
	dataKey: 'value',
	label: 'Visitors',
};

const BasicVertical = bindWithProps(BigNumberStory);
BasicVertical.args = {
	orientation: 'vertical',
	data: [{ value: 255 }],
	dataKey: 'value',
	label: 'Visitors',
};

const IconHorizontal = bindWithProps(BigNumberStory);
IconHorizontal.args = {
	children: (
		<Icon key={'i'} data-testid="icon-calendar">
			<Calendar size="L" />
		</Icon>
	),
	orientation: 'horizontal',
	data: [{ value: 255 }],
	dataKey: 'value',
	label: 'Visitors',
};

const IconVertical = bindWithProps(BigNumberStory);
IconVertical.args = {
	children: (
		<Icon data-testid="icon-amusementpark">
			<Amusementpark size="L" />
		</Icon>
	),
	orientation: 'vertical',
	data: [{ value: 255 }],
	dataKey: 'value',
	label: 'Visitors',
};

const CurrencyFormat = bindWithProps(BigNumberStory);
CurrencyFormat.args = {
	orientation: 'horizontal',
	data: [{ value: 255.56 }],
	dataKey: 'value',
	label: 'Ad Spend',
	numberFormat: '$,.2f',
	locale: 'de-DE',
};

const PercentageFormat = bindWithProps(BigNumberStory);
PercentageFormat.args = {
	orientation: 'horizontal',
	data: [{ value: 0.25 }],
	dataKey: 'value',
	label: 'Capacity',
	numberType: 'percentage',
	locale: 'en-US',
};

const CompactFormat = bindWithProps(BigNumberStory);
CompactFormat.args = {
	orientation: 'horizontal',
	data: [{ value: 12345678912 }],
	dataKey: 'value',
	label: 'Requests',
};

const NullData = bindWithProps(BigNumberStory);
NullData.args = {
	data: null,
	orientation: 'horizontal',
	dataKey: 'value',
	label: 'Visitors',
};

const UndefinedData = bindWithProps(BigNumberStory);
UndefinedData.args = {
	data: undefined,
	orientation: 'horizontal',
	dataKey: 'value',
	label: 'Visitors',
};

export {
	BasicHorizontal,
	BasicVertical,
	CurrencyFormat,
	CompactFormat,
	PercentageFormat,
	IconHorizontal,
	IconVertical,
	NullData,
	UndefinedData
};
