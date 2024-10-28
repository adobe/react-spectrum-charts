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
import { CSSProperties, FC, cloneElement, useRef } from 'react';

import { BIG_NUMBER_ASPECT_RATIO } from '@constants';
import { Line } from '@rsc';
import { sanitizeBigNumberChildren } from '@utils';
import { RscChart } from 'RscChart';
import { getLocale } from 'utils/locale';

import { Flex, FlexProps, IconProps } from '@adobe/react-spectrum';

import {
	BigNumberInternalProps,
	BigNumberMethod,
	BigNumberProps,
	ChartData,
	LineElement,
	LineProps,
	Orientation,
	RscChartProps,
} from '../../types';
import './BigNumber.css';
import { formatBigNumber } from './bigNumberFormatUtils';

// We expose this as the external big number, but all we do is take the props from it and pass them to our internal version alongside RscChartProps
const BigNumber: FC<BigNumberProps> = () => {
	return <></>;
};

/**
 *  There are props such as rscChartProps that we don't want exposed externally.
 *  We take the props from the external big number components and pass them to this internal component
 *  alongside some additional props we add ourselves based on the RscChartProps so we can render the sparkline using an RSC line chart.
 */
const BigNumberInternal: FC<BigNumberInternalProps> = ({
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
	const { chartWidth, chartHeight, locale, data } = rscChartProps;
	const bigNumberValue = getBigNumberValue(data, dataKey, method);
	const numberLocale = getLocale(locale).number;
	const formattedValue = formatBigNumber(bigNumberValue, numberType, numberFormat, numberLocale);
	const lineElements = sanitizeBigNumberChildren(children);

	let lineProps: LineProps | undefined;
	if (lineElements.length > 0) {
		lineProps = (lineElements[0] as LineElement).props;
	}

	const { iconSize, labelSize, valueSize } = getIconAndFontSizes(chartWidth, lineProps, orientation);
	const { textAlign, direction, iconDirection } = getLayoutSettings(orientation);

	const labelStyle: CSSProperties = { fontSize: labelSize, textAlign };
	const valueStyle: CSSProperties = { fontSize: valueSize, textAlign };

	return (
		<Flex alignItems={'center'} justifyContent={'center'} direction={direction}>
			<Flex
				columnGap={'size-100'}
				justifyContent={'center'}
				direction={direction}
				width={chartWidth}
				height={chartHeight}
			>
				{lineProps && (
					<BigNumberChart
						rscChartProps={rscChartProps}
						lineProps={lineProps}
						method={method}
						orientation={orientation}
					/>
				)}
				{icon && !lineProps && (
					<Flex direction={iconDirection} justifyContent={'center'}>
						{cloneElement(icon, { size: iconSize, marginTop: '1px' })}
					</Flex>
				)}

				<Flex direction={'column'} justifyContent={'center'}>
					{icon && lineProps ? (
						<>
							<p style={valueStyle} className="big-number-data">
								{formattedValue}
							</p>
							<Flex gap={'size-50'} justifyContent={'center'}>
								<Flex direction={'column'} justifyContent={'center'}>
									{cloneElement(icon, { size: iconSize, marginTop: '1px' })}
								</Flex>
								<p style={labelStyle} className="big-number-label">
									{label}
								</p>
							</Flex>
						</>
					) : (
						<>
							<p style={valueStyle} className="big-number-data">
								{formattedValue}
							</p>
							<p style={labelStyle} className="big-number-label">
								{label}
							</p>
						</>
					)}
				</Flex>
			</Flex>
		</Flex>
	);
};

interface BigNumberChartProps {
	rscChartProps: RscChartProps;
	lineProps: LineProps;
	method: BigNumberMethod;
	orientation: Orientation;
}
const BigNumberChart: FC<BigNumberChartProps> = ({ rscChartProps, lineProps, method, orientation }) => {
	const isVertical = orientation === 'vertical';
	const { chartWidth, chartHeight } = rscChartProps;
	const { cWidth, cHeight } = getBigNumberChartDimensions(chartWidth, chartHeight, isVertical);
	return (
		<Flex justifySelf={'center'} alignSelf={'center'} marginTop="5px">
			<RscChart {...rscChartProps} chartWidth={cWidth} chartHeight={cHeight}>
				<Line
					{...lineProps}
					isSparkline
					isMethodLast={method === 'last'}
					padding={isVertical ? 0 : 10}
					pointSize={getPointSize(cWidth)}
				/>
			</RscChart>
		</Flex>
	);
};

function getBigNumberChartDimensions(
	chartWidth: number,
	height: number | undefined,
	isVertical: boolean
): { cHeight: number; cWidth: number } {
	const aspectRatio = BIG_NUMBER_ASPECT_RATIO;

	if (isVertical) {
		const cHeight = height ? height / 3 : (chartWidth / aspectRatio) * 1.2;
		const cWidth = height ? cHeight * aspectRatio : chartWidth;
		return { cHeight, cWidth };
	}

	// Height is relatively small compared to the width.
	// Adjusts both dimensions to ensure the chart isn't overly wide for its height.
	if (height && height < chartWidth / (2 * aspectRatio)) {
		const cHeight = height / 1.5;
		const cWidth = height * aspectRatio;
		return { cHeight, cWidth };
	}

	// Default case for horizontal orientation
	// Width is reduced for the chart to fit within BigNumber
	// Height kep in same aspect ration as width.
	const cWidth = chartWidth / 2.5;
	const cHeight = cWidth / aspectRatio;
	return { cHeight, cWidth };
}

function getLayoutSettings(orientation: Orientation): {
	textAlign: CSSProperties['textAlign'];
	direction: FlexProps['direction'];
	iconDirection: FlexProps['direction'];
} {
	if (orientation === 'vertical') {
		return {
			textAlign: 'center',
			direction: 'column',
			iconDirection: 'row',
		};
	} else {
		return {
			textAlign: 'start',
			direction: 'row',
			iconDirection: 'column',
		};
	}
}

function getIconAndFontSizes(
	chartWidth: number,
	lineProps: LineProps | undefined,
	orientation: Orientation
): { iconSize: IconProps['size']; labelSize: string; valueSize: string } {
	const fontSizes = getFontSize(chartWidth * 0.75);
	const labelSize = fontSizes.labelSize;
	const valueSize = fontSizes.valueSize;
	const iconSize = getIconSize(orientation === 'vertical' ? labelSize : valueSize, lineProps != undefined);
	return {
		iconSize,
		labelSize,
		valueSize,
	};
}

function getFontSize(availableSpace: number): {
	labelSize: string;
	valueSize: string;
} {
	if (availableSpace <= 75) return { labelSize: 'medium', valueSize: 'large' };
	else if (availableSpace <= 200) return { labelSize: 'large', valueSize: 'x-large' };
	else if (availableSpace <= 350) return { labelSize: 'x-large', valueSize: 'xx-large' };
	return { labelSize: 'xx-large', valueSize: 'xxx-large' };
}

function getPointSize(availableSpace: number): number {
	if (availableSpace <= 150) return 50;
	return 100;
}

function getIconSize(textSize: CSSProperties['fontSize'], isLine: boolean): IconProps['size'] {
	if (isLine) {
		if (textSize === 'medium') {
			return 'XXS';
		} else if (textSize === 'large') {
			return 'XS';
		} else if (textSize === 'x-large') {
			return 'S';
		}
		return 'M';
	} else {
		if (textSize === 'medium') {
			return 'M';
		} else if (textSize === 'large') {
			return 'L';
		} else if (textSize === 'x-large') {
			return 'XL';
		}
		return 'XXL';
	}
}

/**
 * Traverses the chart data and accesses the value for each datum at the specified key.
 * Then processes the values for each datum to return the big number value based on the calculation method.
 * If the value in a datum is not a number it will be treated as 0.
 * @param data The data to calculate the big number value with.
 * @param dataKey The key in each datum that holds the value to be used for the big number calculation.
 * @param method The method used to calculate the big number value.
 * @returns The calculated big number value.
 */
function getBigNumberValue(data: ChartData[], dataKey: string, method: BigNumberMethod = 'last'): number {
	if (method === 'last') {
		const value = data[data.length - 1][dataKey];
		return typeof value === 'number' ? value : 0; // Return 0 if the value is not a number
	} else {
		// This must be either 'sum' or 'avg'
		const value = data.reduce((sum, cur) => {
			const curValue = cur[dataKey];
			return typeof curValue === 'number' ? sum + curValue : sum;
		}, 0);

		if (method === 'avg') return value / data.length;
		return value;
	}
}

BigNumber.displayName = 'BigNumber';
BigNumberInternal.displayName = 'BigNumberInternal';

export { BigNumber, BigNumberInternal };
