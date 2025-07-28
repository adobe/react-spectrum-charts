/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { useCallback, useMemo } from 'react';

import { Item, View } from 'vega';
import { Handler, Options as TooltipOptions } from 'vega-tooltip';

import { LEGEND_TOOLTIP_DELAY } from '@spectrum-charts/constants';

import { Legend } from '../components';
import { useChartContext } from '../context/RscChartContext';
import { ChartChildElement, RscChartProps } from '../types';
import {
  getOnChartMarkClickCallback,
  getOnMarkClickCallback,
  getOnMouseInputCallback,
  setSelectedSignals,
} from '../utils';
import useLegend from './useLegend';
import useMarkMouseInputDetails from './useMarkMouseInputDetails';
import useMarkOnClickDetails from './useMarkOnClickDetails';
import usePopovers from './usePopovers';

const useNewChartView = (
  { idKey }: RscChartProps,
  sanitizedChildren: ChartChildElement[],
  tooltipOptions: TooltipOptions
) => {
  const { chartView, selectedData, selectedDataBounds, selectedDataName, chartId } = useChartContext();
  const popovers = usePopovers(sanitizedChildren);
  const {
    legendHiddenSeries,
    setLegendHiddenSeries,
    isToggleable: legendIsToggleable,
    onClick: onLegendClick,
    onMouseOut: onLegendMouseOut,
    onMouseOver: onLegendMouseOver,
  } = useLegend(sanitizedChildren); // gets props from the legend if it exists
  const markClickDetails = useMarkOnClickDetails(sanitizedChildren);
  const markMouseInputDetails = useMarkMouseInputDetails(sanitizedChildren);

  const legendHasPopover = useMemo(
    () => popovers.some((p) => p.parent === Legend.displayName && !p.chartPopoverProps.rightClick),
    [popovers]
  );
  const legendHasRightClickPopover = useMemo(
    () => popovers.some((p) => p.parent === Legend.displayName && p.chartPopoverProps.rightClick),
    [popovers]
  );

  return useCallback(
    (view: View) => {
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
      if (popovers.length || legendIsToggleable || onLegendClick) {
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
          getOnMarkClickCallback({
            chartView,
            hiddenSeries: legendHiddenSeries,
            chartId,
            selectedData,
            selectedDataBounds,
            selectedDataName,
            setHiddenSeries: setLegendHiddenSeries,
            legendIsToggleable,
            legendHasPopover,
            onLegendClick,
            trigger: 'click',
          })
        );
        if (popovers.some((p) => p.chartPopoverProps.rightClick)) {
          const chartContainer = document.querySelector(`#${chartId}`);
          if (chartContainer) {
            chartContainer.addEventListener('contextmenu', (e) => e.preventDefault());
          }
          view.addEventListener(
            'contextmenu',
            getOnMarkClickCallback({
              chartView,
              hiddenSeries: legendHiddenSeries,
              chartId,
              selectedData,
              selectedDataBounds,
              selectedDataName,
              setHiddenSeries: setLegendHiddenSeries,
              legendHasPopover: legendHasRightClickPopover,
              legendIsToggleable,
              onLegendClick,
              trigger: 'contextmenu',
            })
          );
        }
      }
      view.addEventListener('click', getOnChartMarkClickCallback(chartView, markClickDetails));
      view.addEventListener('mouseover', getOnMouseInputCallback(onLegendMouseOver, markMouseInputDetails));
      view.addEventListener('mouseout', getOnMouseInputCallback(onLegendMouseOut, markMouseInputDetails));
    },
    [
      chartId,
      chartView,
      idKey,
      legendHasPopover,
      legendHasRightClickPopover,
      legendHiddenSeries,
      legendIsToggleable,
      markClickDetails,
      markMouseInputDetails,
      onLegendClick,
      onLegendMouseOut,
      onLegendMouseOver,
      popovers,
      selectedData,
      selectedDataBounds,
      selectedDataName,
      setLegendHiddenSeries,
      tooltipOptions,
    ]
  );
};

export default useNewChartView;

const itemIsLegendItem = (item: Item<unknown>): boolean => {
  return 'name' in item.mark && typeof item.mark.name === 'string' && item.mark.name.includes('legend');
};
