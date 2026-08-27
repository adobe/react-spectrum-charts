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
import { useMemo } from 'react';

import { SELECTED_ITEM, SELECTED_SERIES, SERIES_ID } from '@spectrum-charts/constants';
import { getColorValue } from '@spectrum-charts/themes';

import { Legend } from '../components';
import { useChartContext } from '../context/RscChartContext';
import { ChartChildElement, RscChartProps } from '../types';
import { VegaChartInteractionConfig } from '../vegaChartController/interactionConfig';
import useAxisLabelOnClickDetails from './useAxisLabelOnClickDetails';
import useChartInspectInteractions from './useChartInspectInteractions';
import useLegend from './useLegend';
import useMarkMouseInputDetails from './useMarkMouseInputDetails';
import useMarkOnClickDetails from './useMarkOnClickDetails';
import useNewChartView from './useNewChartView';
import usePopoverAnchorStyle from './usePopoverAnchorStyle';
import usePopovers from './usePopovers';

export const useChartInteractions = (props: RscChartProps, sanitizedChildren: ChartChildElement[]) => {
  const { chartView, selectedData, selectedDataBounds, selectedDataName, chartId } = useChartContext();
  const { inspectOptions } = useChartInspectInteractions(props, sanitizedChildren);
  const legend = useLegend(sanitizedChildren);
  const targetStyle = usePopoverAnchorStyle(props.padding);

  const popovers = usePopovers(sanitizedChildren);
  const markClickDetails = useMarkOnClickDetails(sanitizedChildren);
  const axisLabelOnClickDetails = useAxisLabelOnClickDetails(sanitizedChildren);
  const markMouseInputDetails = useMarkMouseInputDetails(sanitizedChildren);

  const signals = useMemo(() => {
    const signals: Record<string, unknown> = {
      backgroundColor: getColorValue('gray-50', props.colorScheme),
    };
    signals[SELECTED_ITEM] = selectedData.current?.[props.idKey] ?? null;
    signals[SELECTED_SERIES] = selectedData.current?.[SERIES_ID] ?? null;

    return signals;
  }, [props.colorScheme, props.idKey, selectedData]);

  const interactionConfig: VegaChartInteractionConfig = useMemo(
    () => ({
      chartId,
      idKey: props.idKey,
      markClickDetails,
      markMouseInputDetails,
      axisLabelOnClickDetails,
      legend,
      popovers: popovers.map((p) => ({
        name: p.name,
        attachedToLegend: p.parent === Legend.displayName,
        rightClick: !!p.chartPopoverProps.rightClick,
      })),
      refs: { chartView, selectedData, selectedDataName, selectedDataBounds },
    }),
    [
      axisLabelOnClickDetails,
      chartId,
      chartView,
      legend,
      markClickDetails,
      markMouseInputDetails,
      popovers,
      props.idKey,
      selectedData,
      selectedDataBounds,
      selectedDataName,
    ]
  );

  const onNewView = useNewChartView(inspectOptions);

  return { signals, targetStyle, inspectOptions, onNewView, interactionConfig, popovers };
};
