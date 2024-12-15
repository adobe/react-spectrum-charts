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

import { TABLE } from '@constants';
import { useDebugSpec } from '@hooks/useDebugSpec';
import { extractValues, isVegaData } from '@specBuilder/specUtils';
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
		const clonedData = JSON.parse(JSON.stringify(data));

		// We received a full Vega data array with potentially multiple dataset objects
		if (isVegaData(clonedData)) {
			return extractValues(clonedData);
		}

		// We received a simple array of data and we'll set a default key of 'table' to reference internally
		return { [TABLE]: clonedData };
	}, [data]);

	useDebugSpec(debug, spec, chartData, width, height, config);

	useEffect(() => {
		if (width && height && containerRef.current) {
			const specCopy = JSON.parse(JSON.stringify(spec)) as Spec;
			const tableData = specCopy.data?.find((d) => d.name === TABLE);
			if (tableData && 'values' in tableData) {
				tableData.values = chartData.table;
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
				// c/onsole.log("~~~~")
				// c/onsole.log("~~~~")
				// c/onsole.log("view!", view)
				// c/onsole.log("specCopy!", specCopy)
				// c/onsole.log("tableData!", tableData)
				// c/onsole.log("config!", config)
				// c/onsole.log("containerRef.current",containerRef.current)
				// view._scenegraph.root.items[0].items[3].source.value[0].datum //
				// items[0] of 0 // not sure what this level is
					// items[2] of 4 // role === "mark", name === "bar0_background"
					// items[3] of 4 // role === "mark", name === "bar0"
						// source.value // this is an array of the bars in a bar chart now
						// value[i].datum // this contains the data used to render the bar
						// value[i].x // & y, width, & height are the rendered mark's info
						/*
							browser: "Chrome"
							downloads: 27000
							downloads0: 0
							downloads1: 27000
							percentLabel: "53.1%"
							rscMarkId: 1 // this is the id
							rscStackId: "Chrome" // this id is used for x axis grouping (if stacking?)
							Symbol(vega_id): 13367
						*/
				/* 
					goals:
						- use tableData to construct dimensions: dimension, metric, and color are all used as encoding props. Note: dimension can sometimes be numerical or categorical
						- figure out how to intercept which dimensions are used to encode the chart, use only those
						- create structure: grouped or list based on encoding type, include rendered info
							- view._scenegraph.root.items[0].items[3].source.value[0].datum is where x/y/width/eight are stored
							- what about other mark types?
						- create semantics for axes, legends, groups, elements, etc
						- export the structure and semantics to ghost element renderer
						- add alt text to root chart element
						- on user input:
							- render ghost element
							- show signal in chart
				*/
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
		config,
		data,
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
