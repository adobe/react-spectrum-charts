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

import {
	ActionButton,
	Dialog,
	DialogTrigger,
	Provider,
	View as SpectrumView,
	defaultTheme,
} from '@adobe/react-spectrum';
import { EmptyState } from '@components/EmptyState';
import { LoadingState } from '@components/LoadingState';
import { DEFAULT_COLOR_SCHEME, DEFAULT_LINE_TYPES } from '@constants';
import useChartWidth from '@hooks/useChartWidth';
import { useDebugSpec } from '@hooks/useDebugSpec';
import useElementSize from '@hooks/useElementSize';
import useLegend from '@hooks/useLegend';
import usePopover from '@hooks/usePopover';
import usePopoverAnchorStyle from '@hooks/usePopoverAnchorStyle';
import usePrismImperativeHandle from '@hooks/usePrismImperativeHandle';
import useSpec from '@hooks/useSpec';
import useSpecProps from '@hooks/useSpecProps';
import useTooltip from '@hooks/useTooltip';
import { Theme } from '@react-types/provider';
import { getColorValue } from '@specBuilder/specUtils';
import { getPrismConfig } from '@themes/spectrumTheme';
import { debugLog, getItemBounds, isItemSceneItem, sanitizeChartChildren, setSelectedSignals } from '@utils';
import React, { FC, MutableRefObject, forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Vega } from 'react-vega';
import { v4 as uuid } from 'uuid';
import { Item, ScenegraphEvent, View } from 'vega';
import { Options as TooltipOptions } from 'vega-tooltip';

import './Prism.css';
import { TABLE } from './constants';
import { expressionFunctions } from './expressionFunctions';
import { extractValues, isVegaData } from './specBuilder/specUtils';
import { Datum, LegendDescription, MarkBounds, PopoverHandler, PrismData, PrismHandle, PrismProps } from './types';

interface ChartDialogProps {
	datum: Datum | null;
	targetElement: MutableRefObject<HTMLElement | null>;
	width?: number;
	setPopoverState: (isOpen: boolean) => void;
	popover?: PopoverHandler;
}

interface LegendTooltipProps {
	value: { index: number };
	descriptions: LegendDescription[];
	domain: string[];
}

interface PlaceholderContentProps {
	data: PrismData[];
	loading?: boolean;
	height?: number;
}

