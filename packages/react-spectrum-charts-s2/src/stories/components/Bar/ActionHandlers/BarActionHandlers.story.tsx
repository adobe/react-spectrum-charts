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

import { Bar } from '../../../../components/index.js';
import { BarStory, defaultProps } from '../barStoryTemplates.js';
import { bindStory } from '../storyUtils.js';

export default {
  title: 'React Spectrum Charts 2/Bar/Features/Action Handlers',
  component: Bar,
};

const OnClick = bindStory(BarStory);
OnClick.args = { ...defaultProps, onClick: action('onClick') };
OnClick.parameters = { controls: { include: [] } };

const OnContextMenu = bindStory(BarStory);
OnContextMenu.args = { ...defaultProps, onContextMenu: action('onContextMenu') };
OnContextMenu.parameters = { controls: { include: [] } };

const OnMouseOver = bindStory(BarStory);
OnMouseOver.args = { ...defaultProps, onMouseOver: action('onMouseOver'), onMouseOut: action('onMouseOut') };
OnMouseOver.parameters = { controls: { include: [] } };

export { OnClick, OnContextMenu, OnMouseOver };
