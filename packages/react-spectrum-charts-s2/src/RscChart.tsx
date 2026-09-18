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

import { Popover, Tooltip, TooltipTrigger } from '@react-spectrum/s2';
import { Focusable } from 'react-aria-components';
import { View as VegaView } from 'vega';
import {
  COMPONENT_NAME,
  DEFAULT_CATEGORICAL_DIMENSION,
  DEFAULT_METRIC,
  DEFAULT_SYMBOL_SHAPES,
  DEFAULT_SYMBOL_SIZES,
  FOCUSED_DIMENSION,
  FOCUSED_ITEM,
  FOCUSED_REGION,
} from '@spectrum-charts/constants';
import { ChartHandle, Datum, Orientation, SimpleData, SymbolSize, getChartConfig } from '@spectrum-charts/vega-spec-builder-s2';

import './Chart.css';
import { VegaChart } from './VegaChart';
import { Axis } from './components/Axis';
import { ChartInspect } from './components/ChartInspect';
import { Legend } from './components/Legend';
import { AxisRegionOptions } from './dataNavigator/buildChartStructure';
import { Navigator } from './dataNavigator/Navigator';
import { getNavigableChartType } from './dataNavigator/navigableMarks';
import { useChartContext } from './context/RscChartContext';
import useChartImperativeHandle from './hooks/useChartImperativeHandle';
import { useChartInteractions } from './hooks/useChartInteractions';
import useMarkOnClickDetails from './hooks/useMarkOnClickDetails';
import usePopovers, { PopoverDetail } from './hooks/usePopovers';
import useSpec from './hooks/useSpec';
import useSpecProps from './hooks/useSpecProps';
import { RscChartProps } from './types';
import { clearHoverSignals, sanitizeMarkChildren, sanitizeRscChartChildren, setSelectedSignals, shouldClearHoverSignalsOnClose } from './utils';

interface ChartDialogProps {
  targetElement: RefObject<HTMLElement | null>;
  setIsPopoverOpen: (isOpen: boolean) => void;
  popover: PopoverDetail;
  idKey: string;
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
    selectedData,
    selectedDataBounds,
    selectedDataName,
    keyboardPopoverComponentName,
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

