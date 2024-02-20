/* eslint-disable react-hooks/rules-of-hooks */

/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { FC, cloneElement, useRef } from 'react';

import { BIG_NUMBER_ASPECT_RATIO } from '@constants';
import { Line } from '@rsc';
import { sanitizeBigNumberChildren } from '@utils';
import { RscChart } from 'RscChart';
import { BigNumberMethod, BigNumberProps, ChartData, IconElement, LineElement, LineProps, Orientation } from 'types';
import { getLocale } from 'utils/locale';
import { v4 as uuid } from 'uuid';
import { View as VegaView } from 'vega';

import { Flex, Grid, View } from '@adobe/react-spectrum';

import './BigNumber.css';
import { getFormattedString } from './bigNumberFormatUtils';

const BigNumber: FC<BigNumberProps> = ({
	dataKey,
	label,
	numberFormat,
	children,
	icon,
	orientation,
	rscChartProps,
	numberType = 'linear',
	method = 'last',
}) => {
	const chartId = useRef<string>(`rsc-${uuid()}`);
	const chartView = useRef<VegaView>();

	rscChartProps = rscChartProps ?? {
		data: [],
		chartId,
		chartView,
		chartWidth: 200,
	};

	const { chartWidth, height, locale, data, ...rscChartRemain } = rscChartProps;
	const aspectRatio = BIG_NUMBER_ASPECT_RATIO;
	// based on Chart.tsx checks, data will always be defined and have a length greater than 0.
	const bigNumberValue = getBigNumberValue(data, dataKey, method);

	const numberLocale = getLocale(locale).number;

	const formattedValue = getFormattedString(bigNumberValue, numberType, numberLocale, numberFormat);

	const lineElements = sanitizeBigNumberChildren(children);
	const lineProps = lineElements.length > 0 ? (lineElements[0] as LineElement).props : undefined;

	let cWidth: number, cHeight: number, generalJustify: 'center' | 'start', padding: number;

	if (orientation == 'vertical') {
		padding = 0;
		cHeight = height ? height / 2.25 : chartWidth / aspectRatio;
		cWidth = height ? cHeight * aspectRatio : chartWidth;
		generalJustify = 'center';
	} else {
		if (height && height < chartWidth / (1.75 * aspectRatio)) {
			cHeight = height;
			cWidth = height * aspectRatio;
		} else {
			cWidth = chartWidth / 1.75;
			cHeight = cWidth / aspectRatio;
		}
		padding = 10;
		generalJustify = 'start';
	}

	const { areas, columns, iconAlign, labelAlign, iconJustify, iconSize, displayCombo } = getGridProperties(
		icon,
		orientation,
		height,
		chartWidth,
		lineProps
	);
	return (
		<div tabIndex={0} className="big-number-container">
			<Grid
				width={chartWidth}
				height={height}
				areas={areas}
				columns={columns}
				columnGap="size-50"
				justifyItems={generalJustify}
				alignItems={'center'}
			>
				{lineProps && (
					<View gridArea="sparkline" justifySelf={'center'}>
						<RscChart chartWidth={cWidth} height={cHeight} data={data} locale={locale} {...rscChartRemain}>
							<Line {...lineProps} isSparkline isMethodLast={method === 'last'} padding={padding} />
						</RscChart>
					</View>
				)}
				{displayCombo && icon ? (
					<View gridArea="combo" alignSelf={labelAlign} UNSAFE_className="big-number-label">
						<View gridArea="data" UNSAFE_className="big-number-data">
							{formattedValue}
						</View>
						<Flex gap="size-50">
							{cloneElement(icon, { size: iconSize })}
							{label}
						</Flex>
					</View>
				) : (
					<>
						{icon && (
							<View gridArea="icon" alignSelf={iconAlign} justifySelf={iconJustify}>
								{cloneElement(icon, { size: iconSize })}
							</View>
						)}
						<View gridArea="label" alignSelf={labelAlign} UNSAFE_className="big-number-label">
							{label}
						</View>
					</>
				)}
				{!displayCombo && (
					<View gridArea="data" UNSAFE_className="big-number-data">
						{formattedValue}
					</View>
				)}
			</Grid>
		</div>
	);
};

