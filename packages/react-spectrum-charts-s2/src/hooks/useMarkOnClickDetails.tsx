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

import { Bar, BarElement, Chart, ChartChildElement, Line, LineElement, MarkCallback } from '../index';
import { getAllMarkElements } from '../utils';

type MappedMarkElement = { name: string; element: BarElement | LineElement };

export type MarkOnClickDetail = {
  markName?: string;
  onClick?: MarkCallback;
};

export default function useMarkOnClickDetails(children: ChartChildElement[]): MarkOnClickDetail[] {
  const markElements = useMemo(() => {
    return [
      ...getAllMarkElements(createElement(Chart, { data: [] }, children), Bar, []),
      ...getAllMarkElements(createElement(Chart, { data: [] }, children), Line, []),
    ] as MappedMarkElement[];
  }, [children]);

  return useMemo(
    () =>
      markElements
        .filter((mark) => mark.element.props.onClick)
        .map((mark) => ({
          markName: mark.name,
          onClick: mark.element.props.onClick,
        })) as MarkOnClickDetail[],
    [markElements]
  );
}
