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

import { Bar } from '../components/Bar/index.js';
import { Line } from '../components/Line/index.js';
import { BarElement, ChartChildElement, LineElement, MarkCallback } from '../types/index.js';
import { ContextMenuMode } from '../types/marks/line.types.js';
import { ContextMenuCallback } from '../types/util.types.js';
import { getAllMarkElements } from '../utils/index.js';
import { ChartContainer } from './ChartContainer.js';

type MappedMarkElement = { name: string; element: BarElement | LineElement };

export type MarkOnClickDetail = {
  markName?: string;
  onClick?: MarkCallback;
  onContextMenu?: ContextMenuCallback;
  contextMenuMode?: ContextMenuMode;
};

export default function useMarkOnClickDetails(children: ChartChildElement[]): MarkOnClickDetail[] {
  const markElements = useMemo(() => {
    return [
      ...getAllMarkElements(createElement(ChartContainer, undefined, children), Bar, []),
      ...getAllMarkElements(createElement(ChartContainer, undefined, children), Line, []),
    ] as MappedMarkElement[];
  }, [children]);

  return useMemo(
    () =>
      markElements
        .filter((mark) => mark.element.props.onClick || mark.element.props.onContextMenu)
        .map((mark) => ({
          markName: mark.name,
          onClick: mark.element.props.onClick,
          onContextMenu: mark.element.props.onContextMenu,
          contextMenuMode: 'contextMenuMode' in mark.element.props ? mark.element.props.contextMenuMode : undefined,
        })) as MarkOnClickDetail[],
    [markElements]
  );
}
