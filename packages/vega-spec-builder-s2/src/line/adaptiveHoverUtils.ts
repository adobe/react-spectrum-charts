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
import * as vega from 'vega';
import type { Scene, SceneGroup, SceneItem } from 'vega';

import { SERIES_ID } from '@spectrum-charts/core-s2/constants';

import type { Datum } from '../types/index.js';

let context: CanvasRenderingContext2D | null | undefined;
const paths = new WeakMap<Scene, { svg: string; path: Path2D }>();

function getPath(scene: Scene): Path2D {
  // Vega exposes its renderer registry at runtime, but omits it from its typings.
  const registry: unknown = Reflect.get(vega, 'Marks');
  const line: unknown = registry && typeof registry === 'object' ? Reflect.get(registry, 'line') : undefined;
  const attr: unknown = line && typeof line === 'object' ? Reflect.get(line, 'attr') : undefined;
  if (typeof attr !== 'function') throw new Error('Adaptive Line hover requires the Vega line renderer.');
  let svg = '';
  attr((name: string, value: string) => {
    if (name === 'd') svg = value;
  }, scene.items[0]);
  const cached = paths.get(scene);
  if (cached?.svg === svg) return cached.path;
  const path = new Path2D(svg);
  paths.set(scene, { svg, path });
  return path;
}

const getLineScenes = (group: SceneGroup, name: string): Scene[] => {
  const root = group.items.find((scene) => scene.name === `${name}_group`);
  const scenes = root?.items.flatMap((facet) => facet.items) ?? [];
  return scenes.filter((scene) => scene.name === name && scene.marktype === 'line' && scene.items.length > 0);
};

const getNearestEligiblePoint = (
  scene: Scene,
  x: number,
  eligible: Map<unknown, Datum>,
  idKey: string,
  primarySeries?: string[] | null
): SceneItem | undefined => {
  const points = scene.items.filter(
    (point) =>
      point.datum &&
      eligible.has(Reflect.get(point.datum, idKey)) &&
      (!primarySeries || primarySeries.includes(Reflect.get(point.datum, SERIES_ID)))
  );
  let nearest: SceneItem | undefined;
  let distance = Number.POSITIVE_INFINITY;
  for (const point of points) {
    const dx = Math.abs(point.x - x);
    if (dx < distance) {
      nearest = point;
      distance = dx;
    }
  }
  return nearest;
};

/** Picks against the rendered curve, retaining nearest-date background hover. */
export function getAdaptiveLineHover(
  group: SceneGroup,
  x: number,
  y: number,
  name: string,
  eligibleData: Datum[],
  idKey: string,
  primarySeries?: string[] | null
): Datum | null {
  if (x < 0 || y < 0 || x > group.width || y > group.height) return null;
  if (context === undefined) context = document.createElement('canvas').getContext('2d');
  if (!context || typeof Path2D !== 'function') {
    throw new Error('Adaptive Line hover requires a Canvas 2D context and Path2D.');
  }
  const eligible = new Map(eligibleData.map((datum) => [datum[idKey], datum]));
  let nearest: SceneItem | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;
  let hit: SceneItem | undefined;
  for (const scene of getLineScenes(group, name)) {
    const candidate = getNearestEligiblePoint(scene, x, eligible, idKey, primarySeries);
    if (!candidate) continue;
    const distance = Math.abs(candidate.x - x);
    if (distance < nearestDistance) {
      nearest = candidate;
      nearestDistance = distance;
    }
    context.lineWidth = 8;
    context.lineCap = 'round';
    if (context.isPointInStroke(getPath(scene), x, y)) hit = candidate;
  }
  const point = hit ?? nearest;
  const datum = point?.datum ? eligible.get(Reflect.get(point.datum, idKey)) : undefined;
  return datum && point
    ? { ...datum, rscHoverTarget: hit ? 'item' : 'dimension', rscHoverPoint: { x: point.x, y: point.y } }
    : null;
}
