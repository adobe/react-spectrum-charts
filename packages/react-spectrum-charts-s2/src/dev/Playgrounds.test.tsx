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
import { ComponentType } from 'react';

import { findChart, render } from '../test-utils';
import '../test-utils/__mocks__/matchMedia.mock.js';
import { Playground as AreaPlayground } from './Area/Playground/AreaPlayground.story';
import { Playground as AxisPlayground } from './Axis/Playground/AxisPlayground.story';
import { Playground as BarPlayground } from './Bar/Playground/BarPlayground.story';
import { Playground as BulletPlayground } from './Bullet/Playground/BulletPlayground.story';
import { Playground as ComboPlayground } from './Combo/Playground/ComboPlayground.story';
import { Playground as DonutPlayground } from './Donut/Playground/DonutPlayground.story';
import { Playground as LegendPlayground } from './Legend/Playground/LegendPlayground.story';
import { Playground as LinePlayground } from './Line/Playground/LinePlayground.story';
import { Playground as ScatterPlayground } from './Scatter/Playground/ScatterPlayground.story';

const playgrounds = {
  AreaPlayground,
  AxisPlayground,
  BarPlayground,
  BulletPlayground,
  ComboPlayground,
  DonutPlayground,
  LegendPlayground,
  LinePlayground,
  ScatterPlayground,
};

describe('Playgrounds', () => {
  test.each(Object.entries(playgrounds))('%s renders with its default args', async (_, Playground) => {
    // Each playground has its own args type, so render them through a common component type.
    const Story = Playground as ComponentType<object>;
    render(<Story {...Playground.args} />);
    expect(await findChart()).toBeInTheDocument();
  });
});