BigNumber.displayName = 'BigNumber';

function getGridProperties(
	icon: IconElement | undefined,
	orientation: Orientation,
	height: number | undefined,
	chartWidth: number,
	lineProps?: LineProps
) {
	let labelAlign: 'start' | 'center' = 'start';
	let iconAlign: 'start';
	let iconJustify: 'end';
	const iconSize = getIconSizeByOrientation(
		orientation,
		chartWidth,
		icon !== undefined,
		lineProps !== undefined,
		height
	);

	// First block (line elements)
	if (lineProps) {
		// Then get the icon conditions
		if (icon) {
			if (orientation === 'vertical') {
				labelAlign = 'center';
				iconJustify = 'end';
				return {
					areas: ['sparkline', 'combo', 'data'],
					columns: ['4fr'],
					displayCombo: true,
					labelAlign,
					iconJustify,
					iconSize,
				};
			}
			if (orientation === 'horizontal') {
				iconJustify = 'end';
				iconAlign = 'start';
				labelAlign = 'center';
				return {
					areas: ['sparkline combo'],
					columns: ['1fr'],
					iconJustify,
					iconAlign,
					displayCombo: true,
					iconSize,
					labelAlign,
				};
			}
		} else {
			if (orientation === 'vertical') {
				return { areas: ['sparkline', 'data', 'label'], columns: ['1fr'], labelAlign };
			}
			if (orientation === 'horizontal') {
				return { areas: ['sparkline data', 'sparkline label'], columns: ['1fr 1fr'], labelAlign };
			}
		}
	}
	// Second block (no line elements)
	if (icon) {
		if (orientation === 'vertical') {
			return {
				areas: ['icon', 'data', 'label'],
				columns: ['1fr'],
				iconSize,
				labelAlign,
			};
		}
		if (orientation === 'horizontal') {
			iconJustify = 'end';
			return {
				areas: ['icon data', 'icon label'],
				columns: ['1fr', '2fr'],
				iconSize,
				iconJustify,
				labelAlign,
			};
		}
	}
	// Third block (default)
	return { areas: ['data', 'label'], columns: ['1fr'], labelAlign };
}

function getIconSizeByOrientation(
	orientation: Orientation,
	chartWidth: number,
	hasIcon: boolean,
	hasLines: boolean,
	height?: number
): 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' {
	if (hasIcon) {
		if (hasLines) {
			if (orientation == 'vertical') {
				return determineIconSize(height ? height / 3 : chartWidth / 2);
			}
			if (orientation == 'horizontal') {
				return determineIconSize(chartWidth / 6);
			}
		}

		if (orientation == 'vertical') {
			return determineIconSize(height ? height / 1.75 : chartWidth);
		} else {
			return determineIconSize(chartWidth / 3.5);
		}
	}
	return 'L';
}

function determineIconSize(widthAvailable: number) {
	if (widthAvailable <= 21) return 'XS';
	else if (widthAvailable <= 35) return 'S';
	else if (widthAvailable <= 45) return 'M';
	else if (widthAvailable <= 60) return 'L';
	else if (widthAvailable <= 75) return 'XL';
	return 'XXL';
}

function getBigNumberValue(data: ChartData[], dataKey: string, method?: BigNumberMethod) {
	if (!method || method === 'last') {
		return data[data.length - 1][dataKey];
	} else {
		// this must be either 'sum' or 'avg'
		const value = data.reduce((sum, cur) => {
			return sum + cur[dataKey];
		}, 0);
		if (method === 'avg') {
			return value / data.length;
		}
		return value;
	}
}

export { BigNumber };
