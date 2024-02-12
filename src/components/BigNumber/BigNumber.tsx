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
import { v4 as uuid } from 'uuid';
import { View as VegaView } from 'vega';

import { Flex, Grid, View } from '@adobe/react-spectrum';

import './BigNumber.css';
import { getFormattedString } from './bigNumberFormatUtils';

export function BigNumber({
	dataKey,
	label,
	numberFormat,
	numberType,
	children,
	icon,
	orientation = 'vertical',
	rscChartProps = {
		data: [],
		chartId: useRef<string>(`rsc-${uuid()}`),
		chartView: useRef<VegaView>(),
		chartWidth: 600
							  },
							  method
						  }: BigNumberProps) {
	const { chartWidth, height, locale, data, ...rscChartRemain } = rscChartProps;
	const aspectRatio = 30 / 9;
	// based on Chart.tsx checks, data will always be defined and have a length greater than 0.
	let bigNumberValue: number;
	if (!method || method === 'last') {
		bigNumberValue = data[data.length - 1][dataKey];
	} else {
		// this must be either 'sum' or 'avg'
		bigNumberValue = data.reduce((sum, cur) => {
			return sum + cur[dataKey];
		}, 0);
		if (method === 'avg') {
			bigNumberValue = bigNumberValue / data.length;
		}
	}

	const numberLocale = getLocale(locale).number;
	const type = numberType ?? 'linear';
	const formattedValue = getFormattedString(bigNumberValue, numberLocale, numberFormat, type);

	const lineElements = sanitizeBigNumberChildren(children);

	let cWidth, cHeight, generalJustify;

	if (orientation == 'vertical') {
		cHeight = height ? height / 2.25 : chartWidth / aspectRatio;
		cWidth = height ? cHeight * aspectRatio : chartWidth;
		generalJustify = 'center';
	} else {
		if (height && height < chartWidth / (1.35 * aspectRatio)) {
			cHeight = height;
			cWidth = height * aspectRatio;
		} else {
			cWidth = chartWidth / 1.35;
			cHeight = cWidth / aspectRatio;
		}
		generalJustify = 'start';
	}

	const {areas, columns} = checkElements(icon, lineElements, orientation);

	return (
		<div tabIndex={0} className="BigNumber-container">
			<Grid areas={areas} columns={columns} columnGap="size-100" justifyItems={generalJustify} alignItems={'center'}>
				{lineElements.length > 0 && (
					<View gridArea="sparkline">
						<RscChart
							chartWidth={cWidth}
							height={cHeight}
							data={data}
							locale={locale}
							{...rscChartRemain}
						>
							{lineElements.map((le) => cloneElement(le as LineElement, {
								isSparkline: true,
								isMethodLast: method === 'last'
							}))}
						</RscChart>
					</View>
				)}
				<View gridArea="icon">{icon}</View>
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

function checkElements(icon, lineElements, orientation) {

	if (icon > 0 && lineElements.length > 0 && orientation == 'vertical') {
		return { areas: ['sparkline sparkline', 'data data', 'icon label'], columns: ['1fr', '4fr'] };
	} else if (icon > 0 && lineElements.length > 0 && orientation == 'horizontal') {
		return { areas: ['sparkline data data', 'sparkline icon label'], columns: ['3fr', '1fr', '2fr'] };
	} else if (lineElements.length > 0 && orientation == 'vertical') {
		return { areas: ['sparkline', 'data', 'label'], columns: ['1fr'] };
	} else if (lineElements.length > 0 && orientation == 'horizontal') {
		return { areas: ['sparkline data', 'sparkline label'], columns: ['1fr 1fr'] };
	} else if (icon > 0 && orientation == 'vertical') {
		return { areas: ['icon', 'data', 'label'], columns: ['1fr'] };
	} else if (icon > 0 && orientation == 'horizontal') {
		return { areas: ['icon data', 'icon label'], columns: ['1fr', '2fr']};
	} else {
		return { areas: ['data', 'label'], columns: ['1fr']};
	}
}

