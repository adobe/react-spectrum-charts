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
import { CSSProperties, Ref, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Focusable } from 'react-aria-components';
import { View as VegaView } from 'vega';

import { Popover, Tooltip, TooltipTrigger } from '@react-spectrum/s2';
import {
  COMPONENT_NAME,
  DEFAULT_SYMBOL_SHAPES,
  DEFAULT_SYMBOL_SIZES,
  FOCUSED_DIMENSION,
  FOCUSED_ITEM,
  FOCUSED_REGION,
} from '@spectrum-charts/core-s2/constants';
import { ChartHandle, Datum, SymbolSize, UserMeta, getChartConfig } from '@spectrum-charts/vega-spec-builder-s2';

import './Chart.css';
import { VegaChart } from './VegaChart.js';
import { DonutDialogContent, getDonutSwatchColor } from './components/Donut/DonutDialogContent.js';
import { useChartContext } from './context/RscChartContext.js';
import useActionBars from './hooks/useActionBars.js';
import useChartImperativeHandle from './hooks/useChartImperativeHandle.js';
import { useChartInteractions } from './hooks/useChartInteractions.js';
import { useDataNavigator } from './hooks/useDataNavigator.js';
import usePopovers, { PopoverDetail } from './hooks/usePopovers.js';
import useSpec from './hooks/useSpec.js';
import useSpecProps from './hooks/useSpecProps.js';
import { ChartActionBarDialog } from './lab/components/ChartActionBar/ChartActionBarDialog.js';
import { RscChartProps } from './types/index.js';
import {
  clearHoverSignals,
  sanitizeRscChartChildren,
  setSelectedSignals,
  shouldClearHoverSignalsOnClose,
} from './utils/index.js';

interface ChartDialogProps {
  targetElement: RefObject<HTMLElement | null>;
  setIsPopoverOpen: (isOpen: boolean) => void;
  popover: PopoverDetail;
  idKey: string;
  colorScheme: RscChartProps['colorScheme'];
  locale: RscChartProps['locale'];
  specSignalNames: ReadonlySet<string>;
}