  const { signals, targetStyle, axisLabelTooltipAnchorStyle, inspectOptions, onNewView } = useChartInteractions(
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
  const popovers = usePopovers(sanitizedChildren);

  const handleNewView = useCallback(
    (view: VegaView) => {
      onNewView(view);
      onVegaViewReady?.(view);
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
        dimension?: string;
        metric?: string;
        color?: unknown;
        colorOverride?: unknown;
        order?: string;
        dualMetricAxis?: boolean;
        lineType?: unknown;
        opacity?: unknown;
        type?: 'dodged' | 'stacked';
        trellis?: boolean;
        name?: string;
        orientation?: Orientation;
      }
    | undefined;
  const navColor = typeof navFields?.color === 'string' ? navFields.color : undefined;
  const navColorOverride = typeof navFields?.colorOverride === 'string' ? navFields.colorOverride : undefined;
  const navOrientation: Orientation = navFields?.orientation === 'horizontal' ? 'horizontal' : 'vertical';
  const markName = navFields?.name ?? (navChartType ? `${navChartType}0` : undefined);

  // Axis/legend titles keyed by the field they represent, so a focused bar's accessible name and
  // (for bars without a ChartInspect) its focus tooltip read as the chart's own titles rather than
  // raw field names or every data column. Insertion order (dimension, series, metric) sets read order.
  const legendTitle = (
    sanitizedChildren.find((child) => 'displayName' in child.type && child.type.displayName === Legend.displayName)?.props as
      | { title?: string }
      | undefined
  )?.title;
  const fieldLabels = useMemo(() => {
    const titleAt = (position: 'bottom' | 'left') =>
      (
        sanitizedChildren.find(
          (child) =>
            'displayName' in child.type &&
            child.type.displayName === Axis.displayName &&
            (child.props as { position?: string }).position === position
        )?.props as { title?: string } | undefined
      )?.title;
    const isHorizontal = navOrientation === 'horizontal';
    const dimensionTitle = titleAt(isHorizontal ? 'left' : 'bottom');
    const metricTitle = titleAt(isHorizontal ? 'bottom' : 'left');
    const labels: Record<string, string> = {};
    if (dimensionTitle) labels[navFields?.dimension ?? DEFAULT_CATEGORICAL_DIMENSION] = dimensionTitle;
    if (navColor && legendTitle) labels[navColor] = legendTitle;
    if (metricTitle) labels[navFields?.metric ?? DEFAULT_METRIC] = metricTitle;
    return labels;
  }, [sanitizedChildren, navOrientation, navFields?.dimension, navFields?.metric, navColor, legendTitle]);

  const navMetricTitleBySeries = useMemo(() => {
    // Mirrors vega-spec-builder-s2's isDualMetricAxis (barUtils.ts) — keep the two in sync.
    const isDodgedAndStacked = [navFields?.color, navFields?.lineType, navFields?.opacity].some(
      (facet) => Array.isArray(facet) && facet.length === 2
    );
    const isDualMetricAxis =
      navFields?.dualMetricAxis && !navFields.trellis && navFields.type === 'dodged' && !isDodgedAndStacked;
    if (!isDualMetricAxis || !navColor) return undefined;
    const positions = navOrientation === 'horizontal' ? ['bottom', 'top'] : ['left', 'right'];
    const titleAtPosition = (position: string) =>
      (
        sanitizedChildren.find(
          (child) =>
            'displayName' in child.type &&
            child.type.displayName === Axis.displayName &&
            (child.props as { position?: string }).position === position
        )?.props as { title?: string } | undefined
      )?.title;
    const primaryTitle = titleAtPosition(positions[0]);
    const secondaryTitle = titleAtPosition(positions[1]);
    if (!primaryTitle && !secondaryTitle) return undefined;
    const seriesOrder = [...new Set((data as SimpleData[]).map((datum) => String(datum[navColor])))];
    if (seriesOrder.length === 0) return undefined;
    const secondarySeries = seriesOrder[seriesOrder.length - 1];
    const labels: Record<string, string> = {};
    for (const series of seriesOrder) {
      const axisTitle = series === secondarySeries ? secondaryTitle : primaryTitle;
      if (axisTitle) labels[series] = axisTitle;
    }
    return Object.keys(labels).length > 0 ? labels : undefined;
  }, [
    data,
    navColor,
    navFields?.color,
    navFields?.dualMetricAxis,
    navFields?.lineType,
    navFields?.opacity,
    navFields?.trellis,
    navFields?.type,
    navOrientation,
    sanitizedChildren,
  ]);

  const hasChartInspect = useMemo(
    () =>
      sanitizeMarkChildren((navChild?.props as { children?: unknown } | undefined)?.children).some(
        (child) => 'displayName' in child.type && child.type.displayName === ChartInspect.displayName
      ),
    [navChild]
  );

  // Fires the focused mark's own onClick on Enter/Space, the same as a real click (which runs onClick
  // alongside opening any popover). Stable identity so toggling the popover doesn't rebuild the navigator.
  const markOnClickDetails = useMarkOnClickDetails(sanitizedChildren);
  const onNavNodeClick = useCallback(
    (datum: Datum) => {
      markOnClickDetails.find((detail) => detail.markName === markName)?.onClick?.(datum);
    },
    [markOnClickDetails, markName]
  );
  // Whether the nav mark has a ChartPopover — a click that focuses a node will also open it, so the
  // navigator must retain focus through the popover (see suppressNextLeave in the adapter).
  const navMarkHasPopover = useMemo(() => popovers.some((popover) => popover.name === markName), [popovers, markName]);

  // Bottom (x) axis region: makes the axis labels keyboard-navigable, one level above chart content.
  const xAxisChild = sanitizedChildren.find(
    (child) =>
      'displayName' in child.type &&
      child.type.displayName === Axis.displayName &&
      (child.props as { position?: string }).position === 'bottom'
  );
  // Memoized: Navigator's effect depends on this object by reference, and RscChart re-renders on
  // every popover open/close (isPopoverOpen), which would otherwise tear down and rebuild the whole
  // navigator mid-interaction, discarding its in-progress keyboard-focus state.
  // Only for vertical bars: the bottom axis carries the categorical dimension. A horizontal bar's
  // categorical axis is the left axis, so its bottom-axis region would not be the dimension one.
  const xAxis: AxisRegionOptions | undefined = useMemo(
    () =>
      xAxisChild && navFields?.dimension && navOrientation === 'vertical'
        ? { field: navFields.dimension, type: 'categorical', title: (xAxisChild.props as { title?: string }).title }
        : undefined,
    [xAxisChild, navFields?.dimension, navOrientation]
  );

  const getView = useCallback(() => chartView.current ?? undefined, [chartView]);

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
            colorOverride={navColorOverride}
            locale={locale == null ? undefined : String(locale)}
            metric={navFields?.metric}
            order={navFields?.order}
            orientation={navOrientation}
            fieldLabels={fieldLabels}
            metricTitleBySeries={navMetricTitleBySeries}
            hasChartInspect={hasChartInspect}
            markName={markName}
            title={title}
            xAxis={xAxis}
            containerRef={navContainerRef}
            chartId={chartId}
            getView={getView}
            selectedData={selectedData}
            selectedDataBounds={selectedDataBounds}
            selectedDataName={selectedDataName}
            keyboardPopoverComponentName={keyboardPopoverComponentName}
            onNodeClick={onNavNodeClick}
            hasChartPopover={navMarkHasPopover}
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
  const { children, onOpenChange, containerPadding, contentMargin, rightClick, UNSAFE_highlightBy: _highlightBy, ...sizingProps } = chartPopoverProps;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
      setIsPopoverOpen(open);

      if (chartView.current) {
        if (open) {
          if (closeFrame.current !== null) {
            cancelAnimationFrame(closeFrame.current);
            closeFrame.current = null;
          }
          setRenderDatum(selectedData.current);
          if (keyboardPopoverComponentName.current === name) {
            // The popover owns the selected item's outline while open.
            chartView.current.signal(FOCUSED_ITEM, null);
            chartView.current.signal(FOCUSED_DIMENSION, null);
            chartView.current.signal(FOCUSED_REGION, null);
          }
        } else {
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
        }
        if (open) {
          setSelectedSignals({ idKey, selectedData: selectedData.current, view: chartView.current });
          chartView.current.run();
        }
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
          <div data-testid="rsc-popover-content" className="rsc-popover-content" style={{ margin: contentMargin ?? 12 }}>
            {renderDatum && renderDatum[COMPONENT_NAME] === name && children?.(renderDatum, close)}
          </div>
        </div>
      </Popover>
    </>
  );
};

const toPx = (value: number | 'auto'): string | number => (typeof value === 'number' ? `${value}px` : value);
