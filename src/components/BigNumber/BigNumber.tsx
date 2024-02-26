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
import { BigNumberMethod, BigNumberProps, ChartData, LineElement, LineProps, Orientation } from 'types';
import { getLocale } from 'utils/locale';
import { v4 as uuid } from 'uuid';
import { View as VegaView } from 'vega';

import { Flex } from '@adobe/react-spectrum';

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
	const bigNumberValue = getBigNumberValue(data, dataKey, method);
	const numberLocale = getLocale(locale).number;
	const formattedValue = getFormattedString(bigNumberValue, numberType, numberFormat, numberLocale);
	const lineElements = sanitizeBigNumberChildren(children);

	let lineProps;
	if (lineElements.length > 0) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { padding, isMethodLast, isSparkline, pointSize, ...remainingProps } = (lineElements[0] as LineElement)
			.props;
		lineProps = remainingProps;
	}

	const { iconSize, labelSize, valueSize, pointSize, cWidth, cHeight, padding, textAlign, direction, iconDirection } =
		getDynamicProperties(orientation, chartWidth, lineProps, height);

	return (
		<Flex alignItems={'center'} justifyContent={'center'} direction={direction}>
			<Flex
				columnGap={'size-100'}
				justifyContent={'center'}
				direction={direction}
				width={chartWidth}
				height={height}
			>
				{lineProps && (
					<Flex justifySelf={'center'} alignSelf={'center'} marginTop="5px">
						<RscChart chartWidth={cWidth} height={cHeight} data={data} locale={locale} {...rscChartRemain}>
							<Line
								isSparkline
								isMethodLast={method === 'last'}
								padding={padding}
								pointSize={pointSize}
								{...lineProps}
							/>
						</RscChart>
					</Flex>
				)}
				{icon && !lineProps && (
					<Flex direction={iconDirection} justifyContent={'center'}>
						{cloneElement(icon, { size: iconSize, marginTop: '1px' })}
					</Flex>
				)}

				<Flex direction={'column'} justifyContent={'center'}>
					{icon && lineProps ? (
						<>
							<p style={{ fontSize: valueSize, textAlign: textAlign }} className="big-number-data">
								{formattedValue}
							</p>
							<Flex gap={'size-100'} justifyContent={'center'}>
								<Flex direction={'column'} justifyContent={'center'}>
									{cloneElement(icon, { size: iconSize, marginTop: '1px' })}
								</Flex>
								<p style={{ fontSize: labelSize, textAlign: textAlign }} className="big-number-label">
									{label}
								</p>
							</Flex>
						</>
					) : (
						<>
							<p style={{ fontSize: valueSize, textAlign: textAlign }} className="big-number-data">
								{formattedValue}
							</p>
							<p style={{ fontSize: labelSize, textAlign: textAlign }} className="big-number-label">
								{label}
							</p>
						</>
					)}
				</Flex>
			</Flex>
		</Flex>
	);
};

BigNumber.displayName = 'BigNumber';

type BigNumberIconSize = 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | undefined;

function getDynamicProperties(
	orientation: Orientation,
	chartWidth: number,
	lineProps?: LineProps,
	height?: number
): {
	iconSize: BigNumberIconSize;
	labelSize;
	valueSize;
	cHeight;
	cWidth;
	padding;
	textAlign;
	direction;
	iconDirection;
	pointSize;
} {
	const aspectRatio = BIG_NUMBER_ASPECT_RATIO;

	const iconSize = getDynamicIcon(orientation, chartWidth, lineProps, height);
	let cHeight, cWidth;
	if (orientation == 'vertical') {
		cHeight = height ? height / 3 : chartWidth / aspectRatio;
		cWidth = height ? cHeight * aspectRatio : chartWidth;
		const fontSizes = determineFontSize(chartWidth / 2);
		const pointSize = determinePointSize(cWidth);
		return {
			padding: 0,
			textAlign: 'center',
			direction: 'column',
			iconDirection: 'row',
			labelSize: fontSizes.labelSize,
			valueSize: fontSizes.valueSize,
			iconSize,
			cHeight,
			cWidth,
			pointSize,
		};
	}

	const fontSizes = determineFontSize(chartWidth);
	if (height && height < chartWidth / (1.75 * aspectRatio)) {
		cHeight = height;
		cWidth = height * aspectRatio;
	} else {
		cWidth = chartWidth / 1.75;
		cHeight = cWidth / aspectRatio;
	}
	const pointSize = determinePointSize(cWidth);
	return {
		padding: 10,
		textAlign: 'start',
		direction: 'row',
		iconDirection: 'column',
		labelSize: fontSizes.labelSize,
		valueSize: fontSizes.valueSize,
		iconSize,
		cHeight,
		cWidth,
		pointSize,
	};
}

function determineFontSize(availableSpace: number): { labelSize: string; valueSize: string } {
	if (availableSpace <= 75) return { labelSize: 'medium', valueSize: 'large' };
	else if (availableSpace <= 200) return { labelSize: 'large', valueSize: 'x-large' };
	else if (availableSpace <= 350) return { labelSize: 'x-large', valueSize: 'xx-large' };
	return { labelSize: 'xx-large', valueSize: 'xxx-large' };
}

function determinePointSize(availableSpace: number): number {
	if (availableSpace <= 150) return 50;
	else if (availableSpace <= 300) return 100;
	else if (availableSpace <= 450) return 150;
	return 200;
}

function getDynamicIcon(
	orientation: string,
	chartWidth: number,
	lineProps?: LineProps,
	height?: number
): BigNumberIconSize {
	let iconSize = 'L';
	if (lineProps) {
		if (orientation == 'vertical') {
			const availableSpace = height ? height / 3 : chartWidth / 2;
			iconSize = determineIconSize(availableSpace);
		}
		if (orientation == 'horizontal') {
			iconSize = determineIconSize(chartWidth / 12);
		}
	} else {
		if (orientation == 'vertical') {
			const availableSpace = height ? height / 1.75 : chartWidth;
			iconSize = determineIconSize(availableSpace);
		} else {
			iconSize = determineIconSize(chartWidth / 3.5);
		}
	}
	return iconSize;
}

function determineIconSize(availableSpace: number) {
	if (availableSpace <= 21) return 'XS';
	else if (availableSpace <= 35) return 'S';
	else if (availableSpace <= 45) return 'M';
	else if (availableSpace <= 60) return 'L';
	else if (availableSpace <= 75) return 'XL';
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
