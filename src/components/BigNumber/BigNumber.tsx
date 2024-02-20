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

	const iconSize = getIconSizeByOrientation(orientation, chartWidth, icon, lineProps, height);
	const { areas, columns, iconAlign, labelAlign, iconJustify, displayCombo } = getGridProperties(
		orientation,
		lineProps,
		icon
	);
	return (
		<div className="big-number-container">
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

interface BigNumberGridProperties {
	areas: string[];
	columns: string[];
	iconAlign?: 'start';
	labelAlign?: 'start' | 'center';
	iconJustify?: 'end';
	displayCombo?: boolean;
}

type BigNumberIconSize = 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

function getGridProperties(
	orientation: Orientation,
	lineProps?: LineProps,
	icon?: IconElement
): BigNumberGridProperties {
	// First block (line elements)
	if (lineProps) {
		// Then get the icon conditions
		if (icon) {
			return getIconAndLineGridProperties(orientation);
		} else {
			return getLineGridProperties(orientation);
		}
	}
	// Second block (no line elements)
	if (icon) {
		return getIconGridProperties(orientation);
	}
	// Third block (default)
	return getDefaultGridProperties();
}

function getIconAndLineGridProperties(orientation: Orientation): BigNumberGridProperties {
	const labelAlign = 'center';
	const iconJustify = 'end';
	if (orientation === 'vertical') {
		return {
			areas: ['sparkline', 'combo', 'data'],
			columns: ['4fr'],
			displayCombo: true,
			labelAlign,
			iconJustify,
		};
	} else {
		const iconAlign = 'start';
		return {
			areas: ['sparkline combo'],
			columns: ['1fr'],
			iconJustify,
			iconAlign,
			displayCombo: true,
			labelAlign,
		};
	}
}

function getLineGridProperties(orientation: Orientation): BigNumberGridProperties {
	const labelAlign = 'start';
	if (orientation === 'vertical') {
		return { areas: ['sparkline', 'data', 'label'], columns: ['1fr'], labelAlign };
	} else {
		return { areas: ['sparkline data', 'sparkline label'], columns: ['1fr 1fr'], labelAlign };
	}
}

function getIconGridProperties(orientation: Orientation): BigNumberGridProperties {
	const labelAlign = 'start';
	if (orientation === 'vertical') {
		return {
			areas: ['icon', 'data', 'label'],
			columns: ['1fr'],
			labelAlign,
		};
	} else {
		const iconJustify = 'end';
		return {
			areas: ['icon data', 'icon label'],
			columns: ['1fr', '2fr'],
			iconJustify,
			labelAlign,
		};
	}
}

function getDefaultGridProperties(): BigNumberGridProperties {
	const labelAlign = 'start';
	return { areas: ['data', 'label'], columns: ['1fr'], labelAlign };
}

function getIconSizeByOrientation(
	orientation: Orientation,
	chartWidth: number,
	icon?: IconElement,
	lineProps?: LineProps,
	height?: number
): BigNumberIconSize {
	if (icon) {
		return 'L';
	}

	if (lineProps) {
		if (orientation == 'vertical') {
			const availableWidth = height ? height / 3 : chartWidth / 2;
			return determineIconSize(availableWidth);
		}
		if (orientation == 'horizontal') {
			return determineIconSize(chartWidth / 6);
		}
	}

	if (orientation == 'vertical') {
		const availableWidth = height ? height / 1.75 : chartWidth;
		return determineIconSize(availableWidth);
	} else {
		return determineIconSize(chartWidth / 3.5);
	}
}

function determineIconSize(availableWidth: number) {
	if (availableWidth <= 21) return 'XS';
	else if (availableWidth <= 35) return 'S';
	else if (availableWidth <= 45) return 'M';
	else if (availableWidth <= 60) return 'L';
	else if (availableWidth <= 75) return 'XL';
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
