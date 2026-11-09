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
import { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { DonutSummary, SegmentLabel } from '../../../../components/index.js';
import { basicDonutData } from '../../../../storyShared/Donut/data.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { ResizableDonut } from './ResizableDonut.js';

export default {
  title: 'React Spectrum Charts 2/Donut/Features/Responsive',
  tags: ['alpha'],
  component: SegmentLabel,
};

const ResponsiveStory: StoryFn<typeof SegmentLabel> = (args): ReactElement => (
  <ResizableDonut
    data={basicDonutData}
    initialWidth={500}
    initialHeight={500}
    summary={<DonutSummary label="Visitors" />}
    segmentLabel={<SegmentLabel {...args} />}
  />
);

const Responsive = bindWithProps(ResponsiveStory);
Responsive.args = { percent: true, value: false, swatch: true, showValueRow: true };
Object.assign(Responsive, {
  parameters: { controls: { include: ['percent', 'value', 'swatch', 'showValueRow', 'showTotal'] } },
});

export { Responsive };
