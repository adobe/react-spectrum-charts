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
import { FC, useEffect, useMemo, useRef } from 'react';

import { PREVIOUS_TABLE, TABLE } from '@constants';
import { useDebugSpec } from '@hooks/useDebugSpec';
import { extractValues, isVegaData, usePreviousChartData } from '@specBuilder/specUtils';
import { Config, Padding, Renderers, Spec, View } from 'vega';
import embed from 'vega-embed';
import { Options as TooltipOptions } from 'vega-tooltip';

import { expressionFunctions, formatTimeDurationLabels } from './expressionFunctions';
import { ChartData, ChartProps } from './types';
import { getLocale } from './utils/locale';

export interface VegaChartProps {
	config: Config;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: ChartData[];
	previousData: ChartData[];
	debug: boolean;
	height: number;
	locale: ChartProps['locale'];
	onNewView: (view: View) => void;
	padding: Padding;
	renderer: Renderers;
	signals?: Record<string, unknown>;
	spec: Spec;
	tooltip: TooltipOptions;
	width: number;
}

export const VegaChart: FC<VegaChartProps> = ({
	config,
	data,
	previousData,
	debug,
	height,
	locale,
	onNewView,
	padding,
	renderer = 'svg',
	signals,
	spec,
	tooltip,
	width,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const chartView = useRef<View>();

	const { number: numberLocale, time: timeLocale } = useMemo(() => getLocale(locale), [locale]);

	// Need to de a deep copy of the data because vega tries to transform the data
	const chartData = useMemo(() => {
		const clonedData = structuredClone(data);

		// We received a full Vega data array with potentially multiple dataset objects
		if (isVegaData(clonedData)) {
			return extractValues(clonedData);
		}

		// We received a simple array of data and we'll set a default key of 'table' to reference internally
		return { [TABLE]: clonedData };
	}, [data]);

	const previousChartData = usePreviousChartData({ [PREVIOUS_TABLE]: chartData.table });

	useDebugSpec(debug, spec, { ...previousChartData, ...chartData }, width, height, config);

	useEffect(() => {
		if (width && height && containerRef.current) {
			const specCopy = JSON.parse(JSON.stringify(spec)) as Spec;
			const tableData = specCopy.data?.find((d) => d.name === TABLE);
			if (tableData && 'values' in tableData) {
				tableData.values = chartData.table;
			}
			const previousTableData = specCopy.data?.find((d) => d.name === PREVIOUS_TABLE);
			if (previousTableData && 'values' in previousTableData) {
				previousTableData.values = previousChartData ? previousChartData.previousTable : [];
			}
			if (signals) {
				specCopy.signals = specCopy.signals?.map((signal) => {
					if (signal.name in signals && signals[signal.name] !== undefined && 'value' in signal) {
						signal.value = signals[signal.name];
					}
					return signal;
				});
			}

			embed(containerRef.current, specCopy, {
				actions: false,
				ast: true,
				config,
				expressionFunctions: {
					...expressionFunctions,
					formatTimeDurationLabels: formatTimeDurationLabels(numberLocale),
				},
				formatLocale: numberLocale as unknown as Record<string, unknown>, // these are poorly typed by vega-embed
				height,
				padding,
				renderer,
				timeFormatLocale: timeLocale as unknown as Record<string, unknown>, // these are poorly typed by vega-embed
				tooltip,
				width,
			}).then(({ view }) => {
				chartView.current = view;
				onNewView(view);
				view.resize();
				view.runAsync();
				// One additional render to settle all resize calculations
				setTimeout(() => view.runAsync(), 0);
			});
		}
		return () => {
			// destroy the chart on unmount
			if (chartView.current) {
				chartView.current.finalize();
				chartView.current = undefined;
			}
		};
	}, [
		chartData.table,
		previousChartData,
		config,
		data,
		previousData,
		height,
		numberLocale,
		timeLocale,
		onNewView,
		padding,
		renderer,
		signals,
		spec,
		tooltip,
		width,
	]);

	return <div ref={containerRef} className="rsc"></div>;
};
