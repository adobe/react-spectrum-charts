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
import { CSSProperties, RefObject, Ref, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Popover } from '@react-spectrum/s2';
import { Item, View as VegaView } from 'vega';
import { Handler } from 'vega-tooltip';
import { COMPONENT_NAME, DEFAULT_SYMBOL_SHAPES, DEFAULT_SYMBOL_SIZES } from '@spectrum-charts/constants';
import {
  BarType,
  ChartHandle,
  Datum,
  Orientation,
  SimpleData,
  SymbolSize,
  getChartConfig,
} from '@spectrum-charts/vega-spec-builder-s2';

import './Chart.css';
import { VegaChart } from './VegaChart';
import { Navigator } from './dataNavigator/Navigator';
import { FocusedItemFields, getFocusedItemBounds, getFocusedItemClientPosition } from './dataNavigator/focusedItemGeometry';
import { getNavigableChartType } from './dataNavigator/navigableMarks';
import { useChartContext } from './context/RscChartContext';
import useChartImperativeHandle from './hooks/useChartImperativeHandle';
import { useChartInteractions } from './hooks/useChartInteractions';
import usePopovers, { PopoverDetail } from './hooks/usePopovers';
import useSpec from './hooks/useSpec';
import useSpecProps from './hooks/useSpecProps';
import { RscChartProps } from './types';
import { clearHoverSignals, sanitizeRscChartChildren, selectAndOpenPopover, setSelectedSignals } from './utils';

interface ChartDialogProps {
  targetElement: RefObject<HTMLElement | null>;
  setIsPopoverOpen: (isOpen: boolean) => void;
  popover: PopoverDetail;
  idKey: string;
  specSignalNames: ReadonlySet<string>;
}