export const RscChart = ({ ref, ...props }: RscChartProps & { ref?: Ref<ChartHandle> }) => {
  const {
    animations,
    animationTypes,
    accessibleNavigation,
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
    onVegaViewReady,
    padding,
    renderer,
    symbolShapes = DEFAULT_SYMBOL_SHAPES,
    symbolSizes = DEFAULT_SYMBOL_SIZES as [SymbolSize, SymbolSize],
    title,
    UNSAFE_vegaSpec,
    idKey,
  } = props;

  const {
    chartView,
    chartId,
    popoverAnchorRef,
    isPopoverOpen,
    setIsPopoverOpen,
    hoveredAxisLabel,
    setHoveredAxisLabel,
  } = useChartContext();
  const axisLabelTooltipAnchorRef = useRef<HTMLDivElement>(null);
  // Retained through the Tooltip's exit animation so it doesn't fade out empty.
  const lastAxisLabelContentRef = useRef<string | undefined>(undefined);
  if (hoveredAxisLabel) {
    lastAxisLabelContentRef.current = hoveredAxisLabel.content;
  }

  const sanitizedChildren = useMemo(() => sanitizeRscChartChildren(props.children), [props.children]);

  // THE MAGIC, builds our spec
  const spec = useSpec({
    animations,
    animationTypes,
    accessibleNavigation,
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
    title,
    UNSAFE_vegaSpec,
  });

  useSpecProps(spec);

  const { signals, targetStyle, axisLabelTooltipAnchorStyle, tooltip, onNewView } = useChartInteractions(
    props,
    sanitizedChildren
  );
  const chartConfig = useMemo(() => getChartConfig(config, colorScheme), [config, colorScheme]);
  const specSignalNames = useMemo(() => new Set(spec.signals?.map((s) => s.name) ?? []), [spec.signals]);

  useEffect(() => {
    const inspectElement = document.getElementById('vg-tooltip-element');
    if (inspectElement) {
      // Hide the vega inspect panel on all charts when a popover is open
      inspectElement.hidden = isPopoverOpen;
    }
  }, [isPopoverOpen]);

  useChartImperativeHandle(ref, { chartView, title });
  const actionBars = useActionBars(sanitizedChildren);
  const popovers = usePopovers(sanitizedChildren);

  const dataNavigator = useDataNavigator({
    enabled: Boolean(accessibleNavigation),
    children: sanitizedChildren,
    data,
    title,
    popovers,
    chartId,
    navigation: (spec.usermeta as UserMeta | undefined)?.navigation,
    legends: (spec.usermeta as UserMeta | undefined)?.legends,
  });

  // read from a ref so an inline onVegaViewReady doesn't rebuild the view
  const latestOnVegaViewReady = useRef(onVegaViewReady);
  useEffect(() => {
    latestOnVegaViewReady.current = onVegaViewReady;
  }, [onVegaViewReady]);

  const handleNewView = useCallback(
    (view: VegaView) => {
      onNewView(view);
      dataNavigator.onNewView(view);
      latestOnVegaViewReady.current?.(view);
    },
    [onNewView, dataNavigator.onNewView]
  );

  return (
    <>
      <div
        id={`${chartId}-popover-anchor`}
        data-testid="rsc-popover-anchor"
        ref={popoverAnchorRef}
        style={targetStyle}
      />
      {/* onOpenChange lets React Spectrum dismiss the tooltip on Escape (WCAG 2.2 SC 1.4.13) while keyboard
          focus stays on the axis tick; a later Escape then drills out of the navigator. */}
      <TooltipTrigger
        isOpen={Boolean(hoveredAxisLabel)}
        onOpenChange={(open) => {
          if (!open) setHoveredAxisLabel(null);
        }}
      >
        {/* Focusable forwards TooltipTrigger's FocusableContext ref onto our plain div. */}
        <Focusable>
          <div
            id={`${chartId}-axis-label-tooltip-anchor`}
            data-testid="rsc-axis-label-tooltip-anchor"
            ref={axisLabelTooltipAnchorRef}
            style={axisLabelTooltipAnchorStyle}
            tabIndex={-1}
          />
        </Focusable>
        <Tooltip>{hoveredAxisLabel?.content ?? lastAxisLabelContentRef.current}</Tooltip>
      </TooltipTrigger>
      <div id={`${chartId}-dn-root`} ref={dataNavigator.containerRef} style={{ position: 'relative' }}>
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
          tooltip={tooltip}
          onNewView={handleNewView}
        />
      </div>
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
      {actionBars.map((ab) => (
        <ChartActionBarDialog
          key={ab.key}
          actionBar={ab}
          targetElement={popoverAnchorRef}
          setIsPopoverOpen={setIsPopoverOpen}
          idKey={idKey}
          specSignalNames={specSignalNames}
        />
      ))}
    </>
  );
};
RscChart.displayName = 'RscChart';

