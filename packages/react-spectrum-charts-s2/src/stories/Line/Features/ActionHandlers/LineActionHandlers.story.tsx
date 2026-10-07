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

import { Line } from '../../../../components/index.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { setControls } from '../../lineStoryUtils.js';
import { VisitsStory, visitsProps } from '../lineStoryTemplates.js';

export default {
  title: 'React Spectrum Charts 2/Line/Features/Action Handlers',
  component: Line,
};

const OnClick = bindWithProps(VisitsStory);
OnClick.args = { ...visitsProps, onClick: action('onClick') };
setControls(OnClick, []);

const OnContextMenu = bindWithProps(VisitsStory);
OnContextMenu.args = { ...visitsProps, onContextMenu: action('onContextMenu') };
setControls(OnContextMenu, []);

export { OnClick, OnContextMenu };
