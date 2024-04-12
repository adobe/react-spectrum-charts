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
import { FC, MutableRefObject, forwardRef, useEffect, useMemo, useRef, useState } from 'react';

import {
	DEFAULT_BACKGROUND_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_LINE_TYPES,
	DEFAULT_LOCALE,
	LEGEND_TOOLTIP_DELAY,
	MARK_ID,
	SELECTED_ITEM,
	SELECTED_SERIES,
	SERIES_ID,
} from '@constants';
import useChartImperativeHandle from '@hooks/useChartImperativeHandle';
import useLegend from '@hooks/useLegend';
import usePopoverAnchorStyle from '@hooks/usePopoverAnchorStyle';
import usePopovers, { PopoverDetail } from '@hooks/usePopovers';
import useSpec from '@hooks/useSpec';
import useSpecProps from '@hooks/useSpecProps';
import useTooltips from '@hooks/useTooltips';
import { getColorValue } from '@specBuilder/specUtils';
import { getChartConfig } from '@themes/spectrumTheme';
import {
	debugLog,
	getOnMarkClickCallback,
	getOnMouseInputCallback,
	sanitizeRscChartChildren,
	setSelectedSignals,
} from '@utils';
import { VegaChart } from 'VegaChart';
import { renderToStaticMarkup } from 'react-dom/server';
import { Item } from 'vega';
import { Handler, Options as TooltipOptions } from 'vega-tooltip';

import { ActionButton, Dialog, DialogTrigger, View as SpectrumView } from '@adobe/react-spectrum';

import './Chart.css';
import { ChartHandle, Datum, LegendDescription, MarkBounds, RscChartProps } from './types';

interface ChartDialogProps {
	datum: Datum | null;
	itemName?: string;
	targetElement: MutableRefObject<HTMLElement | null>;
	setPopoverState: (isOpen: boolean) => void;
	popovers: PopoverDetail[];
}

interface LegendTooltipProps {
	value: { index: number };
	descriptions: LegendDescription[];
	domain: string[];
}

