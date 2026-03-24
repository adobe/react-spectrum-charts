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

import { DEFAULT_CATEGORICAL_DIMENSION } from '@spectrum-charts/constants';

import { Axis, Bar, ChartPopover } from '../components';
import { AxisThumbnail } from '../components/AxisThumbnail';
import { AxisElement, BarElement, ChartChildElement } from '../types';
import {
  getAllMarkElements,
  getComponentName,
  getElementDisplayName,
  sanitizeAxisChildren,
  sanitizeMarkChildren,
} from '../utils';

export interface ThumbnailPopoverConfig {
  /** The names of thumbnail marks that should trigger the popover, e.g. ['axis0AxisThumbnail0'] */
  thumbnailNames: string[];
  /** The dimension field used to find the matching bar item, e.g. 'category' */
  dimensionField: string;
  /** The bar mark name used to trigger the popover, e.g. 'bar0' */
  barMarkName: string;
}

const ChartContainer = ({ children }: { children: React.ReactNode }) => createElement('div', null, children);
ChartContainer.displayName = 'ChartContainer';

/**
 * First Bar in document order that declares a ChartPopover among its mark children.
 * Used to anchor axis-thumbnail clicks to the bar series that owns the popover UI.
 */
function findFirstBarWithChartPopover(children: ChartChildElement[]) {
  const barElements = getAllMarkElements(createElement(ChartContainer, undefined, children), Bar);
  return barElements.find(({ element }) => {
    const markChildren = sanitizeMarkChildren((element as BarElement).props.children);
    return markChildren.some((child) => getElementDisplayName(child) === ChartPopover.displayName);
  });
}

/**
 * Finds the first bar mark with a ChartPopover child and collects all AxisThumbnail
 * names on axes with hasPopover=true, returning a config that links them together.
 */
export default function useAxisThumbnailPopover(children: ChartChildElement[]): ThumbnailPopoverConfig[] {
  return useMemo(() => {
    const barWithPopover = findFirstBarWithChartPopover(children);

    if (!barWithPopover) return [];

    const barMarkName = barWithPopover.name;
    const barElement = barWithPopover.element as BarElement;
    const dimensionField = barElement.props.dimension ?? DEFAULT_CATEGORICAL_DIMENSION;

    const thumbnailNames: string[] = [];
    let axisCount = -1;

    for (const child of children) {
      if (getElementDisplayName(child) !== Axis.displayName) continue;
      axisCount++;
      const axisElement = child as AxisElement;
      if (!axisElement.props.hasPopover) continue;
      const axisName = getComponentName(axisElement, `axis${axisCount}`);

      const axisChildren = sanitizeAxisChildren(axisElement.props.children);
      let thumbnailIndex = 0;
      for (const axisChild of axisChildren) {
        if (getElementDisplayName(axisChild) === AxisThumbnail.displayName) {
          thumbnailNames.push(`${axisName}AxisThumbnail${thumbnailIndex}`);
          thumbnailIndex++;
        }
      }
    }

    if (thumbnailNames.length === 0) return [];

    return [{ thumbnailNames, dimensionField, barMarkName }];
  }, [children]);
}
