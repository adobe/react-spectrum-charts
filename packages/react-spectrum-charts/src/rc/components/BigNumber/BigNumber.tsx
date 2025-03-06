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
import { CSSProperties, FC, cloneElement } from 'react';

import { Flex, FlexProps, IconProps } from '@adobe/react-spectrum';

import { RscChart } from '../../../RscChart';
import { Line } from '../../../components';
import { BigNumberMethod, Orientation } from '../../../specBuilder';
import { BigNumberProps, ChartData, LineProps, RscChartProps } from '../../../types';
import { sanitizeBigNumberChildren } from '../../../utils';
import { getLocale } from '../../../utils/locale';
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
const BigNumberInternal: FC<BigNumberProps & { rscChartProps: RscChartProps }> = ({
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
		lineProps = lineElements[0].props;
	}

	const bigNumberSize = getBigNumberSize(chartWidth, chartHeight);
	const { iconSize, labelSize, valueSize } = getIconAndFontSizes(bigNumberSize, lineProps, orientation);
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
	const bigNumberSize = getBigNumberSize(chartWidth, chartHeight);
	const { cWidth, cHeight } = getBigNumberChartDimensions(bigNumberSize);
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

type BigNumberSize = 'small' | 'medium' | 'large' | 'x-large';
export function getBigNumberSize(chartWidth: number, chartHeight: number): BigNumberSize {
	if (chartWidth <= 100 || chartHeight <= 100) return 'small';
	else if (chartWidth <= 266 || chartHeight <= 200) return 'medium';
	else if (chartWidth <= 466 || chartHeight <= 300) return 'large';
	return 'x-large';
}

export function getBigNumberChartDimensions(bigNumberSize: BigNumberSize): { cHeight: number; cWidth: number } {
	let cWidth = 200;
	let cHeight = 100;
	if (bigNumberSize === 'small') {
		cWidth = 75;
		cHeight = 35;
	} else if (bigNumberSize === 'medium') {
		cWidth = 100;
		cHeight = 50;
	} else if (bigNumberSize === 'large') {
		cWidth = 150;
		cHeight = 75;
	}

	return { cWidth, cHeight };
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
	bigNumberSize: BigNumberSize,
	lineProps: LineProps | undefined,
	orientation: Orientation
): { iconSize: IconProps['size']; labelSize: string; valueSize: string } {
	const fontSizes = getFontSize(bigNumberSize);
	const labelSize = fontSizes.labelSize;
	const valueSize = fontSizes.valueSize;

	const fontSize = orientation === 'vertical' ? labelSize : valueSize;
	const iconSize = lineProps !== undefined ? getIconSizeWithChart(fontSize) : getIconSize(fontSize);

	return {
		iconSize,
		labelSize,
		valueSize,
	};
}

export function getFontSize(bigNumberSize: BigNumberSize): {
	labelSize: string;
	valueSize: string;
} {
	if (bigNumberSize === 'small') return { labelSize: 'medium', valueSize: 'large' };
	else if (bigNumberSize === 'medium') return { labelSize: 'large', valueSize: 'x-large' };
	else if (bigNumberSize === 'large') return { labelSize: 'x-large', valueSize: 'xx-large' };
	return { labelSize: 'xx-large', valueSize: 'xxx-large' };
}

function getPointSize(availableSpace: number): number {
	if (availableSpace <= 150) return 50;
	return 100;
}

function getIconSizeWithChart(textSize: CSSProperties['fontSize']): IconProps['size'] {
	if (textSize === 'medium') {
		return 'XXS';
	} else if (textSize === 'large') {
		return 'XS';
	} else if (textSize === 'x-large') {
		return 'S';
	}
	return 'M';
}

function getIconSize(textSize: CSSProperties['fontSize']): IconProps['size'] {
	if (textSize === 'medium') {
		return 'M';
	} else if (textSize === 'large') {
		return 'L';
	} else if (textSize === 'x-large') {
		return 'XL';
	}
	return 'XXL';
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
