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
import { RefObject, useCallback, useEffect, useRef } from 'react';

import { View } from 'vega';

import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { NavigableChartType } from './buildChartStructure';
import { AttachDataNavigatorHandle, attachDataNavigator } from './dataNavigatorAdapter';

/** Shadows a value that changes every render into a ref, for reading the latest value from a stable callback. */
const useLiveRef = <T,>(value: T): RefObject<T> => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

export interface NavigatorProps {
  /** The chart type to build navigation for. */
  chartType: NavigableChartType;
  /** The chart data (plain objects). */
  data: SimpleData[];
  /** Primary categorical / x-axis field. */
  dimension?: string;
  /** Series / color field (set for stacked bars). */
  color?: string;
  /** Primary metric / y-axis field. */
  metric?: string;
  /** Whether the dimension field is time-scaled (line charts only; formats dates in accessible labels). */
  isTimeDimension?: boolean;
  /** Optional chart title for the accessible description. */
  title?: string;
  /** Ref to the positioned container that wraps the chart. */
  containerRef: RefObject<HTMLElement | null>;
  /** Stable id used to namespace the rendered nav elements. */
  chartId: string;
  /** Accessor for the live Vega view. */
  getView: () => View | undefined;
  /**
   * Bumped by the caller once the Vega view is actually ready (and again on any later re-embed).
   * attachDataNavigator's click/mouseout listeners need a live view, but this can resolve well
   * after the navigator first attaches — this re-registers just those listeners on the current
   * view rather than rebuilding the whole nav structure, which would lose tracked focus state.
   */
  viewVersion?: number;
  /** Called with the leaf datum when focus lands on one, and with undefined when focus leaves it. */
  onLeafFocus?: (datum: SimpleData | undefined) => void;
  /** Called with the leaf datum when Enter or Space is pressed while it's focused. */
  onActivate?: (datum: SimpleData) => void;
  /** Whether the chart's popover is currently open — used to restore focus once it closes. */
  isPopoverOpen?: boolean;
  /** Reads the timestamp (ms) the popover last closed, or null — expected to be backed by a ref set synchronously by the same call that closes it, not a later effect. */
  getPopoverClosedAt?: () => number | null;
  /** Base name of the navigable mark (e.g. `line0`) — used to clear its hover signals on mouseout. */
  markName?: string;
  /** All signal names present in the spec — guards clearing signals that don't exist for this chart. */
  specSignalNames?: ReadonlySet<string>;
}

export const Navigator = ({
  chartType,
  data,
  dimension,
  color,
  metric,
  isTimeDimension,
  title,
  containerRef,
  chartId,
  getView,
  viewVersion,
  onLeafFocus,
  onActivate,
  isPopoverOpen,
  getPopoverClosedAt,
  markName,
  specSignalNames,
}: NavigatorProps): null => {
  const handleRef = useRef<AttachDataNavigatorHandle | null>(null);

  // Read fresh on every keydown/mouseout via stable getters/callbacks, rather than as dependencies
  // of the attach effect below, so a re-render that changes these — opening/closing the popover,
  // a hover-driven markName/specSignalNames recompute, or the parent recomputing onLeafFocus/
  // onActivate — doesn't tear down and rebuild the whole nav structure (losing tracked focus state).
  const popoverStateRef = useLiveRef({ isPopoverOpen, getPopoverClosedAt });
  const getPopoverInfo = useCallback(
    () => ({
      isOpen: Boolean(popoverStateRef.current.isPopoverOpen),
      closedAt: popoverStateRef.current.getPopoverClosedAt?.() ?? null,
    }),
    [popoverStateRef]
  );

  const hoverClearInfoRef = useLiveRef({ markName, specSignalNames });
  const getHoverClearInfo = useCallback(() => hoverClearInfoRef.current, [hoverClearInfoRef]);

  const onLeafFocusRef = useLiveRef(onLeafFocus);
  const stableOnLeafFocus = useCallback(
    (datum: SimpleData | undefined) => onLeafFocusRef.current?.(datum),
    [onLeafFocusRef]
  );

  const onActivateRef = useLiveRef(onActivate);
  const stableOnActivate = useCallback((datum: SimpleData) => onActivateRef.current?.(datum), [onActivateRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || data.length === 0) {
      return;
    }
    const handle = attachDataNavigator({
      container,
      chartType,
      data,
      dimension,
      color,
      metric,
      isTimeDimension,
      title,
      chartId,
      getView,
      onLeafFocus: stableOnLeafFocus,
      onActivate: stableOnActivate,
      getPopoverInfo,
      getHoverClearInfo,
    });
    handleRef.current = handle;
    return () => {
      handleRef.current = null;
      handle.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getView intentionally excluded, see below
  }, [
    chartType,
    data,
    dimension,
    color,
    metric,
    isTimeDimension,
    title,
    chartId,
    containerRef,
    stableOnLeafFocus,
    stableOnActivate,
    getPopoverInfo,
    getHoverClearInfo,
  ]);

  // getView is intentionally excluded from the structural attach effect above: the Vega view
  // resolves asynchronously, so it can become available well after the navigator (and any
  // in-progress keyboard focus) has already been attached. Tearing down and rebuilding the whole
  // nav structure at that point would reset `current` and silently lose the tracked focus position
  // — instead, once the view is ready, just (re-)register the view-dependent listeners in place.
  useEffect(() => {
    handleRef.current?.attachViewListeners();
  }, [viewVersion, getView]);

  // Kept out of the attach effect's deps above so opening/closing a popover doesn't tear down and
  // rebuild the whole nav structure (losing in-progress focus state) — it only needs to restore
  // focus once the popover closes. React Aria's own FocusScope restores focus via a single rAF
  // scheduled from a useLayoutEffect cleanup (synchronous, during commit) — a single rAF here would
  // just be racing that on the same frame with no guaranteed order. A double rAF instead runs on the
  // frame *after* any single-rAF-deferred work, so this reliably applies last.
  const wasPopoverOpen = useRef(isPopoverOpen);
  useEffect(() => {
    if (wasPopoverOpen.current && !isPopoverOpen) {
      let innerRaf: number | undefined;
      const outerRaf = requestAnimationFrame(() => {
        innerRaf = requestAnimationFrame(() => handleRef.current?.refocusCurrent());
      });
      wasPopoverOpen.current = isPopoverOpen;
      return () => {
        cancelAnimationFrame(outerRaf);
        if (innerRaf !== undefined) cancelAnimationFrame(innerRaf);
      };
    }
    wasPopoverOpen.current = isPopoverOpen;
  }, [isPopoverOpen]);

  return null;
};
Navigator.displayName = 'Navigator';
