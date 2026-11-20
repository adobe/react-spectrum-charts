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

import { DonutOptions } from '@spectrum-charts/vega-spec-builder-s2';

import { ChartInspectElement, ChartPopoverElement } from '../dialogs/index.js';
import { Children, ContextMenuCallback, MarkCallback } from '../util.types.js';
import { DonutSummaryElement, SegmentLabelElement } from './supplemental/index.js';

export interface DonutProps
  extends Omit<
    DonutOptions,
    | 'chartPopovers'
    | 'chartInspects'
    | 'donutSummaries'
    | 'hasOnClick'
    | 'hasOnContextMenu'
    | 'hasOnMouseInput'
    | 'markType'
    | 'segmentLabels'
  > {
  children?: Children<ChartPopoverElement | ChartInspectElement | DonutSummaryElement | SegmentLabelElement>;
  /** Called with the segment's data when an arc or segment label is clicked. */
  onClick?: MarkCallback;
  /** Called with the segment's data when entering an arc or segment label. */
  onMouseOver?: MarkCallback;
  /** Called with the segment's data when leaving an arc or segment label. */
  onMouseOut?: MarkCallback;
  /** Called with the native event and segment data when an arc or segment label is right-clicked. */
  onContextMenu?: ContextMenuCallback;
}

export type DonutElement = ReactElement<DonutProps, JSXElementConstructor<DonutProps>>;
