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
import { JSXElementConstructor, ReactElement } from 'react';

import { LineOptions } from '@spectrum-charts/vega-spec-builder-s2';

import { ChartPopoverElement, ChartInspectElement } from '../dialogs';
import { LineForecastElement } from './supplemental/lineForecast.types';
import { LineDirectLabelElement } from './supplemental/lineDirectLabel.types';
import { LinePointAnnotationElement } from './supplemental/linePointAnnotation.types';
import { Children, ContextMenuCallback, MarkCallback } from '../util.types';

/**
 * Controls which interaction marks can trigger `onContextMenu`.
 * Acts as a filter on top of whatever marks `interactionMode` generates.
 * - `'interaction'` (default) — fires on all marks the current `interactionMode` generates
 * - `'dimension'` — only fires from dimension strips; not applicable in S2 (no dimension interaction mode)
 * - `'item'` — only fires from individual hover points
 */
export type ContextMenuMode = 'interaction' | 'dimension' | 'item';

type LineChildElement = ChartPopoverElement | ChartInspectElement | LineForecastElement | LineDirectLabelElement | LinePointAnnotationElement;
export interface LineProps
  extends Omit<
    LineOptions,
    'chartPopovers' | 'chartInspects' | 'forecasts' | 'hasOnClick' | 'hasOnContextMenu' | 'lineDirectLabels' | 'linePointAnnotations' | 'markType'
  > {
  children?: Children<LineChildElement>;
  /** Callback that will be run when a point/section is clicked */
  onClick?: MarkCallback;
  /**
   * Callback that will be run when a point/section is right-clicked. Use to show a custom context menu.
   * Use `contextMenuMode` to control which marks can trigger it.
   */
  onContextMenu?: ContextMenuCallback;
  /**
   * Controls which marks can trigger `onContextMenu`.
   * @default 'interaction'
   */
  contextMenuMode?: ContextMenuMode;
}

export type LineElement = ReactElement<LineProps, JSXElementConstructor<LineProps>>;
