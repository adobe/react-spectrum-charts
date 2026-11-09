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
import { View, expressionFunction, parse } from 'vega';

import { ANIMATION_TIMER, DRAW_IN_GROW_DURATION_MS, DRAW_IN_START, TABLE } from '@spectrum-charts/core-s2/constants';

import { buildSpec } from '../chartSpecBuilder.js';
import { getExpressionFunctions } from '../expressionFunctions/index.js';
import { BarOptions, ChartOptions } from '../types/index.js';

interface SceneNode {
  name?: string;
  items?: SceneNode[];
  opacity?: number;
  y?: number;
  y2?: number;
}

const getMarkItems = (chart: View, name: string): SceneNode[] => {
  const scene: SceneNode & { root?: SceneNode } = chart.scenegraph();
  if (!scene.root) throw new Error('Expected scenegraph root');
  const nodes: SceneNode[] = [scene.root];
  const items: SceneNode[] = [];
  for (const node of nodes) {
    if (node.name === name) items.push(...(node.items ?? []));
    else nodes.push(...(node.items ?? []));
  }
  return items;
};

const data = ['a', 'b', 'c'].flatMap((category) =>
  ['A', 'B', 'C'].map((series, index) => ({ category, series, value: index + 1 }))
);

describe('bar draw-in animations', () => {
  let view: View | undefined;

  beforeEach(() => {
    Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', (width: number) => width);
  });

  afterEach(() => {
    view?.finalize();
    view = undefined;
  });

  test.each(['stacked', 'dodged'] as const)(
    'hides outlined %s bars while they have zero length so their strokes do not paint lines',
    async (type) => {
      const bar: BarOptions = {
        markType: 'bar',
        dimension: 'category',
        color: 'series',
        lineType: 'series',
        lineWidth: 2,
        type,
      };
      const options: ChartOptions = { data, animationTypes: ['drawIn'], marks: [bar] };
      const spec = buildSpec(options);
      const table = spec.data?.find(({ name }) => name === TABLE);
      if (!table || !('values' in table)) throw new Error('Expected inline table data');
      table.values = data;
      view = new View(parse(spec), { renderer: 'none' }).width(400).height(300);
      await view.runAsync();
      await view.signal(ANIMATION_TIMER, 1000).runAsync();
      const start = view.signal(DRAW_IN_START);
      for (const elapsed of [0, DRAW_IN_GROW_DURATION_MS / 4, DRAW_IN_GROW_DURATION_MS / 2, DRAW_IN_GROW_DURATION_MS]) {
        await view.signal(ANIMATION_TIMER, start + elapsed).runAsync();
        const items = getMarkItems(view, 'bar0');
        expect(items).toHaveLength(data.length);
        items.forEach(({ opacity, y, y2 }) => {
          if (y === y2) expect(opacity).toBe(0);
        });
        if (elapsed === DRAW_IN_GROW_DURATION_MS) items.forEach(({ opacity }) => expect(opacity).toBe(1));
      }
    }
  );
});
