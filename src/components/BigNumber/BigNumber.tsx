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
import { cloneElement, useRef } from 'react';

import { sanitizeBigNumberChildren } from '@utils';
import { RscChart } from 'RscChart';
import { BigNumberProps, LineElement } from 'types';
import { getLocale } from 'utils/locale';
import { View as VegaView } from 'vega';
import { v4 as uuid } from 'uuid';

import { Grid, View } from '@adobe/react-spectrum';

import './BigNumber.css';
import { getFormattedString } from './bigNumberFormatUtils';

export function BigNumber({
	dataKey,
	label,
	numberFormat,
	numberType,
	children,
	orientation = 'vertical',
	rscChartProps = {
		data: [],
		chartId: useRef<string>(`rsc-${uuid()}`),
		chartView: useRef<VegaView>(),
		chartWidth: 600,
	},
	method = 'last'
}: BigNumberProps) {
	const { chartWidth, height, locale, data, ...rscChartRemain } = rscChartProps;

	// based on Chart.tsx checks, data will always be defined and have a length greater than 0.
	let bigNumberValue: number;
	if (method === 'last') {
		bigNumberValue = data[data.length - 1][dataKey];
	} else {
		// this must be either 'sum' or 'avg'
		bigNumberValue = data.reduce((sum, cur) => {
			return sum + cur[dataKey];
		}, 0);
		if (method === 'avg') {
			bigNumberValue = bigNumberValue ? bigNumberValue / data.length : bigNumberValue;
		}
	}

	const numberLocale = getLocale(locale).number;
	const type = numberType ?? 'linear';
	const formattedValue = bigNumberValue
		? getFormattedString(bigNumberValue, numberLocale, numberFormat, type)
		: bigNumberValue;

	const { lineElements, iconElements } = sanitizeBigNumberChildren(children);

	if (lineElements.length > 0 && !rscChartProps) {
		throw new Error('BigNumber must be nested in a Chart to properly display the sparkline.');
	}

	let areas, columns, align, cWidth, cHeight;

	if (orientation == 'vertical') {
		cHeight = height ? height / 2 : undefined;
		cWidth = chartWidth;
		align = 'center';
	} else {
		cHeight = height;
		cWidth = chartWidth / 2;
		align = 'start';
	}

	if (iconElements.length > 0 && lineElements.length > 0 && orientation == 'vertical') {
		areas = ['sparkline sparkline', 'data data', 'icon label'];
		columns = ['1fr', '4fr'];
	} else if (iconElements.length > 0 && lineElements.length > 0 && orientation == 'horizontal') {
		areas = ['sparkline data data', 'sparkline icon label'];
		columns = ['3fr', '1fr', '2fr'];
	} else if (lineElements.length > 0 && orientation == 'vertical') {
		areas = ['sparkline', 'data', 'label'];
		columns = ['1fr'];
	} else if (lineElements.length > 0 && orientation == 'horizontal') {
		areas = ['sparkline data', 'sparkline label'];
		columns = ['1fr 1fr'];
	} else if (iconElements.length > 0 && orientation == 'vertical') {
		areas = ['icon', 'data', 'label'];
		columns = ['1fr'];
	} else if (iconElements.length > 0 && orientation == 'horizontal') {
		areas = ['icon data', 'icon label'];
		columns = ['1fr', '2fr'];
	} else if (orientation == 'vertical') {
		areas = ['data', 'label'];
		columns = ['1fr'];
	} else {
		areas = ['data', 'label'];
		columns = ['1fr'];
	}

	return (
		<div tabIndex={0} className="BigNumber-container">
			<Grid areas={areas} columns={columns} columnGap="size-100" justifyItems={align} alignItems={'center'}>
				{lineElements.length > 0 && (
					<View gridArea="sparkline">
						<RscChart
							chartWidth={cWidth}
							height={cHeight}
							data={data}
							locale={locale}
							{...rscChartRemain}
						>
							{lineElements.map((le) => cloneElement(le as LineElement, { isSparkline: true, isMethodLast: method === 'last' }))}
						</RscChart>
					</View>
				)}
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
