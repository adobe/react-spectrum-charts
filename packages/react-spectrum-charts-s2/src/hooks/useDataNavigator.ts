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
import { RefObject, useCallback, useEffect, useMemo, useRef } from 'react';

import { View } from 'vega';

import { ChartData, Datum, NavigableChart, NavigableLegend, SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { useChartContext } from '../context/RscChartContext.js';
import {
  NavigationController,
  NavigationInputs,
  createNavigationController,
} from '../dataNavigator/navigationController.js';
import { ChartChildElement } from '../types/index.js';
import useMarkOnClickDetails from './useMarkOnClickDetails.js';
import { PopoverDetail } from './usePopovers.js';

interface UseDataNavigatorOptions {
  /** Whether keyboard navigation is on (the chart's `accessibleNavigation` prop) */
  enabled: boolean;
  /** Sanitized chart children */
  children: ChartChildElement[];
  data: ChartData[];
  locale?: unknown;
  title?: string;
  popovers: PopoverDetail[];
  chartId: string;
  /** The navigable mark's configuration the spec builder recorded in the spec's usermeta */
  navigation?: NavigableChart;
  /** The navigable legends the spec builder recorded in the spec's usermeta */
  legends?: NavigableLegend[];
}

interface DataNavigator {
  /** Positioned element that wraps the chart; the navigation is rendered into it */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Hands each new Vega view to the navigation */
  onNewView: (view: View) => void;
}

/**
 * Gets the locale code navigation reads color names in from the chart's `locale` prop.
 * @param locale
 * @returns string | undefined
 */
export const getNavigationLocale = (locale: unknown): string | undefined => {
  if (typeof locale === 'string') return locale;
  if (typeof locale !== 'object' || locale === null) return undefined;
  const { number, time } = locale as { number?: unknown; time?: unknown };
  if (typeof number === 'string') return number;
  return typeof time === 'string' ? time : undefined;
};

/**
 * Keeps keyboard navigation for the spec's navigable mark mounted for the current view.
 * @param options
 * @returns DataNavigator
 */
export const useDataNavigator = ({
  enabled,
  children,
  data,
  locale,
  title,
  popovers,
  chartId,
  navigation,
  legends,
}: UseDataNavigatorOptions): DataNavigator => {
  const { selectedData, selectedDataBounds, selectedDataName, keyboardPopoverComponentName } = useChartContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<NavigationController | null>(null);
  const viewRef = useRef<View | undefined>(undefined);
  const inputsRef = useRef<NavigationInputs | undefined>(undefined);
  const markName = navigation?.markName;

  // Enter/Space fires the focused mark's own onClick, as a real click does; read from a ref so it doesn't change the actions.
  const markOnClickDetails = useMarkOnClickDetails(children);
  const onClickRef = useRef<((datum: Datum) => void) | undefined>(undefined);
  useEffect(() => {
    onClickRef.current = markOnClickDetails.find((detail) => detail.markName === markName)?.onClick;
  }, [markOnClickDetails, markName]);
  const onNodeClick = useCallback((datum: Datum) => onClickRef.current?.(datum), []);

  // A click that focuses a node also opens the mark's popover, so the navigator keeps focus through it.
  const hasChartPopover = popovers.some((popover) => popover.name === markName);
  const navLocale = getNavigationLocale(locale);

  const inputs: NavigationInputs | undefined = useMemo(
    () =>
      enabled && navigation
        ? {
            ...navigation,
            xAxis: navigation.xAxis && { ...navigation.xAxis, type: 'categorical' },
            data: data as SimpleData[],
            locale: navLocale,
            title,
            legends,
            selectedData,
            selectedDataBounds,
            selectedDataName,
            keyboardPopoverComponentName,
            onNodeClick,
            hasChartPopover,
          }
        : undefined,
    [
      enabled,
      navigation,
      data,
      navLocale,
      title,
      legends,
      selectedData,
      selectedDataBounds,
      selectedDataName,
      keyboardPopoverComponentName,
      onNodeClick,
      hasChartPopover,
    ]
  );

  useEffect(() => {
    inputsRef.current = inputs;
    controllerRef.current?.update(inputs);
  }, [inputs]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const controller = createNavigationController(container, chartId);
    controller.setView(viewRef.current);
    controller.update(inputsRef.current);
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [chartId]);

  const onNewView = useCallback((view: View) => {
    viewRef.current = view;
    controllerRef.current?.setView(view);
  }, []);

  return { containerRef, onNewView };
};
