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
import React, { Children, PropsWithChildren } from 'react';

import { ErrorState } from '@components/ErrorState';
import { Line } from '@components/Line';
import { BigNumberProps } from 'types';
import { getLocale } from 'utils/locale';

import { Grid, View } from '@adobe/react-spectrum';
import GraphBarVerticalStacked from '@spectrum-icons/workflow/GraphBarVerticalStacked';

import './BigNumber.css';
import { getFormattedString } from './bigNumberFormatUtils';

export function BigNumber({
	orientation = 'vertical',
	data = [],
	label,
	locale,
	numberFormat,
	numberType,
	children,
}: PropsWithChildren<BigNumberProps>) {
	const bigNumberValue = data != undefined && data.length > 0 ? data[data.length - 1]['value'] : undefined;

	const numberLocale = getLocale(locale).number;
	const type = numberType ?? 'linear';
	const formattedValue = bigNumberValue ?
		getFormattedString(bigNumberValue, numberLocale, numberFormat, type) : bigNumberValue;

	let lineElement, iconElement;
	Children.forEach(children, (child) => {
		if (child instanceof Line) {
			lineElement = child;
		} else {
			iconElement = child;
		}
	});

	let areas, columns, align;

	if (iconElement && lineElement && orientation == 'vertical') {
		align = 'center';
		areas = ['sparkline sparkline', 'data data', 'icon label'];
		columns = ['1fr', '4fr'];
	} else if (iconElement && lineElement && orientation == 'horizontal') {
		align = 'left';
		areas = ['sparkline data data', 'sparkline icon label'];
		columns = ['3fr', '1fr', '2fr'];
	} else if (lineElement && orientation == 'vertical') {
		align = 'center';
		areas = ['sparkline', 'data', 'label'];
		columns = ['1fr'];
	} else if (lineElement && orientation == 'horizontal') {
		align = 'left';
		areas = ['sparkline data', 'sparkline label'];
		columns = ['1fr 1fr'];
	} else if (iconElement && orientation == 'vertical') {
		align = 'center';
		areas = ['icon', 'data', 'label'];
		columns = ['1fr'];
	} else if (iconElement && orientation == 'horizontal') {
		align = 'left';
		areas = ['icon data', 'icon label'];
		columns = ['1fr', '2fr'];
	} else if (orientation == 'vertical') {
		align = 'center';
		areas = ['data', 'label'];
		columns = ['1fr'];
	} else {
		align = 'left';
		areas = ['data', 'label'];
		columns = ['1fr'];
	}

	if (data === null) {
		return <ErrorState message="Unable to load. One or more values are null." />;
	} else if (data === undefined || formattedValue === undefined) {
		return (
			<ErrorState
				icon={<GraphBarVerticalStacked data-testid="vertical-graph" size="L" />}
				actionText="Please verify that data is defined"
				message="No data available."
			/>
		);
	} else {
		return (
			<div tabIndex={0} className="BigNumber-container">
				<Grid areas={areas} columns={columns} columnGap="size-100" justifyItems={align} alignItems={'center'}>
					<View gridArea="sparkline">{lineElement}</View>
					<View gridArea="icon">{iconElement}</View>
					<View gridArea="data" UNSAFE_className="BigNumber-data">
						{formattedValue}
					</View>
					<View gridArea="label" UNSAFE_className="BigNumber-label">
						{label}
					</View>
				</Grid>
			</div>
		);
	}
}
