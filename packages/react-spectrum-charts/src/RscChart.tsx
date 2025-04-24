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
import { MutableRefObject, forwardRef, useEffect, useMemo } from 'react';

import { ActionButton, Dialog, DialogTrigger, View as SpectrumView } from '@adobe/react-spectrum';
import { COMPONENT_NAME, DEFAULT_SYMBOL_SHAPES, DEFAULT_SYMBOL_SIZES } from '@spectrum-charts/constants';
import { getChartConfig } from '@spectrum-charts/themes';
import { ChartHandle, Datum, SymbolSize } from '@spectrum-charts/vega-spec-builder';

import './Chart.css';
import { VegaChart } from './VegaChart';
import { useChartContext } from './context/RscChartContext';
import useChartImperativeHandle from './hooks/useChartImperativeHandle';
import { useChartInteractions } from './hooks/useChartInteractions';
import usePopovers, { PopoverDetail } from './hooks/usePopovers';
import useSpec from './hooks/useSpec';
import useSpecProps from './hooks/useSpecProps';
import { RscChartProps } from './types';
import { sanitizeRscChartChildren } from './utils';

interface ChartDialogProps {
	datum: Datum | null;
	targetElement: MutableRefObject<HTMLElement | null>;
	setIsPopoverOpen: (isOpen: boolean) => void;
	popover: PopoverDetail;
}

export const RscChart = forwardRef<ChartHandle, RscChartProps>((props, forwardedRef) => {
	const {
		backgroundColor,
		data,
		chartWidth,
		chartHeight,
		colors,
		colorScheme,
		config,
		description,
		debug,
		hiddenSeries,
		highlightedItem,
		highlightedSeries,
		lineTypes,
		lineWidths,
		locale,
		opacities,
		padding,
		renderer,
		symbolShapes = DEFAULT_SYMBOL_SHAPES,
		symbolSizes = DEFAULT_SYMBOL_SIZES as [SymbolSize, SymbolSize],
		title,
		UNSAFE_vegaSpec,
		idKey,
	} = props;

	const { chartView, chartId, selectedData, popoverAnchorRef, isPopoverOpen, setIsPopoverOpen } = useChartContext();

	const sanitizedChildren = useMemo(() => sanitizeRscChartChildren(props.children), [props.children]);

	// THE MAGIC, builds our spec
	const spec = useSpec({
		backgroundColor,
		children: sanitizedChildren,
		colors,
		data,
		description,
		idKey,
		hiddenSeries,
		highlightedItem,
		highlightedSeries,
		symbolShapes,
		symbolSizes,
		lineTypes,
		lineWidths,
		opacities,
		colorScheme,
		title,
		UNSAFE_vegaSpec,
	});

	useSpecProps(spec);

	const { signals, targetStyle, tooltipOptions, onNewView } = useChartInteractions(props, sanitizedChildren);
	const chartConfig = useMemo(() => getChartConfig(config, colorScheme), [config, colorScheme]);

	useEffect(() => {
		const tooltipElement = document.getElementById('vg-tooltip-element');
		if (!tooltipElement) return;
		// Hide tooltips on all charts when a popover is open
		tooltipElement.hidden = isPopoverOpen;

		// if the popover is closed, reset the selected data
		if (!isPopoverOpen) {
			selectedData.current = null;
		}
	}, [isPopoverOpen, selectedData]);

	useChartImperativeHandle(forwardedRef, { chartView, title });
	const popovers = usePopovers(sanitizedChildren);

	return (
		<>
			<div
				id={`${chartId}-popover-anchor`}
				data-testid="rsc-popover-anchor"
				ref={popoverAnchorRef}
				style={targetStyle}
			/>
			<VegaChart
				spec={spec}
				config={chartConfig}
				data={data}
				debug={debug}
				renderer={renderer}
				width={chartWidth}
				height={chartHeight}
				locale={locale}
				padding={padding}
				signals={signals}
				tooltip={tooltipOptions} // legend show/hide relies on this
				onNewView={onNewView}
			/>
			{popovers.map((popover) => (
				<ChartDialog
					key={popover.key}
					datum={selectedData.current}
					targetElement={popoverAnchorRef}
					setIsPopoverOpen={setIsPopoverOpen}
					popover={popover}
				/>
			))}
		</>
	);
});
RscChart.displayName = 'RscChart';

const ChartDialog = ({ datum, popover, setIsPopoverOpen, targetElement }: ChartDialogProps) => {
	const { chartPopoverProps, name } = popover;
	const { children, onOpenChange, containerPadding, rightClick, ...dialogProps } = chartPopoverProps;
	const minWidth = dialogProps.minWidth ?? 0;

	return (
		<DialogTrigger
			type="popover"
			mobileType="tray"
			targetRef={targetElement}
			onOpenChange={(isOpen) => {
				onOpenChange?.(isOpen);
				setIsPopoverOpen(isOpen);
			}}
			placement="top"
			hideArrow
			containerPadding={containerPadding}
		>
			<ActionButton
				id={`${name}-${rightClick ? 'contextmenu' : 'popover'}-button`}
				UNSAFE_style={{ display: 'none' }}
			>
				{rightClick ? 'launch chart context menu' : 'launch chart popover'}
			</ActionButton>
			{(close) => (
				<Dialog data-testid="rsc-popover" UNSAFE_className="rsc-popover" {...dialogProps} minWidth={minWidth}>
					<SpectrumView gridColumn="1/-1" gridRow="1/-1" margin={12}>
						{datum && datum[COMPONENT_NAME] === name && children?.(datum, close)}
					</SpectrumView>
				</Dialog>
			)}
		</DialogTrigger>
	);
};
