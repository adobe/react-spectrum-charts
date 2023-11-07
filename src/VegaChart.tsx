import { FC, useEffect, useMemo, useRef } from 'react';

import { TABLE } from '@constants';
import { useDebugSpec } from '@hooks/useDebugSpec';
import { extractValues, isVegaData } from '@specBuilder/specUtils';
import { expressionFunctions } from 'expressionFunctions';
import { ChartData } from 'types';
import { Config, Padding, Renderers, Spec, View } from 'vega';
import embed from 'vega-embed';
import { Options as TooltipOptions } from 'vega-tooltip';

export interface VegaChartProps {
	chartId: string;
	config: Config;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: ChartData[];
	debug: boolean;
	height: number;
	onNewView: (view: View) => void;
	padding: Padding;
	renderer: Renderers;
	signals?: Record<string, unknown>;
	spec: Spec;
	tooltip: TooltipOptions;
	width: number;
}

export const VegaChart: FC<VegaChartProps> = ({
	chartId,
	config,
	data,
	debug,
	height,
	onNewView,
	padding,
	renderer = 'svg',
	signals,
	spec,
	tooltip,
	width,
}) => {
	const chartView = useRef<View>();

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
		if (width && height) {
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
			embed(`#${chartId}-chart`, specCopy, {
				actions: false,
				expressionFunctions: expressionFunctions,
				renderer,
				width,
				height,
				config,
				padding,
				tooltip,
			}).then(({ view }) => {
				chartView.current = view;
				onNewView(view);
				view.resize();
				view.runAsync();
			});
		}
		return () => {
			// destroy the chart on unmount
			if (chartView.current) {
				chartView.current.finalize();
				chartView.current = undefined;
			}
		};
	}, [chartData.table, chartId, config, data, height, onNewView, padding, renderer, signals, spec, tooltip, width]);

	return <div id={`${chartId}-chart`} className="rsc"></div>;
};
