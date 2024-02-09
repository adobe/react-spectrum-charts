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

import { ErrorState } from '@components/ErrorState';
import { sanitizeBigNumberChildren } from '@utils';
import { RscChart } from 'RscChart';
import { BigNumberProps, LineElement } from 'types';
import { getLocale } from 'utils/locale';
import { v4 as uuid } from 'uuid';
import { View as VegaView } from 'vega';

import { Flex, Grid, View } from '@adobe/react-spectrum';
import GraphBarVerticalStacked from '@spectrum-icons/workflow/GraphBarVerticalStacked';

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
		chartWidth: 200,
	},
}: BigNumberProps) {
	const { chartWidth, height, locale, data, ...rscChartRemain } = rscChartProps;
	const aspectRatio = 16 / 9;
	const bigNumberValue = data && data.length > 0 ? data[data.length - 1][dataKey] : undefined;

	const numberLocale = getLocale(locale).number;
	const type = numberType ?? 'linear';
	const formattedValue = bigNumberValue
		? getFormattedString(bigNumberValue, numberLocale, numberFormat, type)
		: bigNumberValue;

	const lineElements = sanitizeBigNumberChildren(children);

	if (lineElements.length > 0 && !rscChartProps) {
		throw new Error('BigNumber must be nested in a Chart');
	}

	let areas,
		columns,
		generalJustify,
		iconAlign,
		iconJustify,
		iconSize,
		dataJustify,
		labelJustify,
		padding,
		cWidth,
		cHeight,
		displayCombo;
	let labelAlign: 'start' | 'center' = 'start';

	if (orientation == 'vertical') {
		padding = 0
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
		padding = 10
		generalJustify = 'start';
	}

	const determineIconSize = (widthAvailable: number) => {
		if (widthAvailable <= 21) return 'XS';
		else if (widthAvailable <= 35) return 'S';
		else if (widthAvailable <= 45) return 'M';
		else if (widthAvailable <= 60) return 'L';
		else if (widthAvailable <= 75) return 'XL';
		return 'XXL';
	};

	if (icon && lineElements.length > 0 && orientation == 'vertical') {
		labelAlign = 'center';
		iconJustify = 'end';
		areas = ['sparkline', 'data', 'combo'];
		displayCombo = true;
		iconSize = determineIconSize(height ? height / 3 : chartWidth / 2);
	} else if (icon && lineElements.length > 0 && orientation == 'horizontal') {
		iconJustify = 'end';
		iconAlign = 'start';
		areas = ['sparkline data', 'sparkline combo'];
		displayCombo = true;
		columns = ['1fr', '1fr'];
		iconSize = determineIconSize(chartWidth / 6);
	} else if (lineElements.length > 0 && orientation == 'vertical') {
		areas = ['sparkline', 'data', 'label'];
	} else if (lineElements.length > 0 && orientation == 'horizontal') {
		areas = ['sparkline data', 'sparkline label'];
		columns = ['1fr 1fr'];
	} else if (icon && orientation == 'vertical') {
		areas = ['icon', 'data', 'label'];
		iconSize = determineIconSize(height ? height / 1.75 : chartWidth);
	} else if (icon && orientation == 'horizontal') {
		iconJustify = 'end';
		areas = ['icon data', 'icon label'];
		columns = ['1fr', '2fr'];
		iconSize = determineIconSize(chartWidth / 3.5);
	} else {
		areas = ['data', 'label'];
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
				<Grid
					width={chartWidth}
					height={height}
					areas={areas}
					columns={columns}
					columnGap="size-50"
					justifyItems={generalJustify}
					alignItems={'center'}
				>
					{lineElements.length > 0 && (
						<View gridArea="sparkline" justifySelf={"center"}>
							<RscChart
								chartWidth={cWidth}
								height={cHeight}
								data={data}
								locale={locale}
								{...rscChartRemain}
							>
								{cloneElement(lineElements[0] as LineElement, { isSparkline: true, padding })}
							</RscChart>
						</View>
					)}
					{displayCombo && icon ? (
						<View
							gridArea="combo"
							justifySelf={labelJustify}
							alignSelf={labelAlign}
							UNSAFE_className="BigNumber-label"
						>
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
							<View
								gridArea="label"
								justifySelf={labelJustify}
								alignSelf={labelAlign}
								UNSAFE_className="BigNumber-label"
							>
								{label}
							</View>
						</>
					)}
					<View gridArea="data" justifySelf={dataJustify} UNSAFE_className="BigNumber-data">
						{formattedValue}
					</View>
				</Grid>
			</div>
		);
	}
}
