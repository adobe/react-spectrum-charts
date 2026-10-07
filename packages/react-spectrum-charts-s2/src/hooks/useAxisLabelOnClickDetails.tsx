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

import { Axis } from '../components/Axis/index.js';
import { AxisElement, ChartChildElement } from '../types/index.js';
import { AxisLabelClickCallback } from '../types/util.types.js';
import { getAllElements } from '../utils/index.js';
import { ChartContainer } from './ChartContainer.js';

type MappedAxisElement = { name: string; element: AxisElement };

export type AxisLabelOnClickDetail = {
  markName?: string;
  onClick?: AxisLabelClickCallback;
};

export default function useAxisLabelOnClickDetails(children: ChartChildElement[]): AxisLabelOnClickDetail[] {
  const axisElements = useMemo(() => {
    return getAllElements(createElement(ChartContainer, undefined, children), Axis, []) as MappedAxisElement[];
  }, [children]);

  return useMemo(
    () =>
      axisElements
        .filter((axis) => axis.element.props.onClick)
        .map((axis) => ({
          markName: axis.name,
          onClick: axis.element.props.onClick,
        })),
    [axisElements]
  );
}
