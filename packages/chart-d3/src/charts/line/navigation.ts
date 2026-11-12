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
import { MARK_ID, NAVIGATION_ID_SEPARATOR, SERIES_ID } from '@spectrum-charts/core-s2/constants';

import { NavigationPoint, NavigationSeries } from '../../navigation.js';
import { unionBounds } from '../../text.js';
import { LineOptions } from '../../types.js';
import { MarkContext } from '../chartType.js';
import { getAccessors, getSeries } from './utils.js';

/**
 * Gets a line's navigable series and points, in plot coordinates.
 * @param mark
 * @param index
 * @param ctx
 * @returns navigation series
 */
export const getLineNavigation = (mark: LineOptions, index: number, ctx: MarkContext): NavigationSeries[] => {
  const markName = mark.name ?? `line${index}`;
  const acc = getAccessors(mark, ctx);
  const r = Math.sqrt(mark.pointSize ?? ctx.size.pointSize) / 2;
  const result: NavigationSeries[] = [];
  for (const rows of getSeries(ctx.data.filteredTable)) {
    const seriesId = String(rows[0][SERIES_ID]);
    const points: NavigationPoint[] = [];
    for (const row of rows) {
      if (!acc.defined(row)) continue;
      const x = acc.x(row);
      const y = acc.y(row);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const pointBounds = { x1: x - r, y1: y - r, x2: x + r, y2: y + r };
      points.push({
        id: [markName, String(row[MARK_ID])].join(NAVIGATION_ID_SEPARATOR),
        datum: row,
        x,
        y,
        bounds: pointBounds,
      });
    }
    if (!points.length) continue;
    result.push({
      id: [markName, seriesId].join(NAVIGATION_ID_SEPARATOR),
      markName,
      seriesId,
      datum: rows[0],
      bounds: unionBounds(...points.map((p) => p.bounds)),
      points,
    });
  }
  return result;
};
