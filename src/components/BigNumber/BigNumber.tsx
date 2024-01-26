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
import React, { FC, useState } from 'react';

import { BigNumberProps } from 'types';

import { Flex, Text } from '@adobe/react-spectrum';
import { ErrorState } from '@components/BigNumber/ErrorState';
import GraphBarVerticalStacked from '@spectrum-icons/workflow/GraphBarVerticalStacked';

import './BigNumber.css';


export const BigNumber: FC<BigNumberProps> = (props) => {
	const direction = props.orientation == 'vertical' ? 'column' : 'row';
	const alignment = props.orientation == 'vertical' ? 'center' : 'start';

	const [focused, setFocus] = useState(false);

	function handleClick() {
		setFocus(!focused);
	}

	const formattedValue = props.value ? props.numberFormat?.format(props.value) ?? props.value : props.value;

	if (props.value === null) {
		return <ErrorState message="Unable to load. One or more values are null."/>;
	} else if (props.value === undefined) {
		return <ErrorState icon={<GraphBarVerticalStacked size="L"/>}
						   actionText="Please verify that data is defined" message="No data available."/>
	} else {
		return (
			<div>
				<Flex direction={direction} alignItems="center" gap={direction === 'row' ? 'size-150' : 'size-75'}>
					<div onClick={handleClick} className={`content ${focused ? 'on-focus' : ''}`}>
						<div className="theme main-container">
							{props.icon}
						</div>
						<Flex direction="column" alignItems={alignment}>
							<Text UNSAFE_className="theme number">{formattedValue}</Text>
							<Text UNSAFE_className="theme description">{props.label}</Text>
						</Flex>
					</div>
				</Flex>
			</div>

		);
	}
};
