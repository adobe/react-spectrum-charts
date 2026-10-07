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
import { ChartPopover, Legend } from '../../../components/index.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { RevenueStory, TrafficStory, controls } from './legendStoryTemplates.js';

export default {
  title: 'React Spectrum Charts 2/Legend/Features',
  component: Legend,
  argTypes: {
    align: { control: 'inline-radio', options: ['start', 'middle', 'end'] },
    position: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] },
  },
};

const Basic = bindWithProps(TrafficStory);
Basic.args = {};
Object.assign(Basic, controls());

const Position = bindWithProps(TrafficStory);
Position.args = { position: 'right' };
Object.assign(Position, controls('position'));

const Align = bindWithProps(TrafficStory);
Align.args = { align: 'start' };
Object.assign(Align, controls('align'));

// Only the `region` facet is listed; line type still distinguishes this year from last year.
const Keys = bindWithProps(RevenueStory);
Keys.args = { keys: ['region'] };
Object.assign(Keys, controls('keys'));

// Right-click a legend entry to open the popover.
const Popover = bindWithProps(TrafficStory);
Popover.args = {
  highlight: true,
  children: (
    <ChartPopover rightClick width="auto">
      {(datum) => (
        <div>
          <strong>{String(datum.value)}</strong>
          <div>View source report</div>
        </div>
      )}
    </ChartPopover>
  ),
};
Object.assign(Popover, controls());

export { Basic, Position, Align, Keys, Popover };
