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
import React, { FC } from 'react';

import { BigNumberProps } from 'types';

import { Flex, Text } from '@adobe/react-spectrum';

export const BigNumber: FC<BigNumberProps> = (props) => {
	const direction = props.orientation == 'vertical' ? 'column' : 'row';
	const alignment = props.orientation == 'vertical' ? 'center' : 'start';

	return (
		<Flex direction={direction}>
			<Flex alignItems="center" direction={direction}>
				{props.icon}
			</Flex>
			<Flex direction="column" alignItems={alignment}>
				<Text>{props.value}</Text>
				<Text>{props.label}</Text>
			</Flex>
		</Flex>
	);
};
