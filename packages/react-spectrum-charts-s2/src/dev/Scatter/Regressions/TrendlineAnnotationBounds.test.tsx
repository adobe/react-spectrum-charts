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
import { View } from 'vega';

import { act, findChart, render } from '../../../test-utils/index.js';
import { UnplacedLabel } from './TrendlineAnnotationBounds.story.js';

type SceneItem = { opacity: number; bounds: { y1: number }; items?: SceneMark[] };
type SceneMark = { name?: string; items: SceneItem[] };

test('a label that cannot be placed stays inside the plot, so the layout is stable', async () => {
  let view: View | undefined;
  render(<UnplacedLabel {...UnplacedLabel.args} animations={false} onVegaViewReady={(v) => (view = v)} />);
  await findChart();

  const getLabels = async () => {
    await act(async () => {
      await view?.runAsync();
    });
    const { root } = view?.scenegraph() as unknown as { root: SceneMark };
    const group = root.items[0].items?.find(({ name }) => name === 'scatter0Trendline0Annotation0_group');
    const labels = group?.items[0].items?.find(({ name }) => name === 'scatter0Trendline0Annotation0');
    return (labels?.items ?? []).map(({ opacity, bounds }) => ({ opacity, bounds }));
  };

  const first = await getLabels();
  expect(first.some(({ opacity }) => opacity === 0)).toBe(true);
  expect(first.every(({ bounds }) => bounds.y1 >= 0)).toBe(true);
  expect(await getLabels()).toEqual(first);
});
