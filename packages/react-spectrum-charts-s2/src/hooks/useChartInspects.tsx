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

import { ChartInspect } from '../components/ChartInspect';
import { ChartChildElement, ChartInspectElement, ChartInspectProps, InspectHandler } from '../types';
import { getAllElements } from '../utils';

type MappedInspect = { name: string; element: ChartInspectElement };

const ChartContainer = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};
ChartContainer.displayName = 'ChartContainer';

export type InspectDetail = {
  name: string;
  callback: InspectHandler;
  highlightBy: ChartInspectProps['highlightBy'];
  targets: ChartInspectProps['targets'];
  width?: number;
};

export default function useChartInspects(children: ChartChildElement[]): InspectDetail[] {
  const inspectElements = useMemo(() => {
    const container = createElement(ChartContainer, undefined, children);
    return getAllElements(container, ChartInspect, []) as MappedInspect[];
  }, [children]);

  return useMemo(
    () =>
      inspectElements
        .filter((inspect) => inspect.element.props.children)
        .map((inspect) => ({
          name: inspect.name,
          callback: inspect.element.props.children,
          highlightBy: inspect.element.props.highlightBy,
          targets: inspect.element.props.targets,
        })) as InspectDetail[],
    [inspectElements]
  );
}
