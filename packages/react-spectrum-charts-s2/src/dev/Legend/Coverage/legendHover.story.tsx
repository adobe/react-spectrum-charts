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
import { action } from 'storybook/actions';

import { Legend } from '../../../components';
import { bindWithProps } from '../../../test-utils';
import { LegendBarStory, defaultProps } from './LegendStoryUtils';

export default {
  title: 'React Spectrum Charts 2/Legend/Coverage/Hover',
  component: Legend,
};

const ControlledHover = bindWithProps(LegendBarStory);
ControlledHover.args = {
  highlight: true,
  onMouseOver: action('legend mouse over'),
  onMouseOut: action('legend mouse out'),
  ...defaultProps,
};
ControlledHover.storyName = 'Hover (controlled)';
Object.assign(ControlledHover, { parameters: { controls: { include: ['highlight', 'onMouseOver', 'onMouseOut'] } } });

export { ControlledHover };
