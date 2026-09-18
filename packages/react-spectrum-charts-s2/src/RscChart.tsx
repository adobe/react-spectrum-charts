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
import {
  CSSProperties,
  FC,
  PointerEvent,
  Ref,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ActionButton, Popover, Tooltip, TooltipTrigger } from '@react-spectrum/s2';
import { Focusable } from 'react-aria-components';
import { View as VegaView } from 'vega';
import { COMPONENT_NAME, DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_METRIC, DEFAULT_SYMBOL_SHAPES, DEFAULT_SYMBOL_SIZES } from '@spectrum-charts/constants';
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
import useActionBars, { ActionBarDetail } from './hooks/useActionBars';
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

interface ChartActionBarDialogProps {
  actionBar: ActionBarDetail;
  idKey: string;
  setIsPopoverOpen: (isOpen: boolean) => void;
  specSignalNames: ReadonlySet<string>;
  targetElement: RefObject<HTMLElement | null>;
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
  const actionBars = useActionBars(sanitizedChildren);
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
    | { dimension?: string; metric?: string; color?: unknown; order?: string; name?: string; orientation?: Orientation }
    | undefined;
  const navColor = typeof navFields?.color === 'string' ? navFields.color : undefined;
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
            metric={navFields?.metric}
            order={navFields?.order}
            orientation={navOrientation}
            fieldLabels={fieldLabels}
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

const ChartActionBarDialog: FC<ChartActionBarDialogProps> = ({
  actionBar,
  idKey,
  setIsPopoverOpen,
  specSignalNames,
  targetElement,
}) => {
  const { chartView, selectedData, selectedDataName } = useChartContext();
  const [isOpen, setIsOpen] = useState(false);
  const [renderDatum, setRenderDatum] = useState<Datum | null>(null);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; startLeft: number; startTop: number } | null>(null);
  const { chartActionBarProps, name } = actionBar;
  const { children, isEmphasized, maxActions: maxActionsProp, onClearSelection } = chartActionBarProps;
  const MAX_ACTIONS = maxActionsProp ?? 4;
  const [visibleCount, setVisibleCount] = useState(MAX_ACTIONS);

  const closeActionBar = useCallback(() => {
    setIsOpen(false);
    setOverflowOpen(false);
    setIsPopoverOpen(false);
    onClearSelection?.();
    if (chartView.current) {
      const componentName = selectedDataName.current;
      selectedData.current = null;
      selectedDataName.current = '';
      if (componentName) {
        clearHoverSignals(chartView.current, componentName, specSignalNames);
      }
      setSelectedSignals({ idKey, selectedData: null, view: chartView.current });
      chartView.current.run();
    }
  }, [chartView, idKey, onClearSelection, selectedData, selectedDataName, setIsPopoverOpen, specSignalNames]);

  const allActions = renderDatum && renderDatum[COMPONENT_NAME] === name
    ? (children?.(renderDatum, closeActionBar) ?? [])
    : [];
  const visibleActions = allActions.slice(0, visibleCount);
  const overflowActions = allActions.slice(visibleCount);

  // Position the bar above the anchor point before the browser paints.
  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current || !targetElement.current) return;
    const anchorRect = targetElement.current.getBoundingClientRect();
    const barHeight = containerRef.current.offsetHeight;
    containerRef.current.style.left = `${anchorRect.left}px`;
    containerRef.current.style.top = `${anchorRect.top - barHeight - 8}px`;
  }, [isOpen, targetElement]);

  // Space-based overflow: reduce visible count when bar content exceeds its max-inline-size.
  // Runs after each render until the bar no longer overflows or visibleCount hits 1.
  useLayoutEffect(() => {
    if (!containerRef.current || visibleCount <= 1) return;
    if (containerRef.current.scrollWidth > containerRef.current.clientWidth) {
      setVisibleCount((v) => v - 1);
    }
  }, [visibleCount, renderDatum]);

  // Re-evaluate on window resize (more aggressive on smaller viewports).
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => setVisibleCount(MAX_ACTIONS);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, MAX_ACTIONS]);

  // Reset overflow state when bar opens at a new point.
  useEffect(() => {
    setVisibleCount(MAX_ACTIONS);
    setOverflowOpen(false);
  }, [renderDatum, MAX_ACTIONS]);

  // Close when clicking outside the bar (overflow panel is inside containerRef so it's excluded).
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeActionBar();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeActionBar]);

  const handleDragStart = useCallback((e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      dragStartRef.current = { pointerX: e.clientX, pointerY: e.clientY, startLeft: rect.left, startTop: rect.top };
    }
  }, []);

  // Mutate DOM directly during drag to avoid React re-render lag.
  const handleDragMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || !containerRef.current) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    containerRef.current.style.left = `${dragStartRef.current.startLeft + dx}px`;
    containerRef.current.style.top = `${dragStartRef.current.startTop + dy}px`;
  }, []);

  const handleDragEnd = useCallback(() => {
    dragStartRef.current = null;
  }, []);

  return (
    <>
      <button
        id={`${name}-actionbar-button`}
        style={{ display: 'none' }}
        onClick={() => {
          setRenderDatum(selectedData.current);
          setIsOpen(true);
          setIsPopoverOpen(true);
        }}
      />
      {isOpen && (
        <div
          ref={containerRef}
          role="dialog"
          aria-label="Action bar"
          data-testid="rsc-action-bar"
          className={`rsc-popover rsc-action-bar${isEmphasized ? ' rsc-action-bar--emphasized' : ''}`}
          style={{ position: 'fixed', zIndex: 10000 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px', whiteSpace: 'nowrap' }}>
            <div
              className="rsc-action-bar-drag-handle"
              data-testid="rsc-action-bar-drag-handle"
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
            />
            {visibleActions}
            {overflowActions.length > 0 && (
              <div style={{ position: 'relative' }}>
                <ActionButton
                  isQuiet
                  aria-label="More actions"
                  onPress={() => setOverflowOpen((o) => !o)}
                >
                  ···
                </ActionButton>
                {overflowOpen && (
                  <div className="rsc-popover rsc-action-bar-overflow" data-testid="rsc-action-bar-overflow">
                    {overflowActions}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const ChartDialog = ({ popover, setIsPopoverOpen, targetElement, idKey, specSignalNames }: ChartDialogProps) => {
  const { chartView, selectedData, selectedDataName, keyboardPopoverComponentName } = useChartContext();
  const [renderDatum, setRenderDatum] = useState<Datum | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { chartPopoverProps, name } = popover;
  const { children, onOpenChange, containerPadding, contentMargin, rightClick, UNSAFE_highlightBy: _highlightBy, ...sizingProps } = chartPopoverProps;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
      setIsPopoverOpen(open);

      if (chartView.current) {
        if (open) {
          setRenderDatum(selectedData.current);
        } else {
          const componentName = selectedDataName.current;
          const keyboardComponentName = keyboardPopoverComponentName.current;
          keyboardPopoverComponentName.current = null;
          selectedData.current = null;
          selectedDataName.current = '';
          if (shouldClearHoverSignalsOnClose(componentName, keyboardComponentName)) {
            clearHoverSignals(chartView.current, componentName, specSignalNames);
          }
        }
        setSelectedSignals({ idKey, selectedData: selectedData.current, view: chartView.current });
        chartView.current.run();
      }
    },
    [
      chartView,
      keyboardPopoverComponentName,
      idKey,
      onOpenChange,
      selectedData,
      selectedDataName,
      setIsPopoverOpen,
      specSignalNames,
    ]
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
