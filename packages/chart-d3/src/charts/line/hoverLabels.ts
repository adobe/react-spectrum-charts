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
import {
  DIRECT_LABEL_BACKGROUND_STROKE_WIDTH,
  DIRECT_LABEL_FONT_WEIGHT,
  MARK_ID,
} from '@spectrum-charts/core-s2/constants';

import { toText } from '../../format.js';
import { SceneNode } from '../../scene.js';
import { measureText } from '../../text.js';
import { Datum, LineOptions } from '../../types.js';
import { MarkContext } from '../chartType.js';
import { getAccessors, getColor } from './utils.js';

/** Offset between the hover point center and its label. */
const LABEL_POINT_GAP = 9;

/**
 * Spreads co-located labels apart: rank by metric descending, then
 * push each label below the running max of the higher-ranked labels' adjusted positions.
 * @returns label y per row
 */
export const getCascadeY = (
  rows: Datum[],
  metric: string,
  scaleY: (row: Datum) => number,
  gap: number
): Map<Datum, number> => {
  const values = rows.map((row) => Number(row[metric]));
  const ranks = values.map((value) => 1 + values.filter((other) => other > value).length);
  const adjusted = rows.map((row, i) => scaleY(row) - ranks[i] * gap);
  return new Map(
    rows.map((row, i) => {
      const peers = adjusted.filter((_, j) => ranks[j] <= ranks[i]);
      return [row, Math.max(...peers) + ranks[i] * gap];
    })
  );
};

/** Builds hover value labels next to the highlighted points. */
export const buildHoverLabels = (mark: LineOptions, name: string, rows: Datum[], ctx: MarkContext): SceneNode[] => {
  const { fontSize, labelGap } = ctx.size;
  const metric = mark.metric ?? 'value';
  const labelField = mark.hoverLabelKey ?? metric;
  const acc = getAccessors(mark, ctx);
  const cascade = getCascadeY(rows, metric, acc.y, labelGap);
  const nodes: SceneNode[] = [];
  for (const row of rows) {
    const value = row[labelField];
    const text = toText(value);
    if (!text) continue;
    const x = acc.x(row);
    const width = measureText(text, fontSize, ctx.theme.font, 'bold');
    const nearRight = x + width + LABEL_POINT_GAP > ctx.width;
    nodes.push({
      type: 'text',
      key: `${name}_hoverLabel_${String(row[MARK_ID])}`,
      x: nearRight ? x - LABEL_POINT_GAP : x + LABEL_POINT_GAP,
      y: cascade.get(row) ?? acc.y(row),
      text,
      fill: getColor(mark, row, ctx),
      font: ctx.theme.font,
      fontSize,
      fontWeight: DIRECT_LABEL_FONT_WEIGHT,
      align: nearRight ? 'right' : 'left',
      baseline: 'middle',
      halo: { color: ctx.theme.pointFill, width: DIRECT_LABEL_BACKGROUND_STROKE_WIDTH },
    });
  }
  return nodes;
};
