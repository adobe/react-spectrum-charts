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
import { ChartPopover } from '../components/ChartPopover';
import { Donut } from '../pre-alpha';
import { ChartChildElement, ChartPopoverElement, ChartPopoverProps, DonutElement } from '../types';
import { getAllElements, getAllMarkElements } from '../utils';

type MappedPopover = { name: string; element: ChartPopoverElement; parent?: string };
type MappedDonut = { name: string; element: DonutElement };

const ChartContainer = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};
ChartContainer.displayName = 'ChartContainer';

export type PopoverDetail = {
  chartPopoverProps: ChartPopoverProps;
  defaultDonutContent?: DonutDialogContentOptions;
  key: string;
  name: string;
  UNSAFE_highlightBy: ChartPopoverProps['UNSAFE_highlightBy'];
  parent?: string;
};

export default function usePopovers(children: ChartChildElement[]): PopoverDetail[] {
  const { donutElements, popoverElements } = useMemo(() => {
    const container = createElement(ChartContainer, undefined, children);
    return {
      donutElements: getAllMarkElements(container, Donut, []) as MappedDonut[],
      popoverElements: getAllElements(
        container,
        ChartPopover,
        [],
        undefined,
        'Chart'
      ) as MappedPopover[],
    };
  }, [children]);

  return useMemo(
    () =>
      popoverElements
        .filter((popover) => popover.element.props.children || popover.parent === Donut.displayName)
        .map((popover, index) => {
          const donut = donutElements.find(({ name }) => name === popover.name);
          return {
            chartPopoverProps: popover.element.props,
            defaultDonutContent: donut
              ? {
                  colorKey: donut.element.props.color ?? DEFAULT_COLOR,
                  metricKey: donut.element.props.metric ?? DEFAULT_METRIC,
                }
              : undefined,
            key: `${popover.name}Popover${index}`,
            name: popover.name,
            UNSAFE_highlightBy: popover.element.props.UNSAFE_highlightBy,
            parent: popover.parent,
          };
        }),
    [donutElements, popoverElements]
  );
}
