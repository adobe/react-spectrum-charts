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
import { MutableRefObject, forwardRef, useEffect, useMemo, useState } from 'react';

import { ActionButton, Dialog, DialogTrigger, View as SpectrumView } from '@adobe/react-spectrum';
import { COMPONENT_NAME, DEFAULT_SYMBOL_SHAPES, DEFAULT_SYMBOL_SIZES } from '@spectrum-charts/constants';
import { ChartHandle, Datum, SymbolSize, getChartConfig } from '@spectrum-charts/vega-spec-builder';

import './Chart.css';
import { VegaChart } from './VegaChart';
import { useChartContext } from './context/RscChartContext';
import useChartImperativeHandle from './hooks/useChartImperativeHandle';
import { useChartInteractions } from './hooks/useChartInteractions';
import usePopovers, { PopoverDetail } from './hooks/usePopovers';
import useSpec from './hooks/useSpec';
import useSpecProps from './hooks/useSpecProps';
import { RscChartProps } from './types';
import { clearHoverSignals, sanitizeRscChartChildren, setSelectedSignals } from './utils';

interface ChartDialogProps {
  targetElement: MutableRefObject<HTMLElement | null>;
  setIsPopoverOpen: (isOpen: boolean) => void;
  popover: PopoverDetail;
  idKey: string;
  specSignalNames: ReadonlySet<string>;
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
    s2,
    symbolShapes = DEFAULT_SYMBOL_SHAPES,
    symbolSizes = DEFAULT_SYMBOL_SIZES as [SymbolSize, SymbolSize],
    title,
    UNSAFE_vegaSpec,
    idKey,
  } = props;

  const { chartView, chartId, popoverAnchorRef, isPopoverOpen, setIsPopoverOpen } = useChartContext();

  const sanitizedChildren = useMemo(() => sanitizeRscChartChildren(props.children), [props.children]);

  // THE MAGIC, builds our spec
  const spec = useSpec({
    backgroundColor,
    children: sanitizedChildren,
    colors,
    chartWidth,
    chartHeight,
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
    s2,
    title,
    UNSAFE_vegaSpec,
  });

  useSpecProps(spec);

  const { signals, targetStyle, tooltipOptions, onNewView } = useChartInteractions(props, sanitizedChildren);
  const chartConfig = useMemo(() => getChartConfig(config, colorScheme, s2), [config, colorScheme, s2]);
  const specSignalNames = useMemo(() => new Set(spec.signals?.map((s) => s.name) ?? []), [spec.signals]);

  useEffect(() => {
    const tooltipElement = document.getElementById('vg-tooltip-element');
    if (tooltipElement) {
    // Hide tooltips on all charts when a popover is open
    tooltipElement.hidden = isPopoverOpen;
    }
  }, [isPopoverOpen]);

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
        s2={s2}
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
          targetElement={popoverAnchorRef}
          setIsPopoverOpen={setIsPopoverOpen}
          popover={popover}
          idKey={idKey}
          specSignalNames={specSignalNames}
        />
      ))}
    </>
  );
});
RscChart.displayName = 'RscChart';

const ChartDialog = ({ popover, setIsPopoverOpen, targetElement, idKey, specSignalNames }: ChartDialogProps) => {
  const { chartView, selectedData, selectedDataName } = useChartContext();
  const [renderDatum, setRenderDatum] = useState<Datum | null>(null);
  const { chartPopoverProps, name } = popover;
  const { children, onOpenChange, containerPadding, contentMargin, rightClick, ...dialogProps } = chartPopoverProps;
  const minWidth = dialogProps.minWidth ?? 0;

  return (
    <DialogTrigger
      type="popover"
      mobileType="tray"
      targetRef={targetElement}
      onOpenChange={(isOpen) => {
        onOpenChange?.(isOpen);
        setIsPopoverOpen(isOpen);

        if (chartView.current) {
          if (isOpen) {
            // Cache render data so there isn't a flicker between view renders.
            setRenderDatum(selectedData.current);
          }
          if (!isOpen) {
            const componentName = selectedDataName.current;
            selectedData.current = null;
            selectedDataName.current = '';
            // Clear hover signals so hover rules don't keep marks highlighted after the popover closes.
            if (componentName) {
              clearHoverSignals(chartView.current, componentName, specSignalNames);
            }
          }
          setSelectedSignals({
            idKey,
            selectedData: selectedData.current,
            view: chartView.current,
          });

          chartView.current.run();
        }
      }}
      placement="top"
      hideArrow
      containerPadding={containerPadding}
    >
      <ActionButton id={`${name}-${rightClick ? 'contextmenu' : 'popover'}-button`} UNSAFE_style={{ display: 'none' }}>
        {rightClick ? 'launch chart context menu' : 'launch chart popover'}
      </ActionButton>
      {(close) => (
        <Dialog data-testid="rsc-popover" UNSAFE_className="rsc-popover" {...dialogProps} minWidth={minWidth}>
          <SpectrumView data-testid="rsc-popover-content" gridColumn="1/-1" gridRow="1/-1" margin={contentMargin ?? 12}>
            {renderDatum && renderDatum[COMPONENT_NAME] === name && children?.(renderDatum, close)}
          </SpectrumView>
        </Dialog>
      )}
    </DialogTrigger>
  );
};
