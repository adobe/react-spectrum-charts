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

import { SegmentLabel } from '../../../pre-alpha';
import { basicDonutData, sliveredDonutData } from '../../../storyShared/Donut/data';
import { bindWithProps } from '../../../test-utils';
import { ResponsiveDonut } from './ResponsiveDonut';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Donut/Regressions/Segment Label',
  component: SegmentLabel,
};

const ResponsiveStory: StoryFn<typeof SegmentLabel> = (args): ReactElement => (
  <ResponsiveDonut data={basicDonutData}>
    <SegmentLabel {...args} />
  </ResponsiveDonut>
);

const AdvancedStory: StoryFn<typeof SegmentLabel> = (args): ReactElement => (
  <ResponsiveDonut data={basicDonutData} initialWidth={500}>
    <SegmentLabel {...args} />
  </ResponsiveDonut>
);

// sliveredDonutData has 15 segments (vs. basicDonutData's 7) - a denser stress test for label
// crowding as the donut shrinks toward the XS/S tiers
const ManySegmentsResponsiveStory: StoryFn<typeof SegmentLabel> = (args): ReactElement => (
  <ResponsiveDonut data={sliveredDonutData}>
    <SegmentLabel {...args} />
  </ResponsiveDonut>
);

const Responsive = bindWithProps(ResponsiveStory);
Responsive.args = { value: true, valueFormat: 'shortNumber' };

const Advanced = bindWithProps(AdvancedStory);
Advanced.args = { percent: true, value: false, swatch: true, showValueRow: true };

const ManySegmentsResponsive = bindWithProps(ManySegmentsResponsiveStory);
ManySegmentsResponsive.args = { value: true, valueFormat: 'shortNumber' };

Responsive.parameters = {
  ...Responsive.parameters,
  regression: {
    description:
      'Segment labels kept the position and font size computed when the mark was created, so they detached from the ring as the donut resized.',
    pr: 894,
  },
};
Advanced.parameters = {
  ...Advanced.parameters,
  regression: {
    description:
      'Left-hemisphere segment labels were left-aligned like right-hemisphere ones instead of right-aligned toward the ring.',
    pr: 914,
  },
};
ManySegmentsResponsive.parameters = {
  ...ManySegmentsResponsive.parameters,
  regression: {
    description:
      'Segment labels on a dense 15-segment donut detached from the ring on resize because their position and font size were never recomputed.',
    pr: 894,
  },
};

export { Responsive, Advanced, ManySegmentsResponsive };
