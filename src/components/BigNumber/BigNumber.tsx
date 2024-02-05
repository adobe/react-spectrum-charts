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
import { ErrorState } from '@components/ErrorState';
import { sanitizeBigNumberChildren } from '@utils';
import { RscChart } from 'RscChart';
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
}: BigNumberProps) {
	const bigNumberValue = data != undefined && data.length > 0 ? data[data.length - 1]['value'] : undefined;

	const numberLocale = getLocale(locale).number;
	const type = numberType ?? 'linear';
	const formattedValue = bigNumberValue
		? getFormattedString(bigNumberValue, numberLocale, numberFormat, type)
		: bigNumberValue;

	const { lineElements, iconElements } = sanitizeBigNumberChildren(children);

	let areas, columns, align;

	if (iconElements.length > 0 && lineElements.length > 0 && orientation == 'vertical') {
		align = 'center';
		areas = ['sparkline sparkline', 'data data', 'icon label'];
		columns = ['1fr', '4fr'];
	} else if (iconElements.length > 0 && lineElements.length > 0 && orientation == 'horizontal') {
		align = 'start';
		areas = ['sparkline data data', 'sparkline icon label'];
		columns = ['3fr', '1fr', '2fr'];
	} else if (lineElements.length > 0 && orientation == 'vertical') {
		align = 'center';
		areas = ['sparkline', 'data', 'label'];
		columns = ['1fr'];
	} else if (lineElements.length > 0 && orientation == 'horizontal') {
		align = 'start';
		areas = ['sparkline data', 'sparkline label'];
		columns = ['1fr 1fr'];
	} else if (iconElements.length > 0 && orientation == 'vertical') {
		align = 'center';
		areas = ['icon', 'data', 'label'];
		columns = ['1fr'];
	} else if (iconElements.length > 0 && orientation == 'horizontal') {
		align = 'start';
		areas = ['icon data', 'icon label'];
		columns = ['1fr', '2fr'];
	} else if (orientation == 'vertical') {
		align = 'center';
		areas = ['data', 'label'];
		columns = ['1fr'];
	} else {
		align = 'start';
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
					<View gridArea="sparkline">
						{lineElements}
					</View>
					<View gridArea="icon">{iconElements}</View>
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
