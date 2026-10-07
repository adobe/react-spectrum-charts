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
import { Chart } from '../../../index';
import { chartEngagementData } from '../../../storyShared/data/data';
import { bindWithProps } from '../../../test-utils';
import { ChartBarInspectStory, ChartLineStory, StoryWithParameters, setControlInclude } from '../chartStoryTemplates';

export default {
  title: 'React Spectrum Charts 2/Chart/Features/Animation',
  component: Chart,
  argTypes: {
    animationTypes: { control: 'check', options: ['hover', 'drawIn'] },
  },
};

// Hover a bar: with animations off the highlight fade snaps instead of easing.
const Animations = bindWithProps(ChartBarInspectStory);
Animations.args = { data: chartEngagementData, animations: false };
setControlInclude(Animations as StoryWithParameters, ['animations']);

const AnimationTypes = bindWithProps(ChartLineStory);
AnimationTypes.args = { data: chartEngagementData, animationTypes: ['hover', 'drawIn'] };
setControlInclude(AnimationTypes as StoryWithParameters, ['animationTypes']);

export { Animations, AnimationTypes };