export const Prism = forwardRef<PrismHandle, PrismProps>(
	(
		{
			backgroundColor = 'transparent',
			data,
			colors = 'categorical12',
			colorScheme = DEFAULT_COLOR_SCHEME,
			config,
			dataTestId,
			description,
			debug = false,
			height = 300,
			lineTypes = DEFAULT_LINE_TYPES,
			lineWidths = ['M'],
			loading,
			minWidth = 100,
			maxWidth = Infinity,
			opacities,
			padding = 0,
			renderer = 'svg',
			symbolShapes,
			theme = defaultTheme,
			title,
			width = 'auto',
			UNSAFE_vegaSpec,
			...props
		},
		forwardedRef,
	) => {
		// uuid is used to make a unique id so there aren't duplicate ids if there is more than one Prism viz in the document
		const prismId = useRef<string>(`prism-visuzalizations-${uuid()}`);
		const chartView = useRef<View>(); // view returned by vega
		const selectedData = useRef<Datum | null>(null); // data that is currently selected, get's set on click if a popover exists
		const selectedDataBounds = useRef<MarkBounds>();
		const containerRef = useRef<HTMLDivElement>(null);
		const popoverAnchorRef = useRef<HTMLDivElement>(null);
		const [popoverIsOpen, setPopoverIsOpen] = useState<boolean>(false); // tracks the open/close state of the popover

		const sanitizedChildren = sanitizeChartChildren(props.children);

		// THE MAGIC, builds our spec
		const spec = useSpec({
			children: sanitizedChildren,
			colors,
			data,
			description,
			symbolShapes,
			lineTypes,
			lineWidths,
			opacities,
			colorScheme,
			title,
			UNSAFE_vegaSpec,
		});
		const { controlledHoverSignal, selectedIdSignalName, selectedSeriesSignalName } = useSpecProps(spec);
		const prismConfig = useMemo(() => getPrismConfig(config, colorScheme), [config, colorScheme]);

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

		// Hide tooltips on all charts when a popover is open
		useEffect(() => {
			const tooltipElement = document.getElementById('vg-tooltip-element');
			if (!tooltipElement) return;
			tooltipElement.hidden = popoverIsOpen;
			if (!popoverIsOpen && selectedIdSignalName && chartView.current) {
				// clears the selected state on the viz
				chartView.current.signal(selectedIdSignalName, null);
				if (selectedSeriesSignalName) {
					chartView.current.signal(selectedSeriesSignalName, null);
				}
				selectedData.current = null;
			}
		}, [popoverIsOpen, selectedIdSignalName, selectedSeriesSignalName, chartView.current]);

		usePrismImperativeHandle(forwardedRef, { chartView, title });

		const [containerWidth] = useElementSize(containerRef); // gets the width of the container that wraps vega
		const chartWidth = useChartWidth(containerWidth, maxWidth, minWidth, width); // calculates the width the vega chart should be
		useDebugSpec(debug, spec, chartData, chartWidth, height, prismConfig);

		const [tooltip] = useTooltip(sanitizedChildren); // gets the tooltip callback if one exists
		const [legendDescriptions] = useLegend(sanitizedChildren); // gets the legend descriptions map if one exists
		const [popover, popoverWidth] = usePopover(sanitizedChildren); // gets the popover callback and width if they exist

		// gets the correct css style to display the anchor in the correct position
		const targetStyle = usePopoverAnchorStyle(
			popoverIsOpen,
			chartView.current,
			selectedDataBounds.current,
			padding,
		);
		const showPlaceholderContent = useMemo(() => Boolean(loading || !data.length), [loading, data]);
		useEffect(() => {
			// if placeholder content is displayed, clear out the chartview so it can't be downloaded or copied to clipboard
			if (showPlaceholderContent) {
				chartView.current = undefined;
			}
		}, [showPlaceholderContent]);

		const onMarkClick = (event: ScenegraphEvent, item: Item | null | undefined) => {
			// if they clicked on a mark group then we want to go down an additional level
			if (item?.datum && isItemSceneItem(item.datum)) {
				item = item.datum;
			}
			if (item?.mark.marktype === 'area') {
				// for area, we want to use the hovered data not the entire area
				const pointMark = item.mark.group.items.find((mark) => mark.name.includes('AnchorPoint'));
				if (pointMark && pointMark.items.length === 1) {
					const point = pointMark.items[0];
					if (isItemSceneItem(point)) {
						item = point;
					}
				}
			}
			// verify that the user didn't click on a legend, legend marktype = 'group'
			if (isItemSceneItem(item) && item.mark.marktype !== 'group' && chartView.current) {
				// clicking the button will trigger a new view since it will cause a rerender
				// this means we don't need to set the signal value since it would just be cleared on rerender
				// instead, the rerender will set the value of the signal to the selectedData
				selectedData.current = item.datum;
				// we need to anchor the popover to a div that we move to the same location as the selected mark
				selectedDataBounds.current = getItemBounds(item);
				(document.querySelector(`#${prismId.current} > button`) as HTMLButtonElement)?.click();
			}
		};

		const tooltipConfig: TooltipOptions = { theme: colorScheme };

		if (tooltip || legendDescriptions) {
			tooltipConfig.formatTooltip = (value) => {
				debugLog(debug, { title: 'Tooltip datum', contents: value });
				if (legendDescriptions && 'index' in value) {
					debugLog(debug, {
						title: 'Legend descriptions',
						contents: legendDescriptions,
					});
					return renderToStaticMarkup(
						<LegendTooltip
							value={value}
							descriptions={legendDescriptions}
							domain={chartView.current?.scale('color').domain()}
						/>,
					);
				}
				if (tooltip && !('index' in value)) {
					if (controlledHoverSignal) {
						chartView.current?.signal(controlledHoverSignal.name, value?.prismMarkId ?? null);
					}
					return renderToStaticMarkup(
						<div className="prism-tooltip" data-testid="prism-tooltip">
							{tooltip(value)}
						</div>,
					);
				}
				return '';
			};
		}

		if (props.children && UNSAFE_vegaSpec) {
			throw new Error(
				'Prism cannot accept both children and `UNSAFE_vegaSpec` prop. Please choose one or the other.',
			);
		}

		// Prism requires children or a Vega spec to configure what is drawn. If there aren't any children or a Vega spec, throw an error and return a fragment.
		if (!props.children && !UNSAFE_vegaSpec) {
			console.error(
				'No children in the <Prism /> component. Prism is a collection components and requires children to draw correctly.',
			);
			return <></>;
		}

		return (
			<Provider colorScheme={colorScheme} theme={isValidTheme(theme) ? theme : defaultTheme}>
				<div
					ref={containerRef}
					id={prismId.current}
					data-testid={dataTestId}
					className="prism-container"
					style={{ backgroundColor: getColorValue(backgroundColor, colorScheme) }}
				>
					<div id={`${prismId.current}-popover-anchor`} ref={popoverAnchorRef} style={targetStyle} />
					{showPlaceholderContent ? (
						<PlaceholderContent loading={loading} data={data} height={height} />
					) : (
						<Vega
							mode="vega"
							className="prism"
							spec={spec}
							config={prismConfig}
							data={chartData}
							actions={false}
							renderer={renderer}
							width={chartWidth}
							height={height}
							padding={padding}
							expressionFunctions={expressionFunctions}
							tooltip={tooltipConfig}
							onNewView={(view) => {
								chartView.current = view;
								// this sets the signal value for the background color used behind bars
								view.signal('backgroundColor', getColorValue('gray-50', colorScheme));
								if (popover) {
									setSelectedSignals({
										selectedData: selectedData.current,
										selectedIdSignalName,
										selectedSeriesSignalName,
										view,
									});
									view.addEventListener('click', (event, item) => onMarkClick(event, item));
									// this will trigger the autosize calculation making sure that everything is correct size
									setTimeout(() => {
										view.resize();
										view.runAsync();
									}, 0);
								}
							}}
						/>
					)}
					<ChartDialog
						datum={selectedData.current}
						targetElement={popoverAnchorRef}
						setPopoverState={setPopoverIsOpen}
						popover={popover}
						width={popoverWidth}
					/>
				</div>
			</Provider>
		);
	},
);

const ChartDialog = ({ datum, targetElement, width = 250, setPopoverState, popover }: ChartDialogProps) => {
	if (popover === undefined) {
		return <></>;
	}
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
				<Dialog data-testid="prism-popover" UNSAFE_className="prism-popover" minWidth="size-1000" width={width}>
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
		<div className="prism-tooltip legend-tooltip" data-testid="prism-tooltip">
			<div className="series">{series}</div>
			<p className="series-description">{description.description}</p>
		</div>
	);
};

const PlaceholderContent: FC<PlaceholderContentProps> = ({ loading, data, ...layoutProps }) => {
	if (loading) {
		//show a spinner while data is loading
		return <LoadingState {...layoutProps} />;
	} else if (!data.length) {
		//if it is no longer loading but there is not data, show the empty state
		return <EmptyState {...layoutProps} />;
	}
	return <></>;
};

const isValidTheme = (theme: unknown): theme is Theme => {
	return typeof theme === 'object' && theme !== null && 'light' in theme && 'dark' in theme;
};
