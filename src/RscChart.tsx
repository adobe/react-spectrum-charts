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
	COMPONENT_NAME,
	FILTERED_TABLE,
	GROUP_DATA,
	LEGEND_TOOLTIP_DELAY,
	SELECTED_ITEM,
	SELECTED_SERIES,
	SERIES_ID,
} from '@constants';
import useChartImperativeHandle from '@hooks/useChartImperativeHandle';
import useLegend from '@hooks/useLegend';
import useMarkOnClickDetails from '@hooks/useMarkOnClickDetails';
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
import { renderToStaticMarkup } from 'react-dom/server';
import { Item } from 'vega';
import { Handler, Position, Options as TooltipOptions } from 'vega-tooltip';

import { ActionButton, Dialog, DialogTrigger, View as SpectrumView } from '@adobe/react-spectrum';

import './Chart.css';
import { VegaChart } from './VegaChart';
import {
	ChartHandle,
	ColorScheme,
	Datum,
	LegendDescription,
	MarkBounds,
	RscChartProps,
	TooltipAnchor,
	TooltipPlacement,
} from './types';

interface ChartDialogProps {
	datum: Datum | null;
	targetElement: MutableRefObject<HTMLElement | null>;
	setIsPopoverOpen: (isOpen: boolean) => void;
	popover: PopoverDetail;
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
			backgroundColor,
			data,
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
			symbolShapes = ['rounded-square'],
			symbolSizes = ['XS', 'XL'],
			title,
			tooltipAnchor,
			tooltipPlacement,
			chartHeight,
			chartWidth,
			UNSAFE_vegaSpec,
			chartId,
			idKey,
			...props
		},
		forwardedRef
	) => {
		const selectedData = useRef<Datum | null>(null); // data that is currently selected, get's set on click if a popover exists
		const selectedDataName = useRef<string>();
		const selectedDataBounds = useRef<MarkBounds>();
		const popoverAnchorRef = useRef<HTMLDivElement>(null);

		const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false); // tracks the open/close state of the popover

		const sanitizedChildren = sanitizeRscChartChildren(props.children);

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

		const { controlledHoveredIdSignal, controlledHoveredGroupSignal } = useSpecProps(spec);
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
		}, [isPopoverOpen]);

		useChartImperativeHandle(forwardedRef, { chartView, title });

		const {
			legendHiddenSeries,
			setLegendHiddenSeries,
			descriptions: legendDescriptions,
			isToggleable: legendIsToggleable,
			onClick: onLegendClick,
			onMouseOut: onLegendMouseOut,
			onMouseOver: onLegendMouseOver,
		} = useLegend(sanitizedChildren); // gets props from the legend if it exists

		const tooltips = useTooltips(sanitizedChildren);
		const popovers = usePopovers(sanitizedChildren);
		const onMarkClicks = useMarkOnClickDetails(sanitizedChildren);

		// gets the correct css style to display the anchor in the correct position
		const targetStyle = usePopoverAnchorStyle(
			isPopoverOpen,
			chartView.current,
			selectedDataBounds.current,
			padding
		);

		const tooltipOptions = getTooltipOptions(colorScheme, tooltipAnchor, tooltipPlacement);

		if (tooltips.length || legendDescriptions) {
			tooltipOptions.formatTooltip = (value) => {
				debugLog(debug, { title: 'Tooltip datum', contents: value });
				if (value[COMPONENT_NAME]?.startsWith('legend') && legendDescriptions && 'index' in value) {
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
				const tooltip = tooltips.find((t) => t.name === value[COMPONENT_NAME]);
				if (tooltip?.callback && !('index' in value)) {
					if (controlledHoveredIdSignal) {
						chartView.current?.signal(controlledHoveredIdSignal.name, value?.[idKey] ?? null);
					}
					if (controlledHoveredGroupSignal) {
						const key = Object.keys(value).find((k) => k.endsWith('_highlightGroupId'));
						if (key) {
							chartView.current?.signal(controlledHoveredGroupSignal.name, value[key]);
						}
					}
					if (tooltip.highlightBy && tooltip.highlightBy !== 'item') {
						const tableData = chartView.current?.data(FILTERED_TABLE);
						const groupId = `${tooltip.name}_highlightGroupId`;
						value[GROUP_DATA] = tableData?.filter((d) => d[groupId] === value[groupId]);
					}
					return renderToStaticMarkup(
						<div className="rsc-tooltip" data-testid="rsc-tooltip">
							{tooltip.callback(value)}
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
				signals.hiddenSeries = legendHiddenSeries;
			}
			signals[SELECTED_ITEM] = selectedData?.[idKey] ?? null;
			signals[SELECTED_SERIES] = selectedData?.[SERIES_ID] ?? null;

			return signals;
		}, [colorScheme, idKey, legendHiddenSeries, legendIsToggleable]);

		return (
			<>
				<div
					id={`${chartId.current}-popover-anchor`}
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
					onNewView={(view) => {
						chartView.current = view;
						// Add a delay before displaying legend tooltips on hover.
						let tooltipTimeout: NodeJS.Timeout | undefined;
						view.tooltip((viewRef, event, item, value) => {
							const tooltipHandler = new Handler(tooltipOptions);
							// Cancel delayed tooltips if the mouse moves before the delay is resolved.
							if (tooltipTimeout) {
								clearTimeout(tooltipTimeout);
								tooltipTimeout = undefined;
							}
							if (event && event.type === 'pointermove' && itemIsLegendItem(item) && 'tooltip' in item) {
								tooltipTimeout = setTimeout(() => {
									tooltipHandler.call(viewRef, event, item, value);
									tooltipTimeout = undefined;
								}, LEGEND_TOOLTIP_DELAY);
							} else {
								tooltipHandler.call(viewRef, event, item, value);
							}
						});
						if (popovers.length || onMarkClicks.length || legendIsToggleable || onLegendClick) {
							if (legendIsToggleable) {
								view.signal('hiddenSeries', legendHiddenSeries);
							}
							setSelectedSignals({
								idKey,
								selectedData: selectedData.current,
								view,
							});
							view.addEventListener(
								'click',
								getOnMarkClickCallback(
									chartView,
									legendHiddenSeries,
									chartId,
									selectedData,
									selectedDataBounds,
									selectedDataName,
									setLegendHiddenSeries,
									legendIsToggleable,
									onLegendClick,
									onMarkClicks
								)
							);
						}
						view.addEventListener('mouseover', getOnMouseInputCallback(onLegendMouseOver));
						view.addEventListener('mouseout', getOnMouseInputCallback(onLegendMouseOut));
						// this will trigger the autosize calculation making sure that everything is correct size
					}}
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
	}
);
RscChart.displayName = 'RscChart';

const ChartDialog = ({ datum, popover, setIsPopoverOpen, targetElement }: ChartDialogProps) => {
	const { chartPopoverProps, name } = popover;
	const { children, onOpenChange, containerPadding, ...dialogProps } = chartPopoverProps;
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
			<ActionButton id={`${name}-button`} UNSAFE_style={{ display: 'none' }}>
				launch chart popover
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

const getTooltipOptions = (
	colorScheme: ColorScheme,
	tooltipAnchor: TooltipAnchor,
	tooltipPlacement: TooltipPlacement
): TooltipOptions => {
	const position: Record<'top' | 'bottom' | 'right' | 'left', Position[]> = {
		top: ['top', 'bottom', 'right', 'left', 'top-right', 'top-left', 'bottom-right', 'bottom-left'],
		bottom: ['bottom', 'top', 'right', 'left', 'bottom-right', 'bottom-left', 'top-right', 'top-left'],
		right: ['right', 'left', 'top', 'bottom', 'top-right', 'bottom-right', 'top-left', 'bottom-left'],
		left: ['left', 'right', 'top', 'bottom', 'top-left', 'bottom-left', 'top-right', 'bottom-right'],
	};

	const offset = tooltipAnchor === 'cursor' ? 10 : 6;

	return {
		theme: colorScheme,
		anchor: tooltipAnchor,
		position: tooltipAnchor === 'mark' ? position[tooltipPlacement] : undefined,
		offsetX: offset,
		offsetY: offset,
	};
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
