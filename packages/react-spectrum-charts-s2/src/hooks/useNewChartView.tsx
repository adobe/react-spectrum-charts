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
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { ScenegraphEvent, View } from 'vega';

import { Legend } from '../components/index.js';
import { useChartContext } from '../context/RscChartContext.js';
import { ChartChildElement, RscChartProps } from '../types/index.js';
import {
  ActionItem,
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

/**
 * Builds a stable onNewView that registers listeners once per view; listeners read the latest props from a ref.
 * @param props - chart props
 * @param sanitizedChildren - chart children
 * @param legendProps - shared legend state and callbacks
 * @returns onNewView
 */
const useNewChartView = (
  { idKey }: RscChartProps,
  sanitizedChildren: ChartChildElement[],
  legendProps: UseLegendProps
) => {
  const { chartView, selectedData, selectedDataBounds, selectedDataName, chartId } = useChartContext();
  const actionBars = useActionBars(sanitizedChildren);
  const popovers = usePopovers(sanitizedChildren);
  const markClickDetails = useMarkOnClickDetails(sanitizedChildren);
  const axisLabelOnClickDetails = useAxisLabelOnClickDetails(sanitizedChildren);
  const markMouseInputDetails = useMarkMouseInputDetails(sanitizedChildren);

  const derived = useMemo(
    () => ({
      legendHasPopover: popovers.some((p) => p.parent === Legend.displayName && !p.chartPopoverProps.rightClick),
      legendHasRightClickPopover: popovers.some(
        (p) => p.parent === Legend.displayName && p.chartPopoverProps.rightClick
      ),
      markHasActionBar: actionBars.length > 0,
      markHasPopover: popovers.some((p) => p.parent !== Legend.displayName),
      hasRightClickPopover: popovers.some((p) => p.chartPopoverProps.rightClick),
      hasMarkContextMenu: markClickDetails.some((d) => d.onContextMenu),
      hasPopoversOrActionBars: popovers.length > 0 || actionBars.length > 0,
    }),
    [actionBars, markClickDetails, popovers]
  );

  const latestInputs = {
    idKey,
    legendProps,
    markClickDetails,
    axisLabelOnClickDetails,
    markMouseInputDetails,
    ...derived,
  };
  const latest = useRef(latestInputs);
  useEffect(() => {
    latest.current = latestInputs;
  });

  // the container outlives views, so its contextmenu listener is added once
  const contextMenuContainer = useRef<Element | null>(null);

  return useCallback(
    (view: View) => {
      chartView.current = view;

      const hasLegendOrMarkActions = () => {
        const { hasPopoversOrActionBars, legendProps } = latest.current;
        return hasPopoversOrActionBars || Boolean(legendProps.isToggleable) || Boolean(legendProps.onClick);
      };
      const getMarkClickArgs = (trigger: 'click' | 'contextmenu') => {
        const { legendProps, legendHasPopover, legendHasRightClickPopover, markHasActionBar, markHasPopover } =
          latest.current;
        return {
          chartView,
          hiddenSeries: legendProps.legendHiddenSeries,
          chartId,
          selectedData,
          selectedDataBounds,
          selectedDataName,
          setHiddenSeries: legendProps.setLegendHiddenSeries,
          legendIsToggleable: legendProps.isToggleable,
          legendHasPopover: trigger === 'click' ? legendHasPopover : legendHasRightClickPopover,
          onLegendClick: legendProps.onClick,
          trigger,
          markHasActionBar: trigger === 'click' ? markHasActionBar : undefined,
          markHasPopover,
        };
      };

      if (hasLegendOrMarkActions()) {
        setSelectedSignals({ idKey: latest.current.idKey, selectedData: selectedData.current, view });
      }

      const chartContainer = document.querySelector(`#${chartId}`);
      if (chartContainer && contextMenuContainer.current !== chartContainer) {
        contextMenuContainer.current = chartContainer;
        chartContainer.addEventListener('contextmenu', (e) => {
          const { hasRightClickPopover, hasMarkContextMenu } = latest.current;
          if (hasRightClickPopover || hasMarkContextMenu) {
            e.preventDefault();
          }
        });
      }

      view.addEventListener('click', (event: ScenegraphEvent, item: ActionItem) => {
        if (hasLegendOrMarkActions()) {
          getOnMarkClickCallback(getMarkClickArgs('click'))(event, item);
        }
      });
      view.addEventListener('contextmenu', (event: ScenegraphEvent, item: ActionItem) => {
        if (hasLegendOrMarkActions() && latest.current.hasRightClickPopover) {
          getOnMarkClickCallback(getMarkClickArgs('contextmenu'))(event, item);
        }
      });
      view.addEventListener('contextmenu', (event: ScenegraphEvent, item: ActionItem) => {
        const { hasMarkContextMenu, markClickDetails } = latest.current;
        if (hasMarkContextMenu) {
          getOnChartMarkContextMenuCallback(chartView, markClickDetails)(event, item);
        }
      });
      view.addEventListener('click', (event: ScenegraphEvent, item: ActionItem) =>
        getOnChartMarkClickCallback(chartView, latest.current.markClickDetails)(event, item)
      );
      view.addEventListener('click', (event: ScenegraphEvent, item: ActionItem) =>
        getOnAxisLabelClickCallback(latest.current.axisLabelOnClickDetails)(event, item)
      );
      view.addEventListener('mouseover', (event: ScenegraphEvent, item: ActionItem) =>
        getOnMouseInputCallback(latest.current.legendProps.onMouseOver, latest.current.markMouseInputDetails)(
          event,
          item
        )
      );
      view.addEventListener('mouseout', (event: ScenegraphEvent, item: ActionItem) =>
        getOnMouseInputCallback(latest.current.legendProps.onMouseOut, latest.current.markMouseInputDetails)(
          event,
          item
        )
      );
    },
    [chartId, chartView, selectedData, selectedDataBounds, selectedDataName]
  );
};

export default useNewChartView;
