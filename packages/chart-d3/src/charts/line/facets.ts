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
  CurveFactory,
  area,
  curveBasis,
  curveCardinal,
  curveCatmullRom,
  curveLinear,
  curveMonotoneX,
  curveNatural,
  curveStep,
  curveStepAfter,
  curveStepBefore,
  line,
} from 'd3-shape';

import { SERIES_ID } from '@spectrum-charts/core-s2/constants';

import { GroupNode, SceneNode, group } from '../../scene.js';
import { Datum, InterpolationType, LineOptions } from '../../types.js';
import { MarkContext } from '../chartType.js';
import { LinePart } from './parts.js';
import {
  getAccessors,
  getColor,
  getDash,
  getFacetOpacity,
  getSeries,
  getSeriesOpacity,
  getStrokeWidth,
  hasFixedMetricAxis,
} from './utils.js';

const CURVES: Record<InterpolationType, CurveFactory> = {
  basis: curveBasis,
  cardinal: curveCardinal,
  'catmull-rom': curveCatmullRom,
  linear: curveLinear,
  monotone: curveMonotoneX,
  natural: curveNatural,
  step: curveStep,
  'step-after': curveStepAfter,
  'step-before': curveStepBefore,
};

const GRADIENT_BASE_OPACITY = 0.2;

/** Whether a popover highlights by dimension; the line then ignores opacity rules. */
const hasDimensionPopover = (mark: LineOptions): boolean =>
  Boolean(mark.chartPopovers?.some(({ UNSAFE_highlightBy }) => UNSAFE_highlightBy === 'dimension'));

/** Builds one scope group per series with its path and optional gradient fill. */
const buildFacetNodes = (mark: LineOptions, name: string, ctx: MarkContext): SceneNode[] => {
  const { data, height } = ctx;
  const acc = getAccessors(mark, ctx);
  const curve = CURVES[mark.interpolate ?? 'linear'];
  const linePath = line<Datum>().x(acc.x).y(acc.y).defined(acc.defined).curve(curve);
  const multiSeries = data.color.domain.length > 1 || data.lineType.domain.length > 1 || data.opacity.domain.length > 1;
  const areaPath = area<Datum>().x(acc.x).y0(height).y1(acc.y).defined(acc.defined).curve(curve);

  return getSeries(data.filteredTable).map((rows) => {
    const first = rows[0];
    const seriesId = String(first[SERIES_ID]);
    const color = getColor(mark, first, ctx);
    const opacity = hasDimensionPopover(mark) ? 1 : getSeriesOpacity(mark, seriesId, ctx);
    const traits = hasDimensionPopover(mark) ? undefined : { emphasis: seriesId };
    const children: SceneNode[] = [];
    if (mark.gradient) {
      children.push({
        type: 'path',
        key: `${name}_gradient_${seriesId}`,
        role: 'area',
        d: areaPath(rows) ?? '',
        fill: {
          gradient: 'linear',
          stops: [
            { offset: 0, color },
            { offset: 1, color: 'transparent' },
          ],
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 1,
        },
        fillOpacity: getFacetOpacity(mark, first, ctx) * GRADIENT_BASE_OPACITY,
        opacity: multiSeries ? 0 : opacity,
        ...(traits && !multiSeries ? { traits } : {}),
      });
    }
    children.push({
      type: 'path',
      key: `${name}_${seriesId}`,
      role: 'line',
      datum: first,
      d: linePath(rows) ?? '',
      stroke: color,
      strokeDash: getDash(mark, first, ctx),
      strokeOpacity: getFacetOpacity(mark, first, ctx),
      strokeCap: mark.lineCap ?? 'round',
      strokeWidth: getStrokeWidth(mark, seriesId, ctx),
      opacity,
      ...(traits ? { traits } : {}),
    });
    return group(`${name}_facet_${seriesId}`, children, { role: 'scope' });
  });
};

/** The line group's clip, the plot with a fixed metric axis, and its draw-in sweep clip. */
const getLineGroupProps = (ctx: MarkContext): Partial<GroupNode> => {
  const fixed = hasFixedMetricAxis(ctx);
  return {
    ...(fixed ? { clip: { x: 0, y: 0, width: ctx.width, height: ctx.height } } : {}),
    traits: { drawInClip: fixed ? { fixedHeight: ctx.height } : {} },
  };
};

/** The line's paths, one scope group per facet. */
export const linesPart: LinePart = {
  name: 'lines',
  build: ({ mark, name, ctx }) => ({
    marks: [group(`${name}_group`, buildFacetNodes(mark, name, ctx), getLineGroupProps(ctx))],
  }),
};
