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

import { Legend } from '../../../../components/index.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { TrafficStory, controls } from '../legendStoryTemplates.js';

export default {
  title: 'React Spectrum Charts 2/Legend/Features/Action Handlers',
  component: Legend,
};

const OnClick = bindWithProps(TrafficStory);
OnClick.args = { onClick: action('onClick') };
Object.assign(OnClick, controls());

const OnMouseOver = bindWithProps(TrafficStory);
OnMouseOver.args = { onMouseOver: action('onMouseOver') };
Object.assign(OnMouseOver, controls());

const OnMouseOut = bindWithProps(TrafficStory);
OnMouseOut.args = { onMouseOut: action('onMouseOut') };
Object.assign(OnMouseOut, controls());

export { OnClick, OnMouseOver, OnMouseOut };
