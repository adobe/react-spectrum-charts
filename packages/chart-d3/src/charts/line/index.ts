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
import { LineOptions } from '../../types.js';
import { ChartType } from '../chartType.js';
import { linesPart } from './facets.js';
import { decorateRows, interactionPart } from './interactive.js';
import { getLineNavigation } from './navigation.js';
import { LinePart, composeParts } from './parts.js';
import { getDimensionScaleType, getHighlightedGroup, getHoverTarget, isInteractive, withMetricAxis } from './utils.js';

/** The line's parts; later parts' hit targets win. */
const LINE_PARTS: LinePart[] = [linesPart, interactionPart];

export const lineChartType: ChartType<LineOptions> = {
  markType: 'line',
  dimensionScaleType: getDimensionScaleType,
  dimensionField: (mark) => mark.dimension ?? 'datetime',
  metricFields: (mark) => [mark.metric ?? 'value'],
  isInteractive,
  highlightedGroup: getHighlightedGroup,
  build: (mark, index, chart) => {
    const ctx = withMetricAxis(mark, chart);
    const name = mark.name ?? `line${index}`;
    decorateRows(mark, name, ctx);
    return composeParts(LINE_PARTS, { mark, name, ctx });
  },
  hoverTargets: (mark, ctx) =>
    new Map(ctx.data.seriesIds.map((id) => [id, getHoverTarget(mark, id, withMetricAxis(mark, ctx))])),
  navigation: (mark, index, ctx) => getLineNavigation(mark, index, withMetricAxis(mark, ctx)),
};
