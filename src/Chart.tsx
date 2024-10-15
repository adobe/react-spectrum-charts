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
import { FC, forwardRef, useEffect, useMemo, useRef, useState } from 'react';

import { EmptyState } from '@components/EmptyState';
import { LoadingState } from '@components/LoadingState';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_LINE_TYPES, DEFAULT_LOCALE } from '@constants';
import useChartHeight from '@hooks/useChartHeight';
import useChartImperativeHandle from '@hooks/useChartImperativeHandle';
import useChartWidth from '@hooks/useChartWidth';
import { useResizeObserver } from '@hooks/useResizeObserver';
import { BigNumber } from '@rsc';
import { getColorValue } from '@specBuilder/specUtils';
import { getBigNumberElementsFromChildren, toArray } from '@utils';
import { v4 as uuid } from 'uuid';
import { View } from 'vega';

import { Provider, defaultTheme } from '@adobe/react-spectrum';
import { Theme } from '@react-types/provider';

import './Chart.css';
import { RscChart } from './RscChart';
import { BigNumberElement, ChartData, ChartHandle, ChartProps, LineType, RscChartProps } from './types';

interface PlaceholderContentProps {
	data: ChartData[];
	loading?: boolean;
	height?: number;
	emptyStateText: string;
}

export const Chart = forwardRef<ChartHandle, ChartProps>(
	(
		{
			backgroundColor = DEFAULT_BACKGROUND_COLOR,
			data,
			colors = 'categorical12',
			colorScheme = DEFAULT_COLOR_SCHEME,
			config,
			dataTestId,
			description,
			debug = false,
			emptyStateText = 'No data found',
			height = 300,
			hiddenSeries = [],
			highlightedSeries,
			lineTypes = DEFAULT_LINE_TYPES as LineType[],
			lineWidths = ['M'],
			loading,
			locale = DEFAULT_LOCALE,
			minHeight = 100,
			maxHeight = Infinity,
			minWidth = 100,
			maxWidth = Infinity,
			opacities,
			padding = 0,
			renderer = 'svg',
			symbolShapes,
			symbolSizes,
			theme = defaultTheme,
			title,
			width = 'auto',
			UNSAFE_vegaSpec,
			...props
		},
		forwardedRef
	) => {
		// uuid is used to make a unique id so there aren't duplicate ids if there is more than one Chart component in the document
		const chartId = useRef<string>(`rsc-${uuid()}`);
		// The view returned by vega. This is above RscChart so it can be used for downloading and copying to clipboard.
		const chartView = useRef<View>();
		const [containerWidth, setContainerWidth] = useState<number>(0);
		const [containerHeight, setContainerHeight] = useState<number>(0);

		useChartImperativeHandle(forwardedRef, { chartView, title });

		const containerRef = useResizeObserver<HTMLDivElement>((_target, entry) => {
			if (typeof width !== 'number') {
				setContainerWidth(entry.contentRect.width);
			}

			if (typeof height !== 'number') {
				setContainerHeight(entry.contentRect.height);
			}
		});
		const chartWidth = useChartWidth(containerWidth, maxWidth, minWidth, width); // calculates the width the vega chart should be
		const chartHeight = useChartHeight(containerHeight, maxHeight, minHeight, height); // calculates the height the vega chart should be

		const showPlaceholderContent = useMemo(() => Boolean(loading ?? !data.length), [loading, data]);

		const bigNumberElements = getBigNumberElementsFromChildren(props.children);

		const bigNumberProps =
			bigNumberElements.length > 0 ? (bigNumberElements[0] as BigNumberElement).props : undefined;

		useEffect(() => {
			// if placeholder content is displayed, clear out the chartview so it can't be downloaded or copied to clipboard
			if (showPlaceholderContent) {
				chartView.current = undefined;
			}
		}, [showPlaceholderContent]);

		if (props.children && UNSAFE_vegaSpec) {
			throw new Error(
				'Chart cannot accept both children and `UNSAFE_vegaSpec` prop. Please choose one or the other.'
			);
		}

		// Chart requires children or a Vega spec to configure what is drawn. If there aren't any children or a Vega spec, throw an error and return a fragment.
		if (!props.children && !UNSAFE_vegaSpec) {
			throw new Error(
				'No children in the <Chart/> component. Chart is a collection components and requires children to draw correctly.'
			);
		}

		const childrenCount = toArray(props.children).length;
		const bigNumberCount = bigNumberElements.length;
		if (bigNumberProps && childrenCount != bigNumberCount) {
			console.warn(
				`Detected ${
					childrenCount - bigNumberCount
				} children in the chart that are not BigNumber. Only BigNumber will be displayed. All other elements will be ignored`
			);
		}

		const rscChartProps: RscChartProps = {
			chartView: chartView,
			chartId: chartId,
			data: data,
			backgroundColor: backgroundColor,
			colors: colors,
			colorScheme: colorScheme,
			config: config,
			description: description,
			debug: debug,
			hiddenSeries: hiddenSeries,
			highlightedSeries: highlightedSeries,
			lineTypes: lineTypes,
			lineWidths: lineWidths,
			locale: locale,
			opacities: opacities,
			padding: padding,
			renderer: renderer,
			symbolShapes: symbolShapes,
			symbolSizes: symbolSizes,
			title: title,
			chartWidth: chartWidth,
			chartHeight: chartHeight,
			UNSAFE_vegaSpec: UNSAFE_vegaSpec,
		};

		const chartContent = bigNumberProps ? (
			<BigNumber {...bigNumberProps} rscChartProps={rscChartProps} />
		) : (
			<RscChart {...rscChartProps}>{props.children}</RscChart>
		);

		return (
			<Provider
				colorScheme={colorScheme}
				theme={isValidTheme(theme) ? theme : defaultTheme}
				UNSAFE_style={{ backgroundColor: 'transparent' }}
				height="100%"
			>
				<div ref={containerRef} id={chartId.current} data-testid={dataTestId} className="rsc-container">
					<div style={{ backgroundColor: getColorValue(backgroundColor, colorScheme) }}>
						{showPlaceholderContent ? (
							<PlaceholderContent
								loading={loading}
								data={data}
								height={chartHeight}
								emptyStateText={emptyStateText}
							/>
						) : (
							chartContent
						)}
					</div>
				</div>
			</Provider>
		);
	}
);
Chart.displayName = 'Chart';

const PlaceholderContent: FC<PlaceholderContentProps> = ({ data, emptyStateText, loading, ...layoutProps }) => {
	if (loading) {
		//show a spinner while data is loading
		return <LoadingState {...layoutProps} />;
	} else if (!data.length) {
		//if it is no longer loading but there is not data, show the empty state
		return <EmptyState {...layoutProps} text={emptyStateText} />;
	}
	return <></>;
};

const isValidTheme = (theme: unknown): theme is Theme => {
	return typeof theme === 'object' && theme !== null && 'light' in theme && 'dark' in theme;
};
