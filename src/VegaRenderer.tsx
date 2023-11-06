import { FC, useEffect } from 'react';

import { TABLE } from '@constants';
import { expressionFunctions } from 'expressionFunctions';
import { Config, Padding, Renderers, Spec, View } from 'vega';
import embed from 'vega-embed';
import { Options as TooltipOptions } from 'vega-tooltip';

export interface VegaRendererProps {
	chartId: string;
	config: Config;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: { table: object[] };
	height: number;
	onNewView: (view: View) => void;
	padding: Padding;
	renderer: Renderers;
	signals?: Record<string, unknown>;
	spec: Spec;
	tooltip: TooltipOptions;
	width: number;
}

export const VegaRenderer: FC<VegaRendererProps> = ({
	chartId,
	config,
	data,
	height,
	onNewView,
	padding,
	renderer = 'svg',
	signals,
	spec,
	tooltip,
	width,
}) => {
	console.log('render VegaRenderer');
	useEffect(() => {
		if (width && height) {
			console.log('reder visualization');
			const specCopy = JSON.parse(JSON.stringify(spec)) as Spec;
			const tableData = specCopy.data?.find((d) => d.name === TABLE);
			if (tableData && 'values' in tableData) {
				tableData.values = data.table;
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
				onNewView(view);
			});
		}
	}, [chartId, config, data, height, onNewView, padding, renderer, signals, spec, tooltip, width]);

	return <div id={`${chartId}-chart`} className="rsc"></div>;
};
