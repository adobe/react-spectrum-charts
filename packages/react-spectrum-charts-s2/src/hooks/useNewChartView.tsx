/*
 * Copyright 2026 Adobe. All rights reserved.
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

import { View } from 'vega';

import { Legend } from '../components/index.js';
import { useChartContext } from '../context/RscChartContext.js';
import { ChartChildElement, RscChartProps } from '../types/index.js';
import {
  getOnAxisLabelClickCallback,
  getOnChartMarkClickCallback,
  getOnChartMarkContextMenuCallback,
  getOnMarkClickCallback,
  getOnMouseInputCallback,
  setSelectedSignals,
} from '../utils/index.js';
import useActionBars from './useActionBars.js';
import useAxisLabelOnClickDetails from './useAxisLabelOnClickDetails.js';
import { UseLegendProps } from './useLegend.js';
import useMarkMouseInputDetails from './useMarkMouseInputDetails.js';
import useMarkOnClickDetails from './useMarkOnClickDetails.js';
import usePopovers from './usePopovers.js';

const useNewChartView = (
  { idKey }: RscChartProps,
  sanitizedChildren: ChartChildElement[],
  legendProps: UseLegendProps
) => {
  const { chartView, selectedData, selectedDataBounds, selectedDataName, chartId } = useChartContext();
  const actionBars = useActionBars(sanitizedChildren);
  const popovers = usePopovers(sanitizedChildren);
  const {
    legendHiddenSeries,
    setLegendHiddenSeries,
    isToggleable: legendIsToggleable,
    onClick: onLegendClick,
    onMouseOut: onLegendMouseOut,
    onMouseOver: onLegendMouseOver,
  } = legendProps;
  const markClickDetails = useMarkOnClickDetails(sanitizedChildren);
  const axisLabelOnClickDetails = useAxisLabelOnClickDetails(sanitizedChildren);
  const markMouseInputDetails = useMarkMouseInputDetails(sanitizedChildren);

  const legendHasPopover = useMemo(
    () => popovers.some((p) => p.parent === Legend.displayName && !p.chartPopoverProps.rightClick),
    [popovers]
  );
  const legendHasRightClickPopover = useMemo(
    () => popovers.some((p) => p.parent === Legend.displayName && p.chartPopoverProps.rightClick),
    [popovers]
  );
  const markHasActionBar = useMemo(() => actionBars.length > 0, [actionBars]);
  const markHasPopover = useMemo(
    () => popovers.some((p) => p.parent !== Legend.displayName),
    [popovers]
  );

  return useCallback(
    (view: View) => {
      chartView.current = view;
      if (popovers.length || actionBars.length || legendIsToggleable || onLegendClick) {
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
            markHasActionBar,
            markHasPopover,
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
              markHasPopover,
            })
          );
        }
      }
      if (markClickDetails.some((d) => d.onContextMenu)) {
        const chartContainer = document.querySelector(`#${chartId}`);
        if (chartContainer) {
          chartContainer.addEventListener('contextmenu', (e) => e.preventDefault());
        }
        view.addEventListener('contextmenu', getOnChartMarkContextMenuCallback(chartView, markClickDetails));
      }
      view.addEventListener('click', getOnChartMarkClickCallback(chartView, markClickDetails));
      if (axisLabelOnClickDetails.length) {
        view.addEventListener('click', getOnAxisLabelClickCallback(axisLabelOnClickDetails));
      }
      view.addEventListener('mouseover', getOnMouseInputCallback(onLegendMouseOver, markMouseInputDetails));
      view.addEventListener('mouseout', getOnMouseInputCallback(onLegendMouseOut, markMouseInputDetails));
    },
    [
      actionBars,
      axisLabelOnClickDetails,
      chartId,
      chartView,
      idKey,
      legendHasPopover,
      legendHasRightClickPopover,
      legendHiddenSeries,
      legendIsToggleable,
      markClickDetails,
      markHasActionBar,
      markHasPopover,
      markMouseInputDetails,
      onLegendClick,
      onLegendMouseOut,
      onLegendMouseOver,
      popovers,
      selectedData,
      selectedDataBounds,
      selectedDataName,
      setLegendHiddenSeries,
    ]
  );
};

export default useNewChartView;
