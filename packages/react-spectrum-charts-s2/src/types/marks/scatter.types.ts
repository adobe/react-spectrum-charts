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

import { ScatterOptions } from '@spectrum-charts/vega-spec-builder-s2';

import { ChartPopoverElement, ChartInspectElement } from '../dialogs/index.js';
import { Children, ContextMenuCallback, MarkCallback } from '../util.types.js';
import { ScatterAnnotationElement } from './supplemental/scatterAnnotation.types.js';
import { ScatterPathElement } from './supplemental/scatterPath.types.js';
import { ScatterSizeLegendElement } from './supplemental/scatterSizeLegend.types.js';
import { TrendlineElement } from './supplemental/trendline.types.js';

type ScatterChildElement =
  | ChartPopoverElement
  | ChartInspectElement
  | ScatterAnnotationElement
  | ScatterPathElement
  | ScatterSizeLegendElement
  | TrendlineElement;

export interface ScatterProps
  extends Omit<
    ScatterOptions,
    | 'chartPopovers'
    | 'chartInspects'
    | 'hasOnClick'
    | 'hasOnContextMenu'
    | 'markType'
    | 'scatterAnnotations'
    | 'scatterPaths'
    | 'scatterSizeLegends'
    | 'trendlines'
  > {
  children?: Children<ScatterChildElement>;
  /** Called with the row's data when a point is clicked. */
  onClick?: MarkCallback;
  /** Called with the event and the row's data when a point is right-clicked. Use it to show a custom context menu. */
  onContextMenu?: ContextMenuCallback;
}

export type ScatterElement = ReactElement<ScatterProps, JSXElementConstructor<ScatterProps>>;
