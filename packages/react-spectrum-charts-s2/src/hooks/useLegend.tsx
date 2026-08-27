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
import { createElement, useMemo } from 'react';

import { LegendDescription } from '@spectrum-charts/vega-spec-builder-s2';

import { Legend } from '../components/Legend';
import { ChartChildElement, LegendElement } from '../types';
import { getElement } from '../utils';

const ChartContainer = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};
ChartContainer.displayName = 'ChartContainer';

export type UseLegendProps = {
  descriptions?: LegendDescription[];
  isToggleable?: boolean;
  defaultHiddenSeries?: string[];
  onClick?: (seriesName: string) => void;
  onMouseOut?: (seriesName: string) => void;
  onMouseOver?: (seriesName: string) => void;
};

export default function useLegend(children: ChartChildElement[]): UseLegendProps {
  const legend = useMemo(() => {
    return getElement(createElement(ChartContainer, undefined, children), Legend);
  }, [children]) as LegendElement;

  // Memoized on the legend element's identity (not recreated unless `children` changes) so
  // consumers that key their own memoization on this return value (e.g. useChartInteractions's
  // interactionConfig) don't see a new object — and therefore an unwanted VegaChart recreate —
  // on every unrelated re-render.
  return useMemo(() => {
    if (!legend) return {};
    const { defaultHiddenSeries, descriptions, isToggleable, onClick, onMouseOut, onMouseOver } = legend.props;
    return { defaultHiddenSeries, descriptions, isToggleable, onClick, onMouseOut, onMouseOver };
  }, [legend]);
}