export const RscChart = forwardRef<ChartHandle, RscChartProps>(
	(
		{
			chartView,
			backgroundColor = DEFAULT_BACKGROUND_COLOR,
			data,
			previousData,
			animations,
			colors = 'categorical12',
			colorScheme = DEFAULT_COLOR_SCHEME,
			config,
			description,
			debug = false,
			height = 300,
			hiddenSeries = [],
			highlightedSeries,
			lineTypes = DEFAULT_LINE_TYPES,
			lineWidths = ['M'],
			locale = DEFAULT_LOCALE,
			opacities,
			padding = 0,
			renderer = 'svg',
			symbolShapes,
			symbolSizes,
			title,
			chartWidth,
			UNSAFE_vegaSpec,
			chartId,
			...props
		},
		forwardedRef
	) => {
		// uuid is used to make a unique id so there aren't duplicate ids if there is more than one Chart component in the document

		// state variable for storing if chart should reanimate from zero / animate across data sets
		const [animateFromZero, setAnimateFromZero] = useState(true);
		const selectedData = useRef<Datum | null>(null); // data that is currently selected, gets set on click if a popover exists
		const selectedDataName = useRef<string>();
		const selectedDataBounds = useRef<MarkBounds>();
		const popoverAnchorRef = useRef<HTMLDivElement>(null);

		const [popoverIsOpen, setPopoverIsOpen] = useState<boolean>(false); // tracks the open/close state of the popover

		const sanitizedChildren = sanitizeRscChartChildren(props.children);

		// when data changes, make sure that we are animating from zero (especially in the case where a popover was just
		// opened and closed)
		useEffect(() => {
			setAnimateFromZero(true);
		}, [data]);

		const spec = useSpec({
			backgroundColor,
			children: sanitizedChildren,
			colors,
			data,
			previousData,
			animations: animations ?? true,
			animateFromZero,
			description,
			hiddenSeries,
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

		const { controlledHoverSignal } = useSpecProps(spec);
		const chartConfig = useMemo(() => getChartConfig(config, colorScheme), [config, colorScheme]);

		useEffect(() => {
			const tooltipElement = document.getElementById('vg-tooltip-element');
			if (!tooltipElement) return;
			// Hide tooltips on all charts when a popover is open
			tooltipElement.hidden = popoverIsOpen;


			if (popoverIsOpen) {
				setAnimateFromZero(false);
			} else {
				// if the popover is closed, reset the selected data
				selectedData.current = null;
			}
		}, [popoverIsOpen]);

		useChartImperativeHandle(forwardedRef, { chartView, title });

		const {
			hiddenSeriesState,
			setHiddenSeries,
			descriptions: legendDescriptions,
			isToggleable: legendIsToggleable,
			onClick: onLegendClick,
			onMouseOut: onLegendMouseOut,
			onMouseOver: onLegendMouseOver,
		} = useLegend(sanitizedChildren); // gets props from the legend if it exists

		const tooltips = useTooltips(sanitizedChildren);
		const popovers = usePopovers(sanitizedChildren);

		// gets the correct css style to display the anchor in the correct position
		const targetStyle = usePopoverAnchorStyle(
			popoverIsOpen,
			chartView.current,
			selectedDataBounds.current,
			padding
		);

		const tooltipConfig: TooltipOptions = { theme: colorScheme };

		if (tooltips.length || legendDescriptions) {
			tooltipConfig.formatTooltip = (value) => {
				debugLog(debug, { title: 'Tooltip datum', contents: value });
				if (value.rscComponentName?.startsWith('legend') && legendDescriptions && 'index' in value) {
					debugLog(debug, {
						title: 'Legend descriptions',
						contents: legendDescriptions,
					});
					return renderToStaticMarkup(
						<LegendTooltip
							value={value}
							descriptions={legendDescriptions}
							domain={chartView.current?.scale('legend0Entries').domain()}
						/>
					);
				}
				// get the correct tooltip to render based on the hovered item
				const tooltip = tooltips.find((t) => t.name === value.rscComponentName)?.callback;
				if (tooltip && !('index' in value)) {
					if (controlledHoverSignal) {
						chartView.current?.signal(controlledHoverSignal.name, value?.[MARK_ID] ?? null);
					}
					return renderToStaticMarkup(
						<div className="rsc-tooltip" data-testid="rsc-tooltip">
							{tooltip(value)}
						</div>
					);
				}
				return '';
			};
		}

		const signals = useMemo(() => {
			const signals: Record<string, unknown> = {
				backgroundColor: getColorValue('gray-50', colorScheme),
			};

			if (legendIsToggleable) {
				signals.hiddenSeries = hiddenSeriesState;
			}
			signals[SELECTED_ITEM] = selectedData?.[MARK_ID] ?? null;
			signals[SELECTED_SERIES] = selectedData?.[SERIES_ID] ?? null;

			return signals;
		}, [colorScheme, hiddenSeriesState, legendIsToggleable]);

		const newSpec = structuredClone(spec);

		const onNewView = (view) => {
			chartView.current = view;
			// Add a delay before displaying legend tooltips on hover.
			let tooltipTimeout: NodeJS.Timeout | undefined;
			view.tooltip((_, event, item, value) => {
				const tooltipHandler = new Handler(tooltipConfig);
				// Cancel delayed tooltips if the mouse moves before the delay is resolved.
				if (tooltipTimeout) {
					clearTimeout(tooltipTimeout);
					tooltipTimeout = undefined;
				}
				if (event && event.type === 'pointermove' && itemIsLegendItem(item) && 'tooltip' in item) {
					tooltipTimeout = setTimeout(() => {
						tooltipHandler.call(this, event, item, value);
						tooltipTimeout = undefined;
					}, LEGEND_TOOLTIP_DELAY);
				} else {
					tooltipHandler.call(this, event, item, value);
				}
			});
			if (popovers.length || legendIsToggleable || onLegendClick) {
				if (legendIsToggleable) {
					view.signal('hiddenSeries', hiddenSeriesState);
				}
				setSelectedSignals({
					selectedData: selectedData.current,
					view,
				});
				view.addEventListener(
					'click',
					getOnMarkClickCallback(
						chartView,
						hiddenSeriesState,
						chartId,
						selectedData,
						selectedDataBounds,
						selectedDataName,
						setHiddenSeries,
						legendIsToggleable,
						onLegendClick
					)
				);
			}
			view.addEventListener('mouseover', getOnMouseInputCallback(onLegendMouseOver));
			view.addEventListener('mouseout', getOnMouseInputCallback(onLegendMouseOut));
			// this will trigger the autosize calculation making sure that everything is correct size
		};

		return (
			<>
				<div
					id={`${chartId.current}-popover-anchor`}
					data-testid="rsc-popover-anchor"
					ref={popoverAnchorRef}
					style={targetStyle}
				/>
				<VegaChart
					spec={newSpec}
					config={chartConfig}
					data={data}
					previousData={previousData ?? []}
					debug={debug}
					renderer={renderer}
					width={chartWidth}
					height={height}
					locale={locale}
					padding={padding}
					signals={signals}
					tooltip={tooltipConfig} // legend show/hide relies on this
					onNewView={onNewView}
				/>
				<ChartDialog
					datum={selectedData.current}
					targetElement={popoverAnchorRef}
					setPopoverState={setPopoverIsOpen}
					popovers={popovers}
					itemName={selectedDataName.current}
				/>
			</>
		);
	}
);
RscChart.displayName = 'RscChart';

const ChartDialog = ({ datum, itemName, targetElement, setPopoverState, popovers }: ChartDialogProps) => {
	if (!popovers.length) {
		return <></>;
	}
	const popoverDetail = popovers.find((p) => p.name === itemName);
	const popover = popoverDetail?.callback;
	const width = popoverDetail?.width;
	return (
		<DialogTrigger
			type="popover"
			mobileType="tray"
			targetRef={targetElement}
			onOpenChange={setPopoverState}
			placement="top"
			hideArrow
		>
			<ActionButton UNSAFE_style={{ display: 'none' }}>launch chart popover</ActionButton>
			{(close) => (
				<Dialog data-testid="rsc-popover" UNSAFE_className="rsc-popover" minWidth="size-1000" width={width}>
					<SpectrumView gridColumn="1/-1" gridRow="1/-1" margin={12}>
						{popover && datum && popover(datum, close)}
					</SpectrumView>
				</Dialog>
			)}
		</DialogTrigger>
	);
};

const LegendTooltip: FC<LegendTooltipProps> = ({ value, descriptions, domain }) => {
	const series = domain[value.index];
	const description = descriptions.find((d) => d.seriesName === series);
	if (!description) {
		return <></>;
	}
	return (
		<div className="rsc-tooltip legend-tooltip" data-testid="rsc-tooltip">
			<div className="series">{description.title ?? series}</div>
			<p className="series-description">{description.description}</p>
		</div>
	);
};

const itemIsLegendItem = (item: Item<unknown>): boolean => {
	return 'name' in item.mark && typeof item.mark.name === 'string' && item.mark.name.includes('legend');
};