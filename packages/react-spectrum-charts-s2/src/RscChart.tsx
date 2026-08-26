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
import {
  COMPONENT_NAME,
  DEFAULT_BAR_ORIENTATION,
  DEFAULT_BAR_TYPE,
  DEFAULT_CATEGORICAL_DIMENSION,
  DEFAULT_LINE_SCALE_TYPE,
  DEFAULT_METRIC,
  DEFAULT_SYMBOL_SHAPES,
  DEFAULT_SYMBOL_SIZES,
  DEFAULT_TIME_DIMENSION,
} from '@spectrum-charts/constants';
import { toCamelCase } from '@spectrum-charts/utils';
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
import useChartInspects from './hooks/useChartInspects';
import { useChartInteractions } from './hooks/useChartInteractions';
import useMarkOnClickDetails from './hooks/useMarkOnClickDetails';
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
  const markOnClickDetails = useMarkOnClickDetails(sanitizedChildren);
  const inspects = useChartInspects(sanitizedChildren);

  // Bumped once the Vega view actually exists, so Navigator's effect re-runs even if it first mounted before the async vega-embed() call resolved.
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
  // navFields?.name is often undefined (Bar/Line's own name defaults never run on a render-null component), so this replicates the spec builder's own naming instead.
  const navResolvedName = useMemo(() => {
    if (!navChartType || !navChild) return undefined;
    const sameTypeSiblings = sanitizedChildren.filter(
      (child) => 'displayName' in child.type && getNavigableChartType(child.type.displayName) === navChartType
    );
    const navIndex = sameTypeSiblings.indexOf(navChild);
    return toCamelCase(navFields?.name || `${navChartType}${navIndex}`);
  }, [navChartType, navChild, sanitizedChildren, navFields?.name]);
  // Bar/Line's own prop defaults are destructuring defaults on render-null components React never calls here, so they must be reapplied explicitly rather than left to fall through as undefined.
  const navGeometryFields: FocusedItemFields = useMemo(
    () => ({
      dimension: navFields?.dimension ?? (navChartType === 'bar' ? DEFAULT_CATEGORICAL_DIMENSION : DEFAULT_TIME_DIMENSION),
      metric: navFields?.metric ?? DEFAULT_METRIC,
      scaleType: navChartType === 'line' ? navFields?.scaleType ?? DEFAULT_LINE_SCALE_TYPE : undefined,
      metricAxis: navFields?.metricAxis,
      orientation: navChartType === 'bar' ? navFields?.orientation ?? DEFAULT_BAR_ORIENTATION : undefined,
      type: navChartType === 'bar' ? navFields?.type ?? DEFAULT_BAR_TYPE : undefined,
      color: navChartType === 'bar' ? navColor : undefined,
    }),
    [
      navChartType,
      navFields?.dimension,
      navFields?.metric,
      navFields?.scaleType,
      navFields?.metricAxis,
      navFields?.orientation,
      navFields?.type,
      navColor,
    ]
  );
  // The metric field name (e.g. "downloads") is rarely the display title a user set on its Axis (e.g.
  // "Downloads") — found by matching the Axis child positioned on the metric's side of the chart.
  const navMetricAxisTitle = useMemo(() => {
    const metricAxisPositions =
      navGeometryFields.orientation === 'horizontal' ? ['bottom', 'top'] : ['left', 'right'];
    const metricAxisChild = sanitizedChildren.find(
      (child) =>
        'displayName' in child.type &&
        child.type.displayName === 'Axis' &&
        metricAxisPositions.includes((child.props as { position?: string }).position ?? '')
    );
    return (metricAxisChild?.props as { title?: string } | undefined)?.title;
  }, [sanitizedChildren, navGeometryFields.orientation]);

  const getView = useCallback(() => chartView.current ?? undefined, [chartView]);
  const getPopoverClosedAt = useCallback(() => popoverClosedAt.current, [popoverClosedAt]);
  const navMarkHasPopover = useMemo(
    () => popovers.some((popover) => popover.name === navResolvedName),
    [popovers, navResolvedName]
  );
  const navMarkHasInspect = useMemo(
    () => inspects.some((inspect) => inspect.name === navResolvedName),
    [inspects, navResolvedName]
  );

  // Mirrors real-click behavior (getOnMarkClickCallback/getOnChartMarkClickCallback in markClickUtils.ts):
  // selectAndOpenPopover only runs when the focused mark actually declares a ChartPopover — gated the
  // same way handleMarkClick is gated on markHasPopover — while onClick fires unconditionally, since
  // there's no real DOM click for Vega's own view listener to pick up from a keyboard activation.
  const onNavActivate = useCallback(
    (datum: SimpleData) => {
      const view = chartView.current;
      const markName = navResolvedName;
      if (!view || !markName) return;
      if (navMarkHasPopover) {
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
      }
      markOnClickDetails.find((detail) => detail.markName === markName)?.onClick?.(datum as unknown as Datum);
    },
    [
      chartId,
      navResolvedName,
      navGeometryFields,
      selectedData,
      selectedDataBounds,
      selectedDataName,
      markOnClickDetails,
      navMarkHasPopover,
    ]
  );

  // Mirrors ChartInspect's mouse-hover tooltip via the same vega-tooltip Handler useNewChartView.tsx
  // already invokes manually for the delayed-tooltip case. Gated on navMarkHasInspect — without a
  // ChartInspect, inspectOptions.formatTooltip is never set (useChartInspectInteractions.tsx), so an
  // unconditional Handler.call would fall through to vega-tooltip's own default (a raw all-fields table).
  const onNavLeafFocus = useCallback(
    (datum: SimpleData | undefined) => {
      const view = chartView.current;
      const container = navContainerRef.current;
      const markName = navResolvedName;
      if (!view || !container || !markName || !navMarkHasInspect) return;
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
    [inspectOptions, navResolvedName, navGeometryFields, navMarkHasInspect]
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
            metricLabel={navMetricAxisTitle}
            orientation={navGeometryFields.orientation}
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
            markName={navResolvedName}
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
