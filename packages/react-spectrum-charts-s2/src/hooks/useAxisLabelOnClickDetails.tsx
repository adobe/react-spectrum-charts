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

import { Axis, AxisElement, Chart, ChartChildElement } from '../index';
import { AxisLabelOnClickDetail } from '../vegaChartController/interactionConfig';
import { getAllElements } from '../utils';

type MappedAxisElement = { name: string; element: AxisElement };

export default function useAxisLabelOnClickDetails(children: ChartChildElement[]): AxisLabelOnClickDetail[] {
  const axisElements = useMemo(() => {
    return getAllElements(createElement(Chart, { data: [] }, children), Axis, []) as MappedAxisElement[];
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
