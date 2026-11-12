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
import { CSSProperties, ReactElement, useCallback, useEffect, useMemo } from 'react';

import { View } from 'vega';

import { D3Chart } from '@spectrum-charts/chart-d3';
import { HOVERED_ITEM, SELECTED_ITEM, SELECTED_SERIES, SERIES_ID } from '@spectrum-charts/core-s2/constants';

import { AxisLabelTooltip } from '../AxisLabelTooltip.js';
import { ChartDialog } from '../RscChart.js';
import { useChartContext } from '../context/RscChartContext.js';
import useActionBars from '../hooks/useActionBars.js';
import useAxisLabelTooltipAnchorStyle from '../hooks/useAxisLabelTooltipAnchorStyle.js';
import useChartInspectInteractions from '../hooks/useChartInspectInteractions.js';
import useInspectTooltip from '../hooks/useInspectTooltip.js';
import { UseLegendProps } from '../hooks/useLegend.js';
import useNewChartView from '../hooks/useNewChartView.js';
import usePopoverAnchorStyle from '../hooks/usePopoverAnchorStyle.js';
import usePopovers from '../hooks/usePopovers.js';
import { ChartActionBarDialog } from '../lab/components/ChartActionBar/ChartActionBarDialog.js';
import { ChartChildElement, RscChartProps } from '../types/index.js';
import { createD3ChartView, toSceneItem } from './d3ChartView.js';

export interface D3Interactions {
  signals: Record<string, unknown>;
  targetStyle: CSSProperties;
  axisLabelTooltipStyle: CSSProperties;
  onNewView: (chart: D3Chart) => void;
}

/**
 * Wires chart-d3 events into the same popover, action bar, callback and inspect handling the Vega path uses.
 * @param props
 * @param children
 * @param legendProps
 * @returns signals, popover anchor style and onNewView
 */
export const useD3Interactions = (
  props: RscChartProps,
  children: ChartChildElement[],
  legendProps: UseLegendProps
): D3Interactions => {
  const { selectedData, isPopoverOpen } = useChartContext();
  const { idKey, padding } = props;
  const { inspectOptions } = useChartInspectInteractions(props, children, legendProps.descriptions);
  const targetStyle = usePopoverAnchorStyle(padding);
  const axisLabelTooltipStyle = useAxisLabelTooltipAnchorStyle(padding);
  const tooltip = useInspectTooltip(inspectOptions);
  const onNewVegaView = useNewChartView(props, children, legendProps);

  const signals = useMemo(
    () => ({
      [SELECTED_ITEM]: selectedData.current?.[idKey] ?? null,
      [SELECTED_SERIES]: selectedData.current?.[SERIES_ID] ?? null,
    }),
    [idKey, selectedData]
  );

  useEffect(() => {
    const inspectElement = document.getElementById('vg-tooltip-element');
    if (inspectElement) inspectElement.hidden = isPopoverOpen;
  }, [isPopoverOpen]);

  const onNewView = useCallback(
    (chart: D3Chart) => {
      const view = createD3ChartView(chart, padding);
      onNewVegaView(view as unknown as View);
      // vega-tooltip anchors to marks using the renderer's element and origin
      const handler = {
        _el: chart.element,
        get _origin() {
          return view.rendererOrigin();
        },
      };
      chart.on('move', (target, event) =>
        tooltip(
          handler as unknown as View,
          event as MouseEvent,
          (target ? toSceneItem(target) : null) as never,
          target?.tooltip ?? undefined
        )
      );
    },
    [onNewVegaView, padding, tooltip]
  );

  return { signals, targetStyle, axisLabelTooltipStyle, onNewView };
};

interface D3ChartDialogsProps extends Pick<RscChartProps, 'colorScheme' | 'idKey' | 'locale'> {
  sanitizedChildren: ChartChildElement[];
  markNames: string[];
  targetStyle: CSSProperties;
  axisLabelTooltipStyle: CSSProperties;
}

/** Popover anchor, axis label tooltip, popovers and action bars for `engine="d3"`, laid out like the Vega path so mark clicks find them. */
export const D3ChartDialogs = ({
  colorScheme,
  idKey,
  locale,
  sanitizedChildren,
  markNames,
  targetStyle,
  axisLabelTooltipStyle,
}: D3ChartDialogsProps): ReactElement => {
  const { chartId, popoverAnchorRef, setIsPopoverOpen } = useChartContext();
  const popovers = usePopovers(sanitizedChildren);
  const actionBars = useActionBars(sanitizedChildren);
  const specSignalNames = useMemo(() => new Set(markNames.map((name) => `${name}_${HOVERED_ITEM}`)), [markNames]);
  return (
    <>
      <div
        id={`${chartId}-popover-anchor`}
        data-testid="rsc-popover-anchor"
        ref={popoverAnchorRef}
        style={targetStyle}
      />
      <AxisLabelTooltip style={axisLabelTooltipStyle} />
      {popovers.map((popover) => (
        <ChartDialog
          key={popover.key}
          targetElement={popoverAnchorRef}
          setIsPopoverOpen={setIsPopoverOpen}
          popover={popover}
          idKey={idKey}
          colorScheme={colorScheme}
          locale={locale}
          specSignalNames={specSignalNames}
        />
      ))}
      {actionBars.map((actionBar) => (
        <ChartActionBarDialog
          key={actionBar.key}
          actionBar={actionBar}
          targetElement={popoverAnchorRef}
          setIsPopoverOpen={setIsPopoverOpen}
          idKey={idKey}
          specSignalNames={specSignalNames}
        />
      ))}
    </>
  );
};
