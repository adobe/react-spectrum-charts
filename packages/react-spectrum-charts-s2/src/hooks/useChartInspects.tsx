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

import { DEFAULT_COLOR, DEFAULT_METRIC } from '@spectrum-charts/constants';

import { DonutDialogContentOptions } from '../components/ChartDialogContent';
import { ChartInspect } from '../components/ChartInspect';
import { Donut } from '../pre-alpha';
import { ChartChildElement, ChartInspectElement, ChartInspectProps, DonutElement, InspectHandler } from '../types';
import { getAllElements, getAllMarkElements } from '../utils';

type MappedInspect = { name: string; element: ChartInspectElement; parent?: string };
type MappedDonut = { name: string; element: DonutElement };

const ChartContainer = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};
ChartContainer.displayName = 'ChartContainer';

export type InspectDetail = {
  name: string;
  callback?: InspectHandler;
  defaultDonutContent?: DonutDialogContentOptions;
  highlightBy: ChartInspectProps['highlightBy'];
  targets: ChartInspectProps['targets'];
  width?: number;
};

export default function useChartInspects(children: ChartChildElement[]): InspectDetail[] {
  const { donutElements, inspectElements } = useMemo(() => {
    const container = createElement(ChartContainer, undefined, children);
    return {
      donutElements: getAllMarkElements(container, Donut, []) as MappedDonut[],
      inspectElements: getAllElements(container, ChartInspect, []) as MappedInspect[],
    };
  }, [children]);

  return useMemo(
    () =>
      inspectElements
        .filter((inspect) => inspect.element.props.children || inspect.parent === Donut.displayName)
        .map((inspect) => {
          const donut = donutElements.find(({ name }) => name === inspect.name);
          return {
            name: inspect.name,
            callback: inspect.element.props.children,
            defaultDonutContent: donut
              ? {
                  colorKey: donut.element.props.color ?? DEFAULT_COLOR,
                  metricKey: donut.element.props.metric ?? DEFAULT_METRIC,
                }
              : undefined,
            highlightBy: inspect.element.props.highlightBy,
            targets: inspect.element.props.targets,
          };
        }) as InspectDetail[],
    [donutElements, inspectElements]
  );
}
