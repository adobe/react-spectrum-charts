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

import { ErrorState } from '@components/BigNumber/ErrorState';
import { Line } from '@components/Line';
import { Chart } from 'Chart';
import { BigNumberProps } from 'types';
import { getLocale } from 'utils/locale';

import { Flex, Text } from '@adobe/react-spectrum';
import GraphBarVerticalStacked from '@spectrum-icons/workflow/GraphBarVerticalStacked';

import './BigNumber.css';
import { getFormattedString } from './bigNumberFormatUtils';

export const BigNumber: FC<BigNumberProps> = (props) => {
	const direction = props.orientation == 'vertical' ? 'column' : 'row';
	const alignment = props.orientation == 'vertical' ? 'center' : 'start';

	const bigNumberValue =
		props.data != undefined && props.data.length > 0 ? props.data[props.data.length - 1]['value'] : undefined;

	const numberLocale = getLocale(props.locale).number;
	const numberType = props.numberType ?? 'linear';
	const formattedValue =
		getFormattedString(bigNumberValue, numberLocale, props.numberFormat, numberType) ?? bigNumberValue;

	if (props.data === null) {
		return <ErrorState message="Unable to load. One or more values are null." />;
	} else if (props.data === undefined || formattedValue === undefined) {
		return (
			<ErrorState
				icon={<GraphBarVerticalStacked data-testid="vertical-graph" size="L" />}
				actionText="Please verify that data is defined"
				message="No data available."
			/>
		);
	} else {
		return (
			<div tabIndex={0} className="content">
				<Flex
					direction={direction}
					alignItems="center"
					gap={direction === 'row' ? 'size-150' : 'size-75'}
					UNSAFE_className="content"
				>
					<Chart data={props.data}>
						<Line />
					</Chart>
					<div className="theme main-container">{props.icon}</div>
					<Flex direction="column" alignItems={alignment}>
						<Text UNSAFE_className="theme number">{formattedValue}</Text>
						<Text UNSAFE_className="theme description">{props.label}</Text>
					</Flex>
				</Flex>
			</div>
		);
	}
};
