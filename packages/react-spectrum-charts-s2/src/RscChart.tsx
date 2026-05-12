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
import { FC, PointerEvent, RefObject, Ref, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ActionButton, Dialog, DialogTrigger, View as SpectrumView } from '@adobe/react-spectrum';
import { View as VegaView } from 'vega';
import { COMPONENT_NAME, DEFAULT_SYMBOL_SHAPES, DEFAULT_SYMBOL_SIZES } from '@spectrum-charts/constants';
import { ChartHandle, Datum, SymbolSize, getChartConfig } from '@spectrum-charts/vega-spec-builder-s2';

import './Chart.css';
import { VegaChart } from './VegaChart';
import { useChartContext } from './context/RscChartContext';
import useActionBars, { ActionBarDetail } from './hooks/useActionBars';
import useChartImperativeHandle from './hooks/useChartImperativeHandle';
import { useChartInteractions } from './hooks/useChartInteractions';
import usePopovers, { PopoverDetail } from './hooks/usePopovers';
import useSpec from './hooks/useSpec';
import useSpecProps from './hooks/useSpecProps';
import { RscChartProps } from './types';
import { clearHoverSignals, sanitizeRscChartChildren, setSelectedSignals } from './utils';

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
    title,
    UNSAFE_vegaSpec,
  });

  useSpecProps(spec);

  const { signals, targetStyle, tooltipOptions, onNewView } = useChartInteractions(props, sanitizedChildren);
  const chartConfig = useMemo(() => getChartConfig(config, colorScheme), [config, colorScheme]);
  const specSignalNames = useMemo(() => new Set(spec.signals?.map((s) => s.name) ?? []), [spec.signals]);

  useEffect(() => {
    const tooltipElement = document.getElementById('vg-tooltip-element');
    if (tooltipElement) {
    // Hide tooltips on all charts when a popover is open
    tooltipElement.hidden = isPopoverOpen;
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

  return (
    <>
      <div
        id={`${chartId}-popover-anchor`}
        data-testid="rsc-popover-anchor"
        ref={popoverAnchorRef}
        style={targetStyle}
      />
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
        tooltip={tooltipOptions} // legend show/hide relies on this
        onNewView={handleNewView}
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
  const { chartView, selectedData, selectedDataName } = useChartContext();
  const [renderDatum, setRenderDatum] = useState<Datum | null>(null);
  const { chartPopoverProps, name } = popover;
  const { children, onOpenChange, containerPadding, contentMargin, rightClick, ...dialogProps } = chartPopoverProps;
  const minWidth = dialogProps.minWidth ?? 0;

  return (
    <DialogTrigger
      type="popover"
      mobileType="tray"
      targetRef={targetElement as RefObject<HTMLElement>}
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
