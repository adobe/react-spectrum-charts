/*
 * Copyright 2023 Adobe. All rights reserved.
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

import { ChartTooltip } from '../components/ChartTooltip';
import { ChartChildElement, ChartTooltipElement, ChartTooltipProps, TooltipHandler } from '../types';
import { getAllElements } from '../utils';

type MappedTooltip = { name: string; element: ChartTooltipElement };

const ChartContainer = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};
ChartContainer.displayName = 'ChartContainer';

export type TooltipDetail = {
  name: string;
  callback: TooltipHandler;
  highlightBy: ChartTooltipProps['highlightBy'];
  width?: number;
};

export default function useTooltips(children: ChartChildElement[]): TooltipDetail[] {
  const tooltipElements = useMemo(
    () => getAllElements(createElement(ChartContainer, undefined, children), ChartTooltip, []) as MappedTooltip[],
    [children]
  );

  return useMemo(
    () =>
      tooltipElements
        .filter((tooltip) => tooltip.element.props.children)
        .map((tooltip) => ({
          name: tooltip.name,
          callback: tooltip.element.props.children,
          highlightBy: tooltip.element.props.highlightBy,
        })) as TooltipDetail[],
    [tooltipElements]
  );
}