const ChartDialog = ({
  popover,
  setIsPopoverOpen,
  targetElement,
  idKey,
  colorScheme,
  locale,
  specSignalNames,
}: ChartDialogProps) => {
  const { chartView, selectedData, selectedDataName, keyboardPopoverComponentName } = useChartContext();
  const [renderDatum, setRenderDatum] = useState<Datum | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const closeFrame = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (closeFrame.current !== null) {
        cancelAnimationFrame(closeFrame.current);
        closeFrame.current = null;
      }
    },
    []
  );
  const { chartPopoverProps, name } = popover;
  const {
    children,
    onOpenChange,
    containerPadding,
    contentMargin,
    rightClick,
    UNSAFE_highlightBy: _highlightBy,
    ...sizingProps
  } = chartPopoverProps;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
      setIsPopoverOpen(open);

      if (!chartView.current) return;
      const view = chartView.current;

      const openPopoverView = () => {
        if (closeFrame.current !== null) {
          cancelAnimationFrame(closeFrame.current);
          closeFrame.current = null;
        }
        setRenderDatum(selectedData.current);
        if (keyboardPopoverComponentName.current === name) {
          // The popover owns the selected item's outline while open.
          view.signal(FOCUSED_ITEM, null);
          view.signal(FOCUSED_DIMENSION, null);
          view.signal(FOCUSED_REGION, null);
        }
        setSelectedSignals({ idKey, selectedData: selectedData.current, view });
        view.run();
      };

      const closePopoverView = () => {
        const componentName = selectedDataName.current;
        const keyboardComponentName = keyboardPopoverComponentName.current;
        keyboardPopoverComponentName.current = null;
        const clearSelection = () => {
          closeFrame.current = null;
          if (!chartView.current) return;
          selectedData.current = null;
          selectedDataName.current = '';
          if (shouldClearHoverSignalsOnClose(componentName, keyboardComponentName)) {
            clearHoverSignals(chartView.current, componentName, specSignalNames);
          }
          setSelectedSignals({ idKey, selectedData: null, view: chartView.current });
          chartView.current.run();
        };
        // Keyboard navigation needs one frame for focus restoration; mouse popovers retain synchronous cleanup.
        if (keyboardComponentName === name) {
          closeFrame.current = requestAnimationFrame(clearSelection);
        } else {
          clearSelection();
        }
      };

      if (open) {
        openPopoverView();
      } else {
        closePopoverView();
      }
    },
    [
      chartView,
      keyboardPopoverComponentName,
      idKey,
      name,
      onOpenChange,
      selectedData,
      selectedDataName,
      setIsPopoverOpen,
      specSignalNames,
    ]
  );

  const close = useCallback(() => handleOpenChange(false), [handleOpenChange]);
  const activeDatum = renderDatum?.[COMPONENT_NAME] === name ? renderDatum : null;
  const { defaultDonutContent } = popover;
  const content =
    activeDatum && defaultDonutContent ? (
      <DonutDialogContent
        colorKey={defaultDonutContent.colorKey}
        metricKey={defaultDonutContent.metricKey}
        percentKey={defaultDonutContent.percentKey}
        datum={activeDatum}
        color={getDonutSwatchColor(chartView.current, defaultDonutContent, activeDatum, idKey, colorScheme)}
        locale={locale}
      />
    ) : (
      activeDatum && children?.(activeDatum, close)
    );

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      close();
    };
    document.addEventListener('keydown', handleEscape, true);
    return () => document.removeEventListener('keydown', handleEscape, true);
  }, [close, isOpen]);

  const popoverStyle: CSSProperties = {
    minWidth: toPx(sizingProps.minWidth ?? 0),
    ...(sizingProps.maxWidth != null && { maxWidth: toPx(sizingProps.maxWidth) }),
    ...(sizingProps.width != null && { width: toPx(sizingProps.width) }),
    ...(sizingProps.height != null && { height: toPx(sizingProps.height) }),
    ...(sizingProps.minHeight != null && { minHeight: toPx(sizingProps.minHeight) }),
    ...(sizingProps.maxHeight != null && { maxHeight: toPx(sizingProps.maxHeight) }),
  };

  return (
    <>
      <button
        type="button"
        id={`${name}-${rightClick ? 'contextmenu' : 'popover'}-button`}
        aria-hidden="true"
        tabIndex={-1}
        style={{ display: 'none' }}
        onClick={() => handleOpenChange(true)}
      />
      <Popover
        triggerRef={targetElement}
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        placement="top"
        hideArrow
        padding="none"
        containerPadding={containerPadding}
        UNSAFE_className="rsc-popover"
      >
        <div data-testid="rsc-popover" style={popoverStyle}>
          <div
            data-testid="rsc-popover-content"
            className="rsc-popover-content"
            style={{ margin: contentMargin ?? 12 }}
          >
            {content}
          </div>
        </div>
      </Popover>
    </>
  );
};

const toPx = (value: number | 'auto'): string | number => (typeof value === 'number' ? `${value}px` : value);
