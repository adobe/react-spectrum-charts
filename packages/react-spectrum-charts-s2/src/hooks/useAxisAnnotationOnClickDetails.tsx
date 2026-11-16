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
import { AxisElement, AxisProps, ChartChildElement } from '../types/index.js';
import { getAllElements } from '../utils/index.js';
import { ChartContainer } from './ChartContainer.js';

export interface AxisAnnotationOnClickDetail {
  markName: string;
  annotationName: string;
  onClick: NonNullable<AxisProps['onAnnotationClick']>;
}

export default function useAxisAnnotationOnClickDetails(children: ChartChildElement[]): AxisAnnotationOnClickDetail[] {
  return useMemo(() => {
    const axes = getAllElements(createElement(ChartContainer, undefined, children), Axis, []) as {
      name: string;
      element: AxisElement;
    }[];
    return axes.flatMap(({ name, element }) => {
      const onClick = element.props.onAnnotationClick;
      if (!onClick) return [];
      return (element.props.axisAnnotations ?? []).map((annotation, index) => {
        const annotationName = annotation.name ?? `${name}Annotation${index}`;
        return { annotationName, markName: `${annotationName}_icon`, onClick };
      });
    });
  }, [children]);
}