export const RscChart = ({ ref, ...props }: RscChartProps & { ref?: Ref<ChartHandle> }) => {
  const {
    accessibleNavigation,
    animations,
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
    popoverClosedAt,
    selectedData,
    selectedDataBounds,
    selectedDataName,
  } = useChartContext();

  const sanitizedChildren = useMemo(() => sanitizeRscChartChildren(props.children), [props.children]);

  // THE MAGIC, builds our spec
  const spec = useSpec({
    accessibleNavigation,
    animations,
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

  const { signals, targetStyle, inspectOptions, onNewView } = useChartInteractions(props, sanitizedChildren);
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
  const popovers = usePopovers(sanitizedChildren);

  // Bumped once the Vega view actually exists, so Navigator's effect (which needs a live view to
  // attach its click listener) re-runs even though it may have first mounted before the async
  // vega-embed() call resolved.
  const [viewVersion, setViewVersion] = useState(0);
  const handleNewView = useCallback(
    (view: VegaView) => {
      onNewView(view);
      onVegaViewReady?.(view);
      setViewVersion((v) => v + 1);
    },
    [onNewView, onVegaViewReady]
  );

  const navContainerRef = useRef<HTMLDivElement>(null);
  const navChild = sanitizedChildren.find(
    (child) => 'displayName' in child.type && getNavigableChartType(child.type.displayName)
  );
  const navChartType =
    navChild && 'displayName' in navChild.type ? getNavigableChartType(navChild.type.displayName) : undefined;
  const navFields = navChild?.props as
    | {
        name?: string;
        dimension?: string;
        metric?: string;
        color?: unknown;
        scaleType?: string;
        metricAxis?: string;
        orientation?: Orientation;
        type?: BarType;
      }
    | undefined;
  const navColor = typeof navFields?.color === 'string' ? navFields.color : undefined;
  const navIsTimeDimension = (navFields?.scaleType ?? 'time') === 'time';
  const navGeometryFields: FocusedItemFields = useMemo(
    () => ({
      dimension: navFields?.dimension,
      metric: navFields?.metric,
      scaleType: navFields?.scaleType,
      metricAxis: navFields?.metricAxis,
      orientation: navChartType === 'bar' ? navFields?.orientation ?? 'vertical' : undefined,
      type: navFields?.type,
    }),
    [navChartType, navFields?.dimension, navFields?.metric, navFields?.scaleType, navFields?.metricAxis, navFields?.orientation, navFields?.type]
  );

  const getView = useCallback(() => chartView.current ?? undefined, [chartView]);
  const getPopoverClosedAt = useCallback(() => popoverClosedAt.current, [popoverClosedAt]);

  // Enter/Space on a keyboard-focused point opens its popover the same way a click does — shares
  // handleMarkClick's selectAndOpenPopover (markClickUtils.ts), differing only in how bounds are
  // computed: a real Vega Item's rendered bounds there vs. scale-projected geometry here, since a
  // keyboard-focused point has no real Item.
  const onNavActivate = useCallback(
    (datum: SimpleData) => {
      const view = chartView.current;
      const markName = navFields?.name;
      if (!view || !markName) return;
      selectAndOpenPopover({
        chartId,
        itemName: markName,
        datum: datum as unknown as Datum,
        bounds: getFocusedItemBounds(view, datum, navGeometryFields),
        selectedData,
        selectedDataBounds,
        selectedDataName,
        trigger: 'click',
      });
    },
    [chartId, navFields?.name, navGeometryFields, selectedData, selectedDataBounds, selectedDataName]
  );

  // Mirrors ChartInspect's mouse-hover tooltip for keyboard focus by calling the same vega-tooltip
  // Handler this codebase already invokes manually for the delayed-tooltip case (useNewChartView.tsx).
  const onNavLeafFocus = useCallback(
    (datum: SimpleData | undefined) => {
      const view = chartView.current;
      const container = navContainerRef.current;
      const markName = navFields?.name;
      if (!view || !container || !markName) return;
      if (!datum) {
        // value === null takes vega-tooltip's own hide path; position/item are unused for a hide.
        new Handler(inspectOptions).call(view, { clientX: 0, clientY: 0 } as unknown as MouseEvent, {} as Item, null);
        return;
      }
      const value = { [COMPONENT_NAME]: markName, ...datum } as unknown as Datum;
      const position = getFocusedItemClientPosition(view, container, datum, navGeometryFields);
      const syntheticItem = { bounds: getFocusedItemBounds(view, datum, navGeometryFields), mark: {} } as unknown as Item;
      new Handler(inspectOptions).call(view, position as unknown as MouseEvent, syntheticItem, value);
    },
    [inspectOptions, navFields?.name, navGeometryFields]
  );

  return (
    <>
      <div
        id={`${chartId}-popover-anchor`}
        data-testid="rsc-popover-anchor"
        ref={popoverAnchorRef}
        style={targetStyle}
      />
      <div id={`${chartId}-dn-root`} ref={navContainerRef} style={{ position: 'relative' }}>
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
          tooltip={inspectOptions} // legend show/hide relies on this
          onNewView={handleNewView}
        />
        {accessibleNavigation && navChartType && (
          <Navigator
            chartType={navChartType}
            data={data as SimpleData[]}
            dimension={navFields?.dimension}
            color={navColor}
            metric={navFields?.metric}
            isTimeDimension={navIsTimeDimension}
            title={title}
            containerRef={navContainerRef}
            chartId={chartId}
            getView={getView}
            viewVersion={viewVersion}
            onActivate={onNavActivate}
            onLeafFocus={onNavLeafFocus}
            isPopoverOpen={isPopoverOpen}
            getPopoverClosedAt={getPopoverClosedAt}
            markName={navFields?.name}
            specSignalNames={specSignalNames}
          />
        )}
      </div>
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
};
RscChart.displayName = 'RscChart';

const ChartDialog = ({ popover, setIsPopoverOpen, targetElement, idKey, specSignalNames }: ChartDialogProps) => {
  const { chartView, selectedData, selectedDataName, popoverClosedAt } = useChartContext();
  const [renderDatum, setRenderDatum] = useState<Datum | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { chartPopoverProps, name } = popover;
  const { children, onOpenChange, containerPadding, contentMargin, rightClick, UNSAFE_highlightBy: _highlightBy, ...sizingProps } = chartPopoverProps;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      // Recorded synchronously here rather than in an effect reacting to isPopoverOpen, to avoid a race with a fast Escape-Escape.
      if (!open) popoverClosedAt.current = Date.now();
      setIsOpen(open);
      onOpenChange?.(open);
      setIsPopoverOpen(open);

      if (chartView.current) {
        if (open) {
          setRenderDatum(selectedData.current);
        } else {
          const componentName = selectedDataName.current;
          selectedData.current = null;
          selectedDataName.current = '';
          if (componentName) {
            clearHoverSignals(chartView.current, componentName, specSignalNames);
          }
        }
        setSelectedSignals({ idKey, selectedData: selectedData.current, view: chartView.current });
        chartView.current.run();
      }
    },
    [chartView, idKey, onOpenChange, popoverClosedAt, selectedData, selectedDataName, setIsPopoverOpen, specSignalNames]
  );

  const close = useCallback(() => handleOpenChange(false), [handleOpenChange]);

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
          <div data-testid="rsc-popover-content" className="rsc-popover-content" style={{ margin: contentMargin ?? 12 }}>
            {renderDatum && renderDatum[COMPONENT_NAME] === name && children?.(renderDatum, close)}
          </div>
        </div>
      </Popover>
    </>
  );
};

const toPx = (value: number | 'auto'): string | number => (typeof value === 'number' ? `${value}px` : value);
