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
import React, { ReactElement } from 'react';

import { BigNumber } from '@rsc';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from 'test-utils/bindWithProps';

import Calendar from '@spectrum-icons/workflow/Calendar';

export default {
	title: 'RSC/BigNumber',
	component: BigNumber,
};

const BigNumberStory: StoryFn<typeof BigNumber> = (args): ReactElement => {
	return <BigNumber {...args} />;
};

const BasicHorizonal = bindWithProps(BigNumberStory);
BasicHorizonal.args = {
	orientation: 'horizontal',
	value: 2555,
	label: 'Visitors',
};

const BasicVertical = bindWithProps(BigNumberStory);
BasicVertical.args = {
	orientation: 'vertical',
	value: 2555,
	label: 'Visitors',
};

const IconHorizonal = bindWithProps(BigNumberStory);
IconHorizonal.args = {
	icon: <Calendar/>,
	orientation: 'horizontal',
	value: 2555,
	label: 'Visitors',
};

const IconVertical = bindWithProps(BigNumberStory);
IconVertical.args = {
	icon: (<svg width="100" height="100">
			<circle cx="50%" cy="50%" r="10" fill="red" />
		</svg>),
	orientation: 'vertical',
	value: 2555,
	label: 'Visitors'
};

const NoData = bindWithProps(BigNumberStory);
NoData.args = {
	value: null,
	orientation: 'horizontal',
	label: 'Visitors'
}

const UndefinedData = bindWithProps(BigNumberStory);
UndefinedData.args = {
	value: undefined,
	orientation: 'horizontal',
	label: 'Visitors'
}

export { BasicHorizonal, BasicVertical, IconHorizonal, IconVertical, NoData, UndefinedData };
