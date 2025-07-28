/*
 * Copyright 2025 Adobe. All rights reserved.
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

import { Datum } from '@spectrum-charts/vega-spec-builder';

import { Bar, BarElement, Chart, ChartChildElement } from '../index';
import { getAllMarkElements } from '../utils';

type MappedMarkElement = { name: string; element: BarElement };

export type MarkMouseInputDetail = {
  markName?: string;
  onMouseOver?: (datum: Datum) => void;
  onMouseOut?: (datum: Datum) => void;
};

export default function useMarkMouseInputDetails(children: ChartChildElement[]): MarkMouseInputDetail[] {
  const markElements = useMemo(() => {
    return [...getAllMarkElements(createElement(Chart, { data: [] }, children), Bar, [])] as MappedMarkElement[];
  }, [children]);

  return useMemo(
    () =>
      markElements
        .filter((mark) => {
          const barProps = mark.element.props;
          return barProps.onMouseOver || barProps.onMouseOut;
        })
        .map((mark) => {
          const barProps = mark.element.props;
          return {
            markName: mark.name,
            onMouseOver: barProps.onMouseOver,
            onMouseOut: barProps.onMouseOut,
          };
        }) as MarkMouseInputDetail[],
    [markElements]
  );
}
